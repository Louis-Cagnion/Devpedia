---
order: 1
---

# Las variables y tipos básicos

Como recordatorio, [una variable es una caja etiquetada que contiene un valor](/?c=bases-de-l-informatique&p=la-variable). Python es de **tipado dinámico**: una variable no tiene un tipo declarado de antemano, simplemente adopta el tipo del valor que se le asigna, y puede cambiar de tipo libremente a lo largo del programa (a diferencia de [PHP](/?c=langages-de-programmation&s=php&p=php) o [C](/?c=langages-de-programmation&s=c&p=c), donde el tipo de una propiedad/variable tipada permanece fijo una vez declarado).

## Declarar una variable

```python
edad = 25             # int
precio = 9.99         # float
nombre = "Devpedia"   # str
activo = True         # bool
nada = None           # equivalente a null/NULL

edad = "veinticinco"  # perfectamente válido: edad se convierte en un str, sin declarar nada
```

> **Nota:** a diferencia de PHP (`$variable`), Python no usa ningún símbolo particular para designar una variable: solo un nombre, en minúsculas con guiones bajos por convención (`nombre_usuario`, no `nombreUsuario`).

## Comprobar el tipo de una variable

```python
type(edad)             # <class 'int'>
isinstance(edad, int)  # True -> preferible a type() == int para las comprobaciones condicionales
```

## Los operadores

```python
a, b = 5, 3   # asignación múltiple en una sola línea

a + b   # 8
a - b   # 2
a * b   # 15
a / b   # 1.6666... -> división real, siempre un float
a // b  # 1 -> división entera (floor division)
a % b   # 2 -> módulo
a ** b  # 125 -> potencia

a == b   # False
a != b   # True
a and b  # Y lógico (no '&&')
a or b   # O lógico (no '||')
not a    # NO lógico (no '!')
```

> **Nota:** Python usa las palabras clave `and`/`or`/`not` en lugar de los símbolos `&&`/`||`/`!` que se encuentran en PHP, [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) o C.

## `==` e `is`: ¿el valor o el objeto?

Estos dos operadores se confunden a menudo aunque plantean dos preguntas diferentes:

| Operador | Compara | Pregunta planteada |
|---|---|---|
| `==` | el **valor** | "¿su contenido es idéntico?" |
| `is` | la **identidad** | "¿es el mismo objeto en memoria?" |

```python
a = [1, 2, 3]
b = [1, 2, 3]
c = a

a == b  # True  -> mismo contenido
a is b  # False -> dos listas distintas en memoria
a is c  # True  -> c y a designan el mismo objeto
```

Es exactamente la distinción entre comparación por **valor** y comparación por **referencia** que se encuentra en C con los punteros: `*p1 == *p2` (los valores apuntados) frente a `p1 == p2` (las direcciones). Ver el capítulo [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs) de C.

### Por qué `is None` y no `== None`

Para probar si una variable vale `None`, la convención Python es `is None`:

```python
if valor is None:  # recomendado
if valor == None:  # a evitar
```

Dos razones:

- `None` es un **singleton**: solo existe una única instancia en todo el programa. Probar la identidad es por tanto exacto por construcción, y ligeramente más rápido.
- `==` puede ser **redefinido** por una clase vía `__eq__`. Un objeto puede por tanto perfectamente responder `True` a `== None` sin ser `None`, lo que hace la prueba poco fiable.

Esto es lo que explica el patrón del centinela `None` usado para los argumentos por defecto mutables (ver el capítulo [Las funciones](/?c=langages-de-programmation&s=python&p=fonctions)).

> El mismo razonamiento se aplica a `True`/`False`, que también son singletons. En la práctica rara vez se escribe `is True`: se prueba directamente `if condicion:`.

## Las f-strings: insertar variables en texto

```python
nombre = "Juan"
edad = 25

print(f"{nombre} tiene {edad} años")    # Juan tiene 25 años
print(f"Dentro de 10 años: {edad + 10} años")  # una expresión real, no solo una variable
```

