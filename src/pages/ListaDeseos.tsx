import { useRef, useState } from 'react';
import { favoritosStore, useFavoritos } from '../lib/favoritos';

// Lista de deseos reordenable con drag & drop nativo de HTML5 y un <dialog>
// modal para confirmar el vaciado.
export function ListaDeseos() {
  const favoritos = useFavoritos();
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Lista de deseos</h1>

      {favoritos.length === 0 ? (
        <p data-testid="favoritos-vacio">Todavía no has marcado ningún producto como favorito.</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-2">Arrastra los productos para cambiar su prioridad.</p>
          <ul className="grid gap-2" aria-label="Productos favoritos">
            {favoritos.map((producto, indice) => (
              <li
                key={producto.id}
                draggable
                data-testid="favorito-item"
                onDragStart={() => setArrastrando(indice)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (arrastrando !== null) favoritosStore.mover(arrastrando, indice);
                  setArrastrando(null);
                }}
                onDragEnd={() => setArrastrando(null)}
                className={`flex items-center gap-3 border rounded bg-white p-3 cursor-grab ${
                  arrastrando === indice ? 'opacity-50' : ''
                }`}
              >
                <span aria-hidden="true">⠿</span>
                <span className="flex-1">{producto.nombre}</span>
                <span className="text-emerald-700">{producto.precio.toFixed(2)} €</span>
                <button
                  type="button"
                  onClick={() => favoritosStore.quitar(producto.id)}
                  aria-label={`Quitar ${producto.nombre} de favoritos`}
                  className="text-red-600"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => dialogo.current?.showModal()}
            className="mt-4 border border-red-600 text-red-600 rounded px-3 py-1.5"
          >
            Vaciar lista
          </button>
        </>
      )}

      <dialog ref={dialogo} aria-labelledby="dialogo-titulo" className="rounded-lg p-6 backdrop:bg-black/40">
        <h2 id="dialogo-titulo" className="font-semibold mb-2">¿Vaciar la lista de deseos?</h2>
        <p className="mb-4 text-sm text-gray-600">Se eliminarán todos tus favoritos. Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => dialogo.current?.close()} className="border rounded px-3 py-1.5">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              favoritosStore.vaciar();
              dialogo.current?.close();
            }}
            className="bg-red-600 text-white rounded px-3 py-1.5"
          >
            Sí, vaciar
          </button>
        </div>
      </dialog>
    </div>
  );
}
