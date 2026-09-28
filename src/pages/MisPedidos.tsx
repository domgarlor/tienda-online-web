import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, type Pedido } from '../lib/api';

export function MisPedidos() {
  const { sesion } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!sesion) return;
    api
      .misPedidos(sesion.token)
      .then(setPedidos)
      .finally(() => setCargando(false));
  }, [sesion]);

  if (cargando) return <p className="p-6">Cargando pedidos...</p>;

  if (pedidos.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Mis pedidos</h1>
        <p data-testid="pedidos-vacio">Todavía no has hecho ningún pedido.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Mis pedidos</h1>
      <ul className="flex flex-col gap-3" data-testid="lista-pedidos">
        {pedidos.map((pedido) => (
          <li key={pedido.id} className="border rounded p-4 bg-white" data-testid="pedido-card">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Pedido #{pedido.id}</span>
              <span className="text-sm text-gray-500">{pedido.estado}</span>
            </div>
            <ul className="text-sm text-gray-600">
              {pedido.lineas.map((linea) => (
                <li key={linea.id}>
                  {linea.cantidad} x {linea.producto.nombre} ({linea.precioUnitario.toFixed(2)} €)
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
