---
order: 10
---

# Attaquer (et défendre) un navigateur automatisé

[L'exploitation web côté attaquant](/?c=securite&s=securite-offensive&p=exploitation-web-cote-attaquant) regarde un attaquant qui cible VOTRE site. Ce chapitre inverse la perspective, pour un cas de plus en plus courant : votre propre code pilote un navigateur réel (Playwright, Selenium, Puppeteer) contre des pages que vous NE contrôlez PAS — un scraper qui visite des sites de partenaires, un outil qui automatise une tâche sur un site tiers. Cette fois, c'est VOTRE navigateur automatisé qui devient la cible.

## Un navigateur piloté reste un navigateur complet

La différence entre "lire une page" et "afficher une page dans un navigateur" compte plus qu'il n'y paraît : un script qui télécharge juste le HTML d'une page (une simple requête HTTP) ne risque rien de ce chapitre, il ne fait qu'obtenir du texte. Un navigateur PILOTÉ, lui, exécute réellement la page : JavaScript compris, comme un visiteur humain — avec les mêmes capacités qu'un navigateur normal, y compris celles dont votre script automatisé n'a jamais eu l'intention de se servir.

```text
Requete HTTP simple (pas de risque de ce chapitre) :
  Script --requete GET--> Serveur --renvoie le HTML brut--> Script (lit juste du texte)

Navigateur pilote (Playwright/Selenium/Puppeteer) :
  Script --controle--> Navigateur reel --charge ET EXECUTE la page-->
  la page peut declencher un telechargement, ouvrir une popup, lire le
  presse-papier, tenter d'exploiter le navigateur lui-meme -- exactement
  comme face a un vrai visiteur humain
```

## Ce qu'une page malveillante peut tenter contre le pilote automatique

| Vecteur | Ce qu'il exploite |
|---|---|
| Téléchargement auto-déclenché | Une page qui force un téléchargement de fichier sans action explicite ; si le navigateur piloté accepte silencieusement tout téléchargement (comportement par défaut souvent activé pour l'automatisation), le fichier atterrit sur le disque sans supervision humaine pour le remarquer |
| Détournement du presse-papier | L'API navigateur du presse-papier, accessible en JavaScript, permet à une page de lire ou modifier son contenu dans certaines conditions ; un script qui réutilise ensuite ce presse-papier ailleurs (copier-coller automatisé d'une donnée récupérée) hérite du contenu injecté |
| Popup/redirection intempestive | Une page qui ouvre une nouvelle fenêtre ou redirige agressivement peut perturber la logique du script pilote (qui suppose être resté sur la page attendue), voire l'amener à interagir par erreur avec une page différente de celle prévue |
| Fingerprinting du pilote automatique | Certaines pages détectent la présence d'un navigateur automatisé (propriétés JavaScript spécifiques à Playwright/Selenium) pour adapter leur comportement : afficher un contenu différent, ou déclencher une défense anti-bot ciblée |
| Injection dans les données extraites | Si le script fait ensuite confiance au texte extrait de la page (un titre, un prix) sans le traiter comme une donnée externe non fiable, un contenu piégé peut se propager plus loin dans le système qui reçoit ce résultat (voir le principe déjà posé dans [Les grandes familles de failles](/?c=securite&s=cybersecurite&p=types-de-failles)) |

## La distinction clé : "scraper des données" contre "exécuter une page"

Le réflexe défensif central tient en une phrase : un script d'automatisation n'a besoin que d'une petite partie de ce qu'un navigateur complet sait faire (charger une page, lire son contenu, cliquer des éléments prévus). Tout le reste (téléchargements, popups, permissions système, accès au presse-papier) doit être explicitement RESTREINT, jamais laissé aux réglages par défaut pensés pour un usage humain interactif.

| Réglage | Comportement par défaut | Restriction recommandée pour un pilote automatique |
|---|---|---|
| Téléchargements | Souvent acceptés silencieusement | Désactiver, ou rediriger vers un dossier isolé jamais exécuté automatiquement |
| Dialogues natifs (`alert`, `confirm`, popup) | Bloquent parfois le script en attente | Intercepter systématiquement (`page.on("dialog")` chez Playwright) pour les fermer automatiquement sans jamais les laisser s'accumuler ou influencer le script |
| Permissions navigateur (géolocalisation, notifications, presse-papier) | Variable selon le navigateur | Refuser toute permission par défaut, n'accorder que celles réellement nécessaires à la tâche |
| Confiance envers le texte extrait | Souvent traité comme une donnée déjà fiable une fois "juste extraite" | Traiter comme une donnée externe non fiable (échappement avant tout usage : affichage, requête, log) |

> **Piège :** considérer le scraping comme une opération sans risque parce qu'"on ne fait que lire des données publiques". Le navigateur qui exécute la page reste pleinement exposé à ce que cette page tente, indépendamment de l'intention du script qui le pilote.
>
> **Bonne pratique :** configurer explicitement le navigateur piloté avec le minimum de capacités nécessaires à la tâche (téléchargements désactivés, dialogues interceptés, permissions refusées par défaut), et traiter toute donnée extraite d'une page non maîtrisée comme externe et non fiable avant de la réutiliser ailleurs dans le système.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un navigateur piloté par un script (Playwright/Selenium/Puppeteer) exécute réellement les pages visitées, avec toutes les capacités d'un navigateur normal : une page malveillante peut tenter un téléchargement auto-déclenché, détourner le presse-papier, perturber le script via une popup, ou détecter l'automatisation elle-même. |
| **Outils utilisables** | Interception des dialogues natifs (`page.on("dialog")`) ; désactivation des téléchargements ou dossier isolé dédié ; refus des permissions navigateur par défaut. |
| **Pièges à éviter** | Laisser les réglages par défaut d'un navigateur pensé pour un usage humain sur un pilote automatique. Faire confiance à une donnée extraite d'une page non maîtrisée sans la traiter comme externe. |
| **Bonnes pratiques** | Restreindre explicitement le navigateur piloté au minimum nécessaire à la tâche. Intercepter systématiquement tout dialogue/téléchargement inattendu. Échapper toute donnée extraite avant réutilisation, comme n'importe quelle autre donnée externe. |
