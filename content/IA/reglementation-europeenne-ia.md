---
order: 11
---

# Réglementation européenne de l'IA : l'AI Act

Le **règlement européen sur l'intelligence artificielle** (*AI Act*, règlement (UE) 2024/1689) est le premier cadre juridique horizontal au monde consacré à l'IA : plutôt que de réguler secteur par secteur, il impose des obligations selon le **niveau de risque** d'un système IA, quel que soit son domaine d'application. Publié au Journal officiel le 12 juillet 2024, il est entré en vigueur le 1er août 2024 — mais son application est **échelonnée sur plusieurs années**, pas immédiate.

## Une classification par niveau de risque

| Niveau de risque | Exemples | Obligation |
|---|---|---|
| **Inacceptable** | Notation sociale par un État, manipulation subliminale, reconnaissance faciale de masse en temps réel dans l'espace public (avec exceptions limitées pour les forces de l'ordre) | Interdit purement et simplement |
| **Élevé** | Recrutement, scoring de crédit, systèmes critiques (énergie, transport), dispositifs médicaux, justice | Évaluation de conformité, documentation technique, supervision humaine, gestion des risques, traçabilité |
| **Limité** | Chatbot, générateur de deepfake | Obligation de transparence (informer l'utilisateur qu'il interagit avec une IA, signaler un contenu généré) |
| **Minimal** | Filtre anti-spam, IA d'un jeu vidéo | Aucune obligation spécifique |

Un chatbot (voir [Construire un chatbot](/?c=ia&p=chatbot)) tombe typiquement dans la catégorie "risque limité" : son obligation principale est de ne jamais laisser l'utilisateur croire qu'il parle à un humain sans le préciser.

## Le calendrier d'application

Contrairement à un règlement qui s'appliquerait d'un bloc, l'AI Act entre en vigueur **par étapes**, chacune ajoutant de nouvelles obligations :

| Date | Ce qui devient applicable |
|---|---|
| **1er août 2024** | Entrée en vigueur du règlement (le texte existe juridiquement, mais la plupart des obligations ne sont pas encore exigibles) |
| **2 février 2025** | Interdiction des pratiques à risque inacceptable ; obligation de culture IA (former le personnel qui conçoit ou utilise des systèmes IA) |
| **2 août 2025** | Obligations pour les modèles d'IA à usage général (GPAI, voir plus bas) ; mise en place des autorités de contrôle nationales et du Bureau européen de l'IA ; régime de sanctions applicable |
| **2 août 2026** | Application de l'essentiel du règlement : obligations pour les systèmes à risque élevé (annexe III), obligations de transparence pour le risque limité (chatbots, deepfakes) |
| **2 août 2027** | Délai supplémentaire pour les systèmes à risque élevé qui sont des composants de sécurité de produits déjà réglementés (dispositifs médicaux, machines, jouets...) |

> **Une tension concrète, encore ouverte à l'heure actuelle :** les obligations pour les systèmes à risque élevé sont légalement exigibles depuis août 2026, mais les **normes techniques harmonisées** censées préciser comment s'y conformer concrètement (élaborées par les organismes de normalisation CEN-CENELEC, groupe JTC 21) sont encore en cours de finalisation. Une entreprise peut donc se retrouver à devoir respecter une obligation légale avant que le mode d'emploi technique officiel n'existe pleinement — une situation à surveiller plutôt qu'un simple détail administratif.

## Les modèles d'IA à usage général (GPAI)

Un grand modèle de langage (voir [NLP et LLM](/?c=ia&p=nlp-et-llm)) n'est pas conçu pour un usage unique — il sert de base à des usages très variés. L'AI Act crée pour cette catégorie ("*General-Purpose AI*", GPAI) des obligations spécifiques, applicables depuis le 2 août 2025 :

- Documentation technique sur l'entraînement et les capacités du modèle, tenue à disposition des autorités.
- Respect du droit d'auteur sur les données d'entraînement (une politique de conformité doit exister).
- Transparence sur le contenu utilisé pour l'entraînement (un résumé suffisamment détaillé, sans exiger la divulgation complète des données).

Les modèles jugés à **risque systémique** (au-delà d'un seuil de puissance de calcul d'entraînement) portent des obligations renforcées : évaluation contradictoire (*red teaming*), reporting des incidents graves, cybersécurité renforcée. Un **Code de bonnes pratiques** volontaire pour les fournisseurs de GPAI a été publié en 2025 pour aider à anticiper ces obligations avant que la supervision réglementaire ne monte en puissance.

## Supervision humaine : une obligation, pas une option

Pour un système à risque élevé, l'AI Act impose une supervision humaine effective — rejoignant directement un principe déjà vu pour les [agents](/?c=ia&p=agents) : un système autonome ne doit jamais pouvoir décider seul d'une action à conséquence réelle sans qu'un humain puisse intervenir ou l'arrêter. Ce que le bon sens technique recommandait déjà devient, pour les cas à risque élevé, une obligation légale documentée.

## Ce que ça change par rapport au RGPD

L'AI Act ne remplace **pas** le RGPD — il s'y ajoute. La [gouvernance des données](/?c=ia&p=gouvernance-des-donnees) (classification, traçabilité, contrôle d'accès) reste nécessaire indépendamment de l'AI Act : le RGPD encadre la donnée personnelle elle-même, l'AI Act encadre le **système IA** qui la traite — ses deux ensembles d'obligations se cumulent plutôt que de se substituer l'un à l'autre.

## Sanctions

Les amendes sont échelonnées selon la gravité de l'infraction, jusqu'à 35 millions d'euros ou 7 % du chiffre d'affaires mondial annuel pour une pratique interdite (le plafond le plus élevé des deux) — un niveau comparable, volontairement, à celui du RGPD.
