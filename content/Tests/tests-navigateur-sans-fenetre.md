---
order: 12
---

# Tester une interface dans un navigateur sans fenêtre (29/10/2026)

Un **navigateur** est le logiciel qui affiche les pages web (Chrome, Firefox, Safari...). L'**interface** d'une application web est ce que l'utilisateur voit et manipule : boutons, champs, textes. Tester une interface, c'est ouvrir la page dans un vrai navigateur, cliquer et taper à la place d'un humain, puis vérifier ce qui s'affiche. Ce chapitre le fait avec un navigateur **sans fenêtre** (en anglais *headless*, « sans tête ») : un vrai navigateur, avec son moteur complet (il charge la page, exécute son JavaScript, calcule la mise en page), mais qui ne dessine rien à l'écran et que l'on pilote uniquement par programme.

Le pilotage est assuré par un **banc de tests** écrit à la main : un petit outil qui lance le navigateur, exécute les tests, signale les échecs et range tout ensuite. Il parle au navigateur avec le **Chrome DevTools Protocol** (*CDP*, « protocole des outils de développement de Chrome » ; un **protocole** est un ensemble de règles qui fixent comment deux programmes dialoguent) et tient en environ 220 lignes de JavaScript. Écrire ce banc une fois permet de comprendre ce que font à votre place les outils prêts à l'emploi comme [Playwright](https://playwright.dev/docs/intro) et [Puppeteer](https://pptr.dev/), comparés [plus bas](#playwright-puppeteer-ou-un-banc-maison).

Ce chapitre complète [les tests end-to-end](/?c=tests&p=tests-end-to-end), qui expliquent **pourquoi** et **quand** simuler un parcours utilisateur complet : ici, on regarde **comment** le faire fonctionner concrètement. Il suppose connus [le terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la fenêtre où l'on tape des commandes), [les balises et les attributs HTML](/?c=langages&s=html&p=structure-dun-document), [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [les fonctions](/?c=langages&s=javascript&p=fonctions), [le DOM et les événements](/?c=langages&s=javascript&p=dom-et-evenements) (la page vue comme un arbre d'éléments que JavaScript manipule), [la programmation asynchrone](/?c=langages&s=javascript&p=asynchrone) (`async`, `await` et les promesses : des opérations dont le résultat arrive plus tard) et [la gestion des erreurs](/?c=langages&s=javascript&p=gestion-des-erreurs) (`try`, `catch`, `finally`).

