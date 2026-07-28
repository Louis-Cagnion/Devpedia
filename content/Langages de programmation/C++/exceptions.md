---
title: Les exceptions
---

C++ propose un mécanisme d'erreurs structuré (`try`/`catch`/`throw`), une alternative au style "à la C" (une fonction renvoie une valeur spéciale comme `-1` ou `NULL`, et positionne `errno`, cf. chapitre sur les appels système, rubrique C) — le même principe que les exceptions PHP, Python ou JavaScript déjà vues dans les rubriques correspondantes.

## `try` / `catch` / `throw`

```cpp
double diviser(double a, double b) {
    if (b == 0) {
        throw std::runtime_error("Division par zéro");
    }
    return a / b;
}

try {
    double resultat = diviser(10, 0);
} catch (const std::runtime_error &erreur) {
    std::cout << "Erreur : " << erreur.what() << "\n";
}
```

## La hiérarchie standard des exceptions

```cpp
#include <stdexcept>

std::exception              // classe de base de toutes les exceptions standard
  ├── std::logic_error        // erreur détectable avant exécution (ex: argument invalide)
  │     ├── std::invalid_argument
  │     └── std::out_of_range
  └── std::runtime_error       // erreur détectable seulement à l'exécution
        ├── std::overflow_error
        └── std::underflow_error
```

Intercepter `const std::exception &` attrape n'importe quelle exception dérivée de cette hiérarchie standard — utile en dernier recours, mais intercepter le type le plus **précis** possible reste préférable pour réagir différemment selon le problème réel.

## Créer sa propre exception

```cpp
class SoldeInsuffisantException : public std::runtime_error {
public:
    SoldeInsuffisantException(double solde)
        : std::runtime_error("Solde insuffisant : " + std::to_string(solde)) {}
};

void retirer(double solde, double montant) {
    if (montant > solde) {
        throw SoldeInsuffisantException(solde);
    }
}

try {
    retirer(100, 150);
} catch (const SoldeInsuffisantException &e) {
    std::cout << e.what() << "\n";
} catch (const std::exception &e) {   // filet de sécurité pour toute autre exception standard
    std::cout << "Erreur inattendue : " << e.what() << "\n";
}
```

## Exceptions et RAII : pourquoi ce mécanisme est sûr en C++

```cpp
void traiter() {
    GestionnaireFichier gf("donnees.txt");   // cf. chapitre sur RAII
    throw std::runtime_error("Erreur pendant le traitement");
}   // même ici, ~GestionnaireFichier() s'exécute AVANT que l'exception ne remonte plus haut
```

Quand une exception est levée, C++ "déroule la pile" (*stack unwinding*) : chaque objet local encore en vie voit son destructeur appelé, dans l'ordre inverse de leur création, avant que l'exception ne continue de remonter — c'est ce qui garantit qu'une ressource gérée par RAII (cf. chapitre dédié) est toujours libérée proprement, même en cas d'erreur imprévue.

## `noexcept` : garantir qu'une fonction ne lève jamais

```cpp
void fonctionSure() noexcept {
    // le compilateur peut optimiser en sachant qu'aucune exception ne sortira d'ici
    // si une exception s'échappe malgré tout, le programme s'arrête immédiatement (std::terminate)
}
```

> **Best practice :** ne lever une exception que pour une situation réellement **exceptionnelle** (erreur imprévue, invariant violé) — jamais pour un flux de contrôle normal (une exception a un coût non négligeable à l'exécution comparé à un simple `if`, contrairement à un retour d'erreur classique).
