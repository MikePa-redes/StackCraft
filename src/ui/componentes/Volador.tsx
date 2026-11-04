// Animación de un movimiento: una copia del elemento vuela del rectángulo de
// origen al de destino con una transición CSS (técnica FLIP). Mientras
// tanto, el elemento real en su destino se oculta.

import { useLayoutEffect, useRef } from 'react';
import type { Nivel } from '../../motor/tipos';
import { ElementoSuelto } from './Estructuras';

export interface Vuelo {
  elemento: string;
  desde: DOMRect;
  hasta: DOMRect;
  /** Distinta en cada vuelo para reiniciar la animación. */
  clave: number;
}

/** Nodo del elemento fuera de la matriz (las piezas colocadas no se mueven). */
function nodoElemento(id: string): Element | null {
  const sel = `[data-elemento="${CSS.escape(id)}"]`;
  return document.querySelector(`.juego__lateral ${sel}, .estructuras ${sel}`);
}

export function rectElemento(id: string): DOMRect | null {
  return nodoElemento(id)?.getBoundingClientRect() ?? null;
}

/** Margen sobre la duración de la transición por si no llega transitionend. */
const MARGEN_MS = 100;

interface Props {
  nivel: Nivel;
  vuelo: Vuelo;
  alTerminar: () => void;
}

export function Volador({ nivel, vuelo, alTerminar }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const div = ref.current;
    if (!div) return;
    const destino = nodoElemento(vuelo.elemento);
    destino?.classList.add('en-vuelo');
    const { desde, hasta } = vuelo;
    div.getBoundingClientRect(); // fija la posición inicial antes de transicionar
    div.style.transform =
      `translate(${hasta.left - desde.left}px, ${hasta.top - desde.top}px) ` +
      `scale(${hasta.width / desde.width}, ${hasta.height / desde.height})`;
    const duracion = parseFloat(getComputedStyle(div).transitionDuration) * 1000 || 0;
    const fin = () => {
      destino?.classList.remove('en-vuelo');
      alTerminar();
    };
    div.addEventListener('transitionend', fin, { once: true });
    const t = setTimeout(fin, duracion + MARGEN_MS);
    return () => {
      clearTimeout(t);
      div.removeEventListener('transitionend', fin);
      destino?.classList.remove('en-vuelo');
    };
    // alTerminar cambia en cada render; el vuelo solo depende de su clave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vuelo]);

  const { desde } = vuelo;
  return (
    <div
      ref={ref}
      className="volador"
      aria-hidden="true"
      style={{ left: desde.left, top: desde.top, width: desde.width, height: desde.height }}
    >
      <ElementoSuelto nivel={nivel} id={vuelo.elemento} />
    </div>
  );
}
