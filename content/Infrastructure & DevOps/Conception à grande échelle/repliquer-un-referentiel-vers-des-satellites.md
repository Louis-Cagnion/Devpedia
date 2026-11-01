---
order: 7
---

# Répliquer un référentiel vers des satellites

Imaginez une chaîne de magasins : un catalogue central décrit chaque article (titre, prix), et chaque magasin tient sa propre copie pour répondre vite à ses clients, même si le siège est fermé. Chaque fois qu'un prix change au siège, les magasins doivent le savoir. Ce chapitre explique comment une application s'y prend pour **copier des données d'un endroit central vers plusieurs autres**, et surtout ce qui se passe quand une copie est injoignable. Il ne suppose que la notion de [requête HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (un message qu'un programme envoie à un autre à travers le réseau, qui répond par un code de statut) et celle de [base de données](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) (le logiciel qui range les données dans des tables).

Trois mots reviennent partout :

| Mot | Définition | Dans la chaîne de magasins |
|---|---|---|
| **Référentiel** | L'endroit qui fait foi : la source de vérité. Une donnée s'y crée et s'y modifie ; ailleurs, on ne fait que la copier. | Le catalogue du siège |
| **Satellite** | Une copie locale du référentiel, tenue par un autre programme ou un autre site, qui la lit sans jamais la contredire. | Le catalogue de chaque magasin |
| **Réplication applicative** | Copier les données **par le code de l'application** (elle envoie elle-même les changements), par opposition à la réplication de la base de données, où c'est le logiciel de base de données qui recopie ses tables. | Un employé qui téléphone aux magasins, au lieu d'un photocopieur automatique |

