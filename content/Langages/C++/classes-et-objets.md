---
order: 3
---

# Les classes et objets

Une **classe** C++ regroupe ce qu'un [`struct` C](/?c=langages-de-programmation&s=c&p=variables) sépare en deux : les données ET les fonctions qui les manipulent, au même endroit, avec en plus un contrôle explicite de ce qui est visible depuis l'extérieur.

## Déclarer une classe

```cpp
class Vehicule {
public:
    // const& : évite de copier les chaînes reçues (voir Les références)
    Vehicule(const std::string &marque, const std::string &modele) : marque(marque), modele(modele) {}

    std::string description() const {
        return marque + " " + modele;
    }

private:
    std::string marque;
    std::string modele;
};

Vehicule v("Peugeot", "308");
std::cout << v.description();   // "Peugeot 308"
```

- `public` : accessible depuis l'extérieur de la classe.
- `private` : accessible uniquement depuis l'intérieur de la classe (les méthodes de `Vehicule`).
- `protected` : comme `private`, mais aussi accessible aux classes qui héritent de celle-ci (voir [Héritage et polymorphisme](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme)).

> **Note :** contrairement à un `struct` C (où toutes les données sont libres d'accès), une classe C++ cache par défaut ses membres (`private` implicite) : c'est l'**encapsulation**, l'extérieur n'interagit qu'avec ce que la classe expose volontairement.

## Le constructeur, sous deux écritures

```cpp
// Liste d'initialisation (préférée) : initialise directement, sans passer par une affectation
Vehicule(std::string marque, std::string modele) : marque(marque), modele(modele) {}

// Équivalent avec affectation dans le corps (fonctionne, mais moins idiomatique)
Vehicule(std::string marque, std::string modele) {
    this->marque = marque;
    this->modele = modele;
}
```

La liste d'initialisation (après le `:`) construit directement chaque membre avec la bonne valeur, plutôt que de le construire une première fois (valeur par défaut), puis de l'écraser dans le corps du constructeur : un détail de performance qui devient significatif pour des objets coûteux à construire.

## Le destructeur

```cpp
class GestionnaireFichier {
public:
    GestionnaireFichier(const std::string &chemin) {
        fichier.open(chemin);
    }

    ~GestionnaireFichier() {   // appelé AUTOMATIQUEMENT quand l'objet sort de portée
        fichier.close();
    }

private:
    std::ifstream fichier;
};
```

Le destructeur (`~NomClasse()`) s'exécute automatiquement dès que l'objet est détruit (fin de portée pour un objet local, `delete` pour un objet alloué dynamiquement) : c'est la base du mécanisme [RAII](/?c=langages-de-programmation&s=cpp&p=gestion-memoire-raii), central en C++ pour ne jamais oublier de libérer une ressource.

## La forme canonique orthodoxe (Rule of Three)

Une classe qui gère elle-même une ressource (mémoire allouée dynamiquement, fichier ouvert...) doit définir quatre membres spéciaux ensemble, jamais seulement certains d'entre eux : le constructeur par défaut, le **constructeur de copie**, l'**opérateur d'affectation par copie**, et le destructeur (vu plus haut). Cette convention s'appelle la **forme canonique orthodoxe** (*Rule of Three*).

```cpp
class Tableau {
public:
    Tableau(int taille) : taille(taille), donnees(new int[taille]) {}

    // Constructeur de copie : construit un NOUVEL objet à partir d'un autre déjà existant
    Tableau(const Tableau &autre) : taille(autre.taille), donnees(new int[autre.taille]) {
        for (int i = 0; i < taille; i++) donnees[i] = autre.donnees[i];
    }

    // Opérateur d'affectation par copie : copie DANS un objet déjà construit
    Tableau &operator=(const Tableau &autre) {
        if (this != &autre) {   // protection contre l'auto-affectation (a = a)
            delete[] donnees;
            taille = autre.taille;
            donnees = new int[taille];
            for (int i = 0; i < taille; i++) donnees[i] = autre.donnees[i];
        }
        return *this;   // permet l'enchaînement : a = b = c
    }

    ~Tableau() { delete[] donnees; }

private:
    int taille;
    int *donnees;
};
```

Sans constructeur de copie ni opérateur d'affectation explicites, C++ en génère des versions par défaut qui copient chaque membre **tel quel** (une copie superficielle) : pour un pointeur comme `donnees`, cela copie l'adresse, jamais les données pointées. Deux objets se retrouveraient alors à partager le même bloc mémoire, et le premier destructeur appelé libérerait une mémoire que l'autre objet croit toujours valide.

> **Piège :** oublier la vérification `this != &autre` dans l'opérateur d'affectation. Sur une **auto-affectation** (`a = a`), `delete[] donnees` libérerait la mémoire avant que la boucle ne tente de la relire depuis elle-même : un use-after-free sur ses propres données.
>
> **Bonne pratique :** implémenter les quatre membres ensemble dès qu'un seul est nécessaire, jamais un sous-ensemble : un constructeur de copie sans opérateur d'affectation correspondant (ou l'inverse) est un signal fort d'oubli, pas un choix délibéré.

## Méthodes `const`

```cpp
std::string description() const {   // "const" ici : garantit que cette méthode NE modifie PAS l'objet
    return marque + " " + modele;
}
```

Marquer une méthode `const` documente et fait respecter par le compilateur qu'elle ne modifie aucun membre de l'objet : utile en particulier pour permettre l'appel de cette méthode sur un objet lui-même déclaré `const`.

## Membres et méthodes statiques

```cpp
class Compteur {
public:
    Compteur() { totalCrees++; }
    static int totalCrees;   // partagé par TOUTES les instances, pas une par objet
};

int Compteur::totalCrees = 0;   // définition obligatoire en dehors de la classe
```

Voir aussi [Héritage et polymorphisme](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme) et [La surcharge d'opérateurs](/?c=langages-de-programmation&s=cpp&p=surcharge-d-operateurs), pour étendre le comportement d'une classe au-delà de simples méthodes nommées.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une classe regroupe données et méthodes, avec un contrôle d'accès (`public`/`private`/`protected`). Le constructeur initialise l'objet, le destructeur libère ses ressources automatiquement à la fin de sa portée. |
| **Outils utilisables** | Liste d'initialisation (`: membre(valeur)`), méthodes `const`, membres/méthodes `static`. Constructeur de copie et opérateur d'affectation pour une classe qui gère une ressource. |
| **Pièges à éviter** | Oublier qu'une classe cache ses membres par défaut (`private` implicite), contrairement à un `struct` C entièrement public. Oublier la protection contre l'auto-affectation dans `operator=`. |
| **Bonnes pratiques** | Préférer la liste d'initialisation à une affectation dans le corps du constructeur ; marquer `const` toute méthode qui ne modifie pas l'objet. Implémenter les quatre membres de la forme canonique ensemble, jamais un sous-ensemble. |
