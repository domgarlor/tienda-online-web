import { defineConfig, devices } from '@playwright/test';

// Config separada para correr los mismos tests contra el entorno público real
// (Vercel + Render + Postgres), en vez de contra localhost. No arranca nada
// local: usa directamente las URLs de producción.
const PROD_URL = process.env.PROD_URL ?? 'https://tienda-online-web-three.vercel.app';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 60_000, // margen extra por si el backend gratuito de Render está despertando
  globalSetup: './e2e/wake-up-backend.ts',
  use: {
    baseURL: PROD_URL,
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
