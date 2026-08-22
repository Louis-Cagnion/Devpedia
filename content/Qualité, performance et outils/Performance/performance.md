---
order: 2
---

# Performance

Optimiser un programme, c'est d'abord comprendre où passe son temps, et c'est rarement là où on le croit. Cette section rassemble des principes de performance qui ne dépendent pas d'un langage particulier : ils s'appliquent aussi bien à un script [Python](/?c=langages-de-programmation&s=python&p=python) qu'à une page web ou à un accès en base de données.

Le fil conducteur est une distinction qui revient partout : le temps que votre programme **perd tout seul** (attentes fixes, travail refait, allers-retours inutiles) et le temps qu'il **passe à attendre quelqu'un d'autre** (le réseau, un disque, un service distant). Le premier s'élimine sans contrepartie. Le second se contourne, parfois, mais se paie souvent ailleurs, et c'est là que les arbitrages commencent.

Les exemples chiffrés viennent d'un cas réel : l'optimisation d'un programme d'automatisation de navigateur, passé de 61 à 14 secondes sur le même travail, sans rien changer à ce qu'il produit.

Vous retrouverez les différentes notions ci-dessous :
