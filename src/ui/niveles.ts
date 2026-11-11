// Carga de todos los niveles de src/niveles, ordenados por id.

import { cargarNivel } from '../motor/cargador';
import type { Nivel } from '../motor/tipos';

const archivos = import.meta.glob<{ default: unknown }>('../niveles/*.json', { eager: true });

export const NIVELES: Nivel[] = Object.entries(archivos)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, modulo]) => cargarNivel(modulo.default));
