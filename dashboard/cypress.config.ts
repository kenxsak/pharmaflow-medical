import { defineConfig } from 'cypress';
import customViteConfig from './vite.config';

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: customViteConfig,
    },
  },

  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // Implement custom node event listeners here if needed
      // For example:
      // on('task', {
      //   myCustomTask(data) {
      //     // handle custom task
      //     return data;
      //   }
      // });
    },
  },
});
