---
order: 2
---

# Solidity: language basics

The chapter on [fundamental concepts](/?c=blockchain&p=concepts-fondamentaux-blockchain) introduced a smart contract as a program stored on the blockchain, running automatically. **Solidity** is the most widely used language for writing these programs, on Ethereum and on most networks compatible with it (including Avalanche). This chapter covers its basic syntax.

## The mandatory header: license and compiler version

Every Solidity file starts with two conventional lines: a license identifier, and the accepted compiler version.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
```

The `SPDX-License-Identifier` comment declares the code's license (`MIT` is very common in the ecosystem); build tools warn if it's missing. The `pragma` line sets the expected Solidity compiler version (here, `^0.8.20` accepts 0.8.20 and any newer 0.8.x version, but not 0.9): this constraint prevents a later compiler change from silently altering an already-written contract's behavior.

## A contract: data and functions in one place

The `contract` keyword defines a contract, which groups **state variables** (data stored durably on the blockchain) and **functions** (the code that reads or modifies them):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Storage {
    uint256 value;

    function set(uint256 x) public {
        value = x;
    }

    function get() public view returns (uint256) {
        return value;
    }
}
```

`uint256` is an unsigned (positive or zero) 256-bit integer, the most common numeric type in Solidity. A **state variable** like `value` stays written on the blockchain between calls: unlike a local variable in a regular function, it survives past the end of the function that changed it.

> **Pitfall:** forgetting the `view` keyword on a function that only reads a state variable (like `get()`). A function without `view` is treated by the network as potentially able to change state, which makes it costly to call even though it actually only reads a value.
>
> **Best practice:** mark `view` any function that changes no state variable, and `pure` one that doesn't even read any: the network can then run these calls at no cost, unlike a call that actually modifies the blockchain.

## `msg.sender` and `msg.value`: knowing who's calling, and with how much

Every call to a contract's function carries two pieces of information automatically supplied by the network: `msg.sender` (the address of the person or contract calling) and `msg.value` (the amount of cryptocurrency sent with the call, if the function is marked `payable`).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Vault {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
}
```

A `mapping(address => uint256)` associates an address with a value, like a dictionary: here, each address has its own balance. `require(condition, message)` stops execution (and reverts any change already made) if the condition is false, a guard mechanism used systematically at the start of a function to validate its preconditions.

## The checks / effects / interactions order: a security rule, not a style choice

Notice the exact order of the three lines in `withdraw()`: first the check (`require`), then the internal state update (`balances[msg.sender] -= amount`), and only after that the actual sending of funds (`transfer`). This order is called the **checks / effects / interactions** pattern, and it's not a matter of taste.

> **Pitfall:** sending funds *before* updating the internal balance. A malicious recipient contract can, at the moment it receives the funds, immediately call back into `withdraw()` before the balance has been decremented: since the balance still shows its old value, the check passes again, and the funds can be withdrawn several times for a single deposit. This is a **reentrancy attack**, one of the most frequent causes of real fund theft from smart contracts.
>
> **Best practice:** always check conditions, then update every state variable, and only last interact with the outside (sending funds, calling another contract); never the other way around.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A Solidity file starts with a license and a compiler version (`pragma`). A `contract` groups state variables (persistent on the blockchain) and functions. `msg.sender`/`msg.value` identify the caller and the funds sent. The checks/effects/interactions order protects against reentrancy attacks. |
| **Usable tools** | `view`/`pure` to mark a cost-free function that changes nothing. `require()` to validate a precondition. `mapping` to associate an address with data. |
| **Pitfalls to avoid** | Forgetting `view` on a pure read function. Sending funds before updating internal state (reentrancy). |
| **Best practices** | Mark `view`/`pure` on every function that doesn't need to modify state. Always follow the checks/effects/interactions order before any fund transfer or external call. |
