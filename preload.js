const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('keysmash', {
  triggerHardware: (keyCode) => ipcRenderer.send('key-pressed', keyCode),
  getConfig: () => ipcRenderer.invoke('get-config'),
  getMusicFiles: () => ipcRenderer.invoke('get-music-files'),
  onMusicCommand: (callback) => ipcRenderer.on('music-command', (_e, cmd) => callback(cmd)),
});
