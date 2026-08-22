---
order: 11
---

# Les cast en C++

Convertir une valeur d'un type vers un autre s'appelle un **cast**. En C, une seule syntaxe existe : `(type)valeur`. C++ en propose quatre distinctes, chacune réservée à une intention précise : cette précision permet au compilateur (et à un futur lecteur du code) de savoir immédiatement quelle sorte de conversion est en jeu, plutôt que de le deviner.

## Pourquoi pas simplement `(type)valeur` ?

Le cast à la C effectue **silencieusement** n'importe quelle conversion demandée, même les plus risquées (retirer un `const`, réinterpréter des octets, descendre dans une hiérarchie de classes sans vérification), sans distinction visible entre une conversion anodine et une conversion dangereuse :

```cpp
int entier = 65;
char lettre = (char)entier;          // conversion numérique anodine
const char *texte = "salut";
char *modifiable = (char *)texte;    // retire un "const" : bien plus risqué, mais syntaxe identique
```

Les quatre cast C++ rendent cette distinction explicite, et surtout **recherchable** : `grep -r "reinterpret_cast"` trouve immédiatement tous les endroits à risque d'un projet, ce qu'un cast à la C ne permet pas.

## `static_cast` : les conversions connues à la compilation

`static_cast` couvre les conversions "normales", dont la validité peut être vérifiée par le compilateur sans information supplémentaire à l'exécution : conversions numériques, conversion explicite vers un type dont un constructeur existe, ou remontée (*upcast*) dans une [hiérarchie de classes](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme) (d'une classe dérivée vers sa classe de base).

```cpp
double prix = 19.99;
int arrondi = static_cast<int>(prix); // conversion numérique explicite

Derivee derivee;
Base *base = static_cast<Base *>(&derivee); // upcast : toujours valide
```

## `dynamic_cast` : la descente sécurisée dans une hiérarchie

Descendre (*downcast*) d'une classe de base vers une classe dérivée est risqué : le pointeur de base peut, en réalité, pointer vers n'importe quelle classe dérivée de la hiérarchie, pas forcément celle visée. `dynamic_cast` vérifie ce point **à l'exécution**, grâce au [RTTI](https://en.cppreference.com/w/cpp/language/rtti) (*Run-Time Type Information*, les informations de type conservées par les classes polymorphes) :

```cpp
Base *base = obtenirUnObjet(); // renvoie un pointeur vers un type dérivé inconnu à la compilation

Derivee *derivee = dynamic_cast<Derivee *>(base);
if (derivee != nullptr) {
    // le cast a réussi : "base" pointait bien vers une "Derivee"
} else {
    // le cast a échoué : "base" pointait vers un autre type dérivé
}
```

> **Note :** `dynamic_cast` exige que la classe de base contienne au moins une fonction `virtual` (voir [Héritage et polymorphisme](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme)) : sans elle, aucune information de type n'est disponible à l'exécution, et le compilateur refuse la compilation.

| Cible du `dynamic_cast` | En cas d'échec |
|---|---|
| Un pointeur (`Derivee *`) | Renvoie `nullptr` |
| Une référence (`Derivee &`) | Lève une [exception](/?c=langages-de-programmation&s=cpp&p=exceptions) `std::bad_cast` |

## `const_cast` : ajouter ou retirer un `const`

`const_cast` est le seul des quatre à ne **jamais** changer le type sous-jacent ni la représentation binaire de la valeur : il ajoute ou retire uniquement la qualification `const`.

```cpp
void ancienneAPI(char *chaine); // fonction externe qui ne modifie jamais "chaine", mais ne le déclare pas

void appeler(const char *texte)
{
    ancienneAPI(const_cast<char *>(texte)); // retire le "const" pour satisfaire la signature
}
```

> **Piège :** utiliser `const_cast` pour modifier une donnée qui était **réellement** déclarée `const` à l'origine (et non simplement passée par une signature de fonction mal déclarée) : le comportement est alors indéfini. `const_cast` ne se justifie que pour contourner une API externe imprécise, jamais pour modifier une vraie constante.

## `reinterpret_cast` : réinterpréter les octets bruts

`reinterpret_cast` est le plus dangereux des quatre : il réinterprète la représentation binaire d'une valeur comme si elle était d'un autre type, sans aucune vérification ni conversion réelle des données (contrairement à `static_cast`, qui convertit une vraie valeur numérique).

```cpp
int valeur = 42;
int *pointeurInt = &valeur;

uintptr_t adresseBrute = reinterpret_cast<uintptr_t>(pointeurInt); // le pointeur, vu comme un simple entier
```

Réservé aux cas bas niveau (manipulation de pointeurs bruts, interface avec du matériel, sérialisation binaire) : une utilisation en dehors de ce contexte est presque toujours le signe d'un problème de conception ailleurs.

## Vue d'ensemble

| Cast | Vérifié à | Usage typique |
|---|---|---|
| `static_cast` | La compilation | Conversions numériques, upcast dans une hiérarchie |
| `dynamic_cast` | L'exécution | Downcast sécurisé dans une hiérarchie polymorphe |
| `const_cast` | Ni l'un ni l'autre (pas de vérification) | Ajouter/retirer `const` pour une API externe |
| `reinterpret_cast` | Ni l'un ni l'autre (pas de vérification) | Réinterprétation bas niveau de la représentation binaire |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | C++ remplace le cast unique de C par 4 casts distincts, chacun réservé à une intention précise et recherchable dans le code. |
| **Outils utilisables** | `static_cast` (conversions sûres), `dynamic_cast` (downcast vérifié), `const_cast` (const), `reinterpret_cast` (bas niveau). |
| **Pièges à éviter** | Utiliser `const_cast` pour modifier une valeur réellement `const` (comportement indéfini) ; utiliser `reinterpret_cast` hors d'un contexte bas niveau justifié. |
| **Bonnes pratiques** | Toujours vérifier le résultat d'un `dynamic_cast` sur un pointeur (`nullptr` possible) ; préférer le cast le plus restrictif possible plutôt que `reinterpret_cast` par facilité. |
