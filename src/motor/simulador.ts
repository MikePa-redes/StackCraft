// Simulador: aplica instrucciones sobre una copia del estado.
// Si una instrucción falla, el estado original queda intacto.

import { piezaActiva, recalcularEstados } from './estados';
import type {
  Celda,
  CodigoError,
  Destino,
  ErrorCodigo,
  EstadoPartida,
  Evento,
  Fuente,
  Instruccion,
  Nivel,
  Posicion,
} from './tipos';

/** Máximo de instrucciones ejecutadas por ejecución. */
export const LIMITE_OPERACIONES = 200;

export type ResultadoSimulacion =
  | { ok: true; eventos: Evento[]; estadoNuevo: EstadoPartida }
  | { ok: false; error: ErrorCodigo; linea: number; eventosHastaError: Evento[] };

class FalloEjecucion extends Error {
  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

const falla = (codigo: CodigoError, mensaje: string): never => {
  throw new FalloEjecucion(codigo, mensaje);
};

/** Copia profunda de lo que el simulador modifica. */
function copiar(estado: EstadoPartida): EstadoPartida {
  const piezas: EstadoPartida['piezas'] = {};
  for (const [id, p] of Object.entries(estado.piezas)) {
    piezas[id] = { ...p, acoplados: p.acoplados.map((a) => ({ ...a })) };
  }
  return { bandeja: [...estado.bandeja], pila: [...estado.pila], cola: [...estado.cola], piezas };
}

class Ejecucion {
  private readonly bloqueadas: Set<string>;
  private readonly activa: string | undefined;

  constructor(
    private readonly nivel: Nivel,
    private readonly estado: EstadoPartida,
  ) {
    // Fija/colocada se evalúa con el estado ANTERIOR a la ejecución.
    this.bloqueadas = new Set(
      Object.entries(estado.piezas)
        .filter(([, p]) => p.estado === 'fija' || p.estado === 'colocada')
        .map(([id]) => id),
    );
    this.activa = piezaActiva(nivel, estado.piezas);
  }

  ejecutar(ins: Instruccion): Evento {
    const { elemento, desde } = this.tomar(ins.fuente);
    const hacia = this.dejar(ins.destino, elemento);
    return { linea: ins.linea, elemento, desde, hacia };
  }

  private tomar(fuente: Fuente): { elemento: string; desde: Posicion } {
    const e = this.estado;
    switch (fuente.tipo) {
      case 'bandeja': {
        const i = e.bandeja.indexOf(fuente.elemento);
        if (i === -1) falla('ELEMENTO_NO_DISPONIBLE', `el elemento "${fuente.elemento}" no está en la bandeja`);
        e.bandeja.splice(i, 1);
        return { elemento: fuente.elemento, desde: { lugar: 'bandeja' } };
      }
      case 'pop': {
        const elemento = e.pila.pop() ?? falla('ESTRUCTURA_VACIA', 'la pila está vacía');
        return { elemento, desde: { lugar: 'pila' } };
      }
      case 'dequeue': {
        const elemento = e.cola.shift() ?? falla('ESTRUCTURA_VACIA', 'la cola está vacía');
        return { elemento, desde: { lugar: 'cola' } };
      }
      case 'desarmar':
        return this.desarmar(fuente.pieza);
    }
  }

  private desarmar(id: string): { elemento: string; desde: Posicion } {
    const pieza = this.estado.piezas[id];
    if (!pieza) return falla('SINTAXIS', `la pieza ${id} no existe en este nivel`);
    if (this.bloqueadas.has(id)) falla('PIEZA_FIJA', `la pieza ${id} está fija y no se puede desarmar`);
    // LIFO: sale el último acoplado. FIFO: el acoplado hace más tiempo.
    const acople =
      (this.nivel.desarmado === 'lifo' ? pieza.acoplados.pop() : pieza.acoplados.shift()) ??
      falla('PIEZA_SIN_MOVIBLES', `la pieza ${id} no tiene elementos que desarmar`);
    return { elemento: acople.elemento, desde: { lugar: 'pieza', pieza: id, anclaje: acople.anclaje } };
  }

  private dejar(destino: Destino, elemento: string): Posicion {
    const e = this.estado;
    switch (destino) {
      case 'pila':
        e.pila.push(elemento);
        return { lugar: 'pila' };
      case 'cola':
        e.cola.push(elemento);
        return { lugar: 'cola' };
      case 'bandeja':
        e.bandeja.push(elemento);
        return { lugar: 'bandeja' };
      case 'pieza':
        return this.armar(elemento);
    }
  }

  /** Acopla en el anclaje libre de menor número de la pieza activa. */
  private armar(elemento: string): Posicion {
    const id = this.activa ?? falla('PIEZA_COMPLETA', 'no hay ninguna pieza por armar');
    const def = this.nivel.piezas.find((p) => p.id === id);
    const pieza = this.estado.piezas[id];
    if (!def || !pieza) return falla('PIEZA_COMPLETA', 'no hay ninguna pieza por armar');
    const ocupados = new Set(pieza.acoplados.map((a) => a.anclaje));
    const libre = [...def.anclajes].sort((a, b) => a.orden - b.orden).find((a) => !ocupados.has(a.orden));
    if (!libre) return falla('PIEZA_COMPLETA', `la pieza ${id} no tiene anclajes libres`);

    const clave = ([x, y]: Celda): string => `${x},${y}`;
    const celdasDe = (idElemento: string, ax: number, ay: number): Celda[] =>
      (this.nivel.elementos[idElemento]?.forma ?? []).map(([x, y]): Celda => [ax + x, ay + y]);
    const tomadas = new Set(def.nucleo.map(clave));
    for (const a of pieza.acoplados) {
      const anclaje = def.anclajes.find((d) => d.orden === a.anclaje);
      if (anclaje) celdasDe(a.elemento, anclaje.x, anclaje.y).forEach((c) => tomadas.add(clave(c)));
    }
    if (celdasDe(elemento, libre.x, libre.y).some((c) => tomadas.has(clave(c)))) {
      falla('NO_ENCAJA', `el elemento "${elemento}" no encaja en el anclaje ${libre.orden} de ${id}`);
    }
    pieza.acoplados.push({ anclaje: libre.orden, elemento });
    return { lugar: 'pieza', pieza: id, anclaje: libre.orden };
  }
}

/**
 * Ejecuta las instrucciones en orden. El estado de las piezas (fija o no)
 * se recalcula solo al terminar sin errores. Determinista y sin efectos.
 */
export function simular(nivel: Nivel, estado: EstadoPartida, instrucciones: Instruccion[]): ResultadoSimulacion {
  const trabajo = copiar(estado);
  const ejecucion = new Ejecucion(nivel, trabajo);
  const eventos: Evento[] = [];
  for (const [i, ins] of instrucciones.entries()) {
    try {
      if (i >= LIMITE_OPERACIONES) {
        falla('LIMITE_OPERACIONES', `se superó el máximo de ${LIMITE_OPERACIONES} operaciones`);
      }
      eventos.push(ejecucion.ejecutar(ins));
    } catch (err) {
      if (!(err instanceof FalloEjecucion)) throw err;
      const error = { linea: ins.linea, codigo: err.codigo, mensaje: err.message };
      return { ok: false, error, linea: ins.linea, eventosHastaError: eventos };
    }
  }
  return {
    ok: true,
    eventos,
    estadoNuevo: { ...trabajo, piezas: recalcularEstados(nivel, trabajo.piezas) },
  };
}
