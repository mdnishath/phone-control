const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TS = 'C:\\Program Files\\Tailscale\\tailscale.exe';

// ---------- adb / scrcpy khoja (bundled vendor > winget install > PATH) ----------
function findScrcpyDir() {
  // 1) app-er sathe bundled (true 0-dependency / portable)
  const vendor = path.join(__dirname, 'vendor', 'scrcpy');
  if (fs.existsSync(path.join(vendor, 'scrcpy.exe'))) return vendor;
  // 2) winget install location
  const base = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
  const stack = [base];
  let guard = 0;
  while (stack.length && guard < 8000) {
    guard++;
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isFile() && e.name.toLowerCase() === 'scrcpy.exe') return dir;
      if (e.isDirectory() && (e.name.toLowerCase().includes('scrcpy') || dir === base)) stack.push(full);
    }
  }
  return null;
}
function paths() {
  const dir = findScrcpyDir();
  return {
    dir,
    adb: dir ? path.join(dir, 'adb.exe') : 'adb',
    scrcpy: dir ? path.join(dir, 'scrcpy.exe') : null
  };
}

// ---------- helpers ----------
function run(cmd, args, timeout = 8000) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, maxBuffer: 1024 * 1024 * 16, windowsHide: true }, (err, stdout, stderr) => {
      resolve({ err, out: (stdout || '').toString(), errOut: (stderr || '').toString() });
    });
  });
}

// Onno PC-te alada adb (Android Studio / emulator / phone-manager) default port 5037-e
// conflict kore -> server "war" -> cmd window flash + scrcpy connection kete jay.
// Tai amader app SHUDHU nijer isolated port e adb server chalay (kono conflict nai).
const ADB_PORT = '5556';
const ADB_SOCK = 'tcp:127.0.0.1:5556';
// env: scrcpy ei socket diye amader isolated server-e connect korবে (ADB_SERVER_SOCKET).
function adbEnv(adb) { return { ...process.env, ADB: adb, ADB_SERVER_SOCKET: ADB_SOCK }; }
// -P <port>: amader adb command isolated server e chalay (env dic diye server START hoy na, -P diye hoy).
function runAdb(adb, args, timeout = 8000) {
  return new Promise((resolve) => {
    execFile(adb, ['-P', ADB_PORT, ...args], { timeout, maxBuffer: 1 << 20, windowsHide: true, env: adbEnv(adb) },
      (err, so, se) => resolve({ err, out: (so || '') + (se || '') }));
  });
}

async function tsStatus() {
  if (!fs.existsSync(TS)) return null;
  const { out } = await run(TS, ['status', '--json'], 8000);
  try { return JSON.parse(out); } catch { return null; }
}

// adb connect + model / android / battery (online android only)
async function enrich(ip, adb) {
  const target = `${ip}:5555`;
  await runAdb(adb, ['connect', target], 6000);
  const model = (await runAdb(adb, ['-s', target, 'shell', 'getprop', 'ro.product.model'], 6000)).out.trim();
  const rel = (await runAdb(adb, ['-s', target, 'shell', 'getprop', 'ro.build.version.release'], 6000)).out.trim();
  const batt = (await runAdb(adb, ['-s', target, 'shell', 'dumpsys', 'battery'], 5000)).out;
  const m = batt.match(/level:\s*(\d+)/);
  return { model, android: rel, battery: m ? m[1] : '', reachable: !!model };
}

function peerToDevice(p) {
  const ip = (p.TailscaleIPs && p.TailscaleIPs.find(x => x.includes('.'))) || (p.TailscaleIPs && p.TailscaleIPs[0]) || '';
  const direct = !!(p.CurAddr && p.CurAddr.length);
  return {
    ip, host: p.HostName || p.DNSName || ip, os: p.OS || '',
    online: !!p.Online,
    conn: p.Online ? (direct ? 'direct' : 'relay') : 'offline',
    relay: p.Relay || '', curAddr: p.CurAddr || '', lastSeen: p.LastSeen || '',
    model: '', android: '', battery: '', reachable: false
  };
}

