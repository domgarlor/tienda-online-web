import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Producto } from '../lib/api';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

interface CartContextValue {
  items: ItemCarrito[];
  añadir: (producto: Producto) => void;
  quitar: (productoId: number) => void;
  vaciar: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = 'tienda-carrito';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      return guardado ? (JSON.parse(guardado) as ItemCarrito[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // si localStorage falla, el carrito solo vive en memoria para esta sesión
    }
  }, [items]);

  function añadir(producto: Producto) {
    setItems((actual) => {
      const existente = actual.find((i) => i.producto.id === producto.id);
      if (existente) {
        return actual.map((i) => (i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [...actual, { producto, cantidad: 1 }];
    });
  }

  function quitar(productoId: number) {
    setItems((actual) => actual.filter((i) => i.producto.id !== productoId));
  }

  function vaciar() {
    setItems([]);
  }

  const total = items.reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0);

  return <CartContext.Provider value={{ items, añadir, quitar, vaciar, total }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
