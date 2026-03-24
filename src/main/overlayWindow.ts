import { BrowserWindow, screen } from 'electron';
import { AppConfig } from '../shared/types';
import { getConfig, setConfig } from './store';
import { DEFAULT_CONFIG } from '../shared/constants';
import { addTargetWindow, removeTargetWindow } from './keyListener';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let overlayWindow: BrowserWindow | null = null;
let captureWindow: BrowserWindow | null = null;
let editPanelWindow: BrowserWindow | null = null;
let editModeOriginalBounds: { x: number; y: number } | null = null;
let editModeOriginalScale: number | null = null;

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
  // When opaque tiles is on, window must be fully opaque; otherwise use configured opacity
  overlayWindow.setOpacity(config.overlayTileOpaque ? 1.0 : config.overlayOpacity);

  // Apply resolution-aware scaling once content is ready
  overlayWindow.webContents.on('did-finish-load', () => {
    applyOverlayZoom();
  });

  if (config.clickThrough) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }

  // Keep capture window synced when overlay moves
  overlayWindow.on('move', () => {
    syncCapturePosition();
  });

  overlayWindow.on('resize', () => {
    syncCapturePosition();
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
    destroyCaptureWindow();
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
    editModeOriginalScale = getConfig().scale;

    overlayWindow.setIgnoreMouseEvents(false);
    overlayWindow.setFocusable(true);
    overlayWindow.setResizable(true);
    overlayWindow.webContents.send('edit-mode-changed', true);

    openEditPanel();
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

function applyOverlayZoom(): void {
  if (!overlayWindow) return;
  const config = getConfig();
  const bounds = overlayWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  // Normalize to 1080p: on higher-res screens, scale up proportionally
  const resolutionScale = display.size.height / 1080;
  const userScale = config.scale / 100;
  const zoom = resolutionScale * userScale;
  overlayWindow.webContents.setZoomFactor(zoom);
  // Apply same zoom to capture window
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.webContents.setZoomFactor(zoom);
  }
}

export function setOverlayScale(scale: number): void {
  setConfig({ scale });
  applyOverlayZoom();
  // Broadcast config change so all windows (settings, edit panel) stay in sync
  broadcastConfig();
}

function broadcastConfig(): void {
  const fullConfig = getConfig();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('config-changed', fullConfig);
    }
  }
}

// --- Recording Mode (companion capture window) ---

export function setRecordingMode(enabled: boolean): void {
  if (enabled) {
    createCaptureWindow();
  } else {
    destroyCaptureWindow();
  }
}

export function isRecordingModeEnabled(): boolean {
  return captureWindow !== null;
}

function createCaptureWindow(): void {
  if (captureWindow || !overlayWindow) return;

  const bounds = overlayWindow.getBounds();

  captureWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    transparent: false,
    frame: false,
    resizable: false,
    focusable: true,
    skipTaskbar: false, // Show in taskbar so OBS can find it
    alwaysOnTop: false, // Sits behind the transparent overlay
    backgroundColor: getConfig().chromaKeyColor,
    title: 'KeyVisualizer [Recording]',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Prevent the HTML <title> from overriding our window title
  captureWindow.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  // Append ?chromakey=1 to the entry URL so the renderer sets a green background
  const separator = MAIN_WINDOW_WEBPACK_ENTRY.includes('?') ? '&' : '?';
  captureWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY + separator + 'chromakey=1');

  // Apply same zoom factor once loaded
  captureWindow.webContents.on('did-finish-load', () => {
    if (captureWindow && overlayWindow) {
      captureWindow.webContents.setZoomFactor(
        overlayWindow.webContents.getZoomFactor()
      );
    }
  });

  // Register as a key event target
  addTargetWindow(captureWindow);

  captureWindow.on('closed', () => {
    captureWindow = null;
  });
}

function destroyCaptureWindow(): void {
  if (captureWindow) {
    removeTargetWindow(captureWindow);
    captureWindow.close();
    captureWindow = null;
  }
}

