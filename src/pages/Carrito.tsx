import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';

export function Carrito() {
  const { items, quitar, vaciar, total } = useCart();
  const { sesion } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function finalizarPedido() {
    if (!sesion) return;
    setError(null);
    setEnviando(true);
    try {
      await api.crearPedido(
        items.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad })),
        sesion.token
      );
      vaciar();
      navigate('/mis-pedidos');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el pedido');
    } finally {
      setEnviando(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Carrito</h1>
        <p data-testid="carrito-vacio">
          Tu carrito está vacío. <Link to="/" className="text-emerald-700 underline">Ver catálogo</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Carrito</h1>
      <ul className="flex flex-col gap-2 mb-4" data-testid="carrito-items">
        {items.map((item) => (
          <li key={item.producto.id} className="flex items-center justify-between border rounded p-3 bg-white">
            <div>
              <p className="font-medium">{item.producto.nombre}</p>
              <p className="text-sm text-gray-500">
                {item.cantidad} x {item.producto.precio.toFixed(2)} €
              </p>
            </div>
            <button onClick={() => quitar(item.producto.id)} className="text-red-600 text-sm hover:underline" data-testid="quitar-item">
              Quitar
            </button>
          </li>
        ))}
      </ul>

      <p className="text-lg font-semibold mb-4" data-testid="carrito-total">
        Total: {total.toFixed(2)} €
      </p>

      {error && (
        <p className="text-red-600 text-sm mb-3" data-testid="carrito-error">
          {error}
        </p>
      )}

      {sesion ? (
        <button
          onClick={finalizarPedido}
          disabled={enviando}
          className="bg-emerald-600 text-white rounded py-2 px-4 hover:bg-emerald-700 disabled:opacity-50"
          data-testid="finalizar-pedido"
        >
          {enviando ? 'Enviando pedido...' : 'Finalizar pedido'}
        </button>
      ) : (
        <p data-testid="carrito-necesita-login">
          <Link to="/login" className="text-emerald-700 underline">
            Inicia sesión
          </Link>{' '}
          para completar el pedido.
        </p>
      )}
    </div>
  );
}
