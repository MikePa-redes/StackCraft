# Stack-Craft: documento de mecánicas del videojuego educativo de pilas y colas

Versión 2 — 4 de noviembre de 2026

## 1. Concepto general

Videojuego educativo tipo puzzle geométrico cuyo objetivo es enseñar las
estructuras de datos **Stack (pila)** y **Queue (cola)** mediante desafíos
de ensamblaje y programación asistida en Python.

El jugador debe completar una matriz de forma variable con piezas. Las
piezas llegan desarmadas o mal armadas: el jugador debe desarmarlas y
rearmarlas, moviendo sus elementos con operaciones de pila y cola escritas
en código, hasta que cada pieza tenga su forma correcta. Después la coloca
en la matriz, en el lugar donde encaja.

El orden en que la pila o la cola entregan los elementos determina qué
elemento llega a cada punto de anclaje de una pieza y, por lo tanto, la
forma que resulta. Así, LIFO y FIFO tienen consecuencias geométricas
visibles.

El juego combina dos desafíos:

-   **Lógico:** comprender y aplicar correctamente las operaciones de
    pilas y colas para obtener los elementos en el orden necesario.
-   **Espacial:** deducir, a partir de la silueta de la matriz, qué forma
    debe tener cada pieza y dónde va.

Cada nivel tiene una única solución en formas y posiciones, definida
previamente. Los colores no forman parte de la solución: dos soluciones
que solo difieren en el color de elementos de igual forma son la misma.

## 2. Glosario

| Término | Significado |
| --- | --- |
| Elemento | Figura de uno o más cuadros (un cuadro, un dominó, una L…) con identificador y color. Es el dato que entra y sale de la pila y la cola. |
| Pieza | Conjunto formado por un núcleo y los elementos acoplados a sus anclajes. |
| Núcleo | Sección fija de una pieza. Nunca se desarma ni se modifica. |
| Anclaje | Punto numerado de una pieza donde se acopla un elemento. |
| Bandeja | Depósito común de elementos sueltos del nivel. |
| Pieza fija | Pieza cuya forma coincide con su objetivo. Queda bloqueada y puede arrastrarse a la matriz. |
| Pieza colocada | Pieza fija ya ubicada en la matriz. |
| Pieza de referencia | Pieza que la matriz trae colocada desde el inicio. |

Los términos "fijo" y "fija" tienen dos usos que no deben confundirse: el
**núcleo** es la sección fija de una pieza, y **pieza fija** es el estado
de una pieza terminada.

## 3. Interfaz principal

La pantalla de juego contempla siete áreas:

1.  **Barra superior:** nivel actual, progreso, cronómetro, botón de
    pistas y acceso a configuración.
2.  **Panel de piezas:** muestra las piezas del nivel con su
    identificador y su estado.
3.  **Bandeja:** muestra los elementos sueltos disponibles.
4.  **Zona de estructuras:** muestra la pila (vertical) y la cola
    (horizontal) habilitadas en el nivel, con su contenido.
5.  **Matriz de ensamblaje:** tablero de forma y dimensiones variables.
6.  **Panel inferior de código:** muestra el fragmento Python incompleto
    asociado a la pieza seleccionada, con botones Ejecutar, Paso a paso y
    Deshacer última ejecución.
7.  **Avatar y diálogos:** espacio fijo para el avatar, junto al panel de
    código, con su cuadro de diálogo al lado. Va ahí porque la mayoría de
    sus mensajes (errores, pistas, explicación de operaciones) se refieren
    al código.

Reglas para los cuadros de diálogo:

-   No deben tapar la matriz, el código ni la zona de estructuras mientras
    el jugador trabaja.
-   Cuando un mensaje se refiere a algo concreto (una línea de código, una
    pieza, la pila), ese elemento se resalta en pantalla mientras el
    mensaje está visible.
-   Los mensajes de introducción de nivel pueden mostrarse en un cuadro más
    grande que se cierra para empezar a jugar.
-   El jugador puede releer el último mensaje y avanzar o cerrar los
    diálogos.

**El diseño visual y la identidad del avatar quedan pendientes; no deben
inventarse ni considerarse definitivos durante la primera
implementación.** Se reserva el espacio con un marcador neutro.

