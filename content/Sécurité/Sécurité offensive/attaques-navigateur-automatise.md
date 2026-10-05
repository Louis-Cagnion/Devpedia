---
order: 10
---

# Attaquer (et défendre) un navigateur automatisé

[L'exploitation web côté attaquant](/?c=securite&s=securite-offensive&p=exploitation-web-cote-attaquant) regarde un attaquant qui cible VOTRE site. Ce chapitre inverse la perspective, pour un cas de plus en plus courant : votre propre code pilote un navigateur réel (Playwright, Selenium, Puppeteer) contre des pages que vous NE contrôlez PAS : un scraper qui visite des sites de partenaires, un outil qui automatise une tâche sur un site tiers. Cette fois, c'est VOTRE navigateur automatisé qui devient la cible.

## Un navigateur piloté reste un navigateur complet

La différence entre "lire une page" et "afficher une page dans un navigateur" compte plus qu'il n'y paraît : un script qui télécharge juste le HTML d'une page (une simple requête HTTP) ne risque rien de ce chapitre, il ne fait qu'obtenir du texte. Un navigateur PILOTÉ, lui, exécute réellement la page : JavaScript compris, comme un visiteur humain, avec les mêmes capacités qu'un navigateur normal, y compris celles dont votre script automatisé n'a jamais eu l'intention de se servir.

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

## Le signal concret que les anti-bots lisent : `navigator.webdriver`

Le protocole WebDriver, utilisé par Playwright, Selenium et les outils similaires pour piloter un navigateur, expose par défaut une propriété JavaScript lisible par n'importe quelle page :

```javascript
navigator.webdriver   // true si pilote via WebDriver, false/undefined sinon
```

N'importe quel script de la page, donc n'importe quel système anti-bot, peut lire cette propriété pour distinguer un visiteur humain d'un script, sans avoir besoin d'analyser un comportement plus subtil. La contre-mesure consiste à redéfinir cette propriété avant tout autre script de la page :

```javascript
Object.defineProperty(navigator, "webdriver", { get: () => undefined });
```

Injectée au tout début du chargement de chaque page (`context.add_init_script(...)` chez Playwright), cette redéfinition masque le signal le plus direct, sans rien changer au reste du comportement du navigateur.

> **Piège :** masquer `navigator.webdriver` ne rend pas un navigateur piloté indétectable pour autant : les systèmes anti-bot avancés combinent des dizaines de signaux (cadence des clics, résolution d'écran, polices installées...), pas seulement cette propriété. La traiter comme la seule à corriger donne un faux sentiment de sécurité.

## Mode headless ou fenêtre réelle

Un navigateur **headless** (« sans tête ») s'exécute sans afficher de fenêtre : c'est le mode le plus courant pour un script, car il ne demande ni écran ni session ouverte. Mais un navigateur sans fenêtre ne se présente pas exactement comme un navigateur normal : certaines versions annoncent « HeadlessChrome » dans leur identifiant (*User-Agent*) ou n'exposent pas les mêmes fonctionnalités. Les systèmes anti-bot s'en servent pour décider d'afficher une vérification supplémentaire (voir [le fingerprinting](/?c=securite&s=cybersecurite&p=fingerprinting-navigateur-et-appareil)).

| | Headless | Fenêtre réelle |
|---|---|---|
| Ressources | Légères | Plus lourdes (une fenêtre à dessiner) |
| Besoin d'une session ouverte | Non | Oui (voir [les sessions Windows](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)) |
| Empreinte | Parfois reconnaissable | Celle d'un navigateur ordinaire |
| Intervention humaine possible (valider une vérification) | Non | Oui |

Une alternative courante : lancer une **vraie fenêtre, mais la placer hors de l'écran visible** (`--window-position=-32000,-32000`), pour garder l'empreinte d'un navigateur normal sans gêner la personne qui utilise la machine. La taille de la page se règle à part, par le **viewport** (la zone d'affichage que la page croit avoir) : elle est imposée par le script et ne dépend pas de la résolution de l'écran, qui ne compte que pour un humain qui regarderait la fenêtre.

```python
navigateur = p.chromium.launch(
    headless=False,                            # vraie fenêtre, pas de mode headless
    args=["--window-position=-32000,-32000"],  # fenêtre placée hors de l'écran visible
)
page = navigateur.new_page(viewport={"width": 1280, "height": 1000})
```

> **Piège :** changer de mode (fenêtre réelle en développement, headless en production) sans retester : la page peut se comporter différemment (vérification qui apparaît, mise en page qui change), et le script n'a été validé que dans l'autre mode.
>
> **Bonne pratique :** tester dans le mode réellement utilisé en production, et fixer le `viewport` pour que la mise en page ne dépende pas de l'écran de la machine.

## Les captchas : une vérification faite pour arrêter les robots

Un **captcha** (*Completely Automated Public Turing test to tell Computers and Humans Apart*) est un test que la page demande de réussir avant de continuer : reconnaître des images, cocher une case. Il est conçu pour être facile pour un humain et difficile pour un programme, et les versions récentes jugent aussi le comportement et l'empreinte du navigateur plutôt que seulement le test affiché.

Un robot qui tombe sur un captcha ne doit donc pas chercher à le franchir. Le schéma courant est de **laisser un humain le résoudre** dans une fenêtre réelle, puis de réutiliser le résultat : une fois la vérification réussie, le site pose un cookie de validation (par exemple `cf_clearance` chez Cloudflare) que le navigateur renvoie ensuite à chaque requête, sans nouveau test, tant qu'il est valable.

> **Piège :** croire qu'un cookie de validation est universel. Il est souvent lié au navigateur (identifiant, empreinte) et à l'adresse IP qui l'a obtenu : un robot qui reprend le même cookie avec une autre empreinte (par exemple en passant de la fenêtre réelle au mode headless) est de nouveau bloqué.
>
> **Bonne pratique :** prévoir un état « intervention humaine requise » (notification, fenêtre visible) plutôt que de boucler en silence ; ne pas contourner un captcha par un service tiers sans vérifier que les conditions d'utilisation du site le permettent.

## Le profil de navigateur persistant

Par défaut, un navigateur piloté démarre avec un profil vierge, détruit à la fermeture : aucun cookie ne survit d'un lancement à l'autre. Un **profil persistant** est un dossier qui conserve cookies, stockage local et cache. Avec Playwright, on le demande par `launch_persistent_context` ([documentation](https://playwright.dev/python/docs/api/class-browsertype#browser-type-launch-persistent-context)) :

```python
contexte = p.chromium.launch_persistent_context(
    user_data_dir=r"C:\robot\profil",  # cookies, stockage local et cache conservés ici
    headless=False,                    # même mode à chaque lancement
    viewport={"width": 1280, "height": 1000},
)
```

Le cookie de validation obtenu après un captcha reste alors dans ce dossier, et les lancements suivants ne revoient plus la vérification.

| Point d'attention | Pourquoi |
|---|---|
| Un seul navigateur à la fois par profil | Le dossier est verrouillé tant qu'un navigateur l'utilise ; un second lancement échoue |
| Le chemin dépend du compte qui exécute | Un chemin relatif au dossier de l'utilisateur ne désigne pas le même dossier pour un autre compte (compte de service, planificateur) : le robot repart d'un profil vide et revoit le captcha |
| Le contenu est sensible | Le profil contient des sessions ouvertes : qui copie le dossier peut se connecter à leur place |

> **Piège :** commiter le dossier du profil dans [Git](/?c=git&p=git), ou le laisser lisible par tous les comptes de la machine.
>
> **Bonne pratique :** indiquer le chemin du profil en absolu (ou dans une variable d'environnement), l'exclure du dépôt (`.gitignore`) et en réserver l'accès au compte qui exécute le robot.

## Le débogage à distance de Chrome

Chrome peut ouvrir un port de **débogage à distance** (`--remote-debugging-port=9222`) : un outil, ou un script, s'y connecte en parlant le **Chrome DevTools Protocol** (CDP), le protocole qu'utilisent aussi les outils de développement du navigateur ([documentation](https://chromedevtools.github.io/devtools-protocol/)). Cela permet de voir et de piloter une page d'un Chrome sans bureau (un serveur, une machine à distance).

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\robot\profil-debug
```

| Usage | Comment |
|---|---|
| Vérifier que le port répond | `curl http://localhost:9222/json/version` (renvoie la version et l'adresse du canal de pilotage) |
| Voir la page dans un autre Chrome | Ouvrir `chrome://inspect`, ajouter `localhost:9222` aux cibles : la page apparaît, avec ses outils de développement |
| Piloter avec Playwright | `p.chromium.connect_over_cdp("http://localhost:9222")` |

Ce port ne demande **aucune authentification** : quiconque s'y connecte contrôle le navigateur, y compris les sessions ouvertes dans son profil (il peut lire les cookies, naviguer, exécuter du JavaScript dans une page connectée).

> **Piège :** exposer ce port au réseau. Chrome n'y écoute par défaut que sur `127.0.0.1` (invisible du réseau, voir [les tunnels SSH](/?c=infrastructure-devops&s=reseaux&p=tunnel-ssh-et-redirection-de-port)) ; changer l'adresse d'écoute ou ouvrir le port dans le pare-feu donne le contrôle du navigateur à n'importe qui l'atteint.
>
> **Bonne pratique :** laisser le port sur `127.0.0.1` et, pour y accéder depuis un autre poste, passer par un tunnel SSH (`ssh -N -L 9222:localhost:9222 …`).

> **Piège :** depuis Chrome 136, l'option `--remote-debugging-port` n'est plus prise en compte quand le profil est celui par défaut de Chrome : un dossier non standard utilise une autre clé de chiffrement, ce qui protège les données du profil habituel d'un programme malveillant ([annonce](https://developer.chrome.com/blog/remote-debugging-port)). Sans `--user-data-dir`, le port ne répond pas.
>
> **Bonne pratique :** toujours donner un `--user-data-dir` dédié au robot, distinct du profil personnel.

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
| **À retenir** | Un navigateur piloté par un script (Playwright/Selenium/Puppeteer) exécute réellement les pages visitées, avec toutes les capacités d'un navigateur normal : une page malveillante peut tenter un téléchargement auto-déclenché, détourner le presse-papier, perturber le script via une popup, ou détecter l'automatisation elle-même via `navigator.webdriver`. Le mode headless a une empreinte parfois reconnaissable ; un captcha se lève par un humain dans une fenêtre réelle, et le déblocage se réutilise grâce à un profil persistant ; le port de débogage à distance de Chrome n'a aucune authentification. |
| **Outils utilisables** | Interception des dialogues natifs (`page.on("dialog")`) ; désactivation des téléchargements ou dossier isolé dédié ; refus des permissions navigateur par défaut ; masquage de `navigator.webdriver` via `context.add_init_script(...)` ; fenêtre réelle placée hors écran et `viewport` fixé ; `launch_persistent_context` pour garder un profil ; `--remote-debugging-port` et `chrome://inspect` pour observer un Chrome sans bureau. |
| **Pièges à éviter** | Laisser les réglages par défaut d'un navigateur pensé pour un usage humain sur un pilote automatique. Faire confiance à une donnée extraite d'une page non maîtrisée sans la traiter comme externe. Croire qu'un navigateur piloté devient indétectable une fois `navigator.webdriver` masqué. Valider dans un mode (fenêtre réelle) et exécuter dans un autre (headless). Croire qu'un cookie de validation de captcha vaut pour une autre empreinte. Un profil de navigateur versionné, lisible de tous ou désigné par un chemin qui change selon le compte. Un port de débogage exposé au réseau. |
| **Bonnes pratiques** | Restreindre explicitement le navigateur piloté au minimum nécessaire à la tâche. Intercepter systématiquement tout dialogue/téléchargement inattendu. Échapper toute donnée extraite avant réutilisation, comme n'importe quelle autre donnée externe. Tester dans le mode de production et fixer le `viewport`. Prévoir un état « intervention humaine requise » devant un captcha. Profil en chemin absolu, hors dépôt, réservé au compte du robot. Port de débogage sur `127.0.0.1` seulement, accessible à distance par un tunnel SSH, avec un `--user-data-dir` dédié. |
