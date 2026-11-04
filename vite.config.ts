import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Renombra el index.html generado a stack-craft.html.
function renombrarHtml(): Plugin {
  return {
    name: 'renombrar-html',
    enforce: 'post',
    generateBundle(_opciones, bundle) {
      const html = bundle['index.html'];
      if (html) {
        html.fileName = 'stack-craft.html';
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), viteSingleFile(), renombrarHtml()],
  test: {
    include: ['src/motor/**/*.test.ts'],
  },
});
