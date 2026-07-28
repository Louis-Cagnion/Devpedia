---
title: La surcharge d'opérateurs
---

C++ permet de redéfinir le comportement des opérateurs standards (`+`, `==`, `<<`...) pour des types personnalisés — ce qui permet à un objet créé par l'utilisateur de se comporter, en apparence, comme un type natif du langage.

## Surcharger `+`

```cpp
class Vecteur2D {
public:
    Vecteur2D(double x, double y) : x(x), y(y) {}

    Vecteur2D operator+(const Vecteur2D &autre) const {
        return Vecteur2D(x + autre.x, y + autre.y);
    }

    double x, y;
};

Vecteur2D a(1, 2);
Vecteur2D b(3, 4);
Vecteur2D c = a + b;   // appelle en réalité a.operator+(b) -> Vecteur2D(4, 6)
```

`a + b` est littéralement transformé par le compilateur en `a.operator+(b)` — l'opérateur n'est qu'une méthode avec un nom particulier et une syntaxe d'appel spéciale.

## Surcharger `==`

```cpp
class Point {
public:
    Point(int x, int y) : x(x), y(y) {}

    bool operator==(const Point &autre) const {
        return x == autre.x && y == autre.y;
    }

    int x, y;
};

Point p1(1, 2);
Point p2(1, 2);
std::cout << (p1 == p2);   // true -> sans surcharge, comparerait les ADRESSES, pas le contenu
```

> **Note :** sans surcharge de `==`, comparer deux objets avec `==` compare par défaut leur **adresse mémoire** (comme comparer deux pointeurs), jamais leur contenu — une source d'erreur fréquente pour qui s'attend à une comparaison "par valeur" automatique.

## Surcharger `<<` pour l'affichage

```cpp
class Point {
public:
    Point(int x, int y) : x(x), y(y) {}
    int x, y;
};

std::ostream &operator<<(std::ostream &os, const Point &p) {
    os << "(" << p.x << ", " << p.y << ")";
    return os;
}

Point p(3, 4);
std::cout << p;   // (3, 4) -> sans cette surcharge : erreur de compilation, << ne connaît pas Point
```

> **Note :** cette surcharge s'écrit en dehors de la classe (une fonction libre, pas une méthode), car l'objet de gauche de `<<` est le flux (`std::ostream`), pas le `Point` — `p << std::cout` n'aurait pas de sens, mais `std::cout << p` doit fonctionner.

## Ce qu'il ne faut pas faire : surcharger sans respecter le sens attendu

```cpp
// À ÉVITER : "+" qui ne fait pas une addition au sens intuitif du terme
Vecteur2D operator+(const Vecteur2D &autre) const {
    return Vecteur2D(x * autre.x, y * autre.y);   // trompeur : "+" qui multiplie !
}
```

> **Note (best practice) :** un opérateur surchargé doit se comporter de façon **prévisible**, cohérente avec le sens habituel du symbole (`+` additionne, `==` compare une égalité logique...). Une surcharge qui contredit cette attente rend le code trompeur pour quiconque le relit, y compris soi-même plus tard.

## Résumé des opérateurs les plus couramment surchargés

| Opérateur | Usage typique |
|---|---|
| `+`, `-`, `*` | Opérations arithmétiques sur un type mathématique (vecteur, matrice, nombre complexe...) |
| `==`, `!=` | Comparaison logique du contenu de deux objets |
| `<<`, `>>` | Affichage (`std::cout`) et lecture (`std::cin`) d'un objet |
| `[]` | Accès indexé, pour un type qui se comporte comme une collection |
| `()` | Rendre un objet "appelable" comme une fonction (*functor*) |
