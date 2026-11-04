// Utilidades compartidas por las pruebas del motor (no se usan en el juego).

import n05 from '../niveles/N05.json';
import { analizar } from './analizador';
import { cargarPartida } from './cargador';
import { simular, type ResultadoSimulacion } from './simulador';
import { OPERACIONES, type EstadoPartida, type Nivel } from './tipos';

export function partidaN05(cambios?: (json: Record<string, any>) => void) {
  const json: Record<string, any> = structuredClone(n05);
  cambios?.(json);
  return cargarPartida(json);
}

/** N05 con PIEZA_01 trayendo C (anclaje 1) y A (anclaje 2); bandeja vacía. */
export function partidaDosIniciales(desarmado: 'lifo' | 'fifo') {
  return partidaN05((j) => {
    j.desarmado = desarmado;
    j.bandeja = [];
    j.piezas[0].iniciales = { '1': 'C', '2': 'A' };
  });
}

/** Analiza (con todas las operaciones) y simula; falla si no compila. */
export function correr(nivel: Nivel, estado: EstadoPartida, codigo: string): ResultadoSimulacion {
  const a = analizar(codigo, OPERACIONES);
  if (!a.ok) throw new Error(`no compila: ${JSON.stringify(a.errores)}`);
  return simular(nivel, estado, a.instrucciones);
}

export function exito(r: ResultadoSimulacion) {
  if (!r.ok) throw new Error(`error inesperado: ${JSON.stringify(r.error)}`);
  return r;
}

/** Todos los elementos del estado, ordenados (para comprobar conservación). */
export function elementosDe(e: EstadoPartida): string[] {
  return [
    ...e.bandeja,
    ...e.pila,
    ...e.cola,
    ...Object.values(e.piezas).flatMap((p) => p.acoplados.map((a) => a.elemento)),
  ].sort();
}

/** Generador pseudoaleatorio con semilla (mulberry32). */
export function aleatorio(semilla: number): () => number {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
