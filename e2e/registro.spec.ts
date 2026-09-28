import { test, expect } from '@playwright/test';
import { usuarioUnico } from './helpers';

test('registrar un cliente nuevo hace login automático', async ({ page }) => {
  const usuario = usuarioUnico();

  await page.goto('/registro');
  await page.getByTestId('registro-nombre').fill(usuario.nombre);
  await page.getByTestId('registro-email').fill(usuario.email);
  await page.getByTestId('registro-username').fill(usuario.username);
  await page.getByTestId('registro-password').fill(usuario.password);
  await page.getByTestId('registro-submit').click();

  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('nav-username')).toHaveText(usuario.username);
});

test('registrar dos veces el mismo usuario muestra un error de duplicado', async ({ page }) => {
  const usuario = usuarioUnico();

  async function enviarRegistro() {
    await page.goto('/registro');
    await page.getByTestId('registro-nombre').fill(usuario.nombre);
    await page.getByTestId('registro-email').fill(usuario.email);
    await page.getByTestId('registro-username').fill(usuario.username);
    await page.getByTestId('registro-password').fill(usuario.password);
    await page.getByTestId('registro-submit').click();
  }

  await enviarRegistro();
  await expect(page).toHaveURL('/');

  // el mismo username otra vez debe fallar, no crear una segunda cuenta
  await page.getByTestId('nav-logout').click();
  await enviarRegistro();
  await expect(page.getByTestId('registro-error')).toBeVisible();
  await expect(page).toHaveURL('/registro');
});
