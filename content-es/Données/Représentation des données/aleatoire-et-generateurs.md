---
order: 5
---

# El azar y los generadores

Un procesador es una máquina determinista: con entradas idénticas, salidas idénticas. No puede por tanto producir azar. Lo que proporcionan las funciones `random()` no es azar, sino una secuencia de números **calculados** que se parece estadísticamente al azar. De ahí su nombre exacto: generadores de números **pseudo**-aleatorios (PRNG).

Esta distinción no es un detalle teórico: confundir las dos categorías de generadores es una falla de seguridad clásica.

## Un PRNG es una secuencia determinista

Un PRNG parte de un estado inicial, la **semilla** (*seed*), y aplica una fórmula para producir cada valor siguiente. Misma semilla, misma secuencia, siempre, en todas las máquinas.

```python
import random

random.seed(42)
print(random.randint(1, 100))  # 82
print(random.randint(1, 100))  # 15

random.seed(42)                # se vuelve a partir de la misma semilla
print(random.randint(1, 100))  # 82 -> identico
```

En [C](/?c=langages-de-programmation&s=c&p=c), `rand()` sin `srand()` usa implícitamente la semilla `1`: un programa relanzado produce **exactamente la misma secuencia**. De ahí la costumbre de sembrar con la hora actual:

```c
srand(time(NULL));   // semilla diferente cada segundo
int sorteo = rand() % 100;
```

**Este determinismo es a menudo una cualidad**, no un defecto:

- **reproducibilidad científica**: fijar la semilla permite reproducir exactamente un entrenamiento de modelo (ver [El entrenamiento y el descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient));
- **tests**: un test que usa azar debe ser reproducible para poder diagnosticarse;
- **generación procedural**: un mundo de juego entero puede regenerarse de forma idéntica a partir de una sola semilla.

## La trampa de la semilla previsible

Sembrar con `time(NULL)` tiene un reverso: la hora es **conocida por todos**. Si un token de sesión se saca de un PRNG sembrado con la marca de tiempo, un atacante que conoce aproximadamente la hora de creación solo necesita probar unos pocos miles de semillas para regenerar la secuencia completa.

Más grave: un PRNG clásico está diseñado para ser **rápido y bien repartido**, no impredecible. Con suficientes valores observados, se puede recuperar el estado interno y **predecir todos los valores siguientes**. No es una debilidad de implementación, está fuera de su propósito.

## Dos familias que no confundir

| | PRNG clásico | CSPRNG (criptográfico) |
|---|---|---|
| Objetivo | Velocidad, buena distribución | Imprevisibilidad |
| ¿Previsible? | Sí, a partir del estado | No, incluso conociendo las salidas |
| Fuente de semilla | A menudo el reloj | Entropía del sistema |
| C | `rand()` | `getrandom()`, `/dev/urandom` |
| [Python](/?c=langages-de-programmation&s=python&p=python) | `random` | `secrets` |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | `rand()`, `mt_rand()` | `random_bytes()`, `random_int()` |
| [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) | `Math.random()` | `crypto.getRandomValues()` |

**La regla es simple y sin excepción: en cuanto el valor deba ser impredecible, usa un CSPRNG.** Esto concierne a los tokens de sesión, los tokens CSRF, los códigos de restablecimiento de contraseña, las sales, los identificadores secretos, las claves.

```python
import secrets
token = secrets.token_hex(32)     # impredecible
```

```php
$token = bin2hex(random_bytes(32));   // y no uniqid() ni mt_rand()
```

Ver el capítulo [Protege tus datos](/?c=langages-de-programmation&s=php&p=securite) de PHP, donde los tokens CSRF se basan precisamente en `random_bytes()`.

> Al contrario, no uses un CSPRNG para mezclar una lista de visualización o simular un dado: es más lento y consume entropía sin beneficio.

## ¿De dónde viene la verdadera entropía?

El sistema operativo recoge eventos físicos difícilmente predecibles: intervalos precisos entre las pulsaciones de teclado y las interrupciones de hardware, ruido térmico, y en los procesadores recientes una instrucción dedicada ([`RDRAND`](https://en.wikipedia.org/wiki/RDRAND)). Alimenta con ello un depósito de entropía, expuesto en Linux vía [`/dev/urandom`](https://man7.org/linux/man-pages/man4/urandom.4.html).

Es ahí donde un CSPRNG obtiene su semilla, y es lo que lo hace impredecible: la semilla en sí no depende de ninguna fórmula.

## El sesgo del módulo

Un error discreto pero real: llevar un sorteo a un intervalo con `%` **desequilibra** las probabilidades cuando el rango del generador no es un múltiplo del intervalo.

```c
// rand() devuelve 0..32767, es decir 32768 valores
int sorteo = rand() % 3;   // 0..2
```

32768 no es divisible por 3: los valores `0` y `1` salen 10 923 veces, el valor `2` solo 10 922 veces. El sesgo aquí es insignificante, pero se vuelve significativo cuando el intervalo pedido se acerca al rango del generador.

El remedio es **rechazar** los sorteos que caen en la zona excedente, o más simplemente usar una función que lo hace por ti:

```python
random.randint(0, 2)  # gestiona la distribucion uniforme
secrets.randbelow(3)  # idem, en version criptografica
```

El mismo razonamiento se aplica a `Math.random()` en JavaScript o `mt_rand()` en PHP: prefiere la función dedicada a un `%` improvisado.

## Resumen

| A recordar | |
|---|---|
| Un PRNG es determinista | Misma semilla → misma secuencia |
| El determinismo es útil | Tests, reproducibilidad científica, generación procedural |
| Semilla = reloj | Previsible: nunca para seguridad |
| Valor que debe ser secreto | CSPRNG obligatorio (`secrets`, `random_bytes`, `crypto`) |
| Llevar a un intervalo | Evitar `%` bruto: sesgo del módulo |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un PRNG clásico es una secuencia determinista (misma semilla = misma secuencia): útil para tests y reproducibilidad, pero nunca para un valor que deba seguir siendo secreto. Un CSPRNG obtiene su semilla de la entropía del sistema, lo que lo hace impredecible. |
| **Herramientas utilizables** | `secrets`/`random_bytes()`/`crypto.getRandomValues()` (CSPRNG) vs `random`/`rand()`/`Math.random()` (PRNG clásico). |
| **Trampas a evitar** | Usar un PRNG clásico (o una semilla previsible como el reloj) para un token de sesión, una sal, o cualquier valor que deba seguir siendo secreto. |
| **Buenas prácticas** | CSPRNG sistemático en cuanto un valor deba ser impredecible; usar una función dedicada (`randint`, `randbelow`) en lugar de un `%` improvisado para llevar un sorteo a un intervalo. |
