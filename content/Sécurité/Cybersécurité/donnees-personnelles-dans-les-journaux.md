---
order: 25
---

# Données personnelles dans les journaux et les copies (31/10/2026)

Un **journal** (en anglais *log*) est le fichier où un programme note ce qu'il fait et ce qui ne va pas, une ligne par événement (voir [l'inondation de logs](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inondation-de-logs) pour le cas où il en écrit trop). On le lit pour comprendre une panne. Le problème de ce chapitre : à force de noter « ce qui s'est passé », le programme note aussi **qui** était concerné, et le journal devient, sans que personne l'ait décidé, un deuxième fichier de clients.

Ce chapitre répond à quatre questions : qu'est-ce qu'une donnée personnelle, par où elle entre dans un journal, comment elle se multiplie dans les copies (**satellites**, c'est-à-dire des copies tenues dans d'autres applications, voir plus bas ; sauvegardes ; agrégateur de journaux, c'est-à-dire un service qui rassemble au même endroit les journaux de nombreuses machines), et comment l'empêcher, la masquer ou l'effacer. Les exemples tournent en [Python](/?c=langages&s=python&p=python), que l'on lance depuis un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) ; ils s'appuient sur les [fonctions](/?c=langages&s=python&p=fonctions), les [listes et tuples](/?c=langages&s=python&p=listes-et-tuples), les [dictionnaires](/?c=langages&s=python&p=dictionnaires-et-ensembles), les [boucles](/?c=langages&s=python&p=boucles), les [classes](/?c=langages&s=python&p=poo), la [gestion des erreurs](/?c=langages&s=python&p=gestion-des-erreurs) et les [modules](/?c=langages&s=python&p=modules-et-environnements). Un dernier exemple montre le même problème dans un système de gestion de contenu (Drupal), à titre d'illustration seulement.

> **Ce chapitre n'est pas un avis juridique.** Il explique des principes généraux et des techniques. Ce qu'un texte de loi impose dans votre situation (durées exactes, bases légales, obligations de déclaration) dépend de votre pays, de votre activité et de vos contrats : cela se décide avec un juriste ou, dans une organisation, avec son délégué à la protection des données (le **DPO**, la personne chargée de veiller à ce respect). Aucun numéro d'article n'est cité ici, faute de pouvoir le vérifier : le texte officiel est lié plus bas.

