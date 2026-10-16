import { test, expect, type FrameLocator, type Page } from '@playwright/test';
import { usuarioUnico } from './helpers';

// Pago con tarjeta en MODO TEST de Stripe. Solo se ejecuta si el backend tiene Stripe
// activado (TIENDA_STRIPE_SECRET_KEY / TIENDA_STRIPE_PUBLISHABLE_KEY con claves de test);
// si no, el carrito muestra el botón clásico y estos tests se saltan.
// Tarjetas de prueba: https://docs.stripe.com/testing

async function irAlPago(page: Page) {
  const usuario = usuarioUnico();
  await page.goto('/registro');
  await page.getByTestId('registro-nombre').fill(usuario.nombre);
  await page.getByTestId('registro-email').fill(usuario.email);
  await page.getByTestId('registro-username').fill(usuario.username);
  await page.getByTestId('registro-password').fill(usuario.password);
  await page.getByTestId('registro-submit').click();
  await expect(page).toHaveURL('/');

  await page.getByTestId('producto-card').filter({ hasText: 'Ratón inalámbrico' }).getByTestId('anadir-carrito').click();
  await page.getByTestId('nav-carrito').click();

  const conTarjeta = page.getByTestId('pagar-con-tarjeta');
  await expect(conTarjeta.or(page.getByTestId('finalizar-pedido'))).toBeVisible();
  test.skip((await conTarjeta.count()) === 0, 'El backend no tiene Stripe configurado en este entorno');

  await conTarjeta.click();
  await expect(page.getByTestId('form-pago')).toBeVisible();
}

// El formulario de tarjeta vive en un iframe de js.stripe.com (otro origen).
function formularioStripe(page: Page): FrameLocator {
  return page.frameLocator('iframe[title="Campo de entrada seguro para el pago"]').first();
}

// Al completar el número, Stripe despliega (con animación) el bloque opcional de Link y el
// iframe cambia de alto. Si se hace clic en "Pagar" mientras tanto, el clic se pierde sin error:
// se espera a que la altura del iframe se estabilice.
async function esperarAIframeEstable(page: Page) {
  const iframe = page.locator('iframe[title="Campo de entrada seguro para el pago"]').first();
  let anterior = -1;
  await expect(async () => {
    const alto = (await iframe.boundingBox())?.height ?? 0;
    const estable = alto > 0 && alto === anterior;
    anterior = alto;
    expect(estable).toBe(true);
  }).toPass({ intervals: [400], timeout: 10_000 });
}

async function rellenarTarjeta(page: Page, numero: string) {
  const stripe = formularioStripe(page);
  await stripe.getByLabel('Número de tarjeta').fill(numero);
  await stripe.getByLabel('Fecha de caducidad').fill('12 / 34');
  await stripe.getByLabel('Código de seguridad').fill('123');
  // El país es obligatorio y llega sin seleccionar: sin él Stripe no deja pagar.
  await stripe.locator('select[name="country"]').selectOption({ label: 'España' });
  await esperarAIframeEstable(page);
}

test.describe('Pago con Stripe (modo test)', () => {
  // Con el formulario de Stripe desplegado, el botón "Pagar" queda por debajo del viewport por
  // defecto (720 px). En ese caso el scroll automático de Playwright hace que el clic se pierda sin
  // error (ni siquiera llega pointerdown a la página). Un viewport alto evita el problema.
  test.use({ viewport: { width: 1280, height: 1400 } });

  test('tarjeta 4242: el pago se cobra y el pedido se crea', async ({ page }) => {
    await irAlPago(page);
    await rellenarTarjeta(page, '4242424242424242');
    await page.getByTestId('pagar').click();

    await expect(page).toHaveURL('/mis-pedidos', { timeout: 30_000 });
    const pedido = page.getByTestId('pedido-card').first();
    await expect(pedido).toContainText('Ratón inalámbrico');
    await expect(pedido).toContainText('PENDIENTE');
  });

  test('tarjeta rechazada por fondos insuficientes: muestra el error y no crea pedido', async ({ page }) => {
    await irAlPago(page);
    await rellenarTarjeta(page, '4000000000009995');
    await page.getByTestId('pagar').click();

    await expect(page.getByTestId('pago-error')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('pago-error')).toContainText(/fondos/i);
    await expect(page).toHaveURL('/carrito');
    await expect(page.getByTestId('carrito-items')).toContainText('Ratón inalámbrico');
  });

  test('número de tarjeta incompleto: Stripe valida en el propio iframe', async ({ page }) => {
    await irAlPago(page);
    await rellenarTarjeta(page, '4242');
    await page.getByTestId('pagar').click();

    await expect(formularioStripe(page).getByText(/número de tarjeta.*incompleto/i)).toBeVisible();
    await expect(page).toHaveURL('/carrito');
  });

  // Tarjetas con 3D Secure 2: Stripe abre un modal con un iframe (three-ds-2-challenge) que a su vez
  // contiene OTRO iframe (testmode-acs.stripe.com) con los botones Complete / Fail. Hay que encadenar
  // dos frameLocator() (con Selenium: dos switchTo().frame() seguidos).
  function retoTresDS(page: Page): FrameLocator {
    return page.frameLocator('iframe[src*="three-ds-2-challenge"]').frameLocator('iframe');
  }

  test('3D Secure: completar el reto autentica el pago y crea el pedido', async ({ page }) => {
    await irAlPago(page);
    await rellenarTarjeta(page, '4000002500003155');
    await page.getByTestId('pagar').click();

    // El botón se ve antes de que su script esté listo: un clic demasiado pronto se pierde sin error,
    // así que se reintenta hasta que la página reaccione (en vez de dormir un tiempo fijo).
    await expect(async () => {
      const completar = retoTresDS(page).getByRole('button', { name: 'Complete' });
      if ((await completar.count()) > 0) await completar.click({ timeout: 2000 });
      await expect(page).toHaveURL('/mis-pedidos', { timeout: 5000 });
    }).toPass({ timeout: 40_000 });
    await expect(page.getByTestId('pedido-card').first()).toContainText('Ratón inalámbrico');
  });

  test('3D Secure: fallar el reto muestra un error y no crea pedido', async ({ page }) => {
    await irAlPago(page);
    await rellenarTarjeta(page, '4000002500003155');
    await page.getByTestId('pagar').click();

    await expect(async () => {
      const fallar = retoTresDS(page).getByRole('button', { name: 'Fail' });
      if ((await fallar.count()) > 0) await fallar.click({ timeout: 2000 });
      await expect(page.getByTestId('pago-error')).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 40_000 });
    await expect(page).toHaveURL('/carrito');
  });
});
