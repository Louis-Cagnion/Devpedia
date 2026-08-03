---
order: 4
---

# Parallélisme : trouver la contrainte réelle

Le parallélisme est l'optimisation la plus mal utilisée, parce qu'elle paraît toujours applicable : "j'ai 8 cœurs, lançons 8 workers". En pratique, un programme ne va jamais plus vite que sa **ressource la plus contrainte**, et ajouter des workers au-delà de cette limite dégrade les performances au lieu de les améliorer.

## Identifier ce qui limite

Avant de paralléliser, il faut savoir ce qu'on attend :

| Le programme attend… | Parallélisme utile ? |
|---|---|
| Le processeur (calcul, compression, rendu) | Jusqu'au nombre de cœurs, pas au-delà |
| Un disque | Peu : la tête de lecture ou la file d'attente sature vite |
| Le réseau / un service distant | Oui, **si** les cibles sont indépendantes |
| Un verrou, une base de données unique | Non : le goulot est partagé, on ne fait que l'encombrer |

Le cas "réseau" est le plus favorable, parce que le programme passe son temps à ne rien faire en attendant des réponses. Mais il porte une condition décisive : **l'indépendance des cibles**.

## Deux cibles indépendantes : le parallélisme est gratuit

Sur un programme qui interrogeait deux services distincts l'un après l'autre, chacun imposant sa propre limite de débit, le traiter en deux processus (un par service) divise le temps total par deux **sans augmenter d'un seul appel** la charge vue par chacun. C'est un gain sans contrepartie : on cesse simplement de rester inactif face au service A pendant qu'on ne fait rien avec le service B.

## Plusieurs workers sur une même cible : le gain est un transfert

En revanche, lancer deux workers sur le **même** service double la cadence des requêtes qu'il reçoit. Le parallélisme ne contourne pas une limite de débit : il la **concentre**. Et si cette limite existe (quota, protection anti-abus), on ne gagne pas du temps, on achète un risque de blocage.

Ce point est contre-intuitif : les workers partent bien du même endroit — même machine, souvent même adresse IP publique. Du point de vue du service distant, ce n'est pas "plusieurs clients", c'est **un client deux fois plus insistant**.

## Pourquoi ça devient contre-productif

Au-delà de la contrainte, chaque worker supplémentaire dégrade les autres :

- **Mémoire et processeur** : plusieurs navigateurs ou interpréteurs se disputent la machine. Les pages se rendent plus lentement, donc chaque worker devient individuellement plus lent.
- **Effet pervers avec les attentes adaptatives** : si les attentes sont calées sur le temps de réponse réel (voir [Attendre sans perdre de temps](/?c=performance&p=attentes-et-temps-morts)), ralentir le rendu **allonge mécaniquement** chaque attente. Le gain par worker s'effondre pendant que la charge continue d'augmenter.
- **Coût fixe de démarrage** : lancer un processus, un interpréteur, un navigateur coûte quelques secondes. Sur un petit volume de travail, ce coût annule le bénéfice — c'est exactement ce que j'ai observé : sur 4 unités de travail, la version parallèle était *plus lente* que la séquentielle ; le gain n'apparaissait qu'à partir de plusieurs dizaines.

D'où une progression typique :

| Workers | Temps | Charge par cible | Verdict |
|---|---|---|---|
| 1 | 33 min | 1× | référence |
| 2 (1 par cible) | 17 min | 1× | gain gratuit |
| 4 (2 par cible) | 8 min | **2×** | risque acheté |
| 6 (3 par cible) | ~7 min | **3×** | contre-productif |

Le passage de 4 à 6 illustre le point : le temps ne baisse presque plus mais la charge continue de croître linéairement — symptôme de **contention** (plusieurs workers qui se disputent une même ressource limitée, ici la machine elle-même : processeur, mémoire), qui annule le bénéfice attendu du parallélisme.

## Contraintes pratiques à anticiper

Le parallélisme fait apparaître des problèmes qui n'existaient pas en séquentiel :

- **Ressources exclusives** : certains outils verrouillent leurs fichiers de travail (un profil de navigateur, par exemple). Chaque worker a besoin du sien.
- **Écriture concurrente** : deux processus qui écrivent dans le même fichier de sortie l'entrelacent et le corrompent. Faire écrire chaque worker dans son propre fichier, puis fusionner, est plus simple et plus robuste qu'un verrou partagé.
- **Erreurs silencieuses** : un worker qui échoue ne fait pas échouer le programme principal. Il faut vérifier explicitement les codes de retour **et** que le résultat fusionné est complet. Sans cette vérification, un rapport vide ressemble à un succès.

```python
echecs = [nom for nom, proc in workers if proc.wait() != 0]
resultats = fusionner(workers)

if not resultats:
    raise SystemExit("Aucun resultat recupere : rien n'a ete produit.")
if len(resultats) < attendu:
    avertir(f"{len(resultats)} resultats sur {attendu} attendus")
```

## Une alternative souvent meilleure : étaler dans le temps

Quand la contrainte est un quota, la solution n'est pas toujours d'aller plus vite. Découper le travail en lots répartis sur la journée expose beaucoup moins qu'un gros traitement d'un seul coup, pour un résultat identique — et ne demande aucune parallélisation. Si la latence n'a pas d'importance (un traitement nocturne, un rapport périodique), c'est le choix le plus sûr.
