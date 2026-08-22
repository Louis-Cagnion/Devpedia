---
order: 4
---

# Hardening SSH, sudo, and Passwords

A system left with its default settings is still vulnerable to automated attacks that sweep the Internet testing standard ports and credentials. **Hardening** a system means reducing that attack surface: this chapter covers three frequently targeted entry points.

## Hardening remote access: SSH

[SSH](/?c=shells&s=bash&p=bash) (*Secure Shell*) is the standard protocol for administering a server remotely; its configuration file, `/etc/ssh/sshd_config`, controls its behavior:

| Setting | Effect | Why |
|---|---|---|
| `Port 2222` (instead of `22`) | Changes the default listening port | Cuts down the noise from automated scans that target port 22 by default (doesn't replace real security, but filters out the most basic attempts) |
| `PermitRootLogin no` | Forbids logging into SSH directly as `root` | Forces logging in with a named user account, then escalating privileges via `sudo` (see below): every action stays traceable to a specific person |

> **Note:** changing the SSH port doesn't replace other measures (a strong password, `PermitRootLogin no`): a targeted attacker can still scan every port. It's noise reduction, not protection on its own.

## Enforcing a password policy (PAM / `login.defs`)

**PAM** (*Pluggable Authentication Modules*) is the Linux system that handles authentication (passwords included) in a modular way; `/etc/login.defs` and the associated PAM modules let you enforce rules:

| Rule | Where | Example value |
|---|---|---|
| Password expiration | `login.defs` (`PASS_MAX_DAYS`) | 30 days |
| Minimum delay between two changes | `login.defs` (`PASS_MIN_DAYS`) | 2 days (prevents changing it twice in a row to go back to the old password) |
| Warning before expiration | `login.defs` (`PASS_WARN_AGE`) | 7 days ahead |
| Minimum complexity | PAM module (`pam_pwquality`) | Uppercase + lowercase + digit, at most 3 identical consecutive characters, different from the username, at least 7 characters different from the previous password |

## Hardening `sudo`

`sudo` lets an authorized user run a command with `root` privileges, without sharing the `root` password itself. Its configuration file (`/etc/sudoers`, edited via `visudo`) accepts several hardening settings:

```text
Defaults passwd_tries=3                          # 3 password attempts maximum
Defaults badpass_message="Incorrect password, attempt refused."
Defaults logfile="/var/log/sudo/sudo.log"        # logs every sudo command
Defaults log_input, log_output                    # also logs what was typed/displayed
Defaults use_pty                                  # runs the command in a dedicated pseudo-terminal
Defaults secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```

| Setting | Role |
|---|---|
| `passwd_tries` | Limits the number of attempts before blocking the command |
| `badpass_message` | Customizes the message shown on failure |
| `logfile` / `log_input` / `log_output` | Fully logs every command run via `sudo`, including what was typed and displayed |
| `use_pty` | Prevents certain techniques for bypassing logging by forcing a real pseudo-terminal |
| `secure_path` | Restricts which directories `sudo` searches for executable commands, preventing a directory added to a user's personal `PATH` (see [Environment Variables](/?c=shells&s=bash&p=variables-denvironnement)) from getting a malicious program run instead of the real one |

> **Pitfall:** logging `sudo` commands (`logfile`) without enabling `use_pty`: some interactive commands can then partially escape input/output capture.
>
> **Best practice:** combine all three areas from this chapter rather than hardening just one: a hardened SSH with a weak password, or the reverse, still leaves a door open.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Hardening a system combines three areas: SSH (non-standard port, direct `root` login forbidden), a strict password policy (PAM/`login.defs`), and a logged, restricted `sudo`. |
| **Tools you can use** | `/etc/ssh/sshd_config`, `/etc/login.defs` + `pam_pwquality`, `visudo`/`/etc/sudoers`. |
| **Pitfalls to avoid** | Logging `sudo` without `use_pty`; hardening only one of the three areas and leaving the others at their defaults. |
| **Best practices** | Restrict `secure_path`, require a named account before `sudo`, and always combine all three areas from this chapter. |
