// Analizador del mini-Python: texto del jugador → instrucciones o errores.
// Descenso recursivo sobre los tokens de cada línea; nunca ejecuta código.

import { tokenizar, type Token } from './lexico';
import type {
  CodigoError,
  Destino,
  ErrorCodigo,
  Fuente,
  Instruccion,
  Operacion,
} from './tipos';

export type ResultadoAnalisis =
  | { ok: true; instrucciones: Instruccion[] }
  | { ok: false; errores: ErrorCodigo[] };

/** Árbol de una expresión: "A", NOMBRE, f(args) u objeto.metodo(args). */
type Expr =
  | { tipo: 'texto'; valor: string }
  | { tipo: 'nombre'; valor: string }
  | { tipo: 'llamada'; objeto?: string; nombre: string; args: Expr[] };

class FalloLinea extends Error {
  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

const falla = (codigo: CodigoError, mensaje: string): never => {
  throw new FalloLinea(codigo, mensaje);
};
const sintaxis = (mensaje: string): never => falla('SINTAXIS', mensaje);

// --- Gramática -------------------------------------------------------------

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  private ver(): Token | undefined {
    return this.tokens[this.pos];
  }

  private tomar(tipo: Token['tipo'], esperado: string): Token {
    const t = this.ver();
    if (!t || t.tipo !== tipo) {
      return sintaxis(t ? `se esperaba ${esperado} y hay "${t.valor}"` : `falta ${esperado}`);
    }
    this.pos++;
    return t;
  }

  /** linea := expr FIN */
  linea(): Expr {
    const expr = this.expr();
    const sobra = this.ver();
    if (sobra) sintaxis(`sobra "${sobra.valor}" al final de la línea`);
    return expr;
  }

  /** expr := TEXTO | NOMBRE ('.' NOMBRE)? ('(' args ')')? */
  private expr(): Expr {
    const t = this.ver();
    if (!t) return sintaxis('falta una expresión');
    if (t.tipo === 'texto') {
      this.pos++;
      return { tipo: 'texto', valor: t.valor };
    }
    const primero = this.tomar('nombre', 'un nombre').valor;
    let objeto: string | undefined;
    let nombre = primero;
    if (this.ver()?.tipo === 'punto') {
      this.pos++;
      objeto = primero;
      nombre = this.tomar('nombre', 'un método después del punto').valor;
    }
    if (this.ver()?.tipo !== 'abre') {
      return objeto === undefined
        ? { tipo: 'nombre', valor: nombre }
        : sintaxis(`falta "()" después de ${objeto}.${nombre}`);
    }
    this.pos++;
    const args = this.args();
    this.tomar('cierra', '")"');
    return { tipo: 'llamada', objeto, nombre, args };
  }

  /** args := ε | expr (',' expr)* */
  private args(): Expr[] {
    if (this.ver()?.tipo === 'cierra') return [];
    const args = [this.expr()];
    while (this.ver()?.tipo === 'coma') {
      this.pos++;
      args.push(this.expr());
    }
    return args;
  }
}

// --- Semántica: árbol → instrucción ----------------------------------------

const METODOS: Record<string, string[]> = { pila: ['push', 'pop'], cola: ['enqueue', 'dequeue'] };
const TODOS_METODOS = ['push', 'pop', 'enqueue', 'dequeue'];

function revisarMetodo(objeto: string, nombre: string): void {
  const propios = METODOS[objeto];
  if (!propios) return sintaxis(`"${objeto}" no existe; usa pila o cola`);
  if (!propios.includes(nombre)) {
    const ayuda = TODOS_METODOS.includes(nombre) ? `; ${objeto} usa ${propios.join(' y ')}` : '';
    falla('METODO_INEXISTENTE', `${objeto} no tiene el método ${nombre}()${ayuda}`);
  }
}

function aridad(e: Extract<Expr, { tipo: 'llamada' }>, n: number): void {
  if (e.args.length !== n) {
    const quien = e.objeto ? `${e.objeto}.${e.nombre}` : e.nombre;
    sintaxis(`${quien}() recibe ${n === 0 ? 'ningún' : n} argumento${n === 1 ? '' : 's'}`);
  }
}

/** Expresión que entrega un elemento. */
function aFuente(e: Expr): Fuente {
  if (e.tipo === 'texto') {
    if (!/^\w+$/.test(e.valor)) sintaxis(`"${e.valor}" no es un nombre de elemento válido`);
    return { tipo: 'bandeja', elemento: e.valor };
  }
  if (e.tipo === 'nombre') {
    return sintaxis(`${e.valor} no es un elemento; los elementos van entre comillas, como "A"`);
  }
  if (e.objeto === undefined) {
    if (e.nombre !== 'desarmar') return sintaxis(`${e.nombre}() no entrega ningún elemento`);
    aridad(e, 1);
    const pieza = e.args[0];
    if (pieza?.tipo !== 'nombre') return sintaxis('desarmar() recibe el nombre de una pieza, sin comillas');
    return { tipo: 'desarmar', pieza: pieza.valor };
  }
  revisarMetodo(e.objeto, e.nombre);
  if (e.nombre === 'pop' || e.nombre === 'dequeue') {
    aridad(e, 0);
    return { tipo: e.nombre };
  }
  return sintaxis(`${e.objeto}.${e.nombre}() no entrega ningún elemento`);
}

