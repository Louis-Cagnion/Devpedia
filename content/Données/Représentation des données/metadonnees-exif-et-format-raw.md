---
order: 6
---

# Métadonnées EXIF et format RAW : ce qu'une photo contient au-delà de l'image

Une photo numérique n'est pas qu'une grille de pixels. Comme [tout fichier](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire), c'est une suite d'octets, mais celle-ci est organisée en deux parties distinctes : les données de l'image elle-même, et un bloc de **métadonnées** (des informations sur la photo, pas la photo) glissé dans le même fichier.

## JPEG vs RAW : deux façons de stocker l'image elle-même

| | JPEG | RAW |
|---|---|---|
| Contenu | Image déjà **traitée** (balance des blancs, netteté, contraste appliqués) et **compressée** (avec perte) par l'appareil | Données quasi brutes du capteur, avant tout traitement, non compressées ou compressées sans perte |
| Taille de fichier | Petite (quelques Mo) | Grande (plusieurs dizaines de Mo) |
| Modifiable après coup | Limité : les décisions de l'appareil (balance des blancs, etc.) sont déjà figées dans les pixels | Large : toutes les décisions restent ajustables en post-traitement, sans perte de qualité |
| Extension typique | `.jpg` | `.cr2` (Canon), `.nef` (Nikon), `.arw` (Sony), ou le format ouvert `.dng` ([Adobe DNG](https://helpx.adobe.com/camera-raw/digital-negative.html)) |

> **Analogie :** le JPEG est une photo déjà développée et recadrée par le photographe ; le RAW est la pellicule brute, qui contient tout ce que le capteur a capté, à développer soi-même ensuite.

## EXIF : un bloc de métadonnées glissé dans le fichier

Le format **EXIF** (*Exchangeable Image File Format*, une [norme technique](https://www.cipa.jp/e/std/std-sec.html) commune à la plupart des appareils photo et smartphones) définit un bloc de métadonnées inséré au début du fichier image (JPEG comme RAW), en plus des pixels eux-mêmes :

| Champ EXIF typique | Exemple de valeur |
|---|---|
| Modèle d'appareil | iPhone 15 Pro |
| Date et heure de la prise de vue | 2026-08-22 14:32:07 |
| Temps d'exposition, ouverture, ISO | 1/125s, f/2.8, ISO 100 |
| Coordonnées GPS (si activées) | 48.8566° N, 2.3522° E |
| Orientation de l'appareil | Portrait |

Ce bloc est lisible par n'importe quel logiciel qui sait le lire (visionneuse d'images, réseau social, éditeur), indépendamment des pixels de la photo.

> **Piège :** partager une photo en ligne sans savoir qu'elle contient encore ses coordonnées GPS EXIF. Une photo prise chez soi et postée publiquement peut ainsi révéler une adresse précise à quiconque inspecte le fichier, même si rien dans l'image elle-même ne le suggère.
>
> **Bonne pratique :** la plupart des réseaux sociaux suppriment automatiquement l'EXIF des photos publiées, mais un fichier envoyé directement (email, messagerie, dépôt sur un site) le conserve tel quel : le vérifier avant tout envoi d'une photo dont la localisation ne doit pas être partagée, avec l'outil de son système d'exploitation ou un utilitaire dédié à la suppression d'EXIF.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un fichier image contient deux choses distinctes : les pixels (JPEG traité/compressé, ou RAW quasi brut) et un bloc de métadonnées EXIF (appareil, réglages, date, parfois GPS), lisible indépendamment de l'image. |
| **Outils utilisables** | Le format ouvert [DNG d'Adobe](https://helpx.adobe.com/camera-raw/digital-negative.html) pour un RAW lisible par plusieurs logiciels ; un utilitaire de suppression d'EXIF avant de partager une photo sensible. |
| **Pièges à éviter** | Partager une photo en pensant qu'elle ne révèle que ce qui est visible dans l'image, en oubliant ses métadonnées EXIF (GPS notamment). |
| **Bonnes pratiques** | Vérifier et retirer l'EXIF d'une photo avant tout envoi direct (hors réseaux sociaux qui le font déjà) si sa localisation ou la date ne doivent pas être connues. |
