import type { ForgeConfig } from '@electron-forge/shared-types';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerZIP } from '@electron-forge/maker-zip';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'KeyVisualizer',
    executableName: 'keyvisualizer',
    icon: './assets/icon',
  },
  rebuildConfig: {
    onlyModules: [], // Skip native rebuild; uiohook-napi ships prebuilt binaries
  },
  makers: [
    // Windows: produces a Setup.exe installer (double-click to install)
    new MakerSquirrel({
      name: 'KeyVisualizer',
      setupIcon: './assets/icon.ico',
    }),
    // macOS: produces a .dmg (double-click to install)
    new MakerDMG({
      name: 'KeyVisualizer',
      icon: './assets/icon.icns',
    }),
    // Linux: .deb package
    new MakerDeb({
      options: {
        name: 'keyvisualizer',
        productName: 'KeyVisualizer',
        maintainer: '8PotatoChip8',
        homepage: 'https://github.com/8PotatoChip8/KeyVisualizer',
        description: 'Real-time keyboard and mouse input visualizer overlay',
        categories: ['Utility'],
      },
    }),
    // Universal zip fallback for all platforms
    new MakerZIP({}, ['darwin', 'linux', 'win32']),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: '8PotatoChip8',
          name: 'KeyVisualizer',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/app.ts',
            name: 'main_window',
            preload: {
              js: './src/main/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;
