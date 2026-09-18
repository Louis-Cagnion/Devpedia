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
| **Para recordar** | El operador coma (`expr1, expr2`) evalúa ambas expresiones en orden y solo conserva el valor de la segunda. El mismo carácter `,` también separa los argumentos de una llamada o las variables de una declaración: dos papeles distintos, nunca el operador coma en esos casos. |
| **Herramientas utilizables** | `expr1, expr2` para combinar dos instrucciones en una sola expresión, típicamente `i++, j--` en un `for`. |
| **Trampas a evitar** | Confundir el operador coma con la coma que separa argumentos (`printf(a, b)`) o declaraciones (`int a, b;`): son dos usos sintácticos distintos del mismo carácter. |
| **Buenas prácticas** | Reservar el operador coma para bucles `for` con varias variables; preferir dos instrucciones separadas en cualquier otro caso, por legibilidad. |
