# Progreso de Stack-Craft

## Fases

- [x] Fase 0: proyecto base
- [ ] Fase 1: tipos y carga de niveles
- [ ] Fase 2: analizador
- [ ] Fase 3: simulador
- [ ] Fase 4: validador y verificador de niveles
- [ ] Fase 5: reducer de partida
- [ ] Fase 6: interfaz estática
- [ ] Fase 7: panel de código y ejecución
- [ ] Fase 8: colocación, pistas, resultados y guardado
- [ ] Fase 9: cierre del MVP

## Decisiones

### Fase 0 (2026-11-04)

- Se agregaron `@types/react` y `@types/react-dom` (devDependencies) con
  aprobación del usuario; React 19 no trae tipos propios.
- `npm run build` = `tsc --noEmit && vite build`. Un plugin local en
  `vite.config.ts` renombra la salida a `dist/stack-craft.html`.
- Fuentes: solo subconjunto latin (Inter 400/600, JetBrains Mono 400) para
  reducir el HTML (~430 kB).
- Paleta de elementos: Okabe-Ito + gris (`--color-elemento-1..8`).
- Vitest solo incluye `src/motor/**/*.test.ts`.
- La carpeta `Docs/` se renombró a `docs/` para coincidir con CLAUDE.md.
