---
order: 4
---

# Récursion et fonctions d'ordre supérieur

## La récursion remplace la boucle

Sans variable mutable par défaut, répéter un traitement passe par une fonction qui s'appelle elle-même, chaque appel réduisant le problème d'un pas :

```ocaml
let rec factorielle n =
  if n = 0 then 1
  else n * factorielle (n - 1)

factorielle 5   (* 120 *)
```

## Récursion terminale : éviter de faire croître la pile

`factorielle` ci-dessus n'est **pas terminale** (*not tail-recursive*) : à chaque appel, la multiplication `n * ...` attend le résultat de l'appel récursif avant de pouvoir s'exécuter. Chaque appel en attente reste donc sur la **pile d'appels** (cf. chapitre [L'organisation en mémoire](/?c=representation-des-donnees&p=organisation-en-memoire) pour la distinction pile/tas), jusqu'à ce que le cas de base soit atteint puis que toutes les multiplications se déroulent en cascade en remontant.

Une version **terminale** porte le résultat intermédiaire dans un argument supplémentaire (un **accumulateur**), si bien que l'appel récursif est la toute dernière chose faite dans la fonction ; rien n'attend plus après lui :

```ocaml
let factorielle_terminale n =
  let rec aux n acc =
    if n = 0 then acc
    else aux (n - 1) (n * acc)     (* dernier appel : rien ne reste en attente après *)
  in
  aux n 1
```

Le compilateur OCaml reconnaît cette forme et l'optimise en une simple boucle au niveau du code machine généré : la pile ne grandit **pas** d'un appel à l'autre, quelle que soit la profondeur de récursion. C'est ce qui rend la récursion praticable même sur des listes de plusieurs millions d'éléments, là où une version non terminale finirait par épuiser la pile (*stack overflow*).

## Fonctions d'ordre supérieur : `map`, `filter`, `fold`

Une fonction d'ordre supérieur prend une fonction en argument, ou en renvoie une, le même principe qu'un décorateur Python (cf. chapitre [Les décorateurs](/?c=langages-de-programmation&s=python&p=decorateurs)), généralisé à toute la bibliothèque standard de listes plutôt que réservé à un cas d'usage précis.

```ocaml
let carres = List.map (fun x -> x * x) [1; 2; 3; 4]           (* [1; 4; 9; 16] *)
let pairs = List.filter (fun x -> x mod 2 = 0) [1; 2; 3; 4]     (* [2; 4] *)
let somme = List.fold_left (+) 0 [1; 2; 3; 4]                  (* 10 *)
```

Ces trois fonctions couvrent, à elles seules, la quasi-totalité des boucles `for` (cf. chapitre [Les boucles](/?c=langages-de-programmation&s=c&p=boucles), rubrique C) qu'on écrirait pour transformer une collection (`map`), en garder une partie (`filter`), ou l'agréger en une seule valeur (`fold`) :

```c
// Équivalent impératif de la somme, en C
int total = 0;
for (int i = 0; i < taille; i++) {
    total += tableau[i];
}
```

La version `fold_left` ne mentionne jamais explicitement de compteur ni de variable intermédiaire : le "comment parcourir" est entièrement délégué à `List.fold_left`, et le code n'exprime plus que le "quoi faire à chaque élément" (`(+)`) et l'état de départ (`0`).

> **Note :** `fold_left` accumule de gauche à droite (`(((0 + 1) + 2) + 3) + 4`) ; pour une opération non associative ou sensible à l'ordre, `List.fold_right` accumule de droite à gauche, avec un signe d'appel légèrement différent (l'accumulateur est le dernier argument, pas le second).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La récursion remplace la boucle à compteur mutable. Une récursion terminale (l'appel récursif est la dernière action) est optimisée par le compilateur en boucle, sans faire grandir la pile. `map`/`filter`/`fold` couvrent l'essentiel des boucles de transformation/filtrage/agrégation. |
| **Outils utilisables** | `let rec`, un accumulateur pour rendre une récursion terminale, `List.map`/`List.filter`/`List.fold_left`. |
| **Pièges à éviter** | Écrire une récursion non terminale sur une très grande liste : risque de dépassement de pile (*stack overflow*). |
| **Bonnes pratiques** | Transformer une récursion en forme terminale (avec accumulateur) dès qu'elle doit traiter des collections potentiellement grandes. |
