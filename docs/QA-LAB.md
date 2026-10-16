# QA Lab: banco de pruebas para Playwright y Selenium

Esta tienda no es un proyecto real: sirve para practicar automatización de pruebas con elementos
que aparecen en cualquier web moderna. Cada elemento sigue la lógica de una tienda estándar y tiene
tests de Playwright en `e2e/`. Los equivalentes en Selenium (Java) se añadirán en `selenium/`.

## Cómo arrancarlo

```bash
# Backend (perfil dev, H2 en memoria) — en el repo tienda-online
mvn spring-boot:run

# Frontend
npm install && npm run dev          # http://localhost:5173

# Tests
npm run test:e2e                    # toda la suite
npx playwright test e2e/shadow-iframe.spec.ts
```

Usuarios sembrados: `ana/ana123`, `luis/luis123`, `admin/admin123`. Los tests crean usuarios únicos
con `usuarioUnico()` (`e2e/helpers.ts`) para poder repetirse sin chocar con restricciones de unicidad.

### Activar el pago con Stripe (opcional, solo modo TEST)

Sin claves, el carrito usa el botón clásico "Finalizar pedido" y los tests de pago se saltan.

```bash
# archivo local fuera del repo, permisos 600
TIENDA_STRIPE_SECRET_KEY=sk_test_...
TIENDA_STRIPE_PUBLISHABLE_KEY=pk_test_...
set -a && . ~/.config/tienda-stripe.env && set +a && mvn spring-boot:run
```

Nunca uses claves `sk_live_`/`pk_live_`. La clave secreta solo vive en el backend; el frontend recibe
únicamente la publicable desde `GET /api/pagos/config`.

## Inventario de elementos

| Elemento | Dónde | Cómo localizarlo (Playwright) | Qué practica |
|---|---|---|---|
| Dropdown nativo `<select>` | Catálogo, "Ordenar por" | `getByRole('combobox', { name: 'Ordenar por' }).selectOption(...)` | `selectOption`, Select de Selenium |
| Dropdown personalizado (ARIA `listbox`) | Catálogo, "Disponibilidad" | `getByTestId('filtro-disponibilidad').click()` y `getByRole('option', { name })` | Desplegables que no son `<select>`, `aria-expanded`, `aria-selected` |
| Búsqueda asíncrona con debounce | Catálogo | `getByRole('searchbox', { name: 'Buscar producto' })`, `getByTestId('skeletons')` | Esperas automáticas, estados intermedios (skeleton), `aria-busy` |
| Toast | Catálogo, al añadir al carrito | `getByRole('alert')` | Elementos que aparecen y desaparecen solos |
| Favoritos (`aria-pressed`) | Tarjetas del catálogo | `getByRole('button', { name: 'Marcar X como favorito' })` | Botones de alternancia, estado en atributos ARIA |
| Drag & drop | `/lista-deseos` | `getByTestId('favorito-item').nth(2).dragTo(...nth(0))` | HTML5 DnD, persistencia tras recargar |
| Modal (`<dialog>`) | `/lista-deseos`, "Vaciar lista" | `getByRole('dialog', { name: '¿Vaciar la lista de deseos?' })` | Diálogos modales, nombre accesible |
| Subida de archivos | `/perfil` (requiere login) | `getByLabel('Foto de perfil').setInputFiles(...)` | `setInputFiles`, validación de tipo y tamaño, vista previa |
| Pestaña nueva | Pie de página, "Términos y condiciones" | `context.waitForEvent('page')` al hacer clic | Varias páginas/pestañas, `target="_blank"` |
| Scroll infinito | `/novedades` | `getByTestId('centinela').scrollIntoViewIfNeeded()` | `IntersectionObserver`, carga por lotes, `toPass` |
| Shadow DOM abierto | Catálogo, widget de opiniones | `getByRole('radio', { name: '4 estrellas' })`, `getByLabel('Tu opinión')` | Playwright atraviesa el shadow root solo; Selenium necesita `getShadowRoot()` |
| iFrame del mismo origen | Botón flotante "Soporte" | `page.frameLocator('iframe[title="Chat de soporte"]')` | `frameLocator`, `switchTo().frame()`, respuesta asíncrona |
| iFrame de otro origen (Stripe Elements) | Carrito, "Pagar con tarjeta" | `frameLocator('iframe[title="Campo de entrada seguro para el pago"]')` | Formularios en iframes de terceros |
| iFrames anidados (3D Secure) | Pago con tarjeta `4000 0025 0000 3155` | `frameLocator('iframe[src*="three-ds-2-challenge"]').frameLocator('iframe')` | Dos niveles de iframe |
| Contenido de varios estados | Catálogo ("sin resultados"), carrito vacío | `getByTestId('sin-resultados')` | Estados vacíos |
| Rutas protegidas | `/mis-pedidos`, `/perfil` | `toHaveURL('/login')` | Redirecciones sin sesión |

