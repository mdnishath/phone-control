const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // devices
  listDevices: () => ipcRenderer.invoke('devices:list'),
  control: (ip, title, quality, os) => ipcRenderer.invoke('device:control', ip, title, quality, os),
  ping: (ip) => ipcRenderer.invoke('device:ping', ip),
  // setup / dependencies
  setupCheck: () => ipcRenderer.invoke('setup:check'),
  install: (which) => ipcRenderer.invoke('setup:install', which),
  // tailscale account
  accountLogin: () => ipcRenderer.invoke('account:login'),
  accountSwitchNew: () => ipcRenderer.invoke('account:switchNew'),
  accountSwitchTo: (a) => ipcRenderer.invoke('account:switchTo', a),
  accountLogout: () => ipcRenderer.invoke('account:logout'),
  accountUp: () => ipcRenderer.invoke('account:up')
});
