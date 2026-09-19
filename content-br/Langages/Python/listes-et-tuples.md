---
order: 4
---

# As listas e as tuplas

Python distingue duas estruturas ordenadas de coleções: a **lista**, mutável, e a **tupla**, imutável. Ambas podem misturar livremente elementos de tipos diferentes.

## As listas

```python
frutas = ["maca", "banana", "cereja"]

frutas[0]     # "maca"
frutas[-1]    # "cereja" -> indice negativo: conta a partir do fim
frutas[0:2]   # ["maca", "banana"] -> slicing: elementos do indice 0 (incluido) a 2 (excluido)
frutas[::-1]  # ["cereja", "banana", "maca"] -> inverte a lista (passo -1)

frutas.append("kiwi")       # adiciona ao final
frutas.insert(0, "manga")   # insere em um indice preciso
frutas.remove("banana")     # remove a primeira ocorrencia desse valor
frutas.pop()                 # remove E retorna o ultimo elemento
len(frutas)                  # numero de elementos
"maca" in frutas             # True/False -> testa a presenca de um valor
```

> **Nota:** ao contrário de um array em [C](/?c=langages-de-programmation&s=c&p=c) (tamanho fixo, um único tipo), uma lista Python é um array **dinâmico** heterogêneo: ela cresce automaticamente, e cada elemento pode ser de um tipo diferente, ao custo de um sobrecusto de memória por elemento (cada elemento é na verdade uma referência a um objeto Python, não um valor bruto contíguo como em C).

### Repetir uma lista com o operador `*`

`[x] * n` constrói uma nova lista de tamanho `n`, cada posição contendo `x`:

```python
# [0, 0, 0, 0, 0] -> pre-alocacao pratica para um tamanho conhecido de antemao
zeros = [0] * 5
# ["a", "b", "a", "b", "a", "b"] -> repete a SEQUENCIA inteira, nao cada elemento
letras = ["a", "b"] * 3
```

> **Armadilha:** `[[]] * n` NÃO cria `n` listas independentes, mas `n` referências para **a mesma** lista vazia: modificar uma modifica então as `n` ao mesmo tempo.

```python
grade = [[]] * 3
grade[0].append("x")
print(grade)   # [['x'], ['x'], ['x']] -> as 3 sublistas SAO o mesmo objeto, nao copias
```

> **Boa prática:** usar uma compreensão de lista (ver mais abaixo) para obter `n` objetos realmente distintos: `[[] for _ in range(3)]` cria uma nova lista vazia a cada iteração, ao contrário de `[[]] * 3`, que copia `n` vezes a mesma referência.

### `.append()` vs `.extend()`

```python
# ja visto: adiciona UM UNICO elemento (mesmo que seja uma lista, aninhada tal qual)
frutas.append("kiwi")
# adiciona CADA elemento do iteravel dado, um a um, ao final
frutas.extend(["kiwi", "manga"])

frutas.append(["a", "b"])  # [..., ["a", "b"]] -> UM elemento, aninhado
frutas.extend(["a", "b"])  # [..., "a", "b"]   -> DOIS elementos, achatados
```

> **Armadilha:** confundir os dois métodos em uma lista aninhada: `.append(x)` sempre adiciona `x` tal qual como um único elemento, nunca seu conteúdo desempacotado.

## O slicing em detalhe

```python
numeros = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

numeros[2:5]  # [2, 3, 4] -> do indice 2 (incluido) a 5 (excluido)
numeros[:3]   # [0, 1, 2] -> desde o inicio
numeros[7:]   # [7, 8, 9] -> ate o fim
numeros[::2]  # [0, 2, 4, 6, 8] -> um elemento a cada dois
```

## As tuplas: listas imutáveis

```python
coordenadas = (48.8566, 2.3522)

coordenadas[0]      # 48.8566
coordenadas[0] = 0  # TypeError: uma tupla nao pode ser modificada apos criada
```

Uma tupla serve tipicamente para representar um registro fixo (um par de coordenadas, um ponto RGB...) em vez de uma coleção destinada a evoluir.

### Desempacotamento (*unpacking*)

```python
latitude, longitude = coordenadas
print(latitude)   # 48.8566

a, b, c = 1, 2, 3  # funciona tambem sem parenteses explicitos: uma tupla implicita
a, b = b, a        # troca de valores, sem variavel temporaria
```

O mesmo `*` também desempacota elementos DENTRO de um literal de lista, para construir uma nova:

```python
a = [1, 2]
b = [3, 4]

[a, b]       # [[1, 2], [3, 4]] -> aninha as duas listas como 2 elementos
# [1, 2, 3, 4]     -> desempacota cada elemento de forma plana, equivalente a a + b
[*a, *b]
[*a, 0, *b]  # [1, 2, 0, 3, 4]  -> mistura-se livremente com outros elementos
```

