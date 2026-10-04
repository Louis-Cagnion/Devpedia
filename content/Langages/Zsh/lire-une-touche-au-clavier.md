---
order: 7
---

# Lire une touche au clavier en zsh : `read -k`, Échap et flèches

Un script interactif a souvent besoin d'une réponse immédiate : « Entrée pour continuer, Échap pour arrêter ». Le script qui lance le solveur Skyscraper sur une série de grilles fait exactement cela. Or la commande habituelle, `read`, attend qu'on valide une **ligne** avec Entrée. Ce chapitre montre comment lire **une seule touche**, ce qu'une touche envoie réellement au programme, et comment distinguer la touche Échap d'une flèche.

## Une ligne ou une touche : `read` et `read -k`

| Commande | Ce qu'elle fait |
|---|---|
| `read ligne` | Attend qu'une ligne entière soit validée par Entrée |
| `read -k 1 touche` | Lit **une touche** dès qu'elle est tapée : le terminal traite alors l'entrée touche par touche |
| `read -s ...` | N'affiche pas ce qui est tapé |
| `read -t 0.05 ...` | N'attend que 0,05 seconde (un nombre décimal est accepté) ; code de retour 1 si rien n'est arrivé |

Selon le manuel de zsh, `-k` lit **depuis le terminal**. Sans terminal (script lancé par `cron`, entrée redirigée), `read -k` échoue avec le message `not interactive and can't open terminal` et le code 1.

La même opération existe en bash, avec d'autres options (comportements vérifiés dans un terminal simulé) :

| | bash | zsh |
|---|---|---|
| Lire une touche | `read -n 1 touche` | `read -k 1 touche` |
| Sans affichage | `-s` | `-s` |
| Délai de 0,05 s expiré | Code **142** | Code **1** |
| `read -n 1 touche` | Lit une touche | **Ne lit rien** : `touche` reste vide, code 0, aucun message |

> **Piège :** recopier le `read -n 1` de bash dans un script zsh ne produit aucune erreur : le manuel de zsh réserve `-n` aux fonctions de complétion, ailleurs l'option est ignorée en silence.

## Ce qu'envoie une touche : des octets

Le clavier n'envoie pas « la touche Échap » : le terminal transmet des **octets**, et `read -k 1` en lit un à la fois. Le script suivant (`octets.zsh`) affiche chaque octet reçu ; le drapeau `(q)` écrit les caractères invisibles sous une forme lisible :

```zsh
#!/bin/zsh
# Affiche les octets reçus à chaque touche : taper une lettre, Entrée, Échap, une flèche...
# Arrêt : taper q.
while read -s -k 1 key; do
    print -r -- "octet reçu : ${(q)key}"
    [[ $key == q ]] && break
done
```

Sortie en tapant dans l'ordre : `a`, Entrée, Échap, flèche haut, flèche gauche, Alt+x, F1, puis `q` :

```
octet reçu : a
octet reçu : $'\n'
octet reçu : $'\033'
octet reçu : $'\033'
octet reçu : \[
octet reçu : A
octet reçu : $'\033'
octet reçu : \[
octet reçu : D
octet reçu : $'\033'
octet reçu : x
octet reçu : $'\033'
octet reçu : O
octet reçu : P
octet reçu : q
```

| Touche | Octets reçus | Lecture |
|---|---|---|
| Lettre `a` | `a` | Un octet |
| Entrée | `\n` | Un octet (le terminal convertit le retour chariot) |
| Échap | `\033` | Un octet : le caractère **ESC**, de code 27 |
| Flèche haut, bas, droite, gauche | `\033`, `[`, puis `A`, `B`, `C` ou `D` | **Trois** octets : ESC, `[` et une lettre |
| Alt+x | `\033`, `x` | Deux octets : ESC suivi de la lettre |
| F1 | `\033`, `O`, `P` | Trois octets |
| Tabulation, retour arrière | `\t`, `\177` | Un octet chacun |

ESC est le caractère qui ouvre une **séquence d'échappement** (le même qui sert aux [codes ANSI de couleur](/?c=langages&s=bash&p=architecture-dun-shell#colorer-la-sortie-d-un-terminal-les-codes-ansi) dans l'autre sens, du programme vers le terminal). Une flèche commence donc exactement comme la touche Échap : seule la suite permet de les distinguer.

## Distinguer Échap d'une flèche

