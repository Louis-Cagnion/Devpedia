---
order: 10
---

# Elasticsearch : la base orientée documents pour la recherche

Une base relationnelle (voir [Bases de données](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) organise la donnée en tables, lignes et colonnes, reliées par des jointures. **Elasticsearch** organise la donnée autrement : chaque enregistrement est un **document** JSON complet, rangé dans un **index** (l'équivalent d'une table), et le moteur est construit dès le départ pour la **recherche plein texte** plutôt que pour les jointures.

| | Base relationnelle (SQL) | Redis | Elasticsearch |
|---|---|---|---|
| Unité de donnée | Ligne, dans une table à colonnes fixes | Une valeur par clé (voir [Redis](/?c=donnees&s=bases-de-donnees&p=redis)) | Un document JSON, dans un index |
| Point fort | Jointures, cohérence transactionnelle | Vitesse d'accès en RAM | Recherche plein texte, tolérance aux fautes |
| Requêtes | [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) | Commandes par type de structure | Requêtes en JSON (*Query DSL*) |

## Un document, un index

```json
// Document indexé sous l'index "vehicules"
{
  "marque": "Peugeot",
  "modele": "308",
  "annee": 2022,
  "description": "Berline compacte, faible kilométrage, entretien à jour"
}
```

Contrairement à une table SQL, deux documents du même index n'ont pas besoin d'avoir exactement les mêmes champs : Elasticsearch déduit le type de chaque champ (texte, nombre, date...) à la première insertion, et l'index qu'il construit sur ce champ dépend de ce type déduit.

## Interroger avec le Query DSL

Une requête n'est pas une chaîne façon SQL, mais un objet JSON envoyé au serveur :

```json
// Cherche "berline" dans la description, limité aux annonces < 20000€
{
  "query": {
    "bool": {
      "must": [
        { "match": { "description": "berline" } }
      ],
      "filter": [
        { "range": { "prix": { "lte": 20000 } } }
      ]
    }
  },
  "from": 0,
  "size": 20
}
```

| Clause | Rôle |
|---|---|
| `match` | Recherche plein texte, tolère les variantes de mots (accents, pluriels selon la langue configurée) |
| `filter` | Condition exacte (plage, égalité), sans influencer le score de pertinence |
| `from` / `size` | Pagination : `from` = combien de résultats sauter, `size` = combien en renvoyer |

## Le *fuzzy matching* : tolérer les fautes de frappe

Un `match` classique peut activer la **tolérance aux fautes de frappe** (*fuzziness*) : "peugot" retrouve quand même "peugeot", à une distance d'édition (nombre de lettres à changer) fixée par le paramètre.

```json
{ "match": { "modele": { "query": "peugot", "fuzziness": "AUTO" } } }
```

> **Piège :** activer le fuzzy matching sur un champ censé être une valeur exacte issue d'une facette (une liste déroulante "Marque", par exemple, où l'utilisateur ne peut sélectionner que des valeurs déjà valides). Le fuzzy matching y devient trop permissif : il peut faire remonter "Renault" pour une recherche "Peugeot" si la distance d'édition tombe sous le seuil, un résultat absurde pour un champ à choix fermé.
>
> **Bonne pratique :** réserver le fuzzy matching aux champs de texte libre réellement tapés par un humain (une description, une recherche en langage naturel) ; sur un champ à valeurs fermées (facette, filtre), utiliser une correspondance exacte (`term`), jamais `match` avec fuzziness.

## Les agrégations : compter et grouper sans jointure

Une **agrégation** calcule une statistique sur l'ensemble des documents qui correspondent à une requête, dans la même réponse que les résultats eux-mêmes :

```json
// Combien d'annonces par marque, parmi les résultats filtrés plus haut
{
  "aggs": {
    "par_marque": {
      "terms": { "field": "marque.keyword" }
    }
  }
}
```

C'est l'équivalent d'un `GROUP BY` SQL, mais calculé sur l'index de recherche lui-même plutôt que par une jointure entre tables.

## Painless : personnaliser le tri côté serveur

**Painless** est un petit langage de script exécuté côté serveur Elasticsearch, utilisé quand le tri par défaut (pertinence textuelle, ou un champ simple) ne suffit pas :

```json
// Trie par un score maison : note x nombre d'avis, plutôt que la note seule
{
  "sort": {
    "_script": {
      "type": "number",
      "script": { "source": "doc['note'].value * doc['nb_avis'].value" },
      "order": "desc"
    }
  }
}
```

## Importer en masse : la Bulk API

Insérer un document à la fois (une requête réseau par document) devient très lent sur un import de plusieurs milliers d'enregistrements. La **Bulk API** regroupe de nombreuses opérations (ajout, mise à jour, suppression) dans un seul appel réseau :

```text
Un document a la fois :    1000 documents -> 1000 requetes reseau
Bulk API (par lots de 500): 1000 documents -> 2 requetes reseau
```

> **Piège :** continuer d'insérer document par document sur un import volumineux "parce que ça marche déjà" : le goulot d'étranglement n'est presque jamais Elasticsearch lui-même, mais le nombre d'aller-retours réseau (voir [Limiter les allers-retours](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)).
>
> **Bonne pratique :** utiliser la Bulk API par lots (quelques centaines à quelques milliers de documents par appel selon leur taille), plutôt qu'une requête par document.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Elasticsearch stocke des documents JSON dans des index, pensés pour la recherche plein texte plutôt que les jointures. Les requêtes s'écrivent en JSON (Query DSL) ; les agrégations calculent des statistiques sans jointure ; Painless permet un tri personnalisé côté serveur. |
| **Outils utilisables** | `match` (plein texte, avec fuzziness optionnelle), `filter`/`term` (valeur exacte), `aggs` (agrégations), scripts Painless, Bulk API pour l'import en masse. |
| **Pièges à éviter** | Activer le fuzzy matching sur un champ à valeurs fermées (facette) ; importer document par document plutôt que par lots. |
| **Bonnes pratiques** | Réserver `match`/fuzziness au texte libre, `term` aux facettes ; utiliser la Bulk API par lots pour tout import volumineux. |