function qualityArgs(mode) {
  if (mode === 'high') return ['--max-size=1280', '--video-bit-rate=6M', '--max-fps=60'];
  return ['--max-size=800', '--video-bit-rate=1M', '--max-fps=24', '--video-codec=h265'];
}
async function autoMode(ip) {
  const { out } = await run(TS, ['ping', '-c', '4', ip], 12000);
  const line = out.split('\n').filter(l => l.includes('pong from')).pop() || '';
  const relay = line.includes('via DERP') || !line.includes('via ');
  return relay ? 'low' : 'high';
}

// ================= IPC: DEVICES =================
ipcMain.handle('devices:list', async () => {
  if (!fs.existsSync(TS)) return { ok: false, error: 'Tailscale install nai. Setup panel theke install koro.', devices: [] };
  const st = await tsStatus();
  if (!st) return { ok: false, error: 'Tailscale off/login nai. Setup panel dekho.', devices: [] };
  const { adb } = paths();
  const peers = st.Peer ? Object.values(st.Peer) : [];
  let devices = peers.map(peerToDevice).filter(d => d.ip);
  devices.sort((a, b) => (b.online - a.online) || ((a.os === 'android' ? 0 : 1) - (b.os === 'android' ? 0 : 1)));
  await Promise.all(devices.map(async d => {
    if (d.online && d.os === 'android') { try { Object.assign(d, await enrich(d.ip, adb)); } catch {} }
  }));
  return { ok: true, devices };
});

ipcMain.handle('device:control', async (_e, ip, title, quality, os) => {
  // Windows / laptop -> Remote Desktop (RDP over Tailscale, built-in mstsc, 0 dependency)
  if (os && os !== 'android') {
    try {
      const c = spawn('mstsc', ['/v:' + ip], { detached: true, stdio: 'ignore' });
      c.unref();
      return { ok: true, mode: 'rdp' };
    } catch (e) { return { ok: false, error: 'Remote Desktop khola gelo na: ' + e }; }
  }
  // Android -> scrcpy
  const { dir, adb, scrcpy } = paths();
  if (!scrcpy) return { ok: false, error: 'scrcpy install nai. Setup panel theke install koro.' };
  const target = `${ip}:5555`;

  // scrcpy + adb ke amader ISOLATED adb server (port 5556) e badhi -> system-er onno
  // adb-r sathe conflict nai -> cmd flash + connection-kill bondho.
  const env = adbEnv(adb); // scrcpy ei env (ADB_SERVER_SOCKET) diye already-running 5556 server e dhukbে

  // amader isolated server ta age hidden vabে chalu kori (scrcpy jate notun console na khole)
  await runAdb(adb, ['start-server'], 8000);
  await runAdb(adb, ['connect', target], 8000);
  // device readyness check (unauthorized / offline handle)
  const dl = (await runAdb(adb, ['devices'], 6000)).out;
  const row = dl.split('\n').find(l => l.startsWith(target)) || '';
  if (!row.includes('\tdevice') && !/\bdevice\b/.test(row.replace(target, ''))) {
    if (row.includes('unauthorized'))
      return { ok: false, error: 'Phone-e "Allow USB debugging" popup ta OK koro (ei PC prothombar connect korche). Tarpor abar Control.' };
    return { ok: false, error: 'Phone reachable na (' + target + '). Check: Tailscale ON same account? tcpip 5555 phone-e enable? Wi-Fi te?' };
  }

  let mode = quality;
  if (!mode || mode === 'auto') mode = await autoMode(ip);
  const args = ['-s', target, `--window-title=${title || ip}`, ...qualityArgs(mode),
    '--stay-awake', '--turn-screen-off', '--power-off-on-close'];

  // scrcpy output ke log file-e likhi jate crash hole asol error dekhা jay
  let logFd = 'ignore';
  const logPath = path.join(app.getPath('userData'), 'scrcpy-last.log');
  try { logFd = fs.openSync(logPath, 'w'); } catch {}
  let child;
  try {
    child = spawn(scrcpy, args, { detached: true, windowsHide: true, cwd: dir, env, stdio: ['ignore', logFd, logFd] });
  } catch (e) { return { ok: false, error: 'scrcpy start fail: ' + e }; }

  // 3.5s-er moddhe crash korle asol error UI te pathai
  const exitCode = await new Promise(res => {
    let done = false;
    child.on('error', () => { if (!done) { done = true; res('spawn-error'); } });
    child.on('exit', c => { if (!done) { done = true; res(c); } });
    setTimeout(() => { if (!done) { done = true; res('alive'); } }, 3500);
  });
  if (exitCode !== 'alive') {
    let log = '';
    try { log = fs.readFileSync(logPath, 'utf8'); } catch {}
    const tail = log.split('\n').map(s => s.trim()).filter(Boolean).slice(-4).join('  |  ');
    return { ok: false, error: 'scrcpy bondho holo. ' + (tail || ('exit ' + exitCode)) };
  }
  child.unref();
  return { ok: true, mode };
});

