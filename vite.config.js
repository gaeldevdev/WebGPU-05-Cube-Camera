import { defineConfig } from 'vite';

import requireTransform from 'vite-plugin-require-transform';

export default defineConfig({
  plugins: [
    // passing string type Regular expression
    requireTransform({}),
  ],
});
