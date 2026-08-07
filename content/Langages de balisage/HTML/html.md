# HTML

HTML (*HyperText Markup Language*) n'est pas un langage de programmation : c'est un langage de **balisage**, qui décrit la structure et le sens d'un contenu (un titre, un paragraphe, une image, un lien...), pas des instructions exécutées séquentiellement. Un navigateur lit un document HTML et construit une représentation en mémoire de cette structure, le DOM (*Document Object Model*, voir [Le DOM et les événements](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements)), qu'il affiche ensuite à l'écran.

Parmi les concepts essentiels de HTML, on retrouve notamment :

- Les balises et attributs, qui structurent et enrichissent le contenu
- Les éléments sémantiques (HTML5), qui donnent un sens explicite à chaque partie de la page
- Les formulaires, pour collecter des données auprès de l'utilisateur
- L'accessibilité, pour que le contenu reste utilisable par des technologies d'assistance (lecteurs d'écran...)

HTML ne s'occupe **ni** de l'apparence visuelle (le rôle de [CSS](/?c=langages-de-balisage&s=css&p=css)), **ni** du comportement interactif (le rôle de [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)) — sa seule responsabilité est de décrire ce qu'**est** chaque partie du contenu. Cette séparation des responsabilités (structure / présentation / comportement) est un principe central du développement web moderne.

> **Note :** contrairement à un langage de programmation, une erreur de syntaxe HTML ne provoque presque jamais un "crash" — les navigateurs sont volontairement tolérants (balise non fermée, attribut mal écrit...) et tentent de corriger silencieusement, ce qui peut masquer des erreurs pendant longtemps si on ne valide pas son HTML avec un outil dédié.
