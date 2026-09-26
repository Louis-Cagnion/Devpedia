---
order: 9
---

# Robustesse d'un traitement par lots

Un **traitement par lots** (*batch*) est un programme qui traite une longue liste d'éléments en une seule exécution : 10 000 fichiers à convertir, 300 pages web à lire, toutes les lignes d'une table à recalculer. Il tourne souvent sans personne devant l'écran, par exemple lancé chaque nuit par une [tâche planifiée](/?c=langages&s=bash&p=automatisation-cron). Trois situations le mettent en difficulté : une interruption au milieu, une ressource qui tombe en panne, et un résultat vide qu'on confond avec une erreur. Ce chapitre donne un outil pour chacune ; les exemples sont en [Python](/?c=langages&s=python&p=gestion-des-erreurs).

## Reprendre après une interruption : le point de contrôle

Sans précaution, un traitement de 3 heures interrompu à 2 h 50 (coupure réseau, redémarrage de la machine) doit tout recommencer. Un **point de contrôle** (*checkpoint*) évite cela : après chaque élément traité, le programme note dans un fichier d'état ce qui est déjà fait ; relancé avec une option comme `--resume`, il saute ces éléments.

| | Sans point de contrôle | Avec point de contrôle |
|---|---|---|
| Interruption à 95 % | Tout est à refaire | Seuls les 5 % restants sont traités |
| Coût | Aucun | Une écriture de fichier par élément |

```python
import json
import os

ETAT = "etat.json"                      # fichier qui mémorise les éléments déjà traités

def charger_etat():
    if not os.path.exists(ETAT):        # première exécution : rien n'est encore fait
        return set()
    with open(ETAT, encoding="utf-8") as f:
        return set(json.load(f))        # liste JSON relue sous forme d'ensemble

def enregistrer_etat(faits):
    temporaire = ETAT + ".tmp"
    with open(temporaire, "w", encoding="utf-8") as f:
        json.dump(sorted(faits), f)     # écrit d'abord un fichier à part...
    os.replace(temporaire, ETAT)        # ...puis le met en place d'un seul coup

faits = charger_etat()
for element in elements:
    if element in faits:
        continue                        # déjà traité lors d'une exécution précédente
    traiter(element)                    # le travail réel, résultat sauvegardé ici
    faits.add(element)
    enregistrer_etat(faits)             # marqué fait seulement une fois sauvegardé
```

Le fichier d'état est au format [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) ; la lecture et l'écriture de fichiers sont détaillées dans [manipuler des fichiers](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers).

> **Piège :** écrire directement dans `etat.json`. Une coupure pendant l'écriture laisse un fichier à moitié écrit, illisible à la relance : tout le suivi est perdu. [`os.replace`](https://docs.python.org/3/library/os.html#os.replace) remplace le fichier en une seule opération, donc on retrouve toujours soit l'ancienne version complète, soit la nouvelle.
>
> **Piège :** marquer un élément comme fait avant d'avoir sauvegardé son résultat. Une coupure entre les deux, et l'élément est considéré comme traité alors que son résultat n'existe nulle part.
>
> **Bonne pratique :** rendre le traitement d'un élément **idempotent** (le refaire deux fois donne le même résultat qu'une fois) : si la coupure tombe juste après `traiter()` mais avant `enregistrer_etat()`, l'élément est simplement retraité sans dégât.

## Arrêter de solliciter une ressource en panne : le disjoncteur

Quand une ressource (un site web, une base de données) ne répond plus, réessayer chaque élément un par un gaspille du temps et peut aggraver la panne. Un **disjoncteur** (*circuit breaker*) coupe les appels vers cette ressource après plusieurs échecs consécutifs, comme un disjoncteur électrique coupe le courant après une surcharge ([CircuitBreaker, Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html) ; [Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)).

```text
            N échecs consécutifs
  FERMÉ  ─────────────────────────▶  OUVERT
 (appels                             (appels refusés
  normaux)  ◀──── succès ────┐        sans essayer)
                              │           │
                          SEMI-OUVERT ◀───┘ après un délai
                          (un seul appel d'essai)
```

| État | Comportement | Passe à |
|---|---|---|
| **Fermé** | Les appels passent normalement ; les échecs consécutifs sont comptés | Ouvert, au N-ième échec d'affilée |
| **Ouvert** | Les appels sont refusés immédiatement, sans contacter la ressource | Semi-ouvert, après un délai |
| **Semi-ouvert** | Un seul appel d'essai est autorisé | Fermé s'il réussit, ouvert s'il échoue |

Dans un traitement par lots, une version simple suffit souvent : après 3 échecs d'affilée sur un même site, on abandonne ses éléments restants pour cette exécution et on le signale.

