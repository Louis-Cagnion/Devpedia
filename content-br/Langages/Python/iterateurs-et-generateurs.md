---
order: 8
---

# Iteradores e geradores

Um laço `for` funciona em listas, dicionários, arquivos, e muitos outros objetos, porque todos eles implementam o mesmo **protocolo de iteração**. Entender esse protocolo permite criar seus próprios objetos "percorríveis", e usar geradores para processar grandes quantidades de dados sem carregar tudo na memória.

## O protocolo de iteração

`for elemento in objeto:` na verdade funciona assim, nos bastidores:

```python
iterador = iter(objeto)       # chama objeto.__iter__()
while True:
    try:
        elemento = next(iterador)  # chama iterador.__next__()
    except StopIteration:
        break
    # ... corpo do laco com "elemento" ...
```

Um objeto é **iterável** se implementa `__iter__()` (retorna um iterador). Um **iterador** implementa `__next__()` (retorna o elemento seguinte, ou lança `StopIteration` quando não há mais nenhum).

## Criar um iterador personalizado

```python
class Contador:
    def __init__(self, limite):
        self.limite = limite
        self.atual = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.atual >= self.limite:
            raise StopIteration
        self.atual += 1
        return self.atual

for numero in Contador(5):
    print(numero)   # 1 2 3 4 5
```

## Os geradores: uma forma mais simples de escrever um iterador

Uma função contendo `yield` se torna automaticamente um **gerador**: Python implementa para ela todo o protocolo `__iter__`/`__next__` visto acima, sem que seja necessário escrever uma classe.

```python
def contador(limite):
    atual = 0
    while atual < limite:
        atual += 1
        yield atual

for numero in contador(5):
    print(numero)   # 1 2 3 4 5
```

`yield` "pausa" a função e retorna um valor, **sem perder seu estado**: na próxima chamada de `next()`, a execução retoma logo depois do `yield`, com todas as variáveis locais intactas.

## Por que usar um gerador em vez de uma lista

```python
def quadrados_lista(n):
    return [x ** 2 for x in range(n)]   # calcula e armazena TUDO na memoria, de uma vez

def quadrados_gerador(n):
    for x in range(n):
        yield x ** 2                     # calcula UM UNICO elemento por vez, sob demanda
```

Para `n = 10_000_000`, `quadrados_lista()` aloca uma lista de 10 milhões de elementos na memória **antes** de começar a usá-los. `quadrados_gerador()` produz apenas um elemento por vez, consumido e depois esquecido: a memória usada permanece constante, seja qual for o tamanho de `n`.

> **Nota:** essa "avaliação preguiçosa" (*lazy evaluation*) tem um custo: um gerador só pode ser percorrido **uma única vez** (uma vez esgotado, um novo laço `for` nele não produz mais nada), ao contrário de uma lista que pode ser repercorrida livremente.

## Expressão geradora

Equivalente de uma compreensão de lista, mas preguiçosa: substituir os colchetes por parênteses:

```python
quadrados = (x ** 2 for x in range(10))       # gerador, nada foi calculado ainda
lista_quadrados = [x ** 2 for x in range(10)]  # lista, tudo e calculado imediatamente

sum(x ** 2 for x in range(1000000))    # calcula a soma SEM nunca armazenar os 1M de valores
```

Veja também [As funções](/?c=langages-de-programmation&s=python&p=fonctions) (closures) e [NumPy](/?c=data-science&p=numpy), onde a distinção memória imediata vs preguiçosa volta a ser central em grande escala.

## Gerador vs thread: um único fluxo por vez

Um gerador às vezes dá a impressão de "fazer duas coisas ao mesmo tempo" (o código chamador, e o gerador que progride em segundo plano). Isso é enganoso: ao contrário de uma thread (veja [As threads (pthread)](/?c=langages-de-programmation&s=c&p=threads)), onde dois fluxos de execução podem realmente avançar em paralelo sem se coordenar explicitamente, um gerador nunca faz nada "em segundo plano".

`next()` é uma chamada de função como qualquer outra: ela **bloqueia** o código chamador até que o gerador alcance o `yield` seguinte (ou termine). Apenas um dos dois fluxos avança em um dado instante, nunca os dois ao mesmo tempo:

```python
def tarefas():
    print("Iniciando")
    yield "A"
    print("Retomando apos A")
    yield "B"

t = tarefas()
print("Antes do primeiro next")
print(next(t))     # "Iniciando" e exibido AQUI, no momento da chamada, nao antes, nao em segundo plano
print("Antes do segundo next")
print(next(t))     # "Retomando apos A" e exibido AQUI, nunca antes
```

A ordem de exibição é **inteiramente determinística** e reproduzível a cada execução, ao contrário de duas threads independentes, cuja ordem de execução relativa não é previsível sem sincronização explícita (mutex, `pthread_join`...). É por isso que se fala em **corrotina** em vez de paralelismo para descrever `yield`: a função "coopera" com seu chamador devolvendo-lhe explicitamente o controle a cada `yield`, em vez de ser interrompida à força por um escalonador como faria uma thread.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um objeto iterável implementa `__iter__`, um iterador implementa `__next__`. Uma função com `yield` se torna um gerador: preguiçoso, memória constante, mas percorrível apenas uma vez. |
| **Ferramentas utilizáveis** | `iter()`/`next()`, `yield`, expressão geradora (`(x for x in ...)`). |
| **Armadilhas a evitar** | Reutilizar um gerador já esgotado, esperando que ele reproduza seus valores. |
| **Boas práticas** | Preferir um gerador a uma lista assim que a coleção for grande e percorrida uma única vez sequencialmente. |
