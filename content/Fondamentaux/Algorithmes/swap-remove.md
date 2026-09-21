---
order: 5
---

# Le swap-remove : retirer un élément d'un tableau en O(1)

Retirer un élément au milieu d'un tableau coûte normalement cher : il faut décaler tous les éléments suivants d'une case vers la gauche pour combler le trou, une opération en **O(n)** ([complexité](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)). Le *swap-remove* (ou *swap-and-pop*) évite ce décalage, au prix de perdre l'ordre des éléments -- acceptable dès que cet ordre n'a pas besoin d'être préservé.

## Le problème : le décalage classique

```c
// retire l'élément à l'index i, en décalant tout ce qui suit -- O(n)
void retirer_avec_decalage(int tab[], int *taille, int i)
{
    for (int j = i; j < *taille - 1; j++)
        tab[j] = tab[j + 1];   // chaque élément recule d'une case
    (*taille)--;
}
```

Sur un tableau de 1000 éléments, retirer le premier déplace les 999 suivants : coûteux si l'opération se répète souvent.

## La technique : échanger avec le dernier, puis retirer

Plutôt que de décaler, on échange l'élément à retirer avec le **dernier élément actif** du tableau, puis on réduit le compteur de taille :

```c
// retire l'élément à l'index i en l'échangeant avec le dernier -- O(1)
void swap_remove(int tab[], int *taille, int i)
{
    tab[i] = tab[*taille - 1];   // le dernier élément prend la place du retiré
    (*taille)--;                  // le dernier n'est plus compté comme actif
}
```

```text
Avant (retirer l'index 1, valeur B) :
[A][B][C][D]        taille = 4
    ^ à retirer

Après swap_remove(tab, &taille, 1) :
[A][D][C] [B]        taille = 3
             ^ B reste physiquement en mémoire, mais n'est plus compté
```

Un seul élément est déplacé, quelle que soit la taille du tableau : **O(1)**, indépendant de la position retirée.

> **Piège :** cette technique ne convient que si l'ordre des éléments restants n'a pas besoin d'être préservé. Sur un tableau où l'ordre compte (ex. un classement, un historique chronologique), utiliser `swap-remove` casserait silencieusement cet ordre -- rester sur le décalage classique dans ce cas.

## Annuler un retrait sans copie

Comme l'élément retiré reste physiquement présent au-delà du nouveau compteur (`tab[*taille]` jusqu'à l'ancien `*taille`, jamais écrasés tant qu'aucun autre `swap_remove` n'a lieu), annuler le dernier retrait revient simplement à restaurer l'ancien compteur -- aucune copie de données n'est nécessaire :

```c
int ancienne_taille = taille;
swap_remove(tab, &taille, i);
// ... plus tard, pour annuler :
taille = ancienne_taille;   // tab[i] redevient valide tel quel, rien à recopier
```

Cette propriété rend le swap-remove particulièrement adapté à un algorithme qui explore puis annule des essais en boucle, comme le [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le swap-remove retire un élément d'un tableau non trié en O(1), en l'échangeant avec le dernier élément actif puis en décrémentant le compteur de taille, au prix de perdre l'ordre des éléments. |
| **Outils utilisables** | Aucun outil dédié : une technique à appliquer directement sur un tableau/compteur de taille. |
| **Pièges à éviter** | L'utiliser sur un tableau où l'ordre des éléments doit être préservé (classement, historique). |
| **Bonnes pratiques** | Profiter de ce que l'élément retiré reste physiquement en mémoire pour annuler un retrait sans copie, en restaurant simplement l'ancien compteur. |
