# Python

Un [langage de programmation](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) est un ensemble de règles qui permet d'écrire des instructions qu'un ordinateur peut exécuter. Python en est un, réputé pour sa syntaxe volontairement proche du langage naturel.

```python
nom = "Devpedia"          # une variable, voir le chapitre dédié
print(f"Bonjour, {nom}")   # affiche : Bonjour, Devpedia
```

| Terme | Ce que ça veut dire |
|---|---|
| Haut niveau | Masque presque entièrement la gestion de la mémoire et les détails du matériel, au profit de la lisibilité |
| Dynamiquement typé | Une variable ne déclare pas de type à l'avance : elle prend le type de la valeur qu'on lui assigne, et peut en changer en cours de programme (voir [Les variables](/?c=langages-de-programmation&s=python&p=variables)) |
| Interprété | Le code n'est pas traduit en instructions machine natives à l'avance : un **interpréteur** (un programme qui lit et exécute du code au fur et à mesure, plutôt qu'en une seule traduction préalable) le lit et l'exécute — un compromis de lisibilité contre la performance brute d'un langage compilé comme le [C](/?c=langages-de-programmation&s=c&p=c) |

> L'interpréteur de référence pour Python s'appelle **CPython**. En interne, il traduit d'abord le code en *bytecode* — une forme intermédiaire, plus proche de la machine que le code source mais pas encore des instructions natives — avant de l'exécuter.

Grâce à sa syntaxe accessible et sa bibliothèque standard très riche, Python permet de progresser rapidement sur des problèmes concrets. Il est aujourd'hui central dans plusieurs domaines : le développement web (Django, Flask), l'automatisation, et surtout le calcul scientifique et l'intelligence artificielle (NumPy, pandas, PyTorch...) — voir les catégories [Data Science](/?c=data-science&p=jupyter-notebooks) et [IA](/?c=ia&p=reseaux-de-neurones), qui reposent presque entièrement sur ce langage.
