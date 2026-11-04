import { describe, expect, it } from 'vitest';
import { correr, exito, partidaN05 } from './ayudasPrueba';
import type { EstadoPartida, Nivel } from './tipos';
import { colocarPieza, esFija, formaObjetivo, formaPieza, nivelCompleto } from './validador';
import { verificarNivel } from './verificador';

const SOL_01 = 'pila.push(desarmar(PIEZA_01))\npila.push(desarmar(PIEZA_02))\narmar(pila.pop())\narmar(pila.pop())';
const SOL_02 = 'pila.push("A")\narmar(pila.pop())';

function resuelto(nivel: Nivel, estado: EstadoPartida): EstadoPartida {
  const e1 = exito(correr(nivel, estado, SOL_01)).estadoNuevo;
  return exito(correr(nivel, e1, SOL_02)).estadoNuevo;
}

const ordenar = (c: [number, number][]) => c.map(([x, y]) => `${x},${y}`).sort();

describe('forma de una pieza', () => {
  it('núcleo + elementos acoplados en sus anclajes', () => {
    const { nivel } = partidaN05();
    const p1 = nivel.piezas[0]!;
    expect(ordenar(formaPieza(nivel, p1, [{ anclaje: 1, elemento: 'C' }]))).toEqual(['0,0', '1,0', '1,1']);
    expect(ordenar(formaObjetivo(nivel, p1))).toEqual(['0,0', '0,1', '0,2', '1,0', '2,0']);
  });

  it('compara formas, no ids', () => {
    const { nivel } = partidaN05((j) => {
      j.elementos.D = { color: '#000000', forma: [[0, 0], [1, 0]] };
      j.bandeja.push('D');
    });
    const p1 = nivel.piezas[0]!;
    const conD = [{ anclaje: 1, elemento: 'D' }, { anclaje: 2, elemento: 'C' }];
    expect(esFija(nivel, p1, conD)).toBe(true);
    expect(esFija(nivel, p1, [{ anclaje: 1, elemento: 'C' }, { anclaje: 2, elemento: 'B' }])).toBe(false);
    expect(esFija(nivel, p1, [{ anclaje: 1, elemento: 'B' }])).toBe(false);
  });
});

describe('paso a fija', () => {
  it('se evalúa al terminar la ejecución', () => {
    const { nivel, estado } = partidaN05();
    const e1 = exito(correr(nivel, estado, SOL_01)).estadoNuevo;
    expect(e1.piezas.PIEZA_01!.estado).toBe('fija');
    expect(e1.piezas.PIEZA_02!.estado).toBe('incompleta');
  });

  it('una coincidencia intermedia no fija la pieza', () => {
    // PIEZA_02 coincide tras armar A, pero al terminar ya no.
    const { nivel, estado } = partidaN05();
    const e1 = exito(correr(nivel, estado, SOL_01)).estadoNuevo;
    const r = exito(correr(nivel, e1, `${SOL_02}\npila.push(desarmar(PIEZA_02))\narmar(pila.pop())`));
    expect(r.estadoNuevo.piezas.PIEZA_02!.estado).toBe('fija');
    const r2 = exito(correr(nivel, e1, `${SOL_02}\npila.push(desarmar(PIEZA_02))`));
    expect(r2.estadoNuevo.piezas.PIEZA_02!.estado).toBe('incompleta');
    expect(r2.estadoNuevo.pila).toEqual(['A']);
  });
});

