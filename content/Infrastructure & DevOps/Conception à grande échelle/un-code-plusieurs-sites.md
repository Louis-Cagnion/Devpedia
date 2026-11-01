---
order: 6
---

# Un code, plusieurs sites : le patron multisite

Un **site** est ici ce qu'un visiteur atteint en tapant une adresse dans son navigateur : `boutique.example` est un site, `blog.example` en est un autre. Chaque site a son apparence, ses réglages, ses données et son public. Quand une organisation en gère dix, quarante ou deux cents (une marque par pays, un site par client, un site par événement), une question d'architecture se pose : faut-il écrire, déployer et corriger le programme dix, quarante ou deux cents fois, ou le faire **une seule fois**, pour tous ? Le **patron multisite** (*multisite* en anglais) choisit la seconde réponse : **une seule base de code** (l'ensemble des fichiers du programme) sert N sites, et chaque site garde sa propre configuration, ses propres fichiers et ses propres données. L'ensemble des sites servis par le même code s'appelle le **parc**.

Ce chapitre est un chapitre de conception, dans la continuité de [Autoscaling et répartition de charge](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) (plusieurs **serveurs applicatifs**, les machines qui exécutent le code, identiques derrière un répartiteur) : là, N serveurs exécutent le même code pour **un** site ; ici, le même code sert **N** sites. Les deux se combinent. Il suppose que vous savez ce qu'est une [base de données](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) (un logiciel qui range des informations dans des **tables**, comme des feuilles de tableur avec une ligne par élément et une colonne par caractéristique) et le langage [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) qui permet de l'interroger. La suite logique est [Répliquer un référentiel vers des satellites](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=repliquer-un-referentiel-vers-des-satellites) : comment copier des données d'un endroit central vers plusieurs autres, par exemple les sites bâtis sur ce patron.

| Section | Question à laquelle elle répond |
|---|---|
| [Le problème](#le-probleme-copier-le-code-pour-chaque-site) | Pourquoi ne pas simplement copier le programme pour chaque site ? |
| [Le patron en une image](#le-patron-en-une-image) | Que se passe-t-il, étape par étape, quand une requête arrive ? |
| [Reconnaître le site](#reconnaitre-le-site-demande) | Comment le code sait-il quel site on lui demande ? |
| [Partagé et isolé](#ce-qui-est-partage-ce-qui-est-isole) | Qu'est-ce qui est commun à tous les sites, qu'est-ce qui reste propre à chacun ? |
| [Trois variantes de stockage](#ou-vivent-les-donnees-trois-variantes) | Une base par site, un préfixe de tables par site, ou un schéma par site ? |
| [Sauvegarder un site](#sauvegarder-et-restaurer-un-seul-site) | Comment extraire un seul site d'un ensemble ? |
| [Mettre à jour le parc](#mettre-a-jour-tout-le-parc) | Comment appliquer un changement de structure à N sites ? |
| [Les risques](#les-risques-du-patron) | Qu'est-ce qui peut mal tourner quand tout est mutualisé ? |
| [Quand l'utiliser](#quand-choisir-ce-patron) | Face à quelles alternatives, et pour quels cas ? |
| [Un exemple de CMS](#un-exemple-de-cms-drupal) | À quoi cela ressemble-t-il dans un système de gestion de contenu réel ? |

## Le problème : copier le code pour chaque site

Quarante sites qui partagent la même logique (un catalogue, des comptes d'utilisateurs, des pages éditoriales) se gèrent de deux façons opposées :

| | Une copie du code par site | Un seul code pour tous les sites |
|---|---|---|
| Correction d'un bogue | À refaire dans 40 copies, en risquant d'en oublier une | Une correction, effective partout au prochain déploiement (la mise en service d'une nouvelle version) |
| Nouvelle fonctionnalité | Développée une fois, recopiée 40 fois | Développée une fois, disponible partout |
| Dérive entre sites | Inévitable : chaque copie finit par différer des autres | Impossible pour le code (il n'existe qu'une fois) |
| Place disque et mémoire | 40 jeux de fichiers identiques | Un jeu de fichiers |
| Liberté d'un site | Totale : on peut modifier sa copie | Limitée : tout changement de code touche tout le monde |
| Risque d'une erreur | Limité à un site | Étendu à tout le parc |

La dernière ligne est le prix du patron : on gagne en effort et en cohérence, on perd en indépendance. Tout le chapitre consiste à garder le gain en limitant cette perte.

> **Analogie :** un immeuble de bureaux. Le bâtiment (le code), l'ascenseur et la chaudière (les mises à jour, la maintenance) sont communs. Chaque entreprise a sa porte, sa clé, ses meubles et ses dossiers (la configuration, les fichiers, les données). Une panne d'ascenseur gêne tout le monde ; un incendie dans un bureau mal cloisonné peut s'étendre aux autres.

## Le patron en une image

Une **requête** est le message qu'envoie le navigateur d'un visiteur à un serveur ; elle contient le **nom d'hôte** du site visé (par exemple `blog.example`, détaillé dans la section suivante). Le **préfixe** d'un site est un morceau de texte placé devant le nom de ses tables (`blog_articles` plutôt que `articles`), expliqué plus bas.

```text
  boutique.example      blog.example      club.example      <- trois noms d'hôte
        |                    |                  |
        +--------------------+------------------+
                             |
                             v
                  Répartiteur de charge            <- le même pour tous
                             |
                +------------+------------+
                v                         v
          Serveur applicatif 1     Serveur applicatif 2   <- UN SEUL code déployé
                |                         |
                +------------+------------+
                             |
        1. lire le nom d'hôte de la requête
        2. choisir la configuration de ce site  (titre, langue, préfixe, base...)
        3. ouvrir SA base ou SES tables
        4. répondre avec SES fichiers
                             |
          +------------------+-------------------+
          v                  v                   v
     données de          données du         données du
     boutique            blog               club          <- isolées par site
```

| Étape | Ce qui se passe | Ce qui doit rester impérativement vrai |
|---|---|---|
| 1. Lire le nom d'hôte | Le code extrait de la requête le nom du site demandé | Le nom vient de la requête, donc d'un tiers : il se vérifie |
| 2. Choisir la configuration | Une table de correspondance « nom d'hôte vers réglages » donne le titre, la langue, les accès à la base | Un nom inconnu est refusé, jamais redirigé vers un site au hasard |
| 3. Ouvrir les données | Une connexion vers la base du site, ou vers ses tables préfixées | Aucune requête ne doit pouvoir toucher les données d'un autre site |
| 4. Répondre | La page est construite avec les fichiers, le cache et la session de ce site | Rien de ce que produit un site ne doit apparaître chez un autre |

## Reconnaître le site demandé

Le **nom d'hôte** est le nom de la machine ou du site visé par la requête : `blog.example` dans l'adresse `https://blog.example/articles` (`https` désigne HTTP chiffré). Le **DNS** (voir la [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034)) est l'annuaire d'Internet qui traduit ce nom en adresse numérique de machine ; plusieurs noms peuvent pointer vers la même machine, et c'est ce qui rend le patron possible : les trois sites de l'image ci-dessus aboutissent tous au même répartiteur. Une requête [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (le message qu'un navigateur envoie à un serveur) transporte le nom visé dans un **en-tête** (une ligne d'information ajoutée à la requête) appelé `Host` (voir [la spécification HTTP](https://www.rfc-editor.org/rfc/rfc9110#name-host-and-authority)). Le code lit cet en-tête, et en déduit le site.

| Critère de choix | Exemple | Avantage | Limite |
|---|---|---|---|
| Nom d'hôte complet | `blog.example` et `boutique.example` | Naturel, un nom par site, un certificat par nom (le document numérique qui prouve l'identité d'un site en HTTPS) | Un nom (et un enregistrement DNS) à créer pour chaque site |
| Sous-domaine (un nom ajouté devant un domaine existant) | `blog.groupe.example` | Un seul domaine à gérer, un certificat « joker » (`*.groupe.example`) possible | Les sites partagent le domaine parent : attention aux **cookies**, ces petits fichiers que le navigateur garde et renvoie à chaque requête (voir plus bas) |
| Début du chemin | `groupe.example/blog/` | Aucun nom supplémentaire à acheter | Le code doit retirer le préfixe de chaque adresse ; les liens relatifs se cassent facilement |
| Port (le numéro de la « porte » d'une machine, 443 pour HTTPS) | `groupe.example:8081` | Pratique en développement | Rare en production (le site réellement ouvert aux visiteurs) : les visiteurs ne tapent pas de port |

Le choix le plus courant est le nom d'hôte. Les exemples de ce chapitre utilisent le suffixe `.example`, **réservé** à la documentation par la [RFC 2606](https://www.rfc-editor.org/rfc/rfc2606) (une **RFC** est un document de référence des standards d'Internet) : ces noms ne désigneront jamais un vrai site.

### Un exemple exécutable en Python

Le programme suivant simule le cœur du patron : une requête arrive avec un nom d'hôte, le code choisit la configuration du site, puis lit les tables **de ce site** dans une base partagée où chaque table porte le **préfixe** du site (un morceau de texte placé devant le nom de la table : `blog_articles` plutôt que `articles`). Il utilise [Python](/?c=langages&s=python&p=python) et [SQLite](https://www.sqlite.org/docs.html), une base de données contenue dans un seul fichier (ou en mémoire), sans serveur à installer, pilotée ici par le module `sqlite3` fourni avec Python. Il est écrit dans un seul fichier `multisite.py`, présenté en trois morceaux à la suite. Il utilise des notions de base de Python : un [dictionnaire](/?c=langages&s=python&p=dictionnaires-et-ensembles) (une table « clé vers valeur »), un [tuple](/?c=langages&s=python&p=listes-et-tuples) (une suite de valeurs figée), une [fonction](/?c=langages&s=python&p=fonctions) (un bloc de code nommé, dont le texte entre triples guillemets placé sous son nom, la *docstring*, est la description) et un [module](/?c=langages&s=python&p=modules-et-environnements) (un fichier de code que l'on importe). Dans les docstrings de ce chapitre, `@brief` résume la fonction, `@param` décrit un argument et `@returns` la valeur rendue. Pour essayer le programme, collez les trois morceaux, dans l'ordre, dans un fichier `multisite.py` créé avec un éditeur de texte, puis lancez-le depuis un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Chaque autre programme du chapitre se colle de la même façon dans un fichier `.py` à part.

Premier morceau : la configuration et la vérification des préfixes. Une **expression régulière** (voir [les regex en Python](/?c=langages&s=python&p=regex-en-python)) est un motif de texte qui décrit les chaînes acceptées ; ici elle n'accepte qu'une lettre minuscule, puis des lettres minuscules ou des chiffres (de 0 à 15 fois, noté `{0,15}`), puis un tiret bas final. Quelques notations Python servent dès ce morceau. Une [*f-string*](/?c=langages&s=python&p=variables#les-f-strings-inserer-des-variables-dans-du-texte) est un texte précédé de `f` où `{expression}` est remplacé par sa valeur ; `{valeur!r}` affiche la valeur avec ses guillemets. Une **exception** (voir [la gestion des erreurs](/?c=langages&s=python&p=gestion-des-erreurs)) est le signal qu'un programme émet quand il ne peut pas continuer normalement : `raise` en émet une ([lever ses propres exceptions](/?c=langages&s=python&p=gestion-des-erreurs#lever-ses-propres-exceptions)) et `ValueError` signale une valeur inacceptable. Une [compréhension de liste](/?c=langages&s=python&p=listes-et-tuples#les-comprehensions-de-liste), `[x for x in suite]`, construit une liste en une seule ligne. Le `r` devant `r"..."` désigne une chaîne brute, où l'antislash n'a pas de sens spécial.

```python
# re : module Python des expressions régulières (motifs de texte)
import re
# sqlite3 : module livré avec Python pour parler à une base SQLite
import sqlite3

# Un dictionnaire : à chaque nom d'hôte, les réglages de son site
SITES = {
    # Un titre d'affichage et le préfixe des tables de chaque site
    "boutique.example": {"titre": "La Boutique", "prefixe": "boutique_"},
    "blog.example": {"titre": "Le Blog", "prefixe": "blog_"},
    "club.example": {"titre": "Le Club", "prefixe": "club_"},
}

# Un préfixe sûr : une minuscule, 0 à 15 minuscules ou chiffres, puis un « _ » final
PREFIXE_SUR = re.compile(r"[a-z][a-z0-9]{0,15}_")


def verifier_les_prefixes():
    """
    @brief Refuse un préfixe dangereux ou qui en recouvre un autre.
    """
    # Liste des préfixes de tous les sites, construite en une ligne ; values() donne
    # les réglages de chaque site
    prefixes = [site["prefixe"] for site in SITES.values()]
    # enumerate donne chaque préfixe avec sa position i dans la liste
    for i, prefixe in enumerate(prefixes):
        # fullmatch exige que TOUT le texte corresponde au motif
        if not PREFIXE_SUR.fullmatch(prefixe):
            # raise arrête le programme avec un message ; !r met le préfixe entre guillemets
            raise ValueError(f"préfixe refusé : {prefixe!r}")
        # On compare avec tous les autres préfixes
        for j, autre in enumerate(prefixes):
            # startswith teste si « autre » commence par « prefixe » : risque de mélange
            if i != j and autre.startswith(prefixe):
                raise ValueError(f"préfixe recouvert : {prefixe!r}")
```

Deuxième morceau : le choix du site d'après le nom d'hôte, et le calcul du nom réel d'une table. Ce morceau lève lui aussi des exceptions (définies plus haut) ; `LookupError` signale « je ne trouve pas ce que vous demandez ».

```python
def choisir_site(hote):
    """
    @brief Trouve la configuration du site demandé par la requête.

    @param hote Texte « nom » ou « nom:port », en majuscules ou en minuscules.

    @returns Le dictionnaire de configuration du site.
    """
    # split(":") coupe au « : » et [0] garde la partie avant (le port est retiré) ;
    # lower() passe en minuscules
    nom = hote.split(":")[0].lower()
    # Un nom absent de la table de correspondance n'est PAS un site de ce parc
    if nom not in SITES:
        # On refuse au lieu de se rabattre sur un site par défaut
        raise LookupError(f"site inconnu : {nom}")
    # Sinon on rend les réglages de ce site
    return SITES[nom]


def table(site, nom):
    """
    @brief Donne le nom réel d'une table : le préfixe du site, puis le nom commun.

    @param site Dictionnaire de configuration d'un site.
    @param nom Nom de table écrit dans le code, jamais saisi par un visiteur.

    @returns Le nom complet, sûr à insérer dans une requête SQL.
    """
    # Le préfixe a été validé au démarrage : il ne contient que des caractères sûrs
    return site["prefixe"] + nom
```

Troisième morceau : la création des tables de chaque site, la réponse à une requête et l'exécution. Le point d'interrogation `?` dans une requête SQL est un **paramètre lié** : la valeur est transmise à part, jamais collée dans le texte de la requête, ce qui empêche l'[injection SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql#injection-sql-pourquoi-ne-jamais-concatener-une-valeur-externe). Il ne sert que pour des **valeurs**. Un nom de table ne peut pas être un paramètre : on le compose donc dans le texte de la requête (avec une *f-string*, vue plus haut), ce qui n'est sûr que parce que le préfixe vient de la configuration et a été validé.

```python
def installer(connexion, site):
    """
    @brief Crée les tables d'un site et y met un premier article.

    @param connexion Connexion SQLite ouverte.
    @param site Dictionnaire de configuration d'un site.
    """
    # Nom réel de la table des articles de ce site, par exemple « blog_articles »
    articles = table(site, "articles")
    # CREATE TABLE IF NOT EXISTS crée la table seulement si elle n'existe pas déjà
    connexion.execute(
        f"CREATE TABLE IF NOT EXISTS {articles} "
        "(id INTEGER PRIMARY KEY, titre TEXT NOT NULL)"
    )
    # INSERT ajoute une ligne ; la valeur passe par le paramètre « ? »
    # (la virgule finale fait de la valeur un tuple d'un seul élément, exigé par execute)
    connexion.execute(
        f"INSERT INTO {articles} (titre) VALUES (?)",
        (f"Bienvenue sur {site['titre']}",),
    )


def servir(connexion, hote):
    """
    @brief Répond à une requête : choisit le site, puis lit ses articles.

    @param connexion Connexion SQLite ouverte.
    @param hote Nom d'hôte de la requête.

    @returns Le titre du site et la liste des titres d'articles.
    """
    # Étapes 1 et 2 de l'image : lire le nom d'hôte, choisir la configuration
    site = choisir_site(hote)
    # Étape 3 : SELECT lit les lignes, uniquement dans les tables de CE site
    lignes = connexion.execute(f"SELECT titre FROM {table(site, 'articles')}")
    # Chaque ligne est un tuple ; liste construite en une ligne avec son premier élément
    return site["titre"], [ligne[0] for ligne in lignes]


# Démarrage : on refuse de continuer si un préfixe est douteux
verifier_les_prefixes()
# Une base SQLite en mémoire : elle disparaît à la fin du programme
connexion = sqlite3.connect(":memory:")
# On crée les tables de chacun des trois sites dans la MÊME base
for site in SITES.values():
    installer(connexion, site)

# Cinq requêtes simulées : trois sites connus (dont un avec port et majuscules), deux faux
HOTES = [
    "boutique.example",
    "BLOG.example:8080",
    "club.example",
    "pirate.example",
    "boutique.example.pirate.example",
]
# Pour chaque nom d'hôte reçu
for hote in HOTES:
    # try / except : on tente la réponse, on intercepte l'exception si le site est inconnu
    try:
        # :33 réserve 33 caractères au nom d'hôte, pour aligner les colonnes
        print(f"{hote:33} -> {servir(connexion, hote)}")
    except LookupError as erreur:
        print(f"{hote:33} -> refusé ({erreur})")

# sqlite_master est la table interne qui liste tout ce que la base contient
noms = connexion.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
# On affiche les noms de tables : trois sites, trois jeux de tables dans une base
print("tables de la base :", [nom[0] for nom in noms])
```

Exécuté avec `python3 -I multisite.py` (l'option `-I` lance Python en mode isolé, qui ignore l'environnement de l'utilisateur), le programme affiche :

```text
boutique.example                  -> ('La Boutique', ['Bienvenue sur La Boutique'])
BLOG.example:8080                 -> ('Le Blog', ['Bienvenue sur Le Blog'])
club.example                      -> ('Le Club', ['Bienvenue sur Le Club'])
pirate.example                    -> refusé (site inconnu : pirate.example)
boutique.example.pirate.example   -> refusé (site inconnu : boutique.example.pirate.example)
tables de la base : ['boutique_articles', 'blog_articles', 'club_articles']
```

Les trois premières lignes montrent le patron fonctionner : la même fonction `servir` répond différemment selon le nom d'hôte, et `BLOG.example:8080` est reconnu malgré les majuscules et le port. Les deux dernières requêtes sont refusées : **un nom inconnu n'est pas redirigé vers un site par défaut**, et un nom qui *commence* comme un vrai (`boutique.example.pirate.example`) n'est pas pris pour lui, car la comparaison porte sur le nom entier. La dernière ligne montre le stockage : une seule base, trois jeux de tables.

> **Piège :** retomber sur « le premier site » ou un « site par défaut » quand le nom d'hôte est inconnu. Un visiteur (ou un robot) qui envoie un faux en-tête `Host` reçoit alors les pages, parfois les données, d'un site qui n'était pas visé, et un cache intermédiaire peut mémoriser ce mélange pour d'autres visiteurs. **Bonne pratique :** une liste fermée de noms autorisés, comme `SITES` ci-dessus, et une erreur claire pour tout le reste (404, le code « page introuvable », ou 421 *Misdirected Request* « requête mal adressée », décrite dans la même [spécification HTTP](https://www.rfc-editor.org/rfc/rfc9110#name-421-misdirected-request)).

L'en-tête `Host` est fourni par le visiteur : il ne faut **jamais** s'en servir tel quel pour fabriquer une adresse absolue (par exemple le lien d'un e-mail de réinitialisation de mot de passe), sinon un attaquant fait envoyer à sa victime un lien vers un domaine qu'il contrôle. L'adresse « officielle » de chaque site se lit dans la configuration, pas dans la requête. Derrière un répartiteur ou un serveur intermédiaire, le nom d'origine peut aussi voyager dans un en-tête de transfert (souvent nommé [`X-Forwarded-Host`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host)) : n'en tenir compte que si l'intermédiaire est de confiance et écrase lui-même cet en-tête.

## Ce qui est partagé, ce qui est isolé

| Élément | Partagé entre les sites | Propre à chaque site |
|---|---|---|
| Code de l'application (fichiers) | Oui, un seul exemplaire | Non |
| Bibliothèques (code réutilisable écrit par d'autres) et extensions (modules qui ajoutent des fonctions) installées | Oui, mêmes versions pour tous | Éventuellement activées ou non par site |
| Mises à jour du code | Oui : un déploiement touche tous les sites | Non |
| Serveurs, mémoire, processeur | Oui, sauf mise en place de quotas | Non par défaut |
| Configuration (titre, langue, accès à la base, [clés d'API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) | Non | Oui, un jeu de réglages par site |
| Données (articles, comptes, commandes) | Non | Oui |
| Fichiers téléversés (images, documents) | Non | Oui, un dossier par site |
| **Cache** (mémoire où l'on garde un résultat pour ne pas le recalculer) et **sessions** (le souvenir de qui est connecté) | Le moteur peut l'être (un même serveur de cache), jamais les clés | Oui : les clés portent l'identifiant du site |
| Secrets (mots de passe de base, clés) | Non | Oui, un jeu par site (voir [Gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |
| Tâches planifiées (programmes lancés à heure fixe) | Le déclencheur peut l'être | Le travail s'exécute pour chaque site |
| Journaux (*logs*, les fichiers où le programme note ce qu'il fait) | Souvent un même flux | Chaque ligne indique le site concerné |

La règle qui découle du tableau : **tout ce qui est partagé est une surface de contagion** (une panne ou une faille s'y propage à tous), et **tout ce qui est isolé doit l'être réellement**, c'est-à-dire sans qu'un oubli dans une requête ou une clé de cache laisse passer les données d'un site vers un autre. Cette logique est celle du *rayon d'impact* décrit dans [Principes de développement sécurisé](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise) : on cherche à réduire ce qu'une erreur ou une compromission peut atteindre.

## Où vivent les données : trois variantes

Le choix le plus structurant du patron est l'endroit où se trouvent les données de chaque site. Trois organisations existent :

```text
 A. Une base par site         B. Préfixe de tables         C. Schéma par site
                                 (une base partagée)          (une base partagée)

 +-----------+ +-----------+   +-----------------------+    +-----------------------+
 | base      | | base      |   | base unique           |    | base unique           |
 | boutique  | | blog      |   |  boutique_articles    |    |  schéma boutique      |
 |  articles | |  articles |   |  boutique_clients     |    |   articles, clients   |
 |  clients  | |  clients  |   |  blog_articles        |    |  schéma blog          |
 +-----------+ +-----------+   |  blog_clients         |    |   articles, clients   |
  (une base de plus            +-----------------------+    +-----------------------+
   pour chaque site)
```

Un **schéma** est un espace de noms (un regroupement qui évite les conflits de noms) à l'intérieur d'une base : deux tables de même nom peuvent y coexister si elles appartiennent à des schémas différents (voir [Schémas et tables techniques](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques)). Une **connexion** est un lien ouvert entre l'application et la base, avec ses propres identifiants.

| | A. Une base par site | B. Préfixe de tables par site | C. Schéma par site |
|---|---|---|---|
| Principe | Chaque site a sa base, avec ses identifiants | Une base commune ; le nom de chaque table commence par le préfixe du site | Une base commune ; chaque site a son espace de noms |
| Avantages | La séparation la plus nette ; sauvegarde, restauration et suppression d'un site très simples | Une seule base à héberger et à surveiller ; fonctionne partout, même avec un moteur de base de données sans schémas (SQLite, par exemple) | Séparation claire sans multiplier les bases ; mêmes noms de tables pour tous les sites |
| Limites | N bases à créer, héberger, surveiller et mettre à jour ; N jeux de connexions | Aucune barrière réelle entre les sites ; les noms de tables s'allongent ; le catalogue de la base (la liste interne de ses tables) grossit : N fois le nombre de tables | Dépend du moteur : tous n'offrent pas de vrais schémas ; la mise à jour reste à faire N fois |
| Écrire du code | Une connexion différente par site | Penser au préfixe dans chaque requête | Choisir le schéma de la connexion, ou nommer `schéma.table` |

| | A. Une base par site | B. Préfixe de tables par site | C. Schéma par site |
|---|---|---|---|
| Isolation des données | Forte : une requête n'atteint que la base ouverte | Faible : toutes les tables sont visibles depuis la même connexion | Moyenne à forte, selon les droits donnés sur chaque schéma |
| Droits SQL (voir le [moindre privilège](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)) | Un compte par base, simple | Un compte voit tout, sauf droits donnés table par table (fastidieux) | Un compte par schéma possible |
| Sauvegarde d'un seul site | Copier ou exporter une base | Exporter seulement les tables du préfixe (voir plus bas) | Exporter un schéma |
| Restauration d'un seul site | Remplacer une base | Remplacer un jeu de tables, sans toucher les autres | Remplacer un schéma |
| Connexions à la base | Une par site utilisé et par processus (un programme en cours d'exécution ; voir [les risques](#les-risques-du-patron)) | Une par processus, quel que soit le site | Une par processus, avec le schéma choisi à la volée |
| Coût d'hébergement | Plus élevé : de la mémoire et des fichiers par base | Le plus bas | Bas |
| Passage à un autre serveur pour un site devenu énorme | Facile : on déplace la base | Pénible : il faut extraire les tables du préfixe | Moyen : on déplace le schéma |

Aucune variante n'est la meilleure en soi. En pratique : **A** quand l'isolation et l'autonomie comptent plus que le coût (clients qui exigent la séparation de leurs données, sites très inégaux) ; **B** quand on a beaucoup de petits sites semblables et un moteur de base simple ; **C** quand le moteur offre de vrais schémas et que l'on veut un compromis. La [mise à l'échelle de la base](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) (cache, réplicas, partitionnement) se pose ensuite site par site ou pour l'ensemble.

### Variante A en code : un fichier par site

Avec SQLite, une « base par site » est un fichier par site. Ce programme crée deux fichiers, montre que la connexion d'un site ne voit pas les tables d'un autre, puis sauvegarde un seul site. Le module `tempfile` crée un dossier temporaire, `pathlib.Path` manipule des chemins de fichiers (voir [manipuler des fichiers et dossiers](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)).

```python
# sqlite3 : accès à SQLite ; tempfile : dossier temporaire ; Path : chemins de fichiers
import sqlite3
import tempfile
from pathlib import Path

# Les noms de sites sont choisis par le code, jamais par un visiteur
SITES = ["boutique", "blog"]
# Un dossier temporaire créé pour l'essai (mkdtemp ne le supprime pas à la fin)
dossier = Path(tempfile.mkdtemp())


def ouvrir(site):
    """
    @brief Ouvre la base propre à un site : un fichier par site.

    @param site Nom du site, choisi par le code (jamais par un visiteur).

    @returns Une connexion SQLite sur le fichier de ce site.
    """
    # Le fichier est créé à la première ouverture ; l'opérateur / assemble les chemins
    return sqlite3.connect(dossier / f"{site}.sqlite")


# On prépare un fichier par site
for site in SITES:
    # Connexion au fichier de ce site
    base = ouvrir(site)
    # Même nom « articles » pour tous : plus de préfixe, la séparation est le fichier
    base.execute("CREATE TABLE articles (id INTEGER PRIMARY KEY, titre TEXT)")
    # Une ligne d'exemple
    base.execute("INSERT INTO articles (titre) VALUES (?)", (f"Article de {site}",))
    # commit rend les changements définitifs dans le fichier
    base.commit()
    # On referme la connexion
    base.close()

# Une table « ventes » créée dans la base de la boutique seulement
boutique = ouvrir("boutique")
boutique.execute("CREATE TABLE ventes (id INTEGER PRIMARY KEY, montant REAL)")
boutique.commit()
boutique.close()

# Isolation : la connexion du blog ne voit que le fichier du blog
blog = ouvrir("blog")
# Lecture de ses propres articles ; fetchall rend toutes les lignes sous forme de liste
print("blog :", blog.execute("SELECT titre FROM articles").fetchall())
# Tentative de lire une table qui n'existe que dans le fichier de la boutique
try:
    blog.execute("SELECT montant FROM ventes")
except sqlite3.OperationalError as erreur:
    print("table d'un autre site ->", erreur)

# Sauvegarde d'un seul site : copier sa base dans un nouveau fichier
copie = sqlite3.connect(dossier / "blog-sauvegarde.sqlite")
# backup copie toute la base du blog, même si des écritures arrivent pendant la copie
blog.backup(copie)
# iterdir() liste le contenu du dossier ; la liste triée des noms est construite en une
# ligne (expression génératrice : une compréhension sans crochets)
print("fichiers :", sorted(chemin.name for chemin in dossier.iterdir()))
# On referme les deux connexions restantes
blog.close()
copie.close()
```

Sortie obtenue :

```text
blog : [('Article de blog',)]
table d'un autre site -> no such table: ventes
fichiers : ['blog-sauvegarde.sqlite', 'blog.sqlite', 'boutique.sqlite']
```

La requête qui vise la table `ventes`, présente seulement dans le fichier de la boutique, échoue depuis la connexion du blog : c'est l'isolation de la variante A. La sauvegarde d'un seul site ne demande aucun tri, puisque tout le contenu du fichier lui appartient.

### Variante C en code : un schéma par site

SQLite n'a pas de schémas au sens des autres moteurs, mais son instruction `ATTACH DATABASE` (« rattacher une base ») rattache à une connexion plusieurs bases nommées, que l'on interroge avec la même écriture `nom.table` qu'un schéma. C'est une bonne simulation du comportement, sans prétendre reproduire les droits d'un moteur plus complet.

```python
# sqlite3 : module Python pour parler à une base SQLite
import sqlite3

# Une connexion principale, en mémoire
connexion = sqlite3.connect(":memory:")

# ATTACH rattache une base supplémentaire sous un nom : ici, une par site
connexion.execute("ATTACH DATABASE ':memory:' AS boutique")
connexion.execute("ATTACH DATABASE ':memory:' AS blog")
# Les deux tables portent le même nom ; le nom devant le point les distingue
connexion.execute("CREATE TABLE boutique.articles (id INTEGER PRIMARY KEY, titre TEXT)")
connexion.execute("CREATE TABLE blog.articles (id INTEGER PRIMARY KEY, titre TEXT)")
# Une seule ligne, ajoutée dans la table du blog
connexion.execute("INSERT INTO blog.articles (titre) VALUES ('Article du blog')")
# Lecture dans l'espace « blog »
lignes_blog = connexion.execute("SELECT titre FROM blog.articles").fetchall()
print("blog.articles     :", lignes_blog)
# Lecture dans l'espace « boutique » : même nom de table, contenu séparé
lignes_boutique = connexion.execute("SELECT titre FROM boutique.articles").fetchall()
print("boutique.articles :", lignes_boutique)
```

Sortie obtenue :

```text
blog.articles     : [('Article du blog',)]
boutique.articles : []
```

Les deux tables `articles` coexistent sans conflit. Dans un moteur qui connaît les schémas (PostgreSQL, par exemple, dont la [documentation des schémas](https://www.postgresql.org/docs/current/ddl-schemas.html) décrit aussi le chemin de recherche qui évite d'écrire le nom du schéma devant chaque table), on choisit le schéma une fois à l'ouverture de la connexion.

## Sauvegarder et restaurer un seul site

Dans la variante A, sauvegarder un site est évident : on copie sa base. Dans la variante B, il faut retrouver **les tables de ce site** parmi toutes celles de la base. L'idée naturelle est de chercher les noms qui commencent par le préfixe, avec l'opérateur SQL `LIKE`, qui compare un texte à un motif. Elle contient un piège classique : dans un motif `LIKE`, le tiret bas `_` ne veut pas dire « un tiret bas » mais « **n'importe quel caractère unique** » (et `%` veut dire « n'importe quelle suite de caractères »).

```python
# sqlite3 : module Python pour parler à une base SQLite
import sqlite3

# Une base en mémoire contenant les tables de deux sites aux noms proches
connexion = sqlite3.connect(":memory:")
# « blog_ » et « blogger_ » sont deux préfixes différents, aucun ne commence par l'autre
for nom in ["blog_articles", "blog_notes", "blogger_articles"]:
    # On crée une table minimale pour chaque nom
    connexion.execute(f"CREATE TABLE {nom} (id INTEGER)")

# sqlite_master liste les tables ; LIKE ? compare le nom au motif transmis en paramètre
requete = "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE ?"
# « _ » vaut « n'importe quel caractère » : « blog_% » attrape aussi blogger_articles
naif = connexion.execute(requete, ("blog_%",)).fetchall()
print("LIKE 'blog_%'          :", sorted(nom[0] for nom in naif))
# On échappe le « _ » avec « \ » et on le déclare avec ESCAPE : il redevient un vrai tiret bas
exact = connexion.execute(requete + " ESCAPE '\\'", ("blog\\_%",)).fetchall()
print("LIKE 'blog\\_%' ESCAPE  :", sorted(nom[0] for nom in exact))
```

Sortie obtenue :

```text
LIKE 'blog_%'          : ['blog_articles', 'blog_notes', 'blogger_articles']
LIKE 'blog\_%' ESCAPE  : ['blog_articles', 'blog_notes']
```

Sans l'échappement, la sauvegarde du blog aurait emporté la table `blogger_articles` d'un autre site : une fuite de données dans un fichier de sauvegarde. Même avec l'échappement, une règle de sécurité reste préférable : **vérifier au démarrage que le préfixe d'un site n'est le début d'aucun autre** (ce que fait `verifier_les_prefixes` plus haut) et **construire la liste des tables du site dans le code** (`prefixe + nom` pour chaque table connue) plutôt que de la déduire d'un motif. Pour les variantes A et C, cette étape de tri n'existe pas, ce qui est un argument concret en faveur de leur isolation.

| Opération | Variante A (base) | Variante B (préfixe) | Variante C (schéma) |
|---|---|---|---|
| Sauvegarder un site | Une exportation de la base | Exporter la liste exacte de tables du site | Exporter le schéma |
| Restaurer un site | Remplacer la base | Supprimer puis recréer les tables du préfixe, en vérifiant qu'aucune table d'un autre site n'est touchée | Remplacer le schéma |
| Supprimer un site | Supprimer la base | Supprimer ses tables, une par une | Supprimer le schéma |
| Cloner un site (préproduction : copie de test avant la mise en ligne) | Copier la base | Copier les tables sous un nouveau préfixe | Copier le schéma |
| Risque principal | Oublier une base dans la liste des sauvegardes | Confondre deux préfixes proches | Droits trop larges sur plusieurs schémas |

## Mettre à jour tout le parc

Mutualiser le code veut dire aussi mutualiser les **changements de structure** : ajouter une colonne à la table des articles (voir [Migrations de données sûres](/?c=donnees&s=bases-de-donnees&p=migrations-de-donnees-sures) et la section sur les migrations de l'[ORM](/?c=donnees&s=bases-de-donnees&p=orm) pour la notion de migration versionnée) doit être fait **dans chacun des N sites**, puisque chacun a ses propres tables. Le code est déployé une fois ; la structure, elle, se met à jour N fois.

```text
Déploiement du nouveau code  (une fois, instantané)
        |
        v
Nouveau code attend une colonne « publie » dans les articles
        |
        v
Migration de la structure
   site 1 ... OK
   site 2 ... OK
   site 3 ... ÉCHEC            <- le parc est maintenant DANS UN ÉTAT MIXTE
   sites 4 à 40 ... en attente    (le nouveau code sur des tables à l'ancienne structure)
```

L'état mixte est le risque propre à ce patron : tant que la boucle n'a pas fini, le même code tourne devant des structures différentes. Les parades sont les mêmes que pour une migration de données : une opération **rejouable sans risque** (l'**idempotence**, c'est-à-dire donner le même résultat qu'on la joue une ou plusieurs fois), un journal de ce qui est déjà fait, et un code compatible avec l'ancienne **et** la nouvelle structure pendant la transition.

```python
# sqlite3 : module Python pour parler à une base SQLite
import sqlite3

# Les préfixes de trois sites partageant une même base
PREFIXES = ["boutique_", "blog_", "club_"]
# Base en mémoire pour l'essai
connexion = sqlite3.connect(":memory:")
# On crée la table des articles de chaque site, avec l'ancienne structure
for prefixe in PREFIXES:
    connexion.execute(f"CREATE TABLE {prefixe}articles (id INTEGER, titre TEXT)")
# Un site a déjà reçu la nouvelle colonne lors d'un essai précédent interrompu
connexion.execute("ALTER TABLE blog_articles ADD COLUMN publie INTEGER DEFAULT 0")


def migrer(connexion, prefixe):
    """
    @brief Ajoute la colonne « publie » si elle manque (rejouable sans risque).

    @param connexion Connexion SQLite ouverte.
    @param prefixe Préfixe de tables d'un site, déjà validé.

    @returns « migré » ou « déjà à jour ».
    """
    # Nom réel de la table de ce site
    table = f"{prefixe}articles"
    # PRAGMA table_info liste les colonnes ; l'indice 1 de chaque ligne est le nom
    colonnes = [ligne[1] for ligne in connexion.execute(f"PRAGMA table_info({table})")]
    # Colonne déjà présente : rien à faire, et surtout pas d'erreur « duplicate column »
    if "publie" in colonnes:
        # Réponse sans rien modifier
        return "déjà à jour"
    # ALTER TABLE ... ADD COLUMN ajoute la colonne, valeur 0 pour les lignes existantes
    connexion.execute(f"ALTER TABLE {table} ADD COLUMN publie INTEGER DEFAULT 0")
    # On signale que ce site vient d'être modifié
    return "migré"


# Une migration du parc = une boucle sur tous les sites ; on la joue deux fois
for passage in (1, 2):
    # Un dictionnaire par passage (construit en une ligne) : préfixe -> résultat
    bilan = {prefixe: migrer(connexion, prefixe) for prefixe in PREFIXES}
    print(f"passage {passage} :", bilan)
```

Sortie obtenue :

```text
passage 1 : {'boutique_': 'migré', 'blog_': 'déjà à jour', 'club_': 'migré'}
passage 2 : {'boutique_': 'déjà à jour', 'blog_': 'déjà à jour', 'club_': 'déjà à jour'}
```

Le premier passage migre deux sites et reconnaît que le troisième l'était déjà ; le second ne change plus rien. Sans la vérification de la colonne, le premier passage aurait échoué sur le blog et laissé les sites suivants non migrés.

| Pratique de déploiement | Effet | Précaution |
|---|---|---|
| Migrer d'abord un site pilote, puis les autres par lots | Un défaut est découvert sur un seul site | Choisir un site représentatif mais peu critique |
| Écrire le nouveau code pour qu'il tolère l'ancienne structure | Pas d'interruption pendant la boucle de migration | Retirer le code de compatibilité une fois tous les sites migrés |
| Enregistrer, par site, la version de structure atteinte | On sait précisément où reprendre après une panne | Une table de suivi par site, ou un identifiant de version dans la configuration |
| Prévoir le temps total (nombre de sites fois durée d'une migration) | Évite la surprise d'une migration de plusieurs heures | 40 sites à 3 minutes chacun, c'est deux heures de boucle |
| Garder une marche arrière par site | Un site en échec ne bloque pas les autres | Sauvegarder chaque site avant de le migrer |

## Les risques du patron

La mutualisation transforme chaque problème local en problème potentiellement collectif :

| Risque | Mécanisme | Parade |
|---|---|---|
| Une mise à jour touche tous les sites | Un déploiement défectueux casse les N sites d'un coup | Déploiement progressif (un site pilote, puis des lots) ; test sur une copie ; retour arrière préparé (voir [mises à jour progressives](/?c=infrastructure-devops&s=kubernetes&p=autoscaling-et-rolling-updates)) |
| Une faille de code touche tout le parc | Le code est identique partout : une injection ou une faille d'accès exploitable sur un site l'est sur tous | Mises à jour de sécurité rapides ; droits SQL limités ; isolation des données (variantes A ou C) ; surveillance par site |
| Un site « bruyant » ralentit les autres | Un site très sollicité (campagne, robot, import massif) consomme le processeur, la mémoire ou les connexions de la base partagée : c'est l'effet du **voisin bruyant** (*noisy neighbor*) | Quotas par site ; limitation du débit (voir [surcharge et déni de service applicatif](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) ; sortir le site du parc (voir plus bas) |
| Saturation des connexions de la base | Chaque processus ouvre des connexions : en multipliant par le nombre de sites, on dépasse la limite de la base | Un [pool de connexions](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#connection-pooling) partagé (un ensemble de connexions déjà ouvertes et réutilisées) ; connexions ouvertes à la demande ; plafond par site |
| Fuite de données entre sites | Une requête oubliant le préfixe ou le schéma, une clé de cache sans identifiant de site | Une seule fonction construit les noms de table ; revue de code ; test automatique de non-mélange |
| Cache mélangé | Deux sites écrivent sous la même clé (`panier:42`) dans le même serveur de cache | Préfixer toutes les clés par le site (`boutique:panier:42`), voir [Redis](/?c=donnees&s=bases-de-donnees&p=redis) |
| Sessions partagées par un cookie trop large | Un cookie créé pour le domaine parent (`.groupe.example`) est envoyé à tous les sous-sites | Un cookie par nom d'hôte, sans attribut de domaine ; voir [sessions et cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) |
| Tâches planifiées trop lourdes | Une tâche qui boucle sur 40 sites dure 40 fois plus ; un site lent retarde les suivants | Un travail découpé par site, exécuté en parallèle avec un plafond |
| Journaux illisibles | Impossible de savoir quel site cause un problème | Une ligne de journal contient toujours l'identifiant du site (voir [agrégation de logs](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs)) |

### L'arithmétique des connexions

Une base n'accepte qu'un nombre limité de connexions simultanées. Si chaque processus de l'application ouvre une connexion **par site**, le total grandit comme un produit. Avec des chiffres d'exemple (inventés) : 6 serveurs, 8 processus par serveur, 40 sites, et une base qui accepte 200 connexions.

| Organisation | Calcul | Connexions au pire |
|---|---|---|
| Une base commune (variantes B et C), une connexion par processus | 6 × 8 | 48 |
| Une base par site (variante A), une connexion ouverte à la demande par site servi | 6 × 8 × 40 | 1 920 |
| Même variante A avec un pool partagé plafonné à 100 connexions | plafond | 100 |

La variante A, la plus isolée, est celle qui sature le plus vite : sans pool ni plafond, 1 920 connexions possibles contre 200 acceptées veulent dire des refus de connexion à la première affluence. Le passage à l'échelle des serveurs applicatifs (ajouter des machines avec l'[autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge)) multiplie encore le premier facteur : **ajouter un serveur augmente le nombre de connexions que la base doit supporter**, ce qui doit être anticipé.

### Quand un site doit quitter le parc

Un site dont le trafic dépasse largement celui des autres pose le même problème que le « compte-célébrité » du [fil d'actualité](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out) : le traiter comme les autres coûte cher à tous. La parade est comparable, un **modèle hybride** : la majorité des petits sites reste dans le parc mutualisé, et le site géant reçoit sa propre base, voire ses propres serveurs, tout en continuant à exécuter **le même code**. C'est un argument pour que la configuration d'un site décide de l'endroit où vivent ses données (et non pas le code), afin que ce déménagement ne demande qu'un changement de réglage.

## Quand choisir ce patron

Le patron multisite n'est pas la seule façon de servir plusieurs sites ou plusieurs clients :

| | Une installation par site | Multisite (ce chapitre) | Une seule installation, une colonne « site » |
|---|---|---|---|
| Principe | Chaque site a son propre déploiement complet (code, base, serveurs), par exemple un [conteneur](/?c=infrastructure-devops&s=docker&p=concepts-de-base) par site | Un code, N configurations, N jeux de données | Un seul site technique ; chaque ligne de chaque table porte l'identifiant du **locataire** (le client ou la marque à qui elle appartient) |
| Isolation | Maximale | Bonne à moyenne selon la variante | Faible : tout dépend d'un `WHERE site = ...` (la clause SQL qui filtre les lignes) sans oubli |
| Coût par site | Élevé | Moyen | Faible |
| Mise à jour | N déploiements, mais indépendants, décalables | Un déploiement pour le code, N migrations | Un déploiement, une migration |
| Personnalisation d'un site | Libre | Par configuration, ou extensions activées par site | Limitée |
| Quand l'utiliser | Peu de sites, forte autonomie ou contraintes légales | Beaucoup de sites semblables, une équipe qui veut un code unique | Très nombreux locataires identiques (milliers), isolation assurée par le code |

Le multisite se justifie quand les sites **se ressemblent beaucoup** (mêmes fonctionnalités, mêmes cycles de mise à jour) et qu'une même équipe les gère. Il se justifie moins quand les sites divergent en fonctionnalités (le code finit plein de « si ce site... »), quand des obligations contractuelles ou légales exigent une séparation stricte (hébergement dans des pays différents, par exemple), ou quand l'indépendance des dates de mise à jour est une exigence de chaque site.

## Un exemple de CMS : Drupal

> **Cet exemple n'est pas le sujet du chapitre.** Le patron décrit plus haut s'applique à n'importe quel logiciel. Drupal est donné ici seulement pour montrer une mise en œuvre réelle de ce patron : c'est un [système de gestion de contenu](https://www.drupal.org/docs) (*CMS* pour *Content Management System*, un logiciel qui permet de publier et d'organiser des pages sans les écrire à la main) écrit en [PHP](/?c=langages&s=php&p=syntaxe) qui sait, par conception, servir plusieurs sites depuis un seul code. Les noms et le comportement décrits ici sont vérifiés sur le code source de Drupal 11.x.

Drupal range ses sites dans un dossier `sites/` situé à côté du code commun. Chaque site a son sous-dossier, dont les fichiers jouent les rôles du tableau du patron :

| Élément du patron | Réalisation dans Drupal |
|---|---|
| Un code partagé | Un seul exemplaire des fichiers de Drupal et de ses modules |
| Table « nom d'hôte vers site » | Un fichier `sites/sites.php` qui associe une adresse à un sous-dossier ; sans lui, Drupal sert toujours `sites/default` |
| Configuration d'un site | Un fichier `settings.php` dans le sous-dossier du site |
| Fichiers propres au site | Un dossier de fichiers dans le sous-dossier du site |
| Base de données du site | Réglée dans `settings.php` : base propre, ou base partagée avec un **préfixe de tables** |

L'arborescence ressemble à ceci :

```text
 racine du projet
  ├── (code commun de l'application et de ses modules)
  └── sites/
        ├── sites.php            <- correspondances « adresse -> sous-dossier »
        ├── default/             <- site par défaut
        ├── boutique/
        │     ├── settings.php   <- base, préfixe, réglages du site « boutique »
        │     └── files/         <- fichiers téléversés de ce site
        └── blog/
              ├── settings.php
              └── files/
```

Le fichier `settings.php` d'un site déclare la connexion à la base et, éventuellement, le préfixe. Voici une version minimale, écrite pour ce chapitre (noms inventés) ; `$databases` est un **tableau** PHP (une liste de paires nom-valeur) dont les clés décrivent la connexion (`mysql` désigne [MySQL](https://dev.mysql.com/doc/), un logiciel de base de données) :

```php
<?php

// Réglages de la connexion à la base du site « blog », dans le tableau $databases
$databases['default']['default'] = [
  // Nom de la base : une base propre au site (variante A du chapitre)
  'database' => 'base_blog',
  // Compte d'accès à la base, limité à cette base
  'username' => 'compte_blog',
  // getenv lit une variable d'environnement : le mot de passe n'est pas écrit dans le fichier
  'password' => getenv('MOT_DE_PASSE_BLOG'),
  // Adresse du serveur de base de données
  'host' => 'base.interne.example',
  // Moteur de base de données utilisé (MySQL ici)
  'driver' => 'mysql',
  // Préfixe de tables : vide ici ; avec une base partagée (variante B), 'blog_'
  'prefix' => '',
];
```

Le fichier `sites/sites.php` associe un nom d'hôte au sous-dossier qui le sert. Il n'existe pas à l'installation : on copie le fichier d'exemple `sites/example.sites.php` sous le nom `sites/sites.php`. Sans `sites/sites.php`, Drupal sert toujours le site `sites/default`, et c'est ce fichier qui active le multisite :

```php
<?php

// Le nom d'hôte demandé (clé) sert les réglages du sous-dossier « blog » (valeur)
$sites['blog.example'] = 'blog';
// Même principe pour la boutique : une ligne par site du parc
$sites['boutique.example'] = 'boutique';
```

Un nom d'hôte absent de `sites.php` n'est pas refusé : Drupal retombe aussi sur `sites/default`, le « site par défaut » que le chapitre déconseille. Seul le réglage `trusted_host_patterns` de `settings.php` (la liste des noms d'hôte acceptés) peut refuser un nom inconnu.

Ce que l'exemple illustre du patron : le **code est commun**, la **table de correspondance** est une simple liste, la **configuration** (dont le choix entre base propre et préfixe de tables) est un fichier par site, et les **fichiers** ont un dossier par site. Il en illustre aussi les risques : une mise à jour de Drupal ou d'un module touche tous les sites à la fois, et les commandes d'administration en ligne de commande doivent désigner explicitement le site visé (l'outil d'administration de Drupal en ligne de commande, [Drush](https://www.drush.org/), le fait par une option qui donne l'adresse du site), sous peine d'agir sur le mauvais.

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| Un « site par défaut » pour tout nom inconnu | Un faux en-tête `Host` obtient les pages ou les données d'un autre site ; un cache peut mémoriser le mélange | Liste fermée de noms ; erreur (404 ou 421) pour le reste |
| Fabriquer des adresses absolues à partir de l'en-tête `Host` | Un attaquant fait envoyer à sa victime un lien vers son propre domaine | Lire l'adresse officielle du site dans la configuration |
| Préfixe de table saisi ou modifiable par un visiteur | Injection SQL par le nom de table, qu'un paramètre lié ne peut pas protéger | Préfixe issu de la configuration, validé au démarrage par un motif strict |
| Deux préfixes identiques, ou l'un début de l'autre (`blog_` et `blog_eu_`, si le motif admet un `_` interne) | Les tables d'un site peuvent se confondre avec celles d'un autre | Vérifier au démarrage qu'aucun préfixe n'en recouvre un autre |
| `LIKE 'prefixe_%'` pour retrouver les tables d'un site | Le `_` du motif vaut « n'importe quel caractère » : une sauvegarde peut emporter les tables d'un autre site | `ESCAPE`, ou mieux, une liste de tables construite dans le code |
| Clés de cache sans identifiant de site | Un site lit la donnée mise en cache par un autre | Préfixer toutes les clés par le site |
| Cookie de session pour le domaine parent | Une session valable sur un site l'est sur tous les sous-sites | Un cookie par nom d'hôte |
| Migrer les sites sans l'avoir prévu rejouable | Un échec au site 3 laisse un parc en état mixte, et la relance échoue | Opération idempotente, journal par site |
| Une connexion par processus et par site, sans plafond | Les connexions dépassent la limite de la base dès l'affluence | Pool partagé, ouverture à la demande, plafond par site |
| Journaux sans identifiant de site | On ne sait pas quel site cause un incident | L'identifiant du site dans chaque ligne |
| Garder dans un site géant le même régime que les petits | Le site gêne tout le parc | Déplacer ses données et ses serveurs, avec le même code |
| Personnaliser le code pour un site | Le code unique devient une collection de cas particuliers | Passer par la configuration ou une extension activée par site |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Une table de correspondance fermée « nom d'hôte vers configuration », vérifiée au démarrage | Aucun site inattendu n'est servi |
| Toute différence entre sites vit dans la configuration, jamais dans le code | Le code reste unique et testable |
| Une seule fonction construit les noms de tables (ou choisit la connexion) | Aucune requête ne peut oublier l'isolation |
| Un test automatique qui interroge deux sites et vérifie qu'aucune donnée ne passe de l'un à l'autre | Une fuite est détectée avant la production |
| Choisir la variante de stockage d'après l'isolation exigée, pas d'après la commodité du premier jour | Changer de variante plus tard coûte cher |
| Déployer d'abord sur un site pilote, puis par lots | Un défaut ne touche pas tout le parc |
| Des migrations idempotentes, avec la version atteinte enregistrée par site | Une panne en cours de route se rattrape |
| Comptabiliser les connexions (processus × sites) avant d'ajouter des serveurs | La base ne s'effondre pas à l'affluence |
| Mettre l'identifiant du site dans les journaux, les clés de cache et les métriques (mesures chiffrées de l'activité) | On repère le site bruyant et on isole un incident |
| Prévoir dès le départ la sortie d'un site du parc | Un site géant déménage par un changement de réglage |
| Sauvegarder et tester la restauration site par site | La remise en état d'un site n'implique pas les autres |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le **patron multisite** sert N sites depuis **une seule base de code** : à chaque requête, le code lit le nom d'hôte, choisit la configuration du site dans une liste fermée, puis ouvre les données de **ce** site. Le code et ses mises à jour sont **partagés** ; la configuration, les données, les fichiers, les clés de cache et les secrets sont **isolés**. Les données se rangent de trois façons : une **base par site** (isolation forte, coût et connexions plus élevés), un **préfixe de tables** dans une base partagée (le moins cher, la plus faible isolation, des précautions pour sauvegarder), un **schéma par site** (compromis, selon le moteur). Le prix du patron est un risque collectif : une mise à jour ou une faille de code touche tous les sites, un site bruyant ralentit les autres, les connexions de la base se multiplient avec le nombre de sites. Drupal n'est qu'un exemple de produit qui met ce patron en œuvre. |
| **Pièges à éviter** | Servir un site par défaut pour un nom inconnu ; construire des adresses depuis l'en-tête `Host` ; laisser un visiteur influencer le préfixe ; des préfixes qui se recouvrent ; retrouver les tables d'un site avec un `LIKE` non échappé ; des clés de cache ou des cookies communs à plusieurs sites ; une migration non rejouable ; une connexion par processus et par site sans plafond ; des journaux sans identifiant de site ; personnaliser le code pour un site. |
| **Bonnes pratiques** | Une liste fermée de sites, vérifiée au démarrage ; la configuration pour toute différence entre sites ; une fonction unique pour construire les noms de tables ou choisir la connexion ; un test de non-mélange entre deux sites ; un déploiement progressif avec un site pilote ; des migrations idempotentes suivies par site ; un calcul des connexions avant d'ajouter des serveurs ; l'identifiant du site partout (journaux, cache, métriques) ; une sortie prévue pour un site devenu trop gros. |
