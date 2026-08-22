---
order: 6
---

# Las funciones

Una función Python se declara con `def`. Las funciones son **objetos de primera clase**: pueden almacenarse en una variable, pasarse como argumento a otra función, o ser devueltas por una función, exactamente igual que cualquier otro valor.

## Declarar y llamar a una función

```python
def suma(a, b):
    return a + b

resultado = suma(2, 3)   # 5
```

## Parámetros por defecto

```python
def saludar(nombre, mensaje="Hola"):
    return f"{mensaje} {nombre}"

saludar("Juan")           # "Hola Juan"
saludar("Juan", "Ey")     # "Ey Juan"
```

> **Trampa clásica: nunca usar un objeto mutable (lista, dict) como valor por defecto.** El valor por defecto se evalúa **una sola vez**, al definir la función, no en cada llamada:

```python
def agregar_a_lista(elemento, lista=[]):  # PELIGRO: esta lista está COMPARTIDA entre todas las llamadas
    lista.append(elemento)
    return lista

agregar_a_lista(1)  # [1]
agregar_a_lista(2)  # [1, 2] -> ¡no [2]! se reutilizó la misma lista por defecto
```

La buena práctica:

```python
def agregar_a_lista(elemento, lista=None):
    if lista is None:
        lista = []   # una NUEVA lista, creada en cada llamada
    lista.append(elemento)
    return lista
```

## `*args` y `**kwargs`: un número variable de argumentos

```python
def suma_variable(*numeros):     # *args: agrupa los argumentos posicionales en exceso en una tupla
    return sum(numeros)

suma_variable(1, 2, 3, 4)   # 10

def mostrar_info(**opciones):  # **kwargs: agrupa los argumentos con nombre en exceso en un dict
    for clave, valor in opciones.items():
        print(f"{clave}: {valor}")

mostrar_info(nombre="Juan", edad=25)
```

## Argumentos solo por palabra clave

Un `*` solo en la firma obliga a que todo lo que le sigue se pase por nombre, nunca por posición:

```python
def crear_usuario(nombre, *, email, activo=True):
    return {"nombre": nombre, "email": email, "activo": activo}

crear_usuario("Juan", email="juan@ejemplo.com")  # OK
crear_usuario("Juan", "juan@ejemplo.com")        # TypeError: email debe ser nombrado
```

## Las funciones lambda

Una función anónima, limitada a una sola expresión (sin `return` explícito, sin bloque multilínea):

```python
doble = lambda x: x * 2
doble(5)   # 10

# uso típico: como argumento de una función que espera un callback
numeros = [5, 2, 8, 1]
numeros_ordenados = sorted(numeros, key=lambda x: -x)  # orden descendente
```

## Closures y `nonlocal`

Una función anidada puede leer las variables de la función que la engloba; para **modificarlas**, `nonlocal` es necesario:

```python
def contador():
    total = 0

    def incrementar():
        nonlocal total   # sin esto, "total += 1" crearía una nueva variable LOCAL a incrementar()
        total += 1
        return total

    return incrementar

contar = contador()
contar()  # 1
contar()  # 2 -> "total" sí se conservó entre las llamadas
```

Ver también [Los decoradores](/?c=langages-de-programmation&s=python&p=decorateurs), que se apoya directamente en este mecanismo de closure.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una función Python es un objeto de primera clase (almacenable, pasable como argumento). `*args`/`**kwargs` gestionan un número variable de argumentos; una closure conserva el acceso a las variables de su función englobante. |
| **Herramientas utilizables** | Parámetros por defecto, argumentos solo por palabra clave (`*`), lambdas, `nonlocal`. |
| **Trampas a evitar** | Usar un objeto mutable (lista, dict) como valor por defecto: se comparte entre todas las llamadas, no se recrea cada vez. |
| **Buenas prácticas** | Usar `None` como valor por defecto para un parámetro mutable, luego crear el objeto real dentro de la función. |
