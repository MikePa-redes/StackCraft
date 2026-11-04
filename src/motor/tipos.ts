// Modelo de datos de Stack-Craft: niveles (JSON) y estado de partida.

/** Coordenada relativa o absoluta: x = columna, y = fila. */
export type Celda = [x: number, y: number];

export interface Elemento {
  color: string;
  forma: Celda[];
}

export interface Anclaje {
  orden: number;
  x: number;
  y: number;
}

export type TipoHueco = 'lista' | 'texto';

export interface Hueco {
  tipo: TipoHueco;
  opciones?: string[];
}

export interface Pieza {
  id: string;
  nucleo: Celda[];
  anclajes: Anclaje[];
  /** Orden de anclaje → id de elemento acoplado al iniciar. */
  iniciales: Record<number, string>;
  /** Orden de anclaje → id de elemento esperado (se compara por FORMA). */
  objetivo: Record<number, string>;
  posicionObjetivo: { x: number; y: number };
  /** Líneas de código con huecos como {{h1}}. */
  plantilla: string[];
  huecos: Record<string, Hueco>;
  solucion: Record<string, string>;
}

export type TipoCeldaMatriz = 'fuera' | 'vacia' | 'fija';

export interface PiezaReferencia {
  id: string;
  celdas: Celda[];
}

export interface Matriz {
  ancho: number;
  alto: number;
  /** celdas[fila][columna]. */
  celdas: TipoCeldaMatriz[][];
  piezasReferencia: PiezaReferencia[];
}

export type Operacion =
  | 'push'
  | 'pop'
  | 'enqueue'
  | 'dequeue'
  | 'armar'
  | 'desarmar'
  | 'devolver';

export const OPERACIONES: readonly Operacion[] = [
  'push',
  'pop',
  'enqueue',
  'dequeue',
  'armar',
  'desarmar',
  'devolver',
];

export type OrdenDesarmado = 'lifo' | 'fifo';

export interface Pista {
  id: string;
  pieza?: string;
  texto: string;
}

export interface Nivel {
  id: string;
  etapa: string;
  titulo: string;
  operaciones: Operacion[];
  desarmado: OrdenDesarmado;
  ordenPiezas: string[];
  elementos: Record<string, Elemento>;
  matriz: Matriz;
  bandeja: string[];
  piezas: Pieza[];
  pistas: Pista[];
  dialogos: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Estado de partida

/** Dónde está un elemento en un momento dado. */
export type Posicion =
  | { lugar: 'bandeja' }
  | { lugar: 'pila' }
  | { lugar: 'cola' }
  | { lugar: 'pieza'; pieza: string; anclaje: number };

export type EstadoVisualPieza = 'en_espera' | 'incompleta' | 'fija' | 'colocada';

/** Un elemento acoplado a un anclaje concreto de una pieza. */
export interface Acople {
  anclaje: number;
  elemento: string;
}

export interface EstadoPieza {
  estado: EstadoVisualPieza;
  /**
   * Elementos acoplados en el orden en que se acoplaron (el primero es el
   * más antiguo). Define qué sale al desarmar en LIFO o FIFO.
   */
  acoplados: Acople[];
  /** Posición en la matriz; solo cuando estado === 'colocada'. */
  colocadaEn?: { x: number; y: number };
}

export interface EstadoPartida {
  /** Elementos sueltos, en orden de presentación. */
  bandeja: string[];
  /** Pila: índice 0 = fondo, último = cima. */
  pila: string[];
  /** Cola: índice 0 = frente, último = final. */
  cola: string[];
  /** Estado de cada pieza por id. */
  piezas: Record<string, EstadoPieza>;
}

// ---------------------------------------------------------------------------
// Código del jugador

/** De dónde sale el elemento que mueve una instrucción. */
export type Fuente =
  | { tipo: 'bandeja'; elemento: string } // "A"
  | { tipo: 'desarmar'; pieza: string } // desarmar(PIEZA_02)
  | { tipo: 'pop' } // pila.pop()
  | { tipo: 'dequeue' }; // cola.dequeue()

/** A dónde va el elemento: pila.push, cola.enqueue, armar, devolver. */
export type Destino = 'pila' | 'cola' | 'pieza' | 'bandeja';

export interface Instruccion {
  /** Número de línea (1 = primera). */
  linea: number;
  destino: Destino;
  fuente: Fuente;
}

export type CodigoError =
  | 'SINTAXIS'
  | 'OPERACION_NO_PERMITIDA'
  | 'METODO_INEXISTENTE'
  | 'ELEMENTO_NO_DISPONIBLE'
  | 'ESTRUCTURA_VACIA'
  | 'EXTRACCION_SIN_DESTINO'
  | 'PIEZA_FIJA'
  | 'PIEZA_SIN_MOVIBLES'
  | 'PIEZA_COMPLETA'
  | 'NO_ENCAJA'
  | 'LIMITE_OPERACIONES';

export interface ErrorCodigo {
  linea: number;
  codigo: CodigoError;
  /** Explicación breve para el jugador. */
  mensaje: string;
}
