---
order: 7
---

# Choisir un fournisseur et mettre en production

L'arbitrage entre modèle auto-hébergé et API cloud (coût, exposition des données, latence) est déjà détaillé dans [Arbitrage local vs cloud pour un modèle de vision](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) ; ce chapitre l'applique à la synthèse vocale, où deux critères prennent un poids particulier : la latence temps réel et une contrainte parfois négligée, l'infrastructure disponible.

## Trois familles de solutions

| | Web Speech API (navigateur) | Auto-hébergé (ex. [Piper](https://github.com/OHF-Voice/piper1-gpl)) | API cloud (ex. [ElevenLabs](https://elevenlabs.io)) |
|---|---|---|
| Coût d'usage | Aucun (délègue aux voix déjà installées sur l'appareil de l'utilisateur) | Coût du serveur qui exécute le modèle, indépendant du volume | Facturé au caractère ou à la minute générée |
| Qualité de voix | Variable selon le système de l'utilisateur, hors du contrôle du développeur | Contrôlée, dépend du modèle choisi | Généralement la plus élevée, y compris le clonage de voix |
| Infrastructure requise | Aucune (le calcul a lieu dans le navigateur de l'utilisateur) | Un serveur (avec ou sans GPU selon le modèle) | Aucune côté développeur |
| Fonctionne hors ligne | Oui, une fois les voix système installées | Oui | Non, nécessite une connexion réseau |

## Un cas concret : le choix fait pour Devpedia lui-même

La [lecture audio automatique de Devpedia](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) illustre concrètement ce choix. Devpedia est un site **100% statique** (hébergé sur GitHub Pages, sans serveur ni étape de build) : héberger un modèle comme Piper aurait exigé un serveur d'inférence, incompatible avec cet hébergement ; une API cloud aurait introduit un coût par utilisation, pour un site consulté librement sans modèle économique. La **Web Speech API** a été retenue précisément parce qu'elle ne nécessite ni serveur ni coût d'usage : le calcul a lieu entièrement dans le navigateur de chaque visiteur.

> **Piège :** choisir un auto-hébergement ou une API cloud "par défaut", parce que la qualité de voix y est supérieure, sans vérifier au préalable si l'infrastructure du projet permet réellement d'héberger un serveur d'inférence, ou si le modèle économique du projet supporte un coût récurrent par utilisation.
>
> **Bonne pratique :** partir des contraintes réelles du projet (infrastructure disponible, modèle économique) avant de comparer les options sur la seule qualité de voix, exactement la même démarche que pour choisir entre local et cloud pour un modèle de vision.

## La latence temps réel, un critère à part

Pour un usage interactif (un assistant vocal, une traduction en direct), le [délai avant le premier son audible](/?c=ia&s=voix-ia&p=evaluer-synthese-vocale) prime sur la qualité perçue :

| | Web Speech API | Auto-hébergé | API cloud |
|---|---|---|---|
| Délai avant le premier son | Très faible (calcul local, pas d'aller-retour réseau) | Faible si le serveur est proche géographiquement de l'utilisateur | Variable, dépend du réseau et de la charge du fournisseur |

> **Piège :** ignorer la latence réseau d'une API cloud pour un usage temps réel, en se basant uniquement sur des tests effectués depuis une connexion rapide et proche du serveur du fournisseur.
>
> **Bonne pratique :** mesurer la latence réelle depuis les conditions réseau représentatives des utilisateurs visés, pas uniquement depuis l'environnement de développement.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Trois familles de solutions existent : la Web Speech API (aucun coût ni infrastructure, qualité hors du contrôle du développeur), l'auto-hébergement (qualité contrôlée, coût d'infrastructure fixe), l'API cloud (qualité la plus élevée, coût variable à l'usage, nécessite une connexion réseau). Le choix doit partir des contraintes réelles du projet (infrastructure, modèle économique), pas de la seule qualité de voix. |
| **Outils utilisables** | La Web Speech API pour un site statique sans coût d'usage. Piper pour un auto-hébergement léger. ElevenLabs pour une API cloud de haute qualité, y compris le clonage de voix. |
| **Pièges à éviter** | Choisir une option par défaut sans vérifier les contraintes d'infrastructure et de modèle économique réelles. Mesurer la latence d'une API cloud uniquement dans des conditions réseau favorables. |
| **Bonnes pratiques** | Partir des contraintes réelles du projet avant de comparer les options. Mesurer la latence dans des conditions réseau représentatives des utilisateurs visés. |
