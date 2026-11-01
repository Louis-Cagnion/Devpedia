---
order: 12
---

# Métadonnées de cache et invalidation (31/10/2026)

[Éviter le recalcul redondant](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) montre comment garder le résultat d'une fonction pour ne pas le recalculer. Ce chapitre traite l'étape suivante : un **cache partagé** par tous les visiteurs d'un site (les personnes qui consultent ses pages avec leur navigateur, le logiciel qui affiche les pages web, depuis un serveur, l'ordinateur qui les envoie), où la vraie difficulté n'est pas de garder une réponse mais de savoir **quand elle cesse d'être juste**. La réponse tient en trois informations, les **métadonnées de cache**, et en une manière de s'en servir, l'**invalidation**. Deux chapitres voisins prolongent le sujet côté page : [Chargement différé et espace réservé](/?c=qualite-performance-et-outils&s=performance&p=chargement-differe-et-espace-reserve) (ne pas bloquer une page sur un bloc lent ou propre à la personne) et [Redimensionner des images et servir du WebP](/?c=qualite-performance-et-outils&s=performance&p=redimensionner-des-images-et-servir-du-webp) (alléger les images, la part la plus lourde de nombreuses pages).

## Une entrée de cache et sa clé

Un **cache** est une réserve où l'on range le résultat d'un travail coûteux pour le resservir sans refaire le travail. Une **entrée** est une réponse rangée. Elle est retrouvée grâce à sa **clé**, un texte qui sert d'étiquette de rangement, comme le numéro d'un casier. Une lecture qui trouve l'entrée est une **réussite** (*cache hit*) ; une lecture qui ne la trouve pas est un **échec** (*cache miss*), et il faut alors **recalculer** la réponse, c'est-à-dire refaire le travail, avant de la ranger pour la prochaine fois. Le motif « chercher, sinon calculer et ranger » s'appelle le *cache-aside* ; il est décrit dans [Redis](/?c=donnees&s=bases-de-donnees&p=redis).

```text
visiteur ──> serveur ──> le cache a-t-il la clé « article:7|langue=fr » ?
                           │
              oui (réussite)│                non (échec)
                   ┌────────┘                    └────────┐
                   v                                      v
           renvoie l'entrée                     recalcule (lent), range,
           (rapide, gratuit)                    puis renvoie
```

Deux visiteurs qui demandent « la même page » reçoivent-ils vraiment la même réponse ? Pas toujours : la page peut changer avec la langue, avec l'utilisateur connecté, avec l'adresse demandée. Tout se joue donc dans trois questions, que les métadonnées de cache posent à chaque entrée.

## Les trois métadonnées

| Métadonnée | Question à laquelle elle répond | Rôle | Exemple | Équivalent HTTP |
|---|---|---|---|---|
| **Contexte** | Qu'est-ce qui fait varier la réponse ? | Entre dans la **clé** : une variante par valeur | `langue=fr`, `langue=en` ; `role=admin` | En-tête `Vary` (il liste les en-têtes de la requête qui font varier la réponse, comme la langue ; l'adresse demandée est déjà dans la clé) |
| **Étiquette** (*tag*) | De quelles données dépend la réponse ? | Permet d'**invalider** seulement les entrées concernées | `article:7`, `liste`, `config` | Aucun standard (certains CDN offrent un mécanisme propre à leur produit) |
| **Durée de vie** (*max-age*) | Pendant combien de temps la réponse reste-t-elle acceptable ? | Fixe l'instant où l'entrée est **périmée** d'elle-même | 3600 secondes ; 0 = périmée aussitôt (rien de réutilisable) | `Cache-Control: max-age=N` |

Le mot [**HTTP**](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) désigne le langage que parlent un navigateur et un serveur web pour échanger des pages ; ses règles de cache (les en-têtes `Vary` et `Cache-Control`, des lignes d'information jointes à chaque réponse) sont décrites dans la [norme RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) (un RFC est un document de normalisation d'Internet). Un **CDN** (réseau de serveurs qui gardent des copies de vos pages près des visiteurs) applique les mêmes règles : voir [CDN et diffusion adaptative](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative). Une **durée de vie** porte aussi le nom de **TTL** (*Time To Live*), expliqué dans [Redis](/?c=donnees&s=bases-de-donnees&p=redis).

Ces trois informations jouent des rôles très différents, d'où l'intérêt de ne pas les confondre :

