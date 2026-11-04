import { useReducer } from 'react';
import { cargarNivel } from '../motor/cargador';
import { crearPartida, reducirPartida, type Partida } from '../motor/partida';
import datosN05 from '../niveles/N05.json';
import dialogos from '../textos/dialogos.es.json';
import { Avatar } from './componentes/Avatar';
import { BarraSuperior } from './componentes/BarraSuperior';
import { Bandeja, Estructuras } from './componentes/Estructuras';
import { Matriz } from './componentes/Matriz';
import { PanelCodigo } from './componentes/PanelCodigo';
import { PanelPiezas } from './componentes/PanelPiezas';
import './estilos/juego.css';
import './estilos/codigo.css';

const NIVEL = cargarNivel(datosN05);
const TEXTOS: Record<string, string> = dialogos;

const AVISOS: Record<string, string> = {
  en_espera: 'Esta pieza está en espera: primero deja fija la anterior.',
  fija: 'Esta pieza ya está fija. Arrástrala a la matriz.',
  colocada: 'Esta pieza ya está colocada en la matriz.',
};

function textoAvatar(p: Partida): string {
  const clave = p.nivel.dialogos['inicio'];
  return (clave && TEXTOS[clave]) ?? '';
}

/** Pantalla de juego con sus siete áreas (mecánicas §3). Aún sin interacción. */
export function App() {
  const [partida] = useReducer(reducirPartida, NIVEL, crearPartida);
  const { nivel, juego, seleccionada } = partida;
  const pieza = nivel.piezas.find((p) => p.id === seleccionada);
  const estado = seleccionada ? juego.piezas[seleccionada]?.estado : undefined;
  return (
    <main className="juego">
      <BarraSuperior partida={partida} />
      <div className="juego__lateral">
        <PanelPiezas partida={partida} />
        <Bandeja nivel={nivel} elementos={juego.bandeja} />
      </div>
      <Matriz nivel={nivel} juego={juego} />
      <Estructuras nivel={nivel} pila={juego.pila} cola={juego.cola} />
      <PanelCodigo pieza={pieza} aviso={(estado && AVISOS[estado]) ?? null} />
      <Avatar texto={textoAvatar(partida)} />
    </main>
  );
}
