---
order: 4
---

# SSH Tunnels and Port Forwarding

Some services are deliberately reachable only from the machine they run on: a database, an administration interface, a browser's debugging port. An **SSH tunnel** lets you reach them from another computer without exposing them to the network, by carrying the connection inside an already encrypted [SSH](/?c=shells&s=bash&p=bash) connection (*Secure Shell*, the standard protocol for securely connecting to a remote machine).

## Port, `localhost`: two notions to know

A machine receives connections on **ports**, numbers from 1 to 65535 that each designate a listening program (see [sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) for the mechanics on the program side). A service chooses which address it listens on:

| Listening address | Who can connect | Example |
|---|---|---|
| `0.0.0.0` | Any machine that reaches this one over the network | A public website |
| `127.0.0.1` (called `localhost`) | Only programs on **the same machine** | A development database, a debugging port |

`127.0.0.1` is the **loopback** address: a packet sent to it never leaves the machine. A service that only listens on `127.0.0.1` is therefore invisible from the network, even without a firewall (see [the firewall](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld)).

## The principle: local port forwarding

The `ssh -L` command opens a port on **your** machine and forwards everything arriving on it, through the SSH connection, to a port reachable from the **server**:

```text
Your PC                                 Remote server
┌─────────────────┐                     ┌──────────────────────────────┐
│ browser         │ encrypted tunnel    │ sshd (port 22, open)         │
│ → localhost:9222│  ================>  │   │                          │
└─────────────────┘                     │   ▼                          │
                                        │ service on 127.0.0.1:9222    │
                                        │ (invisible from the network) │
                                        └──────────────────────────────┘
```

```powershell
ssh -N -L 9222:localhost:9222 user@server.example.com
```

| Part | Meaning |
|---|---|
| `-L 9222:localhost:9222` | Listen on port 9222 of **my** machine, and forward to `localhost:9222` **as seen from the server** |
| `-N` | Run no command on the server: the session only serves the tunnel |
| `user@server.example.com` | Account and machine to connect to over SSH (usual authentication, by key or password) |

As long as this command runs, a local program that connects to `localhost:9222` is actually talking to the server's service. The `ssh` client ships with Windows 10 and 11, Linux and macOS ([ssh manual](https://man.openbsd.org/ssh)).

> **Pitfall:** in `-L 9222:localhost:9222`, the middle `localhost` designates the **server**, not your machine: the target is resolved on the other side of the tunnel. To reach a third computer from the server, put its address there (`-L 5433:internal-db:5432`).
>
> **Best practice:** pick a free number for the local port (using the same as the service is the easiest to remember), and check the tunnel with a real request (for example `curl http://localhost:9222/json/version` for Chrome debugging) rather than assuming it works.

## The three forms of forwarding

| Option | Direction | Typical use |
|---|---|---|
| `-L` (*local*) | A port on **my** machine leads to a port on the server side | Reaching a database or an administration interface on the server |
| `-R` (*remote*) | A port on the **server** leads to a port on my machine | Letting a server reach a service running at my place, behind a router |
| `-D` (*dynamic*) | A local port becomes a SOCKS proxy, which forwards to any destination | Sending all of a browser's traffic through the server |

## Pitfalls and limits

A tunnel deliberately bypasses the firewall: access is allowed because SSH is, not because the service is.

> **Pitfall:** exposing the tunnel to the network. By default `-L` only listens on `127.0.0.1`; writing `-L 0.0.0.0:9222:localhost:9222` makes the local port reachable by your computer's whole network, hence access to the remote service for anyone who reaches it, often with no authentication (Chrome's debugging port has none).
>
> **Best practice:** keep the default local listening (`127.0.0.1`), and never add a listening address without a precise reason.

> **Pitfall:** a tunnel drops silently when the SSH connection is cut (computer going to sleep, unstable network); the program using it then gets connection-refused errors, with no apparent link to SSH.
>
> **Best practice:** add `-o ServerAliveInterval=30` (a check message every 30 seconds, which detects a cut); for a permanent tunnel, let a tool restart it (`autossh`, or a system service).

> **Pitfall:** a `bind: Address already in use` error at startup means the local port is already taken (often by an old tunnel left open).
>
> **Best practice:** list the listening ports (`netstat -ano` on Windows, `ss -ltn` on Linux), close the old tunnel or pick another port.

On the server side, the administrator can forbid or limit forwarding with `AllowTcpForwarding` and `PermitOpen` in `/etc/ssh/sshd_config` (see [SSH hardening](/?c=infrastructure-devops&s=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe)).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A service that only listens on `127.0.0.1` is reachable only from its own machine. `ssh -L local_port:target:target_port user@server` opens a port on your machine and links it, over SSH, to a target seen from the server; `-R` does the opposite, `-D` creates a SOCKS proxy. Only the server's port 22 stays open. |
| **Tools you can use** | `ssh -N -L …` (tunnel without a session), `-o ServerAliveInterval=30` (cut detection), `autossh` (automatic restart), `curl`, `netstat -ano` / `ss -ltn` (check a tunnel and the ports in use). |
| **Pitfalls to avoid** | Thinking the middle `localhost` means your own machine. Listening on `0.0.0.0` and exposing an unauthenticated service to a whole network. Forgetting that a tunnel drops silently. A local port already in use. |
| **Best practices** | Keep the default local listening (`127.0.0.1`). Test the tunnel with a real request. Monitor the connection (`ServerAliveInterval`). Restrict forwarding on the server side (`AllowTcpForwarding`, `PermitOpen`). |
