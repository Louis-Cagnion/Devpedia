---
order: 1
---

# Les conditions

JavaScript utilise `if`/`else if`/`else` et `switch`, avec une particularité de taille par rapport à PHP ou Python : ses règles de comparaison "souples" (`==`) sont réputées pour leurs conversions de type surprenantes.

## `if` / `else if` / `else`

```javascript
const age = 20;

if (age >= 18) {
    console.log("Vous êtes majeur.");
} else if (age >= 13) {
    console.log("Vous êtes adolescent.");
} else {
    console.log("Vous êtes enfant.");
}
```

## `==` vs `===` : encore plus critique qu'en PHP

```javascript
0 == "0"        // true  -> converti en nombre avant comparaison
0 == ""          // true  -> "" convertie en 0
null == undefined // true -> cas spécial
"" == false        // true
1 == "1"            // true

0 === "0"    // false -> types différents, aucune conversion
```

> **Note :** ces conversions implicites de `==` sont une source légendaire de bugs en JavaScript — `===`/`!==` (égalité stricte, type ET valeur) doivent être le choix par défaut, exactement comme en PHP.

## Valeurs "truthy" et "falsy"

```javascript
if (0) {}          // falsy
if ("") {}          // falsy
if (null) {}         // falsy
if (undefined) {}     // falsy
if (NaN) {}            // falsy
if ([]) {}               // TRUTHY ! (contrairement à PHP où un tableau vide est falsy)
if ({}) {}                // TRUTHY !
```

> **Note :** piège classique pour qui vient de PHP : un tableau ou objet **vide** est `truthy` en JavaScript, alors qu'il est `falsy` en PHP — toujours tester `tableau.length === 0` explicitement plutôt que `if (!tableau)`.

## L'opérateur ternaire

```javascript
const statut = age >= 18 ? "majeur" : "mineur";
```

## Coalescence nulle (`??`) et chaînage optionnel (`?.`)

```javascript
const pseudo = utilisateur.pseudo ?? "Invité";
// "??" ne retombe sur la valeur par défaut QUE si la valeur est null/undefined (pas 0, "", false)

const ville = utilisateur?.adresse?.ville ?? "Inconnue";
// "?." : si "utilisateur" ou "adresse" est null/undefined, s'arrête immédiatement et renvoie undefined
// -> évite un TypeError "Cannot read properties of undefined" en cascade
```

> **Note :** `??` diffère de `||` : `0 || "défaut"` renvoie `"défaut"` (0 est falsy pour `||`), alors que `0 ?? "défaut"` renvoie `0` (0 n'est ni `null` ni `undefined`).

## Le `switch`

```javascript
const jour = 3;

switch (jour) {
    case 1:
        console.log("Lundi");
        break;
    case 2:
    case 3:
        console.log("Début de semaine");  // pas de break entre 2 et 3 : cas partagé
        break;
    default:
        console.log("Autre jour");
}
```

`switch` compare avec l'égalité **stricte** (`===`) — pas de conversion de type surprise ici, contrairement à `if (x == y)`.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `if`/`else if`/`else` et `switch` (comparaison stricte `===`) structurent le contrôle de flux. `??` et `?.` gèrent proprement les valeurs `null`/`undefined`. |
| **Outils utilisables** | Opérateur ternaire `? :`, coalescence nulle `??`, chaînage optionnel `?.`. |
| **Pièges à éviter** | Utiliser `==` (conversions de type surprenantes) ; tester `if (tableau)` en pensant qu'un tableau vide est falsy — il est truthy en JavaScript, contrairement à PHP. |
| **Bonnes pratiques** | Toujours préférer `===`/`!==` à `==`/`!=` ; utiliser `tableau.length === 0` pour tester un tableau vide. |
