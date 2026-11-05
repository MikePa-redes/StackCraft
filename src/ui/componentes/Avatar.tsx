/**
 * Área 7: marcador neutro del avatar (mecánicas §3 y §15). El diseño del
 * avatar no está definido: solo se reserva el espacio y el globo de texto.
 */
interface Props {
  texto: string;
  /** Si el mensaje se puede cerrar (p. ej. una pista), muestra el botón. */
  alCerrar?: () => void;
}

export function Avatar({ texto, alCerrar }: Props) {
  return (
    <aside className="area avatar" aria-label="Avatar">
      <div className="avatar__globo" role="status">
        <span>{texto}</span>
        {alCerrar && (
          <button className="boton boton--secundario avatar__cerrar" type="button" onClick={alCerrar}>
            Cerrar
          </button>
        )}
      </div>
      <div className="avatar__marcador" aria-hidden="true">
        Avatar
      </div>
    </aside>
  );
}
