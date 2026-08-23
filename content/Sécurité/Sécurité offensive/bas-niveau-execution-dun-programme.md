---
order: 1
---

# Comment un programme s'exécute réellement

Écrire une fonction, appeler une autre fonction, déclarer une variable : ces gestes sont familiers dans n'importe quel langage. Ce chapitre regarde ce qui se passe réellement, une fois le code compilé, dans le processeur et la mémoire de l'ordinateur. C'est le socle indispensable pour comprendre comment une faille de sécurité bas niveau (traitée dans les chapitres suivants) devient exploitable.

## Le processeur ne travaille qu'avec des registres

Un **registre** est un petit espace de stockage directement intégré au processeur, bien plus rapide d'accès que la RAM. Un processeur x86-64 (l'architecture la plus courante sur PC) en expose plusieurs, chacun avec un rôle habituel :

| Registre | Rôle habituel |
|---|---|
| `rip` | Adresse de la **prochaine instruction** à exécuter (*instruction pointer*) |
| `rsp` | Adresse du **sommet de la pile** (*stack pointer*), détaillée plus bas |
| `rbp` | Adresse de **référence de la fonction en cours** (*base pointer*), pour retrouver ses variables locales |
| `rax`, `rbx`, `rcx`, ... | Registres généraux : calculs, valeurs temporaires, valeur de retour d'une fonction (`rax`) |

Un programme compilé n'est, au fond, qu'une longue suite d'instructions très simples (« copie cette valeur dans ce registre », « additionne ces deux registres », « saute à cette adresse si cette condition est vraie ») que `rip` parcourt une par une.

## La pile (stack) : où vivent les appels de fonction

La **pile** (*stack*) est une zone de mémoire qui stocke, pour chaque fonction en cours d'exécution, tout ce dont elle a besoin : ses variables locales, et l'adresse à laquelle revenir une fois terminée. Chaque appel de fonction empile un nouveau bloc, appelé **frame**, au sommet de la pile ; chaque retour de fonction le dépile.

```text
appelerA() appelle appelerB() qui appelle appelerC() :

Sommet de la pile (rsp)  -->  [ Frame de C : variables locales de C, adresse de retour vers B ]
                              [ Frame de B : variables locales de B, adresse de retour vers A ]
                              [ Frame de A : variables locales de A, adresse de retour vers main ]
Bas de la pile                [ ... ]
```

L'**adresse de retour**, sauvegardée automatiquement à chaque appel, est ce qui permet au programme de savoir où reprendre une fois la fonction terminée : c'est précisément cette valeur qu'une corruption mémoire (chapitre suivant) peut chercher à écraser.

## Le tas (heap) : la mémoire allouée à la demande

Contrairement à la pile, qui se remplit et se vide automatiquement au rythme des appels de fonction, le **tas** (*heap*) est une zone de mémoire que le programme réserve et libère explicitement, quand il en a besoin (ex : `malloc`/`free` en C), pour une donnée dont la durée de vie ne correspond à aucun appel de fonction précis (ex : le contenu d'un fichier chargé en mémoire, utilisé bien après la fonction qui l'a lu).

| | Pile (stack) | Tas (heap) |
|---|---|---|
| Gestion | Automatique, liée aux appels de fonction | Manuelle ou semi-automatique (allocation/libération explicites) |
| Vitesse | Très rapide (juste déplacer `rsp`) | Plus lente (le système doit trouver un emplacement libre) |
| Durée de vie d'une donnée | Le temps de la fonction qui l'a créée | Jusqu'à sa libération explicite, indépendamment de la fonction |
| Erreur typique | Écrire au-delà de l'espace réservé (voir corruption mémoire) | Utiliser une donnée déjà libérée (*use-after-free*) |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un programme compilé n'est qu'une suite d'instructions que `rip` parcourt, manipulant des registres. La pile stocke automatiquement les variables locales et l'adresse de retour de chaque appel de fonction ; le tas stocke une donnée allouée et libérée explicitement, à la durée de vie indépendante d'un appel de fonction précis. |
| **Outils utilisables** | Un débogueur (couvert dans le chapitre rétro-ingénierie) pour observer registres et pile en direct pendant l'exécution. |
| **Pièges à éviter** | Confondre la pile (rapide, automatique, taille limitée) et le tas (flexible, gestion manuelle) : le mauvais choix, ou une erreur dans leur gestion, ouvre la voie aux failles du chapitre suivant. |
| **Bonnes pratiques** | Garder à l'esprit que l'adresse de retour sauvegardée sur la pile est une donnée comme une autre en mémoire : si un programme peut être amené à l'écraser, il peut être détourné. |
