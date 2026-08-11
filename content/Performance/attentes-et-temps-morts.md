---
order: 2
---

# Attendre sans perdre de temps

Dans un programme qui dialogue avec l'extérieur (réseau, navigateur, disque), l'essentiel du temps n'est pas du calcul : c'est de l'attente. Et une attente mal écrite coûte du temps même quand il n'y a rien à attendre.

## Le problème du délai fixe

Le réflexe le plus courant est de mettre une pause "assez longue pour que ça marche" :

```python
page.cliquer("Page suivante")
time.sleep(2)              # esperons que 2s suffisent
lire_les_resultats()
```

Ce code a deux défauts opposés, et c'est ce qui le rend piégeux :

- si la page répond en 300 ms, on **gaspille 1,7s** à chaque appel ;
- si elle met 2,5s (réseau chargé, page volumineuse), on lit **trop tôt** et le résultat est incomplet : un bug intermittent, très pénible à diagnostiquer.

Un délai fixe est un pari sur une durée qu'on ne contrôle pas. Il est soit trop long, soit trop court, et généralement les deux selon les jours.

## Attendre une condition, pas une durée

La bonne formulation est : *attendre que le résultat soit là*, avec un plafond de sécurité pour ne pas bloquer indéfiniment.

```python
def attendre_jusqua(condition, timeout_s=5, intervalle_ms=150):
    """Attend que condition() soit vraie. Renvoie False si le delai est depasse."""
    for _ in range(int(timeout_s * 1000 / intervalle_ms)):
        if condition():
            return True
        dormir(intervalle_ms)
    return False
```

À l'usage :

```python
nombre_avant = compter_resultats()
page.cliquer("Page suivante")

if not attendre_jusqua(lambda: compter_resultats() > nombre_avant):
    raise RuntimeError("La page suivante ne s'est jamais chargee")
```

On repart dès que le contenu est prêt (donc en 300 ms quand la page est rapide) tout en restant correct quand elle est lente. Le plafond ne sert plus de temps d'attente, mais de détection de panne.

> Remarquez que la condition porte sur un **changement** (`> nombre_avant`) et non sur une présence. Si l'on attendait simplement "y a-t-il des résultats ?", la condition serait déjà vraie avec les résultats de la page précédente, et on lirait les anciennes données en croyant lire les nouvelles.

## Ne pas guetter ce qui ne viendra pas

Le cas le plus coûteux est l'attente d'un évènement **facultatif**. Chercher une bannière de cookies pendant 2 secondes coûte 2 secondes pleines chaque fois qu'il n'y en a pas : c'est-à-dire presque toujours, une fois le consentement enregistré.

Deux parades se combinent :

**Mémoïser ce qui ne peut plus changer.** La **mémoïsation** consiste à garder en mémoire le résultat d'une vérification coûteuse pour ne plus jamais la refaire dès lors que la réponse ne peut plus changer. Une fois le consentement réglé pour un site, aucune bannière ne réapparaîtra sur ses autres pages : inutile de vérifier à chaque navigation.

```python
def fermer_banniere(page, sites_deja_traites):
    site = domaine_de(page.url)
    if site in sites_deja_traites:
        return                      # deja regle : on ne perd pas 2s a re-verifier
    sites_deja_traites.add(site)
    ...
```

**Interroger une source autoritative plutôt que sonder.** Plutôt que de guetter l'apparition d'une bannière, on peut demander directement si le consentement existe déjà : ici, la présence d'un cookie :

```python
def consentement_deja_donne(page):
    return any("consent" in c["name"].lower() for c in page.cookies())
```

Si oui, une seule vérification immédiate suffit ; si non, on garde la surveillance complète. Le comportement reste correct dans les deux cas, sans pari sur le temps d'apparition.

Ces deux changements ont supprimé 12,8 des 25 secondes du programme cité en exemple, sans modifier une seule requête envoyée : c'était de l'attente purement locale.

## Garder une pause quand elle a un rôle

Attention à ne pas supprimer les pauses **utiles**. Face à un service distant, un espacement volontaire entre les requêtes protège contre une limitation de débit ou un blocage. La distinction à faire :

| Type de pause | À supprimer ? |
|---|---|
| Attendre une durée arbitraire "au cas où" | Oui, remplacer par une condition |
| Re-vérifier une information qui ne peut pas changer | Oui, mémoïser |
| Espacer volontairement des requêtes vers un même service | **Non**, c'est une protection |

Une pause de politesse n'est pas une inefficacité : c'est une contrainte de conception. La supprimer ne rend pas le programme meilleur, elle déplace le problème vers un échec plus difficile à diagnostiquer.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un délai fixe ("`sleep(2)`") est toujours soit trop long (temps gaspillé), soit trop court (bug intermittent) : attendre une condition avec un plafond de sécurité résout les deux problèmes à la fois. |
| **Outils utilisables** | Une fonction générique "attendre jusqu'à" (condition + timeout), la mémoïsation pour ne plus revérifier ce qui ne peut plus changer. |
| **Pièges à éviter** | Guetter un évènement facultatif à chaque itération (une bannière de cookies) sans mémoriser qu'il ne réapparaîtra plus. |
| **Bonnes pratiques** | Interroger une source autoritative (un cookie) plutôt que de sonder un affichage ; garder les pauses volontaires qui protègent contre une limitation de débit. |
