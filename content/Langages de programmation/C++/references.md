---
order: 1
---

# Les références

Une **référence** est un alias — un autre nom pour une variable déjà existante, jamais une variable indépendante. Elle résout un problème très concret du C : passer une variable à une fonction pour qu'elle puisse la modifier obligeait jusque-là à manipuler explicitement des [pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs).

## Déclarer une référence

```cpp
int age = 25;
int &refAge = age;   // refAge est un AUTRE NOM pour age, pas une copie

refAge = 30;
std::cout << age;    // 30 -> modifier refAge modifie directement age
```

> **Note :** contrairement à un pointeur, une référence **doit** être initialisée dès sa déclaration, et ne peut ensuite **jamais** être réassignée pour désigner une autre variable — une fois liée à `age`, `refAge` restera un alias de `age` pour toute sa durée de vie.

## Passer par référence à une fonction

```cpp
void incrementer(int &nombre) {
    nombre++;   // pas besoin de déréférencer avec *, contrairement à un pointeur en C
}

int x = 5;
incrementer(x);
std::cout << x;   // 6
```

Comparé à [l'équivalent C](/?c=langages-de-programmation&s=c&p=pointeurs) :

```c
void incrementer(int *nombre) {
    (*nombre)++;
}
incrementer(&x);
```

La référence évite la syntaxe `*`/`&` à l'appel et à l'intérieur de la fonction, tout en obtenant exactement le même comportement (modifier la variable de l'appelant).

## `const &` : éviter une copie sans risquer une modification

Passer un gros objet par valeur (une copie complète) à chaque appel de fonction coûte du temps et de la mémoire. Passer par référence évite la copie, mais autorise la fonction à modifier l'original — `const &` combine les deux avantages :

```cpp
void afficher(const std::string &texte) {   // pas de copie, ET texte ne peut pas être modifié ici
    std::cout << texte;
}
```

> **Note :** c'est devenu la convention par défaut en C++ pour passer un objet volumineux (chaîne, vecteur, structure...) en lecture seule à une fonction — plus rapide qu'une copie, plus sûr qu'un pointeur brut (pas de risque de `nullptr`, pas de syntaxe de déréférencement à gérer).

## Référence vs pointeur

| | Référence | Pointeur |
|---|---|---|
| Peut être `null` | Non, jamais | Oui (`nullptr`) |
| Réassignable après initialisation | Non | Oui |
| Syntaxe d'accès | Directe, comme la variable elle-même | Nécessite `*` pour déréférencer |
| Doit être initialisé à la déclaration | Oui, obligatoire | Non |

Une référence est donc plus contrainte qu'un pointeur — c'est précisément ce qui la rend plus sûre dans les cas où ces contraintes n'ont pas besoin d'être contournées (on sait déjà que la variable existe et qu'elle ne changera pas de cible).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une référence est un alias d'une variable existante — jamais `null`, jamais réassignable après initialisation, pas de syntaxe `*`/`&` à l'usage. `const &` passe un objet volumineux sans copie ni risque de modification. |
| **Outils utilisables** | `&` en déclaration de type (référence), `const &` pour un paramètre en lecture seule. |
| **Pièges à éviter** | Croire qu'une référence peut être `null` ou réassignée comme un pointeur — les deux sont impossibles. |
| **Bonnes pratiques** | Passer un objet volumineux par `const &` par défaut, plutôt que par valeur (copie coûteuse) ou par pointeur brut. |
