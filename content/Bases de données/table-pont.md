---
order: 3
---

# La table pont

Dans le [modèle en étoile](/?c=bases-de-donnees&p=modeles-en-etoile), chaque ligne de la table de faits pointe vers une seule ligne de chaque dimension : une vente a un seul produit, un seul client, une seule date. Mais certaines relations ne sont pas aussi simples : une même vente peut avoir bénéficié de plusieurs promotions à la fois. Une colonne `id_promotion` unique dans `fait_ventes` ne peut contenir qu'une seule valeur, donc ce cas ne rentre pas dans le modèle tel quel.

## Le problème : une relation "plusieurs à plusieurs"

Une vente peut cumuler plusieurs promotions, et une même promotion s'applique à plusieurs ventes différentes : c'est une relation **plusieurs-à-plusieurs** (*many-to-many*), à l'opposé de la relation un-vers-plusieurs habituelle entre une dimension et la table de faits (un produit peut apparaître dans plusieurs ventes, mais chaque vente n'a qu'un seul produit).

```text
Relation habituelle (un-vers-plusieurs) :
dim_produit  1 ---- N  fait_ventes     (un produit, plusieurs ventes ; une vente, un seul produit)

Relation à résoudre (plusieurs-à-plusieurs) :
fait_ventes  N ---- N  dim_promotion   (une vente, plusieurs promotions ; une promotion, plusieurs ventes)
```

## La table pont : une ligne par association

La **table pont** (*bridge table*) résout ce cas en insérant une table intermédiaire entre la table de faits et la dimension concernée. Chaque ligne de la table pont associe un identifiant de fait à un identifiant de dimension ; une vente qui a deux promotions donne simplement deux lignes dans la table pont, une par promotion.

```sql
CREATE TABLE fait_ventes (
    id_vente    INT PRIMARY KEY,
    id_produit  INT,
    montant     DECIMAL(10, 2)
);

CREATE TABLE dim_promotion (
    id_promotion  INT PRIMARY KEY,
    libelle       VARCHAR(100),
    pourcentage   DECIMAL(4, 2)
);

CREATE TABLE pont_ventes_promotions (
    id_vente      INT,   -- clé étrangère → fait_ventes
    id_promotion  INT    -- clé étrangère → dim_promotion
);
```

```text
Vente 1 (montant 100€) a bénéficié des promotions 10 et 20 :

pont_ventes_promotions
id_vente | id_promotion
---------|-------------
1        | 10
1        | 20
```

## Le piège classique : le double comptage

Faire un `JOIN` naïf entre `fait_ventes` et `pont_ventes_promotions` produit une ligne par association, pas une ligne par vente. Une vente à 100€ qui a deux promotions apparaît deux fois dans le résultat : la sommer directement double le montant.

```sql
-- piège : cette requête compte la vente 1 deux fois (une par promotion), donc 200€ au lieu de 100€
SELECT SUM(f.montant)
FROM fait_ventes f
JOIN pont_ventes_promotions p ON p.id_vente = f.id_vente;
```

> **Piège :** additionner directement une colonne de la table de faits après un `JOIN` sur une table pont. Le nombre de lignes explose (une par association), et toute somme ou moyenne calculée dessus est faussée par ce doublement.
>
> **Bonne pratique :** soit compter les ventes distinctes (`SUM(DISTINCT ...)` ou une sous-requête qui agrège d'abord), soit répartir le montant entre les promotions via une colonne de pondération explicite dans la table pont (par exemple `poids` à 0.5 pour chacune des deux promotions, pour que la somme des poids reste égale à 1 par vente).

```sql
CREATE TABLE pont_ventes_promotions (
    id_vente      INT,
    id_promotion  INT,
    poids         DECIMAL(4, 2)   -- part du montant attribuée à cette promotion (somme = 1 par vente)
);

-- avec la pondération, la somme redevient correcte : 100€ répartis en 50€ + 50€, pas 100€ + 100€
SELECT SUM(f.montant * p.poids)
FROM fait_ventes f
JOIN pont_ventes_promotions p ON p.id_vente = f.id_vente;
```

## Vue d'ensemble

| | Dimension classique | Table pont |
|---|---|---|
| Relation avec la table de faits | Un-vers-plusieurs | Plusieurs-à-plusieurs |
| Une ligne représente | Une valeur de l'axe d'analyse | Une association entre un fait et une valeur de dimension |
| Risque au `JOIN` | Aucun (une ligne de faits reste une ligne) | Duplication des lignes de faits (une par association) |
| Agrégation | `SUM`/`AVG` direct sans risque | Nécessite une pondération ou un comptage distinct |

## Reconnaître le besoin d'une table pont

> **Piège :** ajouter une deuxième colonne de clé étrangère (`id_promotion_1`, `id_promotion_2`) dans la table de faits pour gérer "jusqu'à deux promotions". Cette limite arbitraire casse dès qu'une vente en a trois, et chaque colonne ajoutée complique toutes les requêtes qui doivent désormais vérifier plusieurs colonnes au lieu d'une.
>
> **Bonne pratique :** dès qu'une dimension peut avoir plusieurs valeurs valides pour un même fait (promotions, tags, catégories multiples), passer par une table pont plutôt que par des colonnes répétées. Le nombre d'associations possibles par fait devient alors illimité, sans changer le schéma.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La table pont résout une relation plusieurs-à-plusieurs entre la table de faits et une dimension, en stockant une ligne par association plutôt qu'une clé étrangère directe. |
| **Outils utilisables** | `JOIN` vers la table pont ; colonne de pondération (`poids`) pour répartir une mesure entre plusieurs associations sans la dupliquer. |
| **Pièges à éviter** | Sommer une mesure de la table de faits après un `JOIN` sur une table pont sans pondération (double comptage) ; multiplier les colonnes de clé étrangère pour simuler une relation plusieurs-à-plusieurs. |
| **Bonnes pratiques** | Utiliser une table pont dès qu'un fait peut avoir plusieurs valeurs pour une même dimension ; y inclure une colonne de pondération quand une mesure doit être répartie entre les associations. |
