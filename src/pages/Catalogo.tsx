import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type Producto } from '../lib/api';
import { useCart } from '../context/CartContext';
import { favoritosStore, useFavoritos } from '../lib/favoritos';
import '../components/tienda-resenas';
import { DisponibilidadSelect, type Disponibilidad } from '../components/DisponibilidadSelect';

type Orden = 'defecto' | 'precio-asc' | 'precio-desc' | 'nombre';

const BUSQUEDA_DEBOUNCE_MS = 400;
const BUSQUEDA_LATENCIA_MS = 600;
const TOAST_MS = 2500;

export function Catalogo() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [orden, setOrden] = useState<Orden>('defecto');
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>('todos');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const { añadir } = useCart();
  const favoritos = useFavoritos();

  useEffect(() => {
    api
      .listarProductos()
      .then(setProductos)
      .catch(() => setError('No se pudo cargar el catálogo. ¿Está arrancado el backend?'))
      .finally(() => setCargando(false));
  }, []);

  // Búsqueda con debounce y latencia simulada: sirve para practicar esperas asíncronas.
  useEffect(() => {
    let latencia: number | undefined;
    const debounce = window.setTimeout(() => {
      latencia = window.setTimeout(() => {
        setConsulta(texto.trim().toLowerCase());
        setBuscando(false);
      }, BUSQUEDA_LATENCIA_MS);
    }, BUSQUEDA_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(debounce);
      window.clearTimeout(latencia);
    };
  }, [texto]);

  const visibles = useMemo(() => {
    const filtrados = productos
      .filter((p) => p.nombre.toLowerCase().includes(consulta))
      .filter((p) => {
        if (disponibilidad === 'en-stock') return p.stock > 0;
        if (disponibilidad === 'agotados') return p.stock === 0;
        return true;
      });
    const copia = [...filtrados];
    if (orden === 'precio-asc') copia.sort((a, b) => a.precio - b.precio);
    if (orden === 'precio-desc') copia.sort((a, b) => b.precio - a.precio);
    if (orden === 'nombre') copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return copia;
  }, [productos, consulta, disponibilidad, orden]);

  function anadirConAviso(producto: Producto) {
    añadir(producto);
    setToast(`${producto.nombre} añadido al carrito`);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  }

  if (cargando) return <p className="p-6">Cargando catálogo...</p>;
  if (error) return <p className="p-6 text-red-600" data-testid="catalogo-error">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Catálogo</h1>

      <div className="flex flex-wrap items-end gap-4 mb-4" role="search">
        <div className="flex flex-col">
          <label htmlFor="busqueda" className="text-sm text-gray-600">Buscar producto</label>
          <input
            id="busqueda"
            type="search"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setBuscando(true);
            }}
            placeholder="Ej. teclado"
            className="border rounded px-2 py-1.5"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="orden" className="text-sm text-gray-600">Ordenar por</label>
          <select
            id="orden"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="border rounded px-2 py-1.5"
          >
            <option value="defecto">Relevancia</option>
            <option value="precio-asc">Precio: de menor a mayor</option>
            <option value="precio-desc">Precio: de mayor a menor</option>
            <option value="nombre">Nombre (A-Z)</option>
          </select>
        </div>

        <DisponibilidadSelect value={disponibilidad} onChange={setDisponibilidad} />
      </div>

      <p className="text-sm text-gray-500 mb-2" role="status" aria-live="polite" data-testid="estado-busqueda">
        {buscando ? 'Buscando…' : `${visibles.length} productos`}
      </p>

      {buscando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" data-testid="skeletons" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-4 bg-gray-100 animate-pulse h-32" />
          ))}
        </div>
      ) : visibles.length === 0 ? (
        <p data-testid="sin-resultados">No hay productos que coincidan con tu búsqueda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" data-testid="lista-productos">
          {visibles.map((producto) => (
            <div key={producto.id} className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-2" data-testid="producto-card">
              <h2 className="font-medium">{producto.nombre}</h2>
              <p className="text-emerald-700 font-semibold">{producto.precio.toFixed(2)} €</p>
              <p className="text-sm text-gray-500">Stock: {producto.stock}</p>
              <button
                type="button"
                onClick={() => favoritosStore.alternar(producto)}
                aria-pressed={favoritos.some((f) => f.id === producto.id)}
                aria-label={`Marcar ${producto.nombre} como favorito`}
                className="text-sm text-left text-rose-600"
                data-testid="favorito"
              >
                {favoritos.some((f) => f.id === producto.id) ? '♥ En favoritos' : '♡ Favorito'}
              </button>
              <button
                onClick={() => anadirConAviso(producto)}
                className="mt-auto bg-emerald-600 text-white rounded py-1.5 hover:bg-emerald-700"
                data-testid="anadir-carrito"
              >
                Añadir al carrito
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <tienda-resenas />
      </div>

      {toast && (
        <div
          role="alert"
          data-testid="toast"
          className="fixed bottom-4 right-4 bg-gray-900 text-white rounded px-4 py-2 shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
