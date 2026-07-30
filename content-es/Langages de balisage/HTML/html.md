# HTML

HTML (*HyperText Markup Language*) no es un lenguaje de programación: es un lenguaje de **marcado** que describe la estructura y el significado de un contenido (un título, un párrafo, una imagen, un enlace...), no unas instrucciones que se ejecutan de forma secuencial. Un navegador lee un documento HTML y construye una representación en memoria de dicha estructura, el DOM (*Document Object Model*, véase el capítulo dedicado a ello en JavaScript), que a continuación muestra en pantalla.

Entre los conceptos esenciales del HTML se encuentran, entre otros:

- Las etiquetas y los atributos, que estructuran y enriquecen el contenido
- Los elementos semánticos (HTML5), que aportan un significado explícito a cada parte de la página
- Los formularios, para recopilar datos del usuario
- Accesibilidad, para que el contenido siga siendo utilizable mediante tecnologías de asistencia (lectores de pantalla, etc.).

El HTML no se ocupa **ni** de la apariencia visual (esa es la función del CSS; véase el capítulo dedicado a ello), **ni** del comportamiento interactivo (esa es la función de JavaScript); su única responsabilidad es describir qué es cada parte del contenido. Esta separación de responsabilidades (estructura, presentación y comportamiento) es un principio fundamental del desarrollo web moderno.

> **Nota:** a diferencia de lo que ocurre con un lenguaje de programación, un error de sintaxis HTML casi nunca provoca un «bloqueo»; los navegadores son deliberadamente tolerantes (etiquetas sin cerrar, atributos mal escritos...) e intentan corregirlos de forma silenciosa, lo que puede ocultar los errores durante mucho tiempo si no se valida el código HTML con una herramienta específica.
