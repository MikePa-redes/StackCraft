import { describe, expect, it } from 'vitest';
import n05 from '../niveles/N05.json';
import { cargarPartida, ErrorNivel, posicionesElementos } from './cargador';

/** Copia mutable de N05 para fabricar niveles rotos. */
const copiaN05 = (): Record<string, any> => structuredClone(n05);

function erroresDe(json: unknown): string[] {
  try {
    cargarPartida(json);
  } catch (e) {
    if (e instanceof ErrorNivel) return e.errores;
    throw e;
  }
  throw new Error('se esperaba un ErrorNivel');
}

describe('cargador: N05 válido', () => {
  const { nivel, estado } = cargarPartida(n05);

  it('carga el nivel tipado', () => {
    expect(nivel.id).toBe('N05');
    expect(nivel.piezas).toHaveLength(2);
  });

  it('construye el estado inicial', () => {
    expect(estado.bandeja).toEqual(['A']);
    expect(estado.pila).toEqual([]);
    expect(estado.cola).toEqual([]);
    expect(estado.piezas.PIEZA_01).toEqual({
      estado: 'incompleta',
      acoplados: [{ anclaje: 1, elemento: 'C' }],
    });
    expect(estado.piezas.PIEZA_02).toEqual({
      estado: 'en_espera',
      acoplados: [{ anclaje: 1, elemento: 'B' }],
    });
  });

  it('ubica cada elemento exactamente una vez', () => {
    expect(posicionesElementos(estado)).toEqual({
      A: { lugar: 'bandeja' },
      B: { lugar: 'pieza', pieza: 'PIEZA_02', anclaje: 1 },
      C: { lugar: 'pieza', pieza: 'PIEZA_01', anclaje: 1 },
    });
  });

  it('no comparte referencias con el JSON (bandeja copiada)', () => {
    expect(estado.bandeja).not.toBe(nivel.bandeja);
  });
});

describe('cargador: niveles rotos', () => {
  it('ordenPiezas con una pieza inexistente', () => {
    const json = copiaN05();
    json.ordenPiezas = ['PIEZA_01', 'PIEZA_99'];
    expect(erroresDe(json)).toEqual([
      'ordenPiezas usa la pieza "PIEZA_99", que no existe',
      'la pieza "PIEZA_02" no está en ordenPiezas',
    ]);
  });

  it('elemento duplicado (en la bandeja y en una pieza)', () => {
    const json = copiaN05();
    json.bandeja = ['A', 'B'];
    expect(erroresDe(json)).toEqual(['el elemento "B" empieza en más de un lugar']);
  });

  it('estructura inválida: desarmado desconocido y forma vacía', () => {
    const json = copiaN05();
    json.desarmado = 'pila';
    json.elementos.A.forma = [];
    expect(erroresDe(json)).toEqual([
      'nivel.desarmado: debe ser "lifo" o "fifo"',
      'elementos.A.forma: no puede estar vacía',
    ]);
  });

  it('el mensaje del error incluye el id del nivel', () => {
    const json = copiaN05();
    json.piezas[0].iniciales = { '1': 'Z' };
    expect(() => cargarPartida(json)).toThrow(/Nivel N05 mal formado/);
  });
});
