---
order: 7
---

# La gestión de errores

Python señala un error lanzando una **excepción**, que interrumpe la ejecución normal del programa salvo que sea interceptada por un bloque `try`/`except`, un mecanismo similar a las excepciones [PHP](/?c=langages-de-programmation&s=php&p=php) modernas (`throw`/`catch`).

## `try` / `except`

```python
try:
    resultado = 10 / 0
except ZeroDivisionError:
    print("Imposible dividir por cero")
```

## Interceptar varios tipos de excepciones

```python
try:
    numero = int(input("Introduce un número: "))
    resultado = 10 / numero
except ValueError:
    print("Eso no es un número válido")
except ZeroDivisionError:
    print("Imposible dividir por cero")
except Exception as error:   # atrapa todo lo demás -> colocar al FINAL
    print(f"Error inesperado: {error}")
```

> **Nota:** interceptar `Exception` de forma demasiado amplia (o peor, un `except:` desnudo, sin tipo) enmascara errores de programación que deberían más bien hacer fallar el programa para ser corregidos, hay que reservarlo para los casos donde el fallo está realmente esperado y ya gestionado justo después.

## `else` y `finally`

```python
try:
    archivo = open("datos.txt")
except FileNotFoundError:
    print("Archivo no encontrado")
else:
    print("Archivo abierto con éxito")   # ejecutado SOLO si no ocurrió ninguna excepción
    archivo.close()
finally:
    print("Intento terminado")            # ejecutado EN TODOS LOS CASOS, excepción o no
```

`finally` sirve típicamente para liberar un recurso (cerrar un archivo, una conexión...) haya habido error o no.

## Los modos de `open()`

`open(ruta)` (visto arriba) abre por defecto en **lectura**. Un segundo argumento precisa el modo de apertura:

| Modo | Significa | Si el archivo ya existe |
|---|---|---|
| `"r"` | Lectura (defecto) | Lee su contenido |
| `"w"` | Escritura | **SOBRESCRIBE** todo el contenido existente |
| `"a"` | Añadir (*append*) | Escribe a CONTINUACIÓN, sin borrar nada |
| `"x"` | Creación exclusiva | Falla con `FileExistsError` |

```python
with open("log.txt", "a", encoding="utf-8") as f:
    f.write("Nueva línea\n")   # se añade al final, el contenido anterior permanece intacto
```

> **Trampa:** confundir `"w"` y `"a"` hace perder silenciosamente el contenido existente de un archivo (`"w"` lo sobrescribe desde la apertura, antes incluso de escribir nada). Reservar `"w"` para un archivo que se quiera reemplazar deliberadamente.

> **Nota:** un archivo abierto con `"a"` para permanecer abierto durante toda la duración de un programa (ej. un archivo de log) suele prescindir de `with`, ya que el recurso NO debe liberarse tras un solo bloque: `with` sigue siendo preferible en todos los demás casos.

## Lanzar tus propias excepciones

```python
def calcular_edad(anio_nacimiento):
    if anio_nacimiento > 2026:
        raise ValueError("El año de nacimiento no puede estar en el futuro")
    return 2026 - anio_nacimiento
```

## Crear una excepción personalizada

```python
class SaldoInsuficienteError(Exception):
    pass

def retirar(saldo, monto):
    if monto > saldo:
        raise SaldoInsuficienteError(f"Saldo de {saldo}€ insuficiente para retirar {monto}€")
    return saldo - monto

try:
    retirar(100, 150)
except SaldoInsuficienteError as error:
    print(error)
```

Una excepción personalizada hereda de `Exception` (o de una subclase más precisa), lo que permite distinguirla de las demás en un `except` específico, en lugar de apoyarse en un mensaje de error genérico.

## El gestor de contexto `with`

`with` garantiza que un recurso se libere correctamente, **incluso en caso de excepción**: un archivo abierto con `with` siempre se cierra automáticamente al salir del bloque:

```python
with open("datos.txt") as archivo:
    contenido = archivo.read()
# archivo.close() se llama automáticamente aquí, haya salido todo bien o no
```

> **Nota:** esto se apoya en los métodos especiales `__enter__`/`__exit__` (ver [La programación orientada a objetos](/?c=langages-de-programmation&s=python&p=poo)); cualquier clase personalizada puede definir estos dos métodos para volverse utilizable con `with` (ej. gestionar la apertura/cierre de una conexión de red o de base de datos).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `try`/`except`/`else`/`finally` estructura la gestión de errores. `with` garantiza que un recurso se libere incluso en caso de excepción, vía `__enter__`/`__exit__`. |
| **Herramientas utilizables** | Excepciones personalizadas (heredan de `Exception`), `with`, `raise`. |
| **Trampas a evitar** | Interceptar `Exception` (o un `except:` desnudo) demasiado ampliamente: enmascara errores de programación que deberían más bien hacer fallar el programa para ser corregidos. |
| **Buenas prácticas** | Interceptar el tipo de excepción más preciso posible; usar `with` para todo recurso que deba cerrarse/liberarse. |