function syncCapturePosition(): void {
  if (!captureWindow || !overlayWindow) return;
  const bounds = overlayWindow.getBounds();
  captureWindow.setBounds(bounds);
}

// --- Position presets ---

export function moveToPreset(preset: string): void {
  if (!overlayWindow) return;

  const bounds = overlayWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  const workArea = display.workArea;
  const padding = 20;

  let x: number;
  let y: number;

  switch (preset) {
    case 'top-left':
      x = workArea.x + padding;
      y = workArea.y + padding;
      break;
    case 'top-right':
      x = workArea.x + workArea.width - bounds.width - padding;
      y = workArea.y + padding;
      break;
    case 'bottom-left':
      x = workArea.x + padding;
      y = workArea.y + workArea.height - bounds.height - padding;
      break;
    case 'bottom-right':
      x = workArea.x + workArea.width - bounds.width - padding;
      y = workArea.y + workArea.height - bounds.height - padding;
      break;
    case 'center':
      x = workArea.x + Math.round((workArea.width - bounds.width) / 2);
      y = workArea.y + Math.round((workArea.height - bounds.height) / 2);
      break;
    case 'default':
      x = DEFAULT_CONFIG.overlayX;
      y = DEFAULT_CONFIG.overlayY;
      break;
    default:
      return;
  }

  overlayWindow.setPosition(x, y);
}

// --- Edit panel ---

