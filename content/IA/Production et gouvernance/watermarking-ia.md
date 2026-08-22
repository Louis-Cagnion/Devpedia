---
order: 4
---

# Watermarking du contenu généré par IA

Distinguer un contenu produit par une IA d'un contenu humain devient un enjeu direct à mesure que les modèles progressent : traçabilité pour une entreprise qui doit auditer ses propres sorties, obligation légale via la [réglementation européenne de l'IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia) (transparence exigée pour tout contenu à risque limité, deepfakes en particulier), et lutte contre la désinformation à grande échelle. Le **watermarking** (marquage) répond à ce besoin en intégrant, dans le contenu généré lui-même, un signal qui permet de l'identifier après coup, mais la technique diffère radicalement selon qu'on marque du texte, une image ou de l'audio.

## Watermarking de texte : un biais statistique, pas un caractère caché

Il n'y a rien à cacher dans du texte : contrairement à une image, aucun pixel superflu où loger un signal invisible. La technique s'appuie donc sur autre chose : influencer légèrement les choix du modèle pendant la génération elle-même.

Un LLM choisit chaque token suivant à partir d'une [distribution de probabilité sur tout le vocabulaire](/?c=ia&s=nlp-llm&p=nlp-et-llm) : plusieurs tokens candidats ont une probabilité non nulle à un même endroit du texte, et feraient tous une phrase correcte. Une clé secrète, connue seulement du fournisseur du modèle, rend certains de ces candidats légèrement plus probables que d'autres à chaque étape de génération :

```text
Distribution de probabilite sur le vocabulaire, a une position donnee
      │
      ▼
Cle secrete -> favorise legerement certains tokens candidats
      │
      ▼
Token choisi (le biais reste invisible a la lecture)
```

Pris isolément, un seul mot ne prouve rien : n'importe quel humain aurait pu faire le même choix. Répété sur des centaines ou des milliers de tokens, ce léger biais forme en revanche un motif statistique qu'un détecteur possédant la clé peut mesurer, sans avoir besoin d'accéder au modèle lui-même.

> **Piège :** chercher un mot jugé "typique de l'IA" (comme *delve*, beaucoup cité comme prétendu marqueur) et y voir une preuve de génération par IA. Il n'existe aucune liste secrète de mots interdits : la préférence du modèle pour certains mots vient de son entraînement, pas d'un mécanisme de marquage, et un texte marqué n'a besoin de contenir aucun mot particulier.
>
> **Bonne pratique :** traiter ce watermarking comme une preuve statistique probabiliste, jamais comme un verdict binaire : un détecteur renvoie un score de confiance, pas une certitude.

### Les limites propres au texte

Le signal statistique est fragile pour des raisons propres au texte, indépendantes de toute volonté de le contourner :

| Situation | Effet sur le signal |
|---|---|
| Texte très court (quelques phrases) | Trop peu de tokens pour qu'un motif statistique émerge : la détection n'est pas fiable |
| Réécriture ou paraphrase | Chaque mot reformulé est un nouveau choix, indépendant du biais d'origine : le signal s'efface progressivement |
| Résumé | Le résumé est une nouvelle génération de tokens, pas une copie : le signal du texte source ne s'y retrouve pas |
| Traduction | Change entièrement l'espace des tokens candidats (autre langue) : le signal ne survit pas au passage |

> **Piège :** présenter un watermarking de texte comme une garantie contre tout usage abusif. Un signal aussi fragile qu'un biais statistique n'est vraiment fiable que sur un texte long, non retouché, dans sa langue d'origine, or une bonne partie des usages réels (copier-coller partiel, reformulation, traduction) le fait déjà disparaître.
>
> **Bonne pratique :** communiquer honnêtement sur cette limite plutôt que de présenter le watermarking de texte comme une solution robuste : c'est un indice statistique de plus, pas une preuve d'authenticité au sens cryptographique.

## Watermarking image et audio : une marque insérée dans le signal

