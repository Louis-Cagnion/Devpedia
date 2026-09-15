---
order: 4
---

# L'opérateur virgule

L'opérateur virgule évalue **deux expressions dans l'ordre**, et ne garde que la valeur de la **seconde** : la première n'est là que pour son effet de bord (une modification qu'elle produit en passant, comme incrémenter une variable), sa propre valeur est jetée.

```c
int a = (1, 2);   // evalue 1 (jete), puis 2 : a vaut 2
```

## Cas d'usage : plusieurs variables dans une boucle `for`

C'est dans la boucle [`for`](/?c=langages-de-programmation&s=c&p=boucles) que l'opérateur virgule apparaît le plus souvent, pour faire évoluer **deux** variables à chaque tour au lieu d'une seule :

```c
for (int i = 0, j = 10; i < j; i++, j--) {
    printf("i = %d, j = %d\n", i, j);
}
```

- `i = 0, j = 10` initialise les deux variables l'une après l'autre.
- `i++, j--` incrémente `i` ET décrémente `j` à chaque tour, dans une seule des trois parties du `for`.

Sans l'opérateur virgule, une seule expression peut occuper chacune des trois parties du `for` : impossible d'y écrire directement deux instructions séparées par un point-virgule.

## Piège : ne pas confondre avec la virgule-séparateur

Le même caractère `,` a un rôle complètement différent dans deux autres contextes très fréquents, qui n'ont **rien à voir** avec l'opérateur virgule :

| Contexte | Rôle de la virgule | Exemple |
|---|---|---|
| Opérateur virgule | Évalue les deux côtés, garde la valeur du second | `(x++, y++)` |
| Séparateur d'arguments | Sépare les arguments d'un appel de fonction | `printf("%d %d", a, b)` |
| Séparateur de déclarations | Sépare plusieurs variables déclarées ensemble | `int a, b, c;` |

> **Piège :** dans `printf(a, b)`, la virgule ne fait qu'isoler deux arguments : `b` n'est pas "la valeur retenue" comme le ferait l'opérateur virgule, les deux valeurs sont transmises séparément à la fonction. Le compilateur distingue les deux usages par leur **position** (entre parenthèses d'un appel, ou dans une déclaration, vs au milieu d'une expression) plutôt que par un symbole différent.

## L'idiome `return printf(...), NULL;`

```c
char *chercher_ou_afficher_erreur(char *cle)
{
    char *resultat = rechercher(cle);
    if (resultat != NULL) {
        return resultat;
    }
    return printf("Erreur : cle introuvable\n"), NULL;
}
```

`printf(...)` s'exécute pour son effet de bord (afficher le message), puis l'opérateur virgule jette sa valeur de retour et la remplace par `NULL` : la fonction renvoie donc toujours `NULL` dans ce cas, quel que soit ce que `printf()` a lui-même renvoyé. Une seule expression fait donc à la fois l'affichage et le `return`, sans variable intermédiaire.

> **Bonne pratique :** cet idiome reste rare et se lit moins bien qu'une version en deux lignes (`printf(...); return NULL;`). Réserver l'opérateur virgule à la boucle `for` à plusieurs variables, où il est idiomatique et largement reconnu ; l'éviter ailleurs, au profit de la lisibilité.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'opérateur virgule (`expr1, expr2`) évalue les deux expressions dans l'ordre et ne garde que la valeur de la seconde. Le même caractère `,` sépare aussi les arguments d'un appel ou les variables d'une déclaration : deux rôles distincts, jamais l'opérateur virgule dans ces cas-là. |
| **Outils utilisables** | `expr1, expr2` pour combiner deux instructions en une seule expression, typiquement `i++, j--` dans un `for`. |
| **Pièges à éviter** | Confondre l'opérateur virgule avec la virgule qui sépare des arguments (`printf(a, b)`) ou des déclarations (`int a, b;`) : ce sont deux usages syntaxiques différents du même caractère. |
| **Bonnes pratiques** | Réserver l'opérateur virgule aux boucles `for` à plusieurs variables ; préférer deux instructions séparées partout ailleurs, pour la lisibilité. |
