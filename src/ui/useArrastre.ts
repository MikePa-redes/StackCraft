// Arrastre de piezas fijas del panel a la matriz con eventos de puntero
// nativos. Las reglas de colocación viven en el motor (`motivoColocacion`);
// aquí solo se traduce la posición del puntero a celdas de la matriz.

import { useEffect, useRef, useState, type Dispatch, type PointerEvent as EventoPuntero } from 'react';
import { motivoColocacion, type Accion, type Partida } from '../motor/partida';
import type { Celda } from '../motor/tipos';
import type { Caja } from './componentes/Figuras';
import type { MotivoColocacion } from '../motor/validador';
import { formaPieza } from '../motor/validador';

/** Distancia mínima (px) para distinguir un arrastre de un clic. */
const UMBRAL_PX = 4;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Arrastre {
  pieza: string;
  /** Caja de la pieza en celdas (viewBox de la copia, igual que en el panel). */
  caja: Caja;
  /** Rectángulo en pantalla de la copia que sigue al puntero. */
  rect: Rect;
  /** La copia regresa al panel tras un rechazo (con transición). */
  volviendo: boolean;
}

export interface VistaPrevia {
  celdas: Celda[];
  valida: boolean;
}

interface Inicio {
  pieza: string;
  x: number;
  y: number;
  /** Punto agarrado en unidades de celda, relativo al origen de la pieza. */
  agarre: [number, number];
  /** Caja de la pieza (celdas) y rectángulo de su dibujo en el panel. */
  caja: Caja;
  rectPanel: Rect;
  activo: boolean;
}

export type AvisoColocacion = { tipo: 'ok' } | { tipo: 'rechazo'; motivo: MotivoColocacion } | null;

const lienzoMatriz = () => document.querySelector<SVGSVGElement>('.matriz .lienzo--matriz');

export function useArrastre(partida: Partida, dispatch: Dispatch<Accion>) {
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [destino, setDestino] = useState<{ x: number; y: number } | null>(null);
  const [aviso, setAviso] = useState<AvisoColocacion>(null);
  const inicio = useRef<Inicio | null>(null);
  const recienArrastrada = useRef(false);

  // Un aviso de colocación deja de valer en cuanto se vuelve a ejecutar código.
  useEffect(() => setAviso(null), [partida.ultimaEjecucion]);

  /** Origen de la pieza en la matriz bajo el puntero, o null si está fuera. */
  function origenEnMatriz(ini: Inicio, px: number, py: number) {
    const svg = lienzoMatriz();
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    if (px < r.left || px > r.right || py < r.top || py > r.bottom) return null;
    const tam = r.width / partida.nivel.matriz.ancho;
    return {
      x: Math.round((px - r.left) / tam - ini.agarre[0]),
      y: Math.round((py - r.top) / tam - ini.agarre[1]),
    };
  }

  function rectCopia(ini: Inicio, px: number, py: number): Rect {
    const svg = lienzoMatriz();
    const tam = svg ? svg.getBoundingClientRect().width / partida.nivel.matriz.ancho : ini.rectPanel.width / ini.caja.ancho;
    return {
      left: px - (ini.agarre[0] - ini.caja.x) * tam,
      top: py - (ini.agarre[1] - ini.caja.y) * tam,
      width: ini.caja.ancho * tam,
      height: ini.caja.alto * tam,
    };
  }

  function alPresionar(pieza: string, e: EventoPuntero<HTMLElement>) {
    if (e.button !== 0 || partida.juego.piezas[pieza]?.estado !== 'fija') return;
    const svg = e.currentTarget.querySelector('svg');
    const vb = svg?.viewBox.baseVal;
    if (!svg || !vb) return;
    const r = svg.getBoundingClientRect();
    const caja = { x: vb.x, y: vb.y, ancho: vb.width, alto: vb.height };
    inicio.current = {
      pieza,
      x: e.clientX,
      y: e.clientY,
      agarre: [caja.x + ((e.clientX - r.left) / r.width) * caja.ancho, caja.y + ((e.clientY - r.top) / r.height) * caja.alto],
      caja,
      rectPanel: { left: r.left, top: r.top, width: r.width, height: r.height },
      activo: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function alMover(e: EventoPuntero<HTMLElement>) {
    const ini = inicio.current;
    if (!ini) return;
    if (!ini.activo && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) < UMBRAL_PX) return;
    ini.activo = true;
    setAviso(null);
    setArrastre({ pieza: ini.pieza, caja: ini.caja, rect: rectCopia(ini, e.clientX, e.clientY), volviendo: false });
    setDestino(origenEnMatriz(ini, e.clientX, e.clientY));
  }

  function alSoltar(e: EventoPuntero<HTMLElement>) {
    const ini = inicio.current;
    inicio.current = null;
    if (!ini?.activo) return;
    recienArrastrada.current = true;
    setDestino(null);
    const o = origenEnMatriz(ini, e.clientX, e.clientY);
    // Soltar fuera de la matriz solo cancela el arrastre.
    const motivo = o ? motivoColocacion(partida, ini.pieza, o.x, o.y) : null;
    if (o) {
      dispatch({ tipo: 'colocar', pieza: ini.pieza, x: o.x, y: o.y });
      setAviso(motivo ? { tipo: 'rechazo', motivo } : { tipo: 'ok' });
    }
    if (o && !motivo) setArrastre(null);
    else setArrastre({ pieza: ini.pieza, caja: ini.caja, rect: ini.rectPanel, volviendo: true });
  }

  function alCancelar() {
    const ini = inicio.current;
    inicio.current = null;
    setDestino(null);
    if (ini?.activo) setArrastre({ pieza: ini.pieza, caja: ini.caja, rect: ini.rectPanel, volviendo: true });
  }

  /** El clic que sigue a un arrastre no debe seleccionar la pieza. */
  function consumirClic(): boolean {
    const r = recienArrastrada.current;
    recienArrastrada.current = false;
    return r;
  }

  let vistaPrevia: VistaPrevia | null = null;
  const def = arrastre && partida.nivel.piezas.find((p) => p.id === arrastre.pieza);
  const ep = arrastre && partida.juego.piezas[arrastre.pieza];
  if (destino && def && ep && !arrastre.volviendo) {
    vistaPrevia = {
      celdas: formaPieza(partida.nivel, def, ep.acoplados).map(([x, y]): Celda => [destino.x + x, destino.y + y]),
      valida: motivoColocacion(partida, def.id, destino.x, destino.y) === null,
    };
  }

  return {
    arrastre,
    vistaPrevia,
    aviso,
    manejadores: { alPresionar, alMover, alSoltar, alCancelar },
    consumirClic,
    finVuelta: () => setArrastre((a) => (a?.volviendo ? null : a)),
  };
}