describe('colocación', () => {
  it('rechaza una pieza que no está fija', () => {
    const { nivel, estado } = partidaN05();
    expect(colocarPieza(nivel, estado, 'PIEZA_01', 0, 0)).toEqual({ ok: false, motivo: 'NO_FIJA' });
    expect(colocarPieza(nivel, estado, 'NADA', 0, 0)).toEqual({ ok: false, motivo: 'PIEZA_INEXISTENTE' });
  });

  it('acepta solo un hueco con la misma forma objetivo', () => {
    const { nivel, estado } = partidaN05();
    const e = resuelto(nivel, estado);
    expect(colocarPieza(nivel, e, 'PIEZA_01', 1, 1)).toEqual({ ok: false, motivo: 'HUECO_INVALIDO' });
    expect(colocarPieza(nivel, e, 'PIEZA_02', 0, 0)).toEqual({ ok: false, motivo: 'HUECO_INVALIDO' });
    const r = colocarPieza(nivel, e, 'PIEZA_02', 1, 1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.estadoNuevo.piezas.PIEZA_02).toMatchObject({ estado: 'colocada', colocadaEn: { x: 1, y: 1 } });
      expect(e.piezas.PIEZA_02!.estado).toBe('fija'); // inmutable
      expect(colocarPieza(nivel, r.estadoNuevo, 'PIEZA_02', 1, 1)).toEqual({ ok: false, motivo: 'NO_FIJA' });
    }
  });

  it('piezas de igual forma final ocupan cualquiera de sus huecos, sin solapes', () => {
    // Variante: dos piezas iguales (núcleo + A) en (1,1) y (1,0) de una matriz 3×2.
    const { nivel, estado } = partidaN05((j) => {
      const base = j.piezas[1];
      j.piezas = [
        { ...structuredClone(base), id: 'PIEZA_01', iniciales: {}, posicionObjetivo: { x: 1, y: 0 } },
        { ...structuredClone(base), id: 'PIEZA_02', iniciales: {}, posicionObjetivo: { x: 1, y: 1 } },
      ];
      j.elementos.D = { color: '#000000', forma: [[0, 0]] };
      j.elementos.B.forma = [[0, 0]];
      j.elementos.C.forma = [[0, 0]];
      j.bandeja = ['A', 'D', 'B', 'C'];
      j.piezas[0].objetivo = { '1': 'A' };
      j.piezas[1].objetivo = { '1': 'D' };
      j.matriz = {
        ancho: 3, alto: 2,
        celdas: [['vacia', 'vacia', 'vacia'], ['vacia', 'vacia', 'vacia']],
        piezasReferencia: [],
      };
    });
    const e1 = exito(correr(nivel, estado, 'pila.push("A")\narmar(pila.pop())')).estadoNuevo;
    const e2 = exito(correr(nivel, e1, 'pila.push("D")\narmar(pila.pop())')).estadoNuevo;
    const c1 = colocarPieza(nivel, e2, 'PIEZA_01', 1, 1);
    expect(c1.ok).toBe(true);
    if (!c1.ok) return;
    expect(colocarPieza(nivel, c1.estadoNuevo, 'PIEZA_02', 1, 1)).toEqual({ ok: false, motivo: 'OCUPADO' });
    expect(colocarPieza(nivel, c1.estadoNuevo, 'PIEZA_02', 1, 0).ok).toBe(true);
  });
});

describe('nivel completo', () => {
  it('solo cuando todas las celdas están ocupadas', () => {
    const { nivel, estado } = partidaN05();
    let e = resuelto(nivel, estado);
    expect(nivelCompleto(nivel, e)).toBe(false);
    for (const p of nivel.piezas) {
      const r = colocarPieza(nivel, e, p.id, p.posicionObjetivo.x, p.posicionObjetivo.y);
      if (!r.ok) throw new Error(r.motivo);
      e = r.estadoNuevo;
      expect(nivelCompleto(nivel, e)).toBe(p.id === 'PIEZA_02');
    }
  });
});

describe('verificador', () => {
  it('N05 pasa', () => {
    expect(verificarNivel(partidaN05().nivel)).toEqual([]);
  });

  it('detecta una solución que no fija la pieza', () => {
    const { nivel } = partidaN05((j) => {
      j.piezas[1].solucion.h1 = '"A"';
      j.piezas[1].plantilla = ['pila.push({{h1}})'];
    });
    expect(verificarNivel(nivel)).toContain('PIEZA_02: no queda fija con su solución');
  });

  it('detecta celdas sin cubrir y solapes', () => {
    const { nivel } = partidaN05((j) => {
      j.matriz.celdas[0].push('vacia');
      j.matriz.celdas[1].push('vacia');
      j.matriz.celdas[2].push('vacia');
      j.matriz.ancho = 4;
      j.matriz.piezasReferencia[0].celdas.push([1, 1]);
    });
    const errores = verificarNivel(nivel);
    expect(errores).toContain('celda (3, 0) sin cubrir');
    expect(errores.some((e) => e.startsWith('celda (1, 1) solapada'))).toBe(true);
  });
});