Las f-strings (prefijo `f` antes de las comillas) son el método moderno recomendado, que sustituye a `"{} tiene {} años".format(nombre, edad)` o a la concatenación con `+`.

### El indicador de conversión `!r`

```python
texto = ""
print(f"Recibido: {texto!r}")   # Recibido: '' -> repr(): muestra las comillas, así la cadena vacía se ve
print(f"Recibido: {texto}")     # Recibido:    -> inserción normal: nada que ver, ilegible en un mensaje de depuración
```

`!r` llama a `repr(x)` antes de la inserción (equivalente a `f"{repr(x)}"`): útil en un mensaje de error para distinguir `""` (cadena vacía) de `" "` (espacio), o más en general para ver el valor exacto recibido en lugar de su presentación "limpia". `!s` (`str(x)`, el comportamiento por defecto) y `!a` (`ascii(x)`, escapa los caracteres no-ASCII) también existen, más raramente útiles.

## Inmutabilidad de las cadenas de caracteres

Como en PHP, una cadena Python es **inmutable**: cualquier "modificación" crea en realidad una nueva cadena, nunca modifica la original en memoria.

```python
texto = "hola"
texto.upper()  # devuelve "HOLA", NO MODIFICA texto
print(texto)   # sigue siendo "hola"

texto = texto.upper()  # hay que reasignar para "conservar" el cambio
```

## Unir una lista en una cadena: `str.join()`

```python
palabras = ["Python", "es", "legible"]

" ".join(palabras)   # "Python es legible"
", ".join(palabras)  # "Python, es, legible"
"".join(palabras)    # "Pythoneslegible" -> separador vacío: ningún carácter entre los elementos
```

> **Trampa:** el orden está invertido respecto a la intuición de otros lenguajes: es el SEPARADOR quien llama a `.join()`, nunca la lista (`", ".join(palabras)`, no `palabras.join(", ")`). `.join()` también exige que todos los elementos ya sean cadenas; unir una lista de números lanza un `TypeError` sin una conversión previa (`", ".join(str(n) for n in numeros)`).

## Dividir un texto en líneas: `str.splitlines()`

```python
texto = "linea1\nlinea2\r\nlinea3"

texto.splitlines()  # ["linea1", "linea2", "linea3"]     -> reconoce \n Y \r\n, ningún \n en el resultado
texto.split("\n")   # ["linea1", "linea2", "linea3\r"]   -> "\r" queda pegado a "linea3"
```

`.splitlines()` reconoce tanto `\n` (fin de línea Unix) como `\r\n` (Windows) como separador, sin dejar nunca un carácter de salto de línea en el resultado: más fiable que `.split("\n")` sobre un texto cuyo origen (y por tanto la convención de fin de línea) no está garantizado, por ejemplo un archivo descargado o generado en otra máquina.

## Resumen de los tipos básicos

| Tipo | Ejemplo | Equivalente PHP |
|---|---|---|
| `int` | `25` | `int` |
| `float` | `9.99` | `float` |
| `str` | `"texto"` | `string` |
| `bool` | `True` / `False` | `bool` |
| `None` | `None` | `null` |

Ver también los capítulos sobre listas/tuplas y diccionarios/conjuntos para las estructuras de datos compuestas.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Python es de tipado dinámico: una variable adopta el tipo de su valor, sin declaración previa, y puede cambiar de tipo. `==` compara el valor, `is` compara la identidad (el mismo objeto en memoria). |
| **Herramientas utilizables** | `type()`/`isinstance()`, f-strings para la interpolación, `is None` para probar una ausencia de valor. |
| **Trampas a evitar** | Confundir `==` e `is`: dos objetos con contenido idéntico no son necesariamente el mismo objeto en memoria. |
| **Buenas prácticas** | Usar `is None` en lugar de `== None`; preferir las f-strings a la concatenación para insertar una variable en texto. |
