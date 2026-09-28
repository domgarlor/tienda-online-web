import { useEffect, useState } from 'react';
import { api, type Producto } from '../lib/api';
import { useCart } from '../context/CartContext';

export function Catalogo() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { añadir } = useCart();

  useEffect(() => {
    api
      .listarProductos()
      .then(setProductos)
      .catch(() => setError('No se pudo cargar el catálogo. ¿Está arrancado el backend?'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="p-6">Cargando catálogo...</p>;
  if (error) return <p className="p-6 text-red-600" data-testid="catalogo-error">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Catálogo</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" data-testid="lista-productos">
        {productos.map((producto) => (
          <div key={producto.id} className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-2" data-testid="producto-card">
            <h2 className="font-medium">{producto.nombre}</h2>
            <p className="text-emerald-700 font-semibold">{producto.precio.toFixed(2)} €</p>
            <p className="text-sm text-gray-500">Stock: {producto.stock}</p>
            <button
              onClick={() => añadir(producto)}
              className="mt-auto bg-emerald-600 text-white rounded py-1.5 hover:bg-emerald-700"
              data-testid="anadir-carrito"
            >
              Añadir al carrito
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
