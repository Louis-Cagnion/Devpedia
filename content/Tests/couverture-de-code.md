---
order: 8
---

# La couverture de code

Une suite de tests grandit chapitre après chapitre, mais une question reste sans réponse directe jusqu'ici : comment savoir si elle couvre suffisamment le programme ? La **couverture de code** (*code coverage*) tente de répondre à cette question par une mesure chiffrée, avec des limites importantes à connaître avant de s'y fier.

## Ce que mesure la couverture

La couverture de code mesure la proportion du code source réellement **exécutée** au moins une fois pendant l'exécution de la suite de tests, généralement exprimée en pourcentage.

```text
function calculerRemise(prix, pourcentage) {
    if (pourcentage < 0) {
        return prix;              // ligne A
    }
    return prix * (1 - pourcentage / 100);  // ligne B
}

Un seul test avec pourcentage=10 :
  -> ligne B exécutée, ligne A jamais exécutée
  -> couverture de cette fonction : 50% (1 ligne sur 2)
```

Un outil de couverture instrumente le code pendant l'exécution des tests, puis produit un rapport indiquant quelles lignes (ou quelles branches, quelles fonctions) ont été exécutées ou non.

## Plusieurs granularités de mesure

| Type de couverture | Ce qu'il vérifie |
|---|---|
| **Couverture de lignes** | Chaque ligne de code a-t-elle été exécutée au moins une fois ? |
| **Couverture de branches** | Chaque chemin possible d'un `if`/`else` a-t-il été emprunté (les deux, pas seulement un) ? |
| **Couverture de fonctions** | Chaque fonction a-t-elle été appelée au moins une fois ? |

La couverture de branches est plus exigeante que la couverture de lignes : un `if` sans `else` peut avoir 100% de couverture de lignes en n'exerçant jamais le cas où la condition est fausse, alors que la couverture de branches l'exigerait.

## Le piège central : un chiffre élevé ne garantit rien

Une ligne "couverte" signifie seulement qu'elle a été **exécutée** pendant un test, pas que son résultat a été **vérifié**. Un test qui appelle une fonction sans jamais comparer son résultat à une valeur attendue fait grimper la couverture sans détecter le moindre bug.

```text
function calculerRemise(prix, pourcentage) {
    return prix * (1 - pourcentage / 100);
}

test "calculerRemise ne plante pas" :
    calculerRemise(100, 10);   // exécute la ligne, mais...
    // ...aucune vérification du résultat obtenu !

-> 100% de couverture de cette fonction, alors même qu'un bug qui
   inverserait le calcul (ex. prix * (1 + pourcentage / 100))
   ne serait jamais détecté
```

> **Piège :** viser un pourcentage de couverture élevé comme objectif en soi, en écrivant des tests qui exécutent du code sans réellement vérifier son comportement. 100% de couverture ne signifie pas 0% de bugs.
>
> **Bonne pratique :** traiter la couverture comme un indicateur de ce qui n'est *certainement pas* testé (une ligne à 0% n'a aucun test), jamais comme une preuve que ce qui est couvert est correct.

## À quoi la couverture sert vraiment

Malgré cette limite, la couverture reste utile pour un usage précis : repérer les zones du code **totalement dépourvues** de test, en particulier après une modification. Un rapport de couverture qui tombe soudainement sur un fichier récemment modifié signale un point aveugle réel, à combler avant de considérer le changement terminé.

> **Bonne pratique :** utiliser la couverture pour repérer les trous évidents (code jamais exécuté par aucun test), pas pour juger la qualité des tests existants sur le code déjà couvert.

## Un seuil à choisir avec discernement

Certaines équipes fixent un seuil minimal de couverture (souvent entre 70% et 90%) en dessous duquel une contribution est refusée. Ce seuil a du sens comme garde-fou contre l'absence totale de test sur du nouveau code, mais viser 100% partout a un coût croissant : les derniers pourcents couvrent souvent du code peu risqué (gestion d'erreurs triviale, code généré) pour un gain de fiabilité marginal.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La couverture de code mesure la proportion de code exécutée par les tests (lignes, branches, fonctions), pas la qualité de ce qui est vérifié. Une ligne couverte n'est pas forcément une ligne correctement testée : 100% de couverture ne garantit pas l'absence de bugs. |
| **Outils utilisables** | Un outil de couverture instrumentant l'exécution des tests, produisant un rapport par ligne/branche/fonction. Un seuil minimal (70-90%) comme garde-fou sur du nouveau code. |
| **Pièges à éviter** | Viser un pourcentage de couverture élevé comme objectif en soi. Écrire des tests qui exécutent du code sans vérifier son résultat. |
| **Bonnes pratiques** | Utiliser la couverture pour repérer le code totalement non testé, pas pour juger la qualité de ce qui est déjà couvert. Ne pas viser 100% partout : le gain marginal des derniers pourcents est souvent faible. |
