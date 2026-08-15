---
order: 3
---

# Tipografía

El tamaño y el peso del texto ya se han presentado como palancas de [jerarquía visual](/?c=ui-ux&p=hierarchie-visuelle). Este capítulo va más allá: qué fuentes elegir, y cómo combinarlas sin perjudicar la legibilidad.

## Las familias de fuentes

Toda fuente pertenece a una de estas tres familias:

| Familia | Característica visual | Connotación | Uso típico | Ejemplos |
|---|---|---|---|---|
| Serif (con serifas) | Pequeños trazos en los extremos de las letras | Confianza, tradición | Impreso, textos largos | Georgia, Times New Roman, Merriweather |
| Sans-serif (sin serifas) | Líneas nítidas, sin decoración | Moderno, depurado | Interfaces en pantalla (la mayoría de los sitios) | Helvetica, Arial, Inter, Roboto |
| Monoespaciada | Cada carácter ocupa exactamente el mismo ancho | Técnico, preciso | Código, datos tabulares | Courier New, Fira Code, Consolas |

> **Por qué importa:** una fuente mal elegida envía una señal contraria al mensaje. Una fuente manuscrita en un sitio bancario, por ejemplo, contradice la seriedad esperada del contenido, aunque el texto siga siendo perfectamente legible.

## Jerarquía tipográfica: una escala, no tamaños al azar

Los tamaños y pesos usados en un sitio deben seguir una escala definida de antemano, no elegirse caso por caso:

| Elemento | Tamaño indicativo | Peso |
|---|---|---|
| Título principal (`h1`) | 32-48px | Negrita (700) |
| Subtítulo (`h2`) | 24-32px | Seminegrita (600) |
| Título de sección (`h3`) | 18-24px | Seminegrita (600) |
| Cuerpo de texto | 16px | Normal (400) |
| Texto secundario | 14px | Normal (400) |

> **Trampa:** usar más de 2-3 fuentes diferentes en un mismo proyecto. Cada fuente adicional añade ruido visual y diluye la [jerarquía](/?c=ui-ux&p=hierarchie-visuelle) en lugar de reforzarla.
>
> **Buena práctica:** limitarse a 2-3 fuentes por proyecto: típicamente una para los títulos, una para el cuerpo del texto, y eventualmente una monoespaciada reservada al código o a los datos.

## Legibilidad: longitud de línea, interlineado, espaciado

Tres ajustes determinan si un texto se lee cómodamente o cansa la vista:

| Ajuste | Valor recomendado | Efecto si está mal ajustado |
|---|---|---|
| Longitud de línea | ~50-75 caracteres | Demasiado larga: el ojo pierde el hilo al volver a la línea siguiente. Demasiado corta: la lectura se entrecorta con saltos de línea demasiado frecuentes |
| Interlineado (*line-height*) | 1.4 a 1.6 veces el tamaño del texto | Demasiado apretado: las líneas se superponen visualmente. Demasiado espaciado: el texto pierde cohesión, parece desarticulado |
| Espaciado entre letras | Valor por defecto de la fuente, salvo caso particular | Un espaciado reducido en un título en mayúsculas reduce la legibilidad; ampliarlo ligeramente ayuda, al contrario |

```text
❌ Demasiado larga (pagina a ancho completo, mas de 100 caracteres por linea): el ojo debe
   recorrer una distancia demasiado grande para volver al inicio de la linea siguiente.

✅ Correcta (~65 caracteres por linea): el ojo encuentra facilmente el inicio
   de la linea siguiente, la lectura se mantiene fluida en todo el texto.
```

## El pairing: combinar dos fuentes

El **pairing** consiste en elegir una fuente para los títulos y otra para el cuerpo del texto:

| Títulos | Cuerpo de texto | Por qué funciona |
|---|---|---|
| Playfair Display (serif) | Inter (sans-serif) | Contraste marcado entre ambas: cada una sigue siendo identificable en su rol |
| Montserrat (sans-serif, negrita) | Open Sans (sans-serif, normal) | Mismo estilo general, distinción por el peso más que por la forma de las letras |

> **Trampa:** combinar dos fuentes que se parecen casi por completo, sin ser idénticas. El resultado parece un error (la fuente equivocada aplicada por descuido) más que una elección deliberada.
>
> **Buena práctica:** apuntar a un contraste claro entre las dos fuentes (estilos claramente diferentes), o en su defecto quedarse en la misma familia jugando con el peso, nunca un término medio ambiguo.

> **Tendencia actual (2026):** una tipografía audaz y sobredimensionada, a veces voluntariamente "desordenada", usada como elemento central de la identidad visual en lugar de como simple vestimenta del texto.

## Pasar a la implementación

Al igual que con una paleta de colores, una escala de tamaños y una lista de fuentes se declaran en CSS como valores reutilizables: ver [Variables CSS y la cascada](/?c=langages-de-balisage&s=css&p=variables-et-cascade).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Cada fuente pertenece a una familia (serif, sans-serif, monoespaciada) con una connotación propia. Una escala coherente de tamaños/pesos y una legibilidad cuidada (longitud de línea, interlineado) priman sobre la elección estética de las fuentes en sí. |
| **Herramientas utilizables** | Ninguna herramienta específica: la elección y la escala de fuentes se deciden en el diseño, y luego se declaran en CSS. |
| **Trampas a evitar** | Usar más de 2-3 fuentes en un mismo proyecto; combinar dos fuentes demasiado parecidas visualmente sin que sea una elección deliberada. |
| **Buenas prácticas** | Limitar el proyecto a un máximo de 2-3 fuentes; apuntar a un contraste claro entre la fuente de título y la de cuerpo (o quedarse en la misma familia jugando con el peso). |
