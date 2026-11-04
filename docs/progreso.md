# Progreso de Stack-Craft

## Fases

- [x] Fase 0: proyecto base
- [x] Fase 1: tipos y carga de niveles
- [x] Fase 2: analizador
- [x] Fase 3: simulador
- [x] Fase 4: validador y verificador de niveles
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
  - Que la pieza de `desarmar(X)` exista se comprueba en el simulador
    (SINTAXIS si no existe; ver Fase 3).

### Fase 3 (2026-11-04)

- `simulador.ts`: `simular(nivel, estado, instrucciones)` trabaja sobre una
  copia y devuelve `{ ok, eventos, estadoNuevo }` o
  `{ ok: false, error, linea, eventosHastaError }`. Cada instrucción produce
  un `Evento { linea, elemento, desde, hacia }` para animar.
- `estados.ts`: `recalcularEstados` (usado por cargador y simulador) y
  `piezaActiva`. El simulador lo aplica solo al terminar sin errores; durante
  la ejecución, "fija" se evalúa con el estado previo.
- `armar` va a la pieza activa (primera `incompleta` de `ordenPiezas`); si no
  hay ninguna, PIEZA_COMPLETA.
- Una pieza `en_espera` sí se puede desarmar (mecánicas §5).
- `desarmar(X)` con una pieza inexistente (incluidas las de referencia) →
  SINTAXIS (decidido con el usuario; no se agrega código nuevo).
- Elemento de la bandeja inexistente o no presente → ELEMENTO_NO_DISPONIBLE.
- LIMITE_OPERACIONES: se cuentan instrucciones (una por línea ejecutada),
  máximo 200; la instrucción 201 falla.
- Pruebas de invariantes: recorrido aleatorio con semilla fija (1000
  ejecuciones por nivel) que vuelve al estado inicial cuando todas las piezas
  quedan fijas; comprueba 1, 2, 5, 7 y 10. Pruebas puntuales para 2, 3, 4,
  7 y 10. `ayudasPrueba.ts` tiene utilidades solo para pruebas.
- No existe `AGENTS.md`: los invariantes están en CLAUDE.md.

### Fase 4 (2026-11-04)

- `validador.ts`: `formaPieza`, `formaObjetivo` (celdas relativas: núcleo +
  elementos en sus anclajes), `esFija` (forma por anclaje, vía
  `coincideObjetivo`; compara formas, no ids), `celdasOcupadas`,
  `colocarPieza` y `nivelCompleto`. `recalcularEstados` usa `esFija`.
- Colocación: el origen de la pieza va en (x, y); se acepta si (x, y) es la
  `posicionObjetivo` de alguna pieza con la misma forma final, todas sus
  celdas son `vacia` y ninguna está ocupada por referencias o colocadas.
  Motivos de rechazo: PIEZA_INEXISTENTE, NO_FIJA, HUECO_INVALIDO, OCUPADO
  (para la UI de la Fase 8; no son códigos de error del código).
- Nivel completo: toda celda que no sea `fuera` está ocupada.
- `verificador.ts` (puro, en el motor para poder probarlo): rellena cada
  plantilla con su solución, la ejecuta en el orden de `ordenPiezas`
  (salta piezas que ya empiezan fijas), exige que cada pieza quede fija,
  bandeja/pila/cola vacías, cobertura exacta de la matriz sin solapes
  (celdas `fija` = celdas de referencia) y coloca cada pieza en su
  `posicionObjetivo` hasta completar el nivel.
- La unicidad de la solución (§10) no se comprueba todavía.
- `npm run verificar` → `scripts/ejecutar.mjs`, que carga
  `scripts/verificar-niveles.ts` con `runnerImport` de Vite (TS, JSON e
  `import.meta.glob` sin dependencias nuevas). Sale con código 1 si algún
  nivel falla.
