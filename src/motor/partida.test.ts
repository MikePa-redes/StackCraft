import { describe, expect, it } from 'vitest';
import { elementosDe, partidaN05 } from './ayudasPrueba';
import { crearPartida, estrellas, puedeDeshacer, puedeEditar, reducirPartida, type Accion, type Partida } from './partida';

const SOL_01 = 'pila.push(desarmar(PIEZA_01))\npila.push(desarmar(PIEZA_02))\narmar(pila.pop())\narmar(pila.pop())';
const SOL_02 = 'pila.push("A")\narmar(pila.pop())';

function aplicar(p: Partida, ...acciones: Accion[]): Partida {
  return acciones.reduce(reducirPartida, p);
}

function nueva(cambios?: Parameters<typeof partidaN05>[0]): Partida {
  return crearPartida(partidaN05(cambios).nivel);
}

/** N05 con tres pistas. */
const conTresPistas = () =>
  nueva((j) => {
    j.pistas.push({ id: 'P2', texto: 'dos' }, { id: 'P3', pieza: 'PIEZA_02', texto: 'tres' });
  });

describe('flujo completo de N05', () => {
  it('de inicio a fin, con estados En espera y cronómetro', () => {
    let p = nueva();
    const inicial = elementosDe(p.juego);
    expect(p.seleccionada).toBe('PIEZA_01');
    expect(p.juego.piezas.PIEZA_02!.estado).toBe('en_espera');

    // PIEZA_02 está en espera: se puede ver, pero no ejecutar código.
    p = aplicar(p, { tipo: 'seleccionar', pieza: 'PIEZA_02' });
    expect(puedeEditar(p)).toBe(false);
    expect(aplicar(p, { tipo: 'ejecutar', codigo: SOL_02 })).toBe(p);

    p = aplicar(p, { tipo: 'seleccionar', pieza: 'PIEZA_01' }, { tipo: 'tick', ms: 1000 }, { tipo: 'ejecutar', codigo: SOL_01 });
    expect(p.ultimaEjecucion?.ok).toBe(true);
    expect(p.juego.piezas.PIEZA_01!.estado).toBe('fija');
    expect(p.juego.piezas.PIEZA_02!.estado).toBe('incompleta');
    expect(puedeEditar(p)).toBe(false); // la seleccionada ya está fija

    p = aplicar(p, { tipo: 'seleccionar', pieza: 'PIEZA_02' }, { tipo: 'ejecutar', codigo: SOL_02 });
    expect(p.juego.piezas.PIEZA_02!.estado).toBe('fija');
    expect(elementosDe(p.juego)).toEqual(inicial);

    p = aplicar(p, { tipo: 'colocar', pieza: 'PIEZA_01', x: 0, y: 0 }, { tipo: 'tick', ms: 500 });
    expect(p.juego.piezas.PIEZA_01!.estado).toBe('colocada');
    expect(p.completado).toBe(false);

    p = aplicar(p, { tipo: 'colocar', pieza: 'PIEZA_02', x: 1, y: 1 });
    expect(p.completado).toBe(true);
    expect(p.tiempoMs).toBe(1500);
    expect(estrellas(p)).toBe(3);

    // Completado: el cronómetro se detiene y no se consultan pistas.
    p = aplicar(p, { tipo: 'tick', ms: 1000 }, { tipo: 'verPista' });
    expect(p.tiempoMs).toBe(1500);
    expect(estrellas(p)).toBe(3);
  });

  it('una ejecución con error no cambia el estado', () => {
    const p = nueva();
    const q = aplicar(p, { tipo: 'ejecutar', codigo: 'armar(pila.pop())' });
    expect(q.juego).toBe(p.juego);
    expect(q.ultimaEjecucion).toMatchObject({ ok: false, errores: [{ codigo: 'ESTRUCTURA_VACIA', linea: 1 }] });
    const s = aplicar(p, { tipo: 'ejecutar', codigo: 'pila.peek()' });
    expect(s.juego).toBe(p.juego);
    expect(s.ultimaEjecucion).toMatchObject({ ok: false, errores: [{ codigo: 'METODO_INEXISTENTE' }] });
  });

  it('colocación rechazada informa el motivo', () => {
    const p = aplicar(nueva(), { tipo: 'colocar', pieza: 'PIEZA_01', x: 0, y: 0 });
    expect(p.ultimaColocacion).toEqual({ ok: false, pieza: 'PIEZA_01', motivo: 'NO_FIJA' });
  });
});

