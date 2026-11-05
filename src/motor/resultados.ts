// Resumen de un nivel completado, mejor resultado y entrada del registro de
// aprendizaje (mecánicas §12 y §14). Puro: el guardado vive en la UI.

import { estrellas, type Estadisticas, type Partida } from './partida';

export interface Resultado {
  estrellas: number;
  tiempoMs: number;
}

export interface ResumenNivel extends Resultado {
  nivel: string;
  pistas: string[];
  estadisticas: Estadisticas;
}

/** Entrada del registro de aprendizaje: el resumen y cuándo ocurrió. */
export interface EntradaRegistro extends ResumenNivel {
  /** Fecha ISO 8601. */
  fecha: string;
}

/** Resumen del intento actual (se usa al completar la matriz). */
export function resumirPartida(p: Partida): ResumenNivel {
  return {
    nivel: p.nivel.id,
    estrellas: estrellas(p),
    tiempoMs: Math.round(p.tiempoMs),
    pistas: [...p.pistasVistas],
    estadisticas: { ...p.estadisticas, errores: { ...p.estadisticas.errores } },
  };
}

/** ¿`nuevo` supera a `previo`? Más estrellas y, a igualdad, menor tiempo. */
export function esMejor(nuevo: Resultado, previo: Resultado | undefined): boolean {
  if (!previo) return true;
  if (nuevo.estrellas !== previo.estrellas) return nuevo.estrellas > previo.estrellas;
  return nuevo.tiempoMs < previo.tiempoMs;
}

/** Tabla de mejores resultados actualizada (objeto nuevo) y si hubo récord. */
export function actualizarMejores(
  mejores: Record<string, Resultado>,
  resumen: ResumenNivel,
): { mejores: Record<string, Resultado>; record: boolean } {
  if (!esMejor(resumen, mejores[resumen.nivel])) return { mejores, record: false };
  return {
    mejores: { ...mejores, [resumen.nivel]: { estrellas: resumen.estrellas, tiempoMs: resumen.tiempoMs } },
    record: true,
  };
}

/** Registro con la entrada nueva al final, recortado a las `maximo` más recientes. */
export function agregarRegistro(registro: EntradaRegistro[], entrada: EntradaRegistro, maximo: number): EntradaRegistro[] {
  return [...registro, entrada].slice(-maximo);
}

/** Valida datos leídos de fuera (p. ej. localStorage) como tabla de mejores. */
export function esTablaMejores(dato: unknown): dato is Record<string, Resultado> {
  if (typeof dato !== 'object' || dato === null || Array.isArray(dato)) return false;
  return Object.values(dato).every(
    (r: unknown) =>
      typeof r === 'object' &&
      r !== null &&
      typeof (r as Resultado).estrellas === 'number' &&
      typeof (r as Resultado).tiempoMs === 'number',
  );
}
