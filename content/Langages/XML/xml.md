---
order: 13
---

# XML

**XML** (*eXtensible Markup Language*) est, comme [HTML](/?c=langages&s=html&p=html), un langage de balisage : des données organisées en balises imbriquées, chacune pouvant porter des attributs. Contrairement à HTML, dont les balises (`<p>`, `<div>`...) ont un sens fixé à l'avance par le navigateur, XML n'impose aucune balise particulière : chaque format basé sur XML définit lui-même ses propres noms de balises, selon les données qu'il décrit.

```xml
<annonce>
    <reference>REF-001</reference>
    <vehicule marque="Renault">
        <modele>Clio</modele>
    </vehicule>
</annonce>
```

| Terme | Ce que ça veut dire |
|---|---|
| Élément | Une balise ouvrante/fermante et tout ce qu'elle contient (`<reference>REF-001</reference>`) |
| Attribut | Une paire clé="valeur" à l'intérieur d'une balise ouvrante (`marque="Renault"`) |
| Document bien formé | Chaque balise ouverte est bien refermée, dans le bon ordre, sans chevauchement (`<a><b></a></b>` est invalide) |

> **Note :** XML et [JSON](/?c=langages&s=php&p=http) répondent au même besoin (échanger des données structurées entre systèmes), mais XML reste courant pour des flux plus anciens (catalogues fournisseurs, exports métier) mis en place avant la généralisation de JSON.

## Lire un fichier XML : DOM vs streaming

Deux façons de lire un fichier XML s'opposent par leur usage de la mémoire :

| Approche | Principe | Mémoire utilisée | Cas d'usage |
|---|---|---|---|
| **DOM** (*Document Object Model*) | Charge tout le fichier en un arbre navigable, en mémoire | Proportionnelle à la taille du fichier entier | Petit fichier, besoin d'aller-retours entre plusieurs parties du document |
| **Streaming** (ex. `XMLReader` en PHP) | Lit le fichier séquentiellement, un nœud à la fois, sans jamais charger l'ensemble | Constante, quel que soit la taille du fichier | Gros fichier (des dizaines de milliers d'entrées), traité une fois, dans l'ordre |

```php
<?php
$lecteur = new XMLReader();
$lecteur->open('catalogue.xml');

while ($lecteur->read()) {
    if ($lecteur->nodeType === XMLReader::ELEMENT && $lecteur->localName === 'annonce') {
        $noeud = $lecteur->expand();       // développe CET élément en un mini-DOM local
        $doc   = new DOMDocument();
        $doc->appendChild($doc->importNode($noeud, true));
        // ... extraire les données de $doc, puis passer à l'annonce suivante
    }
}
$lecteur->close();
?>
```

`expand()` combine les deux approches : le fichier entier reste lu en streaming (mémoire constante), mais chaque élément individuel devient un petit arbre DOM classique, plus simple à interroger (`getElementsByTagName()`...) qu'un parcours manuel nœud par nœud.

> **Bonne pratique :** streaming pour un gros fichier traité une seule fois dans l'ordre (un import de catalogue, par exemple) ; DOM pour un petit fichier ou un besoin de navigation libre entre ses parties (remonter à un ancêtre, comparer deux branches éloignées).

## La faille XXE (*XML External Entity*)

Le format XML permet de déclarer une **entité externe** : un raccourci qui, une fois utilisé dans le document, est remplacé par le contenu d'une ressource externe (un fichier local, une URL) au moment de l'analyse :

```xml
<?xml version="1.0"?>
<!DOCTYPE annonce [
  <!ENTITY vol SYSTEM "file:///etc/passwd">
]>
<annonce>
    <reference>&vol;</reference>
</annonce>
```

Si un parseur XML résout cette entité sans restriction, `&vol;` est remplacé par le contenu du fichier `/etc/passwd` (sur un système Unix), qui se retrouve alors accessible dans les données extraites : c'est la faille **XXE**. N'importe quel service qui accepte du XML fourni par un tiers (un import de fichier, une API) est concerné, dès l'instant où le contenu XML n'est pas garanti fiable à 100%.

> **Piège :** croire qu'un simple contrôle du contenu texte ("le fichier ressemble à une annonce valide") suffit à écarter une XXE. La déclaration `<!DOCTYPE ...>` peut se trouver n'importe où en tête de document, sans rien changer à l'apparence des données utiles qui suivent.

### Se protéger : désactiver la résolution des entités externes

```php
<?php
libxml_set_external_entity_loader(fn () => null);

$lecteur = new XMLReader();
$lecteur->open('fichier_fourni_par_un_tiers.xml');
?>
```

`libxml_set_external_entity_loader()` remplace, pour tout le processus PHP, le mécanisme qui va chercher le contenu d'une entité externe par une fonction qui ne renvoie jamais rien (`null`) : toute entité externe déclarée dans le document est donc ignorée, plutôt que résolue.

> **Bonne pratique :** appeler cette fonction avant toute lecture d'un document XML dont l'origine n'est pas garantie à 100% (fourni par un partenaire, uploadé par un utilisateur...), même si le format attendu ne prévoit normalement aucune entité externe : la protection ne coûte rien à un document légitime, qui n'en déclare simplement aucune.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | XML organise des données en balises imbriquées à noms libres, avec attributs. Lire un fichier XML se fait soit en DOM (tout en mémoire, navigation libre), soit en streaming (mémoire constante, lecture séquentielle) ; `expand()` combine les deux. Une entité externe XML mal contrôlée permet de lire un fichier arbitraire du serveur (faille XXE). |
| **Outils utilisables** | `XMLReader` (streaming) et `DOMDocument` (arbre complet) en PHP, `expand()` pour combiner les deux, `libxml_set_external_entity_loader()` pour désactiver les entités externes. |
| **Pièges à éviter** | Charger un très gros fichier XML entièrement en DOM (mémoire proportionnelle au fichier). Croire qu'un contrôle du contenu texte suffit à écarter une XXE. |
| **Bonnes pratiques** | Streaming pour un traitement séquentiel de gros volume, DOM pour un besoin de navigation libre. Désactiver systématiquement la résolution des entités externes avant de lire un document XML d'origine non garantie. |
