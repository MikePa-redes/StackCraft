// Elige el texto del avatar (claves de dialogos.es.json) según lo último
// que pasó en el panel de código.

import type { Partida } from '../motor/partida';
import dialogos from '../textos/dialogos.es.json';
import type { AvisoColocacion } from './useArrastre';
import type { Comentario } from './useEjecucion';

const TEXTOS: Record<string, string> = dialogos;

const texto = (clave: string | undefined): string => (clave && TEXTOS[clave]) || '';

/** Felicitación al completar el nivel. */
export function textoExito(partida: Partida): string {
  return texto(partida.nivel.dialogos['exito']) || texto('exito_generico');
}

/**
 * Prioridad: pista abierta, nivel completado, aviso de colocación y, por
 * último, lo que pasó en el panel de código.
 */
export function textoAvatar(partida: Partida, comentario: Comentario, aviso: AvisoColocacion): string {
  const pista = partida.nivel.pistas.find((p) => p.id === partida.pistaMostrada);
  if (pista) return `${texto('pista')} ${pista.texto}`;
  if (partida.completado) return textoExito(partida);
  if (aviso) return texto(aviso.tipo === 'ok' ? 'colocacion_ok' : `colocacion_${aviso.motivo}`);
  switch (comentario.tipo) {
    case 'error': {
      const e = comentario.errores[0];
      if (!e) return '';
      const linea = texto('error_linea').replace('{linea}', String(e.linea));
      return `${linea} ${texto(`error_${e.codigo}`)} (${e.mensaje}). ${texto('error_restaurado')}`;
    }
    case 'ok':
      return texto(comentario.fijas ? 'pieza_fija' : 'ejecucion_ok');
    case 'nada':
      return texto(partida.nivel.dialogos['inicio']);
  }
}
