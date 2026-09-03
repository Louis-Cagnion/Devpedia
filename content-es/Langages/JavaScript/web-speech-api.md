---
order: 15
---

# La Web Speech API: reconocimiento y síntesis de voz en el navegador

La **Web Speech API** es una API del **propio navegador** (no una biblioteca externa a instalar): expone directamente en JavaScript el **reconocimiento de voz** (transformar una voz captada por el micrófono en texto) y la **síntesis de voz** (transformar un texto en voz), sin pasar por un servicio externo.

| | Reconocimiento de voz | Síntesis de voz |
|---|---|---|
| Función | Voz → texto | Texto → voz |
| Interfaz JavaScript | `SpeechRecognition` (`webkitSpeechRecognition` en algunos navegadores) | `speechSynthesis` |
| Ejemplo de uso | Escribir una búsqueda por voz | Leer un texto en voz alta (la lectura de audio de este sitio, por ejemplo, se apoya en `speechSynthesis` como respaldo) |

## El reconocimiento de voz: un modelo por eventos

A diferencia del [modelo por Promise visto en la programación asíncrona](/?c=langages&s=javascript&p=asynchrone), el reconocimiento de voz no devuelve un único resultado esperado con `await`: dispara **eventos**, potencialmente varias veces, a medida que capta cosas.

```javascript
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!Recognition) {
    // Respaldo obligatorio: la API no existe en este navegador
    mostrarBusquedaClasica();
} else {
    const reconocimiento = new Recognition();
    reconocimiento.lang = "es-ES";

    reconocimiento.onresult = (evento) => {
        const texto = evento.results[0][0].transcript;
        lanzarBusqueda(texto);
    };

    reconocimiento.onerror = (evento) => {
        console.log("Error de reconocimiento:", evento.error);
        mostrarBusquedaClasica();   // respaldo en caso de fallo (microfono rechazado, etc.)
    };

    reconocimiento.start();
}
```

| Callback | Se dispara cuando |
|---|---|
| `onresult` | Un resultado (texto transcrito) está disponible |
| `onerror` | Ocurre un error (micrófono rechazado, red, idioma no soportado...) |
| `onend` | La sesión de escucha termina, con o sin resultado |

## La síntesis de voz: una cola de enunciados

```javascript
const enunciado = new SpeechSynthesisUtterance("Hola, esto es una prueba.");
enunciado.lang = "es-ES";
enunciado.rate = 1.2;   // velocidad de lectura

speechSynthesis.speak(enunciado);   // agrega el enunciado a la cola y lo lee
```

`speechSynthesis.speak()` apila el enunciado en una **cola** interna del navegador: llamar a `speak()` varias veces seguidas no los lee todos a la vez, sino uno tras otro.

## Soporte de navegador desigual

> **Trampa:** usar `SpeechRecognition` sin verificar su presencia (`window.SpeechRecognition || window.webkitSpeechRecognition`). Algunos navegadores solo exponen la API bajo el nombre con prefijo `webkitSpeechRecognition`, otros no la exponen en absoluto: sin verificación, el script falla silenciosamente (`undefined is not a constructor`) en los navegadores no soportados.
>
> **Buena práctica:** verificar siempre la presencia de la API antes de usarla, y prever un respaldo funcional (un campo de búsqueda de texto clásico) en lugar de hacer obligatoria la función de voz.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La Web Speech API expone reconocimiento (`SpeechRecognition`) y síntesis (`speechSynthesis`) de voz directamente en el navegador. El reconocimiento funciona por eventos (`onresult`, `onerror`), no por Promise. |
| **Herramientas utilizables** | `SpeechRecognition`/`webkitSpeechRecognition`, `SpeechSynthesisUtterance`, `speechSynthesis.speak()`. |
| **Trampas a evitar** | Usar la API sin verificar su presencia (prefijo `webkit`, o ausencia total en algunos navegadores); ignorar `onerror`. |
| **Buenas prácticas** | Prever siempre un respaldo funcional si la API está ausente o falla; gestionar explícitamente `onerror`, no solo el caso de éxito. |
