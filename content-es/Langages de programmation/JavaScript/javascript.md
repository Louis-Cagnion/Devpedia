---
order: 5
---

# JavaScript

Un [lenguaje de programación](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) es un conjunto de reglas que permite escribir instrucciones que un ordenador puede ejecutar. JavaScript es uno de ellos, concebido originalmente para hacer interactivas las páginas web.

```javascript
let nombre = "Devpedia";        // una variable, véase el capítulo dedicado
console.log(`Hola, ${nombre}`); // muestra: Hola, Devpedia
```

| Término | Qué significa |
|---|---|
| Alto nivel | Oculta gran parte de los detalles técnicos relacionados con la máquina, a diferencia de un lenguaje de bajo nivel como el [C](/?c=langages-de-programmation&s=c&p=c) |
| Recolector de basura (*garbage collector*) | Un mecanismo automático que libera la memoria de los valores que ya no se utilizan, sin intervención del desarrollador |
| DOM | La representación en memoria de una página [HTML](/?c=langages-de-balisage&s=html&p=html) (véase [El DOM y la gestión de eventos](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements)) que JavaScript puede leer y modificar para hacer una página interactiva |
| Asíncrono | Una operación que tarda tiempo (una llamada de red) sin bloquear el resto del programa mientras espera su finalización (véase [La programación asíncrona](/?c=langages-de-programmation&s=javascript&p=asynchrone)) |

JavaScript se ejecuta tanto del lado del cliente (en el navegador) como del lado del servidor (mediante [Node.js](https://nodejs.org)), lo que lo convierte en un lenguaje central del desarrollo web moderno: numerosos frameworks ([React](https://react.dev), [Vue](https://vuejs.org), [Angular](https://angular.dev)) se apoyan en él.
