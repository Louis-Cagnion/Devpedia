---
order: 5
---

# L'inférence de types

## Statique, mais sans annotations

OCaml est **statiquement typé** : chaque expression a un type fixé une fois pour toutes, vérifié avant même l'exécution, comme en [C](/?c=langages-de-programmation&s=c&p=c) (cf. chapitre [Les variables et types de données](/?c=langages-de-programmation&s=c&p=variables)). Contrairement au [C](/?c=langages-de-programmation&s=c&p=c), ce type n'a presque jamais besoin d'être écrit explicitement :

```ocaml
let addition x y = x + y
(* le compilateur déduit seul : addition : int -> int -> int *)
```

L'usage de `+` (réservé aux entiers en OCaml ; `+.` est l'addition flottante) suffit au compilateur pour déduire que `x` et `y` sont des `int`, et donc que `addition` en renvoie un aussi. Aucune annotation n'a été écrite, et pourtant le typage est aussi strict qu'en [C](/?c=langages-de-programmation&s=c&p=c) : appeler `addition 1 "deux"` est une erreur détectée à la compilation, jamais à l'exécution.

## Comment l'inférence procède

Le mécanisme (l'[algorithme de Hindley-Milner](https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system)) part de chaque expression et pose des contraintes sur les types de ses sous-expressions, puis résout l'ensemble du système de contraintes pour tout le programme :

```ocaml
let double x = x + x
(* '+' impose : x est int, et le résultat est int *)
(* -> double : int -> int *)

let appliquer_deux_fois f x = f (f x)
(* f doit accepter le type qu'elle renvoie -- aucune contrainte ne fixe LEQUEL *)
(* -> appliquer_deux_fois : ('a -> 'a) -> 'a -> 'a *)
```

Le second exemple illustre le **polymorphisme paramétrique** : `'a` signifie "un type quelconque, à déterminer selon l'appel", la même idée qu'un template [C++](/?c=langages-de-programmation&s=cpp&p=cpp) (cf. chapitre [Les templates](/?c=langages-de-programmation&s=cpp&p=templates)), mais résolue automatiquement par inférence plutôt que déclarée explicitement à chaque utilisation (`template<typename T>`).

## Comparé au typage dynamique et au typage graduel

| | [C](/?c=langages-de-programmation&s=c&p=c) | [Python](/?c=langages-de-programmation&s=python&p=python) (annotations) | OCaml |
|---|---|---|---|
| Vérification | À la compilation | Au choix : jamais, ou via un [vérificateur externe](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) (`mypy`) | À la compilation, systématiquement |
| Annotation requise | Toujours (`int x`) | Optionnelle | Jamais (déduite) |

[Python](/?c=langages-de-programmation&s=python&p=python) (cf. chapitre [Le typage avec annotations](/?c=langages-de-programmation&s=python&p=typage-avec-annotations)) permet d'ajouter des indications de type après coup, vérifiées par un outil séparé qui reste facultatif : le programme s'exécute même si ces annotations sont fausses ou absentes. En OCaml, il n'existe pas de mode "sans vérification" : un programme dont les types ne s'accordent pas ne compile tout simplement pas, et ne peut donc jamais atteindre l'exécution avec une incohérence de type.

## Un filet de sécurité, pas une contrainte de verbosité

L'idée reçue sur les langages statiquement typés est qu'ils imposent d'écrire davantage : c'est vrai en [C](/?c=langages-de-programmation&s=c&p=c), où chaque variable porte son type. L'inférence dissocie les deux : la rigueur du typage statique (erreurs de type détectées avant l'exécution, y compris dans du code jamais exécuté lors des tests) sans le coût de frappe qui lui est habituellement associé.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | OCaml est statiquement typé mais déduit les types sans annotation (algorithme de Hindley-Milner) : la rigueur du typage statique sans le coût de frappe habituel. |
| **Outils utilisables** | Le polymorphisme paramétrique (`'a`) pour une fonction valable sur n'importe quel type, résolu automatiquement. |
| **Pièges à éviter** | Croire qu'un langage sans annotation de type est forcément dynamiquement typé : OCaml vérifie tout à la compilation, sans exception. |
| **Bonnes pratiques** | Laisser le compilateur inférer les types plutôt que les annoter systématiquement ; les annotations restent utiles ponctuellement pour documenter une signature complexe. |
