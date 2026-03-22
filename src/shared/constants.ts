import { AppConfig } from './types';

// Map uiohook keycodes to display labels
// Based on uiohook-napi UiohookKey enum values
export const KEYCODE_LABELS: Record<number, string> = {
  // Letters
  30: 'A', 48: 'B', 46: 'C', 32: 'D', 18: 'E', 33: 'F', 34: 'G',
  35: 'H', 23: 'I', 36: 'J', 37: 'K', 38: 'L', 50: 'M', 49: 'N',
  24: 'O', 25: 'P', 16: 'Q', 19: 'R', 31: 'S', 20: 'T', 22: 'U',
  47: 'V', 17: 'W', 45: 'X', 21: 'Y', 44: 'Z',

  // Numbers
  2: '1', 3: '2', 4: '3', 5: '4', 6: '5',
  7: '6', 8: '7', 9: '8', 10: '9', 11: '0',

  // Function keys
  59: 'F1', 60: 'F2', 61: 'F3', 62: 'F4', 63: 'F5', 64: 'F6',
  65: 'F7', 66: 'F8', 67: 'F9', 68: 'F10', 87: 'F11', 88: 'F12',

  // Modifiers
  42: 'Shift', 54: 'RShift',
  29: 'Ctrl', 3613: 'RCtrl',
  56: 'Alt', 3640: 'RAlt',
  3675: 'Meta', 3676: 'RMeta',

  // Special keys
  57: 'Space', 28: 'Enter', 14: 'Backspace', 15: 'Tab',
  1: 'Esc', 58: 'CapsLock',

  // Arrow keys
  57416: 'Up', 57424: 'Down', 57419: 'Left', 57421: 'Right',

  // Punctuation / symbols
  12: '-', 13: '=', 26: '[', 27: ']', 43: '\\',
  39: ';', 40: "'", 41: '`', 51: ',', 52: '.', 53: '/',

  // Numpad
  69: 'NumLock', 3637: 'Num/', 55: 'Num*', 74: 'Num-',
  78: 'Num+', 3612: 'NumEnter',
  82: 'Num0', 79: 'Num1', 80: 'Num2', 81: 'Num3',
  75: 'Num4', 76: 'Num5', 77: 'Num6',
  71: 'Num7', 72: 'Num8', 73: 'Num9', 83: 'Num.',

  // Other
  3639: 'PrtSc', 70: 'ScrLk', 3653: 'Pause',
  3655: 'Insert', 3663: 'Delete', 3657: 'Home', 3665: 'End',
  3659: 'PgUp', 3667: 'PgDn',
};

export const MOUSE_BUTTON_LABELS: Record<number, string> = {
  1: 'LMB',
  2: 'RMB',
  3: 'MMB',
  4: 'Mouse4',
  5: 'Mouse5',
};

export const DEFAULT_CONFIG: AppConfig = {
  theme: 'default',
  overlayX: 100,
  overlayY: 100,
  overlayOpacity: 0.9,
  showTimestamps: true,
  showDuration: true,
  clickThrough: true,
  fadeOutDelay: 2000,
  showMouseButtons: true,
  showMouseScroll: true,
};
