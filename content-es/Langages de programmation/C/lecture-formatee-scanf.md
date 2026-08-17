---
order: 20
---

# La lectura formateada: `scanf` y `sscanf`

El capítulo sobre las [funciones variádicas](/?c=langages-de-programmation&s=c&p=fonctions-variadiques) cubre `printf`: convertir valores tipados en una cadena de caracteres formateada. `scanf` (y su variante `sscanf`) realiza la operación **inversa**: extraer valores tipados a partir de una cadena, siguiendo un formato dado.

## `sscanf`: extraer valores de una cadena

```c
#include <stdio.h>

int jour, mois, annee;
int trouves = sscanf("25/12/2026", "%d/%d/%d", &jour, &mois, &annee);

// trouves vale 3: jour=25, mois=12, annee=2026
```

`sscanf` lee la cadena fuente comparándola con el formato dado: cada `%d`/`%s`/`%f`... consume la parte correspondiente de la cadena y escribe el valor convertido en la dirección proporcionada (de ahí el `&` delante de cada variable, como para todo puntero de salida en C). Los caracteres del formato que **no** son un especificador (la `/` aquí) deben aparecer **tal cual** en la cadena fuente para que el parsing continúe.

| Especificador | Tipo esperado | Ejemplo de cadena fuente |
|---|---|---|
| `%d` | `int` | `"42"` |
| `%f` | `float` | `"3.14"` |
| `%c` | `char` (un solo carácter) | `"a"` |
| `%s` | Cadena de caracteres (`char*`), se detiene en el primer espacio | `"hola"` |

## El valor de retorno: el número de campos realmente leídos

`sscanf` devuelve el **número de conversiones exitosas**, no un simple éxito/fracaso binario: una información indispensable, porque el parsing puede detenerse en plena mitad del formato sin provocar un error visible:

```c
int jour, mois, annee;
int trouves = sscanf("25-12", "%d/%d/%d", &jour, &mois, &annee);

// trouves vale 0: el primer "/" esperado no corresponde con el "-" real,
// el parsing se detiene antes incluso de leer "jour" -> jour queda SIN INICIALIZAR
```

> **Trampa:** ignorar el valor de retorno de `sscanf` y usar directamente las variables que se suponía debían llenarse. Si el formato no corresponde completamente a la cadena fuente, algunas variables **nunca se escriben**: leerlas después lee un valor no inicializado, un comportamiento indefinido que puede funcionar "por casualidad" en pruebas y fallar silenciosamente en otro lugar.
>
> **Buena práctica:** siempre comparar el valor de retorno de `sscanf` con el número de campos esperados antes de usar las variables llenadas, exactamente como se comprobaría el código de retorno de cualquier llamada al sistema (ver [Las llamadas al sistema y los descriptores de archivo](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs)).

## `%s` sin límite: un riesgo de desbordamiento de búfer

A diferencia de `%d`/`%f`, que siempre escriben un tamaño fijo, `%s` copia una cadena de **longitud variable** en el búfer proporcionado, sin verificar nunca su tamaño:

```c
char nom[16];
sscanf(entree_utilisateur, "%s", nom);   // si entree_utilisateur tiene mas de 15 caracteres: desbordamiento de bufer
```

> **Trampa:** la misma clase de vulnerabilidad ya encontrada con las cadenas de formato de `printf` (ver el capítulo sobre las [funciones variádicas](/?c=langages-de-programmation&s=c&p=fonctions-variadiques)): una entrada no controlada que supera el tamaño del búfer escribe fuera de la memoria que se le ha asignado.
>
> **Buena práctica:** siempre limitar `%s` con un ancho máximo explícito, `%15s` para un búfer de 16 bytes (15 caracteres + el `\0` final), nunca un `%s` desnudo sobre una entrada cuyo tamaño no está garantizado.

## Reimplementar `sscanf`: un ejercicio clásico

Escribir su propia versión simplificada de `sscanf` (a menudo llamada `ft_sscanf` en los ejercicios que lo piden) es un ejercicio habitual para entender este mecanismo desde dentro: la función debe ser ella misma [variádica](/?c=langages-de-programmation&s=c&p=fonctions-variadiques) (recibe un número variable de punteros de salida, guiada como `printf` por los `%` de la cadena de formato), y recorrer simultáneamente la cadena fuente y la cadena de formato carácter por carácter, avanzando en una sola de ellas cuando un especificador del formato le corresponde.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `sscanf` extrae valores tipados de una cadena según un formato, la operación inversa de `printf`. Su valor de retorno indica el número de campos realmente leídos, no un simple éxito/fracaso. |
| **Herramientas utilizables** | `sscanf(source, format, ...)`, un ancho máximo explícito (`%15s`) para limitar una lectura de cadena. |
| **Trampas a evitar** | Usar una variable sin comprobar que `sscanf` la haya llenado realmente. Leer una cadena con `%s` sin límite de tamaño sobre una entrada no controlada. |
| **Buenas prácticas** | Siempre comparar el valor de retorno de `sscanf` con el número de campos esperados. Siempre limitar `%s` con un ancho máximo explícito. |
