---
order: 1
---

# Le modèle en étoile

Le chapitre [SQL](/?c=domain-specific-languages-dsl&p=sql) traite chaque table comme une feuille de tableur isolée. Dès qu'on veut analyser un historique complet (des années de ventes, par exemple), on organise volontairement plusieurs tables les unes autour des autres selon un schéma précis : le **modèle en étoile** (*star schema*), le plus répandu dans un entrepôt de données.

## OLTP contre OLAP : deux usages, deux organisations

Une base d'application classique (celle qui enregistre une commande quand un client clique sur "Acheter") est optimisée pour des écritures rapides et fréquentes, une ligne à la fois : c'est l'**OLTP** (*Online Transaction Processing*). Un entrepôt de données est optimisé pour l'inverse : peu d'écritures, mais des lectures qui parcourent des millions de lignes à la fois ("le total des ventes par région sur les trois dernières années") : c'est l'**OLAP** (*Online Analytical Processing*). Le modèle en étoile est une organisation pensée pour l'OLAP.

| | OLTP (application) | OLAP (entrepôt de données) |
|---|---|---|
| Opération typique | Insérer une commande | Agréger trois ans de ventes |
| Volume par requête | Une poignée de lignes | Des millions de lignes |
| Priorité | Écriture rapide, pas de doublon | Lecture rapide, quitte à dupliquer |

## La table de faits : ce qu'on mesure

La **table de faits** (*fact table*) contient les événements mesurables : une ligne par vente, par exemple, avec des colonnes numériques (montant, quantité) et des clés étrangères vers chaque axe d'analyse.

```sql
CREATE TABLE fait_ventes (
    id_produit  INT,   -- clé étrangère → dim_produit
    id_client   INT,   -- clé étrangère → dim_client
    id_date     INT,   -- clé étrangère → dim_date
    montant     DECIMAL(10, 2),
    quantite    INT
);
```

## La table de dimension : selon quel angle on regarde

Une **table de dimension** (*dimension table*) décrit un des axes selon lequel on veut regarder les faits : le produit vendu, le client, la date. Elle porte les colonnes descriptives (nom, catégorie, ville...) qu'on utilise pour filtrer ou regrouper.

```sql
CREATE TABLE dim_produit (
    id_produit  INT PRIMARY KEY,
    nom         VARCHAR(100),
    categorie   VARCHAR(50)
);
```

## Pourquoi "en étoile" : le schéma

Une table de faits au centre, une table de dimension à chaque branche : vu à plat, la forme rappelle une étoile.

```text
                dim_date
                    |
dim_client ---- fait_ventes ---- dim_produit
                    |
               dim_magasin
```

Une requête d'analyse ("le total des ventes par catégorie de produit, en 2025") ne fait plus qu'un `JOIN` (voir [SQL](/?c=domain-specific-languages-dsl&p=sql)) entre la table de faits et chaque dimension concernée, jamais une longue chaîne de jointures à travers des dizaines de tables :

```sql
SELECT p.categorie, SUM(f.montant) AS total
FROM fait_ventes f
JOIN dim_produit p ON p.id_produit = f.id_produit
JOIN dim_date d ON d.id_date = f.id_date
WHERE d.annee = 2025
GROUP BY p.categorie;
```

## Le compromis : dénormalisation volontaire

Une base OLTP évite de répéter une même information dans plusieurs lignes (la **normalisation**) : chaque fait est écrit une seule fois, pour éviter les incohérences si on doit le corriger. Une dimension fait le choix inverse : elle **dénormalise** volontairement, en répétant par exemple la catégorie du produit sur chaque ligne de `dim_produit` plutôt que de la stocker dans une table `dim_categorie` séparée.

| | Normalisé (OLTP) | Dénormalisé (dimension) |
|---|---|---|
| Duplication | Minimale | Acceptée |
| Écriture | Rapide, sans incohérence possible | Plus lente à corriger (plusieurs lignes à mettre à jour) |
| Lecture | Nécessite plusieurs `JOIN` | Un seul `JOIN` suffit |

> **Piège :** juger la dimension dénormalisée "mal conçue" avec des réflexes OLTP (recherche de duplication). La duplication y est un choix assumé : l'entrepôt de données est réécrit par lots (une fois par nuit, par exemple), pas ligne par ligne comme une application, l'incohérence qu'évite la normalisation n'a donc pas le même coût.
>
> **Bonne pratique :** juger une table selon l'usage qu'elle sert (écriture unitaire fréquente vs lecture massive), pas selon une règle universelle de conception.

## Clé de substitution plutôt que clé naturelle

Une **clé naturelle** est un identifiant qui existe déjà dans le monde réel (une référence produit, un numéro de sécurité sociale). Une **clé de substitution** (*surrogate key*) est un entier généré uniquement pour servir de clé, sans aucun sens en dehors de la base (le `id_produit` des exemples ci-dessus).

> **Piège :** utiliser une clé naturelle comme clé de dimension. Si le système source change un jour cette référence (renumérotation d'un catalogue produit, fusion de deux identifiants clients), toutes les lignes de faits qui pointent dessus se retrouvent orphelines.
>
> **Bonne pratique :** générer une clé de substitution propre à l'entrepôt pour chaque dimension, et ne garder la clé naturelle que comme colonne descriptive parmi d'autres. Elle reste stable même si le système source change ses propres identifiants.

## Variante à connaître : le modèle en flocon

Le **modèle en flocon** (*snowflake schema*) pousse la normalisation un cran plus loin à l'intérieur même des dimensions : `dim_produit` renvoie vers une table `dim_categorie` séparée au lieu de répéter la catégorie sur chaque ligne.

| | Étoile | Flocon |
|---|---|---|
| Dimensions | Dénormalisées (une seule table par axe) | Normalisées (dimension éclatée en sous-tables) |
| Espace disque | Plus de duplication | Moins de duplication |
| Requête | Un seul `JOIN` par dimension | Un `JOIN` de plus par sous-dimension |

> **Bonne pratique :** partir du modèle en étoile par défaut (plus simple à interroger) ; ne passer en flocon que si l'espace disque ou la maintenance d'une très grosse dimension le justifie concrètement, pas par principe de normalisation.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le modèle en étoile organise un entrepôt de données autour d'une table de faits (les mesures) reliée à des tables de dimension (les axes d'analyse), à l'opposé d'une base OLTP normalisée. |
| **Outils utilisables** | `JOIN` et `GROUP BY` en SQL pour interroger une table de faits selon une ou plusieurs dimensions. |
| **Pièges à éviter** | Juger une dimension dénormalisée avec des réflexes de base OLTP ; utiliser une clé naturelle (susceptible de changer) comme clé de dimension. |
| **Bonnes pratiques** | Générer une clé de substitution propre à l'entrepôt pour chaque dimension ; garder le modèle en étoile par défaut, ne passer en flocon que si un besoin concret le justifie. |
