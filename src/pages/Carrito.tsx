import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { PagoTarjeta } from '../components/PagoTarjeta';

export function Carrito() {
  const { items, quitar, vaciar, total } = useCart();
  const { sesion } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // undefined = aún consultando la configuración de pagos; null = sin Stripe.
  const [claveStripe, setClaveStripe] = useState<string | null | undefined>(undefined);
  const [pago, setPago] = useState<{ clientSecret: string } | null>(null);
  const token = sesion?.token;

  // Si el backend tiene Stripe configurado, se paga con tarjeta; si no, flujo clásico.
  useEffect(() => {
    if (!token) return;
    api
      .configPagos(token)
      .then((c) => setClaveStripe(c.habilitado ? (c.publishableKey ?? null) : null))
      .catch(() => setClaveStripe(null));
  }, [token]);

  const lineas = items.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad }));

  async function iniciarPago() {
    if (!sesion) return;
    setError(null);
    setEnviando(true);
    try {
      const intent = await api.iniciarPago(lineas, sesion.token);
      setPago({ clientSecret: intent.clientSecret });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar el pago');
    } finally {
      setEnviando(false);
    }
  }

  async function pedidoPagado(paymentIntentId: string) {
    if (!sesion) return;
    await api.crearPedido(lineas, sesion.token, paymentIntentId);
    vaciar();
    navigate('/mis-pedidos');
  }

  async function finalizarPedido() {
    if (!sesion) return;
    setError(null);
    setEnviando(true);
    try {
      await api.crearPedido(lineas, sesion.token);
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

      {sesion && claveStripe === undefined ? (
        <p className="text-gray-500" data-testid="cargando-pago">Preparando el pago…</p>
      ) : sesion && claveStripe ? (
        pago ? (
          <PagoTarjeta
            publishableKey={claveStripe}
            clientSecret={pago.clientSecret}
            total={total}
            onPagado={pedidoPagado}
          />
        ) : (
          <button
            onClick={iniciarPago}
            disabled={enviando}
            className="bg-emerald-600 text-white rounded py-2 px-4 hover:bg-emerald-700 disabled:opacity-50"
            data-testid="pagar-con-tarjeta"
          >
            {enviando ? 'Preparando pago...' : 'Pagar con tarjeta'}
          </button>
        )
      ) : sesion ? (
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
