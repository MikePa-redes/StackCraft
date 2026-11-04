import type { Partida } from '../../motor/partida';

const ETAPAS: Record<string, string> = { stack: 'Stack', queue: 'Queue', mixta: 'Mixta' };

function formatoTiempo(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Área 1: nivel, progreso, cronómetro, pistas y configuración. */
export function BarraSuperior({ partida }: { partida: Partida }) {
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
      <span className="barra__tiempo" aria-label="Tiempo">
        {formatoTiempo(partida.tiempoMs)}
      </span>
      <button className="boton" type="button" disabled>
        Pista
      </button>
      <button className="boton boton--secundario" type="button" disabled>
        Configuración
      </button>
    </header>
  );
}