Après avoir lu ESC, on attend très brièvement un octet de plus. S'il arrive, c'est le début d'une séquence (flèche, F1...). S'il n'arrive pas, c'est la touche Échap, tapée seule. La fonction `wait_for_key` (`attente.zsh`) renvoie `0` sur Entrée, `1` sur Échap seul, `2` s'il n'y a pas de terminal :

```zsh
#!/bin/zsh
# Attend Entrée (code 0) ou Échap (code 1) ; code 2 s'il n'y a pas de terminal.
wait_for_key() {
    local key
    while read -s -k 1 key 2>/dev/null; do
        [[ $key == $'\n' || $key == $'\r' ]] && return 0       # Entrée
        [[ $key != $'\e' ]] && continue                        # toute autre touche : on attend
        # une flèche envoie Échap suivi d'autres octets : seul un Échap isolé arrête
        read -s -t 0.05 -k 1 key || return 1                   # rien ne suit : Échap seul
        while read -s -t 0.01 -k 1 key; do :; done             # vide le reste de la flèche
    done
    return 2
}

wait_for_key
echo "code de retour : $?"
```

| Ligne | Rôle |
|---|---|
| `while read -s -k 1 key 2>/dev/null` | Lit une touche sans l'afficher ; échoue sans terminal (message masqué) |
| `[[ $key == $'\n' \|\| $key == $'\r' ]] && return 0` | Entrée (retour chariot ou saut de ligne) : fin avec le code 0 |
| `[[ $key != $'\e' ]] && continue` | Toute autre touche que ESC est ignorée : on relit |
| `read -s -t 0.05 -k 1 key \|\| return 1` | Après ESC, attend 0,05 s un octet de plus ; rien ne vient : Échap seul, code 1 |
| `while read -s -t 0.01 -k 1 key; do :; done` | Un octet est venu : on vide le reste de la séquence (`[` et `A`...) pour qu'ils ne soient pas lus comme deux frappes |
| `return 2` | La boucle s'est arrêtée parce que `read` a échoué : pas de terminal |

Résultats (terminal simulé, touches envoyées comme au clavier) :

| Touches tapées | Code retourné | Lecture |
|---|---|---|
| Entrée | 0 | Continuer |
| Échap seul | 1 | Arrêter |
| Flèche haut, puis Entrée | 0 | La flèche est ignorée |
| `abc`, puis Entrée | 0 | Les lettres sont ignorées |
| Échap, puis `x` 20 ms plus tard (comme Alt+x) | 0 | Pris pour le début d'une séquence : Échap non reconnu |
| Aucun terminal (`< /dev/null`) | 2 | Sans terminal |

## Les pièges

| Piège | Ce qui se passe | Parade |
|---|---|---|
| `read -n 1` écrit par habitude de bash | Aucune erreur, mais la variable reste vide (vérifié) | `read -k 1` en zsh |
| Script sans terminal (cron, tube) | `read -k` échoue avec un message et le code 1 | Masquer le message (`2>/dev/null`) et prévoir un code dédié, comme le `return 2` ci-dessus |
| Alt+touche ou touche de fonction | ESC et la lettre arrivent presque ensemble : lus comme une séquence, jamais comme Échap (vérifié avec 20 ms) | Accepter cette limite, ou lire la séquence entière |
| Ne pas vider la fin d'une séquence | `[` et `A` seraient lus comme deux frappes ordinaires | La boucle `while read -t 0.01` |
| Délai de 0,05 s trop court | Sur une liaison lente (ssh), les octets d'une flèche peuvent arriver séparés de plus que 0,05 s et la flèche être prise pour Échap | À tester sur la liaison réellement utilisée, puis ajuster |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `read -k 1` lit une touche sans attendre Entrée (zsh ; `read -n 1` en bash). Une touche envoie des octets : Échap est un seul octet ESC (`\033`), une flèche en envoie trois (ESC, `[`, une lettre). Pour distinguer Échap d'une flèche, lire ESC puis attendre brièvement un octet de plus avec `-t`. |
| **Outils utilisables** | `read -k`, `-s`, `-t`, la comparaison avec `$'\e'`, le drapeau `(q)` pour voir les octets, `[[ -t 0 ]]` pour tester la présence d'un terminal. |
| **Pièges à éviter** | `read -n 1` dans un script zsh (variable vide sans erreur). Oublier de vider la fin d'une séquence. Lire une touche sans terminal. Prendre Alt+touche pour Échap. |
| **Bonnes pratiques** | Vérifier ce qu'envoie chaque touche avec un petit script d'octets. Masquer le message d'erreur et gérer le cas « pas de terminal » par un code de retour dédié. Choisir les délais en fonction de la liaison utilisée. |
