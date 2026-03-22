import { Tray, Menu, nativeImage, app } from 'electron';
import { getOverlayWindow, setEditMode } from './overlayWindow';

let tray: Tray | null = null;

export function createTray(): Tray {
  // Create a simple 16x16 tray icon programmatically
  const icon = nativeImage.createFromBuffer(createTrayIconBuffer());
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('KeyVisualizer');

  updateTrayMenu();
  return tray;
}

function updateTrayMenu(): void {
  if (!tray) return;

  const win = getOverlayWindow();
  const isVisible = win ? win.isVisible() : false;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'KeyVisualizer',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: isVisible ? 'Hide Overlay' : 'Show Overlay',
      click: () => {
        const w = getOverlayWindow();
        if (!w) return;
        if (w.isVisible()) {
          w.hide();
        } else {
          w.show();
        }
        updateTrayMenu();
      },
    },
    {
      label: 'Edit Position',
      click: () => {
        setEditMode(true);
        // Auto-exit edit mode after 10 seconds
        setTimeout(() => setEditMode(false), 10000);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function createTrayIconBuffer(): Buffer {
  // Create a simple 16x16 PNG icon (keyboard icon shape)
  // This is a minimal valid PNG with a key-like symbol
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Draw a simple keyboard outline
      const isOutline =
        (y === 3 || y === 12) && x >= 2 && x <= 13 ||
        (x === 2 || x === 13) && y >= 3 && y <= 12 ||
        // Key dots
        (y === 6 && (x === 5 || x === 8 || x === 11)) ||
        (y === 9 && (x === 4 || x === 7 || x === 10));

      canvas[idx] = isOutline ? 220 : 0;     // R
      canvas[idx + 1] = isOutline ? 220 : 0; // G
      canvas[idx + 2] = isOutline ? 255 : 0; // B
      canvas[idx + 3] = isOutline ? 255 : 0; // A
    }
  }

  return nativeImage.createFromBuffer(canvas, {
    width: size,
    height: size,
  }).toPNG();
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
