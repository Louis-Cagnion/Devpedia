---
order: 10
---

# Las bibliotecas

Una **biblioteca** (*library*) agrupa funciones ya compiladas, reutilizables por cualquier programa sin necesidad de recompilar el código fuente: así es como funciona, por ejemplo, la biblioteca estándar de C (`printf`, `malloc`...). Existen dos formas de enlazar una biblioteca a un programa: de forma estática o dinámica.

## Biblioteca estática (`.a`)

El código de la biblioteca se **copia directamente** en el ejecutable final, en el momento de [la edición de enlaces](/?c=langages-de-programmation&s=c&p=compilation).

```text
// 1. compilar cada archivo fuente en .o
gcc -c calculos.c -o calculos.o

// 2. agrupar el/los .o en un archivo estático
ar rcs libcalculos.a calculos.o

// 3. enlazar el programa con esta biblioteca
gcc main.c -L. -lcalculos -o programa
```

- `ar` (*archiver*) reúne uno o varios archivos `.o` en un único archivo `.a`.
- `-L.` indica a [`gcc`](https://gcc.gnu.org) que busque también las bibliotecas en el directorio actual.
- `-lcalculos` solicita enlazar `libcalculos.a` (se sobreentienden el prefijo `lib` y el sufijo `.a`).

| Ventaja | Inconveniente |
|---|---|
| Ejecutable autónomo, sin dependencia externa que instalar | Mayor tamaño del ejecutable |
| Sin riesgo de que una versión diferente de la biblioteca rompa el programa más adelante | Una actualización de la biblioteca obliga a recompilar el programa |

## Biblioteca dinámica (`.so` en Linux, `.dll` en Windows)

El código de la biblioteca permanece en un archivo **separado**, cargado en memoria al lanzar el programa (o incluso durante su ejecución). Varios programas pueden entonces compartir una sola copia de la biblioteca en memoria.

```text
gcc -shared -fPIC calculos.c -o libcalculos.so
gcc main.c -L. -lcalculos -o programa

// al lanzar el programa, el sistema debe saber dónde encontrar libcalculos.so:
LD_LIBRARY_PATH=. ./programa
```

- `-fPIC` (*Position Independent Code*) genera código capaz de funcionar sea cual sea la dirección de memoria en la que se cargue: necesario para una biblioteca compartida, cargada en un lugar diferente según el programa.
- Sin `LD_LIBRARY_PATH` (o una instalación en un directorio del sistema estándar como `/usr/lib`), el sistema no sabe dónde buscar `libcalculos.so` al lanzarse, y el programa se niega a arrancar.

| Ventaja | Inconveniente |
|---|---|
| Ejecutable más ligero | Dependencia externa: la biblioteca debe estar presente en la máquina que ejecuta el programa |
| Una biblioteca compartida por varios programas ahorra memoria | Una actualización incompatible de la biblioteca puede romper un programa sin recompilación |

## Resumen

| | Estática (`.a`) | Dinámica (`.so`) |
|---|---|---|
| ¿Copiada en el ejecutable? | Sí | No (se carga por separado) |
| ¿Cuándo se enlaza? | En la compilación | Al lanzar el programa (o durante su ejecución) |
| Actualización de la biblioteca | Requiere recompilar el programa | El programa se beneficia de la actualización sin recompilación |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una biblioteca estática (`.a`) se copia en el ejecutable en la compilación; una biblioteca dinámica (`.so`/`.dll`) permanece separada, se carga al lanzar el programa, y puede compartirse entre programas. |
| **Herramientas utilizables** | `ar` (archivo estático), `gcc -shared -fPIC` (biblioteca dinámica), `-L`/`-l` para enlazar. |
| **Trampas a evitar** | Olvidar `LD_LIBRARY_PATH` (o una instalación del sistema): el programa se niega a arrancar, al no encontrar la biblioteca dinámica. |
| **Buenas prácticas** | Elegir estática para un ejecutable autónomo sin dependencia que gestionar, dinámica para ahorrar memoria/tamaño cuando varios programas comparten la misma biblioteca. |
