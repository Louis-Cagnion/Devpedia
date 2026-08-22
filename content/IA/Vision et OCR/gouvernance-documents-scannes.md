---
order: 8
---

# Gouvernance des données pour des documents scannés

[Gouvernance des données pour un système IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) pose les principes généraux (classer une donnée, tracer qui a demandé quoi, respecter le droit à l'oubli) pour une donnée qui transite par un LLM, essentiellement du **texte**. Ce chapitre reprend ces mêmes principes pour une **image** de document scanné, où une différence change tout : effacer une donnée personnelle dans une image n'est pas la même opération que l'effacer dans du texte.

## Classer un document avant de l'envoyer à un modèle de vision

Le principe de classification par sensibilité (publique/interne/personnelle/secrète, voir le [chapitre général](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) s'applique tel quel à un document scanné, avec une nuance déjà notée dans [l'arbitrage local vs cloud pour un modèle de vision](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) : l'image complète d'un document expose souvent **plus** d'information que ce que le pipeline cherche réellement à en extraire (toute la page, pas seulement le champ utile).

> **Piège :** classer un document selon le seul champ qu'on cherche à en extraire (un montant, par exemple), en ignorant le reste de l'image envoyée au modèle. Une facture scannée dans son intégralité peut contenir, en dehors du montant recherché, une adresse, un numéro de compte ou une signature, tout aussi exposés à un fournisseur tiers.
>
> **Bonne pratique :** classer un document selon **tout** ce que l'image contient réellement, pas seulement le champ visé par l'extraction.

## Effacer une donnée personnelle dans une image : une opération différente

Dans une base de données textuelle, remplacer une valeur revient à écraser une chaîne de caractères par une autre (voir le [`DELETE` classique](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)). Une donnée personnelle visible sur une image scannée (un nom manuscrit, une signature, un numéro de carte d'identité) n'a pas d'équivalent aussi simple : elle doit être **localisée** puis **masquée visuellement**, pas simplement remplacée dans une base :

| | Donnée personnelle en texte | Donnée personnelle dans une image scannée |
|---|---|---|
| Comment la localiser | Une recherche de chaîne, ou une colonne connue en base | Une [détection de zone](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) (une boîte englobante autour de la zone à masquer) |
| Comment l'effacer | Remplacer la valeur (ou la supprimer) dans le champ concerné | Recouvrir la zone détectée d'un aplat opaque (*redaction*), directement dans les pixels de l'image |
| Risque si mal fait | Une valeur oubliée dans un champ annexe | Une zone mal détectée (trop petite) laisse une partie de la donnée visible malgré la "correction" |

> **Piège :** flouter une zone contenant une donnée personnelle plutôt que la recouvrir d'un aplat opaque. Un flou reste parfois réversible (des techniques de reconstruction peuvent retrouver une partie de l'information floutée, en particulier sur un texte imprimé à police régulière) : ce n'est pas une suppression fiable.
>
> **Bonne pratique :** recouvrir la zone concernée d'un aplat opaque qui remplace définitivement les pixels d'origine, jamais un flou ou un effet visuel réversible.

## Rétention : le texte extrait n'est pas le seul endroit où la donnée existe

Le principe déjà vu (une donnée personnelle peut être copiée à plusieurs endroits sans qu'un seul `DELETE` suffise, voir le [chapitre général](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) prend une dimension supplémentaire avec un document scanné : l'**image source** elle-même est une copie de la donnée, distincte du texte qui en a été extrait.

| Endroit où la donnée peut avoir été copiée | Suppression déclenchée par la suppression du texte extrait ? |
|---|---|
| Texte extrait, stocké en base | Oui, par définition |
| Image source du scan (stockage brut, avant ou après OCR) | Non : l'image reste intacte, avec la donnée toujours visible dedans |
| Journaux d'appel à un OCR tiers (voir la [dérive de version](/?c=ia&s=vision-et-ocr&p=ocr-en-production)) | Dépend uniquement des conditions contractuelles du fournisseur |
| Copies intermédiaires (zones découpées pour la relecture humaine, voir [OCR en production](/?c=ia&s=vision-et-ocr&p=ocr-en-production)) | Non, sauf si la procédure de suppression les couvre explicitement |

> **Piège :** répondre à une demande de droit à l'oubli en supprimant uniquement le texte extrait stocké en base, en laissant l'image source du scan intacte quelque part (un stockage de fichiers, une sauvegarde) : la donnée personnelle reste alors pleinement visible pour quiconque accède à cette image.
>
> **Bonne pratique :** faire porter la procédure de suppression sur l'image source autant que sur le texte extrait, en identifiant explicitement tous les endroits où l'image (pas seulement son texte) a pu être copiée ou archivée.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Les principes de gouvernance déjà vus pour un LLM (classification, traçabilité, rétention) s'appliquent à un document scanné, avec une différence de fond : une donnée personnelle dans une image doit être localisée puis masquée visuellement (aplat opaque), pas simplement remplacée comme une chaîne de texte. L'image source est une copie de la donnée distincte du texte extrait, et doit être couverte par toute procédure de suppression. |
| **Outils utilisables** | Une détection de zone pour localiser la donnée à masquer. Un aplat opaque appliqué directement aux pixels pour la recouvrir de façon non réversible. |
| **Pièges à éviter** | Classer un document selon le seul champ visé, en ignorant le reste de l'image. Flouter une zone sensible plutôt que la recouvrir d'un aplat opaque. Supprimer le texte extrait sans supprimer l'image source correspondante. |
| **Bonnes pratiques** | Classer un document selon tout ce que l'image contient réellement. Recouvrir une zone sensible d'un aplat opaque, jamais un flou réversible. Étendre toute procédure de suppression à l'image source, pas seulement au texte extrait. |
