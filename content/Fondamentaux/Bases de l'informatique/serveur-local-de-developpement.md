---
order: 8
---

# Le serveur local : tester une page web sans la mettre en ligne

Ouvrir un fichier `index.html` directement dans le navigateur (double-clic, ou une adresse qui commence par `file://`) fonctionne pour une page très simple. Dès qu'elle charge d'autres fichiers (`fetch`, modules JavaScript, certaines polices), le navigateur bloque silencieusement ces chargements : il manque un **serveur local**, un programme qui sert les fichiers du projet comme le ferait un vrai site en ligne, mais depuis sa propre machine.

## Pourquoi `file://` ne suffit pas

Un navigateur applique des règles de sécurité différentes selon que la page vient d'une adresse `http://`/`https://` (un vrai serveur) ou de `file://` (un fichier local). Plusieurs fonctionnalités courantes sont bridées ou désactivées en `file://` :

| Besoin de la page | En `file://` | Avec un serveur local |
|---|---|---|
| Charger un autre fichier avec `fetch` | Bloqué (erreur CORS) | Fonctionne |
| Charger un module JavaScript (`<script type="module">`) | Bloqué dans la plupart des navigateurs | Fonctionne |
| Recharger la page à chaque modification (live reload) | Impossible | Possible (selon l'outil) |

> **Piège :** voir une erreur `CORS` ou `Failed to fetch` dans la console et chercher le problème dans son propre code. La cause la plus fréquente est simplement l'absence de serveur local : la page est ouverte en `file://`.
>
> **Bonne pratique :** dès qu'une page charge un autre fichier (JSON, module JS...), la tester depuis un serveur local plutôt que directement en double-cliquant dessus.

## Serveur local, serveur de production : même rôle, portée différente

Un serveur local répond aux mêmes types de requêtes qu'un serveur de production (voir [API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) pour le détail du dialogue requête/réponse) : recevoir une adresse, renvoyer le fichier demandé. La différence tient à qui peut y accéder.

```text
Serveur local (localhost)          Serveur de production
      │                                    │
Répond uniquement à cette          Répond à n'importe qui sur
machine (127.0.0.1)                Internet, avec un vrai domaine
      │                                    │
Sert de brouillon pendant   →      Reçoit le résultat fini,
le développement                   une fois prêt
```

> **Piège :** croire qu'un site "tourne" une fois lancé en local, et négliger l'étape de déploiement. `localhost` n'est joignable que depuis la machine qui l'exécute : personne d'autre n'y a accès tant que le site n'est pas déployé sur un vrai serveur.

## Lancer un serveur local

Plusieurs outils rendent le même service ; le choix dépend surtout de ce qui est déjà installé.

| Outil | Commande | Prérequis |
|---|---|---|
| Python (déjà présent sur macOS/Linux) | `python3 -m http.server 8000` | Python installé |
| Node.js | `npx serve` | Node.js installé |
| PHP | `php -S localhost:8000` | PHP installé |
| Live Server (extension VS Code) | Clic droit sur `index.html` → "Open with Live Server" | VS Code |

Une fois lancé, le terminal affiche une adresse (souvent `http://localhost:8000` ou `http://127.0.0.1:5500`) à ouvrir dans le navigateur.

> **Approfondir :** `localhost` et `127.0.0.1` désignent tous les deux "cette machine elle-même" ; le numéro après `:` (le **port**) distingue plusieurs serveurs qui tourneraient en même temps sur la même machine.

## Rechargement automatique ou manuel

Certains outils (Live Server) rechargent la page automatiquement à chaque fichier modifié et enregistré ; d'autres (`http.server`, `php -S`) ne le font jamais, il faut recharger soi-même (`F5`).

> **Piège :** un rechargement automatique en plein milieu d'un test qui dépend du temps (une animation, une lecture audio, une connexion en cours) l'interrompt sans prévenir, faussant le test.
>
> **Bonne pratique :** pour un test sensible au temps, préférer un outil sans rechargement automatique (`http.server`, `php -S`) : la page ne bouge que lorsqu'on la recharge soi-même, au moment choisi.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un fichier ouvert en `file://` n'a pas accès à `fetch`, aux modules JS, ni au rechargement automatique : un **serveur local** lève ces restrictions en servant les fichiers comme le ferait un vrai serveur, mais accessible uniquement depuis sa propre machine (`localhost`). |
| **Outils utilisables** | `python3 -m http.server`, `npx serve`, `php -S`, l'extension Live Server de VS Code. |
| **Pièges à éviter** | Chercher un bug de code face à une erreur CORS/`Failed to fetch` alors que la page tourne en `file://`. Utiliser un outil à rechargement automatique pour un test sensible au temps (audio, animation) : le rechargement peut l'interrompre en plein milieu. |
| **Bonnes pratiques** | Toujours tester depuis un serveur local dès que la page charge un autre fichier. Choisir un outil sans rechargement automatique pour un test sensible au temps. |
