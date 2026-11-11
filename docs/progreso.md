# Progreso de Stack-Craft

## Fases

- [x] Fase 0: proyecto base
- [x] Fase 1: tipos y carga de niveles
- [x] Fase 2: analizador
- [x] Fase 3: simulador
- [x] Fase 4: validador y verificador de niveles
- [x] Fase 5: reducer de partida
- [x] Fase 6: interfaz estática
- [x] Fase 7: panel de código y ejecución
- [x] Fase 8: colocación, pistas, resultados y guardado
- [x] Fase 9: cierre del MVP

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

### Fase 5 (2026-11-04)

- `partida.ts`: `crearPartida(nivel)` y `reducirPartida(partida, accion)`.
  `Partida` guarda `nivel`, `juego` (EstadoPartida), `seleccionada`,
  `anterior` (un solo estado para Deshacer), `ultimaEjecucion`,
  `ultimaColocacion`, `pistasVistas`, `pistaMostrada`, `tiempoMs`, `pausado`
  y `completado`. Selectores: `estrellas`, `puedeEditar`, `puedeDeshacer`,
  `siguientePista`.
- Acciones: seleccionar, ejecutar `{ codigo }` (texto ya rellenado; el panel
  de la Fase 7 sustituye los huecos), deshacer, colocar `{ pieza, x, y }`,
  verPista `{ id? }`, cerrarPista, pausar, reanudar, reiniciar,
  tick `{ ms }` (delta; el reducer no lee el reloj).
- Al iniciar se selecciona la pieza activa. Se puede seleccionar cualquier
  pieza; ejecutar solo actúa si la seleccionada es la activa (las piezas en
  espera, fijas o colocadas no cargan plantilla). Tras dejar fija una pieza
  la selección no salta sola a la siguiente.
- Deshacer: `anterior` se fija con cada ejecución sin errores; una ejecución
  con error no lo toca. Se borra al deshacer (solo una vez), al colocar una
  pieza y al reiniciar.
- Pistas: sin `id` muestra la siguiente no vista en el orden de
  `nivel.pistas` (la confirmación la pide la UI); con `id` vuelve a mostrar
  una ya vista sin costo. `estrellas = max(0, 3 - pistasVistas)`.
- Al completar la matriz: el cronómetro se detiene y se ignoran ejecutar,
  colocar, deshacer y verPista (las estrellas quedan fijas).
- Pausa solo detiene el cronómetro; no bloquea las demás acciones (la UI
  tapa el tablero con el menú). Reiniciar = `crearPartida(nivel)`.

### Fase 6 (2026-11-04)

- `App.tsx` carga N05 con `cargarNivel` y crea la partida con
  `useReducer(reducirPartida, nivel, crearPartida)`; aún no despacha nada.
- Distribución en grid: barra arriba; columna izquierda con piezas y
  bandeja; matriz al centro; estructuras a la derecha; código abajo y
  avatar a su derecha (mecánicas §3).
- `componentes/Figuras.tsx`: primitivas SVG en unidades de celda
  (`Bloque`, `FiguraElemento`, `FiguraPieza`, `Lienzo`, `cajaDe`). El
  tamaño en pantalla sale de `--tam-celda-matriz|pieza|elemento`.
- El color del elemento viene del JSON del nivel y se pasa como variable
  CSS `--relleno`; el borde se deriva con `color-mix` hacia
  `--color-oscurecer` (`--mezcla-borde`). La letra va en la celda de origen.
- Núcleo gris (`--color-nucleo`, aclarado a `#9a9dab` para no confundirse
  con elementos oscuros); verde de éxito si la pieza está fija o colocada.
  En el panel, los anclajes libres se ven punteados con su número; en la
  matriz no.
- Matriz: celdas `vacia` como silueta punteada; las de referencia en
  `--color-referencia`, sin letra; `fuera` no se dibuja.
- Pila y cola se muestran solo si el nivel usa sus operaciones (N05 solo
  tiene pila). Pila: `column-reverse`, fondo abajo. Cola: frente a la
  izquierda.
- Panel de código: resaltado con `tokenizar` del motor; huecos `lista`
  como `<select>` y `texto` como `<input>`, deshabilitados. Si la pieza
  seleccionada no es trabajable se muestra un aviso en lugar de plantilla.
- Avatar: rectángulo punteado "Avatar" + globo con el texto de
  `nivel.dialogos.inicio` desde `dialogos.es.json` (se agregaron
  `intro_N05` y `exito_generico`).
- Estilos: `tokens.css` (variables nuevas de color, medidas y trazos),
  `juego.css` (distribución, paneles, SVG) y `codigo.css` (código y avatar).

### Fase 7 (2026-11-04)

