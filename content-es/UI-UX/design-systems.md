---
order: 9
---

# Design systems

Los capítulos anteriores (color, tipografía, espaciado, jerarquía) dan principios; en un producto de una sola página, aplicar cada uno caso por caso basta. Pasadas unas decenas de pantallas y varias personas que las diseñan, volver a aplicar estas decisiones a mano en cada pantalla nueva termina divergiendo: dos botones "principales" con un azul ligeramente diferente, un espaciado que varía de una pantalla a otra sin razón. Un **design system** es la respuesta organizativa a este problema: un conjunto único de reglas, valores y componentes reutilizables, al que toda nueva interfaz recurre en lugar de redecidir cada detalle.

## Los design tokens: nombrar los valores en lugar de repetirlos

Un **design token** es un valor de diseño (un color, un espaciado, un radio de borde) al que se le da un nombre, para referenciarlo en todas partes en lugar de copiarlo:

| Categoría | Ejemplo de token | Valor | Viene de |
|---|---|---|---|
| Color | `color-acento` | El azul de acento elegido para las acciones principales | [Color y contraste](/?c=ui-ux&p=couleur-et-contraste) (armonía, contraste WCAG) |
| Espaciado | `espacio-m` | 16px | [Espaciado y cuadrícula](/?c=ui-ux&p=espacement-et-grille) (escala coherente) |
| Radio de borde | `radio-estandar` | 8px | Decisión de estilo propia del producto |
| Tipografía | `texto-titulo` | Familia, tamaño y peso de un título | [Tipografía](/?c=ui-ux&p=typographie) (escala, pairing) |

Un token no reemplaza ninguno de los principios ya vistos (una escala de espaciado coherente, un contraste suficiente...): les da un nombre reutilizable, una vez elegido el valor. Técnicamente, un token se traduce casi siempre en una [variable CSS](/?c=langages-de-balisage&s=css&p=variables-et-cascade): este capítulo se queda en el nivel de la decisión de diseño, no de su sintaxis de implementación.

> **Trampa:** hacer coexistir, para un mismo valor, un token Y ocurrencias fijas en otras partes del producto (un botón que referencia `color-acento`, otro que escribe directamente el código de color). Cambiar el token entonces solo corrige una parte de los casos: exactamente el problema que una [fuente única de verdad](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) debería evitar.
>
> **Buena práctica:** una vez creado un token, hacer que su valor se referencie en todos los lugares donde aparece, sin excepción puntual "solo por esta vez": una sola ocurrencia fija basta para romper la coherencia que el token debería garantizar.

## La biblioteca de componentes: construir una vez, reutilizar en todas partes

Una **biblioteca de componentes** agrupa los elementos de interfaz recurrentes (botón, campo de formulario, tarjeta, menú) construidos una sola vez a partir de los tokens, y luego reutilizados en cada pantalla en lugar de rediseñados:

```text
Sin biblioteca                 Con biblioteca
------------------------       ------------------------
Pantalla A: boton "Validar"    Pantalla A: <BotonPrincipal>
Pantalla B: boton "Validar"    Pantalla B: <BotonPrincipal>
  (rediseñado independiente-     (mismo componente, una sola
   mente, ligera variacion)       fuente, garantizado identico)
```

> **Trampa:** duplicar un componente existente para adaptarlo ligeramente a una nueva pantalla ("parto del botón existente pero cambio solo este detalle"), en lugar de hacer evolucionar el componente original. La copia diverge inevitablemente del original con los retoques posteriores, y el producto termina con varias versiones ligeramente diferentes del "mismo" componente.
>
> **Buena práctica:** hacer evolucionar el componente compartido en sí (con un parámetro para la variación necesaria, si es legítima) en lugar de duplicarlo: la misma lógica de [fuente única de verdad](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) y [evitar la repetición](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees) ya vistas del lado del código se aplica igualmente a los elementos de interfaz.

## Trampa: construir un design system antes de tener pantallas reales

Un design system surge de patrones que se repiten realmente en varias pantallas ya diseñadas, no de una anticipación de lo que algún día podría repetirse.

> **Trampa:** construir una biblioteca de componentes exhaustiva antes incluso de haber diseñado algunas pantallas reales del producto. Sin casos de uso reales con los que contrastarlos, los componentes anticipados a menudo no corresponden a las necesidades que surgen una vez que el producto está realmente diseñado: un tiempo invertido en generalizar una necesidad todavía hipotética.
>
> **Buena práctica:** dejar que un design system emerja progresivamente a partir de pantallas reales (extraer un componente una vez que un patrón se ha repetido 2 o 3 veces), en lugar de diseñarlo íntegramente de antemano.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un design system nombra los valores de diseño en tokens reutilizables (color, espaciado, tipografía...) y construye una biblioteca de componentes a partir de ellos, para mantener un producto coherente más allá de lo que una sola persona puede decidir pantalla por pantalla. Emerge de patrones reales en lugar de anticiparse. |
| **Herramientas utilizables** | Tokens de diseño (a menudo [variables CSS](/?c=langages-de-balisage&s=css&p=variables-et-cascade)); una biblioteca de componentes compartida. |
| **Trampas a evitar** | Dejar que un valor fijo coexista con un token que lo reemplaza. Duplicar un componente en lugar de hacer evolucionar el original. Construir un design system completo antes de tener pantallas reales a partir de las cuales generalizar. |
| **Buenas prácticas** | Referenciar un token en todos los lugares donde aparece su valor, sin excepción. Hacer evolucionar un componente compartido en lugar de duplicarlo. Dejar que un design system emerja progresivamente de un patrón repetido varias veces. |
