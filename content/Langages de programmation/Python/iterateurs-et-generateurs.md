---
order: 8
---

# Itérateurs et générateurs

Une boucle `for` fonctionne sur les listes, les dictionnaires, les fichiers, et bien d'autres objets, parce qu'ils implémentent tous le même **protocole d'itération**. Comprendre ce protocole permet de créer ses propres objets "parcourables", et d'utiliser les générateurs pour traiter de grandes quantités de données sans tout charger en mémoire.

## Le protocole d'itération

`for element in objet:` fonctionne en réalité ainsi, en coulisses :

```python
iterateur = iter(objet)       # appelle objet.__iter__()
while True:
    try:
        element = next(iterateur)  # appelle iterateur.__next__()
    except StopIteration:
        break
    # ... corps de la boucle avec "element" ...
```

Un objet est **itérable** s'il implémente `__iter__()` (renvoie un itérateur). Un **itérateur** implémente `__next__()` (renvoie l'élément suivant, ou lève `StopIteration` quand il n'y en a plus).

## Créer un itérateur personnalisé

```python
class Compteur:
    def __init__(self, limite):
        self.limite = limite
        self.actuel = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.actuel >= self.limite:
            raise StopIteration
        self.actuel += 1
        return self.actuel

for nombre in Compteur(5):
    print(nombre)   # 1 2 3 4 5
```

## Les générateurs : une façon plus simple d'écrire un itérateur

Une fonction contenant `yield` devient automatiquement un **générateur** : Python implémente pour elle tout le protocole `__iter__`/`__next__` vu ci-dessus, sans qu'il soit nécessaire d'écrire une classe.

```python
def compteur(limite):
    actuel = 0
    while actuel < limite:
        actuel += 1
        yield actuel

for nombre in compteur(5):
    print(nombre)   # 1 2 3 4 5
```

`yield` "met en pause" la fonction et renvoie une valeur, **sans perdre son état** : au prochain appel de `next()`, l'exécution reprend juste après le `yield`, avec toutes les variables locales intactes.

## Pourquoi utiliser un générateur plutôt qu'une liste

```python
def carres_liste(n):
    return [x ** 2 for x in range(n)]   # calcule et stocke TOUT en mémoire, d'un coup

def carres_generateur(n):
    for x in range(n):
        yield x ** 2                     # calcule UN SEUL élément à la fois, à la demande
```

Pour `n = 10_000_000`, `carres_liste()` alloue une liste de 10 millions d'éléments en mémoire **avant** de commencer à les utiliser. `carres_generateur()` ne produit qu'un élément à la fois, consommé puis oublié : la mémoire utilisée reste constante, quelle que soit la taille de `n`.

> **Note :** cette "évaluation paresseuse" (*lazy evaluation*) a un coût : un générateur ne peut être parcouru **qu'une seule fois** (une fois épuisé, une nouvelle boucle `for` dessus ne produit plus rien), contrairement à une liste qu'on peut reparcourir librement.

## Expression génératrice

Équivalent d'une compréhension de liste, mais paresseuse : remplacer les crochets par des parenthèses :

```python
carres = (x ** 2 for x in range(10))   # générateur, rien n'est encore calculé
liste_carres = [x ** 2 for x in range(10)]  # liste, tout est calculé immédiatement

sum(x ** 2 for x in range(1000000))    # calcule la somme SANS jamais stocker les 1M de valeurs
```

Voir aussi [Les fonctions](/?c=langages-de-programmation&s=python&p=fonctions) (closures) et [NumPy](/?c=data-science&p=numpy), où la distinction mémoire immédiate vs paresseuse redevient centrale à grande échelle.

## Générateur vs thread : un seul flux à la fois

Un générateur donne parfois l'impression de "faire deux choses en même temps" (le code appelant, et le générateur qui progresse en arrière-plan). C'est trompeur : contrairement à un thread (voir [Les threads (pthread)](/?c=langages-de-programmation&s=c&p=threads)), où deux flux d'exécution peuvent réellement avancer en parallèle sans se coordonner explicitement, un générateur ne fait jamais rien "en arrière-plan".

`next()` est un appel de fonction comme un autre : il **bloque** le code appelant jusqu'à ce que le générateur atteigne le `yield` suivant (ou se termine). Un seul des deux flux avance à un instant donné, jamais les deux en même temps :

```python
def taches():
    print("Démarrage")
    yield "A"
    print("Reprise après A")
    yield "B"

t = taches()
print("Avant le premier next")
print(next(t))     # "Démarrage" s'affiche ICI, au moment de l'appel, pas avant, pas en arrière-plan
print("Avant le deuxième next")
print(next(t))     # "Reprise après A" s'affiche ICI, jamais entre-temps
```

L'ordre d'affichage est **entièrement déterministe** et reproductible à chaque exécution, à l'inverse de deux threads indépendants, dont l'ordre d'exécution relatif n'est pas prévisible sans synchronisation explicite (mutex, `pthread_join`...). C'est pour ça qu'on parle de **coroutine** plutôt que de parallélisme pour décrire `yield` : la fonction "coopère" avec son appelant en lui rendant explicitement la main à chaque `yield`, au lieu d'être interrompue de force par un ordonnanceur comme le ferait un thread.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un objet itérable implémente `__iter__`, un itérateur `__next__`. Une fonction avec `yield` devient un générateur : paresseux, mémoire constante, mais parcourable une seule fois. |
| **Outils utilisables** | `iter()`/`next()`, `yield`, expression génératrice (`(x for x in ...)`). |
| **Pièges à éviter** | Réutiliser un générateur déjà épuisé, en s'attendant à ce qu'il reproduise ses valeurs. |
| **Bonnes pratiques** | Préférer un générateur à une liste dès que la collection est grande et parcourue une seule fois séquentiellement. |
