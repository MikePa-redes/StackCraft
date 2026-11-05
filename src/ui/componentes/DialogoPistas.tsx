// Diálogo de pistas: pide confirmación antes de mostrar una pista nueva
// (resta una estrella) y permite releer gratis las ya vistas (§11 y §12).

import { estrellas, siguientePista, type Partida } from '../../motor/partida';

interface Props {
  partida: Partida;
  alVerNueva: () => void;
  alReleer: (id: string) => void;
  alCerrar: () => void;
}

export function DialogoPistas({ partida, alVerNueva, alReleer, alCerrar }: Props) {
  const nueva = siguientePista(partida);
  const actuales = estrellas(partida);
  const vistas = partida.nivel.pistas.filter((p) => partida.pistasVistas.includes(p.id));
  return (
    <div className="capa" role="presentation" onClick={alCerrar}>
      <div
        className="dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogo-pistas-titulo"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && alCerrar()}
      >
        <h2 id="dialogo-pistas-titulo" className="dialogo__titulo">
          Pistas
        </h2>
        {nueva ? (
          <p>
            Ver una pista nueva resta una estrella: pasarías de <strong>{actuales}</strong> a{' '}
            <strong>{Math.max(0, actuales - 1)}</strong>. ¿Quieres verla?
          </p>
        ) : (
          <p>Ya viste todas las pistas de este nivel.</p>
        )}
        {vistas.length > 0 && (
          <div className="dialogo__vistas">
            <span className="dialogo__nota">Volver a ver una pista no resta estrellas:</span>
            {vistas.map((p) => (
              <button key={p.id} className="boton boton--secundario" type="button" onClick={() => alReleer(p.id)}>
                Ver {p.id} otra vez
              </button>
            ))}
          </div>
        )}
        <div className="dialogo__acciones">
          <button className="boton boton--secundario" type="button" onClick={alCerrar} autoFocus={!nueva}>
            Cancelar
          </button>
          {nueva && (
            <button className="boton" type="button" onClick={alVerNueva} autoFocus>
              Ver pista nueva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
