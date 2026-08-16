---
order: 10
---

# La programmation orientée objet

Python est un langage orienté objet de bout en bout : même un `int` ou une `str` est en réalité un objet, instance d'une classe. La syntaxe des classes personnalisées ressemble à celle de [PHP](/?c=langages-de-programmation&s=php&p=php), avec une différence immédiate : `self` (l'équivalent de `$this`) est un paramètre **explicite** de chaque méthode, jamais implicite.

## Déclarer une classe

```python
class Vehicule:
    def __init__(self, marque, modele):
        self.marque = marque   # self.xxx : équivalent de $this->xxx en PHP
        self.modele = modele

    def description(self):
        return f"{self.marque} {self.modele}"

v = Vehicule("Peugeot", "308")
print(v.description())   # "Peugeot 308"
```

> **Note :** `self` doit être écrit explicitement comme **premier paramètre** de chaque méthode d'instance : Python le remplit automatiquement avec l'instance courante à l'appel (`v.description()` équivaut à `Vehicule.description(v)`), mais l'omettre dans la signature provoque une erreur.

## Attributs de classe vs attributs d'instance

```python
class Compteur:
    total_crees = 0   # attribut de CLASSE : partagé par toutes les instances

    def __init__(self):
        Compteur.total_crees += 1
        self.id = Compteur.total_crees   # attribut D'INSTANCE : propre à chaque objet

c1 = Compteur()
c2 = Compteur()
print(Compteur.total_crees)  # 2 -> partagé
print(c1.id, c2.id)          # 1 2 -> propre à chacun
```

## L'héritage

```python
class Animal:
    def __init__(self, nom):
        self.nom = nom

    def parler(self):
        return "..."

class Chien(Animal):
    def parler(self):
        return f"{self.nom} aboie"

class Chat(Animal):
    def parler(self):
        return f"{self.nom} miaule"

animaux = [Chien("Rex"), Chat("Félix")]
for animal in animaux:
    print(animal.parler())
```

`super()` permet d'appeler explicitement la méthode de la classe parente, par exemple pour l'étendre plutôt que la remplacer entièrement :

```python
class ChienDeGarde(Chien):
    def parler(self):
        return super().parler() + " bruyamment"
```

## Les méthodes spéciales (*dunder methods*)

Des méthodes au nom encadré de doubles underscores, appelées automatiquement par Python dans certains contextes :

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):           # appelé par repr(obj) et l'affichage en console/débogueur
        return f"Point({self.x}, {self.y})"

    def __str__(self):             # appelé par print(obj) et str(obj)
        return f"({self.x}, {self.y})"

    def __eq__(self, autre):       # appelé par "=="
        return self.x == autre.x and self.y == autre.y

    def __add__(self, autre):      # appelé par "+"
        return Point(self.x + autre.x, self.y + autre.y)

p1 = Point(1, 2)
p2 = Point(3, 4)
print(p1 + p2)            # (4, 6) -> grâce à __add__
print(p1 == Point(1, 2))  # True -> grâce à __eq__
```

| Méthode spéciale | Déclenchée par |
|---|---|
| `__init__` | `NomClasse(...)` (constructeur) |
| `__str__` | `print(obj)`, `str(obj)` |
| `__repr__` | Affichage en console/débogueur, `repr(obj)` |
| `__eq__` | `obj1 == obj2` |
| `__len__` | `len(obj)` |
| `__getitem__` | `obj[cle]` |

## `@property` : un attribut calculé, accédé sans parenthèses

```python
class Cercle:
    def __init__(self, rayon):
        self.rayon = rayon

    @property
    def surface(self):
        return 3.14159 * self.rayon ** 2

c = Cercle(5)
print(c.surface)   # 78.53975 -> accédé comme un attribut, PAS comme c.surface()
```

`@property` transforme une méthode en attribut en lecture, recalculé à chaque accès, utile pour exposer une valeur dérivée sans exiger que l'appelant sache que c'est en réalité un calcul.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | En Python, tout est objet. `self` est un paramètre explicite de chaque méthode. Les méthodes spéciales (`__init__`, `__str__`, `__eq__`...) définissent comment un objet réagit aux opérations natives (`+`, `==`, `print`...). |
| **Outils utilisables** | `super()` pour appeler la méthode parente, `@property` pour un attribut calculé, attributs de classe vs d'instance. |
| **Pièges à éviter** | Oublier `self` comme premier paramètre d'une méthode d'instance : provoque une erreur à l'appel. |
| **Bonnes pratiques** | Définir `__repr__` sur toute classe destinée à être affichée en débogage, pour une représentation lisible plutôt que l'adresse mémoire par défaut. |
