---
order: 11
---

# Cycle de vie d'une entité, schéma par code et champ calculé

Une **entité** est un objet du programme qui représente une ligne de donnée durable : un livre, un client, une commande. Elle est créée, enregistrée, modifiée, puis un jour supprimée. Le code qui gère ces entités (souvent un [ORM](/?c=donnees&s=bases-de-donnees&p=orm), qui traduit des objets en lignes de table, ce que ce chapitre ne répète pas) appelle à chaque étape de leur vie des méthodes que le projet peut compléter : ce sont les étapes du **cycle de vie**. Ce chapitre explique ce qu'on peut y faire, ce qu'il ne faut surtout pas y faire, puis deux idées voisines : décrire le schéma de données dans une classe plutôt que dans un fichier SQL, et ne jamais stocker une valeur qu'on sait recalculer.

Les exemples sont en [PHP](/?c=langages&s=php&p=poo) et en [JavaScript](/?c=langages&s=javascript&p=poo) génériques. Certains frameworks (Drupal par exemple) fonctionnent ainsi, mais rien ici n'en dépend.

## Les quatre étapes

Une étape de cycle de vie est une **méthode de rappel** (en anglais *callback*) : le code de l'ORM l'appelle de lui-même, au bon moment, sans que le projet ait à le demander. Quatre étapes couvrent presque tous les besoins :

| Étape | Moment | Ce qu'on peut y faire | Ce qu'il ne faut pas y faire |
|---|---|---|---|
| `preSave` | juste avant l'écriture | nettoyer ou compléter une valeur, calculer une date, refuser une valeur invalide (en levant une exception) | envoyer un message, appeler un autre service : l'écriture n'a pas encore eu lieu et peut échouer |
| `postSave` | juste après l'écriture | journaliser, vider un cache, prévenir un autre système | enregistrer de nouveau la même entité (boucle), appeler le réseau avant la fin de la transaction |
| `preDelete` | juste avant la suppression | refuser la suppression (exception) si l'entité est encore utilisée | modifier d'autres données de façon définitive : la suppression peut être annulée |
| `postDelete` | juste après la suppression | supprimer les données qui dépendaient de l'entité, vider un cache | lire l'entité comme si elle existait encore en base |

Le déroulement d'un enregistrement suivi d'une suppression :

```text
save(entité)                              delete(entité)
    |                                          |
    v                                          v
 preSave   -- exception ? tout s'arrête     preDelete -- exception ? tout s'arrête
    |                                          |
    v                                          v
 écriture en base                           suppression en base
    |                                          |
    v                                          v
 postSave                                   postDelete
```

Le code suivant est un dépôt minimal qui appelle ces quatre étapes, pour voir l'ordre réel. Il est exécutable avec Node.js (l'outil qui exécute du JavaScript hors d'un navigateur) :

```javascript
// Un dépôt minimal qui appelle les quatre étapes du cycle de vie
class Depot {
  constructor() {
    this.lignes = new Map(); // la "table" : identifiant -> valeurs
    this.trace = []; // l'ordre des événements, pour l'afficher
  }

  save(entite) {
    entite.preSave(this); // 1. avant l'écriture
    this.lignes.set(entite.id, { ...entite.valeurs }); // 2. écriture
    this.trace.push(`écrit ${entite.id}`); // 3. on note l'écriture
    entite.postSave(this); // 4. après l'écriture
  }

  delete(entite) {
    entite.preDelete(this); // 1. avant la suppression
    this.lignes.delete(entite.id); // 2. suppression
    this.trace.push(`supprimé ${entite.id}`); // 3. on note la suppression
    entite.postDelete(this); // 4. après la suppression
  }
}

class Article {
  constructor(id, titre) {
    this.id = id; // identifiant de la ligne
    this.valeurs = { titre }; // valeurs stockées
  }

  preSave(depot) {
    this.valeurs.titre = this.valeurs.titre.trim(); // nettoyer une valeur
    depot.trace.push("preSave : titre nettoyé");
  }

  postSave(depot) {
    depot.trace.push("postSave : journal écrit"); // effet de bord local
  }

  preDelete(depot) {
    depot.trace.push("preDelete : vérification"); // refuser ici si besoin
  }

  postDelete(depot) {
    depot.trace.push("postDelete : cache vidé"); // nettoyer ce qui dépend
  }
}

const depot = new Depot();
const article = new Article(1, "  Bonjour  ");
depot.save(article);
depot.delete(article);
console.log(depot.trace.join("\n"));
console.log(JSON.stringify([...depot.lignes]));
```

