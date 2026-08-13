---
order: 4
---

# Schémas et tables techniques

Les chapitres précédents ([modèle en étoile](/?c=bases-de-donnees&p=modeles-en-etoile), [table pont](/?c=bases-de-donnees&p=table-pont)) couvrent les tables qui portent l'analyse elle-même : faits, dimensions, associations. Une base réelle contient aussi des tables qui ne servent à aucune analyse mais font fonctionner le pipeline qui les alimente, et un espace de noms qui les range entre elles : le **schéma**.

## Le schéma : un espace de noms pour les tables

Un **schéma** SQL est un espace de noms à l'intérieur d'une base de données : chaque table lui appartient, et son nom complet s'écrit `schema.table` (par exemple `dim.produit` plutôt que juste `produit`). Deux tables de même nom peuvent coexister sans conflit si elles sont dans des schémas différents, et un schéma sert surtout à indiquer d'un coup d'œil le rôle d'une table dans une base qui en contient des centaines.

```sql
CREATE SCHEMA dim;
CREATE SCHEMA fact;

CREATE TABLE dim.produit (
    id_produit  INT PRIMARY KEY,
    nom         VARCHAR(100)
);

CREATE TABLE fact.ventes (
    id_vente    INT PRIMARY KEY,
    id_produit  INT
);
```

## dbo : le schéma par défaut

Sur [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), **dbo** (*database owner*) est le schéma créé par défaut : toute table créée sans préciser de schéma y atterrit automatiquement. Une base qui n'a jamais créé d'autre schéma se retrouve donc avec toutes ses tables dans `dbo`, quel que soit leur rôle (fait, dimension, technique).

> **Piège :** laisser toutes les tables dans `dbo` par défaut, sans jamais créer d'autres schémas. Dans une base de plusieurs centaines de tables, rien ne distingue alors une table de faits d'une table technique juste en lisant son nom complet ; il faut ouvrir chaque table pour comprendre son rôle.
>
> **Bonne pratique :** créer des schémas nommés par rôle (`dim`, `fact`, `stg` pour le staging, `admin` pour les tables techniques) dès qu'une base dépasse une poignée de tables, et n'utiliser `dbo` que pour ce qui n'appartient délibérément à aucune catégorie précise.

## Les tables techniques : elles font tourner le pipeline, pas l'analyse

Une **table technique** (souvent rangée dans un schéma `admin` ou `meta`) ne contient ni fait ni dimension : elle stocke des informations sur le fonctionnement du pipeline lui-même. L'exemple le plus courant est la table de **suivi de chargement** (*watermark table*), qui retient jusqu'où le dernier chargement est allé pour ne retraiter que les nouvelles lignes la fois suivante.

```sql
CREATE TABLE admin.suivi_chargements (
    nom_source          VARCHAR(50) PRIMARY KEY,
    dernier_chargement  DATETIME
);
```

```sql
-- ne lit que ce qui est arrivé depuis le dernier chargement réussi, au lieu de tout relire
SELECT *
FROM source_ventes
WHERE date_modification > (
    SELECT dernier_chargement FROM admin.suivi_chargements WHERE nom_source = 'ventes'
);

-- puis, une fois le chargement terminé avec succès, on avance le repère
UPDATE admin.suivi_chargements
SET dernier_chargement = NOW()
WHERE nom_source = 'ventes';
```

> **Piège :** relire l'intégralité d'une source à chaque exécution du pipeline plutôt que de suivre ce qui a déjà été traité. Sur une source qui grossit chaque jour, le temps de traitement augmente sans fin alors que l'essentiel du travail refait ce qui était déjà correct la veille.
>
> **Bonne pratique :** une table de suivi de chargement par source, mise à jour uniquement après un chargement réussi (jamais avant, sinon une exécution qui échoue en cours de route fait croire au pipeline que des données non traitées l'ont été).

## Piège : mélanger table technique et table d'analyse

Comme pour la bronze et l'argent de l'[architecture médaillon](/?c=bases-de-donnees&p=architecture-medaillon), rien n'empêche techniquement un outil de reporting de lire directement une table technique.

> **Piège :** brancher un tableau de bord sur `admin.suivi_chargements` ou une table de staging parce que l'information y est déjà présente. Ces tables changent de structure au gré des besoins du pipeline, sans égard pour un consommateur externe qui s'y serait accroché.
>
> **Bonne pratique :** garder les tables techniques dans un schéma dédié (`admin`, `stg`, `meta`), séparé des schémas `dim`/`fact` destinés à l'analyse, pour qu'un nouveau venu sache immédiatement, par le seul nom du schéma, ce qu'il a le droit d'interroger.

## Vue d'ensemble

| Schéma | Rôle | Exemple | Qui l'interroge |
|---|---|---|---|
| `dim` | Dimensions | `dim.produit` | Tableaux de bord, analystes |
| `fact` | Faits | `fact.ventes` | Tableaux de bord, analystes |
| `stg` | Données en transit (staging) | Copie brute avant nettoyage | Le pipeline lui-même |
| `admin` | Fonctionnement du pipeline | Suivi de chargement, journal d'erreurs | Les personnes qui maintiennent le pipeline |
| `dbo` | Par défaut (SQL Server), ou usage général non catégorisé | Selon la base | Variable |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un schéma SQL est un espace de noms qui range les tables par rôle (`dim`, `fact`, `stg`, `admin`) ; `dbo` est le schéma par défaut de SQL Server, à ne pas laisser recevoir toutes les tables sans distinction. Les tables techniques (suivi de chargement, journal d'erreurs) font fonctionner le pipeline mais ne servent pas à l'analyse. |
| **Outils utilisables** | `CREATE SCHEMA` pour organiser les tables par rôle ; une table de suivi de chargement (`admin.suivi_chargements`) pour ne retraiter que les nouvelles données à chaque exécution. |
| **Pièges à éviter** | Tout laisser dans `dbo` sans distinction de rôle ; relire l'intégralité d'une source à chaque exécution du pipeline ; brancher un tableau de bord directement sur une table technique. |
| **Bonnes pratiques** | Créer des schémas nommés par rôle dès qu'une base grandit ; mettre à jour le suivi de chargement uniquement après un chargement réussi ; réserver les tables techniques à un schéma dédié, séparé de l'analyse. |
