---
order: 1
---

# Network Fundamentals

A **computer network** is a set of machines connected to each other, able to exchange data. Before looking at how two programs actually communicate (see [Sockets and Non-Blocking I/O](/?c=reseaux&p=sockets-et-io-non-bloquante)), you first need to understand how a machine is identified on that network, and how its data finds its way to the right destination.

## The IP address: identifying a machine

An **IP address** (*Internet Protocol*) uniquely identifies a machine on a network, a bit like a phone number identifies a caller. The most common version, **IPv4**, is written as 4 numbers between 0 and 255, separated by dots:

```text
192.168.1.10
 |    |  | |
 └────┴──┴─┴─ 4 blocks of 8 bits (0-255) = 32 bits total
```

> **Note:** IPv4 only allows for ~4.3 billion distinct addresses, a number already insufficient for every connected device in the world. **IPv6**, its more recent version (128-bit addresses, e.g. `2001:0db8::1`), solves this problem but isn't universally deployed yet; this chapter focuses on IPv4, which remains dominant in practice.

## The subnet mask: splitting an address into two parts

An IP address on its own doesn't say which machines are on the **same** local network. The **subnet mask** answers that question: it splits the IP address into a **network** part (identical for every machine on the same local network) and a **host** part (unique to each machine on that network).

```text
IP address    :  192.168.1  .  10
Mask          :  255.255.255.0
                 └─────────┘ └┘
                  network      host
                   part        part
```

| Element | Role | Example |
|---|---|---|
| Network part | Identifies the local network itself | `192.168.1` |
| Host part | Identifies one specific machine inside that network | `10` |

Two machines whose network part (once the mask is applied) is identical can talk to each other **directly**, without going through a router. If the network part differs, their data must pass through a router to reach each other.

## The default gateway: the local network's exit

The **default gateway** is the IP address a machine sends its data to as soon as the destination is **not** on its local network (different network part). It's almost always the address of the local router.

```text
Computer (192.168.1.10)
        |
        | destination on the same network (192.168.1.x) -> sent directly
        | destination outside the network (e.g. a website) -> sent to the gateway
        v
Gateway / router (192.168.1.1) --------> the rest of the Internet
```

## Router vs. switch: two devices, two roles

Both devices connect machines together, but at different scales:

| | Switch | Router |
|---|---|---|
| Connects | Several machines **on the same local network** | Several distinct **networks** to each other |
| Decision made on | The network card's physical address (*MAC* address) | The IP address (network part) |
| Typical use | Connecting the computers in the same office | Connecting a home network to the rest of the Internet |

> **Pitfall:** mixing up the two because of the box provided by an Internet service provider (often just called a "box" or "router"): it actually combines a router, a switch, and a Wi-Fi access point into a single unit.

## The OSI layers: splitting responsibilities

The **OSI model** breaks down every network communication into 7 stacked layers, each handling one specific concern and relying on the layer below it:

| Layer | Role | Example |
|---|---|---|
| 7. Application | The protocol used by the program itself | HTTP, DNS |
| 6. Presentation | Data format (encryption, encoding) | TLS |
| 5. Session | Opening/closing a conversation between two machines | - |
| 4. Transport | Splitting into packets, delivery reliability | TCP, UDP |
| 3. Network | IP addressing and routing between networks | IP, the router |
| 2. Data link | Physical addressing (MAC) within a single local network | Ethernet, the switch |
| 1. Physical | The physical medium carrying the signal | Cable, Wi-Fi |

In practice, a developer mostly deals with layers 3 to 7: [working with a socket](/?c=reseaux&p=sockets-et-io-non-bloquante) happens at the transport layer (TCP/UDP), while an [HTTP API](/?c=infrastructure&p=api-et-http) sits at the application layer.

## Two complementary mechanisms: DHCP and NAT

Two services automate part of what this chapter just explained manually:

- **[DHCP](https://en.wikipedia.org/wiki/Dynamic_Host_Configuration_Protocol)** (*Dynamic Host Configuration Protocol*) automatically assigns an IP address, a mask, and a gateway to every machine that joins the network, instead of configuring them by hand.
- **[NAT](https://en.wikipedia.org/wiki/Network_address_translation)** (*Network Address Translation*) lets several machines on a local network, each with its own private IP address, share a single public IP address to reach the Internet: that's what a home router does for every device in the household.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An IP address identifies a machine; the subnet mask separates the network part from the host part; the gateway is the exit from the local network; a switch connects machines on one network, a router connects networks to each other. |
| **Tools you can use** | The OSI model to place a network problem in the right layer; DHCP for automatic address assignment; NAT for sharing a single public IP. |
| **Pitfalls to avoid** | Confusing a router with a switch, or assuming a "box" is a single type of device when it actually combines several. |
| **Best practices** | Always check whether two machines share the same network part before investigating why they can't communicate directly. |
