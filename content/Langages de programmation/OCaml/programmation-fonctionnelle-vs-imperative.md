---
order: 1
---

# Programmation fonctionnelle vs impérative

## Instructions contre expressions

En C, Python ou JavaScript, un `if` est une **instruction** : il ne produit aucune valeur, il déclenche seulement l'exécution d'un bloc ou d'un autre.

```python
# Python : if est une instruction, chaque branche doit assigner explicitement
if age >= 18:
    message = "majeur"
else:
    message = "mineur"
```

En OCaml, comme dans la grande majorité des langages fonctionnels, `if` est une **expression** : il produit directement une valeur, comme le ferait un opérateur ternaire.

```ocaml
let message = if age >= 18 then "majeur" else "mineur"
```

Cette idée se généralise à tout le langage : un bloc entier (délimité par `let ... in`) est lui-même une expression, dont la valeur est celle de sa dernière ligne.

```ocaml
let resultat =
  let a = 2 in
  let b = 3 in
  a + b            (* résultat = 5 : c'est la valeur de tout le bloc *)
```

Il n'existe donc pas, structurellement, de distinction entre "ce qui produit une valeur" et "ce qui exécute une action" : tout produit une valeur, y compris `()` (*unit*, l'équivalent de `void`) pour une expression exécutée uniquement pour son effet.

## Liaison contre mutation

`let x = 5` en OCaml ne réserve pas un emplacement mémoire réassignable : c'est une **liaison** (*binding*), qui associe le nom `x` à la valeur `5` pour la portée où il est visible. Réutiliser `let x = ...` ne modifie rien, cela crée un nouveau nom qui masque l'ancien.

```ocaml
let x = 5 in
let x = x + 1 in  (* nouvelle liaison, ne modifie PAS le x précédent *)
print_int x       (* 6 *)
```

```python
# Python : x est réassigné, la même variable change de valeur
x = 5
x = x + 1
print(x)   # 6
```

Le résultat affiché est identique, mais le mécanisme diffère : en Python, une seule case mémoire a changé de contenu ; en OCaml, une nouvelle liaison a simplement pris le dessus sur l'ancienne dans la portée courante. OCaml propose une échappatoire explicite quand une case réellement mutable est nécessaire, la référence (`ref`), approfondie au chapitre sur l'immuabilité et les fonctions pures.

## Boucles contre récursion

Sans variable mutable par défaut, une boucle classique (qui repose sur un compteur réassigné à chaque tour) n'a pas sa place naturelle en style fonctionnel. Le remplacement est la **récursion** : une fonction qui s'appelle elle-même, chaque appel portant l'équivalent d'un tour de boucle.

```ocaml
(* Style impératif : compteur mutable, boucle for sur un tableau *)
let somme_imperative tableau =
  let total = ref 0 in
  for i = 0 to Array.length tableau - 1 do
    total := !total + tableau.(i)
  done;
  !total

(* Style fonctionnel : récursion, aucune variable mutable *)
let rec somme_fonctionnelle = function
  | [] -> 0
  | tete :: reste -> tete + somme_fonctionnelle reste
```

Les deux styles coexistent dans OCaml : `ref`, `for` et `while` existent réellement dans le langage, ce n'est pas une simulation. Le chapitre sur la récursion et les fonctions d'ordre supérieur détaille pourquoi la version récursive reste praticable même sur de grandes listes.

## Synthèse

| | Impératif (C, Python, JS...) | Fonctionnel (OCaml) |
|---|---|---|
| Unité de base | Instruction (aucune valeur) | Expression (produit toujours une valeur) |
| Variables | Réassignables par défaut | Liaisons immuables par défaut, mutation explicite via `ref` |
| Répétition | Boucles (`for`, `while`) avec compteur mutable | Récursion, fonctions d'ordre supérieur (`map`, `fold`) |
| Modèle mental | "Que faire, dans quel ordre" | "Quelle valeur, à partir de quelles autres valeurs" |

Aucun style n'est strictement supérieur : le style impératif colle souvent plus naturellement à une ressource qui change réellement dans le temps (l'état d'une interface, une connexion réseau), tandis que le style fonctionnel excelle sur des transformations de données pures. La suite de ce sujet détaille les raisons concrètes de cet avantage plutôt que de le prendre pour acquis.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | En OCaml, `if` et tout bloc sont des expressions (produisent une valeur), `let` crée une liaison immuable (pas une variable réassignable), et la récursion remplace la boucle à compteur mutable. |
| **Outils utilisables** | `let ... in`, `if ... then ... else` comme expression, `let rec` pour une fonction récursive. |
| **Pièges à éviter** | Confondre une nouvelle liaison (`let x = x + 1`) avec une réassignation : l'ancien `x` n'est pas modifié, seulement masqué dans la portée qui suit. |
| **Bonnes pratiques** | Choisir le style selon la nature du problème : impératif pour un état qui change réellement dans le temps, fonctionnel pour une transformation de données pure. |
