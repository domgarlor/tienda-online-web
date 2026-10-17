import { test, expect } from '@playwright/test';

test.describe('Shadow DOM: widget de opiniones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('tienda-resenas'));
    await page.reload();
  });

  test('document.querySelector no ve dentro del shadow root, pero los locators de Playwright sí', async ({ page }) => {
    await expect(page.locator('tienda-resenas')).toBeVisible();
    expect(await page.evaluate(() => document.querySelector('[data-testid="lista-resenas"]'))).toBeNull();

    await expect(page.getByRole('heading', { name: 'Opiniones de clientes' })).toBeVisible();
    await expect(page.getByTestId('lista-resenas')).toBeAttached();
  });

  test('sin opiniones muestra el mensaje inicial', async ({ page }) => {
    await expect(page.getByTestId('media')).toHaveText('Aún no hay opiniones. ¡Sé el primero!');
  });

  test('publicar sin valoración o sin texto muestra un error', async ({ page }) => {
    await page.getByRole('button', { name: 'Publicar opinión' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Elige una valoración' })).toBeVisible();
    await expect(page.getByTestId('resena')).toHaveCount(0);
  });

  test('publicar una opinión la añade a la lista y actualiza la media', async ({ page }) => {
    await page.getByRole('radio', { name: '4 estrellas' }).click();
    await expect(page.getByRole('radio', { name: '4 estrellas' })).toHaveAttribute('aria-checked', 'true');
    await page.getByLabel('Tu opinión').fill('Muy buen teclado');
    await page.getByRole('button', { name: 'Publicar opinión' }).click();

    await expect(page.getByTestId('resena')).toHaveCount(1);
    await expect(page.getByTestId('resena')).toContainText('Muy buen teclado');
    await expect(page.getByTestId('media')).toHaveText('Valoración media: 4.0 (1 opiniones)');
    await expect(page.getByLabel('Tu opinión')).toHaveValue('');
  });

  test('el widget emite un evento personalizado al publicar', async ({ page }) => {
    const evento = page.evaluate(
      () => new Promise<boolean>((resolve) => document.addEventListener('resena-publicada', () => resolve(true), { once: true })),
    );
    await page.getByRole('radio', { name: '5 estrellas' }).click();
    await page.getByLabel('Tu opinión').fill('Perfecto');
    await page.getByRole('button', { name: 'Publicar opinión' }).click();
    expect(await evento).toBe(true);
  });
});

test.describe('iFrame: chat de soporte', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Soporte' }).click();
  });

  test('el chat se abre en un iframe con saludo inicial', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Cerrar soporte' })).toHaveAttribute('aria-expanded', 'true');

    const chat = page.frameLocator('iframe[title="Chat de soporte"]');
    await expect(chat.getByText('Soporte TiendaOnline')).toBeVisible();
    await expect(chat.getByTestId('mensaje-agente')).toContainText('¿En qué puedo ayudarte?');
    // Fuera del iframe no existe ese contenido.
    await expect(page.getByTestId('mensaje-agente')).toHaveCount(0);
  });

  test('respuesta asíncrona: aparece "escribiendo…" y luego la respuesta del agente', async ({ page }) => {
    const chat = page.frameLocator('iframe[title="Chat de soporte"]');
    await chat.getByRole('textbox', { name: 'Mensaje' }).fill('¿Cuánto tarda el envío?');
    await chat.getByRole('button', { name: 'Enviar' }).click();

    await expect(chat.getByTestId('mensaje-usuario')).toHaveText('¿Cuánto tarda el envío?');
    await expect(chat.getByTestId('escribiendo')).toBeVisible();
    await expect(chat.getByTestId('escribiendo')).toBeHidden();
    await expect(chat.getByTestId('mensaje-agente').last()).toContainText('2 a 4 días laborables');
  });

  test('cerrar el soporte elimina el iframe del DOM', async ({ page }) => {
    await page.getByRole('button', { name: 'Cerrar soporte' }).click();
    await expect(page.locator('iframe[title="Chat de soporte"]')).toHaveCount(0);
  });
});
