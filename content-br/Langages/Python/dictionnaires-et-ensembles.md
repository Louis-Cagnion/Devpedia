---
order: 5
---

# Os dicionários e os conjuntos

O **dicionário** (`dict`) associa chaves a valores, exatamente como um array associativo em [PHP](/?c=langages-de-programmation&s=php&p=php). O **conjunto** (`set`) armazena valores únicos, sem ordem nem duplicatas. As duas estruturas se apoiam internamente em uma [tabela hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage): é isso que permite que `dicionario["chave"]` ou `"valor" in conjunto` sejam quase instantâneos, mesmo em uma coleção muito grande.

## Os dicionários

```python
pessoa = {"nome": "Silva", "idade": 25}

pessoa["nome"]                          # "Silva"
pessoa["email"] = "joao@exemplo.com"    # adiciona uma nova chave
pessoa["idade"] = 26                    # modifica uma chave existente
del pessoa["idade"]                     # remove uma chave

pessoa.get("telefone")              # None se a chave nao existir (sem erro)
pessoa.get("telefone", "desconhecido")  # "desconhecido" -> valor padrao se ausente

"nome" in pessoa            # True -> testa a presenca de uma CHAVE (nao de um valor)
```

> **Nota:** `pessoa["telefone"]` (acesso direto por colchetes) lança um `KeyError` se a chave não existir; ao contrário de `.get()`, que retorna `None` (ou um valor padrão fornecido) sem nunca travar. Preferir `.get()` assim que a ausência da chave for um caso normal, não um erro.

### Por que uma chave de dict deve ser hasheável

```python
cache = {}
cache[("site_a", 42)] = "loja A"  # uma TUPLE como chave: funciona, uma tuple e imutavel, logo hasheavel

cache[["site_a", 42]] = "loja A"  # TypeError: unhashable type: 'list' -> uma lista e mutavel, nunca hasheavel
```

Uma chave de dicionário deve ser **hasheável** (um número fixo, calculado de uma vez por todas, que permite localizá-la instantaneamente na tabela hash subjacente): ela deve, portanto, ser **imutável** (`str`, número, `tuple`), nunca `list`/`dict`, que podem mudar de conteúdo depois e invalidariam esse número. Uma `tuple` de vários valores costuma servir como **chave composta**: `(site, id)` distingue duas entradas que compartilhassem o mesmo `id` em dois sites diferentes, algo que nenhum dos dois valores sozinho permitiria.

### Percorrer um dicionário

```python
for chave in pessoa:
    print(chave)                        # percorre apenas as chaves

for chave, valor in pessoa.items():
    print(f"{chave}: {valor}")           # percorre chaves E valores juntos

for valor in pessoa.values():
    print(valor)                         # percorre apenas os valores
```

### Compreensão de dicionário

```python
quadrados = {x: x ** 2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
```

### `setdefault()`: construir um dict de listas em uma linha

```python
lojas_por_site = {}

for site, id_loja in pares:
    if site not in lojas_por_site:  # sem setdefault: essa verificacao manual e necessaria...
        lojas_por_site[site] = []
    lojas_por_site[site].append(id_loja)

# equivalente em uma unica linha:
lojas_por_site.setdefault(site, []).append(id_loja)
```

`dict.setdefault(chave, valor_padrao)` retorna o valor de `chave` se ela já existir (sem tocar nela), ou a insere com `valor_padrao` E ENTÃO a retorna se ainda não existir. Encadeado com `.append()`, esse padrão agrupa elementos por categoria (aqui, a lista de lojas por site) sem nunca testar explicitamente se a chave já existe.

## Os conjuntos (`set`)

```python
frutas = {"maca", "banana", "cereja"}

frutas.add("kiwi")        # adiciona um elemento
frutas.remove("banana")   # remove um elemento (erro se ausente)
frutas.discard("manga")   # remove um elemento, SEM erro se ausente

"maca" in frutas   # True -> teste de pertencimento quase instantaneo (tabela hash)
```

### Operações de conjuntos

```python
a = {1, 2, 3}
b = {2, 3, 4}

a | b  # {1, 2, 3, 4} -> uniao
a & b  # {2, 3}       -> intersecao
a - b  # {1}           -> diferenca (em a, mas nao em b)
a ^ b  # {1, 4}        -> diferenca simetrica (em um OU outro, nao os dois)
```

> **Nota:** um `set` elimina automaticamente as duplicatas: `set([1, 2, 2, 3, 3, 3])` dá `{1, 2, 3}`. É uma forma muito comum de deduplicar rapidamente uma lista em Python: `list(set(minha_lista))`.

### Compreensão de conjunto

```python
quadrados_unicos = {x ** 2 for x in [-2, -1, 0, 1, 2]}
# {0, 1, 4} -> (-2)**2 e 2**2 valem ambos 4, portanto deduplicados automaticamente
```

Veja também [As tabelas hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage) para o que realmente acontece na memória por trás de `dict` e `set`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um `dict` associa chaves a valores, um `set` armazena valores únicos sem ordem; ambos se apoiam em uma tabela hash, portanto quase instantâneos em acesso/teste. |
| **Ferramentas utilizáveis** | `.get()` (sem erro), compreensões de dict/set, operações de conjuntos (`\|`, `&`, `-`, `^`). |
| **Armadilhas a evitar** | Acessar uma chave ausente por colchetes (`dicionario["x"]`) em vez de por `.get()`: isso lança um `KeyError`. |
| **Boas práticas** | Usar `.get()` assim que a ausência de uma chave for um caso normal, não um erro; `list(set(minha_lista))` para deduplicar rapidamente. |
