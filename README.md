# TiendaOnline Web

Frontend web de [tienda-online](https://github.com/domgarlor/tienda-online): catálogo, carrito, login/registro y pedidos, consumiendo la API REST con JWT tal cual está. React + Vite + TypeScript + Tailwind, con tests end-to-end en Playwright desde el primer commit.

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

Son repetibles sin reiniciar el backend entre ejecuciones: los datos de prueba usan usuario/email únicos por ejecución (`e2e/helpers.ts`) para no chocar con restricciones de unicidad, la misma lección aprendida con la colección de Postman del backend.

## Estructura

```
src/
├── lib/api.ts              cliente HTTP para la API (fetch + manejo de errores)
├── context/                sesión (JWT en localStorage) y carrito
├── components/             Navbar, ruta protegida
└── pages/                  Catálogo, Login, Registro, Carrito, Mis pedidos
e2e/                         tests Playwright
```
