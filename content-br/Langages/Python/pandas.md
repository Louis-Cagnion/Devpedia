---
order: 15
---

# pandas — manipulação de dados tabulares

**O pandas** disponibiliza duas estruturas para a manipulação de dados tabulares: a «`Series`» (uma única coluna, indexada) e o «`DataFrame`» (uma matriz bidimensional com colunas nomeadas) — o equivalente em Python a uma tabela SQL (ver capítulo dedicado) ou a uma folha de cálculo, mas que pode ser manipulada através de código.

## Criar um DataFrame

```python
import pandas as pd

dados = pd.DataFrame({
    "nom": ["Jean", "Marie", "Ali"],
    "age": [25, 30, 22],
    "ville": ["Lyon", "Paris", "Lyon"],
})
```

```
    nom  age  ville
0  Jean   25   Lyon
1 Marie   30  Paris
2   Ali   22   Lyon
```

## Carregar e analisar dados

```python
dados = pd.read_csv("clients.csv")

dados.head()        # Primeiras 5 linhas
dados.info()          # tipos de colunas, valores em falta, memória utilizada
dados.describe()       # Estatísticas (média, desvio-padrão, mínimo/máximo) das colunas numéricas
dados.shape             # (número_de_linhas, número_de_colunas)
dados.columns            # lista de nomes de colunas
```

## Selecionar colunas e linhas

```python
dados["age"]             # uma única coluna -> uma Series
dados[["nom", "age"]]     # várias colunas -> um DataFrame

dados.loc[0]              # linha do ÍNDICE 0 (o índice apresentado à esquerda da tabela)
dados.iloc[0]              # linha na POSIÇÃO 0 (sempre a primeira, mesmo que o índice tenha sido alterado)
dados.loc[0, "nom"]         # valor exato: linha 0, coluna «nome»
```

> **Nota:** `loc` seleciona por **etiqueta** (o rótulo do índice, que pode ser um nome, uma data...), `iloc` por **posição numérica** — ambas coincidem por predefinição (índice numérico de 0 a n), mas divergem assim que o índice for personalizado (por exemplo, ordenado, filtrado ou baseado em datas).

## Filtrar com uma máscara booleana

```python
dados[dados["age"] > 25]
# mantém apenas as linhas em que a condição é verdadeira -> equivalente a um «WHERE» em SQL

dados[(dados["age"] > 20) & (dados["ville"] == "Lyon")]
# combinar várias condições: & (e), | (ou) — NÃO «and»/«or», reservados para valores booleanos simples
```

## `groupby` : agrupar por categoria

Equivalente direto do «`GROUP BY`» em SQL (ver capítulo dedicado):

```python
dados.groupby("ville")["age"].mean()
# cidade
# Lyon     23,5
# Paris    30,0
```

```python
dados.groupby("ville").agg({"age": "mean", "nom": "count"})
# várias agregações em simultâneo, uma por coluna
```

## Juntar dois DataFrames (`merge`)

Equivalente ao SQL`JOIN`e (ver capítulo dedicado):

```python
commandes = pd.DataFrame({"client_id": [1, 2], "produit": ["Vélo", "Trottinette"]})
clients = pd.DataFrame({"id": [1, 2, 3], "nom": ["Jean", "Marie", "Ali"]})

pd.merge(commandes, clients, left_on="client_id", right_on="id")
# uni as duas tabelas com base na correspondência client_id <-> id, como um INNER JOIN
```

## Adicionar/alterar uma coluna

```python
dados["age_dans_10_ans"] = dados["age"] + 10   # nova coluna, calculada a partir de outra

dados["categorie"] = dados["age"].apply(lambda idade: "jeune" if idade < 30 else "senior")
# apply(): executa uma função em cada valor da coluna
```

> **Nota (desempenho):** `.apply()` executa a função Python linha a linha, sem tirar partido da vetorização do NumPy (ver capítulo dedicado) — para uma condição simples como esta, `np.where(dados["idade"] < 30, "jeune", "senior")` faz exatamente o mesmo, mas de forma muito mais rápida num conjunto de dados de grande dimensão. `.apply()` continua a ser útil para uma lógica demasiado complexa para ser expressa com as funções vetorizadas do pandas/NumPy.

## Valores em falta

```python
dados.isna()              # tabela de True/False, com «True» nos casos em que o valor está em falta (NaN)
dados.dropna()              # elimina as linhas que contenham pelo menos um valor em falta
dados.fillna(0)               # substitui os valores em falta por um valor por defeito
```

Consulte também o capítulo sobre o NumPy (as colunas de um DataFrame são, na realidade, «`ndarray`») e sobre o SQL, cujos conceitos (`WHERE`, `GROUP BY`, `JOIN`) se encontram aqui praticamente idênticos.
