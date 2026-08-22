---
order: 3
---

# Déployer et interagir avec un smart contract

Le chapitre précédent a montré comment écrire un contrat en [Solidity](/?c=blockchain&p=solidity-bases-du-langage). Un fichier de code seul ne fait encore rien : ce chapitre couvre ce qui se passe entre l'écriture du contrat et son utilisation réelle sur la blockchain.

## Compiler : du code Solidity à deux artefacts

Compiler un contrat Solidity produit deux résultats distincts, tous deux nécessaires ensuite :

| Artefact | Rôle |
|---|---|
| **Bytecode** | Le code machine que la blockchain exécute réellement, illisible pour un humain |
| **ABI** (*Application Binary Interface*) | Un fichier JSON qui décrit les fonctions du contrat (noms, paramètres, types de retour), lisible par les outils qui doivent l'appeler |

L'ABI joue le rôle d'un mode d'emploi : sans lui, un wallet ou une application ne saurait pas quelles fonctions existent sur le contrat, ni comment leur envoyer des paramètres au bon format.

```text
Extrait d'ABI pour retirer(uint256) :

[
  {
    "name": "retirer",
    "type": "function",
    "inputs": [{ "name": "montant", "type": "uint256" }],
    "outputs": []
  }
]
```

## Déployer : une transaction un peu spéciale

**Déployer** un contrat consiste à envoyer une transaction dont le contenu est le bytecode compilé, sans destinataire précis : le réseau y répond en créant une nouvelle adresse, celle du contrat, où ce bytecode reste stocké de façon permanente. C'est cette adresse qui sera utilisée ensuite pour interagir avec le contrat.

## Le gas : payer pour faire tourner le réseau

Chaque opération exécutée sur la blockchain (déployer un contrat, appeler une fonction qui modifie son état) consomme du **gas**, une unité qui mesure la quantité de travail de calcul demandée au réseau. Le coût réel payé est le produit de deux facteurs :

```text
Coût total = quantité de gas consommée × prix du gas

Le prix du gas s'exprime en gwei (1 gwei = 0,000000001 ether) et
varie selon la demande du réseau à l'instant de la transaction,
un peu comme un prix qui monte quand le réseau est très sollicité.
```

Un simple transfert de cryptomonnaie coûte un montant de gas fixe (21 000 unités sur Ethereum) ; déployer un contrat coûte nettement plus, et augmente avec la taille du bytecode déployé.

> **Piège :** croire que le prix du gas est fixe ou prévisible à l'avance. Il fluctue en temps réel selon la charge du réseau : une transaction identique peut coûter beaucoup plus cher à un moment de forte affluence.
>
> **Bonne pratique :** vérifier le prix du gas actuel avant une transaction coûteuse (un déploiement, par exemple), et éviter les périodes de forte affluence réseau quand l'opération n'est pas urgente.

## Interagir depuis un wallet : lire est gratuit, écrire coûte du gas

Un wallet (comme MetaMask) sert d'intermédiaire entre une personne et la blockchain : il connaît les clés qui prouvent l'identité de son propriétaire, et utilise l'ABI d'un contrat pour construire des appels compréhensibles par celui-ci.

| Type d'appel | Exemple | Coût |
|---|---|---|
| **Lecture** (fonction `view`/`pure`) | Consulter un solde | Gratuit : rien n'est écrit sur la blockchain, aucune transaction n'est nécessaire |
| **Écriture** (fonction qui modifie l'état) | Déposer des fonds, transférer un solde | Payant : la modification doit être validée par le réseau via une transaction, donc du gas |

C'est exactement la distinction déjà vue au chapitre précédent avec `view`/`pure` : une fonction correctement marquée `view` peut être appelée gratuitement par n'importe qui, sans même passer par une transaction signée.

> **Bonne pratique :** systématiquement vérifier, avant d'appeler une fonction depuis un wallet, si elle modifie réellement l'état du contrat (coûteuse) ou se contente de le lire (gratuite) ; un wallet demande toujours une confirmation avant une transaction payante, contrairement à une lecture.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Compiler un contrat produit un bytecode (exécuté par la blockchain) et une ABI (JSON décrivant ses fonctions, utilisé par les outils qui l'appellent). Déployer envoie ce bytecode dans une transaction sans destinataire. Toute opération qui modifie l'état coûte du gas (quantité de calcul × prix, en gwei) ; une simple lecture reste gratuite. |
| **Outils utilisables** | L'ABI (JSON) pour permettre à un wallet ou une application d'appeler un contrat. Un wallet (MetaMask) pour signer les transactions et interagir avec un contrat déployé. |
| **Pièges à éviter** | Croire que le prix du gas est fixe ou prévisible à l'avance. |
| **Bonnes pratiques** | Vérifier le prix du gas actuel avant une transaction coûteuse. Distinguer une fonction de lecture (gratuite) d'une fonction d'écriture (payante) avant de l'appeler. |
