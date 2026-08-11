---
order: 7
---

# RAII et les pointeurs intelligents

En C (voir [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire)), chaque `malloc()` doit être suivi d'un `free()` manuel : oublié une seule fois, c'est une fuite mémoire ; appelé deux fois, un crash. **RAII** (*Resource Acquisition Is Initialization*) est le principe central de C++ pour éliminer cette classe entière de bugs, en s'appuyant sur un mécanisme déjà vu : le destructeur (voir [Les classes et objets](/?c=langages-de-programmation&s=cpp&p=classes-et-objets)).

## Le principe RAII

Une ressource (mémoire, fichier, connexion réseau...) est acquise dans le **constructeur** d'un objet, et libérée automatiquement dans son **destructeur** ; quand l'objet sort de portée, la ressource est forcément libérée, sans qu'il soit possible d'oublier ce nettoyage :

```cpp
class GestionnaireFichier {
public:
    GestionnaireFichier(const std::string &chemin) {
        fichier.open(chemin);
        if (!fichier.is_open()) {
            throw std::runtime_error("Impossible d'ouvrir : " + chemin); // voir Les exceptions
        }
    }
    ~GestionnaireFichier() { fichier.close(); }   // appelé automatiquement, même en cas d'exception !
private:
    std::ifstream fichier;
};

void traiterFichier() {
    GestionnaireFichier gf("donnees.txt");
    // ... utiliser gf ...
}   // <- ici, ~GestionnaireFichier() s'exécute automatiquement : le fichier est fermé, garanti
```

> **Note :** contrairement à un simple `close()` appelé manuellement en fin de fonction, RAII garantit la libération même si une exception interrompt la fonction en plein milieu : le destructeur s'exécute pendant le "déroulement de la pile" (*stack unwinding*) causé par l'exception, là où un appel manuel serait tout simplement sauté.

## `new`/`delete` : la version C++ de `malloc`/`free`

```cpp
int *p = new int(42);   // alloue ET initialise en une seule opération
delete p;                 // libère

int *tableau = new int[10];   // alloue un tableau dynamique
delete[] tableau;               // "[]" obligatoire pour libérer un tableau, sinon comportement indéfini
```

`new`/`delete` remplacent `malloc`/`free` mais souffrent exactement des mêmes risques (oubli de `delete`, double `delete`, *use-after-free*, voir [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire) en C) : c'est pour ça qu'en C++ moderne, on les utilise rarement **directement**.

## Les pointeurs intelligents (*smart pointers*)

Un pointeur intelligent applique RAII à la gestion mémoire elle-même : il **est** un objet, dont le destructeur appelle automatiquement `delete` sur la ressource qu'il possède.

### `unique_ptr` : propriété exclusive

```cpp
#include <memory>

std::unique_ptr<int> p = std::make_unique<int>(42);
std::cout << *p;   // 42 -> se déréférence comme un pointeur brut

// PAS besoin de delete : quand p sort de portée, la mémoire est libérée automatiquement
```

Un `unique_ptr` ne peut avoir qu'un **seul** propriétaire ; le copier est interdit (erreur de compilation), seul le déplacement (`std::move`) est possible, qui transfère la propriété d'un `unique_ptr` à un autre :

```cpp
std::unique_ptr<int> p1 = std::make_unique<int>(42);
std::unique_ptr<int> p2 = std::move(p1);   // p2 devient propriétaire, p1 devient nullptr
```

### `shared_ptr` : propriété partagée, avec comptage de références

```cpp
std::shared_ptr<int> p1 = std::make_shared<int>(42);
std::shared_ptr<int> p2 = p1;   // OK, copie autorisée : p1 ET p2 partagent la même ressource

// la mémoire n'est libérée que lorsque le DERNIER shared_ptr la référençant est détruit
```

Chaque `shared_ptr` incrémente un compteur de références partagé ; la ressource n'est libérée automatiquement que lorsque ce compteur retombe à zéro.

> **Note :** `shared_ptr` a un coût (le compteur de références, mis à jour de façon **thread-safe** : sans risque de [race condition](/?c=langages-de-programmation&s=c&p=threads) si plusieurs threads le modifient en même temps) supérieur à `unique_ptr` : à réserver aux cas où une ressource a réellement plusieurs propriétaires légitimes, pas par défaut.

## Résumé

| | `new`/`delete` brut | `unique_ptr` | `shared_ptr` |
|---|---|---|---|
| Libération automatique | Non | Oui | Oui |
| Nombre de propriétaires | N/A | Un seul | Plusieurs |
| Coût | Minimal | Quasi nul (pas de surcoût à l'exécution) | Comptage de références (léger surcoût) |

> **Best practice C++ moderne :** ne jamais utiliser `new`/`delete` directement dans du code applicatif ; préférer systématiquement `unique_ptr` (par défaut) ou `shared_ptr` (si le partage est réellement nécessaire), pour bénéficier de RAII sans y penser à chaque fois.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | RAII lie l'acquisition d'une ressource au constructeur et sa libération au destructeur : la ressource est forcément libérée dès que l'objet sort de portée, même en cas d'exception. `unique_ptr`/`shared_ptr` appliquent ce principe à la mémoire. |
| **Outils utilisables** | `unique_ptr` (propriété exclusive), `shared_ptr` (propriété partagée, comptage de références), `std::move`. |
| **Pièges à éviter** | Utiliser `new`/`delete` directement dans du code applicatif moderne : mêmes risques que `malloc`/`free` (fuite, double libération, use-after-free). |
| **Bonnes pratiques** | Préférer systématiquement `unique_ptr` par défaut, `shared_ptr` seulement si un partage réel est nécessaire. |
