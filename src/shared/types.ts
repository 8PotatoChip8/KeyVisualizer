export interface KeyEvent {
  keycode: number;
  label: string;
  pressed: boolean;
  timestamp: number;      // performance.now() high-res timestamp
  wallClock: number;       // Date.now() for display
}

export interface MouseButtonEvent {
  button: number;         // 1=left, 2=right, 3=middle, etc.
  label: string;
  pressed: boolean;
  timestamp: number;
  wallClock: number;
  x: number;
  y: number;
}

export interface MouseMoveEvent {
  x: number;
  y: number;
  timestamp: number;
}

export interface MouseWheelEvent {
  direction: 'up' | 'down';
  amount: number;
  timestamp: number;
  wallClock: number;
}

export interface InputState {
  id: string;             // unique identifier (e.g., "key:30" or "mouse:1")
  label: string;
  type: 'key' | 'mouse-button' | 'scroll';
  pressed: boolean;
  pressedAt: number;       // wall clock time of last press
  pressDuration: number;   // ms held (updated each frame while held)
  pressStartHr: number;    // performance.now() when pressed
  releasedAt: number;      // performance.now() when released (for fade-out timing)
}

export interface AppConfig {
  theme: string;
  overlayX: number;
  overlayY: number;
  overlayOpacity: number;
  showTimestamps: boolean;
  showDuration: boolean;
  clickThrough: boolean;
  fadeOutDelay: number;     // ms before a released input fades from view
  showMouseButtons: boolean;
  showMouseScroll: boolean;
  scale: number;              // user scale percentage (100 = default)
}

export interface ElectronAPI {
  onKeyEvent: (callback: (event: KeyEvent) => void) => void;
  onMouseButton: (callback: (event: MouseButtonEvent) => void) => void;
  onMouseWheel: (callback: (event: MouseWheelEvent) => void) => void;
  getConfig: () => Promise<AppConfig>;
  setConfig: (config: Partial<AppConfig>) => Promise<void>;
  setEditMode: (enabled: boolean) => void;
  onEditModeChanged: (callback: (enabled: boolean) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
