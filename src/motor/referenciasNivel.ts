// Validación de REFERENCIAS de un nivel con estructura ya válida:
// ids que existen, sin duplicados, y cada elemento ubicado exactamente una vez.

import type { Nivel, Pieza } from './tipos';

function duplicados(ids: string[]): string[] {
  const vistos = new Set<string>();
  const repetidos = new Set<string>();
  for (const id of ids) {
    if (vistos.has(id)) repetidos.add(id);
    vistos.add(id);
  }
  return [...repetidos];
}

function revisarPieza(nivel: Nivel, pieza: Pieza, errores: string[]): void {
  const ruta = `pieza ${pieza.id}`;
  const ordenes = pieza.anclajes.map((a) => a.orden);
  for (const o of duplicados(ordenes.map(String))) {
    errores.push(`${ruta}: el orden de anclaje ${o} está repetido`);
  }
  for (const campo of ['iniciales', 'objetivo'] as const) {
    for (const [orden, elemento] of Object.entries(pieza[campo])) {
      if (!ordenes.includes(Number(orden))) {
        errores.push(`${ruta}: ${campo} usa el anclaje ${orden}, que no existe`);
      }
      if (!(elemento in nivel.elementos)) {
        errores.push(`${ruta}: ${campo} usa el elemento "${elemento}", que no existe`);
      }
    }
  }

  const enPlantilla = new Set(
    pieza.plantilla.flatMap((l) => [...l.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1] ?? '')),
  );
  for (const h of enPlantilla) {
    if (!(h in pieza.huecos)) errores.push(`${ruta}: la plantilla usa el hueco "${h}", que no está definido`);
  }
  for (const [clave, hueco] of Object.entries(pieza.huecos)) {
    if (!enPlantilla.has(clave)) errores.push(`${ruta}: el hueco "${clave}" no aparece en la plantilla`);
    const valor = pieza.solucion[clave];
    if (valor === undefined) {
      errores.push(`${ruta}: falta la solución del hueco "${clave}"`);
    } else if (hueco.tipo === 'lista') {
      if (!hueco.opciones || hueco.opciones.length === 0) {
        errores.push(`${ruta}: el hueco "${clave}" es de tipo lista y no tiene opciones`);
      } else if (!hueco.opciones.includes(valor)) {
        errores.push(`${ruta}: la solución "${valor}" del hueco "${clave}" no está entre sus opciones`);
      }
    }
  }
  for (const clave of Object.keys(pieza.solucion)) {
    if (!(clave in pieza.huecos)) errores.push(`${ruta}: la solución usa el hueco "${clave}", que no existe`);
  }

  const { x, y } = pieza.posicionObjetivo;
  if (x < 0 || y < 0 || x >= nivel.matriz.ancho || y >= nivel.matriz.alto) {
    errores.push(`${ruta}: la posición objetivo (${x}, ${y}) está fuera de la matriz`);
  }
}

export function revisarReferencias(nivel: Nivel): string[] {
  const errores: string[] = [];
  const idsPiezas = nivel.piezas.map((p) => p.id);

  for (const id of duplicados(idsPiezas)) errores.push(`la pieza "${id}" está repetida`);
  for (const id of duplicados(nivel.ordenPiezas)) errores.push(`ordenPiezas repite "${id}"`);
  for (const id of nivel.ordenPiezas) {
    if (!idsPiezas.includes(id)) errores.push(`ordenPiezas usa la pieza "${id}", que no existe`);
  }
  for (const id of idsPiezas) {
    if (!nivel.ordenPiezas.includes(id)) errores.push(`la pieza "${id}" no está en ordenPiezas`);
  }

  // Cada elemento debe empezar en exactamente un lugar: bandeja o una pieza.
  const ubicados = [
    ...nivel.bandeja,
    ...nivel.piezas.flatMap((p) => Object.values(p.iniciales)),
  ];
  for (const id of ubicados) {
    if (!(id in nivel.elementos)) errores.push(`el elemento "${id}" no existe en elementos`);
  }
  for (const id of duplicados(ubicados)) {
    errores.push(`el elemento "${id}" empieza en más de un lugar`);
  }
  for (const id of Object.keys(nivel.elementos)) {
    if (!ubicados.includes(id)) errores.push(`el elemento "${id}" no está en la bandeja ni en ninguna pieza`);
  }

  for (const id of duplicados(nivel.matriz.piezasReferencia.map((r) => r.id))) {
    errores.push(`la pieza de referencia "${id}" está repetida`);
  }
  for (const ref of nivel.matriz.piezasReferencia) {
    for (const [x, y] of ref.celdas) {
      if (x < 0 || y < 0 || x >= nivel.matriz.ancho || y >= nivel.matriz.alto) {
        errores.push(`la pieza de referencia "${ref.id}" tiene la celda (${x}, ${y}) fuera de la matriz`);
      }
    }
  }

  for (const pista of nivel.pistas) {
    if (pista.pieza !== undefined && !idsPiezas.includes(pista.pieza)) {
      errores.push(`la pista "${pista.id}" usa la pieza "${pista.pieza}", que no existe`);
    }
  }

  for (const pieza of nivel.piezas) revisarPieza(nivel, pieza, errores);
  return errores;
}
