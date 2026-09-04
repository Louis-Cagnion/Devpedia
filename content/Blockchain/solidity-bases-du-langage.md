---
order: 2
---

# Solidity : bases du langage

Le chapitre sur les [concepts fondamentaux](/?c=blockchain&p=concepts-fondamentaux-blockchain) présentait le smart contract comme un programme stocké sur la blockchain, qui s'exécute automatiquement. **Solidity** est le langage le plus utilisé pour écrire ces programmes, sur Ethereum et sur la plupart des réseaux compatibles avec lui (dont Avalanche). Ce chapitre couvre sa syntaxe de base.

## L'en-tête obligatoire : licence et version du compilateur

Tout fichier Solidity commence par deux lignes conventionnelles : un identifiant de licence, et la version du compilateur acceptée.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
```

Le commentaire `SPDX-License-Identifier` déclare la licence du code (`MIT` est très répandue dans l'écosystème) ; les outils de compilation avertissent s'il est absent. La ligne `pragma` fixe la version du compilateur Solidity attendue (ici, `^0.8.20` accepte la 0.8.20 et toute version 0.8.x plus récente, mais pas la 0.9) : cette contrainte évite qu'un changement de compilateur plus tard ne modifie silencieusement le comportement d'un contrat déjà écrit.

## Un contrat : données et fonctions au même endroit

Le mot-clé `contract` définit un contrat, qui regroupe des **variables d'état** (des données stockées durablement sur la blockchain) et des **fonctions** (le code qui les lit ou les modifie) :

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Stockage {
    uint256 valeur;

    function definir(uint256 x) public {
        valeur = x;
    }

    function lire() public view returns (uint256) {
        return valeur;
    }
}
```

`uint256` est un entier non signé (positif ou nul) sur 256 bits, le type numérique le plus courant en Solidity. Une **variable d'état** comme `valeur` reste écrite sur la blockchain entre deux appels : contrairement à une variable locale dans une fonction classique, elle survit à la fin de la fonction qui l'a modifiée.

> **Piège :** oublier le mot-clé `view` sur une fonction qui ne fait que lire une variable d'état (comme `lire()`). Une fonction sans `view` est considérée par le réseau comme pouvant modifier l'état, ce qui la rend coûteuse à appeler même si elle ne fait en réalité que lire une valeur.
>
> **Bonne pratique :** marquer `view` toute fonction qui ne modifie aucune variable d'état, `pure` celle qui n'en lit même aucune : le réseau peut alors exécuter ces appels sans frais, contrairement à un appel qui modifie réellement la blockchain.

## `msg.sender` et `msg.value` : savoir qui appelle, et avec combien

Chaque appel à une fonction d'un contrat porte avec lui deux informations automatiquement fournies par le réseau : `msg.sender` (l'adresse de la personne ou du contrat qui appelle) et `msg.value` (le montant de cryptomonnaie envoyé avec l'appel, si la fonction est marquée `payable`).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Coffre {
    mapping(address => uint256) public soldes;

    function deposer() public payable {
        soldes[msg.sender] += msg.value;
    }

    function retirer(uint256 montant) public {
        require(soldes[msg.sender] >= montant, "Solde insuffisant");
        soldes[msg.sender] -= montant;
        payable(msg.sender).transfer(montant);
    }
}
```

Un `mapping(address => uint256)` associe une adresse à une valeur, comme un dictionnaire : ici, chaque adresse a son propre solde. `require(condition, message)` interrompt l'exécution (et annule tout changement déjà fait) si la condition est fausse, un mécanisme de garde utilisé systématiquement en début de fonction pour valider ses préconditions.

## L'ordre checks / effects / interactions : une règle de sécurité, pas un style

Remarquez l'ordre exact des trois lignes dans `retirer()` : d'abord la vérification (`require`), puis la mise à jour de l'état interne (`soldes[msg.sender] -= montant`), et seulement ensuite l'envoi réel des fonds (`transfer`). Cet ordre s'appelle le patron **checks / effects / interactions**, et ce n'est pas une question de goût.

> **Piège :** envoyer les fonds *avant* de mettre à jour le solde interne. Un contrat destinataire malveillant peut, au moment de recevoir les fonds, rappeler immédiatement `retirer()` avant que le solde n'ait été décrémenté : comme le solde affiche encore son ancienne valeur, la vérification passe à nouveau, et les fonds peuvent être retirés plusieurs fois pour un seul dépôt. C'est une **attaque par réentrance** (*reentrancy*), une des causes les plus fréquentes de vols de fonds réels sur des smart contracts.
>
> **Bonne pratique :** toujours vérifier les conditions, puis mettre à jour toutes les variables d'état, et seulement en dernier interagir avec l'extérieur (envoyer des fonds, appeler un autre contrat) ; jamais l'inverse.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un fichier Solidity commence par une licence et une version de compilateur (`pragma`). Un `contract` regroupe des variables d'état (persistantes sur la blockchain) et des fonctions. `msg.sender`/`msg.value` identifient l'appelant et les fonds envoyés. L'ordre checks/effects/interactions protège contre les attaques par réentrance. |
| **Outils utilisables** | `view`/`pure` pour marquer une fonction sans coût qui ne modifie rien. `require()` pour valider une précondition. `mapping` pour associer une adresse à une donnée. |
| **Pièges à éviter** | Oublier `view` sur une fonction de lecture pure. Envoyer des fonds avant de mettre à jour l'état interne (réentrance). |
| **Bonnes pratiques** | Marquer `view`/`pure` chaque fonction qui n'en a pas besoin d'un état modifié. Toujours suivre l'ordre checks/effects/interactions avant tout envoi de fonds ou appel externe. |
