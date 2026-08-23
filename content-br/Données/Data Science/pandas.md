---
order: 3
---

# pandas: manipular dados tabulares

O **pandas** fornece duas estruturas para manipular dados tabulares: a `Series` (uma única coluna, indexada) e o `DataFrame` (uma tabela bidimensional com colunas nomeadas), o equivalente [Python](/?c=langages-de-programmation&s=python&p=python) de uma tabela [SQL](/?c=domain-specific-languages-dsl&p=sql) ou de uma planilha, mas manipulável por código.

## Criar um DataFrame

```python
import pandas as pd

dados = pd.DataFrame({
    "nome": ["João", "Maria", "Ali"],
    "idade": [25, 30, 22],
    "cidade": ["Curitiba", "São Paulo", "Curitiba"],
})
```

```text
    nome  idade     cidade
0   João     25   Curitiba
1  Maria     30  São Paulo
2    Ali     22   Curitiba
```

## Carregar e inspecionar dados

```python
dados = pd.read_csv("clientes.csv")

dados.head()      # 5 primeiras linhas
dados.info()      # tipos de colunas, valores ausentes, memória usada
dados.describe()  # estatísticas (média, desvio padrão, min/max) das colunas numéricas
dados.shape       # (numero_de_linhas, numero_de_colunas)
dados.columns     # lista dos nomes de colunas
```

## Selecionar colunas e linhas

```python
dados["idade"]            # uma única coluna -> uma Series
dados[["nome", "idade"]]  # várias colunas -> um DataFrame

dados.loc[0]          # linha de ÍNDICE 0 (o rótulo exibido à esquerda da tabela)
dados.iloc[0]         # linha de POSIÇÃO 0 (sempre a primeira, mesmo se o índice foi alterado)
dados.loc[0, "nome"]  # valor preciso: linha 0, coluna "nome"
```

> **Nota:** `loc` seleciona por **rótulo** (o label do índice, que pode ser um nome, uma data...), `iloc` por **posição numérica**; os dois coincidem por padrão (índice numérico de 0 a n), mas divergem assim que o índice foi personalizado (ex.: ordenado, filtrado, ou baseado em datas).

## Filtrar com uma máscara booleana

```python
dados[dados["idade"] > 25]
# mantém apenas as linhas em que a condição é verdadeira -> equivalente de um "WHERE" em SQL

dados[(dados["idade"] > 20) & (dados["cidade"] == "Curitiba")]
# combinar várias condições: & (e), | (ou) -- NÃO "and"/"or", reservados a booleanos simples
```

## `groupby`: agregar por categoria

Equivalente direto do `GROUP BY` em [SQL](/?c=domain-specific-languages-dsl&p=sql):

```python
dados.groupby("cidade")["idade"].mean()
# cidade
# Curitiba     23.5
# São Paulo    30.0
```

```python
dados.groupby("cidade").agg({"idade": "mean", "nome": "count"})
# várias agregações ao mesmo tempo, uma por coluna
```

## Combinar dois DataFrames (`merge`)

Equivalente do `JOIN` em [SQL](/?c=domain-specific-languages-dsl&p=sql):

```python
pedidos = pd.DataFrame({"id_cliente": [1, 2], "produto": ["Bicicleta", "Patinete"]})
clientes = pd.DataFrame({"id": [1, 2, 3], "nome": ["João", "Maria", "Ali"]})

pd.merge(pedidos, clientes, left_on="id_cliente", right_on="id")
# combina as duas tabelas pela correspondência id_cliente <-> id, como um INNER JOIN
```

## Adicionar/modificar uma coluna

```python
dados["idade_em_10_anos"] = dados["idade"] + 10   # nova coluna, calculada a partir de outra

dados["categoria"] = dados["idade"].apply(lambda idade: "jovem" if idade < 30 else "senior")
# apply(): executa uma função em cada valor da coluna
```

> **Nota (performance):** `.apply()` executa a função Python linha por linha, sem aproveitar a vetorização do [NumPy](/?c=data-science&p=numpy): para uma condição simples como essa, `np.where(dados["idade"] < 30, "jovem", "senior")` faz exatamente a mesma coisa, muito mais rápido em um conjunto de dados grande. `.apply()` continua útil para uma lógica muito complexa para ser expressa com as funções vetorizadas do pandas/NumPy.

## Valores ausentes

```python
dados.isna()     # array de True/False, True onde o valor está ausente (NaN)
dados.dropna()   # remove as linhas que contêm ao menos um valor ausente
dados.fillna(0)  # substitui os valores ausentes por um valor padrão
```

Veja também o capítulo sobre [NumPy](/?c=data-science&p=numpy) (as colunas de um DataFrame são na realidade `ndarray`) e sobre [SQL](/?c=domain-specific-languages-dsl&p=sql), cujos conceitos (`WHERE`, `GROUP BY`, `JOIN`) se repetem quase de forma idêntica aqui.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | O pandas manipula dados tabulares via `Series` (uma coluna) e `DataFrame` (uma tabela), com operações próximas do SQL (`WHERE` → máscara booleana, `GROUP BY` → `groupby`, `JOIN` → `merge`). |
| **Ferramentas úteis** | `read_csv`, `loc`/`iloc`, `groupby`, `merge`, `isna`/`dropna`/`fillna`. |
| **Armadilhas a evitar** | Confundir `loc` (por rótulo) e `iloc` (por posição): eles divergem assim que o índice foi personalizado. |
| **Boas práticas** | Preferir uma função vetorizada (`np.where`) a `.apply()` para uma condição simples em um conjunto de dados grande. |
