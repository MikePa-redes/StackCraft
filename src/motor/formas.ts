// Comparación de formas: los elementos se comparan por forma, no por id.

import type { Acople, Celda, Nivel, Pieza } from './tipos';

const clave = ([x, y]: Celda): string => `${x},${y}`;

/** Dos formas son iguales si ocupan exactamente las mismas celdas. */
export function formasIguales(a: Celda[], b: Celda[]): boolean {
  const ca = new Set(a.map(clave));
  const cb = new Set(b.map(clave));
  return ca.size === cb.size && [...ca].every((c) => cb.has(c));
}

/** ¿Los elementos acoplados coinciden, anclaje por anclaje, con el objetivo? */
export function coincideObjetivo(nivel: Nivel, pieza: Pieza, acoplados: Acople[]): boolean {
  const ordenesObjetivo = Object.keys(pieza.objetivo).map(Number);
  if (acoplados.length !== ordenesObjetivo.length) return false;
  return acoplados.every(({ anclaje, elemento }) => {
    const esperado = pieza.objetivo[anclaje];
    if (esperado === undefined) return false;
    const formaEsperada = nivel.elementos[esperado]?.forma;
    const formaActual = nivel.elementos[elemento]?.forma;
    return !!formaEsperada && !!formaActual && formasIguales(formaEsperada, formaActual);
  });
}
