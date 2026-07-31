---
order: 3
---

# Limiter les allers-retours

Quand deux composants communiquent (votre code et une base de données, votre code et un navigateur, un client et un serveur), chaque échange a un **coût fixe** indépendant de la quantité de données transportée : sérialisation, franchissement de processus, latence réseau. Ce coût est petit — quelques millisecondes — et c'est précisément ce qui le rend dangereux : il devient énorme par multiplication.

## Le motif à reconnaître

Le symptôme est toujours le même : une boucle qui, à chaque tour, redemande quelque chose à l'autre composant.

```python
# 3 allers-retours par annonce
for i in range(nombre_de_cartes):
    carte = page.element(i)              # 1
    lien = carte.attribut("href")        # 2
    texte = carte.texte()                # 3
```

Sur 100 éléments, cela fait 300 échanges. À 30 ms l'aller-retour, on atteint 9 secondes — pour un travail qui ne demande aucun calcul.

## Tout ramener en une fois

La correction consiste à déplacer la boucle **du côté où sont les données**, et à ne faire qu'un seul échange :

```python
# 1 aller-retour, quel que soit le nombre d'annonces
cartes = page.evaluer("""() => Array.from(document.querySelectorAll('article')).map(carte => ({
    href: carte.querySelector('a')?.getAttribute('href'),
    texte: carte.innerText,
}))""")

for carte in cartes:                      # traitement local, gratuit
    analyser(carte["href"], carte["texte"])
```

Le gain est **proportionnel au volume** : négligeable sur 10 éléments, décisif sur 1000. C'est une optimisation qui se justifie souvent moins par le gain immédiat que par le fait qu'elle supprime une pente : le programme cesse de ralentir linéairement quand les données grossissent.

## C'est le même problème que le N+1 en base de données

Ce motif porte un nom dans le monde des bases de données : le **problème N+1**. Une requête pour récupérer une liste, puis une requête par élément :

```php
$clients = $bdd->query("SELECT id, nom FROM clients")->fetchAll();
foreach ($clients as $client) {
    // 1 requete SQL par client : voila le "+N"
    $commandes = $bdd->query("SELECT * FROM commandes WHERE client_id = {$client['id']}");
}
```

La correction est structurellement identique — un seul échange qui ramène tout :

```sql
SELECT c.id, c.nom, cm.*
FROM clients c
LEFT JOIN commandes cm ON cm.client_id = c.id;
```

Voir la section [SQL](/?c=domain-specific-languages-dsl&p=sql) pour les jointures, et le chapitre [Connexions](/?c=langages-de-programmation&s=php&p=connexions) de PHP pour `PDO`.

> Au passage, écrire une requête par élément en concaténant une variable dans la chaîne SQL cumule deux problèmes : la lenteur **et** l'injection SQL. Les requêtes préparées règlent le second, la jointure le premier.

## Le même raisonnement ailleurs

Le motif se retrouve partout où il y a une frontière à franchir :

- **API HTTP** : privilégier un point d'entrée qui accepte une liste d'identifiants plutôt que d'appeler *n* fois le point d'entrée unitaire ;
- **Système de fichiers** : lire un fichier en une fois plutôt que caractère par caractère (c'est le rôle des tampons, voir [Appels système et descripteurs](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) en C) ;
- **DOM** : accumuler les modifications puis les appliquer, plutôt que de modifier le document dans une boucle — chaque écriture peut déclencher un recalcul de mise en page.

## Savoir quand ne pas le faire

Tout ramener en une fois a une limite : la **mémoire**. Une requête qui ramène un million de lignes d'un coup peut saturer la mémoire du processus, alors que la boucle naïve, elle, tenait. Entre les deux extrêmes se trouve le traitement **par lots** : mille éléments par échange plutôt qu'un seul ou un million.

```python
for lot in decouper_en_lots(identifiants, taille=1000):
    resultats = service.recuperer_plusieurs(lot)
```

La bonne question n'est donc pas "un seul échange ou *n* ?" mais "quel est le plus gros lot que je peux traiter sans risque ?".
