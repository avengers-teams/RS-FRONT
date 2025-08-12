import { mergeConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import baseConfig from './vite.config.base';

export default mergeConfig(
  {
    mode: 'development',
    plugins: [vueDevTools({ launchEditor: 'webstorm' })],
    server: {
      host: '0.0.0.0',
      port: 5173,
      fs: {
        strict: true,
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  },
  baseConfig
);
