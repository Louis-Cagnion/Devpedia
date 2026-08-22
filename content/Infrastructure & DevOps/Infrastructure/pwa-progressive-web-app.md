---
order: 8
---

# La PWA : un site web qui se comporte comme une application

Une **PWA** (*Progressive Web App*) est un site web classique auquel deux mécanismes ajoutent des capacités jusque-là réservées aux applications natives : continuer à fonctionner sans connexion internet, et s'installer sur l'appareil comme une vraie application, sans passer par un store.

## Le service worker : un script qui tourne entre le site et le réseau

Un **service worker** est un script JavaScript que le navigateur exécute en arrière-plan, séparément de la page elle-même, capable d'intercepter chaque requête réseau que le site émet avant qu'elle n'atteigne réellement internet :

```text
Sans service worker :              Avec service worker :

Page -> requete -> reseau          Page -> requete -> service worker
                                                          |
                                              en cache ? -+- oui -> reponse immediate, sans reseau
                                                          |
                                                          +- non -> reseau, puis mise en cache
```

Cette position d'intermédiaire permet de servir une ressource déjà mise en cache même quand le réseau est indisponible, ce qu'un site classique ne peut pas faire : sans requête réseau réussie, il n'a tout simplement rien à afficher.

> **Piège :** confondre le service worker avec le thread principal de la page. Un service worker s'exécute dans son propre contexte, sans accès direct au DOM ; il communique avec la page via des messages, pas en manipulant ses éléments directement.
>
> **Bonne pratique :** garder le service worker concentré sur l'interception réseau et le cache ; toute logique qui touche à l'affichage reste dans le code de la page elle-même.

## Stratégies de cache : que servir, et quand vérifier le réseau

| Stratégie | Principe | Adaptée à |
|---|---|---|
| **Cache d'abord** (*cache-first*) | Sert la version en cache si elle existe, ne va sur le réseau que si rien n'est en cache | Ressources qui changent rarement (logo, police, CSS versionné) |
| **Réseau d'abord** (*network-first*) | Tente le réseau en premier, ne retombe sur le cache qu'en cas d'échec | Contenu qui doit rester à jour tant que le réseau répond |
| **Périmé pendant le rafraîchissement** (*stale-while-revalidate*) | Sert immédiatement la version en cache, tout en la rafraîchissant en arrière-plan pour la prochaine visite | Contenu qui tolère une légère péremption, déjà vu dans [bases de données à fort trafic](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) pour le même compromis côté serveur |

Aucune de ces stratégies n'est universellement la bonne : le choix dépend de la fréquence de changement réelle de chaque ressource, pas d'une préférence unique appliquée à tout le site.

## Le manifest : ce qui rend un site installable

Un fichier **manifest** (`manifest.json`), lié depuis la page HTML, déclare les informations qu'un navigateur ou un système d'exploitation utilise pour proposer d'installer le site comme une application : son nom, une icône dans plusieurs tailles, une couleur de thème, et un mode d'affichage (`standalone` masque la barre d'adresse du navigateur, pour ressembler à une application native).

```json
{
  "name": "Mon application",
  "short_name": "MonApp",
  "icons": [{ "src": "icone-512.png", "sizes": "512x512", "type": "image/png" }],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e293b"
}
```

Sans manifest valide (icônes présentes, `start_url` correcte), le navigateur ne propose jamais l'installation, même si un service worker fonctionne déjà.

## Ce que la PWA ne remplace pas

Une PWA reste un site web : elle n'a pas accès à l'intégralité des API qu'une application native peut utiliser (certains capteurs, une intégration système poussée), et son installation dépend du navigateur et du système d'exploitation de l'utilisateur plutôt que d'un store centralisé. Elle convient pour étendre un site existant, pas pour tout ce qui exigerait déjà une application native aujourd'hui.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une PWA ajoute à un site web le fonctionnement hors ligne (service worker interceptant les requêtes réseau, cache) et l'installabilité (manifest déclarant nom, icônes, mode d'affichage). Le choix de la stratégie de cache dépend de la fréquence de changement réelle de chaque ressource. |
| **Outils utilisables** | Un service worker pour intercepter les requêtes et servir depuis le cache ; un `manifest.json` pour rendre le site installable. |
| **Pièges à éviter** | Confondre le service worker avec le thread principal de la page (pas d'accès direct au DOM). Un manifest incomplet qui empêche l'installation sans erreur visible. |
| **Bonnes pratiques** | Choisir la stratégie de cache par ressource plutôt qu'un choix unique pour tout le site. Garder le service worker concentré sur le réseau et le cache. |
