---
order: 7
---

# Éviter le recalcul redondant

Un principe plus général se cache derrière [l'attente d'une condition plutôt que d'une durée](/?c=performance&p=attentes-et-temps-morts) : **ne jamais recalculer un résultat que rien n'a pu changer depuis son dernier calcul**. Là où le chapitre précédent portait sur l'attente (du temps qui passe), celui-ci porte sur le calcul (du processeur et de la mémoire qui travaillent) — la même paresse disciplinée, appliquée à un autre type de coût.

## Mémoïser le résultat d'une fonction

Le cas le plus direct : une fonction coûteuse, appelée plusieurs fois avec les mêmes arguments, qui refait le même travail à chaque appel.

```python
def note_de_credit(client_id):
    # requete lourde : agrege l'historique, calcule un score
    return calculer_score(recuperer_historique(client_id))

# appelee 3 fois pour le meme client dans le meme traitement
for commande in commandes_du_client:
    if note_de_credit(client_id) < seuil:
        refuser(commande)
```

Rien ne change `client_id` ni son historique entre ces trois appels : le deuxième et le troisième recalculent exactement ce que le premier a déjà produit.

```python
_cache_notes = {}

def note_de_credit(client_id):
    if client_id not in _cache_notes:
        _cache_notes[client_id] = calculer_score(recuperer_historique(client_id))
    return _cache_notes[client_id]
```

La **mémoïsation** garde en mémoire le résultat pour une entrée donnée et le réutilise tant que rien ne peut l'invalider. La condition qui fait sa correction n'est pas "c'est plus rapide", c'est "l'entrée n'a pas changé" — exactement le même invariant que celui de la bannière de cookies déjà traitée dans le chapitre précédent, appliqué ici à une valeur plutôt qu'à un état d'affichage.

> Une mémoïsation sans invalidation est un bug en sursis : si `client_id` peut voir son historique modifié en cours de traitement (un paiement qui arrive entre deux commandes), le cache renvoie une réponse périmée. Mémoïser, c'est d'abord identifier ce qui rendrait le résultat obsolète, avant de décider de le garder.

## Recalculer seulement ce qui a changé

Le même principe s'applique à l'échelle d'un traitement entier, pas seulement d'un appel de fonction. Si une seule partie des données a changé depuis le dernier passage, retraiter l'ensemble revient à refaire tout le travail déjà validé pour ne modifier qu'un fragment.

```python
# a chaque execution : on retraite les 50 000 lignes du fichier
for ligne in tout_le_fichier:
    resultats.append(traiter(ligne))
```

```python
# on ne retraite que ce qui est arrive depuis le dernier passage
dernier_horodatage = lire_marque_de_progression()
nouvelles_lignes = [l for l in tout_le_fichier if l.horodatage > dernier_horodatage]

for ligne in nouvelles_lignes:
    resultats.append(traiter(ligne))

ecrire_marque_de_progression(nouvelles_lignes[-1].horodatage if nouvelles_lignes else dernier_horodatage)
```

Le coût du traitement devient proportionnel à ce qui a **changé**, pas à la taille totale des données — un gain qui s'accentue à mesure que le volume déjà traité grandit par rapport au volume réellement nouveau.

## L'exemple du jeu vidéo 2D : ne redessiner que ce qui bouge

Un jeu 2D qui gère lui-même sa mémoire d'affichage (un tableau de pixels ou de tuiles en mémoire, sans déléguer à un moteur de rendu qui optimise déjà cela) illustre bien le principe à l'échelle d'une image entière.

```python
# a chaque tick : on redessine toute l'image, meme si un seul personnage a bouge
def dessiner_frame(ecran, scene):
    for x in range(ecran.largeur):
        for y in range(ecran.hauteur):
            ecran.definir_pixel(x, y, scene.couleur_a(x, y))
```

Si un tick ne fait bouger qu'un personnage de quelques pixels, le reste du décor est identique pixel pour pixel à la frame précédente : le recalculer ne change rien au résultat, seulement au temps passé à l'obtenir.

```python
# on ne redessine que les rectangles marques "sales" (modifies depuis le dernier tick)
def dessiner_frame(ecran, scene, zones_modifiees):
    for zone in zones_modifiees:
        for x, y in zone.pixels():
            ecran.definir_pixel(x, y, scene.couleur_a(x, y))
```

C'est la logique du **dirty rectangle** (rectangle sale) : la scène signale elle-même quelles zones ont changé depuis le dernier rendu, et seules celles-là sont redessinées. Sur un décor à 90% statique, ça ramène le coût de chaque frame à une fraction de celui d'un rendu complet — pour un résultat visuellement identique.

## Un exemple tiré d'un scraper : ne pas confirmer ce qui est déjà prouvé

Un scraper de petites annonces comparait deux annonces pour savoir si elles décrivaient le même véhicule (doublon) ou deux véhicules différents. La vérification complète ouvrait la page détaillée de chaque annonce pour comparer une dizaine de caractéristiques (kilométrage, options, historique d'entretien) — un appel réseau et un temps de rendu non négligeables.

```python
def sont_potentiellement_dupliquees(annonce_a, annonce_b):
    # tout est deja disponible sur les cartes de la page de resultats
    return (
        annonce_a.marque == annonce_b.marque
        and annonce_a.modele == annonce_b.modele
        and abs(annonce_a.prix - annonce_b.prix) < 200
    )

def sont_dupliquees(annonce_a, annonce_b):
    if not sont_potentiellement_dupliquees(annonce_a, annonce_b):
        return False    # deja tranche : marque ou modele different, ou prix trop eloigne
    detail_a = ouvrir_page_annonce(annonce_a)
    detail_b = ouvrir_page_annonce(annonce_b)
    return comparer_specifications(detail_a, detail_b)
```

Dès que la comparaison "légère" (les champs déjà présents sur la carte de résultats) établit que deux annonces sont différentes, la question est **déjà résolue** : ouvrir les deux pages détaillées pour le confirmer ne ferait que recalculer, au prix fort, un résultat que la donnée bon marché a déjà produit. La vérification coûteuse ne s'exécute que dans le cas ambigu, celui où la donnée légère ne suffit pas à trancher.

> À ne pas confondre avec une optimisation de la **latence réseau**. Ici, ce qu'on évite est un travail redondant côté CPU/logique (recalculer une réponse déjà connue) — pas un délai d'E/S. Les pauses volontaires entre requêtes (limite de débit, politesse envers un serveur distant) ou l'attente d'une animation d'interface ne relèvent pas de ce principe : elles restent nécessaires même quand aucun recalcul n'est en jeu, et les supprimer expose à un blocage, pas à une simple lenteur. C'est exactement la distinction posée en fin de [Attendre sans perdre de temps](/?c=performance&p=attentes-et-temps-morts) : un délai de protection n'est pas un gaspillage à éliminer.

## Récapitulatif

| Situation | Sans le principe | Avec le principe |
|---|---|---|
| Fonction pure appelée plusieurs fois avec la même entrée | Recalcule à chaque appel | Mémoïse le résultat, invalide si l'entrée change |
| Traitement périodique sur des données en grande partie stables | Retraite tout à chaque passage | Ne retraite que ce qui a changé depuis la marque de progression |
| Rendu d'une frame de jeu | Redessine tout l'écran à chaque tick | Ne redessine que les zones marquées comme modifiées |
| Comparaison de deux enregistrements | Ouvre systématiquement le détail coûteux | S'arrête dès qu'une donnée légère a déjà tranché |

Dans les quatre cas, le gain ne vient pas d'un calcul rendu plus rapide, mais d'un calcul **qui n'a pas eu lieu** parce que rien ne pouvait en changer le résultat.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Ne jamais recalculer un résultat que rien n'a pu changer depuis son dernier calcul — mémoïsation, retraitement incrémental, ou dirty rectangle appliquent tous la même idée à des échelles différentes. |
| **Outils utilisables** | Un cache en mémoire par entrée (mémoïsation), une marque de progression pour ne retraiter que le nouveau, une comparaison "légère" avant une vérification coûteuse. |
| **Pièges à éviter** | Mémoïser sans identifier ce qui invaliderait le résultat — un cache jamais invalidé devient une source de données périmées. |
| **Bonnes pratiques** | Toujours définir la condition d'invalidation avant de mémoïser ; distinguer un recalcul évitable (ce principe) d'une pause volontaire de protection (à conserver). |
