---
order: 5
---

# Estructura de archivos y rutas

Un [archivo](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) no flota solo en el disco: está guardado en una carpeta, ella misma guardada en otra carpeta. Este capítulo explica cómo funciona esta organización, y cómo designar precisamente un archivo dentro de ella.

## La carpeta: guardar archivos, y otras carpetas

Una **carpeta** (o **directorio**, *directory*) contiene archivos, y también puede contener otras carpetas. Repitiendo esto varios niveles de profundidad, se obtiene una estructura en árbol: la **jerarquía de carpetas**.

```text
Documentos/
├── fotos/
│   ├── vacaciones.jpg
│   └── familia.jpg
└── trabajo/
    └── informe.docx
```

> **Analogía:** como carpetas de clasificación guardadas en cajones, ellos mismos guardados en un armario: encontrar una hoja precisa requiere conocer el armario, el cajón, y luego la carpeta.

> **Trampa:** eliminar una carpeta elimina **todo** su contenido con ella, incluidas las carpetas que contiene, a menudo sin pedir confirmación por archivo individualmente.
>
> **Buena práctica:** antes de eliminar una carpeta, verificar su contenido (listar lo que contiene) en lugar de suponer que está vacía o sin importancia.

## La ruta: la dirección completa de un archivo

Una **ruta** (*path*) describe dónde encontrar un archivo o una carpeta, listando las carpetas a atravesar, separadas por un carácter que depende del sistema:

| Sistema | Separador | Ejemplo |
|---|---|---|
| Linux / macOS | `/` | `Documentos/fotos/vacaciones.jpg` |
| Windows | `\` | `Documentos\fotos\vacaciones.jpg` |

> **Trampa:** copiar una ruta de Windows (con `\`) en una terminal Linux/macOS. En estos sistemas, `\` no es un separador: es un carácter de escape que cambia el sentido del carácter siguiente: la ruta no se interpretará como se esperaba.
>
> **Buena práctica:** usar siempre el separador del sistema en el que se ejecuta realmente el comando, nunca el de la máquina donde la ruta se escribió originalmente.

## Ruta absoluta vs ruta relativa

| | Ruta absoluta | Ruta relativa |
|---|---|---|
| Punto de partida | La **raíz** (siempre la misma, sin importar dónde se esté) | La **carpeta actual** (donde la terminal "se encuentra" actualmente) |
| A qué se parece | `/home/juan/Documentos/informe.docx` (Linux) o `C:\Users\juan\Documentos\informe.docx` (Windows) | `Documentos/informe.docx`, si ya se está en `/home/juan` |
| Ventaja | Funciona desde cualquier lugar | Más corta de escribir, y sigue siendo válida si todo el proyecto se mueve junto |

La **raíz** es la primerísima carpeta de la estructura, aquella de la que derivan todas las demás: `/` en Linux/macOS, una letra de unidad (`C:\`) en Windows. La **carpeta actual** (*current working directory*) es el lugar donde estás "posicionado" en esta estructura en un momento dado: es precisamente lo que el [prompt de la terminal](/?c=bases-de-l-informatique&p=le-terminal) muestra a veces, sin que aún se supiera qué significaba.

> **Trampa:** usar una ruta relativa suponiendo estar en la carpeta actual correcta, sin haberlo verificado. El mismo comando, con la misma ruta relativa, puede actuar sobre un archivo totalmente diferente según el lugar desde donde se lance.
>
> **Buena práctica:** en caso de duda, mostrar la carpeta actual antes de un comando que modifica o elimina un archivo vía una ruta relativa; una ruta absoluta elimina completamente este riesgo, al precio de ser más larga de escribir.

## Dos atajos universales: `.` y `..`

Sea cual sea el shell, dos notaciones siempre designan lo mismo, de forma relativa:

| Notación | Designa |
|---|---|
| `.` | La carpeta actual misma |
| `..` | La carpeta padre, un nivel por encima |

```text
Documentos/fotos/../trabajo/informe.docx
                 └─┬─┘
                   └── sube un nivel (sale de "fotos"), luego baja a "trabajo"
```

> **Trampa:** olvidar el espacio entre el comando de desplazamiento y `..` (escribir `cd..` en lugar de `cd ..`). Sin el espacio, el shell lee una sola palabra (`cd..`) que no reconoce como ningún comando, en lugar del comando `cd` seguido del argumento `..`.
>
> **Buena práctica:** ante un mensaje inesperado de "comando no encontrado" en un comando por lo demás correcto, verificar primero los espacios antes de la puntuación.

## Moverse y listar desde la terminal

Cambiar de carpeta actual y listar el contenido de una carpeta son dos acciones básicas, pero el nombre exacto de los comandos depende del shell usado, ya visto en el [capítulo sobre la terminal](/?c=bases-de-l-informatique&p=le-terminal):

- En [Bash](/?c=shells&s=bash&p=bash): ver [Permisos y manipulación de archivos](/?c=shells&s=bash&p=permissions-et-fichiers).
- En [PowerShell](/?c=shells&s=powershell&p=powershell): ver [Comandos básicos](/?c=shells&s=powershell&p=commandes-de-base).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Los archivos se guardan en carpetas, organizadas en una estructura de árbol. Una **ruta** describe su ubicación: **absoluta** desde la raíz (siempre válida), o **relativa** desde la **carpeta actual** (más corta). `.` designa la carpeta actual, `..` su padre. |
| **Herramientas utilizables** | Los comandos de navegación y listado propios de tu shell (ver los capítulos Bash/PowerShell enlazados arriba). |
| **Trampas a evitar** | Usar una ruta relativa suponiendo estar en la carpeta actual correcta, sin haberlo verificado: el mismo comando puede entonces actuar sobre un archivo totalmente diferente según desde dónde se lance. |
| **Buenas prácticas** | En caso de duda sobre dónde se está, verificar la carpeta actual antes de lanzar un comando que modifica o elimina un archivo vía una ruta relativa. |
