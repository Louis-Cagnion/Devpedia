---
order: 5
---

# Firewalls: UFW and firewalld

Even with [SSH hardened](/?c=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe) and [mandatory access control](/?c=administration-systeme&p=selinux-vs-apparmor) active, a service listening on a port is still reachable by anyone, on any open port. A **firewall** filters incoming (and sometimes outgoing) network traffic according to explicit rules: by default, anything not explicitly allowed is denied.

## The principle: allowlist rather than blocklist

The safest firewall setup starts by **denying everything**, then explicitly allows only what's genuinely needed (typically, a single open port: SSH):

```text
Incoming traffic
      |
      v
+-----------------+     port 22 (SSH) allowed -----> accepted
|    Firewall      |
|  (deny by         |     any other port ------------> denied
|   default)         |
+-----------------+
```

This is a direct application of the principle of least privilege (already seen applied to data in [Web API Security](/?c=cybersecurite&p=securite-api-web)): the shorter the list of open ports, the smaller the available attack surface.

## UFW (Debian): a simplified interface

**UFW** (*Uncomplicated Firewall*) is the default tool on Debian/Ubuntu; it simplifies configuring the Linux kernel's firewall without having to manipulate its low-level rules directly:

```bash
ufw default deny incoming   # deny all incoming traffic by default
ufw allow 2222/tcp          # allow only the SSH port (redefined here, see the previous chapter)
ufw enable                  # enable the firewall with these rules
ufw status                  # list the active rules
```

## firewalld (Rocky/RHEL): a zone-based system

**firewalld** is the default tool on Rocky Linux/RHEL; it organizes its rules into **zones**, each representing a level of network trust (e.g. `public`, `internal`, `trusted`), rather than a single global list of rules:

```bash
firewall-cmd --set-default-zone=public
firewall-cmd --zone=public --add-port=2222/tcp --permanent  # allow SSH in the "public" zone
firewall-cmd --reload                                        # apply the permanent rules
firewall-cmd --list-all                                       # list the active zone's rules
```

## Comparing the two

| | UFW | firewalld |
|---|---|---|
| Default distribution | Debian, Ubuntu | Rocky Linux, RHEL |
| Model | Global list of rules | Zones, each with its own set of rules |
| Applied immediately? | Yes, as soon as the command runs | Needs `--permanent` then `--reload` to persist across reboots |

> **Pitfall:** opening a port to test a configuration, then forgetting to close it once the test is done: the list of open ports should always reflect exactly the services that are actually needed, not a history of everything ever tried.
>
> **Best practice:** start from a total default denial and open only a single port (SSH) on a server that doesn't host any other exposed service, in line with the principle of least privilege.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A firewall filters network traffic; the safest setup denies everything by default and explicitly allows only the ports genuinely needed. UFW (Debian) uses a list of rules, firewalld (Rocky) uses zones. |
| **Tools you can use** | `ufw allow`/`ufw enable` (Debian); `firewall-cmd --add-port`/`--reload` (Rocky). |
| **Pitfalls to avoid** | Leaving open a port that was only meant for a one-off test. |
| **Best practices** | Deny everything by default and open only what's strictly necessary (SSH alone, on a server with no other exposed service). |
