---
order: 10
---

# Les templates (programmation générique)

Un **template** permet d'écrire une fonction ou une classe **une seule fois**, valable pour n'importe quel type, sans sacrifier la vérification de type à la compilation ni les performances (contrairement à des langages dynamiquement typés comme [Python](/?c=langages-de-programmation&s=python&p=python) ou [PHP](/?c=langages-de-programmation&s=php&p=php)).

## Sans template : la duplication

```cpp
int maximum(int a, int b) { return (a > b) ? a : b; }
double maximum(double a, double b) { return (a > b) ? a : b; }
std::string maximum(std::string a, std::string b) { return (a > b) ? a : b; }
```

Trois fonctions strictement identiques dans leur logique, dupliquées uniquement à cause du type : exactement le genre de répétition qu'un template élimine (voir [Éviter la répétition par des structures indexées](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees), le principe DRY appliqué plus généralement).

## Template de fonction

```cpp
template <typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}

maximum(3, 7);                   // T déduit automatiquement comme int
maximum(3.5, 2.1);               // T déduit comme double
maximum<std::string>("a", "b");  // T précisé explicitement si nécessaire
```

Le compilateur **génère** une version distincte de la fonction pour chaque type réellement utilisé (`maximum<int>`, `maximum<double>`...) : c'est ce qu'on appelle l'instanciation de template, effectuée entièrement à la compilation, sans aucun coût à l'exécution.

## Template de classe

```cpp
template <typename T>
class Pile {
public:
    void empiler(T valeur) { elements.push_back(valeur); }
    T depiler() {
        if (estVide()) {
            throw std::out_of_range("Pile vide"); // voir Les exceptions : jamais dépiler à vide
        }
        T dernier = elements.back();
        elements.pop_back();
        return dernier;
    }
    bool estVide() const { return elements.empty(); }

private:
    std::vector<T> elements;
};

Pile<int> pileEntiers;
pileEntiers.empiler(42);

Pile<std::string> pileTextes;
pileTextes.empiler("bonjour");
```

Une seule définition de `Pile`, utilisable avec n'importe quel type : c'est exactement ainsi que sont construits [les conteneurs de la STL](/?c=langages-de-programmation&s=cpp&p=stl-conteneurs) (`std::vector<T>`, `std::map<K, V>`...).

## Contraintes sur le type (C++20 : `concepts`)

Sans contrainte, un template accepte n'importe quel type, y compris des types pour lesquels l'opération n'a pas de sens, produisant une erreur de compilation souvent longue et peu claire :

```cpp
template <typename T>
T addition(T a, T b) { return a + b; }

addition(2, 3);      // OK
addition("a", "b");  // Erreur de compilation potentiellement cryptique selon le type
```

Depuis C++20, les **concepts** permettent d'exprimer explicitement les exigences sur `T`, pour un message d'erreur plus clair et une intention de code plus lisible :

```cpp
template <typename T>
concept Numerique = std::is_arithmetic_v<T>;

template <Numerique T>
T addition(T a, T b) { return a + b; }
```

## Templates vs généricité dynamique (Python, PHP)

| | Templates C++ | Typage dynamique (Python/PHP) |
|---|---|---|
| Vérification de type | À la compilation | À l'exécution (ou jamais, selon le langage) |
| Coût à l'exécution | Nul (code généré spécifiquement pour chaque type) | Léger surcoût (vérifications de type en continu) |
| Détection d'erreur de type | Avant même de lancer le programme | Seulement en exécutant le chemin de code concerné |

Voir aussi [La STL : les conteneurs](/?c=langages-de-programmation&s=cpp&p=stl-conteneurs), qui repose entièrement sur ce mécanisme de templates.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un template écrit une fonction/classe une seule fois pour n'importe quel type, avec vérification à la compilation et sans coût à l'exécution (le compilateur génère une version par type utilisé). |
| **Outils utilisables** | `template <typename T>`, `concepts` (C++20) pour contraindre les types acceptés. |
| **Pièges à éviter** | Un template sans contrainte accepte n'importe quel type, y compris ceux pour lesquels l'opération n'a pas de sens : erreur de compilation parfois cryptique. |
| **Bonnes pratiques** | Utiliser les `concepts` (C++20) pour exprimer explicitement les exigences sur un type template, plutôt que de laisser un message d'erreur générique le découvrir. |
