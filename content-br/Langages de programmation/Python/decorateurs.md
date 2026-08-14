---
order: 9
---

# Os decoradores

Um **decorador** envolve uma função noutra, para lhe adicionar um comportamento (cronometragem, registro em log, verificação de direitos...) sem alterar o seu código; este mecanismo baseia-se diretamente nas funções de primeira classe e nos closures (ver capítulo sobre funções).

## O princípio, sem os artifícios sintáticos

```python
def mon_decorateur(fonction):
    def enveloppe(*args, **kwargs):
        print("Avant l'appel")
        resultado = fonction(*args, **kwargs)
        print("Après l'appel")
        return resultado
    return enveloppe

def dire_bonjour(nome):
    print(f"Bonjour {nome}")

dire_bonjour = mon_decorateur(dire_bonjour)   # substitui a função pela sua versão encapsulada
dire_bonjour("Jean")
# Antes da chamada
# Olá, Jean
# Após a chamada
```

## A sintaxe`@`

`@mon_decorateur` O código acima de uma função é um simples atalho para «`fonction = mon_decorateur(fonction)`»:

```python
@mon_decorateur
def dire_bonjour(nome):
    print(f"Bonjour {nome}")

dire_bonjour("Jean")   # exatamente o mesmo resultado que o exemplo anterior
```

## Exemplo prático: cronometrizar uma função

```python
import time

def chronometrer(fonction):
    def enveloppe(*args, **kwargs):
        debut = time.time()
        resultado = fonction(*args, **kwargs)
        duree = time.time() - debut
        print(f"{fonction.__name__} a pris {duree:.4f}s")
        return resultado
    return enveloppe

@chronometrer
def calcul_long():
    total = sum(x ** 2 for x in range(1000000))
    return total

calcul_long()   # A função `calcul_long` demorou 0,0834 s
```

## Preservar os metadados com o «`functools.wraps`»

Sem as devidas precauções, a função decorada «perde» o seu nome e a sua documentação original, que são substituídos pelos da função de invólucro:

```python
print(calcul_long.__name__)   # «envelope» -> não é muito útil para depurar
```

```python
from functools import wraps

def chronometrer(fonction):
    @wraps(fonction)   # preserva __name__, __doc__... da função original
    def enveloppe(*args, **kwargs):
        # ... a mesma lógica de antes ...
        return fonction(*args, **kwargs)
    return enveloppe

@chronometrer   # renovada com esta nova versão do Chronometrer
def calcul_long():
    total = sum(x ** 2 for x in range(1000000))
    return total

print(calcul_long.__name__)   # «calcul_long» -> corrigido
```

> **Nota:** redefinir `chronometrer` não altera retroativamente uma função já decorada pela sua versão anterior: `calcul_long` deve ser redecorada aqui para que `@wraps` se aplique efetivamente.

## Um decorador com os seus próprios argumentos

Para configurar um decorador (por exemplo, `@repeter(3)` em vez de `@repeter`), é necessário um nível adicional de aninhamento:

```python
def repeter(nombre_de_fois):
    def decorateur(fonction):
        def enveloppe(*args, **kwargs):
            for _ in range(nombre_de_fois):
                resultado = fonction(*args, **kwargs)
            return resultado
        return enveloppe
    return decorateur

@repeter(3)
def saluer():
    print("Bonjour !")

saluer()   # exibe «Olá!» três vezes
```

`repeter(3)` retorna primeiro `decorateur` (uma função que recebe uma função), que é depois aplicada a `saluer`, daí os três níveis de funções aninhadas.

## Decoradores comuns da biblioteca padrão

| Decorador | Função |
|---|---|
| `@property` | Transforma um método num atributo calculado (ver capítulo sobre POO) |
| `@staticmethod` | Método que não necessita nem de `self`, nem da classe |
| `@classmethod` | Método que recebe a própria classe (`cls`) em vez de uma instância |
| `@functools.lru_cache` | Armazena automaticamente em cache o resultado de uma função para argumentos já utilizados |
