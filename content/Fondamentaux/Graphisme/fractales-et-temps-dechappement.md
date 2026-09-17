---
order: 6
---

# Les fractales par temps d'échappement : Mandelbrot et Julia

Une **fractale par temps d'échappement** (*escape-time fractal*) colore chaque pixel d'une image selon la vitesse à laquelle une suite de nombres associée à ce pixel "s'échappe" vers l'infini, ou n'y arrive jamais.

## Le principe : itérer et compter

Pour Mandelbrot, chaque pixel de l'image est transformé en un nombre complexe `c` (sa position dans le plan). On itère alors la formule `z = z² + c`, en partant de `z = 0` :

```text
z0 = 0
z1 = z0² + c
z2 = z1² + c
z3 = z2² + c
...
```

Si le module de `z` (sa distance à l'origine) dépasse un seuil fixé (le **rayon d'échappement**, souvent `2`), la suite "s'échappe" : elle ne reviendra jamais en arrière et grandira indéfiniment. Le nombre d'itérations effectuées avant cet échappement détermine la couleur du pixel ; si `z` n'échappe jamais avant un nombre maximal d'itérations fixé, le pixel appartient à **l'ensemble de Mandelbrot** et se colore en noir.

```text
Pour chaque pixel (converti en nombre complexe c) :
    z = 0
    iterations = 0
    tant que |z| <= rayon_dechappement ET iterations < max_iterations :
        z = z*z + c
        iterations += 1
    couleur du pixel = fonction(iterations)
```

## Mandelbrot vs Julia

| | Mandelbrot | Julia |
|---|---|---|
| `c` | Devient la position du pixel | Fixe, choisi une fois pour toute l'image |
| `z` de départ | Toujours `0` | Devient la position du pixel |
| Résultat | Une seule image, la même "carte" à chaque fois | Une image différente pour chaque valeur de `c` choisie |

Julia utilise exactement la même boucle d'itération que Mandelbrot ; seule l'affectation initiale de `c` et `z` change.

## Éviter une racine carrée à chaque itération

Calculer le module exact de `z` (`√(partie_réelle² + partie_imaginaire²)`) à chaque itération demanderait une racine carrée par itération et par pixel, un calcul coûteux répété des millions de fois. Comme seule la comparaison au rayon d'échappement compte, comparer le **carré** du module au **carré** du rayon donne exactement le même résultat, sans jamais calculer de racine carrée :

```text
partie_reelle² + partie_imaginaire² <= rayon_dechappement²
```

> **Bonne pratique :** élever le seuil de comparaison au carré une seule fois (`rayon_dechappement * rayon_dechappement`) plutôt que de recalculer une racine carrée à chaque itération de chaque pixel : un gain de performance direct sur un calcul déjà répété des millions de fois par image.

> **Aller plus loin :** une généralisation existe avec un exposant `d` non entier (*Multibrot*, `zᵈ + c`), calculée en passant `z` en forme polaire (module et angle) puis en appliquant le théorème de De Moivre (`zᵈ = rᵈ·(cos(dθ) + i·sin(dθ))`) : hors du périmètre de ce chapitre, mais le même principe d'itération et de comptage s'applique.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une fractale par temps d'échappement itère une formule (`z = z² + c` pour Mandelbrot/Julia) et colore chaque pixel selon le nombre d'itérations avant que `z` ne dépasse un seuil fixé (ou jamais, pour l'ensemble lui-même). |
| **Outils utilisables** | Comparer le carré du module au carré du rayon d'échappement, pour éviter une racine carrée par itération. |
| **Pièges à éviter** | Recalculer une vraie racine carrée à chaque itération pour tester l'échappement, alors que la comparaison au carré suffit. |
| **Bonnes pratiques** | Précalculer le carré du rayon d'échappement une seule fois avant la boucle de rendu. |
