import './styles/overlay.css';
import { KeyEvent, MouseButtonEvent, MouseWheelEvent, InputState, AppConfig } from '../shared/types';
import { InputTile, setClockFormat } from './components/KeyDisplay';

const inputStates = new Map<string, InputState>();
const tiles = new Map<string, InputTile>();
let container: HTMLElement;
let config: AppConfig;

async function init(): Promise<void> {
  config = await window.electronAPI.getConfig();
  container = document.getElementById('overlay-container')!;

  const isChromaKey = window.location.search.includes('chromakey=1');

  // Apply initial config
  setClockFormat(config.clockFormat);
  applyTileColors(config);

  // Check if this is the chroma key capture window
  if (isChromaKey) {
    document.body.classList.add('chroma-key');
    document.body.style.background = config.chromaKeyColor;
    if (config.captureTileOpaque) {
      document.body.classList.add('opaque-tiles');
    }
  } else {
    if (config.overlayTileOpaque) {
      document.body.classList.add('opaque-tiles');
    }
  }

  // Listen for keyboard events
  window.electronAPI.onKeyEvent((event: KeyEvent) => {
    const id = `key:${event.keycode}`;
    handleInput(id, event.label, 'key', event.pressed, event.wallClock);
  });

  // Listen for mouse button events
  if (config.showMouseButtons) {
    window.electronAPI.onMouseButton((event: MouseButtonEvent) => {
      const id = `mouse:${event.button}`;
      handleInput(id, event.label, 'mouse-button', event.pressed, event.wallClock);
    });
  }

  // Listen for mouse wheel events
  if (config.showMouseScroll) {
    window.electronAPI.onMouseWheel((event: MouseWheelEvent) => {
      const id = `scroll:${event.direction}`;
      const label = event.direction === 'up' ? 'Scroll Up' : 'Scroll Down';
      handleInput(id, label, 'scroll', true, event.wallClock);
      // Auto-release scroll after a brief moment
      setTimeout(() => {
        handleInput(id, label, 'scroll', false, Date.now());
      }, 300);
    });
  }

  // Listen for edit mode
  window.electronAPI.onEditModeChanged((enabled: boolean) => {
    document.body.classList.toggle('edit-mode', enabled);
  });

  // Listen for config changes (settings updates)
  window.electronAPI.onConfigChanged((updatedConfig: AppConfig) => {
    config = updatedConfig;
    setClockFormat(config.clockFormat);
    applyTileColors(config);
    if (isChromaKey) {
      document.body.style.background = config.chromaKeyColor;
      document.body.classList.toggle('opaque-tiles', config.captureTileOpaque);
    } else {
      document.body.classList.toggle('opaque-tiles', config.overlayTileOpaque);
    }
  });

  // Start render loop
  requestAnimationFrame(renderLoop);
}

