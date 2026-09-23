import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * The demo page of the component: `npm run dev` opens it, `npm run build` puts
 * it into `dist/`. Nothing else is configured — the defaults of Vite are what
 * anyone cloning this repository expects.
 *
 * The component itself needs no build: it ships as source and is compiled by
 * the bundler of the project that installs it.
 */
export default defineConfig({
  plugins: [vue()],
});