```python
SEUIL = 3                               # échecs consécutifs avant de couper
echecs = {}                             # site -> nombre d'échecs d'affilée
coupes = set()                          # sites abandonnés pour cette exécution

for page in pages:
    if page.site in coupes:
        continue                        # disjoncteur ouvert : on n'essaie même pas
    try:
        lire(page)
        echecs[page.site] = 0           # un succès remet le compteur à zéro
    except ErreurDeLecture:
        echecs[page.site] = echecs.get(page.site, 0) + 1
        if echecs[page.site] >= SEUIL:
            coupes.add(page.site)       # 3 échecs d'affilée : on coupe ce site
```

Le disjoncteur complète le **backoff exponentiel** (attendre de plus en plus longtemps entre deux essais d'un même appel, voir [le SDK et l'API](/?c=ia&s=modeles-de-decision-structuree&p=sdk-et-api)) : le backoff espace les essais d'un appel, le disjoncteur arrête d'appeler une ressource manifestement en panne.

> **Piège :** réessayer indéfiniment une ressource en panne : le traitement ne se termine jamais, ou très tard, pour un résultat nul.
>
> **Bonne pratique :** toujours signaler une ressource coupée dans le rapport final, pour qu'elle soit traitée à la prochaine exécution plutôt qu'oubliée.

## Distinguer « résultat vide » et « échec de lecture »

Une page qu'on n'a pas pu lire et une page qui ne contient réellement rien donnent toutes les deux « 0 élément ». Les confondre fausse le résultat dans les deux sens :

| Situation réelle | Si on compte « 0 » sans distinguer | Conséquence |
|---|---|---|
| La boutique n'a vraiment aucune annonce | Correct | Alerte métier légitime |
| La page n'a pas pu être lue (blocage, panne) | Même « 0 » | Fausse alerte métier, et le vrai problème technique passe inaperçu |

La solution consiste à renvoyer un **statut explicite** avec chaque résultat, ici avec une [dataclass](/?c=langages&s=python&p=dataclasses) :

```python
from dataclasses import dataclass, field

@dataclass
class Resultat:
    statut: str                          # "ok" ou "echec_lecture"
    annonces: list = field(default_factory=list)

def compter(page):
    try:
        return Resultat("ok", extraire_annonces(page))
    except ErreurDeLecture:
        return Resultat("echec_lecture") # jamais confondu avec une liste vide
```

| Statut | Nombre d'annonces | Traitement dans le rapport |
|---|---|---|
| `ok` | au moins 1 | Résultat normal |
| `ok` | 0 | Statut métier (boutique vide) |
| `echec_lecture` | inconnu | Incident technique, compté à part, jamais comme « 0 » |

> **Bonne pratique :** compter séparément les éléments vides et les échecs dans le rapport final, et ne déclencher une alerte bloquante que pour ce qui l'exige vraiment (voir [contrôle bloquant ou alerte non bloquante](/?c=infrastructure-devops&s=ci-cd&p=yaml-pipelines-azure) dans un pipeline).

## Valider le remplacement avant de détruire l'ancien

Un traitement qui **remplace** un état existant (reconstruire un index de recherche, régénérer un fichier de cache) doit valider la nouvelle donnée **avant** de toucher à l'ancienne. Dans l'ordre inverse, un remplacement raté remplace un état valide par un état vide ou cassé, souvent avec un message de succès trompeur.

| Ordre | Si la lecture échoue |
|---|---|
| Vider l'index, puis le remplir | L'index est vide : les recherches ne trouvent plus rien, et rien ne signale la panne |
| Lire et valider, puis remplacer | L'ancien index reste en place, et l'échec est signalé |

```python
def remplacer_index(index, lire):
    """Remplace le contenu de index par lire() ; ne détruit rien si la lecture échoue."""
    nouveau = lire()                  # None : échec de lecture ; [] : résultat vide légitime
    if nouveau is None:
        return "échec : index conservé"
    index.clear()                     # destruction APRÈS la validation, jamais avant
    index.extend(nouveau)
    return f"{len(nouveau)} document(s)"
```

Le test `nouveau is None` ne marche que si la lecture distingue bien un échec d'un résultat vide (voir [la section précédente](#distinguer-resultat-vide-et-echec-de-lecture)). Pour un fichier, la même idée donne l'écriture atomique vue plus haut : écrire la nouvelle version à côté, puis la renommer à la place de l'ancienne.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un point de contrôle permet de reprendre un traitement interrompu ; un disjoncteur arrête d'appeler une ressource en panne ; un statut explicite distingue un résultat vide d'un échec de lecture. |
| **Outils utilisables** | Un fichier d'état JSON écrit via un fichier temporaire et `os.replace` ; un compteur d'échecs consécutifs par ressource ; une dataclass avec un champ `statut`. |
| **Pièges à éviter** | Écrire le fichier d'état directement ; marquer un élément comme fait avant d'avoir sauvegardé son résultat ; réessayer indéfiniment une ressource en panne ; compter un échec de lecture comme « 0 ». |
| **Bonnes pratiques** | Un traitement idempotent par élément ; signaler chaque ressource coupée dans le rapport ; compter séparément vides et échecs ; valider une nouvelle donnée avant de détruire celle qu'elle remplace. |
