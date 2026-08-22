---
order: 3
---

# Deploying and interacting with a smart contract

The previous chapter showed how to write a contract in [Solidity](/?c=blockchain&p=solidity-bases-du-langage). A code file alone doesn't do anything yet: this chapter covers what happens between writing a contract and actually using it on the blockchain.

## Compiling: from Solidity code to two artifacts

Compiling a Solidity contract produces two distinct outputs, both needed afterward:

| Artifact | Role |
|---|---|
| **Bytecode** | The machine code the blockchain actually runs, unreadable to a human |
| **ABI** (*Application Binary Interface*) | A JSON file describing the contract's functions (names, parameters, return types), readable by the tools that need to call it |

The ABI acts as an instruction manual: without it, a wallet or an application wouldn't know which functions exist on the contract, or how to send them parameters in the right format.

```text
ABI excerpt for withdraw(uint256):

[
  {
    "name": "withdraw",
    "type": "function",
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "outputs": []
  }
]
```

## Deploying: a somewhat special transaction

**Deploying** a contract means sending a transaction whose content is the compiled bytecode, with no specific recipient: the network responds by creating a new address, the contract's, where this bytecode stays stored permanently. That address is what gets used afterward to interact with the contract.

## Gas: paying to run the network

Every operation executed on the blockchain (deploying a contract, calling a function that changes its state) consumes **gas**, a unit measuring the amount of computational work requested from the network. The actual cost paid is the product of two factors:

```text
Total cost = gas consumed × gas price

Gas price is expressed in gwei (1 gwei = 0.000000001 ether) and
varies with network demand at the moment of the transaction, a
bit like a price that rises when the network is very busy.
```

A simple cryptocurrency transfer costs a fixed amount of gas (21,000 units on Ethereum); deploying a contract costs noticeably more, and rises with the size of the deployed bytecode.

> **Pitfall:** thinking the gas price is fixed or predictable in advance. It fluctuates in real time based on network load: an identical transaction can cost much more during a period of heavy traffic.
>
> **Best practice:** check the current gas price before a costly transaction (a deployment, for example), and avoid periods of heavy network traffic when the operation isn't urgent.

## Interacting from a wallet: reading is free, writing costs gas

A wallet (like MetaMask) acts as an intermediary between a person and the blockchain: it holds the keys proving its owner's identity, and uses a contract's ABI to build calls that contract can understand.

| Call type | Example | Cost |
|---|---|---|
| **Read** (`view`/`pure` function) | Checking a balance | Free: nothing is written to the blockchain, no transaction is needed |
| **Write** (a function that changes state) | Depositing funds, transferring a balance | Costs money: the change must be validated by the network via a transaction, so gas |

This is exactly the same distinction already covered in the previous chapter with `view`/`pure`: a correctly marked `view` function can be called for free by anyone, without even going through a signed transaction.

> **Best practice:** always check, before calling a function from a wallet, whether it actually changes the contract's state (costly) or just reads it (free); a wallet always asks for confirmation before a paying transaction, unlike a read.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | Compiling a contract produces bytecode (run by the blockchain) and an ABI (JSON describing its functions, used by the tools that call it). Deploying sends this bytecode in a transaction with no recipient. Any operation that changes state costs gas (amount of computation × price, in gwei); a plain read stays free. |
| **Usable tools** | The ABI (JSON) to let a wallet or application call a contract. A wallet (MetaMask) to sign transactions and interact with a deployed contract. |
| **Pitfalls to avoid** | Thinking the gas price is fixed or predictable in advance. |
| **Best practices** | Check the current gas price before a costly transaction. Tell a read function (free) apart from a write function (costly) before calling it. |
