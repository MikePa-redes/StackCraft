// Pantalla de resultados al completar la matriz (mecánicas §14).

import type { ResumenNivel } from '../../motor/resultados';
import { formatoTiempo } from '../formato';
import type { Guardado } from '../guardado';

interface Props {
  titulo: string;
  mensaje: string;
  resumen: ResumenNivel;
  guardado: Guardado;
  alRepetir: () => void;
  alContinuar: () => void;
  alMenu: () => void;
}

export function Resultados({ titulo, mensaje, resumen, guardado, alRepetir, alContinuar, alMenu }: Props) {
  const { estadisticas: e } = resumen;
  const filas: [string, string][] = [
    ['Tiempo', formatoTiempo(resumen.tiempoMs)],
    ['Pistas usadas', String(resumen.pistas.length)],
    ['Operaciones ejecutadas', String(e.operaciones)],
    ['Ejecuciones fallidas', String(e.fallidas)],
  ];
  return (
    <div className="capa" role="presentation">
      <div className="dialogo resultados" role="dialog" aria-modal="true" aria-labelledby="resultados-titulo">
        <h2 id="resultados-titulo" className="resultados__titulo">
          ¡Nivel completado!
        </h2>
        <p className="resultados__nivel">{titulo}</p>
        <p className="resultados__estrellas" aria-label={`${resumen.estrellas} de 3 estrellas`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`estrella${i < resumen.estrellas ? ' estrella--ganada' : ''}`} aria-hidden="true">
              ★
            </span>
          ))}
        </p>
        <p>{mensaje}</p>
        <dl className="resultados__datos">
          {filas.map(([nombre, valor]) => (
            <div key={nombre}>
              <dt>{nombre}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
        <p className="dialogo__nota">
          {guardado.record
            ? '¡Nuevo mejor resultado!'
            : guardado.mejor
              ? `Mejor resultado: ${guardado.mejor.estrellas} ★ en ${formatoTiempo(guardado.mejor.tiempoMs)}`
              : ''}
        </p>
        <div className="dialogo__acciones">
          <button className="boton boton--secundario" type="button" onClick={alRepetir}>
            Repetir nivel
          </button>
          <button className="boton boton--secundario" type="button" onClick={alContinuar}>
            Ver tablero
          </button>
          <button className="boton" type="button" onClick={alMenu} autoFocus>
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
}