Contrairement au texte, une image ou un flux audio dispose d'un espace physique où loger un signal sans en altérer la perception : un pixel a plusieurs nuances possibles, un échantillon audio plusieurs valeurs proches, toutes perçues de façon identique par l'œil ou l'oreille humaine.

| Approche | Principe | Exemple |
|---|---|---|
| Watermark imperceptible | Un motif encodé dans les pixels ou l'échantillonnage, invisible/inaudible pour un humain mais lisible par un détecteur dédié | Le marquage audio évoqué dans [Cloner une voix](/?c=ia&s=voix-ia&p=cloner-une-voix) |
| Watermark perceptible | Une marque visible ou audible directement | Un filigrane "généré par IA" superposé à une image |
| Métadonnées de provenance ([C2PA](https://c2pa.org)/*Content Credentials*) | Une chaîne de métadonnées signées cryptographiquement, attachée au fichier, qui trace chaque étape de création/modification | Une image dont les métadonnées listent : générée par tel modèle, puis modifiée par tel logiciel |

Le standard [C2PA](https://c2pa.org) (*Coalition for Content Provenance and Authenticity*) diffère des deux premières approches : il ne modifie pas le contenu lui-même, il y attache un historique vérifiable. Son point faible est justement là : ces métadonnées disparaissent avec un simple export ou une capture d'écran, sans toucher au contenu visuel/audio lui-même, là où un watermark imperceptible correctement conçu résiste mieux.

> **Piège :** considérer un watermark imperceptible comme définitivement increvable. Une compression agressive, un recadrage ou un traitement audio volontaire peut dégrader ou effacer la marque, un point déjà signalé côté audio dans [Cloner une voix](/?c=ia&s=voix-ia&p=cloner-une-voix).
>
> **Bonne pratique :** combiner plusieurs couches (watermark imperceptible et métadonnées C2PA) plutôt que de se reposer sur une seule, chacune ayant un point de rupture différent.

## Une limite commune à toutes les techniques : détecter, pas empêcher

Qu'il s'agisse de texte, d'image ou d'audio, le watermarking répond à une seule question, *a posteriori* : ce contenu a-t-il été généré par IA ? Il ne répond à aucune autre : il n'empêche pas un modèle de générer un contenu problématique, ne bloque rien au moment de la génération, et ne sert que si un détecteur est effectivement interrogé après coup.

> **Piège :** présenter le watermarking comme une mesure de sécurité qui empêche un mésusage. C'est un outil de traçabilité a posteriori, pas un mécanisme de prévention : un contenu marqué peut circuler librement, servir à une fraude ou à de la désinformation, sans qu'aucun mécanisme n'intervienne avant que le mal ne soit fait.
>
> **Bonne pratique :** situer le watermarking dans une chaîne plus large de traçabilité et de responsabilisation (obligations de transparence de la [réglementation européenne de l'IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia), politiques d'utilisation, modération), jamais comme une solution isolée suffisante.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le watermarking de texte biaise statistiquement le choix des tokens grâce à une clé secrète ; il perd sa fiabilité sur un texte court, réécrit, résumé ou traduit. Le watermarking image/audio loge un signal imperceptible dans le contenu, ou s'appuie sur des métadonnées de provenance signées (C2PA). Dans tous les cas, le watermarking détecte après coup, il n'empêche rien au moment de la génération. |
| **Outils utilisables** | Un détecteur statistique tenant la clé secrète, pour le texte. Un watermark imperceptible ou des métadonnées C2PA, pour l'image et l'audio. |
| **Pièges à éviter** | Confondre un mot jugé "typique de l'IA" avec une preuve de watermarking. Présenter un watermark comme une garantie infaillible ou comme un mécanisme de prévention plutôt que de détection. |
| **Bonnes pratiques** | Traiter le résultat d'un détecteur comme un score probabiliste, jamais un verdict tranché. Combiner plusieurs couches de marquage (imperceptible et métadonnées) plutôt qu'une seule. Situer le watermarking dans une chaîne plus large de traçabilité, pas comme solution isolée. |
