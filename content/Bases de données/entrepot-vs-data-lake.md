---
order: 5
---

# Entrepôt de données contre data lake

Le chapitre [Le modèle en étoile](/?c=bases-de-donnees&p=modeles-en-etoile) parle d'**entrepôt de données** (*data warehouse*) sans détailler ce qui le distingue d'une simple base : c'est une base dédiée à l'analyse, avec un schéma imposé avant même d'y écrire quoi que ce soit. Le **data lake** (*lac de données*) répond au même besoin d'accumuler de l'historique, mais en inversant ce principe : on y stocke d'abord, on décide de la structure plus tard.

## Schéma imposé à l'écriture, ou décidé à la lecture

Un entrepôt de données exige un schéma défini avant tout chargement : chaque table a des colonnes typées à l'avance (`CREATE TABLE fait_ventes (montant DECIMAL(10, 2), ...)`), et une ligne qui ne correspond pas à ce schéma est rejetée au moment de l'écriture. C'est le **schema-on-write** : la structure est décidée en amont, la vérification se fait à l'entrée.

Un data lake accepte n'importe quel fichier tel qu'il est : un CSV, un JSON, une image, un fichier de logs bruts, sans exiger de schéma au moment du dépôt. La structure n'est décidée que lorsqu'un traitement vient lire ces fichiers et leur applique une interprétation. C'est le **schema-on-read** : la vérification est repoussée à la lecture, jamais imposée à l'écriture.

```text
Entrepôt de données (schema-on-write) :
  fichier source --> vérifié contre le schéma --> rejeté ou inséré dans une table typée

Data lake (schema-on-read) :
  fichier source --> stocké tel quel, sans vérification --> structure décidée au moment de la lecture
```

## Vue d'ensemble

| | Entrepôt de données | Data lake |
|---|---|---|
| Schéma | Imposé à l'écriture (schema-on-write) | Décidé à la lecture (schema-on-read) |
| Formats acceptés | Tables structurées uniquement | N'importe quel fichier (CSV, JSON, image, log...) |
| Coût du stockage | Plus élevé (structure, index) | Plus faible (fichiers bruts) |
| Usage typique | Reporting stable, tableaux de bord métier | Exploration, données brutes en grand volume, cas d'usage pas encore définis |
| Vitesse de mise à disposition | Plus lente (la structure doit être définie avant) | Immédiate (le fichier est déjà là, tel quel) |

## Le piège : confondre "accepte tout" avec "pas besoin de rigueur"

> **Piège :** traiter le data lake comme un espace sans aucune règle, où l'on dépose des fichiers sans jamais les organiser ni les documenter. Au bout de quelques mois, personne ne sait plus ce que contient chaque fichier, ni s'il est encore à jour : c'est ce qu'on appelle un **data swamp** (*marécage de données*), un data lake devenu inutilisable par accumulation désordonnée.
>
> **Bonne pratique :** organiser le data lake avec les mêmes repères que l'[architecture médaillon](/?c=bases-de-donnees&p=architecture-medaillon) (bronze/argent/or), même si aucun schéma n'est imposé à l'écriture : un dossier ou une convention de nommage par source et par date, et une documentation de ce que contient chaque zone.

## Le piège : croire qu'il faut choisir l'un ou l'autre

> **Piège :** penser qu'une entreprise doit choisir entre entrepôt et data lake une fois pour toutes. Les deux répondent à des besoins différents (reporting stable et fiable contre exploration de données brutes variées), qui coexistent souvent dans la même organisation.
>
> **Bonne pratique :** utiliser un data lake pour absorber des données brutes de toute nature à moindre coût, et un entrepôt de données (ou la couche or d'une architecture médaillon construite sur ce lake) pour ce qui doit être fiable et rapide à interroger pour un rapport métier. Certains outils récents (les **lakehouse**) combinent les deux : le stockage économique d'un data lake, avec des garanties de schéma proches d'un entrepôt.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un entrepôt de données impose un schéma avant l'écriture (schema-on-write) et ne stocke que des tables structurées ; un data lake accepte tout fichier tel qu'il est et ne décide de sa structure qu'à la lecture (schema-on-read). |
| **Outils utilisables** | `CREATE TABLE` avec un schéma typé pour un entrepôt ; un stockage de fichiers organisé par convention (bronze/argent/or) pour un data lake. |
| **Pièges à éviter** | Laisser un data lake devenir un data swamp par accumulation désordonnée ; croire qu'il faut choisir entre les deux plutôt que les faire coexister selon le besoin. |
| **Bonnes pratiques** | Organiser un data lake selon des zones claires même sans schéma imposé ; réserver l'entrepôt (ou la couche or) aux besoins de reporting fiable ; envisager un lakehouse quand les deux besoins se recoupent fortement. |
