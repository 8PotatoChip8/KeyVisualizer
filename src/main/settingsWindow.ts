import { app, BrowserWindow, screen } from 'electron';
import { getConfig } from './store';
import { AppConfig } from '../shared/types';
import { getProfiles, getActiveProfileName } from './profileStore';

let settingsWindow: BrowserWindow | null = null;

export function openSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  const display = screen.getPrimaryDisplay();
  const panelWidth = 360;
  const panelHeight = 800;
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
  const profiles = getProfiles();
  const activeProfile = getActiveProfileName();
  const currentVersion = app.getVersion();
  settingsWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(
    getSettingsHTML(config, profiles.map(p => p.name), activeProfile, currentVersion)
  ));

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

function getSettingsHTML(config: AppConfig, profileNames: string[], activeProfile: string | null, currentVersion: string): string {
  const profileOptions = profileNames.map(n =>
    `<option value="${n}"${n === activeProfile ? ' selected' : ''}>${n}</option>`
  ).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Settings</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;background:#1e1e2a;color:#c8c8d2;padding:16px;user-select:none;overflow-y:auto;height:100vh}
h2{font-size:15px;color:rgba(180,200,255,0.95);margin-bottom:14px;text-align:center}
.section{margin-bottom:14px}
.section-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(140,150,180,0.7);margin-bottom:6px}
.divider{height:1px;background:rgba(100,120,180,0.2);margin:4px 0 10px}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:5px 0}
.toggle-label{font-size:12px;color:rgba(200,200,210,0.9)}
.toggle-sublabel{font-size:10px;color:rgba(140,150,180,0.6);margin-top:1px}
.toggle{position:relative;width:40px;height:22px;flex-shrink:0}
.toggle input{opacity:0;width:0;height:0}
.toggle .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:rgba(80,80,100,0.6);border-radius:11px;transition:background 150ms ease}
.toggle .slider:before{content:'';position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:transform 150ms ease}
.toggle input:checked+.slider{background:rgba(60,180,100,0.85)}
.toggle input:checked+.slider:before{transform:translateX(18px)}
.preset-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:6px}
.color-btn{height:28px;border:2px solid rgba(100,120,180,0.4);border-radius:4px;cursor:pointer;transition:border-color 100ms ease,transform 80ms ease;position:relative}
.color-btn:hover{transform:scale(1.05)}
.color-btn.selected{border-color:#fff}
.color-btn .label{position:absolute;bottom:1px;left:0;right:0;text-align:center;font-size:8px;color:#fff;text-shadow:0 0 3px rgba(0,0,0,0.8)}
.custom-color-row{display:flex;align-items:center;gap:8px;margin-top:4px}
.custom-color-row label{font-size:11px;color:rgba(180,200,255,0.8)}
.color-picker{width:36px;height:26px;border:1px solid rgba(100,120,180,0.5);border-radius:4px;cursor:pointer;background:none;padding:0}
.color-hex{font-size:11px;font-family:'Consolas','Monaco',monospace;color:rgba(180,200,255,0.9);background:rgba(50,60,80,0.8);border:1px solid rgba(100,120,180,0.4);border-radius:4px;padding:3px 6px;width:74px}
.color-row{display:flex;align-items:center;gap:8px;padding:4px 0}
.color-row-label{font-size:12px;color:rgba(200,200,210,0.9);min-width:70px}
.color-swatch{width:20px;height:20px;border-radius:4px;border:1px solid rgba(100,120,180,0.4)}
.scale-row{display:flex;align-items:center;gap:8px;margin-top:4px}
.scale-slider{flex:1;-webkit-appearance:none;height:6px;border-radius:3px;background:rgba(50,60,80,0.8);outline:none}
.scale-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:rgba(100,160,255,0.9);cursor:pointer}
.scale-value{font-size:11px;color:rgba(180,200,255,0.9);min-width:36px;text-align:right}
.btn{height:28px;border:none;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;padding:0 12px;transition:background 100ms ease}
.btn-primary{background:rgba(60,120,220,0.8);color:#fff}
.btn-primary:hover{background:rgba(70,140,240,0.9)}
.btn-danger{background:rgba(200,60,60,0.7);color:#fff}
.btn-danger:hover{background:rgba(220,70,70,0.85)}
.btn-secondary{background:rgba(80,90,120,0.6);color:rgba(200,200,210,0.9)}
.btn-secondary:hover{background:rgba(100,110,140,0.8)}
.btn-reset{background:rgba(100,90,60,0.6);color:rgba(220,200,160,0.9);font-size:10px;height:24px;padding:0 8px}
.btn-reset:hover{background:rgba(120,110,70,0.8)}
.profile-row{display:flex;gap:4px;align-items:center}
.profile-select{flex:1;height:28px;background:rgba(50,60,80,0.8);border:1px solid rgba(100,120,180,0.4);border-radius:4px;color:rgba(200,200,210,0.9);font-size:11px;padding:0 6px}
.profile-input{flex:1;height:28px;background:rgba(50,60,80,0.8);border:1px solid rgba(100,120,180,0.4);border-radius:4px;color:rgba(200,200,210,0.9);font-size:11px;padding:0 6px}
.profile-actions{display:flex;gap:4px;margin-top:4px}
.close-btn{width:100%;height:32px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;background:rgba(80,90,120,0.6);color:rgba(200,200,210,0.9);transition:background 100ms ease;margin-top:10px}
.close-btn:hover{background:rgba(100,110,140,0.8)}
.update-row{display:flex;align-items:center;gap:8px;margin-top:6px}
.version-label{font-size:12px;color:rgba(180,200,255,0.9)}
.update-status{font-size:11px;color:rgba(140,150,180,0.7);margin-top:4px;min-height:16px}
.update-status.has-update{color:rgba(60,180,100,0.95)}
.btn-success{background:rgba(60,180,100,0.85);color:#fff}
.btn-success:hover{background:rgba(70,200,110,0.95)}
.spinner{display:inline-block;width:12px;height:12px;border:2px solid rgba(140,150,180,0.3);border-top-color:rgba(180,200,255,0.8);border-radius:50%;animation:spin 0.6s linear infinite;vertical-align:middle;margin-right:4px}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body>
<h2>Settings</h2>

<!-- Updates -->
<div class="section">
  <div class="section-label">Updates</div>
  <div class="version-label">Current version: v${currentVersion}</div>
  <div class="update-status" id="update-status">Checking for updates...</div>
  <div class="update-row">
    <button class="btn btn-primary" id="btn-check-update">Check for Updates</button>
    <button class="btn btn-success" id="btn-download-update" style="display:none">Download Update</button>
  </div>
</div>

<div class="divider"></div>

<!-- Clock Format -->
<div class="section">
  <div class="section-label">Clock Format</div>
  <div class="toggle-row">
    <div>
      <div class="toggle-label">12-hour clock (AM/PM)</div>
    </div>
    <label class="toggle">
      <input type="checkbox" id="clock-12h" ${config.clockFormat === '12h' ? 'checked' : ''}>
      <span class="slider"></span>
    </label>
  </div>
</div>

<div class="divider"></div>

<!-- Scale -->
<div class="section">
  <div class="section-label">Scale</div>
  <div class="scale-row">
    <input type="range" class="scale-slider" id="scale-slider" min="50" max="200" step="5" value="${config.scale}">
    <span class="scale-value" id="scale-value">${config.scale}%</span>
  </div>
</div>

<div class="divider"></div>

<!-- Tile Colors -->
<div class="section">
  <div class="section-label">Tile Colors</div>
  <div class="color-row">
    <span class="color-row-label">Keyboard</span>
    <input type="color" class="color-picker" id="color-key" value="${config.colorKey}">
    <div class="color-swatch" id="swatch-key" style="background:${config.colorKey}"></div>
  </div>
  <div class="color-row">
    <span class="color-row-label">Mouse</span>
    <input type="color" class="color-picker" id="color-mouse" value="${config.colorMouse}">
    <div class="color-swatch" id="swatch-mouse" style="background:${config.colorMouse}"></div>
  </div>
  <div class="color-row">
    <span class="color-row-label">Scroll</span>
    <input type="color" class="color-picker" id="color-scroll" value="${config.colorScroll}">
    <div class="color-swatch" id="swatch-scroll" style="background:${config.colorScroll}"></div>
  </div>
  <button class="btn btn-reset" id="btn-reset-colors">Reset to Defaults</button>
</div>

<div class="divider"></div>

<!-- Recording Background Color -->
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

<!-- Tile Transparency -->
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

<div class="divider"></div>

<!-- Profiles -->
<div class="section">
  <div class="section-label">Profiles</div>
  <div class="profile-row">
    <select class="profile-select" id="profile-select">
      <option value="">-- Select Profile --</option>
      ${profileOptions}
    </select>
    <button class="btn btn-primary" id="btn-load-profile">Load</button>
    <button class="btn btn-danger" id="btn-delete-profile">Delete</button>
  </div>
  <div class="profile-row" style="margin-top:6px">
    <input type="text" class="profile-input" id="profile-name" placeholder="New profile name...">
    <button class="btn btn-primary" id="btn-save-profile">Save</button>
  </div>
</div>

<button class="close-btn" id="btn-close">Close</button>

<script>
const{ipcRenderer}=require('electron');
function setConf(obj){ipcRenderer.invoke('set-config',obj)}

// --- Clock format ---
document.getElementById('clock-12h').addEventListener('change',function(){
  setConf({clockFormat:this.checked?'12h':'24h'});
});

// --- Scale ---
const scaleSlider=document.getElementById('scale-slider');
const scaleLabel=document.getElementById('scale-value');
let ignoreScaleSync=false;
scaleSlider.addEventListener('input',()=>{
  scaleLabel.textContent=scaleSlider.value+'%';
  ignoreScaleSync=true;
  ipcRenderer.send('set-overlay-scale',parseInt(scaleSlider.value));
  setTimeout(()=>{ignoreScaleSync=false},200);
});

// --- Tile colors ---
const colorKeyPicker=document.getElementById('color-key');
const colorMousePicker=document.getElementById('color-mouse');
const colorScrollPicker=document.getElementById('color-scroll');
const swatchKey=document.getElementById('swatch-key');
const swatchMouse=document.getElementById('swatch-mouse');
const swatchScroll=document.getElementById('swatch-scroll');

colorKeyPicker.addEventListener('input',()=>{
  swatchKey.style.background=colorKeyPicker.value;
  setConf({colorKey:colorKeyPicker.value.toUpperCase()});
});
colorMousePicker.addEventListener('input',()=>{
  swatchMouse.style.background=colorMousePicker.value;
  setConf({colorMouse:colorMousePicker.value.toUpperCase()});
});
colorScrollPicker.addEventListener('input',()=>{
  swatchScroll.style.background=colorScrollPicker.value;
  setConf({colorScroll:colorScrollPicker.value.toUpperCase()});
});
document.getElementById('btn-reset-colors').addEventListener('click',()=>{
  const defaults={colorKey:'#3C78DC',colorMouse:'#DC6428',colorScroll:'#3CB478'};
  colorKeyPicker.value=defaults.colorKey;
  colorMousePicker.value=defaults.colorMouse;
  colorScrollPicker.value=defaults.colorScroll;
  swatchKey.style.background=defaults.colorKey;
  swatchMouse.style.background=defaults.colorMouse;
  swatchScroll.style.background=defaults.colorScroll;
  setConf(defaults);
});

// --- Recording background color ---
const presetBtns=document.querySelectorAll('.color-btn');
const customPicker=document.getElementById('custom-color');
const hexInput=document.getElementById('color-hex');

function selectChromaColor(color){
  presetBtns.forEach(b=>b.classList.toggle('selected',b.dataset.color===color));
  customPicker.value=color;
  hexInput.value=color.toUpperCase();
  setConf({chromaKeyColor:color.toUpperCase()});
}
presetBtns.forEach(b=>{
  b.addEventListener('click',()=>selectChromaColor(b.dataset.color));
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

// --- Transparency toggles ---
document.getElementById('overlay-opaque').addEventListener('change',function(){
  setConf({overlayTileOpaque:this.checked});
});
document.getElementById('capture-opaque').addEventListener('change',function(){
  setConf({captureTileOpaque:this.checked});
});

// --- Profiles ---
const profileSelect=document.getElementById('profile-select');
const profileNameInput=document.getElementById('profile-name');

document.getElementById('btn-save-profile').addEventListener('click',async()=>{
  const name=profileNameInput.value.trim();
  if(!name)return;
  await ipcRenderer.invoke('save-profile',name);
  // Refresh dropdown
  const profiles=await ipcRenderer.invoke('get-profiles');
  profileSelect.innerHTML='<option value="">-- Select Profile --</option>'+
    profiles.map(p=>'<option value="'+p.name+'"'+(p.name===name?' selected':'')+'>'+p.name+'</option>').join('');
  profileNameInput.value='';
});

document.getElementById('btn-load-profile').addEventListener('click',async()=>{
  const name=profileSelect.value;
  if(!name)return;
  const cfg=await ipcRenderer.invoke('load-profile',name);
  if(cfg) updateAllControls(cfg);
});

document.getElementById('btn-delete-profile').addEventListener('click',async()=>{
  const name=profileSelect.value;
  if(!name)return;
  await ipcRenderer.invoke('delete-profile',name);
  const profiles=await ipcRenderer.invoke('get-profiles');
  profileSelect.innerHTML='<option value="">-- Select Profile --</option>'+
    profiles.map(p=>'<option value="'+p.name+'">'+p.name+'</option>').join('');
});

// --- Sync from external config changes ---
ipcRenderer.on('config-changed',(_e,cfg)=>{
  if(!ignoreScaleSync){
    scaleSlider.value=cfg.scale;
    scaleLabel.textContent=cfg.scale+'%';
  }
});

function updateAllControls(cfg){
  // Clock
  document.getElementById('clock-12h').checked=cfg.clockFormat==='12h';
  // Scale
  scaleSlider.value=cfg.scale;
  scaleLabel.textContent=cfg.scale+'%';
  // Colors
  colorKeyPicker.value=cfg.colorKey;
  colorMousePicker.value=cfg.colorMouse;
  colorScrollPicker.value=cfg.colorScroll;
  swatchKey.style.background=cfg.colorKey;
  swatchMouse.style.background=cfg.colorMouse;
  swatchScroll.style.background=cfg.colorScroll;
  // Chroma
  customPicker.value=cfg.chromaKeyColor;
  hexInput.value=cfg.chromaKeyColor;
  presetBtns.forEach(b=>b.classList.toggle('selected',b.dataset.color===cfg.chromaKeyColor));
  // Opaque
  document.getElementById('overlay-opaque').checked=cfg.overlayTileOpaque;
  document.getElementById('capture-opaque').checked=cfg.captureTileOpaque;
}

// --- Updates ---
const updateStatus=document.getElementById('update-status');
const btnCheck=document.getElementById('btn-check-update');
const btnDownload=document.getElementById('btn-download-update');

async function doCheckUpdate(){
  updateStatus.innerHTML='<span class="spinner"></span> Checking for updates...';
  btnCheck.disabled=true;
  btnDownload.style.display='none';
  try{
    const info=await ipcRenderer.invoke('check-for-updates');
    if(info.hasUpdate){
      updateStatus.textContent='Update available: v'+info.latestVersion;
      updateStatus.className='update-status has-update';
      btnDownload.style.display='';
    }else{
      updateStatus.textContent='You are up to date!';
      updateStatus.className='update-status';
    }
  }catch(e){
    updateStatus.textContent='Could not check for updates.';
    updateStatus.className='update-status';
  }
  btnCheck.disabled=false;
}

// Check on open using cached info or fetch
(async()=>{
  const cached=await ipcRenderer.invoke('get-cached-update-info');
  if(cached){
    if(cached.hasUpdate){
      updateStatus.textContent='Update available: v'+cached.latestVersion;
      updateStatus.className='update-status has-update';
      btnDownload.style.display='';
    }else{
      updateStatus.textContent='You are up to date!';
      updateStatus.className='update-status';
    }
  }else{
    doCheckUpdate();
  }
})();

btnCheck.addEventListener('click',doCheckUpdate);
btnDownload.addEventListener('click',()=>ipcRenderer.send('open-update-page'));

document.getElementById('btn-close').addEventListener('click',()=>window.close());
</script></body></html>`;
}
