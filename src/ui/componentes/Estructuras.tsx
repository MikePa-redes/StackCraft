import type { Nivel } from '../../motor/tipos';
import { cajaDe, FiguraElemento, Lienzo } from './Figuras';

/** Un elemento suelto dibujado a su tamaño natural. */
export function ElementoSuelto({ nivel, id }: { nivel: Nivel; id: string }) {
  const forma = nivel.elementos[id]?.forma ?? [];
  return (
    <Lienzo caja={cajaDe(forma)} clase="lienzo--elemento" etiqueta={`Elemento ${id}`}>
      <FiguraElemento nivel={nivel} id={id} />
    </Lienzo>
  );
}

/** Área 3: elementos sueltos disponibles. */
export function Bandeja({ nivel, elementos }: { nivel: Nivel; elementos: string[] }) {
  return (
    <section className="area bandeja" aria-label="Bandeja">
      <h2 className="area__titulo">Bandeja</h2>
      <div className="bandeja__contenido">
        {elementos.length === 0 && <span className="vacio">Sin elementos</span>}
        {elementos.map((id) => (
          <ElementoSuelto key={id} nivel={nivel} id={id} />
        ))}
      </div>
    </section>
  );
}

interface PropsEstructuras {
  nivel: Nivel;
  pila: string[];
  cola: string[];
}

/** Área 4: pila (vertical) y cola (horizontal), solo si el nivel las usa. */
export function Estructuras({ nivel, pila, cola }: PropsEstructuras) {
  const ops = nivel.operaciones;
  const hayPila = ops.includes('push') || ops.includes('pop');
  const hayCola = ops.includes('enqueue') || ops.includes('dequeue');
  return (
    <section className="area estructuras" aria-label="Estructuras">
      {hayPila && (
        <div className="estructura estructura--pila">
          <h2 className="area__titulo">
            Pila <code>pila</code>
          </h2>
          <span className="estructura__marca">cima</span>
          {/* column-reverse: el índice 0 (fondo) queda abajo. */}
          <div className="pila">
            {pila.length === 0 && <span className="vacio">vacía</span>}
            {pila.map((id) => (
              <div key={id} className="pila__ranura">
                <ElementoSuelto nivel={nivel} id={id} />
              </div>
            ))}
          </div>
          <span className="estructura__marca">fondo</span>
        </div>
      )}
      {hayCola && (
        <div className="estructura estructura--cola">
          <h2 className="area__titulo">
            Cola <code>cola</code>
          </h2>
          <div className="cola">
            <span className="estructura__marca">frente</span>
            <div className="cola__carril">
              {cola.length === 0 && <span className="vacio">vacía</span>}
              {cola.map((id) => (
                <div key={id} className="cola__ranura">
                  <ElementoSuelto nivel={nivel} id={id} />
                </div>
              ))}
            </div>
            <span className="estructura__marca">final</span>
          </div>
        </div>
      )}
    </section>
  );
}
