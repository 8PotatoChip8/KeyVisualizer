import { app, ipcMain } from 'electron';
import { createOverlayWindow } from './overlayWindow';
import { startKeyListener, stopKeyListener } from './keyListener';
import { createTray, destroyTray } from './trayManager';
import { getConfig, setConfig } from './store';
import { setEditMode } from './overlayWindow';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

app.whenReady().then(() => {
  // Register IPC handlers
  ipcMain.handle('get-config', () => getConfig());
  ipcMain.handle('set-config', (_event, config) => setConfig(config));
  ipcMain.on('set-edit-mode', (_event, enabled: boolean) => setEditMode(enabled));

  const win = createOverlayWindow();
  startKeyListener(win);
  createTray();
});

app.on('window-all-closed', () => {
  stopKeyListener();
  destroyTray();
  app.quit();
});
