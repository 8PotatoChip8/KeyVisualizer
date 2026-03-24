import { InputState } from '../../shared/types';

// Module-level clock format, updated from app.ts when config changes
let clockFormat: '24h' | '12h' = '24h';

export function setClockFormat(format: '24h' | '12h'): void {
  clockFormat = format;
}

export class InputTile {
  public element: HTMLElement;
  private labelEl: HTMLElement;
  private timestampEl: HTMLElement;
  private durationEl: HTMLElement;
  private holdBar: HTMLElement;
  private _id: string;

  constructor(state: InputState, showTimestamps: boolean, showDuration: boolean) {
    this._id = state.id;

    this.element = document.createElement('div');
    this.element.className = `input-tile ${state.type}`;
    this.element.dataset.id = state.id;

    this.labelEl = document.createElement('div');
    this.labelEl.className = 'tile-label';
    this.labelEl.textContent = state.label;

    this.timestampEl = document.createElement('div');
    this.timestampEl.className = 'tile-timestamp';
    this.timestampEl.style.display = showTimestamps ? 'block' : 'none';

    this.durationEl = document.createElement('div');
    this.durationEl.className = 'tile-duration';
    this.durationEl.style.display = showDuration ? 'block' : 'none';

    this.holdBar = document.createElement('div');
    this.holdBar.className = 'hold-bar';

    this.element.appendChild(this.labelEl);
    this.element.appendChild(this.timestampEl);
    this.element.appendChild(this.durationEl);
    this.element.appendChild(this.holdBar);

    // Start with active state
    this.element.classList.add('active');
  }

  update(state: InputState): void {
    if (state.pressed) {
      this.element.classList.add('active');
      this.element.classList.remove('fading');

      const time = new Date(state.pressedAt);
      this.timestampEl.textContent = formatTime(time);
      this.durationEl.textContent = formatDuration(state.pressDuration);

      // Hold bar fills over 5 seconds
      const pct = Math.min(state.pressDuration / 5000 * 100, 100);
      this.holdBar.style.width = `${pct}%`;
    } else {
      this.element.classList.remove('active');
      this.element.classList.add('fading');

      // Keep final timestamp and duration
      if (state.pressedAt > 0) {
        const time = new Date(state.pressedAt);
        this.timestampEl.textContent = formatTime(time);
        this.durationEl.textContent = formatDuration(state.pressDuration);
      }

      this.holdBar.style.width = '0%';
    }
  }

  get id(): string {
    return this._id;
  }
}

function formatTime(date: Date): string {
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');

  if (clockFormat === '12h') {
    let h = date.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m}:${s}.${ms} ${ampm}`;
  }

  const h = date.getHours().toString().padStart(2, '0');
  return `${h}:${m}:${s}.${ms}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
