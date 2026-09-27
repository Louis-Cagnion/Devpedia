---
order: 8
---

# Windows: Remote Access (RDP, tscon, Shadowing)

This chapter builds on [Windows sessions](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#windows-sessions): a session groups a desktop and the programs of a logged-in user, and the **console** is the one displayed on the machine's physical screen. Connecting remotely moves a session from one screen to another, which matters as soon as an unattended program (a robot driving a browser, a UI test) needs a window that is actually displayed.

## Remote Desktop (RDP)

**Remote Desktop** lets you use a Windows machine from another one, as if you were sitting in front of it: its screen is displayed in a window, and your keyboard and mouse drive it. It relies on the **RDP** protocol (*Remote Desktop Protocol*), which listens by default on [port](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement#launching-a-local-server) 3389 of the remote machine ([Enable Remote Desktop on your PC](https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/remotepc/remote-desktop-allow-access)).

| Role | Possible Windows editions |
|---|---|
| Machine you connect to (host) | Pro, Enterprise, Education, Windows Server; never Home |
| Machine you connect from (client) | All, including Home |

The host is enabled in **Settings > System > Remote Desktop** (administrator rights required); members of the Administrators group and the accounts added to the list can then connect to it. On the client side, the **Remote Desktop Connection** app can also be started from the command line, under the name [`mstsc`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/mstsc):

```powershell
# opens a connection to the machine named robot-pc (asks for an account and a password)
mstsc /v:robot-pc
```

## Connecting "Takes" the Session

If the account used to connect already has a session open on the console, Remote Desktop doesn't create a second session: it **moves** the existing session to the connection window. The physical screen then shows the Windows sign-in screen.

```text
Before          Session 1 (robot account) ──► physical screen (console)
RDP connection  Session 1 (robot account) ──► the operator's mstsc window
                physical screen           ──► sign-in screen
Window closed   Session 1 (robot account) ──► no screen: disconnected and locked
```

| Step | Programs of the robot account | Display of their windows |
|---|---|---|
| Before the connection | Running | On the physical screen |
| During the connection | Running | In the operator's window |
| After the window is closed | Still running | Nowhere: the session is disconnected (`Disc` in `query session`) and locked |

> **Pitfall:** closing the Remote Desktop window after checking on the robot. Its programs keep running, but without a screen: automation that clicks in an interface or takes screenshots fails from that moment on. Microsoft points this out for UI tests run by a deployment agent ([Configure for UI testing](https://learn.microsoft.com/en-us/azure/devops/pipelines/test/ui-testing-considerations)).

## Giving the Session Back to the Console: `tscon`

[`tscon`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tscon) connects a session to another screen. With `/dest:console`, it sends the session back to the physical screen instead of leaving it disconnected: the Remote Desktop window closes, and the programs get a screen again, without locking.

```powershell
# lists the sessions; the line marked ">" is the current session,
# its number is in the ID column
query session
# sends session number 1 back to the physical screen (run as administrator)
tscon 1 /dest:console
```

The number changes from one connection to the next. Microsoft provides a batch file that finds it by itself, to save under a name ending in `.bat`, then run from a shortcut set to "Run as administrator":

```text
rem for each session of the logged-in account, reads the number (3rd column)
rem and sends it to the console
for /f "skip=1 tokens=3" %%s in ('query user %USERNAME%') do (
  %windir%\System32\tscon.exe %%s /dest:console
)
```

| | Closing the Remote Desktop window | `tscon … /dest:console` |
|---|---|---|
| Account's session | Disconnected, without a screen | Displayed on the physical screen |
| Locking | Yes | No |
| Programs that need a visible window | Fail | Keep going |
| Rights required | None | Administrator (see [UAC elevation](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#uac-rights-carried-by-each-process)) |

> **Pitfall:** forgetting that the machine stays **unlocked**: anyone walking past its physical screen uses the session, with the account's rights. Reserve this for a machine in a closed room, with a dedicated account with minimal rights.
>
> **Pitfall:** `tscon` to the session of **another** account fails without that account's password (`/password` parameter), even for an administrator.

## Watching a Session Without Taking It: Shadowing

**Shadowing** (following like a shadow) displays, in a Remote Desktop window, another account's session **without moving it**: it stays on its screen, the operator watches it at the same time, and can take control of it. The operator needs neither its password nor to close anything when leaving.

```powershell
# lists the sessions of the remote machine robot-pc, to find the number (ID) to watch
query session /server:robot-pc
# watches session 1 of robot-pc, with control, without asking for permission
mstsc /v:robot-pc /shadow:1 /control /noConsentPrompt
```

| `mstsc` parameter | Effect |
|---|---|
| `/shadow:<ID>` | Number of the session to watch |
| `/control` | Allows keyboard and mouse; without it, you only watch |
| `/noConsentPrompt` | Doesn't ask the watched user for consent, if the machine's policy allows it |

Three conditions must be met on the watched machine:

| Condition | Detail |
|---|---|
| Policy allowing shadowing | [Group Policy](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#group-policies-gpo) "Set rules for remote control of Remote Desktop Services user sessions" (Computer Configuration > Administrative Templates > Windows Components > Remote Desktop Services > Remote Desktop Session Host > Connections). Five levels: no control, full control or view only, each with or without the user's permission ([Session Shadowing](https://learn.microsoft.com/en-us/archive/technet-wiki/19804.remote-desktop-services-session-shadowing)). By default: full control **with** permission |
| Operator's rights | Administrator of the machine, or remote control permission granted to their account (rule documented for the old [`shadow`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/shadow) command, which `mstsc /shadow` has replaced since Windows Server 2012 R2) |
| Network access | Shadowing doesn't only go through port 3389: it also uses Windows file sharing ([SMB](https://learn.microsoft.com/en-us/windows-server/storage/file-server/file-server-smb-overview), port 445) and [ports assigned on the fly](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/default-dynamic-port-range-tcpip-chang). A [firewall](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld) that only opens 3389 blocks it; Windows provides a built-in rule for it, named "Remote Desktop - Shadow (TCP-In)" |

> **Pitfall:** running `/noConsentPrompt` while the policy requires the user's permission. A request appears on the watched session, and on a robot's session nobody is there to accept it: the operator sees nothing.
>
> **Best practice:** watching without permission makes it possible to spy on a session: restrict it by policy to the operator accounts that need it, on the relevant machines only.

| | Classic connection then `tscon` | Shadowing |
|---|---|---|
| Password of the watched account | Required (you connect with it) | Not needed (the operator uses their own) |
| Robot's session during the intervention | Leaves the physical screen | Stays on its screen |
| When leaving | `tscon` mandatory, otherwise the session is locked | Closing the window is enough |
| Prior settings | Remote Desktop enabled | Group Policy, operator's rights, network openings |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Connecting through Remote Desktop with an account moves its session to the connection window; closing that window leaves it disconnected and locked, without a screen. `tscon … /dest:console` gives it back to the physical screen; shadowing shows it to an operator without moving it. |
| **Tools you can use** | `mstsc /v:<machine>`, `query session` (with `/server:<machine>` remotely), `tscon <ID> /dest:console` as administrator, `mstsc /shadow:<ID> /control /noConsentPrompt`, the remote control Group Policy. |
| **Pitfalls to avoid** | Closing the Remote Desktop window on a robot's session; forgetting that `tscon` leaves the machine unlocked; `/noConsentPrompt` contradicted by the policy; a firewall that only opens port 3389 to shadowing. |
| **Best practices** | To check on a robot, prefer shadowing to a connection with its account; otherwise, always leave through `tscon`; reserve shadowing without permission for the operators and machines that need it. |
