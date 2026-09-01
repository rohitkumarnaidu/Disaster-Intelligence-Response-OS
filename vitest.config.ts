import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'artifacts/**/*.{test,spec}.{ts,tsx,js,jsx}',
      'lib/**/*.{test,spec}.{ts,tsx,js,jsx}',
      'tests/**/*.{test,spec}.{ts,tsx,js,jsx}',
    ],
    exclude: [
      '**/.agents/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
    ],
  },
  resolve: {
    alias: {
      '@workspace/db': path.resolve(__dirname, 'lib/db/src'),
      '@workspace/api-zod': path.resolve(__dirname, 'lib/api-zod/src'),
      '@workspace/api-client-react': path.resolve(__dirname, 'lib/api-client-react/src'),
    },
  },
});
