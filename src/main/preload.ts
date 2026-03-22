import { contextBridge, ipcRenderer } from 'electron';
import { KeyEvent, MouseButtonEvent, MouseWheelEvent, AppConfig, ElectronAPI } from '../shared/types';

const api: ElectronAPI = {
  onKeyEvent: (callback: (event: KeyEvent) => void) => {
    ipcRenderer.on('key-event', (_event, data: KeyEvent) => {
      callback(data);
    });
  },

  onMouseButton: (callback: (event: MouseButtonEvent) => void) => {
    ipcRenderer.on('mouse-button', (_event, data: MouseButtonEvent) => {
      callback(data);
    });
  },

  onMouseWheel: (callback: (event: MouseWheelEvent) => void) => {
    ipcRenderer.on('mouse-wheel', (_event, data: MouseWheelEvent) => {
      callback(data);
    });
  },

  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config: Partial<AppConfig>) => ipcRenderer.invoke('set-config', config),

  setEditMode: (enabled: boolean) => {
    ipcRenderer.send('set-edit-mode', enabled);
  },

  onEditModeChanged: (callback: (enabled: boolean) => void) => {
    ipcRenderer.on('edit-mode-changed', (_event, enabled: boolean) => {
      callback(enabled);
    });
  },

  onConfigChanged: (callback: (config: AppConfig) => void) => {
    ipcRenderer.on('config-changed', (_event, config: AppConfig) => {
      callback(config);
    });
  },

};

contextBridge.exposeInMainWorld('electronAPI', api);
