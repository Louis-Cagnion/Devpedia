---
order: 4
---

# Les mots de passe : bonnes pratiques pour l'utilisateur et pour le site (28/10/2026)

Un **mot de passe** est un secret que l'utilisateur connaît et qu'il donne à un site pour prouver qui il est : c'est la preuve de la famille « ce que l'on sait », présentée dans [Authentification vs autorisation](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation). Il reste la méthode la plus répandue, et aussi la plus fragile. Ce chapitre parle à deux lecteurs à la fois : l'**utilisateur**, qui choisit et garde ses mots de passe, et le **site** (le programme qui tourne sur un serveur et qui reçoit ces mots de passe), dont les développeurs décident de ce qui est accepté, stocké et enregistré.

| Partie | Pour qui | Questions traitées |
|---|---|---|
| [Pourquoi le mot de passe est le maillon faible](#pourquoi-le-mot-de-passe-est-le-maillon-faible) | Tous | Comment les mots de passe se font voler ou deviner |
| [La force d'un mot de passe](#la-force-d-un-mot-de-passe-un-calcul) | Tous | Combien de combinaisons un attaquant doit essayer |
| [Côté utilisateur](#cote-utilisateur) | Utilisateur | Choisir, ranger, protéger et réagir à une fuite |
| [Côté site](#cote-site) | Développeur | Accepter, stocker, limiter, réinitialiser, surveiller |
| [Les erreurs courantes](#les-erreurs-courantes-cote-utilisateur-et-cote-site) | Tous | Les fautes les plus fréquentes et leur correction |

Ce chapitre ne réexplique pas le stockage d'un mot de passe : le **hachage** (transformer le mot de passe en une empreinte à sens unique) et le **sel** (une valeur aléatoire ajoutée avant le hachage) sont détaillés dans [Mots de passe et hachage sécurisé](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage). Les codes JavaScript du côté site s'appuient sur [les fonctions](/?c=langages&s=javascript&p=fonctions), [les conditions](/?c=langages&s=javascript&p=conditions), [les tableaux](/?c=langages&s=javascript&p=tableaux) et [les objets](/?c=langages&s=javascript&p=objets).

Les recommandations des normes évoluent : celles citées ici datent du 28/10/2026, et chaque lien officiel permet de revérifier le texte en vigueur.

## Pourquoi le mot de passe est le maillon faible

Un mot de passe est un secret que des humains doivent inventer, retenir et taper. Quatre faiblesses humaines et techniques en découlent.

| Faiblesse | Ce qui se passe |
|---|---|
| **Réutilisation** | Le même mot de passe sert sur dix sites : il suffit qu'un seul le laisse fuiter pour que les dix comptes tombent |
| **Fuite de base de données** | Une **fuite** est la publication ou la revente de données volées à un site ; elle contient des adresses de courriel (message électronique) et des mots de passe ou leurs empreintes |
| **Hameçonnage** | Un faux site ou un faux message pousse l'utilisateur à donner lui-même son mot de passe (voir [Ingénierie sociale et phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)) |
| **Choix prévisibles** | Les humains choisissent `123456`, leur prénom, une date : les attaquants le savent et essaient ces choix en premier |

Ces faiblesses sont exploitées par des attaques précises, qui se jouent à des endroits différents :

| Attaque | Principe | Ce qui l'arrête |
|---|---|---|
| **Force brute en ligne** | Essayer toutes les combinaisons possibles, une par une, en passant par le formulaire de connexion du site | Limitation du nombre d'essais, mot de passe long |
| **Force brute hors ligne** | Essayer toutes les combinaisons sur des empreintes volées, sur sa propre machine, sans aucune limite imposée par le site | Mot de passe long, hachage lent et salé |
| **Attaque par dictionnaire** | Essayer d'abord une liste de mots de passe probables (voir [le chapitre sur le hachage](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)) | Mot de passe tiré au hasard, refus des mots de passe courants par le site |
| **Pulvérisation de mots de passe** (*password spraying*) | Essayer un seul mot de passe très courant sur des milliers de comptes, pour rester sous les seuils de blocage par compte | Refus des mots de passe courants, détection côté site |
| **Bourrage d'identifiants** (*credential stuffing*) | Prendre les couples adresse + mot de passe d'une fuite et les essayer automatiquement sur d'autres sites | Mot de passe unique par site, second facteur |
| **Hameçonnage** | Obtenir le mot de passe de la victime elle-même | Gestionnaire de mots de passe, clés d'accès, vigilance |

Le bourrage d'identifiants est la plus rentable pour l'attaquant, parce que la réutilisation transforme la fuite d'un site en clé pour tous les autres :

```text
Site A (petit forum) est piraté
        |
        v
Liste volée : alice@exemple.fr + "chat2020!"   (en clair, ou retrouvée par dictionnaire)
        |
        v
Un programme essaie automatiquement ce couple sur :
        +--> la messagerie      : accès accordé si Alice a réutilisé le mot de passe
        +--> la banque          : refusé si le mot de passe y est différent
        +--> les réseaux sociaux: accès accordé si Alice a réutilisé le mot de passe
```

Un compte de messagerie compromis est le plus grave : presque tous les parcours « mot de passe oublié » envoient un lien à cette adresse (voir [la réinitialisation sûre](#un-parcours-de-reinitialisation-sur)), l'attaquant peut donc ensuite prendre tous les autres comptes.

## La force d'un mot de passe : un calcul

La **force** d'un secret se mesure au nombre de combinaisons qu'un attaquant devrait essayer, dans le pire cas, pour le trouver. Pour un secret tiré au hasard, le calcul est simple : **taille de l'alphabet élevée à la puissance de la longueur**. La notation `94^8` (« 94 puissance 8 ») veut dire 94 × 94 × 94 × 94 × 94 × 94 × 94 × 94 (huit fois 94). La notation scientifique `3,7 × 10^15` veut dire 3,7 suivi de quinze zéros décalés, soit 3 700 000 000 000 000 (environ 3,7 millions de milliards).

Deux secrets sont comparés ici. L'**alphabet** du premier est l'ensemble des 94 caractères imprimables du clavier : 26 minuscules, 26 majuscules, 10 chiffres et 32 symboles. L'alphabet du second est une liste de **7 776 mots**, celle de la méthode des dés (6^5 = 7 776, soit cinq lancers d'un dé à six faces par mot, voir [la liste de l'EFF](https://www.eff.org/dice)) : chaque mot tiré compte alors pour un « caractère » parmi 7 776.

| Secret tiré au hasard | Calcul | Combinaisons | Bits |
|---|---|---|---|
| 8 minuscules | 26^8 | 2,1 × 10^11 (208 827 064 576) | 37,6 |
| 8 caractères parmi 94 | 94^8 | 6,1 × 10^15 (6 095 689 385 410 816) | 52,4 |
| Phrase de 4 mots | 7776^4 | 3,7 × 10^15 (3 656 158 440 062 976) | 51,7 |
| Phrase de 5 mots | 7776^5 | 2,8 × 10^19 | 64,6 |
| Phrase de 6 mots | 7776^6 | 2,2 × 10^23 | 77,5 |
| 12 caractères parmi 94 | 94^12 | 4,8 × 10^23 | 78,7 |

Un **bit** est une unité de mesure de la force : chaque bit de plus double le nombre de combinaisons (52 bits veulent dire 2^52 combinaisons). Ces valeurs se recalculent avec Node.js (l'environnement qui exécute JavaScript hors d'un navigateur) :

```bash
# node -e exécute le code JavaScript donné entre guillemets ; BigInt (le suffixe n) évite
# les arrondis sur les très grands nombres ; ** est la puissance
node -e "console.log((7776n ** 4n).toString())"   # affiche 3656158440062976
node -e "console.log((94n ** 8n).toString())"     # affiche 6095689385410816
```

Les temps d'attaque dépendent de la vitesse de l'attaquant. Voici le temps pour **tout essayer** (en moyenne, il suffit de la moitié), avec deux vitesses de principe : 10 milliards d'essais par seconde, ordre de grandeur d'un hachage rapide attaqué par du matériel spécialisé, et 10 000 par seconde, ordre de grandeur d'un hachage lent (voir [Mots de passe et hachage sécurisé](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)). Ce sont des hypothèses pour comparer, pas des mesures.

| Secret | À 10 milliards d'essais par seconde | À 10 000 essais par seconde |
|---|---|---|
| 8 minuscules | 21 secondes | 242 jours |
| 8 caractères parmi 94 | 7,1 jours | 19 300 ans |
| Phrase de 4 mots | 4,2 jours | 11 600 ans |
| Phrase de 5 mots | 90 ans | 90 millions d'années |
| Phrase de 6 mots | 700 000 ans | 700 milliards d'années |

Quatre enseignements :

| Enseignement | Explication |
|---|---|
| **4 mots valent à peu près 8 caractères aléatoires** | 51,7 bits contre 52,4 : la phrase n'est pas plus forte, mais elle se retient, alors que `k7#Qx!9r` s'oublie ou se note |
| **Chaque mot de plus multiplie par 7 776** | 5 mots sont 4 664 fois plus difficiles à trouver que 8 caractères parmi 94 : la longueur gagne sur la complexité |
| **Le calcul suppose un tirage au hasard** | Un humain qui « invente » ses 8 caractères les choisit dans les mêmes schémas que tout le monde (`Ete2026!`) : l'attaquant les essaie bien avant le reste. Un tirage aléatoire (dés, générateur du gestionnaire) est nécessaire |
| **Le hachage du site change tout** | Le même secret passe de quelques jours à des milliers d'années selon que le site stocke un hachage rapide ou lent |

D'où la règle pratique : **5 mots au minimum** pour un mot de passe retenu par cœur, **6 mots** ou plus pour le mot de passe maître d'un gestionnaire (voir plus bas), et des mots de passe aléatoires de 16 caractères ou plus pour tout ce que le gestionnaire retient à la place de l'utilisateur.

## Côté utilisateur

### La longueur plutôt que la complexité apparente

Un mot de passe « complexe » selon les règles usuelles (une majuscule, un chiffre, un symbole) n'est pas forcément fort : les humains respectent ces règles par des gestes prévisibles.

| Mot de passe | Verdict | Pourquoi |
|---|---|---|
| `P@ssw0rd1!` | Faible | Remplacer `a` par `@` et `o` par `0` est le premier réflexe testé par les attaquants |
| `Ete2026!` | Faible | Un mot, une année, un symbole : un schéma banal |
| `jXe8#pL2` | Moyen | Aléatoire mais court (52 bits) et difficile à retenir |
| `cheval agrafe nuage tricot piano` | Fort | 5 mots tirés au hasard : 64,6 bits, facile à retenir |
| `bP4$kz7-Qw2!mTr9vX` | Fort | 18 caractères tirés au hasard, retenus par le gestionnaire |

### La phrase de passe

Une **phrase de passe** est un mot de passe fait de plusieurs mots, séparés par des espaces ou un tiret. La méthode éprouvée : tirer 5 mots **au hasard** (avec des dés et la [liste de l'EFF](https://www.eff.org/dice), ou avec le générateur de phrases d'un gestionnaire de mots de passe), jamais les choisir soi-même.

| À faire | À éviter |
|---|---|
| Tirer les mots au hasard, sans les « améliorer » | Choisir cinq mots qui plaisent ou qui ont un lien entre eux |
| Garder la phrase telle quelle, le nombre de mots fait la force | Ajouter un `1` et un `!` à la fin « pour la forme » |
| Utiliser la phrase pour un seul usage : le mot de passe maître ou l'ouverture de l'ordinateur | Réutiliser la même phrase sur plusieurs sites |
| 5 mots minimum, 6 pour le mot de passe maître | Une citation célèbre, des paroles de chanson, un proverbe : ils figurent dans les dictionnaires des attaquants |

### Un mot de passe unique par site

Le bourrage d'identifiants montre pourquoi : si chaque site a son propre mot de passe, la fuite d'un site ne donne accès qu'à ce site. Retenir des dizaines de mots de passe différents est impossible à la main, d'où le gestionnaire.

### Le gestionnaire de mots de passe

Un **gestionnaire de mots de passe** est un logiciel (une application, une extension de navigateur) qui garde tous les mots de passe dans un **coffre chiffré** (un fichier rendu illisible par [chiffrement](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)), ouvert avec un seul mot de passe : le **mot de passe maître**. Deux exemples de logiciels : [KeePassXC](https://keepassxc.org/) (le coffre reste un fichier sur l'appareil) et [Bitwarden](https://bitwarden.com/) (le coffre chiffré est synchronisé entre appareils). Les navigateurs en proposent aussi un, plus simple.

| Ce que fait le gestionnaire | Ce que ça apporte |
|---|---|
| Génère des mots de passe aléatoires et longs | Chaque site a un mot de passe unique que personne ne devine |
| Retient tout, remplit les formulaires | L'utilisateur n'a plus à retenir, ni à taper |
| Ne remplit que sur la **bonne adresse** du site | Un faux site (hameçonnage) n'est pas reconnu : si rien ne se propose sur une page de connexion censée être connue, l'adresse est suspecte |
| Signale les mots de passe réutilisés, faibles ou apparus dans une fuite | Donne la liste de ce qu'il faut changer |
| Synchronise entre appareils | Le téléphone et l'ordinateur ont le même coffre |

Le coffre n'est protégé que par le mot de passe maître : si un attaquant copie le fichier chiffré, il l'attaque **hors ligne**, sans limite d'essais. Ce mot de passe doit donc être :

| Exigence | Raison |
|---|---|
| Une phrase de 6 mots tirés au hasard ou plus | Il est la seule barrière face à une force brute hors ligne |
| Unique : jamais utilisé ailleurs | Une fuite ailleurs ne doit pas ouvrir le coffre |
| Jamais enregistré dans le coffre ni dans un fichier non chiffré | Le coffre est fermé tant que le mot de passe n'est pas connu |
| Complété par un second facteur sur le compte du gestionnaire, quand il en propose un | Un mot de passe maître volé ne suffit alors pas |

**Sauvegarde :** la plupart des gestionnaires ne peuvent pas récupérer un mot de passe maître oublié (c'est voulu : le fournisseur ne le connaît pas). Prévoir donc une **clé de récupération** imprimée ou une copie chiffrée du coffre, rangée en lieu sûr (un coffre-fort physique, un tiroir fermé), à tester une fois. Les appareils du quotidien tombent en panne : un coffre unique sans copie est un risque.

### L'authentification multifacteur et les clés d'accès

L'**authentification multifacteur** (MFA) exige deux preuves de familles différentes ; elle est détaillée dans [Authentification multifacteur](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur), avec les codes à usage unique (TOTP) et les clés de sécurité physiques (FIDO2/WebAuthn).

Une **clé d'accès** (*passkey*) va plus loin : elle remplace le mot de passe. Elle repose sur le même principe que les clés de sécurité FIDO2/WebAuthn : une paire de clés mathématiques est créée à l'inscription ; la partie **privée** reste sur l'appareil (ou dans le gestionnaire qui la synchronise), le site ne reçoit que la partie **publique**. À la connexion, l'appareil prouve qu'il possède la clé privée, après un geste local (empreinte digitale, code de l'appareil), et la preuve n'est valable que pour l'adresse exacte du site.

| Méthode | Protège contre | Limite principale |
|---|---|---|
| Mot de passe seul | Rien si le mot de passe fuite | Réutilisation, fuite, hameçonnage |
| Mot de passe et code par SMS | Un mot de passe volé seul | Détournement du numéro de téléphone (*SIM swapping*) |
| Mot de passe et application TOTP | Un mot de passe volé seul | Un faux site peut recueillir le code tapé |
| Clé d'accès ou clé de sécurité | Fuite et hameçonnage : rien à voler ni à réutiliser, et la clé refuse un faux site | Tous les sites ne la proposent pas encore (28/10/2026), il faut prévoir la perte de l'appareil |

À activer en priorité sur les comptes qui en ouvrent d'autres : la messagerie, le gestionnaire de mots de passe, la banque.

### Vérifier si un compte est dans une fuite

Le service gratuit [Have I Been Pwned](https://haveibeenpwned.com/) (un service privé, non public) recense les fuites connues : on y saisit son adresse de courriel et il indique dans quelles fuites elle figure ; il propose aussi une alerte à l'inscription et un contrôle de mots de passe. Pour un mot de passe, la méthode est conçue pour ne jamais envoyer le mot de passe lui-même (voir [le code du site](#refuser-les-mots-de-passe-faibles-et-connus)). Figurer dans une fuite ne signifie pas que le compte a été attaqué, mais que le mot de passe utilisé alors doit être considéré comme connu.

### Que faire après une fuite

| Étape | Action | Pourquoi |
|---|---|---|
| 1 | Aller sur le site concerné en tapant son adresse soi-même (pas via un lien reçu) et changer le mot de passe | Un courriel « votre compte a fuité, cliquez ici » est souvent un hameçonnage |
| 2 | Changer ce mot de passe **partout où il a été réutilisé**, en commençant par la messagerie et la banque | Le bourrage d'identifiants l'essaie sur tous les sites |
| 3 | Activer le second facteur ou une clé d'accès | Le mot de passe seul ne suffit plus aux attaquants |
| 4 | Vérifier les appareils connectés, les adresses de récupération et les règles de redirection du courriel | Un attaquant déjà entré y laisse des accès de secours |
| 5 | Surveiller les relevés bancaires et se méfier des messages qui suivent la fuite | Les voleurs exploitent l'actualité d'une fuite pour hameçonner |
| 6 | Si des données bancaires ou d'identité sont concernées, prévenir la banque ou l'organisme | Faire opposition ou surveiller l'usage de ces données |

### Ne jamais partager, ne pas noter en clair

| Règle | Précision |
|---|---|
| Ne **jamais** donner son mot de passe, à personne | Aucun support technique, aucune banque, aucun administrateur légitime ne le demande : une telle demande est une tentative d'hameçonnage |
| Pour partager un accès, passer par la fonction de partage du gestionnaire ou par des comptes distincts | Un mot de passe envoyé par message reste lisible dans l'historique et sur les serveurs de la messagerie |
| Ne pas noter ses mots de passe dans un fichier, un message ou un papier visible | Une note en clair est lue par quiconque accède à l'appareil ou au bureau |
| Seule exception raisonnable : la clé de récupération du gestionnaire sur papier, rangée en lieu sûr | Un papier enfermé protège mieux qu'un secret oublié |

### Méfiance envers les questions de sécurité

Une **question de sécurité** (« nom de votre premier animal ? ») sert de second moyen de récupérer un compte. Sa réponse est un deuxième mot de passe, mais faible : elle se trouve sur les réseaux sociaux ou se devine. Elle ne compte pas comme un second facteur (voir [Authentification multifacteur](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur)). Quand un site l'impose, répondre par un **texte aléatoire**, sans rapport avec la question, et le ranger dans le gestionnaire comme un mot de passe.

## Côté site

Un site ne contrôle pas ce que fait l'utilisateur, mais il décide de ce qu'il accepte, de ce qu'il stocke, de ce qu'il laisse essayer et de ce qu'il écrit dans ses journaux. Ses choix répondent à des recommandations publiées.

### Les recommandations du NIST

Le **NIST** (*National Institute of Standards and Technology*) est l'organisme américain de normalisation. Son document **SP 800-63B** (*Special Publication*, volume B des lignes directrices sur l'identité numérique) décrit comment gérer l'authentification et fait référence dans le monde entier ; il est publié sur [pages.nist.gov/800-63-4](https://pages.nist.gov/800-63-4/). Ses principales exigences sur les mots de passe :

| Recommandation | Contenu | Pourquoi |
|---|---|---|
| **Longueur minimale** | Au moins 8 caractères quand le mot de passe sert avec un second facteur ; la révision 4 demande 15 caractères quand il sert seul (à vérifier sur la source officielle) | La longueur multiplie les combinaisons plus que toute règle de composition |
| **Longueur maximale** | Accepter au moins 64 caractères | Les phrases de passe et les mots de passe générés sont longs |
| **Tous les caractères** | Accepter espaces, symboles et caractères Unicode ; ne pas tronquer silencieusement | Une phrase de passe contient des espaces ; une troncature rend le secret plus court que prévu |
| **Collage et gestionnaires** | Autoriser le collage dans le champ | Sans collage, le gestionnaire ne peut pas remplir : les utilisateurs choisissent des mots de passe plus courts |
| **Pas de règle de composition** | Ne pas imposer « une majuscule, un chiffre, un symbole » | Ces règles produisent `Password1!` plutôt que des secrets forts |
| **Pas de changement périodique** | Ne pas imposer de renouvellement tous les 90 jours ; imposer un changement seulement en cas de compromission avérée | Un changement forcé donne `Ete2026!` puis `Automne2026!` |
| **Refus des mots de passe connus** | Comparer avec une liste de mots de passe compromis, trop courants, ou construits sur le nom du site ou l'identifiant | Un mot de passe long peut quand même figurer dans les listes des attaquants |
| **Pas de questions de sécurité ni d'indices** | Ne pas proposer « nom de votre premier animal » | La réponse se devine et rend le compte aussi faible que la question |
| **Limitation des essais** | Limiter les tentatives infructueuses d'un compte (le NIST cite un plafond de l'ordre de 100 essais consécutifs : à vérifier sur la source officielle) | Sans limite, la force brute en ligne est possible |

Ces recommandations rejoignent la [politique de mot de passe](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) décrite dans le chapitre sur le hachage : elles précisent la longueur minimale (le chapitre voisin cite 12 caractères, un choix de site plus exigeant que le plancher du NIST). L'**OWASP** (une communauté qui publie des guides de sécurité web, voir [L'OWASP Top 10](/?c=securite&s=cybersecurite&p=owasp-top-10)) tient les mêmes positions dans sa [fiche sur l'authentification](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

### Les recommandations de l'ANSSI

L'**ANSSI** (Agence nationale de la sécurité des systèmes d'information) est l'autorité française de cybersécurité. Elle publie sur [cyber.gouv.fr](https://cyber.gouv.fr/) un guide intitulé « Recommandations relatives à l'authentification multifacteur et aux mots de passe » (à vérifier sur la source officielle). Ses grandes lignes, à revérifier sur le texte officiel avant de s'y référer :

| Principe | Contenu |
|---|---|
| Préférer le multifacteur | Ajouter un second facteur dès que le service le permet (à vérifier sur la source officielle) |
| Un mot de passe par service | Ne jamais réutiliser un mot de passe d'un service à l'autre (à vérifier sur la source officielle) |
| Des mots de passe longs | Privilégier la longueur et les phrases de passe (à vérifier sur la source officielle) |
| Un gestionnaire de mots de passe | Recommandé pour tenir un mot de passe unique par service (à vérifier sur la source officielle) |
| Un stockage non réversible | Côté site, mots de passe hachés avec sel, jamais en clair (à vérifier sur la source officielle) |

Les valeurs chiffrées exactes (longueur minimale, entropie visée selon le niveau de sécurité) se lisent sur le guide lui-même : elles dépendent du niveau de sécurité du système et ne sont pas reprises ici.

### Le stockage : rappel et renvoi

Le stockage est couvert en détail dans [Mots de passe et hachage sécurisé](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) : un hachage lent et salé, jamais le mot de passe en clair, jamais un chiffrement réversible. Parmi les fonctions adaptées, **Argon2id** (la variante d'Argon2 que les guides actuels recommandent en premier) et **bcrypt** s'utilisent par une fonction de la bibliothèque du langage, jamais réécrite à la main. Un seul point de vigilance s'ajoute ici : **bcrypt ne lit que les 72 premiers octets** du mot de passe (un **octet** est un groupe de 8 bits ; un caractère accentué en occupe souvent 2). Une longue phrase de passe peut donc être tronquée sans erreur : lire la documentation de la bibliothèque utilisée et choisir en conséquence (à vérifier sur la source officielle de la bibliothèque).

### Limiter les essais sans permettre le déni de service

Un **déni de service** consiste à rendre un service inutilisable pour les utilisateurs légitimes (voir [Surcharge et déni de service applicatif](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)). Un blocage trop sévère le provoque : si cinq mauvais essais verrouillent un compte pour une heure, n'importe qui peut verrouiller le compte d'Alice en échouant exprès. Le principe général de limitation du débit est présenté dans [Sécurité des API web](/?c=securite&s=cybersecurite&p=securite-api-web).

| Mesure | Principe | Précaution |
|---|---|---|
| **Délai progressif** | Chaque échec double l'attente avant l'essai suivant (1 s, 2 s, 4 s, 8 s, plafonné à quelques minutes) | Pas de blocage définitif : l'attente suffit à ruiner la force brute |
| **Compteur par compte ET par adresse IP** | Compter les échecs sur un même compte, et sur une même adresse IP (l'adresse qui identifie une machine sur le réseau) | La pulvérisation de mots de passe touche beaucoup de comptes avec peu d'essais chacun : le compteur par IP la détecte |
| **Appareil déjà connu** | L'attente est plus souple pour un navigateur déjà utilisé avec succès (un cookie signé, voir [Sessions et cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies)) | Le vrai utilisateur reste connectable pendant qu'un attaquant ailleurs est ralenti |
| **Test anti-robot (CAPTCHA)** | Un **CAPTCHA** est un test conçu pour distinguer un humain d'un programme ; on l'exige après quelques échecs | Un CAPTCHA seul n'est pas une limite : il se contourne, il complète |
| **Réponse HTTP 429** | Code de statut « trop de requêtes », avec l'en-tête `Retry-After` qui indique quand réessayer (voir [Les échanges de données : API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) | Le compteur vit côté **serveur**, jamais dans un cookie que le client contrôle |
| **Alerte et second facteur renforcé** | Prévenir le propriétaire d'une série d'échecs ; exiger le second facteur lors d'une connexion inhabituelle | Évite d'écraser un compte par un blocage |

### Un message d'erreur identique, que le compte existe ou non

Un formulaire qui répond « ce compte n'existe pas » à un essai et « mauvais mot de passe » à un autre révèle quels comptes existent (voir [Logique métier et contournements automatisés](/?c=securite&s=cybersecurite&p=logique-metier-et-automatisation)). La réponse doit donc être **la même** dans tous les cas, pour la connexion et pour la réinitialisation :

```text
Connexion
   adresse inconnue      ->  « Identifiant ou mot de passe incorrect »
   mot de passe faux     ->  « Identifiant ou mot de passe incorrect »

Réinitialisation
   adresse inconnue      ->  « Si ce compte existe, un courriel vient d'être envoyé »
   adresse connue        ->  « Si ce compte existe, un courriel vient d'être envoyé »
```

Le **temps de réponse** doit lui aussi rester comparable : sinon une réponse rapide (aucun hachage à calculer) trahit un compte inexistant. Deux moyens : hacher quand même le mot de passe saisi contre une fausse empreinte pour les comptes inconnus ; envoyer le courriel de réinitialisation en tâche d'arrière-plan plutôt qu'avant de répondre. À l'inscription, « cette adresse est déjà utilisée » donne la même information : la solution est de répondre « un courriel de confirmation a été envoyé » dans tous les cas, le courriel expliquant la situation.

### Un parcours de réinitialisation sûr

La réinitialisation (« mot de passe oublié ») est le chemin le plus attaqué : pour un attaquant, il est plus facile de se faire envoyer un accès que de deviner un mot de passe. Un **jeton** est ici une suite de caractères aléatoires, qui sert de preuve temporaire et se met dans le lien envoyé par courriel.

```text
Utilisateur                          Site                              Boîte courriel
    |                                  |                                     |
 1. « Mot de passe oublié » (adresse)->|                                     |
    |                                  | 2. cherche le compte (peut ne pas exister)
    |<- 3. même message dans tous les cas : « Si ce compte existe, un courriel part »
    |                                  | 4. si le compte existe : crée un jeton aléatoire,
    |                                  |    stocke empreinte, heure limite, « non utilisé »
    |                                  |-- 5. envoie le lien avec le jeton ->|
    |<------------------------------------------- 6. lit le courriel --------|
 7. clique sur le lien --------------->| 8. vérifie : empreinte, expiration, usage unique
    |<- 9. formulaire « nouveau mot de passe » (même politique qu'à l'inscription)
10. envoie le nouveau mot de passe --->| 11. hache, stocke ; marque le jeton « utilisé » ;
    |                                  |     ferme toutes les sessions ouvertes
    |                                  |-- 12. courriel « changé » --------->|
```

| Règle | Pourquoi |
|---|---|
| Jeton tiré d'un [générateur aléatoire cryptographique](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs), d'au moins 128 bits (le code ci-dessous en prend 256) | Un jeton prévisible permet de réinitialiser le compte d'un autre |
| Ne stocker que l'**empreinte** du jeton, pas le jeton | Une fuite de la base ne donne pas de lien de réinitialisation utilisable |
| **Usage unique** : marqué « utilisé » dès le premier passage | Un lien relu dans un historique ne doit rien ouvrir |
| **Courte durée** (de l'ordre de 15 à 60 minutes) | Un courriel oublié dans une boîte ne reste pas dangereux |
| Une nouvelle demande invalide les jetons précédents | Un seul lien valide à la fois |
| Ne **jamais envoyer de mot de passe** par courriel, ni « temporaire » | Un courriel voyage et reste stocké en clair ; envoyer un mot de passe oblige le site à le connaître, donc à le stocker en clair |
| Ne pas connecter automatiquement après le changement | Le changement doit rester une opération distincte d'une connexion |
| Fermer les sessions ouvertes après le changement | Un attaquant déjà connecté perd son accès |
| Lien en HTTPS uniquement, page sans ressource d'un tiers | L'adresse contenant le jeton peut être transmise à un tiers par certains en-têtes de navigateur (à vérifier sur la [fiche OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)) |

Fabriquer le jeton et son empreinte, côté serveur, avec le module `node:crypto` fourni avec Node.js :

```javascript
const crypto = require("node:crypto");   // module de cryptographie fourni avec Node.js

const DUREE_VALIDITE_MS = 30 * 60 * 1000;   // 30 minutes, en millisecondes

// Fabrique un jeton de réinitialisation : seule son empreinte est conservée côté serveur
function creerJetonReinitialisation() {
    // randomBytes tire 32 octets (256 bits) d'un générateur aléatoire cryptographique
    const jeton = crypto.randomBytes(32).toString("hex");   // 64 caractères hexadécimaux
    // Un jeton aléatoire ne se devine pas par dictionnaire : un hachage rapide (SHA-256)
    // suffit pour son empreinte, bcrypt serait inutile
    const empreinte = crypto.createHash("sha256").update(jeton).digest("hex");
    return {
        jeton: jeton,              // envoyé UNE fois par courriel, jamais stocké
        empreinte: empreinte,      // stockée en base avec les deux champs suivants
        expireA: Date.now() + DUREE_VALIDITE_MS,   // Date.now() : l'heure actuelle en ms
        utilise: false,            // passera à true dès la première utilisation
    };
}

const exemple = creerJetonReinitialisation();
console.log(exemple.jeton.length, exemple.empreinte.length, exemple.utilise);   // 64 64 false
```

`require` charge un module, `"hex"` écrit les octets en hexadécimal (chiffres 0 à 9 et lettres a à f), et `SHA-256` est une fonction de hachage rapide, adaptée ici parce que le jeton est déjà aléatoire (le hachage lent protège, lui, des secrets choisis par des humains : voir [le chapitre sur le hachage](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)).

### Prévenir l'utilisateur de tout changement

Le site envoie un courriel à l'adresse **enregistrée** (pas à une adresse saisie dans la demande) chaque fois que le mot de passe, l'adresse de courriel ou le second facteur change.

| Le courriel contient | Le courriel ne contient jamais |
|---|---|
| Ce qui a changé et à quelle heure | Le nouveau mot de passe |
| L'appareil et la région approximative, si le site les connaît | Un lien qui connecte directement sans autre vérification |
| Un lien « Ce n'était pas moi » vers une procédure de reprise du compte | Le jeton de réinitialisation déjà utilisé |

### Journaliser sans jamais écrire le mot de passe

Un **journal** (*log*) est un fichier où le programme écrit ce qui se passe : requêtes reçues, erreurs, connexions. Il est lu par les développeurs, copié vers d'autres outils et gardé longtemps : un mot de passe qui y entre y reste.

| À journaliser | À ne jamais journaliser |
|---|---|
| Une tentative de connexion, réussie ou non, avec l'identifiant, l'heure, l'adresse IP | Le mot de passe saisi, même « incorrect » : une faute de frappe est souvent le vrai mot de passe d'un autre site |
| Les demandes de réinitialisation, les changements de mot de passe | Le jeton de réinitialisation ou le lien complet |
| Les blocages et les alertes de la limitation d'essais | Le corps entier d'une requête de connexion ou d'inscription |

Les fuites arrivent souvent sans que personne l'ait décidé : un outil qui enregistre **toutes** les requêtes, une trace d'erreur qui affiche les paramètres reçus, un outil de statistiques qui copie les champs d'un formulaire. Il faut donc **exclure** explicitement les champs de mot de passe de ces enregistrements. Les secrets d'infrastructure ont leurs règles dans [Gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets).

### Refuser les mots de passe faibles et connus

La validation s'écrit sur le **serveur** (le code qui tourne chez le site) : une vérification faite seulement dans la page du navigateur se contourne en quelques secondes. Le code suivant contrôle la longueur et refuse les mots de passe courants ou qui contiennent l'identifiant, sans aucune règle de composition. Il utilise un `Set` (un ensemble de valeurs sans doublon, voir [les tableaux](/?c=langages&s=javascript&p=tableaux)) et la normalisation **Unicode** (la norme qui numérote tous les caractères, voir [L'encodage des textes](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)).

```javascript
// Ensemble (Set) de mots de passe très courants, en minuscules (liste réduite ici)
const MOTS_DE_PASSE_COURANTS = new Set([
    "password", "123456", "123456789", "qwerty", "azerty",
    "motdepasse", "azertyuiop", "letmein", "iloveyou", "111111",
]);

const LONGUEUR_MIN = 12;    // plancher choisi par le site (le NIST impose au moins 8)
const LONGUEUR_MAX = 128;   // plafond large (au moins 64) : refuse seulement l'abus

// Renvoie la liste des problèmes du mot de passe ; liste vide = « accepté »
function verifierMotDePasse(saisi, identifiant) {
    // normalize("NFKC") unifie les écritures d'un même caractère Unicode (un « é » peut
    // être une seule lettre ou un « e » suivi d'un accent) avant de compter
    const motDePasse = saisi.normalize("NFKC");
    // [...texte] découpe en caractères entiers : un émoji compte pour 1, pas pour 2
    const longueur = [...motDePasse].length;
    const minuscules = motDePasse.toLowerCase();   // pour ignorer les majuscules
    const problemes = [];                          // liste vide au départ

    if (longueur < LONGUEUR_MIN) {
        problemes.push("Trop court : au moins " + LONGUEUR_MIN + " caractères");
    }
    if (longueur > LONGUEUR_MAX) {
        problemes.push("Trop long : au plus " + LONGUEUR_MAX + " caractères");
    }
    if (MOTS_DE_PASSE_COURANTS.has(minuscules)) {  // has : vrai si présent dans la liste
        problemes.push("Mot de passe trop courant");
    }
    // includes : vrai si un texte en contient un autre ; on refuse l'identifiant dedans
    if (identifiant && minuscules.includes(identifiant.toLowerCase())) {
        problemes.push("Ne doit pas contenir l'identifiant");
    }
    return problemes;
}

// Aucune règle « une majuscule, un chiffre, un symbole » : seule compte la longueur
console.log(verifierMotDePasse("azerty", "alice"));
console.log(verifierMotDePasse("alice-aime-les-chats", "alice"));
console.log(verifierMotDePasse("cheval agrafe nuage tricot", "alice"));
```

Résultat affiché :

```text
[ 'Trop court : au moins 12 caractères', 'Mot de passe trop courant' ]
[ "Ne doit pas contenir l'identifiant" ]
[]
```

La liste de dix mots est un échantillon : un vrai site charge un fichier de milliers ou de millions de mots de passe courants, ou interroge un service qui connaît les fuites. [Have I Been Pwned](https://haveibeenpwned.com/) offre ce service sans que le mot de passe quitte le site, grâce à une technique d'**anonymat par préfixe** : on calcule l'empreinte SHA-1 du mot de passe, on n'envoie que ses 5 premiers caractères, le service renvoie tous les suffixes connus qui commencent ainsi, et la comparaison se fait chez nous. Cette empreinte SHA-1 sert uniquement à la consultation du service, jamais au stockage.

```javascript
const crypto = require("node:crypto");   // module de cryptographie fourni avec Node.js

// Vrai si le mot de passe figure dans des fuites connues de Have I Been Pwned
async function estDansUneFuite(motDePasse) {
    // SHA-1 du mot de passe, en hexadécimal majuscule (le format attendu par le service)
    const hash = crypto.createHash("sha1").update(motDePasse).digest("hex");
    const empreinte = hash.toUpperCase();
    const prefixe = empreinte.slice(0, 5);   // 5 premiers caractères : seuls envoyés
    const suffixe = empreinte.slice(5);      // le reste ne quitte jamais notre serveur
    // fetch envoie une requête HTTP ; le service répond par les suffixes de ce préfixe
    const reponse = await fetch("https://api.pwnedpasswords.com/range/" + prefixe);
    const texte = await reponse.text();      // une ligne « SUFFIXE:NOMBRE » par suffixe
    // On cherche notre suffixe parmi les lignes reçues
    return texte.split("\n").some((ligne) => ligne.startsWith(suffixe));
}
```

Une fonction `async` (déclarée avec ce mot) peut attendre le résultat d'une opération lente avec `await`, sans bloquer le reste du programme ; `slice(a, b)` extrait un morceau de texte ; `some` vérifie qu'au moins un élément d'une liste répond à une condition. Ces notions sont détaillées dans [le chapitre sur l'asynchrone](/?c=langages&s=javascript&p=asynchrone) et [celui sur les chaînes](/?c=langages&s=javascript&p=strings). Deux décisions de conception à écrire dans la documentation du site : que faire si le service est injoignable (en général, accepter le mot de passe plutôt que de bloquer l'inscription), et refuser le mot de passe seulement à la création ou au changement, pas d'un utilisateur qui se connecte déjà.

## Les erreurs courantes, côté utilisateur et côté site

| Côté | Erreur | Conséquence | Correction |
|---|---|---|---|
| Utilisateur | Le même mot de passe sur plusieurs sites | Une fuite ouvre tous les comptes (bourrage d'identifiants) | Un mot de passe unique par site, retenu par un gestionnaire |
| Utilisateur | Mot de passe court « complexe » (`P@ssw0rd1!`) | Trouvé par les listes de variantes courantes | Phrase de 5 mots tirés au hasard ou mot de passe aléatoire long |
| Utilisateur | Mot de passe maître faible ou réutilisé | Tout le coffre tombe d'un coup | Phrase de 6 mots tirés au hasard, unique, avec un second facteur |
| Utilisateur | Pas de second facteur sur la messagerie | Les réinitialisations des autres comptes passent par elle | MFA ou clé d'accès sur la messagerie en priorité |
| Utilisateur | Garder le même mot de passe après une fuite | L'attaquant a déjà la liste | Changer partout où il a servi, activer le second facteur |
| Utilisateur | Donner son mot de passe par message ou téléphone | Hameçonnage réussi | Ne jamais le donner ; passer par le site officiel |
| Utilisateur | Répondre sincèrement aux questions de sécurité | Réponses trouvées sur les réseaux sociaux | Réponse aléatoire rangée dans le gestionnaire |
| Site | Règles de composition et renouvellement tous les 90 jours | Mots de passe prévisibles (`Automne2026!`) | Longueur minimale, refus des mots de passe connus, pas de renouvellement périodique |
| Site | Interdire le collage ou plafonner à 16 caractères | Gestionnaires et phrases de passe inutilisables | Autoriser le collage, accepter au moins 64 caractères |
| Site | Message « ce compte n'existe pas » | Les attaquants dressent la liste des comptes | Message identique dans tous les cas |
| Site | Blocage définitif après 5 échecs | Un attaquant verrouille le compte d'autrui (déni de service) | Délai progressif, compteurs par compte et par adresse |
| Site | Envoyer un mot de passe par courriel | Il circule et reste lisible dans la boîte | Lien à jeton aléatoire, à usage unique, de courte durée |
| Site | Écrire le mot de passe dans les journaux | Lisible par tous ceux qui lisent les journaux | Exclure les champs de mot de passe de toute journalisation |
| Site | Stocker en clair, ou haché par SHA-256 ou MD5 | Mots de passe lisibles ou retrouvés en quelques heures après une fuite | Argon2id ou bcrypt avec sel (voir le chapitre sur le hachage) |

## Synthèse

| Sujet | L'utilisateur | Le site |
|---|---|---|
| Longueur | Phrase de passe de 5 mots minimum | Accepter au moins 64 caractères, minimum 8 ou plus selon le contexte |
| Complexité | Inutile si le mot de passe est long et tiré au hasard | Ne pas imposer de composition |
| Unicité | Un mot de passe par site, via un gestionnaire | Refuser les mots de passe déjà compromis |
| Stockage | Gestionnaire protégé par un mot de passe maître solide | Hachage lent et salé, jamais le mot de passe en clair |
| Second facteur | MFA ou clés d'accès partout où c'est possible | Proposer le MFA et les clés d'accès |
| Attaques par essais | Mot de passe aléatoire long | Délais progressifs, compteurs par compte et par IP |
| Récupération | Messagerie protégée, questions de sécurité aléatoires | Jeton à usage unique et de courte durée, message identique |
| Après un incident | Changer partout, activer le second facteur | Notifier, fermer les sessions, journaliser sans mot de passe |

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| Croire qu'une jauge de force verte suffit | Elle mesure la complexité apparente et laisse passer `Password1!` | Refuser les mots de passe connus plutôt que fier à une couleur |
| Faire confiance à 4 mots choisis « au hasard » par soi | Un humain n'est pas un générateur aléatoire | Tirer les mots avec des dés ou un générateur |
| Mot de passe absent d'une fuite = mot de passe fort | Le contrôle ne dit pas qu'un mot de passe est solide, seulement qu'il n'est pas déjà connu | Combiner contrôle de fuite et longueur minimale |
| Mot de passe maître sans clé de récupération | Un oubli rend le coffre définitivement illisible | Clé de récupération rangée hors ligne, testée |
| Récupérer un compte par SMS ou par questions de sécurité | Le chemin de récupération devient le point faible, malgré un second facteur solide | Même exigence pour la récupération que pour la connexion |
| Message de réinitialisation différent selon l'existence du compte | Énumération des comptes | Même message, même temps de réponse |
| Troncature silencieuse des longs mots de passe (bcrypt : 72 octets) | Une phrase de 100 caractères protège autant qu'une de 72 octets | Lire la documentation de la bibliothèque et refuser, plutôt que tronquer sans le dire |
| Jeton de réinitialisation réutilisable ou sans expiration | Un vieux lien reste valable indéfiniment | Usage unique, expiration, invalidation à chaque nouvelle demande |
| Journaliser les requêtes entières en cas de bug | Les mots de passe se retrouvent dans les journaux | Exclure les champs sensibles avant tout enregistrement |
| Vérifier le mot de passe seulement côté navigateur | Se contourne en quelques secondes | Valider toujours côté serveur |
| Forcer le renouvellement périodique par habitude | Mots de passe plus prévisibles | Renouveler seulement après compromission avérée |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Utilisateur : un gestionnaire de mots de passe, un mot de passe aléatoire par site | Supprime la réutilisation sans demander de mémoire |
| Utilisateur : phrase de passe de 5 mots (6 pour le mot de passe maître), tirée au hasard | Longueur élevée et facile à retenir |
| Utilisateur : second facteur ou clé d'accès, en commençant par la messagerie | Un mot de passe volé ne suffit plus |
| Utilisateur : vérifier ses adresses sur [Have I Been Pwned](https://haveibeenpwned.com/), agir vite après une fuite | Le délai entre fuite et attaque est court |
| Utilisateur : réponses aléatoires aux questions de sécurité, rangées dans le gestionnaire | Elles ne se devinent plus |
| Site : minimum 8 caractères ou plus, au moins 64 acceptés, collage autorisé | Recommandations du NIST |
| Site : refuser les mots de passe connus ou courants, sans règle de composition ni changement périodique | Évite les mots de passe prévisibles |
| Site : Argon2id ou bcrypt avec sel, via la bibliothèque du langage | Voir le chapitre sur le hachage |
| Site : délai progressif par compte et par IP, jamais de blocage définitif | Ralentit la force brute sans déni de service |
| Site : message d'erreur et temps de réponse identiques | Pas d'énumération des comptes |
| Site : jeton de réinitialisation aléatoire, à usage unique, de 15 à 60 minutes, jamais de mot de passe par courriel | Le chemin le plus attaqué reste sûr |
| Site : courriel de notification à chaque changement, journaux sans mot de passe | Détection rapide et pas de nouvelle fuite par les journaux |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le mot de passe est le maillon faible à cause de la réutilisation, des fuites, de l'hameçonnage et des choix prévisibles ; ces faiblesses sont exploitées par la force brute (en ligne ou hors ligne), l'attaque par dictionnaire, la pulvérisation de mots de passe et le bourrage d'identifiants. La force se calcule : 7776^4 (3,7 × 10^15) vaut à peu près 94^8 (6,1 × 10^15), 5 mots valent 4 664 fois plus, à condition que le tirage soit aléatoire. Côté utilisateur : phrase de passe tirée au hasard, mot de passe unique par site, gestionnaire avec mot de passe maître solide et sauvegarde, MFA ou clés d'accès, vérification des fuites, changement partout après une fuite, aucun partage, réponses aléatoires aux questions de sécurité. Côté site : recommandations du NIST SP 800-63B (au moins 8 caractères, au moins 64 acceptés, collage autorisé, pas de composition ni de renouvellement périodique, refus des mots de passe connus) et de l'ANSSI, stockage haché et salé, délai progressif sans déni de service, message identique, réinitialisation par jeton à usage unique et à durée courte, notification, journaux sans mot de passe. |
| **Pièges à éviter** | Mot de passe réutilisé ou « complexe » mais court ; mot de passe maître faible ; messagerie sans second facteur ; questions de sécurité sincères ; règles de composition et renouvellement périodique ; collage interdit ; plafond de longueur bas ; message d'erreur différent selon le compte ; blocage définitif des comptes ; mot de passe envoyé par courriel ; jeton réutilisable ou sans expiration ; mot de passe dans les journaux ; troncature silencieuse ; validation côté navigateur seulement. |
| **Bonnes pratiques** | Gestionnaire et phrase de passe aléatoire ; second facteur ou clé d'accès sur la messagerie d'abord ; contrôle des fuites ; changement partout après une fuite ; côté site : validation serveur (longueur, mots de passe connus), hachage Argon2id ou bcrypt, délais progressifs par compte et par IP, réponses et temps identiques, jeton aléatoire à usage unique et courte durée, courriel de notification, journaux exclus des champs sensibles. |