Plataforma: solo navegador web en computadora de escritorio, mínimo
1280 × 720. Se distribuye como un único archivo HTML; no hay servidor,
cuentas ni integración con LMS. El progreso se guarda localmente en el
navegador.

## 4. Matriz

-   La matriz puede tener distintas dimensiones y formas según el nivel.
-   Muestra solo la silueta de las celdas por llenar, sin indicar qué
    elemento va en cada una.
-   Trae piezas de referencia colocadas desde el inicio; son inamovibles y
    ayudan a deducir la solución.
-   Una pieza fija se acepta en cualquier hueco cuya forma objetivo sea
    igual a la suya. Si el jugador la suelta en otro lugar, regresa al
    panel con un aviso.
-   Las piezas colocadas quedan bloqueadas.
-   Las piezas no se rotan ni se reflejan.
-   El nivel se completa cuando todas las celdas de la matriz están
    ocupadas.

## 5. Elementos y piezas

### Elementos

Cada elemento tiene:

-   identificador único, por ejemplo `A`, `B` o `C`;
-   color identificador;
-   forma: lista de cuadros relativos a su origen.

Los elementos se acoplan siempre con la misma orientación. Para que el
color no confunda al jugador, **dos elementos con la misma forma son
intercambiables**: la validación compara formas, no identificadores. El
color sirve para seguir el recorrido de cada elemento.

### Piezas

Cada pieza tiene un identificador único (por ejemplo `PIEZA_01`) y está
formada por:

-   un **núcleo** fijo, que se distingue visualmente (gris como
    referencia inicial);
-   **anclajes** numerados, donde se acoplan elementos movibles;
-   los elementos que trae acoplados al iniciar el nivel, que pueden ser
    incorrectos;
-   una configuración objetivo: qué forma de elemento corresponde a cada
    anclaje;
-   una posición objetivo en la matriz. Si varias piezas tienen la misma
    forma final, cualquiera de ellas puede ocupar cualquiera de sus
    posiciones.

El jugador no ve la configuración objetivo de la pieza: la deduce a
partir de los huecos de la matriz.

### Estados visuales de una pieza

-   **En espera:** la pieza aún no se puede trabajar porque la anterior
    en el orden del nivel no está fija. Se ve, pero no se puede
    seleccionar para armarla. Sus elementos sí pueden desarmarse desde el
    código de otra pieza.
-   **Incompleta o incorrecta:** su forma todavía no coincide con el
    objetivo.
-   **Fija:** su forma coincide con el objetivo; cambia a color de éxito
    (verde como referencia inicial), queda bloqueada y puede arrastrarse
    a la matriz.
-   **Colocada:** está en su posición de la matriz y ya no puede moverse.

**Una pieza que no esté fija no puede colocarse en la matriz.**

## 6. Representación de Stack y Queue

La pila y la cola son zonas de trabajo separadas de las piezas, y son
compartidas por todas las piezas del nivel.

### Stack (pila)

Principio **LIFO (Last In, First Out)**: el último elemento introducido es
el primero en salir. Representación vertical.

-   `push(elemento)`: introduce un elemento en la parte superior.
-   `pop()`: extrae y devuelve el elemento superior.

### Queue (cola)

Principio **FIFO (First In, First Out)**: el primer elemento introducido es
el primero en salir. Representación horizontal.

-   `enqueue(elemento)`: agrega un elemento al final.
-   `dequeue()`: extrae y devuelve el elemento del frente.

## 7. Flujo de elementos: desarmar y armar

1.  Los elementos pueden estar sueltos en la bandeja o acoplados a una
    pieza.
2.  **Desarmar** quita un elemento movible de una pieza no fija. El orden
    en que salen lo define el nivel según lo que enseña:
    -   niveles de Stack: sale primero el último elemento acoplado (LIFO);
    -   niveles de Queue: sale primero el elemento acoplado hace más
        tiempo (FIFO).

    Los elementos que una pieza trae al iniciar el nivel se consideran
    acoplados en el orden de sus anclajes (1, 2, 3…).
