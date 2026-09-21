---
order: 21
---

# La biblioteca de gráficos Apache ECharts

Dibujar un gráfico (barras, líneas, sectores) a mano en un [`<canvas>`](/?c=langages&s=javascript&p=canvas-2d-et-animations) exige dibujar cada elemento uno mismo: ejes, escala, curvas, leyenda, información al pasar el cursor. Este capítulo cubre [Apache ECharts](https://echarts.apache.org/), una biblioteca JavaScript de gráficos que sustituye ese dibujo manual por un único objeto de configuración.

## Configuración declarativa en vez de dibujo manual

ECharts recibe como entrada un objeto que describe el resultado deseado (enfoque **declarativo**), no los pasos para conseguirlo (enfoque **imperativo**, el del canvas): la biblioteca calcula ella misma las posiciones, la escala y el renderizado.

| | Canvas 2D (imperativo) | ECharts (declarativo) |
|---|---|---|
| Lo que se escribe | Cada instrucción de dibujo (`fillRect`, `moveTo`, `lineTo`...) | Un objeto de configuración (`option`) que describe el resultado deseado |
| Actualizar un valor | Borrar y redibujar uno mismo toda la zona | `chart.setOption()` solo con los datos nuevos |
| Información al pasar el cursor | Programada a mano (detección de posición, visualización) | Incluida, activada con la clave `tooltip` |

## Inicializar un gráfico sobre un contenedor

`echarts.init()` vincula un gráfico a un elemento del [DOM](/?c=langages&s=javascript&p=dom-et-evenements) (una etiqueta vacía, con un tamaño fijado en CSS); `setOption()` le aplica luego una configuración:

```javascript
const chart = echarts.init(document.querySelector('#mi-grafico'));

const option = {
    xAxis: { type: 'category', data: ['T1', 'T2', 'T3', 'T4'] },   // categorias mostradas en el eje horizontal
    yAxis: { type: 'value' },                                      // eje vertical numerico, escala automatica
    tooltip: {},                                                   // informacion al pasar el cursor sobre una barra
    series: [{ type: 'bar', data: [120, 200, 150, 80] }]           // una "serie" = un conjunto de barras/puntos a dibujar
};

chart.setOption(option);   // aplica la configuracion: el grafico se dibuja
```

> **Buena práctica:** un `option` sigue siendo un objeto JavaScript normal, generado dinámicamente a partir de los datos reales (una respuesta de [API](/?c=infrastructure&p=api-et-http), un cálculo) en vez de escrito a mano: construir sus claves (`xAxis.data`, `series[].data`) a partir de los datos a mostrar, nunca al revés.

## Actualizar los datos sin redibujar todo: `setOption()`

Una llamada a `setOption()` con un objeto parcial fusiona los nuevos valores con la configuración existente: solo se recalculan y redibujan las partes cambiadas, sin reconstruir los ejes ni la leyenda desde cero.

```javascript
// Anade una quinta categoria y su valor, sin recrear todo el grafico
chart.setOption({
    xAxis: { data: ['T1', 'T2', 'T3', 'T4', 'T5'] },
    series: [{ data: [120, 200, 150, 80, 175] }]
});
```

## Adaptar el gráfico al tamaño de su contenedor: `resize()`

Por defecto, un gráfico ECharts conserva el tamaño que tenía al inicializarse: redimensionar la ventana no lo redimensiona por sí solo. Hay que escuchar [el evento `resize`](/?c=langages&s=javascript&p=dom-et-evenements#escuchar-eventos) y pedir explícitamente un nuevo cálculo de tamaño:

```javascript
window.addEventListener('resize', () => chart.resize());
```

> **Trampa:** olvidar este escuchador. El contenedor (un `<div>`) sí sigue el CSS responsive de la página, pero el gráfico dibujado dentro se queda fijo en su tamaño original: aparece una zona vacía al lado, o el gráfico se desborda de un contenedor que se ha vuelto más pequeño.

## Liberar memoria cuando el gráfico desaparece: `dispose()`

En una [aplicación de página única (SPA)](/?c=langages&s=javascript&p=ssr-vs-csr#csr-el-servidor-envia-una-cascara-vacia), un componente de gráfico se crea y se destruye en cada navegación. Retirar el `<div>` del [DOM](/?c=langages&s=javascript&p=dom-et-evenements) no basta para liberar el gráfico: `echarts.init()` registró su propio gestor de redimensionamiento y reservó recursos de renderizado, que siguen activos mientras no se haya llamado explícitamente a `chart.dispose()`.

```javascript
chart.dispose();   // llamar antes de retirar el contenedor del DOM
```

> **Trampa:** un componente de gráfico que se destruye sin llamar a `dispose()` acumula un gráfico fantasma por cada navegación: el escuchador `resize` definido más arriba sigue ejecutándose sobre un gráfico que ya no existe visualmente, una fuga de memoria clásica en una SPA con navegación frecuente.

---

## 📋 Resumen

| | |
|---|---|
| **A retener** | ECharts describe un gráfico con un único objeto `option` (`series`, `xAxis`/`yAxis`, `tooltip`) en vez de instrucciones de dibujo (enfoque declarativo frente a imperativo). `echarts.init()` lo vincula a un elemento del DOM, `setOption()` lo muestra o lo actualiza parcialmente. |
| **Herramientas utilizables** | `echarts.init()`, `chart.setOption()`, `chart.resize()`, `chart.dispose()`. |
| **Trampas a evitar** | Olvidar escuchar `resize` (gráfico fijo en su tamaño inicial). Olvidar `dispose()` antes de retirar el contenedor del DOM (fuga de memoria, sobre todo en una SPA). |
| **Buenas prácticas** | Generar el objeto `option` dinámicamente a partir de los datos reales en vez de escribirlo a mano. Actualizar un gráfico existente con un `setOption()` parcial en vez de recrearlo por completo. |
