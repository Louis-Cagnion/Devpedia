---
order: 6
---

# Le bug

Le [premier chapitre](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) l'annonçait : un ordinateur exécute les instructions à la lettre, sans jamais deviner une intention. Un **bug** est la conséquence directe de cette règle : un défaut du code qui l'empêche de produire le résultat attendu, pas parce que l'ordinateur "se trompe", mais parce que les instructions elles-mêmes étaient imprécises, incomplètes ou incorrectes.

> **Analogie :** une recette qui dit "verser du lait" sans préciser la quantité. Celui qui la suit à la lettre doit choisir une quantité, pas forcément celle que l'auteur avait en tête.

## Un exemple concret

```text
solde = 100
retirer = 150
solde = solde - retirer  → solde devient -50 : rien n'a vérifié qu'il y avait assez d'argent
afficher solde           → affiche -50
```

Le code s'exécute sans planter, et fait exactement ce qui est écrit ; c'est justement le problème : personne n'a écrit l'instruction "refuser le retrait si le solde est insuffisant".

> **Bonne pratique :** valider les conditions critiques avant d'agir (ici : `retirer <= solde`), plutôt que d'exécuter l'opération et de découvrir le problème dans le résultat final.

## Trois familles de bugs

| Type de bug | Ce qui se passe | Exemple |
|---|---|---|
| Erreur de syntaxe | Le code ne respecte pas la grammaire du langage : il ne peut même pas être exécuté | Une parenthèse jamais fermée |
| Erreur d'exécution (*crash*) | Le code est valide, mais rencontre une situation qu'il ne sait pas gérer, et s'arrête brutalement | Diviser un nombre par zéro |
| Erreur logique | Le code s'exécute sans planter, mais produit un résultat faux | L'exemple du solde négatif ci-dessus |

L'erreur logique est la plus difficile des trois à repérer : rien n'avertit qu'un problème a eu lieu, puisque le programme se termine normalement ; seul le résultat est faux.

> **Piège :** croire qu'un programme qui s'exécute sans planter est forcément correct. L'absence de crash ne dit rien sur une erreur logique : seule une vérification du résultat obtenu (contre le résultat attendu) la révèle.
>
> **Bonne pratique :** pour toute tâche où le résultat correct est connaissable à l'avance (même approximativement), le comparer systématiquement au résultat obtenu, plutôt que de se fier au seul fait que "ça tourne".

## Lire un message d'erreur

Face à un crash, la plupart des langages affichent un message qui indique où et pourquoi ça a échoué :

```text
Erreur : division par zéro
  à la ligne 4, dans la fonction "calculer_moyenne"
```

Apprendre à lire ce genre de message (quelle ligne, quelle cause) fait gagner un temps considérable.

> **Piège :** s'arrêter à la ligne indiquée en supposant que c'est forcément là qu'est l'erreur. Le crash se produit là où le problème devient visible (ex. une valeur manquante utilisée), pas nécessairement là où il a été **créé** (ex. la valeur manquante a pu être définie bien plus haut).
>
> **Bonne pratique :** prendre la ligne indiquée comme point de départ de la recherche, pas comme verdict final ; remonter en arrière si la cause n'y est pas directement visible.

## Comment on les détecte

Un [IDE](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide) aide sur les trois familles à sa façon : détection d'erreur de syntaxe avant même d'exécuter le code, message affiché au moment d'un crash, et un débogueur pour observer l'état des variables pas à pas, utile en particulier pour une erreur logique, invisible autrement.

> **Piège :** en déduire qu'une absence de signalement par l'IDE ("aucun souligné rouge") garantit l'absence de bug. La détection d'erreur d'un IDE ne couvre que la syntaxe (et parfois quelques erreurs d'exécution évidentes), jamais les erreurs logiques, qui ne se voient que dans le résultat produit.
>
> **Bonne pratique :** ne jamais confondre "l'IDE ne signale rien" avec "le programme est correct" : seuls des tests contre un résultat attendu couvrent les erreurs logiques.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un bug vient toujours d'une instruction imprécise ou incomplète, jamais d'une "erreur de compréhension" de l'ordinateur. Trois familles : erreur de syntaxe (ne s'exécute pas), erreur d'exécution (plante en cours de route), erreur logique (s'exécute, mais donne un résultat faux). |
| **Outils utilisables** | La détection d'erreur et le débogueur d'un IDE ; le message d'erreur affiché lors d'un crash. |
| **Pièges à éviter** | Ignorer un message d'erreur sans le lire en entier : la ligne et la cause indiquées sont presque toujours le point de départ le plus rapide, même si elles ne suffisent pas toujours seules. |
| **Bonnes pratiques** | Face à une erreur logique (pas de message, juste un résultat faux), vérifier étape par étape ce que chaque instruction fait réellement, plutôt que de supposer qu'elle fait ce qu'on voulait. |
