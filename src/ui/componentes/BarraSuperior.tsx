import { estrellas, type Partida } from '../../motor/partida';
import { formatoTiempo } from '../formato';

const ETAPAS: Record<string, string> = { stack: 'Stack', queue: 'Queue', mixta: 'Mixta' };

/** Área 1: nivel, progreso, cronómetro, pistas y configuración. */
interface Props {
  partida: Partida;
  /** Sin función, el botón de pistas queda deshabilitado. */
  alPedirPista?: () => void;
  alMenu: () => void;
}

export function BarraSuperior({ partida, alPedirPista, alMenu }: Props) {
  const { nivel, juego } = partida;
  const total = nivel.piezas.length;
  const colocadas = nivel.piezas.filter((p) => juego.piezas[p.id]?.estado === 'colocada').length;
  return (
    <header className="area barra">
      <span className="barra__marca">Stack-Craft</span>
      <div className="barra__nivel">
        <span className="insignia">{ETAPAS[nivel.etapa] ?? nivel.etapa}</span>
        <strong>{nivel.id}</strong>
        <span>{nivel.titulo}</span>
      </div>
      <div className="barra__progreso" title="Piezas colocadas">
        <progress max={total} value={colocadas} />
        <span>
          {colocadas}/{total} piezas
        </span>
      </div>
      <span className="barra__estrellas" aria-label={`${estrellas(partida)} estrellas`}>
        ★ {estrellas(partida)}
      </span>
      <span className={`barra__tiempo${partida.pausado ? ' barra__tiempo--pausado' : ''}`} aria-label="Tiempo">
        {formatoTiempo(partida.tiempoMs)}
      </span>
      <button className="boton" type="button" disabled={!alPedirPista || nivel.pistas.length === 0} onClick={alPedirPista}>
        Pista
      </button>
      <button className="boton boton--secundario" type="button" onClick={alMenu}>
        Menú
      </button>
    </header>
  );
}
