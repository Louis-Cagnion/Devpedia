---
order: 8
---

# La investigación de usuarios

Los capítulos anteriores (jerarquía visual, color, tipografía...) suponen que ya se sabe lo que el usuario debe lograr en una pantalla. La **investigación de usuarios** es la etapa que viene antes: entender quién usa realmente el producto, qué intenta hacer, y dónde encuentra dificultades, antes de dibujar cualquier cosa. Sin esta etapa, un diseñador diseña para un usuario imaginado, no para el que realmente usará el producto.

> **Por qué importa:** una pantalla perfectamente jerarquizada, bien contrastada y accesible sigue siendo un fracaso si resuelve un problema que nadie tiene. La investigación de usuarios reduce ese riesgo confrontando las ideas de diseño con personas reales, lo antes posible: corregir un rumbo equivocado cuesta mucho menos antes que después de haber programado la interfaz.

## Los personas: representar un usuario tipo

Un **persona** es un perfil ficticio, pero construido a partir de datos reales (entrevistas, observaciones, estadísticas de uso), que representa a un grupo de usuarios que comparten los mismos objetivos y frustraciones frente al producto:

| Campo | Ejemplo |
|---|---|
| Nombre y rol | Sofía, 34 años, responsable contable en una PYME |
| Objetivo principal | Cerrar las cuentas del mes sin errores, lo más rápido posible |
| Frustración actual | Debe volver a introducir los mismos datos en dos herramientas diferentes |
| Nivel técnico | Cómoda con las hojas de cálculo, poco cómoda con una herramienta que considera "demasiado técnica" |

Un producto rara vez apunta a un solo persona: 2 a 4 personas distintos cubren en general lo esencial de los usos reales, cada uno orientando decisiones de diseño diferentes (un persona poco cómodo técnicamente empuja hacia una interfaz más guiada, por ejemplo).

> **Trampa:** construir un persona a partir de suposiciones ("creo que nuestros usuarios son bastante jóvenes y cómodos con la tecnología") en lugar de datos reales. Un persona imaginario refuerza los sesgos del equipo de diseño en lugar de corregirlos: da la ilusión de una base sólida sin serlo.
>
> **Buena práctica:** construir cada persona a partir de entrevistas o de datos de uso reales (ver la sección siguiente), y actualizarlo si nuevos datos lo contradicen, en lugar de fijarlo de una vez por todas.

## Las entrevistas de usuario: recopilar la información en la fuente

