import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], fileParallelism: false, env: { DATA_MODE: 'local' } },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
});
