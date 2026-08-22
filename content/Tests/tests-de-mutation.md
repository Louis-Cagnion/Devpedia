---
order: 11
---

# Les tests de mutation

Le chapitre sur la [couverture de code](/?c=tests&p=couverture-de-code) a établi un piège central : une ligne exécutée par un test n'est pas forcément une ligne réellement vérifiée. Les **tests de mutation** (*mutation testing*) répondent directement à ce problème, en mesurant non pas si le code a été exécuté, mais si les tests sont capables de détecter un bug quand il y en a un.

## Le principe : introduire des bugs volontairement

Un outil de mutation testing modifie automatiquement le code source, une modification minuscule à la fois (un **mutant**), puis relance la suite de tests contre cette version légèrement cassée :

```text
Code original :
  if (age >= 18) { return "majeur"; }

Mutants générés automatiquement :
  if (age > 18)   { return "majeur"; }   // >= devient >
  if (age <= 18)  { return "majeur"; }   // >= devient <=
  if (age >= 18)  { return "mineur"; }   // valeur de retour inversée
  if (true)       { return "majeur"; }   // condition supprimée
```

Chaque mutant représente un bug plausible, introduit automatiquement. La question posée à la suite de tests pour chacun : la fait-elle échouer ?

## Mutant tué ou mutant survivant

| Résultat | Signification |
|---|---|
| **Mutant tué** (*killed*) | Au moins un test a échoué face à ce mutant : la suite de tests aurait détecté ce bug s'il avait réellement existé |
| **Mutant survivant** (*survived*) | Tous les tests passent malgré la modification : la suite de tests ne détecterait pas ce bug s'il existait réellement |

Le **score de mutation** est la proportion de mutants tués sur le total généré : un score élevé indique des tests réellement capables de détecter des bugs, pas seulement d'exécuter du code.

```text
10 mutants générés, 8 tués, 2 survivants
-> score de mutation : 80%

Les 2 mutants survivants pointent vers des endroits précis du
code où les tests existants n'auraient pas détecté un bug réel
```

## Ce que ça révèle, que la couverture ne révèle pas

C'est précisément le point aveugle de la couverture de code : un test qui exécute une ligne sans vérifier son résultat obtient 100% de couverture sur cette ligne, mais laisse survivre tous les mutants qui la modifient, révélant que la ligne n'est en réalité pas vérifiée.

```text
function calculerRemise(prix, pourcentage) {
    return prix * (1 - pourcentage / 100);
}

test "calculerRemise ne plante pas" :
    calculerRemise(100, 10);   // 100% de couverture...
    // ...mais aucune vérification du résultat

Mutant : prix * (1 + pourcentage / 100)  (signe inversé)
-> le test ne le détecte pas -> mutant survivant
-> révèle ce que la couverture seule ne montrait pas
```

## Un coût de calcul réel, à réserver au code critique

Générer et tester chaque mutant multiplie le temps d'exécution de la suite de tests par le nombre de mutants créés, ce qui rend le mutation testing nettement plus lent que la couverture classique.

> **Piège :** lancer le mutation testing sur l'intégralité d'un gros projet à chaque exécution de la suite de tests, au point de la rendre trop lente pour un usage quotidien.
>
> **Bonne pratique :** réserver le mutation testing au code le plus critique (logique métier sensible, calculs financiers) ou l'exécuter ponctuellement (avant une release, en tâche de fond), plutôt que sur l'ensemble du projet à chaque exécution.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le mutation testing modifie automatiquement le code (un mutant à la fois) et vérifie si la suite de tests détecte chaque modification. Un mutant tué signifie que les tests auraient détecté ce bug ; un mutant survivant révèle un angle mort que la couverture de code seule ne montre pas. |
| **Outils utilisables** | Un outil de mutation testing pour générer des mutants et calculer le score de mutation. |
| **Pièges à éviter** | Lancer le mutation testing sur tout le projet à chaque exécution, au détriment de la vitesse de la suite de tests. |
| **Bonnes pratiques** | Réserver le mutation testing au code le plus critique, ou l'exécuter ponctuellement plutôt qu'à chaque lancement de la suite de tests. |
