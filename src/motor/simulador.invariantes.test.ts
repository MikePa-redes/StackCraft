// Invariantes 1, 2, 3, 4, 5, 7 y 10 de CLAUDE.md sobre el simulador.

import { describe, expect, it } from 'vitest';
import { aleatorio, correr, elementosDe, exito, partidaDosIniciales, partidaN05 } from './ayudasPrueba';
import { simular } from './simulador';
import type { Destino, EstadoPartida, Fuente, Instruccion, Nivel } from './tipos';

const FUENTES: Record<Destino, Fuente['tipo'][]> = {
  pila: ['bandeja', 'desarmar', 'dequeue'],
  cola: ['bandeja', 'desarmar', 'pop'],
  pieza: ['pop', 'dequeue'],
  bandeja: ['pop', 'dequeue'],
};
const DESTINOS: Destino[] = ['pila', 'cola', 'pieza', 'bandeja'];

function elegir<T>(azar: () => number, lista: readonly T[]): T {
  return lista[Math.floor(azar() * lista.length)] as T;
}

/** Programa al azar de 1 a 3 instrucciones bien formadas. */
function programaAlAzar(azar: () => number, nivel: Nivel): Instruccion[] {
  const elementos = [...Object.keys(nivel.elementos), 'Z'];
  const piezas = [...nivel.piezas.map((p) => p.id), 'PIEZA_99'];
  return Array.from({ length: 1 + Math.floor(azar() * 3) }, (_, i) => {
    const destino = elegir(azar, DESTINOS);
    const tipo = elegir(azar, FUENTES[destino]);
    const fuente: Fuente =
      tipo === 'bandeja'
        ? { tipo, elemento: elegir(azar, elementos) }
        : tipo === 'desarmar'
          ? { tipo, pieza: elegir(azar, piezas) }
          : { tipo };
    return { linea: i + 1, destino, fuente };
  });
}

const partidas = [
  ['N05 (LIFO)', partidaN05()],
  ['dos iniciales (LIFO)', partidaDosIniciales('lifo')],
  ['dos iniciales (FIFO)', partidaDosIniciales('fifo')],
] as const;

describe.each(partidas)('invariantes con secuencias al azar: %s', (_n, { nivel, estado: inicial }) => {
  it('1, 2, 5, 7 y 10 se cumplen en 1000 ejecuciones (semilla fija)', () => {
    const todos = Object.keys(nivel.elementos).sort();
    const nivelOriginal = structuredClone(nivel);
    const azar = aleatorio(20261104);
    let estado: EstadoPartida = inicial;
    let exitos = 0;
    let errores = 0;
    let resueltos = 0;

    for (let paso = 0; paso < 1000; paso++) {
      const programa = programaAlAzar(azar, nivel);
      const antes = structuredClone(estado);
      const r = simular(nivel, estado, programa);

      // 10: determinismo.
      expect(simular(nivel, estado, programa)).toEqual(r);
      // 7: el estado de entrada nunca se modifica.
      expect(estado).toEqual(antes);

      // 5: lo que sale de la bandeja o de una pieza solo va a pila o cola.
      for (const ev of r.ok ? r.eventos : r.eventosHastaError) {
        if (ev.desde.lugar === 'bandeja' || ev.desde.lugar === 'pieza') {
          expect(['pila', 'cola']).toContain(ev.hacia.lugar);
        }
      }

      if (r.ok) {
        exitos++;
        // 2: piezas fijas o colocadas no cambian.
        for (const [id, p] of Object.entries(antes.piezas)) {
          if (p.estado === 'fija' || p.estado === 'colocada') {
            expect(r.estadoNuevo.piezas[id]!.acoplados).toEqual(p.acoplados);
          }
        }
        estado = r.estadoNuevo;
      } else {
        errores++;
      }
      // 1: ningún elemento se duplica ni se pierde.
      expect(elementosDe(estado)).toEqual(todos);

      // Nivel resuelto: ya no queda nada movible, se vuelve a empezar.
      if (Object.values(estado.piezas).every((p) => p.estado === 'fija')) {
        resueltos++;
        estado = inicial;
      }
    }

    // 2: el nivel (núcleos, anclajes) nunca se modifica.
    expect(nivel).toEqual(nivelOriginal);
    // La secuencia ejercita éxitos, errores y llega a resolver el nivel.
    expect(exitos).toBeGreaterThan(50);
    expect(errores).toBeGreaterThan(50);
    expect(resueltos).toBeGreaterThan(0);
  });
});

describe('invariantes específicos', () => {
  it('2: el núcleo no se desarma; una pieza vacía no tiene movibles', () => {
    const { nivel, estado } = partidaN05();
    const r = correr(nivel, estado, 'pila.push(desarmar(PIEZA_01))\npila.push(desarmar(PIEZA_01))');
    expect(!r.ok && r.error.codigo).toBe('PIEZA_SIN_MOVIBLES');
  });

  it('3: armar usa el anclaje libre de menor número', () => {
    const { nivel, estado } = partidaN05();
    // Sale C del anclaje 1; quedan libres 1 y 2; A va al 1.
    const r = exito(correr(nivel, estado, 'pila.push(desarmar(PIEZA_01))\npila.push("A")\narmar(pila.pop())'));
    expect(r.estadoNuevo.piezas.PIEZA_01!.acoplados).toEqual([{ anclaje: 1, elemento: 'A' }]);
  });

  it('4: LIFO saca el último acoplado; los iniciales cuentan por orden de anclaje', () => {
    const { nivel, estado } = partidaDosIniciales('lifo');
    const r = exito(correr(nivel, estado, 'pila.push(desarmar(PIEZA_01))'));
    expect(r.estadoNuevo.pila).toEqual(['A']);
  });

  it('4: FIFO saca el acoplado hace más tiempo', () => {
    const { nivel, estado } = partidaDosIniciales('fifo');
    const r = exito(correr(nivel, estado, 'pila.push(desarmar(PIEZA_01))'));
    expect(r.estadoNuevo.pila).toEqual(['C']);
  });

  it('4: un elemento recién armado es el último acoplado', () => {
    const { nivel, estado } = partidaDosIniciales('fifo');
    // FIFO: sale C (anclaje 1), se rearma C en el 1; ahora el más antiguo es A.
    const codigo = 'pila.push(desarmar(PIEZA_01))\narmar(pila.pop())\npila.push(desarmar(PIEZA_01))';
    const r = exito(correr(nivel, estado, codigo));
    expect(r.estadoNuevo.pila).toEqual(['A']);
  });

  it('7: una ejecución con error no deja cambios aunque haya pasos previos', () => {
    const { nivel, estado } = partidaN05();
    const antes = structuredClone(estado);
    const r = correr(nivel, estado, 'pila.push("A")\npila.push(desarmar(PIEZA_02))\narmar(pila.pop())');
    expect(r.ok).toBe(false);
    expect(!r.ok && r.eventosHastaError).toHaveLength(2);
    expect('estadoNuevo' in r).toBe(false);
    expect(estado).toEqual(antes);
  });

  it('10: mismo estado y mismo código dan el mismo resultado', () => {
    const { nivel, estado } = partidaN05();
    const codigo = 'pila.push(desarmar(PIEZA_01))\npila.push(desarmar(PIEZA_02))\narmar(pila.pop())';
    expect(correr(nivel, estado, codigo)).toEqual(correr(nivel, estado, codigo));
  });
});
