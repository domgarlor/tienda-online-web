import { test, expect } from '@playwright/test';

test('una ruta protegida sin sesión redirige a login', async ({ page }) => {
  await page.goto('/mis-pedidos');
  await expect(page).toHaveURL('/login');
});

test('cerrar sesión limpia el estado y vuelve a proteger la ruta', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-username').fill('ana');
  await page.getByTestId('login-password').fill('ana123');
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL('/');

  await page.getByTestId('nav-logout').click();
  await expect(page.getByTestId('nav-login')).toBeVisible();

  await page.goto('/mis-pedidos');
  await expect(page).toHaveURL('/login');
});
