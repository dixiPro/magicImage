import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

/**
 * This config builds the local demo page only. The component itself needs no
 * build: it ships as source and is compiled by the bundler of the project that
 * installs it.
 *
 * Every path here points into MagicPro, the project this component grew in:
 * `vue` and `vue-advanced-cropper` are taken from its node_modules (two copies
 * of Vue in one page break reactivity), and the build lands in its public
 * folder. Somewhere else these paths mean nothing — set them to your own
 * folders, or drop this file and look at the demo in the repository.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      vue: resolve(__dirname, '../../../node_modules/vue'),
      'vue-advanced-cropper': resolve(__dirname, '../../../node_modules/vue-advanced-cropper'),
    },
    dedupe: ['vue'],
  },
  build: {
    outDir: '../../../../../../public/magic-image',
    emptyOutDir: true,

    // names without a hash: a site page links the built bundle with a plain
    // <script>, so the address must not change from build to build
    rollupOptions: {
      output: {
        entryFileNames: 'magic-image.js',
        chunkFileNames: 'magic-image-[name].js',
        assetFileNames: 'magic-image.[ext]',
      },
    },
  },
  base: '/magic-image/',
});
