---
order: 9
---

# La STL — itérateurs, algorithmes et lambdas

Un **itérateur** est une abstraction qui permet de parcourir n'importe quel conteneur STL (cf. chapitre dédié) de la même façon, qu'il s'agisse d'un `vector` (tableau contigu) ou d'une `list` (liste chaînée) — le code de parcours ne change pas, même si la structure sous-jacente est radicalement différente.

## Le principe de l'itérateur

```cpp
std::vector<int> nombres = {1, 2, 3};

std::vector<int>::iterator it = nombres.begin();
while (it != nombres.end()) {
    std::cout << *it << " ";   // "*it" déréférence l'itérateur, comme un pointeur (cf. chapitre dédié, rubrique C)
    ++it;
}
```

- `begin()` renvoie un itérateur pointant sur le premier élément.
- `end()` renvoie un itérateur "juste après" le dernier élément (jamais déréférencé directement, seulement comparé).
- `*it` déréférence l'itérateur courant, `++it` avance au suivant — une syntaxe volontairement proche de celle d'un pointeur brut.

## Le for-each moderne (C++11+)

```cpp
for (int n : nombres) {
    std::cout << n << " ";
}
```

Cette syntaxe s'appuie **exactement** sur le même mécanisme d'itérateurs en coulisses — c'est un raccourci syntaxique, valable pour n'importe quel type qui expose `begin()`/`end()`.

## Les algorithmes standards (`<algorithm>`)

Plutôt que d'écrire manuellement une boucle pour chaque opération courante, la STL fournit des algorithmes génériques, fonctionnant sur des **paires d'itérateurs** (début, fin) — donc valables sur n'importe quel conteneur :

```cpp
#include <algorithm>

std::vector<int> nombres = {5, 3, 1, 4, 2};

std::sort(nombres.begin(), nombres.end());               // trie en place -> {1, 2, 3, 4, 5}

auto it = std::find(nombres.begin(), nombres.end(), 3);    // itérateur pointant vers la valeur 3
bool trouve = (it != nombres.end());

int somme = std::accumulate(nombres.begin(), nombres.end(), 0);  // 15 -> nécessite <numeric>

std::for_each(nombres.begin(), nombres.end(), [](int n) {
    std::cout << n * 2 << " ";
});
```

## Les lambdas (C++11+)

Une **lambda** est une fonction anonyme, écrite directement là où elle est utilisée — le même concept que les closures JavaScript ou les lambdas Python (cf. chapitres dédiés) :

```cpp
auto carre = [](int x) { return x * x; };
std::cout << carre(5);   // 25
```

```cpp
int seuil = 3;
auto estAuDessusDuSeuil = [seuil](int x) { return x > seuil; };   // capture "seuil" par valeur

int compte = std::count_if(nombres.begin(), nombres.end(), estAuDessusDuSeuil);
```

- `[]` : liste de capture — quelles variables externes la lambda peut utiliser, et comment (`[seuil]` par valeur, `[&seuil]` par référence, `[&]` tout par référence, `[=]` tout par valeur).
- `()` : paramètres, comme une fonction classique.
- `{}` : corps de la lambda.

## Algorithmes courants

| Fonction | Rôle |
|---|---|
| `std::sort` | Trie une plage d'éléments |
| `std::find` | Cherche la première occurrence d'une valeur |
| `std::count` / `std::count_if` | Compte les occurrences (avec ou sans condition) |
| `std::for_each` | Applique une fonction à chaque élément |
| `std::transform` | Produit une nouvelle plage en appliquant une fonction à chaque élément (équivalent de `map` en Python/JS) |
| `std::accumulate` | Réduit une plage à une seule valeur (équivalent de `reduce`) |

> **Note :** utiliser ces algorithmes plutôt que des boucles manuelles rend l'intention explicite (`std::sort` dit "je trie", une boucle avec un algorithme de tri écrit à la main demande de le déduire) — un gain de lisibilité direct, en plus d'éviter de réimplémenter (et potentiellement de mal implémenter) une logique déjà standardisée et optimisée.
