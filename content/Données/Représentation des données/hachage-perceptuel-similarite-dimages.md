---
order: 7
---

# Le hachage perceptuel : reconnaître des images similaires, pas identiques

Une [fonction de hachage cryptographique](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) a une propriété précise : changer un seul pixel d'une image change complètement son résultat. Parfait pour détecter qu'un fichier a été altéré au bit près, inutile pour répondre à une question différente : "ces deux photos montrent-elles la même chose, même si l'une a été recadrée, recompressée ou légèrement retouchée ?" C'est le rôle du **hachage perceptuel** (*perceptual hashing*, souvent abrégé pHash) : une fonction de hachage conçue pour produire des résultats **proches** quand les images sont visuellement proches, à l'inverse d'une fonction cryptographique ou d'une [table de hachage](/?c=langages&s=c&p=tables-de-hachage) classique.

| | Hachage cryptographique | Hachage perceptuel |
|---|---|---|
| But | Détecter la moindre altération | Détecter une ressemblance visuelle |
| Un pixel change | Résultat totalement différent | Résultat quasiment identique |
| Deux images visuellement proches | Résultats sans rapport | Résultats proches (peu de bits différents) |
| Usage typique | Vérifier l'intégrité d'un fichier | Détecter des doublons, une image déjà vue ailleurs |

## Le principe, version simplifiée : l'*average hash* (aHash)

Une des méthodes les plus simples réduit une image à une empreinte de 64 bits en quatre étapes :

```text
1. Réduire l'image à une grille minuscule (8x8 pixels), en niveaux de gris
2. Calculer la luminosité moyenne de ces 64 pixels
3. Pour chaque pixel : 1 si plus clair que la moyenne, 0 si plus sombre
4. Concaténer ces 64 bits : c'est l'empreinte perceptuelle de l'image
```

Réduire l'image à une grille aussi grossière élimine volontairement les détails fins (compression, léger recadrage, filtre de couleur) tout en conservant la structure générale claire/sombre de l'image : deux photos du même sujet produisent alors une empreinte quasiment identique, même après ces modifications.

## Comparer deux empreintes : la distance de Hamming

Deux empreintes perceptuelles se comparent en comptant le nombre de bits différents entre elles (la **distance de Hamming**) :

```text
Image A : 1 0 1 1 0 0 1 0 ...
Image B : 1 0 1 1 0 1 1 0 ...
                    ↑
         1 seul bit différent → images quasi identiques

Image C : 0 1 0 0 1 1 0 1 ...
         → presque tous les bits différents → images sans rapport
```

Plus la distance est faible, plus les deux images sont visuellement proches ; un seuil (par exemple, moins de 10 bits différents sur 64) permet de décider automatiquement si deux images comptent comme "la même", sans jamais les comparer pixel par pixel.

## À quoi ça sert

| Usage | Explication |
|---|---|
| Détection de doublons | Retrouver des photos déjà présentes dans une bibliothèque, même recompressées ou redimensionnées |
| Recherche d'image inversée | Retrouver l'origine d'une image trouvée en ligne |
| Modération de contenu | Bloquer automatiquement une image déjà signalée, même repostée sous un format légèrement différent |

> **Piège :** utiliser le hachage perceptuel comme mécanisme de sécurité (authentification, preuve d'intégrité). Il est conçu pour tolérer les petites variations, pas pour résister à une manipulation volontaire : quelqu'un qui connaît l'algorithme peut légèrement modifier une image pour lui faire produire une empreinte différente (ou au contraire faire correspondre l'empreinte de deux images différentes), ce qu'un hachage cryptographique rend infaisable par conception.
>
> **Bonne pratique :** réserver le hachage perceptuel à des usages de similarité et de déduplication, jamais à un usage de sécurité ; pour vérifier qu'un fichier n'a pas été altéré, utiliser un hachage cryptographique comme SHA-256, qui répond à un besoin différent.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le hachage perceptuel produit des empreintes proches pour des images visuellement proches, à l'inverse d'un hachage cryptographique qui change radicalement au moindre pixel modifié. La distance de Hamming entre deux empreintes mesure leur ressemblance. |
| **Outils utilisables** | Des bibliothèques d'imagerie implémentent déjà l'aHash/pHash/dHash, sans avoir à réécrire l'algorithme soi-même. |
| **Pièges à éviter** | Utiliser un hachage perceptuel comme mécanisme de sécurité ou de preuve d'intégrité. |
| **Bonnes pratiques** | Réserver le hachage perceptuel à la similarité/déduplication ; garder un hachage cryptographique pour l'intégrité. |
