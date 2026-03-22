import { app, ipcMain } from 'electron';
import { createOverlayWindow } from './overlayWindow';
import { startKeyListener, stopKeyListener } from './keyListener';
import { createTray, destroyTray } from './trayManager';
import { getConfig, setConfig } from './store';
import { setEditMode, confirmEditMode, cancelEditMode } from './overlayWindow';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Required for transparent windows on Linux
app.commandLine.appendSwitch('enable-transparent-visuals');

const createApp = () => {
  // Register IPC handlers
  ipcMain.handle('get-config', () => getConfig());
  ipcMain.handle('set-config', (_event, config) => setConfig(config));
  ipcMain.on('set-edit-mode', (_event, enabled: boolean) => setEditMode(enabled));
  ipcMain.on('confirm-edit-mode', () => confirmEditMode());
  ipcMain.on('cancel-edit-mode', () => cancelEditMode());

  const win = createOverlayWindow();
  startKeyListener(win);
  createTray();
};

app.whenReady().then(() => {
  // Linux needs a delay after ready for transparent visuals to initialize
  if (process.platform === 'linux') {
    setTimeout(createApp, 300);
  } else {
    createApp();
  }
});

app.on('window-all-closed', () => {
  stopKeyListener();
  destroyTray();
  app.quit();
});
