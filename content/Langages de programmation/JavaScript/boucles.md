---
order: 2
---

# Les boucles

JavaScript propose les boucles classiques (`for`, `while`, `do...while`), plus deux boucles dédiées au parcours de collections (`for...of`, `for...in`) — et, dans la pratique quotidienne, les méthodes fonctionnelles des tableaux (`map`, `filter`...) remplacent souvent une boucle explicite.

## `for` classique

```javascript
for (let i = 0; i < 5; i++) {
    console.log(i);
}
```

## `while` et `do...while`

```javascript
let i = 0;
while (i < 5) {
    console.log(i);
    i++;
}

let j = 0;
do {
    console.log(j);
    j++;
} while (j < 5);   // s'exécute au moins une fois, condition testée après
```

## `for...of` : parcourir les valeurs d'un itérable

```javascript
const fruits = ["pomme", "banane", "cerise"];

for (const fruit of fruits) {
    console.log(fruit);
}

for (const caractere of "abc") {   // fonctionne aussi sur une chaîne
    console.log(caractere);
}
```

## `for...in` : parcourir les clés d'un objet

```javascript
const personne = { nom: "Jean", age: 25 };

for (const cle in personne) {
    console.log(`${cle} : ${personne[cle]}`);
}
```

> **Note :** `for...in` parcourt les **clés énumérables** d'un objet — ne jamais l'utiliser sur un tableau (`for...in` parcourrait les index, mais aussi n'importe quelle propriété ajoutée manuellement au tableau, et ne garantit pas l'ordre) : `for...of` ou `.forEach()` sont les bons outils pour un tableau.

## `break` et `continue`

```javascript
for (let i = 0; i < 10; i++) {
    if (i === 5) break;
    if (i % 2 === 0) continue;
    console.log(i);
}
```

## Les méthodes fonctionnelles de tableau : l'alternative idiomatique

En JavaScript moderne, transformer ou filtrer un tableau passe plus souvent par ces méthodes que par une boucle `for` explicite :

```javascript
const nombres = [1, 2, 3, 4, 5];

nombres.forEach(n => console.log(n));            // exécute une fonction pour chaque élément
const doubles = nombres.map(n => n * 2);           // [2, 4, 6, 8, 10] -> transforme chaque élément
const pairs = nombres.filter(n => n % 2 === 0);      // [2, 4] -> ne garde que ce qui correspond
const somme = nombres.reduce((acc, n) => acc + n, 0); // 15 -> réduit tout le tableau à une seule valeur
```

> **Note :** `reduce()` est la plus polyvalente mais la moins immédiatement lisible : `acc` (l'accumulateur) part de la valeur initiale fournie en second argument (`0` ici), et se met à jour à chaque élément selon la fonction fournie.

Voir aussi [Les fonctions](/?c=langages-de-programmation&s=javascript&p=fonctions) pour la syntaxe des fonctions fléchées (`=>`) utilisées ici.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `for`/`while`/`do...while` sont les boucles classiques ; `for...of` parcourt les valeurs d'un itérable, `for...in` les clés d'un objet. Les méthodes fonctionnelles (`map`/`filter`/`reduce`) remplacent souvent une boucle explicite. |
| **Outils utilisables** | `break`/`continue`, `forEach`/`map`/`filter`/`reduce`. |
| **Pièges à éviter** | Utiliser `for...in` sur un tableau — parcourt aussi des propriétés ajoutées manuellement, sans garantir l'ordre. |
| **Bonnes pratiques** | `for...of` ou `.forEach()` pour un tableau ; les méthodes fonctionnelles pour transformer/filtrer plutôt qu'une boucle manuelle. |