3.  El núcleo nunca se desarma.
4.  Un elemento desarmado o tomado de la bandeja debe entrar a la pila o a
    la cola. No se acopla directamente a una pieza.
5.  Un elemento extraído con `pop()` o `dequeue()` puede:
    -   armarse en la pieza seleccionada;
    -   transferirse a la otra estructura;
    -   devolverse a la bandeja.
6.  **Armar** acopla el elemento en el anclaje libre de menor número de la
    pieza seleccionada.
7.  Si el elemento choca con el núcleo o con otro elemento, la operación
    falla con el error "no encaja".
8.  Una transferencia entre estructuras no acopla nada.
9.  Los elementos solo se mueven con código. El único arrastre del juego
    es colocar una pieza fija en la matriz.

Ejemplo de desarmado hacia la pila:

``` python
pila.push(desarmar(PIEZA_02))
```

Ejemplo de armado:

``` python
armar(pila.pop())
```

Estas funciones son una API didáctica del juego. Su implementación
interna debe impedir duplicaciones, pérdidas o modificaciones de núcleos.

## 8. Editor de código Python asistido

-   Cada nivel define un orden de trabajo de las piezas. Solo la primera
    pieza no fija de ese orden puede trabajarse; la siguiente se desbloquea
    cuando la anterior queda fija. Así, cada plantilla parte siempre del
    estado que el diseñador del nivel previó.
-   Al seleccionar la pieza que toca trabajar, el panel de código carga su
    plantilla.
-   Una pieza fija o colocada se puede seleccionar para verla, pero no
    carga plantilla de código.
-   El código de una pieza puede desarmar cualquier pieza no fija, pero
    solo arma la pieza seleccionada.
-   El jugador completa los huecos: con lista desplegable en los niveles
    iniciales y con texto libre en los avanzados.
-   Se puede ejecutar el código completo o paso a paso. Cada operación se
    anima.
-   El juego no ejecuta Python real: un analizador propio acepta solo la
    sintaxis y las operaciones habilitadas en el nivel.
-   Si una operación falla a mitad de la ejecución, la animación se detiene
    en esa línea, se explica el error y el estado vuelve a como estaba
    antes de ejecutar.
-   Si la ejecución termina sin errores, el nuevo estado se conserva aunque
    la pieza no esté terminada. Un arreglo equivocado es un paso
    intermedio normal y se corrige desarmando.
-   El estado de las piezas (fija o no) se evalúa **al terminar** la
    ejecución, no a mitad. Así, una pieza que coincide con su objetivo en
    un paso intermedio no se bloquea antes de tiempo.
-   El botón Deshacer última ejecución restaura el estado previo a la
    última ejecución sin errores, incluso si esa ejecución dejó una pieza
    fija. Solo deshace una ejecución, y deja de estar disponible en cuanto
    se coloca una pieza en la matriz.

### Instrucciones válidas

| Forma | Ejemplo | Disponible desde |
| --- | --- | --- |
| Bandeja a pila | `pila.push("A")` | Nivel 1 |
| Desarmar hacia pila | `pila.push(desarmar(PIEZA_02))` | Nivel 4 |
| Pila a pieza | `armar(pila.pop())` | Nivel 1 (ya escrito en la plantilla) |
| Devolver a bandeja | `devolver(pila.pop())` | Nivel 4 |
| Bandeja o desarmar hacia cola | `cola.enqueue("A")`, `cola.enqueue(desarmar(PIEZA_02))` | Nivel 7 |
| Cola a pieza | `armar(cola.dequeue())` | Nivel 7 (ya escrito en la plantilla) |
| Transferir | `cola.enqueue(pila.pop())`, `pila.push(cola.dequeue())` | Nivel 13 |
| Comentario | `# texto` | Siempre |

Fuera de la primera versión: bucles, condicionales y variables temporales.

### Errores

Cada error indica la línea y tiene una explicación para el avatar:

