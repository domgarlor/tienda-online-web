import { useSyncExternalStore } from 'react';
import type { Producto } from './api';

// Lista de deseos: pequeño store externo persistido en localStorage.
// El orden del array es el orden que el usuario elige con drag & drop.
const STORAGE_KEY = 'tienda-favoritos';
const listeners = new Set<() => void>();

function leer(): Producto[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Producto[];
  } catch {
    return [];
  }
}

// useSyncExternalStore exige una referencia estable entre lecturas sin cambios.
let cache = leer();

function escribir(favoritos: Producto[]) {
  cache = favoritos;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos));
  listeners.forEach((l) => l());
}

function suscribir(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const favoritosStore = {
  alternar(producto: Producto) {
    const existe = cache.some((p) => p.id === producto.id);
    escribir(existe ? cache.filter((p) => p.id !== producto.id) : [...cache, producto]);
  },
  quitar(id: number) {
    escribir(cache.filter((p) => p.id !== id));
  },
  mover(desde: number, hasta: number) {
    if (desde === hasta || desde < 0 || hasta < 0 || desde >= cache.length || hasta >= cache.length) return;
    const copia = [...cache];
    const [movido] = copia.splice(desde, 1);
    copia.splice(hasta, 0, movido);
    escribir(copia);
  },
  vaciar() {
    escribir([]);
  },
};

export function useFavoritos(): Producto[] {
  return useSyncExternalStore(suscribir, () => cache);
}