| Étape du banc | Ce qui se passe | Section |
|---|---|---|
| 1. Lancer | Chrome démarre sans fenêtre, avec un **profil** neuf (son dossier de réglages) et un **port de débogage** ouvert (une porte numérotée par laquelle on le pilote) | [Lancer Chrome sans fenêtre](#lancer-chrome-sans-fenetre) |
| 2. Se connecter | Le test ouvre une connexion [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) (un canal qui reste ouvert) vers la page | [Le CDP](#le-cdp-des-commandes-json-envoyees-par-websocket) |
| 3. Agir | Le test envoie des commandes : naviguer, cliquer, taper | [Le banc, pièce par pièce](#le-banc-piece-par-piece) |
| 4. Attendre | Le test patiente jusqu'à l'état voulu, sans pause fixe | [Attendre un état](#attendre-un-etat-plutot-que-dormir-un-delai-fixe) |
| 5. Vérifier | Le test lit la page et compare avec ce qui est attendu | [Lire la page et écrire des assertions](#lire-la-page-et-ecrire-des-assertions) |
| 6. Diagnostiquer et fermer | Une capture d'image est prise en cas d'échec, puis Chrome est fermé | [Capturer une image](#capturer-une-image-pour-diagnostiquer-un-echec) |

## Pourquoi un navigateur sans fenêtre

Pour vérifier qu'une page fonctionne, trois approches existent. Une **requête HTTP** (la demande qu'un programme envoie à un serveur pour obtenir un fichier, voir [l'API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) ne récupère que le texte de la page : aucun JavaScript ne s'exécute, donc aucun bouton ne réagit. Un navigateur avec fenêtre fait tout, mais exige un écran. Le navigateur sans fenêtre fait tout, sans écran.

| | Requête HTTP seule | Navigateur sans fenêtre | Navigateur avec fenêtre |
|---|---|---|---|
| Exécute le JavaScript de la page | Non | Oui | Oui |
| Calcule la mise en page, comme chez l'utilisateur | Non | Oui | Oui |
| A besoin d'un écran | Non | Non | Oui |
| Peut tourner sur un serveur sans écran | Oui | Oui | Seulement si la machine fournit un écran, même factice |
| Un humain peut le regarder en direct | Sans objet | Non : on prend des captures d'image | Oui |
| Usage typique | Vérifier qu'une adresse répond | Tests automatiques | Comprendre un test en le regardant |

Trois raisons concrètes motivent ce choix.

| Raison | Explication |
|---|---|
| Serveur d'intégration continue | L'**intégration continue** (CI) est un service qui exécute automatiquement les tests à chaque modification du code (voir [le pipeline CI/CD](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd)). Ses machines n'ont en général pas d'écran : le navigateur doit pouvoir démarrer sans |
| Rapidité | Aucune fenêtre à dessiner ni à gérer. Sur la machine de rédaction : Chrome répond sur son port 0,65 à 0,84 s après son lancement (quatre essais), et six tests durent de 0,33 à 0,76 s chacun, soit environ 2,5 s au total |
| Reproductibilité | Un profil neuf (aucune extension, aucun réglage personnel) et une taille de page fixée donnent le même résultat sur chaque machine. Le navigateur habituel de l'utilisateur n'est jamais touché |

## Ce qu'il faut avoir sous la main

**Node** (ou Node.js) est un programme qui exécute du JavaScript en dehors d'un navigateur, depuis un terminal ([documentation officielle](https://nodejs.org/docs/latest/api/)). Le banc est écrit en Node, avec les seuls outils fournis d'origine : aucun paquet à installer (un **paquet** est un lot de code écrit par d'autres, que l'on télécharge pour s'en servir).

| Élément | Rôle | Comment le vérifier |
|---|---|---|
| Google Chrome | Le navigateur piloté | Le fichier existe à son emplacement (tableau suivant) |
| Node, version récente | Exécute le banc et les tests | `node --version` affiche un numéro de version |
| Le `WebSocket` intégré à Node | Parler au navigateur sans paquet supplémentaire | `node -e "console.log(typeof WebSocket)"` affiche `function` (vérifié le 29/10/2026) |
| Un terminal | Lancer les commandes | Voir [le terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) |
| Un dossier de travail | Reçoit les trois fichiers du chapitre : `compteur.html`, `banc.mjs`, `tests.mjs` | N'importe quel dossier vide |

Si `typeof WebSocket` affiche `undefined`, la version de Node est trop ancienne : il faut la mettre à jour.

Le banc lit l'emplacement de Chrome dans une **variable d'environnement** nommée `CHROME_PATH` (une valeur que le terminal transmet à chaque programme qu'il lance, voir [les variables d'environnement en Bash](/?c=langages&s=bash&p=variables-denvironnement) et [en PowerShell](/?c=langages&s=powershell&p=variables-denvironnement)). Ainsi, le même code fonctionne sur toutes les machines : seule la variable change.

| Système | Emplacement habituel de Chrome |
|---|---|
| Windows | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| macOS | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| Linux | `/usr/bin/google-chrome` (varie selon la distribution) |

```bash
# Bash (Git Bash, le terminal installé avec Git sous Windows, ou celui de Linux et macOS)
# export crée une variable pour les programmes lancés ensuite ; sous Git Bash, les barres
# obliques / remplacent les barres inverses \
export CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
```

```powershell
# PowerShell : $env:NOM = valeur crée la variable pour les programmes lancés ensuite
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Seul l'emplacement Windows a été vérifié lors de la rédaction (29/10/2026) : contrôlez les deux autres sur votre machine.

## La page à tester

Pour s'exercer sans dépendre d'un site existant, voici une petite page : un compteur, un champ « pas » (de combien le compteur augmente), trois boutons et une zone de message. Elle contient deux lenteurs volontaires, qui imitent une vraie application : ses boutons ne répondent que 300 ms après le chargement, et « Enregistrer » met 400 ms à confirmer, comme le ferait un serveur.

Enregistrez ce code sous le nom `compteur.html`.

```html
<!DOCTYPE html>
<!-- lang="fr" : la page est écrite en français -->
<html lang="fr">
<head>
    <!-- charset : l'encodage des caractères, pour que « é » s'affiche correctement -->
    <meta charset="utf-8">
    <!-- title : le titre de la page, que les tests peuvent lire avec document.title -->
    <title>Compteur</title>
</head>
<body>
    <h1>Compteur</h1>
    <!-- output : affiche un résultat ; data-testid : repère stable pour les tests -->
    <p>Valeur : <output id="valeur" data-testid="valeur">0</output></p>
    <!-- Le champ « pas » : de combien le compteur augmente à chaque ajout -->
    <label>Pas : <input id="pas" type="text" value="1"></label>
    <!-- Trois boutons ; type="button" : ils ne soumettent aucun formulaire -->
    <button id="ajouter" type="button">Ajouter</button>
    <button id="remettre" type="button">Remettre à zéro</button>
    <button id="enregistrer" type="button">Enregistrer</button>
    <!-- role="status" : zone dont le texte change pour informer l'utilisateur -->
    <p id="statut" role="status"></p>
    <script>
        // Total du compteur et accès aux éléments de la page
        let total = 0;
        const valeur = document.getElementById("valeur");
        const pas = document.getElementById("pas");
        const statut = document.getElementById("statut");

        // Ajoute le pas au total (0 si le champ ne contient pas un nombre) et l'affiche
        function ajouter() {
            total += Number(pas.value) || 0;   // Number convertit le texte en nombre
            valeur.textContent = total;        // affiche le nouveau total
        }

        // Branche les boutons et le clavier, puis annonce que la page est prête
        function demarrer() {
            // Un clic sur « Ajouter » appelle la fonction ajouter
            document.getElementById("ajouter").addEventListener("click", ajouter);
            // Un clic sur « Remettre à zéro » ramène le total à 0
            document.getElementById("remettre").addEventListener("click", () => {
                total = 0;                     // le total repart de zéro
                valeur.textContent = total;    // et l'affichage aussi
            });
            // Un clic sur « Enregistrer » affiche d'abord un message d'attente
            document.getElementById("enregistrer").addEventListener("click", () => {
                statut.textContent = "Enregistrement en cours...";
                // Simule un serveur lent : la réponse arrive 400 ms plus tard
                setTimeout(() => {
                    statut.textContent = "Enregistré : " + total;
                }, 400);
            });
            // La touche Entrée dans le champ « pas » agit comme un clic sur Ajouter
            pas.addEventListener("keydown", (evenement) => {
                if (evenement.key === "Enter") ajouter();
            });
            document.body.dataset.pret = "oui";   // repère lu par les tests : data-pret="oui"
        }

        // Simule une initialisation lente : setTimeout appelle demarrer après 300 ms,
        // les boutons ne répondent donc qu'à partir de ce moment
        setTimeout(demarrer, 300);
    </script>
</body>
</html>
```

Les tests désignent les éléments par des **sélecteurs CSS** : l'écriture qui désigne un élément de la page, comme dans [les sélecteurs CSS](/?c=langages&s=css&p=selecteurs). `#valeur` désigne l'élément dont l'`id` est `valeur` ; `[data-testid="valeur"]` désigne celui dont l'attribut `data-testid` vaut « valeur » (voir [les attributs `data-`](/?c=langages&s=html&p=attributs-data-et-accessibilite)). Les tests s'appuient sur ces repères :

| Repère | Élément | Comportement |
|---|---|---|
| `#valeur` | Le total affiché | Commence à `0` |
| `#pas` | Le champ de saisie | Contient `1` au départ ; sa valeur est ajoutée à chaque ajout |
| `#ajouter` | Bouton « Ajouter » | Ajoute le pas au total (aussi par la touche Entrée dans `#pas`) |
| `#remettre` | Bouton « Remettre à zéro » | Ramène le total à `0` |
| `#enregistrer` | Bouton « Enregistrer » | Affiche « Enregistrement en cours... » puis, 400 ms plus tard, « Enregistré : » suivi du total |
| `#statut` | Zone de message | Vide au départ |
| `data-pret="oui"` sur `<body>` | Marqueur « l'application est prête » | Posé 300 ms après le chargement |

Le marqueur `data-pret` est une habitude utile : l'application dit elle-même quand elle est prête, ce qui évite de deviner.

Une page ouverte par une adresse `file://` (un fichier du disque, sans serveur) suffit tant qu'elle ne charge pas d'autres fichiers : voir [le serveur local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) pour les limites de `file://`.

## Lancer Chrome sans fenêtre

Lancer Chrome revient à démarrer un **processus** : un programme en cours d'exécution, identifié par un numéro appelé **PID** (voir [la gestion des processus en Bash](/?c=langages&s=bash&p=gestion-des-processus) et [en PowerShell](/?c=langages&s=powershell&p=gestion-des-processus)). On lui passe des **options** : des mots commençant par `--` qui règlent son comportement.

| Option | Rôle |
|---|---|
| `--headless` | Démarre sans fenêtre |
| `--remote-debugging-port=9333` | Ouvre un **port** de débogage. Un port est un numéro (de 0 à 65535) qui distingue, sur une même machine, les programmes qui attendent des connexions ; `9333` est un choix arbitraire : tout numéro libre convient (voir [le serveur local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) pour `localhost` et les ports) |
| `--user-data-dir=<dossier>` | Désigne le **profil** : le dossier où le navigateur range ses réglages, ses **cookies** (de petits fichiers par lesquels un site reconnaît un visiteur), son historique et ses **extensions** (des petits programmes ajoutés au navigateur). Un dossier neuf et vide donne un Chrome « tout neuf » et laisse intact celui de l'utilisateur |
| `--no-first-run` | Saute l'assistant de premier lancement d'un profil neuf |
| `--no-default-browser-check` | Ne propose pas de devenir le navigateur par défaut |
| `about:blank` | Adresse de départ : une page vide |

Sur la machine de rédaction (29/10/2026), `--headless` seul suffit et `--headless=new` est aussi accepté. Le nom de l'option et ses variantes évoluent d'une version de Chrome à l'autre : la [documentation officielle du mode sans fenêtre](https://developer.chrome.com/docs/chromium/headless) fait foi, d'où la date en titre de ce chapitre. Un Chrome lancé ainsi s'annonce comme `HeadlessChrome` dans son identifiant (son *User-Agent*), ce que l'on a vérifié.

Le banc lancera Chrome lui-même (section [Le banc](#le-banc-piece-par-piece)). Une fois lancé, Chrome écoute sur le port : c'est lui qui servira de guichet pour le pilotage.

## Le CDP : des commandes JSON envoyées par WebSocket

Un **protocole** est un ensemble de règles de dialogue : quels messages on peut envoyer, sous quelle forme, dans quel ordre. HTTP en est un autre exemple, voir [l'API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). Le **Chrome DevTools Protocol** est celui qu'utilisent les outils de développement intégrés à Chrome (touche F12) pour dialoguer avec la page ; Chrome l'ouvre aussi aux programmes ([documentation officielle](https://chromedevtools.github.io/devtools-protocol/)).

Deux technologies portent ce dialogue :

- le **WebSocket**, une connexion qui reste ouverte et où chaque camp peut envoyer des messages quand il veut, détaillée dans [WebSocket : la communication temps réel](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) ;
- le **JSON**, un format de texte structuré (`{ "clé": valeur }`), détaillé dans [le format JSON](/?c=infrastructure-devops&s=infrastructure&p=json) : chaque message est un petit texte JSON.

Chrome propose aussi un service HTTP minuscule sur le même port, pour trouver les adresses WebSocket. Voici ce que `/json/version` a répondu sur la machine de rédaction (les valeurs de version sont remplacées par `...`) :

```text
{
  Browser: 'Chrome/...',
  'File-Path-Style': 'windows',
  'Protocol-Version': '...',
  'User-Agent': 'Mozilla/5.0 (...) AppleWebKit/... HeadlessChrome/... Safari/...',
  'V8-Version': '...',
  'WebKit-Version': '...',
  webSocketDebuggerUrl: 'ws://127.0.0.1:9333/devtools/browser/<identifiant>'
}
```

`webSocketDebuggerUrl` est l'adresse de la connexion au **navigateur** lui-même. La liste des **cibles** (pages et autres éléments pilotables), à l'adresse `/json/list`, donne une adresse par cible. Sur la machine de rédaction, un Chrome neuf y listait cinq cibles, de types `background_page`, `page`, `browser_ui`, `browser_ui` et `service_worker` : seule celle de type `page` est la page à piloter. Prendre la première de la liste serait une erreur.

```text
  Le test (Node)              Chrome sans fenêtre                 La page
  --------------              -------------------                 -------
       |                              |                              |
       | 1. GET /json/list (HTTP)     |                              |
       |----------------------------->|                              |
       |<-----------------------------|  adresses WebSocket          |
       |                              |                              |
       | 2. connexion WebSocket       |                              |
       |==============================|  (reste ouverte)             |
       |                              |                              |
       | 3. {"id":1,"method":         |                              |
       |    "Page.navigate",...}      |  charge compteur.html        |
       |----------------------------->|----------------------------->|
       |                              |                              |
       | 4. {"id":1,"result":{...}}   |                              |
       |<-----------------------------|                              |
       |                              |                              |
       | 5. {"method":                |  la page a fini de charger   |
       |    "Page.loadEventFired"}    |                              |
       |<-----------------------------|<-----------------------------|
       |                              |                              |
       | 6. {"id":2,"method":         |                              |
       |    "Runtime.evaluate",...}   |  exécute du JavaScript       |
       |----------------------------->|----------------------------->|
       |                              |                              |
       | 7. {"id":2,"result":         |  la valeur calculée          |
       |    {"result":{"value":..}}}  |                              |
       |<-----------------------------|<-----------------------------|
```

L'étape 1 est une demande HTTP ordinaire (`GET` signifie « donne-moi cette ressource »). Ensuite, tout passe par la connexion WebSocket. Il n'existe que trois sortes de messages :

| Sorte | Envoyée par | Contient | Reconnaissable à |
|---|---|---|---|
| Commande | Le test | Un `id` choisi par le test, un `method` (le nom de la commande, de la forme `Domaine.nom`) et des `params` | La présence de `method` **et** de `id` |
| Réponse | Chrome | Le même `id`, puis `result` (succès) ou `error` (échec) | La présence de `id` |
| Événement | Chrome | Un `method` et des `params`, jamais d'`id` : Chrome prévient de lui-même | `method` **sans** `id` |

L'`id` permet d'associer chaque réponse à sa commande, puisque plusieurs commandes peuvent être en vol en même temps. Voici de vrais messages échangés sur la machine de rédaction (les `<-` sont reçus par le test, les `->` envoyés ; le premier message est coupé sur deux lignes pour tenir à l'écran) :

```text
-> {"id":101,"method":"Runtime.evaluate",
    "params":{"expression":"document.title","returnByValue":true}}
<- {"id":101,"result":{"result":{"type":"string","value":"Compteur"}}}
-> {"id":102,"method":"Foo.bar"}
<- {"id":102,"error":{"code":-32601,"message":"'Foo.bar' wasn't found"}}
<- {"method":"Page.loadEventFired","params":{"timestamp":1283163.132011}}
```

Une commande inconnue produit donc une réponse `error`. Mais attention : une expression JavaScript qui lève une erreur **dans la page** ne produit pas de `error`. La réponse est un `result` qui contient un champ `exceptionDetails` (observé avec `document.title.longueur.x`). Le banc ci-dessous vérifie ce champ.

Les commandes utilisées dans ce chapitre :

| Commande | Rôle | Utilisée par |
|---|---|---|
| [`Page.navigate`](https://chromedevtools.github.io/devtools-protocol/tot/Page/) | Aller à une adresse | `ouvrir` |
| [`Page.captureScreenshot`](https://chromedevtools.github.io/devtools-protocol/tot/Page/) | Photographier la page | `capturer` |
| [`Runtime.evaluate`](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/) | Exécuter du JavaScript dans la page et en renvoyer la valeur | `evaluer` |
| [`Input.dispatchMouseEvent`](https://chromedevtools.github.io/devtools-protocol/tot/Input/) | Simuler la souris (appui, relâchement) | `cliquer` |
| [`Input.dispatchKeyEvent`](https://chromedevtools.github.io/devtools-protocol/tot/Input/) | Simuler le clavier (touche enfoncée, relâchée) | `saisir`, `appuyerSurEntree` |
| [`Emulation.setDeviceMetricsOverride`](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/) | Imposer la taille de la page | `connecterPage` |
| `Runtime.enable`, `Page.enable` | Demander à recevoir les événements de ces domaines | `connecterPage` |
| [`Browser.close`](https://chromedevtools.github.io/devtools-protocol/tot/Browser/) | Fermer le navigateur | `fermerNavigateur` |

## Le banc, pièce par pièce

Le banc tient dans un fichier `banc.mjs`. L'extension `.mjs` dit à Node que le fichier est un **module** : un fichier qui peut importer des outils d'un autre (`import`) et en offrir aux autres (`export`). Les blocs qui suivent se mettent bout à bout, dans l'ordre, dans ce même fichier. Quelques écritures JavaScript reviennent :

| Écriture | Sens | Exemple du banc |
|---|---|---|
| `texte ${valeur} texte` | Un texte écrit entre accents graves dans le code, où `${...}` insère une valeur | `Le port ${port} est déjà utilisé` |
| `objet?.propriete` | Lit la propriété si l'objet existe, sinon donne `undefined` au lieu de provoquer une erreur | `detail.exception?.description` |
| `a ?? b` | Donne `b` si `a` vaut `undefined` ou `null`, sinon `a` | `detail.exception?.description ?? detail.text` |
| `{ ...objet, cle: 1 }` | Copie toutes les propriétés d'un objet dans un nouveau | `{ type: "keyUp", ...touche }` |
| `new Map()` | Une table qui associe une clé (ici un numéro de commande) à une valeur | `attentes` |
| `new Promise((ok, ko) => ...)` | Fabrique une promesse que l'on tient soi-même : `ok(valeur)` la réussit, `ko(erreur)` la fait échouer | `envoyer` |
| `(x) => x + 1` | Une fonction fléchée : une fonction écrite en abrégé | `(c) => c.type === "page"` |

### Les imports et le chemin de Chrome

```javascript
// Le préfixe « node: » désigne un module intégré à Node (un lot d'outils prêts à l'emploi)
import { spawn } from "node:child_process";                  // lance un autre programme
import { existsSync } from "node:fs";                        // le fichier existe-t-il ?
import { mkdtemp, rm, writeFile } from "node:fs/promises";   // dossiers et fichiers
import { tmpdir } from "node:os";                            // dossier temporaire du système
import { join } from "node:path";                            // assemble un chemin de fichier
import net from "node:net";                                  // connexions réseau
import { setTimeout as pause } from "node:timers/promises";  // pause : une promesse

export const PORT = 9333;                      // port de débogage choisi pour ce banc
const CHROME = process.env.CHROME_PATH;        // chemin de Chrome, donné par l'environnement
```

### `attendre` : patienter jusqu'à ce qu'une condition soit vraie

Cette fonction est la plus importante du banc : elle remplace toute pause fixe. Elle est expliquée à la section [Attendre un état plutôt que dormir un délai fixe](#attendre-un-etat-plutot-que-dormir-un-delai-fixe).

```javascript
// Réessaie condition() jusqu'à ce qu'elle renvoie une valeur vraie, ou échoue après le délai
export async function attendre(condition, description, delai = 5000) {
    const limite = Date.now() + delai;         // l'heure (en ms) à ne pas dépasser
    let derniereErreur = null;                 // dernière erreur vue, pour le message final
    while (Date.now() < limite) {              // tant que le délai n'est pas écoulé
        try {
            const valeur = await condition();  // teste la condition
            if (valeur) return valeur;         // vraie : on rend ce qu'elle a trouvé
        } catch (erreur) {
            derniereErreur = erreur;           // pas encore prête : on note et on réessaie
        }
        await pause(50);                       // 50 ms de repos avant l'essai suivant
    }
    // Le message dit ce qu'on attendait, et la dernière erreur s'il y en a eu une
    const detail = derniereErreur ? ` (dernière erreur : ${derniereErreur.message})` : "";
    throw new Error(`Délai dépassé (${delai} ms) : ${description}${detail}`);   // échec net
}
```

### `portLibre` et `lancerNavigateur` : démarrer Chrome

`portLibre` tente de se connecter au port : si quelqu'un répond, il est occupé. `lancerNavigateur` vérifie le chemin de Chrome et le port, crée un dossier de profil neuf (`mkdtemp` ajoute des lettres au hasard à un nom de départ pour qu'il soit unique), lance Chrome par `spawn` (qui démarre un programme sans attendre sa fin) puis patiente jusqu'à ce que son port réponde. Pour cela, `fetch` envoie une requête HTTP (voir [l'API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) et rend une promesse de la réponse ; `reponse.ok` vaut `true` quand le serveur a répondu avec succès. `stdio: "ignore"` signifie que les messages que Chrome écrit sont jetés. La fonction renvoie ce qu'il faudra pour tout refermer.

```javascript
// Renvoie true si personne n'écoute sur ce port de la machine
export function portLibre(port) {
    return new Promise((resoudre) => {         // une promesse : sa réponse arrivera plus tard
        const prise = net.connect(port, "127.0.0.1");   // tente de se connecter à ce port
        prise.on("connect", () => {            // connexion acceptée : le port est occupé
            prise.destroy();                   // on referme aussitôt
            resoudre(false);                   // réponse : le port n'est pas libre
        });
        prise.on("error", () => resoudre(true));        // refusée : personne n'écoute
    });
}
```

```javascript
// Lance Chrome sans fenêtre, avec un profil neuf, et attend que son port réponde
export async function lancerNavigateur(port = PORT) {
    // Deux vérifications d'abord, pour échouer avec un message clair
    if (!CHROME || !existsSync(CHROME)) throw new Error(`CHROME_PATH invalide : ${CHROME}`);
    if (!(await portLibre(port))) throw new Error(`Le port ${port} est déjà utilisé`);
    const profil = await mkdtemp(join(tmpdir(), "banc-profil-"));  // dossier neuf et vide
    const processus = spawn(CHROME, [          // lance Chrome avec la liste d'options
        "--headless",                          // sans fenêtre
        `--remote-debugging-port=${port}`,     // ouvre le port de débogage
        `--user-data-dir=${profil}`,           // profil jetable, jamais celui d'un humain
        "--no-first-run",                      // pas d'assistant de premier lancement
        "--no-default-browser-check",          // ne propose pas d'être le navigateur défaut
        "about:blank",                         // page de départ : une page vide
    ], { stdio: "ignore" });                   // ignore les messages que Chrome écrit
    // Chrome met un instant à démarrer : on attend que /json/version réponde
    await attendre(async () => {
        const reponse = await fetch(`http://127.0.0.1:${port}/json/version`);   // question
        return reponse.ok;                     // vrai quand Chrome répond
    }, "Chrome n'écoute pas sur son port de débogage", 10000);
    return { processus, profil, port };        // de quoi le fermer plus tard
}
```

### `connecterPage` : ouvrir la conversation avec la page

Elle choisit la cible de type `page`, ouvre la connexion WebSocket puis installe trois choses :

| Élément | Rôle |
|---|---|
| `attentes` | Retient, pour chaque `id` de commande envoyé, la promesse qui attend sa réponse |
| `exceptions` | Collecte les erreurs JavaScript levées dans la page (événement `Runtime.exceptionThrown`), pour que le test les voie |
| `envoyer` | Envoie une commande et rend une promesse de sa réponse : `await page.envoyer("Page.navigate", ...)` |

Elle fixe aussi la taille de la page à 800 × 600 pixels (un **pixel** est le plus petit point d'un écran) : la raison est expliquée à la section [Capturer une image](#capturer-une-image-pour-diagnostiquer-un-echec).

```javascript
// Se connecte à la page ouverte et renvoie un objet « page » pour lui parler
export async function connecterPage(port = PORT) {
    const cible = await attendre(async () => {
        const reponse = await fetch(`http://127.0.0.1:${port}/json/list`);   // liste
        const cibles = await reponse.json();   // le texte JSON devient un tableau d'objets
        return cibles.find((c) => c.type === "page");   // garde la vraie page, pas les extras
    }, "aucune page ouverte");
    const ws = new WebSocket(cible.webSocketDebuggerUrl);   // ouvre la connexion WebSocket
    await new Promise((ok, ko) => {            // attend que la connexion soit établie
        ws.addEventListener("open", ok);       // ouverte : tout va bien
        ws.addEventListener("error", () => ko(new Error("connexion WebSocket refusée")));
    });
    let numero = 0;                            // numéro de la dernière commande envoyée
    const attentes = new Map();                // numéro de commande -> réponse attendue
    const exceptions = [];                     // erreurs JavaScript survenues dans la page
    ws.addEventListener("message", (message) => {
        const recu = JSON.parse(message.data); // le texte reçu devient un objet
        if (recu.id !== undefined) {           // un « id » : c'est la réponse à une commande
            const attente = attentes.get(recu.id);   // retrouve qui l'attendait
            if (!attente) return;              // commande inconnue de ce banc : on l'ignore
            attentes.delete(recu.id);          // cette réponse est arrivée : on l'oublie
            if (recu.error) attente.ko(new Error(recu.error.message));   // commande refusée
            else attente.ok(recu.result);      // sinon la promesse reçoit le résultat
        } else if (recu.method === "Runtime.exceptionThrown") {   // un événement d'erreur
            const detail = recu.params.exceptionDetails;          // le détail de l'erreur
            exceptions.push(detail.exception?.description ?? detail.text);   // on la retient
        }
    });
    ws.addEventListener("close", () => {       // connexion perdue : plus aucune réponse
        for (const attente of attentes.values()) attente.ko(new Error("connexion fermée"));
    });
    // Envoie une commande CDP et renvoie une promesse de sa réponse
    function envoyer(methode, parametres = {}) {
        const id = ++numero;                   // numéro neuf pour cette commande
        return new Promise((ok, ko) => {
            attentes.set(id, { ok, ko });      // mémorise qui attend la réponse
            ws.send(JSON.stringify({ id, method: methode, params: parametres }));   // envoi
        });
    }
    await envoyer("Runtime.enable");           // demande à recevoir les événements d'erreur
    await envoyer("Page.enable");              // et ceux de la page
    await envoyer("Emulation.setDeviceMetricsOverride", {   // fixe la taille de la page :
        width: 800, height: 600, deviceScaleFactor: 1, mobile: false,   // 800 x 600 pixels
    });                                        // des captures identiques sur chaque machine
    return { envoyer, exceptions, ws };        // l'objet « page » utilisé par tous les outils
}
```

### `evaluer`, `ouvrir` et `texteDe` : lire et charger

`evaluer` exécute dans la page un texte de code JavaScript et renvoie sa valeur ; `returnByValue` demande la valeur elle-même (sans cela, Chrome renvoie une référence vers un objet de la page), `awaitPromise` attend le résultat d'une promesse. `ouvrir` distingue **deux sortes de « prêt »** : le navigateur a fini de charger la page (`document.readyState` vaut `"complete"`), et l'application a fini de démarrer (le marqueur `data-pret` de la page). Aucune des deux ne remplace l'autre, comme le montre la section sur l'attente. Dans `texteDe`, `JSON.stringify("#valeur")` renvoie le texte `"#valeur"`, guillemets compris : on peut ainsi insérer un sélecteur dans du code sans risque, même s'il contient lui-même des guillemets.

```javascript
// Exécute du JavaScript dans la page et renvoie sa valeur (texte, nombre, objet...)
export async function evaluer(page, expression) {
    const reponse = await page.envoyer("Runtime.evaluate", {
        expression,                            // le code à exécuter, sous forme de texte
        returnByValue: true,                   // renvoie la valeur elle-même
        awaitPromise: true,                    // si c'est une promesse, attend son résultat
    });
    const echec = reponse.exceptionDetails;    // présent si le code a levé une erreur
    if (echec) throw new Error(echec.exception?.description ?? echec.text);   // on la relève
    return reponse.result.value;               // la valeur calculée dans la page
}

// Ouvre une adresse et attend que la page ET l'application soient prêtes
export async function ouvrir(page, adresse) {
    const reponse = await page.envoyer("Page.navigate", { url: adresse });   // va à l'adresse
    // Une adresse introuvable ne lève pas d'erreur CDP : elle renvoie un texte d'erreur
    if (reponse.errorText) throw new Error(`Navigation impossible : ${reponse.errorText}`);
    await attendre(                            // 1. le navigateur a fini de charger la page
        () => evaluer(page, "document.readyState === 'complete'"),
        "chargement de la page",
    );
    await attendre(                            // 2. l'application s'est déclarée prête
        () => evaluer(page, "document.body?.dataset.pret === 'oui'"),
        "démarrage de l'application (data-pret)",
    );
}

// Lit le texte d'un élément (null s'il n'existe pas)
export function texteDe(page, selecteur) {
    const sel = JSON.stringify(selecteur);     // protège les guillemets du sélecteur
    // ?. renvoie undefined si l'élément manque ; ?? null le remplace par null
    return evaluer(page, `document.querySelector(${sel})?.textContent ?? null`);
}
```

### `cliquer`, `saisir` et `appuyerSurEntree` : agir comme un humain

Pour cliquer, il faut des coordonnées. Les fonctions `trouverCentre` et `viserChamp` s'exécutent **dans la page** : le banc les y envoie sous forme de texte (écrire une fonction dans un modèle de texte, `${trouverCentre}`, insère son code source). Elles font défiler la page jusqu'à l'élément si besoin, et rendent le centre de son rectangle ou donnent le focus au champ. Le **focus** est le fait qu'un élément reçoive les frappes du clavier. Chaque action attend d'abord que l'élément existe, grâce à `attendre`.

La souris envoie deux événements (appui puis relâchement), comme un vrai clic. Le clavier envoie `keyDown` (la touche s'enfonce, avec le texte qu'elle produit) puis `keyUp` (elle remonte). `champ.select()` sélectionne le texte déjà présent : la frappe suivante le remplace, comme chez un humain qui sélectionne puis tape.

```javascript
// Fonction exécutée DANS la page : fait défiler jusqu'à l'élément et renvoie son centre
function trouverCentre(selecteur) {
    const element = document.querySelector(selecteur);   // cherche l'élément
    if (!element) return null;                 // introuvable : l'attente réessaiera
    element.scrollIntoView({ block: "center" });         // le rend visible à l'écran
    const zone = element.getBoundingClientRect();        // rectangle de l'élément
    return { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };   // son centre
}

// Simule un clic de souris au centre d'un élément
export async function cliquer(page, selecteur) {
    const appel = `(${trouverCentre})(${JSON.stringify(selecteur)})`;   // texte du code
    const { x, y } = await attendre(() => evaluer(page, appel), `élément ${selecteur}`);
    for (const type of ["mousePressed", "mouseReleased"]) {   // appui, puis relâchement
        await page.envoyer("Input.dispatchMouseEvent", {
            type, x, y, button: "left", clickCount: 1,   // bouton gauche, un seul clic
        });
    }
}

// Fonction exécutée DANS la page : met le curseur dans un champ et sélectionne son texte
function viserChamp(selecteur) {
    const champ = document.querySelector(selecteur);     // cherche le champ
    if (!champ) return false;                  // introuvable : l'attente réessaiera
    champ.focus();                             // lui donne le focus : il reçoit le clavier
    champ.select();                            // sélectionne le texte : la frappe le remplace
    return true;                               // trouvé : l'attente s'arrête
}

// Tape un texte dans un champ, une touche après l'autre
export async function saisir(page, selecteur, texte) {
    const appel = `(${viserChamp})(${JSON.stringify(selecteur)})`;   // texte du code
    await attendre(() => evaluer(page, appel), `champ ${selecteur}`);   // met le focus
    for (const lettre of texte) {              // une lettre à la fois
        const touche = { key: lettre };        // la lettre appuyée
        const appui = { type: "keyDown", text: lettre, ...touche };   // appui + texte
        await page.envoyer("Input.dispatchKeyEvent", appui);          // la touche descend
        await page.envoyer("Input.dispatchKeyEvent", { type: "keyUp", ...touche });   // monte
    }
}

// Appuie sur la touche Entrée (appui puis relâchement)
export async function appuyerSurEntree(page) {
    const touche = { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 };   // la touche
    await page.envoyer("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", ...touche });
    await page.envoyer("Input.dispatchKeyEvent", { type: "keyUp", ...touche });   // relâche
}
```

### `capturer` : photographier la page

`Page.captureScreenshot` renvoie l'image sous forme de texte en **base64** (une façon d'écrire des octets avec seulement des lettres, des chiffres, `+` et `/`, voir [Base64 sur MDN](https://developer.mozilla.org/en-US/docs/Glossary/Base64)). `Buffer.from(texte, "base64")` la reconvertit en octets (une suite de nombres de 0 à 255, la forme sous laquelle un fichier est stocké), que l'on écrit dans un fichier **PNG** (un format d'image sans perte).

```javascript
// Photographie la page et l'enregistre dans un fichier PNG
export async function capturer(page, fichier) {
    const { data } = await page.envoyer("Page.captureScreenshot", { format: "png" });   // PNG
    await writeFile(fichier, Buffer.from(data, "base64"));   // décode le texte en octets
    return fichier;                            // renvoie le chemin, pratique pour l'afficher
}
```

### `fermerNavigateur` : tout ranger

Cette fonction demande à Chrome de se fermer poliment, patiente, force l'arrêt si besoin, puis supprime le dossier de profil. Ses limites sont expliquées à la section [Fermer Chrome proprement](#fermer-chrome-proprement).

```javascript
// Ferme Chrome proprement, sinon de force, puis supprime le profil temporaire
export async function fermerNavigateur(navigateur, page) {
    const { processus, profil, port } = navigateur;   // ce que lancerNavigateur a renvoyé
    const arrete = new Promise((ok) => processus.once("exit", ok));   // vrai à l'arrêt
    page?.ws.close();                          // ferme d'abord la connexion à la page
    try {
        const reponse = await fetch(`http://127.0.0.1:${port}/json/version`);   // question
        const infos = await reponse.json();    // contient l'adresse de connexion
        const ws = new WebSocket(infos.webSocketDebuggerUrl);   // connexion « navigateur »
        ws.addEventListener("open", () => {    // connexion ouverte : demande l'arrêt poli
            ws.send(JSON.stringify({ id: 1, method: "Browser.close" }));   // la commande
        });
    } catch {
        processus.kill();                      // Chrome ne répond plus : arrêt forcé
    }
    // Course entre l'arrêt de Chrome et un délai de 10 s ; ref: false : ce délai
    // n'empêche pas Node de se terminer
    const delaiMax = pause(10000, "trop tard", { ref: false });
    if ((await Promise.race([arrete, delaiMax])) === "trop tard") processus.kill();
    await arrete;                              // on ne continue qu'une fois Chrome arrêté
    // Supprime le profil : plusieurs essais, car Chrome libère ses fichiers avec retard
    await rm(profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
}
```

## Lire la page et écrire des assertions

Une **assertion** est une vérification qui échoue (en levant une erreur) quand une valeur n'est pas celle attendue. Node fournit `node:assert` ([documentation officielle](https://nodejs.org/api/assert.html)) ; la version `node:assert/strict` compare strictement : `"1"` (un texte) n'est pas égal à `1` (un nombre). `assert.equal(réel, attendu)` compare deux valeurs, `assert.deepEqual` compare le contenu de deux tableaux ou objets.

Toute lecture de la page passe par `evaluer` : on écrit le JavaScript du [DOM](/?c=langages&s=javascript&p=dom-et-evenements) que l'on taperait dans la **console** du navigateur (l'onglet des outils de développement, touche F12, où l'on exécute du JavaScript à la main). Voici ce que donnent, sur la page de test, après avoir tapé `5` dans le champ et cliqué sur « Ajouter » (valeurs observées) :

| Ce que l'on veut savoir | Expression passée à `evaluer` | Valeur lue |
|---|---|---|
| Le texte d'un élément | `document.querySelector("#valeur").textContent` | `"5"` |
| Ce que contient un champ | `document.querySelector("#pas").value` | `"5"` |
| La valeur d'un attribut | `document.querySelector("#statut").getAttribute("role")` | `"status"` |
| Un élément existe-t-il ? | `document.querySelector("[data-testid='valeur']") !== null` | `true` |
| Un élément est-il absent ? | `document.querySelector("#absent") === null` | `true` |
| Un élément occupe-t-il de la place ? | `document.querySelector("#ajouter").getBoundingClientRect().width > 0` | `true` |
| Un style calculé | `getComputedStyle(document.querySelector("h1")).fontSize` | `"32px"` |
| Le nombre d'éléments | `document.querySelectorAll("button").length` | `3` |
| Le titre de la page | `document.title` | `"Compteur"` |
| Un attribut `data-` | `document.body.dataset.pret` | `"oui"` |
| L'élément qui a le focus | `document.activeElement.id` | `"ajouter"` |
| Le type d'adresse | `location.protocol` | `"file:"` |

Pour **désigner** l'élément à lire ou à cliquer, plusieurs sélecteurs sont possibles :

| Sélecteur | Écriture | À privilégier ? |
|---|---|---|
| Par identifiant | `#ajouter` | Oui, si l'`id` est stable et unique |
| Par attribut dédié aux tests | `[data-testid="valeur"]` | Oui : indépendant du texte et de la mise en page |
| Par classe | `.bouton-principal` | Prudence : les classes servent au style et changent souvent |
| Par texte affiché ou position | « le troisième bouton » | Non : le moindre changement de texte casse le test, voir [les tests end-to-end](/?c=tests&p=tests-end-to-end) |

Le banc relève aussi les **erreurs JavaScript de la page** : sur la machine de rédaction, `setTimeout(() => { throw new Error('boum'); }, 0)` exécuté dans la page a rempli `page.exceptions` avec `["Error: boum\n    at <anonymous>:1:26"]`. Sans cela, une page peut afficher les bons chiffres tout en cachant une erreur que personne ne voit.

## Attendre un état plutôt que dormir un délai fixe

Le réflexe du débutant est la **pause fixe** (« attendre 2 secondes et espérer que ça suffise »). Elle est soit trop courte (le test échoue sans raison valable : c'est un test **instable**, *flaky* en anglais, voir [les tests unitaires](/?c=tests&p=tests-unitaires)), soit trop longue (la suite entière ralentit). L'alternative est d'attendre l'**état** voulu, avec un plafond de sécurité : voir aussi [Attendre sans perdre de temps](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts). Le script suivant compare les stratégies sur la page de test.

```javascript
import { setTimeout as pause } from "node:timers/promises";  // pause : une promesse
import {
    attendre, cliquer, connecterPage, evaluer,
    fermerNavigateur, lancerNavigateur, ouvrir, texteDe,
} from "./banc.mjs";                                         // nos outils

const ADRESSE = new URL("./compteur.html", import.meta.url).href;   // la page à tester
const navigateur = await lancerNavigateur();                 // Chrome démarre
const page = await connecterPage();                          // on se branche dessus

try {
    // Cas 1 : cliquer dès que le navigateur dit « page chargée », sans attendre l'application
    await page.envoyer("Page.navigate", { url: ADRESSE });   // charge la page
    await attendre(() => evaluer(page, "document.readyState === 'complete'"), "chargement");
    await cliquer(page, "#ajouter");           // les boutons ne sont pas encore branchés
    console.log("1. clic trop tôt            :", await texteDe(page, "#valeur"));

    // Cas 2 : une pause fixe trop courte, puis trop longue, puis l'attente d'un état
    for (const delai of [100, 2000, "état"]) {
        await ouvrir(page, ADRESSE);           // page neuve, application prête
        await cliquer(page, "#enregistrer");   // le serveur simulé répond après 400 ms
        const depart = Date.now();             // heure de départ de l'attente
        if (delai === "état") {
            await attendre(                    // attend le texte final, pas une durée
                // startsWith : le texte commence-t-il par « Enregistré » ?
                async () => (await texteDe(page, "#statut")).startsWith("Enregistré"),
                "confirmation",
            );
        } else {
            await pause(delai);                // pause de durée fixe
        }
        const lu = await texteDe(page, "#statut");           // ce que la page affiche alors
        const duree = Date.now() - depart;     // durée réellement passée à attendre
        const etiquette = String(delai).padEnd(5);   // padEnd : complète avec des espaces
        console.log(`2. attente ${etiquette} : ${duree} ms ->`, lu);
    }
} finally {
    await fermerNavigateur(navigateur, page);  // ferme Chrome quoi qu'il arrive
}
```

Résultat observé sur la machine de rédaction (la première de trois exécutions ; le tableau suivant donne l'étendue des trois) :

```text
1. clic trop tôt            : 0
2. attente 100   : 111 ms -> Enregistrement en cours...
2. attente 2000  : 2010 ms -> Enregistré : 0
2. attente état  : 434 ms -> Enregistré : 0
```

| Stratégie | Durée réellement attendue | Ce que le test lit | Verdict |
|---|---|---|---|
| Cliquer dès que la page est « complete », sans attendre l'application | 0 ms | `0` : le clic est perdu, les boutons ne sont pas encore branchés | Échec (observé 3 fois sur 3 ici ; sur une application dont la lenteur varie, l'échec devient intermittent) |
| Pause fixe de 100 ms | 111 à 122 ms | `Enregistrement en cours...` | Échec : trop court |
| Pause fixe de 2000 ms | 2006 à 2015 ms | `Enregistré : 0` | Correct, mais plus de quatre fois plus lent que nécessaire |
| Attente de l'état (`attendre`) | 434 à 449 ms | `Enregistré : 0` | Correct, et aussi rapide que la page le permet |

La valeur lue est `Enregistré : 0` et non `Enregistré : 1`, car ce script ne clique jamais sur « Ajouter » : le total reste à `0`.

Trois règles en découlent :

| Règle | Pourquoi |
|---|---|
| Attendre le **résultat** qu'on veut lire (un texte, un élément), jamais un temps | La durée varie d'une machine et d'un jour à l'autre, le résultat non |
| Distinguer « page chargée » de « application prête » | Le navigateur annonce la première seule ; la seconde, c'est à l'application de la signaler (`data-pret`) |
| Toujours un plafond, avec un message qui dit ce qu'on attendait | Sans plafond, un test bloqué ne finit jamais ; sans message, on ne sait pas pourquoi il a échoué |

Par exemple, `cliquer(page, "#inexistant")` a échoué au bout de 5048 ms avec le message `Délai dépassé (5000 ms) : élément #inexistant`.

## Écrire et lancer les tests

Chaque test repart de la page d'origine (`ouvrir` au début de `tester`) : l'ordre des tests n'a alors aucune importance et un test ne peut pas en perturber un autre. Un test qui échoue ne doit pas arrêter les suivants : on note l'échec, on prend une capture, on continue. Le programme rend à la fin un **code de sortie** : le nombre qu'un programme rend en se terminant. `0` signifie « tout va bien », toute autre valeur signale un échec. Enregistrez ce code sous le nom `tests.mjs`, dans le même dossier que `banc.mjs` et `compteur.html`.

```javascript
import assert from "node:assert/strict";                     // comparaisons qui échouent
import { mkdir } from "node:fs/promises";                    // création de dossier
import { join } from "node:path";                            // assemble un chemin de fichier
import { fileURLToPath } from "node:url";                    // adresse file:// vers chemin
import {
    appuyerSurEntree, attendre, capturer, cliquer, connecterPage,
    fermerNavigateur, lancerNavigateur, ouvrir, saisir, texteDe,
} from "./banc.mjs";                                         // nos outils

// Adresse file:// de la page à tester, située à côté de ce fichier
// (import.meta.url est l'adresse du fichier en cours ; URL calcule une adresse relative)
const ADRESSE = new URL("./compteur.html", import.meta.url).href;
const DOSSIER_IMAGES = fileURLToPath(new URL("./images/", import.meta.url));   // captures
await mkdir(DOSSIER_IMAGES, { recursive: true });            // crée le dossier des captures

const navigateur = await lancerNavigateur();                 // Chrome démarre, sans fenêtre
const page = await connecterPage();                          // on se branche sur sa page
const echecs = [];                                           // noms des tests qui ont échoué

// Exécute un test sur une page neuve, avec capture d'image en cas d'échec
async function tester(nom, corps) {
    const debut = Date.now();                  // heure de départ, pour mesurer la durée
    try {
        await ouvrir(page, ADRESSE);           // chaque test repart de la page d'origine
        await corps();                         // le test lui-même
        // Une erreur JavaScript dans la page fait échouer le test, même si le reste va bien
        // (splice(0) vide la liste des erreurs de la page et en renvoie le contenu)
        assert.deepEqual(page.exceptions.splice(0), [], "erreur JavaScript dans la page");
        console.log(`  ok     ${nom} (${Date.now() - debut} ms)`);   // réussi, avec sa durée
    } catch (erreur) {
        echecs.push(nom);                      // on retient le nom du test en échec
        const image = join(DOSSIER_IMAGES, `echec-${echecs.length}.png`);   // fichier image
        await capturer(page, image).catch(() => {});         // catch : ignore un échec ici
        console.log(`  ÉCHEC  ${nom}\n         ${erreur.message}\n         image : ${image}`);
    }
}

try {
    console.log("Tests de compteur.html");      // titre de la série
    await tester("le compteur démarre à 0", async () => {
        assert.equal(await texteDe(page, "#valeur"), "0");   // lit l'affichage du compteur
    });
    await tester("un clic sur Ajouter augmente le compteur de 1", async () => {
        await cliquer(page, "#ajouter");       // clic de souris sur le bouton
        assert.equal(await texteDe(page, "#valeur"), "1");   // un clic : le compteur vaut 1
    });
    await tester("le pas tapé au clavier est utilisé", async () => {
        await saisir(page, "#pas", "5");       // remplace le « 1 » du champ par « 5 »
        await cliquer(page, "#ajouter");       // premier clic : 0 + 5
        await cliquer(page, "#ajouter");       // second clic : 5 + 5
        assert.equal(await texteDe(page, "#valeur"), "10");  // deux clics de 5 font 10
    });
    await tester("la touche Entrée dans le champ pas ajoute aussi", async () => {
        await saisir(page, "#pas", "2");       // le pas devient 2
        await appuyerSurEntree(page);          // touche Entrée dans le champ
        assert.equal(await texteDe(page, "#valeur"), "2");   // sans clic : 0 + 2
    });
    await tester("Remettre à zéro efface le total", async () => {
        await cliquer(page, "#ajouter");       // total : 1
        await cliquer(page, "#ajouter");       // total : 2
        await cliquer(page, "#remettre");      // retour à 0
        assert.equal(await texteDe(page, "#valeur"), "0");   // le compteur est à 0
    });
    await tester("Enregistrer confirme après un court délai", async () => {
        await cliquer(page, "#ajouter");       // total : 1
        await cliquer(page, "#enregistrer");   // lance l'enregistrement (400 ms)
        // On attend l'état voulu : le texte de confirmation, pas un nombre de secondes
        await attendre(
            async () => (await texteDe(page, "#statut")) === "Enregistré : 1",   // le texte
            "le statut « Enregistré : 1 »",    // ce que dira l'erreur si on attend en vain
        );
    });
} finally {
    await fermerNavigateur(navigateur, page);  // ferme Chrome, même après une erreur
}

// Le bilan, puis le code de sortie lu par un script ou par un serveur d'intégration continue
console.log(echecs.length === 0 ? "Tout est vert." : `${echecs.length} test(s) en échec.`);
process.exitCode = echecs.length === 0 ? 0 : 1;              // code de sortie : 0 = succès
```

Un serveur d'intégration continue ne lit que ce code pour décider si les tests sont passés. Lancez les vérifications puis les tests :

```bash
# node --check lit le fichier et vérifie sa syntaxe, sans rien exécuter
node --check banc.mjs
node --check tests.mjs
# lance la série de tests (CHROME_PATH doit être défini dans ce terminal)
node tests.mjs
# affiche le code de sortie du dernier programme (sous PowerShell : $LASTEXITCODE)
echo $?
```

Sortie observée sur la machine de rédaction (29/10/2026) :

```text
Tests de compteur.html
  ok     le compteur démarre à 0 (373 ms)
  ok     un clic sur Ajouter augmente le compteur de 1 (356 ms)
  ok     le pas tapé au clavier est utilisé (343 ms)
  ok     la touche Entrée dans le champ pas ajoute aussi (335 ms)
  ok     Remettre à zéro efface le total (347 ms)
  ok     Enregistrer confirme après un court délai (760 ms)
Tout est vert.
```

Le code de sortie était `0`. La même série a aussi été lancée sous PowerShell (`$env:CHROME_PATH = ...` puis `node tests.mjs`) avec le même résultat.

Un test qui ne peut jamais échouer ne prouve rien : on vérifie donc que la série **sait** échouer. Cassons la page à dessein, en remplaçant dans `compteur.html` la ligne `total += Number(pas.value) || 0;` par une version qui ajoute 1 de trop :

```javascript
// Version cassée de la fonction ajouter : chaque ajout compte 1 de trop
total += (Number(pas.value) || 0) + 1;
```

## Capturer une image pour diagnostiquer un échec

Voici ce que la série a rendu sur la page cassée (observé ; le chemin de l'image est raccourci et le message, en anglais, est fourni par Node : `Expected values to be strictly equal` signifie « les valeurs devraient être strictement égales ») :

```text
Tests de compteur.html
  ok     le compteur démarre à 0 (389 ms)
  ÉCHEC  un clic sur Ajouter augmente le compteur de 1
         Expected values to be strictly equal:

'2' !== '1'

         image : ...\images\echec-1.png
  ÉCHEC  le pas tapé au clavier est utilisé
         Expected values to be strictly equal:

'12' !== '10'

         image : ...\images\echec-2.png
  ÉCHEC  la touche Entrée dans le champ pas ajoute aussi
         Expected values to be strictly equal:

'3' !== '2'

         image : ...\images\echec-3.png
  ok     Remettre à zéro efface le total (345 ms)
  ÉCHEC  Enregistrer confirme après un court délai
         Délai dépassé (5000 ms) : le statut « Enregistré : 1 »
         image : ...\images\echec-4.png
4 test(s) en échec.
```

Le code de sortie était `1`. Trois enseignements :

| Constat | Explication |
|---|---|
| Quatre tests sur six échouent | Chacun lit un total faux : `2` au lieu de `1`, `12` au lieu de `10`, `3` au lieu de `2`, et le texte `Enregistré : 1` n'arrive jamais |
| « Remettre à zéro » réussit malgré l'erreur de programmation (le **bogue**) | Ce test ne vérifie que le retour à `0`, que l'ajout trop généreux ne change pas : un test peut être vert et laisser passer un défaut, d'où l'intérêt d'en avoir plusieurs |
| Le dernier message est clair | Grâce au message de `attendre`, on lit **ce qui était attendu**, pas un simple « échec » |

Une capture d'image montre l'état de la page **au moment de l'échec**. Celle du premier test montre « Valeur : 2 » au-dessus du champ « Pas : 1 » et des trois boutons, sur un fond blanc (le fichier fait 800 × 600 pixels, environ 8,6 Ko, dimensions lues dans son en-tête) : on voit d'un coup d'œil que l'affichage est fidèle à la valeur lue et que c'est le calcul qui est faux, puisqu'un seul ajout avec un pas de 1 devrait donner 1. Sur un serveur d'intégration continue, où personne ne regarde, la capture est la seule trace visuelle : le service peut la conserver comme **artefact** (un fichier produit par l'exécution et gardé après coup).

La taille mérite une précaution. Avec l'option `--window-size=800,600`, la capture mesurait 782 × 470 pixels sur la machine de rédaction : cette option règle la fenêtre (cadre compris), pas la page. La commande `Emulation.setDeviceMetricsOverride`, utilisée par `connecterPage`, fixe la taille de la **page** : c'est elle qui a donné 800 × 600.

Pensez à exclure le dossier `images/` du dépôt avec [un fichier `.gitignore`](/?c=qualite-performance-et-outils&s=git&p=gitignore) : les captures ne se versionnent pas (le **dépôt** est le dossier dont Git suit les modifications).

## Fermer Chrome proprement

Chrome est un programme séparé : s'il reste ouvert après le test, il occupe le port, de la mémoire et un dossier de profil. `fermerNavigateur` suit trois temps : la commande `Browser.close` (arrêt poli), un délai de 10 secondes, puis `processus.kill()` (arrêt forcé par le PID de ce Chrome), avant de supprimer le profil. Elle est appelée depuis un bloc `finally`, qui s'exécute que les tests aient réussi, échoué ou planté.

Ce que l'on a observé sur la machine de rédaction (29/10/2026) :

| Situation | Observé |
|---|---|
| Arrêt poli (`Browser.close`), cas courant | Chrome s'arrête moins de 3 secondes après la commande (une trentaine d'essais) |
| Arrêt poli, cas lent | 6 fois sur une cinquantaine d'exécutions, Chrome n'était arrêté que 25 à 29 secondes après son lancement (au lieu de 2 à 4), sans cause établie : il refermait ses processus enfants un par un |
| `processus.kill()` sur un Chrome en marche | Chrome disparaît en 0,1 à 0,4 s |
| `processus.kill()` pendant un arrêt poli déjà lent | N'a pas raccourci l'attente (observé 3 fois, avec des délais de 5 à 8 secondes avant le `kill()`) : il faut prévoir un délai global de test généreux |
| Programme Node qui plante ou se termine sans fermer Chrome | Sous Windows, Chrome s'est arrêté avec lui (observé 3 fois). Sous Linux et macOS, le comportement n'a pas été vérifié ici : ne comptez pas dessus |
| Programme qui oublie de fermer Chrome sans planter | Node ne se termine jamais : lancé avec la commande `timeout` (qui arrête un programme après une durée donnée, voir [un script qui s'arrête proprement](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout)) réglée sur 15 secondes, il a été arrêté de force (code de sortie 124) |
| Dossier de profil après un plantage | Il reste sur le disque (environ 10 Mo chacun) : ils s'accumulent |

Un `kill()` ne tue que le processus **principal** de Chrome. Ses processus enfants (un par onglet, un pour le réseau, etc.) s'arrêtent d'eux-mêmes juste après : sur la machine de rédaction, il en restait quelques-uns une seconde plus tard, plus aucun trois secondes plus tard. Sous Windows, la commande `taskkill /pid <numéro> /t /f` ([documentation Microsoft](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/taskkill)) arrête un processus **et** tous ses descendants (`/t`) de force (`/f`), toujours à partir de son PID exact (vérifié ici sur le Chrome du banc), jamais de son nom : arrêter « tous les `chrome.exe` » fermerait aussi le navigateur personnel de l'utilisateur.

## Playwright, Puppeteer ou un banc maison

Des bibliothèques existent pour ce travail : [Playwright](https://playwright.dev/docs/intro) et [Puppeteer](https://pptr.dev/). Une **bibliothèque** est un lot de code écrit par d'autres que l'on installe et que l'on appelle depuis son programme. Elles reposent sur les mêmes idées que le banc de ce chapitre (un navigateur piloté par un protocole), et ajoutent tout ce qui rend l'usage confortable.

| Critère | Banc maison (ce chapitre) | Puppeteer | Playwright |
|---|---|---|---|
| Installation | Rien (Node et Chrome suffisent) | Un paquet (et un navigateur, selon sa documentation) | Un paquet et les navigateurs qu'il télécharge |
| Navigateurs pilotés | Chrome | Chrome en priorité | Plusieurs familles de navigateurs, selon sa documentation |
| Attentes automatiques avant un clic | À écrire (`attendre`) | Partielles, selon la documentation | Intégrées, selon la documentation |
| Lanceur de tests, rapports, traces | À écrire | À ajouter | Fournis, selon la documentation |
| Maintenance du code de pilotage | À votre charge | Par ses auteurs | Par ses auteurs |
| Intérêt principal | Comprendre ; zéro dépendance | Scripts Chrome (captures, PDF) | Suites de tests d'une équipe |

Les cellules « selon la documentation » indiquent des fonctions à vérifier dans la documentation officielle liée, qui évolue.

| Situation | Choix conseillé |
|---|---|
| Apprendre ce qui se passe sous le capot | Le banc maison |
| Un ou deux scénarios sur une page que l'on maîtrise, sans pouvoir installer de paquet | Le banc maison |
| Une suite de tests qui grossit, plusieurs développeurs, plusieurs navigateurs | Playwright |
| Un script isolé qui pilote Chrome (captures, génération de PDF) | Puppeteer |
| Pages que vous ne maîtrisez pas | Une bibliothèque maintenue **et** le chapitre sur [les navigateurs automatisés attaqués](/?c=securite&s=securite-offensive&p=attaques-navigateur-automatise) |

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| Chrome reste ouvert après le test | Il garde le port et la mémoire. Sous Windows, Chrome s'est arrêté avec Node lors des essais ; ailleurs, le comportement n'a pas été vérifié. Toujours fermer dans un `finally`, voir [Fermer Chrome proprement](#fermer-chrome-proprement) |
| Port déjà pris | Observé : lancé sur un port déjà occupé, Chrome démarre quand même, signale `bind() returned an error` dans son journal, puis écoute à l'adresse `[::1]` (l'écriture IPv6 de la machine elle-même, voir [les adresses IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)) pendant que le test se connecte à `127.0.0.1`, donc à l'autre programme. Le banc contrôle le port avec `portLibre` avant de lancer |
| Profil partagé entre deux Chrome | Observé : un second Chrome lancé avec le même dossier de profil rend la main en 0,24 s et laisse le premier tourner, avec ses options à lui. Un profil neuf par lancement |
| Le profil par défaut de l'utilisateur | Il contient ses mots de passe, ses cookies, ses extensions : un test ne doit jamais s'en servir. Toujours `--user-data-dir` vers un dossier jetable |
| Des profils temporaires qui s'accumulent | Après un plantage, le dossier reste (environ 10 Mo observés). Les nettoyer régulièrement |
| Prendre la première cible de `/json/list` | La liste contient aussi des pages internes de Chrome : filtrer sur `type === "page"` |
| Pause fixe au lieu d'une attente | Trop courte : échec aléatoire ; trop longue : suite lente. Attendre un état, voir [la section dédiée](#attendre-un-etat-plutot-que-dormir-un-delai-fixe) |
| Page chargée mais application pas prête | Observé : un clic envoyé dès `readyState` à `"complete"` est perdu (le compteur reste à `0`). Un marqueur `data-pret` posé par l'application |
| Taille de page non fixée | Les captures diffèrent d'une machine à l'autre ; observé : `--window-size=800,600` a donné 782 × 470. Utiliser `Emulation.setDeviceMetricsOverride` |
| Une erreur JavaScript silencieuse dans la page | Elle ne fait échouer aucune assertion de lecture. Collecter `Runtime.exceptionThrown`, comme le fait le banc |
| Une exception dans `Runtime.evaluate` qu'on ne regarde pas | La réponse n'est pas une `error` mais un `result` avec `exceptionDetails` : il faut le tester, comme `evaluer` |
| Sélecteur fragile (texte, position) | Le moindre changement de texte casse le test, voir [les tests end-to-end](/?c=tests&p=tests-end-to-end) |
| Tests qui dépendent les uns des autres | Un échec en cascade masque la cause. Chaque test rouvre la page d'origine |
| Un port de débogage ouvert à d'autres | Qui s'y connecte contrôle tout le navigateur. Le port n'est utile qu'à la machine locale : ne le redirigez pas vers l'extérieur (voir [les tunnels SSH et la redirection de port](/?c=infrastructure-devops&s=reseaux&p=tunnel-ssh-et-redirection-de-port)) |
| `--no-sandbox` dans un **conteneur** (un environnement isolé, voir [Docker : les concepts de base](/?c=infrastructure-devops&s=docker&p=concepts-de-base)) | Voir le paragraphe ci-dessous |
| Piloter des pages que l'on ne contrôle pas | Une page hostile s'exécute avec les capacités d'un vrai navigateur : voir [attaquer et défendre un navigateur automatisé](/?c=securite&s=securite-offensive&p=attaques-navigateur-automatise) |

**La sandbox.** Chrome enferme chaque onglet dans un environnement restreint, la **sandbox** (« bac à sable ») : si une page malveillante exploite une faille, elle ne peut pas toucher au reste de l'ordinateur. Dans certains conteneurs, Chrome ne peut pas la mettre en place et refuse de démarrer. L'option `--no-sandbox` supprime l'obstacle, mais **désactive cette protection** : le code de la page tourne alors avec tous les droits du programme. À réserver à des pages que l'on a écrites soi-même, dans un conteneur jetable et sans secret. Mieux vaut régler le conteneur (utilisateur non privilégié, voir [Docker : bonnes pratiques et sécurité](/?c=infrastructure-devops&s=docker&p=bonnes-pratiques-et-securite)) que retirer la protection. Cette option n'a pas pu être essayée lors de la rédaction (aucun conteneur sur la machine).

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Un profil neuf par lancement, supprimé à la fin | Aucune trace d'un test sur le suivant, aucun risque pour le profil de l'utilisateur |
| Vérifier le chemin de Chrome et la disponibilité du port avant de lancer | Un message clair vaut mieux qu'un délai dépassé mystérieux |
| Fermer Chrome dans un `finally` | Le navigateur est refermé même si un test plante |
| Attendre un état avec un plafond et un message | Test rapide quand tout va bien, diagnostic clair quand tout va mal |
| Faire déclarer à l'application qu'elle est prête (`data-pret`) | On cesse de deviner le bon moment |
| Désigner les éléments par `id` ou `data-testid` | Les tests survivent aux changements de texte et de mise en page |
| Fixer la taille de la page | Captures comparables d'une machine à l'autre |
| Repartir d'une page neuve à chaque test | Des tests indépendants, dans n'importe quel ordre |
| Collecter les erreurs JavaScript de la page | Une page qui affiche juste mais plante en silence est détectée |
| Capturer une image à chaque échec, la conserver comme artefact | Voir l'état de la page sans pouvoir la rejouer |
| Faire échouer volontairement la série une fois | Vérifier que les tests savent détecter un bogue |
| Rendre un code de sortie non nul en cas d'échec | L'intégration continue lit ce code pour décider |
| Limiter les tests de navigateur aux parcours critiques | Ils sont plus lents que les tests unitaires, voir [la pyramide de test](/?c=tests&p=pyramide-de-test) |
| Passer à Playwright quand la suite grossit | Les attentes automatiques, les rapports et les traces évitent de les écrire soi-même |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un navigateur sans fenêtre est un vrai navigateur que l'on pilote sans écran : il convient aux serveurs d'intégration continue. Chrome ouvre un port de débogage ; le test parle au navigateur par le Chrome DevTools Protocol, des messages JSON échangés sur une connexion WebSocket : des commandes (avec un `id`), des réponses (même `id`) et des événements (sans `id`). Un banc minimal tient en environ 220 lignes de Node : lancer Chrome avec un profil neuf, choisir la cible de type `page`, envoyer `Page.navigate`, `Runtime.evaluate`, `Input.dispatchMouseEvent`, `Input.dispatchKeyEvent` et `Page.captureScreenshot`, puis fermer. On attend un état (jamais une durée), on vérifie avec des assertions et on prend une capture à chaque échec. |
| **Pièges à éviter** | Chrome orphelin ou jamais fermé ; port déjà pris (Chrome peut alors écouter ailleurs que là où le test se connecte) ; profil partagé ou profil de l'utilisateur ; première cible de `/json/list` prise sans filtrer ; pause fixe ; page chargée mais application pas prête ; taille de page non fixée ; erreur JavaScript silencieuse ; `--no-sandbox` hors d'un conteneur jetable ; sélecteurs fragiles. |
| **Bonnes pratiques** | Un profil neuf par lancement et un `finally` qui ferme Chrome ; contrôler chemin et port avant de lancer ; attendre l'état voulu avec un plafond et un message ; marqueur `data-pret` ; `id` ou `data-testid` ; taille de page fixée ; une page neuve par test ; capture d'image à chaque échec ; code de sortie non nul en cas d'échec ; vérifier que la série sait échouer ; Playwright dès que la suite grossit. |
