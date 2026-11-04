import { tokenizar, type Token } from '../../motor/lexico';
import type { Hueco, Pieza } from '../../motor/tipos';

const OBJETOS = new Set(['pila', 'cola']);

function claseToken(t: Token, siguiente: Token | undefined): string {
  if (t.tipo === 'texto') return 'tk-texto';
  if (t.tipo === 'comentario') return 'tk-comentario';
  if (t.tipo === 'nombre') {
    if (OBJETOS.has(t.valor)) return 'tk-objeto';
    if (siguiente?.tipo === 'abre') return 'tk-funcion';
    return 'tk-nombre';
  }
  return 'tk-simbolo';
}

/** Resalta un fragmento de código usando el léxico del motor. */
function Resaltado({ texto }: { texto: string }) {
  const lex = tokenizar(texto);
  if (!lex.ok || lex.tokens.length === 0) return <>{texto}</>;
  const { tokens } = lex;
  const partes = [<span key="ini">{texto.slice(0, tokens[0]?.columna ?? 0)}</span>];
  tokens.forEach((t, i) => {
    const fin = tokens[i + 1]?.columna ?? texto.length;
    const crudo = texto.slice(t.columna, fin);
    const limpio = crudo.trimEnd();
    partes.push(
      <span key={i} className={claseToken(t, tokens[i + 1])}>
        {limpio}
      </span>,
      <span key={`e${i}`}>{crudo.slice(limpio.length)}</span>,
    );
  });
  return <>{partes}</>;
}

interface PropsCampo {
  id: string;
  hueco: Hueco | undefined;
  valor: string;
  activo: boolean;
  alCambiar: (hueco: string, valor: string) => void;
}

function CampoHueco({ id, hueco, valor, activo, alCambiar }: PropsCampo) {
  const comun = { className: 'hueco', 'aria-label': `Hueco ${id}`, value: valor, disabled: !activo };
  if (hueco?.tipo === 'lista') {
    return (
      <select {...comun} onChange={(e) => alCambiar(id, e.target.value)}>
        <option value="">···</option>
        {hueco.opciones?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      {...comun}
      className="hueco hueco--texto"
      placeholder="···"
      spellCheck={false}
      autoComplete="off"
      onChange={(e) => alCambiar(id, e.target.value)}
    />
  );
}

interface PropsLinea {
  linea: string;
  pieza: Pieza;
  valores: Record<string, string>;
  activo: boolean;
  alCambiar: (hueco: string, valor: string) => void;
}

/** Una línea de la plantilla: texto resaltado y huecos {{hN}} como campos. */
function LineaPlantilla({ linea, pieza, ...campo }: PropsLinea) {
  const trozos = linea.split(/\{\{(\w+)\}\}/);
  return (
    <>
      {trozos.map((t, i) =>
        i % 2 === 1 ? (
          <CampoHueco key={i} id={t} hueco={pieza.huecos[t]} valor={campo.valores[t] ?? ''} {...campo} />
        ) : (
          <Resaltado key={i} texto={t} />
        ),
      )}
    </>
  );
}

export interface PropsPanel {
  pieza: Pieza | undefined;
  /** Mensaje cuando la pieza seleccionada no carga plantilla. */
  aviso: string | null;
  valores: Record<string, string>;
  /** Se pueden editar huecos (pieza activa y sin animación en curso). */
  editable: boolean;
  puedeEjecutar: boolean;
  puedeDeshacer: boolean;
  reproduciendo: boolean;
  pasoAPaso: boolean;
  lineaActual: number | null;
  lineasError: number[];
  alCambiar: (hueco: string, valor: string) => void;
  alEjecutar: () => void;
  alPaso: () => void;
  alDeshacer: () => void;
}

function claseLinea(n: number, actual: number | null, errores: number[]): string {
  if (errores.includes(n)) return 'codigo__linea codigo__linea--error';
  if (n === actual) return 'codigo__linea codigo__linea--actual';
  return 'codigo__linea';
}

/** Área 6: fragmento Python de la pieza seleccionada y botones de ejecución. */
export function PanelCodigo(p: PropsPanel) {
  const { pieza, aviso } = p;
  return (
    <section className="area codigo" aria-label="Código">
      <div className="codigo__cabecera">
        <h2 className="area__titulo">Código {pieza && <code>{pieza.id}</code>}</h2>
        <div className="codigo__botones">
          <button className="boton" type="button" disabled={!p.puedeEjecutar && !p.pasoAPaso} onClick={p.alEjecutar}>
            Ejecutar
          </button>
          <button
            className="boton boton--secundario"
            type="button"
            disabled={!p.puedeEjecutar && !p.pasoAPaso}
            onClick={p.alPaso}
          >
            {p.pasoAPaso ? 'Siguiente paso' : 'Paso a paso'}
          </button>
          <button
            className="boton boton--secundario"
            type="button"
            disabled={!p.puedeDeshacer || p.reproduciendo}
            onClick={p.alDeshacer}
          >
            Deshacer última ejecución
          </button>
        </div>
      </div>
      {pieza && !aviso ? (
        <ol className="codigo__lineas">
          {pieza.plantilla.map((linea, i) => (
            <li key={i} className={claseLinea(i + 1, p.lineaActual, p.lineasError)}>
              <LineaPlantilla
                linea={linea}
                pieza={pieza}
                valores={p.valores}
                activo={p.editable}
                alCambiar={p.alCambiar}
              />
            </li>
          ))}
        </ol>
      ) : (
        <p className="codigo__aviso">{aviso ?? 'Selecciona una pieza.'}</p>
      )}
    </section>
  );
}
