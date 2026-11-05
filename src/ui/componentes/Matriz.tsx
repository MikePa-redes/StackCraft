import type { EstadoPartida, Nivel } from '../../motor/tipos';
import type { VistaPrevia } from '../useArrastre';
import { Bloque, FiguraPieza, Lienzo } from './Figuras';

interface Props {
  nivel: Nivel;
  juego: EstadoPartida;
  /** Celdas donde caería la pieza arrastrada, válidas o no. */
  vistaPrevia?: VistaPrevia | null;
}

/** Área 5: silueta de la matriz, piezas de referencia, colocadas y vista previa. */
export function Matriz({ nivel, juego, vistaPrevia }: Props) {
  const { ancho, alto, celdas, piezasReferencia } = nivel.matriz;
  return (
    <section className="area matriz" aria-label="Matriz">
      <h2 className="area__titulo">Matriz</h2>
      <div className="matriz__tablero">
        <Lienzo caja={{ x: 0, y: 0, ancho, alto }} clase="lienzo--matriz" etiqueta="Matriz de ensamblaje">
          {celdas.flatMap((fila, y) =>
            fila.map((tipo, x) =>
              tipo === 'fuera' ? null : <Bloque key={`${x},${y}`} x={x} y={y} clase={`celda celda--${tipo}`} />,
            ),
          )}
          {piezasReferencia.map((ref) => (
            <g key={ref.id} className="referencia">
              <title>{`Pieza de referencia ${ref.id}`}</title>
              {ref.celdas.map(([x, y]) => (
                <Bloque key={`${x},${y}`} x={x} y={y} clase="bloque--referencia" />
              ))}
            </g>
          ))}
          {nivel.piezas.map((pieza) => {
            const ep = juego.piezas[pieza.id];
            if (ep?.estado !== 'colocada' || !ep.colocadaEn) return null;
            return (
              <FiguraPieza
                key={pieza.id}
                nivel={nivel}
                pieza={pieza}
                acoplados={ep.acoplados}
                estado={ep.estado}
                dx={ep.colocadaEn.x}
                dy={ep.colocadaEn.y}
              />
            );
          })}
          {vistaPrevia && (
            <g className={`previa previa--${vistaPrevia.valida ? 'valida' : 'invalida'}`}>
              {vistaPrevia.celdas.map(([x, y]) => (
                <Bloque key={`${x},${y}`} x={x} y={y} clase="bloque--previa" />
              ))}
            </g>
          )}
        </Lienzo>
      </div>
    </section>
  );
}