Selectores usados en todo el proyecto: `getByRole`, `getByText`, `getByLabel`, `getByTestId`
(atributo `data-testid`) y locators CSS solo cuando no hay alternativa (iframes por `title`/`src`).

## Pago con Stripe en modo test

Flujo: el carrito pide `POST /api/pagos/intent` (el importe lo calcula el servidor), Stripe Elements
confirma el pago en el navegador y, si está cobrado, se crea el pedido con `paymentIntentId`.
El backend lo verifica (cobrado, mismo cliente, importe exacto, en euros, no reutilizado).

| Tarjeta | Resultado |
|---|---|
| `4242 4242 4242 4242` | Pago correcto |
| `4000 0000 0000 9995` | Rechazada por fondos insuficientes |
| `4000 0025 0000 3155` | Pide 3D Secure (botones Complete / Fail) |

Caducidad cualquier fecha futura (por ejemplo `12 / 34`), CVC cualquier número de 3 cifras y país
España (el país llega sin seleccionar y es obligatorio). Lista completa: https://docs.stripe.com/testing

## Lecciones aprendidas (trampas reales)

- **Un clic puede perderse sin error.** Con el viewport por defecto (720 px) el botón "Pagar" queda
  bajo el pliegue y el scroll automático hace que el clic no llegue a la página. El spec de pago usa
  `test.use({ viewport: { width: 1280, height: 1400 } })`.
- **El botón del reto 3D Secure se ve antes de estar listo.** Un clic prematuro se pierde. El test
  reintenta con `expect(async () => { ... }).toPass()` en vez de dormir un tiempo fijo.
- **Esperar al iframe de Stripe.** Al completar el número, Stripe despliega un bloque de Link y el
  iframe cambia de alto; el test espera a que la altura se estabilice antes de pagar.
- **`getByRole('status')` o `getByRole('alert')` pueden devolver varios elementos** cuando hay un
  shadow root con esos roles. Si el test falla por "strict mode violation", usa un `data-testid`.
- **Un `<ul>` vacío cuenta como oculto** para `toBeVisible()`; usa `toBeAttached()`.
- **No muestres un botón clásico mientras se carga la configuración de pagos.** Un test puede
  decidir con el estado equivocado (el carrito muestra "Preparando el pago…" hasta saberlo).
- **Un test que recorre una lista vacía pasa sin comprobar nada.** El filtro "Agotados" lo sufre:
  todas las semillas tienen stock. Pendiente: reforzarlo interceptando `/api/productos` con
  `page.route`.

## Orden de ejecución y entornos

`npm run test:e2e` (local), `test:e2e:pre` y `test:e2e:prod` (ver `DEPLOY.md` del backend).
Con Stripe activo en el backend se saltan los tests del pedido clásico; sin Stripe se saltan los de pago.
Los tests de seguridad (fase siguiente) se ejecutarán solo en local o contra PRE, nunca con carga
agresiva contra Render, Vercel o Neon.

## Estado

Hecho: UI avanzada, pago con Stripe en modo test y tests de Playwright.
Pendiente: proyecto Selenium en Java (`selenium/`) y tests de seguridad (OWASP Top 10).
