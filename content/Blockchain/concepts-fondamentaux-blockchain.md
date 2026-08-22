---
order: 1
---

# Concepts fondamentaux de la blockchain

Une banque tient un registre de qui possède quoi : quand vous payez quelqu'un, elle met à jour ses comptes, et vous lui faites confiance pour ne pas tricher. Une **blockchain** cherche à obtenir le même résultat, un registre fiable des transactions, mais sans banque ni autorité centrale : la confiance repose sur les règles du système lui-même, réparties entre des milliers d'ordinateurs indépendants.

## Le registre : une chaîne de blocs

Une blockchain est un registre (une liste de transactions) découpé en **blocs**. Chaque bloc contient un lot de transactions récentes, et surtout une référence au bloc précédent : c'est ce qui forme la « chaîne ».

| Élément | Rôle |
|---|---|
| **Bloc** | Un paquet de transactions validées, horodaté |
| **Hash** | Une empreinte numérique unique du bloc (voir plus bas) |
| **Chaîne** | Chaque bloc contient le hash du bloc précédent, les liant entre eux dans l'ordre |

```text
Bloc 1                Bloc 2                Bloc 3
[transactions]        [transactions]        [transactions]
[hash du bloc 0]      [hash du bloc 1]  <-- [hash du bloc 2]
[son propre hash]  <---[son propre hash]     [son propre hash]
```

## Le hash : une empreinte qui détecte la moindre modification

Un **hash** est le résultat d'une fonction mathématique qui transforme n'importe quelle donnée (même énorme) en une suite de caractères de longueur fixe, de façon déterministe : la même donnée en entrée donne toujours le même hash en sortie, et changer un seul caractère de la donnée produit un hash complètement différent et imprévisible.

```text
hash("Bonjour")  -> a1b2c3...  (exemple simplifié)
hash("Bonjour!") -> 9f8e7d...  (totalement différent malgré un seul caractère ajouté)
```

Comme chaque bloc contient le hash du bloc précédent, modifier une transaction dans un bloc ancien change son hash, ce qui casse le lien avec le bloc suivant (qui contenait l'ancien hash), qui casse à son tour le lien avec celui d'après, et ainsi de suite jusqu'au bout de la chaîne. Falsifier une transaction ancienne oblige donc à recalculer tous les blocs qui suivent.

> **Piège :** croire qu'un hash est un chiffrement (réversible, on peut retrouver la donnée d'origine). C'est faux : un hash n'est pas réversible, on ne peut pas remonter à la donnée de départ à partir de lui seul.
>
> **Bonne pratique :** retenir le hash comme une empreinte de vérification (« est-ce que cette donnée a été modifiée ? »), jamais comme un moyen de cacher une information.

## Le consensus : se mettre d'accord sans autorité centrale

Le registre n'est pas stocké à un seul endroit : des milliers d'ordinateurs indépendants (les **nœuds**) en gardent chacun une copie. Le **consensus** est la règle qui permet à ce réseau de se mettre d'accord sur quelle version de la chaîne est la bonne, sans qu'aucun nœud n'ait plus de pouvoir de décision qu'un autre par défaut.

| Mécanisme de consensus | Principe |
|---|---|
| **Preuve de travail** (*Proof of Work*, ex. Bitcoin) | Les nœuds rivalisent pour résoudre un calcul coûteux ; le premier à réussir propose le bloc suivant, ce qui coûte de l'énergie et dissuade la triche |
| **Preuve d'enjeu** (*Proof of Stake*, ex. Ethereum depuis 2022) | Les nœuds mettent en jeu une somme de cryptomonnaie comme garantie ; celui choisi pour proposer le bloc suivant perd sa mise s'il triche |

Dans les deux cas, le principe reste le même : rendre la triche plus coûteuse que le fait de suivre les règles honnêtement.

> **Piège :** penser qu'une blockchain est « incassable » par magie. Sa sécurité vient du coût économique de l'attaque (calcul ou capital à mobiliser), pas d'une propriété mathématique absolue : un attaquant qui contrôlerait plus de la moitié de la puissance de calcul (ou de l'enjeu) du réseau pourrait en théorie réécrire l'historique.
>
> **Bonne pratique :** évaluer la sécurité réelle d'une blockchain donnée par la taille et la décentralisation de son réseau de nœuds, pas seulement par le principe théorique du consensus utilisé.

## Le smart contract : du code qui s'exécute sur la blockchain

Un **smart contract** (contrat intelligent) est un programme stocké sur la blockchain, qui s'exécute automatiquement quand certaines conditions sont remplies, sans intervention humaine. C'est la brique qui transforme une blockchain de simple registre de transactions en plateforme capable d'exécuter n'importe quelle logique.

```text
Exemple simplifié : un pari automatique
  SI l'équipe A gagne le match
  ALORS transférer les fonds au parieur qui a misé sur A
  -> exécuté automatiquement par le réseau, sans arbitre humain
```

Une fois déployé, le code d'un smart contract ne peut généralement plus être modifié : c'est une garantie de fiabilité (personne ne peut changer les règles après coup), mais aussi un risque, une erreur dans le code reste figée telle quelle. Ce sujet sera développé dans un chapitre dédié à l'écriture de smart contracts.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une blockchain est un registre partagé entre de nombreux ordinateurs indépendants, organisé en blocs liés par leur hash. Le consensus permet au réseau de s'accorder sur la version valide de la chaîne sans autorité centrale. Un smart contract est un programme qui s'exécute automatiquement sur la blockchain. |
| **Outils utilisables** | Aucun outil pratique à ce stade : ce chapitre pose les concepts, les chapitres suivants aborderont Solidity et les réseaux concrets. |
| **Pièges à éviter** | Confondre hash et chiffrement. Croire qu'une blockchain est incassable par principe plutôt que par coût économique. |
| **Bonnes pratiques** | Voir le hash comme une empreinte de vérification, pas un chiffrement. Évaluer la sécurité réelle par la décentralisation du réseau. |
