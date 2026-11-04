# Progreso de Stack-Craft

## Fases

- [x] Fase 0: proyecto base
- [x] Fase 1: tipos y carga de niveles
- [x] Fase 2: analizador
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

### Fase 1 (2026-11-04)

- `tipos.ts`: modelo de CLAUDE.md + estado de partida. `EstadoPartida`
  guarda `bandeja`, `pila` (0 = fondo), `cola` (0 = frente) y por pieza
  `estado` + `acoplados` en orden de acoplamiento (base de LIFO/FIFO). La
  posición de un elemento se deriva con `posicionesElementos()` en lugar de
  guardarse aparte, para evitar estados inconsistentes.
- Estados de pieza: `en_espera | incompleta | fija | colocada`.
- `cargador.ts`: `cargarNivel`, `estadoInicial`, `cargarPartida`; lanza
  `ErrorNivel` con la lista completa de errores. Primero valida estructura
  (`estructuraNivel.ts`); solo si es válida, referencias
  (`referenciasNivel.ts`).
- Reglas de referencias: `ordenPiezas` es permutación de las piezas; cada
  elemento empieza en exactamente un lugar (bandeja o `iniciales`); anclajes
  de `iniciales`/`objetivo` existen; huecos de plantilla, `huecos` y
  `solucion` coinciden y la solución de una lista está entre sus opciones.
- `formas.ts` (`formasIguales`, `coincideObjetivo`) se usa ya para el estado
  inicial: una pieza que empieza igual a su objetivo arranca `fija`. El
  validador de la Fase 4 debe reutilizarlo.
- Operaciones válidas: push, pop, enqueue, dequeue, armar, desarmar,
  devolver (sección 8 de mecánicas).

### Fase 2 (2026-11-04)

- `lexico.ts`: `tokenizar(linea)` (nombre, texto, punto, paréntesis, coma,
  comentario con columna). Se reutilizará para el resaltado del panel.
- `analizador.ts`: `analizar(codigo, operacionesPermitidas)` →
  `{ ok, instrucciones }` o `{ ok: false, errores }` con un error por línea
  (`linea`, `codigo`, `mensaje`). Descenso recursivo por línea y luego
  conversión semántica a `Instruccion { linea, destino, fuente }`.
- Destinos: `pila` (push), `cola` (enqueue), `pieza` (armar), `bandeja`
  (devolver). Fuentes: `bandeja` ("A"), `desarmar`, `pop`, `dequeue`.
- Códigos que emite el analizador: SINTAXIS, METODO_INEXISTENTE,
  EXTRACCION_SIN_DESTINO, OPERACION_NO_PERMITIDA (en ese orden de
  prioridad). El resto de códigos son del simulador.
- Decisiones tomadas (no estaban en mecánicas):
  - Combinaciones fuera de la tabla son SINTAXIS: `armar("A")`,
    `armar(desarmar(X))`, `devolver("A")`, `pila.push(pila.pop())`,
    `cola.enqueue(cola.dequeue())`.
  - `desarmar(X)` suelto es EXTRACCION_SIN_DESTINO, igual que `pila.pop()`.
  - Cualquier método desconocido de pila/cola (p. ej. `pila.peek()`) es
    METODO_INEXISTENTE; una función u objeto desconocido es SINTAXIS.
  - Se aceptan comillas simples y dobles y espacios entre tokens; una línea
    con sangría es SINTAXIS (como en Python).
  - Una transferencia exige ambas operaciones (p. ej. `enqueue` y `pop`).
  - Que la pieza de `desarmar(X)` exista se comprueba en el simulador; falta
    definir qué código usar si no existe.
