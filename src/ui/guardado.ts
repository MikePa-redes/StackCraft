// Guardado local (localStorage) del mejor resultado por nivel y del registro
// de aprendizaje (mecánicas §14). Cualquier fallo del almacenamiento
// (modo privado, cuota llena, datos corruptos) se ignora: el juego sigue.

import {
  actualizarMejores,
  agregarRegistro,
  esTablaMejores,
  type EntradaRegistro,
  type Resultado,
  type ResumenNivel,
} from '../motor/resultados';

const CLAVE_MEJORES = 'stack-craft:mejores';
const CLAVE_REGISTRO = 'stack-craft:registro';
const MAXIMO_REGISTRO = 200;

function leer(clave: string): unknown {
  try {
    const texto = localStorage.getItem(clave);
    return texto === null ? undefined : (JSON.parse(texto) as unknown);
  } catch {
    return undefined;
  }
}

function escribir(clave: string, valor: unknown): boolean {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function leerMejores(): Record<string, Resultado> {
  const dato = leer(CLAVE_MEJORES);
  return esTablaMejores(dato) ? dato : {};
}

function leerRegistro(): EntradaRegistro[] {
  const dato = leer(CLAVE_REGISTRO);
  return Array.isArray(dato) ? (dato as EntradaRegistro[]) : [];
}

export interface Guardado {
  /** Mejor resultado del nivel tras guardar (o el anterior si falló). */
  mejor: Resultado | undefined;
  record: boolean;
}

/** Guarda el resumen de un nivel completado y devuelve el mejor resultado. */
export function guardarResultado(resumen: ResumenNivel): Guardado {
  const previos = leerMejores();
  const { mejores, record } = actualizarMejores(previos, resumen);
  const ok = !record || escribir(CLAVE_MEJORES, mejores);
  escribir(CLAVE_REGISTRO, agregarRegistro(leerRegistro(), { ...resumen, fecha: new Date().toISOString() }, MAXIMO_REGISTRO));
  return ok ? { mejor: mejores[resumen.nivel], record } : { mejor: previos[resumen.nivel], record: false };
}
