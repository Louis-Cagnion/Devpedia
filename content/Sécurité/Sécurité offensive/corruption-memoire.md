---
order: 2
---

# La corruption mémoire

Les grandes familles de failles déjà couvertes dans [Les grandes familles de failles](/?c=cybersecurite&p=types-de-failles) (injection, contrôle d'accès, configuration...) touchent surtout des applications web. La **corruption mémoire** est une famille à part, propre aux programmes compilés (C, C++...) qui manipulent directement la mémoire vue dans [Comment un programme s'exécute réellement](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme) : elle regroupe les cas où un programme lit ou écrit à un endroit de la mémoire différent de celui prévu par son auteur.

## Le buffer overflow : écrire au-delà de l'espace réservé

Un **buffer** est un espace mémoire de taille fixe réservé pour une donnée (ex : une chaîne de caractères de 16 octets). Un **buffer overflow** (dépassement de tampon) survient quand un programme écrit plus de données que cet espace ne peut en contenir, sans le vérifier, débordant sur la mémoire voisine.

```text
Espace reserve pour "nom" : 8 octets

Ecriture normale :   [ L | O | U | I | S | \0 |   |   ]   -> tient dans l'espace reserve

Ecriture en depassement (input trop long, jamais verifie) :
                      [ A | A | A | A | A | A | A | A ] [ A | A | A | A ]
                        espace reserve pour "nom"          deborde sur la memoire voisine
                                                            (potentiellement l'adresse de retour,
                                                             voir le chapitre precedent)
```

Sur la pile, la mémoire voisine d'un buffer local contient souvent l'**adresse de retour** de la fonction en cours (voir le chapitre précédent) : un dépassement suffisamment précis peut la remplacer par une adresse choisie par l'attaquant, détournant l'exécution du programme vers du code de son choix dès que la fonction se termine.

> **Piège :** croire qu'un plantage (*crash*) est le seul symptôme possible. Un buffer overflow qui n'écrase qu'une variable voisine, sans faire planter le programme, peut rester silencieux tout en modifiant son comportement (ex : un indicateur `est_administrateur` mis à vrai par accident).

## Le use-after-free : utiliser une mémoire déjà libérée

Vu dans le chapitre précédent, une donnée sur le [tas](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme) doit être explicitement libérée quand elle n'est plus utile. Un **use-after-free** survient quand le programme continue d'utiliser un pointeur vers cette zone après l'avoir libérée : cet espace mémoire peut entre-temps avoir été réattribué à une donnée totalement différente, que le programme va alors lire ou écrire par erreur en pensant manipuler l'ancienne donnée.

```text
1. Le programme alloue de la memoire pour un objet A, garde un pointeur vers elle
2. Le programme libere cet espace (A n'existe plus, mais le pointeur existe toujours)
3. Le programme alloue de la memoire pour un objet B : le systeme reutilise le meme espace
4. Le programme, via son ancien pointeur (perime), lit/ecrit -> il touche en realite B
```

## Le format string : une entrée traitée comme une instruction de formatage

Certaines fonctions (comme `printf` en C) acceptent une **chaîne de format**, qui décrit comment afficher les valeurs qui suivent (`%d` pour un entier, `%s` pour une chaîne...). Un **format string bug** survient quand une donnée fournie par l'utilisateur est directement utilisée comme chaîne de format, au lieu d'être un simple argument à afficher :

```text
// Code vulnerable : la donnee utilisateur EST la chaine de format
printf(entree_utilisateur);

// Si entree_utilisateur vaut "%x %x %x %x", printf lit 4 valeurs
// sur la pile la ou aucun argument n'a ete fourni : il affiche du
// contenu memoire arbitraire, potentiellement sensible.

// Code correct : la donnee utilisateur est un ARGUMENT, jamais le format
printf("%s", entree_utilisateur);
```

Le même piège que celui déjà vu pour l'injection SQL dans [Les grandes familles de failles](/?c=cybersecurite&p=types-de-failles) : une donnée externe traitée comme une instruction plutôt que comme une simple valeur.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La corruption mémoire regroupe les cas où un programme lit ou écrit à un endroit imprévu de la mémoire : buffer overflow (écriture au-delà d'un espace réservé, pouvant écraser l'adresse de retour), use-after-free (utilisation d'un pointeur vers une mémoire déjà libérée et réattribuée), format string (donnée externe utilisée comme instruction de formatage). |
| **Outils utilisables** | Un débogueur (chapitre suivant) pour observer concrètement un dépassement en mémoire ; un fuzzer (voir plus loin dans cette catégorie) pour en découvrir automatiquement. |
| **Pièges à éviter** | Ne vérifier une entrée que par sa présence, jamais par sa taille réelle face à l'espace réservé ; réutiliser un pointeur après avoir libéré la mémoire qu'il désigne. |
| **Bonnes pratiques** | Toujours borner explicitement une écriture à la taille réellement réservée ; mettre un pointeur à `NULL` immédiatement après avoir libéré sa mémoire, pour qu'une réutilisation accidentelle plante immédiatement plutôt que de rester silencieuse. |