| Si vous manquez... | Ce qui arrive | Gravité |
|---|---|---|
| Un **contexte** | Un visiteur reçoit la réponse prévue pour un autre (page en anglais pour un lecteur français, données d'un autre compte) | Réponse fausse pour le visiteur, parfois fuite de données |
| Une **étiquette** | Le contenu change mais l'entrée reste servie jusqu'à la fin de sa durée | Réponse périmée |
| Une **durée de vie** | L'entrée reste éternellement, ou disparaît trop vite pour servir | Réponse périmée ou cache inutile |

## Un cache à étiquettes, contextes et durée de vie

Le programme ci-dessous, en [Python](/?c=langages&s=python&p=python), construit ces trois métadonnées pour de bon. Les mesures de ce chapitre viennent de son exécution (exécution du 31/10/2026). Trois notions Python y servent : une **classe** est un moule qui regroupe des données et les fonctions qui les manipulent (voir [la programmation orientée objet](/?c=langages&s=python&p=poo)), `self` y désigne l'objet en cours, et un **ensemble** (`set`) est une collection sans doublon (voir [les dictionnaires et les ensembles](/?c=langages&s=python&p=dictionnaires-et-ensembles)). Une chaîne qui commence par `f"` insère les valeurs entre accolades dans le texte. L'**horloge** est simulée : le programme additionne des secondes au lieu d'attendre. `heure` est un dictionnaire plutôt qu'une simple variable : une fonction peut modifier le contenu d'un dictionnaire, mais pas remplacer la valeur d'une variable définie hors d'elle sans instruction spéciale. Parcourir un dictionnaire avec `for k in d` donne ses clés, `d.items()` donne ses paires (clé, valeur) que `c, e` reçoivent une à une, et `[x for ... if ...]` construit une liste des seuls éléments retenus. Le module `threading` (tâches menées en même temps, voir [le parallélisme](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) ne sert qu'à la section sur la ruée.

```python
import random                                  # tirages au hasard, pour simuler des visites
import threading                               # tâches simultanées, pour la ruée (plus bas)
import time                                    # pause de 50 ms qui simule un calcul lent


heure = {"t": 0.0}                             # horloge simulée, en secondes


def maintenant():                              # donne l'heure simulée
    return heure["t"]                          # on évite d'attendre pour de vrai


class Cache:                                   # un cache à étiquettes et durée de vie
    def __init__(self):                        # appelé à la création d'un cache
        self.entrees = {}                      # clé -> entrée gardée
        self.reussites = 0                     # lectures qui ont trouvé une entrée valide
        self.echecs = 0                        # lectures qui n'ont rien trouvé d'utilisable
        self.calculs = 0                       # recalculs effectués
        self.temps_calcul = 0.0                # secondes de travail simulé dépensées

    def cle(self, nom, contexte):              # fabrique la clé d'une entrée
        valeurs = [f"{k}={contexte[k]}" for k in sorted(contexte)]  # sorted : ordre fixe
        return "|".join([nom] + valeurs)       # ex. "article:7|langue=fr"

    def lire(self, nom, contexte):             # cherche une entrée encore valable
        entree = self.entrees.get(self.cle(nom, contexte))  # None si la clé est absente
        if entree is None or entree["expire_a"] <= maintenant():  # absente ou périmée
            self.echecs += 1                   # on compte un échec
            return None                        # rien d'utilisable
        self.reussites += 1                    # on compte une réussite
        return entree["valeur"]                # la réponse gardée

    def ecrire(self, nom, contexte, valeur, etiquettes, duree):  # garde une réponse
        self.entrees[self.cle(nom, contexte)] = {  # la clé distingue chaque variante
            "valeur": valeur,                  # la réponse
            "etiquettes": set(etiquettes),     # ce dont elle dépend
            "expire_a": maintenant() + duree,  # instant de péremption
        }

    def servir(self, nom, contexte, etiquettes, duree, cout=0.05):  # lire ou recalculer
        valeur = self.lire(nom, contexte)      # d'abord le cache
        if valeur is None:                     # échec : il faut recalculer
            self.calculs += 1                  # un recalcul de plus
            self.temps_calcul += cout          # il coûte du travail
            valeur = f"réponse de {nom}"       # le résultat du calcul (simulé)
            self.ecrire(nom, contexte, valeur, etiquettes, duree)  # on le garde
        return valeur                          # dans les deux cas, on le rend

    def invalider(self, etiquettes):           # supprime les entrées qui portent l'étiquette
        visees = set(etiquettes)               # ensemble : collection sans doublon
        # & garde les éléments communs aux deux ensembles : l'entrée est touchée
        # c, e : la clé et l'entrée de chaque paire donnée par .items()
        mortes = [c for c, e in self.entrees.items() if e["etiquettes"] & visees]
        for c in mortes:                       # pour chaque entrée touchée
            del self.entrees[c]                # on la supprime
        return len(mortes)                     # nombre d'entrées supprimées

    def purger(self):                          # vide tout le cache
        n = len(self.entrees)                  # combien d'entrées il y avait
        self.entrees.clear()                   # on supprime tout
        return n                               # nombre d'entrées supprimées
```

Chaque entrée garde donc **trois choses** en plus de sa valeur : ses étiquettes, son instant de péremption, et sa clé qui contient les contextes. `invalider` parcourt toutes les entrées pour trouver celles qui portent l'étiquette : c'est simple et suffisant ici, mais un cache réel tient plutôt un index « étiquette vers clés » pour ne pas tout parcourir à chaque écriture.

## Invalider par étiquette plutôt que tout purger

Une entrée peut cesser d'être juste de trois façons, et chacune appelle une réponse différente :

| Manière de retirer une entrée | Comment | Avantage | Inconvénient |
|---|---|---|---|
| **Expiration** (durée de vie) | L'entrée se périme seule après `max-age` | Aucune action à écrire | La réponse est fausse jusqu'à la péremption |
| **Invalidation ciblée** (par étiquette) | Une écriture supprime les entrées qui portent l'étiquette des données modifiées | Précise : seul le nécessaire est recalculé | Il faut avoir **étiqueté** correctement chaque entrée |
| **Purge totale** | On vide tout le cache | Facile, jamais de réponse périmée | Tout est recalculé d'un coup |

Expérience : un site de 20 articles en 2 langues, donc 40 pages d'article et 2 pages d'accueil (la liste des articles), soit 42 entrées. Après 2 000 visites pour remplir le cache (la chauffe), on modifie l'article 7, puis on observe 300 visites. L'accueil porte l'étiquette `liste` parce qu'il affiche les titres ; l'article 7 modifié touche donc 4 entrées (la page de l'article et l'accueil, dans les deux langues).

```python
LANGUES = ["fr", "en"]                         # le contexte « langue » a 2 valeurs
NB_ARTICLES = 20                               # le site a 20 articles


def requete(cache, hasard):                    # simule la visite d'un lecteur
    heure["t"] += 0.01                         # 100 visites par seconde
    langue = hasard.choice(LANGUES)            # la langue du lecteur
    n = hasard.randrange(NB_ARTICLES)          # entier de 0 à 19 : l'article demandé
    if hasard.random() < 0.3:                  # tirage entre 0 et 1 : 3 fois sur 10
        cache.servir("accueil", {"langue": langue}, {"liste"}, 3600)
    else:                                      # sinon : la page d'un article
        cache.servir(f"article:{n}", {"langue": langue}, {f"article:{n}"}, 3600)


def phase(cache, hasard, nombre):              # joue `nombre` visites et mesure
    r0, e0, c0 = cache.reussites, cache.echecs, cache.calculs  # 3 variables, 1 ligne
    for _ in range(nombre):                    # une visite à la fois
        requete(cache, hasard)                 # le lecteur arrive
    reussites = cache.reussites - r0           # réussites de cette phase seulement
    echecs = cache.echecs - e0                 # échecs de cette phase seulement
    taux = 100 * reussites / (reussites + echecs)  # pourcentage de réussite
    return taux, cache.calculs - c0            # taux et nombre de recalculs


def essai(strategie):                          # une expérience complète
    heure["t"] = 0.0                           # l'horloge repart de zéro
    cache, hasard = Cache(), random.Random(1)  # 2 variables, 1 ligne ; graine 1
    phase(cache, hasard, 2000)                 # chauffe : le cache se remplit
    taux, recalculs = phase(cache, hasard, 300)  # 300 visites sans modification
    print(f"{strategie:<22} sans modif. : {taux:5.1f} %  recalculs : {recalculs}")
    if strategie == "invalidation ciblée":     # on modifie l'article 7...
        supprimees = cache.invalider({"article:7", "liste"})  # ...et ses dépendants
    else:                                      # sinon : purge totale
        supprimees = cache.purger()            # on vide tout
    taux, recalculs = phase(cache, hasard, 300)  # 300 visites après la modification
    print(f"{'':<22} après modif. : {taux:5.1f} %  recalculs : {recalculs}"
          f"  (entrées supprimées : {supprimees})")


essai("invalidation ciblée")                   # lance les deux expériences
essai("purge totale")
```

Dans les `f"..."` de `print`, `:<22` aligne le texte à gauche sur 22 caractères et `:5.1f` écrit un nombre avec un chiffre après la virgule. Les tirages au hasard (`random.Random(1)`) partent d'une **graine** : avec la même graine, chaque exécution tire les mêmes nombres, donc les deux stratégies reçoivent exactement les mêmes visites.

Résultat obtenu :

```text
invalidation ciblée    sans modif. : 100.0 %  recalculs : 0
                       après modif. :  98.7 %  recalculs : 4  (entrées supprimées : 4)
purge totale           sans modif. : 100.0 %  recalculs : 0
                       après modif. :  86.3 %  recalculs : 41  (entrées supprimées : 42)
```

| | Invalidation ciblée | Purge totale |
|---|---|---|
| Entrées supprimées | 4 sur 42 | 42 sur 42 |
| Recalculs dans les 300 visites suivantes | 4 | 41 |
| Taux de réussite après la modification | 98,7 % | 86,3 % |

Le programme écrit les décimales avec un point à l'anglaise (`98.7`), le texte avec une virgule (98,7). La purge totale supprime plus de 10 fois plus d'entrées (42 contre 4) pour le même changement, et les 41 recalculs qui suivent se concentrent **au début** : 23 tombent dans les 50 premières visites et 33 dans les 100 premières (mesuré avec les mêmes visites) ; nous y revenons plus bas.

## Les métadonnées remontent : réunir et prendre le minimum

Une page est rarement une seule entrée : elle est faite de **morceaux** (un en-tête, une liste, un bloc « Bonjour Marie »). La page entière dépend de tout ce dont dépend chacun de ses morceaux. Les métadonnées d'un morceau **remontent** donc vers la page (on dit qu'elles se **propagent**, en anglais *bubbling*) selon trois règles :

