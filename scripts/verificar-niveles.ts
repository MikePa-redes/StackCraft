// Ejecuta la solución de cada nivel de src/niveles y reporta problemas.
// Uso: npm run verificar (lo lanza scripts/ejecutar.mjs con Vite).

import { cargarNivel } from '../src/motor/cargador';
import { verificarNivel } from '../src/motor/verificador';

const archivos = import.meta.glob<{ default: unknown }>('../src/niveles/*.json', { eager: true });

/** Verifica todos los niveles; devuelve el código de salida. */
export function main(): number {
  let fallos = 0;
  for (const [ruta, modulo] of Object.entries(archivos).sort(([a], [b]) => a.localeCompare(b))) {
    const nombre = ruta.split('/').pop() ?? ruta;
    let errores: string[];
    try {
      errores = verificarNivel(cargarNivel(modulo.default));
    } catch (err) {
      errores = [err instanceof Error ? err.message : String(err)];
    }
    if (errores.length === 0) {
      console.log(`OK    ${nombre}`);
    } else {
      fallos++;
      console.log(`FALLA ${nombre}`);
      errores.forEach((e) => console.log(`      - ${e}`));
    }
  }
  console.log(`\n${Object.keys(archivos).length} niveles, ${fallos} con problemas.`);
  return fallos > 0 ? 1 : 0;
}
