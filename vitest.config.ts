import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.interface.ts',
        'src/**/*.dto.ts',
        'src/**/*.entity.ts'
      ]
    },
    setupFiles: ['./test/setup.ts'],
    server: {
      deps: {
        inline: [
          "@nestjs/core",
          "@nestjs/common",
          "@nestjs/platform-express"
        ]
      }
    }
  },
  plugins: [tsconfigPaths()],
});




