---
order: 15
---

# pandas: working with tabular data

**pandas** provides two structures for manipulating tabular data: the `Series` (a single, indexed column) and the `DataFrame` (a two-dimensional array with named columns), the Python equivalent of an SQL table (see the dedicated chapter) or a spreadsheet, but one that can be manipulated programmatically.

## Create a DataFrame

```python
import pandas as pd

data = pd.DataFrame({
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

## Load and inspect data

```python
data = pd.read_csv("clients.csv")

data.head()        # First 5 lines
data.info()          # column types, missing values, memory usage
data.describe()       # statistics (mean, standard deviation, min/max) for the numeric columns
data.shape             # (number_of_rows, number_of_columns)
data.columns            # list of column names
```

## Select columns and rows

```python
data["age"]             # a single column -> a Series
data[["nom", "age"]]     # multiple columns -> one DataFrame

data.loc[0]              # INDEX line 0 (the index displayed to the left of the table)
data.iloc[0]              # LINE 0 (always the first line, even if the index has been changed)
data.loc[0, "nom"]         # specific value: row 0, "name" column
```

> **Note:** `loc` sorts by **tag** (the index label, which can be a name, a date, etc.), `iloc` by **numerical position**; the two match by default (numerical index from 0 to n), but differ once the index has been customized (e.g., sorted, filtered, or based on dates).

## Filter using a Boolean mask

```python
data[data["age"] > 25]
# Keeps only the rows where the condition is true -> equivalent to a "WHERE" clause in SQL

data[(data["age"] > 20) & (data["ville"] == "Lyon")]
# Combine multiple conditions: & (and), | (or) -- NOT "and"/"or," which are reserved for simple Booleans
```

## `groupby` : aggregate by category

Direct SQL equivalent of the `GROUP BY` (see the dedicated chapter):

```python
data.groupby("ville")["age"].mean()
# city
# Lyon     23.5
# Paris    30.0
```

```python
data.groupby("ville").agg({"age": "mean", "nom": "count"})
# multiple aggregations at once, one per column
```

## Merging Two DataFrames (`merge`)

Equivalent to the SQL `JOIN` (see the dedicated chapter):

```python
commandes = pd.DataFrame({"client_id": [1, 2], "produit": ["Vélo", "Trottinette"]})
clients = pd.DataFrame({"id": [1, 2, 3], "nom": ["Jean", "Marie", "Ali"]})

pd.merge(commandes, clients, left_on="client_id", right_on="id")
# merges the two tables based on the client_id <-> id relationship, like an INNER JOIN
```

## Add/Edit a Column

```python
data["age_dans_10_ans"] = data["age"] + 10   # new column, calculated from another one

data["categorie"] = data["age"].apply(lambda age: "jeune" if age < 30 else "senior")
# apply(): Executes a function on each value in the column
```

> **Note (performance):** `.apply()` executes the Python function line by line, without taking advantage of NumPy vectorization (see the dedicated chapter); for a simple condition like this one, `np.where(data["age"] < 30, "jeune", "senior")` does exactly the same thing, but much faster on a large dataset. `.apply()` remains useful for logic that is too complex to express using the vectorized functions of pandas/NumPy.

## Missing Values

```python
data.isna()              # True/False array, with "True" where the value is missing (NaN)
data.dropna()              # removes rows containing at least one missing value
data.fillna(0)               # replaces missing values with a default value
```

See also the chapter on NumPy (the columns of a DataFrame are actually `ndarray`) and on SQL, whose concepts (`WHERE`, `GROUP BY`, `JOIN`) are almost identical here.
