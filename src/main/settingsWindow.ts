import { BrowserWindow, screen } from 'electron';
import { getConfig } from './store';

let settingsWindow: BrowserWindow | null = null;

export function openSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  const display = screen.getPrimaryDisplay();
  const panelWidth = 340;
  const panelHeight = 420;
  const x = Math.round(display.workArea.x + (display.workArea.width - panelWidth) / 2);
  const y = Math.round(display.workArea.y + (display.workArea.height - panelHeight) / 2);

  settingsWindow = new BrowserWindow({
    width: panelWidth,
    height: panelHeight,
    x,
    y,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const config = getConfig();
  settingsWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getSettingsHTML(config)));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

export function closeSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.close();
    settingsWindow = null;
  }
}

interface SettingsConfig {
  chromaKeyColor: string;
  overlayTileOpaque: boolean;
  captureTileOpaque: boolean;
}

function getSettingsHTML(config: SettingsConfig): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Settings</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;background:#1e1e2a;color:#c8c8d2;padding:16px;user-select:none}
h2{font-size:15px;color:rgba(180,200,255,0.95);margin-bottom:16px;text-align:center}
.section{margin-bottom:18px}
.section-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(140,150,180,0.7);margin-bottom:8px}
.preset-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:8px}
.color-btn{height:32px;border:2px solid rgba(100,120,180,0.4);border-radius:4px;cursor:pointer;transition:border-color 100ms ease,transform 80ms ease;position:relative}
.color-btn:hover{transform:scale(1.05)}
.color-btn.selected{border-color:#fff;border-width:2px}
.color-btn .label{position:absolute;bottom:2px;left:0;right:0;text-align:center;font-size:8px;color:#fff;text-shadow:0 0 3px rgba(0,0,0,0.8)}
.custom-color-row{display:flex;align-items:center;gap:8px;margin-top:6px}
.custom-color-row label{font-size:11px;color:rgba(180,200,255,0.8)}
.color-picker{width:40px;height:28px;border:1px solid rgba(100,120,180,0.5);border-radius:4px;cursor:pointer;background:none;padding:0}
.color-hex{font-size:12px;font-family:'Consolas','Monaco',monospace;color:rgba(180,200,255,0.9);background:rgba(50,60,80,0.8);border:1px solid rgba(100,120,180,0.4);border-radius:4px;padding:4px 8px;width:80px}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0}
.toggle-label{font-size:12px;color:rgba(200,200,210,0.9)}
.toggle-sublabel{font-size:10px;color:rgba(140,150,180,0.6);margin-top:2px}
.toggle{position:relative;width:40px;height:22px;flex-shrink:0}
.toggle input{opacity:0;width:0;height:0}
.toggle .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:rgba(80,80,100,0.6);border-radius:11px;transition:background 150ms ease}
.toggle .slider:before{content:'';position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:transform 150ms ease}
.toggle input:checked+.slider{background:rgba(60,180,100,0.85)}
.toggle input:checked+.slider:before{transform:translateX(18px)}
.divider{height:1px;background:rgba(100,120,180,0.2);margin:4px 0 12px}
.close-btn{width:100%;height:34px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;background:rgba(80,90,120,0.6);color:rgba(200,200,210,0.9);transition:background 100ms ease;margin-top:8px}
.close-btn:hover{background:rgba(100,110,140,0.8)}
</style></head><body>
<h2>Settings</h2>

<div class="section">
  <div class="section-label">Recording Background Color</div>
  <div class="preset-grid">
    <button class="color-btn${config.chromaKeyColor === '#FF00FF' ? ' selected' : ''}" data-color="#FF00FF" style="background:#FF00FF"><span class="label">Magenta</span></button>
    <button class="color-btn${config.chromaKeyColor === '#00FF00' ? ' selected' : ''}" data-color="#00FF00" style="background:#00FF00"><span class="label">Green</span></button>
    <button class="color-btn${config.chromaKeyColor === '#0000FF' ? ' selected' : ''}" data-color="#0000FF" style="background:#0000FF"><span class="label">Blue</span></button>
    <button class="color-btn${config.chromaKeyColor === '#FF0000' ? ' selected' : ''}" data-color="#FF0000" style="background:#FF0000"><span class="label">Red</span></button>
    <button class="color-btn${config.chromaKeyColor === '#00FFFF' ? ' selected' : ''}" data-color="#00FFFF" style="background:#00FFFF"><span class="label">Cyan</span></button>
    <button class="color-btn${config.chromaKeyColor === '#000000' ? ' selected' : ''}" data-color="#000000" style="background:#000000;border-color:rgba(150,150,150,0.5)"><span class="label">Black</span></button>
  </div>
  <div class="custom-color-row">
    <label>Custom:</label>
    <input type="color" class="color-picker" id="custom-color" value="${config.chromaKeyColor}">
    <input type="text" class="color-hex" id="color-hex" value="${config.chromaKeyColor}" maxlength="7">
  </div>
</div>

<div class="divider"></div>

<div class="section">
  <div class="section-label">Tile Transparency</div>
  <div class="toggle-row">
    <div>
      <div class="toggle-label">Opaque tiles (Overlay)</div>
      <div class="toggle-sublabel">Remove transparency from tile backgrounds</div>
    </div>
    <label class="toggle">
      <input type="checkbox" id="overlay-opaque" ${config.overlayTileOpaque ? 'checked' : ''}>
      <span class="slider"></span>
    </label>
  </div>
  <div class="toggle-row">
    <div>
      <div class="toggle-label">Opaque tiles (Recording)</div>
      <div class="toggle-sublabel">Cleaner chroma key with no transparency bleed</div>
    </div>
    <label class="toggle">
      <input type="checkbox" id="capture-opaque" ${config.captureTileOpaque ? 'checked' : ''}>
      <span class="slider"></span>
    </label>
  </div>
</div>

<button class="close-btn" id="btn-close">Close</button>

<script>
const{ipcRenderer}=require('electron');
function setConf(obj){ipcRenderer.invoke('set-config',obj)}

// Color presets
const presetBtns=document.querySelectorAll('.color-btn');
const customPicker=document.getElementById('custom-color');
const hexInput=document.getElementById('color-hex');

function selectColor(color){
  presetBtns.forEach(b=>b.classList.toggle('selected',b.dataset.color===color));
  customPicker.value=color;
  hexInput.value=color.toUpperCase();
  setConf({chromaKeyColor:color.toUpperCase()});
}

presetBtns.forEach(b=>{
  b.addEventListener('click',()=>selectColor(b.dataset.color));
});

customPicker.addEventListener('input',()=>{
  presetBtns.forEach(b=>b.classList.remove('selected'));
  hexInput.value=customPicker.value.toUpperCase();
  setConf({chromaKeyColor:customPicker.value.toUpperCase()});
});

hexInput.addEventListener('change',()=>{
  let v=hexInput.value.trim();
  if(!v.startsWith('#'))v='#'+v;
  if(/^#[0-9A-Fa-f]{6}$/.test(v)){
    v=v.toUpperCase();
    hexInput.value=v;
    customPicker.value=v;
    presetBtns.forEach(b=>b.classList.toggle('selected',b.dataset.color===v));
    setConf({chromaKeyColor:v});
  }
});

// Transparency toggles
document.getElementById('overlay-opaque').addEventListener('change',function(){
  setConf({overlayTileOpaque:this.checked});
});
document.getElementById('capture-opaque').addEventListener('change',function(){
  setConf({captureTileOpaque:this.checked});
});

document.getElementById('btn-close').addEventListener('click',()=>window.close());
</script></body></html>`;
}
