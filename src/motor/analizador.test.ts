import { describe, expect, it } from 'vitest';
import { analizar } from './analizador';
import { OPERACIONES, type CodigoError, type Operacion } from './tipos';

const todas = OPERACIONES;

function instruccion(linea: string, permitidas: readonly Operacion[] = todas) {
  const r = analizar(linea, permitidas);
  if (!r.ok) throw new Error(`error inesperado: ${JSON.stringify(r.errores)}`);
  expect(r.instrucciones).toHaveLength(1);
  const { destino, fuente } = r.instrucciones[0]!;
  return { destino, fuente };
}

function codigoDe(linea: string, permitidas: readonly Operacion[] = todas): CodigoError {
  const r = analizar(linea, permitidas);
  if (r.ok) throw new Error(`se esperaba error en: ${linea}`);
  expect(r.errores).toHaveLength(1);
  return r.errores[0]!.codigo;
}

describe('analizador: formas válidas', () => {
  it.each([
    ['bandeja a pila', 'pila.push("A")', 'pila', { tipo: 'bandeja', elemento: 'A' }],
    ['desarmar hacia pila', 'pila.push(desarmar(PIEZA_02))', 'pila', { tipo: 'desarmar', pieza: 'PIEZA_02' }],
    ['pila a pieza', 'armar(pila.pop())', 'pieza', { tipo: 'pop' }],
    ['devolver a bandeja (pila)', 'devolver(pila.pop())', 'bandeja', { tipo: 'pop' }],
    ['devolver a bandeja (cola)', 'devolver(cola.dequeue())', 'bandeja', { tipo: 'dequeue' }],
    ['bandeja a cola', 'cola.enqueue("A")', 'cola', { tipo: 'bandeja', elemento: 'A' }],
    ['desarmar hacia cola', 'cola.enqueue(desarmar(PIEZA_02))', 'cola', { tipo: 'desarmar', pieza: 'PIEZA_02' }],
    ['cola a pieza', 'armar(cola.dequeue())', 'pieza', { tipo: 'dequeue' }],
    ['transferir pila → cola', 'cola.enqueue(pila.pop())', 'cola', { tipo: 'pop' }],
    ['transferir cola → pila', 'pila.push(cola.dequeue())', 'pila', { tipo: 'dequeue' }],
  ])('%s: %s', (_nombre, linea, destino, fuente) => {
    expect(instruccion(linea)).toEqual({ destino, fuente });
  });

  it('acepta comillas simples, espacios internos y comentario final', () => {
    expect(instruccion("pila . push( 'B' )  # meto B")).toEqual({
      destino: 'pila',
      fuente: { tipo: 'bandeja', elemento: 'B' },
    });
  });

  it('ignora comentarios y líneas vacías, y numera las líneas', () => {
    const r = analizar('# empiezo\n\npila.push("A")\r\narmar(pila.pop())\n', todas);
    expect(r.ok && r.instrucciones.map((i) => i.linea)).toEqual([3, 4]);
  });

  it('código vacío produce cero instrucciones', () => {
    expect(analizar('', todas)).toEqual({ ok: true, instrucciones: [] });
  });
});

describe('analizador: errores', () => {
  it.each([
    'pila.push(A)', // sin comillas
    'pila.push("A"', // falta paréntesis
    'pila.push("A") x', // sobra texto
    'pila.push("A")!', // carácter inválido
    'pila.push("A)', // comillas sin cerrar
    'pila.push()', // sin argumento
    'pila.push("A", "B")', // dos argumentos
    'pila.pop(1)', // pop con argumento
    'armar("A")', // bandeja directo a pieza
    'armar(desarmar(PIEZA_01))', // desarmado directo a pieza
    'devolver("A")', // de bandeja a bandeja
    'pila.push(pila.pop())', // misma estructura
    'pila.push(desarmar("PIEZA_01"))', // pieza entre comillas
    'mover("A")', // función inexistente
    'pilas.push("A")', // objeto inexistente
    'pila.push', // falta llamada
    '"A"', // expresión suelta
    '  pila.push("A")', // sangría
    'armar(pila.push("A"))', // push no entrega elemento
  ])('SINTAXIS: %s', (linea) => {
    expect(codigoDe(linea)).toBe('SINTAXIS');
  });

  it.each(['pila.enqueue("A")', 'cola.push("A")', 'armar(cola.pop())', 'armar(pila.dequeue())', 'pila.peek()'])(
    'METODO_INEXISTENTE: %s',
    (linea) => {
      expect(codigoDe(linea)).toBe('METODO_INEXISTENTE');
    },
  );

  it.each(['pila.pop()', 'cola.dequeue()', 'desarmar(PIEZA_01)'])('EXTRACCION_SIN_DESTINO: %s', (linea) => {
    expect(codigoDe(linea)).toBe('EXTRACCION_SIN_DESTINO');
  });

  it.each<[string, Operacion[]]>([
    ['cola.enqueue("A")', ['push', 'pop', 'armar']],
    ['pila.push(desarmar(PIEZA_01))', ['push', 'pop', 'armar']],
    ['devolver(pila.pop())', ['push', 'pop', 'armar', 'desarmar']],
    ['pila.push(cola.dequeue())', ['push', 'pop', 'enqueue', 'armar']],
  ])('OPERACION_NO_PERMITIDA: %s', (linea, permitidas) => {
    expect(codigoDe(linea, permitidas)).toBe('OPERACION_NO_PERMITIDA');
  });

  it('el error de sintaxis tiene prioridad sobre la operación no permitida', () => {
    expect(codigoDe('cola.enqueue(A)', ['push'])).toBe('SINTAXIS');
  });

  it('reporta un error por línea con su número y no devuelve instrucciones', () => {
    const r = analizar('pila.push("A")\ncola.pop()\narmar(pila.pop())\npila.pop()', todas);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errores.map((e) => [e.linea, e.codigo])).toEqual([
        [2, 'METODO_INEXISTENTE'],
        [4, 'EXTRACCION_SIN_DESTINO'],
      ]);
      expect(r.errores[0]!.mensaje).toContain('cola');
    }
  });

  it('es determinista', () => {
    const codigo = 'pila.push("A")\narmar(pila.pop())';
    expect(analizar(codigo, todas)).toEqual(analizar(codigo, todas));
  });
});
