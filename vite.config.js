import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    lib: {
      entry: './index.js',
      name: 'WebComponentKit',
      formats: ['es'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      // Bundle @vue/reactivity into the library
      external: [],
    }
  }
});
