import { describe, expect, it } from 'vitest';
import { correr, exito, partidaDosIniciales, partidaN05 } from './ayudasPrueba';
import { LIMITE_OPERACIONES, simular } from './simulador';
import type { CodigoError, Instruccion } from './tipos';

const { nivel, estado } = partidaN05();

/** Solución de PIEZA_01 en N05. */
const SOLUCION_P1 = [
  'pila.push(desarmar(PIEZA_01))',
  'pila.push(desarmar(PIEZA_02))',
  'armar(pila.pop())',
  'armar(pila.pop())',
].join('\n');

describe('simulador: operaciones', () => {
  it('push desde la bandeja y pop hacia la pieza activa', () => {
    const r = exito(correr(nivel, estado, 'pila.push("A")'));
    expect(r.estadoNuevo.bandeja).toEqual([]);
    expect(r.estadoNuevo.pila).toEqual(['A']);
    expect(r.eventos).toEqual([
      { linea: 1, elemento: 'A', desde: { lugar: 'bandeja' }, hacia: { lugar: 'pila' } },
    ]);
    const r2 = exito(correr(nivel, r.estadoNuevo, 'armar(pila.pop())'));
    expect(r2.estadoNuevo.pila).toEqual([]);
    expect(r2.estadoNuevo.piezas.PIEZA_01!.acoplados).toEqual([
      { anclaje: 1, elemento: 'C' },
      { anclaje: 2, elemento: 'A' },
    ]);
  });

  it('enqueue y dequeue respetan FIFO', () => {
    const r = exito(correr(nivel, estado, 'cola.enqueue("A")\ncola.enqueue(desarmar(PIEZA_02))'));
    expect(r.estadoNuevo.cola).toEqual(['A', 'B']);
    const r2 = exito(correr(nivel, r.estadoNuevo, 'devolver(cola.dequeue())'));
    expect(r2.estadoNuevo.cola).toEqual(['B']);
    expect(r2.estadoNuevo.bandeja).toEqual(['A']);
  });

  it('push y pop respetan LIFO; devolver va a la bandeja', () => {
    const codigo = 'pila.push("A")\npila.push(desarmar(PIEZA_02))\ndevolver(pila.pop())';
    const r = exito(correr(nivel, estado, codigo));
    expect(r.estadoNuevo.pila).toEqual(['A']);
    expect(r.estadoNuevo.bandeja).toEqual(['B']);
  });

  it('las transferencias entre pila y cola no acoplan nada', () => {
    const r = exito(correr(nivel, estado, 'pila.push("A")\ncola.enqueue(pila.pop())'));
    expect(r.estadoNuevo.cola).toEqual(['A']);
    expect(r.estadoNuevo.pila).toEqual([]);
    const r2 = exito(correr(nivel, r.estadoNuevo, 'pila.push(cola.dequeue())'));
    expect(r2.estadoNuevo.pila).toEqual(['A']);
    expect(r2.estadoNuevo.piezas).toEqual(estado.piezas);
    expect(r2.eventos[0]).toMatchObject({ desde: { lugar: 'cola' }, hacia: { lugar: 'pila' } });
  });

  it('desarmar registra el anclaje de origen', () => {
    const r = exito(correr(nivel, estado, 'pila.push(desarmar(PIEZA_02))'));
    expect(r.eventos[0]).toEqual({
      linea: 1,
      elemento: 'B',
      desde: { lugar: 'pieza', pieza: 'PIEZA_02', anclaje: 1 },
      hacia: { lugar: 'pila' },
    });
  });

  it('la solución de N05 deja ambas piezas fijas y todo vacío', () => {
    const r = exito(correr(nivel, estado, SOLUCION_P1));
    expect(r.estadoNuevo.piezas.PIEZA_01!.estado).toBe('fija');
    expect(r.estadoNuevo.piezas.PIEZA_02!.estado).toBe('incompleta');
    const r2 = exito(correr(nivel, r.estadoNuevo, 'pila.push("A")\narmar(pila.pop())'));
    expect(r2.estadoNuevo.piezas.PIEZA_02!.estado).toBe('fija');
    const { bandeja, pila, cola } = r2.estadoNuevo;
    expect([bandeja, pila, cola]).toEqual([[], [], []]);
  });

  it('una pieza que coincide a mitad de ejecución sigue desarmable hasta el final', () => {
    const r = exito(correr(nivel, estado, SOLUCION_P1 + '\npila.push(desarmar(PIEZA_01))'));
    expect(r.estadoNuevo.piezas.PIEZA_01!.estado).toBe('incompleta');
  });
});

