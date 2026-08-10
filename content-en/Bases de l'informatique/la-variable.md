---
order: 5
---

# The variable

A [program](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) executes instructions—most of which manipulate values that must be retained in memory from one line to the next. That is the role of a variable.

A **variable** is a labeled container that holds a value, which can be accessed or modified later.

```text
nom = "Jean"        → crée une boîte nommée "name", y range la valeur "Jean"
age = 25             → crée une boîte nommée "age", y range la valeur 25
afficher nom          → va lire la boîte "name", affiche "Jean"
age = 26              → remplace le contenu de la boîte "age" par 26 : la valeur change, la boîte reste la même
```

> **Analogy:** a labeled locker in a locker room—you can change what’s inside without ever changing the label on it.

> **Pitfall:** confusing the variable name with its value. `age = 26` does not rename "age": it replaces the contents of the box; the box itself (its name) never changes.
>
> **Best practice:** Choose a variable name that describes its contents (e.g., `age` rather than `x`)—this makes the code easier to read later without having to guess what’s inside.

## Some common value types

Every value has a **type**, which determines what can be done with it (adding two numbers makes sense, but adding two strings does not—the type decides):

| Type | What it stores | Example | Typical use case |
|---|---|---|---|
| Number | A quantity, either an integer or a decimal | `25`, `19.99` | Count, calculate a price |
| Text (*string*) | A sequence of characters | `"Jean"` | A name, a displayed message |
| Boolean | Only two possible values: true or false | `vrai`, `faux` | A condition ("Is the user logged in?") |

> **Further reading:** A type such as "number" actually has its own limitations and subtleties (a maximum size, possible rounding to decimals)—see [Integers, Bits, and Overflows](/?c=representation-des-donnees&p=entiers-et-debordements) to learn what actually happens in memory behind a data type.

> **Pitfall:** mixing data types in the same operation, such as adding a number and a string (`5 + "25"`). The result depends entirely on the language: some throw an error, while others silently convert one of the two, sometimes with an unexpected result (concatenating instead of adding).
>
> **Best practice:** Explicitly convert a value to the desired type before performing an operation that mixes types, rather than relying on automatic conversion, whose exact behavior is not guaranteed across different languages.

The exact syntax for creating a variable varies from one language to another (the symbol `=` is not always sufficient; some languages require you to specify the type in advance)—each language chapter on this site (Python, C, PHP...) covers its own syntax in detail.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A variable associates a name with a value, which can be changed later without changing the name. Each value has a **type** (number, text, boolean, etc.), which determines the operations that can be performed on it. |
| **Tools required** | No specific tools—declaring a variable is a language construct written directly in the code. |
| **Pitfalls to Avoid** | Confusing the variable name with its value: `age = 26` does not rename "age"; it replaces the contents of the box. |
| **Best Practices** | Choose a variable name that describes its contents (e.g., `age` rather than `x`) — this makes the code easier to read later without having to guess. |
