import Store from 'electron-store';
import { AppConfig } from '../shared/types';
import { DEFAULT_CONFIG } from '../shared/constants';

const store = new Store<AppConfig>({
  defaults: DEFAULT_CONFIG,
});

export function getConfig(): AppConfig {
  return {
    theme: store.get('theme'),
    overlayX: store.get('overlayX'),
    overlayY: store.get('overlayY'),
    overlayOpacity: store.get('overlayOpacity'),
    showTimestamps: store.get('showTimestamps'),
    showDuration: store.get('showDuration'),
    clickThrough: store.get('clickThrough'),
    fadeOutDelay: store.get('fadeOutDelay'),
    showMouseButtons: store.get('showMouseButtons'),
    showMouseScroll: store.get('showMouseScroll'),
    scale: store.get('scale'),
    chromaKeyColor: store.get('chromaKeyColor'),
    overlayTileOpaque: store.get('overlayTileOpaque'),
    captureTileOpaque: store.get('captureTileOpaque'),
  };
}

export function setConfig(partial: Partial<AppConfig>): void {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key as keyof AppConfig, value);
  }
}
