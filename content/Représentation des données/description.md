# Description

Un programme ne manipule jamais des nombres ou du texte "en soi" : il manipule leur **encodage** en mémoire, sur un nombre fini de bits. Cette contrainte physique produit des comportements qu'on attribue souvent à tort au langage utilisé, alors qu'ils sont communs à tous : `0.1 + 0.2` ne vaut pas exactement `0.3` en JavaScript, mais pas davantage en C, en Python ou en PHP.

Cette section explique ces mécanismes une fois pour toutes, indépendamment de tout langage. Les chapitres des langages y renvoient pour le "pourquoi", et se concentrent sur ce qui leur est propre : les types disponibles, les fonctions de comparaison, les valeurs particulières.

Vous retrouverez les différentes notions ci-dessous :
