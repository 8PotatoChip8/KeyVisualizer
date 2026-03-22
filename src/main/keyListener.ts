import { uIOhook, UiohookKeyboardEvent, UiohookMouseEvent, UiohookWheelEvent } from 'uiohook-napi';
import { BrowserWindow } from 'electron';
import { KEYCODE_LABELS, MOUSE_BUTTON_LABELS } from '../shared/constants';
import { KeyEvent, MouseButtonEvent, MouseWheelEvent } from '../shared/types';

let targetWindow: BrowserWindow | null = null;

export function startKeyListener(win: BrowserWindow): void {
  targetWindow = win;

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

export function stopKeyListener(): void {
  uIOhook.stop();
  targetWindow = null;
}

function sendKeyEvent(keycode: number, pressed: boolean): void {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  const label = KEYCODE_LABELS[keycode] || `Key${keycode}`;
  const event: KeyEvent = {
    keycode,
    label,
    pressed,
    timestamp: performance.now(),
    wallClock: Date.now(),
  };

  targetWindow.webContents.send('key-event', event);
}

function sendMouseButtonEvent(button: number, pressed: boolean, x: number, y: number): void {
  if (!targetWindow || targetWindow.isDestroyed()) return;

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

  targetWindow.webContents.send('mouse-button', event);
}

function sendMouseWheelEvent(direction: 'up' | 'down', amount: number): void {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  const event: MouseWheelEvent = {
    direction,
    amount,
    timestamp: performance.now(),
    wallClock: Date.now(),
  };

  targetWindow.webContents.send('mouse-wheel', event);
}
