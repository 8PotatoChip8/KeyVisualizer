import { app, BrowserWindow, screen, shell, net } from 'electron';

const REPO_OWNER = '8PotatoChip8';
const REPO_NAME = 'KeyVisualizer';

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  hasUpdate: boolean;
}

let cachedUpdateInfo: UpdateInfo | null = null;
let toastWindow: BrowserWindow | null = null;

/**
 * Check GitHub releases for a newer version.
 * Returns UpdateInfo with hasUpdate=true if a newer release exists.
 */
export async function checkForUpdates(): Promise<UpdateInfo> {
  const currentVersion = app.getVersion();

  try {
    const data = await fetchLatestRelease();
    const latestTag = data.tag_name.replace(/^v/, '');
    const hasUpdate = compareVersions(latestTag, currentVersion) > 0;

    cachedUpdateInfo = {
      currentVersion,
      latestVersion: latestTag,
      releaseUrl: data.html_url,
      hasUpdate,
    };

    return cachedUpdateInfo;
  } catch {
    return {
      currentVersion,
      latestVersion: currentVersion,
      releaseUrl: '',
      hasUpdate: false,
    };
  }
}

export function getCachedUpdateInfo(): UpdateInfo | null {
  return cachedUpdateInfo;
}

export function openReleasePage(): void {
  if (cachedUpdateInfo?.releaseUrl) {
    shell.openExternal(cachedUpdateInfo.releaseUrl);
  }
}

/**
 * Auto-check on startup after a delay, and show toast if update available.
 */
export function initAutoUpdateCheck(): void {
  setTimeout(async () => {
    const info = await checkForUpdates();
    if (info.hasUpdate) {
      showUpdateToast(info);
    }
  }, 5000);
}

// --- Toast notification window ---

function showUpdateToast(info: UpdateInfo): void {
  if (toastWindow) return;

  const display = screen.getPrimaryDisplay();
  const toastWidth = 310;
  const toastHeight = 80;
  const padding = 20;
  const x = display.workArea.x + display.workArea.width - toastWidth - padding;
  const y = display.workArea.y + display.workArea.height - toastHeight - padding;

  toastWindow = new BrowserWindow({
    width: toastWidth,
    height: toastHeight,
    x,
    y,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    transparent: false,
    backgroundColor: '#1e1e2a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  toastWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getToastHTML(info)));

  toastWindow.on('closed', () => {
    toastWindow = null;
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (toastWindow && !toastWindow.isDestroyed()) {
      toastWindow.close();
    }
  }, 10000);
}

function getToastHTML(info: UpdateInfo): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Update Available</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;background:#1e1e2a;color:#c8c8d2;padding:12px 14px;display:flex;align-items:center;gap:12px;height:100vh;user-select:none}
.icon{font-size:22px;flex-shrink:0}
.content{flex:1;min-width:0}
.title{font-size:12px;font-weight:700;color:rgba(180,200,255,0.95)}
.subtitle{font-size:10px;color:rgba(140,150,180,0.7);margin-top:2px}
.actions{display:flex;gap:6px;margin-top:6px}
.btn{height:24px;border:none;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;padding:0 10px;transition:background 100ms ease}
.btn-update{background:rgba(60,180,100,0.85);color:#fff}
.btn-update:hover{background:rgba(70,200,110,0.95)}
.close-x{position:absolute;top:6px;right:8px;background:none;border:none;color:rgba(140,150,180,0.6);font-size:16px;cursor:pointer;line-height:1;padding:2px}
.close-x:hover{color:rgba(200,200,210,0.9)}
</style></head><body>
<div class="icon">&#x2B06;&#xFE0F;</div>
<div class="content">
  <div class="title">Update Available — v${info.latestVersion}</div>
  <div class="subtitle">You're on v${info.currentVersion}</div>
  <div class="actions">
    <button class="btn btn-update" id="btn-download">Download Update</button>
  </div>
</div>
<button class="close-x" id="btn-close">&times;</button>
<script>
const{ipcRenderer}=require('electron');
document.getElementById('btn-download').addEventListener('click',()=>{
  ipcRenderer.send('open-update-page');
  window.close();
});
document.getElementById('btn-close').addEventListener('click',()=>window.close());
</script></body></html>`;
}

// --- GitHub API fetch ---

function fetchLatestRelease(): Promise<{ tag_name: string; html_url: string }> {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: 'GET',
      url: `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
    });

    request.setHeader('Accept', 'application/vnd.github.v3+json');
    request.setHeader('User-Agent', `KeyVisualizer/${app.getVersion()}`);

    let body = '';

    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`GitHub API returned ${response.statusCode}`));
        return;
      }
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    request.on('error', reject);
    request.end();
  });
}

// --- Semver comparison ---

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
