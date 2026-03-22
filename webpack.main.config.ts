import type { Configuration } from 'webpack';

export const mainConfig: Configuration = {
  entry: './src/main/main.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.json'],
  },
  externals: {
    'uiohook-napi': 'commonjs uiohook-napi',
  },
};
