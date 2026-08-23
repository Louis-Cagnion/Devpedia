---
order: 5
---

# Le CTF : Capture The Flag

Un **CTF** (*Capture The Flag*) est une compétition de sécurité informatique où chaque défi réussi rapporte un **flag** : une chaîne de caractères prouvant que le défi a bien été résolu (ex : `FLAG{d3p4ss3m3nt_d3_buff3r}`), à soumettre sur une plateforme pour marquer des points. C'est le format d'entraînement le plus courant pour pratiquer légalement les techniques vues dans cette catégorie, sur des programmes conçus exprès pour être attaqués plutôt que sur un vrai système.

## Deux grands formats

| Format | Principe |
|---|---|
| **Jeopardy** | Des défis indépendants, classés par catégorie, chacun avec ses propres points ; les participants choisissent librement lesquels résoudre |
| **Attack-defense** | Chaque équipe reçoit les mêmes services à faire tourner : elle doit à la fois les défendre (corriger leurs failles) et attaquer ceux des autres équipes pour voler leurs flags, en temps réel |

Le format jeopardy, plus simple à organiser et à suivre seul, est largement le plus répandu pour l'apprentissage individuel ; l'attack-defense se rapproche davantage d'un exercice d'équipe en conditions quasi réelles.

## Les catégories classiques d'un CTF jeopardy

| Catégorie | Ce qu'elle couvre |
|---|---|
| **Pwn** | Exploitation binaire : [corruption mémoire](/?c=securite&s=securite-offensive&p=corruption-memoire) sur un programme fourni |
| **Rev** | Rétro-ingénierie ([désassembleur/débogueur](/?c=securite&s=securite-offensive&p=bases-retro-ingenierie)) : comprendre un binaire pour en extraire une information cachée |
| **Web** | Failles web classiques, voir [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10) |
| **Crypto** | Attaquer une implémentation cryptographique mal faite |
| **Forensics** | Retrouver une information cachée dans un fichier, une capture réseau, une image disque |
| **Misc** | Tout ce qui ne rentre pas ailleurs (souvent des énigmes de logique ou de programmation) |

## Le lien avec le pentest et le bug bounty

Un CTF partage l'esprit du [pentest](/?c=cybersecurite&p=tests-et-audit-de-securite) (attaquer un système avec les techniques d'un vrai attaquant) mais dans un cadre entièrement fictif et volontairement vulnérable, plutôt que sur un système réel avec un mandat écrit : c'est l'endroit où pratiquer sans se poser la question du cadre légal à chaque étape, puisque le cadre est déjà celui de la compétition elle-même.

> **Bonne pratique :** commencer par des CTF orientés apprentissage (avec correction/écriture détaillée disponible après coup, appelée *write-up*) plutôt que compétitifs, pour progresser à son rythme sans pression de classement.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un CTF est une compétition où chaque défi résolu rapporte un flag. Le format jeopardy (défis indépendants par catégorie) domine l'apprentissage individuel ; l'attack-defense (défendre ses services, attaquer ceux des autres en temps réel) se rapproche d'un exercice d'équipe. Les catégories classiques recoupent les chapitres de cette section (pwn, rev, web, crypto) plus forensics et misc. |
| **Outils utilisables** | Une plateforme de CTF d'entraînement avec write-ups disponibles pour progresser après un défi non résolu. |
| **Pièges à éviter** | Se lancer sur un CTF compétitif avant d'avoir pratiqué les fondamentaux de chaque catégorie visée. |
| **Bonnes pratiques** | Lire le write-up d'un défi non résolu après la compétition plutôt que d'abandonner : c'est souvent la façon la plus rapide de progresser. |
