# QA Lab: advanced UI, Stripe test payments, Playwright + Selenium (Java), ethical-hacking tests
Branch: feature/qa-lab (from pre) | Delivery: ask-on-risk | Runner: Playwright (`npm run test:e2e`), Selenium/JUnit (`selenium/`, Maven)

## Specs
- S1: Add advanced UI elements to the shop, each following normal online-store logic: dropdowns (sort/filter), async content (debounced search, infinite scroll, skeletons, toasts), Shadow DOM (reviews widget as Web Component), iFrames (support chat, Stripe Elements), drag & drop, modals/dialogs, file upload, new tabs.
- S2: Selectors exercised: `getByRole`, `getByText`, `getByTestId` (and Selenium equivalents); ARIA roles correct.
- S3: Stripe payment in TEST mode only (`pk_test_`/`sk_test_`), Elements + PaymentIntent, 3DS case. No live keys anywhere.
- S4: Playwright tests for every new element; Selenium tests in Java (JUnit) for the same.
- S5: Ethical-hacking security tests (EC-Council / OWASP Top 10 style) on own project: auth/JWT, access control (IDOR), injection, XSS, CORS, headers. Run locally or against PRE with moderate traffic; no DoS or aggressive scans against Render/Vercel/Neon.
- S6: Everything lives in the shop itself (not a separate repo). Selenium project in `tienda-online-web/selenium/`.

## Tasks
- T1 (S1,S2,S4) Frontend: native sort dropdown, custom ARIA listbox filter, debounced async search + skeletons, toast, with Playwright tests (infinite scroll moved to T3; no categories: backend has none) | inline | done, 16/16 Playwright passing locally
- T2 (S1,S2,S4) Shadow DOM reviews widget + iframe support chat + tests | inline | pending
- T3 (S1,S2,S4) Drag & drop wishlist, modal, avatar upload, new tab + tests | inline | pending
- T4 (S3,S4) Stripe Elements + PaymentIntent (backend repo) + tests | inline | pending
- T5 (S4,S6) Selenium Java project reproducing the suite | inline | pending
- T6 (S5) Security tests plan and execution | inline | pending

## Log
- L1 (2026-10-16): "Quiero usar este proyecto como banco de pruebas para crear proyectos que permitan probar funcionalidades avanzadas con PlayRight y Selenium. Necesito añadir al proyecto elementos como dropdown, iFrames, Shadow DOM, elemento asíncronos, getByRole, getByText, getByTestId y demás características de estas plataformas. Siguiendo la lógica de una tienda online estandard. Podíamos añadir un pago con Stripe ne modo demos? supone algún riesgo por uso fraudulento?"
- L2 (2026-10-16): "en la propia tienda. No es un proyecto real. Después de los test E2E, quiero añadir test de seguridad con ECC hacking ético."
- L3 (2026-10-16): "Selenium en Java"
- Route: all tasks inline (no parallel-writer trigger; units depend on shared frontend files).
