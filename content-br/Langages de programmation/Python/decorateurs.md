---
order: 9
---

# Os decoradores

Um **decorador** envolve uma função em outra, para adicionar a ela um comportamento (cronometragem, registro em log, verificação de permissões...) sem modificar seu código; esse mecanismo se apoia diretamente nas funções de primeira classe e nas closures (veja [As funções](/?c=langages-de-programmation&s=python&p=fonctions)).

## O princípio, sem o açúcar sintático

```python
def meu_decorador(funcao):
    def envelope(*args, **kwargs):
        print("Antes da chamada")
        resultado = funcao(*args, **kwargs)
        print("Depois da chamada")
        return resultado
    return envelope

def dizer_ola(nome):
    print(f"Ola {nome}")

dizer_ola = meu_decorador(dizer_ola)   # substitui a funcao por sua versao envolvida
dizer_ola("Joao")
# Antes da chamada
# Ola Joao
# Depois da chamada
```

## A sintaxe `@`

`@meu_decorador` acima de uma função é um simples atalho para `funcao = meu_decorador(funcao)`:

```python
@meu_decorador
def dizer_ola(nome):
    print(f"Ola {nome}")

dizer_ola("Joao")   # exatamente o mesmo resultado do exemplo anterior
```

## Exemplo prático: cronometrar uma função

```python
import time

def cronometrar(funcao):
    def envelope(*args, **kwargs):
        inicio = time.time()
        resultado = funcao(*args, **kwargs)
        duracao = time.time() - inicio
        print(f"{funcao.__name__} levou {duracao:.4f}s")
        return resultado
    return envelope

@cronometrar
def calculo_longo():
    total = sum(x ** 2 for x in range(1000000))
    return total

calculo_longo()   # calculo_longo levou 0.0834s
```

## Preservar os metadados com `functools.wraps`

Sem precaução, a função decorada "perde" seu nome e sua documentação de origem, substituídos pelos da função de envelope:

```python
print(calculo_longo.__name__)   # "envelope" -> nao muito util para depurar
```

```python
from functools import wraps

def cronometrar(funcao):
    @wraps(funcao)   # preserva __name__, __doc__... da funcao original
    def envelope(*args, **kwargs):
        # ... mesma logica que antes ...
        return funcao(*args, **kwargs)
    return envelope

@cronometrar   # redecorado com essa nova versao de cronometrar
def calculo_longo():
    total = sum(x ** 2 for x in range(1000000))
    return total

print(calculo_longo.__name__)   # "calculo_longo" -> corrigido
```

> **Nota:** redefinir `cronometrar` não muda nada retroativamente em uma função já decorada por sua versão antiga: `calculo_longo` precisa ser redecorada aqui para que `@wraps` se aplique realmente.

## Um decorador com seus próprios argumentos

Para parametrizar um decorador (ex. `@repetir(3)` em vez de `@repetir`), um nível de aninhamento adicional é necessário:

```python
def repetir(numero_de_vezes):
    def decorador(funcao):
        def envelope(*args, **kwargs):
            for _ in range(numero_de_vezes):
                resultado = funcao(*args, **kwargs)
            return resultado
        return envelope
    return decorador

@repetir(3)
def saudar():
    print("Ola!")

saudar()   # exibe "Ola!" tres vezes
```

`repetir(3)` primeiro retorna `decorador` (uma função que recebe uma função), que é então aplicado a `saudar`, daí os três níveis de funções aninhadas.

## Decoradores comuns da biblioteca padrão

| Decorador | Função |
|---|---|
| `@property` | Transforma um método em um atributo calculado (veja [A programação orientada a objetos](/?c=langages-de-programmation&s=python&p=poo)) |
| `@staticmethod` | Método que não precisa nem de `self`, nem da classe |
| `@classmethod` | Método que recebe a própria classe (`cls`) em vez de uma instância |
| `@functools.lru_cache` | Armazena automaticamente em cache o resultado de uma função para argumentos já vistos |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um decorador (`@nome`) envolve uma função para adicionar a ela um comportamento sem modificar seu código: `@decorador def f()` equivale a `f = decorador(f)`. |
| **Ferramentas utilizáveis** | `functools.wraps` (preserva os metadados), `@property`/`@staticmethod`/`@classmethod`, `@functools.lru_cache`. |
| **Armadilhas a evitar** | Esquecer `@wraps`: a função decorada perde seu `__name__`/`__doc__` de origem, o que complica a depuração. |
| **Boas práticas** | Sempre usar `@wraps(funcao)` na função de envelope de um decorador personalizado. |
