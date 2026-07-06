import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@shared': `${root}shared/src` },
  },
  test: {
    include: ['shared/test/**/*.test.ts', 'server/test/**/*.test.ts', 'app/test/**/*.test.ts'],
  },
});
