import { BrowserWindow } from 'electron';
import { getConfig, setConfig } from './store';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let overlayWindow: BrowserWindow | null = null;
let editModeOriginalBounds: { x: number; y: number } | null = null;

export function createOverlayWindow(): BrowserWindow {
  const config = getConfig();

  overlayWindow = new BrowserWindow({
    width: 500,
    height: 400,
    x: config.overlayX,
    y: config.overlayY,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    focusable: false,
    // Use fully transparent background color to avoid artifacts on Linux
    backgroundColor: '#00000000',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  overlayWindow.setOpacity(config.overlayOpacity);

  if (config.clickThrough) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow;
}

export function setEditMode(enabled: boolean): void {
  if (!overlayWindow) return;

  if (enabled) {
    const bounds = overlayWindow.getBounds();
    editModeOriginalBounds = { x: bounds.x, y: bounds.y };

    overlayWindow.setIgnoreMouseEvents(false);
    overlayWindow.setFocusable(true);
    overlayWindow.setResizable(true);
    overlayWindow.webContents.send('edit-mode-changed', true);
  } else {
    confirmEditMode();
  }
}

export function confirmEditMode(): void {
  exitEditMode(true);
}

export function cancelEditMode(): void {
  exitEditMode(false);
}

function exitEditMode(save: boolean): void {
  if (!overlayWindow) return;

  if (save) {
    const bounds = overlayWindow.getBounds();
    setConfig({ overlayX: bounds.x, overlayY: bounds.y });
  } else if (editModeOriginalBounds) {
    overlayWindow.setPosition(editModeOriginalBounds.x, editModeOriginalBounds.y);
  }

  editModeOriginalBounds = null;

  const config = getConfig();
  if (config.clickThrough) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }
  overlayWindow.setFocusable(false);
  overlayWindow.setResizable(false);

  overlayWindow.webContents.send('edit-mode-changed', false);
}
