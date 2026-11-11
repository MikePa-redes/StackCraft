import { useEffect, useReducer, useState } from 'react';
import { crearPartida, puedeDeshacer, puedeEditar, reducirPartida } from '../motor/partida';
import { resumirPartida, type ResumenNivel } from '../motor/resultados';
import { huecosCompletos } from '../motor/reproduccion';
import type { Nivel } from '../motor/tipos';
import { Avatar } from './componentes/Avatar';
import { DialogoPistas } from './componentes/DialogoPistas';
import { PiezaArrastrada } from './componentes/PiezaArrastrada';
import { Resultados } from './componentes/Resultados';
import { SeleccionNiveles } from './componentes/SeleccionNiveles';
import { BarraSuperior } from './componentes/BarraSuperior';
import { Bandeja, Estructuras } from './componentes/Estructuras';
import { Matriz } from './componentes/Matriz';
import { PanelCodigo } from './componentes/PanelCodigo';
import { PanelPiezas } from './componentes/PanelPiezas';
import { Volador } from './componentes/Volador';
import { guardarResultado, leerMejores, type Guardado } from './guardado';
import { NIVELES } from './niveles';
import { textoAvatar, textoExito } from './textoAvatar';
import { useArrastre } from './useArrastre';
import { useCronometro } from './useCronometro';
import { useEjecucion } from './useEjecucion';
import './estilos/juego.css';
import './estilos/codigo.css';
import './estilos/superposiciones.css';
import './estilos/menu.css';

const AVISOS: Record<string, string> = {
  en_espera: 'Esta pieza está en espera: primero deja fija la anterior.',
  fija: 'Esta pieza ya está fija. Arrástrala a la matriz.',
  colocada: 'Esta pieza ya está colocada en la matriz.',
};

/** Alterna entre la selección de niveles y el juego; cada intento monta un juego nuevo. */
export function App() {
  const [nivelId, setNivelId] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const nivel = NIVELES.find((n) => n.id === nivelId);
  if (!nivel) return <SeleccionNiveles niveles={NIVELES} mejores={leerMejores()} alElegir={setNivelId} />;
  return (
    <Juego
      key={`${nivel.id}-${intento}`}
      nivel={nivel}
      alReiniciar={() => setIntento((i) => i + 1)}
      alMenu={() => setNivelId(null)}
    />
  );
}

interface Final {
  resumen: ResumenNivel;
  guardado: Guardado;
  visible: boolean;
}

/** Pantalla de juego con sus siete áreas (mecánicas §3). */
function Juego({ nivel: nivelInicial, alReiniciar, alMenu }: { nivel: Nivel; alReiniciar: () => void; alMenu: () => void }) {
  const [partida, dispatch] = useReducer(reducirPartida, nivelInicial, crearPartida);
  const ej = useEjecucion(partida, dispatch);
  const arr = useArrastre(partida, dispatch);
  useCronometro(partida, dispatch);
  const [pidiendoPista, setPidiendoPista] = useState(false);
  const [final, setFinal] = useState<Final | null>(null);

  // Al completar la matriz se guarda una sola vez y se muestran los resultados.
  useEffect(() => {
    if (!partida.completado || final) return;
    const resumen = resumirPartida(partida);
    setFinal({ resumen, guardado: guardarResultado(resumen), visible: true });
  }, [partida.completado]);

  const { nivel, seleccionada } = partida;
  const juego = ej.juegoVisible;
  const pieza = nivel.piezas.find((p) => p.id === seleccionada);
  const estado = seleccionada ? partida.juego.piezas[seleccionada]?.estado : undefined;
  const editable = puedeEditar(partida) && !ej.reproduciendo;
  return (
    <main className="juego">
      <BarraSuperior partida={partida} alMenu={alMenu} alPedirPista={partida.completado ? undefined : () => setPidiendoPista(true)} />
      <div className="juego__lateral">
        <PanelPiezas
          partida={{ ...partida, juego }}
          alSeleccionar={
            ej.reproduciendo ? undefined : (id) => arr.consumirClic() || dispatch({ tipo: 'seleccionar', pieza: id })
          }
          arrastre={
            ej.reproduciendo || partida.completado ? undefined : { pieza: arr.arrastre?.pieza ?? null, ...arr.manejadores }
          }
        />
        <Bandeja nivel={nivel} elementos={juego.bandeja} />
      </div>
      <Matriz nivel={nivel} juego={juego} vistaPrevia={arr.vistaPrevia} />
      <Estructuras nivel={nivel} pila={juego.pila} cola={juego.cola} />
      <PanelCodigo
        pieza={pieza}
        aviso={(!ej.reproduciendo && estado && AVISOS[estado]) || null}
        valores={ej.valores}
        editable={editable}
        puedeEjecutar={editable && !!pieza && huecosCompletos(pieza, ej.valores)}
        puedeDeshacer={puedeDeshacer(partida)}
        reproduciendo={ej.reproduciendo}
        pasoAPaso={ej.pasoAPaso}
        lineaActual={ej.lineaActual}
        lineasError={ej.lineasError}
        alCambiar={ej.cambiarHueco}
        alEjecutar={() => ej.ejecutar('auto')}
        alPaso={() => ej.ejecutar('pasos')}
        alDeshacer={ej.deshacer}
      />
      <Avatar
        texto={textoAvatar(partida, ej.comentario, arr.aviso)}
        alCerrar={partida.pistaMostrada ? () => dispatch({ tipo: 'cerrarPista' }) : undefined}
      />
      {ej.vuelo && <Volador key={ej.vuelo.clave} nivel={nivel} vuelo={ej.vuelo} alTerminar={ej.finVuelo} />}
      {arr.arrastre && <PiezaArrastrada partida={partida} arrastre={arr.arrastre} alTerminarVuelta={arr.finVuelta} />}
      {pidiendoPista && (
        <DialogoPistas
          partida={partida}
          alVerNueva={() => {
            dispatch({ tipo: 'verPista' });
            setPidiendoPista(false);
          }}
          alReleer={(id) => {
            dispatch({ tipo: 'verPista', id });
            setPidiendoPista(false);
          }}
          alCerrar={() => setPidiendoPista(false)}
        />
      )}
      {final?.visible && (
        <Resultados
          titulo={`${nivel.id} · ${nivel.titulo}`}
          mensaje={textoExito(partida)}
          resumen={final.resumen}
          guardado={final.guardado}
          alRepetir={alReiniciar}
          alMenu={alMenu}
          alContinuar={() => setFinal({ ...final, visible: false })}
        />
      )}
    </main>
  );
}
