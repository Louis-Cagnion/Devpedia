---
order: 4
---

# Les strings

Une string est une suite de caractères, utilisée pour représenter du texte. En JavaScript, elle peut être écrite de 3 manières différentes :

```javascript
// guillemets simples
const str1 = 'Hello world';

// guillemets doubles : strictement équivalents aux guillemets simples
const str2 = "Hello world";

// backticks (template literals) : seuls à permettre l'interpolation et le multi-ligne
const nom = 'Jean';
const str3 = `Bonjour ${nom} !`;   // 'Bonjour Jean !' -> ${...} insère directement une variable

const str4 = `Ligne 1
Ligne 2`;                          // les retours à la ligne du code source sont conservés tels quels
```

### Les prototypes de strings

Les prototypes sont des fonctions intégrées à l'objet string par défaut, permettant d'effectuer certaines actions sur la string. Une string est **immuable** en JavaScript : aucune de ces méthodes ne la modifie, chacune renvoie toujours une nouvelle valeur.

| Méthode | Effet |
|---|---|
| `includes(sous-chaîne)` | Teste la présence d'une sous-chaîne (`true`/`false`) |
| `length` | Propriété (pas une méthode) : nombre de caractères |
| `slice(debut, fin)` | Extrait une portion (`fin` exclu) |
| `toUpperCase()` / `toLowerCase()` | Copie entièrement en majuscules / minuscules |
| `trim()` | Copie sans les espaces inutiles au début et à la fin |
| `replace(a, b)` / `replaceAll(a, b)` | Remplace la première occurrence / toutes les occurrences |
| `split(separateur)` | Découpe en tableau de sous-chaînes |
| `indexOf(sous-chaîne)` | Index de la première occurrence, `-1` si absente |
| `startsWith(x)` / `endsWith(x)` | Teste si la chaîne commence / finit par `x` |
| `repeat(n)` | Répète la chaîne `n` fois |
| `concat(autre)` | Assemble plusieurs chaînes |

```javascript
const str = 'hello world';

str.includes('hello');       // true
str.slice(0, 5);             // 'hello'
str.toUpperCase();           // 'HELLO WORLD'
str.trim();                  // copie sans espaces superflus
str.replace('hello', 'hi');  // 'hi world', une seule occurrence
str.replaceAll('o', '0');    // 'hell0 w0rld', toutes les occurrences
str.split(' ');              // ['hello', 'world']
str.startsWith('hello');     // true
str.repeat(2);               // 'hello worldhello world'
```

> **Piège :** toutes ces méthodes renvoient une **nouvelle** string, sans jamais modifier l'originale. `str.toUpperCase();` seule ne change rien à `str` ; il faut réassigner : `str = str.toUpperCase();`.
>
> **Bonne pratique :** toujours réassigner (ou utiliser directement) le résultat d'une méthode de string, jamais supposer qu'elle a modifié la variable d'origine.

### Les regex

On peut utiliser [les regex](/?c=langages-de-programmation&s=javascript&p=regex) pour rechercher ou collecter des informations dans des strings.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une string se déclare avec des guillemets simples, doubles, ou des backticks (*template literals*, pour l'interpolation et le multi-ligne). Elle est immuable : chaque méthode renvoie une nouvelle string. |
| **Outils utilisables** | `includes`, `slice`, `toUpperCase`/`toLowerCase`, `trim`, `replace`/`replaceAll`, `split`, `indexOf`, `startsWith`/`endsWith`. |
| **Pièges à éviter** | Appeler une méthode de transformation (`toUpperCase`, `trim`...) sans réassigner le résultat, en pensant que la string d'origine a changé. |
| **Bonnes pratiques** | Utiliser les backticks pour toute string qui interpole une variable ou s'étend sur plusieurs lignes, plutôt qu'une concaténation avec `+`. |
