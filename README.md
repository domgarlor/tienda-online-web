# TiendaOnline Web

Frontend web de [tienda-online](https://github.com/domgarlor/tienda-online): catálogo, carrito, login/registro y pedidos, consumiendo la API REST con JWT tal cual está. React + Vite + TypeScript + Tailwind, con tests end-to-end en Playwright desde el primer commit.

Para desplegarlo gratis en Netlify/Vercel con auto-deploy desde GitHub (junto con el backend y la base de datos), ver la guía [DEPLOY.md del backend](https://github.com/domgarlor/tienda-online/blob/master/DEPLOY.md).

## Requisitos

- Node.js 20+
- El backend [`tienda-online`](https://github.com/domgarlor/tienda-online) arrancado en `http://localhost:8080` (perfil `dev`)

## Arrancar en desarrollo

```bash
npm install
npm run dev
```

Se sirve en `http://localhost:5173`. La URL de la API se configura con `VITE_API_URL` (por defecto `http://localhost:8080`, ver `.env.example`).

El backend necesita CORS habilitado para `http://localhost:5173` — ya viene configurado en `SecurityConfig.java` del backend.

## Usuarios de prueba

Los mismos que siembra el backend: `ana/ana123`, `luis/luis123`, `admin/admin123` (ver el README de `tienda-online`).

## Tests end-to-end (Playwright)

Con el backend ya arrancado en `localhost:8080`:

```bash
npm run test:e2e        # modo headless, resumen en terminal
npm run test:e2e:ui     # modo interactivo, para depurar paso a paso
```

Playwright arranca el frontend (`npm run dev`) automáticamente; el backend hay que tenerlo arrancado tú (por ejemplo desde Eclipse, o `mvn spring-boot:run` en el proyecto `tienda-online`).

Los tests cubren:

- Catálogo público (sin sesión).
- Login correcto e incorrecto.
- Registro de un cliente nuevo y detección de usuario duplicado.
- Añadir al carrito y completar un pedido (y que sin sesión no se pueda pagar).
- Cierre de sesión y protección de rutas privadas (`/mis-pedidos`).

Son repetibles sin reiniciar el backend entre ejecuciones: los datos de prueba usan usuario/email únicos por ejecución (`e2e/helpers.ts`) para no chocar con restricciones de unicidad, la misma lección aprendida con la colección de Postman del backend. El test de pedido tampoco usa las cuentas semilla (`ana`/`luis`): registra un cliente desechable en cada ejecución, para poder correr los tests contra producción sin ir acumulando pedidos de prueba en cuentas de demo reales.

### Contra el entorno público (producción)

Los mismos tests, sin tocar nada, apuntando a la URL real desplegada en Vercel/Render en vez de a `localhost`:

```bash
npm run test:e2e:prod
```

Usa `playwright.prod.config.ts` — no arranca nada local. Antes de los tests, un `globalSetup` (`e2e/wake-up-backend.ts`) "despierta" el backend de Render por si llevaba dormido (el plan gratis duerme a los 15 min sin tráfico; despertar puede tardar hasta ~60s).

Para apuntar a otra URL (por ejemplo, un fork con tu propio despliegue):

```bash
PROD_URL=https://tu-frontend.vercel.app PROD_API_URL=https://tu-backend.onrender.com npm run test:e2e:prod
```

Ten en cuenta que esto crea datos reales en la base de datos de producción (usuarios y pedidos de prueba, aunque desechables) — no lo lances en bucle sin más: cada ejecución también consume una unidad de stock real de "Ratón inalámbrico".

## Estructura

```
src/
├── lib/api.ts              cliente HTTP para la API (fetch + manejo de errores)
├── context/                sesión (JWT en localStorage) y carrito
├── components/             Navbar, ruta protegida
└── pages/                  Catálogo, Login, Registro, Carrito, Mis pedidos
e2e/                         tests Playwright
```
