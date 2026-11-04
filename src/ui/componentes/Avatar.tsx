/**
 * Área 7: marcador neutro del avatar (mecánicas §3 y §15). El diseño del
 * avatar no está definido: solo se reserva el espacio y el globo de texto.
 */
export function Avatar({ texto }: { texto: string }) {
  return (
    <aside className="area avatar" aria-label="Avatar">
      <div className="avatar__globo" role="status">
        {texto}
      </div>
      <div className="avatar__marcador" aria-hidden="true">
        Avatar
      </div>
    </aside>
  );
}
