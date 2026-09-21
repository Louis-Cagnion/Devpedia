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

> **Note :** `std::vector` est, en interne, un tableau contigu en mémoire (voir [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs) et [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire)) qui se redimensionne automatiquement (souvent en doublant sa capacité) quand il est plein : le même principe qu'une [liste Python](/?c=langages-de-programmation&s=python&p=listes-et-tuples) ou un [`ArrayList`](https://docs.oracle.com/en/java/) Java, mais sans la couche d'indirection d'un langage à ramasse-miettes.

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
// teste l'existence d'une clé (pas d'opérateur "in" direct en C++)
ages.find("Ali") != ages.end();

for (const auto &[nom, age] : ages) {  // parcours : les paires sont TOUJOURS triées par clé
    std::cout << nom << " : " << age << "\n";
}
```

> **Note :** `std::map` est en interne un arbre équilibré (souvent un [arbre rouge-noir](https://en.wikipedia.org/wiki/Red%E2%80%93black_tree), une variante de [l'arbre binaire de recherche](/?c=langages-de-programmation&s=c&p=arbres-binaires)) : les clés sont donc toujours parcourues **triées**, contrairement à un [tableau associatif PHP](/?c=langages-de-programmation&s=php&p=variables) ou un [`dict` Python](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles) (ordre d'insertion). `std::unordered_map` propose l'équivalent basé sur une [table de hachage](/?c=langages-de-programmation&s=c&p=tables-de-hachage), plus rapide en moyenne mais sans ordre garanti.

## Trouver la clé la plus proche : `lower_bound`

`std::map` maintient ses clés triées (vu plus haut) : `lower_bound(clé)` exploite directement ce tri pour trouver, en O(log n), le premier élément dont la clé n'est **pas inférieure** à celle recherchée, sans jamais parcourir la totalité du conteneur :

```cpp
std::map<int, std::string> taux = {{10, "A"}, {20, "B"}, {30, "C"}};

auto it = taux.lower_bound(20);   // trouve exactement 20 : it->second == "B"
auto it2 = taux.lower_bound(25);  // pas de 25 : renvoie le premier élément >= 25, donc 30
```

Si la clé exacte n'existe pas, `lower_bound` renvoie donc la première clé strictement supérieure. Pour trouver la dernière clé strictement **inférieure** à une valeur (utile par exemple pour associer une date à la donnée valide la plus proche avant elle), décrémenter l'itérateur obtenu :

```cpp
auto it = taux.lower_bound(25);
if (it != taux.begin()) {
    --it;   // it pointe maintenant sur 20, la dernière clé strictement inférieure à 25
}
```

> **Piège :** décrémenter l'itérateur sans vérifier au préalable qu'il n'est pas déjà `begin()` : reculer avant le premier élément est un comportement indéfini.
>
> **Bonne pratique :** `lower_bound`/son complément `upper_bound` (première clé strictement supérieure) évitent un parcours linéaire manuel dès qu'il faut chercher une clé la plus proche dans un conteneur trié, bien plus direct qu'une boucle `for` avec comparaisons.

## `std::set` : les valeurs uniques, ordonnées

```cpp
#include <set>

std::set<int> valeurs = {3, 1, 2, 1};   // {1, 2, 3} -> trié ET dédupliqué automatiquement

valeurs.insert(4);
valeurs.count(2);   // 1 si présent, 0 sinon (un set ne contient jamais de doublon)
```

`std::unordered_set` est l'équivalent basé sur une table de hachage, plus rapide en moyenne, sans ordre garanti.

## `std::stack` : un adaptateur de conteneur

Contrairement à `std::vector`/`std::map`, qui sont des conteneurs à part entière, `std::stack` est un **adaptateur de conteneur** (*container adapter*) : il ne stocke rien lui-même, mais enveloppe un autre conteneur (par défaut `std::deque`) en n'exposant que les opérations LIFO (voir [Pile et file](/?c=fondamentaux&s=algorithmes&p=pile-et-file)) :

```cpp
#include <stack>

std::stack<int> pile;
pile.push(1);
pile.push(2);
pile.top();    // 2 : le sommet, sans le retirer
// retire le sommet (ne renvoie RIEN, contrairement à beaucoup d'autres langages)
pile.pop();
```

Volontairement dépourvu d'itérateurs (pas de `begin()`/`end()`) : parcourir une pile autrement que par son sommet n'a normalement pas de sens.

> **Bonne pratique :** hériter publiquement de `std::stack<T>` pour ajouter ses propres `begin()`/`end()`, délégués directement au conteneur sous-jacent (accessible via le membre protégé `c`), si un besoin réel justifie de parcourir une pile malgré tout :

```cpp
template <typename T>
class PileIterable : public std::stack<T> {
public:
    auto begin() { return this->c.begin(); }
    auto end() { return this->c.end(); }
};
```

`this->c` (le conteneur sous-jacent, `std::deque` par défaut) reste normalement inaccessible depuis l'extérieur de `std::stack` : cette technique en profite directement depuis une classe fille, qui hérite du même accès `protected`.

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
| **À retenir** | La STL fournit des conteneurs génériques prêts à l'emploi : `vector` (tableau dynamique), `list` (liste doublement chaînée), `map`/`set` (triés), `unordered_map`/`unordered_set` (table de hachage, plus rapides mais non triés). `std::stack` est un adaptateur, pas un conteneur à part entière. |
| **Outils utilisables** | `push_back`/`push_front`, `size`, `find`, parcours for-each. `lower_bound`/`upper_bound` pour chercher la clé la plus proche dans un `map` trié. |
| **Pièges à éviter** | Choisir `vector` pour des insertions fréquentes en tête (coût `O(n)`, `list` serait en temps constant). Décrémenter un itérateur `lower_bound` sans vérifier qu'il n'est pas déjà `begin()`. |
| **Bonnes pratiques** | Choisir le conteneur selon l'opération dominante (accès par index, insertion fréquente, association triée...) plutôt que par habitude. |
