---
order: 3
---

# Os laços

Python oferece `for` e `while`, mas o laço `for` funciona diferentemente de PHP/C/JS: ele sempre percorre diretamente os elementos de um iterável, nunca um contador numérico manipulado manualmente.

## O laço `for`

```python
frutas = ["maca", "banana", "cereja"]

for fruta in frutas:
    print(fruta)
```

Para obter um contador numérico clássico, `range()` gera uma sequência de números:

```python
for i in range(5):        # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 10, 2):  # de 2 a 10 (excluido), em passos de 2 -> 2, 4, 6, 8
    print(i)
```

## `enumerate()`: obter o índice E o valor

```python
for indice, fruta in enumerate(frutas):
    print(f"{indice}: {fruta}")
# 0: maca
# 1: banana
# 2: cereja
```

## `zip()`: percorrer várias coleções em paralelo

```python
nomes = ["Joao", "Maria"]
idades = [25, 30]

for nome, idade in zip(nomes, idades):
    print(f"{nome} tem {idade} anos")
```

`zip()` para assim que a **mais curta** das coleções se esgota, mesmo que as outras ainda contenham elementos.

## O laço `while`

```python
i = 0

while i < 5:
    print(i)
    i += 1   # Python nao tem operador i++ ou ++i: e preciso escrever i += 1
```

## `break` e `continue`

Como na maioria das linguagens:

```python
for i in range(10):
    if i == 5:
        break
    if i % 2 == 0:
        continue
    print(i)
```

## A cláusula `else` de um laço: uma particularidade do Python

Um laço `for`/`while` pode ter um bloco `else`, executado apenas se o laço terminou **normalmente**, sem `break`:

```python
numeros = [1, 3, 5, 7]

for n in numeros:
    if n % 2 == 0:
        print("Numero par encontrado")
        break
else:
    print("Nenhum numero par na lista")  # executado apenas se nenhum break ocorreu
```

> **Nota:** essa construção frequentemente surpreende desenvolvedores vindos de outras linguagens (o `else` parece se ligar ao `if` acima, mas na verdade se liga ao `for`). Ela evita um padrão clássico em que seria necessária uma variável "bandeira" (`encontrado = False`, definida como `True` no `if`, testada depois do laço).

## Sem acesso direto ao índice em um `for`

Ao contrário de um laço `for` em C (`for (int i = 0; i < tamanho; i++)`), o laço Python nunca manipula explicitamente um índice; `enumerate()` é o meio idiomático de obter um quando necessário, em vez de iterar sobre `range(len(lista))` e depois indexar manualmente.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `for` percorre diretamente os elementos de um iterável (nunca um contador manual); `range()` gera uma sequência de números se necessário. `enumerate()`/`zip()` cobrem as necessidades de índice e percurso paralelo. |
| **Ferramentas utilizáveis** | `enumerate()`, `zip()`, a cláusula `else` de um laço (executada se nenhum `break`). |
| **Armadilhas a evitar** | Iterar sobre `range(len(lista))` e depois indexar manualmente, em vez de usar diretamente `for elemento in lista` ou `enumerate()`. |
| **Boas práticas** | Usar `enumerate()` assim que um índice for necessário além do valor, em vez de gerenciá-lo manualmente. |
