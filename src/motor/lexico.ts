// Analizador léxico del mini-Python. También sirve para resaltar código.

export type TipoToken = 'nombre' | 'texto' | 'punto' | 'abre' | 'cierra' | 'coma' | 'comentario';

export interface Token {
  tipo: TipoToken;
  /** Texto del token; en 'texto', el contenido sin comillas. */
  valor: string;
  /** Columna inicial (0 = primera). */
  columna: number;
}

export type ResultadoLexico =
  | { ok: true; tokens: Token[] }
  | { ok: false; columna: number; mensaje: string };

const SIMBOLOS: Record<string, TipoToken> = {
  '.': 'punto',
  '(': 'abre',
  ')': 'cierra',
  ',': 'coma',
};

const esInicioNombre = (c: string): boolean => /[A-Za-z_]/.test(c);
const esParteNombre = (c: string): boolean => /[A-Za-z0-9_]/.test(c);

/** Divide una línea en tokens. Los espacios entre tokens se ignoran. */
export function tokenizar(linea: string): ResultadoLexico {
  const tokens: Token[] = [];
  let i = 0;
  while (i < linea.length) {
    const c = linea[i] ?? '';
    if (c === ' ' || c === '\t') {
      i++;
    } else if (c === '#') {
      tokens.push({ tipo: 'comentario', valor: linea.slice(i), columna: i });
      break;
    } else if (c in SIMBOLOS) {
      tokens.push({ tipo: SIMBOLOS[c] as TipoToken, valor: c, columna: i });
      i++;
    } else if (esInicioNombre(c)) {
      const inicio = i;
      while (i < linea.length && esParteNombre(linea[i] ?? '')) i++;
      tokens.push({ tipo: 'nombre', valor: linea.slice(inicio, i), columna: inicio });
    } else if (c === '"' || c === "'") {
      const inicio = i;
      const fin = linea.indexOf(c, i + 1);
      if (fin === -1) return { ok: false, columna: inicio, mensaje: 'falta cerrar las comillas' };
      tokens.push({ tipo: 'texto', valor: linea.slice(i + 1, fin), columna: inicio });
      i = fin + 1;
    } else {
      return { ok: false, columna: i, mensaje: `el carácter "${c}" no está permitido` };
    }
  }
  return { ok: true, tokens };
}
