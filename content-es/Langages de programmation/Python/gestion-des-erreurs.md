---
order: 7
---

# Gestión de errores

Python señala un error lanzando una **excepción**, que interrumpe la ejecución normal del programa a menos que sea interceptada por un bloque `try` / `except` — un mecanismo similar a las excepciones modernas de PHP (`throw` / `catch`).

## `try` / `except`

```python
try:
    resultado = 10 / 0
except ZeroDivisionError:
    print("Impossible de diviser par zéro")
```

## Interceptar varios tipos de excepciones

```python
try:
    número = int(input("Entrez un nombre : "))
    resultado = 10 / número
except ValueError:
    print("Ce n'est pas un nombre valide")
except ZeroDivisionError:
    print("Impossible de diviser par zéro")
except Exception as error:   # «atrapa todo lo demás» -> colocarlo al FINAL
    print(f"Erreur inattendue : {error}")
```

> **Nota:** interceptar `Exception` de forma demasiado amplia (o peor aún, un `except:` sin tipo) oculta errores de programación que, en realidad, deberían provocar un fallo del programa para que se corrigieran; debe reservarse para aquellos casos en los que el fallo sea realmente esperado y ya se haya gestionado inmediatamente después.

## `else` y `finally`

```python
try:
    archivo = open("donnees.txt")
except FileNotFoundError:
    print("Fichier introuvable")
else:
    print("Fichier ouvert avec succès")   # Se ejecuta SOLO si no se ha producido ninguna excepción
    archivo.close()
finally:
    print("Tentative terminée")            # Se ejecuta EN TODOS LOS CASOS, haya o no una excepción
```

`finally` Se utiliza normalmente para liberar un recurso (cerrar un archivo, una conexión...) independientemente de si se ha producido un error o no.

## Lanzar excepciones propias

```python
def calculer_age(annee_naissance):
    if annee_naissance > 2026:
        raise ValueError("L'année de naissance ne peut pas être dans le futur")
    return 2026 - annee_naissance
```

## Crear una excepción personalizada

```python
class SoldeInsuffisantError(Exception):
    pass

def retirer(saldo, montant):
    if montant > saldo:
        raise SoldeInsuffisantError(f"Solde de {saldo}€ insuffisant pour retirer {montant}€")
    return saldo - montant

try:
    retirer(100, 150)
except SoldeInsuffisantError as error:
    print(error)
```

Una excepción personalizada hereda de `Exception` (o de una subclase más específica), lo que permite distinguirla de las demás en un `except` específico, en lugar de basarse en un mensaje de error genérico.

## El gestor de contexto `with`

`with` Garantiza que un recurso se libere correctamente, **incluso en caso de excepción**: un archivo abierto con `with` siempre se cierra automáticamente al salir del bloque:

```python
with open("donnees.txt") as archivo:
    contenido = archivo.read()
# Aquí se llama automáticamente a `fichier.close()`, independientemente de si todo ha salido bien o no.
```

> **Nota:** esto se basa en los métodos especiales `__enter__` / `__exit__` (véase el capítulo sobre programación orientada a objetos); cualquier clase personalizada puede definir estos dos métodos para poder utilizarse con `with` (por ejemplo, para gestionar la apertura y el cierre de una conexión de red o a una base de datos).
