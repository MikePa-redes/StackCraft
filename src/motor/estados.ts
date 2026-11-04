// Recalcula el estado visual de cada pieza (en espera, incompleta, fija).
// Se usa al cargar el nivel y al TERMINAR cada ejecución, nunca a mitad.

import { coincideObjetivo } from './formas';
import type { EstadoPieza, Nivel } from './tipos';

/**
 * Las piezas colocadas o ya fijas se conservan; una pieza que coincide con
 * su objetivo pasa a fija; la primera no fija de ordenPiezas queda
 * incompleta y las demás en espera.
 */
export function recalcularEstados(
  nivel: Nivel,
  piezas: Record<string, EstadoPieza>,
): Record<string, EstadoPieza> {
  const resultado: Record<string, EstadoPieza> = {};
  let hayActiva = false;
  for (const id of nivel.ordenPiezas) {
    const pieza = nivel.piezas.find((p) => p.id === id);
    const actual = piezas[id];
    if (!pieza || !actual) continue;
    let estado: EstadoPieza['estado'];
    if (actual.estado === 'colocada' || actual.estado === 'fija') {
      estado = actual.estado;
    } else if (coincideObjetivo(nivel, pieza, actual.acoplados)) {
      estado = 'fija';
    } else if (!hayActiva) {
      estado = 'incompleta';
      hayActiva = true;
    } else {
      estado = 'en_espera';
    }
    resultado[id] = estado === actual.estado ? actual : { ...actual, estado };
  }
  return resultado;
}

/** Id de la pieza que se trabaja: la primera no fija de ordenPiezas. */
export function piezaActiva(nivel: Nivel, piezas: Record<string, EstadoPieza>): string | undefined {
  return nivel.ordenPiezas.find((id) => piezas[id]?.estado === 'incompleta');
}
