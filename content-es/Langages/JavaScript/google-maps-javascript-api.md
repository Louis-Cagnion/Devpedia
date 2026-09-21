---
order: 18
---

# La API JavaScript de Google Maps

Mostrar un mapa interactivo en una página web (marcadores, un mapa base navegable) normalmente exige cargar una biblioteca de terceros. Este capítulo cubre la API JavaScript de [Google Maps](https://developers.google.com/maps/documentation/javascript), con su carga diferida oficial, la agrupación visual de marcadores numerosos, y las dos formas de dibujar un marcador.

## Cargar la biblioteca bajo demanda: `importLibrary()`

Un mapa completo de Google Maps usa varias subbibliotecas independientes (`maps` para el mapa en sí, `marker` para los marcadores...), cada una inútil mientras no se use realmente. En lugar de cargarlas todas de golpe al cargar la página, Google ofrece un pequeño script de arranque (*bootstrap loader*): solo carga el script real de la API en la primera llamada a `google.maps.importLibrary()`, y cachea las llamadas siguientes.

```javascript
// Carga solo las subbibliotecas pedidas, la 1a vez que hacen falta
const { Map } = await google.maps.importLibrary('maps');
const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
```

> **Nota:** este script de arranque lo proporciona Google tal cual (para pegar en la página), deliberadamente minificado y condensado en una sola expresión: no hay motivo para reescribirlo a mano, solo entender qué hace una vez desarrollado, como arriba.

## Agrupar marcadores numerosos: el clustering

Mostrar cientos de marcadores cercanos entre sí, con un nivel de zoom bajo, vuelve el mapa ilegible (marcadores superpuestos). Una biblioteca de **clustering** (agrupación visual) como [`@googlemaps/markerclusterer`](https://github.com/googlemaps/js-markerclusterer) reemplaza un grupo de marcadores cercanos por una sola insignia que muestra su número, que se desagrupa automáticamente al hacer zoom:

```javascript
const agrupador = new markerClusterer.MarkerClusterer({
    map,
    markers: listaDeMarcadores,
});
```

El clustering funciona por **posición en pantalla**, recalculada en cada cambio de zoom: no necesita ninguna configuración de distancia o umbral para funcionar correctamente en el caso habitual.

## Dispersar marcadores estrictamente colocalizados

El clustering resuelve la legibilidad a distancia, pero no un caso concreto: varias entradas que comparten exactamente las **mismas** coordenadas (por ejemplo, varias fichas de un mismo establecimiento). Incluso con el zoom máximo, un marcador quedaría invisible bajo el otro, estrictamente superpuesto, sin que ningún clic pudiera alcanzarlo. La solución consiste en desplazar cada marcador colocalizado según un pequeño círculo, a un radio fijo:

```javascript
const RADIO_DISPERSION = 0.00020;   // ~20m en el ecuador

function dispersarColocalizados(puntos) {
    const grupos = new Map();
    puntos.forEach(p => {
        const clave = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
        if (!grupos.has(clave)) grupos.set(clave, []);
        grupos.get(clave).push(p);
    });

    grupos.forEach(grupo => {
        if (grupo.length <= 1) return;
        const n = grupo.length;
        // Corrección de longitud según la latitud (si no, los círculos se estiran norte-sur)
        const escalaLongitud = 1 / Math.max(0.1, Math.cos(grupo[0].lat * Math.PI / 180));
        grupo.forEach((punto, i) => {
            const angulo = (2 * Math.PI * i) / n - Math.PI / 2;
            punto.lat += RADIO_DISPERSION * Math.sin(angulo);
            punto.lng += RADIO_DISPERSION * Math.cos(angulo) * escalaLongitud;
        });
    });
}
```

> **Trampa:** olvidar la corrección de longitud (`escalaLongitud`). Un grado de longitud no cubre la misma distancia real según la latitud (se encoge al alejarse del ecuador, hasta valer 0 en los polos): sin esta corrección, el círculo de dispersión se estira visualmente de norte a sur en lugar de seguir siendo un círculo real en pantalla.

## Dos formas de dibujar un marcador

La API de Google Maps ofrece dos caminos de renderizado para un marcador, con capacidades distintas:

| | `google.maps.Marker` (legacy) | `AdvancedMarkerElement` |
|---|---|---|
| Renderizado | Imagen SVG fija | Elemento [HTML](/?c=langages&s=html&p=html) personalizable (`content`) |
| Personalización | Limitada (icono, color) | Total (CSS, animaciones, contenido dinámico) |
| Requisito previo | Ninguno | Un identificador de estilo de mapa (*Map ID*) configurado en Google Cloud |

```javascript
// AdvancedMarkerElement: contenido HTML libre
const el = document.createElement('div');
el.className = 'mi-marcador-animado';
new AdvancedMarkerElement({ map, position, content: el });

// google.maps.Marker (legacy): renderizado SVG fijo, sin requisito de configuración
new google.maps.Marker({ map, position, icon: miIconoSvg });
```

> **Buena práctica:** alternar dinámicamente entre ambos según haya o no un *Map ID* configurado, en lugar de depender de un solo camino de renderizado: `AdvancedMarkerElement` cuando está disponible (personalización total), `google.maps.Marker` como respaldo en caso contrario, sin romper nada para un despliegue que todavía no tiene esa configuración.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `google.maps.importLibrary()` carga cada subbiblioteca bajo demanda, una sola vez. Un clustering agrupa visualmente marcadores cercanos; una dispersión en círculo (con corrección de longitud) separa marcadores estrictamente colocalizados. `AdvancedMarkerElement` permite un renderizado HTML personalizable, `google.maps.Marker` un renderizado SVG fijo sin requisitos. |
| **Herramientas utilizables** | `google.maps.importLibrary()`, `@googlemaps/markerclusterer` (`MarkerClusterer`), `AdvancedMarkerElement`/`google.maps.Marker`. |
| **Trampas a evitar** | Cargar todas las subbibliotecas de golpe en lugar de bajo demanda. Olvidar la corrección de longitud al dispersar puntos colocalizados. |
| **Buenas prácticas** | Agrupar los marcadores numerosos mediante clustering en lugar de dejarlos superponerse visualmente. Alternar entre `AdvancedMarkerElement` y `google.maps.Marker` según la configuración disponible, en lugar de depender de un solo camino. |