/** Fuentes que acepta cada destino (tabla de instrucciones válidas). */
const FUENTES_VALIDAS: Record<Destino, Fuente['tipo'][]> = {
  pila: ['bandeja', 'desarmar', 'dequeue'],
  cola: ['bandeja', 'desarmar', 'pop'],
  pieza: ['pop', 'dequeue'],
  bandeja: ['pop', 'dequeue'],
};

const MENSAJE_COMBINACION: Record<Destino, string> = {
  pila: 'a la pila solo entra un elemento de la bandeja, desarmado o sacado de la cola',
  cola: 'a la cola solo entra un elemento de la bandeja, desarmado o sacado de la pila',
  pieza: 'armar() solo recibe un elemento sacado de la pila o de la cola',
  bandeja: 'devolver() solo recibe un elemento sacado de la pila o de la cola',
};

function aSentencia(e: Expr): { destino: Destino; fuente: Fuente } {
  if (e.tipo !== 'llamada') return sintaxis('la línea debe ser una instrucción, como pila.push("A")');
  let destino: Destino;
  if (e.objeto !== undefined) {
    revisarMetodo(e.objeto, e.nombre);
    if (e.nombre === 'pop' || e.nombre === 'dequeue') {
      aridad(e, 0);
      return falla('EXTRACCION_SIN_DESTINO', `el elemento sacado con ${e.objeto}.${e.nombre}() no va a ningún lado`);
    }
    destino = e.objeto === 'pila' ? 'pila' : 'cola';
  } else if (e.nombre === 'armar') {
    destino = 'pieza';
  } else if (e.nombre === 'devolver') {
    destino = 'bandeja';
  } else if (e.nombre === 'desarmar') {
    aFuente(e);
    return falla('EXTRACCION_SIN_DESTINO', 'el elemento desarmado debe ir a la pila o a la cola');
  } else {
    return sintaxis(`la función ${e.nombre}() no existe`);
  }
  aridad(e, 1);
  const fuente = aFuente(e.args[0] as Expr);
  if (!FUENTES_VALIDAS[destino].includes(fuente.tipo)) sintaxis(MENSAJE_COMBINACION[destino]);
  return { destino, fuente };
}

const OPERACION_DESTINO: Record<Destino, Operacion> = {
  pila: 'push',
  cola: 'enqueue',
  pieza: 'armar',
  bandeja: 'devolver',
};

/** Operaciones que usa una instrucción, en orden de lectura. */
function operacionesDe(destino: Destino, fuente: Fuente): Operacion[] {
  const ops: Operacion[] = [OPERACION_DESTINO[destino]];
  if (fuente.tipo !== 'bandeja') ops.push(fuente.tipo);
  return ops;
}

// --- Punto de entrada ------------------------------------------------------

function analizarLinea(texto: string, permitidas: readonly Operacion[]): Omit<Instruccion, 'linea'> | null {
  if (/^\s/.test(texto) && texto.trim() !== '') sintaxis('la línea no debe empezar con espacios');
  const lex = tokenizar(texto);
  if (!lex.ok) return sintaxis(lex.mensaje);
  const tokens = lex.tokens.filter((t) => t.tipo !== 'comentario');
  if (tokens.length === 0) return null;
  const sentencia = aSentencia(new Parser(tokens).linea());
  const prohibida = operacionesDe(sentencia.destino, sentencia.fuente).find((op) => !permitidas.includes(op));
  if (prohibida) falla('OPERACION_NO_PERMITIDA', `${prohibida} todavía no está disponible en este nivel`);
  return sentencia;
}

/**
 * Analiza el código completo. Devuelve todas las instrucciones o, si alguna
 * línea falla, un error por cada línea con problemas.
 */
export function analizar(codigo: string, permitidas: readonly Operacion[]): ResultadoAnalisis {
  const instrucciones: Instruccion[] = [];
  const errores: ErrorCodigo[] = [];
  codigo.split(/\r?\n/).forEach((texto, i) => {
    const linea = i + 1;
    try {
      const sentencia = analizarLinea(texto, permitidas);
      if (sentencia) instrucciones.push({ linea, ...sentencia });
    } catch (e) {
      if (!(e instanceof FalloLinea)) throw e;
      errores.push({ linea, codigo: e.codigo, mensaje: e.message });
    }
  });
  return errores.length > 0 ? { ok: false, errores } : { ok: true, instrucciones };
}
