// Validación de la ESTRUCTURA de un nivel en JSON (tipos y campos).
// Devuelve la lista de errores; vacía si el JSON tiene la forma de un Nivel.

import { OPERACIONES } from './tipos';

type Obj = Record<string, unknown>;

const esObjeto = (v: unknown): v is Obj =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const esTexto = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const esEntero = (v: unknown): v is number => Number.isInteger(v);
const esCelda = (v: unknown): boolean =>
  Array.isArray(v) && v.length === 2 && esEntero(v[0]) && esEntero(v[1]);

class Revisor {
  readonly errores: string[] = [];

  error(ruta: string, mensaje: string): void {
    this.errores.push(`${ruta}: ${mensaje}`);
  }

  texto(o: Obj, campo: string, ruta: string): void {
    if (!esTexto(o[campo])) this.error(`${ruta}.${campo}`, 'debe ser un texto no vacío');
  }

  entero(o: Obj, campo: string, ruta: string): void {
    if (!esEntero(o[campo])) this.error(`${ruta}.${campo}`, 'debe ser un número entero');
  }

  objeto(o: Obj, campo: string, ruta: string): Obj | undefined {
    const v = o[campo];
    if (esObjeto(v)) return v;
    this.error(`${ruta}.${campo}`, 'debe ser un objeto');
    return undefined;
  }

  lista(o: Obj, campo: string, ruta: string): unknown[] | undefined {
    const v = o[campo];
    if (Array.isArray(v)) return v;
    this.error(`${ruta}.${campo}`, 'debe ser una lista');
    return undefined;
  }

  listaTextos(o: Obj, campo: string, ruta: string): void {
    this.lista(o, campo, ruta)?.forEach((v, i) => {
      if (!esTexto(v)) this.error(`${ruta}.${campo}[${i}]`, 'debe ser un texto no vacío');
    });
  }

  celdas(o: Obj, campo: string, ruta: string): void {
    const v = this.lista(o, campo, ruta);
    if (!v) return;
    if (v.length === 0) this.error(`${ruta}.${campo}`, 'no puede estar vacía');
    v.forEach((c, i) => {
      if (!esCelda(c)) this.error(`${ruta}.${campo}[${i}]`, 'debe ser una celda [x, y] de enteros');
    });
  }

  /** Objeto cuyas claves son órdenes de anclaje y cuyos valores son textos. */
  porAnclaje(o: Obj, campo: string, ruta: string): void {
    const v = this.objeto(o, campo, ruta);
    if (!v) return;
    for (const [clave, valor] of Object.entries(v)) {
      if (!/^\d+$/.test(clave)) this.error(`${ruta}.${campo}`, `la clave "${clave}" no es un orden de anclaje`);
      if (!esTexto(valor)) this.error(`${ruta}.${campo}.${clave}`, 'debe ser un id de elemento');
    }
  }

  diccionarioTextos(o: Obj, campo: string, ruta: string): void {
    const v = this.objeto(o, campo, ruta);
    if (!v) return;
    for (const [clave, valor] of Object.entries(v)) {
      if (typeof valor !== 'string') this.error(`${ruta}.${campo}.${clave}`, 'debe ser un texto');
    }
  }
}

function revisarMatriz(r: Revisor, m: Obj): void {
  const ruta = 'matriz';
  r.entero(m, 'ancho', ruta);
  r.entero(m, 'alto', ruta);
  const filas = r.lista(m, 'celdas', ruta);
  if (filas && esEntero(m.ancho) && esEntero(m.alto)) {
    if (filas.length !== m.alto) r.error(`${ruta}.celdas`, `debe tener ${m.alto} filas`);
    filas.forEach((fila, y) => {
      if (!Array.isArray(fila) || fila.length !== m.ancho) {
        r.error(`${ruta}.celdas[${y}]`, `debe ser una lista de ${m.ancho} celdas`);
        return;
      }
      fila.forEach((c, x) => {
        if (c !== 'fuera' && c !== 'vacia' && c !== 'fija') {
          r.error(`${ruta}.celdas[${y}][${x}]`, 'debe ser "fuera", "vacia" o "fija"');
        }
      });
    });
  }
  r.lista(m, 'piezasReferencia', ruta)?.forEach((p, i) => {
    const rp = `${ruta}.piezasReferencia[${i}]`;
    if (!esObjeto(p)) return r.error(rp, 'debe ser un objeto');
    r.texto(p, 'id', rp);
    r.celdas(p, 'celdas', rp);
  });
}

