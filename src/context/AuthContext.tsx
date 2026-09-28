import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type AuthResponse } from '../lib/api';

interface Sesion {
  token: string;
  username: string;
  rol: 'ADMIN' | 'CLIENTE';
  clienteId: number | null;
}

interface AuthContextValue {
  sesion: Sesion | null;
  cargando: boolean;
  login: (username: string, password: string) => Promise<void>;
  registro: (username: string, password: string, nombre: string, email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'tienda-sesion';

function guardar(datos: AuthResponse): Sesion {
  const sesion: Sesion = {
    token: datos.token,
    username: datos.username,
    rol: datos.rol,
    clienteId: datos.clienteId,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
  return sesion;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    try {
      const guardada = localStorage.getItem(STORAGE_KEY);
      if (guardada) {
        setSesion(JSON.parse(guardada));
      }
    } catch {
      // localStorage no disponible o corrupto: seguimos sin sesión
    } finally {
      setCargando(false);
    }
  }, []);

  async function login(username: string, password: string) {
    const datos = await api.login(username, password);
    setSesion(guardar(datos));
  }

  async function registro(username: string, password: string, nombre: string, email: string) {
    const datos = await api.registro(username, password, nombre, email);
    setSesion(guardar(datos));
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSesion(null);
  }

  return (
    <AuthContext.Provider value={{ sesion, cargando, login, registro, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
