import { test, expect } from '@playwright/test';

test('login correcto redirige al catálogo y muestra el usuario en la barra', async ({ page }) => {
  await page.goto('/login');

  await page.getByTestId('login-username').fill('ana');
  await page.getByTestId('login-password').fill('ana123');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('nav-username')).toHaveText('ana');
});

test('login con contraseña incorrecta muestra un error y no navega', async ({ page }) => {
  await page.goto('/login');

  await page.getByTestId('login-username').fill('ana');
  await page.getByTestId('login-password').fill('contraseña-incorrecta');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toBeVisible();
  await expect(page).toHaveURL('/login');
});
