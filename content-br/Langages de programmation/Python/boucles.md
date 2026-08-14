---
order: 3
---

# Os loops

O Python disponibiliza `for` e `while`, mas o ciclo `for` funciona de forma diferente do PHP/C/JS: percorre sempre diretamente os elementos de um iterável, nunca um contador numérico manipulado manualmente.

## O ciclo `for`

```python
frutas = ["pomme", "banane", "cerise"]

for fruto in frutas:
    print(fruto)
```

Para obter um contador digital clássico, `range()` gera uma sequência de números:

```python
for i in range(5):        # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 10, 2):  # de 2 a 10 (excluído), em incrementos de 2 -> 2, 4, 6, 8
    print(i)
```

## `enumerate()` : obter o índice E o valor

```python
for índice, fruto in enumerate(frutas):
    print(f"{índice} : {fruto}")
# 0: maçã
# 1: banana
# 2: cereja
```

## `zip()` : consultar várias coleções em paralelo

```python
noms = ["Jean", "Marie"]
ages = [25, 30]

for nome, idade in zip(noms, ages):
    print(f"{nome} a {idade} ans")
```

`zip()` termina assim que a coleção **mais curta** se esgotar, mesmo que as outras ainda contenham elementos.

## O ciclo `while`

```python
i = 0

while i < 5:
    print(i)
    i += 1   # O Python não tem o operador i++ nem ++i: é necessário escrever i += 1
```

## `break` e `continue`

Tal como na maioria das linguagens:

```python
for i in range(10):
    if i == 5:
        break
    if i % 2 == 0:
        continue
    print(i)
```

## A cláusula «`else`» de um ciclo: uma particularidade do Python

Um ciclo `for` / `while` pode conter um bloco `else`, executado apenas se o ciclo tiver terminado **normalmente**, sem `break`:

```python
números = [1, 3, 5, 7]

for n in números:
    if n % 2 == 0:
        print("Nombre pair trouvé")
        break
else:
    print("Aucun nombre pair dans la liste")  # executado apenas se não tiver ocorrido nenhuma interrupção
```

> **Nota:** esta construção surpreende frequentemente os programadores provenientes de outras linguagens (o `else` parece estar relacionado com o `if` acima, mas está, na verdade, relacionado com o `for`). Evita um padrão clássico em que, de outra forma, seria necessária uma variável «bandeira» (`trouve = False`, definida como `True` no `if`, testada após o ciclo).

## Não há acesso direto ao índice num `for`

Ao contrário de um ciclo «`for`» em C (`for (int i = 0; i < taille; i++)`), o ciclo em Python nunca manipula explicitamente um índice; «`enumerate()`» é a forma idiomática de obter um índice quando necessário, em vez de iterar sobre «`range(len(lista))`» e depois indexar manualmente.
