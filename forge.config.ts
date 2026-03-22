import type { ForgeConfig } from '@electron-forge/shared-types';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerZIP } from '@electron-forge/maker-zip';
import * as fs from 'fs';
import * as path from 'path';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

// Only reference icon files if they exist (they're generated in CI)
const hasIco = fs.existsSync('./assets/icon.ico');
const hasIcns = fs.existsSync('./assets/icon.icns');
const hasPng = fs.existsSync('./assets/icon.png');

// Recursively copy a directory
function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpack: '**/node_modules/uiohook-napi/**',
    },
    name: 'KeyVisualizer',
    executableName: 'keyvisualizer',
    ...(hasPng || hasIco || hasIcns ? { icon: './assets/icon' } : {}),
    afterCopy: [
      // Manually copy uiohook-napi into the packaged app since the
      // webpack plugin's automatic native module detection doesn't
      // reliably handle prebuilt binaries
      (buildPath: string, _electronVersion: string, _platform: string, _arch: string, callback: (err?: Error) => void) => {
        try {
          const srcModule = path.resolve('node_modules', 'uiohook-napi');
          const destModule = path.join(buildPath, 'node_modules', 'uiohook-napi');

          if (fs.existsSync(srcModule) && !fs.existsSync(destModule)) {
            console.log('afterCopy: copying uiohook-napi into package');
            copyDirSync(srcModule, destModule);
          }

          callback();
        } catch (err) {
          callback(err as Error);
        }
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'KeyVisualizer',
      ...(hasIco ? { setupIcon: './assets/icon.ico' } : {}),
    }),
    new MakerDMG({
      name: 'KeyVisualizer',
      ...(hasIcns ? { icon: './assets/icon.icns' } : {}),
    }),
    new MakerDeb({
      options: {
        name: 'keyvisualizer',
        productName: 'KeyVisualizer',
        maintainer: '8PotatoChip8',
        homepage: 'https://github.com/8PotatoChip8/KeyVisualizer',
        description: 'Real-time keyboard and mouse input visualizer overlay',
        categories: ['Utility'],
        ...(hasPng ? { icon: './assets/icon.png' } : {}),
      },
    }),
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
