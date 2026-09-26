import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts', 'src/**/*.tsx'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  sourcemap: true,
  splitting: false,
  bundle: false,
  // dist is cleaned by scripts/build.mjs before the passes start — cleaning
  // here instead would wipe the declarations tsc emits alongside us.
  clean: false,
  dts: false,
  shims: false,
});
