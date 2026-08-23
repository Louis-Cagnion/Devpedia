---
order: 4
---

# Espaciado y cuadrícula (layout)

El espaciado ya se ha presentado como palanca de [jerarquía visual](/?c=ui-ux&p=hierarchie-visuelle): más espacio alrededor de un elemento lo aísla y lo hace notar. Este capítulo trata el espaciado como un sistema completo (una cuadrícula y una escala coherentes), en lugar de como un ajuste puntual.

## El espacio negativo: una herramienta activa, no un vacío que llenar

El **espacio negativo** (*white space*) es el espacio vacío alrededor y entre los elementos de una pantalla. No es una carencia a corregir llenando cada píxel disponible: es una herramienta que deja respirar al contenido y reduce el esfuerzo de lectura.

> **Analogía:** el silencio en la música. Las pausas entre las notas forman parte de la pieza tanto como las notas mismas; sin ellas, todo se mezcla en un ruido continuo.

> **Trampa:** el "miedo al vacío": llenar cada espacio disponible con contenido o decoración, partiendo de la idea de que un espacio vacío es un espacio desperdiciado. Resultado: una sobrecarga visual (ya vista en el [capítulo 1](/?c=ui-ux&p=hierarchie-visuelle)) y una lectura más agotadora.
>
> **Buena práctica:** tratar el espacio vacío como un elemento de diseño de pleno derecho, decidido igual que el color o la tipografía, no como un resto que rellenar.

## El sistema de cuadrícula: columnas, canaletas, márgenes

Una **cuadrícula** estructura una página en zonas alineadas entre sí, en lugar de colocar cada elemento a ojo:

| Término | Definición | Rol |
|---|---|---|
| Columna | Una banda vertical en la que se alinea el contenido | Estructura la página en zonas coherentes entre sí |
| Canaleta (*gutter*) | El espacio vacío entre dos columnas | Separa visualmente el contenido de columnas vecinas |
| Margen | El espacio vacío entre el contenido y el borde de la pantalla | Impide que el contenido "se pegue" a los bordes |

```text
┌─margen──┬────col A────┬can┬────col B────┬can┬────col C────┬─margen──┐
│         │   Bloque 1   │   │   Bloque 2   │   │   Bloque 3   │         │
└─────────┴──────────────┴───┴──────────────┴───┴──────────────┴─────────┘
```

La convención más extendida en la web es una cuadrícula de 12 columnas: 12 se divide entre 2, 3, 4 y 6, lo que permite componer maquetaciones variadas (dos bloques iguales, tres bloques iguales, un tercio + dos tercios...) sin cambiar de cuadrícula.

> **Trampa:** alinear elementos "a ojo" en lugar de sobre una cuadrícula explícita. Los desfases de unos pocos píxeles que resultan de eso son invisibles tomados por separado, pero le dan a toda la página una impresión de incoherencia.
>
> **Buena práctica:** definir la cuadrícula (número de columnas, ancho de las canaletas) antes de colocar el menor elemento, y luego alinear sistemáticamente sobre ella.

## Una escala de espaciado coherente

En lugar de inventar un valor de espaciado caso por caso (5px aquí, 13px allá, 22px más allá), una escala fija en múltiplos de una unidad base (4px u 8px) cubre todas las necesidades:

| Múltiplo | Valor (base 8px) | Uso típico |
|---|---|---|
| ×1 | 8px | Entre elementos muy próximos (un icono y su texto) |
| ×2 | 16px | Entre elementos relacionados (los campos de un formulario) |
| ×3 | 24px | Entre subsecciones |
| ×4 | 32px | Entre grandes bloques de página |
| ×6 | 48px | Entre secciones principales |

> **Trampa:** elegir cada valor de espaciado caso por caso ("15px, se ve bien aquí"). Cada valor parece correcto por separado, pero su acumulación en todo el proyecto nunca forma un conjunto coherente.
>
> **Buena práctica:** definir esta escala una sola vez, al inicio del proyecto, y luego recurrir exclusivamente a ella, nunca un valor inventado puntualmente.

## El ritmo vertical

El **ritmo vertical** es un espaciado constante y predecible entre los bloques de contenido apilados verticalmente: títulos, párrafos, secciones.

```text
Titulo
                    ← siempre el mismo espacio despues de un titulo (×3, 24px)
Parrafo de texto...
                    ← siempre el mismo espacio entre dos parrafos (×2, 16px)
Parrafo de texto...
```

> **Trampa:** un espaciado vertical que varía sin razón de un bloque a otro (24px aquí, 30px allá). La página parece "desarticulada", aunque cada bloque tomado por separado parezca correcto.
>
> **Buena práctica:** asignar un espaciado fijo y reutilizado a cada tipo de transición (título → párrafo, párrafo → párrafo, sección → sección), tomado de la escala definida más arriba.

> **Tendencia actual (2026):** regreso a maquetaciones predecibles y reconocibles, en la misma lógica que el regreso a la claridad ya observado para la [jerarquía visual](/?c=ui-ux&p=hierarchie-visuelle), en lugar de cuadrículas experimentales.

## Pasar a la implementación

Una cuadrícula y un ritmo vertical se construyen concretamente con [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) o [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), y deben adaptarse al tamaño de la pantalla mediante [el diseño responsivo](/?c=langages-de-balisage&s=css&p=responsive-et-media-queries).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El espacio negativo es una herramienta activa, no un vacío que llenar. Una cuadrícula (columnas, canaletas, márgenes) alinea los elementos entre sí, y una escala de espaciado fija (múltiplos de 4 u 8px) garantiza un ritmo vertical coherente. |
| **Herramientas utilizables** | Ninguna herramienta específica: la cuadrícula y la escala se definen en el diseño, y luego se implementan en [CSS](/?c=langages-de-balisage&s=css&p=css) (Flexbox, Grid). |
| **Trampas a evitar** | Llenar cada espacio disponible por miedo al vacío; alinear elementos a ojo en lugar de sobre una cuadrícula; inventar un valor de espaciado caso por caso. |
| **Buenas prácticas** | Definir la cuadrícula y la escala de espaciado antes de colocar el menor elemento; reutilizar siempre los mismos valores de espaciado para un mismo tipo de transición. |
