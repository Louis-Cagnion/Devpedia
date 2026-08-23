---
order: 6
---

# Sécurité des dépendances et de la chaîne d'approvisionnement

Un projet moderne s'appuie sur des dizaines, parfois des milliers, de bibliothèques écrites par d'autres (voir par exemple `pip` en Python ou l'équivalent dans d'autres langages, décrit dans [Modules, pip et environnements virtuels](/?c=langages-de-programmation&s=python&p=modules-et-environnements)). Chacune de ces bibliothèques, et chacune de leurs propres dépendances, est un maillon de la **chaîne d'approvisionnement logicielle** (*supply chain*) : une faille ou une malveillance dans l'un de ces maillons affecte tous les projets qui en dépendent, directement ou indirectement, sans qu'aucune erreur n'ait été commise dans le code du projet lui-même. C'est l'une des catégories de failles déjà présentées dans [Les grandes familles de failles](/?c=cybersecurite&p=types-de-failles) sous le nom de « composants vulnérables ».

```text
Votre projet
   |
   +-- depend de --> Bibliotheque A
   |                     |
   |                     +-- depend de --> Bibliotheque C (faille ici)
   |
   +-- depend de --> Bibliotheque B

Une faille dans C affecte votre projet, meme si vous n'avez
jamais entendu parler de C ni ne l'avez installee vous-meme.
```

## Le lockfile : figer ce qui est réellement installé

Un fichier de dépendances classique (`package.json`, `composer.json`...) déclare des versions souples (« au moins la 2.1 », « n'importe quelle version 3.x ») : deux installations à des moments différents peuvent donc récupérer des versions différentes, y compris de dépendances indirectes jamais listées explicitement. Un **lockfile** (`package-lock.json`, `composer.lock`, ou `requirements.txt` généré par `pip freeze`, voir [Modules, pip et environnements virtuels](/?c=langages-de-programmation&s=python&p=modules-et-environnements)) fige la version **exacte** de chaque dépendance, directe et indirecte, souvent accompagnée d'une empreinte cryptographique du contenu téléchargé :

| Sans lockfile | Avec lockfile |
|---|---|
| Version installée potentiellement différente à chaque exécution de l'installateur | Version installée identique et reproductible, pour toute l'équipe et en production |
| Une dépendance indirecte compromise peut s'installer silencieusement | L'empreinte du lockfile détecte un contenu modifié depuis la dernière installation validée |

> **Bonne pratique :** toujours commiter le lockfile avec le reste du code, jamais l'ignorer comme un fichier généré parmi d'autres : c'est justement ce qui garantit que tout le monde installe les mêmes versions, aux mêmes empreintes.

## Le typosquatting de paquets

Le [typosquatting](/?c=cybersecurite&p=ingenierie-sociale-et-phishing) ne vise pas que les noms de domaine : un attaquant peut publier un paquet au nom volontairement proche d'un paquet populaire (`reqeusts` au lieu de `requests`, `lodahs` au lieu de `lodash`), en espérant qu'une faute de frappe lors de l'installation (`pip install reqeusts`) installe sa version malveillante à la place de la légitime.

```text
pip install requests    # le paquet legitime, tres utilise
pip install reqeusts    # faute de frappe -> paquet different, potentiellement malveillant
```

> **Bonne pratique :** copier-coller le nom exact d'un paquet depuis sa documentation officielle plutôt que le taper de mémoire, et vérifier le nombre de téléchargements/l'ancienneté d'un paquet peu connu avant de l'ajouter à un projet.

## Auditer ses dépendances

Un paquet installé aujourd'hui sans faille connue peut en révéler une plus tard : c'est pourquoi l'audit des dépendances est un contrôle récurrent, pas une vérification unique au moment de l'installation.

| Outil | Écosystème | Rôle |
|---|---|---|
| `npm audit` | [JavaScript](/?c=langages&s=javascript&p=javascript)/Node.js | Compare les dépendances installées à une base de failles connues |
| `pip-audit` | Python | Équivalent pour les paquets Python |
| [Dependabot](https://docs.github.com/en/code-security/dependabot) | Multi-écosystèmes (intégré à GitHub) | Ouvre automatiquement une pull request quand une dépendance a une faille connue et un correctif disponible |

Ces outils s'intègrent naturellement à un [pipeline CI/CD](/?c=ci-cd&p=pipeline-cicd) : l'audit tourne automatiquement à chaque changement, plutôt que de dépendre d'une vérification manuelle qu'on oublie de refaire.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une dépendance (directe ou indirecte) est un maillon de la chaîne d'approvisionnement logicielle : sa faille devient celle du projet. Un lockfile fige les versions exactes réellement installées, pour toute l'équipe. |
| **Outils utilisables** | `npm audit`, `pip-audit`, Dependabot, un lockfile (`package-lock.json`, `composer.lock`, `requirements.txt`). |
| **Pièges à éviter** | Ignorer le lockfile plutôt que de le commiter ; taper de mémoire le nom d'un paquet peu familier (risque de typosquatting) ; auditer les dépendances une seule fois, à l'installation, sans jamais revenir dessus. |
| **Bonnes pratiques** | Toujours commiter le lockfile ; copier-coller un nom de paquet depuis sa documentation officielle ; intégrer l'audit de dépendances au pipeline CI/CD, exécuté à chaque changement. |