| Métadonnée | Règle de fusion | Pourquoi |
|---|---|---|
| Contextes | **Réunion** de ceux de tous les morceaux | Si un morceau varie avec l'utilisateur, la page entière varie avec l'utilisateur |
| Étiquettes | **Réunion** de celles de tous les morceaux | La page doit être invalidée dès qu'une de ses données change |
| Durée de vie | **Minimum** des durées | La page est périmée dès que son morceau le plus fragile l'est |

```python
def fusionner(*enfants):                       # *enfants : autant de morceaux qu'on veut
    return {                                   # chaque morceau a ses propres métadonnées
        "contextes": set().union(*(e["contextes"] for e in enfants)),  # réunion des contextes
        "etiquettes": set().union(*(e["etiquettes"] for e in enfants)),  # idem
        "duree": min(e["duree"] for e in enfants),  # la durée la plus courte l'emporte
    }


def afficher(meta):                            # affiche : contextes | étiquettes | durée
    contextes = sorted(meta["contextes"])      # trie pour un affichage stable
    etiquettes = sorted(meta["etiquettes"])    # idem
    print(f"{contextes} | {etiquettes} | durée {meta['duree']}")  # colonnes séparées par |


entete = {"contextes": {"langue"}, "etiquettes": {"config"}, "duree": 3600}
liste = {"contextes": {"langue"}, "etiquettes": {"article:7", "liste"}, "duree": 600}
salut = {"contextes": {"utilisateur"}, "etiquettes": {"user:42"}, "duree": 3600}
affichage_heure = {"contextes": set(), "etiquettes": set(), "duree": 0}  # « heure exacte »

afficher(fusionner(entete, liste))             # page sans contexte par utilisateur
afficher(fusionner(entete, liste, salut))      # un bloc par utilisateur s'ajoute
afficher(fusionner(entete, liste, affichage_heure))    # un bloc de durée 0 s'ajoute
```

