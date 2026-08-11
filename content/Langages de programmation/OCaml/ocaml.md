# OCaml

Tous les langages vus jusqu'ici dans cette rubrique (C, C++, PHP, Python, JavaScript) partagent un même style de fond : des **instructions** exécutées dans l'ordre, une mutation directe de variables, des boucles pour répéter un traitement. C'est le style **impératif**, et il est si répandu qu'il en devient invisible.

**OCaml** est l'occasion d'observer un style différent, le style **fonctionnel** : les programmes s'y construisent en assemblant des fonctions et en évaluant des expressions, plutôt qu'en enchaînant des instructions qui modifient un état. Ce n'est pas un langage exotique de laboratoire ; OCaml compile du code natif aussi rapide que du C, et est utilisé en production dans des domaines qui valorisent particulièrement la fiabilité : la finance (Jane Street en a fait son langage principal), la vérification formelle (l'assistant de preuve Coq est écrit en OCaml), et l'analyse statique de code.

Parmi les concepts essentiels abordés dans cette rubrique :

- La comparaison directe entre style fonctionnel et style impératif : expressions contre instructions, immuabilité contre mutation
- Les fonctions pures et leurs avantages concrets (code plus facile à tester, à raisonner, à paralléliser)
- Le filtrage par motif (*pattern matching*) et les types algébriques, une alternative structurée aux `if`/`switch` classiques
- La récursion comme remplacement des boucles, et les fonctions d'ordre supérieur (`map`, `filter`, `fold`)
- L'inférence de types : un typage strict, vérifié à la compilation, sans avoir à écrire la moindre annotation de type

> **Note :** OCaml n'impose pas un style pur à 100 % : contrairement à Haskell, il autorise volontiers des boucles `for`/`while`, des références mutables (`ref`), et de la programmation orientée objet. Le style fonctionnel y est la culture dominante et l'outil le plus naturel, pas une contrainte absolue du langage. C'est précisément ce qui permet de comparer les deux styles *dans* un seul et même langage plutôt que d'opposer deux langages différents.
