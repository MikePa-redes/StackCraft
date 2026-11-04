import { useReducer } from 'react';
import { cargarNivel } from '../motor/cargador';
import { crearPartida, puedeDeshacer, puedeEditar, reducirPartida } from '../motor/partida';
import { huecosCompletos } from '../motor/reproduccion';
import datosN05 from '../niveles/N05.json';
import { Avatar } from './componentes/Avatar';
import { BarraSuperior } from './componentes/BarraSuperior';
import { Bandeja, Estructuras } from './componentes/Estructuras';
import { Matriz } from './componentes/Matriz';
import { PanelCodigo } from './componentes/PanelCodigo';
import { PanelPiezas } from './componentes/PanelPiezas';
import { Volador } from './componentes/Volador';
import { textoAvatar } from './textoAvatar';
import { useEjecucion } from './useEjecucion';
import './estilos/juego.css';
import './estilos/codigo.css';

const NIVEL = cargarNivel(datosN05);

const AVISOS: Record<string, string> = {
  en_espera: 'Esta pieza está en espera: primero deja fija la anterior.',
  fija: 'Esta pieza ya está fija. Arrástrala a la matriz.',
  colocada: 'Esta pieza ya está colocada en la matriz.',
};

/** Pantalla de juego con sus siete áreas (mecánicas §3). */
export function App() {
  const [partida, dispatch] = useReducer(reducirPartida, NIVEL, crearPartida);
  const ej = useEjecucion(partida, dispatch);
  const { nivel, seleccionada } = partida;
  const juego = ej.juegoVisible;
  const pieza = nivel.piezas.find((p) => p.id === seleccionada);
  const estado = seleccionada ? partida.juego.piezas[seleccionada]?.estado : undefined;
  const editable = puedeEditar(partida) && !ej.reproduciendo;
  return (
    <main className="juego">
      <BarraSuperior partida={partida} />
      <div className="juego__lateral">
        <PanelPiezas
          partida={{ ...partida, juego }}
          alSeleccionar={ej.reproduciendo ? undefined : (id) => dispatch({ tipo: 'seleccionar', pieza: id })}
        />
        <Bandeja nivel={nivel} elementos={juego.bandeja} />
      </div>
      <Matriz nivel={nivel} juego={juego} />
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
      <Avatar texto={textoAvatar(partida, ej.comentario)} />
      {ej.vuelo && <Volador key={ej.vuelo.clave} nivel={nivel} vuelo={ej.vuelo} alTerminar={ej.finVuelo} />}
    </main>
  );
}
