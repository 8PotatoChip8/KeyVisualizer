import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { KEYCODE_LABELS, MOUSE_BUTTON_LABELS } from '../shared/constants';
import { KeyEvent, MouseButtonEvent, MouseWheelEvent } from '../shared/types';

// Linux input_event struct (64-bit): { timeval(16 bytes), type(2), code(2), value(4) } = 24 bytes
const INPUT_EVENT_SIZE = 24;

// Event types
const EV_KEY = 1;
const EV_REL = 2;

// REL codes
const REL_WHEEL = 8;

// Mouse button codes start at BTN_MOUSE (0x110 = 272)
const BTN_LEFT = 272;
const BTN_RIGHT = 273;
const BTN_MIDDLE = 274;
const BTN_SIDE = 275;
const BTN_EXTRA = 276;

// Map Linux evdev keycodes to uiohook keycodes (they're mostly the same for common keys)
// Linux evdev uses the same scan codes as the kernel, which align with uiohook for most keys
const EVDEV_TO_MOUSE_BUTTON: Record<number, number> = {
  [BTN_LEFT]: 1,
  [BTN_RIGHT]: 2,
  [BTN_MIDDLE]: 3,
  [BTN_SIDE]: 4,
  [BTN_EXTRA]: 5,
};

let targetWindow: BrowserWindow | null = null;
const openStreams: fs.ReadStream[] = [];

export function canUseEvdev(): boolean {
  try {
    const devices = fs.readdirSync('/dev/input').filter(f => f.startsWith('event'));
    if (devices.length === 0) return false;
    // Check if we can read at least one device
    fs.accessSync(`/dev/input/${devices[0]}`, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function startEvdevListener(win: BrowserWindow): void {
  targetWindow = win;

  // Find keyboard and mouse devices by checking their capabilities
  const devices = findInputDevices();

  for (const devicePath of devices) {
    try {
      const stream = fs.createReadStream(devicePath, {
        flags: 'r',
        highWaterMark: INPUT_EVENT_SIZE * 64,
      });

      stream.on('data', (chunk: Buffer) => {
        processEvents(chunk);
      });

      stream.on('error', (err) => {
        console.error(`evdev: error reading ${devicePath}:`, err.message);
      });

      openStreams.push(stream);
    } catch (err) {
      console.error(`evdev: could not open ${devicePath}:`, err);
    }
  }

  if (openStreams.length === 0) {
    console.error('evdev: no input devices could be opened');
  } else {
    console.log(`evdev: listening on ${openStreams.length} device(s)`);
  }
}

export function stopEvdevListener(): void {
  for (const stream of openStreams) {
    stream.destroy();
  }
  openStreams.length = 0;
  targetWindow = null;
}

function findInputDevices(): string[] {
  const devices: string[] = [];

  try {
    const entries = fs.readdirSync('/dev/input').filter(f => f.startsWith('event'));

    for (const entry of entries) {
      const devicePath = `/dev/input/${entry}`;
      try {
        // Check if readable
        fs.accessSync(devicePath, fs.constants.R_OK);

        // Check device capabilities via /sys/class/input
        const sysPath = `/sys/class/input/${entry}/device/capabilities/ev`;
        if (fs.existsSync(sysPath)) {
          const caps = fs.readFileSync(sysPath, 'utf-8').trim();
          const capBits = parseInt(caps.split(' ').pop() || '0', 16);

          // EV_KEY bit (1) set means keyboard or mouse buttons
          // EV_REL bit (2) set means relative movement (mouse)
          const hasKey = (capBits & (1 << EV_KEY)) !== 0;
          const hasRel = (capBits & (1 << EV_REL)) !== 0;

          if (hasKey || hasRel) {
            devices.push(devicePath);
          }
        } else {
          // Can't check capabilities, include it anyway
          devices.push(devicePath);
        }
      } catch {
        // Skip devices we can't access
      }
    }
  } catch (err) {
    console.error('evdev: could not read /dev/input:', err);
  }

  return devices;
}

function processEvents(buffer: Buffer): void {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  for (let offset = 0; offset + INPUT_EVENT_SIZE <= buffer.length; offset += INPUT_EVENT_SIZE) {
    // Skip timeval (16 bytes), read type, code, value
    const type = buffer.readUInt16LE(offset + 16);
    const code = buffer.readUInt16LE(offset + 18);
    const value = buffer.readInt32LE(offset + 20);

    if (type === EV_KEY) {
      if (code >= BTN_LEFT && code <= BTN_EXTRA) {
        // Mouse button
        const button = EVDEV_TO_MOUSE_BUTTON[code] || (code - BTN_LEFT + 1);
        const pressed = value === 1;
        // value 2 = repeat, treat as still pressed (ignore)
        if (value === 2) continue;
        sendMouseButtonEvent(button, pressed);
      } else {
        // Keyboard key
        const pressed = value === 1;
        if (value === 2) continue; // Skip key repeat
        sendKeyEvent(code, pressed);
      }
    } else if (type === EV_REL && code === REL_WHEEL) {
      sendMouseWheelEvent(value > 0 ? 'up' : 'down', Math.abs(value));
    }
  }
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

function sendMouseButtonEvent(button: number, pressed: boolean): void {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  const label = MOUSE_BUTTON_LABELS[button] || `Mouse${button}`;
  const event: MouseButtonEvent = {
    button,
    label,
    pressed,
    timestamp: performance.now(),
    wallClock: Date.now(),
    x: 0,
    y: 0,
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
