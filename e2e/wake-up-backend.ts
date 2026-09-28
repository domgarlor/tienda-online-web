// Global setup solo para producción: Render duerme el backend gratuito tras
// 15 min sin tráfico, y la primera petición tras dormir puede tardar hasta
// ~60s. Sin esto, el primer test de la tanda fallaría por timeout en vez de
// simplemente esperar a que el servidor despierte.
async function wakeUpBackend() {
  const apiUrl = process.env.PROD_API_URL ?? 'https://tienda-online-api-oi7y.onrender.com';
  const maxWaitMs = 90_000;
  const start = Date.now();

  console.log(`Despertando el backend en ${apiUrl} (puede tardar hasta 60s si estaba dormido)...`);

  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(`${apiUrl}/api/productos`);
      if (res.ok) {
        console.log(`Backend despierto tras ${Math.round((Date.now() - start) / 1000)}s.`);
        return;
      }
    } catch {
      // todavía no responde, seguimos intentando
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`El backend en ${apiUrl} no respondió tras ${maxWaitMs / 1000}s`);
}

export default wakeUpBackend;
