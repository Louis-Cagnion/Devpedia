---
order: 7
---

# Windows: Services, Sessions and Rights

This chapter explains how [Windows](/?c=infrastructure-devops&s=systemes-d-exploitation) organizes the programs running on a machine: who starts them, on which screen they are displayed, and with which rights. These notions become concrete as soon as you want a program to run unattended (a bot driving a browser, a deployment agent): depending on how it is started, its window may be invisible, or its rights too broad.

Reminder of the building blocks used here: a running **program** is called a [process](/?c=langages&s=powershell&p=gestion-des-processus); every process runs on behalf of a **user account** (an identity with its rights, see [permissions](/?c=langages&s=powershell&p=permissions-et-fichiers)).

## Windows Sessions

A **session** groups a desktop (the home screen with its windows) and every program started by a logged-in user. Several sessions can exist at the same time on the same machine, each with its own number.

```text
Windows machine
├── Session 0: services (no user, no screen)
├── Session 1: Alice, logged in on the physical screen  ← the console
└── Session 2: Bob, logged in remotely
```

| Term | What it is |
|---|---|
| **Interactive session** | Session of a logged-in user, with a desktop where their windows are displayed |
| **Console** | The session attached to the machine's physical screen, keyboard and mouse |
| **Locked session** | Session still open (programs running), but hidden behind the sign-in screen |

Locking a session (`Windows` + `L` keys) closes no program: they keep running. However, the display is no longer sent to any screen: a program that depends on a truly visible window (screenshot, automation clicking in an interface) can then fail or produce nothing but black images.

```powershell
# lists the machine's sessions with their number and state
query session
```

| Displayed column | Meaning |
|---|---|
| `SESSIONNAME` | `services` for session 0, `console` for the physical screen, `rdp-tcp#…` for a remote connection |
| `ID` | Session number |
| `STATE` | `Active` (in use), `Disc` (disconnected but still open) |

## Windows Services and Session 0 Isolation

