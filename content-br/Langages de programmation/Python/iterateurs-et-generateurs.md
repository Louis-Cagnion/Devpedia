---
order: 8
---

# Iteradores e geradores

Um ciclo «`for`» funciona com listas, dicionários, arquivos e muitos outros objetos, porque todos eles implementam o mesmo **protocolo de iteração**. Compreender este protocolo permite criar os seus próprios objetos «iteráveis» e utilizar geradores para processar grandes quantidades de dados sem ter de carregar tudo na memória.

## O protocolo de iteração

`for elemento in objeto:` Na realidade, funciona assim, nos bastidores:

```python
iterateur = iter(objeto)       # chama objeto.__iter__()
while True:
    try:
        elemento = next(iterateur)  # chama iterator.__next__()
    except StopIteration:
        break
    # ... corpo do ciclo com «element» ...
```

Um objeto é **iterável** se implementar a interfeç`__iter__()`a (retorna um iterador). Um **iterador** implementa a interfeç`__next__()`a (retorna o elemento seguinte ou lança a exceção`StopIteration` quando não houver mais elementos).

## Criar um iterador personalizado

```python
class Contador:
    def __init__(self, limite):
        self.limite = limite
        self.actuel = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.actuel >= self.limite:
            raise StopIteration
        self.actuel += 1
        return self.actuel

for número in Contador(5):
    print(número)   # 1 2 3 4 5
```

## Os geradores: uma forma mais simples de escrever um iterador

Uma função que contenha `yield` torna-se automaticamente um **gerador**: o Python implementa para ela todo o protocolo `__iter__` / `__next__` acima referido, sem que seja necessário escrever uma classe.

```python
def contador(limite):
    actuel = 0
    while actuel < limite:
        actuel += 1
        yield actuel

for número in contador(5):
    print(número)   # 1 2 3 4 5
```

`yield` «suspende» a função e devolve um valor, **sem perder o seu estado**: na próxima chamada a `next()`, a execução retoma-se logo a seguir a `yield`, com todas as variáveis locais intactas.

## Por que utilizar um gerador em vez de uma lista

```python
def carres_liste(n):
    return [x ** 2 for x in range(n)]   # calcula e armazena TUDO na memória, de uma só vez

def carres_generateur(n):
    for x in range(n):
        yield x ** 2                     # calcula APENAS UM elemento de cada vez, mediante solicitação
```

Para `n = 10_000_000`, `carres_liste()` aloca uma lista de 10 milhões de elementos na memória **antes** de começar a utilizá-los. `carres_generateur()` produz apenas um elemento de cada vez, que é consumido e depois esquecido: a memória utilizada permanece constante, independentemente do tamanho de `n`.

> **Nota:** esta «avaliação preguiçosa» (*lazy evaluation*) tem um custo: um gerador **só** pode ser percorrido **uma única vez** (uma vez esgotado, um novo ciclo `for` sobre ele já não produz nada), ao contrário de uma lista, que pode ser percorrida livremente.

## Expressão geradora

Equivalente a uma compreensão de lista, mas preguiçosa, substituir os colchetes por parênteses:

```python
carres = (x ** 2 for x in range(10))   # gerador, ainda não foi calculado nada
liste_carres = [x ** 2 for x in range(10)]  # lista, tudo é calculado imediatamente

sum(x ** 2 for x in range(1000000))    # calcula a soma SEM nunca armazenar os 1M de valores
```

Ver também o capítulo sobre funções (closures) e sobre NumPy/pandas, onde a distinção entre memória imediata e memória preguiçosa volta a ser fundamental em grande escala.
