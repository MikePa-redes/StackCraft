// Validador: forma de una pieza, paso a fija, colocación y nivel completo.
// Compara siempre FORMAS, nunca ids: elementos de igual forma son
// intercambiables (mecánicas §5 y §10).

import { coincideObjetivo, formasIguales } from './formas';
import type { Acople, Celda, EstadoPartida, Nivel, Pieza } from './tipos';

const clave = ([x, y]: Celda): string => `${x},${y}`;

/** Celdas relativas de una pieza: núcleo + elementos en sus anclajes. */
function celdasConAcoples(nivel: Nivel, pieza: Pieza, acoplados: Acople[]): Celda[] {
  const celdas: Celda[] = pieza.nucleo.map(([x, y]): Celda => [x, y]);
  for (const { anclaje, elemento } of acoplados) {
    const a = pieza.anclajes.find((d) => d.orden === anclaje);
    const forma = nivel.elementos[elemento]?.forma ?? [];
    if (a) forma.forEach(([x, y]) => celdas.push([a.x + x, a.y + y]));
  }
  return celdas;
}

/** Forma actual de la pieza (celdas relativas a su origen). */
export function formaPieza(nivel: Nivel, pieza: Pieza, acoplados: Acople[]): Celda[] {
  return celdasConAcoples(nivel, pieza, acoplados);
}

/** Forma que tendrá la pieza terminada. */
export function formaObjetivo(nivel: Nivel, pieza: Pieza): Celda[] {
  const acoples = Object.entries(pieza.objetivo).map(([orden, elemento]) => ({
    anclaje: Number(orden),
    elemento,
  }));
  return celdasConAcoples(nivel, pieza, acoples);
}

/**
 * ¿La pieza queda fija? Cada anclaje del objetivo tiene un elemento de la
 * forma esperada y no hay acoples de más. Se evalúa al terminar cada
 * ejecución (ver `recalcularEstados`).
 */
export function esFija(nivel: Nivel, pieza: Pieza, acoplados: Acople[]): boolean {
  return coincideObjetivo(nivel, pieza, acoplados);
}

/** Celdas absolutas de la matriz ocupadas por referencias y piezas colocadas. */
export function celdasOcupadas(nivel: Nivel, estado: EstadoPartida): Map<string, string> {
  const ocupadas = new Map<string, string>();
  for (const ref of nivel.matriz.piezasReferencia) {
    ref.celdas.forEach((c) => ocupadas.set(clave(c), ref.id));
  }
  for (const pieza of nivel.piezas) {
    const ep = estado.piezas[pieza.id];
    if (ep?.estado !== 'colocada' || !ep.colocadaEn) continue;
    const { x, y } = ep.colocadaEn;
    for (const [cx, cy] of formaPieza(nivel, pieza, ep.acoplados)) {
      ocupadas.set(clave([x + cx, y + cy]), pieza.id);
    }
  }
  return ocupadas;
}

export type MotivoColocacion = 'PIEZA_INEXISTENTE' | 'NO_FIJA' | 'HUECO_INVALIDO' | 'OCUPADO';

export type ResultadoColocacion =
  | { ok: true; estadoNuevo: EstadoPartida }
  | { ok: false; motivo: MotivoColocacion };

/**
 * Coloca una pieza fija con su origen en (x, y). Se acepta si (x, y) es la
 * posición objetivo de alguna pieza cuya forma final es igual a la de esta,
 * todas sus celdas están vacías en la matriz y ninguna está ocupada.
 */
export function colocarPieza(
  nivel: Nivel,
  estado: EstadoPartida,
  idPieza: string,
  x: number,
  y: number,
): ResultadoColocacion {
  const pieza = nivel.piezas.find((p) => p.id === idPieza);
  const ep = estado.piezas[idPieza];
  if (!pieza || !ep) return { ok: false, motivo: 'PIEZA_INEXISTENTE' };
  if (ep.estado !== 'fija') return { ok: false, motivo: 'NO_FIJA' };

  const forma = formaPieza(nivel, pieza, ep.acoplados);
  const hayHueco = nivel.piezas.some(
    (p) =>
      p.posicionObjetivo.x === x &&
      p.posicionObjetivo.y === y &&
      formasIguales(formaObjetivo(nivel, p), forma),
  );
  if (!hayHueco) return { ok: false, motivo: 'HUECO_INVALIDO' };

  const absolutas = forma.map(([cx, cy]): Celda => [x + cx, y + cy]);
  const dentro = absolutas.every(([cx, cy]) => nivel.matriz.celdas[cy]?.[cx] === 'vacia');
  if (!dentro) return { ok: false, motivo: 'HUECO_INVALIDO' };
  const ocupadas = celdasOcupadas(nivel, estado);
  if (absolutas.some((c) => ocupadas.has(clave(c)))) return { ok: false, motivo: 'OCUPADO' };

  return {
    ok: true,
    estadoNuevo: {
      ...estado,
      piezas: { ...estado.piezas, [idPieza]: { ...ep, estado: 'colocada', colocadaEn: { x, y } } },
    },
  };
}

/** El nivel termina cuando todas las celdas no 'fuera' están ocupadas. */
export function nivelCompleto(nivel: Nivel, estado: EstadoPartida): boolean {
  const ocupadas = celdasOcupadas(nivel, estado);
  return nivel.matriz.celdas.every((fila, y) =>
    fila.every((tipo, x) => tipo === 'fuera' || ocupadas.has(clave([x, y]))),
  );
}
