---
order: 4
---

# Blockchain networks

Previous chapters talked about "the" blockchain as a generic concept. In reality, there isn't a single blockchain but many distinct **networks** (Ethereum, Avalanche, and many others), each with its own history, its own native token, and its own set of nodes keeping it running.

## One network, one chain, one native token

Each blockchain network operates independently: Ethereum has its own block history and its own token (ether, ETH), Avalanche has its own (AVAX), and so on. A smart contract deployed on one network only exists there; it would need to be deployed separately on another network to be available there too.

## EVM compatibility: the same bytecode on several networks

The **EVM** (*Ethereum Virtual Machine*) is the component that runs smart contract bytecode on Ethereum, already implicitly mentioned in the chapter on [deployment](/?c=blockchain&p=deployer-et-interagir-avec-un-smart-contract). Several other networks, including Avalanche (on its chain called the **C-Chain**), implement this same EVM: a contract written in [Solidity](/?c=blockchain&p=solidity-bases-du-langage) and compiled for Ethereum can then be deployed as-is on these compatible networks, with no code rewrite.

```text
Contract.sol
    │
    ├── compiled once → identical bytecode
    │
    ├── deployed on Ethereum   → works, pays in ETH
    └── deployed on Avalanche  → works, pays in AVAX
        (C-Chain, EVM-compatible)
```

This compatibility doesn't make networks interchangeable, though: each has its own transaction fees, its own speed, its own consensus mechanism (Avalanche uses a different protocol from Ethereum's), and a contract deployed on one is never automatically available on the other.

> **Pitfall:** assuming a contract deployed on one network is reachable from another network just because both are EVM-compatible. Every deployment creates an address specific to a given network; using a contract on another network requires deploying it there separately (a new transaction, a new gas cost, a new address).
>
> **Best practice:** explicitly check which network a contract address is valid on before interacting with it; a wallet always shows the active network, to check before any transaction.

## Testnet and mainnet: practicing without risk

Every major network offers, alongside its production network (the **mainnet**, where tokens have real value), one or more **testnets**: parallel networks that work identically, but where tokens have no real value.

| | Mainnet | Testnet |
|---|---|---|
| **Tokens** | Real value | No value, distributed for free |
| **Getting tokens** | Purchase, exchange | A *faucet* (a site that distributes small amounts for free) |
| **Use** | Production, contracts actually used | Development, testing before going live |

```text
Testnet examples:
  Ethereum  -> Sepolia
  Avalanche -> Fuji
```

> **Pitfall:** deploying and testing a contract directly on mainnet for lack of testnet knowledge. A bug found after a mainnet deployment costs real transaction fees for every attempt, and a deployed bug stays, by nature, hard to fix.
>
> **Best practice:** always develop and test a contract on a testnet, with tokens obtained for free from a faucet, before any deployment to the matching mainnet.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | Each blockchain network (Ethereum, Avalanche...) operates independently, with its own native token. EVM compatibility lets the same Solidity contract run on several networks, but every deployment stays specific to a given network. A testnet allows risk-free development and testing, with tokens that have no real value. |
| **Usable tools** | A faucet to get free test tokens. Sepolia (Ethereum) or Fuji (Avalanche) as common testnets. |
| **Pitfalls to avoid** | Assuming a contract deployed on one network is reachable from another EVM-compatible network. Developing and testing directly on mainnet. |
| **Best practices** | Check the active network before any transaction. Always test on a testnet before a production deployment. |
