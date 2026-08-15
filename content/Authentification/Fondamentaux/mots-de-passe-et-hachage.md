---
order: 2
---

# Mots de passe et hachage sécurisé

Un mot de passe ne doit jamais être stocké tel quel (en clair) dans une [base de données](/?c=domain-specific-languages-dsl&p=sql) : si cette base fuite un jour (piratage, sauvegarde mal protégée, employé malveillant), tous les mots de passe deviennent immédiatement lisibles, pour tous les comptes, sur tous les sites où l'utilisateur les a réutilisés. Le **hachage** est la technique qui évite ce scénario.

## Le hachage : une fonction à sens unique

Une **fonction de hachage** transforme une entrée (le mot de passe) en une sortie de taille fixe (le *hash*), avec deux propriétés : la même entrée produit toujours la même sortie, et il est en pratique impossible de retrouver l'entrée à partir de la seule sortie.

```text
"motdepasse123"  ->  hachage  ->  ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94
```

> **À ne pas confondre :** une *table de hachage* (voir [le chapitre dédié en C](/?c=langages-de-programmation&s=c&p=tables-de-hachage)) est une structure de données qui accélère la recherche d'un élément ; une *fonction de hachage cryptographique*, ici, sert à rendre un secret illisible. Les deux utilisent le mot "hachage" pour une opération mathématique proche (transformer une entrée en sortie de taille fixe), mais dans des buts totalement différents.

Stocker le hash plutôt que le mot de passe change la conséquence d'une fuite :

| | Mot de passe stocké en clair | Mot de passe stocké haché |
|---|---|---|
| Fuite de la base de données | Tous les mots de passe sont immédiatement lisibles | Un attaquant récupère des hash, pas les mots de passe eux-mêmes |
| Connexion d'un utilisateur légitime | Comparaison directe du texte saisi | Le texte saisi est haché à son tour, puis comparé aux deux hash |

## Pourquoi un hachage "rapide" est dangereux pour un mot de passe

Des fonctions de hachage comme [SHA-256](https://en.wikipedia.org/wiki/SHA-2) existent depuis longtemps et sont volontairement **rapides** : idéal pour vérifier qu'un fichier téléchargé n'a pas été corrompu, catastrophique pour un mot de passe. Un attaquant qui récupère une base de hash n'a pas besoin de "casser" le hachage lui-même : il teste des mots de passe candidats (une **attaque par dictionnaire**), en hachant chacun et en comparant au résultat volé. Plus le hachage est rapide, plus il peut en tester par seconde.

| Fonction | Conçue pour | Vitesse | Adaptée aux mots de passe ? |
|---|---|---|---|
| [MD5](https://en.wikipedia.org/wiki/MD5), [SHA-1](https://en.wikipedia.org/wiki/SHA-1), SHA-256 | Vérifier l'intégrité d'un fichier, indexer rapidement | Des milliards de hachages par seconde sur du matériel dédié | Non |
| [bcrypt](https://en.wikipedia.org/wiki/Bcrypt), [scrypt](https://en.wikipedia.org/wiki/Scrypt), [Argon2](https://en.wikipedia.org/wiki/Argon2) | Hacher spécifiquement des mots de passe | Volontairement lente, réglable | Oui |

> **Piège :** utiliser SHA-256 (ou pire, MD5) pour hacher un mot de passe, en pensant qu'un hachage cryptographique "solide" suffit. Ces fonctions sont solides pour leur usage prévu (intégrité), mais leur rapidité même est ce qui les rend inadaptées ici : un attaquant équipé de matériel spécialisé peut tester des milliards de combinaisons par seconde.
>
> **Bonne pratique :** utiliser une fonction spécifiquement conçue pour les mots de passe (bcrypt, Argon2), dont la lenteur est un choix de conception délibéré, réglable pour rester coûteuse même à mesure que le matériel progresse.

## Le sel : empêcher les attaques par précalcul

Sans précaution supplémentaire, un attaquant peut précalculer une fois pour toutes le hash de millions de mots de passe courants (une [**rainbow table**](https://en.wikipedia.org/wiki/Rainbow_table)), puis chercher une correspondance instantanée dans une base volée. Le **sel** (*salt*) contre cette stratégie : une valeur aléatoire, unique pour chaque mot de passe, combinée à celui-ci avant le hachage.

```text
Sans sel  :  hash("motdepasse123")                    -> toujours le meme resultat
Avec sel  :  hash("motdepasse123" + "a8f3...")         -> resultat different a chaque utilisateur
             hash("motdepasse123" + "9c21...")         -> meme mot de passe, hash different
```

Deux utilisateurs avec le même mot de passe obtiennent ainsi des hash différents, et une rainbow table précalculée sans connaître le sel devient inutilisable. Le sel n'a pas besoin de rester secret : il est généralement stocké à côté du hash lui-même, seul le mot de passe d'origine doit rester impossible à retrouver.

> **Bonne pratique :** générer le sel avec un générateur aléatoire cryptographique plutôt qu'un générateur classique (voir [Pseudo-aléatoire et générateurs](/?c=representation-des-donnees&p=aleatoire-et-generateurs), qui cite justement le sel de mot de passe comme cas d'usage nécessitant un CSPRNG), pour qu'il reste imprévisible.

## Passer à l'implémentation

En pratique, choisir l'algorithme, générer le sel et gérer son intégration au hash final est pris en charge par une fonction dédiée du langage utilisé, jamais à réimplémenter soi-même : voir [`password_hash()` et `password_verify()`](/?c=langages-de-programmation&s=php&p=securite) pour l'implémentation concrète en PHP, qui utilise bcrypt par défaut et détaille comment le sel est intégré au hash stocké.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un mot de passe se hache toujours avant stockage, jamais en clair. Une fonction de hachage rapide (SHA-256, MD5) facilite les attaques par dictionnaire ; une fonction lente et réglable dédiée (bcrypt, Argon2) les ralentit délibérément. Le sel empêche les attaques par précalcul (rainbow tables) et garantit un hash différent pour un même mot de passe entre deux utilisateurs. |
| **Outils utilisables** | bcrypt, Argon2, scrypt pour le hachage ; un générateur aléatoire cryptographique pour le sel. |
| **Pièges à éviter** | Utiliser SHA-256/MD5 pour hacher un mot de passe. Réimplémenter soi-même la génération du sel ou la comparaison des hash plutôt que d'utiliser les fonctions dédiées du langage. |
| **Bonnes pratiques** | Toujours utiliser une fonction de hachage conçue pour les mots de passe, jamais une fonction de hachage générale. Laisser la génération du sel à une fonction dédiée plutôt que la coder à la main. |
