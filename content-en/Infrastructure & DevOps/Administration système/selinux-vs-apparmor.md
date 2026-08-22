---
order: 3
---

# SELinux vs AppArmor

Classic Unix permissions (see [Permissions and File Manipulation](/?c=shells&s=bash&p=permissions-et-fichiers)) follow a **discretionary** model (*DAC*, *Discretionary Access Control*): a file's owner decides for themselves who can access it. **Mandatory access control** (*MAC*) adds a layer of rules imposed by the system, which not even the file's owner can bypass: useful for limiting the damage if a program is compromised, by preventing it from accessing files outside its normal scope, even if it's running with Unix permissions broad enough to do so.

## Two implementations, two distributions

SELinux and AppArmor address the same need (MAC) with different approaches; each distribution ships one by default, consistent with [the choice seen previously](/?c=administration-systeme&p=virtualisation-et-choix-dos):

| | SELinux | AppArmor |
|---|---|---|
| Default distribution | Rocky Linux (RHEL) | Debian, Ubuntu |
| Model | Based on **labels** attached to each file/process | Based on **file paths** |
| Where the rules live | A central policy, mapping which labels may interact with which others | One profile per program, listing allowed paths and permissions |
| Learning curve | Steeper, but more precise | Simpler to read and write |

## SELinux: a system of labels

Every file and every process gets a **label** (e.g. `httpd_sys_content_t` for files served by a web server). The SELinux policy defines which labels are allowed to interact with which other labels: a process labeled `httpd_t` can read files labeled `httpd_sys_content_t`, but is denied access to files carrying a different label, even if classic Unix permissions would otherwise allow it.

```bash
getenforce          # shows the current mode
setenforce 1         # enables "enforcing" mode (blocks violations)
```

| Mode | Effect |
|---|---|
| `Enforcing` | Blocks and logs every policy violation |
| `Permissive` | Logs violations without blocking them (useful for testing a policy) |
| `Disabled` | SELinux fully disabled |

## AppArmor: profiles by path

AppArmor directly attaches a **profile** to each program, listing the file paths it can access (and with what permissions), instead of going through a separate labeling system:

```text
/usr/sbin/nginx {
    /var/www/html/** r,      # read-only access to the site's files
    /var/log/nginx/*.log w,  # write access to its own logs
}
```

| Mode | Effect |
|---|---|
| `enforce` | Blocks and logs every profile violation |
| `complain` | Logs violations without blocking them |

> **Note:** in both systems, a "log without blocking" mode (`permissive`/`complain`) is used to validate a new policy or profile before actually enabling it, by observing in the system logs what would have been blocked.

> **Pitfall:** simply disabling SELinux or AppArmor to "make an access error go away" without understanding why it happens: that removes the entire MAC protection instead of fixing the actual label or profile at fault.
>
> **Best practice:** use the logging-only mode (`Permissive`/`complain`) to precisely identify the missing rule, add it to the policy/profile, then switch back to strict mode (`Enforcing`/`enforce`).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Mandatory access control (MAC) adds system-imposed rules on top of classic Unix permissions. SELinux (Rocky) labels files and processes; AppArmor (Debian) defines profiles by path. |
| **Tools you can use** | `getenforce`/`setenforce` for SELinux; the profiles under `/etc/apparmor.d/` for AppArmor. |
| **Pitfalls to avoid** | Fully disabling MAC protection to work around a poorly understood access error. |
| **Best practices** | Diagnose in logging-only mode (`Permissive`/`complain`) before fixing, then switch back to strict mode. |
