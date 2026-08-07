---
order: 2
---

# Immuabilité et fonctions pures

## L'immuabilité par défaut, et son échappatoire explicite

Une liaison OCaml (`let x = ...`) ne peut pas être réassignée — modifier une valeur suppose de créer une **nouvelle** valeur à partir de l'ancienne, jamais de modifier l'originale sur place. Quand une case réellement mutable est nécessaire, OCaml impose de le déclarer explicitement avec une **référence** :

```ocaml
let compteur = ref 0        (* une référence : une case mutable, explicite *)
compteur := !compteur + 1    (* := affecte une nouvelle valeur *)
print_int !compteur           (* ! lit la valeur actuelle -> 1 *)
```

La syntaxe `ref`/`:=`/`!` rend toute mutation **visible dans le code** — impossible de muter une valeur par accident, contrairement à une variable Python ou JavaScript, mutable par défaut sans aucune marque distinctive à l'endroit où elle est modifiée.

## Structures de données persistantes

Ajouter un élément à une liste OCaml ne modifie jamais la liste d'origine : l'opérateur `::` construit une **nouvelle** liste, qui partage sa fin (sa "queue") avec l'ancienne plutôt que de la copier entièrement.

```ocaml
let liste_a = [2; 3; 4]
let liste_b = 1 :: liste_a   (* liste_b = [1; 2; 3; 4] *)
(* liste_a existe toujours, inchangée : [2; 3; 4] *)
```

```python
# Python : append() mute la liste existante, il n'y a plus qu'une seule liste
liste_a = [2, 3, 4]
liste_a.append(1)   # liste_a devient [2, 3, 4, 1] -- l'originale n'existe plus
```

Cette structure dite **persistante** rend possible de garder plusieurs versions d'une même collection sans jamais les copier intégralement : `liste_a` et `liste_b` coexistent, partagent la mémoire de ce qu'elles ont en commun, et aucune des deux ne peut corrompre l'autre.

## Fonctions pures

Une fonction est **pure** si elle vérifie deux conditions : sa sortie ne dépend que de ses arguments (la même entrée produit toujours la même sortie), et son exécution ne produit aucun **effet de bord** observable (pas de mutation d'un état extérieur à la fonction, pas d'écriture disque, pas d'affichage).

```ocaml
let carre x = x * x            (* pure : dépend uniquement de x, aucun effet de bord *)

let compteur = ref 0
let carre_impur x =
  compteur := !compteur + 1;    (* effet de bord : modifie un état extérieur *)
  x * x
```

`carre` peut être remplacée par sa valeur de retour n'importe où dans le programme sans changer son comportement — une propriété appelée **transparence référentielle**. `carre_impur`, elle, ne le peut pas : l'appeler ou non change le contenu de `compteur`, donc l'ordre et le nombre d'appels comptent, pas seulement le résultat final.

## Pourquoi ça compte concrètement

- **Tester devient trivial** : une fonction pure se teste avec des entrées et une sortie attendue, sans avoir à construire un état préalable ni à vérifier un effet de bord après l'appel — l'exact opposé d'une dépendance cachée.
- **Aucune surprise entre deux appels** : puisqu'aucun état partagé ne peut être modifié à l'insu de l'appelant, deux appels identiques donnent toujours le même résultat, y compris exécutés en parallèle sur des cœurs différents — un état partagé muté simultanément par plusieurs threads est justement l'une des causes classiques de bug difficile à reproduire.
- **Un piège structurellement impossible** : l'argument par défaut mutable en Python (cf. chapitre [Les fonctions](/?c=langages-de-programmation&s=python&p=fonctions)) n'existe que parce qu'un objet mutable partagé peut être capturé silencieusement entre plusieurs appels. Sans mutation implicite, ce piège précis n'a simplement aucune prise.

> **Nuance :** aucun programme réel n'est composé à 100 % de fonctions pures — afficher un résultat, lire un fichier, répondre à une requête réseau sont des effets de bord par nature. L'objectif n'est pas de les éliminer, mais de les **isoler** : réduire au minimum la part de code qui en dépend, pour concentrer l'effort de test et de relecture là où les bugs sont les plus probables.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une liaison OCaml est immuable par défaut ; `ref`/`:=`/`!` rendent toute mutation explicite et visible. Une fonction pure ne dépend que de ses arguments et n'a aucun effet de bord — sa sortie est donc prévisible et testable isolément. |
| **Outils utilisables** | `ref`, `:=`, `!`, les structures de données persistantes (listes immuables partageant leur mémoire). |
| **Pièges à éviter** | S'attendre à ce qu'une fonction avec effet de bord (via `ref`) donne le même résultat à chaque appel, indépendamment de l'ordre d'exécution. |
| **Bonnes pratiques** | Isoler les effets de bord dans une petite partie du code plutôt que de les éliminer entièrement — concentrer l'effort de test là où ils se trouvent. |
