// Verificador de niveles: ejecuta la solución de referencia de cada pieza en
// el orden de ordenPiezas y comprueba que el nivel queda resuelto (§10).
// Lo usan scripts/verificar-niveles.ts y las pruebas.

import { analizar } from './analizador';
import { estadoInicial } from './cargador';
import { simular } from './simulador';
import type { EstadoPartida, Nivel, Pieza } from './tipos';
import { colocarPieza, formaPieza, nivelCompleto } from './validador';

/** Sustituye cada {{hueco}} de la plantilla por su solución. */
export function codigoSolucion(pieza: Pieza): string {
  return pieza.plantilla
    .map((linea) => linea.replace(/\{\{(\w+)\}\}/g, (_, h: string) => pieza.solucion[h] ?? `{{${h}}}`))
    .join('\n');
}

/** Devuelve la lista de problemas encontrados; vacía si el nivel es válido. */
export function verificarNivel(nivel: Nivel): string[] {
  const errores: string[] = [];
  let estado: EstadoPartida = estadoInicial(nivel);

  for (const id of nivel.ordenPiezas) {
    const pieza = nivel.piezas.find((p) => p.id === id);
    const ep = estado.piezas[id];
    if (!pieza || !ep) {
      errores.push(`${id}: no existe`);
      continue;
    }
    if (ep.estado === 'fija') continue;
    if (ep.estado !== 'incompleta') errores.push(`${id}: no es la pieza activa (${ep.estado})`);
    const analisis = analizar(codigoSolucion(pieza), nivel.operaciones);
    if (!analisis.ok) {
      analisis.errores.forEach((e) => errores.push(`${id}: línea ${e.linea} ${e.codigo}: ${e.mensaje}`));
      return errores;
    }
    const r = simular(nivel, estado, analisis.instrucciones);
    if (!r.ok) {
      errores.push(`${id}: línea ${r.linea} ${r.error.codigo}: ${r.error.mensaje}`);
      return errores;
    }
    estado = r.estadoNuevo;
    if (estado.piezas[id]?.estado !== 'fija') errores.push(`${id}: no queda fija con su solución`);
  }

  const noFijas = nivel.piezas.filter((p) => estado.piezas[p.id]?.estado !== 'fija');
  noFijas.forEach((p) => errores.push(`${p.id}: no está fija al terminar`));
  if (estado.bandeja.length > 0) errores.push(`la bandeja no queda vacía: ${estado.bandeja.join(', ')}`);
  if (estado.pila.length > 0) errores.push(`la pila no queda vacía: ${estado.pila.join(', ')}`);
  if (estado.cola.length > 0) errores.push(`la cola no queda vacía: ${estado.cola.join(', ')}`);
  if (errores.length > 0) return errores;

  errores.push(...revisarCobertura(nivel, estado));
  for (const pieza of nivel.piezas) {
    const { x, y } = pieza.posicionObjetivo;
    const c = colocarPieza(nivel, estado, pieza.id, x, y);
    if (!c.ok) errores.push(`${pieza.id}: no se puede colocar en (${x}, ${y}): ${c.motivo}`);
    else estado = c.estadoNuevo;
  }
  if (errores.length === 0 && !nivelCompleto(nivel, estado)) errores.push('la matriz no queda completa');
  return errores;
}

/**
 * Cada celda no 'fuera' debe quedar cubierta exactamente una vez por las
 * piezas en su posición objetivo o por las de referencia; las celdas
 * 'fija' son justo las de referencia.
 */
function revisarCobertura(nivel: Nivel, estado: EstadoPartida): string[] {
  const errores: string[] = [];
  const cuenta = new Map<string, string[]>();
  const marcar = (x: number, y: number, quien: string) => {
    const k = `${x},${y}`;
    cuenta.set(k, [...(cuenta.get(k) ?? []), quien]);
  };
  for (const ref of nivel.matriz.piezasReferencia) {
    for (const [x, y] of ref.celdas) {
      marcar(x, y, ref.id);
      if (nivel.matriz.celdas[y]?.[x] !== 'fija') errores.push(`${ref.id}: celda (${x}, ${y}) no es 'fija'`);
    }
  }
  for (const pieza of nivel.piezas) {
    const { x, y } = pieza.posicionObjetivo;
    const acoplados = estado.piezas[pieza.id]?.acoplados ?? [];
    formaPieza(nivel, pieza, acoplados).forEach(([cx, cy]) => marcar(x + cx, y + cy, pieza.id));
  }
  nivel.matriz.celdas.forEach((fila, y) =>
    fila.forEach((tipo, x) => {
      const quienes = cuenta.get(`${x},${y}`) ?? [];
      cuenta.delete(`${x},${y}`);
      if (tipo === 'fuera' && quienes.length > 0) errores.push(`celda (${x}, ${y}) fuera ocupada por ${quienes.join(', ')}`);
      if (tipo !== 'fuera' && quienes.length === 0) errores.push(`celda (${x}, ${y}) sin cubrir`);
      if (quienes.length > 1) errores.push(`celda (${x}, ${y}) solapada: ${quienes.join(', ')}`);
    }),
  );
  for (const [k, quienes] of cuenta) errores.push(`celda (${k}) fuera de la matriz: ${quienes.join(', ')}`);
  return errores;
}
