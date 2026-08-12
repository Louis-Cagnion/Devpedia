---
order: 8
---

# La STL : les conteneurs

La **STL** (*Standard Template Library*) fournit des structures de données génériques (voir [Les templates](/?c=langages-de-programmation&s=cpp&p=templates)), prêtes à l'emploi, plutôt que de réimplémenter à la main une [liste chaînée](/?c=langages-de-programmation&s=c&p=listes-chainees) ou une [table de hachage](/?c=langages-de-programmation&s=c&p=tables-de-hachage), la quasi-totalité des projets C++ modernes s'appuient sur ces conteneurs standard.

## `std::vector` : le tableau dynamique

```cpp
#include <vector>

std::vector<int> nombres = {1, 2, 3};

nombres.push_back(4);  // ajoute à la fin
nombres[0];            // accès direct par index, comme un tableau C
nombres.size();        // nombre d'éléments
nombres.pop_back();    // retire le dernier élément

for (int n : nombres) {  // parcours simple, comme un for-each
    std::cout << n << " ";
}
```

> **Note :** `std::vector` est, en interne, un tableau contigu en mémoire (voir [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs) et [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire)) qui se redimensionne automatiquement (souvent en doublant sa capacité) quand il est plein : le même principe qu'une liste Python ou un `ArrayList` Java, mais sans la couche d'indirection d'un langage à ramasse-miettes.

## `std::list` : la liste doublement chaînée

```cpp
#include <list>

std::list<int> liste = {1, 2, 3};
liste.push_front(0);   // insertion en tête en temps constant -> std::vector serait en O(n) ici
```

Contrairement à `std::vector`, insérer au milieu ou en tête d'une `std::list` ne nécessite aucun déplacement des autres éléments (voir [Les listes chaînées](/?c=langages-de-programmation&s=c&p=listes-chainees)), au prix d'un accès par index impossible en temps constant (`liste[2]` n'existe pas, il faut parcourir).

## `std::map` : le dictionnaire ordonné

```cpp
#include <map>

std::map<std::string, int> ages;
ages["Jean"] = 25;
ages["Marie"] = 30;

ages["Jean"];                    // 25
ages.find("Ali") != ages.end();  // teste l'existence d'une clé (pas d'opérateur "in" direct en C++)

for (const auto &[nom, age] : ages) {  // parcours : les paires sont TOUJOURS triées par clé
    std::cout << nom << " : " << age << "\n";
}
```

> **Note :** `std::map` est en interne un arbre équilibré (souvent un arbre rouge-noir, une variante de [l'arbre binaire de recherche](/?c=langages-de-programmation&s=c&p=arbres-binaires)) : les clés sont donc toujours parcourues **triées**, contrairement à un tableau associatif PHP ou un `dict` Python (ordre d'insertion). `std::unordered_map` propose l'équivalent basé sur une [table de hachage](/?c=langages-de-programmation&s=c&p=tables-de-hachage), plus rapide en moyenne mais sans ordre garanti.

## `std::set` : les valeurs uniques, ordonnées

```cpp
#include <set>

std::set<int> valeurs = {3, 1, 2, 1};   // {1, 2, 3} -> trié ET dédupliqué automatiquement

valeurs.insert(4);
valeurs.count(2);   // 1 si présent, 0 sinon (un set ne contient jamais de doublon)
```

`std::unordered_set` est l'équivalent basé sur une table de hachage, plus rapide en moyenne, sans ordre garanti.

## Choisir le bon conteneur

| Besoin | Conteneur |
|---|---|
| Accès rapide par index, ajout en fin de collection | `std::vector` |
| Insertions/suppressions fréquentes en milieu/début de collection | `std::list` |
| Association clé → valeur, ordre trié nécessaire | `std::map` |
| Association clé → valeur, ordre indifférent, vitesse prioritaire | `std::unordered_map` |
| Valeurs uniques, triées | `std::set` |
| Valeurs uniques, ordre indifférent, vitesse prioritaire | `std::unordered_set` |

Voir aussi [La STL : itérateurs, algorithmes et lambdas](/?c=langages-de-programmation&s=cpp&p=stl-algorithmes-et-iterateurs), qui permettent de manipuler n'importe lequel de ces conteneurs de façon uniforme.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La STL fournit des conteneurs génériques prêts à l'emploi : `vector` (tableau dynamique), `list` (liste doublement chaînée), `map`/`set` (triés), `unordered_map`/`unordered_set` (table de hachage, plus rapides mais non triés). |
| **Outils utilisables** | `push_back`/`push_front`, `size`, `find`, parcours for-each. |
| **Pièges à éviter** | Choisir `vector` pour des insertions fréquentes en tête (coût `O(n)`, `list` serait en temps constant). |
| **Bonnes pratiques** | Choisir le conteneur selon l'opération dominante (accès par index, insertion fréquente, association triée...) plutôt que par habitude. |
