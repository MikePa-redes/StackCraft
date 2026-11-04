// Reproducción de una ejecución para animarla: estados intermedios a partir
// de los eventos del simulador. No valida ni recalcula fija/incompleta (eso
// solo ocurre al terminar la ejecución, invariante 6).

import type { EstadoPartida, Evento, Pieza } from './tipos';

function quitar(estado: EstadoPartida, ev: Evento): EstadoPartida {
  const { desde, elemento } = ev;
  switch (desde.lugar) {
    case 'bandeja':
      return { ...estado, bandeja: estado.bandeja.filter((id) => id !== elemento) };
    case 'pila':
      return { ...estado, pila: estado.pila.filter((id) => id !== elemento) };
    case 'cola':
      return { ...estado, cola: estado.cola.filter((id) => id !== elemento) };
    case 'pieza': {
      const pieza = estado.piezas[desde.pieza];
      if (!pieza) return estado;
      const acoplados = pieza.acoplados.filter((a) => a.elemento !== elemento);
      return { ...estado, piezas: { ...estado.piezas, [desde.pieza]: { ...pieza, acoplados } } };
    }
  }
}

function poner(estado: EstadoPartida, ev: Evento): EstadoPartida {
  const { hacia, elemento } = ev;
  switch (hacia.lugar) {
    case 'bandeja':
      return { ...estado, bandeja: [...estado.bandeja, elemento] };
    case 'pila':
      return { ...estado, pila: [...estado.pila, elemento] };
    case 'cola':
      return { ...estado, cola: [...estado.cola, elemento] };
    case 'pieza': {
      const pieza = estado.piezas[hacia.pieza];
      if (!pieza) return estado;
      const acoplados = [...pieza.acoplados, { anclaje: hacia.anclaje, elemento }];
      return { ...estado, piezas: { ...estado.piezas, [hacia.pieza]: { ...pieza, acoplados } } };
    }
  }
}

/** Mueve el elemento del evento de su origen a su destino (copia nueva). */
export function aplicarEvento(estado: EstadoPartida, ev: Evento): EstadoPartida {
  return poner(quitar(estado, ev), ev);
}

/** Estados antes y después de cada evento: longitud = eventos + 1. */
export function estadosIntermedios(estado: EstadoPartida, eventos: Evento[]): EstadoPartida[] {
  const estados = [estado];
  for (const ev of eventos) estados.push(aplicarEvento(estados[estados.length - 1]!, ev));
  return estados;
}

/** Sustituye cada {{hueco}} por el valor dado ('' si falta). */
export function rellenarPlantilla(pieza: Pieza, valores: Record<string, string>): string {
  return pieza.plantilla.map((linea) => linea.replace(/\{\{(\w+)\}\}/g, (_, h: string) => valores[h] ?? '')).join('\n');
}

/** ¿Todos los huecos de la pieza tienen un valor no vacío? */
export function huecosCompletos(pieza: Pieza, valores: Record<string, string>): boolean {
  return Object.keys(pieza.huecos).every((h) => (valores[h] ?? '').trim() !== '');
}
