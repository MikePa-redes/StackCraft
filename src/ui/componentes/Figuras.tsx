// Primitivas SVG compartidas: bloques, elementos y piezas dibujados en
// unidades de celda (1 celda = 1 unidad del viewBox). Sin lógica de juego.

import type { CSSProperties, ReactNode } from 'react';
import type { Acople, Celda, EstadoVisualPieza, Nivel, Pieza } from '../../motor/tipos';

/** Estilo que pasa el color del elemento a CSS (relleno y borde derivado). */
export function conRelleno(color: string): CSSProperties {
  return { ['--relleno' as string]: color } as CSSProperties;
}

interface PropsBloque {
  x: number;
  y: number;
  clase: string;
}

/** Un cuadro de celda con margen interior y esquinas redondeadas. */
export function Bloque({ x, y, clase }: PropsBloque) {
  return <rect className={`bloque ${clase}`} x={x + 0.05} y={y + 0.05} width={0.9} height={0.9} rx={0.14} />;
}

/** Texto centrado en una celda. */
export function Letra({ x, y, texto, clase = '' }: { x: number; y: number; texto: string; clase?: string }) {
  return (
    <text className={`bloque__letra ${clase}`} x={x + 0.5} y={y + 0.52}>
      {texto}
    </text>
  );
}

interface PropsElemento {
  nivel: Nivel;
  id: string;
  dx?: number;
  dy?: number;
}

/** Elemento con su forma, su color y su letra en la celda de origen. */
export function FiguraElemento({ nivel, id, dx = 0, dy = 0 }: PropsElemento) {
  const el = nivel.elementos[id];
  if (!el) return null;
  return (
    <g className="elemento" style={conRelleno(el.color)}>
      {el.forma.map(([x, y]) => (
        <Bloque key={`${x},${y}`} x={dx + x} y={dy + y} clase="bloque--elemento" />
      ))}
      <Letra x={dx} y={dy} texto={id} />
    </g>
  );
}

interface PropsPieza {
  nivel: Nivel;
  pieza: Pieza;
  acoplados: Acople[];
  estado: EstadoVisualPieza;
  dx?: number;
  dy?: number;
  /** Muestra los anclajes libres con su número (en el panel, no en la matriz). */
  anclajesLibres?: boolean;
}

/** Pieza: núcleo, anclajes libres (punteados) y elementos acoplados. */
export function FiguraPieza({ nivel, pieza, acoplados, estado, dx = 0, dy = 0, anclajesLibres = false }: PropsPieza) {
  const ocupados = new Set(acoplados.map((a) => a.anclaje));
  const libres = anclajesLibres ? pieza.anclajes.filter((a) => !ocupados.has(a.orden)) : [];
  return (
    <g className={`pieza pieza--${estado}`}>
      {pieza.nucleo.map(([x, y]) => (
        <Bloque key={`n${x},${y}`} x={dx + x} y={dy + y} clase="bloque--nucleo" />
      ))}
      {libres.map((a) => (
        <g key={`a${a.orden}`}>
          <Bloque x={dx + a.x} y={dy + a.y} clase="bloque--anclaje" />
          <Letra x={dx + a.x} y={dy + a.y} texto={String(a.orden)} clase="bloque__letra--anclaje" />
        </g>
      ))}
      {acoplados.map(({ anclaje, elemento }) => {
        const a = pieza.anclajes.find((d) => d.orden === anclaje);
        return a ? <FiguraElemento key={elemento} nivel={nivel} id={elemento} dx={dx + a.x} dy={dy + a.y} /> : null;
      })}
    </g>
  );
}

/** Celdas que ocupa una pieza en el panel: núcleo, anclajes y elementos. */
export function celdasVisibles(nivel: Nivel, pieza: Pieza, acoplados: Acople[]): Celda[] {
  const celdas: Celda[] = [...pieza.nucleo, ...pieza.anclajes.map((a): Celda => [a.x, a.y])];
  for (const { anclaje, elemento } of acoplados) {
    const a = pieza.anclajes.find((d) => d.orden === anclaje);
    nivel.elementos[elemento]?.forma.forEach(([x, y]) => a && celdas.push([a.x + x, a.y + y]));
  }
  return celdas;
}

export interface Caja {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Rectángulo mínimo que contiene las celdas. */
export function cajaDe(celdas: Celda[]): Caja {
  if (celdas.length === 0) return { x: 0, y: 0, ancho: 1, alto: 1 };
  const xs = celdas.map(([x]) => x);
  const ys = celdas.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, ancho: Math.max(...xs) - x + 1, alto: Math.max(...ys) - y + 1 };
}

interface PropsLienzo {
  caja: Caja;
  /** Clase que fija el tamaño de celda en CSS (p. ej. `lienzo--pieza`). */
  clase: string;
  etiqueta: string;
  children: ReactNode;
}

/** SVG cuyo tamaño en pantalla es (celdas × --tam-celda de su clase). */
export function Lienzo({ caja, clase, etiqueta, children }: PropsLienzo) {
  const estilo = { ['--celdas-x' as string]: caja.ancho, ['--celdas-y' as string]: caja.alto } as CSSProperties;
  return (
    <svg
      className={`lienzo ${clase}`}
      style={estilo}
      viewBox={`${caja.x} ${caja.y} ${caja.ancho} ${caja.alto}`}
      role="img"
      aria-label={etiqueta}
    >
      {children}
    </svg>
  );
}
