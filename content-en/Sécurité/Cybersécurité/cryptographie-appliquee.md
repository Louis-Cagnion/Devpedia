---
order: 5
---

# Applied Cryptography for Developers

Cryptography covers the techniques that protect data from being read or altered by someone who shouldn't have access to it. This chapter covers the vocabulary and the most common mistakes; password-specific hashing, already covered in depth, is handled in [Passwords and Secure Hashing](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage).

## Hashing vs. encryption: a frequent mix-up

Both transform data, but for opposite purposes:

| | Hashing | Encryption |
|---|---|---|
| Direction of the operation | One-way: the input can never be recovered | Reversible: the original data comes back with the right key |
| Goal | Check that data hasn't changed, or compare it without storing it in plain form | Make data unreadable without the key, while still being able to read it back later |
| Example use | Storing a password, checking a downloaded file's integrity | Protecting a confidential file, securing a network connection (TLS) |

> **Pitfall:** talking about "decrypting" a hashed password to recover it. A hash has no associated key that would allow reversing it: that's precisely what makes it suitable for passwords (see [Passwords and Secure Hashing](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)), and unsuitable for any data that will need to be read back later (in which case encryption is the right tool).

## Symmetric and asymmetric encryption

| | Symmetric | Asymmetric |
|---|---|---|
| Key(s) | A single key, used both to encrypt **and** decrypt | A pair: a public key (encrypt, or verify a signature) and a private key (decrypt, or sign) |
| Speed | Fast | Much slower |
| Main challenge | Getting the secret key to the other party without it being intercepted | No secret to transmit: the public key can circulate freely |
| Example algorithm | [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) | [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem), elliptic curves (ECC) |

```text
Symmetric                               Asymmetric

  Sender            Recipient             Sender                Recipient
  secret key K      secret key K          recipient's           recipient's
       |                 |                public key            private key
       v                 v                     |                     |
  encrypt with K    decrypt with K              v                     v
                                          encrypt with the       decrypt with
                                          public key             the private key
                                          (anyone can              (only the recipient
                                           encrypt)                  can read)
```

In practice, the two are often combined: TLS (see the network attack overview in [Securing Your Data](/?c=langages-de-programmation&s=php&p=securite)) uses asymmetric encryption to exchange a session key, then switches to symmetric encryption (faster) for the rest of the connection.

## Digital signatures: the reverse of asymmetric encryption

A **digital signature** proves that a piece of data really comes from the expected sender, and hasn't been altered since: the sender signs with their **private** key, and anyone can verify it with the **public** key (the reverse of encryption, where you encrypt with the recipient's public key). The principle is the same as a [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) signature: guaranteeing integrity, never confidentiality on its own.

## Common mistakes to avoid

| Mistake | Why it's dangerous | Best practice |
|---|---|---|
| Implementing your own encryption algorithm | A homemade algorithm has never undergone the deep scrutiny that standard algorithms, published and tested by the whole cryptography community for years, have gone through | Always use a recognized cryptography library, never a homegrown implementation |
| Generating a key or salt with an ordinary random generator | A non-cryptographic generator is predictable (see [Randomness and Generators](/?c=representation-des-donnees&p=aleatoire-et-generateurs)) | Always use a CSPRNG for anything that must stay secret |
| Reusing the same key for everything | A key compromised in one context then compromises every use that shares it | A dedicated key per use, rotated regularly (see [Secrets Management](/?c=cybersecurite&p=gestion-des-secrets)) |
| Storing the encryption key next to the encrypted data | Amounts to leaving the house key under the doormat: anyone who reaches the data also reaches the key | Store the key separately (see [Secrets Management](/?c=cybersecurite&p=gestion-des-secrets)) |
| Using an outdated algorithm (DES, RC4) | Breakable with modern computing power, sometimes within hours | Use current standards (AES, modern elliptic curves) |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | Hashing is one-way (verify/compare); encryption is reversible (protect, then read back). Symmetric encryption uses a single shared key; asymmetric uses a public/private key pair. A digital signature guarantees integrity, not confidentiality. |
| **Tools you can use** | AES (symmetric), RSA/ECC (asymmetric), a standard cryptography library for the language in use rather than a homemade implementation. |
| **Pitfalls to avoid** | Confusing hashing and encryption; implementing your own algorithm; reusing the same key everywhere; using a non-cryptographic random generator for a key or salt. |
| **Best practices** | A dedicated key per use; a CSPRNG for anything secret; standard algorithms, never homemade ones; a key stored separately from the data it protects. |