`[*a, *b]` dá o mesmo resultado que `a + b` para duas listas, mas continua legível com mais de duas fontes ou misturado com outros elementos, o que `+` não permite de forma tão natural.

## `sorted()`: ordenar sem modificar o original

```python
notas = [12, 5, 18, 9]

sorted(notas)  # [5, 9, 12, 18] -> NOVA lista ordenada, notas permanece inalterada
notas.sort()   # ordena NO LUGAR, nao retorna nada (None), notas e modificada
```

`sorted(iterable)` também funciona em strings: a ordenação é então **lexicográfica** (caractere por caractere, como um dicionário), o que também ordena cronologicamente datas escritas em comprimento fixo (`AAAA-MM-DD...`), sem precisar analisá-las:

```python
runs = ["2026-08-14_101530", "2026-08-06_090000", "2026-08-14_090000"]
# ["2026-08-06_090000", "2026-08-14_090000", "2026-08-14_101530"] -> ordem cronologica, "de
# graca"
sorted(runs)
```

> **Armadilha:** essa ordenação lexicográfica só funciona se todos os elementos comparados tiverem o mesmo comprimento (ex. sempre `AAAA-MM-DD`): `"9"` fica DEPOIS de `"10"` em uma ordenação lexicográfica (`"9" > "1"` caractere por caractere), ao contrário de uma ordenação numérica.

## As compreensões de lista

Uma **compreensão de lista** constrói uma nova lista em uma única expressão, mais concisa e frequentemente mais rápida que um laço `for` clássico com `.append()`:

```python
quadrados = [x ** 2 for x in range(5)]
# equivalente a:
quadrados = []
for x in range(5):
    quadrados.append(x ** 2)
```

Com uma condição de filtragem:

```python
pares = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]
```

> **Nota:** uma compreensão continua legível para uma transformação simples em uma única linha; além disso (várias condições aninhadas, lógica complexa), um laço `for` clássico continua sendo mais claro de ler e depurar.

### Compreensão aninhada: achatar uma lista de listas

Uma compreensão pode encadear várias cláusulas `for`: a ordem reproduz exatamente a de laços `for` clássicos aninhados, sendo a primeira cláusula o laço EXTERIOR:

```python
listas = [[1, 2], [3, 4], [5]]

achatada = [x for sublista in listas for x in sublista]
# equivalente a:
achatada = []
for sublista in listas:  # laco exterior -> escrito PRIMEIRO na compreensao
    for x in sublista:   # laco interior -> escrito SEGUNDO
        achatada.append(x)
# achatada vale [1, 2, 3, 4, 5]
```

> **Armadilha:** achar que a ordem das cláusulas `for` está invertida em relação a laços aninhados clássicos. Não é o caso: a cláusula mais à esquerda é sempre o laço mais exterior, exatamente como lendo a compreensão da esquerda para a direita.

Além de 2 níveis de aninhamento, [`itertools.chain.from_iterable`](https://docs.python.org/3/library/itertools.html#itertools.chain.from_iterable) continua sendo uma alternativa mais legível para achatar especificamente uma lista de listas, sem reproduzir a lógica de laços aninhados.

Veja também [Os dicionários e os conjuntos](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles) para o equivalente das compreensões nessas estruturas, e [Iteradores e geradores](/?c=langages-de-programmation&s=python&p=iterateurs-et-generateurs) para a expressão geradora (variante preguiçosa de uma compreensão de lista).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma lista é mutável, uma tupla é imutável: ambas ordenadas e heterogêneas. O slicing (`[inicio:fim:passo]`) extrai uma parte; uma compreensão constrói uma lista em uma expressão, inclusive aninhada para achatar uma lista de listas. |
| **Ferramentas utilizáveis** | `append`/`insert`/`remove`/`pop`, o operador `*` para pré-alocar (`[0] * n`), slicing, desempacotamento (*unpacking*), compreensões de lista (simples ou aninhadas), `itertools.chain.from_iterable`. |
| **Armadilhas a evitar** | Tentar modificar uma tupla após criada (`TypeError`): usar uma lista se o conteúdo precisar evoluir. `[[]] * n`, que repete a mesma referência em vez de criar `n` listas distintas. Achar que a ordem das cláusulas `for` de uma compreensão aninhada está invertida em relação a laços clássicos. |
| **Boas práticas** | Usar uma tupla para um registro fixo, uma lista para uma coleção destinada a evoluir; preferir `[[] for _ in range(n)]` a `[[]] * n` para sublistas independentes; reservar a compreensão para uma transformação simples, um laço `for` além disso. |
