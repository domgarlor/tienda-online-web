import { defineConfig, devices } from '@playwright/test';

// Config para correr los mismos tests E2E contra el entorno de PRE.
//
// IMPORTANTE: los valores por defecto de PRE_URL/PRE_API_URL son placeholders
// (Render y Vercel asignan sufijos aleatorios a la URL final si el nombre
// exacto no está libre, igual que pasó con producción). En cuanto tengas las
// URLs reales, o pásalas por variable de entorno al ejecutar los tests, o
// actualiza los valores por defecto aquí y en e2e/wake-up-backend-pre.ts.
const PRE_URL = process.env.PRE_URL ?? 'https://tienda-online-web-git-pre-nos18.vercel.app';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] : 'list',
  timeout: 60_000,
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
