import { useEffect, useReducer, useState } from 'react';
import { cargarNivel } from '../motor/cargador';
import { crearPartida, puedeDeshacer, puedeEditar, reducirPartida } from '../motor/partida';
import { resumirPartida, type ResumenNivel } from '../motor/resultados';
import { huecosCompletos } from '../motor/reproduccion';
import datosN05 from '../niveles/N05.json';
import { Avatar } from './componentes/Avatar';
import { DialogoPistas } from './componentes/DialogoPistas';
import { PiezaArrastrada } from './componentes/PiezaArrastrada';
import { Resultados } from './componentes/Resultados';
import { BarraSuperior } from './componentes/BarraSuperior';
import { Bandeja, Estructuras } from './componentes/Estructuras';
import { Matriz } from './componentes/Matriz';
import { PanelCodigo } from './componentes/PanelCodigo';
import { PanelPiezas } from './componentes/PanelPiezas';
import { Volador } from './componentes/Volador';
import { guardarResultado, type Guardado } from './guardado';
import { textoAvatar, textoExito } from './textoAvatar';
import { useArrastre } from './useArrastre';
import { useCronometro } from './useCronometro';
import { useEjecucion } from './useEjecucion';
import './estilos/juego.css';
import './estilos/codigo.css';
import './estilos/superposiciones.css';

const NIVEL = cargarNivel(datosN05);

const AVISOS: Record<string, string> = {
  en_espera: 'Esta pieza está en espera: primero deja fija la anterior.',
  fija: 'Esta pieza ya está fija. Arrástrala a la matriz.',
  colocada: 'Esta pieza ya está colocada en la matriz.',
};

/** Cada intento monta un juego nuevo: reiniciar no deja residuos (ni huecos). */
export function App() {
  const [intento, setIntento] = useState(0);
  return <Juego key={intento} alReiniciar={() => setIntento((i) => i + 1)} />;
}

interface Final {
  resumen: ResumenNivel;
  guardado: Guardado;
  visible: boolean;
}

/** Pantalla de juego con sus siete áreas (mecánicas §3). */
function Juego({ alReiniciar }: { alReiniciar: () => void }) {
  const [partida, dispatch] = useReducer(reducirPartida, NIVEL, crearPartida);
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
      <BarraSuperior partida={partida} alPedirPista={partida.completado ? undefined : () => setPidiendoPista(true)} />
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
          alContinuar={() => setFinal({ ...final, visible: false })}
        />
      )}
    </main>
  );
}
