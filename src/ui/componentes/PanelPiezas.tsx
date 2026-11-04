import type { Partida } from '../../motor/partida';
import type { EstadoVisualPieza } from '../../motor/tipos';
import { cajaDe, celdasVisibles, FiguraPieza, Lienzo } from './Figuras';

const NOMBRE_ESTADO: Record<EstadoVisualPieza, string> = {
  en_espera: 'En espera',
  incompleta: 'Incompleta',
  fija: 'Fija',
  colocada: 'Colocada',
};

/** Área 2: piezas del nivel en su orden, con identificador y estado. */
export function PanelPiezas({ partida }: { partida: Partida }) {
  const { nivel, juego, seleccionada } = partida;
  return (
    <section className="area piezas" aria-label="Piezas">
      <h2 className="area__titulo">Piezas</h2>
      <ul className="piezas__lista">
        {nivel.ordenPiezas.map((id) => {
          const pieza = nivel.piezas.find((p) => p.id === id);
          const ep = juego.piezas[id];
          if (!pieza || !ep) return null;
          const caja = cajaDe(celdasVisibles(nivel, pieza, ep.acoplados));
          const clase = `tarjeta tarjeta--${ep.estado}${seleccionada === id ? ' tarjeta--seleccionada' : ''}`;
          return (
            <li key={id} className={clase}>
              <Lienzo caja={caja} clase="lienzo--pieza" etiqueta={`Pieza ${id}`}>
                <FiguraPieza nivel={nivel} pieza={pieza} acoplados={ep.acoplados} estado={ep.estado} anclajesLibres />
              </Lienzo>
              <div className="tarjeta__info">
                <span className="tarjeta__id">{id}</span>
                <span className={`estado estado--${ep.estado}`}>{NOMBRE_ESTADO[ep.estado]}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