| Código | Causa |
| --- | --- |
| `SINTAXIS` | La línea no sigue la sintaxis permitida. |
| `OPERACION_NO_PERMITIDA` | La operación aún no se habilita en el nivel. |
| `METODO_INEXISTENTE` | Por ejemplo, `pila.enqueue()` o `cola.pop()`. |
| `ELEMENTO_NO_DISPONIBLE` | El elemento no está en la bandeja. |
| `ESTRUCTURA_VACIA` | `pop()` o `dequeue()` sobre una estructura vacía. |
| `EXTRACCION_SIN_DESTINO` | Extracción sin enviar el elemento a ningún lado. |
| `PIEZA_FIJA` | Intento de desarmar una pieza fija o colocada. |
| `PIEZA_SIN_MOVIBLES` | La pieza ya no tiene elementos que desarmar. |
| `PIEZA_COMPLETA` | No quedan anclajes libres en la pieza seleccionada. |
| `NO_ENCAJA` | El elemento choca con el núcleo o con otro elemento. |
| `LIMITE_OPERACIONES` | Se superó el máximo de operaciones por ejecución. |

## 9. Progresión didáctica de niveles

Tres niveles por etapa, unos 20 en total. Ninguna operación se exige antes
de explicarla: en las etapas de solo entrada, las líneas de extracción y
armado ya vienen escritas y bloqueadas en la plantilla.

| Etapa | Niveles | El jugador escribe | Origen de los elementos | Objetivo didáctico |
| --- | --- | --- | --- | --- |
| 1. Stack: entrada | 1-3 | `push` | Solo bandeja | El orden de entrada decide la forma, invertido |
| 2. Stack: salida y desarmado | 4-6 | `push`, `pop`, `armar`, `desarmar`, `devolver` | Bandeja y piezas mal armadas | LIFO: desarmar en el orden correcto |
| 3. Queue: entrada | 7-9 | `enqueue` | Solo bandeja | El orden de entrada se conserva |
| 4. Queue: salida y desarmado | 10-12 | `enqueue`, `dequeue`, `armar`, `desarmar`, `devolver` | Bandeja y piezas mal armadas | FIFO frente a LIFO |
| 5. Transferencias | 13-15 | Todas + transferencias | Bandeja y piezas | Combinar estructuras para reordenar |
| 6. Matrices complejas | 16-18 | Todas | Varias piezas que intercambian elementos | Planear el desarmado de varias piezas |
| Final | 19-20 | Todas, con texto libre | Todo | Integración |

En los niveles que usan pila y cola a la vez, el archivo del nivel indica
qué orden de desarmado aplica.

## 10. Validación y solución única

Cada nivel define previamente:

-   forma y dimensiones de la matriz y piezas de referencia;
-   elementos, con su forma y color;
-   bandeja inicial;
-   piezas, con núcleo, anclajes, elementos iniciales, configuración
    objetivo y posición objetivo;
-   orden de trabajo de las piezas;
-   orden de desarmado (LIFO o FIFO);
-   operaciones permitidas;
-   plantillas de código y soluciones de referencia.

El motor valida:

1.  **Operaciones:** que solo se usen operaciones permitidas y que las
    estructuras se comporten correctamente.
2.  **Elementos:** que no existan duplicados, pérdidas ni elementos
    inventados en todo el nivel.
3.  **Forma de cada pieza:** que la forma acoplada en cada anclaje
    coincida con la configuración objetivo.
4.  **Colocación:** que la pieza fija ocupe un hueco cuya forma objetivo
    coincida con la suya, sin solapamientos.

No hay elementos señuelo: completar la matriz exige usar todos los
elementos del nivel, y al terminar la bandeja, la pila y la cola quedan
vacías.

La solución de referencia sirve para probar que el nivel es resoluble; la
validación compara el resultado, no el texto del código. Un verificador
automático ejecuta la solución de cada nivel en el orden de trabajo de sus
piezas, comprueba que use todos los elementos y que no exista otra forma de
completar la matriz.

## 11. Sistema de pistas

Las pistas son **únicamente específicas**. No hay categorías ni niveles de
pistas.

-   Cada nivel define de 1 a 3 pistas, asociadas al nivel o a una pieza.
-   Indican directamente una operación o una parte de la secuencia.
-   El botón muestra la siguiente pista no vista y pide confirmación antes
    de restar la estrella.
