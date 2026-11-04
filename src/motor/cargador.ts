// Carga de niveles: valida el JSON y construye el estado inicial de partida.

import { revisarEstructura } from './estructuraNivel';
import { coincideObjetivo } from './formas';
import { revisarReferencias } from './referenciasNivel';
import type { Acople, EstadoPartida, EstadoPieza, Nivel, Posicion } from './tipos';

/** Error de un nivel mal formado; `errores` lista cada problema encontrado. */
export class ErrorNivel extends Error {
  constructor(
    readonly idNivel: string,
    readonly errores: string[],
  ) {
    super(`Nivel ${idNivel} mal formado:\n- ${errores.join('\n- ')}`);
    this.name = 'ErrorNivel';
  }
}

function idDe(json: unknown): string {
  if (typeof json === 'object' && json !== null && 'id' in json && typeof json.id === 'string') {
    return json.id;
  }
  return '(sin id)';
}

/** Valida estructura y referencias; lanza ErrorNivel si algo falla. */
export function cargarNivel(json: unknown): Nivel {
  const id = idDe(json);
  const errEstructura = revisarEstructura(json);
  if (errEstructura.length > 0) throw new ErrorNivel(id, errEstructura);
  const nivel = json as Nivel;
  const errReferencias = revisarReferencias(nivel);
  if (errReferencias.length > 0) throw new ErrorNivel(id, errReferencias);
  return nivel;
}

/**
 * Estado inicial: los elementos iniciales cuentan como acoplados en el orden
 * de sus anclajes. Las piezas que ya coinciden con su objetivo empiezan fijas;
 * la primera no fija de ordenPiezas es la que se trabaja y el resto espera.
 */
export function estadoInicial(nivel: Nivel): EstadoPartida {
  const piezas: Record<string, EstadoPieza> = {};
  let hayActiva = false;
  for (const id of nivel.ordenPiezas) {
    const pieza = nivel.piezas.find((p) => p.id === id);
    if (!pieza) continue;
    const acoplados: Acople[] = Object.entries(pieza.iniciales)
      .map(([orden, elemento]) => ({ anclaje: Number(orden), elemento }))
      .sort((a, b) => a.anclaje - b.anclaje);
    let estado: EstadoPieza['estado'];
    if (coincideObjetivo(nivel, pieza, acoplados)) {
      estado = 'fija';
    } else if (!hayActiva) {
      estado = 'incompleta';
      hayActiva = true;
    } else {
      estado = 'en_espera';
    }
    piezas[id] = { estado, acoplados };
  }
  return { bandeja: [...nivel.bandeja], pila: [], cola: [], piezas };
}

/** Carga un nivel desde JSON y devuelve el nivel tipado y su estado inicial. */
export function cargarPartida(json: unknown): { nivel: Nivel; estado: EstadoPartida } {
  const nivel = cargarNivel(json);
  return { nivel, estado: estadoInicial(nivel) };
}

/** Posición de cada elemento en el estado dado. */
export function posicionesElementos(estado: EstadoPartida): Record<string, Posicion> {
  const posiciones: Record<string, Posicion> = {};
  for (const id of estado.bandeja) posiciones[id] = { lugar: 'bandeja' };
  for (const id of estado.pila) posiciones[id] = { lugar: 'pila' };
  for (const id of estado.cola) posiciones[id] = { lugar: 'cola' };
  for (const [pieza, ep] of Object.entries(estado.piezas)) {
    for (const { anclaje, elemento } of ep.acoplados) {
      posiciones[elemento] = { lugar: 'pieza', pieza, anclaje };
    }
  }
  return posiciones;
}