- `motor/reproduccion.ts` (con pruebas): `aplicarEvento`,
  `estadosIntermedios` (estados para animar; no recalculan fija, inv. 6),
  `rellenarPlantilla` y `huecosCompletos`. El reducer no cambió.
- `ui/useEjecucion.ts`: valores de huecos por pieza (se conservan al
  cambiar de pieza y al deshacer), despacha `ejecutar` con la plantilla
  rellenada y reproduce `ultimaEjecucion` sobre el estado previo. Mientras
  dura la animación la UI dibuja el estado intermedio (`juegoVisible`) y
  bloquea huecos, selección de piezas y Deshacer.
- Ejecutar: un evento cada 450 ms. Paso a paso (decidido con el usuario):
  analiza y simula todo al pulsarlo; cada clic en "Siguiente paso" muestra
  una operación; Ejecutar durante el paso a paso termina el resto solo. Una
  ejecución sin errores se cierra sola al llegar al final.
- Error: tras la última operación válida, el siguiente paso resalta en rojo
  la línea que falla, el avatar lo explica y se vuelve al estado previo.
  Los errores del analizador se muestran de inmediato (todas sus líneas en
  rojo; el avatar explica el primero). El resaltado se borra al editar un
  hueco o cambiar de pieza.
- Ejecutar y Paso a paso exigen todos los huecos con valor.
- Animación (`componentes/Volador.tsx`, FLIP): una copia del elemento viaja
  del rectángulo de origen al de destino con `transform` y transición CSS
  de `--transicion-movimiento` (200 ms); el elemento real se oculta
  (`.en-vuelo`) mientras tanto. Los elementos llevan `data-elemento`; se
  buscan fuera de la matriz.
- Avatar: `ui/textoAvatar.ts` arma el texto con claves de
  `dialogos.es.json`: `error_<CODIGO>`, `error_linea`, `error_restaurado`
  (más el detalle del motor), `ejecucion_ok`, `pieza_fija`; si no, el
  `inicio` del nivel.
- Las tarjetas del panel de piezas ahora seleccionan la pieza (clic o
  Enter).
- Pendiente para más adelante: en paso a paso no se marca la línea
  siguiente antes del primer clic.

### Fase 8 (2026-11-05)

- Motor: `Partida.estadisticas` (operaciones de ejecuciones correctas,
  ejecuciones, fallidas, errores por código, colocaciones rechazadas) y el
  selector `motivoColocacion` (vista previa del arrastre). Nuevo
  `resultados.ts` (con pruebas en `estadisticas.test.ts`): `resumirPartida`,
  `esMejor` (más estrellas; a igualdad, menor tiempo), `actualizarMejores`,
  `agregarRegistro` y `esTablaMejores`.
- Arrastre (`useArrastre.ts`, `PiezaArrastrada.tsx`): eventos de puntero
  sobre las tarjetas de piezas fijas; umbral de 4 px para distinguir clic de
  arrastre. Vista previa en la matriz ajustada a celdas (verde válida, roja
  no). Rechazo: la copia vuelve al panel con transición y el avatar da el
  motivo (`colocacion_*`). Soltar fuera de la matriz solo cancela.
- Pistas: el botón de la barra abre `DialogoPistas` (confirmación con las
  estrellas antes/después; releer una vista es gratis). La pista se muestra
  en el avatar con botón Cerrar.
- Cronómetro (`useCronometro.ts`): `tick` cada 250 ms; pausa con
  `visibilitychange`/`blur` y reanuda solo si la pausa fue por foco.
- Resultados (`Resultados.tsx`): estrellas, tiempo, pistas, operaciones,
  fallidas y récord. "Repetir nivel" remonta el juego (`key`), sin residuos.
  "Continuar" solo cierra la capa hasta que exista el menú (Fase 9).
- Guardado (`guardado.ts`): `stack-craft:mejores` y `stack-craft:registro`
  (máx. 200 entradas), todo con try/catch; se guarda una vez al completar.
- Bug corregido: el efecto de reproducción de `useEjecucion` no tenía
  dependencias y los ticks del cronómetro reiniciaban su temporizador,
  congelando la ejecución. Ahora depende solo de `rep`.
- Verificado en navegador (1280×720): pistas, arrastre válido/inválido,
  resultados, guardado, reinicio y pausa por blur. Sin prueba automática de UI
  (Vitest solo cubre el motor).

### Fase 9 (2026-11-05)

- `ui/niveles.ts` carga todos los `src/niveles/*.json` (orden por id).
  `SeleccionNiveles.tsx` + `menu.css`: pantalla inicial con una tarjeta por
  nivel (etapa, id, título, mejores estrellas y tiempo desde `guardado`).
