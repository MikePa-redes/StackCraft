# Stack-Craft — contexto del proyecto

Nombre del juego: **Stack-Craft** (en código, paquete y archivos:
`stack-craft`). Úsalo en el título de la ventana, la pantalla inicial y el
HTML final (`stack-craft.html`).

Videojuego educativo tipo puzzle geométrico que enseña Stack (LIFO) y Queue
(FIFO). El jugador desarma y arma piezas moviendo elementos con un mini-Python
y coloca las piezas terminadas en una matriz.

## Fuente de verdad

- `docs/mecanicas.md` define TODAS las reglas de juego. Si algo de este archivo
  contradice a `docs/mecanicas.md`, manda `docs/mecanicas.md`.
- No leas `docs/mecanicas.md` completo en cada tarea. Busca la sección que
  necesitas (por ejemplo, con grep `## 7.`) y lee solo esa.
- `docs/progreso.md` registra qué fases están hechas y decisiones tomadas
  durante el desarrollo. Léelo al iniciar cada sesión y actualízalo al terminar
  cada fase.
- Si una regla no está definida en ninguno de los dos, pregunta antes de
  inventarla.

## Plataforma y stack (cerrado)

- Solo navegador de escritorio, mínimo 1280 × 720. Sin servidor, cuentas ni
  LMS. Progreso en localStorage.
- TypeScript estricto + Vite + React (`useReducer`, sin librería de estado).
- Matriz, piezas, pila y cola en SVG. Animaciones con transiciones CSS.
- Panel de código propio (sin CodeMirror ni Monaco): líneas monoespaciadas con
  `<select>` o `<input>` en los huecos y un tokenizador simple para resaltado.
- Arrastre con eventos de puntero nativos (solo ratón).
- Estilos: `src/ui/estilos/tokens.css` (variables) + un CSS por componente
  grande como máximo. Sin Tailwind.
- Pruebas: Vitest, solo para `src/motor/`.
- Salida: un único HTML con `vite-plugin-singlefile`.
- Dependencias permitidas: react, react-dom, @fontsource/inter,
  @fontsource/jetbrains-mono, vite, @vitejs/plugin-react, typescript, vitest,
  vite-plugin-singlefile, @types/react, @types/react-dom. **No agregues ninguna otra sin preguntar.**

## Estructura

```
docs/mecanicas.md        reglas de juego (no modificar sin pedirlo)
docs/progreso.md         estado del desarrollo
src/motor/               lógica pura: sin React, sin DOM, sin localStorage
  tipos.ts               modelo de datos
  analizador.ts          código del jugador → instrucciones o errores
  simulador.ts           instrucciones + estado → eventos + nuevo estado
  validador.ts           pieza fija, colocación, nivel completo
  partida.ts             reducer: orden de piezas, deshacer, pistas, tiempo
  *.test.ts              pruebas junto a cada módulo
src/niveles/*.json       un archivo por nivel
src/textos/dialogos.es.json  textos del avatar por clave
src/ui/                  componentes React y estilos
scripts/verificar-niveles.ts  ejecuta la solución de cada nivel
```

## Modelo de datos (contrato mínimo)

```ts
type Celda = [x: number, y: number];          // x = columna, y = fila
interface Elemento { color: string; forma: Celda[] }
interface Anclaje { orden: number; x: number; y: number }
interface Pieza {
  id: string; nucleo: Celda[]; anclajes: Anclaje[];
  iniciales: Record<number, string>;   // orden de anclaje → id de elemento
  objetivo: Record<number, string>;    // se compara por FORMA, no por id
  posicionObjetivo: { x: number; y: number };
  plantilla: string[];                 // huecos como {{h1}}
  huecos: Record<string, { tipo: 'lista' | 'texto'; opciones?: string[] }>;
  solucion: Record<string, string>;
}
interface Nivel {
  id: string; etapa: string; titulo: string;
  operaciones: string[]; desarmado: 'lifo' | 'fifo';
  ordenPiezas: string[]; elementos: Record<string, Elemento>;
  matriz: { ancho: number; alto: number;
            celdas: ('fuera' | 'vacia' | 'fija')[][];
            piezasReferencia: { id: string; celdas: Celda[] }[] };
  bandeja: string[]; piezas: Pieza[];
  pistas: { id: string; pieza?: string; texto: string }[];
  dialogos: Record<string, string>;
}
```

Ejemplo completo y válido: `src/niveles/N05.json`.

## Invariantes del motor (deben tener prueba)

1. Ningún elemento se duplica ni se pierde en todo el nivel.
2. Núcleos, piezas fijas, colocadas y de referencia nunca se desarman.
3. `armar` usa el anclaje libre de menor número de la pieza seleccionada.
4. Desarmado LIFO o FIFO según `nivel.desarmado`; los elementos iniciales
   cuentan como acoplados en el orden de sus anclajes.
5. Un elemento desarmado o de la bandeja solo puede ir a pila o cola.
6. El estado de las piezas (fija o no) se evalúa al TERMINAR la ejecución.
7. Una ejecución con error no deja ningún cambio.
8. Solo se trabaja la primera pieza no fija de `ordenPiezas`.
9. Elementos y piezas de igual forma son intercambiables.
10. El motor es determinista: mismo estado + mismo código = mismo resultado.

El motor nunca ejecuta Python real ni usa `eval`.

## Convenciones

- Código, nombres de dominio, comentarios y mensajes en español
  (`pila`, `cola`, `armar`, `desarmar`, `pieza`). Términos técnicos genéricos
  de programación pueden ir en inglés.
- Estado inmutable: las funciones del motor devuelven objetos nuevos.
- Archivos de 150 a 250 líneas como máximo; si crece, divide.
- Componentes React sin lógica de juego: solo leen estado y despachan acciones.
- Colores y medidas siempre desde variables de `tokens.css`.

## Forma de trabajo (ahorro de tokens)

- Haz solo la fase o tarea que se pide; no adelantes fases.
- Lee solo los archivos que necesitas; usa grep antes de abrir archivos
  grandes. No vuelvas a leer un archivo que acabas de escribir.
- Para cambios pequeños, edita; no reescribas archivos completos.
- Ejecuta pruebas con `npx vitest run` (nunca en modo watch). No dejes el
  servidor de desarrollo corriendo.
- Respuestas breves: al terminar, di qué archivos tocaste, qué pruebas pasan y
  qué queda pendiente. No pegues el código en la respuesta.
- Si una prueba falla dos veces por la misma causa, detente y explica.
- Antes de un cambio que afecte más de 3 archivos, describe el plan en
  5 líneas y espera confirmación.
