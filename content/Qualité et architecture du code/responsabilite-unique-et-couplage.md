---
order: 1
---

# Responsabilité unique et faible couplage

Une fonction, une classe ou un fichier qui fait "un peu de tout" semble pratique sur le moment (tout est au même endroit) mais devient le premier obstacle dès qu'il faut le faire évoluer : un changement pour un besoin fait involontairement dérailler un autre usage du même fichier, parce que les deux n'ont jamais été vraiment indépendants.

## Le vrai test : la raison de changer

La question à se poser n'est pas *"est-ce que ce fichier est trop long ?"* mais *"si je dois modifier ceci, est-ce pour la même raison que cela ?"*. Deux morceaux de code qui changent pour des raisons différentes (l'un parce que la logique métier évolue, l'autre parce que le format d'affichage change) devraient vivre dans des fichiers différents, même s'ils sont courts et liés dans le même flux d'exécution.

Un exemple concret : un module qui mélangeait le rendu d'un rapport (mise en forme du texte, tables, résumé) et la gestion d'un état de reprise (sauvegarder où en est un traitement interrompu, pour le reprendre plus tard). Les deux avaient chacun leur propre raison de changer (l'un suit les demandes de présentation, l'autre suit la logique de reprise sur erreur) et ont fini par vivre dans deux fichiers séparés (`report.py` pour le rendu, `resume.py` pour l'état de reprise), chacun testable et compréhensible sans l'autre.

## Le signal concret pour scinder un fichier

Deux signaux, complémentaires, indiquent qu'un fichier a dépassé sa responsabilité unique :

- **Des responsabilités qui ne partagent pas la même raison de changer** : le test ci-dessus, le plus fiable mais aussi le plus subjectif.
- **Une taille qui dépasse un seuil raisonnable** (souvent cité autour de 700-800 lignes pour un fichier de code) : un signal plus mécanique, qui n'est pas une cause en soi mais corrèle fortement avec un fichier qui a accumulé plusieurs responsabilités sans qu'on s'en rende compte.

Un fichier de tests de plus de 1200 lignes, couvrant sept modules distincts d'un même projet, illustre bien les deux signaux à la fois : chaque module a sa propre raison de changer (une évolution du parsing de spécifications ne doit pas toucher les tests de gestion de navigateur), et la taille rendait le fichier pénible à naviguer. Le split en sept fichiers, un par module testé, a rendu chaque partie indépendamment lisible et exécutable.

## Le faible couplage : la contrepartie

La responsabilité unique ne suffit pas si les morceaux, une fois séparés, dépendent lourdement des détails internes les uns des autres : un fichier "séparé" qui doit être relu en entier à chaque modification d'un autre n'est séparé qu'en apparence. Le couplage faible signifie qu'un module expose une interface claire (des fonctions, des types) et que ses appelants n'ont besoin de connaître que cette interface, jamais son implémentation interne.

> **Signal d'alerte :** si modifier un détail d'implémentation dans un fichier oblige systématiquement à modifier un autre fichier qui ne fait que l'appeler, le couplage est trop fort, même si chaque fichier, pris isolément, semble avoir une responsabilité claire.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un fichier qui mélange plusieurs raisons de changer devient fragile : un changement pour un besoin en fait dérailler un autre. Le vrai test : "si je modifie ceci, est-ce pour la même raison que cela ?". |
| **Outils utilisables** | Le signal de taille (~700-800 lignes) comme indice mécanique, complémentaire au test de la raison de changer. |
| **Pièges à éviter** | Séparer des fichiers sans réduire le couplage entre eux : un fichier "séparé" qui doit être relu en entier à chaque modification d'un autre reste couplé, même s'il a l'air indépendant. |
| **Bonnes pratiques** | Scinder un fichier dès que deux responsabilités distinctes s'y mélangent, avec une interface claire entre les morceaux issus du split. |
