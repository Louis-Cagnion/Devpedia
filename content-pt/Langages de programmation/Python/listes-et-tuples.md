---
order: 4
---

# Listas e tuplas

O Python distingue duas estruturas ordenadas de coleções: a **lista**, mutável, e o **tuplo**, imutável. Ambas podem misturar livremente elementos de tipos diferentes.

## As listas

```python
frutas = ["pomme", "banane", "cerise"]

frutas[0]           # «maçã»
frutas[-1]           # «cerise» -> índice negativo: conta a partir do fim
frutas[0:2]          # ["maçã", "banana"] -> slicing: elementos do índice 0 (incluído) a 2 (excluído)
frutas[::-1]         # ["cereja", "banana", "maçã"] -> inverte a lista (passo a passo -1)

frutas.append("kiwi")     # acrescentar no final
frutas.insert(0, "mangue") # inserir num índice específico
frutas.remove("banane")    # retira a primeira ocorrência deste valor
frutas.pop()                # retira E devolve o último elemento
len(frutas)                  # número de elementos
"pomme" in frutas             # True/False -> verifica a existência de um valor
```

> **Nota:** ao contrário de um array em C (tamanho fixo, um único tipo), uma lista em Python é um array **dinâmico** heterogéneo: cresce automaticamente e cada elemento pode ser de um tipo diferente — o que implica um custo adicional de memória por elemento (cada elemento é, na realidade, uma referência a um objeto Python, e não um valor bruto contíguo como em C).

## O «slicing» em pormenor

```python
números = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

números[2:5]     # [2, 3, 4] -> do índice 2 (incluído) ao 5 (excluído)
números[:3]       # [0, 1, 2] -> desde o início
números[7:]       # [7, 8, 9] -> até ao fim
números[::2]       # [0, 2, 4, 6, 8] -> um em cada dois elementos
```

## Tuplas: listas imutáveis

```python
coordonnees = (48.8566, 2.3522)

coordonnees[0]        # 48,8566
coordonnees[0] = 0     # TypeError: uma tupla não pode ser alterada após a sua criação
```

Uma tupla serve normalmente para representar um registo fixo (um par de coordenadas, um ponto RGB...) em vez de uma coleção destinada a evoluir.

### Descompactação (*unpacking*)

```python
latitude, longitude = coordonnees
print(latitude)   # 48,8566

a, b, c = 1, 2, 3   # também funciona sem parênteses explícitos: uma tupla implícita
a, b = b, a          # troca de valores, sem variáveis temporárias
```

## Conceitos relacionados com listas

Uma **compreensão de lista** cria uma nova lista numa única expressão, mais concisa e, muitas vezes, mais rápida do que um ciclo clássico «`for`» com «`.append()`»:

```python
carres = [x ** 2 for x in range(5)]
# equivalente a:
carres = []
for x in range(5):
    carres.append(x ** 2)
```

Com um critério de filtragem:

```python
pairs = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]
```

> **Nota:** o código continua a ser compreensível para uma transformação simples numa única linha — para além disso (várias condições aninhadas, lógica complexa), um ciclo clássico do tipo «`for`» continua a ser mais claro de ler e de depurar.

Consulte também o capítulo sobre dicionários e conjuntos para conhecer o equivalente às compreensões nestas estruturas, e o capítulo sobre iteradores/geradores para conhecer a expressão geradora (variante preguiçosa de uma compreensão de lista).
