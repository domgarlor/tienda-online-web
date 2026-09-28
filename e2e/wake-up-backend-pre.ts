// Igual que wake-up-backend.ts, pero para el backend de PRE (Render duerme
// cada servicio gratuito de forma independiente tras 15 min sin tráfico).
async function wakeUpBackendPre() {
  const apiUrl = process.env.PRE_API_URL ?? 'https://tienda-online-api-pre.onrender.com';
  const maxWaitMs = 90_000;
  const start = Date.now();

  console.log(`Despertando el backend de PRE en ${apiUrl} (puede tardar hasta 60s si estaba dormido)...`);

  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(`${apiUrl}/api/productos`);
      if (res.ok) {
        console.log(`Backend de PRE despierto tras ${Math.round((Date.now() - start) / 1000)}s.`);
        return;
      }
    } catch {
      // todavía no responde, seguimos intentando
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`El backend de PRE en ${apiUrl} no respondió tras ${maxWaitMs / 1000}s`);
}

export default wakeUpBackendPre;
