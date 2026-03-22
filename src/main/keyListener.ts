import { uIOhook, UiohookKeyboardEvent, UiohookMouseEvent, UiohookWheelEvent } from 'uiohook-napi';
import { BrowserWindow } from 'electron';
import { KEYCODE_LABELS, MOUSE_BUTTON_LABELS } from '../shared/constants';
import { KeyEvent, MouseButtonEvent, MouseWheelEvent } from '../shared/types';
import { canUseEvdev, startEvdevListener, stopEvdevListener } from './evdevReader';

const targetWindows: BrowserWindow[] = [];
let usingEvdev = false;

export function addTargetWindow(win: BrowserWindow): void {
  targetWindows.push(win);
  win.on('closed', () => {
    const idx = targetWindows.indexOf(win);
    if (idx !== -1) targetWindows.splice(idx, 1);
  });
}

export function removeTargetWindow(win: BrowserWindow): void {
  const idx = targetWindows.indexOf(win);
  if (idx !== -1) targetWindows.splice(idx, 1);
}

export function startKeyListener(win: BrowserWindow): void {
  addTargetWindow(win);

  // On Linux, check if we should use evdev (needed for Wayland)
  if (process.platform === 'linux' && canUseEvdev()) {
    console.log('KeyListener: using evdev backend (Wayland-compatible)');
    usingEvdev = true;
    startEvdevListener(win);
    return;
  }

  // Fall back to uiohook (works on X11, Windows, macOS)
  console.log('KeyListener: using uiohook backend');
  startUiohook();
}

export function stopKeyListener(): void {
  if (usingEvdev) {
    stopEvdevListener();
  } else {
    try {
      uIOhook.stop();
    } catch {
      // Ignore errors during shutdown
    }
  }
  targetWindows.length = 0;
}

function startUiohook(): void {
  // Keyboard events
  uIOhook.on('keydown', (e: UiohookKeyboardEvent) => {
    sendKeyEvent(e.keycode, true);
  });

  uIOhook.on('keyup', (e: UiohookKeyboardEvent) => {
    sendKeyEvent(e.keycode, false);
  });

  // Mouse button events
  uIOhook.on('mousedown', (e: UiohookMouseEvent) => {
    sendMouseButtonEvent(e.button, true, e.x, e.y);
  });

  uIOhook.on('mouseup', (e: UiohookMouseEvent) => {
    sendMouseButtonEvent(e.button, false, e.x, e.y);
  });

  // Mouse wheel events
  uIOhook.on('wheel', (e: UiohookWheelEvent) => {
    sendMouseWheelEvent(e.rotation > 0 ? 'down' : 'up', Math.abs(e.rotation));
  });

  uIOhook.start();
}

function broadcast(channel: string, data: unknown): void {
  for (const win of targetWindows) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }
}

function sendKeyEvent(keycode: number, pressed: boolean): void {
  const label = KEYCODE_LABELS[keycode] || `Key${keycode}`;
  const event: KeyEvent = {
    keycode,
    label,
    pressed,
    timestamp: performance.now(),
    wallClock: Date.now(),
  };
  broadcast('key-event', event);
}

function sendMouseButtonEvent(button: number, pressed: boolean, x: number, y: number): void {
  const label = MOUSE_BUTTON_LABELS[button] || `Mouse${button}`;
  const event: MouseButtonEvent = {
    button,
    label,
    pressed,
    timestamp: performance.now(),
    wallClock: Date.now(),
    x,
    y,
  };
  broadcast('mouse-button', event);
}

function sendMouseWheelEvent(direction: 'up' | 'down', amount: number): void {
  const event: MouseWheelEvent = {
    direction,
    amount,
    timestamp: performance.now(),
    wallClock: Date.now(),
  };
  broadcast('mouse-wheel', event);
}
