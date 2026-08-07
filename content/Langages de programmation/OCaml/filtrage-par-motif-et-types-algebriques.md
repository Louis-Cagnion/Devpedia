---
order: 3
---

# Filtrage par motif et types algébriques

## Les types variants (sum types)

Un **type variant** énumère toutes les formes possibles d'une valeur, chacune pouvant porter ses propres données :

```ocaml
type forme =
  | Cercle of float                    (* rayon *)
  | Rectangle of float * float          (* largeur, hauteur *)
  | Triangle of float * float * float    (* trois côtés *)
```

Une valeur de type `forme` est **exactement une** de ces trois possibilités, jamais un mélange ni autre chose — contrairement à une classe de base avec héritage (cf. chapitre [Héritage et polymorphisme](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme), rubrique C++), où l'ensemble des sous-classes possibles reste ouvert : n'importe qui peut en ajouter une nouvelle ailleurs dans le code.

## Le filtrage par motif (`match`)

`match` décompose une valeur selon sa forme, et extrait directement les données qu'elle porte :

```ocaml
let aire forme =
  match forme with
  | Cercle rayon -> Float.pi *. rayon *. rayon
  | Rectangle (largeur, hauteur) -> largeur *. hauteur
  | Triangle (a, b, c) ->
      let s = (a +. b +. c) /. 2.0 in
      sqrt (s *. (s -. a) *. (s -. b) *. (s -. c))
```

Comparé à un `switch` (cf. chapitre [Les conditions](/?c=langages-de-programmation&s=c&p=conditions), rubrique C), la différence n'est pas seulement esthétique : chaque branche **extrait** directement `rayon`, ou `largeur` et `hauteur`, sans accès manuel à des champs (`forme.rayon`) ni distinction de type au préalable.

## L'exhaustivité vérifiée à la compilation

Si une branche est oubliée, le compilateur OCaml le signale de lui-même, sans qu'il faille écrire le moindre test pour s'en rendre compte :

```ocaml
let aire_incomplete forme =
  match forme with
  | Cercle rayon -> Float.pi *. rayon *. rayon
  | Rectangle (largeur, hauteur) -> largeur *. hauteur
  (* Warning 8: ce filtrage n'est pas exhaustif -- le cas Triangle n'est pas couvert *)
```

Ce n'est qu'un **avertissement** par défaut (le programme compile quand même), mais un projet sérieux active en général l'option qui transforme ce type d'avertissement en erreur bloquante — faisant ainsi de l'exhaustivité une garantie, pas une simple suggestion. C'est une différence structurelle majeure avec un `switch`/`if-elif` en C, PHP ou JavaScript : un cas oublié y compile sans le moindre avertissement, et échoue seulement à l'**exécution**, si et seulement si ce cas précis se présente un jour en production — l'un des échecs silencieux les plus coûteux à diagnostiquer, puisqu'il ne se manifeste que des mois après l'écriture du code, sur une entrée que personne n'avait anticipée. En OCaml, ajouter un nouveau cas à un type variant (`Losange of float`) fait immédiatement remonter, dès la compilation, **chaque** `match` du programme entier qui devrait être mis à jour pour le gérer.

## Le type `option`, une alternative structurelle à `null`

`option` est lui-même un type variant, déjà défini dans la bibliothèque standard :

```ocaml
type 'a option = None | Some of 'a
```

```ocaml
let trouver_utilisateur id =
  if id = 42 then Some "Alice" else None

match trouver_utilisateur 42 with
| Some nom -> print_endline nom
| None -> print_endline "Utilisateur introuvable"
```

La différence avec `None` en Python (cf. chapitre [Les variables](/?c=langages-de-programmation&s=python&p=variables) pour `is None`) est que le compilateur **force** à traiter le cas `None` : le type d'une fonction qui peut ne rien trouver est explicitement `string option`, jamais simplement `string`. Il est donc impossible d'oublier de vérifier l'absence de valeur sans que le compilateur ne le signale — là où un `NullPointerException` ou un `TypeError: 'NoneType' object is not subscriptable` en Python n'apparaît qu'à l'exécution, sur le chemin de code précis qui l'a oublié.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un type variant énumère toutes les formes possibles d'une valeur ; `match` décompose et extrait ses données. Le compilateur vérifie l'exhaustivité d'un `match` — un cas oublié est détecté avant l'exécution, pas seulement le jour où il se présente en production. |
| **Outils utilisables** | `type ... = \| ...`, `match ... with`, le type `option` (`Some`/`None`) comme alternative structurelle à `null`. |
| **Pièges à éviter** | Laisser un `match` non exhaustif en simple avertissement plutôt qu'en erreur bloquante. |
| **Bonnes pratiques** | Activer l'option qui transforme un `match` non exhaustif en erreur de compilation ; utiliser `option` plutôt qu'une valeur qui pourrait être absente sans que le type le signale. |
