import {defineConfig} from 'tsup';

export default defineConfig({
  entryPoints: ['src', '!src/**/*.test.ts'],
  format: ['cjs'],
  clean: true,
  dts: true,
});
