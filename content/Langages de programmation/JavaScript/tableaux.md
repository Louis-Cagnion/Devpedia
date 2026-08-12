---
order: 5
---

# Les tableaux

Un tableau (array) en JavaScript est une structure permettant de stocker plusieurs valeurs dans une seule variable, sous forme de liste ordonnée. Chaque valeur est accessible via son index, qui commence toujours à 0.

Il peut être créé de 2 manières différentes :

```javascript
// littéral, la plus courante
const arr1 = [1, 2, 3];

// avec le constructeur Array
const arr2 = new Array(1, 2, 3);

// un tableau peut contenir des types différents, y compris d'autres tableaux ou objets
const arr3 = [1, 'hello', true, { id: 1 }, [1, 2]];
```

### Les prototypes de tableaux

Les prototypes sont des fonctions intégrées à l'objet array par défaut, permettant d'effectuer certaines actions sur le tableau (ajouter, retirer, transformer, parcourir des éléments...). Une partie modifie le tableau d'origine (elles le **mutent**), l'autre renvoie toujours une copie sans y toucher :

| Méthode | Effet | Mute le tableau d'origine ? |
|---|---|---|
| `includes(valeur)` | Teste la présence d'une valeur (`true`/`false`) | Non |
| `length` | Propriété (pas une méthode) : nombre d'éléments | - |
| `push(x)` / `pop()` | Ajoute / retire un élément en **fin** de tableau | Oui |
| `unshift(x)` / `shift()` | Ajoute / retire un élément en **début** de tableau | Oui |
| `slice(debut, fin)` | Copie une portion (`fin` exclu) | Non |
| `splice(index, n)` | Retire (et peut insérer) des éléments à un index donné | Oui |
| `indexOf(valeur)` | Index de la première occurrence, `-1` si absente | Non |
| `map(fn)` | Nouveau tableau transformé | Non |
| `filter(fn)` | Nouveau tableau filtré | Non |
| `forEach(fn)` | Exécute une action par élément, ne renvoie rien | Non |
| `some(fn)` / `every(fn)` | Au moins un / tous les éléments valident la condition | Non |
| `find(fn)` / `findIndex(fn)` | Premier élément (ou son index) qui valide la condition | Non |
| `reduce(fn, initial)` | Réduit le tableau à une seule valeur accumulée | Non |
| `join(separateur)` | Concatène les éléments en une seule chaîne | Non |
| `reverse()` | Inverse l'ordre des éléments | Oui |
| `sort(fn)` | Trie les éléments (voir la note ci-dessous) | Oui |
| `concat(autre)` | Assemble plusieurs tableaux en un nouveau tableau | Non |

```javascript
const arr = [1, 2, 3, 4, 5];

arr.includes(3);                     // true
arr.push(6);                         // arr devient [1, 2, 3, 4, 5, 6]
arr.pop();                           // retire 6 et le renvoie, arr redevient [1, 2, 3, 4, 5]
arr.slice(0, 2);                     // [1, 2], copie -> arr inchangé
arr.map(n => n * 2);                 // [2, 4, 6, 8, 10], copie -> arr inchangé
arr.filter(n => n > 2);              // [3, 4, 5]
arr.find(n => n > 2);                // 3, le premier élément qui correspond
arr.reduce((acc, n) => acc + n, 0);  // 15, accumulateur parti de 0
arr.join(', ');                      // '1, 2, 3, 4, 5'
```

> **Note :** par défaut, `sort()` trie en convertissant les éléments en **chaînes** (ce qui pose problème avec les nombres, ex. `10` passe avant `2`) : fournir une fonction de comparaison (`arr.sort((a, b) => a - b)`) pour trier des nombres correctement.

> **Piège :** confondre une méthode qui mute le tableau d'origine (`push`, `splice`, `sort`, `reverse`) avec une méthode qui renvoie une copie (`slice`, `map`, `filter`) : `arr.sort()` change silencieusement `arr` lui-même, alors qu'on s'attend parfois à obtenir une copie triée.
>
> **Bonne pratique :** vérifier la colonne "Mute le tableau d'origine ?" ci-dessus avant d'utiliser une méthode peu familière ; copier le tableau (`[...arr]` ou `slice()`) avant une opération mutante si l'original doit rester intact.

### Le destructuring et le spread

Le **destructuring** permet d'extraire directement des valeurs d'un tableau dans des variables, dans l'ordre des éléments.

```javascript
const arr = [1, 2, 3];
const [premier, deuxieme] = arr; // premier = 1, deuxieme = 2
```

Le **spread** (`...`) permet de "déplier" un tableau, ce qui est utile pour le copier ou en fusionner plusieurs entre eux.

```javascript
const copie = [...arr];         // copie indépendante de arr
const fusion = [...arr, 4, 5];  // [1, 2, 3, 4, 5]
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un tableau stocke une liste ordonnée de valeurs, indexée à partir de 0, pouvant mélanger n'importe quel type. Certaines méthodes le modifient directement, d'autres renvoient une copie transformée. |
| **Outils utilisables** | `push`/`pop`/`shift`/`unshift`, `map`/`filter`/`reduce`, `find`/`findIndex`, `sort`, destructuring et spread (`...`). |
| **Pièges à éviter** | Confondre une méthode qui mute le tableau d'origine (`sort`, `splice`, `reverse`) avec une méthode qui renvoie une copie (`slice`, `map`, `filter`). |
| **Bonnes pratiques** | Utiliser `[...arr]` ou `slice()` avant une opération mutante si l'original doit rester intact ; fournir une fonction de comparaison à `sort()` pour trier des nombres correctement. |
