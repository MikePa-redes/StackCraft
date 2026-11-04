// Reducer de partida: selección de pieza, ejecución, deshacer, colocación,
// pistas, cronómetro y reinicio (mecánicas §8, §11, §12 y §13).
// Puro: el tiempo entra como dato en la acción 'tick'; no lee el reloj.

import { analizar } from './analizador';
import { estadoInicial } from './cargador';
import { piezaActiva } from './estados';
import { simular } from './simulador';
import type { ErrorCodigo, EstadoPartida, Evento, Nivel } from './tipos';
import { colocarPieza, nivelCompleto, type MotivoColocacion } from './validador';

/** Resultado de la última ejecución, para que la UI lo anime o explique. */
export type ResultadoEjecucion =
  | { ok: true; eventos: Evento[] }
  | { ok: false; errores: ErrorCodigo[]; eventosHastaError: Evento[] };

export type ResultadoColocar = { ok: true; pieza: string } | { ok: false; pieza: string; motivo: MotivoColocacion };

export interface Partida {
  nivel: Nivel;
  juego: EstadoPartida;
  /** Pieza que el jugador está viendo (cualquiera, incluso fija o colocada). */
  seleccionada: string | null;
  /** Estado previo a la última ejecución sin errores; null si no se puede deshacer. */
  anterior: EstadoPartida | null;
  ultimaEjecucion: ResultadoEjecucion | null;
  ultimaColocacion: ResultadoColocar | null;
  /** Ids de pistas distintas consultadas, en orden de consulta. */
  pistasVistas: string[];
  /** Pista que se muestra ahora. */
  pistaMostrada: string | null;
  /** Tiempo acumulado en milisegundos. */
  tiempoMs: number;
  pausado: boolean;
  completado: boolean;
}

export type Accion =
  | { tipo: 'seleccionar'; pieza: string | null }
  | { tipo: 'ejecutar'; codigo: string }
  | { tipo: 'deshacer' }
  | { tipo: 'colocar'; pieza: string; x: number; y: number }
  | { tipo: 'verPista'; id?: string }
  | { tipo: 'cerrarPista' }
  | { tipo: 'pausar' }
  | { tipo: 'reanudar' }
  | { tipo: 'reiniciar' }
  | { tipo: 'tick'; ms: number };

/** Partida recién iniciada: cronómetro en 0 y corriendo, sin pistas vistas. */
export function crearPartida(nivel: Nivel): Partida {
  const juego = estadoInicial(nivel);
  return {
    nivel,
    juego,
    seleccionada: piezaActiva(nivel, juego.piezas) ?? null,
    anterior: null,
    ultimaEjecucion: null,
    ultimaColocacion: null,
    pistasVistas: [],
    pistaMostrada: null,
    tiempoMs: 0,
    pausado: false,
    completado: false,
  };
}

/** estrellas = max(0, 3 - pistas distintas consultadas) (§12). */
export function estrellas(p: Partida): number {
  return Math.max(0, 3 - p.pistasVistas.length);
}

/** ¿La pieza seleccionada es la que toca trabajar (carga plantilla)? */
export function puedeEditar(p: Partida): boolean {
  return !p.completado && p.seleccionada !== null && p.seleccionada === piezaActiva(p.nivel, p.juego.piezas);
}

export function puedeDeshacer(p: Partida): boolean {
  return !p.completado && p.anterior !== null;
}

/** Siguiente pista no vista, en el orden en que la define el nivel. */
export function siguientePista(p: Partida): string | undefined {
  return p.nivel.pistas.find((pi) => !p.pistasVistas.includes(pi.id))?.id;
}

function ejecutar(p: Partida, codigo: string): Partida {
  if (!puedeEditar(p)) return p;
  const analisis = analizar(codigo, p.nivel.operaciones);
  if (!analisis.ok) {
    return { ...p, ultimaEjecucion: { ok: false, errores: analisis.errores, eventosHastaError: [] } };
  }
  const r = simular(p.nivel, p.juego, analisis.instrucciones);
  if (!r.ok) {
    // Una ejecución con error no cambia el estado ni el alcance de Deshacer.
    return { ...p, ultimaEjecucion: { ok: false, errores: [r.error], eventosHastaError: r.eventosHastaError } };
  }
  return { ...p, juego: r.estadoNuevo, anterior: p.juego, ultimaEjecucion: { ok: true, eventos: r.eventos } };
}

function deshacer(p: Partida): Partida {
  if (!puedeDeshacer(p) || !p.anterior) return p;
  return { ...p, juego: p.anterior, anterior: null, ultimaEjecucion: null };
}

function colocar(p: Partida, pieza: string, x: number, y: number): Partida {
  if (p.completado) return p;
  const r = colocarPieza(p.nivel, p.juego, pieza, x, y);
  if (!r.ok) return { ...p, ultimaColocacion: { ok: false, pieza, motivo: r.motivo } };
  return {
    ...p,
    juego: r.estadoNuevo,
    // Deshacer deja de estar disponible en cuanto se coloca una pieza.
    anterior: null,
    ultimaColocacion: { ok: true, pieza },
    completado: nivelCompleto(p.nivel, r.estadoNuevo),
  };
}

function verPista(p: Partida, id?: string): Partida {
  if (p.completado) return p;
  const elegida = id ?? siguientePista(p);
  if (!elegida || !p.nivel.pistas.some((pi) => pi.id === elegida)) return p;
  const pistasVistas = p.pistasVistas.includes(elegida) ? p.pistasVistas : [...p.pistasVistas, elegida];
  return { ...p, pistasVistas, pistaMostrada: elegida };
}

export function reducirPartida(p: Partida, accion: Accion): Partida {
  switch (accion.tipo) {
    case 'seleccionar':
      if (accion.pieza !== null && !p.juego.piezas[accion.pieza]) return p;
      return { ...p, seleccionada: accion.pieza };
    case 'ejecutar':
      return ejecutar(p, accion.codigo);
    case 'deshacer':
      return deshacer(p);
    case 'colocar':
      return colocar(p, accion.pieza, accion.x, accion.y);
    case 'verPista':
      return verPista(p, accion.id);
    case 'cerrarPista':
      return p.pistaMostrada === null ? p : { ...p, pistaMostrada: null };
    case 'pausar':
      return p.pausado ? p : { ...p, pausado: true };
    case 'reanudar':
      return p.pausado ? { ...p, pausado: false } : p;
    case 'reiniciar':
      return crearPartida(p.nivel);
    case 'tick':
      if (p.pausado || p.completado || !(accion.ms > 0)) return p;
      return { ...p, tiempoMs: p.tiempoMs + accion.ms };
  }
}
