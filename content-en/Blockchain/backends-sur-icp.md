---
order: 5
---

# Backends on ICP

The previous chapters cover a model centered on Ethereum and [EVM-compatible networks](/?c=blockchain&p=reseaux-blockchain): contracts that run limited logic, with the user paying gas on every interaction. **ICP** (*Internet Computer Protocol*) starts from a different paradigm, built to host entire applications, not just contracts.

## The canister: more than a smart contract

A **canister** is ICP's equivalent of a deployed smart contract, but with a broader role: it bundles code *and* state (persistent data), compiled into [WebAssembly](https://webassembly.org) (a portable binary format, runnable quickly on any compatible machine), and can respond directly to web requests. A canister isn't limited to isolated business logic, then; it can host a whole application, backend included, with no traditional server behind it.

## Two main languages: Motoko and Rust

| Language | What sets it apart |
|---|---|
| **Motoko** | Designed specifically for ICP, built around the concept of an **actor**: each canister is an isolated actor, communicating with others through asynchronous messages |
| **Rust** | A general-purpose language, the most widely used in production on ICP (the network's own components, like its account registry, are written in Rust) |

A minimal canister in Motoko:

```motoko
actor Counter {
  stable var value : Nat = 0;

  public func increment() : async Nat {
    value += 1;
    value
  };

  public query func read() : async Nat {
    value
  };
};
```

The `stable` keyword marks a variable as persistent across canister updates (it survives a code redeployment, unlike a regular variable); `query` marks a function that only reads, without changing state, comparable to `view` already covered in [Solidity](/?c=blockchain&p=solidity-bases-du-langage).

## The reverse gas model: the developer pays, not the user

On Ethereum or Avalanche, every interaction with a contract costs gas paid by the person calling the function (see the chapter on [deployment](/?c=blockchain&p=deployer-et-interagir-avec-un-smart-contract)). ICP flips this model: computation cost is paid by the canister's **developer**, through **cycles**, a unit obtained by converting ICP tokens.

```text
Classic model (Ethereum/Avalanche):
  User calls a function -> user pays the gas

Reverse model (ICP):
  User calls a function -> the canister consumes cycles already
  pre-loaded by the developer -> user pays nothing for the
  interaction itself
```

This model brings the user experience closer to that of a regular web application: nobody needs a wallet or tokens just to use the application, unlike an Ethereum contract where every action involves a paid transaction.

> **Pitfall:** thinking this model makes using a canister free for everyone under all circumstances. The developer must regularly top up the canister's cycles; if they run out, the canister first **freezes** (stops accepting new requests, after a default 30-day safety threshold), then its code and data get **deleted** if cycles aren't topped up in time.
>
> **Best practice:** monitor a production canister's cycle balance and set up an automatic top-up mechanism before reaching the freezing threshold, rather than discovering the deletion after the fact.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | An ICP canister bundles code and state, compiled into WebAssembly, and can host a whole application rather than plain contract logic. Motoko (designed for ICP, built around the actor concept) and Rust (the most widely used in production) are the two main languages. The reverse gas model has the developer pay (in cycles) rather than the end user on every interaction. |
| **Usable tools** | `stable` for a variable persistent across updates. `query` for a read-only function, the equivalent of Solidity's `view`. |
| **Pitfalls to avoid** | Thinking the reverse gas model makes a canister free to maintain indefinitely with no monitoring. |
| **Best practices** | Monitor a production canister's cycle balance, with a top-up mechanism before the freezing threshold. |
