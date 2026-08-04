---
order: 6
---

# Un seul mécanisme par information

Quand une même information peut être représentée par deux mécanismes différents qui se chevauchent, le code chargé de l'interpréter doit gérer les deux — et gère rarement bien le cas où ils se contredisent. Ce n'est pas qu'une question de style : c'est une source directe d'incohérence silencieuse.

## Un exemple concret

Un fichier Markdown pourrait, en théorie, déclarer son titre de deux façons à la fois :

```markdown
---
title: Les pointeurs
order: 5
---

# Les pointeurs en C
```

Le frontmatter dit "Les pointeurs", le corps du fichier dit "Les pointeurs en C". Lequel est le vrai titre ? Le générateur de site doit choisir une règle de priorité (le frontmatter gagne ? le heading gagne ? le dernier écrit ?), et cette règle devient elle-même une source de bugs : quelqu'un modifie le heading en pensant changer le titre affiché, sans savoir que le frontmatter — invisible à la lecture rapide du fichier — prend le dessus.

Ce site évite délibérément le problème : le frontmatter d'un chapitre ne porte **jamais** de champ `title`, seulement des métadonnées de construction (`order`, pour le tri pédagogique). Le titre affiché vient uniquement du premier `# Heading` du corps — une seule source, un seul endroit à modifier, aucune règle de priorité à documenter ni à retenir.

## Pourquoi ça complique toujours le code, pas seulement la donnée

Le coût ne se limite pas au risque d'incohérence dans les données : le code qui **lit** ces deux mécanismes doit lui-même contenir la logique de priorité, ce qui l'alourdit pour un cas qui n'aurait jamais dû exister. Un parseur qui doit vérifier "y a-t-il un frontmatter avec un titre ? sinon, chercher un heading" est plus complexe, plus difficile à tester, et plus susceptible de traiter un cas limite différemment de l'autre mécanisme — que si une seule règle, sans exception, s'appliquait toujours.

## Comment le repérer

Le signal apparaît chaque fois que deux mécanismes indépendants peuvent, l'un comme l'autre, produire ou représenter la même information : un identifiant dérivé d'un nom de fichier ET stocké séparément en base ; une configuration lue depuis un fichier ET redéfinie par une variable d'environnement, sans qu'un seul des deux ne soit clairement prioritaire par construction ; un statut calculé à la volée ET mis en cache, sans invalidation garantie entre les deux.

Dans chaque cas, la question à trancher est la même : **lequel des deux mécanismes est la source, et lequel peut être supprimé ou réduit à une simple dérivation du premier ?** Garder les deux "au cas où" n'élimine jamais le risque — il ne fait que le déplacer au moment, inévitable, où ils finiront par diverger.
