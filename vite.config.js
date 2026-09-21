import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

/**
 * Own build of the playground: MagicPro builds the admin panel, this one
 * builds the page where the component is poked by hand.
 *
 * vue comes from the node_modules of the package: two copies of Vue in one
 * page break reactivity, and the alias keeps it single.
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
