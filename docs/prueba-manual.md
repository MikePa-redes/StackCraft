# Prueba manual de Stack-Craft

Abre `dist/stack-craft.html` (tras `npm run build`) o `npm run dev` en un
navegador de escritorio de al menos 1280 × 720. Para empezar limpio, borra
las claves `stack-craft:mejores` y `stack-craft:registro` de localStorage.

## 1. Selección de niveles

- [ ] Al abrir aparece "Stack-Craft" con una tarjeta por nivel (hoy solo N05).
- [ ] Una tarjeta sin completar muestra 0 estrellas y "Sin completar".
- [ ] Clic (o Enter) en la tarjeta abre el nivel.
- [ ] El botón "Menú" de la barra vuelve a la selección.

## 2. Completar un nivel (N05)

- [ ] Se ven barra, piezas, bandeja, matriz, pila, código y avatar sin desbordes.
- [ ] Con los huecos vacíos, Ejecutar y Paso a paso están deshabilitados.
- [ ] Completa los huecos de PIEZA_01 y pulsa Ejecutar: los elementos viajan
      uno a uno y la pieza queda fija (verde).
- [ ] Arrastra la pieza fija a su sitio en la matriz: queda colocada.
- [ ] Repite con PIEZA_02 (pasa de "En espera" a "Incompleta").
- [ ] Al completar la matriz aparece "¡Nivel completado!" con estrellas,
      tiempo, pistas, operaciones y ejecuciones fallidas.
- [ ] "Ver tablero" cierra la capa; "Volver al menú" vuelve a la selección,
      donde la tarjeta muestra las estrellas y el tiempo guardados.
- [ ] Recarga la página: el mejor resultado sigue ahí.
- [ ] Repetir el nivel con peor resultado no sobrescribe el mejor.

## 3. Pistas

- [ ] "Pista" abre la confirmación mostrando estrellas antes y después.
- [ ] Cancelar no gasta estrellas ni marca la pista como vista.
- [ ] Confirmar muestra la pista en el avatar y baja una estrella.
- [ ] "Cerrar" oculta la pista; releerla desde el diálogo no cuesta estrella.
- [ ] El cronómetro sigue corriendo mientras se consultan pistas.
- [ ] Tras completar el nivel, el botón Pista queda deshabilitado.

## 4. Pausa del cronómetro

- [ ] El tiempo avanza al iniciar el nivel.
- [ ] Al cambiar de pestaña o ventana se detiene; al volver continúa.
- [ ] Al pasar por el menú y entrar de nuevo el cronómetro empieza en 00:00.
- [ ] Al completar el nivel el tiempo queda fijo.

## 5. Deshacer

- [ ] Deshacer está deshabilitado antes de ejecutar nada.
- [ ] Tras una ejecución correcta, Deshacer devuelve el estado anterior y
      conserva los valores de los huecos.
- [ ] Solo se puede deshacer una vez seguida.
- [ ] Una ejecución con error no habilita ni altera Deshacer.
- [ ] Colocar una pieza en la matriz borra la posibilidad de deshacer.
- [ ] Durante la animación, Deshacer está bloqueado.

## 6. Reinicio

- [ ] "Repetir nivel" (en resultados) empieza de cero: piezas, pila, huecos,
      pistas, estrellas (3) y tiempo (00:00).
- [ ] Salir al menú y volver a entrar también deja el nivel limpio.

## 7. Colocación incorrecta

- [ ] Arrastrar una pieza no fija: no se puede arrastrar.
- [ ] Soltar una pieza fija sobre un sitio que no le corresponde: la vista
      previa es roja, la copia vuelve al panel y el avatar da el motivo.
- [ ] Soltar sobre una zona ocupada (referencia o pieza colocada): se rechaza.
- [ ] Soltar fuera de la matriz: solo se cancela, sin mensaje de error.
- [ ] Una colocación válida muestra vista previa verde.

## 8. Errores de código

- [ ] Elegir en un hueco una pieza inexistente o inválida: el avatar explica el
      error, la línea se marca en rojo y el estado no cambia.
- [ ] Extraer de una pila vacía (por ejemplo más `pop` que `push`): error y
      estado restaurado.
- [ ] Armar con una pieza ya completa: error de pieza completa.
- [ ] Paso a paso: cada clic en "Siguiente paso" ejecuta una operación; la
      línea con error se resalta al llegar a ella y se restaura el estado.
- [ ] Ejecutar durante el paso a paso termina el resto.
- [ ] Tras un error, editar un hueco borra el resaltado rojo.
- [ ] Las ejecuciones fallidas se cuentan en la pantalla de resultados.

## 9. Comprobaciones generales

- [ ] Sin errores en la consola del navegador durante toda la prueba.
- [ ] El HTML funciona abierto como archivo (`file://`), sin servidor.
