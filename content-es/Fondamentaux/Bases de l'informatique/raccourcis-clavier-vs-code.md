---
order: 4
---

# Ser eficiente con el código gracias a los atajos de teclado

Una vez instalado [VS Code](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide), el ratón sigue sirviendo para todo, pero cada ida y vuelta hacia él cuesta un tiempo que un atajo de teclado ahorra. Este capítulo cubre los atajos de VS Code más útiles en el día a día; en macOS, `Ctrl` se convierte en `Cmd` para la mayoría de ellos.

## Moverse en el árbol del proyecto

| Atajo | Acción |
|---|---|
| `Ctrl+Mayús+E` | Abrir/cerrar el explorador de archivos (el árbol del proyecto, en el lateral) |
| `Ctrl+P` | Abrir un archivo por su nombre, sin navegar por el árbol con el ratón |
| Flechas arriba/abajo en el explorador | Moverse al archivo/carpeta siguiente o anterior |
| Flecha derecha/izquierda sobre una carpeta | Desplegar/plegar esa carpeta |

`Ctrl+P` es el que más tiempo ahorra en el día a día: escribir unas pocas letras del nombre de un archivo lo abre directamente, sin desplegar nunca el árbol a mano para encontrarlo.

## Moverse rápidamente dentro de un archivo

| Atajo | Acción |
|---|---|
| `Ctrl+G` | Ir directamente a un número de línea |
| `Ctrl+Mayús+O` | Ir a un símbolo del archivo (una función, una clase...) por su nombre |
| `Ctrl+Flecha izquierda/derecha` | Saltar de una palabra a la siguiente/anterior, en lugar de un carácter a la vez |
| `Ctrl+Arriba/Abajo` (o `Alt+Flecha` según la disposición) | Saltar al bloque de código siguiente/anterior |

`Ctrl+Mayús+O` se apoya en el mismo análisis del código que la [detección de errores de un IDE](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide): VS Code ya sabe dónde empieza cada función o clase del archivo, este atajo simplemente salta ahí directamente en lugar de desplazarse por el archivo a ojo.

## Selección múltiple y multicursor

El multicursor coloca varios puntos de inserción activos a la vez: una pulsación de tecla se aplica entonces a todos los cursores al mismo tiempo, en lugar de a uno solo.

```text
Antes (1 cursor)               Despues de Alt+Clic x3 (3 cursores)

nombre = "Alicia"               nombre = "Alicia"
nombre2 = "Bob"                 nombre2 = "Bob"
nombre3 = "Eva"                 nombre3 = "Eva"
                                 ^ cada | representa un cursor activo
```

| Atajo | Acción |
|---|---|
| `Alt+Clic` | Añadir un cursor en el lugar clicado |
| `Ctrl+D` | Seleccionar la siguiente aparición de la palabra ya seleccionada (repetir para seleccionar varias de una vez) |
| `Ctrl+Mayús+L` | Seleccionar **todas** las apariciones de la palabra ya seleccionada en el archivo |
| `Ctrl+Alt+Arriba/Abajo` | Añadir un cursor directamente encima/debajo del cursor actual |

> **Trampa:** usar pulsaciones repetidas de `Ctrl+D` para renombrar una variable en todos los sitios donde aparece en el archivo. Es un renombrado **textual**, a ciegas: también afecta a un nombre de variable que comparta el mismo texto por coincidencia dentro de un comentario o una cadena de caracteres.
>
> **Buena práctica:** para renombrar una variable en todos los sitios donde realmente se usa en el código (sin tocar comentarios o coincidencias textuales), usar el renombrado de símbolo del IDE (`F2` en VS Code) en lugar del multicursor.

## Gestionar las pestañas de archivos abiertos

| Atajo | Acción |
|---|---|
| `Ctrl+W` | Cerrar la pestaña activa |
| `Ctrl+Mayús+T` | Reabrir la última pestaña cerrada |
| `Ctrl+Tab` | Pasar a la siguiente pestaña |
| `Ctrl+K` y luego `Ctrl+W` | Cerrar todas las pestañas abiertas |

## Vista previa de Markdown

Para un archivo `.md` (como este), `Ctrl+Mayús+V` abre una vista previa que muestra el resultado final renderizado (títulos, tablas, enlaces) junto al texto fuente, sin salir del editor para comprobar el formato.

## La paleta de comandos: más allá de los atajos fijos

`Ctrl+Mayús+P` abre la **paleta de comandos**: una búsqueda textual que da acceso a cualquier acción de VS Code, incluidas las que no tienen un atajo de teclado dedicado.

> **Buena práctica:** ante una acción repetida cuyo atajo no se conoce de memoria, abrir la paleta de comandos y escribir unas palabras de lo que se busca hacer, en lugar de buscar con el ratón en los menús. La paleta también muestra el atajo asociado junto a cada comando encontrado, lo que ayuda a memorizarlo con el uso.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `Ctrl+P` abre un archivo por su nombre, `Ctrl+Mayús+O` salta a un símbolo del archivo, `Alt+Clic`/`Ctrl+D` colocan varios cursores para editar en varios sitios a la vez, `Ctrl+Mayús+P` abre la paleta de comandos que da acceso a cualquier acción del editor. |
| **Herramientas utilizables** | La paleta de comandos (`Ctrl+Mayús+P`) para encontrar una acción sin conocer su atajo. |
| **Trampas a evitar** | Renombrar una variable con el multicursor (`Ctrl+D` repetido) en lugar del renombrado de símbolo (`F2`): también afecta a coincidencias textuales dentro de comentarios y cadenas de caracteres. |
| **Buenas prácticas** | Usar `F2` para un renombrado de variable fiable. Consultar la paleta de comandos para descubrir y memorizar progresivamente los atajos. |
