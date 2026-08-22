---
order: 7
---

# HTML

HTML (*HyperText Markup Language*) no es un lenguaje de programación: es un lenguaje de **marcado**, que describe la estructura y el sentido de un contenido (un título, un párrafo, una imagen, un enlace...), no instrucciones ejecutadas de forma secuencial. Un navegador lee un documento HTML y construye una representación en memoria de esa estructura, el DOM (*Document Object Model*, véase [El DOM y los eventos](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements)), que luego muestra en pantalla.

Entre los conceptos esenciales de HTML se encuentran, entre otros:

- Las etiquetas y los atributos, que estructuran y enriquecen el contenido
- Los elementos semánticos (HTML5), que dan un sentido explícito a cada parte de la página
- Los formularios, para recopilar datos del usuario
- La accesibilidad, para que el contenido siga siendo utilizable mediante tecnologías de asistencia (lectores de pantalla...)

HTML no se ocupa **ni** de la apariencia visual (el papel de [CSS](/?c=langages-de-balisage&s=css&p=css)), **ni** del comportamiento interactivo (el papel de [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)): su única responsabilidad es describir qué **es** cada parte del contenido. Esta separación de responsabilidades (estructura / presentación / comportamiento) es un principio central del desarrollo web moderno.

> **Nota:** a diferencia de un lenguaje de programación, un error de sintaxis HTML casi nunca provoca un "crash": los navegadores son voluntariamente tolerantes (etiqueta sin cerrar, atributo mal escrito...) e intentan corregir en silencio, lo que puede ocultar errores durante mucho tiempo si no se valida el HTML con una herramienta dedicada.
