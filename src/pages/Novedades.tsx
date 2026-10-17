import { useEffect, useRef, useState } from 'react';

const TOTAL = 30;
const LOTE = 8;
const LATENCIA_MS = 500;

const novedades = Array.from({ length: TOTAL }, (_, i) => ({
  id: i + 1,
  titulo: `Novedad ${i + 1}`,
  texto: `Texto de la novedad número ${i + 1} de la tienda.`,
}));

// Scroll infinito: un centinela observado con IntersectionObserver carga el
// siguiente lote (con latencia simulada) cada vez que entra en pantalla.
export function Novedades() {
  const [visibles, setVisibles] = useState(LOTE);
  const [cargando, setCargando] = useState(false);
  const centinela = useRef<HTMLDivElement>(null);
  const hayMas = visibles < TOTAL;

  useEffect(() => {
    const nodo = centinela.current;
    if (!nodo || !hayMas) return;

    let timer: number | undefined;
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return;
      setCargando(true);
      timer = window.setTimeout(() => {
        setVisibles((v) => Math.min(v + LOTE, TOTAL));
        setCargando(false);
      }, LATENCIA_MS);
    });
    observador.observe(nodo);
    return () => {
      observador.disconnect();
      window.clearTimeout(timer);
    };
  }, [visibles, hayMas]);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Novedades</h1>
      <ul className="grid gap-3" aria-label="Novedades de la tienda">
        {novedades.slice(0, visibles).map((n) => (
          <li key={n.id} data-testid="novedad" className="border rounded bg-white p-4 h-32">
            <h2 className="font-medium">{n.titulo}</h2>
            <p className="text-sm text-gray-600">{n.texto}</p>
          </li>
        ))}
      </ul>

      <div ref={centinela} data-testid="centinela" className="h-4" />
      <p role="status" className="text-center text-gray-500" data-testid="estado-novedades">
        {cargando ? 'Cargando más…' : hayMas ? '' : 'No hay más novedades.'}
      </p>
    </div>
  );
}