-   Cada pista diferente consultada resta una estrella.
-   Volver a consultar una pista ya vista no resta estrellas.
-   Reiniciar el nivel restablece las pistas vistas.

## 12. Sistema de estrellas

| Pistas diferentes utilizadas | Estrellas |
| --- | --- |
| 0 | 3 |
| 1 | 2 |
| 2 | 1 |
| 3 | 0 |

``` python
estrellas = max(0, 3 - pistas_utilizadas)
```

Las estrellas dependen solo de las pistas, no del tiempo ni de los
intentos. Completar con 0 estrellas también desbloquea el siguiente nivel.

## 13. Cronómetro

-   Cada nivel tiene su propio cronómetro.
-   Comienza al iniciar el nivel y se detiene al completar la matriz.
-   Consultar pistas no lo detiene ni lo reinicia.
-   Se pausa con el menú o cuando la pestaña pierde el foco, y continúa
    desde el tiempo acumulado.
-   Reiniciar el nivel lo restablece.
-   El tiempo es una estadística independiente de las estrellas.

## 14. Pantalla de resultados y progreso

Al completar un nivel se muestra:

-   mensaje de nivel completado;
-   estrellas obtenidas;
-   tiempo empleado;
-   pistas diferentes utilizadas;
-   operaciones ejecutadas y ejecuciones fallidas;
-   botón para continuar o volver al menú.

Se guarda localmente el mejor resultado de cada nivel: más estrellas y, a
igualdad, menor tiempo. También se registran localmente operaciones,
errores y pistas, para un posible análisis de aprendizaje.

## 15. Avatar educativo

Sección reservada para un avatar con cuadros de diálogo contextuales.

Funciones previstas:

-   explicar conceptos y operaciones;
-   presentar las instrucciones de cada nivel;
-   orientar sobre las mecánicas;
-   comunicar pistas específicas;
-   explicar errores de forma sencilla;
-   felicitar al completar desafíos.

**El diseño, nombre, apariencia y personalidad del avatar todavía no están
definidos.** En la primera implementación se usa un marcador neutro. Sus
textos se guardan en un archivo aparte, referenciados por clave.

## 16. Reglas generales de consistencia

-   Ningún elemento puede duplicarse ni desaparecer en todo el nivel.
-   Los núcleos nunca pueden modificarse ni desarmarse.
-   Las piezas fijas, colocadas y de referencia no pueden desarmarse.
-   No se puede colocar una pieza que no esté fija.
-   Las piezas se trabajan en el orden definido por el nivel.
-   Las operaciones no habilitadas en el nivel no pueden ejecutarse.
-   Una transferencia entre estructuras no acopla nada.
-   Solo `armar` acopla un elemento, y siempre en el anclaje libre de menor
    número de la pieza seleccionada.
-   El estado de las piezas se evalúa al terminar cada ejecución.
-   Una ejecución con error no deja ningún cambio.
-   El nivel puede reiniciarse sin residuos de ejecuciones anteriores.
-   La solución de cada nivel es única y está definida previamente.

## 17. Cambios respecto a la versión 1

-   Los elementos tienen forma propia y las piezas tienen núcleo y
    anclajes.
-   Se agregan las operaciones `desarmar`, `armar` (antes `ensamblar`) y
    `devolver`.
-   La bandeja, la pila y la cola son compartidas por todas las piezas.
-   La matriz muestra solo la silueta.
-   Se agregan a la interfaz la bandeja, la zona de estructuras y el botón
    Deshacer, y el avatar pasa a ser un área con ubicación y reglas de
    diálogo.
-   El orden de desarmado depende del nivel (LIFO o FIFO).
-   Los niveles de solo entrada traen escritas las líneas de extracción.
-   El estado de las piezas se evalúa al terminar la ejecución.
-   Los elementos de igual forma son intercambiables, y también las piezas
    de igual forma final al colocarlas en la matriz.
-   Los elementos iniciales de una pieza se desarman según el orden de sus
    anclajes.
-   Se define el alcance de Deshacer y se eliminan los elementos señuelo.
-   Las piezas se trabajan en un orden definido por el nivel (nuevo estado
    "En espera"), y las piezas fijas o colocadas no cargan plantilla.
