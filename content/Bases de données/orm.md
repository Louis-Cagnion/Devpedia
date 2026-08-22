---
order: 7
---

# L'ORM : mapper des objets sur des tables relationnelles

Un programme orienté objet manipule des classes et des instances ; une base relationnelle stocke des tables et des lignes. Les deux modèles ne se superposent pas naturellement (une relation entre deux objets n'est pas une clé étrangère, un héritage de classes n'a pas d'équivalent direct en SQL) : un **ORM** (*Object-Relational Mapping*) automatise la traduction entre les deux, pour écrire du code contre des objets plutôt que des requêtes SQL manuelles.

## Ce qu'un ORM automatise

Un ORM associe une classe à une table, une instance à une ligne, un attribut à une colonne, puis génère lui-même le SQL correspondant :

```text
Modele objet :                    Modele relationnel :

class Utilisateur {          <->  TABLE utilisateurs (
  id                                id INTEGER PRIMARY KEY,
  email                             email TEXT,
  commandes: Commande[]             ...
}                                  )
                                   TABLE commandes (
                                     id_utilisateur INTEGER REFERENCES utilisateurs(id),
                                     ...
                                   )
```

```javascript
// Avec un ORM (exemple Prisma) : un objet, pas une requete SQL ecrite a la main
const utilisateur = await prisma.utilisateur.create({
  data: { email: "alice@exemple.com" }
});

// Le SQL genere par l'ORM, jamais ecrit directement :
// INSERT INTO utilisateurs (email) VALUES ('alice@exemple.com');
```

Le [CRUD](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) de base (créer, lire, modifier, supprimer) est généré automatiquement pour chaque table déclarée, sans écrire soi-même la moindre requête pour ces cas simples.

## Les migrations : versionner le schéma comme du code

Le schéma d'une base évolue avec l'application (nouvelle colonne, nouvelle table, contrainte modifiée). Une **migration** est un script qui décrit ce changement de façon incrémentale et réversible, suivi par [Git](/?c=git&p=git) au même titre que le code applicatif :

```text
migrations/
  20260101_creer_utilisateurs.sql
  20260115_ajouter_colonne_email_verifie.sql
  20260201_creer_table_commandes.sql
```

Chaque migration s'applique dans l'ordre, une fois, sur chaque environnement (poste de développement, préproduction, production) : le schéma de la base devient reproductible à partir de l'historique des migrations, plutôt que dépendant d'une suite de modifications manuelles jamais tracées.

> **Piège :** modifier le schéma directement en production (`ALTER TABLE` exécuté à la main), sans migration correspondante versionnée. Le schéma réel diverge alors silencieusement de ce que décrit le code, jusqu'à ce qu'un déploiement sur un autre environnement échoue ou reproduise un état différent.
>
> **Bonne pratique :** faire passer tout changement de schéma par une migration versionnée, y compris pour un ajustement en apparence mineur, exactement comme un changement de code passe par un commit.

## Type-safety : détecter une erreur avant l'exécution

Un ORM comme Prisma génère des types à partir du schéma de la base : une faute de frappe sur un nom de colonne ou un mauvais type de valeur est détectée à la compilation, avant même de lancer le programme, plutôt qu'au moment où la requête SQL invalide échoue en production :

```javascript
prisma.utilisateur.create({ data: { emial: "alice@exemple.com" } });
// Erreur de compilation immediate : "emial" n'existe pas sur ce modele
```

Une requête SQL écrite à la main dans une chaîne de caractères n'offre aucune de ces garanties : la même faute de frappe n'y serait détectée qu'à l'exécution, si elle l'est.

## Le piège classique : le problème N+1

Accéder à une relation (les commandes d'un utilisateur, par exemple) à l'intérieur d'une boucle déclenche souvent une requête séparée à **chaque itération**, plutôt qu'une seule requête pour tout récupérer d'un coup :

```javascript
const utilisateurs = await prisma.utilisateur.findMany(); // 1 requete

for (const u of utilisateurs) {
  const commandes = await prisma.commande.findMany({ where: { id_utilisateur: u.id } });
  // 1 requete supplementaire PAR utilisateur : N utilisateurs -> N+1 requetes au total
}
```

> **Piège :** charger une relation à l'intérieur d'une boucle sans s'en rendre compte, parce que l'ORM rend cet appel aussi simple syntaxiquement qu'un accès à un attribut normal. Avec 1000 utilisateurs, ce code déclenche 1001 requêtes séparées là où une seule, avec une jointure, suffirait.
>
> **Bonne pratique :** précharger les relations nécessaires en une seule requête (`include`/`with`/`eager loading` selon l'ORM), avant la boucle, plutôt que de laisser l'ORM en déclencher une nouvelle à chaque itération.

```javascript
// 1 seule requete, avec jointure, au lieu de N+1
const utilisateurs = await prisma.utilisateur.findMany({ include: { commandes: true } });
```

## Quand un ORM n'est pas la bonne réponse

Un ORM excelle sur du [CRUD](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) simple, mais force parfois une requête d'analyse complexe (agrégations multiples, fenêtrage, jointures nombreuses — voir [Entrepôt vs Data Lake](/?c=bases-de-donnees&p=entrepot-vs-data-lake) pour ce type de besoin OLAP) dans une syntaxe pensée pour manipuler des objets, pas pour exprimer une requête analytique. Le SQL brut, ou un *query builder* plus proche du SQL qu'un ORM complet, reste souvent plus clair et plus performant pour ce genre de cas.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un ORM traduit automatiquement entre le modèle objet du code et le modèle relationnel de la base (classe/table, instance/ligne). Les migrations versionnent le schéma comme du code. La génération de types détecte une erreur de schéma à la compilation plutôt qu'à l'exécution. |
| **Outils utilisables** | Un ORM (Prisma et équivalents) pour le CRUD courant ; des migrations versionnées pour tout changement de schéma ; le préchargement de relations (`include`/`with`) pour éviter une requête par itération. |
| **Pièges à éviter** | Modifier le schéma en production sans migration versionnée. Charger une relation à l'intérieur d'une boucle (problème N+1). |
| **Bonnes pratiques** | Faire passer tout changement de schéma par une migration versionnée. Précharger les relations nécessaires en une seule requête, avant la boucle qui les utilise. Réserver le SQL brut aux requêtes analytiques complexes que l'abstraction de l'ORM rendrait moins claires. |
