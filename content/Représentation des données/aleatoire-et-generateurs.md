---
order: 5
---

# L'aléatoire et les générateurs

Un processeur est une machine déterministe : à entrées identiques, sorties identiques. Il ne peut donc pas produire de hasard. Ce que fournissent les fonctions `random()` n'est pas de l'aléatoire, mais une suite de nombres **calculés** qui ressemble statistiquement à de l'aléatoire. D'où leur nom exact : générateurs de nombres **pseudo**-aléatoires (PRNG).

Cette distinction n'est pas un détail théorique : confondre les deux catégories de générateurs est une faille de sécurité classique.

## Un PRNG est une suite déterministe

Un PRNG part d'un état initial, la **graine** (*seed*), et applique une formule pour produire chaque valeur suivante. Même graine, même suite, toujours, sur toutes les machines.

```python
import random

random.seed(42)
print(random.randint(1, 100))  # 82
print(random.randint(1, 100))  # 15

random.seed(42)                # on repart de la meme graine
print(random.randint(1, 100))  # 82 -> identique
```

En C, `rand()` sans `srand()` utilise implicitement la graine `1` : un programme relancé produit **exactement la même suite**. D'où l'habitude de semer avec l'heure courante :

```c
srand(time(NULL));   // graine differente a chaque seconde
int tirage = rand() % 100;
```

**Ce déterminisme est souvent une qualité**, pas un défaut :

- **reproductibilité scientifique** : fixer la graine permet de rejouer exactement un entraînement de modèle (voir [L'entraînement et la descente de gradient](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) ;
- **tests** : un test qui utilise du hasard doit être reproductible pour être diagnosticable ;
- **génération procédurale** : un monde de jeu entier peut être régénéré à l'identique à partir d'une seule graine.

## Le piège de la graine prévisible

Semer avec `time(NULL)` a un revers : l'heure est **connue de tous**. Si un jeton de session est tiré d'un PRNG semé avec l'horodatage, un attaquant qui connaît approximativement l'heure de création n'a que quelques milliers de graines à essayer pour régénérer la suite complète.

Plus grave : un PRNG classique est conçu pour être **rapide et bien réparti**, pas imprévisible. Avec suffisamment de valeurs observées, on peut retrouver l'état interne et **prédire toutes les valeurs suivantes**. Ce n'est pas une faiblesse d'implémentation, c'est hors de son cahier des charges.

## Deux familles à ne pas confondre

| | PRNG classique | CSPRNG (cryptographique) |
|---|---|---|
| Objectif | Vitesse, bonne répartition | Imprévisibilité |
| Prévisible ? | Oui, à partir de l'état | Non, même en connaissant les sorties |
| Source de graine | Souvent l'horloge | Entropie du système |
| C | `rand()` | `getrandom()`, `/dev/urandom` |
| Python | `random` | `secrets` |
| PHP | `rand()`, `mt_rand()` | `random_bytes()`, `random_int()` |
| JavaScript | `Math.random()` | `crypto.getRandomValues()` |

**La règle est simple et sans exception : dès que la valeur doit être imprévisible, utilisez un CSPRNG.** Cela concerne les jetons de session, les jetons CSRF, les codes de réinitialisation de mot de passe, les sels, les identifiants secrets, les clés.

```python
import secrets
jeton = secrets.token_hex(32)     # imprevisible
```

```php
$jeton = bin2hex(random_bytes(32));   // et non uniqid() ou mt_rand()
```

Voir le chapitre [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite) de PHP, où les jetons CSRF reposent précisément sur `random_bytes()`.

> À l'inverse, n'utilisez pas un CSPRNG pour mélanger une liste d'affichage ou simuler un dé : c'est plus lent et consomme de l'entropie sans bénéfice.

## D'où vient la vraie entropie ?

Le système d'exploitation collecte des évènements physiques difficilement prévisibles : intervalles précis entre les frappes clavier et les interruptions matérielles, bruit thermique, et sur les processeurs récents une instruction dédiée (`RDRAND`). Il en alimente un réservoir d'entropie, exposé sous Linux via `/dev/urandom`.

C'est là qu'un CSPRNG puise sa graine, et c'est ce qui le rend imprévisible : la graine elle-même ne dépend d'aucune formule.

## Le biais du modulo

Une erreur discrète mais réelle : ramener un tirage dans un intervalle avec `%` **déséquilibre** les probabilités quand la plage du générateur n'est pas un multiple de l'intervalle.

```c
// rand() renvoie 0..32767, soit 32768 valeurs
int tirage = rand() % 3;   // 0..2
```

32768 n'est pas divisible par 3 : les valeurs `0` et `1` sortent 10 923 fois, la valeur `2` seulement 10 922 fois. Le biais est ici négligeable, mais il devient significatif quand l'intervalle demandé approche la plage du générateur.

La parade est de **rejeter** les tirages qui tombent dans la zone excédentaire, ou plus simplement d'utiliser une fonction qui le fait pour vous :

```python
random.randint(0, 2)  # gere la repartition uniforme
secrets.randbelow(3)  # idem, en version cryptographique
```

Le même raisonnement s'applique à `Math.random()` en JavaScript ou `mt_rand()` en PHP : préférez la fonction dédiée à un `%` improvisé.

## Résumé

| À retenir | |
|---|---|
| Un PRNG est déterministe | Même graine → même suite |
| Le déterminisme est utile | Tests, reproductibilité scientifique, génération procédurale |
| Graine = horloge | Prévisible : jamais pour de la sécurité |
| Valeur devant être secrète | CSPRNG obligatoire (`secrets`, `random_bytes`, `crypto`) |
| Ramener dans un intervalle | Éviter `%` brut : biais du modulo |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un PRNG classique est une suite déterministe (même graine = même suite) : utile pour les tests et la reproductibilité, mais jamais pour une valeur qui doit rester secrète. Un CSPRNG puise sa graine dans l'entropie du système, ce qui le rend imprévisible. |
| **Outils utilisables** | `secrets`/`random_bytes()`/`crypto.getRandomValues()` (CSPRNG) vs `random`/`rand()`/`Math.random()` (PRNG classique). |
| **Pièges à éviter** | Utiliser un PRNG classique (ou une graine prévisible comme l'horloge) pour un jeton de session, un sel, ou toute valeur devant rester secrète. |
| **Bonnes pratiques** | CSPRNG systématique dès qu'une valeur doit être imprévisible ; utiliser une fonction dédiée (`randint`, `randbelow`) plutôt qu'un `%` improvisé pour ramener un tirage dans un intervalle. |
