---
order: 6
---

# Les index

Le tableau OLTP/OLAP du chapitre [Le modèle en étoile](/?c=bases-de-donnees&p=modeles-en-etoile) évoque des lectures qui parcourent des millions de lignes. Sans aide, une base ne peut retrouver les lignes qui vérifient une condition qu'en les examinant une par une : c'est ce qu'un **index** vient éviter.

## Le problème : chercher dans une table non triée

Sans index, `WHERE id_produit = 42` oblige la base à lire chaque ligne de la table, une par une, jusqu'à avoir toutes les lignes correspondantes. C'est un **balayage complet** (*full scan*) : le temps de recherche augmente avec le nombre de lignes de la table, même si une seule correspond à la condition.

```text
Table sans index : 1 000 000 lignes lues pour trouver les 3 lignes où id_produit = 42
```

## L'index : une structure pour retrouver sans tout lire

Un **index** est une structure séparée qui associe une valeur de colonne à l'emplacement exact des lignes qui la portent, un peu comme l'index alphabétique à la fin d'un livre qui donne directement le numéro de page d'un mot plutôt que de le faire chercher page par page. Une fois l'index créé sur `id_produit`, la base peut sauter directement aux lignes concernées sans lire les autres.

```sql
CREATE INDEX idx_fait_ventes_produit ON fait_ventes (id_produit);
```

```text
Table avec index sur id_produit : la base consulte l'index, trouve directement l'emplacement
des 3 lignes où id_produit = 42, sans lire les 999 997 autres.
```

## Le compromis : lecture plus rapide, écriture plus lente

Un index n'est pas gratuit : à chaque insertion, modification ou suppression d'une ligne, la base doit aussi mettre à jour tous les index qui portent sur cette table, en plus d'écrire la ligne elle-même. Plus une table a d'index, plus chaque écriture coûte cher.

| | Sans index | Avec index |
|---|---|---|
| Lecture (`WHERE`, `JOIN`) | Balayage complet, lent sur une grosse table | Accès direct, rapide |
| Écriture (`INSERT`/`UPDATE`/`DELETE`) | Rapide (rien à maintenir en plus) | Plus lente (l'index doit être mis à jour aussi) |
| Espace disque | Minimal | Un index occupe de l'espace supplémentaire |

Ce compromis rejoint le tableau OLTP/OLAP du chapitre sur le modèle en étoile : une base OLTP, qui écrit sans cesse, limite ses index au strict nécessaire ; un entrepôt OLAP, qui lit beaucoup plus qu'il n'écrit, peut se permettre d'en poser davantage.

## Piège : ne pas indexer les clés étrangères d'une table de faits

> **Piège :** créer une table de faits avec ses clés étrangères vers chaque dimension (`id_produit`, `id_client`, `id_date`), sans poser d'index sur ces colonnes. Chaque `JOIN` vers une dimension (voir [Le modèle en étoile](/?c=bases-de-donnees&p=modeles-en-etoile)) se retrouve alors à balayer intégralement la table de faits, exactement le cas que l'index est censé éviter.
>
> **Bonne pratique :** indexer systématiquement les colonnes de clé étrangère d'une table de faits, puisqu'elles servent de point d'entrée à quasiment toutes les requêtes d'analyse qui la concernent.

## Piège : indexer sans discernement

> **Piège :** poser un index sur chaque colonne "au cas où", ou sur une colonne à très peu de valeurs distinctes (un booléen `actif` vrai/faux, par exemple). Dans ce dernier cas, l'index ne réduit presque pas le nombre de lignes à examiner (la moitié de la table porte `vrai`), alors qu'il coûte tout de même à chaque écriture.
>
> **Bonne pratique :** indexer les colonnes réellement utilisées dans un `WHERE`, un `JOIN` ou un `ORDER BY`, et privilégier celles qui ont beaucoup de valeurs distinctes (un identifiant, une date) plutôt qu'un simple indicateur vrai/faux.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un index est une structure séparée qui permet de retrouver des lignes sans balayer toute la table, au prix d'une écriture plus lente et d'un espace disque supplémentaire à chaque insertion, modification ou suppression. |
| **Outils utilisables** | `CREATE INDEX nom_index ON table (colonne)` pour accélérer les lectures filtrées ou jointes sur cette colonne. |
| **Pièges à éviter** | Table de faits sans index sur ses clés étrangères (chaque `JOIN` balaye tout) ; index posé sur une colonne à très peu de valeurs distinctes ou "au cas où" sans usage réel. |
| **Bonnes pratiques** | Indexer systématiquement les clés étrangères d'une table de faits ; réserver les index aux colonnes réellement filtrées, jointes ou triées, avec suffisamment de valeurs distinctes pour que l'index réduise vraiment la recherche. |
