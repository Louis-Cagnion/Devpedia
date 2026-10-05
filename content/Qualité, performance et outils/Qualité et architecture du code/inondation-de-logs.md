---
order: 10
---

# L'inondation de logs : signaler chaque cause une seule fois

Un **log** (ou journal) est la trace écrite par un programme pour dire ce qu'il fait et ce qui ne va pas. En C, les messages d'erreur partent sur **`stderr`**, le flux d'erreur standard (le descripteur numéro 2, voir [les appels système et les descripteurs](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs)), qui s'affiche dans le terminal ou se redirige vers un fichier. Une **inondation de logs** survient quand le même message est écrit des milliers de fois : l'information utile est noyée, et le programme ralentit à écrire. Ce chapitre montre comment elle arrive dans une boucle qui tourne en continu, et comment l'éviter avec une liste bornée de causes déjà signalées.

## Pourquoi une boucle répète son message

Une **boucle de rendu** est la boucle d'un programme graphique : à chaque tour, elle dessine une image à l'écran (voir [la boucle de rendu](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)). Un message d'erreur placé dans cette boucle est donc écrit **à chaque image**.

```c
/* Exécuté à chaque image : un message d'erreur par tour de boucle. */
GLint loc = glGetUniformLocation(program, "light_dir");
if (loc == -1)
	fprintf(stderr, "uniform light_dir absent\n");
```

Ici, un **`uniform`** est une valeur que le programme C fixe pour le **shader** (le petit programme exécuté par la carte graphique), et `glGetUniformLocation` renvoie `-1` quand le nom n'existe pas : voir [les shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#les-shaders-les-programmes-de-la-carte-graphique). Deux causes sont possibles : une faute de frappe dans le nom, ou une variable que le compilateur a supprimée parce qu'elle ne sert à rien dans le shader.

| Cadence de la boucle | Lignes écrites par seconde | Lignes en 1 heure |
|---|---|---|
| 60 images/s (écran à 60 Hz, [synchronisation verticale](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#la-synchronisation-verticale-vsync) active) | 60 | 216 000 |
| Environ 150 images/s (sans synchronisation) | 150 | 540 000 |

Les conséquences s'enchaînent :

- le message **masque** les autres, parce que la première erreur utile défile hors de l'écran en quelques secondes ;
- l'écriture dans un terminal est **lente** : elle peut devenir plus coûteuse que le dessin lui-même ;
- redirigée vers un fichier, elle le fait **grossir sans fin** jusqu'à remplir le disque.

> **Piège :** croire qu'un message d'erreur est toujours inoffensif. Dans une boucle, c'est la fréquence qui fait le dégât, pas le contenu du message.

## Une seule fois par cause : la liste bornée

Le message d'erreur reste utile **une fois**. La solution consiste à retenir les causes déjà signalées et à ne plus écrire pour elles. Une **cause** est ici un texte court qui identifie le problème (`"uniform:light_dir"`) : deux causes différentes sont signalées chacune une fois, une même cause jamais deux.

```c
#include <stdio.h>
#include <string.h>

#define MAX_CAUSES 16                      /* nombre maximal de causes retenues */
#define CAUSE_SIZE 64                      /* longueur maximale d'une cause, '\0' compris */

/* Renvoie 1 la première fois qu'une cause est vue, 0 ensuite (ou si la liste est pleine). */
static int	first_report(const char *cause)
{
	static char	seen[MAX_CAUSES][CAUSE_SIZE];   /* static : conservé d'un appel à l'autre */
	static int	count;                          /* static : démarre à 0, jamais réinitialisé */

	for (int i = 0; i < count; i++)
		if (strcmp(seen[i], cause) == 0)
			return (0);                     /* déjà signalée : on se tait */
	if (count == MAX_CAUSES)
		return (0);                         /* liste pleine : la mémoire reste bornée */
	snprintf(seen[count++], CAUSE_SIZE, "%s", cause);
	return (1);
}

/* Dans la boucle de rendu : */
if (loc == -1 && first_report("uniform:light_dir"))
	fprintf(stderr, "uniform light_dir absent\n");
```

Le mot-clé **`static`** devant une variable locale la fait vivre pendant tout le programme au lieu de disparaître à la fin de la fonction (voir [la mémoire en C](/?c=langages-de-programmation&s=c&p=memoire)) : c'est ce qui permet à la liste de se souvenir d'un appel à l'autre. La fonction `strcmp` compare deux chaînes et renvoie 0 si elles sont identiques ; `snprintf` copie en s'arrêtant à la taille donnée.

Mesuré sur 1 000 images avec deux uniforms absents (`light_dir` et `shininess`) :

| | Lignes sur `stderr` |
|---|---|
| Message à chaque image | 2 000 |
| Une seule fois par cause | 2 |

La mesure se fait simplement en comptant les lignes : `./programme 2>&1 | wc -l` redirige `stderr` vers la sortie standard (`2>&1`) puis compte les lignes (`wc -l`).

## Les limites de cette solution

| Choix | Effet | Quand l'utiliser |
|---|---|---|
| Liste de causes déjà signalées (ci-dessus) | Chaque cause apparaît une fois, mémoire bornée | Erreurs en nombre fini et connu à l'avance |
| Au plus un message par seconde | Le message revient régulièrement, utile pour un problème qui disparaît puis revient | Programme long, où « toujours en panne » compte |
| Compteur affiché à la fin | « uniform light_dir absent (répété 3 400 fois) » en une ligne à la fermeture | Quand la fréquence est elle-même une information |

> **Piège :** une liste pleine ne signale plus rien. Avec 16 places, la dix-septième cause différente est silencieuse. Prévoir un plafond largement supérieur au nombre de causes attendues, et envisager d'écrire une dernière ligne « trop de causes différentes, messages suivants supprimés » lorsque la liste se remplit.
>
> **Piège :** une cause trop longue est tronquée à `CAUSE_SIZE - 1` caractères par `snprintf` : deux causes qui ne diffèrent qu'après ce seuil sont confondues. Garder des identifiants de cause courts (`"uniform:light_dir"`), pas le texte complet du message.
>
> **Bonne pratique :** ne jamais écrire sans limite sur `stderr` depuis une boucle qui tourne à chaque image, à chaque requête ou à chaque ligne lue. Se demander, en écrivant le message : « combien de fois cette ligne peut-elle s'exécuter dans la durée de vie du programme ? »

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un message d'erreur placé dans une boucle est écrit à chaque tour : 60 à 150 lignes par seconde dans une boucle de rendu. Il masque les autres messages, ralentit le programme et peut remplir le disque. On le signale une seule fois par cause. |
| **Outils utilisables** | Une liste bornée de causes déjà signalées (tableau `static` et `strcmp`) ; la redirection `2>&1` et `wc -l` pour compter les lignes produites. |
| **Pièges à éviter** | Écrire sur `stderr` à chaque image ; une liste pleine qui se tait sans prévenir ; des causes longues tronquées et confondues. |
| **Bonnes pratiques** | Une ligne de log par cause, jamais par occurrence ; borner la mémoire de la liste ; mesurer le nombre de lignes produites sur une exécution réelle. |