Un exemple courant : plusieurs sites web bâtis sur un même logiciel de gestion de contenu (un outil pour créer et mettre à jour un site sans coder, comme [Drupal](https://www.drupal.org/docs), un logiciel libre pour publier des sites) reçoivent chacun les fiches d'un site central. Rien dans ce chapitre n'en dépend : les exemples sont inventés et neutres.

## Pourquoi pas la réplication de la base de données ?

La [réplication de base de données](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#replicas-de-lecture) (les réplicas de lecture) recopie **toute** la base, à l'identique, vers une machine qui sert à lire. Elle est excellente quand la copie est un simple renfort de lecture. Elle ne convient pas dans les cas suivants, où l'on choisit la réplication applicative :

| Situation | Réplication de base | Réplication applicative |
|---|---|---|
| Le satellite ne veut qu'une partie des données (les articles, pas les comptes clients) | En général tout ou rien (certains moteurs filtrent par table, au prix d'une configuration lourde) | Le code n'envoie que ce qui est utile |
| Le satellite a sa propre structure (autres tables, autres colonnes, autres clés) | Impossible : les tables sont recopiées à l'identique | Le code traduit chaque fiche vers la structure du satellite |
| Le satellite ajoute ses propres données à côté de la copie | La copie est en lecture seule | Les données locales et la copie cohabitent |
| Les systèmes ne sont pas le même logiciel de base de données | Impossible | Un message HTTP passe partout |
| On veut appliquer une règle métier (une règle propre à l'activité, par exemple refuser un prix négatif) à l'arrivée | Aucune main sur la copie | Le satellite exécute son propre code |

Le prix à payer : tout ce que la base faisait toute seule (ordre des changements, reprise après panne) devient **votre** travail. Le reste du chapitre est la liste de ce travail.

## Le schéma d'ensemble

```text
                 +--------------------------+
                 |       RÉFÉRENTIEL        |
                 |  (source de vérité)      |
                 |  ART-1  Lampe LED  v2    |
                 |  ART-2  Chaise     v2    |
                 +------------+-------------+
                              |
        un message par changement : identifiant externe + version + données
              +---------------+---------------+
              |               |               |
              v               v               v
       +-------------+ +-------------+ +-------------+
       | SATELLITE A | | SATELLITE B | | SATELLITE C |
       | clé locale  | | clé locale  | | clé locale  |
       | ART-1 -> 1  | | ART-1 -> 100| | ART-1 -> 500|
       +-------------+ +-------------+ +-------------+
```

Le sens est unique : le référentiel envoie, les satellites reçoivent. Les trois copies portent la **même fiche** (`ART-1`) sous trois **clés locales** différentes (1, 100, 500) : c'est le sujet de la section sur l'identifiant externe.

## Trois façons de propager un changement

Quand une fiche change dans le référentiel, trois stratégies permettent d'informer les satellites. Quelques mots d'abord :

- La **cohérence** décrit à quel point les copies montrent la même chose au même instant. Elle est **immédiate** si, dès que le changement est confirmé, tous les satellites l'ont ; elle est **à terme** (*eventual consistency*) si les copies finissent par être identiques, après un délai.
- La **latence** est le temps qu'attend celui qui déclenche l'opération (ici l'utilisateur qui enregistre une fiche) avant d'avoir sa réponse.
- Une [file d'attente](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#files-d-attente-et-traitement-asynchrone) est une liste de tâches à faire, déposée par un programme et traitée plus tard par un autre (le *worker*).

```text
1. SYNCHRONE            2. FILE D'ATTENTE          3. TIRAGE PÉRIODIQUE
   (le référentiel         (le référentiel dépose     (chaque satellite demande
    appelle, attend)        un message, repart)        de lui-même)

 utilisateur               utilisateur                 utilisateur
     |                         |                           |
     v                         v                           v
 référentiel               référentiel                 référentiel
   |   |   |                   |                           ^
   v   v   v                   v                           | « quoi de neuf
   A   B   C                 [ file ]                      |  depuis la v. 41 ? »
 (un par un,                   |  |  |                   A   B   C
  réponse attendue)            v  v  v                 (à intervalle régulier)
                               A  B  C
                           (worker, plus tard)
```

| | Propagation synchrone | File d'attente | Tirage périodique (*pull*) |
|---|---|---|---|
| **Qui prend l'initiative** | Le référentiel, pendant la requête | Le référentiel dépose, un worker livre | Chaque satellite, à son rythme |
| **Cohérence** | Immédiate si tous répondent ; un écart dès qu'un envoi échoue | À terme : quelques secondes | À terme : l'intervalle entre deux tirages (minutes, heures) |
| **Latence pour l'utilisateur** | La **somme** des échanges avec les N satellites | Une seule écriture dans la file | Aucune (le satellite travaille de son côté) |
| **Panne d'un satellite** | La requête attend le délai maximal (*timeout* : le temps qu'on accepte d'attendre une réponse avant d'abandonner) ou échoue ; un écart apparaît | Le message reste dans la file jusqu'au retour du satellite | Rien n'est perdu : au retour, le satellite demande tout ce qu'il a manqué |
| **Ce qu'il faut ajouter** | Un carnet des envois échoués (voir plus bas) | Une infrastructure de file et un worker | Côté référentiel, un moyen de dire « ce qui a changé depuis telle version » |
| **Convient quand** | Peu de satellites, fiables, et on veut voir le changement tout de suite | Beaucoup de satellites, ou des pannes fréquentes | Satellites très nombreux ou souvent éteints (un satellite qui se réveille se rattrape) |

Le tirage demande que chaque changement porte un numéro qui ne fait que grandir (une **version**, ou un **curseur** : le dernier numéro déjà vu par le satellite). Le satellite demande « donne-moi tout ce qui a un numéro supérieur à 41 » et n'a plus besoin que le référentiel se souvienne de lui.

Ce chapitre prend la **propagation synchrone** comme fil rouge : c'est la plus simple à écrire, donc la plus répandue dans les premières versions d'une application, et celle qui montre le plus de pièges. Les deux autres s'obtiennent en déplaçant l'étape « envoyer au satellite » ailleurs : dans un worker pour la file, dans le satellite lui-même pour le tirage. Tout le reste (identifiant externe, idempotence, rejeu, réconciliation) s'applique à l'identique aux trois.

Le choix entre pousser tôt (écriture) et assembler tard (lecture) se retrouve dans [le fil d'actualité](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out), qui répond à un défi voisin : un changement à faire connaître à de nombreux destinataires. La vue d'ensemble de la section est dans [la conception à grande échelle](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=conception-a-grande-echelle).

## L'identifiant externe : retrouver la même fiche

Chaque base de données donne à ses lignes une **clé locale** (on parle aussi de clé primaire) : un numéro (ou un texte) unique qui désigne une seule ligne, distribué par la base elle-même quand la ligne est créée. Le satellite A numérote ses articles 1, 2, 3 ; le satellite B, qui a déjà d'autres données, commence à 100. La clé locale n'a donc aucun sens en dehors de sa base.

Pour que le satellite sache « cette fiche que je reçois, c'est celle que j'ai déjà », on lui envoie avec chaque fiche la clé que **le référentiel** lui a donnée, l'**identifiant externe**. Le satellite la range dans une colonne à part et l'utilise pour retrouver sa ligne.

| | Clé locale | Identifiant externe |
|---|---|---|
| **Qui la choisit** | Le satellite (sa base) | Le référentiel |
| **Valeur pour une même fiche** | Différente dans chaque satellite (1, 100, 500) | Identique partout (`ART-1`) |
| **Sert à** | Relier les tables du satellite entre elles | Retrouver, dans le satellite, la fiche venue du référentiel |
| **Peut-on la changer ?** | Oui, tant que le satellite reste cohérent | Non : c'est le fil qui relie les copies |
| **Quand l'utiliser** | Dans le code et les requêtes du satellite | Dans les messages entre référentiel et satellites |

Sans identifiant externe, le satellite ne peut que **créer** une nouvelle ligne à chaque message reçu. Voici ce que cela donne quand une réponse se perd. Le code ci-dessous simule un satellite naïf (écrit en [Python](/?c=langages&s=python&p=python), dont les termes sont expliqués ligne par ligne : une **classe** regroupe des données et des fonctions, voir [la programmation orientée objet en Python](/?c=langages&s=python&p=poo) ; une **exception** est une erreur que l'on peut intercepter, voir [la gestion des erreurs](/?c=langages&s=python&p=gestion-des-erreurs), qui couvre aussi `try` / `except`). Les constructions de base se trouvent dans les chapitres sur les [fonctions](/?c=langages&s=python&p=fonctions) (`def`, `return`), les [conditions](/?c=langages&s=python&p=conditions) (`if`, `elif`, `else`), les [boucles](/?c=langages&s=python&p=boucles) (`for`) et les [modules](/?c=langages&s=python&p=modules-et-environnements) (`import`).

```python
# classe qui joue un satellite SANS identifiant externe : il numérote lui-même
class SatelliteNaif:
    # __init__ prépare un objet neuf (self désigne l'objet en cours de création)
    def __init__(self):
        # liste des fiches reçues, dans l'ordre d'arrivée
        self.fiches = []
        # si True, la réponse « bien reçu » se perd en route : l'appelant ne la voit pas
        self.reponse_perdue = False

    # recevoir simule la réception d'une requête d'envoi
    def recevoir(self, titre):
        # chaque réception ajoute une fiche neuve, sans chercher si elle existe déjà
        self.fiches.append(titre)
        # la fiche est enregistrée, mais l'appelant n'obtient que l'erreur
        if self.reponse_perdue:
            # raise déclenche l'exception : l'appelant la reçoit à la place d'un résultat
            raise TimeoutError("pas de réponse avant le délai maximal")


# crée un satellite sans identifiant externe
satellite = SatelliteNaif()
# la réponse va se perdre : l'envoi semblera avoir échoué
satellite.reponse_perdue = True
# essai 1 : le référentiel envoie la fiche
try:
    satellite.recevoir("Lampe de bureau")
# TimeoutError est levée quand la réponse n'arrive pas à temps
except TimeoutError as erreur:
    # le référentiel ne sait pas si la fiche est arrivée : il réessaie
    print("essai 1 :", erreur)
# la réponse se perdra encore, pour montrer le deuxième envoi
try:
    # essai 2 : même fiche, renvoyée par prudence
    satellite.recevoir("Lampe de bureau")
# même erreur que l'essai 1
except TimeoutError as erreur:
    # affiche le deuxième échec apparent
    print("essai 2 :", erreur)
# nombre de fiches réellement présentes dans le satellite
print("fiches dans le satellite :", len(satellite.fiches))
```

Sortie obtenue :

```text
essai 1 : pas de réponse avant le délai maximal
essai 2 : pas de réponse avant le délai maximal
fiches dans le satellite : 2
```

Le référentiel a **deux** fois reçu une erreur, donc il a renvoyé la fiche. Mais la première réception avait réussi, seule la réponse s'était perdue : le satellite contient maintenant deux fois « Lampe de bureau ». Un envoi qui échoue **ne dit pas** si le satellite l'a appliqué : un délai dépassé (*timeout*) est ambigu.

## L'idempotence : rendre l'envoi rejouable sans danger

Une opération est **idempotente** quand la faire plusieurs fois donne le même résultat que la faire une fois. Mettre l'interrupteur sur « allumé » est idempotent (le répéter ne change rien) ; « inverser l'interrupteur » ne l'est pas. Le même principe, avec d'autres exemples, est décrit dans [la robustesse d'un traitement par lots](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots), dans [les migrations de données sûres](/?c=donnees&s=bases-de-donnees&p=migrations-de-donnees-sures) et, pour un identifiant d'événement déjà traité, dans [la sécurité des webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks).

Pour rendre l'envoi idempotent, le satellite a besoin de **deux** choses dans le message :

| Élément du message | Rôle | Sans lui |
|---|---|---|
| L'identifiant externe | Dire **quelle** fiche | Un doublon à chaque rejeu |
| La version (ou la date de modification) | Dire **quel état** de la fiche | Un message ancien, arrivé en retard, écrase un état plus récent |

La règle du satellite tient en trois lignes :

| Cas à la réception | Action |
|---|---|
| Identifiant externe inconnu | Créer la fiche (nouvelle clé locale) |
| Identifiant connu, version reçue **plus récente** | Remplacer la fiche |
| Identifiant connu, version reçue **égale ou plus ancienne** | Ne rien faire, mais **répondre « succès »** |

La dernière ligne est essentielle : un message ignoré n'est pas une erreur. Si le satellite répondait « erreur » à un doublon, le référentiel le renverrait sans fin.

En HTTP, la forme naturelle est une requête `PUT` (« remplace la ressource qui est à cette adresse »), dont le sens même est idempotent, alors qu'un `POST` (« ajoute une ressource ») crée un doublon à chaque répétition (voir [les méthodes HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)). L'identifiant externe se place dans l'adresse, la version dans le corps de la requête (les données jointes à celle-ci) au format [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) (un texte structuré en paires nom-valeur) :

```text
PUT /api/fiches/ART-1 HTTP/1.1
Host: satellite-b.exemple.test
Content-Type: application/json

{"id_externe": "ART-1", "titre": "Lampe LED", "prix": 12, "version": 2}
```

La première ligne donne la méthode, l'adresse et le protocole (`HTTP/1.1` : la version des règles d'échange) ; `Host` nomme la machine visée et `Content-Type` annonce le format du corps. Réponses possibles du satellite :

| Réponse | Sens pour le référentiel |
|---|---|
| `200` ou `201` | Reçu et traité (ou ignoré comme doublon) : retirer l'envoi du carnet |
| `4xx` (par exemple `422`, famille des erreurs imputées à l'appelant), sauf `408` (délai dépassé) et `429` (trop de requêtes), à réessayer plus tard comme un `5xx` | Le message est refusé car invalide : le renvoyer tel quel ne sert à rien, il faut le corriger ou alerter |
| `5xx` (famille des erreurs du serveur), ou aucune réponse avant le délai | Le satellite est en difficulté : réessayer plus tard |

## Quand un satellite est injoignable

Un satellite peut être éteint, surchargé, en maintenance, ou simplement derrière un réseau qui coupe. Trois mots décrivent ce qui suit :

| Mot | Sens | Comment on s'en occupe |
|---|---|---|
| **Écart** | La différence entre ce que possède le référentiel et ce que possède le satellite | On l'enregistre : le référentiel note, dans un **carnet**, quels identifiants le satellite n'a pas reçus |
| **Rejeu** | Renvoyer ce que le carnet contient, quand le satellite répond de nouveau | Une tâche planifiée (voir [cron](/?c=langages&s=bash&p=automatisation-cron)) ou un worker réessaie à intervalles réguliers |
| **Réconciliation** | Comparer **tout** le contenu du satellite à celui du référentiel, sans se fier au carnet, et corriger ce qui diffère | Une vérification complète, lancée à la main ou périodiquement |

Deux détails comptent beaucoup :

- Le rejeu renvoie la fiche **dans son état actuel**, pas le message d'origine. Si une fiche a changé trois fois pendant la panne, le satellite reçoit une seule fois la dernière version : inutile de lui faire rejouer l'historique.
- Le carnet peut se perdre (redémarrage d'un programme qui le gardait en mémoire, bogue, restauration d'une sauvegarde ancienne). Un satellite dont le carnet s'est perdu ne sera jamais rejoué. La réconciliation existe pour ce cas : c'est le filet de sécurité qui ne dépend de rien d'autre que de la comparaison des données.

| Mécanisme | Coût | Attrape | Rate |
|---|---|---|---|
| Rejeu du carnet | Faible (seulement les écarts notés) | Un satellite qui revient après une panne | Un envoi dont le référentiel n'a pas noté l'échec |
| Réconciliation | Élevé (lit tout, ou toutes les versions) | Tout écart, quelle qu'en soit l'origine | Rien, mais ne tourne qu'à intervalle |

On combine les deux : le rejeu rattrape vite le cas courant, la réconciliation (par exemple chaque nuit) rattrape le reste.

## Détecter la désynchronisation

Une désynchronisation silencieuse est la pire : tout fonctionne, mais un magasin affiche un prix périmé. Il faut des mesures simples, comparées régulièrement.

| Mesure | Comment | Détecte | Ne détecte pas |
|---|---|---|---|
| **Compteur** | Nombre de fiches du référentiel contre nombre de fiches du satellite | Une fiche manquante ou en trop | Une fiche modifiée mais présente dans les deux (même nombre, versions différentes) |
| **Empreinte** | Un résumé calculé sur les versions de toutes les fiches ; deux résumés différents signifient que le contenu diffère | Toute différence de version, même avec le même nombre de fiches | **Laquelle** diffère (il faut ensuite comparer fiche à fiche) |
| **Date de dernière mise à jour** | Chaque satellite note la date du dernier message reçu ; on alerte si elle est trop ancienne par rapport au référentiel | Un satellite qui ne reçoit plus rien | Un satellite qui reçoit mais se trompe |
| **Comparaison fiche à fiche** | Pour chaque identifiant, comparer la version des deux côtés | La liste exacte des écarts | Rien, mais c'est le plus coûteux |

Une **empreinte** (en anglais *hash*) est le résultat d'une fonction de hachage : un calcul qui transforme n'importe quel texte en un court résumé de taille fixe, tel que deux textes différents donnent, en pratique, deux résumés différents (voir [hachage et chiffrement](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#hachage-contre-chiffrement-une-confusion-frequente)). L'une de ces fonctions, SHA-256, est utilisée dans la simulation plus bas. Ici, on résume la liste des paires (identifiant, version). Le résumé du référentiel et celui du satellite se comparent en un coup d'œil, sans transférer les données.

Un détail à garder en tête : une empreinte calculée sur les **versions** voit qu'un satellite a une version périmée, mais pas qu'une fiche a été corrompue à version égale. Pour ce second risque, on calcule l'empreinte sur le **contenu** (titre, prix...) en plus de la version.

La stratégie qui marche : comparer les compteurs et les empreintes souvent (c'est peu coûteux), et ne lancer la comparaison fiche à fiche que si l'empreinte diffère.

## Les limites de l'envoi synchrone

Avec la propagation synchrone, la requête de l'utilisateur **dépend de N satellites** : elle ne se termine que quand les N ont répondu (ou qu'on a abandonné). Cela se paie de trois façons.

**1. La latence s'additionne.** Les envois se font un par un. Avec trois satellites qui répondent en 40, 90 et 60 ms, l'utilisateur attend 190 ms. Avec dix satellites à 100 ms chacun, il attend une seconde, juste pour enregistrer une fiche.

**2. Une panne coûte tout le délai maximal.** Un satellite éteint ne répond pas « non » tout de suite : il se tait, et le référentiel attend la fin du délai maximal (ici 3 secondes) avant d'abandonner. Chaque enregistrement pendant la panne coûte donc 3 secondes de plus à l'utilisateur.

**3. La disponibilité se multiplie.** La **disponibilité** est la part du temps où un système répond. Si l'enregistrement exige que tous les satellites répondent, la probabilité qu'il réussisse est le **produit** des disponibilités. Par exemple, avec des satellites disponibles 99 % du temps chacun (soit 0,99) et tombant en panne indépendamment les uns des autres :

| Nombre de satellites | Calcul | Probabilité que tous répondent |
|---|---|---|
| 1 | 0,99 | 99 % |
| 3 | 0,99 × 0,99 × 0,99 | environ 97 % |
| 10 | 0,99 puissance 10 | environ 90 % |
| 20 | 0,99 puissance 20 | environ 82 % |

Avec vingt satellites, près d'une écriture sur cinq tomberait sur au moins une panne. Deux remèdes, souvent combinés :

| Remède | Principe | Effet |
|---|---|---|
| Ne **pas** faire échouer la requête quand un satellite est muet | L'enregistrement réussit dans le référentiel ; l'échec va dans le carnet | La disponibilité de l'application ne dépend plus des satellites |
| Sortir l'envoi de la requête (file d'attente) | La requête dépose un message, un worker envoie en arrière-plan | La latence ne dépend plus du nombre de satellites |

La simulation ci-dessous applique le premier remède (l'écart est noté, la requête réussit) et en montre le coût (3 secondes d'attente) ; le second est le sujet de [la file d'attente](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#files-d-attente-et-traitement-asynchrone).

> **Piège :** croire qu'une propagation qui marche avec trois satellites en test tiendra avec trente en conditions réelles, face aux utilisateurs. La latence et la probabilité de panne croissent avec le nombre de satellites.

## Une simulation complète

Le programme ci-dessous met tout bout à bout : un référentiel et trois satellites, dont un tombe en panne. Il est en Python (voir [les dictionnaires et ensembles](/?c=langages&s=python&p=dictionnaires-et-ensembles) pour `{}` et `set()`). Le « réseau » est remplacé par un simple appel de fonction qui peut lever `ConnectionError` ; les durées sont **simulées** (des nombres ajoutés, jamais d'attente réelle), ce qui rend le résultat identique à chaque exécution.

### Le satellite

```python
# hashlib (bibliothèque standard : fournie avec Python, rien à installer)
# calcule des empreintes
import hashlib
# json transforme une structure Python en texte, pour calculer l'empreinte
import json

# durée perdue à attendre un satellite muet avant d'abandonner (en ms, simulée)
DELAI_MAX_MS = 3000


# une empreinte résume une table {identifiant: version} en 8 caractères
def empreinte(versions):
    # items() donne les paires (identifiant, version) ; sorted les range : même texte
    # json.dumps transforme cette liste en texte
    texte = json.dumps(sorted(versions.items()))
    # encode() convertit le texte en octets (des nombres de 0 à 255, la forme stockée) ;
    # sha256 en fait un résumé de 64 caractères hexadécimaux (chiffres et lettres a-f) ;
    # [:8] garde les 8 premiers
    return hashlib.sha256(texte.encode()).hexdigest()[:8]


# un satellite : une copie locale qui a ses propres clés
class Satellite:
    # premiere_cle : première clé locale libre (chaque satellite a son historique)
    def __init__(self, nom, premiere_cle, latence_ms):
        # nom lisible, pour les messages
        self.nom = nom
        # durée simulée d'un échange réussi
        self.latence_ms = latence_ms
        # True : le satellite ne répond plus
        self.en_panne = False
        # clé locale -> fiche (c'est la table du satellite)
        self.fiches = {}
        # identifiant externe -> clé locale (pour retrouver « la même fiche »)
        self.cle_par_id_externe = {}
        # prochaine clé locale à distribuer
        self.prochaine_cle = premiere_cle

    # reçoit un message du référentiel ; le recevoir deux fois change le résultat une fois
    def recevoir(self, message):
        # un satellite en panne ne répond pas : l'appelant reçoit une exception
        if self.en_panne:
            # f"..." insère la valeur de self.nom à la place de {self.nom}
            raise ConnectionError(f"{self.nom} injoignable")
        # l'identifiant externe est la clé du référentiel, jamais la clé locale
        id_externe = message["id_externe"]
        # get() renvoie la valeur de la clé, ou None (la valeur « rien ») si elle est absente
        # ici : la clé locale de la fiche si elle est déjà connue
        cle = self.cle_par_id_externe.get(id_externe)
        # fiche inconnue : on la crée sous une nouvelle clé locale
        if cle is None:
            # prend la prochaine clé locale libre
            cle = self.prochaine_cle
            # la clé suivante sera la suivante
            self.prochaine_cle += 1
            # mémorise la correspondance identifiant externe -> clé locale
            self.cle_par_id_externe[id_externe] = cle
        # fiche connue en version égale ou plus récente : rien à faire (idempotence)
        elif self.fiches[cle]["version"] >= message["version"]:
            # on répond « ignoré » : l'envoi est un succès, mais il ne change rien
            return "ignoré"
        # dict(message) fait une copie du message, rangée sous la clé locale
        self.fiches[cle] = dict(message)
        # répond que le message a modifié le satellite
        return "appliqué"

    # identifiant externe -> version, vue d'ensemble de ce que le satellite possède
    def versions(self):
        # compréhension de dictionnaire : construit un dictionnaire en une ligne en
        # parcourant une collection, ici une entrée par fiche (values() liste les fiches)
        return {f["id_externe"]: f["version"] for f in self.fiches.values()}
```

### Le référentiel

```python
# le référentiel : la source de vérité, qui propage chaque changement
class Referentiel:
    # satellites : la liste des copies à tenir à jour
    def __init__(self, satellites):
        # identifiant -> fiche (titre, prix, version)
        self.fiches = {}
        # les satellites à alimenter
        self.satellites = satellites
        # le carnet : par satellite, un set (ensemble sans doublon) d'identifiants non reçus
        self.a_rejouer = {s.nom: set() for s in satellites}

    # crée ou modifie une fiche, puis la propage ; renvoie la durée totale simulée
    def enregistrer(self, id_externe, titre, prix):
        # version précédente de la fiche (None si elle est nouvelle)
        ancienne = self.fiches.get(id_externe)
        # la version augmente de 1 à chaque modification (1 pour une fiche neuve)
        version = 1 if ancienne is None else ancienne["version"] + 1
        # écrit la fiche dans le référentiel, avec son identifiant et sa version
        self.fiches[id_externe] = {
            # l'identifiant externe voyage avec la fiche
            "id_externe": id_externe,
            # les données de la fiche : un titre et un prix
            "titre": titre,
            "prix": prix,
            # la version permet de comparer deux états de la même fiche
            "version": version,
        }
        # propage de façon synchrone : un satellite après l'autre, réponse attendue ;
        # sum additionne les durées renvoyées (une par satellite, calculée à la demande)
        return sum(self.envoyer(s, id_externe) for s in self.satellites)

    # envoie la version ACTUELLE d'une fiche à un satellite ; renvoie la durée simulée
    def envoyer(self, satellite, id_externe):
        # try / except : tente l'envoi et intercepte l'erreur de connexion
        try:
            satellite.recevoir(self.fiches[id_externe])
        # satellite muet : on note l'écart dans le carnet
        except ConnectionError:
            self.a_rejouer[satellite.nom].add(id_externe)
            # et on a perdu tout le délai d'attente
            return DELAI_MAX_MS
        # envoi réussi : discard retire l'identifiant du carnet (sans erreur s'il n'y est pas)
        self.a_rejouer[satellite.nom].discard(id_externe)
        # durée de l'échange réussi
        return satellite.latence_ms

    # rejeu : renvoie tout ce qui est noté dans le carnet
    def rejouer(self):
        # pour chaque satellite...
        for satellite in self.satellites:
            # sorted crée une copie figée, car envoyer() modifie l'ensemble pendant la boucle
            for id_externe in sorted(self.a_rejouer[satellite.nom]):
                # ...renvoie chaque fiche notée
                self.envoyer(satellite, id_externe)

    # réconciliation : compare tout, sans se fier au carnet
    def reconcilier(self, satellite):
        # versions que le satellite possède réellement
        possedees = satellite.versions()
        # fiches absentes ou périmées côté satellite (compréhension de liste : construit
        # une liste en une ligne) ; items() donne les paires (identifiant, fiche),
        # get() la version possédée (None si absente)
        ecarts = [
            id_externe for id_externe, fiche in self.fiches.items()
            if possedees.get(id_externe) != fiche["version"]
        ]
        # renvoie chacune de ces fiches
        for id_externe in ecarts:
            self.envoyer(satellite, id_externe)
        # liste des fiches corrigées
        return ecarts

    # empreinte de ce que le référentiel possède
    def empreinte(self):
        # même calcul que pour un satellite, sur les versions du référentiel
        return empreinte({i: f["version"] for i, f in self.fiches.items()})


# affiche le compteur et l'empreinte du référentiel puis de chaque satellite
def etat(referentiel):
    # empreinte de référence, calculée une fois
    reference = referentiel.empreinte()
    # ligne du référentiel
    print(f"  référentiel : {len(referentiel.fiches)} fiches, empreinte {reference}")
    # une ligne par satellite, avec le verdict de la comparaison
    for s in referentiel.satellites:
        # empreinte de ce que ce satellite possède
        e = empreinte(s.versions())
        # « ok » si elle est identique à la référence, « ÉCART » sinon
        verdict = "ok" if e == reference else "ÉCART"
        # {s.nom:<10} complète le nom par des espaces jusqu'à 10 caractères
        print(f"  {s.nom:<10}: {len(s.fiches)} fiches, empreinte {e}  {verdict}")
```

### Le scénario

```python
# trois satellites, aux historiques locaux différents (clés de départ 1, 100, 500)
sat_a = Satellite("A", 1, 40)
# B répond en 90 ms et numérote à partir de 100
sat_b = Satellite("B", 100, 90)
# C répond en 60 ms et numérote à partir de 500
sat_c = Satellite("C", 500, 60)
# le référentiel qui les alimente
ref = Referentiel([sat_a, sat_b, sat_c])

# --- 1. fonctionnement normal ---
print("1. trois fiches créées, tout le monde répond")
# enumerate numérote les titres à partir de 1 : (1, "Lampe"), (2, "Chaise"), ...
for i, titre in enumerate(["Lampe", "Chaise", "Bureau"], start=1):
    # crée la fiche ART-1, ART-2, ART-3 ; duree garde la dernière durée
    duree = ref.enregistrer(f"ART-{i}", titre, 10 * i)
print(f"  durée de la requête de l'utilisateur : {duree} ms (40 + 90 + 60)")
# affiche les compteurs et les empreintes
etat(ref)
# la même fiche porte trois clés locales différentes
print("  clé locale de ART-1 :",
      {s.nom: s.cle_par_id_externe["ART-1"] for s in ref.satellites})

# --- 2. idempotence : le même message envoyé deux fois ---
print("2. même message envoyé deux fois à un satellite d'essai, hors du référentiel")
# satellite d'essai, vide
essai = Satellite("essai", 900, 10)
# premier envoi de la version 1 de ART-1
premier = essai.recevoir(ref.fiches["ART-1"])
# second envoi, identique, comme après une réponse perdue
second = essai.recevoir(ref.fiches["ART-1"])
print(" ", premier, "puis", second, "; fiches dans l'essai :", len(essai.fiches))

# --- 3. B tombe en panne pendant deux changements ---
print("3. B en panne ; ART-2 modifié, ART-4 créé")
# B ne répond plus
sat_b.en_panne = True
# modification d'une fiche existante
d1 = ref.enregistrer("ART-2", "Chaise", 25)
# création d'une nouvelle fiche
d2 = ref.enregistrer("ART-4", "Étagère", 40)
print(f"  durées : {d1} ms et {d2} ms (40 + 3000 + 60 pour chacune)")
print("  à rejouer :", {nom: sorted(ids) for nom, ids in ref.a_rejouer.items() if ids})
# affiche les compteurs et les empreintes
etat(ref)

# --- 4. B revient : rejeu ---
print("4. B revient, rejeu du carnet")
# B répond de nouveau
sat_b.en_panne = False
# renvoie ce que le carnet contient
ref.rejouer()
# affiche les compteurs et les empreintes
etat(ref)

# --- 5. C tombe, puis le carnet est perdu : réconciliation ---
print("5. C en panne pendant un changement, puis le référentiel perd son carnet")
# C ne répond plus pendant la modification d'ART-1
sat_c.en_panne = True
ref.enregistrer("ART-1", "Lampe LED", 12)
# redémarrage du référentiel : le carnet, gardé en mémoire, est vidé
ref.a_rejouer = {s.nom: set() for s in ref.satellites}
# C revient
sat_c.en_panne = False
# le rejeu ne trouve rien à renvoyer
ref.rejouer()
print("  après rejeu (carnet vide) :")
# affiche les compteurs et les empreintes
etat(ref)
# la réconciliation compare les versions fiche par fiche et renvoie les écarts
print("  réconciliation de C :", ref.reconcilier(sat_c))
# affiche les compteurs et les empreintes
etat(ref)
```

Sortie obtenue en exécutant ce programme (Python 3 doit être installé, voir [Python](/?c=langages&s=python&p=python) ; les trois blocs ci-dessus, du satellite au scénario, se collent dans l'ordre dans un seul fichier `simulation.py`, puis `python3 simulation.py` dans un terminal) :

```text
1. trois fiches créées, tout le monde répond
  durée de la requête de l'utilisateur : 190 ms (40 + 90 + 60)
  référentiel : 3 fiches, empreinte 20791267
  A         : 3 fiches, empreinte 20791267  ok
  B         : 3 fiches, empreinte 20791267  ok
  C         : 3 fiches, empreinte 20791267  ok
  clé locale de ART-1 : {'A': 1, 'B': 100, 'C': 500}
2. même message envoyé deux fois à un satellite d'essai, hors du référentiel
  appliqué puis ignoré ; fiches dans l'essai : 1
3. B en panne ; ART-2 modifié, ART-4 créé
  durées : 3100 ms et 3100 ms (40 + 3000 + 60 pour chacune)
  à rejouer : {'B': ['ART-2', 'ART-4']}
  référentiel : 4 fiches, empreinte 90b23cec
  A         : 4 fiches, empreinte 90b23cec  ok
  B         : 3 fiches, empreinte 20791267  ÉCART
  C         : 4 fiches, empreinte 90b23cec  ok
4. B revient, rejeu du carnet
  référentiel : 4 fiches, empreinte 90b23cec
  A         : 4 fiches, empreinte 90b23cec  ok
  B         : 4 fiches, empreinte 90b23cec  ok
  C         : 4 fiches, empreinte 90b23cec  ok
5. C en panne pendant un changement, puis le référentiel perd son carnet
  après rejeu (carnet vide) :
  référentiel : 4 fiches, empreinte 8b61e9c0
  A         : 4 fiches, empreinte 8b61e9c0  ok
  B         : 4 fiches, empreinte 8b61e9c0  ok
  C         : 4 fiches, empreinte 90b23cec  ÉCART
  réconciliation de C : ['ART-1']
  référentiel : 4 fiches, empreinte 8b61e9c0
  A         : 4 fiches, empreinte 8b61e9c0  ok
  B         : 4 fiches, empreinte 8b61e9c0  ok
  C         : 4 fiches, empreinte 8b61e9c0  ok
```

### Lire la sortie

| Étape | Ce que l'on observe | Ce qu'il faut comprendre |
|---|---|---|
| 1 | La requête dure 190 ms ; ART-1 porte les clés locales 1, 100 et 500 | La latence est la somme (40 + 90 + 60) ; la clé locale diffère, l'identifiant externe `ART-1` relie les copies |
| 2 | « appliqué puis ignoré », une seule fiche dans le satellite d'essai | Le même message reçu deux fois ne crée pas de doublon (idempotence) |
| 3 | Chaque requête dure 3100 ms ; B affiche ÉCART ; le carnet contient ART-2 et ART-4 | La panne de B coûte 3000 ms à chaque enregistrement ; le compteur de B (3) est inférieur à celui des autres (4) |
| 4 | Après le rejeu, les quatre empreintes sont identiques | Le carnet a suffi à rattraper B |
| 5 | Le compteur de C vaut 4 comme les autres, mais son empreinte diffère ; le rejeu n'y change rien ; la réconciliation renvoie `ART-1` | Le compteur ne voit pas une fiche périmée ; l'empreinte la voit ; la réconciliation répare même quand le carnet est perdu |

## Les pièges

| Piège | Conséquence | Correction |
|---|---|---|
| Se servir de la clé locale du référentiel comme identifiant dans les satellites | Les clés collisionnent avec celles que le satellite a déjà distribuées | Un identifiant externe distinct, stocké dans une colonne dédiée du satellite |
| Pas d'identifiant externe : créer à chaque message | Doublons à chaque rejeu | Chercher la fiche par identifiant externe avant de créer |
| Pas de version : appliquer tout message reçu | Un message ancien, arrivé en retard, écrase un état plus récent | Ignorer toute version inférieure ou égale à celle déjà possédée |
| Répondre « erreur » à un doublon | Le référentiel renvoie sans fin | Répondre « succès » et ne rien changer |
| Faire échouer l'enregistrement quand un satellite est muet | La disponibilité de l'application dépend de la plus faible des copies | Enregistrer dans le référentiel, noter l'écart, rejouer plus tard |
| Carnet des échecs gardé seulement en mémoire | Un redémarrage efface la liste ; le satellite ne sera jamais rattrapé | Écrire le carnet dans une table du référentiel, et réconcilier périodiquement |
| Rejouer le message d'origine | Plusieurs messages à appliquer dans l'ordre, ou un message périmé | Renvoyer l'état actuel de la fiche |
| Ne pas propager la suppression | Une fiche supprimée au référentiel reste visible dans les satellites | Envoyer un message « supprimé » (ou garder une marque de suppression : une colonne `supprime = vrai` au lieu d'effacer la ligne) et traiter, à la réconciliation, les fiches du satellite absentes du référentiel (la simulation ne gère pas ce cas) |
| Se fier au seul compteur | Une fiche périmée passe inaperçue | Y ajouter une empreinte des versions |
| Une empreinte qui ne voit que les versions | Une fiche corrompue à version égale passe inaperçue | Inclure le contenu dans le calcul de l'empreinte |
| Délai d'attente absent ou énorme | Un satellite muet fige la requête de l'utilisateur | Un délai maximal court, fixé pour chaque appel |
| Réessayer immédiatement et sans fin | Un satellite déjà surchargé reçoit encore plus de requêtes | Espacer les nouvelles tentatives, en allongeant l'attente à chaque échec |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Un identifiant externe et une version dans **chaque** message | Le satellite sait quelle fiche et quel état, donc l'envoi se rejoue sans danger |
| Des envois idempotents, toujours acquittés (confirmés) par un succès | Un délai dépassé est ambigu : seul le renvoi lève le doute |
| Noter chaque échec dans un carnet **durable** (une table) | Aucun satellite n'est oublié après un redémarrage |
| Rejouer l'état actuel de la fiche, pas le message d'origine | Un seul envoi suffit, même après plusieurs changements |
| Réconcilier périodiquement | Le filet de sécurité qui rattrape tout ce que le carnet a manqué |
| Comparer compteurs et empreintes, alerter sur l'écart | Détecter la désynchronisation avant qu'un utilisateur la voie |
| Un délai maximal court sur chaque appel au satellite | Une panne ne fige plus la requête de l'utilisateur |
| Sortir l'envoi de la requête (file d'attente) dès que N grandit | La latence et la disponibilité ne dépendent plus du nombre de satellites |
| Garder le sens unique : le référentiel envoie, les satellites reçoivent | Une modification locale d'un satellite serait écrasée au prochain envoi |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un **référentiel** (source de vérité) envoie ses changements à des **satellites** (copies locales) par le code de l'application : c'est la **réplication applicative**, par opposition à la réplication de la base de données. Trois stratégies : propagation synchrone (la requête attend les N satellites), file d'attente (un worker livre plus tard), tirage périodique (le satellite demande ce qu'il a manqué). Chaque message porte un **identifiant externe** (la clé du référentiel, distincte de la clé locale du satellite) et une **version**, pour que l'envoi soit **idempotent** : le recevoir deux fois ne change rien de plus. Un satellite injoignable crée un **écart**, noté dans un **carnet** pour un **rejeu** ; la **réconciliation** compare tout et rattrape ce que le carnet a manqué. On détecte la désynchronisation par compteurs, empreinte des versions et date de dernière mise à jour. L'envoi synchrone additionne les latences et multiplie les risques de panne. |
| **Pièges à éviter** | Réutiliser la clé locale comme identifiant ; créer à chaque message ; ne pas versionner ; répondre « erreur » à un doublon ; faire échouer l'enregistrement quand un satellite est muet ; carnet gardé en mémoire ; rejouer l'ancien message plutôt que l'état actuel ; oublier les suppressions ; se fier au seul compteur ; délai d'attente absent ; réessais sans pause. |
| **Bonnes pratiques** | Identifiant externe et version dans chaque message ; envois idempotents acquittés par un succès ; carnet durable ; rejeu de l'état actuel ; réconciliation périodique ; alertes sur compteur et empreinte ; délai maximal court ; file d'attente dès que le nombre de satellites grandit ; flux à sens unique. |
