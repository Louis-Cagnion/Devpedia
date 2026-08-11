---
order: 2
---

# L'architecture médaillon

Le chapitre [Le modèle en étoile](/?c=bases-de-donnees&p=modeles-en-etoile) suppose que les données sont déjà propres : chaque ligne de `fait_ventes` a un `id_produit` qui existe bien dans `dim_produit`, aucune valeur n'est en double, aucun champ n'est vide par erreur. En pratique, les données brutes qui arrivent d'un site web, d'un capteur ou d'un export d'un autre logiciel sont rarement dans cet état. L'**architecture médaillon** (*medallion architecture*) organise le chemin entre "donnée brute" et "donnée prête pour l'analyse" en trois étapes nommées d'après les médailles olympiques : **bronze**, **argent** et **or**.

## Le problème : transformer sans tout recommencer à chaque fois

Sans étapes intermédiaires, un pipeline typique lit la source, nettoie, agrège et écrit le résultat final en une seule fois. Si une règle de nettoyage était fausse, ou si une nouvelle analyse a besoin des données à un stade moins transformé, il faut tout relire depuis la source et tout refaire. L'architecture médaillon garde une copie à chaque étape, pour ne recommencer que le travail réellement affecté par une correction.

```text
Source (site web, capteur, export...)
        |
        v
   [ BRONZE ]  copie brute, telle que reçue
        |
        v
   [ ARGENT ]  nettoyée, dédupliquée, un schéma stable
        |
        v
   [   OR   ]  agrégée, organisée pour une analyse précise
        |
        v
Tableau de bord / rapport
```

## Bronze : la copie brute

La couche **bronze** est une copie fidèle de ce qui a été reçu de la source, sans aucune transformation : mêmes noms de colonnes que l'export d'origine, mêmes valeurs (y compris les erreurs), et on n'y supprime ni ne corrige jamais rien. Elle sert de filet de sécurité : si une règle de nettoyage appliquée plus tard s'avère fausse, on peut toujours repartir de la bronze plutôt que de redemander la donnée à la source (qui a pu changer, ou ne plus être disponible).

```text
Export brut reçu du site web (une ligne par clic, telle que produite par le serveur) :

id;produit;qte;date
1;Clavier;2;2025-03-01
2;;1;2025-03-01          -> produit vide : erreur laissée telle quelle
2;Souris;1;2025-03-01    -> id 2 dupliqué : laissé tel quel
```

