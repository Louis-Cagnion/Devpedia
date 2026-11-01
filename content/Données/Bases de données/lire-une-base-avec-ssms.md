---
order: 13
---

# Lire une base de données avec SSMS (31/10/2026)

Une **base de données** est un ensemble organisé de données, rangées dans des **tables** (des tableaux de lignes et de colonnes, comme une feuille de tableur). Un **serveur de base de données** est un programme qui garde ces tables et répond aux demandes des autres programmes ; **Microsoft SQL Server** (voir sa [documentation officielle](https://learn.microsoft.com/en-us/sql/sql-server/)) est l'un d'eux. On lui parle en [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql), un langage fait pour décrire quelles données on veut lire ou modifier. Une demande écrite en SQL s'appelle une **requête**.

**SSMS** (*SQL Server Management Studio*, « studio de gestion de SQL Server ») est le logiciel graphique de Microsoft pour se connecter à un serveur SQL Server, parcourir ses bases à la souris, écrire des requêtes et lire leurs résultats. Il fonctionne sous Windows uniquement ; sous macOS ou Linux, Microsoft propose l'[extension MSSQL pour Visual Studio Code](https://learn.microsoft.com/en-us/sql/tools/visual-studio-code/mssql-extensions), dont l'interface diffère de celle décrite ici. Ce chapitre s'adresse à quelqu'un qui découvre une base existante : il apprend à s'y connecter, à la parcourir, à poser une question sans rien casser, et à vérifier que son compte n'a pas le pouvoir de casser quoi que ce soit.

Les noms de menus, de boutons et de fenêtres viennent de la documentation officielle de Microsoft ; ils sont donnés en anglais (en italique), accompagnés d'une traduction indicative ; l'interface en français peut employer d'autres mots. L'interface change d'une version à l'autre, et un libellé peut différer chez vous : cherchez alors le même mot dans la [documentation de SSMS](https://learn.microsoft.com/en-us/ssms/sql-server-management-studio-ssms). L'installation du logiciel n'est pas traitée ici (voir la [page de téléchargement](https://learn.microsoft.com/en-us/ssms/download-sql-server-management-studio-ssms)).

| Question | Section |
|---|---|
| Comment se connecter, et que veulent dire les options ? | [Se connecter à un serveur](#se-connecter-a-un-serveur) |
| Où sont les tables et leurs colonnes ? | [L'Explorateur d'objets](#l-explorateur-d-objets-parcourir-sans-ecrire) |
| Comment écrire et lancer une requête ? | [Ouvrir une fenêtre de requête](#ouvrir-une-fenetre-de-requete) et [Exécuter](#executer-tout-le-fichier-ou-seulement-la-selection) |
| Que veut dire « 2 lignes affectées » ? | [Lire le résultat](#lire-le-resultat) |
| Comment être sûr de ne rien modifier ? | [Droits : la lecture seule vient du compte](#droits-la-lecture-seule-vient-du-compte-pas-de-l-attention) |
| Quelles erreurs font les débutants ? | [Les erreurs de débutant](#les-erreurs-de-debutant) |

## Ce qu'il faut avoir avant de commencer

Un serveur SQL Server contient plusieurs niveaux emboîtés. SSMS les affiche dans cet ordre, du plus large au plus précis :

```
  Votre ordinateur (SSMS)  ---- réseau ---->  Le serveur (la machine)
                                                 |
                                                 +-- une instance de SQL Server
                                                      |  (un exemplaire du programme)
                                                      +-- base de données "librairie_demo"
                                                      |     |
                                                      |     +-- schéma "dbo"
                                                      |           +-- table "clients"
                                                      |           +-- table "livres"
                                                      +-- base de données "autre_base"
                                                            +-- ...
```

Une **instance** est un exemplaire du programme SQL Server qui tourne sur une machine ; une même machine peut en héberger plusieurs, chacune avec ses bases. Un **schéma** est un dossier de noms qui range les tables d'une base et évite que deux tables de même nom se confondent, et `dbo` est le schéma par défaut : voir [les schémas et les tables techniques](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques). Une même base peut aussi exister en plusieurs copies sur des serveurs différents (par exemple une pour les essais et une pour le vrai travail) ; c'est la première source de confusion, traitée plus bas.

Avant d'ouvrir SSMS, il faut obtenir quatre informations auprès de la personne qui administre le serveur :

| Information | Exemple générique | À quoi elle sert |
|---|---|---|
| Le nom du serveur (et de l'instance, s'il y en a une) | `NOM_DU_SERVEUR` ou `NOM_DU_SERVEUR\INSTANCE_A` | Dire à SSMS où se connecter |
| Le mode d'authentification à utiliser | Compte Windows ou login SQL (compte propre à SQL Server, voir [l'authentification](#authentification-windows-ou-authentification-sql-server)) | Prouver qui vous êtes |
| Le nom de la base à consulter | `librairie_demo` | Savoir dans quelle base écrire ses requêtes |
| Les droits de votre compte sur cette base | Lecture seule, ou lecture et écriture | Savoir ce que vous avez le droit de faire |

Les exemples de ce chapitre utilisent une librairie inventée : une base `librairie_demo` avec deux tables, `clients` et `livres`. Ces noms sont fictifs ; remplacez-les par les vôtres.

## La fenêtre de SSMS d'un coup d'œil

Une fois connecté, la fenêtre se compose de quelques zones. Le schéma ci-dessous est simplifié : la disposition exacte dépend de la version et des réglages. La requête qui y figure lit des clients : `SELECT` liste les colonnes voulues, `FROM` nomme la table lue (`dbo.clients` : schéma `dbo`, table `clients`), `WHERE` ne garde que les lignes qui respectent la condition (un texte s'écrit entre apostrophes, `'Lyon'`), et le point-virgule `;` termine l'instruction. Ces mots sont détaillés dans le chapitre [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql).

```
+----------------------------------------------------------------------------------+
| Fichier  Édition  Affichage  Requête  Outils  Fenêtre  Aide        (1) menus     |
+----------------------------------------------------------------------------------+
| [Nouvelle requête] [Exécuter] [ librairie_demo v ]                 (2) outils    |
+-----------------------+----------------------------------------------------------+
| EXPLORATEUR D'OBJETS  | SQLQuery1.sql                                            |
|                       | 1 | SELECT id, nom, ville                                |
| (3)                   | 2 | FROM dbo.clients                                     |
|                       | 3 | WHERE ville = 'Lyon';                                |
| NOM_DU_SERVEUR        |                                  (4) éditeur de requête  |
|  + Bases de données   +----------------------------------------------------------+
|    + librairie_demo   | Résultats | Messages              (5) volet de résultats |
|      + Tables         |  id | nom    | ville                                     |
|        dbo.clients    |   1 | Martin | Lyon                                      |
|        dbo.livres     |   3 | Petit  | Lyon                                      |
+-----------------------+----------------------------------------------------------+
| Prêt          NOM_DU_SERVEUR | mon_login | librairie_demo | 00:00:00 | 2 lignes  |
+----------------------------------------------------------------------------------+
                                                             (6) barre d'état
```

| Zone | Nom (anglais) | Rôle |
|---|---|---|
| 1 | Barre de menus (*menu bar*) | Toutes les commandes, dont le menu `Requête` (*Query*) |
| 2 | Barre d'outils (*toolbar*) | `Nouvelle requête` (*New Query*), `Exécuter` (*Execute*), liste des bases disponibles |
| 3 | Explorateur d'objets (*Object Explorer*) | L'arbre des bases, tables et colonnes du serveur |
| 4 | Éditeur de requête (*query editor*) | Le texte SQL que l'on écrit |
| 5 | Volet de résultats (*results pane*) | Deux onglets : `Résultats` (*Results*, les lignes renvoyées) et `Messages` (nombre de lignes, erreurs) |
| 6 | Barre d'état (*status bar*) | Serveur, compte et base auxquels l'onglet est relié, durée, nombre de lignes |

La zone 6 est la plus utile pour un débutant : elle rappelle, en permanence, **sur quel serveur, avec quel compte et sur quelle base** la requête va tourner (d'après la documentation, ces informations figurent dans la barre d'état et dans le titre de l'onglet).

## Se connecter à un serveur

Au lancement, SSMS ouvre la fenêtre **Se connecter au serveur** (*Connect to Server*). On peut la rouvrir à tout moment avec le bouton `Connecter` (*Connect*) de l'Explorateur d'objets.

### Les champs de la fenêtre de connexion

| Champ (anglais) | À remplir avec | Remarque |
|---|---|---|
| Type de serveur (*Server type*) | `Moteur de base de données` (*Database Engine*) | La valeur par défaut convient : c'est le programme serveur qui contient les tables |
| Nom du serveur (*Server name*) | Le nom reçu de l'administrateur | Voir le tableau suivant pour les formes possibles |
| Authentification (*Authentication*) | Windows, ou SQL Server | Voir plus bas |
| Nom d'utilisateur et mot de passe (*Login*, *Password*) | Le compte SQL, si l'authentification SQL est choisie | Grisés avec l'authentification Windows |
| `Options >>` | Chiffrement, confiance du certificat, base de départ | Voir plus bas |

### Écrire le nom du serveur

| Forme | Signification | Exemple |
|---|---|---|
| `NOM_DU_SERVEUR` | L'instance par défaut de cette machine | `SRV-DONNEES` |
| `NOM_DU_SERVEUR\NOM_INSTANCE` | Une instance **nommée** de cette machine | `SRV-DONNEES\INSTANCE_A` |
| `NOM_DU_SERVEUR,PORT` | Une adresse précise : le **port** (le numéro de la « porte » réseau sur laquelle le serveur écoute) s'écrit après une virgule | `SRV-DONNEES,1433` |
| `localhost`, `.` ou `(local)` | La machine sur laquelle SSMS tourne | `localhost\INSTANCE_A` |

La barre oblique inverse `\` sépare la machine de l'instance, la virgule sépare le nom du port : les confondre est une cause fréquente d'échec de connexion.

### Authentification Windows ou authentification SQL Server

L'**authentification** est la preuve de votre identité. SQL Server en propose deux principales (d'autres modes existent, comme l'authentification [Microsoft Entra](https://learn.microsoft.com/en-us/entra/fundamentals/whatis) pour les services en ligne de Microsoft, hors sujet ici) :

| | Authentification Windows (*Windows Authentication*) | Authentification SQL Server (*SQL Server Authentication*) |
|---|---|---|
| Qui vérifie l'identité | Windows : le serveur reçoit l'identité de votre session | Le serveur SQL lui-même |
| Ce que vous saisissez | Rien : le compte et le mot de passe sont ceux de votre session Windows | Un nom de login et un mot de passe propres à SQL Server |
| Où vit le mot de passe | Dans l'annuaire des comptes Windows de l'organisation | Dans le serveur SQL |
| Avantage | Pas de mot de passe de plus à gérer ni à saisir | Utilisable depuis une machine hors du **domaine** (le réseau d'entreprise dont un **annuaire** gère les comptes : une liste centrale des comptes d'une organisation, ici [Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)) |
| Piège | Le compte doit **aussi** être déclaré dans le serveur : sinon `Login failed` | Ne jamais utiliser le compte `sa` (administrateur de tout le serveur) pour consulter des données |

Un **login** est un compte déclaré au niveau du serveur ; réussir à s'authentifier ne suffit donc pas, il faut que le serveur connaisse ce compte. Ce piège (l'identité est valide, mais aucun login ne lui correspond sur CETTE instance) est détaillé dans le chapitre [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql), à la section sur l'authentification Windows intégrée.

La case *Remember password* (« mémoriser le mot de passe ») conserve le mot de passe sur votre machine. Sur un poste partagé, ne la cochez pas.

### Chiffrement et confiance du certificat

Entre SSMS et le serveur, les échanges peuvent être **chiffrés** (rendus illisibles pour quelqu'un qui écouterait le réseau). Pour que ce chiffrement serve vraiment, SSMS doit aussi s'assurer qu'il parle bien au bon serveur, et non à un imposteur. Le serveur prouve son identité avec un **certificat** : un document numérique signé par une autorité que l'ordinateur connaît (voir [le certificat TLS](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#le-certificat-tls-auto-signe) pour le principe).

D'après la documentation de SQL Server, la fenêtre de connexion offre, selon la version, un réglage de chiffrement (`Chiffrer la connexion`, *Encrypt connection*, à trois valeurs décrites ci-dessous) et une case *Trust server certificate* (« faire confiance au certificat du serveur »), parfois derrière le bouton `Options >>`.

| Valeur de *Encrypt connection* | Ce qui se passe |
|---|---|
| *Optional* | Chiffre seulement si le serveur l'exige ; sinon les échanges restent lisibles sur le réseau |
| *Mandatory* | Chiffre toujours ; le certificat est vérifié sauf si la case ci-dessous est cochée |
| *Strict* | Chiffre toujours, avec une vérification stricte du certificat |

Pour une base consultée à distance, choisir *Mandatory* ou *Strict* (la valeur *Strict* n'existe que dans les versions récentes).

| Réglage | Ce qui se passe |
|---|---|
| Case *Trust server certificate* décochée | Lorsque la connexion est chiffrée, SSMS vérifie le certificat : signé par une autorité connue, non expiré, au nom du serveur demandé. Un certificat invalide fait **échouer** la connexion |
| Case cochée | SSMS **ne vérifie plus** le certificat et accepte celui que le serveur présente, quel qu'il soit |

Ce que la case désactive est donc la **vérification de l'identité du serveur**, pas le chiffrement : quand la connexion est chiffrée, les données restent chiffrées, mais SSMS ne peut plus savoir si son interlocuteur est le vrai serveur. Sur un réseau où quelqu'un s'interpose entre vous et le serveur (une attaque dite **man-in-the-middle**, « homme du milieu »), il pourrait se faire passer pour lui et lire ce que vous envoyez, mot de passe compris.

| Situation | Que faire |
|---|---|
| Serveur de production ou serveur distant | Ne pas cocher. Demander à l'administrateur un certificat signé par une autorité reconnue, ou l'installation du certificat de son organisation sur votre poste |
| Instance installée sur votre propre machine pour vous exercer (édition gratuite *Developer* ou *Express*, à [télécharger ici](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) ; voir aussi [l'environnement local avec SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server)) | Cocher est acceptable : personne ne s'interpose entre votre machine et elle-même |
| Une erreur de certificat apparaît et on ne sait pas pourquoi | Ne pas cocher « pour que ça marche » : relever le message, le transmettre à l'administrateur |

Documentation : [configurer le chiffrement des connexions](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/configure-sql-server-encryption).

### Choisir la base de départ

Dans `Options >>`, un onglet de propriétés de connexion (*Connection Properties*) propose un champ *Connect to database* (« se connecter à la base de données »). Vide, la connexion s'ouvre sur une base par défaut du compte (souvent la base système `master`, qui ne contient aucune de vos données). Renseigné, la fenêtre de requête s'ouvre directement sur la bonne base. Si le compte n'a pas accès à cette base, la connexion échoue avec un message du type `Cannot open database "..." requested by the login`.

### Quand la connexion échoue

| Message (anglais, d'après la documentation et les forums de Microsoft) | Cause probable | Piste |
|---|---|---|
| `A network-related or instance-specific error occurred while establishing a connection to SQL Server` | Nom du serveur ou de l'instance faux, service arrêté (le programme SQL Server, qui tourne en fond sous Windows, n'est pas démarré), **pare-feu** (programme qui filtre les connexions réseau autorisées) | Revérifier l'orthographe et le séparateur (`\` ou `,`), puis demander à l'administrateur |
| `The certificate chain was issued by an authority that is not trusted` | Le certificat du serveur n'est pas reconnu par votre poste | Voir [la section sur le certificat](#chiffrement-et-confiance-du-certificat), ne pas cocher la case par réflexe |
| `Login failed for user '...'` | Mot de passe faux, **ou** compte inconnu de cette instance | Voir le chapitre [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) : deux causes pour le même message |
| `Cannot open database "..." requested by the login` | Le compte n'a pas accès à la base nommée dans `Connect to database` | Vider ce champ, ou demander l'accès |

## L'Explorateur d'objets : parcourir sans écrire

L'**Explorateur d'objets** (*Object Explorer*) est un arbre (simplifié ci-dessous : le vrai affiche d'autres branches, comme les contraintes ou les déclencheurs) dont on déplie les branches avec le petit `+` (ou la flèche). Rien n'est modifié en dépliant : on ne fait que lire le **catalogue**, la liste que le serveur tient de ses propres objets.

```
NOM_DU_SERVEUR (SQL Server, compte : mon_login)
 |
 +-- Bases de données (Databases)
 |    +-- Bases de données système (System Databases)    <- à ne pas toucher
 |    +-- librairie_demo
 |         +-- Tables
 |         |    +-- dbo.clients
 |         |    |    +-- Colonnes (Columns)
 |         |    |    |    +-- id (PK, int, Not Null)
 |         |    |    |    +-- nom (varchar(50), Not Null)
 |         |    |    |    +-- ville (varchar(50), Null)
 |         |    |    |    +-- remise (decimal(5,2), Null)
 |         |    |    +-- Clés (Keys)
 |         |    |    +-- Index
 |         |    +-- dbo.livres
 |         +-- Vues (Views)
 |         +-- Sécurité (Security)
 +-- Sécurité (Security)
```

### À quoi correspond chaque branche

| Branche | Contenu |
|---|---|
| Bases de données (*Databases*) | Les bases du serveur ; selon les droits du compte, une base peut être absente de la liste ou impossible à ouvrir |
| Bases de données système (*System Databases*) | Les bases propres au serveur : `master` (catalogue du serveur), `tempdb` (espace de travail temporaire), `model` (modèle des nouvelles bases), `msdb` (tâches planifiées) ; jamais le lieu d'un exercice ([documentation](https://learn.microsoft.com/en-us/sql/relational-databases/databases/system-databases)) |
| Tables | Les tables, préfixées de leur schéma (`dbo.clients`) |
| Colonnes (*Columns*) | Pour chaque colonne : nom, type, obligatoire ou non |
| Clés (*Keys*) | La clé primaire et les clés étrangères (liens vers d'autres tables) |
| Index | Les structures qui accélèrent les recherches : voir [les index](/?c=donnees&s=bases-de-donnees&p=les-index) |
| Vues (*Views*) | Des requêtes enregistrées que l'on lit comme des tables |
| Sécurité (*Security*) | Les comptes et les rôles ; sous une base, ceux de cette base (voir [Droits](#droits-la-lecture-seule-vient-du-compte-pas-de-l-attention)) |

### Lire une ligne de colonne

Sous `Colonnes`, chaque entrée suit le motif `nom (clé, type, accepte NULL ou non)`. Les trois notions à retenir :

| Notion | Définition | Exemple lu dans l'arbre |
|---|---|---|
| **Type** | La nature de la valeur que la colonne accepte : `int` un nombre entier, `varchar(50)` du texte de 50 caractères au plus, `decimal(5,2)` un nombre décimal de 5 chiffres dont 2 après la virgule, `date` un jour du calendrier | `ville (varchar(50), Null)` |
| **Clé primaire** (*primary key*, abrégé `PK`) | La colonne (ou le groupe de colonnes) dont la valeur identifie **chaque ligne de façon unique** : jamais en double, jamais vide. C'est ce qui permet de désigner « le client numéro 3 » sans ambiguïté. Elle est créée par `PRIMARY KEY` (voir [`CREATE TABLE`](/?c=langages&s=domain-specific-languages-dsl&p=sql#create-table-creer-une-table-ddl)) | `id (PK, int, Not Null)` |
| **`NULL`** | L'absence de valeur : « inconnu » ou « non renseigné », ce qui est différent de zéro et du texte vide. Une colonne marquée `Null` (ou *allows nulls*) peut ne pas avoir de valeur dans certaines lignes ; `Not Null` impose une valeur | `remise (decimal(5,2), Null)` |

Ces trois indications répondent aux questions d'un débutant avant même d'écrire une requête : quelle colonne identifie une ligne, quel genre de valeur y mettre, et si une case vide est normale. Voir [`NULL`](/?c=langages&s=domain-specific-languages-dsl&p=sql#null-une-donnee-manquante-pas-une-valeur-comme-les-autres) pour ses effets sur les calculs et les comparaisons.

### Lire la structure sans prendre de risque

Un clic droit sur une table ouvre un menu contextuel (le menu qui s'ouvre au clic droit). Plusieurs entrées y sont inoffensives, d'autres modifient la base :

| Entrée du menu (anglais) | Effet | Sans danger ? |
|---|---|---|
| `Select Top 1000 Rows` | Écrit et lance une requête qui lit au plus 1000 lignes | Oui : une lecture |
| `Script Table as` > `CREATE To` > `New Query Editor Window` | Écrit dans un nouvel onglet le code qui créerait la table, **sans l'exécuter** | Oui : on lit la structure en SQL |
| `Properties` | Affiche les caractéristiques de la table | Oui |
| `Edit Top 200 Rows` | Ouvre les 200 premières lignes dans une grille **modifiable** | **Non** : voir [les erreurs de débutant](#les-erreurs-de-debutant) |
| `Design` | Ouvre l'éditeur de structure de la table | **Non** : on peut y changer des colonnes |
| `Delete`, `Rename` | Supprime ou renomme la table | **Non** |

La structure peut aussi se lire par une requête. `INFORMATION_SCHEMA.COLUMNS` est une vue de description que fournit le serveur (voir la [documentation](https://learn.microsoft.com/en-us/sql/relational-databases/system-information-schema-views/columns-transact-sql)) : chaque ligne décrit une colonne de la base courante.

```sql
-- SELECT choisit les colonnes à afficher ; AS ne sert qu'à renommer le titre d'une colonne
SELECT COLUMN_NAME AS colonne,     -- le nom de la colonne
       DATA_TYPE AS type,          -- son type (int, varchar, date...)
       CHARACTER_MAXIMUM_LENGTH AS longueur,  -- la longueur maximale d'un texte (sinon NULL)
       IS_NULLABLE AS accepte_null -- YES si la colonne accepte NULL, NO sinon
-- FROM indique ce qui est lu : la vue de description des colonnes
FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE ne garde que les lignes qui respectent la condition : ici, les colonnes de clients
-- AND exige que les deux conditions soient vraies en même temps
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'clients'
-- ORDER BY trie le résultat ; ORDINAL_POSITION est le rang de la colonne dans la table
ORDER BY ORDINAL_POSITION;
```

Résultat attendu pour la table de l'exemple (valeurs d'illustration) :

| colonne | type | longueur | accepte_null |
|---|---|---|---|
| id | int | NULL | NO |
| nom | varchar | 50 | NO |
| ville | varchar | 50 | YES |
| remise | decimal | NULL | YES |

## Ouvrir une fenêtre de requête

Une **fenêtre de requête** est un onglet de l'éditeur dans lequel on écrit du SQL. Trois façons d'en ouvrir une :

| Geste | Particularité |
|---|---|
| Bouton `Nouvelle requête` (*New Query*) de la barre d'outils | La requête est reliée au serveur sélectionné dans l'Explorateur, sur la base de départ de la connexion ou celle du nœud sélectionné |
| Raccourci `Ctrl + N` | Même effet que le bouton |
| Clic droit sur **une base** dans l'Explorateur, puis `Nouvelle requête` | La requête est reliée **à cette base** : c'est la façon la plus sûre de partir sur la bonne |

### La base courante

Chaque onglet est relié à **une** base à la fois : la **base courante**. Une requête qui écrit `FROM dbo.clients` cherche la table dans cette base seulement. Trois façons de la choisir ou de la changer :

| Méthode | Comment | Remarque |
|---|---|---|
| Liste déroulante de la barre d'outils | On choisit la base dans la liste des bases disponibles (*Available Databases*) | Visible en permanence, on voit d'un coup d'œil où l'on est |
| Instruction `USE` | `USE librairie_demo;` change la base courante de l'onglet | Pratique dans un script (un fichier de plusieurs instructions SQL), mais un `USE` copié d'un autre script peut vous déplacer sur une autre base sans que vous le remarquiez |
| Nom complet à trois segments | `librairie_demo.dbo.clients` | Désigne la table sans changer de base (voir [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql)) |

Pour vérifier, sans se fier à la liste déroulante, on demande au serveur :

```sql
-- SELECT sans FROM : le serveur calcule des valeurs et les renvoie dans une seule ligne
SELECT
    -- DB_NAME() renvoie le nom de la base courante de cet onglet
    DB_NAME()    AS base_courante,
    -- SUSER_NAME() renvoie le nom du compte avec lequel on est connecté
    SUSER_NAME() AS compte_connecte,
    -- @@SERVERNAME renvoie le nom du serveur (et de l'instance) auquel on est relié
    @@SERVERNAME AS serveur;
```

Résultat possible (valeurs d'illustration) :

| base_courante | compte_connecte | serveur |
|---|---|---|
| librairie_demo | mon_login | NOM_DU_SERVEUR |

Cette requête, réécrite sur une ligne (`SELECT DB_NAME(), SUSER_NAME();`), se lance **avant toute autre** : elle remplace une incertitude par une réponse du serveur. Documentation : [`DB_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/db-name-transact-sql), [`SUSER_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/suser-name-transact-sql), [`@@SERVERNAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/servername-transact-sql).

> **Note :** d'après la documentation de SSMS, la fenêtre de connexion permet aussi d'associer une **couleur** à un serveur (propriétés de connexion, *Use custom color*) : la barre d'état des onglets reliés à ce serveur peut alors prendre cette couleur. Une couleur rouge pour le serveur de production, verte pour celui des essais, rend la confusion visible.

### Le mot `GO`

Un script copié depuis un collègue contient souvent des lignes avec `GO` seul. `GO` n'est pas du SQL : c'est un séparateur compris par SSMS, qui découpe le texte en **lots** (*batches*) envoyés au serveur l'un après l'autre. Les lots étant indépendants, une [variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) (une valeur rangée sous un nom) créée dans l'un n'existe plus dans le suivant ; un `USE` en revanche reste valable pour les lots suivants du même onglet.

## Exécuter : tout le fichier ou seulement la sélection

Écrire une requête ne la lance pas. Pour l'envoyer au serveur, on utilise le bouton `Exécuter` (*Execute*), le raccourci `F5` (ou `Ctrl + E`). Le point décisif :

| État de l'éditeur | Ce qui est envoyé au serveur |
|---|---|
| **Aucun texte sélectionné** | **Tout** le contenu de l'onglet, de la première à la dernière ligne |
| **Du texte est sélectionné** (surligné) | **Seulement** le texte surligné, le reste est ignoré |

Un onglet peut donc contenir plusieurs requêtes, et la sélection choisit laquelle part. Exemple d'onglet à trois instructions :

```sql
-- instruction 1 : vérifier où l'on est (lecture)
SELECT DB_NAME() AS base_courante;
-- instruction 2 : lire les clients de Lyon (lecture)
SELECT id, nom, ville FROM dbo.clients WHERE ville = 'Lyon';
-- instruction 3 : DELETE supprime des lignes ; ici, tous les clients de Paris (écriture !)
DELETE FROM dbo.clients WHERE ville = 'Paris';
```

```
  F5 sans rien sélectionner :          F5 avec la ligne 2 sélectionnée :

  1  SELECT DB_NAME() ...    <- part   1  SELECT DB_NAME() ...
  2  SELECT id, nom ...      <- part   2 [SELECT id, nom ...]    <- seule à partir
  3  DELETE FROM ...         <- part   3  DELETE FROM ...
```

Ce comportement est utile (tester une requête à la fois) et dangereux (voir [l'erreur « sélection oubliée »](#2-executer-une-selection-oubliee)). La barre d'outils propose aussi `Analyser` (*Parse*, menu `Requête` > `Analyser`, ou `Ctrl + F5`), qui vérifie la **syntaxe** (l'orthographe SQL) sans rien exécuter, et un bouton `Annuler l'exécution de la requête` (*Cancel Executing Query*) qui arrête une requête trop longue.

## Lire le résultat

Après `F5`, le volet du bas affiche deux onglets : `Résultats` et `Messages`. Il faut lire les deux.

### L'onglet Résultats

L'onglet `Résultats` (*Results*) présente par défaut une **grille** (*grid*) : une ligne du résultat par ligne de la grille, une colonne par colonne choisie. Résultat de la requête 2 ci-dessus sur cinq clients d'essai (illustration) :

| id | nom | ville |
|---|---|---|
| 1 | Martin | Lyon |
| 3 | Petit | Lyon |

Dans la grille, une valeur absente s'affiche par le mot `NULL` : ce n'est pas du texte, c'est l'absence de valeur. Le menu `Requête` > `Résultats vers` (*Results To*) permet de choisir une sortie en grille, en texte brut ou dans un fichier. Un clic droit dans la grille permet de copier les lignes, avec ou sans l'en-tête des colonnes.

### L'onglet Messages et « n lignes affectées »

L'onglet `Messages` rapporte ce que le serveur dit de l'exécution. Après une requête réussie, il affiche une ligne de la forme :

```text
(2 rows affected)
```

En français, selon la langue de l'interface : `(2 lignes affectées)`. Le nombre signifie ce que l'instruction a **touché**, et il se lit différemment selon l'instruction :

| Instruction | Ce que « n lignes affectées » désigne |
|---|---|
| `SELECT` | Le nombre de lignes **renvoyées** par cette requête |
| `INSERT` (ajoute des lignes) | Le nombre de lignes **ajoutées** |
| `UPDATE` | Le nombre de lignes **modifiées** |
| `DELETE` | Le nombre de lignes **supprimées** |

Deux conséquences pratiques :

| Constat | Interprétation |
|---|---|
| `(0 rows affected)` après un `DELETE` ou un `UPDATE` | Aucune ligne ne correspondait à la condition `WHERE` : rien n'a changé, ce qui est une information, pas un échec |
| `(1500 rows affected)` après un `DELETE` qui devait toucher 3 lignes | La condition était trop large : l'alerte arrive **après** le fait, d'où l'intérêt de le prévoir (voir [supprimer sans `WHERE`](#3-supprimer-sans-where)) |

> **Piège :** le message n'indique **pas** le total des lignes qui correspondent à la question. Avec `SELECT TOP 10 * FROM dbo.clients;` (`*` désigne toutes les colonnes, et `TOP 10` limite le résultat à 10 lignes, mot propre au SQL de SQL Server, le [*T-SQL*](https://learn.microsoft.com/en-us/sql/t-sql/language-reference)), le message dit `(10 rows affected)` même si la table en contient 40 000. Pour connaître le total, on demande `SELECT COUNT(*) FROM dbo.clients;`, où `COUNT(*)` compte les lignes.

Sans `ORDER BY`, SQL Server ne garantit aucun ordre : les 10 lignes d'un `TOP 10` sont arbitraires et peuvent différer d'une exécution à l'autre. Pour un résultat reproductible, on trie : `SELECT TOP 10 * FROM dbo.clients ORDER BY id;` renvoie toujours les 10 plus petits `id`.

La barre d'état (en bas de la fenêtre) répète le nombre de lignes et la durée de la requête. Une durée qui grimpe pour un simple `SELECT` signale une table volumineuse : interrompre avec `Annuler l'exécution de la requête` et recommencer avec `TOP` plutôt que d'attendre.

### Quand une erreur s'affiche

Une erreur apparaît dans l'onglet `Messages`, en texte rouge, sous la forme `Msg numéro, Level n, State n, Line n` suivie d'une phrase (`Level` : gravité de l'erreur ; `State` : repère interne du serveur ; `Line` : ligne en cause). Un double-clic sur le message place le curseur sur la ligne en cause. Deux messages concernent directement un débutant :

| Message (anglais) | Signification | Cause fréquente |
|---|---|---|
| `Msg 208 ... Invalid object name 'dbo.clients'` | La table demandée n'existe pas **dans la base courante** | On est sur la **mauvaise base**, ou le schéma/nom est mal écrit |
| `Msg 229 ... The SELECT permission was denied on the object 'clients'` | Le compte n'a pas le droit de lire cette table | Les droits manquent : voir la section suivante |

## Droits : la lecture seule vient du compte, pas de l'attention

Se dire « je ne fais que lire » ne protège de rien : une faute de frappe, une sélection mal faite, un script copié suffisent à écrire par erreur. La seule protection fiable est que le compte utilisé **n'ait pas le droit d'écrire**. Cette idée est le **principe du moindre privilège**, expliqué dans le chapitre [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) : un compte ne reçoit que les droits dont il a besoin.

### Deux niveaux de droits

```
   Serveur (instance)
   +-- Login "mon_login"            <- le compte, connu du serveur
   |     |
   |     +-- Base "librairie_demo"
   |     |     +-- Utilisateur "mon_login"    <- le même compte, déclaré dans CETTE base
   |     |     |     +-- rôle db_datareader   <- lecture de toutes les tables
   |     |     +-- Table dbo.clients
   |     |
   |     +-- Base "autre_base"
   |           +-- (aucun utilisateur)        <- le compte n'a aucun droit ici
```

Un compte peut se **connecter** au serveur et pourtant ne rien pouvoir faire dans une base donnée : les droits sont accordés **base par base**. Le **login** ouvre l'accès au serveur ; l'**utilisateur de base** est le même compte déclaré dans une base précise, et c'est lui qui reçoit les droits sur cette base. Un **rôle** est un groupe de droits que l'on attribue en bloc :

| Rôle de base (anglais) | Ce qu'il permet | Pour une lecture simple |
|---|---|---|
| `db_datareader` | Lire (`SELECT`) toutes les tables de la base | Suffisant, et c'est le rôle à demander |
| `db_datawriter` | Ajouter, modifier, supprimer des lignes dans toutes les tables | À éviter pour explorer |
| `db_owner` | Tous les droits sur la base, y compris supprimer les tables | Jamais pour explorer |
| `db_denydatawriter` | **Interdit** d'écrire (un refus l'emporte sur les autres droits) | Une barrière explicite, utile en plus de la lecture |

Au niveau du serveur, un compte membre du rôle `sysadmin` (le compte `sa` en est un) a tous les droits sur toutes les bases : avec lui, **aucune** base n'est protégée. Voir la [liste des rôles de serveur](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/server-level-roles) et la [liste des rôles de base](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/database-level-roles). Le chapitre [l'environnement local avec SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) montre à l'inverse un compte qui reçoit `db_owner` sur une seule base : c'est un choix de développement, pas celui d'une personne qui se contente de lire.

### Vérifier ses droits depuis une requête

On interroge le serveur sur le compte connecté, avec la base courante de l'onglet (d'où l'importance de la vérifier d'abord). Aucune de ces requêtes ne modifie quoi que ce soit.

```sql
-- sys.databases liste les bases du serveur ; HAS_DBACCESS(nom) vaut 1 si le compte y a accès
-- ORDER BY name trie le résultat par nom de base
SELECT name FROM sys.databases WHERE HAS_DBACCESS(name) = 1 ORDER BY name;

-- sys.fn_my_permissions(NULL, 'DATABASE') liste les droits du compte sur la base courante
SELECT permission_name FROM sys.fn_my_permissions(NULL, 'DATABASE');

-- HAS_PERMS_BY_NAME renvoie 1 si le droit est accordé sur l'objet, 0 sinon
-- peut_lire : droit SELECT sur la table ; peut_ajouter : INSERT (ajouter des lignes)
-- peut_modifier : UPDATE (changer des lignes) ; peut_supprimer : DELETE (en retirer)
SELECT HAS_PERMS_BY_NAME('dbo.clients', 'OBJECT', 'SELECT') AS peut_lire,
       HAS_PERMS_BY_NAME('dbo.clients', 'OBJECT', 'INSERT') AS peut_ajouter,
       HAS_PERMS_BY_NAME('dbo.clients', 'OBJECT', 'UPDATE') AS peut_modifier,
       HAS_PERMS_BY_NAME('dbo.clients', 'OBJECT', 'DELETE') AS peut_supprimer;

-- IS_MEMBER renvoie 1 si le compte appartient au rôle de la base courante, 0 sinon
SELECT IS_MEMBER('db_datareader') AS lecteur, IS_MEMBER('db_owner') AS proprietaire;
```

Résultat possible pour un compte en lecture seule (valeurs d'illustration) :

| peut_lire | peut_ajouter | peut_modifier | peut_supprimer |
|---|---|---|---|
| 1 | 0 | 0 | 0 |

Les documentations de référence : [`sys.databases`](https://learn.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-databases-transact-sql), [`HAS_DBACCESS`](https://learn.microsoft.com/en-us/sql/t-sql/functions/has-dbaccess-transact-sql), [`IS_MEMBER`](https://learn.microsoft.com/en-us/sql/t-sql/functions/is-member-transact-sql), [`HAS_PERMS_BY_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/has-perms-by-name-transact-sql) et [`sys.fn_my_permissions`](https://learn.microsoft.com/en-us/sql/relational-databases/system-functions/sys-fn-my-permissions-transact-sql).

### La démarche

| Étape | Action |
|---|---|
| 1 | Demander à l'administrateur un compte réservé à la consultation (rôle `db_datareader` sur la base voulue, aucun autre) |
| 2 | Se connecter avec ce compte pour explorer, et avec un autre compte seulement le temps d'une modification décidée à l'avance |
| 3 | Dès la connexion, lancer les requêtes de vérification ci-dessus : base courante, droits |
| 4 | Si `peut_ajouter`, `peut_modifier` ou `peut_supprimer` vaut `1` alors qu'on ne veut que lire, le signaler : le compte a trop de droits |
| 5 | Refaire la vérification **pour chaque base** consultée, car les droits ne sont pas hérités d'une base à l'autre |

> **Note :** être en lecture seule protège les données contre une modification, pas contre leur **divulgation** : ce que vous lisez peut être confidentiel (coordonnées de clients, par exemple). Ne copiez pas de résultats réels hors des outils prévus pour cela.

## Les erreurs de débutant

### 1. Requête lancée sur la mauvaise base

**Scénario.** L'Explorateur d'objets contient une base d'essai et une base de travail, avec des tables de mêmes noms. Un onglet ouvert sur la mauvaise base exécute `SELECT * FROM dbo.clients;` : le résultat est bien rendu, mais il vient d'ailleurs. Pire avec une écriture : le `DELETE` part sur la base de travail.

| Symptôme | Cause | Parade |
|---|---|---|
| Des lignes inattendues, ou `Msg 208 Invalid object name` | La base courante n'est pas celle que l'on croit | Vérifier la barre d'état, puis `SELECT DB_NAME();` |
| Aucune erreur, mais le résultat ne ressemble pas à l'attendu | La table existe dans les deux bases, avec d'autres données | Ouvrir la requête par clic droit sur la base voulue |
| Un script déroule des `USE` qui changent de base en cours de route | Le script ne part pas de l'état supposé | Lire les `USE` d'un script avant de l'exécuter |

### 2. Exécuter une sélection oubliée

**Scénario.** On teste une requête en la surlignant, puis on passe à autre chose sans cliquer ailleurs. Plus tard, on écrit une nouvelle requête en dessous et on appuie sur `F5` : seul l'ancien texte surligné part. À l'inverse, on croit lancer une seule ligne et, la sélection ayant disparu, **tout** l'onglet s'exécute, instructions d'écriture comprises.

| Symptôme | Cause | Parade |
|---|---|---|
| La nouvelle requête ne produit « rien » ou refait l'ancienne | Une sélection ancienne est toujours active | Cliquer dans le texte pour désélectionner, puis relire ce qui va partir |
| Une écriture s'exécute alors qu'on pensait lancer une lecture | Aucune sélection : tout l'onglet est envoyé | Garder les écritures dans un onglet séparé, ou les mettre en commentaire |
| Le résultat ne correspond pas à la requête affichée | Le texte surligné n'est pas celui que l'on regarde | Se demander avant chaque `F5` : « ai-je une sélection ? » |

### 3. Supprimer sans `WHERE`

`DELETE FROM dbo.clients;` **sans** condition supprime **toutes** les lignes. `UPDATE dbo.clients SET ville = 'Lyon';` (`UPDATE` modifie des lignes, `SET` donne la nouvelle valeur) change la ville de **tous** les clients. La condition `WHERE` est ce qui restreint l'action aux lignes voulues.

Par défaut, chaque instruction est **validée** (rendue définitive) dès qu'elle s'exécute : il n'y a pas de bouton « Annuler ». `Ctrl + Z` annule une frappe dans l'éditeur, pas un effet sur la base. La parade tient en quatre gestes, à lancer **un par un** en sélectionnant le texte avant `F5` (voir [l'exécution par sélection](#executer-tout-le-fichier-ou-seulement-la-selection)) :

```sql
-- 1. d'abord un SELECT avec EXACTEMENT la même condition : on voit les lignes concernées
SELECT id, nom, ville FROM dbo.clients WHERE ville = 'Lyon';
-- 2. COUNT(*) donne leur nombre ; il doit être celui que l'on attend (ici 2)
SELECT COUNT(*) AS a_supprimer FROM dbo.clients WHERE ville = 'Lyon';
-- 3. BEGIN TRANSACTION ouvre une transaction : un groupe d'instructions que l'on peut annuler
-- sélectionner ces deux lignes (BEGIN et DELETE), puis F5 ; la transaction reste ouverte
BEGIN TRANSACTION;
-- le DELETE s'exécute, mais n'est pas encore définitif
DELETE FROM dbo.clients WHERE ville = 'Lyon';
-- lire alors l'onglet Messages : il doit afficher (2 rows affected), sinon ne pas valider
-- 4. sélectionner UNE SEULE des deux lignes suivantes, puis F5
-- ROLLBACK TRANSACTION annule tout ce qui a eu lieu depuis BEGIN TRANSACTION
ROLLBACK TRANSACTION;
-- à la place, COMMIT TRANSACTION rendrait la suppression définitive
-- COMMIT TRANSACTION;
```

Entre deux `F5`, la transaction reste ouverte dans l'onglet : c'est ce qui laisse le temps de lire le message. Lancer ce bloc en entier, sans sélection, enchaînerait `DELETE` puis `ROLLBACK` sans pause (le `COMMIT` étant en commentaire) et ôterait tout contrôle.

Pour une table de 5 clients dont 2 vivent à Lyon, le `SELECT COUNT(*)` donne 2, le `DELETE` annonce 2 lignes, et après le `ROLLBACK` un nouveau `SELECT COUNT(*) FROM dbo.clients;` redonne 5. Sans `WHERE`, le même `DELETE` annonce 5 lignes : l'écart saute aux yeux **avant** de choisir entre `COMMIT` et `ROLLBACK`.

| Point | À savoir |
|---|---|
| Une transaction ouverte et oubliée | Elle peut **bloquer** les autres utilisateurs de la table tant qu'elle n'est ni validée ni annulée. Terminer par `COMMIT` ou `ROLLBACK`, toujours |
| Fermer l'onglet avec une transaction ouverte | SSMS demande, d'après la documentation, s'il faut valider ou annuler |
| Une sauvegarde de la base | Dernier recours, mais qui revient à restaurer la base entière : voir [la restauration d'un `.bak`](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server#restaurer-une-sauvegarde-bak-en-local) |
| Un compte en lecture seule | Rend la suppression **impossible** : la vraie parade, qui ne dépend d'aucun réflexe |

Documentation : [les transactions en T-SQL](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/transactions-transact-sql).

### 4. Modifier une ligne dans la grille d'édition

L'entrée `Edit Top 200 Rows` ouvre les lignes dans une grille qui ressemble à celle des résultats, mais **modifiable** : d'après la documentation, changer une cellule puis quitter la ligne enregistre la modification dans la base. Pour un débutant qui veut seulement regarder, la bonne entrée est `Select Top 1000 Rows`.

## Un parcours complet de bout en bout

| Étape | Geste | Contrôle |
|---|---|---|
| 1 | Obtenir nom du serveur, mode d'authentification, nom de la base, droits | Un compte de consultation, pas `sa` |
| 2 | Se connecter ; ne cocher la confiance du certificat que sur sa propre machine | La connexion s'ouvre |
| 3 | Déplier l'Explorateur d'objets : base, `Tables`, une table, `Colonnes` | Types, clé primaire, colonnes `Null` repérés |
| 4 | Clic droit sur la base voulue, puis `Nouvelle requête` | Barre d'état : bon serveur, bonne base |
| 5 | Lancer `SELECT DB_NAME(), SUSER_NAME();` | Les deux valeurs attendues |
| 6 | Vérifier ses droits (`HAS_PERMS_BY_NAME` ou `sys.fn_my_permissions`) | `peut_ajouter`, `peut_modifier` et `peut_supprimer` valent `0` |
| 7 | Écrire la lecture avec `TOP` (par exemple `SELECT TOP 10 * FROM dbo.livres;`) | Relire avant `F5`, vérifier qu'aucune sélection ne reste |
| 8 | Lire `Résultats` **et** `Messages` | Le nombre de lignes est cohérent |
| 9 | Écrire une modification seulement avec un compte prévu pour cela, après `SELECT`, dans une transaction | `COUNT(*)` et message identiques avant `COMMIT` |

## Pour aller plus loin

| Sujet | Où |
|---|---|
| La syntaxe SQL, les agrégats, les jointures, `NULL`, le moindre privilège | [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) |
| Schémas, `dbo`, tables techniques | [Schémas et tables techniques](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques) |
| Restaurer une sauvegarde `.bak` dans SSMS, créer un compte dédié | [Environnement local avec SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) |
| À quoi servent les index qui apparaissent dans l'arbre | [Les index](/?c=donnees&s=bases-de-donnees&p=les-index) |
| Le certificat TLS et ce qu'il garantit | [Cryptographie appliquée](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) |
| Tout SSMS, version par version | [Documentation officielle de SSMS](https://learn.microsoft.com/en-us/ssms/sql-server-management-studio-ssms) |

## Les pièges

| Piège | Conséquence | Parade |
|---|---|---|
| Cocher la confiance du certificat par réflexe | La connexion ne vérifie plus l'identité du serveur : exposition à l'homme du milieu | Ne le faire que sur sa propre machine, sinon corriger le certificat |
| Utiliser `sa` ou un compte `sysadmin` pour consulter | Aucun garde-fou : une écriture accidentelle passe | Un compte `db_datareader` sur la seule base voulue |
| Lancer une requête sans vérifier la base courante | Résultat issu d'une autre base, ou écriture sur la mauvaise | Barre d'état, clic droit sur la base, `SELECT DB_NAME();` |
| `F5` avec une ancienne sélection active | Seule l'ancienne requête part | Cliquer dans le texte avant de relire |
| `F5` sans sélection dans un onglet qui contient des écritures | Tout l'onglet s'exécute | Séparer lectures et écritures dans des onglets distincts |
| `DELETE` ou `UPDATE` sans `WHERE` | Toutes les lignes sont touchées, sans retour arrière automatique | `SELECT` identique d'abord, puis transaction |
| Lire « 10 lignes affectées » comme le total de la table | Mauvaise conclusion après un `TOP` | `SELECT COUNT(*)` pour connaître le total |
| `Edit Top 200 Rows` pour « regarder » | Une cellule modifiée est enregistrée | `Select Top 1000 Rows` |
| Laisser une transaction ouverte | Les autres utilisateurs de la table sont bloqués | `COMMIT` ou `ROLLBACK` à la fin de chaque essai |
| Croire qu'une base aux droits corrects l'est dans les autres | Les droits se règlent base par base | Vérifier à chaque base consultée |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Demander un compte de consultation dédié (`db_datareader`) | La lecture seule est imposée par le serveur, pas par la vigilance |
| Vérifier ses droits après chaque nouvelle connexion | On sait ce que l'on peut faire avant de le faire |
| Ouvrir chaque onglet par clic droit sur la base voulue | La base courante est la bonne dès le départ |
| Lancer `SELECT DB_NAME(), SUSER_NAME();` en premier | Le serveur confirme où l'on est et qui l'on est |
| Colorer les connexions de production dans la fenêtre de connexion | La confusion devient visible |
| Lire avec `TOP`, compter avec `COUNT(*)` | Une table volumineuse ne bloque pas le poste et le total reste connu |
| Séparer les onglets de lecture et d'écriture | Un `F5` sans sélection n'écrit jamais |
| Écrire d'abord le `SELECT` d'une modification, puis la transaction | On voit les lignes visées avant de les toucher |
| Lire `Messages` après chaque exécution | Le nombre de lignes affectées révèle un `WHERE` trop large |
| Ne pas cocher la confiance du certificat hors de sa machine | L'identité du serveur reste vérifiée |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | **SSMS** est le client graphique de Microsoft pour SQL Server (Windows seulement). On se connecte avec un nom de serveur (`SERVEUR\INSTANCE`, ou `SERVEUR,PORT`) et une authentification : **Windows** (la session, sans mot de passe à saisir, mais le compte doit exister dans le serveur) ou **SQL Server** (login et mot de passe propres au serveur). La case de confiance du certificat désactive la **vérification de l'identité du serveur**, pas le chiffrement : à réserver à sa propre machine. L'**Explorateur d'objets** montre bases, schémas, tables, colonnes avec leur type, la **clé primaire** (`PK`, identifiant unique de chaque ligne) et si la colonne accepte `NULL`. Un onglet de requête est relié à **une base courante** que la barre d'état et `SELECT DB_NAME();` confirment. `F5` exécute **tout l'onglet** sans sélection, **seulement la sélection** sinon. L'onglet `Résultats` montre les lignes, l'onglet `Messages` donne « n lignes affectées » : nombre de lignes renvoyées, ajoutées, modifiées ou supprimées, jamais le total d'une table après un `TOP`. La lecture seule est garantie par les **droits du compte** (rôle `db_datareader`, vérifiés par `HAS_PERMS_BY_NAME`), base par base, selon le [moindre privilège](/?c=langages&s=domain-specific-languages-dsl&p=sql). |
| **Pièges à éviter** | Cocher la confiance du certificat par réflexe ; consulter avec `sa` ou un compte `sysadmin` ; ne pas vérifier la base courante ; `F5` avec une sélection oubliée, ou sans sélection dans un onglet qui contient des écritures ; `DELETE` ou `UPDATE` sans `WHERE` ; prendre le message d'un `TOP` pour le total ; `Edit Top 200 Rows` pour regarder ; laisser une transaction ouverte ; supposer que les droits d'une base valent pour une autre. |
| **Bonnes pratiques** | Compte de consultation dédié ; `SELECT DB_NAME(), SUSER_NAME();` puis vérification des droits à chaque connexion ; onglet ouvert par clic droit sur la bonne base ; connexions de production colorées ; `TOP` pour lire et `COUNT(*)` pour compter ; onglets de lecture séparés des onglets d'écriture ; `SELECT` identique avant toute modification, dans une transaction que l'on peut annuler ; lecture systématique de l'onglet `Messages`. |
