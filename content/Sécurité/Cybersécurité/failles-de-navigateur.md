---
order: 14
---

# Failles côté navigateur

Certaines attaques n'exploitent aucune faille de code au sens classique (injection, contrôle d'accès) : elles détournent des comportements par défaut du navigateur lui-même, ou l'absence d'une instruction explicite que le serveur aurait dû lui donner. Ce chapitre couvre les plus courantes.

## Clickjacking : cliquer sur autre chose que ce qu'on voit

Un site attaquant peut charger VOTRE site dans une `iframe` invisible (opacité proche de zéro), superposée avec précision sur un faux bouton attrayant affiché par-dessus. La victime croit cliquer sur le faux bouton ; elle clique en réalité sur un vrai bouton de votre site, caché dessous.

```text
Page de l'attaquant (ce que voit la victime) :
  ┌─────────────────────────┐
  │   "Gagnez un cadeau !"  │   <- ce que la victime CROIT cliquer
  │      [ Cliquez ici ]    │
  └─────────────────────────┘

Réalité superposée (invisible) :
  ┌─────────────────────────┐
  │  iframe de votre site   │   <- ce qui reçoit VRAIMENT le clic
  │  [Confirmer virement]   │      (bouton sensible, positionné pile
  └─────────────────────────┘       sous le faux bouton visible)
```

| | |
|---|---|
| **Piège** | Ne rien indiquer au navigateur sur le droit ou non d'afficher votre site dans une `iframe` : par défaut, n'importe quel site peut le faire |
| **Bonne pratique** | Envoyer l'en-tête `Content-Security-Policy: frame-ancestors 'none'` (ou `'self'` si votre propre site a besoin de s'auto-encadrer) sur toute page qui déclenche une action sensible, pour que le navigateur refuse purement et simplement l'affichage en iframe ailleurs |

## Open redirect : une redirection détournée pour du phishing

Un paramètre de redirection (`?next=`, `?redirect=`, souvent utilisé pour "revenir à la page demandée après connexion") qui accepte n'importe quelle URL externe transforme votre propre domaine, normalement digne de confiance, en tremplin vers un site de phishing.

```text
Lien envoyé par l'attaquant, avec le VRAI domaine du site de confiance :
  https://site-de-confiance.example/login?next=https://site-pirate.example/faux-formulaire

La victime voit "site-de-confiance.example" dans son navigateur (rassurant),
clique, se connecte normalement... puis est redirigée vers le site pirate
juste après, sur un domaine qu'elle ne regarde plus à ce moment-là
```

> **Piège :** valider le paramètre de redirection en vérifiant seulement qu'il RESSEMBLE à une URL (présence de `http`), sans vérifier son domaine.
>
> **Bonne pratique :** n'accepter qu'un chemin relatif interne au site (`/profil`, jamais une URL complète) pour ce type de paramètre, ou vérifier explicitement le domaine contre une liste blanche si une redirection externe est réellement nécessaire.

## Reverse tabnabbing : la page ouverte qui reprend le contrôle de l'onglet d'origine

Un lien `target="_blank"` (ouverture dans un nouvel onglet) donne par défaut à la page ouverte un accès à `window.opener`, une référence vers l'onglet d'ORIGINE. Une page malveillante ouverte ainsi peut alors rediriger silencieusement cet onglet d'origine (resté ouvert derrière, hors du champ de vision immédiat de la victime) vers une fausse page de connexion.

```javascript
// Dans la page ouverte en target="_blank", sans défense du site d'origine :
window.opener.location = "https://site-pirate.example/fausse-page-login";
// L'onglet D'ORIGINE (celui que la victime croit toujours être le vrai site)
// se retrouve redirigé, sans que la victime n'ait rien cliqué dedans
```

> **Piège :** utiliser `target="_blank"` sur un lien vers un contenu externe (généré par un utilisateur, ou vers un site tiers) sans restreindre cet accès.
>
> **Bonne pratique :** ajouter systématiquement `rel="noopener noreferrer"` à tout `target="_blank"`, surtout quand l'URL provient d'une donnée externe. `noopener` coupe l'accès à `window.opener` ; `noreferrer` empêche en plus le site ouvert de savoir d'où vient le clic.

## HTTP Parameter Pollution : le même paramètre envoyé deux fois

Rien n'empêche une requête HTTP de porter deux fois le même nom de paramètre (`?id=1&id=2`). Le problème : chaque couche qui traite cette requête (serveur web, framework, code applicatif) peut choisir une convention DIFFÉRENTE pour résoudre ce doublon (garder le premier, garder le dernier, les fusionner en tableau), sans que ce soit forcément documenté ni cohérent entre elles.

| Couche | Comportement possible face à `?id=1&id=2` |
|---|---|
| Une couche de validation | Ne regarde que le PREMIER `id` (`1`), le juge valide |
| Le code métier qui traite réellement la requête | Utilise le DERNIER `id` (`2`) |

Si l'attaquant connaît cette divergence, il peut faire valider un paramètre inoffensif par la couche de contrôle tout en faisant AGIR le code métier sur un second paramètre jamais vérifié.

> **Bonne pratique :** ne jamais présumer qu'un paramètre n'apparaît qu'une fois dans une requête ; vérifier explicitement, dans le framework utilisé, quelle convention s'applique en cas de doublon, et s'assurer que la couche de validation et la couche d'exécution utilisent la MÊME valeur.

## En-têtes de sécurité manquants

