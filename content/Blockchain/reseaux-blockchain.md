---
order: 4
---

# Les réseaux blockchain

Les chapitres précédents ont parlé de « la » blockchain comme d'un concept générique. En réalité, il n'existe pas une seule blockchain mais de nombreux **réseaux** distincts (Ethereum, Avalanche, et bien d'autres), chacun avec son propre historique, son propre jeton natif, et son propre ensemble de nœuds qui le fait fonctionner.

## Un réseau, une chaîne, un jeton natif

Chaque réseau blockchain fonctionne de façon indépendante : Ethereum a son propre historique de blocs et son propre jeton (l'ether, ETH), Avalanche a le sien (AVAX), et ainsi de suite. Un smart contract déployé sur un réseau n'existe que sur celui-ci ; il faudrait le déployer séparément sur un autre réseau pour qu'il y soit disponible aussi.

## La compatibilité EVM : le même bytecode sur plusieurs réseaux

L'**EVM** (*Ethereum Virtual Machine*) est le composant qui exécute le bytecode des smart contracts sur Ethereum, déjà mentionné implicitement au chapitre sur le [déploiement](/?c=blockchain&p=deployer-et-interagir-avec-un-smart-contract). Plusieurs autres réseaux, dont Avalanche (sur sa chaîne appelée **C-Chain**), implémentent cette même EVM : un contrat écrit en [Solidity](/?c=blockchain&p=solidity-bases-du-langage) et compilé pour Ethereum peut alors être déployé tel quel sur ces réseaux compatibles, sans réécrire le code.

```text
Contrat.sol
    │
    ├── compilé une fois → bytecode identique
    │
    ├── déployé sur Ethereum   → fonctionne, paie en ETH
    └── déployé sur Avalanche  → fonctionne, paie en AVAX
        (C-Chain, compatible EVM)
```

Cette compatibilité ne rend pas les réseaux interchangeables pour autant : chacun a ses propres frais de transaction, sa propre vitesse, son propre mécanisme de consensus (Avalanche utilise un protocole différent de celui d'Ethereum), et un contrat déployé sur l'un n'est jamais automatiquement disponible sur l'autre.

> **Piège :** supposer qu'un contrat déployé sur un réseau est accessible depuis un autre réseau parce qu'ils sont tous les deux compatibles EVM. Chaque déploiement crée une adresse propre à un réseau donné ; utiliser un contrat sur un autre réseau demande de l'y déployer séparément (une nouvelle transaction, un nouveau coût en gas, une nouvelle adresse).
>
> **Bonne pratique :** vérifier explicitement sur quel réseau une adresse de contrat est valide avant d'interagir avec elle ; un wallet affiche toujours le réseau actif, à contrôler avant toute transaction.

## Testnet et mainnet : s'entraîner sans risque

Chaque réseau majeur propose, en plus de son réseau de production (le **mainnet**, où les jetons ont une vraie valeur), un ou plusieurs **testnets** : des réseaux parallèles qui fonctionnent de façon identique, mais où les jetons n'ont aucune valeur réelle.

| | Mainnet | Testnet |
|---|---|---|
| **Jetons** | Valeur réelle | Sans valeur, distribués gratuitement |
| **Obtenir des jetons** | Achat, échange | Un *faucet* (site qui distribue de petites quantités gratuitement) |
| **Usage** | Production, contrats réellement utilisés | Développement, tests avant mise en production |

```text
Exemples de testnets :
  Ethereum  -> Sepolia
  Avalanche -> Fuji
```

> **Piège :** déployer et tester un contrat directement sur le mainnet par manque de connaissance des testnets. Une erreur découverte après un déploiement sur mainnet coûte de vrais frais de transaction pour chaque tentative, et un bug déployé reste, par nature, difficile à corriger.
>
> **Bonne pratique :** toujours développer et tester un contrat sur un testnet, avec des jetons obtenus gratuitement via un faucet, avant tout déploiement sur le mainnet correspondant.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Chaque réseau blockchain (Ethereum, Avalanche...) fonctionne de façon indépendante, avec son propre jeton natif. La compatibilité EVM permet à un même contrat Solidity de tourner sur plusieurs réseaux, mais chaque déploiement reste propre à un réseau donné. Un testnet permet de développer et tester sans risque, avec des jetons sans valeur réelle. |
| **Outils utilisables** | Un faucet pour obtenir des jetons de test gratuits. Sepolia (Ethereum) ou Fuji (Avalanche) comme testnets courants. |
| **Pièges à éviter** | Supposer qu'un contrat déployé sur un réseau est accessible depuis un autre réseau compatible EVM. Développer et tester directement sur le mainnet. |
| **Bonnes pratiques** | Vérifier le réseau actif avant toute transaction. Toujours tester sur un testnet avant un déploiement en production. |
