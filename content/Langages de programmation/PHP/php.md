---
order: 3
---

# PHP

Un [langage de programmation](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) est un ensemble de règles qui permet d'écrire des instructions qu'un ordinateur peut exécuter. PHP en est un, conçu spécifiquement pour tourner sur un serveur web et générer des pages à la demande.

```php
<?php
$nom = "Devpédia";     // une variable, voir le chapitre dédié
echo "Bonjour, $nom";  // affiche : Bonjour, Devpédia
```

| Terme | Ce que ça veut dire |
|---|---|
| Haut niveau | Masque une grande partie des détails techniques liés à la machine, contrairement à un langage bas niveau comme le [C](/?c=langages-de-programmation&s=c&p=c) |
| Ramasse-miettes (*garbage collector*) | Comme en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), la mémoire des valeurs devenues inutilisées est libérée automatiquement |
| Requête HTTP | Le message qu'un navigateur envoie à un serveur pour demander une page (voir [Les échanges de données : API et HTTP](/?c=infrastructure&p=api-et-http)). PHP s'exécute côté serveur, précisément pour répondre à ces requêtes |

L'apprentissage de PHP permet de comprendre comment un serveur web traite une requête et interagit avec une base de données (voir [SQL](/?c=domain-specific-languages-dsl&p=sql)) pour générer une réponse. Il reste largement utilisé pour les sites dynamiques, les CMS ([WordPress](https://wordpress.org), [Drupal](https://www.drupal.org)) et les frameworks comme [Laravel](https://laravel.com) ou [Symfony](https://symfony.com).
