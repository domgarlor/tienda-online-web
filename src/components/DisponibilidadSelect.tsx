import { useEffect, useRef, useState } from 'react';

export type Disponibilidad = 'todos' | 'en-stock' | 'agotados';

const OPCIONES: { valor: Disponibilidad; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'en-stock', etiqueta: 'En stock' },
  { valor: 'agotados', etiqueta: 'Agotados' },
];

interface Props {
  value: Disponibilidad;
  onChange: (value: Disponibilidad) => void;
}

// Desplegable personalizado (no es un <select> nativo): botón + listbox con
// role="option". Obliga a hacer clic en el botón y luego en la opción, en lugar
// de usar selectOption() / Select de Selenium.
export function DisponibilidadSelect({ value, onChange }: Props) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const actual = OPCIONES.find((o) => o.valor === value)!;

  useEffect(() => {
    function cerrarSiClicFuera(e: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', cerrarSiClicFuera);
    return () => document.removeEventListener('mousedown', cerrarSiClicFuera);
  }, []);

  return (
    <div className="relative flex flex-col" ref={contenedor}>
      <span id="disponibilidad-label" className="text-sm text-gray-600">Disponibilidad</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-labelledby="disponibilidad-label disponibilidad-boton"
        id="disponibilidad-boton"
        onClick={() => setAbierto((a) => !a)}
        onKeyDown={(e) => e.key === 'Escape' && setAbierto(false)}
        className="border rounded px-2 py-1.5 text-left min-w-36 bg-white"
        data-testid="filtro-disponibilidad"
      >
        {actual.etiqueta}
      </button>
      {abierto && (
        <ul
          role="listbox"
          aria-labelledby="disponibilidad-label"
          className="absolute top-full mt-1 z-10 w-full border rounded bg-white shadow"
        >
          {OPCIONES.map((o) => (
            <li
              key={o.valor}
              role="option"
              aria-selected={o.valor === value}
              onClick={() => {
                onChange(o.valor);
                setAbierto(false);
              }}
              className="px-2 py-1.5 cursor-pointer hover:bg-emerald-50"
            >
              {o.etiqueta}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
