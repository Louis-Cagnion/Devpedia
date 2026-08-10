---
order: 3
---

# pandas — manipulating tabular data

**pandas** provides two structures for manipulating tabular data: the `Series` (a single column, indexed) and the `DataFrame` (a two-dimensional array with named columns)—the Python equivalent of an [SQL](/?c=domain-specific-languages-dsl&p=sql) table or a spreadsheet, but manipulable via code.

## Create a DataFrame

```python
import pandas as pd

data = pd.DataFrame({
    "name": ["Jean", "Marie", "Ali"],
    "age": [25, 30, 22],
    "city": ["Lyon", "Paris", "Lyon"],
})
```

```text
    nom  age  ville
0  Jean   25   Lyon
1 Marie   30  Paris
2   Ali   22   Lyon
```

## Loading and inspecting data

```python
data = pd.read_csv("clients.csv")

data.head()        # First 5 lines
data.info()          # column types, missing values, memory usage
data.describe()       # Statistics (mean, standard deviation, min/max) for numeric columns
data.shape             # (number_of_rows, number_of_columns)
data.columns            # List of column names
```

## Selecting Columns and Rows

```python
data["age"]             # single column -> a Series
data[["name", "age"]]     # multiple columns -> a DataFrame

data.loc[0]              # INDEX line 0 (the index displayed to the left of the table)
data.iloc[0]              # LINE 0 (always the first line, even if the index has been changed)
data.loc[0, "name"]         # Exact value: row 0, column "name"
```

> **Note:** `loc` sorts by **label** (the index label, which can be a name, a date, etc.), `iloc` by **numerical position**—the two coincide by default (numerical index from 0 to n), but differ once the index has been customized (e.g., sorted, filtered, or based on dates).

## Filtering with a Boolean mask

```python
data[data["age"] > 25]
# Keeps only the rows where the condition is true -> equivalent to a "WHERE" clause in SQL

data[(data["age"] > 20) & (data["city"] == "Lyon")]
# Combine multiple conditions: & (and), | (or) -- NOT "and"/"or," which are reserved for simple Booleans
```

## `groupby` : group by category

Direct equivalent of the [`GROUP BY`](/?c=domain-specific-languages-dsl&p=sql) in [SQL]:

```python
data.groupby("city")["age"].mean()
# city
# Lyon     23.5
# Paris    30.0
```

```python
data.groupby("city").agg({"age": "mean", "name": "count"})
# Multiple aggregations at once, one per column
```

## Merging two DataFrames (`merge`)

Equivalent to the `JOIN` [SQL](/?c=domain-specific-languages-dsl&p=sql):

```python
commandes = pd.DataFrame({"client_id": [1, 2], "product": ["Bicycle", "Scooter"]})
clients = pd.DataFrame({"id": [1, 2, 3], "name": ["Jean", "Marie", "Ali"]})

pd.merge(commandes, clients, left_on="client_id", right_on="id")
# Merges the two tables based on the client_id <-> id match, like an INNER JOIN
```

## Add/edit a column

```python
data["age_in_10_years"] = data["age"] + 10   # New column, calculated from another

data["category"] = data["age"].apply(lambda age: "young" if age < 30 else "senior")
# apply(): Executes a function on each value in the column
```

> **Note (performance):** `.apply()` executes the Python function line by line, without taking advantage of [NumPy](/?c=data-science&p=numpy) vectorization—for a simple condition like this one, `np.where(data["age"] < 30, "jeune", "senior")` does exactly the same thing, but much faster on a large dataset. `.apply()` remains useful for logic that is too complex to express using the vectorized functions of pandas/NumPy.

## Missing values

```python
data.isna()              # True/False array, where "True" is used where a value is missing (NaN)
data.dropna()              # Removes lines containing at least one missing value
data.fillna(0)               # Replaces missing values with a default value
```

See also the chapter on [NumPy](/?c=data-science&p=numpy) (the columns of a DataFrame are actually `ndarray`) and on [SQL](/?c=domain-specific-languages-dsl&p=sql), whose concepts (`WHERE`, `GROUP BY`, `JOIN`) are almost identical here.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | pandas manipulates tabular data using `Series` (a column) and `DataFrame` (a table), with operations similar to SQL (`WHERE` → Boolean filter, `GROUP BY` → `groupby`, `JOIN` → `merge`). |
| **Tools available** | `read_csv`, `loc` / `iloc`, `groupby`, `merge`, `isna` / `dropna` / `fillna`. |
| **Pitfalls to Avoid** | Confusing `loc` (by tag) and `iloc` (by position)—they differ once the index has been customized. |
| **Best Practices** | Use a `np.where` function instead of `.apply()` for a simple condition applied to a large dataset. |
