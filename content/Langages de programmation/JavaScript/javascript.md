# JavaScript

Un [langage de programmation](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) est un ensemble de règles qui permet d'écrire des instructions qu'un ordinateur peut exécuter. JavaScript en est un, conçu à l'origine pour rendre les pages web interactives.

```javascript
let nom = "Devpedia";            // une variable, voir le chapitre dédié
console.log(`Bonjour, ${nom}`);  // affiche : Bonjour, Devpedia
```

| Terme | Ce que ça veut dire |
|---|---|
| Haut niveau | Masque une grande partie des détails techniques liés à la machine, contrairement à un langage bas niveau comme le [C](/?c=langages-de-programmation&s=c&p=c) |
| Ramasse-miettes (*garbage collector*) | Un mécanisme automatique qui libère la mémoire des valeurs devenues inutilisées, sans intervention du développeur |
| DOM | La représentation en mémoire d'une page [HTML](/?c=langages-de-balisage&s=html&p=html) (voir [Le DOM et les événements](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements)) que JavaScript peut lire et modifier pour rendre une page interactive |
| Asynchrone | Une opération qui prend du temps (un appel réseau) sans bloquer le reste du programme en attendant sa fin (voir [L'asynchrone](/?c=langages-de-programmation&s=javascript&p=asynchrone)) |

JavaScript s'exécute aussi bien côté client (dans le navigateur) que côté serveur (via Node.js), ce qui en fait un langage central du développement web moderne : de nombreux frameworks (React, Vue, Angular) s'appuient dessus.
