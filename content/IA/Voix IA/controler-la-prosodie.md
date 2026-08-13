---
order: 2
---

# Contrôler la prosodie

Un modèle qui produit un audio intelligible ne suffit pas : le même texte peut se lire d'une façon monotone et robotique, ou avec une intonation naturelle. Ce chapitre couvre la **prosodie** : ce qui, dans une voix, ne dépend pas du choix des mots eux-mêmes.

## Les trois composantes de la prosodie

| Composante | Ce qu'elle contrôle | Exemple |
|---|---|---|
| **Hauteur** (*pitch*, ou F0) | La fréquence fondamentale de la voix, perçue comme "grave" ou "aigu" | Une intonation montante en fin de phrase signale une question |
| **Durée** | La vitesse d'élocution, et l'allongement de certains sons | Une syllabe accentuée dure plus longtemps que les autres |
| **Énergie** | Le volume, et son évolution au fil d'une phrase | Une syllabe accentuée est aussi plus forte |

```text
"Tu viens ?"           vs        "Tu viens."
       ↗                                ↘
   hauteur qui monte           hauteur qui descend
   en fin de phrase            en fin de phrase
   -> percu comme une question -> percu comme une affirmation
```

Le même texte, avec une prosodie différente, change le sens perçu par l'auditeur, même si les mots eux-mêmes ne changent pas.

## Où la prosodie se décide, selon l'architecture

[Tacotron](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) ne contrôle la prosodie qu'**implicitement** : le modèle a appris, à partir des exemples d'entraînement, une prosodie plausible pour un texte donné, sans qu'aucun paramètre explicite du modèle ne représente "la hauteur" ou "la durée" séparément. Des architectures plus récentes ajoutent un contrôle **explicite** :

```text
Tacotron (controle implicite) :
Texte -> [modele] -> spectrogramme (prosodie deduite automatiquement)

Modele avec controle explicite de prosodie :
Texte + parametres de prosodie voulus (hauteur, duree, energie)
     -> [modele] -> spectrogramme qui respecte ces parametres
```

> **Piège :** attendre d'un modèle à contrôle implicite (comme un Tacotron standard) qu'il produise une prosodie précise et reproductible sur commande (par exemple, "insister sur ce mot précis"). Sans paramètre explicite pour cela, le résultat dépend uniquement de ce que le modèle a appris à associer à un texte de cette forme, pas d'une instruction directe.
>
> **Bonne pratique :** utiliser une architecture à contrôle explicite de prosodie dès que le cas d'usage exige une intonation précise (mettre l'accent sur un mot, marquer une pause volontaire), plutôt que d'espérer l'obtenir indirectement via le seul texte d'entrée.

## Un contrôle grossier existe même sur une API simple

La [Web Speech API](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) du navigateur, bien plus simple qu'un modèle neuronal avec contrôle explicite, expose déjà les trois composantes ci-dessus, sous une forme réduite à un seul réglage global par phrase plutôt qu'une courbe détaillée :

```javascript
const enonce = new SpeechSynthesisUtterance("Bonjour tout le monde");
enonce.pitch = 1.2;   // hauteur : 0 (grave) a 2 (aigu), 1 par defaut
enonce.rate = 0.9;    // duree/vitesse : 0.1 (lent) a 10 (rapide), 1 par defaut
enonce.volume = 1.0;  // energie/volume : 0 (silencieux) a 1 (fort)
```

Contrairement à un modèle neuronal à contrôle explicite, ces trois réglages s'appliquent uniformément à toute la phrase : impossible d'augmenter la hauteur sur un seul mot précis sans découper la phrase en plusieurs énoncés successifs.

> **Piège :** ajuster `pitch`/`rate`/`volume` à l'oreille, phrase par phrase, sans méthode. Ces réglages agissent globalement sur tout l'énoncé : vouloir insister sur un seul mot demande de découper le texte en plusieurs `SpeechSynthesisUtterance` distincts, un par segment ayant sa propre valeur, pas un seul réglage sur la phrase entière.
>
> **Bonne pratique :** découper explicitement un texte en segments dès qu'un contrôle de prosodie différencié est recherché, même avec une API aussi simple que la Web Speech API.

Voir aussi [Modèles modernes de synthèse](/?c=ia&s=voix-ia&p=modeles-modernes-synthese) pour des architectures qui vont plus loin que ce contrôle explicite basique.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | La prosodie (hauteur, durée, énergie) porte une partie du sens perçu, indépendamment des mots eux-mêmes. Un modèle comme Tacotron la contrôle implicitement, déduite de l'entraînement ; des architectures plus récentes exposent un contrôle explicite. Même une API simple comme la Web Speech API expose ces trois leviers, mais globalement par énoncé. |
| **Outils utilisables** | `pitch`/`rate`/`volume` de `SpeechSynthesisUtterance` pour un contrôle basique. Une architecture à contrôle explicite pour un besoin plus précis. |
| **Pièges à éviter** | Attendre une prosodie précise et reproductible d'un modèle à contrôle implicite. Ajuster les réglages d'une API simple à l'oreille sans découper le texte par segment. |
| **Bonnes pratiques** | Utiliser un modèle à contrôle explicite dès qu'une intonation précise est nécessaire. Découper le texte en segments pour différencier la prosodie, même avec une API simple. |
