---
order: 2
---

# Les espaces de noms (namespaces)

Un **espace de noms** (*namespace*) regroupe des identifiants (fonctions, classes, variables) sous un préfixe commun, pour éviter les collisions de noms entre différentes parties d'un projet ou différentes bibliothèques : le même besoin que les namespaces PHP, dont [l'autoloading](/?c=langages-de-programmation&s=php&p=autoloading) montre un usage concret.

## Déclarer et utiliser un namespace

```cpp
namespace Facturation {
    class Facture {
    public:
        double montant;
    };

    double calculerTVA(double montant) {
        return montant * 0.20;
    }
}

Facturation::Facture f;                    // accès complet, via "::"
double tva = Facturation::calculerTVA(100);
```

## `using namespace` : importer sans préfixe

```cpp
using namespace Facturation;

Facture f;              // plus besoin du préfixe "Facturation::"
double tva = calculerTVA(100);
```

> **Note (best practice) :** `using namespace X;` en tête d'un fichier d'en-tête (`.h`) est généralement déconseillé : il impose cette importation à **tout** fichier qui inclut ce header, avec un risque de collision de noms qu'on ne maîtrise plus. Réserver `using namespace` à l'intérieur d'un fichier `.cpp` précis, jamais dans un header partagé.

## `std` : le namespace de la bibliothèque standard

```cpp
std::vector<int> nombres;  // "vector" vit dans le namespace "std", d'où le préfixe
std::cout << "Bonjour";    // idem pour "cout"
```

```cpp
// Dans un AUTRE bloc/fichier, après "using namespace std;" :
using namespace std;          // rend "vector", "cout"... utilisables sans préfixe

vector<int> autresNombres;
cout << "Bonjour";
```

C'est exactement pour cette raison que tout le code des chapitres précédents (STL, exceptions...) utilise le préfixe `std::` : `vector`, `map`, `cout`, `runtime_error`... sont tous déclarés dans le namespace `std` de la bibliothèque standard.

## Import sélectif

```cpp
using std::cout;    // importe UNIQUEMENT "cout", pas tout le namespace std

cout << "Bonjour";  // fonctionne
vector<int> v;      // ERREUR : "vector" nécessite toujours std:: (pas importé)
```

Un compromis entre la lourdeur du préfixe systématique et le risque d'un `using namespace` complet : n'importer que ce qui est réellement utilisé, nommément.

## Namespaces imbriqués

```cpp
namespace Entreprise {
    namespace Facturation {
        class Facture { /* ... */ };
    }
}

// équivalent plus concis depuis C++17 :
namespace Entreprise::Facturation {
    class Facture { /* ... */ };
}

Entreprise::Facturation::Facture f;
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un namespace regroupe des identifiants sous un préfixe (`Namespace::identifiant`) pour éviter les collisions de noms. `using namespace` importe sans préfixe ; `using X::y` importe sélectivement. |
| **Outils utilisables** | `namespace`, `using namespace`, import sélectif (`using std::cout`), namespaces imbriqués (`A::B`). |
| **Pièges à éviter** | Écrire `using namespace X;` dans un header : impose cette importation à tout fichier qui l'inclut. |
| **Bonnes pratiques** | Réserver `using namespace` à l'intérieur d'un fichier `.cpp`, jamais dans un header partagé. |
