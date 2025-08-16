import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 20000, // Tiempo mayor para tests E2E

    //setupFiles: ['./test/setup-e2e.ts'], // Si tienes un archivo de setup
  },
  plugins: [tsconfigPaths()],
});
