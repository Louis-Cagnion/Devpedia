---
title: C++
---

C++ est né comme une extension du C ("C with Classes"), et reste aujourd'hui rétro-compatible avec la quasi-totalité du C (cf. rubrique C) — presque tout ce qui a déjà été vu là-bas (pointeurs, mémoire, structs, compilation) s'applique directement en C++. Ce que C++ ajoute par-dessus, c'est essentiellement la **programmation orientée objet**, la **gestion automatique de ressources** (RAII), et la **programmation générique** (templates).

Parmi les concepts essentiels ajoutés par C++ par rapport au C, on retrouve notamment :

- Les classes et objets (encapsulation, héritage, polymorphisme)
- Les références, une alternative plus sûre aux pointeurs dans de nombreux cas
- RAII et les pointeurs intelligents (*smart pointers*), qui limitent drastiquement les fuites mémoire vues au chapitre C dédié
- Les templates, pour écrire du code générique sans sacrifier les performances
- La bibliothèque standard (STL) : conteneurs, algorithmes et itérateurs prêts à l'emploi
- Les exceptions, une alternative structurée au style d'erreur "à la C" (valeurs de retour + `errno`)

L'apprentissage de C++ permet de garder le contrôle bas niveau du C (mémoire, performance, absence de ramasse-miettes) tout en disposant d'outils de plus haut niveau pour structurer un projet de grande taille — un compromis qui explique sa présence durable dans les moteurs de jeux, les systèmes embarqués exigeants, et les logiciels nécessitant à la fois performance et complexité logicielle importante.

> **Note :** contrairement à PHP, Python ou JavaScript, C++ reste **compilé** vers du code machine natif (cf. chapitre sur la compilation, rubrique C) — aucune machine virtuelle, aucun interpréteur entre le code et son exécution.
