import './styles/overlay.css';
import { KeyEvent, MouseButtonEvent, MouseWheelEvent, InputState, AppConfig } from '../shared/types';
import { InputTile } from './components/KeyDisplay';

const inputStates = new Map<string, InputState>();
const tiles = new Map<string, InputTile>();
let container: HTMLElement;
let config: AppConfig;

async function init(): Promise<void> {
  config = await window.electronAPI.getConfig();
  container = document.getElementById('overlay-container')!;

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

  // Listen for chroma key (recording mode)
  window.electronAPI.onChromaKeyChanged((enabled: boolean) => {
    document.body.classList.toggle('chroma-key', enabled);
  });

  // Start render loop
  requestAnimationFrame(renderLoop);
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
