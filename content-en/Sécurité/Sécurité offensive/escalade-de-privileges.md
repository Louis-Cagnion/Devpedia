---
order: 4
---

# Privilege Escalation

**Privilege escalation** is when an attacker already present on a system with limited access obtains higher rights than those originally granted (typically: going from a normal user account to `root` on Linux, or administrator on Windows). It's an almost systematic step after an initial intrusion: initial access rarely comes through an already all-powerful account.

## Vertical or Horizontal

| Type | What changes |
|---|---|
| **Vertical** | Limited access becomes higher-level access (normal user → root) |
| **Horizontal** | Access stays at the same privilege level, but changes account (user account A → user account B) |

The same vocabulary applies on the web side to [broken access control](/?c=cybersecurite&p=types-de-failles): accessing another customer's order (horizontal) differs from accessing the admin panel from a customer account (vertical).

## Common Causes

| Cause | Example |
|---|---|
| **Overly broad file permissions** | A configuration file containing a password, readable by every user on the system |
| **Misconfigured SUID binary** | On Linux, a program marked SUID (*Set User ID*) runs with the rights of its owner rather than those of whoever launches it; if it allows running an arbitrary command (e.g. a text editor launchable as SUID root), it becomes a shortcut to root access |
| **Unpatched vulnerable service** | A service already running with elevated rights (e.g. a system server) contains a flaw (see [Memory Corruption](/?c=securite&s=securite-offensive&p=corruption-memoire)) exploitable to run code with its own rights |
| **Poorly protected scheduled task** | An automated task periodically run by `root`, which launches a script that an unprivileged user can modify |

```text
Initial access (normal user, limited rights)
        |
        v
Looking for misconfigurations, SUID binaries, vulnerable services...
        |
        v
Exploiting one of the causes above
        |
        v
Access with higher rights (ideal for the attacker: root/administrator)
```

## The Link With Access Control Already Covered

This chapter looks at the same problem as [RBAC and ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac) and [Authentication vs Authorization](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation), but from the attacker's point of view rather than defensive design: those two chapters explain how to correctly model a system's rights; privilege escalation is what happens when that model is poorly applied in practice (a forgotten SUID binary, an overly permissive file permission) rather than poorly designed on paper.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | Privilege escalation turns limited access into higher-level access (vertical) or into access to another account at the same level (horizontal), typically through an overly broad permission, a misconfigured SUID binary, a vulnerable service, or a poorly protected scheduled task. |
| **Tools you can use** | An automated audit script for known misconfigurations (permissions, SUID binaries) on a lab system. |
| **Pitfalls to avoid** | Treating initial access as the end of the attack: it's often the starting point of the escalation. |
| **Best practices** | Apply the principle of least privilege (already introduced in [The Main Families of Vulnerabilities](/?c=cybersecurite&p=types-de-failles)) to every account and every binary, not just to user accounts themselves. |
