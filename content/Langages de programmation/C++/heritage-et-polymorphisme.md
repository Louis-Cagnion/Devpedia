---
order: 4
---

# Héritage et polymorphisme

L'**héritage** permet à une classe de réutiliser (et d'étendre ou de modifier) le comportement d'une autre. Le **polymorphisme** permet de traiter des objets de classes différentes de façon uniforme, à travers une interface commune — le mécanisme le plus puissant, et le plus souvent mal compris, de la POO en C++.

## Héritage simple

```cpp
class Animal {
public:
    Animal(std::string nom) : nom(nom) {}
    std::string parler() const { return "..."; }
protected:
    std::string nom;
};

class Chien : public Animal {
public:
    Chien(std::string nom) : Animal(nom) {}   // appelle explicitement le constructeur parent
    std::string parler() const { return nom + " aboie"; }
};
```

## Le problème sans `virtual`

```cpp
Animal *a = new Chien("Rex");
std::cout << a->parler();   // affiche "..." -> PAS "Rex aboie" !
```

> **Piège classique :** sans le mot-clé `virtual`, C++ choisit quelle version de `parler()` appeler en se basant sur le **type déclaré** du pointeur (`Animal*`), pas sur le type réel de l'objet pointé (`Chien`) — un mécanisme appelé *liaison statique*. Le résultat semble "ignorer" l'héritage, ce qui surprend souvent en venant d'un langage comme PHP, Python ou Java, où ce comportement est automatique.

## Rendre une méthode polymorphique : `virtual`

```cpp
class Animal {
public:
    Animal(std::string nom) : nom(nom) {}
    virtual std::string parler() const { return "..."; }   // "virtual" active la LIAISON DYNAMIQUE
    virtual ~Animal() {}   // destructeur virtuel : voir note ci-dessous
protected:
    std::string nom;
};

class Chien : public Animal {
public:
    Chien(std::string nom) : Animal(nom) {}
    std::string parler() const override { return nom + " aboie"; }   // "override" : vérifié par le compilateur
};

Animal *a = new Chien("Rex");
std::cout << a->parler();   // "Rex aboie" -> la BONNE version est appelée, grâce à "virtual"
delete a;
```

`virtual` fait choisir la méthode à appeler en fonction du **type réel** de l'objet, résolu à l'exécution (*liaison dynamique*) plutôt qu'à la compilation — c'est ce mécanisme qui permet le polymorphisme : une même ligne de code (`a->parler()`) se comporte différemment selon l'objet réellement pointé.

> **Note :** `override` (facultatif mais fortement recommandé) demande au compilateur de vérifier que cette méthode redéfinit bien une méthode `virtual` de la classe parente — une faute de frappe dans la signature (nombre de paramètres, `const` oublié...) devient alors une erreur de compilation, plutôt qu'un bug silencieux où la méthode parente continuerait d'être appelée sans qu'on s'en aperçoive.

## Pourquoi le destructeur doit aussi être `virtual`

```cpp
Animal *a = new Chien("Rex");
delete a;   // sans destructeur virtuel : SEUL ~Animal() est appelé, jamais ~Chien()
```

Sans `virtual` sur le destructeur, supprimer un objet `Chien` via un pointeur `Animal*` n'exécute que le destructeur de `Animal` — toute ressource propre à `Chien` (mémoire allouée, fichier ouvert...) ne serait jamais libérée. Toute classe destinée à être héritée et manipulée par pointeur de base doit donc systématiquement déclarer son destructeur `virtual`.

## Classes abstraites : imposer un contrat sans implémentation

```cpp
class FormeGeometrique {
public:
    virtual double aire() const = 0;   // "= 0" : fonction PUREMENT virtuelle, aucune implémentation ici
    virtual ~FormeGeometrique() {}
};

class Cercle : public FormeGeometrique {
public:
    Cercle(double rayon) : rayon(rayon) {}
    double aire() const override { return 3.14159 * rayon * rayon; }
private:
    double rayon;
};

FormeGeometrique *forme = new Cercle(5);   // OK
FormeGeometrique *impossible = new FormeGeometrique();   // ERREUR : classe abstraite, non instanciable
```

Une classe contenant au moins une méthode purement virtuelle (`= 0`) devient **abstraite** : elle ne peut jamais être instanciée directement, seulement héritée — elle définit un contrat ("toute forme géométrique doit savoir calculer son aire") que chaque classe fille doit implémenter.
