# KeyVisualizer

A cross-platform desktop application that displays active key presses and mouse input in real time as a transparent overlay. Inspired by gaming key displays like LabyMod's key overlay in Minecraft.

## Features

- **Every key captured** — Any key you press appears dynamically in the overlay, no configuration needed
- **Mouse input** — Left, right, middle clicks and scroll wheel are visualized with distinct colors
- **Timestamps** — See exactly when each input occurred (HH:MM:SS.ms format)
- **Hold duration** — Track how long each key/button is held, with a visual progress bar
- **Auto fade-out** — Released inputs fade away after a configurable delay (default 2s)
- **Transparent overlay** — Sits on top of other windows without interfering (click-through)
- **System tray** — Minimize to tray, toggle visibility, reposition the overlay
- **Cross-platform** — Works on Windows, macOS, and Linux

## Screenshots

*Coming soon*

## Installation

### From Releases

Download the latest release for your platform from the [Releases](https://github.com/8PotatoChip8/KeyVisualizer/releases) page.

### From Source

```bash
# Clone the repository
git clone https://github.com/8PotatoChip8/KeyVisualizer.git
cd KeyVisualizer

# Install dependencies
npm install

# Run in development mode
npm start

# Package for distribution
npm run make
```

### Platform Requirements

- **Windows** — No special permissions needed
- **macOS** — Grant Accessibility permission when prompted (required for global key capture)
- **Linux (X11)** — Install X11 development libraries: `sudo apt install libx11-dev libxtst-dev libxt-dev libxrandr-dev`
- **Linux (Wayland)** — Limited support; add your user to the `input` group for `/dev/input` access

## Usage

1. Launch KeyVisualizer — it starts as a transparent overlay (initially empty)
2. Press any key or click a mouse button — it appears as a tile in the overlay
3. Tiles glow while held and show timestamps + hold duration
4. After releasing, tiles fade out after 2 seconds
5. Right-click the system tray icon to:
   - **Show/Hide** the overlay
   - **Edit Position** — drag the overlay to a new position (auto-locks after 10 seconds)
   - **Quit** the application

### Input Types & Colors

| Input | Active Color |
|-------|-------------|
| Keyboard keys | Blue glow |
| Mouse buttons (LMB, RMB, MMB) | Orange glow |
| Scroll wheel | Green glow |

## Development

```bash
npm start       # Start in dev mode with hot reload
npm run lint    # Type-check with TypeScript
npm run make    # Build distributable packages
```

## Tech Stack

- [Electron](https://www.electronjs.org/) — Cross-platform desktop framework
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [uiohook-napi](https://github.com/nicholascapo/uiohook-napi) — Global keyboard & mouse event capture
- [electron-forge](https://www.electronforge.io/) — Packaging and distribution
- [electron-store](https://github.com/sindresorhus/electron-store) — Settings persistence

## License

[MIT](LICENSE)
