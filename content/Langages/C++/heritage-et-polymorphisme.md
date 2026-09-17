---
order: 4
---

# Héritage et polymorphisme

L'**héritage** permet à une classe de réutiliser (et d'étendre ou de modifier) le comportement d'une autre. Le **polymorphisme** permet de traiter des objets de classes différentes de façon uniforme, à travers une interface commune : le mécanisme le plus puissant, et le plus souvent mal compris, de la POO en C++.

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

> **Piège classique :** sans le mot-clé `virtual`, C++ choisit quelle version de `parler()` appeler en se basant sur le **type déclaré** du pointeur (`Animal*`), pas sur le type réel de l'objet pointé (`Chien`) : un mécanisme appelé *liaison statique*. Le résultat semble "ignorer" l'héritage, ce qui surprend souvent en venant d'un langage comme [PHP](/?c=langages-de-programmation&s=php&p=poo), [Python](/?c=langages-de-programmation&s=python&p=poo) ou [Java](https://docs.oracle.com/en/java/), où ce comportement est automatique.

## Rendre une méthode polymorphique : `virtual`

```cpp
class Animal {
public:
    Animal(std::string nom) : nom(nom) {}
    virtual std::string parler() const { return "..."; }  // "virtual" active la LIAISON DYNAMIQUE
    virtual ~Animal() {}                                  // destructeur virtuel : voir note ci-dessous
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

`virtual` fait choisir la méthode à appeler en fonction du **type réel** de l'objet, résolu à l'exécution (*liaison dynamique*) plutôt qu'à la compilation ; c'est ce mécanisme qui permet le polymorphisme : une même ligne de code (`a->parler()`) se comporte différemment selon l'objet réellement pointé.

> **Note :** `override` (facultatif mais fortement recommandé) demande au compilateur de vérifier que cette méthode redéfinit bien une méthode `virtual` de la classe parente : une faute de frappe dans la signature (nombre de paramètres, `const` oublié...) devient alors une erreur de compilation, plutôt qu'un bug silencieux où la méthode parente continuerait d'être appelée sans qu'on s'en aperçoive.

## Pourquoi le destructeur doit aussi être `virtual`

```cpp
Animal *a = new Chien("Rex");
delete a;   // sans destructeur virtuel : SEUL ~Animal() est appelé, jamais ~Chien()
```

Sans `virtual` sur le destructeur, supprimer un objet `Chien` via un pointeur `Animal*` n'exécute que le destructeur de `Animal` : toute ressource propre à `Chien` (mémoire allouée, fichier ouvert...) ne serait jamais libérée. Toute classe destinée à être héritée et manipulée par pointeur de base doit donc systématiquement déclarer son destructeur `virtual`.

## L'héritage multiple et le problème du diamant

Une classe peut hériter de plusieurs classes à la fois :

```cpp
class A { public: void methode() {} };
class B : public A {};
class C : public A {};
class D : public B, public C {};   // hérite à la fois de B et de C
```

`D` hérite de `A` par deux chemins différents (via `B` et via `C`). Sans précaution, l'objet `D` contient alors **deux** sous-objets `A` distincts, un par chemin : appeler `d.methode()` devient ambigu, le compilateur ne sachant pas lequel des deux utiliser. C'est le **problème du diamant**, nommé d'après la forme du diagramme d'héritage.

```text
      A
     / \
    B   C
     \ /
      D
```

> **Bonne pratique :** déclarer l'héritage vers la classe commune comme **virtuel** (`class B : virtual public A {}`, et de même pour `C`) : le compilateur ne construit alors qu'un seul sous-objet `A`, partagé par les deux chemins, et `d.methode()` redevient sans ambiguïté.

Une ambiguïté résiduelle sur un nom hérité (deux méthodes de même nom venant de deux parents différents, par exemple) se résout par la **résolution de portée explicite** (`A::methode()`), qui force l'appel vers une classe précise plutôt que de laisser le compilateur choisir.

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

FormeGeometrique *forme = new Cercle(5);                // OK
FormeGeometrique *impossible = new FormeGeometrique();  // ERREUR : classe abstraite, non instanciable
```

Une classe contenant au moins une méthode purement virtuelle (`= 0`) devient **abstraite** : elle ne peut jamais être instanciée directement, seulement héritée : elle définit un contrat ("toute forme géométrique doit savoir calculer son aire") que chaque classe fille doit implémenter.

## Le pattern Prototype : cloner un objet polymorphe

Le constructeur de copie de C++ n'est jamais virtuel (il n'existe d'ailleurs pas de "constructeur virtuel" en C++) : copier un objet dont le type réel n'est connu qu'à l'exécution pose donc un problème.

```cpp
FormeGeometrique *forme = new Cercle(5);
FormeGeometrique *copie = new FormeGeometrique(*forme);   // NE copie que la partie FormeGeometrique !
```

`new FormeGeometrique(*forme)` construit un objet du type déclaré du pointeur (`FormeGeometrique`), jamais du type réel pointé (`Cercle`) : tout ce qui est spécifique à `Cercle` (ici, le rayon) est perdu, une conséquence directe de la liaison statique (voir "Le problème sans `virtual`" plus haut), appliquée cette fois à la construction plutôt qu'à un appel de méthode.

Le **design pattern Prototype** résout ce problème : chaque classe fille implémente une méthode `virtual` qui construit et renvoie une copie du bon type dynamique.

```cpp
class FormeGeometrique {
public:
    virtual FormeGeometrique *clone() const = 0;
    virtual ~FormeGeometrique() {}
};

class Cercle : public FormeGeometrique {
public:
    Cercle(double rayon) : rayon(rayon) {}
    Cercle *clone() const override { return new Cercle(*this); }   // construit un Cercle, pas un FormeGeometrique
private:
    double rayon;
};

FormeGeometrique *forme = new Cercle(5);
FormeGeometrique *copie = forme->clone();   // copie un VRAI Cercle, rayon inclus
```

Le code appelant se contente d'appeler `forme->clone()` sans jamais connaître le type concret : c'est `virtual` qui garantit que la bonne version de `clone()` s'exécute, exactement comme pour n'importe quelle autre méthode polymorphique.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'héritage réutilise le comportement d'une classe parente. `virtual` active la liaison dynamique (le type réel de l'objet décide de la méthode appelée), indispensable au polymorphisme. Une classe abstraite (méthode `= 0`) impose un contrat sans implémentation. L'héritage multiple peut créer un problème de diamant, résolu par un héritage virtuel. |
| **Outils utilisables** | `virtual`, `override`, destructeur `virtual`, classes abstraites. Héritage virtuel pour le problème du diamant ; méthode `clone()` virtuelle (pattern Prototype) pour copier un objet polymorphe. |
| **Pièges à éviter** | Oublier `virtual` sur une méthode censée être polymorphique (liaison statique silencieuse) ; oublier `virtual` sur le destructeur d'une classe destinée à être manipulée par pointeur de base (fuite de ressources) ; copier un objet polymorphe via `new Base(*ptr)`, qui tronque tout ce qui est spécifique à la classe fille. |
| **Bonnes pratiques** | Toujours déclarer `virtual` le destructeur d'une classe destinée à être héritée ; utiliser `override` systématiquement pour que le compilateur détecte une signature mal redéfinie. Déclarer un héritage virtuel dès qu'un diamant est possible. |
