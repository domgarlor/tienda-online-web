import { defineConfig, devices } from '@playwright/test';

// Config para correr los mismos tests E2E contra el entorno de PRE.
const PRE_URL = process.env.PRE_URL ?? 'https://tienda-online-web-git-pre-nos18.vercel.app';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] : 'list',
  timeout: 60_000,
  // El wake-up solo confirma que /api/productos responde; la primera petición
  // "de verdad" (login, con BCrypt + JPA) puede seguir siendo lenta justo
  // después de despertar. Timeout de aserciones más largo que el default
  // (5s) para no depender de la suerte del timing tras un cold start.
  expect: { timeout: 15_000 },
  globalSetup: './e2e/wake-up-backend-pre.ts',
  use: {
    baseURL: PRE_URL,
    trace: 'retain-on-failure',
    launchOptions: {
      slowMo: process.env.PW_SLOWMO ? Number(process.env.PW_SLOWMO) : undefined,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
