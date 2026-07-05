# 📱 Phone Control

A sleek Electron dashboard to remote-control your **Android phones** (via [scrcpy](https://github.com/Genymobile/scrcpy)) and **Windows PCs** (via Remote Desktop) from anywhere in the world, over a private [Tailscale](https://tailscale.com) network.

Built to run a fleet of phones located in one country from a PC in another — no port-forwarding, no public IPs, no cloud middle-man.

---

## ✨ Features

- **One dashboard, all devices** — every phone/PC on your Tailscale network shows up as a card with model, IP, battery, and live connection status.
- **Click to control** — Android → launches scrcpy; Windows → launches Remote Desktop (RDP).
- **Adaptive quality** — auto-detects the link and picks the right scrcpy settings:
  - **Wi-Fi (direct P2P)** → HD, 60fps
  - **Mobile data (relay)** → low-res, low-bandwidth so it stays usable
- **Direct vs Relay badge** — instantly see which devices are fast (green) or slow (amber).
- **Built-in Setup panel** — installs Tailscale + scrcpy via `winget`, and switches Tailscale accounts, all from the UI. Zero manual dependency hunting.
- **Manual refresh** — fetches only when you ask, so it never spams your phones with connections.
- **Premium, glassmorphic UI** — dark theme, gradient accents, smooth animations.

---

## 🚀 Quick start

### Option A — Download the app (easiest)
Grab the latest **[Release](../../releases)**:
- `PhoneControl-portable-*.exe` — run directly, no install.
- `PhoneControl-Setup-*.exe` — installer with Start-menu/desktop shortcut.

On first launch, open **⚙️ Setup** and install Tailscale + scrcpy if they're missing, then log into your Tailscale account.

### Option B — Run from source
```bash
git clone https://github.com/mdnishath/phone-control
cd phone-control/dashboard
npm install
npm start          # run the app
npm run dist       # build portable + installer into dist/
```

---

## 📋 Requirements

- **Windows 10/11** (controller PC)
- **[Tailscale](https://tailscale.com)** on the controller **and** every device — all on the **same account**
- **[scrcpy](https://github.com/Genymobile/scrcpy)** (bundles `adb`) — for Android control
- Windows **Remote Desktop enabled** on the target PC — for PC control *(Windows Home has no RDP server; use RustDesk/AnyDesk instead)*

The Setup panel can install Tailscale + scrcpy for you.

---

## 📶 Setting up a phone (one time each)

1. **Developer options** → enable **USB debugging**.
2. Install **Tailscale**, sign in with the **same account**, allow the VPN.
3. Plug the phone in by USB once and run `Enable-Wireless-USB.bat` (`adb tcpip 5555`), then unplug.
4. Keep the phone on **Wi-Fi** (not mobile data) for a fast, direct connection.

The phone now appears in the dashboard automatically. Full walkthrough: **[SETUP-FRANCE.md](SETUP-FRANCE.md)**.

> ⚡ **Golden rule:** Wi-Fi = direct P2P = fast. Mobile data (CGNAT) = relay = slow. Physical distance still sets a floor (~150 ms across continents), but a direct link is roughly 2× better than a relayed one.

> 🔁 `adb tcpip 5555` is lost on reboot. Keep phones powered on ("Stay awake"), or root + a "WiFi ADB" app to re-enable it on boot.

Have another PC set up your phones for you? Hand its Claude Code the ready-made prompt in **[CLAUDE-PROMPT-France-PC.md](CLAUDE-PROMPT-France-PC.md)**.

---

## 🗂️ Repo layout

```
dashboard/            Electron app (main.js, preload.js, index.html)
Connect-Phone.ps1     Connects one phone + launches scrcpy (adaptive quality)
Generate-Bats.bat     Makes a per-phone Open-<name>.bat from phones.csv
Launch-All.bat        Connects every phone in phones.csv at once
Enable-Wireless-USB.bat  One-time: puts a USB-connected phone in tcpip mode
phones.csv            Your device list (Name,TailscaleIP)
SETUP-FRANCE.md       Full per-phone setup guide
```

The `.bat`/`.ps1` scripts are a CLI alternative to the dashboard — same engine, no Electron needed.

---

## ⚠️ Note

Use this only on devices you own or are authorized to manage.

## License

[MIT](LICENSE)