> **Piège :** corriger ou filtrer les données dès leur arrivée en bronze. Une fois l'erreur ou le doublon supprimé, l'information "voici exactement ce que la source a envoyé à cet instant" est perdue, et une analyse qui aurait besoin de le savoir (retrouver l'origine d'un bug d'export, par exemple) n'a plus rien à examiner.
>
> **Bonne pratique :** écrire la bronze en ajout seul (*append-only*) : chaque nouvel arrivage vient s'ajouter, jamais remplacer ou modifier ce qui existe déjà.

## Argent : nettoyée et fiable

La couche **argent** applique les règles de nettoyage : lignes en double supprimées, champs vides écartés ou complétés selon une règle explicite, types de colonnes corrigés (une date stockée en texte devient une vraie date), noms de colonnes harmonisés si plusieurs sources différentes alimentent la même table. Le résultat a un schéma stable sur lequel d'autres traitements peuvent s'appuyer sans surprise.

```sql
-- à partir de la bronze ci-dessus
INSERT INTO argent_ventes (id_vente, produit, quantite, date_vente)
SELECT id, produit, qte, CAST(date AS DATE)
FROM bronze_ventes
WHERE produit IS NOT NULL AND produit != ''   -- écarte les lignes sans produit
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY id ORDER BY date DESC
) = 1;                                        -- ne garde qu'une ligne par id dupliqué
```

> **Piège :** deviner une règle de nettoyage au lieu de la documenter explicitement. Si "ligne sans produit écartée" n'est écrit nulle part, la prochaine personne qui reprend le pipeline ne sait pas si l'absence de ces lignes en argent est volontaire ou un bug.
>
> **Bonne pratique :** rendre chaque règle de nettoyage traçable (commentaire dans le code de transformation, ou table séparée qui journalise les lignes écartées et pourquoi), pour pouvoir répondre à "pourquoi cette ligne a disparu ?" des mois plus tard.

## Or : prête pour une analyse précise

La couche **or** agrège et modélise les données argent pour un usage métier précis : ventes totales par région, taux de désabonnement mensuel, etc. C'est typiquement ici qu'on retrouve le [modèle en étoile](/?c=bases-de-donnees&p=modeles-en-etoile) : une table de faits et ses dimensions, prêtes à être interrogées directement par un tableau de bord, sans qu'il ait besoin de connaître les étapes de nettoyage passées.

```sql
-- table "or" : ventes agrégées par produit et par mois, à partir de l'argent
INSERT INTO or_ventes_mensuelles (produit, mois, total_quantite, total_montant)
SELECT produit, DATE_TRUNC('month', date_vente), SUM(quantite), SUM(quantite * prix)
FROM argent_ventes
JOIN argent_produits USING (produit)
GROUP BY produit, DATE_TRUNC('month', date_vente);
```

> **Piège :** créer une table or par tableau de bord au lieu de par besoin métier partagé, ce qui multiplie les tables quasi identiques (une pour chaque nouveau rapport) et rend chaque petite correction à refaire partout.
>
> **Bonne pratique :** concevoir chaque table or pour un besoin métier réutilisable (ex. "ventes par mois", exploitable par plusieurs tableaux de bord), pas pour un seul écran précis.

## Vue d'ensemble

| | Bronze | Argent | Or |
|---|---|---|---|
| Contenu | Copie brute, telle que reçue | Nettoyée, dédupliquée, typée | Agrégée, orientée besoin métier |
| Schéma | Celui de la source (peut varier) | Stable et harmonisé | Stable, pensé pour l'analyse |
| Modifiable ? | Jamais (ajout seul) | Réécrite si la règle de nettoyage change | Réécrite si le besoin métier change |
| Qui l'interroge | Le pipeline lui-même | D'autres pipelines, rarement un humain | Tableaux de bord, rapports, analystes |

## Erreur fréquente : laisser un tableau de bord lire la bronze ou l'argent

Rien n'empêche techniquement un outil de reporting de se connecter directement à la bronze ou à l'argent plutôt qu'à l'or.

> **Piège :** brancher un tableau de bord sur l'argent (ou la bronze) parce que "la donnée dont j'ai besoin y est déjà". Le tableau de bord se retrouve alors à refaire lui-même l'agrégation métier, dupliquée dans chaque outil qui fait pareil, et une correction de règle métier doit être répercutée partout au lieu d'un seul endroit.
>
> **Bonne pratique :** réserver l'or comme unique point d'entrée pour tout ce qui consomme la donnée en dehors du pipeline lui-même ; si un besoin métier manque, créer ou étendre une table or plutôt que de contourner par l'argent.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'architecture médaillon découpe un pipeline de données en trois copies successives : bronze (brute, intacte), argent (nettoyée, schéma stable), or (agrégée pour un besoin métier précis, souvent modélisée en [étoile](/?c=bases-de-donnees&p=modeles-en-etoile)). |
| **Outils utilisables** | Requêtes SQL de transformation (`INSERT ... SELECT`, dédoublonnage par `ROW_NUMBER()`, agrégation par `GROUP BY`) pour faire passer une table d'une couche à la suivante. |
| **Pièges à éviter** | Corriger ou filtrer dès la bronze ; appliquer une règle de nettoyage non documentée ; créer une table or par tableau de bord ; brancher un outil de reporting directement sur la bronze ou l'argent. |
| **Bonnes pratiques** | Bronze en ajout seul ; règles de nettoyage traçables ; tables or pensées par besoin métier réutilisable ; l'or comme unique point d'entrée pour les consommateurs externes au pipeline. |