A **service** is a program that Windows starts by itself, often as soon as the machine boots, without waiting for a user to log in (an antivirus, a web server, a deployment agent). Documentation: [Services](https://learn.microsoft.com/en-us/windows/win32/services/services).

Since Windows Vista, all services run in **Session 0**, a reserved session that is attached to no screen, neither physical nor remote. This is **Session 0 isolation**: it prevents a malicious program started by a user from sending messages to the windows of a service (which often has elevated rights).

| | Program started by a user | Service |
|---|---|---|
| Start | When the user launches it | By Windows, often at machine startup |
| Session | The user's own (1, 2…) | Always Session 0 |
| Window | Visible on the user's desktop | Created and drawn in memory, but never visible |
| Runs with no user logged in | No | Yes |

> **Pitfall:** running as a service a program that needs a visible window, for example a bot driving a browser in windowed mode. The program runs without errors, but nobody can see or unblock its window (a captcha to solve by hand, for example). The tool that allowed peeking into Session 0 (*Interactive Services Detection*) was removed in Windows 10 version 1803 ([Interactive Services](https://learn.microsoft.com/en-us/windows/win32/services/interactive-services)).
>
> **Best practice:** a program that must display a window is started in an interactive session (when a dedicated account's session opens, see the next section), never as a service.

```powershell
# lists services and their state (Running or Stopped)
Get-Service
# shows, for each service, the account it runs under
Get-CimInstance Win32_Service | Select-Object Name, State, StartName
```

## Opening a Session Automatically (Autologon) and LSA Secrets

A program that must run in an interactive session needs a session to be open, including after the machine restarts. **Automatic logon** (*autologon*) signs a chosen account in at every startup, without anyone typing its password.

To do so, Windows must know the account's password. It stores it in the **LSA secrets**: the **LSA** (*Local Security Authority*) is the Windows component that checks identities and keeps sensitive information in encrypted form ([LSA Authentication](https://learn.microsoft.com/en-us/windows/win32/secauthn/lsa-authentication)). The official [Autologon](https://learn.microsoft.com/en-us/sysinternals/downloads/autologon) tool (Sysinternals) sets this mechanism up without writing the password in plain text.

| | What autologon brings | What it costs |
|---|---|---|
| Availability | The session reopens by itself after every restart | The session stays open permanently: anyone with physical access to the screen can use it |
| Password | Nobody needs to type it | Encrypted, but recoverable by any administrator of the machine |

> **Pitfall:** enabling autologon with a personal account or an account that has rights on other machines: an administrator of this single machine can extract the password and use it elsewhere.
>
> **Best practice:** reserve autologon for a dedicated, local account with the minimum rights (principle of [least privilege](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)), and physically restrict access to the machine.

## UAC: Rights Carried by Each Process

On Windows, rights are not attached to the session but to each process, through an **access token**: a record that Windows attaches to the process when it starts, listing the account, its groups and its privileges ([Access Tokens](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-tokens)).

**UAC** (*User Account Control*) makes even an administrator account start its programs with a **filtered** token, without administrative rights. Those rights are only granted to one specific process, after confirmation ([User Account Control](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/user-account-control/)).

| Situation | Token of the started process |
|---|---|
| Program started normally, even by an administrator | Filtered: standard user rights |
| "Run as administrator", then confirmation | Full, for this single process |
| Standard account + an administrator's credentials typed into the UAC window | That administrator's token, for this single process; the logged-in account gains no rights |

Analogy: a cashier (standard account) calls the manager, who types her code on the till to approve a single operation. The manager does not hand over her code, and the till does not stay unlocked afterwards.

```powershell
# shows the groups of the current console's token;
# the "Mandatory Label" line says Medium (filtered) or High (elevated)
whoami /groups
# starts a new PowerShell console with an elevated token (UAC window)
Start-Process powershell -Verb RunAs
```

> **Pitfall:** believing a program inherits administrator rights because the logged-in account is an administrator. Without explicit elevation, it runs with a filtered token and fails on any restricted action (writing to `C:\Program Files`, changing a service).
>
> **Best practice:** elevate only the process that needs it, when it needs it, rather than giving the account permanent administrative rights.

## Service Accounts: Local or Domain

A **service account** is a user account dedicated to an application rather than to a person ([Service User Accounts](https://learn.microsoft.com/en-us/windows/win32/services/service-user-accounts)). Do not confuse it with the service account used between web applications, covered in [identity propagation](/?c=securite&s=delegation-et-federation-didentite&p=on-behalf-of): here, it is a real Windows account that opens sessions and starts processes.

In companies, accounts are often managed by **Active Directory** (AD): a central directory, hosted on dedicated servers, that knows every account and every machine of the company; the set of machines it manages is called a **domain** ([Active Directory Domain Services](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)).

| Account type | Exists | If its password is stolen |
|---|---|---|
| **Local** | On a single machine | The attacker can only act on that machine |
| **Domain** (AD) | On every machine of the domain | The attacker can use it wherever this account has rights |

> **Best practice:** for a program that runs on a single machine, prefer a local account without administrative rights: stealing its password (for example through the autologon above) only gives access to that machine.

## Group Policies (GPO)

A **group policy** (*Group Policy Object*, GPO) is a set of settings defined once by a domain's administrators, then automatically applied to machines or accounts ([Group Policy overview](https://learn.microsoft.com/en-us/troubleshoot/windows-server/group-policy/group-policy-overview)). Example: locking the screen after 10 minutes of inactivity on every machine.

A GPO applies to a group of machines or accounts: administrators can therefore plan an exception, for example not locking the session of a service account whose program needs an active screen.

```powershell
# shows the group policies applied to the machine and the current account
gpresult /r
```

> **Pitfall:** changing by hand on the machine a setting that a GPO enforces: it gets overwritten at the next policy refresh (by default about every 90 minutes, and at every restart).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Each session has its own desktop; services run in Session 0, with no screen. Rights are carried by each process's token (UAC), not by the session. Autologon reopens a session at every startup while keeping the password in the LSA secrets. |
| **Tools you can use** | `query session`, `Get-Service`, `whoami /groups`, `Start-Process -Verb RunAs`, `gpresult /r`, Sysinternals Autologon. |
| **Pitfalls to avoid** | Running as a service a program that needs a visible window; enabling autologon with a domain account; changing by hand what a GPO enforces. |
| **Best practices** | A dedicated, local account without administrative rights for an autonomous program; elevating a single process, when it needs it; asking for a GPO exception rather than working around it. |