Résultat réel :

```text
preSave : titre nettoyé
écrit 1
postSave : journal écrit
preDelete : vérification
supprimé 1
postDelete : cache vidé
[]
```

La dernière ligne (`[]`) montre que la « table » est vide après la suppression.

> **Subtilité :** une suppression ou une mise à jour faite par une requête SQL directe sur beaucoup de lignes à la fois ne passe en général pas par ces étapes : l'ORM ne voit pas les lignes une à une. Une règle codée dans `preDelete` ne protège donc que les suppressions faites via l'entité.

## Les effets de bord

Un **effet de bord** est tout ce qu'un morceau de code change en dehors de son résultat direct : écrire dans un fichier, envoyer un courriel, modifier une autre entité, appeler un autre serveur. Les étapes de cycle de vie sont l'endroit naturel pour les déclencher, mais deux pièges reviennent sans cesse.

### Piège 1 : la boucle de sauvegarde

Si `postSave` enregistre de nouveau la même entité, cet enregistrement déclenche un nouveau `postSave`, qui enregistre de nouveau, et ainsi de suite : une **boucle infinie** (le programme tourne sans jamais s'arrêter, ou plante par manque de mémoire). Le code suivant place un garde-fou volontaire (au-delà de 5 passages, il lève une erreur) pour observer le problème sans bloquer la machine :

```javascript
// Boucle de sauvegarde : postSave enregistre à nouveau la même entité
let appels = 0; // compte les passages dans postSave
const lignes = new Map(); // la "table"

function save(entite) {
  lignes.set(entite.id, { ...entite.valeurs }); // écriture
  entite.postSave(); // étape après écriture
}

const mauvais = {
  id: 1,
  valeurs: { vues: 0 },
  postSave() {
    appels += 1; // un passage de plus
    if (appels > 5) throw new Error("boucle : plus de 5 passages");
    this.valeurs.vues += 1; // modification de l'entité
    save(this); // enregistre à nouveau : postSave sera rappelé
  },
};

try {
  save(mauvais);
} catch (erreur) {
  console.log("Mauvais :", erreur.message);
}

// Correction : écrire directement la valeur dérivée, sans repasser par save
appels = 0;
const bon = {
  id: 2,
  valeurs: { vues: 0 },
  postSave() {
    appels += 1;
    const ligne = lignes.get(this.id); // la ligne déjà écrite
    ligne.vues += 1; // mise à jour directe, aucun événement déclenché
  },
};
save(bon);
console.log("Bon : passages =", appels, "ligne =", JSON.stringify(lignes.get(2)));
```

Résultat réel :

```text
Mauvais : boucle : plus de 5 passages
Bon : passages = 1 ligne = {"vues":1}
```

| Remède | Principe | Limite |
|---|---|---|
| Calculer dans `preSave` | la valeur modifiée part avec l'écriture en cours : un seul enregistrement | n'existe pas encore : on ne connaît pas l'identifiant d'une entité neuve |
| Écrire sans passer par l'événement | une requête directe sur la seule colonne concernée | on contourne aussi les autres règles du cycle de vie |
| Drapeau « déjà traité » | une propriété qui coupe la récursion au second passage | à oublier de remettre à zéro, on bloque les vrais enregistrements suivants |
| Déplacer l'effet ailleurs | un traitement différé (tâche planifiée, file d'attente) | plus de code, et un délai avant l'effet |

### Piège 2 : l'appel réseau dans une transaction

