import { test, expect, type Page } from '@playwright/test';
import { usuarioUnico } from './helpers';

async function favoritar(page: Page, nombres: string[]) {
  await page.goto('/');
  for (const nombre of nombres) {
    await page.getByRole('button', { name: `Marcar ${nombre} como favorito` }).click();
  }
}

async function nombresFavoritos(page: Page) {
  return page.getByTestId('favorito-item').locator('span.flex-1').allInnerTexts();
}

test.describe('Lista de deseos: drag & drop y modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('tienda-favoritos'));
    await page.reload();
  });

  test('marcar favoritos usa aria-pressed y actualiza el contador de la barra', async ({ page }) => {
    await expect(page.getByTestId('producto-card').first()).toBeVisible();
    const boton = page.getByRole('button', { name: 'Marcar Teclado mecánico como favorito' });
    await expect(boton).toHaveAttribute('aria-pressed', 'false');

    await boton.click();
    await expect(boton).toHaveAttribute('aria-pressed', 'true');
    await expect(boton).toHaveText('♥ En favoritos');
    await expect(page.getByTestId('nav-favoritos')).toContainText('(1)');

    await boton.click();
    await expect(boton).toHaveAttribute('aria-pressed', 'false');
  });

  test('sin favoritos la página muestra el mensaje de lista vacía', async ({ page }) => {
    await page.getByTestId('nav-favoritos').click();
    await expect(page.getByTestId('favoritos-vacio')).toBeVisible();
  });

  test('arrastrar un favorito sobre otro cambia el orden y se conserva al recargar', async ({ page }) => {
    await expect(page.getByTestId('producto-card').first()).toBeVisible();
    await favoritar(page, ['Teclado mecánico', 'Ratón inalámbrico', 'Webcam Full HD']);
    await page.getByTestId('nav-favoritos').click();
    expect(await nombresFavoritos(page)).toEqual(['Teclado mecánico', 'Ratón inalámbrico', 'Webcam Full HD']);

    await page.getByTestId('favorito-item').nth(2).dragTo(page.getByTestId('favorito-item').nth(0));
    expect(await nombresFavoritos(page)).toEqual(['Webcam Full HD', 'Teclado mecánico', 'Ratón inalámbrico']);

    await page.reload();
    expect(await nombresFavoritos(page)).toEqual(['Webcam Full HD', 'Teclado mecánico', 'Ratón inalámbrico']);
  });

  test('el modal pide confirmación: cancelar conserva la lista y confirmar la vacía', async ({ page }) => {
    await expect(page.getByTestId('producto-card').first()).toBeVisible();
    await favoritar(page, ['Teclado mecánico']);
    await page.getByTestId('nav-favoritos').click();

    await page.getByRole('button', { name: 'Vaciar lista' }).click();
    const dialogo = page.getByRole('dialog', { name: '¿Vaciar la lista de deseos?' });
    await expect(dialogo).toBeVisible();

    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
    await expect(page.getByTestId('favorito-item')).toHaveCount(1);

    await page.getByRole('button', { name: 'Vaciar lista' }).click();
    await dialogo.getByRole('button', { name: 'Sí, vaciar' }).click();
    await expect(dialogo).toBeHidden();
    await expect(page.getByTestId('favoritos-vacio')).toBeVisible();
  });
});

test.describe('Subida de archivos: avatar', () => {
  test.beforeEach(async ({ page }) => {
    const usuario = usuarioUnico();
    await page.goto('/registro');
    await page.getByTestId('registro-nombre').fill(usuario.nombre);
    await page.getByTestId('registro-email').fill(usuario.email);
    await page.getByTestId('registro-username').fill(usuario.username);
    await page.getByTestId('registro-password').fill(usuario.password);
    await page.getByTestId('registro-submit').click();
    await page.getByTestId('nav-perfil').click();
  });

  // PNG de 1x1 píxel.
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  );

  test('subir un PNG válido muestra la vista previa y permite quitarla', async ({ page }) => {
    await expect(page.getByTestId('sin-avatar')).toBeVisible();

    await page.getByLabel('Foto de perfil').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG });
    await expect(page.getByRole('img', { name: /Avatar de e2e_/ })).toBeVisible();

    await page.getByRole('button', { name: 'Quitar foto' }).click();
    await expect(page.getByTestId('sin-avatar')).toBeVisible();
  });

  test('un formato no permitido muestra un error y no sube nada', async ({ page }) => {
    await page.getByLabel('Foto de perfil').setInputFiles({
      name: 'documento.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4'),
    });
    await expect(page.getByRole('alert')).toHaveText('Formato no válido: usa una imagen PNG o JPG.');
    await expect(page.getByTestId('sin-avatar')).toBeVisible();
  });

  test('una imagen de más de 1 MB muestra un error de tamaño', async ({ page }) => {
    await page.getByLabel('Foto de perfil').setInputFiles({
      name: 'grande.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(1024 * 1024 + 1),
    });
    await expect(page.getByRole('alert')).toHaveText('La imagen supera el tamaño máximo de 1 MB.');
  });
});

test('nueva pestaña: el enlace de términos se abre en otra página sin perder la actual', async ({ page, context }) => {
  await page.goto('/');
  const enlace = page.getByRole('link', { name: 'Términos y condiciones' });
  await expect(enlace).toHaveAttribute('target', '_blank');

  const [nueva] = await Promise.all([context.waitForEvent('page'), enlace.click()]);
  await nueva.waitForLoadState();

  await expect(nueva).toHaveURL(/\/terminos\.html$/);
  await expect(nueva.getByRole('heading', { name: 'Términos y condiciones' })).toBeVisible();
  await expect(page).toHaveURL('/');
  expect(context.pages()).toHaveLength(2);
});

test('scroll infinito: cada vez que el centinela entra en pantalla se carga otro lote', async ({ page }) => {
  await page.goto('/novedades');
  const items = page.getByTestId('novedad');
  await expect(items).toHaveCount(8);

  await page.getByTestId('centinela').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('estado-novedades')).toHaveText('Cargando más…');
  await expect(items).toHaveCount(16);

  // Seguir bajando hasta agotar las 30 novedades.
  await expect(async () => {
    await page.getByTestId('centinela').scrollIntoViewIfNeeded();
    await expect(items).toHaveCount(30, { timeout: 1000 });
  }).toPass({ timeout: 15_000 });

  await expect(page.getByTestId('estado-novedades')).toHaveText('No hay más novedades.');
});
