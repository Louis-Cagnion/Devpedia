---
order: 6
---

# Les nombres

JavaScript se distingue par un choix radical : il n'a longtemps eu **qu'un seul type numérique**, `number`, qui est un flottant double précision (IEEE 754). Il ne distingue donc pas les entiers des décimaux : `1` et `1.0` sont la même valeur.

> Les comportements surprenants qui en découlent (`0.1 + 0.2 !== 0.3`, la limite des grands entiers, `NaN !== NaN`) ne sont **pas** propres à JavaScript : ils viennent de l'encodage des flottants, commun à tous les langages. Leur explication complète se trouve dans le chapitre [Les nombres à virgule flottante](/?c=representation-des-donnees&p=nombres-flottants). Ce chapitre-ci se concentre sur ce que JavaScript en fait.

## Un seul type, donc des entiers flottants

```js
typeof 42;    // "number"
typeof 42.5;  // "number"
typeof NaN;   // "number"

42 === 42.0;       // true : aucune distinction
5 / 2;             // 2.5 -> pas de division entiere implicite
Math.trunc(5 / 2)  // 2   -> il faut la demander explicitement
```

L'absence de division entière native est un piège fréquent pour qui vient de C ou de [Python](/?c=langages-de-programmation&s=python&p=python) (`5 // 2`).

## Comparer des décimaux

Comme partout, on ne compare pas deux flottants avec `===` mais via une marge d'erreur :

```js
const epsilon = 0.0001;
if (Math.abs(a - b) < epsilon) { /* consideres comme egaux */ }
```

JavaScript fournit `Number.EPSILON` (≈ `2,22e-16`), qui est l'écart entre `1` et le flottant suivant. Utile pour des valeurs proches de 1, mais **trop strict** dès qu'on manipule de grands nombres :

```js
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON;          // true
Math.abs(1e9 + 0.1 - (1e9 + 0.2)) < Number.EPSILON;  // false, alors que l'ecart est infime
```

Pour des montants, la bonne pratique reste de travailler en **centimes**, avec des entiers.

## La limite des entiers exacts

La mantisse d'un double faisant 52 bits, les entiers ne sont exacts que jusqu'à 2⁵³ − 1 :

```js
Number.MAX_SAFE_INTEGER;                // 9007199254740991
9007199254740992 === 9007199254740993;  // true ! indiscernables
Number.isSafeInteger(2 ** 53);          // false
```

C'est un problème concret dès qu'on manipule des identifiants venant d'une base de données en `BIGINT` : au-delà de cette limite, JavaScript les arrondit silencieusement. La parade habituelle est de les transporter en **chaîne de caractères** dans le JSON.

## `BigInt` : les entiers de taille arbitraire

Depuis ES2020, `BigInt` lève cette limite. Il se note avec un `n` final :

```js
9007199254740993n === 9007199254740992n;  // false : exact
2n ** 64n;                                // 18446744073709551616n
```

Deux contraintes à connaître :

```js
1n + 1;         // TypeError : on ne melange pas BigInt et number
1n + BigInt(1)  // 2n : conversion explicite obligatoire
5n / 2n;        // 2n : division entiere, la partie decimale est tronquee
```

`BigInt` sert aux grands identifiants et à la cryptographie, pas aux calculs décimaux : il ne gère que des entiers.

## `NaN` et les infinis

```js
1 / 0;            // Infinity  (et non une erreur)
-1 / 0;           // -Infinity
0 / 0;            // NaN
parseInt("abc");  // NaN

NaN === NaN;         // false : NaN n'egale rien, pas meme lui-meme
Number.isNaN(NaN);   // true  -> la bonne facon de tester
isNaN("abc");        // true  -> ATTENTION : convertit d'abord, donc trompeur
Number.isNaN("abc")  // false -> "abc" n'est pas NaN, c'est une chaine
```

Préférez systématiquement `Number.isNaN()` à l'ancienne fonction globale `isNaN()`, qui convertit son argument avant de tester et produit des faux positifs.

## Conversions depuis une chaîne

```js
Number("42");        // 42
Number("42px");      // NaN   -> strict : tout ou rien
parseInt("42px");    // 42    -> tolerant : s'arrete au premier caractere invalide
parseFloat("3.9m");  // 3.9
Number("");          // 0     -> piege classique : la chaine vide devient 0
```

`parseInt` accepte un second argument, la base, qu'il est prudent de toujours préciser : `parseInt("08", 10)`.

## Formater pour l'affichage

```js
(1234.5678).toFixed(2);          // "1234.57" -> renvoie une CHAINE, pas un nombre
(0.000001234).toExponential(2);  // "1.23e-6"

(1234567.891).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
// "1 234 567,89 €"
```

`toLocaleString` gère seul les séparateurs de milliers et la virgule décimale française : inutile de les reconstruire à la main.

## Résumé

| Piège | Réflexe |
|---|---|
| Un seul type `number` (flottant) | `Math.trunc()` pour une division entière |
| `0.1 + 0.2 !== 0.3` | Comparer via une marge d'erreur |
| Montants monétaires | Travailler en centimes |
| Identifiants > 2⁵³ | Les transporter en chaîne, ou utiliser `BigInt` |
| `NaN !== NaN` | `Number.isNaN()`, jamais `isNaN()` |
| `Number("")` vaut `0` | Valider avant de convertir |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | JavaScript n'a qu'un seul type numérique (`number`, flottant IEEE 754) : pas de distinction entier/décimal native. `BigInt` lève la limite des grands entiers exacts (2⁵³ − 1). |
| **Outils utilisables** | `Math.trunc`, `Number.isNaN`, `Number.isSafeInteger`, `toFixed`/`toLocaleString` pour l'affichage. |
| **Pièges à éviter** | Comparer deux flottants avec `===` ; utiliser `isNaN()` global (convertit avant de tester) plutôt que `Number.isNaN()`. |
| **Bonnes pratiques** | Travailler en centimes pour des montants ; transporter un grand identifiant en chaîne de caractères plutôt qu'en `number`. |
