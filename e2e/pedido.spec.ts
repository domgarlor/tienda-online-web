import { test, expect } from '@playwright/test';
import { usuarioUnico } from './helpers';

test('un cliente logueado puede añadir al carrito y completar un pedido', async ({ page }) => {
  // Usuario desechable en vez de la cuenta semilla "luis": así el test se puede
  // repetir contra producción sin ir acumulando pedidos en una cuenta de demo real.
  const usuario = usuarioUnico();
  await page.goto('/registro');
  await page.getByTestId('registro-nombre').fill(usuario.nombre);
  await page.getByTestId('registro-email').fill(usuario.email);
  await page.getByTestId('registro-username').fill(usuario.username);
  await page.getByTestId('registro-password').fill(usuario.password);
  await page.getByTestId('registro-submit').click();
  await expect(page).toHaveURL('/');

  const tarjetaRaton = page.getByTestId('producto-card').filter({ hasText: 'Ratón inalámbrico' });
  await tarjetaRaton.getByTestId('anadir-carrito').click();

  await page.getByTestId('nav-carrito').click();
  await expect(page).toHaveURL('/carrito');
  await expect(page.getByTestId('carrito-items')).toContainText('Ratón inalámbrico');

  await page.getByTestId('finalizar-pedido').click();

  await expect(page).toHaveURL('/mis-pedidos');
  const primerPedido = page.getByTestId('pedido-card').first();
  await expect(primerPedido).toContainText('Ratón inalámbrico');
  await expect(primerPedido).toContainText('PENDIENTE');
});

test('sin sesión, el carrito pide iniciar sesión en vez de dejar pagar', async ({ page }) => {
  await page.goto('/');

  const tarjetaTeclado = page.getByTestId('producto-card').filter({ hasText: 'Teclado mecánico' });
  await tarjetaTeclado.getByTestId('anadir-carrito').click();

  await page.getByTestId('nav-carrito').click();
  await expect(page.getByTestId('carrito-necesita-login')).toBeVisible();
  await expect(page.getByTestId('finalizar-pedido')).toHaveCount(0);
});