// Convert hex color to r,g,b components
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Apply custom tile colors as CSS custom properties
function applyTileColors(cfg: AppConfig): void {
  const root = document.documentElement.style;

  // Keyboard colors
  const key = hexToRgb(cfg.colorKey);
  root.setProperty('--key-bg', `rgba(${key.r}, ${key.g}, ${key.b}, 0.85)`);
  root.setProperty('--key-border', `rgba(${Math.min(key.r + 40, 255)}, ${Math.min(key.g + 40, 255)}, ${Math.min(key.b + 40, 255)}, 0.9)`);
  root.setProperty('--key-glow', `rgba(${Math.min(key.r + 20, 255)}, ${Math.min(key.g + 20, 255)}, ${Math.min(key.b + 20, 255)}, 0.5)`);
  root.setProperty('--key-glow-inner', `rgba(${Math.min(key.r + 20, 255)}, ${Math.min(key.g + 20, 255)}, ${Math.min(key.b + 20, 255)}, 0.2)`);
  root.setProperty('--key-idle-border', `rgba(${Math.round(key.r * 0.7)}, ${Math.round(key.g * 0.7)}, ${Math.round(key.b * 0.7)}, 0.5)`);
  root.setProperty('--key-holdbar', `rgba(${Math.min(key.r + 40, 255)}, ${Math.min(key.g + 40, 255)}, ${Math.min(key.b + 40, 255)}, 0.7)`);
  root.setProperty('--key-holdbar-active', `rgba(${Math.min(key.r + 100, 255)}, ${Math.min(key.g + 90, 255)}, ${Math.min(key.b + 40, 255)}, 0.9)`);
  // Opaque variants
  root.setProperty('--key-bg-opaque', `rgb(${key.r}, ${key.g}, ${key.b})`);
  root.setProperty('--key-border-opaque', `rgb(${Math.min(key.r + 40, 255)}, ${Math.min(key.g + 40, 255)}, ${Math.min(key.b + 40, 255)})`);
  root.setProperty('--key-glow-opaque', `rgb(${Math.min(key.r + 20, 255)}, ${Math.min(key.g + 20, 255)}, ${Math.min(key.b + 20, 255)})`);
  root.setProperty('--key-holdbar-opaque', `rgb(${Math.min(key.r + 40, 255)}, ${Math.min(key.g + 40, 255)}, ${Math.min(key.b + 40, 255)})`);
  root.setProperty('--key-holdbar-active-opaque', `rgb(${Math.min(key.r + 100, 255)}, ${Math.min(key.g + 90, 255)}, ${Math.min(key.b + 40, 255)})`);

  // Mouse colors
  const mouse = hexToRgb(cfg.colorMouse);
  root.setProperty('--mouse-bg', `rgba(${mouse.r}, ${mouse.g}, ${mouse.b}, 0.85)`);
  root.setProperty('--mouse-border', `rgba(${Math.min(mouse.r + 35, 255)}, ${Math.min(mouse.g + 40, 255)}, ${Math.min(mouse.b + 20, 255)}, 0.9)`);
  root.setProperty('--mouse-glow', `rgba(${Math.min(mouse.r + 35, 255)}, ${Math.min(mouse.g + 20, 255)}, ${Math.min(mouse.b + 0, 255)}, 0.5)`);
  root.setProperty('--mouse-glow-inner', `rgba(${Math.min(mouse.r + 35, 255)}, ${Math.min(mouse.g + 20, 255)}, ${Math.min(mouse.b + 0, 255)}, 0.2)`);
  root.setProperty('--mouse-idle-border', `rgba(${Math.round(mouse.r * 0.8)}, ${Math.round(mouse.g * 0.7)}, ${Math.round(mouse.b * 0.7)}, 0.5)`);
  root.setProperty('--mouse-holdbar', `rgba(${Math.min(mouse.r + 35, 255)}, ${Math.min(mouse.g + 60, 255)}, ${Math.min(mouse.b + 60, 255)}, 0.7)`);
  root.setProperty('--mouse-holdbar-active', `rgba(${Math.min(mouse.r + 35, 255)}, ${Math.min(mouse.g + 60, 255)}, ${Math.min(mouse.b + 60, 255)}, 0.9)`);
  root.setProperty('--mouse-bg-opaque', `rgb(${mouse.r}, ${mouse.g}, ${mouse.b})`);
  root.setProperty('--mouse-border-opaque', `rgb(${Math.min(mouse.r + 35, 255)}, ${Math.min(mouse.g + 40, 255)}, ${Math.min(mouse.b + 20, 255)})`);
  root.setProperty('--mouse-glow-opaque', `rgb(${Math.min(mouse.r + 35, 255)}, ${Math.min(mouse.g + 20, 255)}, ${Math.min(mouse.b + 0, 255)})`);
  root.setProperty('--mouse-holdbar-opaque', `rgb(${Math.min(mouse.r + 35, 255)}, ${Math.min(mouse.g + 60, 255)}, ${Math.min(mouse.b + 60, 255)})`);

  // Scroll colors
  const scroll = hexToRgb(cfg.colorScroll);
  root.setProperty('--scroll-bg', `rgba(${scroll.r}, ${scroll.g}, ${scroll.b}, 0.85)`);
  root.setProperty('--scroll-border', `rgba(${Math.min(scroll.r + 20, 255)}, ${Math.min(scroll.g + 40, 255)}, ${Math.min(scroll.b + 30, 255)}, 0.9)`);
  root.setProperty('--scroll-glow', `rgba(${scroll.r}, ${Math.min(scroll.g + 20, 255)}, ${Math.min(scroll.b + 10, 255)}, 0.5)`);
  root.setProperty('--scroll-glow-inner', `rgba(${scroll.r}, ${Math.min(scroll.g + 20, 255)}, ${Math.min(scroll.b + 10, 255)}, 0.2)`);
  root.setProperty('--scroll-idle-border', `rgba(${Math.round(scroll.r * 0.7)}, ${Math.round(scroll.g * 0.7)}, ${Math.round(scroll.b * 0.7)}, 0.5)`);
  root.setProperty('--scroll-holdbar', `rgba(${Math.min(scroll.r + 40, 255)}, ${Math.min(scroll.g + 40, 255)}, ${Math.min(scroll.b + 40, 255)}, 0.7)`);
  root.setProperty('--scroll-holdbar-active', `rgba(${Math.min(scroll.r + 40, 255)}, ${Math.min(scroll.g + 40, 255)}, ${Math.min(scroll.b + 40, 255)}, 0.9)`);
  root.setProperty('--scroll-bg-opaque', `rgb(${scroll.r}, ${scroll.g}, ${scroll.b})`);
  root.setProperty('--scroll-border-opaque', `rgb(${Math.min(scroll.r + 20, 255)}, ${Math.min(scroll.g + 40, 255)}, ${Math.min(scroll.b + 30, 255)})`);
  root.setProperty('--scroll-glow-opaque', `rgb(${scroll.r}, ${Math.min(scroll.g + 20, 255)}, ${Math.min(scroll.b + 10, 255)})`);
  root.setProperty('--scroll-holdbar-opaque', `rgb(${Math.min(scroll.r + 40, 255)}, ${Math.min(scroll.g + 40, 255)}, ${Math.min(scroll.b + 40, 255)})`);
}

