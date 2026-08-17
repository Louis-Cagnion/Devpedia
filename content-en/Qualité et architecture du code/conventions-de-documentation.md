---
order: 7
---

# Code Documentation Conventions by Language

Documenting a function (what it does, its parameters, what it returns) is a universal principle, but the **exact syntax** for doing so isn't the same from one language to another. Each ecosystem has its own convention, recognized by its own tools: an IDE uses it to show a tooltip when hovering over a call, a documentation generator turns it into a browsable site. Writing documentation that follows none of these conventions (a plain free-form paragraph, for instance) deprives the project of both benefits, even if the content itself is correct.

## Python: Google style and NumPy style

Python has no syntax imposed by the language itself, but two conventions dominate in practice, both recognized by documentation generators ([Sphinx](https://www.sphinx-doc.org)):

```python
def convertir_devise(montant, taux):
    """Convertit un montant d'une devise a une autre.

    Args:
        montant (float): La somme a convertir, en devise source.
        taux (float): Le taux de change (1 unite source = taux unites cible).

    Returns:
        float: Le montant converti, en devise cible.
    """
    return montant * taux
```

| | Google style | NumPy style |
|---|---|---|
| Sections | `Args:`, `Returns:` (simple keywords) | `Parameters`/`Returns` under `----------` dash lines |
| Density | More compact | More verbose, each parameter spans several lines |
| Typical usage context | General-purpose application projects | Scientific libraries (numpy, pandas, scikit-learn) |

## JavaScript / TypeScript: JSDoc

[JSDoc](https://jsdoc.app) precedes the function with a `/** ... */` comment, with `@param`/`@returns` tags:

```javascript
/**
 * Convertit un montant d'une devise a une autre.
 * @param {number} montant - La somme a convertir, en devise source.
 * @param {number} taux - Le taux de change (1 unite source = taux unites cible).
 * @returns {number} Le montant converti, en devise cible.
 */
function convertirDevise(montant, taux) {
    return montant * taux;
}
```

In TypeScript, types already declared in the signature (`montant: number`) make the JSDoc `{number}` type redundant: most TypeScript projects then omit type annotations in the comment, keeping `@param`/`@returns` only for the natural-language description.

## Java: Javadoc

[Javadoc](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html) uses the same `/** ... */` syntax as JSDoc, with its own tags (`@param`, `@return`, `@throws`):

```java
/**
 * Convertit un montant d'une devise a une autre.
 *
 * @param montant La somme a convertir, en devise source.
 * @param taux Le taux de change (1 unite source = taux unites cible).
 * @return Le montant converti, en devise cible.
 */
double convertirDevise(double montant, double taux) {
    return montant * taux;
}
```

The `javadoc` tool, bundled with the JDK, generates a browsable HTML site directly from these comments: this is how the official documentation for the Java standard library itself is produced.

## C / C++: Doxygen

[Doxygen](https://www.doxygen.nl) uses a syntax very close to Javadoc, but also covers C, which has no native equivalent:

```cpp
/**
 * @brief Convertit un montant d'une devise a une autre.
 * @param montant La somme a convertir, en devise source.
 * @param taux Le taux de change (1 unite source = taux unites cible).
 * @return Le montant converti, en devise cible.
 */
double convertir_devise(double montant, double taux) {
    return montant * taux;
}
```

Doxygen also accepts the `///` (three slashes) syntax line by line as an alternative to the `/** */` block, a purely stylistic difference with no effect on what the tool extracts.

## Comparison

| Language | Convention | Comment block | Main tags | Associated generator |
|---|---|---|---|---|
| Python | Google / NumPy style | `""" ... """` | `Args:`, `Returns:` | Sphinx |
| JavaScript / TypeScript | JSDoc | `/** ... */` | `@param`, `@returns` | JSDoc, TypeDoc |
| Java | Javadoc | `/** ... */` | `@param`, `@return`, `@throws` | javadoc (JDK) |
| C / C++ | Doxygen | `/** ... */` or `///` | `@brief`, `@param`, `@return` | Doxygen |

> **Warning sign:** a custom documentation format (a free-form paragraph, an ad hoc structure) instead of the convention already standard for the language in use. No tool recognizes this format: no tooltip in the editor, no generated documentation site, even though the written content is otherwise correct. It's better to follow the convention already established for the ecosystem of the language in use (see the table above), and stay consistent with it across an entire project rather than mixing several styles depending on the file.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Each language has its own documentation convention recognized by its tools (Google/NumPy style in Python, JSDoc in JavaScript/TypeScript, Javadoc in Java, Doxygen in C/C++), with tags like `@param`/`@returns` specific to each syntax. |
| **Tools you can use** | Sphinx (Python), JSDoc/TypeDoc (JS/TS), javadoc (Java), Doxygen (C/C++) to generate browsable documentation from these comments. |
| **Pitfalls to avoid** | Inventing a custom documentation format instead of following the language's standard convention, which deprives the project of the associated tools. |
| **Best practices** | Follow the convention already established for the ecosystem of the language in use, and stay consistent with it across the whole project. |
