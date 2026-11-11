/**
 * Pixel art del lobo gris (16 × 16). Cada carácter es un píxel:
 * o contorno · g gris · l gris claro · d gris oscuro · y ojo · n pupila/nariz
 * m interior de la boca · t lengua · . vacío.
 */
const CABEZA = [
  '..oo........oo..',
  '.ogdo......odgo.',
  '.ogddooooooddgo.',
  '.oggggggggggggo.',
  'ogggddggggddgggo',
  'ogggynggggnygggo',
  'oglllgggggglllgo',
  'oglllllnnlllllgo',
  '.ollllllllllllo.',
];

const BOCA_CERRADA = [
  '..olloooooollo..',
  '...ollllllllo...',
  '....oooooooo....',
  '.oggggggggggggo.',
];

const BOCA_ABIERTA = [
  '..olommmmmmolo..',
  '...ommmttmmmo...',
  '...ollllllllo...',
  '....oooooooo....',
];

const CUELLO = ['oggggggggggggggo', 'oggggggggggggggo', 'oooooooooooooooo'];

export const LOBO_TAMANO = 16;

export interface Rect {
  x: number;
  y: number;
  ancho: number;
  clase: string;
}

/** Une píxeles contiguos del mismo color en una fila para usar menos nodos SVG. */
function aRects(filas: string[]): Rect[] {
  const rects: Rect[] = [];
  filas.forEach((fila, y) => {
    let x = 0;
    while (x < fila.length) {
      const c = fila.charAt(x);
      let fin = x;
      while (fin + 1 < fila.length && fila[fin + 1] === c) fin++;
      if (c !== '.') rects.push({ x, y, ancho: fin - x + 1, clase: c });
      x = fin + 1;
    }
  });
  return rects;
}

export const LOBO_CERRADO = aRects([...CABEZA, ...BOCA_CERRADA, ...CUELLO]);
export const LOBO_ABIERTO = aRects([...CABEZA, ...BOCA_ABIERTA, ...CUELLO]);
