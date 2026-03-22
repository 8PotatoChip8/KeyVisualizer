# KeyVisualizer

A cross-platform desktop application that displays active key presses and mouse input in real time as a transparent overlay. Inspired by gaming key displays like LabyMod's key overlay in Minecraft.

## Features

- **Every key captured** — Any key you press appears dynamically in the overlay, no configuration needed
- **Mouse input** — Left, right, middle clicks and scroll wheel are visualized with distinct colors
- **Timestamps** — See exactly when each input occurred (HH:MM:SS.ms format)
- **Hold duration** — Track how long each key/button is held, with a visual progress bar
- **Auto fade-out** — Released inputs fade away after a configurable delay (default 2s)
- **Transparent overlay** — Sits on top of other windows without interfering (click-through)
- **Resolution-aware scaling** — Auto-scales based on screen resolution (normalized to 1080p) with adjustable scale slider (50%–200%)
- **Position presets** — Quickly snap the overlay to Top Left, Top Right, Bottom Left, Bottom Right, Center, or reset to default
- **OBS recording mode** — Companion capture window for seamless recording in OBS Studio (see [Recording with OBS](#recording-with-obs-studio))
- **Settings** — Customizable chroma key color, tile transparency options for both overlay and recording windows
- **System tray** — Minimize to tray, toggle visibility, reposition the overlay
- **Cross-platform** — Works on Windows, macOS, and Linux

## Screenshots

*Coming soon*

## Installation

### From Releases

Download the latest release for your platform from the [Releases](https://github.com/8PotatoChip8/KeyVisualizer/releases) page:

- **Windows** — `KeyVisualizer-1.0.0.Setup.exe` (installer) or `.zip` (portable)
- **macOS** — `KeyVisualizer.dmg`
- **Linux** — `keyvisualizer_1.0.0_amd64.deb` or `.zip`

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
- **Linux (Wayland)** — Add your user to the `input` group for `/dev/input` access:
  ```bash
  sudo usermod -aG input $USER
  ```
  Then log out and back in for the change to take effect.

## Usage

1. Launch KeyVisualizer — it starts as a transparent overlay (initially empty)
2. Press any key or click a mouse button — it appears as a tile in the overlay
3. Tiles glow while held and show timestamps + hold duration
4. After releasing, tiles fade out after 2 seconds
5. Right-click the system tray icon to access options

### System Tray Menu

| Option | Description |
|--------|-------------|
| **Show/Hide Overlay** | Toggle overlay visibility |
| **Edit Position** | Opens the edit panel — drag the overlay to reposition, use preset buttons, or adjust scale |
| **Recording Mode (OBS)** | Toggle companion capture window for OBS Studio recording |
| **Settings** | Open the settings window (chroma key color, tile transparency) |
| **Quit** | Exit the application |

### Edit Position Panel

When you click **Edit Position**, a control panel appears with:

- **Preset buttons** — Snap the overlay to Top Left, Top Right, Bottom Left, Bottom Right, Center, or Reset to default
- **Scale slider** — Adjust overlay size from 50% to 200%
- **Confirm** — Save the new position and scale
- **Cancel** — Revert to the previous position and scale

The overlay border becomes a dashed blue outline in edit mode so you can see its boundaries while dragging.

### Input Types & Colors

| Input | Active Color |
|-------|-------------|
| Keyboard keys | Blue glow |
| Mouse buttons (LMB, RMB, MMB) | Orange glow |
| Scroll wheel | Green glow |

### Settings

Open **Settings** from the system tray menu to configure:

- **Recording background color** — Choose from presets (Magenta, Green, Blue, Red, Cyan, Black) or pick a custom color. This is the chroma key color used by the recording window.
- **Opaque tiles (Overlay)** — Remove transparency from tile backgrounds in the main overlay
- **Opaque tiles (Recording)** — Remove transparency from tile backgrounds in the recording window for cleaner chroma keying

## Recording with OBS Studio

KeyVisualizer uses a transparent overlay window, which OBS **Window Capture** cannot see directly. To record the overlay in OBS:

1. **Enable Recording Mode** — Right-click the system tray icon and check **Recording Mode (OBS)**
2. **Add a Window Capture source** in OBS — Select **"KeyVisualizer [Recording]"** from the window list
3. **Add a Chroma Key filter** — Right-click the source in OBS → **Filters** → **+** → **Chroma Key**
   - Set **Key Color Type** to **Custom Color** and match the color in Settings (magenta `#FF00FF` by default)
   - Adjust **Similarity** and **Smoothness** until the background is fully removed
4. The overlay will now appear with a transparent background in your recording/stream

You will still see the normal transparent overlay on your screen — the colored-background window runs in the background purely for OBS to capture.

> **Tip:** Use **Chroma Key** rather than **Color Key** in OBS — it handles semi-transparent edges and anti-aliased borders better. If you want the cleanest possible result, enable **Opaque tiles (Recording)** in Settings to eliminate transparency bleed on tile backgrounds.

> **Tip:** OBS **Display Capture** can also capture the transparent overlay directly without recording mode, but it captures your entire screen. Use Recording Mode when you need to capture only the overlay as its own source.

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
