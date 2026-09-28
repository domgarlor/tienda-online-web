import { test, expect } from '@playwright/test';

test('el catálogo es público y muestra los productos sembrados', async ({ page }) => {
  await page.goto('/');

  const productos = page.getByTestId('producto-card');
  await expect(productos.first()).toBeVisible();
  await expect(productos).toHaveCount(await productos.count());
  expect(await productos.count()).toBeGreaterThan(0);

  await expect(page.getByText('Teclado mecánico')).toBeVisible();
});

test('un visitante sin sesión ve los enlaces de entrar y crear cuenta', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('nav-login')).toBeVisible();
  await expect(page.getByTestId('nav-registro')).toBeVisible();
  await expect(page.getByTestId('nav-username')).toHaveCount(0);
});
