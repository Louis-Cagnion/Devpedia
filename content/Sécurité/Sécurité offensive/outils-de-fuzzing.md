---
order: 7
---

# Les outils de fuzzing avancés

[Tests et audit de sécurité](/?c=cybersecurite&p=tests-et-audit-de-securite) a posé le principe du **fuzzing** : bombarder un programme d'entrées inattendues pour provoquer un plantage révélateur d'une faille. Ce chapitre va plus loin, côté outillage réel : comment un fuzzer moderne (AFL, libFuzzer) fait bien mieux que de simplement essayer des entrées au hasard.

## Le fuzzing guidé par la couverture de code

Un fuzzer purement aléatoire génère des entrées sans aucun retour sur leur effet : la plupart ne testent jamais que les tout premiers chemins du programme (ex : une validation de format qui rejette l'entrée avant même d'atteindre le code intéressant). Un fuzzer **guidé par la couverture** (*coverage-guided*) instrumente le programme pour savoir, à chaque exécution, quelles lignes de code ont été atteintes, puis privilégie les mutations qui explorent de nouveaux chemins jamais atteints auparavant.

```text
1. Le fuzzer garde un ensemble d'entrees "interessantes" (le corpus), au depart minimal
2. Il mute une entree du corpus (change un octet, en ajoute, en retire...)
3. Il execute le programme avec cette entree mutee, en mesurant la couverture de code atteinte
4. Si cette mutation atteint du code jamais couvert avant -> ajoutee au corpus, deviendra
   a son tour une base pour de futures mutations
5. Si le programme plante -> l'entree exacte responsable est sauvegardee pour analyse
```

Cette boucle explique pourquoi un fuzzer guidé par la couverture trouve, en quelques heures, des chemins qu'un fuzzer purement aléatoire n'atteindrait jamais en plusieurs années : chaque découverte utile devient le point de départ de la suivante, au lieu de repartir de zéro à chaque tentative.

## Les sanitizers : détecter une corruption même sans plantage

Un [buffer overflow](/?c=securite&s=securite-offensive&p=corruption-memoire) qui n'écrase qu'un octet voisin sans faire planter le programme reste invisible à un fuzzer qui ne surveille que les plantages. Un **sanitizer** (ex : *AddressSanitizer*, ASan) recompile le programme avec des vérifications supplémentaires qui détectent ce genre d'accès mémoire invalide au moment où il se produit, même s'il n'aurait provoqué aucun plantage visible autrement :

| Sans sanitizer | Avec sanitizer |
|---|---|
| Le dépassement écrase silencieusement une donnée voisine, le programme continue normalement | Le dépassement est détecté immédiatement, le programme s'arrête avec un rapport précis (fichier, ligne, type d'erreur) |

## Triage : distinguer un vrai bug d'un doublon

Une campagne de fuzzing peut générer des milliers de plantages en quelques heures, dont beaucoup partagent en réalité la même cause profonde. Le **triage** consiste à regrouper ces plantages par cause réelle (souvent via la pile d'appel au moment du plantage, voir [Comment un programme s'exécute réellement](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme)), pour ne traiter qu'une fois chaque bug distinct plutôt que des milliers d'occurrences du même problème.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un fuzzer guidé par la couverture privilégie les mutations qui explorent du code jamais atteint, bien plus efficace qu'un essai purement aléatoire. Un sanitizer détecte une corruption mémoire même sans plantage visible. Le triage regroupe les plantages trouvés par cause réelle plutôt que de les traiter un par un. |
| **Outils utilisables** | AFL ou libFuzzer pour le fuzzing guidé par couverture ; AddressSanitizer pour détecter une corruption silencieuse. |
| **Pièges à éviter** | Fuzzer sans sanitizer activé : la majorité des corruptions mémoire ne provoquent aucun plantage immédiat et passent inaperçues. |
| **Bonnes pratiques** | Démarrer une campagne de fuzzing avec un corpus initial pertinent (des entrées valides réelles) plutôt que vide, pour atteindre du code utile plus rapidement. |