Dans `fusionner`, `set()` crée un ensemble vide et `.union(a, b, ...)` rend la réunion de plusieurs ensembles. L'expression `(e["contextes"] for e in enfants)` produit un ensemble par morceau, et le `*` devant elle les déballe en autant d'arguments séparés pour `union`.

Résultat obtenu :

```text
['langue'] | ['article:7', 'config', 'liste'] | durée 600
['langue', 'utilisateur'] | ['article:7', 'config', 'liste', 'user:42'] | durée 600
['langue'] | ['article:7', 'config', 'liste'] | durée 0
```

Chaque ligne donne les contextes, les étiquettes, puis la durée de la page fusionnée. Lisez les trois lignes de haut en bas. Un seul morceau qui varie selon l'utilisateur (`salut`) fait varier toute la page : elle ne sera plus partagée entre lecteurs. Un seul morceau de durée 0 (`affichage_heure`, qui affiche l'heure exacte) rend **toute la page** impossible à garder. C'est une fuite d'efficacité classique : un petit bloc dynamique ruine le cache d'une page de cent blocs.

> **Piège :** laisser un détail d'affichage (l'heure, un compteur de visiteurs) imposer une durée de 0 à une page entière. Isolez ce détail dans son propre morceau, chargé à part, pour que le reste de la page reste cachable.

## L'invalidation à chaque écriture : le piège

Une **écriture** est tout événement qui change des données : un commentaire posté, un article modifié, un produit ajouté au panier. Pour que le cache reste juste, chaque écriture invalide les entrées qui en dépendent. Tout dépend alors de **la largeur** de ce qu'elle invalide et de **la fréquence** des écritures.

Imaginons que chaque page d'article affiche un bloc « derniers commentaires ». Deux façons de l'étiqueter :

| Variante | Étiquettes de la page d'article | Ce qu'un commentaire invalide |
|---|---|---|
| **large** | `article:N` **et** `commentaires` sur la page entière | Toutes les pages d'article de toutes les langues |
| **fragment** | `article:N` sur la page ; `commentaires` sur le bloc, chargé à part (requête distincte) : il a sa propre entrée peu coûteuse et n'est pas fusionné dans celle de la page | Le bloc seulement |

Le programme mesure 1 000 visites (10 secondes simulées, 100 visites par seconde), avec une écriture toutes les `k` visites. La **charge** est le temps de calcul total divisé par les 10 secondes : à 100 %, le serveur passe tout son temps à recalculer ; au-delà de 100 %, il n'y arrive plus et les visiteurs attendent. Une page coûte 0,05 s à recalculer, un bloc de commentaires 0,005 s.

```python
def visite(cache, hasard, variante):           # une visite sur une page d'article
    heure["t"] += 0.01                         # 100 visites par seconde
    n = hasard.randrange(NB_ARTICLES)          # l'article demandé
    contexte = {"langue": hasard.choice(LANGUES)}  # la langue du lecteur
    if variante == "large":                    # la page dépend aussi des commentaires
        cache.servir(f"article:{n}", contexte, {f"article:{n}", "commentaires"}, 3600)
    else:                                      # « fragment » : bloc chargé à part
        cache.servir(f"article:{n}", contexte, {f"article:{n}"}, 3600)
        cache.servir("commentaires", contexte, {"commentaires"}, 3600, cout=0.005)


def charge(variante, ecriture_tous_les):       # 1000 visites, une écriture toutes les k
    heure["t"] = 0.0                           # l'horloge repart de zéro
    cache, hasard = Cache(), random.Random(2)  # graine 2 : tirages reproductibles
    for i in range(1, 1001):                   # 1000 visites = 10 secondes simulées
        visite(cache, hasard, variante)        # un lecteur arrive
        if ecriture_tous_les and i % ecriture_tous_les == 0:  # % : reste de la division
            cache.invalider({"commentaires"})  # il invalide l'étiquette « commentaires »
    taux = 100 * cache.reussites / (cache.reussites + cache.echecs)  # réussite globale
    return taux, cache.calculs, cache.temps_calcul / 10 * 100  # charge en % de 10 s


print(f"{'écriture':<12}{'variante':<10}{'réussite':>9}{'recalculs':>11}{'charge':>9}")
for k in (None, 100, 20, 5, 2):                # de « jamais » à « une visite sur deux »
    for variante in ("large", "fragment"):     # étiquette sur la page, ou sur un bloc
        taux, calculs, pourcent = charge(variante, k)  # on joue l'expérience
        ecriture = "aucune" if k is None else f"1 pour {k}"  # libellé de la ligne
        print(f"{ecriture:<12}{variante:<10}{taux:>8.1f}%{calculs:>11}{pourcent:>8.0f}%")
```

