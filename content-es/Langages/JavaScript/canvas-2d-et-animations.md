---
order: 19
---

# Canvas 2D y animaciones

El elemento [HTML](/?c=langages&s=html&p=html) `<canvas>` expone una zona de dibujo programable, píxel a píxel, directamente en JavaScript. Este capítulo cubre su uso para una animación fluida (bucle de renderizado, adaptación a la densidad de la pantalla) y un uso menos evidente: medir texto sin llegar a mostrarlo nunca.

## Obtener un contexto de dibujo

```javascript
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');   // "2d": dibujo 2D clasico (frente a "webgl")

ctx.fillStyle = 'rgba(2,96,231,0.5)';
ctx.fillRect(10, 10, 100, 50);         // rectangulo relleno: x, y, ancho, alto
```

## Adaptar el dibujo a la densidad real de la pantalla

Un píxel CSS (el tamaño mostrado) no siempre corresponde a un píxel físico de pantalla: una pantalla de alta densidad (Retina, por ejemplo) muestra varios por píxel CSS. `window.devicePixelRatio` da ese factor, a aplicar para un renderizado nítido:

```javascript
function redimensionar() {
    // tope en 2: mas alla, coste innecesario
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    // resolucion REAL del canvas (pixeles fisicos)
    canvas.width  = Math.floor(rect.width  * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    // para dibujar despues en coordenadas CSS
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
```

`canvas.width`/`canvas.height` (la resolución interna, en píxeles físicos) son deliberadamente distintos del tamaño CSS mostrado (`rect.width`/`rect.height`): sin este factor, el canvas seguiría nítido en una pantalla estándar pero borroso en una de alta densidad, con sus píxeles internos estirados para llenar una zona físicamente mayor.

`ctx.setTransform(ratio, 0, 0, ratio, 0, 0)` compensa después esa diferencia: todo el código de dibujo que sigue puede seguir razonando en coordenadas CSS normales (`fillRect(10, 10, ...)`), sin multiplicar nunca manualmente cada coordenada por `ratio`.

> **Trampa:** limitar `devicePixelRatio` (aquí a 2) no es un error de redondeo sino una elección deliberada: más allá, la ganancia visual se vuelve imperceptible mientras el número de píxeles a calcular sigue creciendo al cuadrado, un coste real sin beneficio visible.

## El bucle de animación: `requestAnimationFrame`

`requestAnimationFrame(callback)` pide al navegador que llame a `callback` justo antes del siguiente refresco de pantalla (generalmente 60 veces por segundo), en lugar de a un intervalo fijo como `setInterval`:

```javascript
function frame(ahora) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // borra la imagen anterior
    dibujarEscena(ahora);
    requestAnimationFrame(frame);                        // reprograma la siguiente llamada
}
requestAnimationFrame(frame);
```

`ahora` (proporcionado automáticamente por el navegador, en milisegundos) permite basar la animación en el **tiempo real transcurrido** en lugar del número de llamadas: una animación que avanza un paso fijo en cada llamada a `frame` iría más rápido en una pantalla de 144Hz que en una de 60Hz, mientras que una animación basada en `ahora` mantiene la misma velocidad percibida, sea cual sea la tasa de refresco.

> **Buena práctica:** preferir `requestAnimationFrame` a `setInterval` para cualquier animación visual. El navegador puede sincronizar la llamada con su propio refresco de pantalla (imagen más fluida) y suspende automáticamente las llamadas de una pestaña no visible (ahorro de recursos), algo que un `setInterval` nunca hace por sí mismo.

## El suavizado exponencial: seguir un objetivo sin saltos

Hacer que un elemento (un cursor animado, una cámara) siga una posición objetivo, fotograma tras fotograma, sin que "salte" bruscamente en cada cambio de objetivo, suele usar un **suavizado exponencial** (también llamado *lerp* en este contexto):

```javascript
let x = posicionInicial;

function frame() {
    const objetivo = calcularNuevoObjetivo();
    x += (objetivo - x) * 0.04;   // avanza un 4% de la distancia restante en cada fotograma
    dibujarEn(x);
    requestAnimationFrame(frame);
}
```

En cada fotograma, la posición nunca salta directamente al objetivo: solo avanza una fracción (aquí 4%) de la distancia que aún lo separa. El efecto percibido es un movimiento que se ralentiza naturalmente al acercarse a su objetivo, en lugar de una parada brusca.

| Factor | Efecto |
|---|---|
| Cercano a 0 (ej. 0.01) | Seguimiento muy lento, efecto "inercia" pronunciado |
| Cercano a 1 (ej. 0.5) | Seguimiento casi instantáneo, poco suavizado perceptible |

## Medir texto sin llegar a mostrarlo nunca: `measureText()`

Un canvas 2D también sirve, de forma indirecta, para medir con precisión el ancho que ocuparía un texto con una fuente dada, **sin dibujar ni mostrar nunca ese canvas**:

```javascript
const ctxMedida = document.createElement('canvas').getContext('2d');   // nunca anadido al DOM

function anchoTexto(texto, tamanoFuente = 11) {
    ctxMedida.font = `${tamanoFuente}px sans-serif`;
    return ctxMedida.measureText(texto).width;
}
```

Esta cifra sustituye ventajosamente a una estimación aproximada (un ancho medio por carácter) para un cálculo de maquetación que depende del ancho real de un texto (una leyenda que necesita saber si cabe en una línea o debe pasar a la siguiente, por ejemplo): `measureText()` usa la fuente real y da el ancho exacto que ese texto ocuparía realmente en pantalla.

> **Trampa:** usar una fuente distinta entre `ctxMedida.font` y la realmente mostrada en pantalla (tamaño, familia de fuente). La medida ya no sería fiel a lo que realmente se muestra, lo que puede reintroducir la imprecisión que `measureText()` pretendía eliminar.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `devicePixelRatio` adapta un canvas a la densidad real de la pantalla. `requestAnimationFrame` sincroniza una animación con el refresco de la pantalla y proporciona una marca de tiempo para una velocidad independiente de la tasa de refresco. El suavizado exponencial hace seguir un objetivo sin saltos. `measureText()` en un canvas nunca mostrado mide un texto con precisión, sin mostrarlo. |
| **Herramientas utilizables** | `getContext('2d')`, `devicePixelRatio`/`setTransform`, `requestAnimationFrame`, `measureText()`. |
| **Trampas a evitar** | Ignorar `devicePixelRatio` (renderizado borroso en pantalla de alta densidad). Animar por paso fijo por llamada en lugar de por tiempo real transcurrido (velocidad dependiente de la tasa de refresco). Medir un texto con una fuente distinta de la realmente mostrada. |
| **Buenas prácticas** | Limitar `devicePixelRatio` a un valor razonable (2, por ejemplo). Preferir `requestAnimationFrame` a `setInterval` para cualquier animación visual. Usar un factor de suavizado cercano a 0 para un efecto de inercia pronunciado, cercano a 1 para un seguimiento casi instantáneo. |