Plusieurs en-têtes de réponse HTTP, absents par défaut, indiquent explicitement au navigateur comment se comporter défensivement face à cette page. [CORS](/?c=securite&s=cybersecurite&p=securite-api-web) est déjà couvert séparément ; voici les autres :

| En-tête | Ce qu'il empêche |
|---|---|
| `Content-Security-Policy: frame-ancestors` | Le clickjacking (vu plus haut) |
| `X-Content-Type-Options: nosniff` | Le navigateur devine (*sniffe*) parfois le type d'un fichier servi plutôt que de faire confiance au `Content-Type` déclaré ; un fichier uploadé par un utilisateur et deviné comme HTML/JS exécutable au lieu du type inoffensif déclaré peut alors s'exécuter |
| `Strict-Transport-Security` | Le navigateur force toute connexion future vers ce domaine en HTTPS, même si un lien pointe explicitement vers du HTTP |
| `Referrer-Policy: strict-origin-when-cross-origin` (ou `no-referrer`) | La fuite de l'adresse de la page dans l'en-tête `Referer` envoyé aux autres sites : avec cette valeur, un autre site ne reçoit que le nom de domaine, jamais le chemin ni les paramètres |

> **Bonne pratique :** poser ces en-têtes au niveau du serveur web ou du framework pour l'ensemble du site, plutôt qu'au cas par cas sur chaque route.

> **Piège :** même avec cette politique (appliquée par défaut par les navigateurs récents, mais pas par les anciens), une donnée sensible placée dans l'adresse (`?email=...`, `?token=...`) reste visible dans l'historique du navigateur, les journaux du serveur et le `Referer` envoyé aux ressources du même site : c'est la faiblesse [CWE-598](https://cwe.mitre.org/data/definitions/598.html). Une donnée sensible s'envoie dans le corps d'une requête `POST`, jamais dans l'URL.

## Formulaires sur un appareil partagé : `autocomplete="off"`

Un navigateur mémorise ce qu'on tape dans les champs d'un formulaire et le propose à nouveau à la saisie suivante (nom, téléphone, e-mail...). Sur un poste personnel, c'est pratique ; sur un **appareil partagé** (borne en libre-service, kiosque, poste d'accueil), l'utilisateur suivant voit les données personnelles du précédent.

```html
<input type="email" name="email" autocomplete="off">   <!-- aucune suggestion mémorisée -->
```

| Situation | Réglage |
|---|---|
| Poste personnel | Laisser l'autocomplétion : elle aide l'utilisateur |
| Borne ou appareil partagé | `autocomplete="off"` sur chaque champ de données personnelles, et effacer les données du navigateur entre deux sessions (le plus sûr : un profil de navigation privée relancé à chaque utilisateur) |

> **Piège :** les navigateurs peuvent ignorer `autocomplete="off"` sur les champs de connexion (identifiant, mot de passe), pour laisser fonctionner leur gestionnaire de mots de passe. Sur une borne, ne jamais compter sur ce seul attribut.

## Stockage client d'un token : `localStorage` contre cookie `HttpOnly`

[Sessions et cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) explique pourquoi un cookie `HttpOnly` protège l'identifiant de session d'une lecture par JavaScript. Une application qui gère elle-même un token (JWT, clé d'API côté client) a le choix de l'endroit où le stocker côté navigateur, avec des propriétés opposées :

| | Cookie `HttpOnly` | `localStorage`/`sessionStorage` |
|---|---|---|
| Lisible par un script JavaScript de la page | Non | Oui |
| Volable via une faille [XSS](/?c=securite&s=cybersecurite&p=xss-en-detail) ailleurs sur le site | Non (le cookie reste invisible au script injecté) | Oui (`localStorage.getItem(...)` suffit) |
| Envoyé automatiquement à chaque requête vers le domaine | Oui | Non (à ajouter manuellement à chaque appel) |
| Pratique pour une API appelée depuis un domaine différent | Plus complexe (contraintes cross-domain sur les cookies) | Plus simple |

> **Piège :** stocker un token sensible en `localStorage` par simplicité d'implémentation, sans avoir mesuré qu'une seule faille XSS ailleurs sur le site suffit alors à le voler intégralement.
>
> **Bonne pratique :** privilégier un cookie `HttpOnly` pour tout token dont le vol aurait un impact significatif, et réserver `localStorage` aux données dont l'exposition ne pose pas de risque réel même en cas de XSS.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Plusieurs attaques exploitent des comportements par défaut du navigateur plutôt qu'une faille de code : affichage en iframe non restreint (clickjacking), redirection vers un domaine externe non vérifié (open redirect), accès à `window.opener` depuis un `target="_blank"` (reverse tabnabbing), traitement incohérent d'un paramètre dupliqué (HPP), en-têtes de sécurité absents, ou choix du stockage client d'un token. |
| **Outils utilisables** | `Content-Security-Policy: frame-ancestors`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `rel="noopener noreferrer"`, `autocomplete="off"` sur un appareil partagé. |
| **Pièges à éviter** | Ne pas restreindre l'affichage en iframe. Accepter une URL complète arbitraire comme cible de redirection. `target="_blank"` sans `rel="noopener noreferrer"`. Présumer qu'un paramètre HTTP n'apparaît qu'une fois. Stocker un token sensible en `localStorage` sans en mesurer le risque XSS. |
| **Bonnes pratiques** | Poser les en-têtes de sécurité pertinents pour tout le site. N'accepter qu'un chemin relatif interne pour une redirection post-connexion. Systématiser `rel="noopener noreferrer"`. Vérifier la convention du framework face à un paramètre dupliqué. Préférer un cookie `HttpOnly` pour un token sensible. |