Dans le `if` de `charge`, `None` (pas d'écriture) compte comme faux, donc la condition est fausse. Dans les `f"..."` de l'affichage, `>` aligne à droite (`<` à gauche) et `.0f` écrit un nombre sans décimale.

Résultat obtenu :

```text
écriture    variante   réussite  recalculs   charge
aucune      large         96.0%         40      20%
aucune      fragment      97.9%         42      20%
1 pour 100  large         62.7%        373     187%
1 pour 100  fragment      97.0%         60      21%
1 pour 20   large         21.6%        784     392%
1 pour 20   fragment      93.0%        140      25%
1 pour 5    large          5.2%        948     474%
1 pour 5    fragment      78.8%        423      39%
1 pour 2    large          1.6%        984     492%
1 pour 2    fragment      61.8%        765      56%
```

| Écriture | Charge « large » | Charge « fragment » |
|---|---|---|
| Aucune (cache vide au départ : seuls les premiers recalculs) | 20 % | 20 % |
| 1 visite sur 100 (un commentaire par seconde) | **187 %** | 21 % |
| 1 visite sur 20 | 392 % | 25 % |
| 1 visite sur 5 | 474 % | 39 % |
| 1 visite sur 2 | 492 % | 56 % |

Un seul commentaire par seconde fait passer le serveur de 20 % à 187 % de charge avec la variante large : le cache se vide plus vite qu'il ne se remplit. Le taux de réussite tombe à 62,7 % (une écriture pour 100 visites), puis à 1,6 % (une pour 2) : dans ce dernier cas, presque chaque visite déclenche un recalcul complet. Le cache existe toujours mais ne sert plus à rien.

### De la lenteur au déni de service

Si l'écriture est **ouverte à n'importe qui** (formulaire de commentaire, bouton « j'aime », ajout au panier, envoi d'un formulaire de contact), un tiers malveillant, ou un simple robot trop zélé, peut produire la fréquence d'écriture qui vide le cache, avec une **requête** (une demande envoyée au serveur) **bon marché** qui provoque des recalculs **coûteux** : c'est une **amplification**. Le serveur sature sans qu'aucune requête ne soit énorme ; c'est un **déni de service applicatif** (rendre le service inutilisable par la charge qu'on lui impose, sans casser le réseau). Ce chapitre ne détaille pas les attaques : le catalogue des familles de surcharge, avec leurs défenses, est dans [Surcharge et déni de service applicatif](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif).

| Défense | Principe | Effet dans l'expérience |
|---|---|---|
| **Étiquettes fines** | Un morceau ne porte que les étiquettes dont il dépend vraiment | Variante « fragment » : 187 % devient 21 % |
| **Limiter la fréquence des écritures** | Un nombre maximal d'écritures par utilisateur et par minute | Plafonne la fréquence `k` |
| **Regrouper les invalidations** | Invalider une fois par seconde au plus, pas à chaque écriture | Quel que soit le nombre d'écritures, un seul vidage par intervalle |
| **Servir l'ancienne réponse pendant le recalcul** | L'entrée périmée reste servie le temps qu'un seul visiteur la refasse | Aucune rafale de recalculs (voir plus bas) |
| **Réserver les écritures aux comptes identifiés** | Pas d'écriture anonyme sur ce qui invalide un cache large | Réduit les auteurs possibles |

## Des contextes trop fins

L'erreur inverse de l'oubli d'un contexte consiste à en déclarer **trop** ou à choisir un contexte à valeurs trop nombreuses. Comme chaque valeur de contexte crée une variante de la clé, le nombre d'entrées possibles est le **produit** du nombre de pages par le nombre de valeurs de chaque contexte :

```text
entrées possibles = pages × (valeurs du contexte 1) × (valeurs du contexte 2) × ...
```

Expérience : 20 articles, 50 lecteurs connectés (2 langues, 3 rôles), 3 000 visites. Avec seulement la langue comme contexte, il y a 20 × 2 = 40 clés possibles ; avec l'identifiant du lecteur, jusqu'à 20 × 50 = 1 000.

```python
UTILISATEURS = 50                              # 50 lecteurs connectés différents
ROLES = ["lecteur", "editeur", "admin"]        # le rôle d'un lecteur (3 valeurs)


def trafic_contextes(noms):                    # 3000 visites avec ces contextes
    heure["t"] = 0.0                           # l'horloge repart de zéro
    cache, hasard = Cache(), random.Random(3)  # graine 3 : tirages reproductibles
    for _ in range(3000):                      # 3000 visites
        heure["t"] += 0.01                     # 100 visites par seconde
        u = hasard.randrange(UTILISATEURS)     # qui visite
        connu = {                              # ce que la requête sait sur le lecteur
            "langue": LANGUES[u % 2],          # sa langue (u % 2 = reste de u divisé par 2)
            "role": ROLES[u % 3],              # son rôle (reste de u divisé par 3)
            "utilisateur": f"u{u}",            # son identifiant
        }
        contexte = {nom: connu[nom] for nom in noms}  # on ne garde que les contextes déclarés
        n = hasard.randrange(NB_ARTICLES)      # l'article demandé
        cache.servir(f"article:{n}", contexte, {f"article:{n}"}, 3600)
    taux = 100 * cache.reussites / (cache.reussites + cache.echecs)  # réussite globale
    return taux, len(cache.entrees), cache.calculs  # taux, entrées gardées, recalculs


print(f"{'contextes':<24}{'réussite':>9}{'entrées':>9}{'recalculs':>11}")
for noms in (["langue"], ["langue", "role"], ["utilisateur"]):  # du plus large au plus fin
    taux, entrees, calculs = trafic_contextes(noms)  # on joue l'expérience
    print(f"{' + '.join(noms):<24}{taux:>8.1f}%{entrees:>9}{calculs:>11}")
```

Résultat obtenu :

```text
contextes                réussite  entrées  recalculs
langue                      98.7%       40         40
langue + role               96.0%      120        120
utilisateur                 68.3%      950        950
```

| Contextes | Entrées gardées | Taux de réussite | Lecture |
|---|---|---|---|
| `langue` | 40 | 98,7 % | Peu de variantes, chacune très resservie |
| `langue + role` | 120 | 96,0 % | Un peu plus de variantes, encore efficace |
| `utilisateur` | 950 | 68,3 % | Presque une entrée par visiteur : chaque entrée sert peu avant d'être oubliée |

Dans le dernier cas, le cache **fonctionne** (il ne se trompe jamais) mais il **ne sert presque plus** : 950 recalculs pour 3 000 visites, contre 40. En plus, il occupe plus de mémoire. La règle : choisir pour contexte la **catégorie** qui fait vraiment varier la réponse (la langue, le rôle) et jamais l'identité de la personne si la page n'en dépend pas ; un bloc qui dépend vraiment de l'utilisateur est isolé dans son morceau (voir la fusion plus haut), pour que le reste de la page reste partagé.

## La ruée sur le cache vide

Quand une entrée très demandée disparaît (invalidée, périmée, ou après un redémarrage), les visiteurs qui arrivent pendant son recalcul la trouvent tous absente. Si chacun lance le recalcul de son côté, le serveur reçoit **une rafale de calculs identiques** : c'est la **ruée sur le cache vide** (*cache stampede*). Ce phénomène aggrave la surcharge de la section précédente : plus le recalcul est lent, plus de visiteurs arrivent avant qu'il ne soit fini.

L'expérience lance 20 **fils d'exécution** (un fil est une suite d'instructions qui se déroule en même temps que d'autres, voir [Le parallélisme](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) qui demandent la même clé vide au même instant. Un **verrou** est un objet qu'un seul fil à la fois peut tenir : les autres attendent qu'il soit rendu. Ici, le fil qui tient le verrou recalcule ; les autres, une fois entrés à leur tour, trouvent la réponse déjà rangée et ne recalculent pas. Les fonctions du module `threading` sont décrites dans la [documentation officielle de Python](https://docs.python.org/3/library/threading.html). Dans le code : `Thread(target=f)` crée un fil qui exécutera `f`, `start()` le lance, `join()` attend sa fin ; `Barrier(n)` fait attendre chaque fil jusqu'à l'arrivée de `n` fils, puis les libère tous ensemble ; `time.sleep(0.05)` suspend le fil 50 millisecondes (0,05 s) pour simuler un calcul lent ; `with verrou:` tient le verrou le temps du bloc ; `setdefault(clé, valeur)` rend la valeur de la clé, en la créant si elle manque. Un second verrou protège le compteur de recalculs : si deux fils y ajoutaient 1 en même temps, un des ajouts pourrait se perdre. Enfin `calculer` et `lecteur` sont des fonctions définies à l'intérieur de `ruee` : elles peuvent ainsi utiliser ses variables (`cache`, `compteur`, `verrous`).

```python
def ruee(avec_verrou, fils=20):                # `fils` lecteurs arrivent sur une clé vide
    cache = Cache()                            # un cache vide : tout le monde rate
    compteur = {"n": 0}                        # recalculs réellement lancés
    verrou_compteur = threading.Lock()         # protège le compteur partagé
    verrous = {}                               # un verrou par clé
    depart = threading.Barrier(fils)           # tous les fils partent au même instant

    def calculer():                            # le calcul lent
        with verrou_compteur:                  # un seul fil modifie le compteur à la fois
            compteur["n"] += 1                 # un recalcul de plus
        time.sleep(0.05)                       # 50 ms de travail
        return "page populaire"                # le résultat

    def lecteur():                             # ce que fait chaque fil
        depart.wait()                          # attend que tous soient prêts
        if cache.lire("accueil", {}) is not None:  # entrée présente ?
            return                             # oui : rien à faire
        if avec_verrou:                        # variante protégée
            verrou = verrous.setdefault("accueil", threading.Lock())  # verrou de la clé
            with verrou:                       # un seul fil à la fois entre ici
                if cache.lire("accueil", {}) is None:  # un autre a peut-être déjà rempli
                    cache.ecrire("accueil", {}, calculer(), {"liste"}, 60)
        else:                                  # variante naïve : chacun recalcule
            cache.ecrire("accueil", {}, calculer(), {"liste"}, 60)

    liste_fils = [threading.Thread(target=lecteur) for _ in range(fils)]  # crée les fils
    for f in liste_fils:                       # démarre chaque fil
        f.start()
    for f in liste_fils:                       # attend la fin de chaque fil
        f.join()
    return compteur["n"]                       # nombre de recalculs lancés


print("sans verrou :", ruee(False), "recalculs pour 20 lecteurs")
print("avec verrou :", ruee(True), "recalcul pour 20 lecteurs")
```

Résultat obtenu :

```text
sans verrou : 20 recalculs pour 20 lecteurs
avec verrou : 1 recalcul pour 20 lecteurs
```

Vingt recalculs identiques sans verrou, un seul avec. D'autres défenses existent, qui s'ajoutent à celle-ci :

| Défense | Principe | Contre quoi |
|---|---|---|
| **Verrou par clé** | Un seul visiteur recalcule, les autres attendent le résultat | Rafale de recalculs identiques |
| **Servir la réponse périmée pendant le recalcul** (*stale-while-revalidate*, voir [Bases de données à fort trafic](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic)) | L'ancienne valeur reste servie quelques secondes | Latence vue par les visiteurs |
| **Varier la durée de vie** | Ajouter une **gigue** (*jitter*, variation aléatoire) de ± 10 % au `max-age` de chaque entrée | Péremptions simultanées (voir ci-dessous) |
| **Préchauffer** | Recalculer à l'avance les pages populaires après une purge | Premiers visiteurs lents |

La variation de durée de vie évite un autre cas de rafale : des entrées **écrites ensemble avec la même durée** expirent **ensemble**. L'expérience écrit 1 000 entrées au même instant avec une durée nominale de 60 secondes :

`random.uniform(a, b)` tire un nombre au hasard entre `a` et `b` ; `int(x)` garde sa partie entière, ici la seconde où l'entrée expire.

```python
def expirations_par_seconde(gigue):            # 1000 entrées écrites ensemble
    hasard = random.Random(4)                  # graine 4 : tirages reproductibles
    par_seconde = {}                           # seconde -> entrées qui expirent
    for _ in range(1000):                      # 1000 entrées
        duree = 60 * hasard.uniform(1 - gigue, 1 + gigue)  # durée nominale 60 s, ± gigue
        seconde = int(duree)                   # seconde d'expiration (écriture à 0)
        par_seconde[seconde] = par_seconde.get(seconde, 0) + 1  # on compte
    return max(par_seconde.values())           # le pic d'expirations sur une seconde


print("sans variation :", expirations_par_seconde(0.0), "expirations la même seconde")
print("± 10 %         :", expirations_par_seconde(0.1), "expirations au plus par seconde")
```

Résultat obtenu :

```text
sans variation : 1000 expirations la même seconde
± 10 %         : 104 expirations au plus par seconde
```

Sans variation, les 1 000 entrées expirent à la même seconde ; avec ± 10 %, au plus 104 par seconde, soit dix fois moins.

## Un exemple dans un framework : Drupal

Un **framework** est une base de code toute prête sur laquelle on construit une application. [Drupal](https://www.drupal.org/docs/drupal-apis/cache-api/cache-api), un système de gestion de contenu (un logiciel pour publier et organiser des pages) écrit en [PHP](/?c=langages&s=php&p=php), applique les trois métadonnées de ce chapitre avec ses propres mots : les **contextes** (*cache contexts*), les **étiquettes** (*cache tags*) et la **durée de vie** (*max-age*), qu'il fait **remonter** de chaque morceau vers la page selon les règles de fusion vues plus haut.

> Les noms de contextes, d'étiquettes et de fonctions de cette section sont vérifiés sur le code source de Drupal 11.x.

En PHP, `[ clé => valeur ]` crée un tableau associatif (comme un dictionnaire Python) et `=>` associe une clé à sa valeur. `\Drupal\Core\Cache\Cache::invalidateTags(...)` appelle la fonction `invalidateTags` de la classe `Cache`, rangée dans l'espace de noms `\Drupal\Core\Cache` (un nom de dossier qui évite les collisions de noms) ; `::` appelle une fonction rattachée à la classe, sans créer d'objet.

```php
<?php
// Un « tableau de rendu » : la description d'un morceau de page.
$rendu = [
    '#markup' => 'Liste des articles',                    // le contenu à afficher
    '#cache' => [                                         // les métadonnées de cache
        'contexts' => ['languages:language_interface', 'user.roles'],  // varie selon...
        'tags' => ['node:7', 'node_list'],                // dépend de...
        'max-age' => 3600,                                // durée de vie, en secondes
    ],
];

// Après l'enregistrement du contenu numéro 7 : on invalide ses étiquettes.
\Drupal\Core\Cache\Cache::invalidateTags(['node:7', 'node_list']);
```

| Notion du chapitre | Écriture dans cet exemple | Remarque |
|---|---|---|
| Contexte | `languages:language_interface`, `user.roles` | La réponse varie avec la langue de l'interface et avec les rôles de l'utilisateur |
| Étiquette | `node:7`, `node_list` | `node` est le nom que Drupal donne à un contenu ; `node_list` est l'étiquette des listes de contenus |
| Durée de vie | `'max-age' => 3600` | En secondes ; une valeur de 0 interdit de garder la réponse |
| Invalidation ciblée | `Cache::invalidateTags(['node:7', 'node_list'])` | Supprime les entrées qui portent l'une de ces étiquettes, comme `invalider` plus haut |

Le gabarit est le même qu'en Python : déclarer ce dont dépend un morceau, laisser le framework fusionner et invalider. Les pièges de ce chapitre s'y appliquent tels quels : un morceau de durée 0 ruine la page entière, et une étiquette trop large (`node_list` sur chaque page) transforme chaque modification de contenu en vidage massif.

## Où se situe le cache

Les mêmes trois métadonnées se retrouvent à chaque étage de la chaîne qui mène du visiteur aux données :

| Étage | Qui garde la copie | Qui décide de l'invalider |
|---|---|---|
| Navigateur du visiteur | Le navigateur | Surtout la durée de vie ; on ne peut pas l'atteindre depuis le serveur |
| CDN | Un réseau de serveurs proches des visiteurs ([CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative)) | Une purge demandée au CDN, ou la durée de vie |
| Application | La mémoire du serveur ou un service dédié comme [Redis](/?c=donnees&s=bases-de-donnees&p=redis) | Le code de l'application, par étiquette |
| Devant la base de données | Le résultat d'une requête coûteuse, gardé pour éviter de la relancer ([Bases de données à fort trafic](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic)) | Le code de l'application, ou la durée de vie |

Un cache sert surtout à éviter des allers-retours coûteux ; quand il n'y a rien à garder, [Limiter les allers-retours](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours) montre comment les regrouper.

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| Aucun contexte alors que la réponse varie | Un visiteur reçoit la réponse d'un autre, parfois ses données | Déclarer chaque facteur de variation dans la clé |
| Un contexte trop fin (l'identifiant de l'utilisateur) | Presque une entrée par visiteur, le cache ne sert plus (68 % au lieu de 99 % dans l'expérience) | Choisir la catégorie (langue, rôle), isoler le bloc personnel |
| Aucune étiquette, seulement une durée | Une modification reste invisible jusqu'à la péremption | Étiqueter par donnée et invalider à l'écriture |
| Une étiquette trop large | Chaque écriture vide un cache entier : 187 % de charge pour un commentaire par seconde | Étiquettes fines, blocs séparés |
| Purge totale « pour être sûr » | 42 entrées supprimées au lieu de 4, 41 recalculs au lieu de 4 | Invalidation ciblée par étiquette |
| Un morceau de durée 0 dans une page | La durée minimale remonte : toute la page devient impossible à garder | Isoler le morceau dynamique, le charger à part |
| Écriture ouverte à tous qui invalide un cache large | Amplification : requête bon marché, recalculs coûteux, déni de service applicatif | Limiter les écritures, regrouper les invalidations |
| Même durée sur des entrées écrites ensemble | Elles expirent ensemble et provoquent une rafale | Varier la durée (± 10 %) |
| Plusieurs visiteurs recalculant la même clé | Ruée sur le cache vide : 20 recalculs au lieu d'un | Verrou par clé, ou servir l'ancienne valeur le temps du recalcul |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Déclarer pour chaque entrée ses contextes, ses étiquettes et sa durée de vie dès sa création | Les trois informations manquent rarement ensemble, mais chacune manquante crée un défaut différent |
| Choisir les contextes les plus **grossiers** qui suffisent | Moins de variantes, plus de réussites |
| Étiqueter chaque entrée de **toutes** les données dont elle dépend, et rien de plus | Invalider assez, sans vider ce qui n'a pas changé |
| Séparer les morceaux qui changent souvent du reste de la page | Un morceau fragile ne ruine pas les autres |
| Invalider par étiquette, jamais par purge totale, hors incident | Le coût suit l'ampleur du changement |
| Mesurer le taux de réussite et le nombre de recalculs après chaque écriture | Un cache vidé trop souvent se voit dans les chiffres avant de se voir sur les visiteurs |
| Limiter la fréquence des écritures qui invalident, et regrouper leurs invalidations | Coupe l'amplification en déni de service |
| Verrou par clé et variation de la durée de vie | Évite les rafales de recalculs identiques |
| Mesurer d'abord (voir [mesurer avant d'optimiser](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)) avant de généraliser un cache | Il complique le code : il doit gagner un temps réel |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une entrée de cache est retrouvée par une **clé** et porte trois **métadonnées** : le **contexte** (ce qui fait varier la réponse : langue, rôle ; il entre dans la clé), l'**étiquette** (ce dont elle dépend, pour l'invalider de façon ciblée) et la **durée de vie** (`max-age`, après quoi elle est périmée). Les métadonnées d'une page composée **remontent** : réunion des contextes, réunion des étiquettes, minimum des durées. L'invalidation par étiquette ne supprime que le nécessaire (4 entrées sur 42, 98,7 % de réussite après) là où la purge totale supprime tout (86,3 %, 41 recalculs). Une écriture fréquente qui invalide un cache large le vide plus vite qu'il ne se remplit : 187 % de charge pour un commentaire par seconde, contre 21 % avec un bloc séparé. Ouverte à des tiers, cette écriture devient un déni de service applicatif, détaillé dans [Surcharge et déni de service applicatif](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). Un contexte trop fin (un par utilisateur) laisse un cache correct mais inutile (68,3 %). La ruée sur le cache vide (20 recalculs identiques) se coupe par un verrou par clé et par une durée de vie variée. |
| **Pièges à éviter** | Contexte oublié (réponse d'un autre visiteur) ; contexte trop fin ; durée sans étiquette ; étiquette trop large ; purge totale systématique ; morceau de durée 0 dans une page ; écriture publique qui invalide un cache large ; durées identiques sur des entrées écrites ensemble ; recalculs concurrents de la même clé. |
| **Bonnes pratiques** | Déclarer contextes, étiquettes et durée à la création ; contextes grossiers ; étiquettes exactes ; morceaux séparés pour ce qui change souvent ; invalidation ciblée ; limiter et regrouper les écritures qui invalident ; verrou par clé et durée variée ; mesurer le taux de réussite et les recalculs. |
