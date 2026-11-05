// Estado de interfaz del panel de código: valores de los huecos y
// reproducción animada de la última ejecución. Las reglas viven en el motor;
// aquí solo se decide QUÉ estado intermedio mostrar y cuándo avanzar.

import { useEffect, useLayoutEffect, useRef, useState, type Dispatch } from 'react';
import type { Accion, Partida } from '../motor/partida';
import { estadosIntermedios, rellenarPlantilla } from '../motor/reproduccion';
import type { ErrorCodigo, EstadoPartida, Evento } from '../motor/tipos';
import { rectElemento, type Vuelo } from './componentes/Volador';

/** Tiempo entre operaciones al ejecutar todo (la transición dura menos). */
const PASO_MS = 450;

type Modo = 'auto' | 'pasos';

interface Reproduccion {
  estados: EstadoPartida[];
  eventos: Evento[];
  /** Eventos ya mostrados. */
  indice: number;
  modo: Modo;
  /** Errores que se muestran al terminar (vacío si salió bien). */
  errores: ErrorCodigo[];
}

/** Lo que el avatar debe comentar tras la última acción del panel. */
export type Comentario = { tipo: 'nada' } | { tipo: 'ok'; fijas: boolean } | { tipo: 'error'; errores: ErrorCodigo[] };

export function useEjecucion(partida: Partida, dispatch: Dispatch<Accion>) {
  const [valores, setValores] = useState<Record<string, Record<string, string>>>({});
  const [rep, setRep] = useState<Reproduccion | null>(null);
  const [comentario, setComentario] = useState<Comentario>({ tipo: 'nada' });
  const [vuelo, setVuelo] = useState<Vuelo | null>(null);
  const pendiente = useRef<{ modo: Modo; base: EstadoPartida } | null>(null);
  const origen = useRef<DOMRect | null>(null);
  const contador = useRef(0);

  const pieza = partida.seleccionada;
  const valoresPieza = (pieza && valores[pieza]) || {};

  // Cambiar de pieza borra los comentarios de la anterior.
  useEffect(() => setComentario({ tipo: 'nada' }), [pieza]);

  // Cuando el reducer responde a 'ejecutar', se prepara la reproducción.
  useEffect(() => {
    const r = partida.ultimaEjecucion;
    const p = pendiente.current;
    if (!r || !p) return;
    pendiente.current = null;
    const eventos = r.ok ? r.eventos : r.eventosHastaError;
    const errores = r.ok ? [] : r.errores;
    const nueva = { estados: estadosIntermedios(p.base, eventos), eventos, indice: 0, modo: p.modo, errores };
    // Un error de análisis no mueve nada: se explica de inmediato.
    if (eventos.length === 0 && errores.length > 0) terminar(nueva);
    else setRep(nueva);
  }, [partida.ultimaEjecucion]);

  function terminar(actual: Reproduccion) {
    setRep(null);
    setVuelo(null);
    if (actual.errores.length > 0) {
      setComentario({ tipo: 'error', errores: actual.errores });
    } else {
      const base = actual.estados[0]!;
      const fijas = Object.entries(partida.juego.piezas).some(
        ([id, p]) => p.estado === 'fija' && base.piezas[id]?.estado !== 'fija',
      );
      setComentario({ tipo: 'ok', fijas });
    }
  }

  function avanzar(actual: Reproduccion) {
    const ev = actual.eventos[actual.indice];
    if (!ev) return terminar(actual);
    origen.current = rectElemento(ev.elemento);
    setRep({ ...actual, indice: actual.indice + 1 });
  }

  // Ejecución completa: avanza sola; la primera operación sale enseguida.
  // Paso a paso: solo cierra sola una ejecución sin errores al final.
  useEffect(() => {
    if (!rep) return;
    const cierre = rep.indice >= rep.eventos.length && rep.errores.length === 0;
    if (rep.modo !== 'auto' && !cierre) return;
    const t = setTimeout(() => avanzar(rep), rep.indice === 0 ? 0 : PASO_MS);
    return () => clearTimeout(t);
    // Solo depende de `rep`: los ticks del cronómetro re-renderizan cada
    // 250 ms y no deben reiniciar este temporizador.
  }, [rep]);

  // Tras pintar el nuevo estado intermedio, el elemento vuela a su destino.
  useLayoutEffect(() => {
    const ev = rep && rep.indice > 0 ? rep.eventos[rep.indice - 1] : undefined;
    const desde = origen.current;
    origen.current = null;
    if (!ev || !desde) return;
    const hasta = rectElemento(ev.elemento);
    if (hasta) setVuelo({ elemento: ev.elemento, desde, hasta, clave: ++contador.current });
  }, [rep?.indice, rep?.estados]);

  function ejecutar(modo: Modo) {
    if (rep) {
      // Durante el paso a paso, Ejecutar termina el resto de forma automática.
      if (modo === 'auto') setRep({ ...rep, modo: 'auto' });
      else avanzar(rep);
      return;
    }
    const def = partida.nivel.piezas.find((p) => p.id === pieza);
    if (!def) return;
    pendiente.current = { modo, base: partida.juego };
    setComentario({ tipo: 'nada' });
    dispatch({ tipo: 'ejecutar', codigo: rellenarPlantilla(def, valoresPieza) });
  }

  function cambiarHueco(hueco: string, valor: string) {
    if (!pieza || rep) return;
    setValores((v) => ({ ...v, [pieza]: { ...v[pieza], [hueco]: valor } }));
    setComentario({ tipo: 'nada' });
  }

  function deshacer() {
    if (rep) return;
    setComentario({ tipo: 'nada' });
    dispatch({ tipo: 'deshacer' });
  }

  const evActual = rep && rep.indice > 0 ? rep.eventos[rep.indice - 1] : undefined;
  return {
    valores: valoresPieza,
    cambiarHueco,
    ejecutar,
    deshacer,
    reproduciendo: rep !== null,
    pasoAPaso: rep?.modo === 'pasos',
    /** Estado que se dibuja: el intermedio durante la animación. */
    juegoVisible: rep ? rep.estados[rep.indice]! : partida.juego,
    lineaActual: evActual?.linea ?? null,
    lineasError: comentario.tipo === 'error' ? comentario.errores.map((e) => e.linea) : [],
    comentario,
    vuelo,
    finVuelo: () => setVuelo(null),
  };
}
