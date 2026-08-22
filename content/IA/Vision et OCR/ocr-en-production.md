---
order: 7
---

# Mise en production et monitoring d'un pipeline OCR

Les chapitres précédents couvrent la reconnaissance elle-même (modèle, évaluation, correction). Celui-ci couvre ce qui change une fois ce pipeline déployé en continu, sur un flux réel de documents plutôt que sur un jeu de test fixe : les mêmes questions qu'un [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production), avec des réponses parfois différentes.

## Coût, latence, exposition des données : déjà traité, pas à répéter

L'arbitrage entre API hébergée et modèle auto-hébergé pour un pipeline OCR (coût par page, exposition de l'image complète à un tiers, tolérance à la latence en traitement par lot) est déjà détaillé dans [Arbitrage local vs cloud pour un modèle de vision](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) : ce chapitre ne le répète pas, il suppose ce choix déjà fait.

## La dérive silencieuse de version, version OCR

Le même risque déjà vu pour un LLM (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)) s'applique à un OCR fourni par un tiers : le fournisseur peut mettre à jour son modèle silencieusement, changeant le comportement de reconnaissance sur des documents identiques, sans qu'aucune ligne du pipeline n'ait changé.

> **Piège :** ne détecter cette dérive qu'après qu'elle a produit des erreurs visibles en aval (un montant mal extrait sur une facture réelle, par exemple), plutôt que de la surveiller directement.
>
> **Bonne pratique :** rejouer régulièrement le jeu de test annoté (voir le [golden set d'évaluation OCR](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr)) sur le pipeline en production, à intervalle régulier et à chaque changement annoncé côté fournisseur, pour détecter une dérive de version avant qu'elle n'affecte des documents réels.

## Monitorer un CER/WER en continu, pas seulement à l'entraînement

Le CER/WER (voir le [chapitre dédié](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr)) n'a pas vocation à être mesuré une seule fois avant la mise en production : suivi dans le temps sur le golden set, il détecte une dégradation avant qu'elle ne s'accumule silencieusement :

```text
CER sur le golden set, mesure chaque semaine :

Semaine 1 : 2,1%
Semaine 2 : 2,3%
Semaine 3 : 2,0%
Semaine 4 : 6,8%   <- pic soudain : alerte (changement de fournisseur ? nouveau format de document ?)
```

> **Piège :** ne suivre qu'un CER/WER global agrégé sur l'ensemble des documents traités, sans le ventiler par type de document ou par champ. Une dégradation qui ne touche qu'un seul type de document (un nouveau format de facture d'un fournisseur donné, par exemple) peut rester noyée dans une moyenne globale stable, exactement le même piège que le score global déjà signalé dans le chapitre sur l'évaluation.
>
> **Bonne pratique :** ventiler le suivi par type de document et par champ, pas seulement par une moyenne globale, pour repérer une dégradation localisée avant qu'elle ne s'étende.

## Router les cas incertains vers une relecture humaine

Le [score de confiance](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) déjà vu pour la détection de mise en page a un équivalent pour la reconnaissance de texte elle-même : la plupart des moteurs d'OCR renvoient, en plus du texte, un score de confiance par mot ou par caractère reconnu.

```text
Document traite
      │
      ▼
Score de confiance moyen du document
      │
      ├── au-dessus du seuil ──> traitement automatique, aucune intervention
      │
      └── sous le seuil ──> mis en file d'attente pour relecture humaine
```

> **Piège :** traiter tout document en dessous d'un certain seuil de confiance comme une erreur bloquante, sans alternative, ou au contraire l'accepter tel quel sans aucune vérification pour ne pas ralentir le pipeline.
>
> **Bonne pratique :** prévoir une file de relecture humaine pour les documents sous le seuil de confiance, plutôt qu'un choix binaire entre bloquer et accepter aveuglément : le pipeline reste largement automatisé, la relecture humaine ne portant que sur les cas réellement incertains.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le coût, la latence et l'exposition des données sont déjà traités dans l'arbitrage local/cloud ; ce chapitre ajoute ce qui est propre au fonctionnement continu : dérive de version silencieuse d'un OCR tiers, suivi du CER/WER dans le temps (ventilé par type de document et par champ), et routage des documents à faible confiance vers une relecture humaine plutôt qu'un traitement aveugle. |
| **Outils utilisables** | Un golden set rejoué régulièrement en production. Un tableau de suivi du CER/WER dans le temps, ventilé par type de document. Une file de relecture humaine pour les documents sous un seuil de confiance. |
| **Pièges à éviter** | Détecter une dérive de version seulement après des erreurs visibles en aval. Ne suivre qu'un CER/WER global sans ventilation. Traiter les documents à faible confiance de façon uniquement binaire (bloquer ou accepter aveuglément). |
| **Bonnes pratiques** | Rejouer le golden set à intervalle régulier et à chaque changement fournisseur. Ventiler le suivi par type de document et par champ. Router les documents à faible confiance vers une relecture humaine. |