Una **entrevista de usuario** consiste en interrogar a una persona representativa para entender su contexto, sus objetivos y sus dificultades, no para pedirle que califique una idea ya diseñada (eso es el rol de la [prueba de usabilidad](#probar-la-usabilidad-observar-en-lugar-de-preguntar), más abajo). La formulación de las preguntas influye fuertemente en la calidad de las respuestas obtenidas:

| | Pregunta orientada | Pregunta abierta |
|---|---|---|
| Ejemplo | "No le gusta tener que volver a introducir sus datos, ¿verdad?" | "Cuénteme la última vez que cerró las cuentas del mes." |
| Efecto | Sugiere la respuesta esperada; la persona tiende a confirmar por cortesía (*sesgo de deseabilidad social*) | Deja que la persona describa su propia experiencia, sin dirección impuesta |

> **Trampa:** hacer preguntas que ya sugieren la respuesta deseada, o que tratan sobre una opinión futura hipotética ("¿usaría una función que hiciera X?"). Las personas entrevistadas sobrestiman sistemáticamente su uso futuro de una función imaginada: lo que hacen realmente hoy es un indicador mucho más fiable que lo que creen que harían.
>
> **Buena práctica:** hacer preguntas abiertas sobre comportamientos pasados y concretos ("cuénteme la última vez que...") en lugar de sobre opiniones o intenciones futuras.

## El mapa de empatía: sintetizar varias entrevistas

Un **mapa de empatía** (*empathy map*) organiza lo aprendido de un usuario o de un persona en cuatro cuadrantes, para resaltar las tensiones entre lo que dice y lo que realmente siente:

```text
+---------------------------+---------------------------+
| LO QUE DICE                | LO QUE PIENSA             |
| "La herramienta actual     | Teme perder tiempo         |
|  funciona bien, nos        | si cambian de herramienta  |
|  arreglamos"                |                            |
+---------------------------+---------------------------+
| LO QUE HACE                 | LO QUE SIENTE              |
| Vuelve a introducir los     | Frustracion silenciosa,    |
| mismos datos en 2           | nunca expresada de palabra |
| herramientas                |                            |
+---------------------------+---------------------------+
```

La brecha entre el cuadrante "dice" y los otros tres suele ser el hallazgo más útil: aquí, la persona minimiza verbalmente un problema que vive y expresa concretamente (ver también la [trampa de las preguntas orientadas](#las-entrevistas-de-usuario-recopilar-la-informacion-en-la-fuente) más arriba, que produce exactamente este tipo de desfase si no se contrasta lo dicho con la observación).

## Probar la usabilidad: observar en lugar de preguntar

Una **prueba de usabilidad** consiste en observar a una persona real intentar realizar una tarea precisa en el producto (existente o un prototipo, ver el futuro capítulo sobre prototipado), sin ayudarla ni explicarle cómo hacerlo: sus dudas y errores revelan los puntos de fricción reales, a menudo diferentes de los que el equipo de diseño había anticipado.

```text
Tarea dada     : "Encuentre como exportar este informe a PDF."
Observacion    : la persona busca en el menu "Archivo" durante
                 45 segundos antes de localizar el icono de exportacion,
                 aislado en la barra lateral sin texto ni tooltip.
Conclusion     : la exportacion existe y funciona, pero su posicion
                 no esta donde el usuario la busca naturalmente.
```

Este tipo de hallazgo se relaciona directamente con el [reconocimiento en lugar del recuerdo](/?c=ui-ux&p=heuristiques-de-nielsen), una de las diez heurísticas de Nielsen: una prueba de usabilidad es una de las formas concretas de verificar si una interfaz realmente la respeta, en lugar de suponerlo.

> **Trampa:** intervenir durante la prueba para explicar dónde hacer clic, o reformular la tarea si la persona parece atascada. Eso oculta exactamente el problema que la prueba debería revelar: una persona que prueba sola el producto en condiciones reales no tendrá a nadie que le sople la respuesta.
>
> **Buena práctica:** permanecer en silencio mientras la persona lo intenta, anotar con precisión dónde y por qué duda, y hacer preguntas solo una vez terminada la tarea (lograda o no).

## Qué método, en qué momento

| Método | Responde a la pregunta | Momento del proyecto |
|---|---|---|
| Entrevista de usuario | ¿Quiénes son los usuarios, cuáles son sus objetivos y frustraciones? | Al inicio, antes de diseñar nada |
| Persona | ¿Cómo resumir y compartir estos perfiles con todo el equipo? | Después de una serie de entrevistas, para sintetizar |
| Mapa de empatía | ¿Qué tensiones hay entre el discurso y la experiencia real de un usuario? | Justo después de las entrevistas, durante la síntesis |
| Prueba de usabilidad | ¿Esta interfaz (o este prototipo) funciona realmente para una tarea dada? | Una vez que existe algo que probar, incluso una maqueta |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | La investigación de usuarios precede al diseño: entrevistas para entender a los usuarios reales, personas para sintetizar perfiles tipo, mapa de empatía para resaltar las tensiones dicho/pensado/hecho/sentido, prueba de usabilidad para verificar que una interfaz funciona realmente para una tarea dada. |
| **Herramientas utilizables** | Una guía de entrevista con preguntas abiertas; una plantilla de persona (nombre, objetivo, frustración, nivel técnico); una plantilla de mapa de empatía de 4 cuadrantes; una tarea precisa que observar para una prueba de usabilidad. |
| **Trampas a evitar** | Construir un persona a partir de suposiciones en lugar de datos reales. Hacer preguntas orientadas o sobre intenciones futuras hipotéticas. Intervenir durante una prueba de usabilidad en lugar de observar en silencio. |
| **Buenas prácticas** | Construir los personas a partir de entrevistas o datos de uso reales. Hacer preguntas abiertas sobre comportamientos pasados y concretos. Observar una prueba de usabilidad en silencio, preguntar solo después. |
