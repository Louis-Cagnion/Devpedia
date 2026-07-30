---
order: 9
---

# Las bibliotecas

Una **biblioteca** (*library*) agrupa funciones ya compiladas, que pueden reutilizarse en cualquier programa sin necesidad de recompilar el código fuente; así es como funciona, por ejemplo, la biblioteca estándar de C (`printf`, `malloc`...). Hay dos formas de vincular una biblioteca a un programa: de forma estática o dinámica.

## Biblioteca estática (`.a`)

El código de la biblioteca se **copia directamente** en el ejecutable final durante la fase de enlace (véase el capítulo sobre la compilación).

```bash
// 1. compiler chaque fichier source en .o
gcc -c calculs.c -o calculs.o

// 2. regrouper le(s) .o dans une archive statique
ar rcs libcalculs.a calculs.o

// 3. lier le programme à cette bibliothèque
gcc main.c -L. -lcalculs -o programa
```

- `ar` (*archiver*) agrupa uno o varios archivos `.o` en un único archivo comprimido `.a`.
- `-L.` Indica a `gcc` que busque también las bibliotecas en el directorio actual.
- `-lcalculs` Solicitud de enlace a `libcalculs.a` (se sobreentienden el prefijo `lib` y el sufijo `.a`).

| Ventaja | Inconveniente |
|---|---|
| Ejecutable independiente, sin necesidad de instalar dependencias externas | Mayor tamaño del ejecutable |
| No hay riesgo de que una versión diferente de la biblioteca provoque un fallo en el programa más adelante | Una actualización de la biblioteca obliga a recompilar el programa |

## Biblioteca dinámica (`.so` en Linux, `.dll` en Windows)

El código de la biblioteca se almacena en un archivo **independiente**, que se carga en memoria al iniciar el programa (o incluso durante su ejecución). De este modo, varios programas pueden compartir una única copia de la biblioteca en memoria.

```bash
gcc -shared -fPIC calculs.c -o libcalculs.so
gcc main.c -L. -lcalculs -o programa

// au lancement, le système doit savoir où trouver libcalculs.so :
LD_LIBRARY_PATH=. ./programa
```

- `-fPIC` (*Position Independent Code*) genera código capaz de funcionar independientemente de la dirección de memoria en la que se cargue, algo necesario para una biblioteca compartida, que se carga en una ubicación diferente según el programa.
- Sin `LD_LIBRARY_PATH` (o una instalación en un directorio estándar del sistema como `/usr/lib`), el sistema no sabe dónde buscar `libcalculs.so` al iniciarse, y el programa no se inicia.

| Ventaja | Inconveniente |
|---|---|
| Ejecutable más ligero | Dependencia externa: la biblioteca debe estar presente en el equipo que ejecuta el programa |
| Una biblioteca compartida por varios programas ahorra memoria | Una actualización incompatible de la biblioteca puede hacer que un programa deje de funcionar sin necesidad de recompilarlo |

## Resumen

| | Estática (`.a`) | Dinámica (`.so`) |
|---|---|---|
| ¿Incluida en el ejecutable? | Sí | No — se carga por separado |
| ¿Cuándo se vincula? | Durante la compilación | Al iniciar el programa (o durante su ejecución) |
| Actualización de la biblioteca | Requiere recompilar el programa | El programa se beneficia de la actualización sin necesidad de recompilar |
