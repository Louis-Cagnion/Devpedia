# C++

C++ est né comme une extension du [C](/?c=langages-de-programmation&s=c&p=c) ("C with Classes"), et reste rétro-compatible avec la quasi-totalité de ce langage : presque tout ce qui s'y applique (pointeurs, mémoire, structs, compilation) fonctionne directement en C++.

```cpp
#include <iostream>

int main() {
    int age = 25;                  // une variable, exactement comme en C
    std::cout << age << std::endl;  // affiche : 25
}
```

Ce que C++ ajoute par-dessus le C :

| Terme | Ce que ça veut dire |
|---|---|
| Programmation orientée objet | Organiser le code autour d'objets qui regroupent des données et les fonctions qui les manipulent (voir [Classes et objets](/?c=langages-de-programmation&s=cpp&p=classes-et-objets)) |
| RAII | Une ressource (mémoire, fichier...) est libérée automatiquement quand l'objet qui la détient est détruit, voir [Gestion mémoire et RAII](/?c=langages-de-programmation&s=cpp&p=gestion-memoire-raii), qui limite drastiquement les fuites mémoire possibles en C |
| Templates | Écrire une fonction ou une classe une seule fois, valable pour plusieurs types différents, sans sacrifier les performances, voir [Les templates](/?c=langages-de-programmation&s=cpp&p=templates) |

C++ garde ainsi le contrôle bas niveau du C (mémoire, performance, absence de ramasse-miettes) tout en offrant des outils de plus haut niveau pour structurer un projet de grande taille : un compromis qui explique sa présence durable dans les moteurs de jeux et les systèmes embarqués exigeants.

> **Note :** contrairement à [Python](/?c=langages-de-programmation&s=python&p=python) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), C++ reste **compilé** vers du code machine natif (voir [La compilation](/?c=langages-de-programmation&s=c&p=compilation)) : aucune machine virtuelle, aucun interpréteur entre le code et son exécution.