function handleInput(
  id: string,
  label: string,
  type: 'key' | 'mouse-button' | 'scroll',
  pressed: boolean,
  wallClock: number
): void {
  if (pressed) {
    // Use renderer-local performance.now() for duration tracking
    const now = performance.now();

    inputStates.set(id, {
      id,
      label,
      type,
      pressed: true,
      pressedAt: wallClock,
      pressDuration: 0,
      pressStartHr: now,
      releasedAt: 0,
    });

    // Create tile if it doesn't exist, or re-add if it was removed
    if (!tiles.has(id)) {
      const state = inputStates.get(id)!;
      const tile = new InputTile(state, config.showTimestamps, config.showDuration);
      tiles.set(id, tile);
      container.appendChild(tile.element);
    }
  } else {
    const existing = inputStates.get(id);
    if (existing) {
      existing.pressed = false;
      existing.pressDuration = performance.now() - existing.pressStartHr;
      existing.releasedAt = performance.now();
    }
  }
}

function renderLoop(): void {
  const now = performance.now();

  // Update durations for pressed inputs and clean up faded-out ones
  const toRemove: string[] = [];

  for (const [id, state] of inputStates) {
    if (state.pressed) {
      state.pressDuration = now - state.pressStartHr;
    } else if (state.releasedAt > 0) {
      const elapsed = now - state.releasedAt;
      if (elapsed > config.fadeOutDelay) {
        toRemove.push(id);
      }
    }

    // Update the tile
    const tile = tiles.get(id);
    if (tile) {
      tile.update(state);
    }
  }

  // Remove faded-out tiles
  for (const id of toRemove) {
    const tile = tiles.get(id);
    if (tile) {
      tile.element.remove();
      tiles.delete(id);
    }
    inputStates.delete(id);
  }

  requestAnimationFrame(renderLoop);
}

document.addEventListener('DOMContentLoaded', init);
