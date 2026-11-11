// Pantalla inicial: lista de niveles con su mejor resultado guardado.

import type { Nivel } from '../../motor/tipos';
import type { Resultado } from '../../motor/resultados';
import { formatoTiempo } from '../formato';

const ETAPAS: Record<string, string> = { stack: 'Stack', queue: 'Queue', mixta: 'Mixta' };

interface Props {
  niveles: Nivel[];
  mejores: Record<string, Resultado>;
  alElegir: (id: string) => void;
}

export function SeleccionNiveles({ niveles, mejores, alElegir }: Props) {
  return (
    <main className="seleccion">
      <h1 className="seleccion__titulo">Stack-Craft</h1>
      <p className="seleccion__lema">Arma las piezas con Stack (LIFO) y Queue (FIFO).</p>
      <ul className="seleccion__lista">
        {niveles.map((n) => {
          const mejor = mejores[n.id];
          return (
            <li key={n.id}>
              <button className="tarjeta-nivel" type="button" onClick={() => alElegir(n.id)}>
                <span className="insignia">{ETAPAS[n.etapa] ?? n.etapa}</span>
                <strong>{n.id}</strong>
                <span>{n.titulo}</span>
                <span className="tarjeta-nivel__estrellas" aria-label={`${mejor?.estrellas ?? 0} de 3 estrellas`}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`estrella${mejor && i < mejor.estrellas ? ' estrella--ganada' : ''}`} aria-hidden="true">
                      ★
                    </span>
                  ))}
                </span>
                <span className="dialogo__nota">{mejor ? formatoTiempo(mejor.tiempoMs) : 'Sin completar'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
