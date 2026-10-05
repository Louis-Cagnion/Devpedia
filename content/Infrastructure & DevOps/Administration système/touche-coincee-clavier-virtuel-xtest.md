---
order: 10
---

# Touche coincée : le clavier virtuel XTEST et `xdotool`

Pour tester une application graphique (un jeu, un programme 3D comme celui du [chapitre sur la boucle de rendu](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), un script peut « appuyer » sur des touches à la place d'une personne : maintenir une flèche pendant une seconde et mesurer jusqu'où l'objet est allé, par exemple. Sous Linux, l'outil qui le fait s'appuie sur un **clavier virtuel**. Ce chapitre explique comment il fonctionne, le piège qui laisse une touche **enfoncée pour toute la machine**, comment le reconnaître, et comment s'en prémunir.

## Un clavier invisible : XTEST et `xdotool`

Sous Linux, le **serveur d'affichage** est le programme qui gère l'écran, le clavier et la souris, et qui distribue clavier et souris aux fenêtres ([X11](https://www.x.org/wiki/) est le plus répandu). Il prévoit des **extensions** (fonctions facultatives du protocole que les programmes utilisent pour lui parler). **XTEST** ([spécification](https://www.x.org/releases/current/doc/xextproto/xtest.html)) en est une : elle permet à un programme d'**injecter des événements** comme s'ils venaient d'un vrai clavier, via un **clavier virtuel**. [`xdotool`](https://github.com/jordansissel/xdotool) est la commande qui l'utilise.

Une frappe se compose de **deux événements** : l'**appui** (*keydown*) puis le **relâchement** (*keyup*). Tant que le relâchement n'est pas arrivé, le serveur considère la touche comme **maintenue**.

| Commande | Événements envoyés | Effet |
|---|---|---|
| `xdotool key Escape` | appui, puis relâchement | une frappe complète |
| `xdotool keydown Left` | appui seul | la flèche gauche **reste enfoncée** |
| `xdotool keyup Left` | relâchement seul | la flèche gauche est relâchée |

Maintenir une touche pendant un temps donné s'écrit donc en trois temps :

```bash
xdotool keydown Left   # la touche est enfoncée
sleep 1                # l'application la voit maintenue pendant 1 seconde
xdotool keyup Left     # relâchement : sans cette ligne, la touche reste enfoncée
```

## Le piège : une touche enfoncée pour toute la machine

Si le script s'arrête **entre** `keydown` et `keyup`, le relâchement n'est jamais envoyé :

```
temps  ──────────────────────────────────────────────────────►
script   keydown ─── travail ─── ✕ interrompu       keyup (jamais exécuté)
serveur  touche enfoncée ────────────────────────────────────────► toujours enfoncée
```

Le serveur répète alors la touche **automatiquement** (l'**auto-répétition** : une touche maintenue produit des frappes en série, comme quand on garde le doigt dessus), et il l'envoie à la fenêtre qui a le **focus** (celle qui reçoit le clavier à cet instant). Ce n'est plus l'application testée : c'est l'éditeur, le terminal, tout ce qui est au premier plan, même une fois le test terminé.

| Ce qui interrompt le script | Pourquoi le `keyup` est perdu |
|---|---|
| `Ctrl-C` | le script reçoit le **signal** `SIGINT` (un message que le système envoie à un programme) et s'arrête |
| `timeout` | il envoie le signal `SIGTERM` à la fin du délai |
| `kill PID` | signal `SIGTERM` |
| `kill -9 PID`, mémoire saturée (le système tue le programme) | signal `SIGKILL` : le programme n'a **aucune** chance de réagir |
| Plantage du script ou erreur de syntaxe entre les deux lignes | la ligne `keyup` n'est jamais atteinte |

## Reconnaître une touche coincée

Les symptômes : une lettre ou une flèche qui se répète sans fin dans une fenêtre sans rapport, des caractères qui s'écrivent seuls. Deux façons de le vérifier :

| Méthode | Ce qu'elle montre |
|---|---|
| `xinput query-state ID` | **`xinput`** liste (`xinput list`) et interroge les périphériques d'entrée ; sur le clavier virtuel (nommé « Virtual core XTEST keyboard »), une touche coincée apparaît comme `key[9]=down` |
| `XQueryKeymap` | fonction de **Xlib** (la bibliothèque C qui parle au serveur X) : elle remplit un tableau de 32 octets, soit **256 cases à 0 ou 1**, une par **code de touche** (le numéro que le serveur donne à chaque touche physique ; 9 pour Échap sur un clavier standard) |

```c
/* Renvoie 1 si la touche de code « keycode » est enfoncée selon le serveur X, 0 sinon. */
static int key_is_down(Display *display, unsigned int keycode)
{
	char keys[32];                      /* 32 octets = 256 cases, une par code de touche */

	XQueryKeymap(display, keys);        /* le serveur remplit le tableau */
	return ((unsigned char)keys[keycode / 8] >> (keycode % 8)) & 1;   /* octet keycode/8, bit keycode%8 */
}
```

Le code d'une touche dépend du clavier et de sa disposition : on le demande à Xlib (`XKeysymToKeycode`, qui convertit le **symbole** d'une touche, par exemple celui d'Échap, en code) plutôt que de l'écrire en dur.

## La relâcher

Le plus simple, à la main : `xdotool keyup Escape`. Dans un programme C, on envoie le même événement par XTEST :

```c
/* Relâche la touche si elle est coincée. Renvoie 1 si elle l'était, 0 sinon, -1 en cas d'erreur. */
int release_if_stuck(unsigned int keycode)
{
	Display *display = XOpenDisplay(NULL);   /* NULL : serveur désigné par la variable DISPLAY */
	const char *shown = getenv("DISPLAY");   /* seulement pour le message d'erreur */
	int stuck;

	if (!display)
	{
		fprintf(stderr, "serveur X injoignable (variable DISPLAY : %s)\n", shown ? shown : "absente");
		return -1;
	}
	stuck = key_is_down(display, keycode);
	if (stuck && !XTestFakeKeyEvent(display, keycode, 0, 0))   /* 0 : relâchement (keyup) */
	{
		fprintf(stderr, "extension XTEST indisponible : touche %u non relachee\n", keycode);
		XCloseDisplay(display);
		return -1;
	}
	XFlush(display);                         /* envoie l'ordre sans attendre */
	XCloseDisplay(display);
	return stuck;
}
```

Testée sous **Xvfb** (un serveur X sans écran, qui permet de tester sans affichage réel) : avant l'appui, `key_is_down` renvoie 0 ; après un `keydown` seul, 1 ; `release_if_stuck` renvoie alors 1 et, juste après, la touche est de nouveau à 0 ; un second appel renvoie 0 (rien à faire).

## Garantir le relâchement : `trap`

La parade est de prévoir le relâchement **avant** d'appuyer. La commande `trap` ([voir le chapitre sur les processus](/?c=shells&s=bash&p=gestion-des-processus)) enregistre une action que le script exécutera à sa sortie, quelle qu'en soit la raison :

```bash
release() { xdotool keyup Left; }   # sans effet si la touche est déjà relâchée
trap release EXIT                   # EXIT : à chaque sortie du script, normale ou causée par un signal

xdotool keydown Left
sleep 30 &                          # la commande longue (ici sleep, en vrai l'application testée)...
wait $!                             # ...est attendue par « wait » ($! : numéro du dernier processus lancé)
```

Testé avec un relâchement remplacé par une ligne écrite dans un fichier (`xdotool` n'est pas installé sur la machine de test) :

| Interruption | Résultat avec `trap release EXIT` |
|---|---|
| `kill` (signal `SIGTERM`) | relâché **une fois**, en 1 s |
| `timeout 2 commande` | relâché **une fois** |
| `kill -9` (signal `SIGKILL`) | **jamais** relâché |

> **Piège (le `trap` est retardé) :** bash n'exécute le `trap` qu'**après la fin de la commande en cours**. Avec un simple `sleep 30` à la place de `sleep 30 & wait $!`, chaque test a attendu les 30 secondes avant de relâcher (la série complète a duré plus de 4 minutes). `wait` est au contraire interrompu tout de suite par un signal : on lance donc la commande longue en arrière-plan, puis on l'attend avec `wait`.

> **Piège (exécuté deux fois) :** `trap release EXIT INT TERM` relâche **deux fois** sur un `SIGTERM` (une pour le signal, une pour la sortie qui suit). `trap release EXIT` suffit, et le gestionnaire doit rester **sans danger s'il tourne deux fois** (relâcher une touche déjà relâchée ne fait rien).

> **Piège (`SIGKILL`) :** aucun `trap` ne rattrape `kill -9` ni l'arrêt forcé par un manque de mémoire. Ne jamais tuer un test de cette façon tant qu'une touche est enfoncée ; et **au démarrage** du test suivant, appeler `release_if_stuck` (ci-dessus) ou `xdotool keyup` sur chaque touche utilisée, pour réparer un arrêt brutal précédent.

## Envoyer une touche à la bonne fenêtre : un protocole sûr

Avec la version de `xdotool` testée, une frappe visant une fenêtre qui a **déjà le focus** n'est pas livrée à cette fenêtre en particulier : elle part par le clavier virtuel XTEST, donc vers **n'importe quelle fenêtre qui a le focus à cet instant**. Si l'utilisateur a changé de fenêtre entre-temps, la frappe (par exemple Échap) arrive dans l'éditeur ou le terminal.

Trois commandes de `xdotool` permettent de vérifier la cible avant d'agir. Une fenêtre y est désignée par son **identifiant** (un nombre que le serveur X attribue à chaque fenêtre) ; le **PID** est le numéro du processus qui possède la fenêtre.

| Commande | Question posée |
|---|---|
| `xdotool getwindowname ID` | la fenêtre existe-t-elle encore ? (échoue sinon) |
| `xdotool getwindowfocus` | quelle fenêtre a le focus ? (doit être `ID`) |
| `xdotool getwindowpid ID` | à quel processus appartient-elle ? (doit être le PID de l'application testée) |

```bash
# Envoie Échap à la fenêtre $1 de l'application de PID $2, une seule fois, après trois vérifications.
send_escape_once() {
	local win=$1 pid=$2 focus owner

	xdotool getwindowname "$win" > /dev/null 2>&1 \
		|| { echo "fenêtre $win introuvable" >&2; return 1; }
	focus=$(xdotool getwindowfocus)
	[ "$focus" = "$win" ] \
		|| { echo "fenêtre $win sans le focus (focus : $focus)" >&2; return 1; }
	owner=$(xdotool getwindowpid "$win")
	[ "$owner" = "$pid" ] \
		|| { echo "fenêtre $win au PID $owner, attendu $pid" >&2; return 1; }
	xdotool key --window "$win" Escape
}
```

Règles du protocole :

- **Une seule frappe**, jamais de deuxième essai si une vérification échoue ou si l'application ne réagit pas : une frappe répétée au hasard est le même danger que la touche coincée. En cas d'échec, on **arrête l'application par un signal** (`kill PID`) plutôt que de réessayer.
- Chaque vérification a **son propre message**, qui nomme la fenêtre, la valeur trouvée et la valeur attendue.

**Prouver ce que le clavier virtuel a vraiment envoyé.** `xinput test-xi2 --root` affiche en direct chaque événement du clavier, toutes fenêtres confondues. On le lance en arrière-plan dans un fichier pendant le test, puis on compte :

| À compter dans le fichier | Résultat attendu pour une frappe correcte |
|---|---|
| appuis (`RawKeyPress`) | 1 |
| relâchements (`RawKeyRelease`) | 1 |
| appuis de plus (auto-répétition) | 0 |

Un appui sans relâchement, ou plusieurs appuis de suite, signale une touche coincée ou répétée.

## Sur d'autres machines

| Situation | Comportement |
|---|---|
| Serveur X11 (cas courant) | `xdotool` et XTEST fonctionnent |
| Wayland (autre serveur d'affichage, de plus en plus courant) | `xdotool` n'atteint que les applications lancées par **XWayland** (la couche de compatibilité X11) ; les autres demandent un autre outil |
| Machine sans écran (serveur, conteneur, intégration continue) | `xvfb-run commande` lance un serveur X virtuel (Xvfb) le temps de la commande |
| Variable `DISPLAY` absente ou fausse | `xdotool` et `XOpenDisplay` échouent : le message doit nommer la variable, comme dans `release_if_stuck` |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `xdotool` injecte des touches par l'extension XTEST du serveur X, via un clavier virtuel. Une frappe est un appui puis un relâchement ; si le script s'arrête entre les deux, la touche reste enfoncée pour toute la machine et se répète dans la fenêtre qui a le focus. On la reconnaît avec `xinput query-state` ou `XQueryKeymap`, on la relâche avec `xdotool keyup` ou `XTestFakeKeyEvent`. |
| **Outils utilisables** | `xdotool key`/`keydown`/`keyup`, `xinput list`/`query-state`, `XQueryKeymap`, `XTestFakeKeyEvent`, `trap`, `wait`, `timeout`, `xvfb-run`. |
| **Pièges à éviter** | Un `keydown` sans `keyup` garanti. `trap` retardé par une commande longue lancée au premier plan. `trap` sur `EXIT INT TERM` exécuté deux fois. `kill -9` sur un test qui tient une touche. Code de touche écrit en dur. Variable `DISPLAY` absente non signalée. |
| **Bonnes pratiques** | Poser `trap release EXIT` avant le `keydown` ; lancer la commande longue en arrière-plan puis `wait $!`. Relâcher chaque touche utilisée au démarrage du test suivant. Demander le code de touche à Xlib. Tester sous Xvfb plutôt que sur l'écran de travail. |
