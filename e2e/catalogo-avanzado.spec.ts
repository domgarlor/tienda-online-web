import { test, expect, type Page } from '@playwright/test';

async function preciosVisibles(page: Page): Promise<number[]> {
  const textos = await page.getByTestId('producto-card').locator('p.text-emerald-700').allInnerTexts();
  return textos.map((t) => parseFloat(t.replace('€', '').trim()));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('producto-card').first()).toBeVisible();
});

test('dropdown nativo: ordenar por precio de menor a mayor y de mayor a menor', async ({ page }) => {
  const orden = page.getByRole('combobox', { name: 'Ordenar por' });

  await orden.selectOption({ label: 'Precio: de menor a mayor' });
  const asc = await preciosVisibles(page);
  expect(asc).toEqual([...asc].sort((a, b) => a - b));

  await orden.selectOption('precio-desc');
  const desc = await preciosVisibles(page);
  expect(desc).toEqual([...desc].sort((a, b) => b - a));
});

test('dropdown personalizado: el listbox se abre, marca la opción y se cierra al elegir', async ({ page }) => {
  const boton = page.getByTestId('filtro-disponibilidad');
  await expect(boton).toHaveAttribute('aria-expanded', 'false');

  await boton.click();
  await expect(boton).toHaveAttribute('aria-expanded', 'true');
  const listbox = page.getByRole('listbox', { name: 'Disponibilidad' });
  await expect(listbox.getByRole('option')).toHaveCount(3);
  await expect(listbox.getByRole('option', { name: 'Todos' })).toHaveAttribute('aria-selected', 'true');

  await listbox.getByRole('option', { name: 'En stock' }).click();
  await expect(listbox).toBeHidden();
  await expect(boton).toHaveText('En stock');
});

test('el filtro "Agotados" no muestra productos con stock', async ({ page }) => {
  await page.getByTestId('filtro-disponibilidad').click();
  await page.getByRole('option', { name: 'Agotados' }).click();

  const estado = page.getByTestId('estado-busqueda');
  await expect(estado).not.toHaveText('Buscando…');
  for (const card of await page.getByTestId('producto-card').all()) {
    await expect(card).toContainText('Stock: 0');
  }
});

test('búsqueda asíncrona: muestra skeletons y luego los resultados filtrados', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Buscar producto' }).fill('teclado');

  await expect(page.getByTestId('skeletons')).toBeVisible();
  await expect(page.getByTestId('skeletons')).toBeHidden();

  const cards = page.getByTestId('producto-card');
  await expect(cards.first()).toContainText(/teclado/i);
  for (const card of await cards.all()) {
    await expect(card).toContainText(/teclado/i);
  }
});

test('búsqueda sin coincidencias muestra el mensaje de sin resultados', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Buscar producto' }).fill('zzz-no-existe');

  await expect(page.getByTestId('sin-resultados')).toBeVisible();
  await expect(page.getByTestId('producto-card')).toHaveCount(0);
  await expect(page.getByTestId('estado-busqueda')).toHaveText('0 productos');
});

test('toast: aparece al añadir al carrito y desaparece solo', async ({ page }) => {
  await page.getByTestId('anadir-carrito').first().click();

  const toast = page.getByRole('alert');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('añadido al carrito');
  await expect(toast).toBeHidden({ timeout: 5000 });
});
