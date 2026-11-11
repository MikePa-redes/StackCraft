import { useTextoHablado } from '../useTextoHablado';
import { Lobo } from './Lobo';

/**
 * Área 7: avatar (mecánicas §3 y §15). Lobo gris pixel art que mueve la boca
 * mientras el texto del globo se escribe.
 */
interface Props {
  texto: string;
  /** Si el mensaje se puede cerrar (p. ej. una pista), muestra el botón. */
  alCerrar?: () => void;
}

export function Avatar({ texto, alCerrar }: Props) {
  const { visible, bocaAbierta } = useTextoHablado(texto);
  return (
    <aside className="area avatar" aria-label="Avatar">
      <div className="avatar__globo" role="status" aria-label={texto}>
        <span aria-hidden="true">{visible}</span>
        {alCerrar && (
          <button className="boton boton--secundario avatar__cerrar" type="button" onClick={alCerrar}>
            Cerrar
          </button>
        )}
      </div>
      <div className="avatar__marcador" aria-hidden="true">
        <Lobo bocaAbierta={bocaAbierta} />
      </div>
    </aside>
  );
}
