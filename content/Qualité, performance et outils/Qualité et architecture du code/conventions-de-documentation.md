---
order: 8
---

# Conventions de documentation du code par langage

Documenter une fonction (ce qu'elle fait, ses paramètres, ce qu'elle renvoie) est un principe universel, mais la **syntaxe exacte** pour le faire n'est pas la même d'un langage à l'autre. Chaque écosystème a sa propre convention, reconnue par ses propres outils : un IDE l'utilise pour afficher une infobulle au survol d'un appel, un générateur de documentation la transforme en site consultable. Écrire une documentation qui ne suit aucune de ces conventions (un simple paragraphe libre, par exemple) prive le projet de ces deux bénéfices, même si le contenu lui-même est correct.

## Python : Google style et NumPy style

Python n'a pas de syntaxe imposée par le langage lui-même, mais deux conventions dominent en pratique, toutes deux reconnues par les générateurs de documentation ([Sphinx](https://www.sphinx-doc.org)) :

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
| Sections | `Args:`, `Returns:` (mots-clés simples) | `Parameters`/`Returns` sous des lignes de tirets `----------` |
| Densité | Plus compacte | Plus verbeuse, chaque paramètre sur plusieurs lignes |
| Contexte d'usage typique | Projets applicatifs généralistes | Bibliothèques scientifiques (numpy, pandas, scikit-learn) |

## JavaScript / TypeScript : JSDoc

[JSDoc](https://jsdoc.app) précède la fonction d'un commentaire `/** ... */`, avec des balises `@param`/`@returns` :

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

En TypeScript, les types déjà déclarés dans la signature (`montant: number`) rendent le type JSDoc `{number}` redondant : la plupart des projets TypeScript omettent alors les annotations de type dans le commentaire, en gardant `@param`/`@returns` uniquement pour la description en langage naturel.

## Java : Javadoc

[Javadoc](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html) utilise la même syntaxe `/** ... */` que JSDoc, avec ses propres balises (`@param`, `@return`, `@throws`) :

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

L'outil `javadoc`, fourni avec le JDK, génère directement un site HTML consultable à partir de ces commentaires : c'est la documentation officielle de la bibliothèque standard Java elle-même qui est produite ainsi.

## C / C++ : Doxygen

[Doxygen](https://www.doxygen.nl) reprend une syntaxe très proche de Javadoc, mais couvre aussi le C, qui n'a pas d'équivalent natif :

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

Doxygen accepte aussi la syntaxe `///` (trois barres) ligne par ligne comme alternative au bloc `/** */`, une différence purement stylistique sans effet sur ce que l'outil extrait.

## Comparatif

| Langage | Convention | Bloc de commentaire | Balises principales | Générateur associé |
|---|---|---|---|---|
| Python | Google / NumPy style | `""" ... """` | `Args:`, `Returns:` | Sphinx |
| JavaScript / TypeScript | JSDoc | `/** ... */` | `@param`, `@returns` | JSDoc, TypeDoc |
| Java | Javadoc | `/** ... */` | `@param`, `@return`, `@throws` | javadoc (JDK) |
| C / C++ | Doxygen | `/** ... */` ou `///` | `@brief`, `@param`, `@return` | Doxygen |

> **Signal d'alerte :** un format de documentation personnalisé (un paragraphe libre, une structure ad hoc) plutôt que la convention déjà standard pour le langage utilisé. Aucun outil ne reconnaît ce format : pas d'infobulle dans l'éditeur, pas de site de documentation généré, alors que le contenu écrit est pourtant correct. Mieux vaut suivre la convention déjà établie pour l'écosystème du langage utilisé (voir le tableau ci-dessus), et rester cohérent avec elle sur l'ensemble d'un même projet plutôt que de mélanger plusieurs styles selon le fichier.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Chaque langage a sa propre convention de documentation reconnue par ses outils (Google/NumPy style en Python, JSDoc en JavaScript/TypeScript, Javadoc en Java, Doxygen en C/C++), avec des balises comme `@param`/`@returns` propres à chaque syntaxe. |
| **Outils utilisables** | Sphinx (Python), JSDoc/TypeDoc (JS/TS), javadoc (Java), Doxygen (C/C++) pour générer une documentation consultable à partir de ces commentaires. |
| **Pièges à éviter** | Inventer un format de documentation personnalisé plutôt que de suivre la convention standard du langage, ce qui prive le projet des outils associés. |
| **Bonnes pratiques** | Suivre la convention déjà établie pour l'écosystème du langage utilisé, et rester cohérent avec elle sur tout le projet. |
