const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
}

export interface LineaPedido {
  id: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
}

export interface Pedido {
  id: number;
  cliente: Cliente;
  lineas: LineaPedido[];
  fecha: string;
  estado: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  rol: 'ADMIN' | 'CLIENTE';
  clienteId: number | null;
}

export class ApiError extends Error {
  codigo: string;
  status: number;

  constructor(codigo: string, mensaje: string, status: number) {
    super(mensaje);
    this.codigo = codigo;
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let codigo = 'ERROR';
    let mensaje = `Error ${response.status}`;
    try {
      const body = await response.json();
      codigo = body.codigo ?? codigo;
      mensaje = body.mensaje ?? mensaje;
    } catch {
      // el body no era JSON, nos quedamos con el mensaje por defecto
    }
    throw new ApiError(codigo, mensaje, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  registro: (username: string, password: string, nombre: string, email: string) =>
    request<AuthResponse>('/api/auth/registro', {
      method: 'POST',
      body: JSON.stringify({ username, password, nombre, email }),
    }),

  listarProductos: () => request<Producto[]>('/api/productos'),

  crearPedido: (lineas: { productoId: number; cantidad: number }[], token: string) =>
    request<Pedido>('/api/pedidos', { method: 'POST', body: JSON.stringify({ lineas }) }, token),

  misPedidos: (token: string) => request<Pedido[]>('/api/pedidos/mios', {}, token),
};
