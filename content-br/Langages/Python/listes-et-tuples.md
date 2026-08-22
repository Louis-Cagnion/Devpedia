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

> **Nota:** ao contrário de um array em C (tamanho fixo, um único tipo), uma lista Python é um array **dinâmico** heterogêneo: ela cresce automaticamente, e cada elemento pode ser de um tipo diferente, ao custo de um sobrecusto de memória por elemento (cada elemento é na verdade uma referência a um objeto Python, não um valor bruto contíguo como em C).

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

Veja também [Os dicionários e os conjuntos](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles) para o equivalente das compreensões nessas estruturas, e [Iteradores e geradores](/?c=langages-de-programmation&s=python&p=iterateurs-et-generateurs) para a expressão geradora (variante preguiçosa de uma compreensão de lista).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma lista é mutável, uma tupla é imutável: ambas ordenadas e heterogêneas. O slicing (`[inicio:fim:passo]`) extrai uma parte; uma compreensão constrói uma lista em uma expressão. |
| **Ferramentas utilizáveis** | `append`/`insert`/`remove`/`pop`, slicing, desempacotamento (*unpacking*), compreensões de lista. |
| **Armadilhas a evitar** | Tentar modificar uma tupla após criada (`TypeError`): usar uma lista se o conteúdo precisar evoluir. |
| **Boas práticas** | Usar uma tupla para um registro fixo, uma lista para uma coleção destinada a evoluir; reservar a compreensão para uma transformação simples, um laço `for` além disso. |
