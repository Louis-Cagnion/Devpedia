---
order: 1
---

# Mesurer avant d'optimiser

La règle la plus rentable en performance est aussi la plus ignorée : **ne jamais optimiser sans avoir mesuré**. L'intuition sur "ce qui est lent" est mauvaise de façon fiable, parce qu'on regarde le code qu'on trouve compliqué plutôt que le code qui coûte cher.

## Le cas typique

Sur un programme d'automatisation de navigateur trop lent, mes hypothèses étaient : les chargements de pages, puis la pagination, puis l'extraction des données. Un profilage a donné ceci :

| Étape | Temps | Part |
|---|---|---|
| Attente d'une bannière de cookies | 12,8s | **50 %** |
| Attentes fixes après pagination | ~7,5s | 30 % |
| Chargements de pages + extraction | ~5s | 20 % |

La moitié du temps partait à guetter une bannière **qui n'apparaissait jamais** : le consentement était déjà enregistré dans le profil du navigateur. Aucune de mes trois hypothèses n'était le vrai coupable, et le coupable réel n'était même pas dans ma liste.

## Profiler par phases, pas ligne par ligne

Un profileur classique (`cProfile` en Python, l'onglet Performance d'un navigateur) donne le temps par fonction. C'est utile pour du calcul, beaucoup moins quand le programme passe son temps à **attendre** : tout apparaît sous une poignée de fonctions d'attente, sans dire *pourquoi* on attend.

Dans ce cas, instrumenter soi-même les phases logiques est plus parlant. Le principe : envelopper les fonctions clés pour cumuler leur temps, sans toucher au code mesuré.

```python
import time

timings = []

def chronometrer(module, nom):
    """Remplace module.nom par une version qui enregistre son temps d'execution."""
    original = getattr(module, nom)

    def enveloppe(*args, **kwargs):
        debut = time.perf_counter()
        resultat = original(*args, **kwargs)
        timings.append((nom, time.perf_counter() - debut))
        return resultat

    setattr(module, nom, enveloppe)

chronometrer(mon_module, "attendre_contenu")
chronometrer(mon_module, "fermer_banniere")
```

En agrégeant ensuite par nom, on obtient le nombre d'appels **et** le temps cumulé de chacun. Le nombre d'appels est souvent l'information décisive : une fonction à 0,3s appelée 40 fois coûte plus qu'une fonction à 2s appelée une fois.

> Pensez à afficher aussi le temps **non attribué** (total mesuré moins la somme des phases). S'il est élevé, votre instrumentation rate l'essentiel et vos conclusions porteront à faux.

## Mesurer aussi après

Une optimisation non re-mesurée est une croyance. Deux vérifications valent d'être systématiques :

- **le temps a bien baissé** — parfois un changement "évidemment plus rapide" ne change rien, parce qu'il n'était pas sur le **chemin critique** (la suite d'étapes dépendantes qui détermine à elle seule la durée totale ; accélérer une étape en dehors de cette suite ne raccourcit rien, puisque le programme attend de toute façon la fin des étapes qui, elles, en font partie) ;
- **le résultat est identique** — c'est la vérification qu'on oublie, et c'est la plus importante. Une optimisation qui casse silencieusement la sortie est bien pire qu'un programme lent.

Dans le cas ci-dessus, comparer la sortie octet par octet avant et après chaque étape a permis de détecter une extraction devenue incomplète — un bug qu'aucun chronomètre n'aurait révélé.

## Le piège de la mesure unique

Un seul relevé ne dit rien : le réseau, le cache et la charge de la machine font varier les résultats de dizaines de pourcents. Prenez plusieurs mesures et regardez si l'écart entre deux configurations dépasse leur variation naturelle. Sinon, vous mesurez du bruit.
