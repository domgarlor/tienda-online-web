import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { sesion, cargando } = useAuth();

  if (cargando) {
    return null;
  }

  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
