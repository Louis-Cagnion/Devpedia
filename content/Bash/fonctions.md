---
title: Les fonctions en Bash
---

Une fonction Bash regroupe une suite de commandes sous un nom réutilisable. Contrairement à PHP ou C, une fonction Bash ne déclare **jamais** de liste de paramètres nommés : elle reçoit ses arguments exactement comme un script reçoit les siens, via `$1`, `$2`, etc.

## Déclarer et appeler une fonction

```bash
saluer() {
    echo "Bonjour $1 !"
}

saluer "Jean"   # Bonjour Jean !
```

`function saluer { ... }` est une écriture alternative acceptée par Bash (mais non portable vers un `sh` strictement POSIX) — `saluer() { ... }` est la forme la plus universelle.

## Les arguments d'une fonction

```bash
resumer() {
    echo "Nom de la fonction : $FUNCNAME"
    echo "Premier argument : $1"
    echo "Tous les arguments : $@"
    echo "Nombre d'arguments : $#"
}

resumer "Jean" "Dupont"
```

> **Note :** `$1`, `$2`... à l'intérieur d'une fonction désignent les arguments **de la fonction**, jamais ceux du script englobant — ils sont automatiquement remplacés pendant l'appel, sans rien à configurer.

## Pas de vraie valeur de retour : uniquement un code de sortie

`return` en Bash ne renvoie **pas** une valeur au sens de PHP/C — il fixe uniquement le **code de sortie** de la fonction (un entier de 0 à 255, récupérable via `$?`), exactement comme `exit` pour un script entier :

```bash
est_pair() {
    if [ $(($1 % 2)) -eq 0 ]; then
        return 0   # 0 = succès/vrai, convention Unix
    else
        return 1   # non nul = échec/faux
    fi
}

if est_pair 4; then
    echo "4 est pair"
fi
```

## "Renvoyer" une vraie donnée : `echo` + substitution de commande

Pour récupérer une donnée calculée (pas juste un succès/échec), la convention est de l'afficher avec `echo`, et de capturer cette sortie depuis l'appelant via `$(...)` (cf. chapitre sur les variables) :

```bash
addition() {
    echo $(($1 + $2))
}

resultat=$(addition 4 6)
echo "Résultat : $resultat"  # Résultat : 10
```

> **Note :** ne jamais confondre les deux mécanismes. `return` communique un statut (0-255, pour du contrôle de flux avec `if`), `echo` + `$(...)` communique une vraie donnée (pour être stockée/réutilisée). Un mélange des deux dans la même fonction est une source classique de confusion.

## Variables locales

Sans `local`, une variable assignée dans une fonction reste visible **globalement** après le premier appel — souvent un effet de bord non désiré :

```bash
calculer() {
    local resultat=$(($1 * 2))  # local : n'existe qu'à l'intérieur de calculer()
    echo $resultat
}
```

Voir aussi le chapitre sur les variables (variables spéciales `$1`, `$@`, `$#`, `$?`, déjà réutilisées ici dans le contexte des fonctions).
