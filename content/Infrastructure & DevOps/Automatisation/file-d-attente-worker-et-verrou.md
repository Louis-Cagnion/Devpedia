---
order: 6
---

# File d'attente, worker et verrou applicatif (31/10/2026)

Une **tâche** est un travail que le programme doit accomplir : envoyer un courriel, recalculer une fiche, purger de vieilles données. Quand un site reçoit une **requête** (la demande envoyée par le navigateur d'un visiteur), il peut faire la tâche lui-même avant de répondre, ou la **mettre en file** et répondre tout de suite, un autre programme se chargeant de la faire ensuite. Ce chapitre construit la seconde voie, de bout en bout, en six morceaux :

| Morceau | Question à laquelle il répond | Section |
|---|---|---|
| La **file d'attente** | Où ranger les tâches en attendant ? | [La file](#le-mini-systeme-d-essai-la-file) |
| Le **worker** | Qui les exécute, et comment écrire plusieurs workers sans recopier la boucle ? | [Méthode modèle](#le-patron-methode-modele-un-squelette-fixe-un-trou-a-remplir) |
| Le **verrou applicatif** | Comment empêcher deux workers de toucher la même fiche en même temps ? | [Le verrou](#le-verrou-applicatif-sur-une-entite) |
| Le **planificateur** | Qui dépose les tâches récurrentes ? | [Le planificateur](#le-planificateur-applicatif-un-seul-cron-qui-decide) |
| Les **réessais** | Que faire quand une tâche échoue, ou échoue toujours ? | [Réessais](#reessais-tache-empoisonnee-et-idempotence) |
| Le **superviseur** | Qui relance un worker qui s'est arrêté ? | [Le superviseur](#garder-un-worker-en-vie-le-superviseur) |

Le code est écrit en [Python](/?c=langages&s=python) avec une base [SQLite](https://www.sqlite.org/docs.html) (une base de données contenue dans un seul fichier), interrogée en [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql). C'est un **mini-système inventé pour l'occasion**, assez petit pour être lu en entier et exécuté ; il montre le principe, il ne remplace pas un vrai gestionnaire de files. Une dernière section montre les mêmes idées dans un framework (un cadre logiciel qui fournit la structure d'une application) [PHP](/?c=langages&s=php) très répandu, [Drupal](https://www.drupal.org), à titre d'**exemple** seulement.

| Outil réel | Ce que c'est | Pour approfondir |
|---|---|---|
| Redis | Base de données en mémoire dont une liste peut servir de file | [Redis](/?c=donnees&s=bases-de-donnees&p=redis) |
| RabbitMQ | Programme dédié aux files de messages, avec acquittement et réessais | [Documentation](https://www.rabbitmq.com/docs) |
| Amazon SQS | Service de file hébergé par Amazon Web Services, sans serveur à gérer | [Documentation](https://docs.aws.amazon.com/sqs/) |
| Celery | Bibliothèque Python qui range des tâches dans une file et les exécute | [Documentation](https://docs.celeryq.dev/) |

Le chapitre voisin sur [les bases de données à fort trafic](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#files-d-attente-et-traitement-asynchrone) présente la file d'attente en quelques lignes comme remède à une requête lente ; celui-ci entre dans le détail du fonctionnement. La section [Automatisation](/?c=infrastructure-devops&s=automatisation) couvre un autre moyen d'enchaîner des tâches : [le workflow visuel](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow), où l'on assemble des blocs sur un écran au lieu d'écrire du code.

## Pourquoi mettre un travail en file

Sans file, le visiteur attend la fin du travail. Avec une file, la requête dépose une tâche (quelques millisecondes) et répond ; le travail lourd se fait derrière, à son rythme.

```text
SANS FILE                                  AVEC FILE

visiteur --requête--> serveur              visiteur --requête--> serveur
                       | fait le travail                          | dépose la tâche
                       | (8 secondes)                             v
visiteur <--réponse--- serveur             visiteur <--réponse-- FILE (instantané)
        (après 8 s)                                                |
                                                                   v
                                                      worker : fait le travail
                                                      (8 secondes, en coulisses)
```

| Besoin | Sans file | Avec file |
|---|---|---|
| **Répondre vite** | La requête dure autant que le travail | La requête dure le temps d'un dépôt |
| **Absorber une pointe** | 1 000 envois d'un coup saturent le serveur | Les 1 000 tâches attendent, 2 ou 3 workers les écoulent à vitesse constante |
| **Rejouer un échec** | Le travail raté est perdu, ou le visiteur voit une erreur | La tâche revient dans la file et on la retente plus tard |
| **Survivre à un redémarrage** | Le travail en mémoire disparaît | La file est stockée (ici en base) : les tâches attendent le retour du worker |
| **Séparer les rythmes** | Un envoi de courriel lent ralentit tout le site | Chaque type de tâche a ses propres workers |

Le prix à payer : le résultat n'est plus immédiat (il faut prévenir l'utilisateur ou lui laisser consulter un état), le système compte une pièce de plus à surveiller, et une tâche peut être exécutée **plus d'une fois** (voir [Réessais](#reessais-tache-empoisonnee-et-idempotence)).

## Producteur, file et worker

Trois rôles se partagent le travail :

```text
  PRODUCTEUR              FILE D'ATTENTE                 WORKER
 (dépose)                (range, dans l'ordre)          (exécute)

 requête web  --+        +---------------------+        +--> worker A
 planificateur -+------> | tâche 1             | -----> |
 autre worker --+        | tâche 2             |        +--> worker B
                         | tâche 3  ...        |
                         +---------------------+
                          premier arrivé, premier servi
```

| Rôle | Définition | Exemple |
|---|---|---|
| **Producteur** | Tout ce qui dépose une tâche | Le code qui traite un formulaire ; le planificateur |
| **File d'attente** (*queue*) | Une liste ordonnée où l'on dépose d'un côté et où l'on prend de l'autre : le premier arrivé est le premier servi | Une table en base, un service dédié |
| **Worker** (« ouvrier ») | Un [processus](/?c=langages&s=c&p=processus) (un programme en cours d'exécution) qui tourne en boucle : il prend une tâche, la traite, recommence | Le script `lancer_worker.py` plus bas |
| **Planificateur** (*scheduler*) | Un producteur qui dépose des tâches à heures fixes | Voir [le planificateur](#le-planificateur-applicatif-un-seul-cron-qui-decide) |
| **Superviseur** | Un programme qui relance un worker arrêté | [`systemd`](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html), [`supervisord`](https://supervisord.org/) |

Le traitement est dit **asynchrone** : celui qui dépose ne reste pas à attendre le résultat. Une tâche traverse quatre états :

```text
                 prendre                    acquitter
 en_attente ------------------> en_cours -------------------> terminee
     ^                              |
     |   échec, ou verrou refusé    |   trop d'échecs
     +------------------------------+--------------------------> morte
```

| État | Sens |
|---|---|
| `en_attente` | Déposée, personne ne l'a encore prise (ou elle est revenue après un échec) |
| `en_cours` | Un worker l'a prise et la traite |
| `terminee` | Le worker a **acquitté** : il confirme que la tâche est faite (la ligne reste en base, mais plus personne ne la reprend) |
| `morte` | La tâche a échoué trop de fois : on la met de côté pour qu'un humain la regarde |

## Le mini-système d'essai : la file

Les fichiers de l'essai, tous du Python lisible dans un éditeur. Ils se placent dans **un même dossier** ; la première ligne de chaque bloc de code ci-dessous (`# fichier : ...`) donne le nom du fichier à créer :

| Fichier | Rôle |
|---|---|
| `fileq.py` | Le schéma SQL des tables, deux horloges, l'ouverture de la base |
| `file_attente.py` | La file : déposer, prendre, acquitter, reporter, abandonner |
| `verrou.py` | Le verrou à expiration |
| `worker.py` | Le squelette d'un worker (méthode modèle) |
| `recalculateur.py` | Un worker concret |
| `planificateur.py` | Le planificateur applicatif |
| `demo.py` | Six scènes qui font tourner l'ensemble |
| `deposer_taches.py` | Crée une base et y dépose trois tâches, avant de lancer le vrai worker |
| `lancer_worker.py` | La boucle d'un vrai worker, pour le superviseur |

Dans le code, les blocs entre `"""` (guillemets triples) placés au début d'une fonction ou d'une classe sont des **docstrings**, des textes de documentation : `@brief` résume ce que fait l'élément, `@param` décrit un argument, `@returns` la valeur rendue. Les lignes qui commencent par `#` sont des commentaires, ignorés à l'exécution.

Première brique : le schéma et les horloges. L'**horloge factice** (`Horloge`) est la ruse qui rend l'essai reproductible : au lieu d'attendre vraiment 30 secondes, on avance un compteur.

```python
# fichier : fileq.py
# sqlite3 : module de Python qui pilote une base SQLite (une base stockée dans un fichier)
import sqlite3
# time : module de Python qui donne l'heure du système
import time

# SCHEMA : le texte SQL qui crée les quatre tables (une table = un tableau de lignes)
SCHEMA = """
-- (deux tirets : commentaire SQL) taches : la file ; une ligne par tâche à faire
-- CREATE TABLE IF NOT EXISTS : crée la table seulement si elle n'existe pas encore
CREATE TABLE IF NOT EXISTS taches (
    id INTEGER PRIMARY KEY,                  -- INTEGER : entier ; numéro unique
    cle TEXT NOT NULL,                       -- TEXT : texte ; NOT NULL : obligatoire
    action TEXT NOT NULL,                    -- ce qu'il faut faire : "recalculer"
    etat TEXT NOT NULL DEFAULT 'en_attente', -- DEFAULT : valeur de départ
    essais INTEGER NOT NULL DEFAULT 0,       -- nombre de tentatives déjà commencées
    disponible_a INTEGER NOT NULL DEFAULT 0  -- pas avant ce moment (secondes)
);
-- verrous : une ligne par clé actuellement réservée
CREATE TABLE IF NOT EXISTS verrous (
    cle TEXT PRIMARY KEY,                    -- la clé réservée ; PRIMARY KEY = unique
    proprietaire TEXT NOT NULL,              -- le nom du worker qui l'a réservée
    expire_a INTEGER NOT NULL                -- moment où la réservation s'éteint
);
-- planning : les tâches récurrentes que le planificateur doit déposer
CREATE TABLE IF NOT EXISTS planning (
    action TEXT PRIMARY KEY,                 -- le nom de la tâche récurrente
    toutes_les INTEGER NOT NULL,             -- l'intervalle, en secondes
    prochaine INTEGER NOT NULL               -- la prochaine échéance
);
-- resultats : ce que les workers produisent, une ligne par tâche traitée
CREATE TABLE IF NOT EXISTS resultats (
    tache INTEGER PRIMARY KEY,               -- le numéro de la tâche
    texte TEXT NOT NULL                      -- le résultat
);
"""


class Horloge:
    """
    @brief Horloge factice : on avance le temps à la main, sans attendre.
    """

    def __init__(self):
        # __init__ est le constructeur : il prépare l'objet neuf ; t = temps actuel (s)
        self.t = 0

    def maintenant(self):
        # renvoie le temps actuel
        return self.t

    def avancer(self, secondes):
        # fait passer le temps sans attendre pour de vrai
        self.t += secondes


class HorlogeReelle:
    """
    @brief Horloge du système, en secondes entières.
    """

    def maintenant(self):
        # time.time() donne les secondes écoulées depuis 1970 ; int() les arrondit
        return int(time.time())


def ouvrir(chemin):
    """
    @brief Ouvre la base SQLite et crée les tables si elles manquent.

    @param chemin: texte, chemin du fichier de la base

    @returns: une connexion en validation automatique
    """
    # isolation_level=None : chaque requête est validée seule, tout de suite
    # timeout=5 : si la base est occupée par un autre, on patiente 5 s avant d'échouer
    base = sqlite3.connect(chemin, isolation_level=None, timeout=5)
    # row_factory : permet de lire une colonne par son nom (ligne["cle"])
    base.row_factory = sqlite3.Row
    # exécute le texte SQL de création des tables
    base.executescript(SCHEMA)
    return base
```

La file elle-même. Une **classe** (`class File`) regroupe des fonctions (appelées **méthodes**) et des données ; `self` désigne l'objet courant (voir [la programmation orientée objet en Python](/?c=langages&s=python&p=poo)). Les valeurs entre parenthèses, comme `(cle, action)`, forment un **tuple**, une liste figée (voir [les listes et les tuples](/?c=langages&s=python&p=listes-et-tuples)).

```python
# fichier : file_attente.py
class File:
    """
    @brief La file : déposer, prendre, acquitter, reporter, abandonner.
    """

    # DELAI_VISIBILITE : une tâche prise réapparaît si personne ne l'acquitte en 30 s
    DELAI_VISIBILITE = 30

    def __init__(self, base, horloge):
        # base : la connexion SQLite ; horloge : la source du temps
        self.base = base
        self.horloge = horloge

    def deposer(self, cle, action):
        # INSERT ajoute une ligne ; chaque « ? » prend, dans l'ordre, une valeur du tuple
        self.base.execute(
            "INSERT INTO taches (cle, action) VALUES (?, ?)", (cle, action)
        )

    def prendre(self):
        """
        @brief Réserve la plus ancienne tâche due, en une seule requête.

        @returns: une ligne de la table taches, ou None si rien n'est dû
        """
        maintenant = self.horloge.maintenant()
        curseur = self.base.execute(
            # UPDATE modifie la ligne choisie : elle passe en_cours, un essai de plus,
            # et sa date de réapparition est repoussée de 30 s (* = toutes les colonnes)
            "UPDATE taches SET etat = 'en_cours', essais = essais + 1,"
            " disponible_a = ? WHERE id = (SELECT id FROM taches"
            # candidates : en attente, ou en cours mais laissées sans acquittement
            " WHERE etat IN ('en_attente', 'en_cours') AND disponible_a <= ?"
            # ORDER BY id LIMIT 1 : la plus ancienne ; RETURNING renvoie la ligne modifiée
            " ORDER BY id LIMIT 1) RETURNING *",
            (maintenant + self.DELAI_VISIBILITE, maintenant),
        )
        # fetchall() lit les lignes renvoyées (zéro ou une ici)
        lignes = curseur.fetchall()
        return lignes[0] if lignes else None

    def acquitter(self, id_tache):
        # tâche réussie : état terminee, aucun délai, aucun essai rendu
        self._changer(id_tache, "terminee", 0, 0)

    def reporter(self, id_tache, delai, rendre_essai):
        # retour en file, invisible pendant « delai » secondes
        self._changer(id_tache, "en_attente", delai, rendre_essai)

    def abandonner(self, id_tache):
        # tâche empoisonnée : état morte, plus jamais reprise
        self._changer(id_tache, "morte", 0, 0)

    def _changer(self, id_tache, etat, delai, rendre_essai):
        # le « _ » devant le nom signale une méthode interne à la classe
        self.base.execute(
            "UPDATE taches SET etat = ?, disponible_a = ?,"
            " essais = essais - ? WHERE id = ?",
            (etat, self.horloge.maintenant() + delai, rendre_essai, id_tache),
        )
```

Tout se joue dans `prendre()`. Si le worker A lisait la plus ancienne tâche (`SELECT`) puis la marquait « en cours » (`UPDATE`) en deux requêtes séparées, le worker B pourrait la lire entre les deux et la prendre aussi. Ici, **une seule requête** choisit et marque : une opération est dite **atomique** quand elle s'exécute d'un bloc, sans qu'aucune autre ne puisse s'intercaler. SQLite sérialise les écritures, donc deux `prendre()` simultanés se suivent, ne se mélangent pas.

| Étape de `prendre()` | Ce qui se passe | Pourquoi |
|---|---|---|
| `WHERE etat IN ('en_attente', 'en_cours') AND disponible_a <= ?` | Candidates : les tâches dues, plus celles « en cours » dont le délai est dépassé | Une tâche abandonnée par un worker planté **réapparaît** |
| `ORDER BY id LIMIT 1` | On garde la plus ancienne | Premier arrivé, premier servi |
| `SET etat = 'en_cours', essais = essais + 1, disponible_a = ?` | Elle est réservée pour 30 s | Les autres workers ne la voient plus pendant ce **délai de visibilité** |
| `acquitter()` | État `terminee` | Sans acquittement, la tâche revient : jamais de perte silencieuse |

L'accès à la base par plusieurs processus à la fois fonctionne ici parce que SQLite verrouille le fichier le temps d'une écriture ; `timeout=5` dit « attends jusqu'à 5 secondes si le fichier est occupé ». Les mots `RETURNING` et `ON CONFLICT` demandent une version récente de SQLite (`python3 -c "import sqlite3; print(sqlite3.sqlite_version)"` affiche la vôtre ; voir [la clause RETURNING](https://www.sqlite.org/lang_returning.html) et [l'upsert](https://www.sqlite.org/lang_upsert.html), « insérer, ou modifier si la ligne existe déjà »). Pour un vrai déploiement, on utilise le plus souvent un service dédié ou une base serveur ; le principe reste identique.

## Le patron « méthode modèle » : un squelette fixe, un trou à remplir

Un **patron de conception** (*design pattern*) est une solution éprouvée à un problème de structure qui revient souvent. La **méthode modèle** (*template method*) s'applique ici : tous les workers font la **même suite d'étapes** (prendre, verrouiller, traiter, acquitter ou réessayer, libérer), seul le « traiter » change. Plutôt que de recopier la boucle dans chaque worker (et d'oublier le verrou dans l'un d'eux), une **classe de base** fixe le squelette, et chaque **classe fille** ne fournit que l'étape variable (voir [l'héritage en Python](/?c=langages&s=python&p=poo#l-heritage)).

```text
Worker.un_tour()      <- squelette, écrit UNE fois
  1. prendre une tâche
  2. prendre le verrou sur sa clé
  3. self.traiter(tache)     <- le trou : défini par la classe fille
  4. acquitter, ou réessayer / abandonner
  5. libérer le verrou
```

Le squelette utilise le bloc `try` / `except` / `else` / `finally` (voir [la gestion des erreurs en Python](/?c=langages&s=python&p=gestion-des-erreurs)) : `try` essaie le travail, `except` s'exécute s'il échoue, `else` s'il réussit, `finally` dans tous les cas. Il utilise aussi `raise`, qui déclenche une erreur à la main.

```python
# fichier : worker.py
class Worker:
    """
    @brief Squelette d'un worker. Les classes filles fournissent traiter().
    """

    # MAX_ESSAIS : après 3 échecs, la tâche est abandonnée
    MAX_ESSAIS = 3
    # DUREE_VERROU : le verrou s'éteint tout seul après 20 s
    DUREE_VERROU = 20

    def __init__(self, nom, file, verrou, horloge):
        # nom : identité du worker ; file, verrou, horloge : ses trois outils
        self.nom = nom
        self.file = file
        self.verrou = verrou
        self.horloge = horloge

    def traiter(self, tache):
        # raise déclenche une erreur ; NotImplementedError = « pas encore écrit » :
        # la classe de base ne sait pas travailler, la classe fille doit redéfinir traiter()
        raise NotImplementedError("la classe fille doit définir traiter()")

    def dire(self, texte):
        # f"..." : les {...} sont remplacés par leur valeur ; :>3 aligne à droite sur 3
        print(f"[t={self.horloge.maintenant():>3}] {self.nom} : {texte}")

    def un_tour(self):
        """
        @brief Un tour : prendre, verrouiller, traiter, acquitter ou réessayer.

        @returns: False si la file était vide, True sinon
        """
        # 1. lecture de la file
        tache = self.file.prendre()
        if tache is None:
            return False
        id_tache, cle = tache["id"], tache["cle"]
        # 2. verrou sur la clé ; refusé : on repousse de 5 s et on rend l'essai
        if not self.verrou.prendre(cle, self.nom, self.DUREE_VERROU):
            self.dire(f"tâche {id_tache}, {cle} est verrouillée, on repousse")
            self.file.reporter(id_tache, delai=5, rendre_essai=1)
            return True
        try:
            # 3. le travail : la seule partie qui change d'une classe fille à l'autre
            self.traiter(tache)
        except Exception as erreur:
            # attrape toute erreur et la nomme « erreur »
            # 4a. échec : réessai plus tard, ou abandon
            self._echec(tache, erreur)
        else:
            # 4b. succès : on acquitte, la tâche ne reviendra plus
            self.file.acquitter(id_tache)
            self.dire(f"tâche {id_tache} ({tache['action']}) terminée")
        finally:
            # 5. dans tous les cas, on rend le verrou
            self.verrou.liberer(cle, self.nom)
        return True

    def _echec(self, tache, erreur):
        # essais : nombre de tentatives déjà faites, celle-ci comprise
        id_tache, essais = tache["id"], tache["essais"]
        if essais >= self.MAX_ESSAIS:
            # trop d'échecs : la tâche passe à l'état « morte »
            self.file.abandonner(id_tache)
            self.dire(f"tâche {id_tache} abandonnée après {essais} essais : {erreur}")
            return
        # attente doublée à chaque échec (2 ** n = 2 puissance n) : 10 s, 20 s, 40 s...
        # avec MAX_ESSAIS = 3, la 3e attente (40 s) n'existe pas : l'échec n° 3 abandonne
        attente = 10 * 2 ** (essais - 1)
        self.file.reporter(id_tache, delai=attente, rendre_essai=0)
        self.dire(f"tâche {id_tache} échoue (essai {essais}), réessai dans {attente} s")
```

La classe fille n'a que le travail propre à elle à écrire :

```python
# fichier : recalculateur.py
# importe la classe Worker depuis le fichier worker.py
from worker import Worker


class Recalculateur(Worker):
    """
    @brief Worker concret : il n'écrit que traiter().
    """

    def __init__(self, nom, file, verrou, horloge, pendant=None):
        # super() appelle le constructeur de Worker ; pendant simule un travail long
        super().__init__(nom, file, verrou, horloge)
        self.pendant = pendant

    def traiter(self, tache):
        # une action « corrompue » simule une donnée qui fait toujours échouer
        if tache["action"] == "corrompue":
            raise ValueError("données illisibles")
        self.dire(f"traite {tache['action']} sur {tache['cle']}")
        # moment où un autre worker peut passer (utilisé dans la démonstration)
        if self.pendant:
            self.pendant()
        # INSERT OR REPLACE : rejouer la tâche écrase la même ligne (idempotence)
        self.file.base.execute(
            "INSERT OR REPLACE INTO resultats (tache, texte) VALUES (?, ?)",
            (tache["id"], f"{tache['action']} fait sur {tache['cle']}"),
        )
```

Ce qui compte dans `un_tour()` : le `finally` **libère toujours le verrou**, que le traitement réussisse ou échoue.

| Fixé par la classe de base | Fourni par la classe fille |
|---|---|
| Lecture de la file | Le travail (`traiter`) |
| Pose et libération du verrou | Rien d'autre |
| Acquittement, nombre d'essais, attente entre essais, abandon | |
| Journal des événements | |

Le principe porte un nom général : **l'inversion de contrôle**. Ce n'est plus votre code qui pilote la suite d'étapes, c'est le squelette qui appelle votre code au bon moment (voir [l'inversion de contrôle et les points d'extension](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension)). Quand le framework retrouve lui-même les classes filles disponibles, on obtient une [architecture à plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins).

## Le verrou applicatif sur une entité

Une **entité** est une donnée qui a une identité propre et que l'on peut désigner : ici une **fiche** (une ligne de base de données avec son numéro). Deux tâches différentes peuvent viser la même fiche (« recalculer la fiche 7 » et « envoyer un courriel à propos de la fiche 7 ») ; si deux workers les traitent en même temps, l'un peut écraser le travail de l'autre. Le script suivant rejoue la scène : deux workers lisent un compteur de vues, chacun ajoute 1.

```python
# fichier : compteur.py
# os.path.join assemble un chemin ; sqlite3 pilote SQLite ; tempfile fait un dossier
import os
import sqlite3
import tempfile

# deux connexions vers la même base : deux workers qui travaillent en même temps
# (isolation_level=None : chaque requête est validée tout de suite)
chemin = os.path.join(tempfile.mkdtemp(), "compteur.db")
a = sqlite3.connect(chemin, isolation_level=None)
b = sqlite3.connect(chemin, isolation_level=None)
# une fiche numéro 7 dont le compteur de vues vaut 0
a.execute("CREATE TABLE fiche (id INTEGER PRIMARY KEY, vues INTEGER)")
a.execute("INSERT INTO fiche VALUES (7, 0)")

# A lit le compteur (0), puis B le lit aussi (0) avant que A n'ait écrit
# fetchone() lit une ligne du résultat ; [0] en prend la première colonne
lu_par_a = a.execute("SELECT vues FROM fiche WHERE id = 7").fetchone()[0]
lu_par_b = b.execute("SELECT vues FROM fiche WHERE id = 7").fetchone()[0]
# chacun écrit « ce qu'il a lu + 1 » : B écrase le travail de A
a.execute("UPDATE fiche SET vues = ? WHERE id = 7", (lu_par_a + 1,))
b.execute("UPDATE fiche SET vues = ? WHERE id = 7", (lu_par_b + 1,))
# deux ajouts ont eu lieu, le compteur devrait valoir 2
final = a.execute("SELECT vues FROM fiche WHERE id = 7").fetchone()[0]
print(f"valeur finale : {final} (attendu : 2)")

# SELECT ... FOR UPDATE (verrou de ligne d'autres bases) n'existe pas dans SQLite
try:
    a.execute("SELECT vues FROM fiche WHERE id = 7 FOR UPDATE")
except sqlite3.OperationalError as erreur:
    print(f"SQLite refuse : {erreur}")
```

Sortie obtenue :

```text
valeur finale : 1 (attendu : 2)
SQLite refuse : near "FOR": syntax error
```

Deux ajouts, un seul compte : c'est la **mise à jour perdue** (*lost update*). La seconde ligne montre que le verrou de ligne `SELECT ... FOR UPDATE`, que d'autres bases offrent, n'existe pas dans SQLite. On construit donc un **verrou applicatif** : une réservation gérée par notre propre code, ici dans une table `verrous`.

Un **verrou** (ou *mutex*, pour *mutual exclusion*, « exclusion mutuelle ») garantit qu'un seul acteur à la fois détient une ressource ; le même mot existe entre [threads](/?c=langages&s=c&p=threads) au sein d'un programme. Ici la ressource est une **clé** (`"fiche:7"`) et les acteurs sont des workers, donc des processus séparés. Notre verrou a une **expiration** : la réservation s'éteint seule au bout de `duree` secondes.

```python
# fichier : verrou.py
class Verrou:
    """
    @brief Verrou en base, avec une date d'expiration.
    """

    def __init__(self, base, horloge):
        # base : la connexion SQLite ; horloge : la source du temps
        self.base = base
        self.horloge = horloge

    def prendre(self, cle, proprietaire, duree):
        """
        @brief Pose le verrou si la clé est libre ou si l'ancien verrou a expiré.

        @param cle: texte, ce que l'on verrouille ("fiche:7")
        @param proprietaire: texte, nom du worker
        @param duree: entier, secondes avant expiration

        @returns: True si le verrou est à nous, False s'il est tenu
        """
        maintenant = self.horloge.maintenant()
        curseur = self.base.execute(
            # on tente d'insérer la ligne : réussit seulement si la clé est absente
            "INSERT INTO verrous (cle, proprietaire, expire_a)"
            # clé déjà présente (ON CONFLICT) : on reprend la ligne (excluded = la
            # ligne qu'on tentait d'insérer), mais...
            " VALUES (?, ?, ?) ON CONFLICT(cle) DO UPDATE SET"
            " proprietaire = excluded.proprietaire,"
            # ... seulement si l'ancien verrou est expiré ; sinon rien ne change
            " expire_a = excluded.expire_a WHERE verrous.expire_a <= ?",
            (cle, proprietaire, maintenant + duree, maintenant),
        )
        # rowcount : nombre de lignes touchées ; 1 = verrou obtenu, 0 = refusé
        return curseur.rowcount == 1

    def liberer(self, cle, proprietaire):
        # on ne supprime que SON verrou : si un autre l'a repris, on n'y touche pas
        self.base.execute(
            "DELETE FROM verrous WHERE cle = ? AND proprietaire = ?",
            (cle, proprietaire),
        )
```

| Mécanisme de verrouillage | Portée | Limite |
|---|---|---|
| `flock` sur un fichier (voir [cron et `flock`](/?c=langages&s=bash&p=automatisation-cron#eviter-les-executions-concurrentes-avec-flock)) | Une seule machine | Inutile dès que les workers sont sur plusieurs serveurs |
| Verrou de ligne de la base (`SELECT ... FOR UPDATE` dans les bases qui l'offrent) | La ligne, le temps d'une transaction (un groupe d'opérations validé d'un bloc) | Attaché à une transaction : mal adapté à un travail long |
| **Verrou applicatif en table, avec expiration** (notre cas) | Toutes les machines qui voient la base | Il faut gérer l'expiration soi-même |
| Service externe de verrous | Toutes les machines | Une pièce de plus à faire tourner |

### Le risque d'un verrou jamais libéré

Si le worker plante en tenant le verrou, personne ne le libère. Sans expiration, la fiche reste bloquée **pour toujours**. C'est la raison d'être de `expire_a`. Mais la durée se choisit avec soin :

| Durée du verrou | Danger |
|---|---|
| **Trop courte** (moins que le travail) | Le verrou expire pendant que le worker travaille encore : un second worker entre, les deux modifient la fiche |
| **Trop longue** | Après un plantage, la fiche reste intouchable longtemps |
| **Juste** (un peu plus que le pire cas du travail) | Le compromis ; on la complète par une tâche **idempotente** (voir plus bas) pour que même un chevauchement exceptionnel ne cause pas de dégât |

Pour un travail dont la durée varie beaucoup, on peut **renouveler** le verrou (repousser `expire_a`) pendant le travail ; on peut aussi donner à chaque prise un numéro croissant (un **jeton de contrôle**, *fencing token*) que la base vérifie à l'écriture pour refuser un worker devenu trop lent. Notre essai ne fait ni l'un ni l'autre.

## Le planificateur applicatif : un seul cron qui décide

[`cron`](/?c=langages&s=bash&p=automatisation-cron) est le programme du système qui lance une commande à heures fixes. Écrire une ligne dans le **crontab** (le fichier où l'on liste les commandes de `cron`) par tâche récurrente de l'application a des défauts : le système ignore les données de l'application, chaque nouvelle tâche exige un accès au serveur, et rien n'empêche deux lancements de se chevaucher. Le **planificateur applicatif** inverse l'approche : le système ne lance qu'**un** script, chaque minute, et c'est l'application qui décide, d'après une table `planning`, quelles tâches sont **dues** (arrivées à échéance).

```text
 crontab :  * * * * *  /usr/bin/python3 /srv/app/tick.py      (UNE ligne)
                  |
                  v
          tick() : lit la table planning
                  |   "purge : toutes les 60 s, prochaine échéance = t"
                  v
          pour chaque ligne due : avancer l'échéance, déposer une tâche
                  |
                  v
               FILE  ->  workers
```

| Approche | Qui connaît le calendrier | Ajouter une tâche récurrente |
|---|---|---|
| Une ligne `crontab` par tâche | Le système | Modifier le crontab sur chaque serveur |
| **Planificateur applicatif** | L'application (table `planning`) | Insérer une ligne en base |

Dans le code suivant, la boucle `for` (voir [les boucles Python](/?c=langages&s=python&p=boucles)) répète son bloc une fois pour chaque élément d'une liste.

```python
# fichier : planificateur.py
class Planificateur:
    """
    @brief Lancé par cron : dépose dans la file les tâches arrivées à échéance.
    """

    def __init__(self, base, file, horloge):
        # base : la connexion SQLite ; file : où déposer ; horloge : la source du temps
        self.base = base
        self.file = file
        self.horloge = horloge

    def tick(self):
        """
        @brief Un passage : repère les tâches dues et les met en file une fois.
        """
        maintenant = self.horloge.maintenant()
        # les tâches récurrentes dont l'échéance est arrivée
        dues = self.base.execute(
            "SELECT action, toutes_les FROM planning WHERE prochaine <= ?",
            (maintenant,),
        ).fetchall()
        # for : un tour de boucle par tâche due, « ligne » étant la tâche du tour
        for ligne in dues:
            # on avance l'échéance D'ABORD : si deux planificateurs passent, un seul gagne
            curseur = self.base.execute(
                "UPDATE planning SET prochaine = ? WHERE action = ?"
                " AND prochaine <= ?",
                (maintenant + ligne["toutes_les"], ligne["action"], maintenant),
            )
            # une ligne modifiée = c'est nous qui avons avancé l'échéance : on dépose
            if curseur.rowcount == 1:
                self.file.deposer(ligne["action"], ligne["action"])
                print(f"[t={maintenant:>3}] planificateur : dépose {ligne['action']}")
```

Trois détails comptent. D'abord, le planificateur **dépose seulement** ; il ne fait pas le travail, donc il termine en un instant et ne risque pas de déborder sur le passage suivant. Ensuite, l'échéance est avancée **avant** de déposer, par un `UPDATE ... WHERE prochaine <= ?` dont on vérifie `rowcount` : si deux passages se chevauchent, un seul modifie la ligne et dépose, l'autre voit `0` et ne fait rien. Enfin, `prochaine = maintenant + intervalle` signifie qu'après une panne de la machine, la tâche manquée est déposée **une fois**, pas dix.

## L'essai complet, scène par scène

`demo.py` enchaîne six scènes, chacune sur une base neuve. Voici le fichier (les `import` sont expliqués dans [les modules Python](/?c=langages&s=python&p=modules-et-environnements)) :

```python
# fichier : demo.py
# os.path.join assemble un chemin ; tempfile crée des dossiers temporaires
import os
import tempfile

# « from X import Y » : importe Y depuis le fichier X.py de l'essai
from file_attente import File
from fileq import Horloge, ouvrir
from planificateur import Planificateur
from recalculateur import Recalculateur
from verrou import Verrou


def monde():
    """
    @brief Crée une base neuve, une horloge, une file et un verrou.

    @returns: le quadruplet (base, horloge, file, verrou)
    """
    # mkdtemp() crée un dossier temporaire neuf ; la base y vit le temps de l'essai
    base = ouvrir(os.path.join(tempfile.mkdtemp(), "essai.db"))
    horloge = Horloge()
    return base, horloge, File(base, horloge), Verrou(base, horloge)


def afficher_taches(base):
    # une ligne par tâche (* = toutes les colonnes) ; :<8 aligne à gauche sur 8
    for t in base.execute("SELECT * FROM taches ORDER BY id"):
        print(f"  tâche {t['id']} {t['cle']:<8} {t['action']:<13} {t['etat']:<11}"
              f" essais={t['essais']}")


print("--- Scène 1 : le planificateur ---")
base, horloge, file, verrou = monde()
# une tâche récurrente : « purge », toutes les 60 s, due dès l'instant 0
base.execute("INSERT INTO planning VALUES ('purge', 60, 0)")
planificateur = Planificateur(base, file, horloge)
# trois passages de cron, espacés de 30 s : aux instants 0, 30 et 60
# range(3) fournit 0, 1, 2 : trois tours ; « _ » : le numéro du tour, dont on se moque
for _ in range(3):
    planificateur.tick()
    horloge.avancer(30)

print("--- Scène 2 : deux workers, une même fiche ---")
base, horloge, file, verrou = monde()
# trois tâches : deux sur la fiche 7, une sur la fiche 8
file.deposer("fiche:7", "recalculer")
file.deposer("fiche:7", "envoyer_mail")
file.deposer("fiche:8", "recalculer")
b = Recalculateur("B", file, verrou, horloge)
# lambda : mini-fonction sans nom ; pendant que A « travaille », B fait deux tours
a = Recalculateur("A", file, verrou, horloge, pendant=lambda: (b.un_tour(), b.un_tour()))
# A prend la tâche 1 (fiche 7) ; B passe pendant ce temps
a.un_tour()
# 6 s plus tard, la tâche repoussée par B est de nouveau disponible
horloge.avancer(6)
b.un_tour()
afficher_taches(base)

print("--- Scène 3 : un worker plante en tenant le verrou ---")
base, horloge, file, verrou = monde()
file.deposer("fiche:9", "recalculer")
# le worker C réserve fiche:9 pour 20 s, puis « plante » sans rien libérer
verrou.prendre("fiche:9", "C", 20)
b = Recalculateur("B", file, verrou, horloge)
# B se heurte au verrou de C et repousse la tâche
b.un_tour()
# 21 s plus tard, le verrou de C a expiré : B peut travailler
horloge.avancer(21)
b.un_tour()

print("--- Scène 4 : un worker plante avant d'acquitter ---")
base, horloge, file, verrou = monde()
file.deposer("fiche:5", "recalculer")
# C prend la tâche, puis s'arrête sans l'acquitter ni la reporter
tache = file.prendre()
print(f"[t=  0] C : prend la tâche {tache['id']} puis s'arrête net")
# au-delà du délai de visibilité (30 s), la tâche réapparaît pour B
horloge.avancer(31)
Recalculateur("B", file, verrou, horloge).un_tour()
afficher_taches(base)

print("--- Scène 5 : une tâche empoisonnée ---")
base, horloge, file, verrou = monde()
file.deposer("fiche:3", "corrompue")
b = Recalculateur("B", file, verrou, horloge)
# trois tours, aux instants 0, 10 puis 30 : les attentes de 10 s et 20 s s'écoulent
# for pas in (0, 10, 20) : un tour par valeur du tuple, « pas » valant 0, puis 10, puis 20
for pas in (0, 10, 20):
    horloge.avancer(pas)
    b.un_tour()
afficher_taches(base)

print("--- Scène 6 : rejouer une tâche ---")
base, horloge, file, verrou = monde()
file.deposer("fiche:2", "recalculer")
b = Recalculateur("B", file, verrou, horloge)
b.un_tour()
# on relit la tâche 1 et on la fait traiter une seconde fois, à la main
ligne = base.execute("SELECT * FROM taches WHERE id = 1").fetchone()
b.traiter(ligne)
# COUNT(*) compte les lignes de la table resultats
n = base.execute("SELECT COUNT(*) FROM resultats").fetchone()[0]
print(f"lignes dans resultats après deux traitements : {n}")
```

Lancé par `python3 demo.py`, il écrit (sortie recopiée telle quelle) :

```text
--- Scène 1 : le planificateur ---
[t=  0] planificateur : dépose purge
[t= 60] planificateur : dépose purge
--- Scène 2 : deux workers, une même fiche ---
[t=  0] A : traite recalculer sur fiche:7
[t=  0] B : tâche 2, fiche:7 est verrouillée, on repousse
[t=  0] B : traite recalculer sur fiche:8
[t=  0] B : tâche 3 (recalculer) terminée
[t=  0] A : tâche 1 (recalculer) terminée
[t=  6] B : traite envoyer_mail sur fiche:7
[t=  6] B : tâche 2 (envoyer_mail) terminée
  tâche 1 fiche:7  recalculer    terminee    essais=1
  tâche 2 fiche:7  envoyer_mail  terminee    essais=1
  tâche 3 fiche:8  recalculer    terminee    essais=1
--- Scène 3 : un worker plante en tenant le verrou ---
[t=  0] B : tâche 1, fiche:9 est verrouillée, on repousse
[t= 21] B : traite recalculer sur fiche:9
[t= 21] B : tâche 1 (recalculer) terminée
--- Scène 4 : un worker plante avant d'acquitter ---
[t=  0] C : prend la tâche 1 puis s'arrête net
[t= 31] B : traite recalculer sur fiche:5
[t= 31] B : tâche 1 (recalculer) terminée
  tâche 1 fiche:5  recalculer    terminee    essais=2
--- Scène 5 : une tâche empoisonnée ---
[t=  0] B : tâche 1 échoue (essai 1), réessai dans 10 s
[t= 10] B : tâche 1 échoue (essai 2), réessai dans 20 s
[t= 30] B : tâche 1 abandonnée après 3 essais : données illisibles
  tâche 1 fiche:3  corrompue     morte       essais=3
--- Scène 6 : rejouer une tâche ---
[t=  0] B : traite recalculer sur fiche:2
[t=  0] B : tâche 1 (recalculer) terminée
[t=  0] B : traite recalculer sur fiche:2
lignes dans resultats après deux traitements : 1
```

| Scène | Ce qu'on observe | Ce que cela montre |
|---|---|---|
| **1** | La purge est déposée à `t=0` et `t=60`, pas à `t=30` | Le planificateur ne dépose que ce qui est dû |
| **2** | Pendant que A travaille sur la fiche 7, B reçoit la tâche 2 (même fiche), se heurte au verrou et la repousse ; B traite alors la fiche 8, qui n'est pas verrouillée ; à `t=6`, B termine la tâche 2 | Deux fiches différentes se traitent en parallèle ; une même fiche se traite à la suite |
| **3** | C meurt en tenant `fiche:9` ; B est refusé à `t=0`, puis réussit à `t=21` | Le verrou expire tout seul |
| **4** | C prend la tâche et disparaît sans acquitter ; à `t=31`, B la reprend (`essais=2`) | Le délai de visibilité rend la tâche à la file |
| **5** | La tâche `corrompue` échoue à `t=0` (attente 10 s), `t=10` (attente 20 s), puis est abandonnée à `t=30` : état `morte` | Réessais espacés, puis abandon |
| **6** | La tâche traitée deux fois ne laisse qu'une ligne dans `resultats` | L'écriture est idempotente |

Le scénario de la scène 2 est **simulé** : le paramètre `pendant` appelle B au milieu du travail de A, ce qui rend l'ordre des lignes identique à chaque lancement. Avec de **vrais** workers simultanés, l'ordre des lignes varierait d'un lancement à l'autre ; la simulation le fige pour qu'on puisse le lire.

## Réessais, tâche empoisonnée et idempotence

Un traitement échoue pour des raisons passagères (réseau coupé, service tiers occupé) ou durables (donnée illisible). La file doit distinguer les deux sans intervention.

| Stratégie de réessai | Principe | Effet / limite |
|---|---|---|
| Réessayer aussitôt | Retour immédiat dans la file | Martèle un service déjà en difficulté |
| Délai fixe | Toujours la même attente | Tous les échecs d'une panne reviennent au même moment |
| **Attente exponentielle** (*exponential backoff*) | 10 s, 20 s, 40 s... : l'attente double à chaque échec (avec `MAX_ESSAIS = 3`, notre essai s'arrête avant la 40 s) | Les tâches durablement fautives patientent de plus en plus longtemps (c'est notre choix) |
| Attente exponentielle avec **gigue** (*jitter*) | La même, plus une petite part de hasard | Évite que des tâches échouées ensemble reviennent ensemble |

Une **tâche empoisonnée** (*poison message*) est une tâche qui échoue **à chaque essai**, quoi qu'on fasse (donnée corrompue, bug). Sans limite, elle tournerait en boucle et occuperait un worker indéfiniment. D'où `MAX_ESSAIS` : après le dernier essai, elle passe à l'état `morte` (une **file des morts**, *dead-letter queue*, dans le vocabulaire des files), et l'on garde la ligne pour qu'un humain la lise et décide. Une file qui accumule des tâches mortes sans alerte cache un problème : il faut surveiller leur nombre.

Troisième notion, la plus importante. La file garantit qu'une tâche est exécutée **au moins une fois** : si un worker plante après avoir fait le travail mais avant d'acquitter (scène 4), la tâche revient et le travail est refait. Pour que ce second passage soit inoffensif, le traitement doit être **idempotent** : le refaire donne le même résultat que le faire une fois (voir [l'idempotence dans la robustesse d'un traitement par lots](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots)).

| Opération | Idempotente ? | Pourquoi |
|---|---|---|
| `INSERT OR REPLACE` sur la clé de la tâche (scène 6) | Oui | La seconde écriture remplace la première |
| `UPDATE fiche SET statut = 'valide'` | Oui | Le résultat est le même après une ou deux fois |
| `UPDATE compte SET solde = solde + 10` | **Non** | Chaque exécution ajoute 10 |
| Envoyer un courriel | **Non** | Impossible de « désenvoyer » ; on envoie, puis on note l'envoi. Un plantage entre les deux laisse un doublon possible : pour l'éviter, on joint un identifiant propre à la tâche que le service d'envoi, s'il le permet, utilise pour ignorer une seconde demande identique |

| Garantie de livraison | Signification | Coût |
|---|---|---|
| **Au plus une fois** | Une tâche est tentée une seule fois, jamais rejouée | Une panne la perd |
| **Au moins une fois** (notre cas) | Rejouée tant qu'elle n'est pas acquittée | Peut s'exécuter deux fois : exige l'idempotence |

## Garder un worker en vie : le superviseur

Un worker est un processus qui peut s'arrêter : erreur imprévue, manque de mémoire, redémarrage de la machine. Il faut un **superviseur**, un programme dont le seul métier est de lancer le worker au démarrage et de le relancer quand il s'arrête. Voici la boucle d'un vrai worker. Elle réagit aux **signaux** : des messages courts que le système envoie à un processus (voir [les signaux Unix](/?c=langages&s=c&p=signaux-unix)).

```python
# fichier : lancer_worker.py
# signal : module de Python qui permet de réagir aux signaux envoyés par le système
import signal
# sys : donne accès aux arguments de la ligne de commande (sys.argv)
import sys
# time : fournit sleep(), une pause
import time

# chaque import reprend une classe ou une fonction d'un fichier de l'essai
# la file d'attente (file_attente.py)
from file_attente import File
# l'horloge du système et l'ouverture de la base (fileq.py)
from fileq import HorlogeReelle, ouvrir
# le worker concret (recalculateur.py)
from recalculateur import Recalculateur
# le verrou à expiration (verrou.py)
from verrou import Verrou

# interrupteur global (variable visible partout dans le fichier) : passe à True
# quand le système demande l'arrêt
arret_demande = False


# fonction appelée par Python à la réception d'un signal, avec deux arguments
def demander_arret(numero, cadre):
    """
    @brief Note qu'on a reçu SIGTERM ou SIGINT : la boucle finira son tour.

    @param numero: entier, numéro du signal
    @param cadre: objet, état d'exécution (non utilisé)
    """
    # global : on modifie la variable du fichier, pas une copie locale
    global arret_demande
    arret_demande = True


# SIGTERM : « arrête-toi » envoyé par un superviseur ; SIGINT : Ctrl+C au clavier
signal.signal(signal.SIGTERM, demander_arret)
signal.signal(signal.SIGINT, demander_arret)

# le worker réel : vraie horloge ; sys.argv est la liste des mots de la commande
# (sys.argv[0] : lancer_worker.py, sys.argv[1] : w.db), d'où le chemin de la base
horloge = HorlogeReelle()
base = ouvrir(sys.argv[1])
worker = Recalculateur("W1", File(base, horloge), Verrou(base, horloge), horloge)
# on boucle tant qu'aucun arrêt n'est demandé ; le tour en cours va toujours à son terme
while not arret_demande:
    # file vide : on dort 1 s plutôt que d'interroger la base sans arrêt
    if not worker.un_tour():
        time.sleep(1)
print("arrêt demandé : tâche en cours terminée, sortie propre")
```

`SIGTERM` signifie « arrête-toi proprement » : le superviseur l'envoie avant un arrêt ou un redémarrage. `SIGINT` est celui que le clavier envoie quand on tape Ctrl+C. Le worker ne s'interrompt pas au milieu d'une tâche : il note la demande et sort de la boucle **après** le tour en cours.

Pour voir ce worker travailler, il lui faut une base qui contient des tâches. Le script `deposer_taches.py` ci-dessous la crée et y dépose trois tâches, puis se termine. Il se place dans le même dossier que les autres fichiers de l'essai.

```python
# fichier : deposer_taches.py
# importe l'horloge du système et ouvrir(), qui crée la base, depuis fileq.py
from fileq import HorlogeReelle, ouvrir
# importe la classe File (la file d'attente) depuis file_attente.py
from file_attente import File

# ouvrir() crée le fichier w.db s'il n'existe pas, avec ses quatre tables vides
base = ouvrir("w.db")
# la file lira l'heure sur l'horloge du système, comme le fera le vrai worker
file = File(base, HorlogeReelle())
# une boucle « for » répète son bloc une fois par valeur : ici, trois fiches
for cle in ("fiche:1", "fiche:2", "fiche:3"):
    # deposer() ajoute une ligne dans la table taches, à l'état en_attente
    file.deposer(cle, "recalculer")
# COUNT(*) compte les lignes de la table taches ; [0] prend la première colonne
n = base.execute("SELECT COUNT(*) FROM taches").fetchone()[0]
# on affiche le total pour vérifier que le dépôt a eu lieu
print(f"{n} tâches déposées dans w.db")
```

Lancé par `python3 deposer_taches.py`, il écrit `3 tâches déposées dans w.db` (relancé, il en dépose trois de plus dans la même base). Ensuite, dans le même dossier, on démarre le worker en [tâche de fond](/?c=langages&s=bash&p=gestion-des-processus), on lui laisse quelques secondes, puis on lui envoie `SIGTERM` :

```bash
# le « & » final lance le worker en arrière-plan : le terminal reste utilisable
python3 lancer_worker.py w.db &
# sleep 3 : pause de 3 secondes, le temps que le worker traite les trois tâches
sleep 3
# $! contient le numéro (PID, identifiant du processus) du dernier lancé en arrière-plan
# kill -TERM envoie SIGTERM au processus de ce numéro (ou kill -TERM <PID>, PID connu)
kill -TERM $!
```

Au premier plan (sans le `&`), le worker garde le terminal : Ctrl+C l'arrête de la même façon, par `SIGINT`. Sortie mesurée, avec l'heure remplacée par `...` (c'est le nombre de secondes écoulées depuis 1970, il change à chaque lancement) :

```text
[t=...] W1 : traite recalculer sur fiche:1
[t=...] W1 : tâche 1 (recalculer) terminée
[t=...] W1 : traite recalculer sur fiche:2
[t=...] W1 : tâche 2 (recalculer) terminée
[t=...] W1 : traite recalculer sur fiche:3
[t=...] W1 : tâche 3 (recalculer) terminée
arrêt demandé : tâche en cours terminée, sortie propre
```

Les trois tâches sont traitées dans l'ordre de dépôt, puis le worker, la file étant vide, dort par pauses d'une seconde jusqu'au signal. Le message final s'affiche quand la boucle se termine ; le programme sort alors avec le code 0, c'est-à-dire sans erreur (voir [les codes de retour](/?c=langages&s=c&p=exit-et-codes-de-retour)). La commande `timeout -s TERM 3 python3 lancer_worker.py w.db` donne la même sortie : [`timeout`](/?c=langages&s=bash&p=gestion-des-processus#limiter-la-duree-d-une-commande-timeout-et-ctrl-c) lance un programme et lui envoie ici `SIGTERM` après 3 secondes. Le worker sort bien avec 0, mais `timeout` rend lui-même 124 pour signaler que le délai a été atteint.

Deux superviseurs courants. [systemd](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html) est le programme qui démarre et surveille tout ce qui tourne sur une machine Linux moderne (voir aussi [les plafonds de ressources avec `systemd-run`](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources)). [supervisord](https://supervisord.org/) est un programme indépendant, plus simple, qui ne fait que surveiller des processus ; son outil en ligne de commande, `supervisorctl`, sert à démarrer, arrêter et lister les processus qu'il surveille.

```ini
# worker-file.service : fichier d'unité systemd (dans /etc/systemd/system/)
[Unit]
# texte affiché dans les listes de services
Description=Worker de la file d'attente

[Service]
# compte système sous lequel le worker tourne (jamais root sans nécessité)
User=app
# dossier courant du processus
WorkingDirectory=/srv/app
# la commande à lancer : chemins absolus, comme pour cron
ExecStart=/usr/bin/python3 /srv/app/lancer_worker.py /srv/app/essai.db
# relancer le worker s'il s'arrête, quelle qu'en soit la raison
Restart=always
# attendre 5 s avant de relancer, pour ne pas boucler à toute vitesse sur une panne
RestartSec=5
# laisser 30 s au worker pour finir sa tâche après SIGTERM, puis le tuer
TimeoutStopSec=30

[Install]
# démarrer ce service au démarrage normal de la machine
WantedBy=multi-user.target
```

```ini
; worker_file.conf : section d'un fichier de configuration de supervisord (souvent
; placé dans /etc/supervisor/conf.d/ ; voir la documentation de supervisord)
; un « programme » supervisé ; le nom sert aux commandes de supervisorctl
[program:worker_file]
; la commande à lancer
command=/usr/bin/python3 /srv/app/lancer_worker.py /srv/app/essai.db
; dossier courant et compte système
directory=/srv/app
user=app
; démarrer avec supervisord et relancer en cas d'arrêt
autostart=true
autorestart=true
; deux workers en parallèle, nommés worker_file_00 et worker_file_01
numprocs=2
process_name=%(program_name)s_%(process_num)02d
; secondes laissées après le signal d'arrêt avant de tuer le processus
stopwaitsecs=30
; les erreurs vont dans le même journal que la sortie normale
redirect_stderr=true
stdout_logfile=/var/log/worker_file.log
```

| Superviseur | Point fort | Point d'attention |
|---|---|---|
| **systemd** | Déjà présent sur la plupart des distributions Linux ; démarrage au boot, journal intégré | Fichiers d'unité à écrire ; propre à Linux |
| **supervisord** | Simple ; plusieurs processus identiques d'une ligne (`numprocs`) ; fonctionne sans systemd | À installer et à superviser lui-même |
| Un `cron` qui relance le worker chaque minute, protégé par `flock` | Aucun outil de plus | Jusqu'à 1 minute sans worker après un arrêt |

Avec `numprocs=2`, deux workers lisent la même file : c'est précisément le cas où le verrou sur la clé devient indispensable. Un worker qui tourne des jours peut grossir en mémoire ; certains projets le font sortir volontairement après un nombre fixe de tâches, le superviseur le relançant propre.

## Le même schéma dans Drupal (exemple)

Drupal est un système de gestion de contenu écrit en PHP. Il offre déjà chaque pièce de ce chapitre, sous d'autres noms. **Cette section est un exemple.** Les noms d'API ci-dessous sont vérifiés sur le code source de Drupal 11.x (l'attribut `#[QueueWorker]` existe depuis Drupal 10.3) ; pour une autre version, consultez la documentation (voir le groupe [Queue](https://api.drupal.org/api/drupal/core!core.api.php/group/queue/11.x) de l'API et l'interface [LockBackendInterface](https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Lock!LockBackendInterface.php/interface/LockBackendInterface/11.x)).

| Notion du chapitre | Équivalent Drupal |
|---|---|
| Producteur + file | `\Drupal::queue('nom')->createItem($donnees)` dépose ; `claimItem()`, `deleteItem()`, `releaseItem()` prennent, acquittent, rendent |
| Worker, classe de base, trou à remplir | Un **plugin** `QueueWorker` qui étend `QueueWorkerBase` et écrit `processItem($data)` |
| Planificateur applicatif | `hook_cron()`, appelé à chaque passage du cron de Drupal (un seul `crontab` lance ce cron) |
| Boucle du worker | Le cron de Drupal vide les files dont le plugin déclare une clé `cron` (durée maximale par passage) ; ou `drush queue:run nom` ([`drush`](https://www.drush.org/) est l'outil en ligne de commande de Drupal) lancé sous systemd/supervisord |
| Verrou applicatif à expiration | `\Drupal::lock()`, de type `LockBackendInterface` : `acquire($nom, $delai)` rend `true` ou `false`, `release($nom)` libère |
| Réessai | Lever `RequeueException` relâche l'élément tout de suite : le cron peut le reprendre dans le même passage (pour attendre avant un nouvel essai, on lève `DelayedRequeueException`) ; lever `SuspendQueueException` arrête le traitement de la file, mais seulement pour le passage de cron en cours, et l'élément est relâché |

Notation PHP des deux blocs (voir [la syntaxe](/?c=langages&s=php&p=syntaxe), [la programmation orientée objet](/?c=langages&s=php&p=poo) et [les exceptions](/?c=langages&s=php&p=exceptions)) :

| Notation | Sens |
|---|---|
| `$nom` | Une variable : le `$` la marque |
| `A::b()` | Appel d'une fonction rattachée à la classe `A`, sans créer d'objet |
| `$objet->b()` | Appel d'une méthode de l'objet `$objet` ; `\Drupal::queue('x')->createItem(...)` enchaîne les deux |
| `['a' => 7]` | Un tableau où la clé `'a'` vaut 7 |
| `foreach ([...] as $id)` | Un tour de boucle par élément du tableau |
| `throw new E()` | Déclenche l'erreur `E`, comme `raise` en Python |
| `!` | Négation : `!$x` signifie « pas $x » |

Le worker (un plugin dont l'identifiant est déclaré par un attribut PHP, sur le modèle décrit dans [l'architecture à plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins)) :

```php
<?php

// namespace : l'« adresse » de la classe, qui correspond à son dossier dans le module
namespace Drupal\exemple\Plugin\QueueWorker;

// use : annonce les classes de Drupal que ce fichier utilise
use Drupal\Core\Queue\Attribute\QueueWorker;
use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\Core\Queue\RequeueException;
use Drupal\Core\StringTranslation\TranslatableMarkup;

// l'attribut #[...] étiquette la classe comme worker : identifiant, titre affiché,
// et durée maximale (60 s) que le cron peut consacrer à cette file par passage
#[QueueWorker(
  id: 'exemple_recalcul',
  title: new TranslatableMarkup('Recalcul des fiches'),
  cron: ['time' => 60],
)]
// extends : hérite du squelette de QueueWorkerBase, la « classe de base » du chapitre
class RecalculFiche extends QueueWorkerBase {

  /**
   * @brief Traite un élément de la file « exemple_recalcul ».
   *
   * @param mixed $data : ce qui a été déposé, ici ['fiche_id' => 7]
   */
  // public : appelable de l'extérieur ; mixed : le type de $data n'est pas contraint
  public function processItem($data) {
    // la clé du verrou, construite à partir de la fiche visée
    $cle = 'exemple_fiche:' . $data['fiche_id'];
    // le service de verrous de Drupal
    $verrou = \Drupal::lock();
    // acquire() rend false si la clé est tenue ; 30.0 : expiration en secondes
    if (!$verrou->acquire($cle, 30.0)) {
      // on relâche l'élément : il redevient disponible tout de suite
      throw new RequeueException();
    }
    try {
      // ... le vrai travail sur la fiche, à écrire de façon idempotente ...
    }
    finally {
      // quoi qu'il arrive, on libère le verrou
      $verrou->release($cle);
    }
  }

}
```

Le producteur, sous forme d'un `hook_cron` : une fonction que le cron de Drupal appelle par convention de nom, selon le mécanisme des [hooks](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension) :

```php
<?php

/**
 * @brief Appelé à chaque passage du cron de Drupal : dépose les travaux dus.
 */
function exemple_cron() {
  // \Drupal::queue(...) rend l'objet file nommé « exemple_recalcul »
  $file = \Drupal::queue('exemple_recalcul');
  // trois fiches à recalculer (liste inventée pour l'exemple)
  foreach ([7, 8, 9] as $id) {
    // createItem() dépose les données ; le worker les recevra dans $data
    $file->createItem(['fiche_id' => $id]);
  }
}
```

On retrouve les trois idées du chapitre : un squelette fourni (`QueueWorkerBase` joue le rôle de notre classe `Worker`, la méthode appelée par le squelette étant `processItem`), un verrou à expiration (le `30.0` de `acquire` est une durée en secondes), et un réessai par exception. La différence tient à l'infrastructure : Drupal décide, par ses plugins et son cron, de **qui** appelle le worker, quand notre essai le décidait dans `lancer_worker.py`.

## Questions fréquentes

| Question | Réponse |
|---|---|
| Pourquoi pas un simple `cron` qui lance le travail ? | `cron` lance un programme à heures fixes, mais ne reprend pas un échec, ne répartit pas une pointe entre plusieurs workers et ne sait pas réagir à une requête du visiteur |
| Quand passer à un vrai gestionnaire de files ? | Quand les workers sont sur plusieurs machines, que le débit dépasse ce qu'une base unique encaisse en écriture, ou qu'il faut des fonctions prêtes (priorités, délais, surveillance) : voir le tableau des outils en début de chapitre |
| Comment surveiller la file ? | Compter les tâches `en_attente` et `morte`, et mesurer l'ancienneté de la plus vieille tâche en attente : si elle grandit, les workers sont en panne ou trop lents |
| Que faire d'une tâche morte ? | La lire, corriger la cause (donnée ou bug), puis la remettre en file : `UPDATE taches SET etat = 'en_attente', essais = 0 WHERE id = 1` ; ou la supprimer si elle n'a plus d'intérêt |

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| Lire une tâche puis la marquer en deux requêtes | Deux workers prennent la même tâche | Une seule requête atomique qui choisit et marque |
| Oublier d'acquitter | La tâche revient et est refaite à l'infini | Acquitter après le succès, dans le squelette |
| Acquitter **avant** de traiter | Un plantage perd la tâche | Acquitter après le travail, et rendre le travail idempotent |
| Traitement non idempotent | Un second passage double l'effet (deux courriels, deux débits) | Écrire en « remplace » plutôt qu'en « ajoute », noter ce qui est déjà fait |
| Verrou sans expiration | Un plantage bloque la fiche pour toujours | `expire_a` sur chaque verrou |
| Expiration plus courte que le travail | Deux workers entrent ensemble | Durée supérieure au pire cas, ou renouvellement |
| Libérer un verrou qu'on ne possède plus | On supprime le verrou d'un autre worker | Supprimer seulement si `proprietaire` est soi-même |
| Verrou posé hors du squelette | Un worker oublie de le poser | Le mettre dans la classe de base, avec `finally` |
| Réessayer sans limite | Une tâche empoisonnée tourne en boucle | `MAX_ESSAIS` et état `morte` |
| Réessayer sans attente | On martèle le service déjà en panne | Attente exponentielle, avec gigue |
| Tâches mortes jamais regardées | Un défaut durable passe inaperçu | Compter les mortes, alerter |
| Planificateur qui fait le travail lui-même | Il déborde sur le passage suivant | Il dépose seulement ; avancer l'échéance avant de déposer |
| Deux passages du planificateur simultanés | Tâche déposée en double | `UPDATE` conditionnel et test de `rowcount` |
| Worker sans gestion de `SIGTERM` | Un arrêt coupe une tâche en plein travail | Finir le tour en cours, puis sortir |
| Aucun superviseur | Un worker arrêté, la file grossit en silence | `systemd` ou `supervisord`, plus une alerte sur la taille de la file |
| Tout mettre en file | Complexité inutile pour un travail de quelques millisecondes | Réserver la file aux travaux lents, fragiles ou en pointe |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Une opération atomique pour prendre une tâche | Aucun doublon entre workers |
| Acquitter seulement après le succès | Aucune tâche perdue ; l'idempotence absorbe les rejeux |
| Concevoir chaque traitement idempotent | La livraison « au moins une fois » devient sans danger |
| Squelette dans une classe de base, travail dans la classe fille | La logique de file, de verrou et de réessai n'existe qu'à un endroit |
| Verrou à expiration, libéré dans un `finally`, sur la clé la plus fine possible (la fiche, pas toute la table) | Pas de blocage durable, un maximum de parallélisme |
| Attente exponentielle, nombre d'essais borné, file des morts surveillée | Les pannes passagères se résorbent, les défauts durables se voient |
| Un seul `cron` qui lance le planificateur, le calendrier en base | Ajouter une tâche récurrente ne demande pas d'accès serveur |
| Worker qui s'arrête proprement sur `SIGTERM`, superviseur qui le relance | Déploiements et redémarrages sans tâche coupée |
| Surveiller la longueur de la file et l'ancienneté de sa plus vieille tâche | Un worker en panne se voit avant les utilisateurs |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une **file d'attente** sépare celui qui **dépose** une tâche (producteur) de celui qui l'**exécute** (worker) : la requête répond vite, les pointes s'écoulent, un échec se rejoue. Prendre une tâche doit être **atomique** (une requête qui choisit et marque), et l'**acquittement** n'a lieu qu'après le succès : la file garantit « au moins une fois », donc le traitement doit être **idempotent**. Le **planificateur applicatif** est un `cron` unique qui lit une table et dépose les tâches dues en avançant l'échéance d'abord. La **méthode modèle** place la boucle (prendre, verrouiller, traiter, acquitter ou réessayer, libérer) dans une classe de base ; la classe fille n'écrit que `traiter`. Un **verrou applicatif** en table, sur une clé comme `fiche:7`, empêche deux workers de toucher la même entité ; son **expiration** évite le blocage après un plantage, mais doit dépasser la durée du travail. Une tâche qui échoue revient avec une **attente exponentielle** ; après `MAX_ESSAIS`, elle devient **morte**. Un **superviseur** (`systemd`, `supervisord`) relance les workers, qui s'arrêtent proprement sur `SIGTERM`. |
| **Pièges à éviter** | Lire puis marquer en deux requêtes ; oublier d'acquitter, ou acquitter avant de traiter ; traitement non idempotent ; verrou sans expiration, ou plus court que le travail ; libérer le verrou d'un autre ; verrou posé hors du squelette ; réessais sans limite ni attente ; tâches mortes ignorées ; planificateur qui travaille au lieu de déposer ; deux passages du planificateur sans garde ; worker qui ignore `SIGTERM` ; aucun superviseur ; mettre en file un travail trivial. |
| **Bonnes pratiques** | Prise atomique ; acquittement après succès ; idempotence systématique ; squelette en classe de base ; verrou à expiration libéré dans un `finally`, sur la clé la plus fine ; attente exponentielle, essais bornés, mortes surveillées ; un seul `cron` et un calendrier en base ; arrêt propre sur `SIGTERM` et superviseur ; surveiller la taille et l'ancienneté de la file. |
