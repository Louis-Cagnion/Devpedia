---
order: 3
---

# Peer-to-Peer (P2P) Protocols

A typical website follows a **client-server** model: a central server hosts the resource, and each client connects to it to retrieve it (see [Network Fundamentals](/?c=reseaux&p=fondamentaux-reseau)). A **peer-to-peer** (P2P) network works differently: every participant, called a **peer**, is both a client and a server at once, with no central point required to exchange the resource itself.

```text
Client-server:           Client A -->\
                          Client B --> Server (sole source) --> each client
                          Client C -->/

Peer-to-peer:             Peer A <---> Peer B
                             ^            ^
                             |            |
                             v            v
                           Peer C <---> Peer D
                           (each peer can send AND receive, to/from any other)
```

## The swarm, seeders, and leechers

The set of peers currently exchanging the same resource forms a **swarm**. Two roles coexist within a swarm:

| Role | Situation |
|---|---|
| **Seeder** | Already has the complete resource, only sends it to others from now on |
| **Leecher** | Has only part of the resource, downloads the rest while already being able to send back the pieces it holds |

## Splitting into pieces

The resource (often a file) is never exchanged as a single block: it's split into fixed-size **pieces**, each accompanied by a hash (see the general principle of hashing in [Passwords and Secure Hashing](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)) that lets its integrity be checked as soon as it's received.

```text
Complete file:  [ piece 1 | piece 2 | piece 3 | piece 4 | ... ]

A peer can download piece 3 from peer A,
piece 1 from peer B, in parallel,
then immediately resend piece 3 to a peer C that doesn't have it yet.
```

This split does two things at once: it lets several pieces be downloaded in parallel from different peers (faster than a single source), and it lets a corrupted or altered piece be detected immediately from its hash, without waiting for the whole download to finish.

## Finding peers: tracker and DHT

A peer joining a swarm first needs to know which other peers make it up:

| Mechanism | Principle |
|---|---|
| **Tracker** | A central server that each peer contacts to get the list of active peers in the swarm; remains a mandatory point of contact, even though it never hosts the resource itself |
| **DHT** (*Distributed Hash Table*) | A lookup table distributed across the peers themselves, which finds a swarm's peers without depending on a central tracker |

A **magnet link** is a simple reference (a unique identifier for the resource) that lets you join a swarm directly through the DHT, without having to first download a file describing the resource.

## The incentive to give back: choke/unchoke

Nothing forces a peer to send back what it downloads. To keep everyone from just taking without ever giving back, each peer limits how many peers it sends data to at any given moment (*choke* = blocked, *unchoke* = allowed), prioritizing whoever is already sending the most back to it. A peer that never sends anything back ends up choked by most of the others.

## Beyond file sharing between individuals

The P2P principle also serves large-scale distribution needs: rolling out a large update (e.g. a video game) to millions of players at once without overloading a single server, with each player who has already downloaded part of the update redistributing it to others. It's a decentralized alternative to a [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative), which instead spreads the load across dedicated servers rather than across the users themselves.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A peer-to-peer network makes every participant both a client and a server. The swarm brings together the peers exchanging a resource split into pieces verified by hash; a tracker or a DHT is used to find those peers. |
| **Tools you can use** | A tracker for a swarm that's simple to administer; a DHT to avoid depending on any central server. |
| **Pitfalls to avoid** | Confusing the tracker's role (which only puts peers in contact) with that of a regular host (which serves the resource itself). |
| **Best practices** | Check the hash of every piece received before redistributing it, to never propagate corrupted data. |
