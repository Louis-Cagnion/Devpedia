---
order: 5
---

# Les backends sur ICP

Les chapitres précédents couvrent un modèle centré sur Ethereum et les [réseaux compatibles EVM](/?c=blockchain&p=reseaux-blockchain) : des contrats qui exécutent une logique limitée, l'utilisateur payant du gas à chaque interaction. **ICP** (*Internet Computer Protocol*) part d'un paradigme différent, pensé pour héberger des applications entières, pas seulement des contrats.

## Le canister : plus qu'un smart contract

Un **canister** est l'équivalent, sur ICP, d'un smart contract déployé, mais avec un rôle plus large : il regroupe du code *et* de l'état (des données persistantes), compilés en [WebAssembly](https://webassembly.org) (un format binaire portable, exécutable rapidement sur n'importe quelle machine compatible), et peut répondre directement à des requêtes web. Un canister ne se limite donc pas à une logique métier isolée, il peut héberger une application complète, backend compris, sans serveur traditionnel derrière.

## Deux langages principaux : Motoko et Rust

| Langage | Particularité |
|---|---|
| **Motoko** | Conçu spécifiquement pour ICP, autour du concept d'**acteur** : chaque canister est un acteur isolé, qui communique avec les autres par messages asynchrones |
| **Rust** | Langage généraliste, le plus utilisé en production sur ICP (les composants du réseau lui-même, comme son registre de comptes, sont écrits en Rust) |

Un canister minimal en Motoko :

```motoko
actor Compteur {
  stable var valeur : Nat = 0;

  public func incrementer() : async Nat {
    valeur += 1;
    valeur
  };

  public query func lire() : async Nat {
    valeur
  };
};
```

Le mot-clé `stable` marque une variable comme persistante à travers les mises à jour du canister (elle survit à un redéploiement du code, contrairement à une variable classique) ; `query` marque une fonction qui ne fait que lire, sans modifier l'état, à rapprocher du `view` déjà vu en [Solidity](/?c=blockchain&p=solidity-bases-du-langage).

## Le modèle de gas inversé : le développeur paie, pas l'utilisateur

Sur Ethereum ou Avalanche, chaque interaction avec un contrat coûte du gas payé par la personne qui appelle la fonction (voir le chapitre sur le [déploiement](/?c=blockchain&p=deployer-et-interagir-avec-un-smart-contract)). ICP inverse ce modèle : le coût de calcul est payé par le **développeur** du canister, via des **cycles**, une unité obtenue en convertissant des jetons ICP.

```text
Modèle classique (Ethereum/Avalanche) :
  Utilisateur appelle une fonction -> utilisateur paie le gas

Modèle inversé (ICP) :
  Utilisateur appelle une fonction -> le canister consomme des
  cycles déjà préchargés par le développeur -> utilisateur ne
  paie rien pour l'interaction elle-même
```

Ce modèle rapproche l'expérience utilisateur de celle d'une application web classique : personne n'a besoin d'un wallet ni de jetons pour simplement utiliser l'application, contrairement à un contrat Ethereum où chaque action implique une transaction payante.

> **Piège :** croire que ce modèle rend l'utilisation d'un canister gratuite pour tout le monde en toute circonstance. Le développeur doit recharger régulièrement les cycles du canister ; s'ils s'épuisent, le canister se **fige** d'abord (arrête d'accepter de nouvelles requêtes, après un seuil de sécurité par défaut de 30 jours), puis son code et ses données sont **supprimés** si les cycles ne sont pas rechargés à temps.
>
> **Bonne pratique :** surveiller le solde de cycles d'un canister en production et prévoir un mécanisme de rechargement automatique avant d'atteindre le seuil de gel, plutôt que de découvrir la suppression après coup.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un canister ICP regroupe code et état, compilé en WebAssembly, et peut héberger une application entière plutôt qu'une simple logique de contrat. Motoko (conçu pour ICP, autour du concept d'acteur) et Rust (le plus utilisé en production) sont les deux langages principaux. Le modèle de gas inversé fait payer le développeur (en cycles) plutôt que l'utilisateur final à chaque interaction. |
| **Outils utilisables** | `stable` pour une variable persistante à travers les mises à jour. `query` pour une fonction de lecture, équivalent du `view` de Solidity. |
| **Pièges à éviter** | Croire que le modèle de gas inversé rend un canister gratuit à maintenir indéfiniment sans surveillance. |
| **Bonnes pratiques** | Surveiller le solde de cycles d'un canister en production, avec un mécanisme de rechargement avant le seuil de gel. |
