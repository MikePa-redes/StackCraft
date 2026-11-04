import { describe, expect, it } from 'vitest';
import nivel from '../niveles/N05.json';

// Prueba mínima de la Fase 0: el nivel de ejemplo se carga.
describe('proyecto base', () => {
  it('carga el nivel de ejemplo N05', () => {
    expect(nivel.id).toBe('N05');
  });
});
