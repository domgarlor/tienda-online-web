import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { sesion, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const unidadesEnCarrito = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <nav className="bg-emerald-700 text-white px-4 py-3 flex items-center gap-4 flex-wrap">
      <Link to="/" className="font-bold text-lg" data-testid="nav-logo">
        🛒 TiendaOnline
      </Link>

      <div className="flex-1" />

      <Link to="/carrito" className="hover:underline" data-testid="nav-carrito">
        Carrito {unidadesEnCarrito > 0 && `(${unidadesEnCarrito})`}
      </Link>

      {sesion ? (
        <>
          <Link to="/mis-pedidos" className="hover:underline" data-testid="nav-mis-pedidos">
            Mis pedidos
          </Link>
          <span className="text-emerald-100 text-sm" data-testid="nav-username">
            {sesion.username}
          </span>
          <button
            onClick={handleLogout}
            className="bg-emerald-900 px-3 py-1 rounded hover:bg-emerald-950"
            data-testid="nav-logout"
          >
            Salir
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="hover:underline" data-testid="nav-login">
            Entrar
          </Link>
          <Link to="/registro" className="hover:underline" data-testid="nav-registro">
            Crear cuenta
          </Link>
        </>
      )}
    </nav>
  );
}
