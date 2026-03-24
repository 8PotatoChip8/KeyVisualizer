import { app, BrowserWindow, ipcMain } from 'electron';
import { createOverlayWindow } from './overlayWindow';
import { startKeyListener, stopKeyListener } from './keyListener';
import { createTray, destroyTray } from './trayManager';
import { getConfig, setConfig } from './store';
import { setEditMode, confirmEditMode, cancelEditMode, moveToPreset, setOverlayScale, onConfigUpdated, applyFullConfig } from './overlayWindow';
import { openSettingsWindow } from './settingsWindow';
import { getProfiles, getActiveProfileName, saveProfile, loadProfile, deleteProfile } from './profileStore';
import { initAutoUpdateCheck, checkForUpdates, getCachedUpdateInfo, openReleasePage } from './updater';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Required for transparent windows on Linux
app.commandLine.appendSwitch('enable-transparent-visuals');

const createApp = () => {
  // Register IPC handlers
  ipcMain.handle('get-config', () => getConfig());
  ipcMain.handle('set-config', (_event, config) => {
    setConfig(config);
    // Broadcast updated config to all renderer windows
    const fullConfig = getConfig();
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('config-changed', fullConfig);
      }
    }
    // Handle side effects (capture window color, etc.)
    onConfigUpdated(config);
  });
  ipcMain.on('open-settings', () => openSettingsWindow());
  ipcMain.on('set-edit-mode', (_event, enabled: boolean) => setEditMode(enabled));
  ipcMain.on('confirm-edit-mode', () => confirmEditMode());
  ipcMain.on('cancel-edit-mode', () => cancelEditMode());
  ipcMain.on('move-to-preset', (_event, preset: string) => moveToPreset(preset));
  ipcMain.on('set-overlay-scale', (_event, scale: number) => setOverlayScale(scale));

  // Updater IPC handlers
  ipcMain.handle('check-for-updates', () => checkForUpdates());
  ipcMain.handle('get-cached-update-info', () => getCachedUpdateInfo());
  ipcMain.on('open-update-page', () => openReleasePage());

  // Profile IPC handlers
  ipcMain.handle('get-profiles', () => getProfiles());
  ipcMain.handle('get-active-profile', () => getActiveProfileName());
  ipcMain.handle('save-profile', (_event, name: string) => {
    saveProfile(name);
  });
  ipcMain.handle('load-profile', (_event, name: string) => {
    const config = loadProfile(name);
    if (config) {
      applyFullConfig();
    }
    return config;
  });
  ipcMain.handle('delete-profile', (_event, name: string) => {
    deleteProfile(name);
  });

  const win = createOverlayWindow();
  startKeyListener(win);
  createTray();

  // Auto-check for updates after startup
  initAutoUpdateCheck();
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
