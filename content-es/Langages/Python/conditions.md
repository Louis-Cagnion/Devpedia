---
order: 2
---

# Las condiciones

Python usa `if`/`elif`/`else`, sin ninguna llave: es la **indentación** misma la que delimita los bloques de código, a diferencia de [PHP](/?c=langages-de-programmation&s=php&p=php), C o [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript).

## `if` / `elif` / `else`

```python
edad = 20

if edad >= 18:
    print("Eres mayor de edad.")
elif edad >= 13:
    print("Eres adolescente.")
else:
    print("Eres un niño.")
```

> **Nota:** `elif` (contracción de "else if") es la única palabra clave para encadenar condiciones; `else if` en dos palabras no existe en Python. La indentación coherente es **obligatoria**: un bloque mal indentado provoca un `IndentationError`, no solo un aviso.

## Los valores "truthy" y "falsy"

Además de `True`/`False`, Python considera automáticamente ciertos valores como falsos en un contexto booleano (`if`, `while`...):

```python
if []:      # False -> una lista vacía es "falsy"
if "":      # False -> una cadena vacía es "falsy"
if 0:       # False -> cero es "falsy"
if None:    # False
if [1, 2]:  # True -> una lista no vacía es "truthy"
```

| Valor | Truthy / Falsy |
|---|---|
| `0`, `0.0` | Falsy |
| `""` (cadena vacía) | Falsy |
| `[]`, `{}`, `set()` (colecciones vacías) | Falsy |
| `None` | Falsy |
| Todo lo demás | Truthy |

```python
usuarios = []

if usuarios:                     # preferido a "if len(usuarios) > 0:"
    print("Hay usuarios")
else:
    print("Ningún usuario")
```

## `and`/`or` devuelven un valor, no solo un booleano

```python
estado = "activo"
resultado = estado and "encontrado"    # "encontrado" -> estado es truthy, and devuelve su SEGUNDO operando
resultado = "" and "encontrado"        # ""           -> "" es falsy, and se detiene y devuelve su PRIMER operando

apodo = ""
nombre_mostrado = apodo or "Anónimo"   # "Anónimo" -> or devuelve el primer operando truthy encontrado
```

`and`/`or` nunca recalculan un `True`/`False`: devuelven uno de sus dos operandos, sin evaluar el otro más allá de lo necesario (**evaluación en cortocircuito**). `a and b` devuelve `a` si `a` es falsy (sin siquiera evaluar `b`), si no `b`; `a or b` devuelve `a` si `a` es truthy, si no `b`. Este idioma permite una llamada condicional (`conectado and desconectar()`, solo llama a `desconectar()` si `conectado` es verdadero) o un valor de respaldo (`nombre = apodo or "Anónimo"`).

> **Trampa:** este atajo sigue siendo poco legible para una simple prueba condicional clásica; reservarlo para una expresión (asignación, argumento) que necesite un valor de respaldo o una llamada condicional corta, mantener un `if` explícito en todos los demás casos.

## El operador ternario

```python
edad = 20
estado = "mayor de edad" if edad >= 18 else "menor de edad"
```

A diferencia de PHP/C/JS (`condicion ? valor_si_verdadero : valor_si_falso`), Python coloca la condición **en medio**: `valor_si_verdadero if condicion else valor_si_falso`.

## El operador "morsa" (`:=`, desde Python 3.8)

Permite asignar una variable **y** usarla en la misma expresión, especialmente en una condición:

```python
# sin el operador morsa: la línea "resultado" se calcula dos veces
if calcular_resultado() > 10:
    print(calcular_resultado())

# con el operador morsa: calculada una sola vez, Y utilizable después
if (resultado := calcular_resultado()) > 10:
    print(resultado)
```

## Sin `switch` clásico (antes de Python 3.10)

Python no ofreció durante mucho tiempo ningún equivalente directo a `switch`; una cadena de `elif` o un diccionario de correspondencia hacía de alternativa:

```python
def dia_semana(dia):
    correspondencia = {
        1: "Lunes",
        2: "Martes",
        3: "Miércoles",
    }
    return correspondencia.get(dia, "Día desconocido")
```

Desde Python 3.10, `match`/`case` ofrece una sintaxis dedicada, más cercana a un `switch`:

```python
match dia:
    case 1:
        print("Lunes")
    case 2:
        print("Martes")
    case _:            # '_': equivalente al "default" de un switch
        print("Otro día")
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `if`/`elif`/`else` estructura el control de flujo, sin llaves: la indentación delimita los bloques. Ciertos valores (`0`, `""`, `[]`, `None`) son "falsy" sin ser `False`. `and`/`or` devuelven uno de sus operandos, no solo un booleano. |
| **Herramientas utilizables** | Operador ternario (`x if cond else y`), operador morsa (`:=`), `match`/`case` (Python 3.10+). |
| **Trampas a evitar** | Una indentación incoherente: provoca un `IndentationError`, no un simple aviso. |
| **Buenas prácticas** | Probar directamente `if coleccion:` en lugar de `if len(coleccion) > 0:`, apoyándose en el comportamiento truthy/falsy. |
