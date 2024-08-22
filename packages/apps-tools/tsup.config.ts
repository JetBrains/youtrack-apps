import {defineConfig} from 'tsup';

export default defineConfig({
  entryPoints: ['src/cli/index.ts'],
  format: ['cjs'],
  clean: true,
});
