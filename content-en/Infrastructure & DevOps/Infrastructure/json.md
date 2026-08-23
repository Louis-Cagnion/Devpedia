---
order: 3
---

# The JSON Format

An [API](/?c=infrastructure&p=api-et-http) responds with data, but you still need a common format to write it in, one the receiving program can understand unambiguously. **JSON** (*[JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) Object Notation*) is the most widely used format for this: structured text, readable by both a human and a program.

## Types of values in JSON

| Type | Example | Note |
|---|---|---|
| Text (*string*) | `"Lyon"` | Always in double quotes |
| Number | `18`, `3.14` | Never in quotes |
| Boolean | `true`, `false` | |
| Missing value | `null` | "No value", not the same thing as an empty string `""` or a `0` |
| List (*array*) | `[1, 2, 3]` | An ordered sequence of values |
| Object | `{"key": value}` | A set of key/value pairs |

Text, number, and boolean are the same basic types already seen in [the variable](/?c=bases-de-l-informatique&p=la-variable); JSON adds the list and the object, to represent data made up of several values.

## A concrete example

```json
{
  "city": "Lyon",
  "temperature": 18,
  "cloudy": true,
  "forecast": [19, 21, 17],
  "station": null
}
```

An object (delimited by `{ }`) maps each key (`"city"`, `"temperature"`...) to a value: here a text, a number, a boolean, a list of numbers, and a missing value.

## Objects and lists can nest

Nothing stops a list from containing objects, or an object from containing a list; this is actually the most common structure for real-world data:

```json
{
  "customers": [
    {"name": "Smith", "age": 34},
    {"name": "Jones", "age": 28}
  ]
}
```

Here, `customers` is a list of two objects, each with its own `name` and `age` keys.

> **Pitfall:** losing track of the nesting in deeply nested JSON (objects inside lists inside objects...) and accessing the wrong value, especially when writing or reading it by hand.
>
> **Best practice:** use a tool that formats and colors JSON (most code editors do this natively) to visually spot which brace or bracket matches which other one, rather than reading it as plain text.

## JSON doesn't accept everything

Unlike many configuration formats, JSON is strict: no comments, no comma after the last element of a list or object, and keys must be in **double** quotes (never single).

```json
{
  "name": "John",
  "age": 30,   <- a comma here, after the last element, is a syntax error
}
```

> **Pitfall:** adding a comment (`// ...`) or a trailing comma out of habit from another language. JSON that's invalid for this reason fails explicitly to parse (the program trying to read it throws an error), it's never interpreted "approximately".
>
> **Best practice:** validate hand-written JSON with a dedicated tool (linter, online validator, or simply the code editor) before using it, rather than discovering the syntax error once the program is running.

## Converting between JSON and a program

A piece of JSON text remains a plain string until it's been **parsed**: turned into a data structure the language can directly manipulate (accessing a key, iterating over a list...). The reverse operation (converting a data structure back to JSON text) is called **generation** or **serialization**:

```text
json_text = '{"city": "Lyon", "temperature": 18}'

data = parse_json(json_text)     // text -> native language structure
data.temperature                   // 18, usable as a normal number

new_text = generate_json(data)   // structure -> JSON text again
```

> **Pitfall:** trying to extract a value directly from the raw text (pattern search, string splitting) instead of properly parsing the JSON: a value that happens to contain the same sequence of characters as the key you're looking for elsewhere in the text can throw off the result.
>
> **Best practice:** always go through a dedicated JSON parsing function (available natively in nearly every language) rather than treating JSON as ordinary text.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | JSON represents structured data as text, with objects (key/value) and lists, which can nest freely. It's the most common format for exchanges via an API. |
| **Tools you can use** | A code editor (syntax highlighting, automatic formatting); an online JSON validator; the language's native JSON parsing function. |
| **Pitfalls to avoid** | Adding a comment or a comma after the last element (invalid syntax). Handling JSON as plain text instead of parsing it. |
| **Best practices** | Validate hand-written JSON before using it. Always go through a dedicated parsing function to extract a value from it. |
