// Cronómetro de la partida: despacha 'tick' con el tiempo transcurrido
// (el reducer no lee el reloj). Se pausa cuando la pestaña o la ventana
// pierden el foco y continúa al volver (mecánicas §13).

import { useEffect, useRef, type Dispatch } from 'react';
import type { Accion, Partida } from '../motor/partida';

const INTERVALO_MS = 250;

export function useCronometro(partida: Partida, dispatch: Dispatch<Accion>) {
  const corriendo = !partida.pausado && !partida.completado;
  /** true si la pausa actual la puso la pérdida de foco (no el menú). */
  const pausaPorFoco = useRef(false);

  useEffect(() => {
    if (!corriendo) return;
    let previo = performance.now();
    const id = setInterval(() => {
      const ahora = performance.now();
      dispatch({ tipo: 'tick', ms: ahora - previo });
      previo = ahora;
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [corriendo, dispatch]);

  const pausado = partida.pausado;
  useEffect(() => {
    const perder = () => {
      if (pausado) return;
      pausaPorFoco.current = true;
      dispatch({ tipo: 'pausar' });
    };
    const recuperar = () => {
      if (!pausado || !pausaPorFoco.current || document.hidden || !document.hasFocus()) return;
      pausaPorFoco.current = false;
      dispatch({ tipo: 'reanudar' });
    };
    const alCambiarVisibilidad = () => (document.hidden ? perder() : recuperar());
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    window.addEventListener('blur', perder);
    window.addEventListener('focus', recuperar);
    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('blur', perder);
      window.removeEventListener('focus', recuperar);
    };
  }, [pausado, dispatch]);
}