function getEditPanelHTML(currentScale: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Edit Position</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;background:#1e1e2a;color:#c8c8d2;padding:12px;user-select:none}
h3{font-size:13px;color:rgba(180,200,255,0.9);margin-bottom:10px;text-align:center}
.section-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(140,150,180,0.7);margin-bottom:6px}
.preset-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:12px}
.preset-btn{height:28px;border:1px solid rgba(100,120,180,0.5);border-radius:4px;background:rgba(50,60,80,0.8);color:rgba(180,200,255,0.9);font-size:11px;font-weight:600;cursor:pointer;transition:background-color 100ms ease,border-color 100ms ease}
.preset-btn:hover{background:rgba(70,90,130,0.9);border-color:rgba(120,150,220,0.8)}
.scale-row{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.scale-slider{flex:1;-webkit-appearance:none;height:6px;border-radius:3px;background:rgba(50,60,80,0.8);outline:none}
.scale-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:rgba(100,160,255,0.9);cursor:pointer}
.scale-value{font-size:12px;color:rgba(180,200,255,0.9);min-width:38px;text-align:right}
.actions{display:flex;gap:6px}
.action-btn{flex:1;height:32px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;transition:background-color 100ms ease}
.action-btn.confirm{background:rgba(60,180,100,0.85);color:#fff}
.action-btn.confirm:hover{background:rgba(70,200,110,0.95)}
.action-btn.cancel{background:rgba(200,60,60,0.85);color:#fff}
.action-btn.cancel:hover{background:rgba(220,70,70,0.95)}
</style></head><body>
<h3>Drag overlay to reposition</h3>
<div class="section-label">Presets</div>
<div class="preset-grid">
  <button class="preset-btn" data-preset="top-left">Top Left</button>
  <button class="preset-btn" data-preset="center">Center</button>
  <button class="preset-btn" data-preset="top-right">Top Right</button>
  <button class="preset-btn" data-preset="bottom-left">Bottom Left</button>
  <button class="preset-btn" data-preset="default">Reset</button>
  <button class="preset-btn" data-preset="bottom-right">Bottom Right</button>
</div>
<div class="section-label">Scale</div>
<div class="scale-row">
  <input type="range" class="scale-slider" id="scale-slider" min="50" max="200" step="5" value="${currentScale}">
  <span class="scale-value" id="scale-value">${currentScale}%</span>
</div>
<div class="actions">
  <button class="action-btn confirm" id="btn-confirm">Confirm</button>
  <button class="action-btn cancel" id="btn-cancel">Cancel</button>
</div>
<script>
  const{ipcRenderer}=require('electron');
  document.querySelectorAll('.preset-btn').forEach(b=>{
    b.addEventListener('click',()=>ipcRenderer.send('move-to-preset',b.dataset.preset));
  });
  const slider=document.getElementById('scale-slider');
  const valueLabel=document.getElementById('scale-value');
  slider.addEventListener('input',()=>{
    valueLabel.textContent=slider.value+'%';
    ipcRenderer.send('set-overlay-scale',parseInt(slider.value));
  });
  document.getElementById('btn-confirm').addEventListener('click',()=>ipcRenderer.send('confirm-edit-mode'));
  document.getElementById('btn-cancel').addEventListener('click',()=>ipcRenderer.send('cancel-edit-mode'));
</script></body></html>`;
}

function openEditPanel(): void {
  if (editPanelWindow) {
    editPanelWindow.focus();
    return;
  }

  const display = screen.getPrimaryDisplay();
  const panelWidth = 240;
  const panelHeight = 260;
  const x = Math.round(display.workArea.x + (display.workArea.width - panelWidth) / 2);
  const y = Math.round(display.workArea.y + (display.workArea.height - panelHeight) / 2);

  editPanelWindow = new BrowserWindow({
    width: panelWidth,
    height: panelHeight,
    x,
    y,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const config = getConfig();
  editPanelWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getEditPanelHTML(config.scale)));

  editPanelWindow.on('closed', () => {
    editPanelWindow = null;
    // If panel is closed without confirming/canceling, treat as confirm
    if (editModeOriginalBounds) {
      exitEditMode(true);
    }
  });
}

function closeEditPanel(): void {
  if (editPanelWindow) {
    // Detach close handler to avoid double-triggering exitEditMode
    editPanelWindow.removeAllListeners('closed');
    editPanelWindow.on('closed', () => { editPanelWindow = null; });
    editPanelWindow.close();
  }
}

export function onConfigUpdated(partial: Partial<AppConfig>): void {
  // Update capture window background color if it changed
  if (partial.chromaKeyColor && captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.setBackgroundColor(partial.chromaKeyColor);
  }

  // Update overlay window opacity when opaque tiles setting changes
  if (partial.overlayTileOpaque !== undefined && overlayWindow && !overlayWindow.isDestroyed()) {
    const config = getConfig();
    overlayWindow.setOpacity(partial.overlayTileOpaque ? 1.0 : config.overlayOpacity);
  }
}

// Apply all physical side effects when a profile is loaded
export function applyFullConfig(): void {
  if (!overlayWindow) return;
  const config = getConfig();

  // Position
  overlayWindow.setPosition(config.overlayX, config.overlayY);

  // Opacity
  overlayWindow.setOpacity(config.overlayTileOpaque ? 1.0 : config.overlayOpacity);

  // Scale/zoom
  applyOverlayZoom();

  // Capture window
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.setBackgroundColor(config.chromaKeyColor);
    syncCapturePosition();
  }

  // Broadcast to all renderers
  broadcastConfig();
}

function exitEditMode(save: boolean): void {
  if (!overlayWindow) return;

  if (save) {
    const bounds = overlayWindow.getBounds();
    setConfig({ overlayX: bounds.x, overlayY: bounds.y });
  } else {
    if (editModeOriginalBounds) {
      overlayWindow.setPosition(editModeOriginalBounds.x, editModeOriginalBounds.y);
    }
    if (editModeOriginalScale !== null) {
      setConfig({ scale: editModeOriginalScale });
      applyOverlayZoom();
    }
  }

  editModeOriginalBounds = null;
  editModeOriginalScale = null;

  const config = getConfig();
  if (config.clickThrough) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }
  overlayWindow.setFocusable(false);
  overlayWindow.setResizable(false);

  overlayWindow.webContents.send('edit-mode-changed', false);
  closeEditPanel();
}
