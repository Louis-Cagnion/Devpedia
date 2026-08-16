# Description

Un programme qui produit le bon résultat n'est pas forcément un programme facile à faire évoluer. Cette section rassemble des principes de qualité et d'architecture qui ne dépendent pas d'un langage particulier : ils s'appliquent aussi bien à un script [Python](/?c=langages-de-programmation&s=python&p=python) qu'à un projet [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) ou une base de code C.

Le fil conducteur est la **maintenabilité** : un code qui se comprend sans effort, qui ne répète pas la même information à plusieurs endroits, et où un changement reste localisé plutôt que de se propager en cascade. Ces principes ne sont pas des règles esthétiques : chacun évite une catégorie précise de bug ou de régression, illustrée par un cas concret.

Vous retrouverez les différentes notions ci-dessous :