ipcMain.handle('device:ping', async (_e, ip) => {
  const { out } = await run(TS, ['ping', '-c', '3', ip], 12000);
  const line = out.split('\n').filter(l => l.includes('pong from')).pop() || '';
  const direct = line.includes('via ') && !line.includes('via DERP');
  const latM = line.match(/in ([\d.]+)\s*(m?s)/);
  const ms = latM ? (latM[2] === 'ms' ? parseFloat(latM[1]) : parseFloat(latM[1]) * 1000) : null;
  return { ok: !!line, direct, ms, raw: line.trim() };
});

// ================= IPC: SETUP / ACCOUNT =================
ipcMain.handle('setup:check', async () => {
  const tailscale = fs.existsSync(TS);
  const { scrcpy } = paths();
  let account = '', backend = 'NotInstalled', accounts = [];
  if (tailscale) {
    const st = await tsStatus();
    if (st) {
      backend = st.BackendState || 'Unknown';
      try { account = st.User[st.Self.UserID].LoginName; } catch {}
    } else backend = 'Stopped';
    const sw = await run(TS, ['switch', '--list'], 6000);
    accounts = sw.out.split('\n').map(l => l.trim()).filter(l => l && !l.toLowerCase().startsWith('id'));
  }
  return { tailscale, scrcpy: !!scrcpy, account, backend, accounts };
});

ipcMain.handle('setup:install', async (_e, which) => {
  const id = which === 'tailscale' ? 'Tailscale.Tailscale' : 'Genymobile.scrcpy';
  const { err, out, errOut } = await run('winget',
    ['install', '--id', id, '--source', 'winget', '--accept-package-agreements', '--accept-source-agreements', '--silent'],
    300000);
  return { ok: !err, out: out + errOut };
});

// notun account e login (browser khulbe — jekono account select kora jay, switch-o kore)
ipcMain.handle('account:login', async () => {
  if (!fs.existsSync(TS)) return { ok: false, error: 'Tailscale nai' };
  try { const c = spawn(TS, ['login'], { detached: true, stdio: 'ignore' }); c.unref(); return { ok: true }; }
  catch (e) { return { ok: false, error: String(e) }; }
});
// force notun account (age logout kore fresh login)
ipcMain.handle('account:switchNew', async () => {
  await run(TS, ['logout'], 15000);
  try { const c = spawn(TS, ['up', '--force-reauth'], { detached: true, stdio: 'ignore' }); c.unref(); return { ok: true }; }
  catch (e) { return { ok: false, error: String(e) }; }
});
// already-logged-in account-gula-r moddhe switch
ipcMain.handle('account:switchTo', async (_e, acct) => {
  const { err, out, errOut } = await run(TS, ['switch', acct], 20000);
  return { ok: !err, out: out + errOut };
});
ipcMain.handle('account:logout', async () => { await run(TS, ['logout'], 15000); return { ok: true }; });
ipcMain.handle('account:up', async () => {
  try { const c = spawn(TS, ['up'], { detached: true, stdio: 'ignore' }); c.unref(); return { ok: true }; }
  catch (e) { return { ok: false, error: String(e) }; }
});

// ================= window =================
function createWindow() {
  const win = new BrowserWindow({
    width: 1120, height: 800, backgroundColor: '#0f1117',
    title: 'Phone Control Dashboard',
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