- `App` alterna entre selección y juego (`key` = nivel + intento). El botón
  "Configuración" (deshabilitado) de la barra pasó a ser "Menú", que vuelve a
  la selección; no hay pausa por menú porque el nivel se descarta al salir
  (el progreso del nivel en curso no se guarda).
- Resultados: "Continuar" se reemplazó por "Ver tablero" (cierra la capa) y
  "Volver al menú".
- No se definió bloqueo de niveles: todos están disponibles (mecánicas no
  lo pide).
- `npm run verificar`: 1 nivel (N05), OK. `npm test`: 119 pruebas OK.
  `npm run build`: OK (`dist/stack-craft.html`, ~497 kB).
- `docs/prueba-manual.md`: lista de verificación manual. Aún no ejecutada
  entera a mano; solo se comprobó que la tarjeta abre el nivel y que el menú
  se muestra.
- Pendiente: solo existe el nivel N05; faltan los demás niveles del diseño
  y la comprobación de solución única (§10).

### Estilo retro oscuro (2026-11-05)

- Tema oscuro con acentos azules, todo desde `tokens.css`: fondo azul-negro,
  superficies azul noche, `--color-acento` (#3d8bff) y `--color-acento-claro`
  (#6cc6ff). Nuevas variables: `--color-sobre-acento`, `--color-brillo`,
  `--fuente-retro`, `--sombra-acento`, `--sombra-pulsada`.
- Retro: radio 0, bordes de 2–3 px, sombras duras sin desenfoque, botones
  que se hunden al pulsar, transiciones en pasos (`steps(6)`), textos en
  JetBrains Mono y scanlines con `body::after` (sin dependencias nuevas).
- Se mantiene la paleta Okabe-Ito de los elementos. Las piezas de
  referencia pasaron a azul grisáceo oscuro.
- Verificado en navegador (menú y juego); `npm run build` OK. Sin revisar
  aún diálogos de pistas/resultados ni el arrastre con el nuevo tema.

### Niveles (plan de 10)

- Etapa 1 (Stack: entrada): N01 "Entra uno, sale el último" — solo `push`
  (una pieza, dos elementos); `npm run verificar`: OK. N02 "El último en entrar" — solo `push` (el
  resto en la plantilla); `npm run verificar`: OK.
- Etapa 2 (Stack: salida y desarmado): N03 "Desarmar con cuidado" — `desarmar`
  (una pieza mal armada, un desarmado LIFO; `devolver` explicado y permitido,
  no exigido porque bandeja/pila/cola deben terminar vacías); verificador: OK.
  N04 "Desarmar para armar" — antes N05 (renombrado: id, clave `intro_N04`,
  se añadió `devolver` a `operaciones`); dos piezas, la pieza en espera se
  desarma desde el código de la pieza en turno; verificador: OK.
- Etapa 3 (Queue): N05 "El primero en entrar" — `enqueue`/`dequeue` (una
  pieza, tres elementos, solo cola, FIFO; matriz con celdas `fuera`);
  verificador: OK. N06 "Desarmar en cola" — `cola.enqueue(desarmar(PIEZA_02))`
  (dos piezas; el desarmado FIFO saca C y deja A, con LIFO saldría A);
  verificador: OK.
- Etapa 4 (Transferencias): N07 "Pasar de pila a cola" — `cola.enqueue(pila.pop())`
  (una pieza, tres elementos, huecos mixtos; verificador: OK). N08 "Tres piezas,
  un relevo" — dos transferencias `pila.push(cola.dequeue())` (tres piezas en
  orden, en espera desarmadas desde otra, bandeja vacía; verificador: OK).
- Etapa 5 (Integración): N09 "Planear el desarmado" — plantilla mínima
  (huecos de texto libre); matriz 7x6 irregular con celdas fuera/fija y 3
  piezas de referencia, 4 piezas, LIFO; verificador: OK. N10 "Stack-Craft" —
  nivel final, plantilla vacía (solo comentarios y líneas libres), matriz 8x5,
  4 piezas, FIFO; usa push, pop, enqueue, dequeue, armar, desarmar, devolver y
  ambas transferencias; verificador: OK.
- Plan de 10 niveles completo: N01 Entra uno, sale el último · N02 El último en
  entrar · N03 Desarmar con cuidado · N04 Desarmar para armar · N05 El primero
  en entrar · N06 Desarmar en cola · N07 Pasar de pila a cola · N08 Tres piezas,
  un relevo · N09 Planear el desarmado · N10 Stack-Craft.
- `npm run verificar`: 10 niveles, 0 con problemas. Solución única (§10) aún
  sin comprobar automáticamente.