describe('simulador: errores de ejecución', () => {
  const resueltaP1 = exito(correr(nivel, estado, SOLUCION_P1)).estadoNuevo;

  it.each<[string, string, CodigoError, number]>([
    ['elemento en una pieza', 'pila.push("B")', 'ELEMENTO_NO_DISPONIBLE', 1],
    ['elemento inexistente', 'pila.push("Z")', 'ELEMENTO_NO_DISPONIBLE', 1],
    ['pila vacía', 'armar(pila.pop())', 'ESTRUCTURA_VACIA', 1],
    ['cola vacía', 'pila.push("A")\narmar(cola.dequeue())', 'ESTRUCTURA_VACIA', 2],
    [
      'pieza sin movibles',
      'pila.push(desarmar(PIEZA_02))\npila.push(desarmar(PIEZA_02))',
      'PIEZA_SIN_MOVIBLES',
      2,
    ],
    [
      'pieza completa',
      'pila.push("A")\narmar(pila.pop())\npila.push(desarmar(PIEZA_02))\narmar(pila.pop())',
      'PIEZA_COMPLETA',
      4,
    ],
    ['no encaja (choca con C)', 'pila.push(desarmar(PIEZA_02))\narmar(pila.pop())', 'NO_ENCAJA', 2],
    ['pieza inexistente', 'pila.push(desarmar(PIEZA_99))', 'SINTAXIS', 1],
    ['pieza de referencia', 'pila.push(desarmar(REF_01))', 'SINTAXIS', 1],
  ])('%s → %s', (_n, codigo, esperado, linea) => {
    const r = correr(nivel, estado, codigo);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.codigo).toBe(esperado);
      expect(r.linea).toBe(linea);
      expect(r.eventosHastaError).toHaveLength(linea - 1);
    }
  });

  it('PIEZA_FIJA al desarmar una pieza fija', () => {
    const r = correr(nivel, resueltaP1, 'pila.push(desarmar(PIEZA_01))');
    expect(!r.ok && r.error.codigo).toBe('PIEZA_FIJA');
  });

  it('PIEZA_COMPLETA si no queda pieza por armar', () => {
    const final = exito(correr(nivel, resueltaP1, 'pila.push("A")\narmar(pila.pop())')).estadoNuevo;
    const r = correr(nivel, { ...final, pila: ['A'] }, 'armar(pila.pop())');
    expect(!r.ok && r.error.codigo).toBe('PIEZA_COMPLETA');
  });

  it(`LIMITE_OPERACIONES después de ${LIMITE_OPERACIONES} instrucciones`, () => {
    const par: Instruccion[] = [
      { linea: 0, destino: 'pila', fuente: { tipo: 'bandeja', elemento: 'A' } },
      { linea: 0, destino: 'bandeja', fuente: { tipo: 'pop' } },
    ];
    const programa = (n: number): Instruccion[] =>
      Array.from({ length: n }, (_, i) => ({ ...par[i % 2]!, linea: i + 1 }));
    expect(simular(nivel, estado, programa(LIMITE_OPERACIONES)).ok).toBe(true);
    const r = simular(nivel, estado, programa(LIMITE_OPERACIONES + 1));
    expect(!r.ok && [r.error.codigo, r.linea]).toEqual(['LIMITE_OPERACIONES', LIMITE_OPERACIONES + 1]);
  });

  it('una pieza en espera sí se puede desarmar', () => {
    const p = partidaDosIniciales('fifo');
    expect(p.estado.piezas.PIEZA_02!.estado).toBe('en_espera');
    expect(correr(p.nivel, p.estado, 'pila.push(desarmar(PIEZA_02))').ok).toBe(true);
  });
});