Une **transaction** est un ensemble d'écritures validées ensemble ou annulées ensemble : si l'une échoue, aucune ne reste. Un enregistrement d'entité se fait souvent dans une transaction, et `postSave` s'exécute avant que cette transaction soit terminée. Un **appel réseau** (courriel, requête vers un autre serveur, voir [API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) lancé à ce moment pose deux problèmes :

| Problème | Explication |
|---|---|
| Message parti pour rien | si la transaction est annulée ensuite, l'écriture disparaît mais le courriel, lui, est déjà parti : le client reçoit une confirmation d'une commande qui n'existe pas |
| Transaction ouverte trop longtemps | un serveur distant lent garde la base verrouillée pendant l'attente, et bloque les autres utilisateurs |

Le code suivant simule une transaction (une copie provisoire de la « base », recopiée seulement si tout réussit) et compare deux façons d'envoyer un message :

```javascript
// Une transaction : tout est validé ensemble, ou tout est annulé
const base = new Map(); // état validé
const envoyes = []; // courriels réellement partis

async function transaction(travail) {
  const copie = new Map(base); // état provisoire
  const file = []; // actions à lancer après validation
  try {
    await travail(copie, (action) => file.push(action));
    base.clear(); // validation : la copie devient l'état réel
    copie.forEach((v, k) => base.set(k, v));
    file.forEach((action) => action()); // actions différées
  } catch (erreur) {
    return `annulée : ${erreur.message}`; // rien n'est écrit, rien n'est parti
  }
  return "validée";
}

const envoyer = (adresse) => envoyes.push(adresse); // faux appel réseau

// Mauvais : l'appel réseau part AVANT la fin, puis la transaction échoue
const r1 = await transaction(async (donnees) => {
  donnees.set(1, "commande");
  envoyer("a@exemple.fr"); // parti pour de bon
  throw new Error("stock insuffisant");
});
console.log("Mauvais :", r1, "base =", base.size, "envoyés =", envoyes.length);

// Bon : l'envoi est mis en file et ne part qu'après validation
const r2 = await transaction(async (donnees, apres) => {
  donnees.set(1, "commande");
  apres(() => envoyer("b@exemple.fr")); // différé
  throw new Error("stock insuffisant");
});
console.log("Bon (échec) :", r2, "base =", base.size, "envoyés =", envoyes.length);

const r3 = await transaction(async (donnees, apres) => {
  donnees.set(1, "commande");
  apres(() => envoyer("c@exemple.fr"));
});
console.log("Bon (succès) :", r3, "base =", base.size, "envoyés =", envoyes.length);
```

Résultat réel :

```text
Mauvais : annulée : stock insuffisant base = 0 envoyés = 1
Bon (échec) : annulée : stock insuffisant base = 0 envoyés = 1
Bon (succès) : validée base = 1 envoyés = 2
```

Le premier essai montre le défaut : `base = 0` (rien n'est écrit) mais `envoyés = 1` (un message est parti quand même). Le deuxième essai n'ajoute aucun message (`envoyés` reste à 1) ; seul le troisième, réussi, en ajoute un. La même idée se retrouve dans une [file de messages ou un traitement par lots](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots) : on met l'action en attente, un autre processus l'exécute, et on peut la rejouer si elle échoue.

## Un schéma de données construit par du code

Le **schéma** d'une table est sa description : quelles colonnes, de quel type, avec quelles contraintes (voir [schémas et tables techniques](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques) pour le sens du mot « schéma » en base). Il s'écrit traditionnellement dans un fichier [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) (`CREATE TABLE ...`). Une autre approche est de le déclarer dans la classe de l'entité : chaque champ est un petit objet, une **définition de champ**, et le framework en déduit la table.

| | Fichier SQL | Définitions de champs dans une classe |
|---|---|---|
| Où vit le schéma | un fichier séparé du code | la classe de l'entité |
| Qui écrit le `CREATE TABLE` | le développeur, à la main | le code, déduit des champs |
| Ajouter un champ | modifier le fichier SQL et le code PHP | ajouter une ligne dans la liste des champs |
| Risque principal | le code et le SQL se contredisent | une erreur de définition se propage partout |
| Autres usages possibles | aucun | générer aussi un formulaire, une validation, une API |

Le code PHP suivant déclare trois champs puis en déduit l'instruction SQL. Il crée ensuite vraiment la table dans une base SQLite en mémoire avec PDO (la bibliothèque PHP standard d'accès aux bases, [documentation officielle](https://www.php.net/manual/fr/book.pdo.php)) :

```php
<?php
// Une définition de champ : un nom, un type SQL et une contrainte
final class Champ
{
    public function __construct(
        public string $nom,
        public string $typeSql,
        public bool $obligatoire = false,
    ) {}

    // Écrit la colonne SQL qui correspond au champ
    public function versSql(): string
    {
        return $this->nom . ' ' . $this->typeSql . ($this->obligatoire ? ' NOT NULL' : '');
    }
}

// Une entité décrit elle-même ses champs : le schéma vit dans la classe
class Livre
{
    // Liste des champs stockés (une colonne chacun)
    public static function champs(): array
    {
        return [
            new Champ('id', 'INTEGER PRIMARY KEY'),
            new Champ('titre', 'TEXT', true),
            new Champ('prix_ht', 'REAL', true),
        ];
    }

    // Déduit l'instruction CREATE TABLE de la liste des champs
    public static function creerTable(): string
    {
        $colonnes = array_map(fn (Champ $c) => $c->versSql(), self::champs());
        return 'CREATE TABLE livre (' . implode(', ', $colonnes) . ')';
    }

    public function __construct(private array $valeurs) {}

    // Champ calculé : jamais stocké, recalculé à chaque lecture
    public function prixTtc(): float
    {
        return round($this->valeurs['prix_ht'] * 1.2, 2);
    }
}

echo Livre::creerTable(), "\n";
$livre = new Livre(['id' => 1, 'titre' => 'PHP', 'prix_ht' => 10.0]);
echo $livre->prixTtc(), "\n";
$sqlite = new PDO('sqlite::memory:');
$sqlite->exec(Livre::creerTable());
$lignes = $sqlite->query('SELECT count(*) FROM livre')->fetchColumn();
echo 'table créée, lignes : ', $lignes, "\n";
```

Résultat réel :

```text
CREATE TABLE livre (id INTEGER PRIMARY KEY, titre TEXT NOT NULL, prix_ht REAL NOT NULL)
12
table créée, lignes : 0
```

Vocabulaire PHP du bloc : `final` interdit d'hériter de la classe ; `public`/`private` règlent qui peut lire une propriété ; `static` rattache la méthode à la classe, non à une instance ; `fn (...) =>` est une fonction courte appliquée à chaque champ par `array_map`. Les bases de la [programmation orientée objet en PHP](/?c=langages&s=php&p=poo) sont dans leur chapitre.

> **Piège :** changer une définition de champ n'a d'effet que sur une table créée après. Une table déjà remplie ne se modifie pas toute seule : il faut déplacer et convertir ses lignes, ce qui relève des migrations de données sûres, traitées dans un chapitre à part.

## Le champ calculé

Un **champ calculé** ressemble à un champ pour celui qui l'utilise (`livre.prixTtc`) mais n'a aucune colonne : sa valeur est **recalculée à chaque lecture** à partir d'autres champs. Un prix toutes taxes comprises, un nom complet (prénom et nom), un âge (à partir d'une date de naissance) sont des exemples typiques.

| | Valeur stockée | Valeur calculée |
|---|---|---|
| Où elle vit | une colonne, écrite à la sauvegarde | une fonction, relue à chaque accès |
| Fraîcheur | périmée si la source change sans mise à jour | toujours à jour |
| Coût en lecture | une simple lecture | un calcul à chaque fois |
| Filtrer ou trier en SQL | possible (et indexable avec un [index](/?c=donnees&s=bases-de-donnees&p=les-index)) | impossible directement : la base ne la connaît pas |
| Convient à | une valeur coûteuse à produire et rarement modifiée | une valeur dérivée, bon marché à produire |

Le code suivant montre la valeur stockée qui devient fausse, et la valeur calculée qui reste exacte. `Object.defineProperty` avec `get` déclare une propriété dont la valeur est produite par une fonction à chaque lecture :

```javascript
// Valeur stockée : copiée une fois, elle devient fausse quand la source change
const livre = { prixHt: 10, tva: 0.2 };
livre.prixTtcStocke = livre.prixHt * (1 + livre.tva); // écrit une seule fois

// Valeur calculée : une fonction relue à chaque accès
Object.defineProperty(livre, "prixTtc", {
  get() {
    return livre.prixHt * (1 + livre.tva); // recalculé à chaque lecture
  },
});

livre.prixHt = 20; // la source change
console.log("stocké :", livre.prixTtcStocke); // 12 : périmé
console.log("calculé :", livre.prixTtc); // 24 : à jour
console.log(JSON.stringify(livre)); // le champ calculé n'est pas sérialisé
```

Résultat réel :

```text
stocké : 12
calculé : 24
{"prixHt":20,"tva":0.2,"prixTtcStocke":12}
```

La dernière ligne montre qu'un champ calculé n'apparaît pas dans les données écrites : il n'a pas de place en base, donc rien à synchroniser.

## Les pièges

| Piège | Conséquence | Remède |
|---|---|---|
| Réenregistrer l'entité dans `postSave` | boucle infinie, plantage | calculer dans `preSave`, ou écrire la seule colonne par une requête directe |
| Appel réseau dans `postSave` | message envoyé pour une transaction annulée, base verrouillée longtemps | mettre l'action en file, l'exécuter après validation |
| Compter sur `preDelete` pour tout protéger | une requête SQL directe en masse le contourne | garder aussi une contrainte en base (clé étrangère) |
| Effet de bord dans `preSave` | l'écriture peut encore échouer après | réserver `preSave` aux valeurs de l'entité elle-même |
| Stocker une valeur dérivée | elle devient fausse dès que la source change | la calculer à la lecture, ou la recalculer à chaque sauvegarde |
| Champ calculé coûteux | lent à chaque lecture, surtout dans une liste (voir le problème N+1 de l'[ORM](/?c=donnees&s=bases-de-donnees&p=orm)) | stocker le résultat, avec une règle claire de mise à jour |
| Modifier une définition de champ sur une table remplie | la table et le code divergent | une migration de données sûre (chapitre voisin) |

## Bonnes pratiques

| Pratique | Raison |
|---|---|
| Garder chaque étape courte et rapide | elle s'exécute à chaque enregistrement de chaque entité |
| `preSave` pour corriger, `postSave` pour réagir | la valeur partant à l'écriture est la bonne dès le premier passage |
| Différer tout appel externe après validation | pas de message pour une écriture annulée |
| Tester l'ordre des étapes avec une trace, comme le premier exemple | on voit ce qui est réellement appelé |
| Déclarer un champ calculé plutôt que dupliquer une donnée | une seule source de vérité, rien à synchroniser |
| Garder le schéma d'une seule façon (code ou SQL) | éviter qu'ils se contredisent |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un cycle de vie offre quatre étapes de rappel : `preSave`, `postSave`, `preDelete`, `postDelete`. Un schéma peut être déclaré par des définitions de champs dans une classe. Un champ calculé n'est jamais stocké et se recalcule à chaque lecture. |
| **Outils utilisables** | Un [ORM](/?c=donnees&s=bases-de-donnees&p=orm) qui appelle les étapes ; les transactions de la base ; une file pour différer les effets ; un accesseur (`get`, méthode) pour un champ calculé. |
| **Pièges à éviter** | La boucle de sauvegarde ; l'appel réseau dans une transaction ; une suppression en masse qui contourne `preDelete` ; une valeur dérivée stockée qui vieillit. |
| **Bonnes pratiques** | Corriger dans `preSave`, réagir dans `postSave`, différer le réseau après validation, ne stocker que ce qu'on ne peut pas recalculer à bon marché. |
