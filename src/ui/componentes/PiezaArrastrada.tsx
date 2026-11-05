// Copia de la pieza que sigue al puntero mientras se arrastra. Tras un
// rechazo vuelve a su lugar en el panel con una transición CSS.

import { useEffect, type CSSProperties } from 'react';
import type { Partida } from '../../motor/partida';
import type { Arrastre } from '../useArrastre';
import { FiguraPieza } from './Figuras';

/** Margen sobre la duración de la transición por si no llega transitionend. */
const ESPERA_VUELTA_MS = 400;

interface Props {
  partida: Partida;
  arrastre: Arrastre;
  alTerminarVuelta: () => void;
}

export function PiezaArrastrada({ partida, arrastre, alTerminarVuelta }: Props) {
  const { nivel, juego } = partida;
  const pieza = nivel.piezas.find((p) => p.id === arrastre.pieza);
  const ep = juego.piezas[arrastre.pieza];

  useEffect(() => {
    if (!arrastre.volviendo) return;
    const t = setTimeout(alTerminarVuelta, ESPERA_VUELTA_MS);
    return () => clearTimeout(t);
  }, [arrastre.volviendo]);

  if (!pieza || !ep) return null;
  const { rect, caja } = arrastre;
  const estilo: CSSProperties = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  return (
    <div
      className={`arrastrada${arrastre.volviendo ? ' arrastrada--volviendo' : ''}`}
      style={estilo}
      aria-hidden="true"
      onTransitionEnd={arrastre.volviendo ? alTerminarVuelta : undefined}
    >
      <svg className="lienzo" viewBox={`${caja.x} ${caja.y} ${caja.ancho} ${caja.alto}`}>
        <FiguraPieza nivel={nivel} pieza={pieza} acoplados={ep.acoplados} estado={ep.estado} />
      </svg>
    </div>
  );
}
