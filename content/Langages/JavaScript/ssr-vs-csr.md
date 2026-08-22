---
order: 14
---

# SSR vs CSR : où le HTML est-il construit ?

Le [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements) d'une page peut être construit à deux endroits fondamentalement différents : sur le **serveur**, avant d'envoyer la réponse ([SSR](https://developer.mozilla.org/fr/docs/Glossary/SSR), *Server-Side Rendering*), ou dans le **navigateur**, par du JavaScript exécuté après réception d'une page minimale ([CSR](https://developer.mozilla.org/fr/docs/Glossary/CSR), *Client-Side Rendering*). Le choix change radicalement ce que le navigateur reçoit en premier, et ce qu'un moteur de recherche voit en visitant la page.

## CSR : le serveur envoie une coquille vide

Avec le CSR, typique d'une application monopage (SPA), le serveur répond avec un [HTML](/?c=infrastructure&p=api-et-http) quasiment vide et un script JavaScript volumineux ; c'est ce script, une fois téléchargé et exécuté, qui construit tout le contenu de la page dans le [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements) :

```text
Serveur -> <html><body><div id="app"></div><script src="app.js"></script></body></html>

Navigateur :
1. Recoit le HTML quasi vide -> rien d'affiche
2. Telecharge et execute app.js
3. app.js construit le contenu dans le DOM, souvent apres avoir appele une API
4. La page devient visible et interactive
```

Le contenu réel n'apparaît qu'après le téléchargement **et** l'exécution du JavaScript, un délai qui dépend directement de la taille du script et de la puissance de l'appareil qui l'exécute.

## SSR : le serveur envoie déjà le HTML rempli

Avec le SSR, le serveur exécute lui-même le code de rendu à chaque requête (ou à la construction du site, selon l'implémentation), et renvoie un [HTML](/?c=infrastructure&p=api-et-http) déjà rempli de contenu :

```text
Serveur -> execute le rendu -> <html><body><h1>Bienvenue Alice</h1>...</body></html>

Navigateur :
1. Recoit un HTML deja complet -> affichage immediat du contenu
2. Telecharge et execute le JavaScript restant (hydratation, voir plus bas)
3. La page devient interactive
```

Le contenu s'affiche dès la réception de la réponse, avant même que le JavaScript n'ait fini de se charger.

## Comparaison

| | CSR | SSR |
|---|---|---|
| Premier affichage du contenu | Après téléchargement + exécution du JS | Immédiat, dans le HTML reçu |
| Charge sur le serveur | Faible (sert des fichiers statiques + une API) | Plus élevée (exécute le rendu à chaque requête, ou à la construction) |
| Référencement (SEO) | Un robot d'indexation qui n'exécute pas de JS ne voit qu'une page vide | Le contenu est directement présent dans le HTML reçu |
| Interactivité une fois chargé | Identique | Identique, après hydratation |

## L'hydratation : reconnecter le JavaScript à un HTML déjà là

Après un rendu SSR, la page affichée n'est encore que du [HTML](/?c=infrastructure&p=api-et-http) statique : aucun gestionnaire d'événement n'est encore attaché. L'**hydratation** est l'étape où le JavaScript s'exécute pour reconnecter ce HTML existant aux [événements](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements) qui le rendent interactif, sans reconstruire le contenu déjà affiché.

> **Piège :** un rendu SSR qui produit un HTML légèrement différent de ce que le JavaScript produirait en le reconstruisant lui-même (une date formatée différemment selon le fuseau horaire du serveur, une donnée qui a changé entre le rendu serveur et l'hydratation côté client). Le framework détecte l'écart et peut soit l'ignorer silencieusement, soit rejeter tout le rendu serveur pour reconstruire la page entièrement côté client, perdant l'essentiel du bénéfice du SSR.
>
> **Bonne pratique :** s'assurer que le rendu produit exactement le même résultat côté serveur et côté client, à partir des mêmes données ; injecter explicitement dans la page les données utilisées pour le rendu serveur, pour que le JavaScript d'hydratation les réutilise telles quelles plutôt que de les recalculer différemment.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le CSR construit le contenu dans le navigateur après exécution du JavaScript (premier affichage retardé, charge serveur faible) ; le SSR construit le HTML côté serveur avant l'envoi (affichage immédiat, meilleur référencement, charge serveur plus élevée). L'hydratation reconnecte le JavaScript à un HTML SSR déjà affiché, sans le reconstruire. |
| **Outils utilisables** | Les frameworks avec rendu SSR intégré (Next.js, Nuxt et équivalents) pour combiner affichage immédiat et interactivité une fois hydraté. |
| **Pièges à éviter** | Un rendu serveur qui produit un résultat différent du rendu client lors de l'hydratation, forçant une reconstruction complète côté client. |
| **Bonnes pratiques** | Garantir un rendu identique entre serveur et client à partir des mêmes données ; transmettre explicitement ces données au client plutôt que de les recalculer pendant l'hydratation. |