| Sujet voisin | Ce que couvre l'autre chapitre | Ce que ce chapitre ajoute |
|---|---|---|
| [Gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets) | Où ranger un mot de passe ou une clé d'[API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (l'identifiant secret qui donne accès à un service) | Les empêcher d'atterrir dans un journal |
| [Secrets oubliés en production](/?c=securite&s=cybersecurite&p=secrets-oublies-en-production) | Fichier `.env` public, secret resté dans l'historique Git | Le secret qui fuit par une ligne de journal |
| [ELK, l'agrégation de logs](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs) | Rassembler et chercher dans les journaux de nombreuses machines | Ce qu'on y a copié, et pour combien de temps |
| [Types de failles](/?c=securite&s=cybersecurite&p=types-de-failles) | Les grandes familles de failles | Une fuite qui n'est pas une attaque : une erreur de conception |
| [Gouvernance des données pour un système IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) | Classer, conserver et effacer les données d'un système IA | Le cas général d'un journal d'application ordinaire |

## Qu'est-ce qu'une donnée personnelle

Une **donnée personnelle** est toute information qui se rapporte à une personne physique **identifiée ou identifiable**. « Identifiable » est le mot qui piège : une donnée n'a pas besoin de porter un nom pour être personnelle, il suffit qu'on puisse **remonter à une personne**, seule ou en la croisant avec une autre information.

| Donnée | Pourquoi elle est personnelle | Où elle se glisse dans un journal |
|---|---|---|
| Adresse e-mail | Elle désigne souvent directement une personne (`prenom.nom@...`) | Message d'erreur d'envoi, formulaire de connexion raté |
| [Adresse IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau) | Elle identifie la connexion d'un abonné chez son fournisseur d'accès ; les autorités européennes la traitent en général comme une donnée personnelle | Journal d'accès du **serveur web** (le programme qui reçoit les visites d'un site et leur répond), ligne « connexion depuis ... » |
| Identifiant interne (numéro d'utilisateur) | Il renvoie à une ligne de la base qui contient le reste | Chaque ligne « utilisateur 42 a fait ... » |
| Texte libre (message, commentaire, adresse postale) | Une personne y écrit n'importe quoi : un nom, un téléphone, un problème de santé | Corps d'une requête recopié dans une erreur |
| Identifiant de session ou de cookie | Il suit un navigateur, donc une personne, d'une page à l'autre (voir [sessions et cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies)) | Adresse web (**URL**) ou **en-tête** [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (une ligne d'information jointe à une requête) recopié tel quel |
| Numéro de carte bancaire | Il est lié à un titulaire ; c'est aussi un secret à protéger | Message de refus de paiement, corps de requête |

Il faut distinguer trois notions qui se ressemblent :

| Notion | Définition | Exemple | Reste une donnée personnelle ? |
|---|---|---|---|
| Donnée directement identifiante | Désigne la personne sans effort | `lea.martin@example.org` | Oui |
| Donnée **pseudonymisée** | Le lien avec la personne est remplacé par un pseudonyme ; une information séparée (une clé, une table) permet de le retrouver | `e3bf8cc165c43a60` (voir plus bas) | **Oui**, tant que le lien peut être refait |
| Donnée **anonymisée** | Aucun moyen raisonnable de retrouver la personne, même en croisant d'autres sources | « 1 200 connexions ce mardi » | Non, mais l'anonymisation réelle est difficile à obtenir |

> **Piège :** croire qu'une donnée « hachée » ou « pseudonymisée » est sortie du champ de la protection des données. Tant que quelqu'un, quelque part, détient de quoi refaire le lien (la clé, la table de correspondance, ou simplement la possibilité de deviner l'entrée), elle reste personnelle.

Une donnée personnelle n'est pas un **secret** au sens du chapitre sur la [gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets) : un secret (clé d'API, mot de passe) donne un pouvoir à qui le possède, une donnée personnelle concerne une personne. Un numéro de carte est les deux à la fois. Les contre-mesures de ce chapitre traitent les deux familles dans le même filtre, car elles fuient par les mêmes chemins.

## Comment une donnée personnelle entre dans un journal

Personne n'écrit `journal.info("voici l'e-mail de Léa")` par malveillance. Les fuites viennent presque toujours de **messages utiles au diagnostic** qui recopient un peu trop de contexte.

| Canal de fuite | Ce qui se passe | Exemple (inventé) |
|---|---|---|
| Message qui recopie la requête | Le développeur veut savoir « avec quoi ça a échoué » et inscrit l'entrée entière | `Échec pour la requête {"email": "lea@example.org", "message": "..."}` |
| Trace d'erreur avec ses paramètres | Une **trace** (*stack trace*) est la liste des fonctions appelées au moment d'une [exception](/?c=langages&s=python&p=gestion-des-erreurs) (une erreur signalée par le programme) ; selon l'outil, elle affiche les valeurs des arguments, ou la ligne de code avec ses valeurs | `ValueError: invalid literal for int() with base 10: 'lea@example.org'` |
| URL avec jeton | Une URL de réinitialisation de mot de passe contient un **jeton** (une valeur secrète à usage unique) dans l'adresse, et le serveur web journalise l'adresse complète | `GET /reset?token=a1b2c3d4e5f6` |
| Corps de requête | Un mode de débogage consigne le **corps** de chaque requête HTTP (voir [API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)), formulaire de paiement compris | `POST /paiement  carte=4111 1111 1111 1111` |
| Requête SQL journalisée avec ses valeurs | Le niveau de détail maximal affiche la requête [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) avec les valeurs déjà insérées | `SELECT * FROM clients WHERE courriel = 'lea@example.org'` |
| Journal d'accès du serveur web | Chaque requête reçue laisse l'adresse IP du visiteur, l'adresse demandée et parfois l'identifiant de connexion | `203.0.113.7 - lea.martin [31/Oct/2026] "GET /compte" 200` |
| Message d'une bibliothèque tierce | Une bibliothèque recopie dans son message d'erreur l'adresse du destinataire ou l'en-tête d'autorisation envoyé | `Envoi impossible : destinataire <lea@example.org> inconnu` |
| Outil de suivi d'erreurs | Un service externe reçoit automatiquement chaque exception avec le contexte de la requête | Copie hors de votre infrastructure |

Voici un extrait de journal tel qu'il traîne dans bien des serveurs. Chaque ligne contient quelque chose qui ne devrait pas y être :

```text
2026-10-31 09:12:03 INFO Connexion de lea.martin@example.org depuis 203.0.113.7
2026-10-31 09:12:41 WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr refusé
2026-10-31 09:13:10 ERROR Paiement refusé pour la carte 4111 1111 1111 1111
2026-10-31 09:14:02 INFO Commande 1234 validée
```

Les lignes 1 à 3 contiennent respectivement une adresse e-mail et une adresse IP, un jeton de réinitialisation, un numéro de carte ; seule la ligne 4 est saine. Quiconque lit ce fichier (un collègue qui débogue, un prestataire d'hébergement, un attaquant qui a trouvé une faille de lecture de fichier, voir [types de failles](/?c=securite&s=cybersecurite&p=types-de-failles)) obtient ces informations sans avoir attaqué la base de données.

Trois raisons rendent ce risque plus sérieux qu'il n'en a l'air :

| Raison | Explication |
|---|---|
| Les journaux sont moins protégés que la base | Plus de monde y accède (développeurs, support, hébergeur), souvent en lecture libre, sans trace de qui a lu quoi |
| Ils durent longtemps sans que personne s'en occupe | Une base a une logique de métier (on supprime un compte), un fichier de journal grossit jusqu'à ce que le disque soit plein |
| Ils sont copiés ailleurs automatiquement | L'agrégateur, la sauvegarde, l'outil de suivi d'erreurs : voir la section suivante |

## Les copies : chaque réplication est une copie de plus à protéger et à effacer

Une donnée écrite une fois dans la base finit rarement à un seul endroit. Le schéma suivant montre un cas courant : un **référentiel** (la base qui fait autorité, celle où l'on crée et corrige les personnes) qui envoie ses données à des **satellites** (des copies tenues par d'autres applications ou d'autres sites, pour qu'ils fonctionnent sans appeler le référentiel à chaque fois).

```
                          +-----------------------+
   Utilisateur  --------->|  Application          |
                          |  (référentiel)        |
                          +----------+------------+
                                     |
          +--------------------------+--------------------------+
          |                          |                          |
          v                          v                          v
   +-------------+          +----------------+          +---------------+
   | Satellite A |          | Satellite B    |          | Journal       |
   | (copie)     |          | (copie)        |          | applicatif    |
   +------+------+          +--------+-------+          +-------+-------+
          |                          |                          |
          v                          v                          v
   +-------------+          +----------------+          +---------------+
   | Sauvegarde  |          | Sauvegarde     |          | Agrégateur de |
   | de A        |          | de B           |          | journaux (ELK)|
   +-------------+          +----------------+          +---------------+
```

Chaque boîte de ce schéma contient peut-être l'adresse e-mail de Léa. Le tableau suivant liste ce que cela implique :

| Copie | Qui la contrôle | Comment l'effacer | Piège classique |
|---|---|---|---|
| Référentiel | L'équipe de l'application | Une requête de suppression | La seule copie à laquelle on pense |
| Satellite | Parfois une autre équipe, parfois un tiers | Un appel de suppression à chacun | Le satellite est éteint ou en erreur au moment de l'appel |
| Journal applicatif | L'équipe de l'application | Réécrire le fichier ou laisser expirer la **rétention** (la durée pendant laquelle on garde un fichier avant de le supprimer) | Un fichier où l'on écrit toujours à la suite, en fin de fichier, ne se corrige pas facilement |
| Agrégateur de journaux | L'équipe d'exploitation | Suppression par requête dans l'index, ou expiration | L'index garde une copie de ce que le fichier a perdu |
| Sauvegarde | L'exploitation, parfois un prestataire | Souvent impossible ligne par ligne : on attend l'expiration | Une restauration réintroduit une personne déjà effacée |
| Outil externe de suivi d'erreurs | Un tiers | Ses propres règles de rétention | Les données quittent votre infrastructure |

Deux conséquences pratiques :

1. **Chaque copie doit être protégée** : droits d'accès, [chiffrement](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (rendre les données illisibles sans clé), durée de conservation. Une fuite sur la copie la moins surveillée vaut une fuite sur la base.
2. **Chaque copie doit pouvoir être effacée**, ou expirer assez vite pour que l'effacement soit pris en compte sans action. Une copie qu'on ne sait pas retrouver est une copie qu'on ne sait pas effacer.

Le chapitre sur les [systèmes IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) donne la même liste d'« endroits où la donnée a pu être copiée » pour un prompt envoyé à un modèle ; la logique est identique pour un journal ordinaire.

## Ce que dit le RGPD, en gros

Le **RGPD** (règlement général sur la protection des données, un règlement de l'Union européenne en application depuis 2018) fixe les règles de traitement des données personnelles des personnes qui se trouvent dans l'Union. En France, l'autorité qui le fait respecter est la **CNIL** (Commission nationale de l'informatique et des libertés). Un journal qui contient une adresse e-mail est un **traitement** de donnée personnelle comme un autre : il est soumis aux mêmes principes, même si personne ne l'a créé pour cela.

Les principes généraux, traduits pour un journal :

| Principe (formulation générale) | Ce que cela donne pour un journal |
|---|---|
| **Minimisation** : ne collecter que ce qui est nécessaire | Journaliser un identifiant interne plutôt qu'un e-mail ; ne pas journaliser le corps d'une requête |
| **Limitation de la conservation** : ne pas garder au-delà du nécessaire | Une durée de rétention décidée, appliquée automatiquement |
| **Intégrité et confidentialité** : protéger contre l'accès non autorisé | Droits d'accès sur les fichiers, chiffrement, accès aux journaux limité |
| **Limitation des finalités** : n'utiliser que pour ce pour quoi on a collecté | Un journal d'erreurs sert à déboguer, pas à suivre le comportement d'un client |
| **Droit à l'effacement** (« droit à l'oubli ») : une personne peut demander la suppression de ses données, sous conditions | Une demande doit atteindre **toutes** les copies, journaux compris |

Ce que ce tableau ne dit pas, et qu'il faut faire vérifier : le droit à l'effacement n'est **pas absolu** (une obligation légale de conserver une donnée peut l'emporter), et certains journaux de sécurité peuvent se justifier plus longtemps que d'autres. De même, une violation de données personnelles peut obliger à prévenir l'autorité dans un délai court ; le chapitre [Signaler une faille trouvée](/?c=securite&s=cybersecurite&p=signaler-une-faille-trouvee) donne le repère de 72 heures et renvoie lui aussi au texte officiel.

| Où lire le texte | Adresse |
|---|---|
| Le règlement lui-même (Union européenne) | [RGPD sur EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) |
| L'autorité française et ses guides pratiques | [CNIL](https://www.cnil.fr) |

## Première défense : ne pas journaliser

La meilleure protection d'une donnée est de ne **jamais l'écrire**. Avant de masquer, se demander si la donnée est utile au diagnostic.

| Je voudrais écrire | Je peux plutôt écrire | Pourquoi ça suffit |
|---|---|---|
| L'adresse e-mail de l'utilisateur | Son identifiant interne (`uid 42`) | On retrouve la personne dans la base ; si la ligne est effacée de la base, l'identifiant ne désigne plus personne |
| Le corps complet de la requête qui a échoué | Les **noms** des champs et leur taille (`champs: email, message ; message: 412 caractères`) | On sait quel champ pose problème sans en connaître le contenu |
| L'URL avec son jeton | L'URL sans la partie après `?` | Le chemin suffit à situer la page |
| Le message brut d'une bibliothèque | Le **type** de l'erreur et un code | Le texte brut peut recopier l'entrée |
| Le numéro de carte | Les quatre derniers chiffres | Assez pour que le support reconnaisse la carte |
| L'adresse IP complète | L'adresse tronquée (`203.0.113.0`) | Utile pour repérer un groupe d'adresses voisines abusif, moins précise pour identifier |

Le second levier est le **niveau de journalisation**. Un niveau est un seuil de gravité : le programme classe chaque message (du plus bavard `DEBUG` au plus grave `CRITICAL`) et n'écrit que ceux qui atteignent le seuil réglé. Python numérote les niveaux :

| Niveau | Valeur Python | Usage typique | Risque pour les données |
|---|---|---|---|
| `DEBUG` | 10 | Détails pour le développeur : requêtes SQL, corps de requête | **Le plus élevé** : c'est ici qu'on recopie le plus de contexte |
| `INFO` | 20 | Événements normaux : démarrage, connexion, commande | Moyen : l'identifiant de la personne y figure souvent |
| `WARNING` | 30 | Anomalie qui n'empêche pas de continuer | Moyen |
| `ERROR` | 40 | Une opération a échoué | Moyen : l'entrée fautive est souvent recopiée |
| `CRITICAL` | 50 | Le programme ne peut plus continuer | Faible en volume |

Le programme suivant journalise la même requête SQL au niveau `DEBUG` et deux messages ordinaires, d'abord avec le seuil `INFO`, puis avec le seuil `DEBUG`. Il utilise le module [`logging`](https://docs.python.org/3/library/logging.html), livré avec Python (on parle de sa « bibliothèque standard », voir les [modules](/?c=langages&s=python&p=modules-et-environnements)). On écrit chaque bloc dans un fichier du même nom que son premier commentaire, puis on le lance avec `python3 nom.py` :

```python
# niveaux.py : montre l'effet du seuil de journalisation
import logging  # module de journalisation de la bibliothèque standard
import sys      # donne accès à la sortie standard (l'écran du terminal)

# Écrit les messages sur l'écran. Le format est un modèle de ligne :
# %(levelname)s sera remplacé par le niveau, %(message)s par le texte.
logging.basicConfig(stream=sys.stdout, format="%(levelname)s %(message)s")
# Récupère un journal nommé "boutique" (le nom sert à le retrouver).
journal = logging.getLogger("boutique")

# Essaie deux seuils : INFO (20) puis DEBUG (10).
for niveau in (logging.INFO, logging.DEBUG):
    # Règle le seuil : tout message en dessous est ignoré.
    journal.setLevel(niveau)
    # Annonce le seuil en cours (getLevelName donne le nom d'un niveau).
    print("--- niveau", logging.getLevelName(niveau), "---")
    # Un message DEBUG. Le repère %s est remplacé par l'argument qui suit,
    # ici l'e-mail, au moment où le message est écrit.
    journal.debug(
        "Requête SQL : SELECT * FROM clients WHERE courriel = %s",
        "lea@example.org",
    )
    # Un message INFO, sans donnée personnelle.
    journal.info("Commande 1234 validée")
    # Un message ERROR, sans donnée personnelle.
    journal.error("Paiement refusé pour la commande 1234")
```

Sortie obtenue :

```text
--- niveau INFO ---
INFO Commande 1234 validée
ERROR Paiement refusé pour la commande 1234
--- niveau DEBUG ---
DEBUG Requête SQL : SELECT * FROM clients WHERE courriel = lea@example.org
INFO Commande 1234 validée
ERROR Paiement refusé pour la commande 1234
```

> **Piège :** laisser le niveau `DEBUG` actif « temporairement » en production pour chercher un bug, puis l'oublier. Pendant des semaines, chaque requête SQL et chaque corps de requête part dans les journaux, avec les données des clients.
>
> **Bonne pratique :** le niveau par défaut en production est `INFO` ou plus haut ; le passage à `DEBUG` se décide pour une durée courte, sur une machine précise, et se défait à la fin de l'enquête.

## Deuxième défense : masquer avec un filtre

Quand une donnée sensible peut quand même arriver dans un message (parce qu'une bibliothèque la recopie, ou qu'un développeur a oublié), on place sur le chemin du journal un **filtre de masquage** (en anglais *redaction*) : un code qui relit chaque message **juste avant son écriture** et remplace les motifs sensibles par une valeur neutre.

```
   journal.info("Connexion de lea@example.org")
                      |
                      v
              +-------------------+
              | Filtre de masquage|    cherche : e-mail, jeton, carte, IP
              +---------+---------+
                        |
                        v
        "Connexion de [MASQUÉ]"  --->  fichier / écran / agrégateur
```

Pour reconnaître les motifs, on utilise des **expressions régulières** (*regex*), une notation qui décrit la forme d'un texte, par exemple « des lettres, un `@`, un domaine » (voir [les regex en Python](/?c=langages&s=python&p=regex-en-python)). Une subtilité pour les numéros de carte : toute suite de seize chiffres n'est pas une carte (un numéro de commande aussi). On ajoute donc le [**contrôle de Luhn**](https://fr.wikipedia.org/wiki/Formule_de_Luhn), une formule de vérification que respectent les vrais numéros de carte : en partant de la droite, on double le deuxième chiffre, le quatrième, le sixième... (le dernier chiffre n'est pas doublé ; on retranche 9 à un double qui dépasse 9), on additionne tout, et le total doit être un multiple de 10. Un numéro de commande quelconque échoue le plus souvent à ce test et reste lisible. Le filtre traite aussi l'en-tête `Authorization: Bearer <jeton>`, la manière courante de présenter un jeton d'accès à une API (voir [la sécurité des API web](/?c=securite&s=cybersecurite&p=securite-api-web)).

Les motifs du module ci-dessous utilisent la notation des expressions régulières. Le tableau en décode les symboles ; `re.compile(r"...")` prépare un motif (le `r` devant les guillemets demande de garder les barres obliques inverses telles quelles), et `motif.sub(remplacement, texte)` remplace chaque partie du texte qui correspond :

| Symbole | Sens |
|---|---|
| `[abc]`, `[^abc]` | Un caractère parmi ceux listés ; avec `^`, un caractère qui n'est **pas** dans la liste |
| `\w`, `\d`, `\s` | Un caractère de mot (lettre, chiffre ou `_`), un chiffre, un espace ; en majuscule (`\D`), le contraire |
| `+`, `?` | Un ou plusieurs de ce qui précède ; zéro ou un (optionnel) |
| `{12,18}`, `{1,3}` | De 12 à 18 fois, de 1 à 3 fois ce qui précède |
| `\.` | Un vrai point (sans la barre, le point veut dire « n'importe quel caractère ») |
| `\b` | Une frontière de mot : le début ou la fin d'un mot, sans consommer de caractère |
| `(a\|b)` | Un groupe qui mémorise ce qu'il trouve ; `\|` veut dire « ou », et `\1` désigne le premier groupe dans le remplacement |
| `(?:...)` | Un groupe qui sert à regrouper, sans rien mémoriser |
| `(?i)` | Ne pas distinguer majuscules et minuscules (en début de motif) |

Le premier bloc écrit le module de masquage :

```python
# masquage.py : masque les données sensibles dans un texte et dans un journal
import logging    # module de journalisation de la bibliothèque standard
import re         # expressions régulières
import traceback  # fabrique le texte d'une trace d'erreur

# Le texte qui remplace une donnée masquée.
MASQUE = "[MASQUÉ]"

# Adresse e-mail : partie locale, arobase, domaine avec au moins un point.
MOTIF_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")

# Paramètre sensible d'URL ou de formulaire : nom=valeur (jeton, mot de passe).
# password et mdp (abréviation française de « mot de passe ») sont deux noms possibles.
MOTIF_PARAMETRE = re.compile(
    r"(?i)\b(token|access_token|api_key|password|mdp)=([^&\s]+)"
)

# En-tête d'autorisation de type Bearer : le mot Bearer puis le jeton.
MOTIF_BEARER = re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+")

# Suite de 13 à 19 chiffres, séparés ou non par un espace ou un tiret.
MOTIF_CARTE = re.compile(r"\b\d(?:[ -]?\d){12,18}\b")

# Adresse IPv4 (la forme à quatre nombres) : de un à trois chiffres, séparés par
# des points. Le groupe \1 retient les trois premiers nombres, le quatrième est perdu.
MOTIF_IPV4 = re.compile(r"\b(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\b")


def somme_de_luhn_valide(chiffres):
    """Dit si une suite de chiffres passe le contrôle de Luhn des cartes."""
    # Cumul des chiffres, après doublement d'un chiffre sur deux.
    total = 0
    # reversed lit les chiffres de droite à gauche ; enumerate y joint un rang (0, 1, 2...).
    for rang, chiffre in enumerate(reversed(chiffres)):
        # Convertit le caractère en nombre.
        valeur = int(chiffre)
        # Les rangs impairs (le 2e, le 4e... chiffre en partant de la droite) sont doublés.
        if rang % 2 == 1:
            valeur *= 2
            # Si le double dépasse 9, on retranche 9.
            if valeur > 9:
                valeur -= 9
        # Ajoute le chiffre au cumul.
        total += valeur
    # Le numéro est valide si le total est un multiple de 10.
    return total % 10 == 0


def masquer_carte(correspondance):
    """Remplace une suite de chiffres seulement si elle ressemble à une carte."""
    # correspondance.group(0) est le texte entier trouvé par le motif.
    # Retire espaces et tirets (tout ce qui n'est pas un chiffre : \D).
    chiffres = re.sub(r"\D", "", correspondance.group(0))
    # Contrôle de Luhn : si OK, c'est probablement une carte, on masque.
    if somme_de_luhn_valide(chiffres):
        return MASQUE
    # Sinon (numéro de commande, par exemple), on laisse le texte intact.
    return correspondance.group(0)


def masquer(texte):
    """Applique tous les masquages à un texte et renvoie le texte nettoyé."""
    # Remplace chaque e-mail par le masque.
    texte = MOTIF_EMAIL.sub(MASQUE, texte)
    # Garde les trois premiers nombres de l'IP, remplace le dernier par 0.
    texte = MOTIF_IPV4.sub(r"\1.0", texte)
    # Garde le nom du paramètre (\1), masque sa valeur.
    texte = MOTIF_PARAMETRE.sub(r"\1=" + MASQUE, texte)
    # Garde le mot Bearer, masque le jeton.
    texte = MOTIF_BEARER.sub("Bearer " + MASQUE, texte)
    # Les suites de chiffres passent par le contrôle de Luhn.
    return MOTIF_CARTE.sub(masquer_carte, texte)


class FiltreDeMasquage(logging.Filter):
    """Masque les données sensibles d'un enregistrement avant son écriture."""

    def filter(self, record):
        # record est l'« enregistrement » : l'objet que le module fabrique pour
        # chaque message. msg = le texte, args = les valeurs à y insérer (les %s),
        # exc_info = l'exception en cours (type, valeur, trace), ou None s'il n'y en a pas.
        # getMessage() insère les arguments dans le message ; on masque le résultat.
        record.msg = masquer(record.getMessage())
        # Les arguments sont déjà insérés : on les vide pour ne pas les réinsérer.
        record.args = ()
        # Une exception jointe au message est formatée plus tard par le journal.
        if record.exc_info:
            # On fabrique la trace maintenant (l'étoile * déballe le tuple exc_info
            # en trois arguments), puis on la masque.
            trace = "".join(traceback.format_exception(*record.exc_info))
            # exc_text : le texte de trace que le journal écrira à la place du sien.
            record.exc_text = masquer(trace).rstrip("\n")
        # True veut dire : « garde cet enregistrement et écris-le ».
        return True
```

La classe `FiltreDeMasquage` hérite de [`logging.Filter`](https://docs.python.org/3/library/logging.html#filter-objects) : le module appelle sa méthode `filter` pour chaque message, et le message n'est écrit que si elle renvoie `True`.

Le second bloc rejoue six événements, d'abord sans filtre, puis avec le filtre posé sur le **gestionnaire** (le *handler*, l'élément qui écrit réellement le message sur l'écran ou dans un fichier) :

```python
# avant_apres.py : même scénario, sans puis avec le filtre de masquage
import logging  # module de journalisation de la bibliothèque standard
import sys      # donne accès à la sortie standard (l'écran du terminal)

from masquage import FiltreDeMasquage  # le filtre écrit dans masquage.py

# Mise en forme d'une ligne : le niveau puis le message.
FORMAT = "%(levelname)s %(message)s"


def fabriquer_journal(nom, avec_filtre):
    """Crée un journal qui écrit sur la sortie standard, avec ou sans filtre."""
    # Un journal nommé : deux noms différents donnent deux journaux séparés.
    journal = logging.getLogger(nom)
    # Laisse passer INFO et au-dessus.
    journal.setLevel(logging.INFO)
    # Le gestionnaire écrit sur la sortie standard.
    gestionnaire = logging.StreamHandler(sys.stdout)
    gestionnaire.setFormatter(logging.Formatter(FORMAT))
    # Le filtre se pose sur le gestionnaire : il voit tout ce qui sort.
    if avec_filtre:
        gestionnaire.addFilter(FiltreDeMasquage())
    # Branche le gestionnaire sur le journal.
    journal.addHandler(gestionnaire)
    return journal


def scenario(journal):
    """Rejoue des événements qui laissent fuiter des données personnelles."""
    # Un e-mail passé comme argument du message (il remplace le %s), et une IP écrite
    # directement dans le texte.
    journal.info("Connexion de %s depuis 203.0.113.7", "lea.martin@example.org")
    # Une URL de réinitialisation avec son jeton.
    journal.warning("GET /reset?token=a1b2c3d4e5f6&lang=fr refusé")
    # Un numéro de carte de test (valide pour le contrôle de Luhn).
    journal.error("Paiement refusé pour la carte 4111 1111 1111 1111")
    # Un en-tête d'autorisation recopié.
    journal.info("Appel API avec l'en-tête Authorization: Bearer eyJhbGciOi.abc.def")
    # Un numéro de commande de 16 chiffres qui n'est PAS une carte.
    journal.info("Commande n° 1234567890123456 enregistrée")
    # Une exception dont le message contient l'e-mail : int() essaie de convertir
    # un texte en nombre, et échoue avec une ValueError (erreur de valeur).
    try:
        int("lea.martin@example.org")
    except ValueError:
        # journal.exception écrit un message ERROR suivi de la trace de l'exception.
        journal.exception("Échec de lecture")


# Premier passage : sans filtre.
print("--- Sans filtre ---")
scenario(fabriquer_journal("sans", False))
# Second passage : avec filtre.
print("--- Avec filtre ---")
scenario(fabriquer_journal("avec", True))
```

On lance `python3 avant_apres.py` dans le dossier qui contient les deux fichiers. Sortie obtenue (le chemin complet du fichier dans les traces est raccourci en `avant_apres.py`) :

```text
--- Sans filtre ---
INFO Connexion de lea.martin@example.org depuis 203.0.113.7
WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr refusé
ERROR Paiement refusé pour la carte 4111 1111 1111 1111
INFO Appel API avec l'en-tête Authorization: Bearer eyJhbGciOi.abc.def
INFO Commande n° 1234567890123456 enregistrée
ERROR Échec de lecture
Traceback (most recent call last):
  File "avant_apres.py", line 44, in scenario
    int("lea.martin@example.org")
ValueError: invalid literal for int() with base 10: 'lea.martin@example.org'
--- Avec filtre ---
INFO Connexion de [MASQUÉ] depuis 203.0.113.0
WARNING GET /reset?token=[MASQUÉ]&lang=fr refusé
ERROR Paiement refusé pour la carte [MASQUÉ]
INFO Appel API avec l'en-tête Authorization: Bearer [MASQUÉ]
INFO Commande n° 1234567890123456 enregistrée
ERROR Échec de lecture
Traceback (most recent call last):
  File "avant_apres.py", line 44, in scenario
    int("[MASQUÉ]")
ValueError: invalid literal for int() with base 10: '[MASQUÉ]'
```

Lecture de la comparaison :

| Événement | Avant | Après | Remarque |
|---|---|---|---|
| E-mail dans un argument | `lea.martin@example.org` | `[MASQUÉ]` | Le message reste lisible |
| Adresse IP | `203.0.113.7` | `203.0.113.0` | Troncature du dernier nombre, pas suppression |
| Jeton dans l'URL | `token=a1b2c3d4e5f6` | `token=[MASQUÉ]` | Le paramètre `lang=fr` n'est pas touché |
| Carte bancaire | `4111 1111 1111 1111` | `[MASQUÉ]` | Passe le contrôle de Luhn |
| En-tête Bearer | `Bearer eyJhbGciOi.abc.def` | `Bearer [MASQUÉ]` | Le mot `Bearer` reste, le jeton disparaît |
| Numéro de commande à 16 chiffres | `1234567890123456` | `1234567890123456` | Échoue au contrôle de Luhn : conservé, ce qui est voulu |
| Trace d'exception | e-mail visible dans le message d'erreur et dans la ligne de code | masqué partout | Grâce au traitement de `exc_info` |

### Les limites du masquage, constatées en exécutant le code

Ce filtre est un **dernier filet**, jamais la première défense. Deux oublis fréquents ont été reproduits. Rappel : en Python, les journaux forment une hiérarchie par leur nom, séparé par des points ; `app.paiement` est l'**enfant** de `app`, son **parent**. Second point : le paramètre `extra=` d'un appel au journal prend un dictionnaire de champs supplémentaires (`journal.info("texte", extra={"champ": valeur})`) que le format peut ensuite afficher avec `%(champ)s`.

```python
# pieges.py : deux endroits où un filtre mal posé ne masque rien
import logging  # module de journalisation de la bibliothèque standard
import sys      # donne accès à la sortie standard (l'écran du terminal)

from masquage import FiltreDeMasquage  # le filtre écrit dans masquage.py

# Le journal parent "app", avec un gestionnaire d'écran.
parent = logging.getLogger("app")
parent.setLevel(logging.INFO)
parent.addHandler(logging.StreamHandler(sys.stdout))
# Le filtre est posé sur le JOURNAL parent, pas sur le gestionnaire.
parent.addFilter(FiltreDeMasquage())

# Un message envoyé directement au parent : il passe par le filtre.
logging.getLogger("app").info("direct : lea@example.org")
# Un message envoyé à un journal ENFANT ("app.paiement") : le filtre est ignoré.
logging.getLogger("app.paiement").info("enfant : lea@example.org")

# Second cas : un champ ajouté par le paramètre extra= (voir plus haut).
gestionnaire = logging.StreamHandler(sys.stdout)
# Le format affiche le message, puis le champ « courriel » ajouté par extra=.
gestionnaire.setFormatter(logging.Formatter("%(message)s | %(courriel)s"))
autre = logging.getLogger("autre")
autre.setLevel(logging.INFO)
# Cette fois le filtre est bien posé sur le gestionnaire.
gestionnaire.addFilter(FiltreDeMasquage())
autre.addHandler(gestionnaire)
# Le filtre masque le message, pas les champs ajoutés.
autre.info("extra", extra={"courriel": "lea@example.org"})
```

Sortie obtenue :

```text
direct : [MASQUÉ]
enfant : lea@example.org
extra | lea@example.org
```

| Limite | Cause | Parade |
|---|---|---|
| Le message d'un journal enfant n'est pas masqué | Un filtre posé sur un **journal** ne s'applique qu'aux messages envoyés **directement** à ce journal, pas à ses enfants | Poser le filtre sur chaque **gestionnaire** |
| Un champ ajouté avec `extra=` n'est pas masqué | Le filtre ci-dessus ne traite que le message et la trace | Ne pas mettre de donnée personnelle dans `extra`, ou étendre le filtre |
| Un nom ou un texte libre n'est pas reconnu | Une expression régulière sait détecter une forme (e-mail, carte), pas « un prénom » | Ne pas journaliser le texte libre du tout |
| Un faux positif masque une valeur utile | Une suite de chiffres qui passe le contrôle de Luhn par hasard est masquée | Accepter ce coût : mieux vaut masquer trop que trop peu |
| Un format inattendu passe à travers | Une adresse écrite autrement (`lea (at) example.org`) n'est pas reconnue | Tenir une liste de motifs, relue régulièrement |
| Une adresse IPv6 n'est pas masquée | Le motif ne traite que l'IPv4 ; l'IPv6, la forme récente d'adresse IP, s'écrit en hexadécimal séparé par `:` (par exemple `2001:db8::1`) et passe telle quelle | Ajouter un motif IPv6, ou ne pas journaliser l'adresse |
| Un numéro de version est pris pour une IP | `version 1.2.3.4` devient `version 1.2.3.0` : quatre nombres séparés par des points ressemblent à une IPv4 | Accepter ce faux positif, ou restreindre le motif au contexte (« depuis ... ») |
| Les autres gestionnaires voient le message déjà masqué | Le filtre modifie l'objet `record` partagé : les gestionnaires appelés **après** celui qui porte le filtre reçoivent le message masqué, ceux appelés **avant** l'ont déjà écrit en clair (avec trois gestionnaires dont le deuxième porte le filtre, le premier écrit l'e-mail en clair, les deux autres le masquent) | Poser le filtre sur chaque gestionnaire : chacun masque avant d'écrire, quel que soit l'ordre |
| Le coût de calcul | Chaque message est relu par plusieurs expressions régulières | Mesurer ; masquer au niveau du gestionnaire, après le filtrage par niveau |

> **Piège :** croire qu'un filtre de masquage « règle » le problème et cesser de s'inquiéter de ce qu'on journalise. Le filtre rate tout ce qu'il ne sait pas décrire.
>
> **Bonne pratique :** combiner : ne pas journaliser la donnée (section précédente), masquer en filet de sécurité, et **contrôler** le résultat en cherchant périodiquement des fuites dans les journaux existants (voir la liste de contrôle plus bas).

## Troisième défense : pseudonymiser avec un HMAC

Parfois on a besoin de **suivre une personne** dans les journaux (« toutes les erreurs de la même personne cette semaine ») sans écrire son e-mail. La **pseudonymisation** remplace l'identité par un pseudonyme stable : la même personne donne toujours le même pseudonyme, mais le pseudonyme ne révèle pas la personne.

La méthode naïve est un hachage simple (par exemple SHA-256, une fonction qui transforme un texte en une empreinte de taille fixe, voir [hachage contre chiffrement](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). Elle a un défaut : l'espace des e-mails plausibles est petit. Un attaquant calcule l'empreinte de chaque candidat (une **attaque par dictionnaire**) et compare. Le **HMAC** (*Hash-based Message Authentication Code*, décrit dans [le chapitre de cryptographie](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)) combine le hachage avec une **clé secrète** : sans la clé, l'attaquant ne peut pas calculer les empreintes de ses candidats.

Le code ci-dessous manipule des **octets** (les nombres de 0 à 255 dans lesquels un texte est stocké, voir [l'encodage des textes](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)) : un préfixe `b` devant des guillemets (`b"..."`) fabrique des octets, et `.encode("utf-8")` convertit un texte en octets selon l'encodage UTF-8.

```python
# pseudonyme.py : pseudonyme stable et non réversible sans clé
import hashlib  # fonctions de hachage (SHA-256)
import hmac     # HMAC : un hachage combiné à une clé secrète

# Clé de démonstration (en octets, grâce au préfixe b).
# En vrai : lue dans un coffre, jamais écrite dans le code.
CLE = b"cle-secrete-de-demonstration"
# Une autre clé, pour montrer qu'elle change tout.
AUTRE_CLE = b"une-autre-cle-secrete"


def pseudonyme(courriel, cle):
    """Renvoie un pseudonyme stable : HMAC-SHA256 de l'e-mail normalisé, raccourci."""
    # Normalise : retire les espaces, passe en minuscules, convertit en octets.
    message = courriel.strip().lower().encode("utf-8")
    # Calcule le HMAC, l'écrit en hexadécimal (0-9, a-f), garde 16 caractères
    # (64 bits : assez pour que deux personnes aient le même pseudonyme très rarement).
    return hmac.new(cle, message, hashlib.sha256).hexdigest()[:16]


def empreinte_simple(courriel):
    """Renvoie le hachage SHA-256 de l'e-mail, sans clé (à ne pas utiliser ici)."""
    # Même normalisation, mais aucune clé.
    return hashlib.sha256(courriel.strip().lower().encode("utf-8")).hexdigest()[:16]


# Même personne, même clé, mais saisie différente : même pseudonyme.
print("même personne, même clé  :", pseudonyme("Lea.Martin@example.org", CLE))
print("même personne, saisie    :", pseudonyme(" lea.martin@example.org ", CLE))
# Autre personne : pseudonyme différent.
print("autre personne           :", pseudonyme("hugo.durand@example.org", CLE))
# Même personne, autre clé : pseudonyme différent.
print("même personne, autre clé :", pseudonyme("lea.martin@example.org", AUTRE_CLE))

# Une liste de candidats que l'attaquant essaie un par un.
candidats = ["hugo.durand@example.org", "lea.martin@example.org", "zoe.petit@example.org"]
# Les deux pseudonymes qu'il a trouvés dans un journal volé.
cible_simple = empreinte_simple("lea.martin@example.org")
cible_hmac = pseudonyme("lea.martin@example.org", CLE)

print("--- Attaquant sans la clé ---")
for candidat in candidats:
    # Il calcule l'empreinte simple de chaque candidat : il la connaît, sans clé.
    if empreinte_simple(candidat) == cible_simple:
        print("SHA-256 simple : retrouvé ->", candidat)
    # Pour le HMAC il doit deviner la clé : il essaie une clé inventée.
    if pseudonyme(candidat, b"cle-devinee") == cible_hmac:
        print("HMAC           : retrouvé ->", candidat)
print("fin des essais")
```

Sortie obtenue :

```text
même personne, même clé  : e3bf8cc165c43a60
même personne, saisie    : e3bf8cc165c43a60
autre personne           : 0d9e787ef3c323d8
même personne, autre clé : 25e83797c28ba123
--- Attaquant sans la clé ---
SHA-256 simple : retrouvé -> lea.martin@example.org
fin des essais
```

| Propriété | Hachage simple | HMAC avec clé secrète |
|---|---|---|
| Même personne, même pseudonyme | Oui | Oui (tant que la clé ne change pas) |
| Retrouvable par essai de candidats | **Oui** (démonstration ci-dessus) | Non, sans la clé |
| Dépend d'un secret à garder | Non | Oui : la clé est à ranger comme un [secret](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| Effet d'un changement de clé | Aucun | Tous les pseudonymes changent : on perd le lien avec l'historique |
| Reste une donnée personnelle ? | Oui | Oui, tant que la clé existe ou que les candidats peuvent être testés |

Le pseudonyme du journal ne sert à rien tout seul : quand il faut retrouver la personne (le support veut comprendre la panne d'un client précis), on recalcule le HMAC de son e-mail et on cherche cette valeur dans les journaux. Cette recherche à sens unique est précisément ce que l'on veut. Raccourcir l'empreinte à 16 caractères garde les lignes lisibles, mais plus l'empreinte est courte, plus deux personnes différentes risquent d'obtenir le même pseudonyme (une **collision**) : pour un très grand nombre de personnes, on garde davantage de caractères.

> **Piège :** utiliser un hachage sans clé, ou une clé écrite dans le code et versionnée, et croire que les journaux sont « anonymes ». Un attaquant qui les lit teste la liste de tous les e-mails qu'il connaît.
>
> **Bonne pratique :** une clé dédiée à cet usage, stockée hors du dépôt et hors des journaux, une comparaison par [`hmac.compare_digest`](https://docs.python.org/3/library/hmac.html#hmac.compare_digest) quand on vérifie une valeur (cette fonction compare deux valeurs en un temps qui ne dépend pas de l'endroit où elles diffèrent, ce qui empêche de deviner un secret en mesurant les durées de réponse), et la conscience qu'un journal pseudonymisé reste soumis aux mêmes règles qu'un journal en clair.

Un détail utile : **détruire la clé** rend les pseudonymes d'un journal invérifiables pour tout le monde, vous compris. C'est un outil de fin de vie d'un journal, pas un effacement garanti : devant une demande d'effacement, faites valider ce choix par un juriste ou un DPO.

## Quatrième défense : durée de rétention et accès restreint

La **durée de rétention** (vue plus haut) est le temps pendant lequel on garde un journal avant de le supprimer. Un journal qui ne s'efface jamais est un risque qui grandit. En Python, la **rotation** (fermer le fichier du jour, en ouvrir un nouveau, supprimer les plus anciens) est fournie par la bibliothèque standard :

```python
# rotation.py : un fichier par jour, au plus 30 anciens fichiers gardés
import logging           # module de journalisation de la bibliothèque standard
import logging.handlers  # contient les gestionnaires qui font tourner les fichiers

# À minuit, le fichier du jour est archivé et un nouveau commence.
# backupCount=30 : au plus 30 anciens FICHIERS sont gardés (et non 30 jours),
# les plus vieux au-delà sont supprimés.
gestionnaire = logging.handlers.TimedRotatingFileHandler(
    "app.log", when="midnight", backupCount=30, encoding="utf-8"
)
journal = logging.getLogger("boutique")
# Sans cette ligne, le journal garde le seuil par défaut (WARNING, 30) :
# les messages INFO seraient ignorés et app.log resterait vide.
journal.setLevel(logging.INFO)
journal.addHandler(gestionnaire)
# Un message INFO, qui doit apparaître dans app.log.
journal.info("Commande 1234 validée")
```

Après `python3 rotation.py`, le fichier `app.log` créé dans le dossier courant contient la ligne `Commande 1234 validée` (sans `setLevel`, il serait créé mais resterait vide). Le gestionnaire compte des **fichiers**, pas des jours : la rotation n'a lieu qu'à la première écriture qui suit minuit, et un jour sans aucun message ne produit aucun fichier. Trente fichiers peuvent donc couvrir plus de trente jours. Pour une rétention stricte en jours, on ajoute un nettoyage par date (supprimer les fichiers plus vieux que la durée décidée), ou l'on laisse faire l'outil [logrotate](https://github.com/logrotate/logrotate), qui réalise sous Linux la même rotation pour les fichiers de n'importe quel programme.

| Journal | Contenu typique | Rétention, valeur d'exemple inventée | À qui d'en décider |
|---|---|---|---|
| Journal de débogage | Détails techniques, requêtes | Quelques jours, jamais en production permanente | L'équipe technique |
| Journal applicatif (`INFO` et au-dessus) | Événements et erreurs | Quelques semaines | L'équipe, avec le juriste |
| Journal d'accès du serveur web | Adresses IP, URL | À fixer selon la finalité (sécurité, statistiques) | Le DPO ou le juriste |
| Journal de sécurité | Connexions, échecs d'authentification | Plus long, justifié par la finalité | Le DPO ou le juriste |
| Sauvegarde | Copie complète | Durée du cycle de sauvegarde, connue et courte | L'exploitation |

Les valeurs ci-dessus sont des **ordres de grandeur inventés** pour illustrer l'idée d'une durée par type de journal, pas des recommandations légales : la bonne durée se justifie par la finalité du journal, et des textes peuvent imposer de conserver certains journaux (pour un hébergeur ou un opérateur, par exemple) ; c'est à faire vérifier.

L'**accès restreint** complète la rétention : un journal que peu de personnes peuvent lire fuit moins.

| Mesure | Concrètement | Pourquoi |
|---|---|---|
| Droits sur les fichiers | Le fichier n'est lisible que par le compte du service et un groupe d'exploitation (voir [permissions et fichiers](/?c=langages&s=bash&p=permissions-et-fichiers)) | Un autre compte de la machine ne peut pas le lire |
| Accès à l'agrégateur par rôle | Chaque équipe voit ses journaux, pas ceux des autres | Moins de personnes exposées |
| Trace des lectures | Savoir qui a consulté les journaux sensibles | Détecter un usage anormal |
| Pas d'envoi vers un outil tiers sans nécessité | Les données quittent votre infrastructure | Vous perdez la maîtrise de l'effacement |
| Chiffrement des disques et des sauvegardes | Un support volé est illisible | Protège les copies « au repos » |

## Cinquième défense : propager l'effacement à toutes les copies

Quand une personne demande l'effacement de ses données, l'opération doit **atteindre chaque copie** (voir le schéma des copies plus haut). Deux erreurs sont fréquentes : supprimer seulement dans le référentiel, et oublier le cas d'une copie momentanément injoignable.

La simulation suivante monte un **référentiel** (une base [SQLite](https://www.sqlite.org/docs.html) en mémoire : SQLite est un moteur de base de données livré avec Python, qui n'a pas besoin de serveur, c'est-à-dire d'un programme séparé qui tourne en permanence), deux **satellites** (des copies distantes, ici de simples dictionnaires) et un **journal** (un fichier texte). Elle efface Léa dans quatre situations et compte à chaque fois les traces qui restent, pour Léa et pour Hugo (qui ne doit jamais être touché).

Le code utilise deux modules de la bibliothèque standard : [`tempfile`](https://docs.python.org/3/library/tempfile.html), qui crée un dossier temporaire supprimé à la fin, et `pathlib`, qui représente un chemin de fichier par un objet (voir [manipuler les fichiers et dossiers](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)). Les requêtes SQL y utilisent un **paramètre** `?` : la valeur est transmise à part de l'instruction, jamais collée dans le texte SQL, ce qui empêche qu'une valeur piégée soit exécutée comme une instruction (c'est l'[injection SQL](/?c=securite&s=cybersecurite&p=injections-au-dela-du-sql)).

```python
# effacement.py : un effacement qui atteint référentiel, satellites et journal
import sqlite3   # base de données SQLite, fournie avec Python
import tempfile  # dossier temporaire, supprimé automatiquement à la fin
from pathlib import Path  # manipulation des chemins de fichiers


class Satellite:
    """Une copie distante des personnes, rangée par identifiant externe."""

    def __init__(self, nom):
        # Le nom du satellite, pour les messages (self est l'objet en cours de création).
        self.nom = nom
        # Les copies : identifiant externe -> e-mail.
        self.copies = {}
        # Vrai si le satellite répond ; faux simule une panne.
        self.joignable = True

    def supprimer(self, identifiant_externe):
        """Supprime la copie ; échoue si le satellite est injoignable."""
        # Un satellite en panne ne peut rien supprimer : on signale une erreur.
        # Le f devant les guillemets (f-string) remplace {self.nom} par sa valeur.
        if not self.joignable:
            raise ConnectionError(f"{self.nom} ne répond pas")
        # pop avec une valeur par défaut : pas d'erreur si la copie n'existe plus.
        self.copies.pop(identifiant_externe, None)


def effacer_journal(chemin, motifs):
    """Réécrit le journal sans les lignes qui contiennent l'un des motifs."""
    # À ne faire que sur un fichier dans lequel aucun programme n'écrit en ce moment :
    # réécrire un journal « vivant » peut perdre ou abîmer des lignes.
    # Lit toutes les lignes du fichier.
    lignes = chemin.read_text(encoding="utf-8").splitlines()
    # Garde les lignes qui ne contiennent aucun des motifs.
    gardees = [ligne for ligne in lignes if not any(motif in ligne for motif in motifs)]
    # Réécrit le fichier avec les lignes gardées.
    chemin.write_text("\n".join(gardees) + "\n", encoding="utf-8")
    # Renvoie le nombre de lignes supprimées.
    return len(lignes) - len(gardees)


def effacer(personne_id, courriel, base, satellites, journal, complet):
    """Efface une personne ; avec complet=False, seul le référentiel est touché."""
    # Supprime la personne ; le ? est remplacé par la valeur transmise à part.
    base.execute("DELETE FROM personnes WHERE id = ?", (personne_id,))
    # Mode « naïf » : on s'arrête là (c'est l'erreur à illustrer).
    if not complet:
        return []
    # Satellites que l'on n'a pas pu joindre.
    en_attente = []
    for satellite in satellites:
        try:
            satellite.supprimer(personne_id)
        except ConnectionError:
            # On note le satellite pour rejouer la suppression plus tard.
            en_attente.append(satellite.nom)
    # Efface aussi les lignes de journal qui citent l'e-mail.
    effacer_journal(journal, [courriel])
    return en_attente


def compter(base, satellites, journal, courriel):
    """Compte les traces restantes de l'e-mail dans chaque stockage."""
    # Nombre de lignes du référentiel qui portent cet e-mail.
    dans_base = base.execute(
        "SELECT COUNT(*) FROM personnes WHERE courriel = ?", (courriel,)
    ).fetchone()[0]
    bilan = {"référentiel": dans_base}
    # Nombre de copies de l'e-mail dans chaque satellite.
    for satellite in satellites:
        bilan[satellite.nom] = sum(copie == courriel for copie in satellite.copies.values())
    # Nombre d'occurrences de l'e-mail dans le fichier de journal.
    texte = journal.read_text(encoding="utf-8")
    bilan["journal"] = texte.count(courriel)
    return bilan


def monter_le_decor(dossier):
    """Crée le référentiel, deux satellites et un journal qui citent Léa."""
    # Base en mémoire : disparaît à la fin du programme.
    base = sqlite3.connect(":memory:")
    base.execute("CREATE TABLE personnes (id INTEGER PRIMARY KEY, courriel TEXT)")
    # Deux personnes : Léa (1) et Hugo (2).
    base.execute("INSERT INTO personnes VALUES (1, 'lea.martin@example.org')")
    base.execute("INSERT INTO personnes VALUES (2, 'hugo.durand@example.org')")
    # Deux satellites qui ont reçu une copie des deux personnes.
    satellites = [Satellite("satellite-nord"), Satellite("satellite-sud")]
    for satellite in satellites:
        satellite.copies = {1: "lea.martin@example.org", 2: "hugo.durand@example.org"}
    # Un journal de trois lignes : deux citent Léa, une cite Hugo.
    journal = dossier / "app.log"
    journal.write_text(
        "INFO Connexion de lea.martin@example.org\n"
        "ERROR Échec d'envoi à lea.martin@example.org\n"
        "INFO Connexion de hugo.durand@example.org\n",
        encoding="utf-8",
    )
    return base, satellites, journal


def jouer(titre, efface, complet, sud_joignable):
    """Monte un décor neuf, efface Léa si demandé, puis affiche ce qui reste."""
    print(titre)
    # Dossier temporaire : il est supprimé en sortant du bloc with.
    with tempfile.TemporaryDirectory() as nom_dossier:
        base, satellites, journal = monter_le_decor(Path(nom_dossier))
        # Simule une panne éventuelle du second satellite.
        satellites[1].joignable = sud_joignable
        en_attente = []
        if efface:
            en_attente = effacer(1, LEA, base, satellites, journal, complet)
        print("  en attente :", en_attente)
        print("  Léa  :", compter(base, satellites, journal, LEA))
        print("  Hugo :", compter(base, satellites, journal, HUGO))


# Les deux adresses utilisées par les scénarios.
LEA = "lea.martin@example.org"
HUGO = "hugo.durand@example.org"
# Paramètres : (titre, effacement demandé ?, complet ?, satellite sud joignable ?).
jouer("1. Avant tout effacement", False, True, True)
jouer("2. Référentiel seul", True, False, True)
jouer("3. Complet, satellite sud en panne", True, True, False)
jouer("4. Complet, tout joignable", True, True, True)
```

Sortie obtenue :

```text
1. Avant tout effacement
  en attente : []
  Léa  : {'référentiel': 1, 'satellite-nord': 1, 'satellite-sud': 1, 'journal': 2}
  Hugo : {'référentiel': 1, 'satellite-nord': 1, 'satellite-sud': 1, 'journal': 1}
2. Référentiel seul
  en attente : []
  Léa  : {'référentiel': 0, 'satellite-nord': 1, 'satellite-sud': 1, 'journal': 2}
  Hugo : {'référentiel': 1, 'satellite-nord': 1, 'satellite-sud': 1, 'journal': 1}
3. Complet, satellite sud en panne
  en attente : ['satellite-sud']
  Léa  : {'référentiel': 0, 'satellite-nord': 0, 'satellite-sud': 1, 'journal': 0}
  Hugo : {'référentiel': 1, 'satellite-nord': 1, 'satellite-sud': 1, 'journal': 1}
4. Complet, tout joignable
  en attente : []
  Léa  : {'référentiel': 0, 'satellite-nord': 0, 'satellite-sud': 0, 'journal': 0}
  Hugo : {'référentiel': 1, 'satellite-nord': 1, 'satellite-sud': 1, 'journal': 1}
```

| Scénario | Ce qu'il montre |
|---|---|
| 1 | L'état de départ : Léa est présente cinq fois (référentiel, deux satellites, deux lignes de journal) |
| 2 | L'effacement « classique » ne retire que la ligne du référentiel : Léa reste présente à quatre autres traces, réparties dans trois endroits (deux satellites, le journal), et personne ne le voit |
| 3 | Un satellite en panne : la suppression échoue, **mais le programme le sait** et rend `['satellite-sud']`, à rejouer |
| 4 | Le cas complet : plus aucune trace de Léa, et Hugo est intact |

Ce que la simulation ne couvre pas, et qu'il faut prévoir en vrai :

| Cas | Difficulté | Pratique courante |
|---|---|---|
| Satellite injoignable | La suppression ne doit pas être « perdue » | Une **file d'attente** de suppressions à rejouer jusqu'au succès, avec alerte si elle reste trop longtemps non vide |
| Sauvegardes | On n'édite pas ligne à ligne une sauvegarde | Une rétention courte, plus un **registre des effacements** rejoué après chaque restauration |
| Agrégateur de journaux | L'index a sa propre copie | Suppression par requête dans l'index, ou expiration programmée |
| Journal pseudonymisé | La ligne ne contient plus l'e-mail | Recalculer le HMAC de l'e-mail de la personne et chercher cette valeur |
| Preuve | Pouvoir dire ce qui a été fait | Garder une trace de la demande et de ses étapes **sans** y recopier la donnée effacée |
| Journal en cours d'écriture | Réécrire `app.log` pendant que le programme y écrit risque de perdre ou d'abîmer des lignes | Faire d'abord tourner le fichier (rotation) puis nettoyer l'ancien, ou réécrire une copie hors service |

> **Piège :** considérer l'effacement comme terminé dès que la requête de suppression de la base réussit.
>
> **Bonne pratique :** écrire l'effacement comme un parcours explicite de **toutes** les copies, qui rend un bilan (qui a répondu, qui est en attente), et le tester avec une simulation comme celle-ci.

## Exemple dans un système de gestion de contenu : le journal Drupal

> **Exemple d'illustration.** **Drupal** est un système de gestion de contenu (un logiciel pour construire et administrer un site web) écrit en [PHP](/?c=langages&s=php&p=php) (voir [le site officiel](https://www.drupal.org/docs)). Ce qui suit décrit son système de journalisation ; les noms sont vérifiés sur le code source de Drupal 11.x. L'idée générale vaut pour n'importe quelle application.

Dans Drupal, un module écrit dans le journal par un **canal** (un nom qui indique l'origine du message) avec des **variables de substitution** : le texte contient des repères (`@mail`) et un tableau donne leurs valeurs. L'intérêt est d'éviter de coller du texte non maîtrisé dans le message ; les repères `@` et `%` échappent le contenu, `:` sert aux adresses. Le module `dblog` range ces messages dans la base, dans une table nommée `watchdog` ; l'on peut les consulter depuis l'écran d'administration. Cette table garde aussi, pour chaque message, des informations de contexte (utilisateur, adresse de la page demandée, adresse IP du visiteur).

```php
<?php

/**
 * Exemple générique : rappel envoyé à un utilisateur.
 */
function exemple_envoyer_rappel(int $uid, string $courriel): void {
  try {
    // Simule l'échec d'un envoi de message.
    throw new \RuntimeException('Serveur de messagerie injoignable');
  }
  catch (\Exception $e) {
    // À éviter : l'adresse part dans le journal, en clair, avec sa variable.
    \Drupal::logger('exemple')->error('Échec de l\'envoi à @mail', [
      '@mail' => $courriel,
    ]);
    // Mieux : un identifiant interne, qui n'a plus de sens après l'effacement.
    \Drupal::logger('exemple')->error('Échec de l\'envoi du rappel (uid @uid)', [
      '@uid' => $uid,
    ]);
  }
}
```

| Idée à retenir | Pourquoi |
|---|---|
| Une variable de substitution protège l'**affichage**, pas la **confidentialité** | Le repère `@mail` évite qu'un code HTML s'exécute à l'affichage, mais la valeur de `$courriel` est bien stockée avec le message |
| La table du journal garde d'autres données personnelles | L'adresse IP et l'utilisateur de chaque message sont des données personnelles en plus du texte |
| Le journal dans la base est lui aussi une copie | Il est dans les sauvegardes de la base, et souvent dans un satellite ou un export |
| Le nombre de lignes conservées se règle | Une limite et un nettoyage périodique (tâche planifiée, voir [cron](/?c=langages&s=bash&p=automatisation-cron)) servent de rétention : à vérifier dans les réglages du module |
| L'identifiant interne vaut mieux que l'e-mail | Après la suppression de la personne, le numéro ne mène plus à rien |
| Ne pas journaliser `$e->getMessage()` à l'aveugle | Le message d'une bibliothèque peut recopier l'adresse du destinataire |

## Contrôler l'existant : chercher les fuites déjà écrites

Mettre en place le filtre protège l'avenir. Pour savoir ce qui est **déjà** dans les journaux, on les parcourt avec [`grep`](/?c=langages&s=bash&p=traitement-de-texte) (une commande qui affiche les lignes contenant un motif ; `-E` active les expressions régulières étendues, `-o` n'affiche que la partie qui correspond, `-n` ajoute le numéro de ligne, `-c` compte les lignes). Les commandes suivantes ont été lancées sur l'extrait de journal montré plus haut. La première crée le fichier `journal_exemple.log` avec ces quatre lignes (`cat > fichier <<'FIN'` écrit dans le fichier tout ce qui suit, jusqu'à la ligne `FIN`) :

```bash
# Crée journal_exemple.log avec les quatre lignes de l'extrait.
cat > journal_exemple.log <<'FIN'
2026-10-31 09:12:03 INFO Connexion de lea.martin@example.org depuis 203.0.113.7
2026-10-31 09:12:41 WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr refusé
2026-10-31 09:13:10 ERROR Paiement refusé pour la carte 4111 1111 1111 1111
2026-10-31 09:14:02 INFO Commande 1234 validée
FIN
# Les adresses e-mail : lettres, chiffres ou . _ + - avant l'arobase, domaine après.
grep -n -E -o '[[:alnum:]._+-]+@[[:alnum:].-]+\.[[:alpha:]]+' journal_exemple.log
# Le nombre de lignes qui contiennent un jeton ou un mot de passe dans l'URL.
grep -c -E '(token|password)=' journal_exemple.log
# Les adresses IPv4 : quatre nombres de 1 à 3 chiffres séparés par des points.
grep -n -E -o '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' journal_exemple.log
```

Sortie obtenue :

```text
1:lea.martin@example.org
1
1:203.0.113.7
```

| Question à se poser | Comment le vérifier |
|---|---|
| Quelles adresses e-mail traînent dans les journaux ? | `grep` avec le motif ci-dessus, sur un échantillon récent |
| Des jetons ou mots de passe dans les URL ? | `grep -c -E '(token\|password)=' fichier` : tout résultat non nul est à traiter |
| Un satellite ou une sauvegarde contient-il une personne déjà effacée ? | Comparer la liste des effacements avec le contenu des copies |
| Qui peut lire les journaux ? | Lister les droits des fichiers et les rôles de l'agrégateur |
| Combien de temps garde-t-on chaque journal ? | Relire les réglages de rotation et d'expiration, et les comparer à la durée décidée |
| Un outil externe reçoit-il des journaux ? | Lister les envois automatiques (suivi d'erreurs, monitoring) |

## Questions fréquentes

| Question | Réponse |
|---|---|
| Mes journaux sont au format JSON (un objet par ligne) : le filtre du chapitre suffit-il ? | Non. Le filtre ne relit que le texte du message (et la trace). Une donnée rangée dans un champ du JSON (par exemple via `extra=`) n'est pas touchée : il faut masquer champ par champ, ou mieux ne jamais y mettre la donnée |
| Peut-on masquer chez l'agrégateur plutôt que dans l'application ? | On peut transformer les lignes avant de les indexer (voir [ELK](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs)), mais le fichier d'origine reste en clair sur la machine et la donnée a déjà voyagé : masquer d'abord à la source, et en plus à l'agrégateur si besoin |
| Et les adresses IPv6 ? | Le motif du chapitre ne traite que l'IPv4 (voir le tableau des limites) : il faut ajouter un motif IPv6, ou ne pas journaliser l'adresse |

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| Journaliser le corps complet d'une requête « pour déboguer » | Il contient formulaires, mots de passe, numéros de carte |
| Laisser `DEBUG` actif en production | Requêtes SQL et corps de requête partent dans les fichiers |
| Journaliser `str(exception)` sans réfléchir | Le message d'une bibliothèque recopie souvent l'entrée |
| Mettre un jeton dans l'adresse (`?token=...`) | Le serveur web et les intermédiaires (proxys, des serveurs placés entre le visiteur et le site) journalisent l'adresse complète |
| Compter sur le filtre de masquage seul | Il ne reconnaît que les formes décrites, pas un nom en texte libre |
| Poser le filtre sur un journal parent au lieu du gestionnaire | Les journaux enfants échappent au filtre (reproduit plus haut) |
| Mettre une donnée personnelle dans `extra=` | Le filtre présenté ne traite que le message et la trace |
| Hacher un e-mail sans clé et appeler cela « anonymisation » | Une attaque par dictionnaire retrouve la valeur (reproduit plus haut) |
| Garder la clé de pseudonymisation dans le code | Quiconque lit le dépôt peut recalculer les pseudonymes |
| Ne supprimer que dans le référentiel | Satellites, journaux et agrégateur gardent la personne (scénario 2) |
| Ignorer un satellite en panne pendant l'effacement | La personne reste dans cette copie, sans que personne le sache |
| Restaurer une sauvegarde sans rejouer les effacements | Une personne effacée réapparaît |
| Conserver les journaux « au cas où » | Plus la durée est longue, plus l'exposition grandit |
| Envoyer les journaux à un outil tiers sans l'avoir décidé | Les données quittent l'infrastructure, avec leurs propres règles de rétention |
| Prendre ce chapitre pour un avis juridique | Les durées et obligations dépendent du pays et de l'activité |

## Bonnes pratiques

| Pratique | Effet |
|---|---|
| Se demander à chaque ligne de journal si la donnée est utile au diagnostic | La meilleure protection est de ne rien écrire |
| Journaliser un identifiant interne plutôt qu'un e-mail ou un nom | Après l'effacement dans la base, la ligne ne désigne plus personne |
| Journaliser les noms et tailles des champs, pas leur contenu | On diagnostique sans voir la donnée |
| Niveau `INFO` ou plus haut en production, `DEBUG` ponctuel | Moins de contexte recopié |
| Filtre de masquage posé sur chaque gestionnaire | Dernier filet pour e-mail, jeton, carte, IP |
| Pseudonymiser avec un HMAC et une clé rangée comme un secret | Suivre une personne sans la nommer |
| Rotation automatique avec une durée décidée par type de journal | Les journaux ne s'accumulent pas indéfiniment |
| Droits d'accès restreints, accès à l'agrégateur par rôle | Moins de personnes exposées, lectures traçables |
| Effacement écrit comme un parcours de toutes les copies, avec un bilan | Aucun oubli silencieux, un satellite en panne est rejoué |
| Registre des effacements rejoué après une restauration | Une personne effacée ne revient pas |
| Chercher périodiquement des fuites dans les journaux existants | On détecte ce que le filtre n'a pas vu |
| Faire valider durées et obligations par un juriste ou un DPO | Le chapitre explique des principes, il ne décide pas à votre place |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une **donnée personnelle** est toute information qui permet de remonter à une personne : e-mail, adresse IP, identifiant interne, texte libre. Elle entre dans un journal par des messages utiles au diagnostic qui recopient trop de contexte : requête, trace, URL avec jeton, corps de requête, requête SQL, journal d'accès. Chaque **copie** (satellite, sauvegarde, agrégateur, outil externe) est une copie de plus à protéger et à effacer. Le RGPD pose, en gros, la **minimisation**, une **conservation limitée**, la **sécurité** des données et un **droit à l'effacement** non absolu ; le texte officiel et un juriste ou un DPO décident du détail. Défenses, dans cet ordre : **ne pas journaliser**, **niveaux** de journalisation, **masquage** par filtre (dernier filet), **pseudonymisation** par HMAC avec clé secrète (le pseudonyme reste une donnée personnelle tant que le lien est refaisable), **rétention** limitée, **accès restreint**, **effacement propagé** à toutes les copies avec un bilan. |
| **Pièges à éviter** | Corps de requête journalisé ; `DEBUG` laissé en production ; `str(exception)` recopié ; jeton dans l'URL ; filtre seul pour se rassurer ; filtre posé sur un journal parent ; donnée dans `extra=` ; hachage sans clé pris pour de l'anonymisation ; clé versionnée avec le code ; effacement limité au référentiel ; satellite en panne ignoré ; sauvegarde restaurée sans rejouer les effacements ; journaux gardés « au cas où » ; envoi automatique vers un outil tiers ; ce chapitre pris pour un avis juridique. |
| **Bonnes pratiques** | Journaliser un identifiant interne, pas l'e-mail ; journaliser les noms de champs, pas leurs valeurs ; `INFO` par défaut ; un filtre de masquage sur chaque gestionnaire ; HMAC avec clé rangée comme un secret ; rotation automatique et durée décidée par type de journal ; droits d'accès stricts ; effacement écrit comme un parcours de toutes les copies, avec file de rejeu et registre rejoué après restauration ; recherche périodique de fuites dans l'existant ; durées et obligations validées par un juriste ou un DPO. |
