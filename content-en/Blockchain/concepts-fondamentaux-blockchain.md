---
order: 1
---

# Fundamental concepts of blockchain

A bank keeps a ledger of who owns what: when you pay someone, it updates their accounts, and you trust it not to cheat. A **blockchain** aims for the same result, a reliable ledger of transactions, but without a bank or central authority: trust rests on the system's own rules, spread across thousands of independent computers.

## The ledger: a chain of blocks

A blockchain is a ledger (a list of transactions) split into **blocks**. Each block holds a batch of recent transactions, and crucially a reference to the previous block: that's what forms the "chain".

| Element | Role |
|---|---|
| **Block** | A packet of validated, timestamped transactions |
| **Hash** | A unique digital fingerprint of the block (see below) |
| **Chain** | Each block holds the previous block's hash, linking them together in order |

```text
Block 1                Block 2                Block 3
[transactions]          [transactions]          [transactions]
[hash of block 0]       [hash of block 1]  <--  [hash of block 2]
[its own hash]      <-- [its own hash]           [its own hash]
```

## Hash: a fingerprint that detects the slightest change

A **hash** is the result of a mathematical function that turns any data (even a huge amount) into a fixed-length string of characters, deterministically: the same input data always produces the same hash output, and changing a single character of the data produces a completely different, unpredictable hash.

```text
hash("Hello")  -> a1b2c3...  (simplified example)
hash("Hello!") -> 9f8e7d...  (totally different despite one added character)
```

Since each block holds the previous block's hash, modifying a transaction in an old block changes its hash, which breaks the link to the next block (which held the old hash), which in turn breaks the link to the one after that, and so on to the end of the chain. Tampering with an old transaction therefore requires recomputing every block that follows it.

> **Pitfall:** thinking a hash is encryption (reversible, the original data can be recovered from it). That's false: a hash is not reversible, you can't get back to the source data from the hash alone.
>
> **Best practice:** think of a hash as a verification fingerprint ("has this data been changed?"), never as a way to hide information.

## Consensus: agreeing without a central authority

The ledger isn't stored in a single place: thousands of independent computers (the **nodes**) each keep their own copy. **Consensus** is the rule that lets this network agree on which version of the chain is the valid one, with no node having more decision-making power than another by default.

| Consensus mechanism | Principle |
|---|---|
| **Proof of Work** (e.g. Bitcoin) | Nodes compete to solve a costly computation; the first to succeed proposes the next block, which costs energy and discourages cheating |
| **Proof of Stake** (e.g. Ethereum since 2022) | Nodes put up an amount of cryptocurrency as collateral; the one chosen to propose the next block loses its stake if it cheats |

In both cases, the principle stays the same: make cheating more costly than honestly following the rules.

> **Pitfall:** thinking a blockchain is magically "unbreakable". Its security comes from the economic cost of an attack (computation or capital to mobilize), not from an absolute mathematical property: an attacker who controlled more than half the network's computing power (or stake) could in theory rewrite the history.
>
> **Best practice:** judge a given blockchain's real security by the size and decentralization of its node network, not just by the theoretical principle of the consensus mechanism used.

## Smart contracts: code that runs on the blockchain

A **smart contract** is a program stored on the blockchain that runs automatically once certain conditions are met, with no human involved. It's the building block that turns a blockchain from a simple transaction ledger into a platform capable of running arbitrary logic.

```text
Simplified example: an automatic bet
  IF team A wins the match
  THEN transfer the funds to the bettor who backed A
  -> executed automatically by the network, with no human referee
```

Once deployed, a smart contract's code generally can't be modified anymore: that's a reliability guarantee (nobody can change the rules afterward), but also a risk, a bug in the code stays frozen as-is. This topic will be developed in a dedicated chapter on writing smart contracts.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A blockchain is a ledger shared across many independent computers, organized into blocks linked by their hash. Consensus lets the network agree on the valid version of the chain without a central authority. A smart contract is a program that runs automatically on the blockchain. |
| **Usable tools** | No practical tool at this stage: this chapter lays out the concepts, later chapters will cover Solidity and concrete networks. |
| **Pitfalls to avoid** | Confusing hash with encryption. Thinking a blockchain is unbreakable in principle rather than by economic cost. |
| **Best practices** | Think of a hash as a verification fingerprint, not encryption. Judge real security by the network's decentralization. |
