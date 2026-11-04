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

function CampoHueco({ id, hueco }: { id: string; hueco: Hueco | undefined }) {
  if (hueco?.tipo === 'lista') {
    return (
      <select className="hueco" aria-label={`Hueco ${id}`} defaultValue="" disabled>
        <option value="">···</option>
        {hueco.opciones?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  return <input className="hueco hueco--texto" aria-label={`Hueco ${id}`} placeholder="···" disabled />;
}

/** Una línea de la plantilla: texto resaltado y huecos {{hN}} como campos. */
function LineaPlantilla({ linea, pieza }: { linea: string; pieza: Pieza }) {
  const trozos = linea.split(/\{\{(\w+)\}\}/);
  return (
    <>
      {trozos.map((t, i) =>
        i % 2 === 1 ? <CampoHueco key={i} id={t} hueco={pieza.huecos[t]} /> : <Resaltado key={i} texto={t} />,
      )}
    </>
  );
}

interface PropsPanel {
  pieza: Pieza | undefined;
  /** Mensaje cuando la pieza seleccionada no carga plantilla. */
  aviso: string | null;
}

/** Área 6: fragmento Python de la pieza seleccionada y botones de ejecución. */
export function PanelCodigo({ pieza, aviso }: PropsPanel) {
  return (
    <section className="area codigo" aria-label="Código">
      <div className="codigo__cabecera">
        <h2 className="area__titulo">Código {pieza && <code>{pieza.id}</code>}</h2>
        <div className="codigo__botones">
          <button className="boton" type="button" disabled>
            Ejecutar
          </button>
          <button className="boton boton--secundario" type="button" disabled>
            Paso a paso
          </button>
          <button className="boton boton--secundario" type="button" disabled>
            Deshacer última ejecución
          </button>
        </div>
      </div>
      {pieza && !aviso ? (
        <ol className="codigo__lineas">
          {pieza.plantilla.map((linea, i) => (
            <li key={i} className="codigo__linea">
              <LineaPlantilla linea={linea} pieza={pieza} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="codigo__aviso">{aviso ?? 'Selecciona una pieza.'}</p>
      )}
    </section>
  );
}
