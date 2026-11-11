import { LOBO_ABIERTO, LOBO_CERRADO, LOBO_TAMANO } from './loboPixel';

interface Props {
  /** true mientras el lobo "habla" con la boca abierta. */
  bocaAbierta: boolean;
}

/** Avatar pixel art: lobo gris con dos poses de boca. */
export function Lobo({ bocaAbierta }: Props) {
  const rects = bocaAbierta ? LOBO_ABIERTO : LOBO_CERRADO;
  return (
    <svg
      className="lobo"
      viewBox={`0 0 ${LOBO_TAMANO} ${LOBO_TAMANO}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} className={`lobo__p lobo__p--${r.clase}`} x={r.x} y={r.y} width={r.ancho} height={1} />
      ))}
    </svg>
  );
}