function revisarPieza(r: Revisor, p: unknown, i: number): void {
  const ruta = `piezas[${i}]`;
  if (!esObjeto(p)) return r.error(ruta, 'debe ser un objeto');
  r.texto(p, 'id', ruta);
  r.celdas(p, 'nucleo', ruta);
  r.lista(p, 'anclajes', ruta)?.forEach((a, j) => {
    const ra = `${ruta}.anclajes[${j}]`;
    if (!esObjeto(a)) return r.error(ra, 'debe ser un objeto');
    r.entero(a, 'orden', ra);
    r.entero(a, 'x', ra);
    r.entero(a, 'y', ra);
  });
  r.porAnclaje(p, 'iniciales', ruta);
  r.porAnclaje(p, 'objetivo', ruta);
  const pos = r.objeto(p, 'posicionObjetivo', ruta);
  if (pos) {
    r.entero(pos, 'x', `${ruta}.posicionObjetivo`);
    r.entero(pos, 'y', `${ruta}.posicionObjetivo`);
  }
  r.listaTextos(p, 'plantilla', ruta);
  const huecos = r.objeto(p, 'huecos', ruta);
  for (const [clave, h] of Object.entries(huecos ?? {})) {
    const rh = `${ruta}.huecos.${clave}`;
    if (!esObjeto(h)) {
      r.error(rh, 'debe ser un objeto');
    } else if (h.tipo !== 'lista' && h.tipo !== 'texto') {
      r.error(`${rh}.tipo`, 'debe ser "lista" o "texto"');
    } else if (h.opciones !== undefined) {
      r.listaTextos(h, 'opciones', rh);
    }
  }
  r.diccionarioTextos(p, 'solucion', ruta);
}

export function revisarEstructura(json: unknown): string[] {
  const r = new Revisor();
  if (!esObjeto(json)) {
    r.error('nivel', 'debe ser un objeto JSON');
    return r.errores;
  }
  const ruta = 'nivel';
  r.texto(json, 'id', ruta);
  r.texto(json, 'etapa', ruta);
  r.texto(json, 'titulo', ruta);
  r.lista(json, 'operaciones', ruta)?.forEach((op, i) => {
    if (!OPERACIONES.includes(op as never)) {
      r.error(`${ruta}.operaciones[${i}]`, `operación desconocida "${String(op)}"`);
    }
  });
  if (json.desarmado !== 'lifo' && json.desarmado !== 'fifo') {
    r.error(`${ruta}.desarmado`, 'debe ser "lifo" o "fifo"');
  }
  r.listaTextos(json, 'ordenPiezas', ruta);
  const elementos = r.objeto(json, 'elementos', ruta);
  for (const [id, e] of Object.entries(elementos ?? {})) {
    const re = `elementos.${id}`;
    if (!esObjeto(e)) {
      r.error(re, 'debe ser un objeto');
      continue;
    }
    r.texto(e, 'color', re);
    r.celdas(e, 'forma', re);
  }
  const matriz = r.objeto(json, 'matriz', ruta);
  if (matriz) revisarMatriz(r, matriz);
  r.listaTextos(json, 'bandeja', ruta);
  r.lista(json, 'piezas', ruta)?.forEach((p, i) => revisarPieza(r, p, i));
  r.lista(json, 'pistas', ruta)?.forEach((p, i) => {
    const rp = `pistas[${i}]`;
    if (!esObjeto(p)) return r.error(rp, 'debe ser un objeto');
    r.texto(p, 'id', rp);
    r.texto(p, 'texto', rp);
    if (p.pieza !== undefined) r.texto(p, 'pieza', rp);
  });
  r.diccionarioTextos(json, 'dialogos', ruta);
  return r.errores;
}
