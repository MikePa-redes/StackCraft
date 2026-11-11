import { useEffect, useState } from 'react';

const MS_POR_LETRA = 40;
const MS_PAUSA = 160;
const LETRAS_POR_GESTO = 2;

/**
 * Revela el texto letra a letra y marca cuándo la boca debe estar abierta,
 * alternando cada pocas letras y cerrándola en espacios y signos.
 */
export function useTextoHablado(texto: string) {
  const reducido =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [revelado, setRevelado] = useState(reducido ? texto.length : 0);

  useEffect(() => {
    if (reducido) {
      setRevelado(texto.length);
      return;
    }
    setRevelado(0);
    let n = 0;
    let id: ReturnType<typeof setTimeout>;
    const paso = () => {
      n++;
      setRevelado(n);
      if (n >= texto.length) return;
      id = setTimeout(paso, /[.,;:!?]/.test(texto.charAt(n - 1)) ? MS_PAUSA : MS_POR_LETRA);
    };
    id = setTimeout(paso, MS_POR_LETRA);
    return () => clearTimeout(id);
  }, [texto, reducido]);

  const hablando = revelado < texto.length;
  const ultima = texto[revelado - 1] ?? ' ';
  const bocaAbierta = hablando && /[\p{L}\p{N}]/u.test(ultima) && Math.floor(revelado / LETRAS_POR_GESTO) % 2 === 0;
  return { visible: texto.slice(0, revelado), bocaAbierta };
}
