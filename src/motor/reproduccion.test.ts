import { describe, expect, it } from 'vitest';
import { correr, exito, partidaN05 } from './ayudasPrueba';
import { estadosIntermedios, huecosCompletos, rellenarPlantilla } from './reproduccion';
import { codigoSolucion } from './verificador';
import type { EstadoPartida } from './tipos';

const { nivel, estado } = partidaN05();
const p1 = nivel.piezas[0]!;

/** Lo que mueve el simulador, sin el estado visual de las piezas. */
function contenido(e: EstadoPartida) {
  const piezas = Object.fromEntries(Object.entries(e.piezas).map(([id, p]) => [id, p.acoplados]));
  return { bandeja: e.bandeja, pila: e.pila, cola: e.cola, piezas };
}

describe('reproduccion', () => {
  it('el último estado intermedio coincide con el del simulador', () => {
    const r = exito(correr(nivel, estado, codigoSolucion(p1)));
    const estados = estadosIntermedios(estado, r.eventos);
    expect(estados).toHaveLength(r.eventos.length + 1);
    expect(estados[0]).toBe(estado);
    expect(contenido(estados.at(-1)!)).toEqual(contenido(r.estadoNuevo));
  });

  it('no modifica el estado original y no recalcula fija a mitad', () => {
    const copia = structuredClone(estado);
    const r = exito(correr(nivel, estado, codigoSolucion(p1)));
    const estados = estadosIntermedios(estado, r.eventos);
    expect(estado).toEqual(copia);
    expect(estados.at(-1)!.piezas.PIEZA_01!.estado).toBe(estado.piezas.PIEZA_01!.estado);
  });

  it('ningún elemento se duplica ni se pierde en los pasos intermedios', () => {
    const r = exito(correr(nivel, estado, codigoSolucion(p1)));
    const todos = (e: EstadoPartida) =>
      [...e.bandeja, ...e.pila, ...e.cola, ...Object.values(e.piezas).flatMap((p) => p.acoplados.map((a) => a.elemento))].sort();
    const inicial = todos(estado);
    for (const e of estadosIntermedios(estado, r.eventos)) expect(todos(e)).toEqual(inicial);
  });

  it('rellena la plantilla y detecta huecos vacíos', () => {
    expect(rellenarPlantilla(p1, p1.solucion)).toBe(codigoSolucion(p1));
    expect(rellenarPlantilla(p1, {}).split('\n')[0]).toBe('pila.push(desarmar())');
    expect(huecosCompletos(p1, p1.solucion)).toBe(true);
    expect(huecosCompletos(p1, { h1: 'PIEZA_01', h2: ' ' })).toBe(false);
  });
});
