import { describe, expect, it } from 'vitest';
import { partidaN05 } from './ayudasPrueba';
import { crearPartida, motivoColocacion, reducirPartida, type Accion, type Partida } from './partida';
import { actualizarMejores, agregarRegistro, esMejor, esTablaMejores, resumirPartida } from './resultados';

const SOL_01 = 'pila.push(desarmar(PIEZA_01))\npila.push(desarmar(PIEZA_02))\narmar(pila.pop())\narmar(pila.pop())';
const SOL_02 = 'pila.push("A")\narmar(pila.pop())';

const aplicar = (p: Partida, ...acciones: Accion[]): Partida => acciones.reduce(reducirPartida, p);
const nueva = (): Partida => crearPartida(partidaN05().nivel);

describe('estadísticas de la partida', () => {
  it('cuenta operaciones, ejecuciones, fallidas, errores y colocaciones rechazadas', () => {
    const p = aplicar(
      nueva(),
      { tipo: 'ejecutar', codigo: 'armar(pila.pop())' },
      { tipo: 'ejecutar', codigo: 'pila.peek()\npila.pop()' },
      { tipo: 'colocar', pieza: 'PIEZA_01', x: 0, y: 0 },
      { tipo: 'ejecutar', codigo: SOL_01 },
    );
    expect(p.estadisticas).toEqual({
      operaciones: 4,
      ejecuciones: 3,
      fallidas: 2,
      errores: { ESTRUCTURA_VACIA: 1, METODO_INEXISTENTE: 1, EXTRACCION_SIN_DESTINO: 1 },
      colocacionesRechazadas: 1,
    });
  });

  it('reiniciar las restablece', () => {
    const p = aplicar(nueva(), { tipo: 'ejecutar', codigo: SOL_01 }, { tipo: 'reiniciar' });
    expect(p.estadisticas.operaciones).toBe(0);
    expect(p.estadisticas.ejecuciones).toBe(0);
  });
});

describe('motivoColocacion', () => {
  it('consulta sin cambiar la partida', () => {
    const p0 = nueva();
    expect(motivoColocacion(p0, 'PIEZA_01', 0, 0)).toBe('NO_FIJA');
    const p = aplicar(p0, { tipo: 'ejecutar', codigo: SOL_01 });
    expect(motivoColocacion(p, 'PIEZA_01', 0, 0)).toBeNull();
    expect(motivoColocacion(p, 'PIEZA_01', 2, 2)).toBe('HUECO_INVALIDO');
    expect(p.juego.piezas.PIEZA_01!.estado).toBe('fija');
  });
});

describe('resultados', () => {
  it('resume una partida completada', () => {
    const p = aplicar(
      nueva(),
      { tipo: 'verPista' },
      { tipo: 'tick', ms: 1234.4 },
      { tipo: 'ejecutar', codigo: SOL_01 },
      { tipo: 'seleccionar', pieza: 'PIEZA_02' },
      { tipo: 'ejecutar', codigo: SOL_02 },
      { tipo: 'colocar', pieza: 'PIEZA_01', x: 0, y: 0 },
      { tipo: 'colocar', pieza: 'PIEZA_02', x: 1, y: 1 },
    );
    expect(p.completado).toBe(true);
    expect(resumirPartida(p)).toMatchObject({ nivel: 'N05', estrellas: 2, tiempoMs: 1234, pistas: ['P1'] });
    expect(resumirPartida(p).estadisticas.operaciones).toBe(6);
  });

  it('mejor = más estrellas y, a igualdad, menor tiempo', () => {
    expect(esMejor({ estrellas: 1, tiempoMs: 5 }, undefined)).toBe(true);
    expect(esMejor({ estrellas: 3, tiempoMs: 900 }, { estrellas: 2, tiempoMs: 10 })).toBe(true);
    expect(esMejor({ estrellas: 2, tiempoMs: 10 }, { estrellas: 3, tiempoMs: 900 })).toBe(false);
    expect(esMejor({ estrellas: 2, tiempoMs: 9 }, { estrellas: 2, tiempoMs: 10 })).toBe(true);
    expect(esMejor({ estrellas: 2, tiempoMs: 10 }, { estrellas: 2, tiempoMs: 10 })).toBe(false);
  });

  it('actualiza la tabla de mejores sin mutarla', () => {
    const resumen = resumirPartida(nueva());
    const tabla = { N05: { estrellas: 3, tiempoMs: 10 ** 9 } };
    const r = actualizarMejores(tabla, { ...resumen, tiempoMs: 50 });
    expect(r.record).toBe(true);
    expect(r.mejores.N05).toEqual({ estrellas: 3, tiempoMs: 50 });
    expect(tabla.N05.tiempoMs).toBe(10 ** 9);
    expect(actualizarMejores(r.mejores, { ...resumen, tiempoMs: 60 }).record).toBe(false);
  });

  it('el registro conserva solo las entradas más recientes', () => {
    const base = { ...resumirPartida(nueva()), fecha: '' };
    const reg = [1, 2, 3].reduce((r, i) => agregarRegistro(r, { ...base, fecha: String(i) }, 2), [] as (typeof base)[]);
    expect(reg.map((e) => e.fecha)).toEqual(['2', '3']);
  });

  it('valida la tabla de mejores leída de fuera', () => {
    expect(esTablaMejores({ N05: { estrellas: 2, tiempoMs: 1 } })).toBe(true);
    expect(esTablaMejores({ N05: { estrellas: '2' } })).toBe(false);
    expect(esTablaMejores([])).toBe(false);
    expect(esTablaMejores(null)).toBe(false);
  });
});
