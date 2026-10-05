---
order: 4
---

# El operador coma

El operador coma evalúa **dos expresiones en orden**, y solo conserva el valor de la **segunda**: la primera está ahí únicamente por su efecto secundario (un cambio que produce de paso, como incrementar una variable), su propio valor se descarta.

```c
int a = (1, 2);   // evalua 1 (descartado), luego 2: a vale 2
```

## Caso de uso: varias variables en un bucle `for`

El operador coma aparece con más frecuencia en un bucle [`for`](/?c=langages-de-programmation&s=c&p=boucles), para hacer avanzar **dos** variables en cada vuelta en lugar de una sola:

```c
for (int i = 0, j = 10; i < j; i++, j--) {
    printf("i = %d, j = %d\n", i, j);
}
```

- `i = 0, j = 10` inicializa las dos variables una tras otra.
- `i++, j--` incrementa `i` Y decrementa `j` en cada vuelta, en una sola de las tres partes del `for`.

Sin el operador coma, cada una de las tres partes del `for` solo puede contener una expresión: no hay forma de escribir directamente ahí dos instrucciones separadas por punto y coma.

## Trampa: no confundir con la coma-separador

El mismo carácter `,` tiene un papel completamente distinto en otros dos contextos muy frecuentes, que **no tienen nada que ver** con el operador coma:

| Contexto | Papel de la coma | Ejemplo |
|---|---|---|
| Operador coma | Evalúa ambos lados, conserva el valor del segundo | `(x++, y++)` |
| Separador de argumentos | Separa los argumentos de una llamada a función | `printf("%d %d", a, b)` |
| Separador de declaraciones | Separa varias variables declaradas juntas | `int a, b, c;` |

> **Trampa:** en `printf(a, b)`, la coma solo separa dos argumentos: `b` no es "el valor que se conserva" como haría el operador coma, ambos valores se pasan a la función por separado. El compilador distingue los dos usos por su **posición** (entre los paréntesis de una llamada, o en una declaración, frente a en medio de una expresión), no por un símbolo diferente.

## Trampa: el orden de evaluación de los argumentos no está especificado

A diferencia del operador coma, que garantiza «primero el lado izquierdo, luego el derecho», la coma que separa los argumentos de una llamada **no garantiza ningún orden**: el lenguaje C deja al compilador evaluar los argumentos en el orden que le convenga (se dice que el orden es **no especificado**). No se señala ningún error ni advertencia, y el resultado puede cambiar de un compilador u opción a otro.

```c
#include <stdio.h>

static int sumar_diez(int *n)
{
    *n += 10;       // modifica la variable del llamador (efecto secundario)
    return *n;      // devuelve el nuevo valor
}

int main(void)
{
    int x = 1;

    // x se lee y x se modifica en la misma llamada: el orden decide el resultado
    printf("%d %d\n", sumar_diez(&x), x);
    return 0;
}
```

| Orden elegido por el compilador | Salida |
|---|---|
| De izquierda a derecha: primero `sumar_diez(&x)`, luego la lectura de `x` | `11 11` |
| De derecha a izquierda: primero la lectura de `x`, luego `sumar_diez(&x)` | `11 1` |

Con gcc en x86-64, este programa muestra `11 1` (de derecha a izquierda), tanto en `-O0` como en `-O2`, pero otro compilador es libre de mostrar `11 11`. Una prueba que pasa en la máquina de desarrollo no demuestra, por tanto, nada sobre las demás.

La regla general: una misma variable nunca debe **modificarse** y **leerse** (o modificarse dos veces) en una misma expresión sin que el lenguaje imponga un orden entre ambas operaciones. Los lugares donde el orden está garantizado se llaman **puntos de secuencia**: el operador coma es uno, igual que `&&`, `||`, `?:` y el final de una instrucción terminada por `;`.

| Escritura | Estado | Por qué |
|---|---|---|
| `f(g(&x), x)` | Orden no especificado | Los argumentos no tienen orden entre sí |
| `t[i++] = i;` | **Comportamiento indefinido** | `i` se modifica y se lee sin punto de secuencia entre ambas operaciones: el programa puede hacer cualquier cosa (gcc avisa con `-Wall`) |
| `(a = f(), b = g())` | Orden garantizado | El operador coma impone izquierda y luego derecha |

> **Buena práctica:** calcular primero en una variable y luego pasar la variable. Una instrucción por efecto secundario hace explícito el orden y el resultado idéntico en todas partes.

```c
int resultado = sumar_diez(&x);      // 1.ª instrucción: el efecto secundario
printf("%d %d\n", resultado, x);     // 2.ª instrucción: x ya está modificada, siempre "11 11"
```

## El idioma `return printf(...), NULL;`

```c
char *buscar_o_mostrar_error(char *clave)
{
    char *resultado = buscar(clave);
    if (resultado != NULL) {
        return resultado;
    }
    return printf("Error: clave no encontrada\n"), NULL;
}
```

`printf(...)` se ejecuta por su efecto secundario (mostrar el mensaje), luego el operador coma descarta su valor de retorno y lo sustituye por `NULL`: la función siempre devuelve `NULL` en este caso, sea lo que sea que `printf()` haya devuelto. Una sola expresión hace a la vez la impresión y el `return`, sin variable intermedia.

> **Buena práctica:** este idioma sigue siendo poco frecuente y se lee peor que una versión en dos líneas (`printf(...); return NULL;`). Reservar el operador coma para el bucle `for` con varias variables, donde es idiomático y ampliamente reconocido; evitarlo en cualquier otro caso, en favor de la legibilidad.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El operador coma (`expr1, expr2`) evalúa ambas expresiones en orden y solo conserva el valor de la segunda. El mismo carácter `,` también separa los argumentos de una llamada o las variables de una declaración: dos papeles distintos, nunca el operador coma en esos casos. Solo el operador coma garantiza un orden: los argumentos de una llamada se evalúan en un orden no especificado. |
| **Herramientas utilizables** | `expr1, expr2` para combinar dos instrucciones en una sola expresión, típicamente `i++, j--` en un `for`. |
| **Trampas a evitar** | Confundir el operador coma con la coma que separa argumentos (`printf(a, b)`) o declaraciones (`int a, b;`): son dos usos sintácticos distintos del mismo carácter. Leer y modificar la misma variable entre los argumentos de una misma llamada (`f(g(&x), x)`): el resultado depende del compilador. |
| **Buenas prácticas** | Reservar el operador coma para bucles `for` con varias variables; preferir dos instrucciones separadas en cualquier otro caso, por legibilidad. Calcular en una variable antes de la llamada en cuanto un argumento tenga un efecto secundario. |
