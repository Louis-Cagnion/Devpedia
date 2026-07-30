---
order: 5
---

# Dicionários e conjuntos

O **dicionário** (`dict`) associa chaves a valores, exatamente como um tabuleiro associativo em PHP. O conjunto (`set`) armazena valores únicos, sem ordem nem duplicados. Ambas as estruturas baseiam-se internamente numa **tabela de hash** (ver capítulo dedicado, secção C) — é isso que permite que `dico["chave"]` ou `"valor" in ensemble` sejam praticamente instantâneos, mesmo numa coleção muito grande.

## Os dicionários

```python
pessoa = {"nom": "Dupont", "age": 25}

pessoa["nom"]          # «Dupont»
pessoa["email"] = "jean@exemple.com"  # adiciona uma nova chave
pessoa["age"] = 26      # altera uma chave existente
del pessoa["age"]         # elimina uma chave

pessoa.get("telephone")           # Nenhuma, se a chave não existir (sem erro)
pessoa.get("telephone", "inconnu") # «desconhecido» -> valor por predefinição, caso não exista

"nom" in pessoa            # True -> verifica a existência de uma CHAVE (não de um valor)
```

> **Nota:** `pessoa["telephone"]` (acesso direto através de colchetes) lança uma exceção «`KeyError`» se a chave não existir — ao contrário de `.get()`, que devolve «`None`» (ou um valor por defeito fornecido) sem nunca falhar. Deve-se dar preferência a `.get()` sempre que a ausência da chave for um caso normal, e não um erro.

### Navegar num dicionário

```python
for chave in pessoa:
    print(chave)                      # analisa apenas as chaves

for chave, valor in pessoa.items():
    print(f"{chave} : {valor}")       # percorre chaves E valores em conjunto

for valor in pessoa.values():
    print(valor)                    # percorre apenas os valores
```

### Compreensão do dicionário

```python
carres = {x: x ** 2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
```

## Conjuntos (`set`)

```python
frutas = {"pomme", "banane", "cerise"}

frutas.add("kiwi")        # adiciona um elemento
frutas.remove("banane")    # retira um elemento (ocorre um erro se não existir)
frutas.discard("mangue")    # retira um elemento, SEM gerar erro caso este não exista

"pomme" in frutas   # True -> teste de pertença quase instantâneo (tabela hash)
```

### Operações com conjuntos

```python
a = {1, 2, 3}
b = {2, 3, 4}

a | b   # {1, 2, 3, 4} -> união
a & b   # {2, 3}       -> interseção
a - b   # {1}           -> diferença (em a, não em b)
a ^ b   # {1, 4}        -> diferença simétrica (num OU noutro, mas não em ambos)
```

> **Nota:** um `set` elimina automaticamente as entradas duplicadas — `set([1, 2, 2, 3, 3, 3])` resulta em `{1, 2, 3}`. Esta é uma forma muito comum de deduplicar rapidamente uma lista em Python: `list(set(ma_liste))`.

### Visão geral

```python
carres_uniques = {x ** 2 for x in [-2, -1, 0, 1, 2]}
# {0, 1, 4} -> (-2)² e 2² valem ambos 4, pelo que são automaticamente deduplicados
```

Consulte também o capítulo sobre tabelas hash (secção C) para saber o que realmente acontece na memória por trás de `dict` e `set`.
