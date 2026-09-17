---
order: 7
---

# L'approximation par série de Taylor

Une **série de Taylor** approxime une fonction mathématique compliquée (`sin`, `cos`, `exp`...) par une somme de termes de plus en plus précis, calculables uniquement avec des additions et multiplications : utile quand la fonction native (`<math.h>`) n'est pas disponible, ou pour comprendre comment elle est calculée en interne.

## Le principe : additionner des termes de plus en plus précis

Le développement en série de `cos(x)` s'écrit :

```text
cos(x) ≈ 1 - x²/2! + x⁴/4! - x⁶/6! + ...
```

Chaque terme supplémentaire affine l'approximation ; plus on additionne de termes, plus le résultat se rapproche de la vraie valeur de `cos(x)`. En pratique, quelques termes seulement (5 par exemple) suffisent déjà pour une précision largement suffisante à un usage visuel (coloration, animation).

## Calculer chaque terme à partir du précédent

Calculer une factorielle (`6! = 720`) à chaque terme, à chaque appel, serait redondant. Chaque terme se déduit du précédent par une simple multiplication, sans jamais recalculer de factorielle depuis le début :

```c
double cosinus(double x, int nombreDeTermes)
{
    double resultat = 1.0;
    double terme = 1.0;

    for (int i = 1; i <= nombreDeTermes; i++) {
        terme *= -x * x / ((2 * i - 1) * (2 * i)); // déduit du terme précédent
        resultat += terme;
    }
    return resultat;
}
```

> **Note :** `terme *= -x * x / ((2*i-1) * (2*i))` fait passer d'un terme au suivant en une seule opération : le signe alterne (`-x*x`), et diviser par `(2i-1)*(2i)` revient à multiplier progressivement le dénominateur par les deux facteurs manquants de la factorielle suivante, sans jamais la recalculer entièrement.

> **Bonne pratique :** utiliser la fonction native (`cos()` de `<math.h>`) dès qu'elle est disponible : plus précise et déjà optimisée. Une réimplémentation par série de Taylor n'a d'intérêt que lorsque la bibliothèque standard est indisponible ou interdite (contrainte d'un exercice, environnement embarqué minimal).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une série de Taylor approxime une fonction par une somme de termes ; chaque terme supplémentaire améliore la précision, un nombre limité de termes suffit souvent pour un usage pratique. |
| **Outils utilisables** | Déduire chaque terme du précédent par une multiplication, plutôt que de recalculer une factorielle à chaque fois. |
| **Pièges à éviter** | Recalculer une factorielle complète à chaque terme au lieu de la déduire progressivement du terme précédent. |
| **Bonnes pratiques** | Préférer la fonction native de la bibliothèque standard dès qu'elle est disponible ; réserver la réimplémentation par série à un contexte qui l'exige réellement. |
