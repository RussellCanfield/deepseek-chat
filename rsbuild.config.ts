import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [
    pluginReact()
  ],
  html: {
    title: 'React App',
  },
  tools: {
    rspack: {
      resolve: {
        fallback: {
          'fs': false,
          'path': false,
          'os': false,
        }
      }
    }
  },
  dev: {
    port: 3000,
    open: true,
  },
  output: {
    target: 'web',
    clean: true,
    distPath: {
      root: 'dist',
      js: 'static/js',
      css: 'static/css',
      assets: 'static/assets',
    },
  },
});