describe('deshacer', () => {
  it('restaura el estado previo a la última ejecución sin errores, aunque dejara una pieza fija', () => {
    const p0 = nueva();
    const p1 = aplicar(p0, { tipo: 'ejecutar', codigo: SOL_01 });
    expect(puedeDeshacer(p1)).toBe(true);
    const p2 = aplicar(p1, { tipo: 'deshacer' });
    expect(p2.juego).toEqual(p0.juego);
    expect(p2.juego.piezas.PIEZA_01!.estado).toBe('incompleta');
    expect(puedeDeshacer(p2)).toBe(false);
  });

  it('solo deshace una ejecución', () => {
    const p0 = nueva();
    const p1 = aplicar(p0, { tipo: 'ejecutar', codigo: 'pila.push(desarmar(PIEZA_01))' });
    const p2 = aplicar(p1, { tipo: 'ejecutar', codigo: 'pila.push(desarmar(PIEZA_02))' });
    const p3 = aplicar(p2, { tipo: 'deshacer' });
    expect(p3.juego).toEqual(p1.juego);
    expect(aplicar(p3, { tipo: 'deshacer' })).toBe(p3);
  });

  it('una ejecución con error conserva lo que se puede deshacer', () => {
    const p1 = aplicar(nueva(), { tipo: 'ejecutar', codigo: 'pila.push(desarmar(PIEZA_01))' });
    const p2 = aplicar(p1, { tipo: 'ejecutar', codigo: 'armar(pila.pop())\narmar(pila.pop())' });
    expect(p2.ultimaEjecucion?.ok).toBe(false);
    expect(p2.anterior).toBe(p1.anterior);
  });

  it('deja de estar disponible al colocar una pieza', () => {
    const p = aplicar(
      nueva(),
      { tipo: 'ejecutar', codigo: SOL_01 },
      { tipo: 'colocar', pieza: 'PIEZA_01', x: 0, y: 0 },
    );
    expect(puedeDeshacer(p)).toBe(false);
    expect(aplicar(p, { tipo: 'deshacer' })).toBe(p);
  });
});

describe('pistas y estrellas', () => {
  it('cada pista distinta resta una estrella; repetirla no', () => {
    let p = conTresPistas();
    expect(estrellas(p)).toBe(3);
    p = aplicar(p, { tipo: 'verPista' });
    expect(p.pistaMostrada).toBe('P1');
    expect(estrellas(p)).toBe(2);
    p = aplicar(p, { tipo: 'cerrarPista' }, { tipo: 'verPista', id: 'P1' }, { tipo: 'verPista', id: 'P1' });
    expect(p.pistaMostrada).toBe('P1');
    expect(estrellas(p)).toBe(2);
    p = aplicar(p, { tipo: 'verPista' });
    expect(p.pistaMostrada).toBe('P2');
    p = aplicar(p, { tipo: 'verPista' }, { tipo: 'verPista' }, { tipo: 'verPista', id: 'NO_EXISTE' });
    expect(p.pistasVistas).toEqual(['P1', 'P2', 'P3']);
    expect(estrellas(p)).toBe(0);
  });

  it('consultar pistas no detiene el cronómetro', () => {
    const p = aplicar(conTresPistas(), { tipo: 'tick', ms: 100 }, { tipo: 'verPista' }, { tipo: 'tick', ms: 100 });
    expect(p.tiempoMs).toBe(200);
  });
});

describe('cronómetro', () => {
  it('se pausa y continúa desde el tiempo acumulado', () => {
    const p = aplicar(
      nueva(),
      { tipo: 'tick', ms: 300 },
      { tipo: 'pausar' },
      { tipo: 'tick', ms: 5000 },
      { tipo: 'reanudar' },
      { tipo: 'tick', ms: 200 },
      { tipo: 'tick', ms: -50 },
    );
    expect(p.tiempoMs).toBe(500);
  });
});

describe('reiniciar', () => {
  it('no deja residuos', () => {
    const limpia = conTresPistas();
    const sucia = aplicar(
      limpia,
      { tipo: 'tick', ms: 900 },
      { tipo: 'verPista' },
      { tipo: 'verPista' },
      { tipo: 'ejecutar', codigo: SOL_01 },
      { tipo: 'colocar', pieza: 'PIEZA_01', x: 0, y: 0 },
      { tipo: 'seleccionar', pieza: 'PIEZA_02' },
      { tipo: 'ejecutar', codigo: 'pila.pop()' },
      { tipo: 'pausar' },
    );
    expect(sucia).not.toEqual(limpia);
    const r = aplicar(sucia, { tipo: 'reiniciar' });
    expect(r).toEqual(limpia);
    expect(estrellas(r)).toBe(3);
    expect(r.juego.piezas.PIEZA_01!.estado).toBe('incompleta');
  });
});
