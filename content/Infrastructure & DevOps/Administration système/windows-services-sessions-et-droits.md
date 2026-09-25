---
order: 7
---

# Windows : services, sessions et droits

Ce chapitre explique comment [Windows](/?c=infrastructure-devops&s=systemes-d-exploitation) organise les programmes qui tournent sur une machine : qui les lance, sur quel écran ils s'affichent, et avec quels droits. Ces notions deviennent concrètes dès qu'on veut faire tourner un programme sans surveillance (un robot qui pilote un navigateur, un agent de déploiement) : selon la façon dont il est lancé, sa fenêtre peut être invisible, ou ses droits trop larges.

Rappel des briques utilisées : un **programme** en cours d'exécution s'appelle un [processus](/?c=langages&s=powershell&p=gestion-des-processus) ; chaque processus tourne pour le compte d'un **compte utilisateur** (un identifiant avec ses droits, voir [les permissions](/?c=langages&s=powershell&p=permissions-et-fichiers)).

## Les sessions Windows

Une **session** regroupe un bureau (l'écran d'accueil avec ses fenêtres) et tous les programmes lancés par un utilisateur connecté. Plusieurs sessions peuvent exister en même temps sur une même machine, chacune avec son propre numéro.

```text
Machine Windows
├── Session 0 : services (aucun utilisateur, aucun écran)
├── Session 1 : Alice, connectée sur l'écran physique  ← la console
└── Session 2 : Bob, connecté à distance
```

| Terme | Ce que c'est |
|---|---|
| **Session interactive** | Session d'un utilisateur connecté, avec un bureau où ses fenêtres s'affichent |
| **Console** | La session reliée à l'écran, au clavier et à la souris physiques de la machine |
| **Session verrouillée** | Session toujours ouverte (programmes en cours), mais masquée derrière l'écran de connexion |

Verrouiller une session (touches `Windows` + `L`) ne ferme aucun programme : ils continuent de tourner. En revanche, l'affichage n'est plus envoyé vers un écran : un programme qui dépend d'une fenêtre réellement visible (capture d'écran, automatisation qui clique dans une interface) peut alors échouer ou ne produire que des images noires.

```powershell
# liste les sessions de la machine avec leur numéro et leur état
query session
```

| Colonne affichée | Signification |
|---|---|
| `SESSIONNAME` | `services` pour la session 0, `console` pour l'écran physique, `rdp-tcp#…` pour une connexion à distance |
| `ID` | Numéro de la session |
| `STATE` | `Active` (utilisée), `Disc` (déconnectée mais toujours ouverte) |

## Les services Windows et l'isolation de la Session 0

Un **service** est un programme que Windows démarre lui-même, souvent dès l'allumage de la machine, sans attendre qu'un utilisateur se connecte (un antivirus, un serveur web, un agent de déploiement). Documentation : [Services](https://learn.microsoft.com/en-us/windows/win32/services/services).

Depuis Windows Vista, tous les services tournent dans la **Session 0**, une session réservée qui n'est reliée à aucun écran, ni physique ni à distance. C'est l'**isolation de la Session 0** : elle empêche un programme malveillant lancé par un utilisateur d'envoyer des messages aux fenêtres d'un service (qui a souvent des droits élevés).

| | Programme lancé par un utilisateur | Service |
|---|---|---|
| Démarrage | Quand l'utilisateur le lance | Par Windows, souvent au démarrage de la machine |
| Session | Celle de l'utilisateur (1, 2…) | Toujours la Session 0 |
| Fenêtre | Visible sur le bureau de l'utilisateur | Créée et dessinée en mémoire, mais jamais visible |
| Fonctionne sans utilisateur connecté | Non | Oui |

> **Piège :** lancer comme service un programme qui a besoin d'une fenêtre visible, par exemple un robot qui pilote un navigateur en mode fenêtré. Le programme tourne sans erreur, mais personne ne peut voir ni débloquer sa fenêtre (un captcha à résoudre à la main, par exemple). L'outil qui permettait de jeter un œil à la Session 0 (*Interactive Services Detection*) a été supprimé dans Windows 10 version 1803 ([Interactive Services](https://learn.microsoft.com/en-us/windows/win32/services/interactive-services)).
>
> **Bonne pratique :** un programme qui doit afficher une fenêtre se lance dans une session interactive (au démarrage de la session d'un compte dédié, voir la section suivante), jamais comme service.

```powershell
# liste les services et leur état (Running = en cours, Stopped = arrêté)
Get-Service
# affiche, pour chaque service, le compte sous lequel il tourne
Get-CimInstance Win32_Service | Select-Object Name, State, StartName
```

## Ouvrir une session automatiquement (autologon) et les secrets LSA

Un programme qui doit tourner dans une session interactive a besoin qu'une session soit ouverte, y compris après un redémarrage de la machine. L'**ouverture automatique de session** (*autologon*) connecte un compte choisi à chaque démarrage, sans que personne ne tape son mot de passe.

Pour cela, Windows doit connaître le mot de passe du compte. Il le range dans les **secrets LSA** : la **LSA** (*Local Security Authority*) est le composant de Windows qui vérifie les identités et conserve des informations sensibles sous forme chiffrée ([LSA Authentication](https://learn.microsoft.com/en-us/windows/win32/secauthn/lsa-authentication)). L'outil officiel [Autologon](https://learn.microsoft.com/en-us/sysinternals/downloads/autologon) (Sysinternals) configure ce mécanisme sans écrire le mot de passe en clair.

| | Ce que l'autologon apporte | Ce qu'il coûte |
|---|---|---|
| Disponibilité | La session se rouvre seule après chaque redémarrage | La session reste ouverte en permanence : quiconque accède physiquement à l'écran l'utilise |
| Mot de passe | Personne n'a besoin de le taper | Chiffré, mais récupérable par tout administrateur de la machine |

> **Piège :** activer l'autologon avec un compte personnel ou un compte qui a des droits sur d'autres machines : un administrateur de cette seule machine peut en extraire le mot de passe et l'utiliser ailleurs.
>
> **Bonne pratique :** réserver l'autologon à un compte dédié, local, avec le minimum de droits (principe de [moindre privilège](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)), et verrouiller physiquement l'accès à la machine.

## UAC : des droits portés par chaque processus

Sous Windows, les droits ne sont pas attachés à la session mais à chaque processus, via un **jeton d'accès** (*access token*) : une fiche que Windows joint au processus à son lancement et qui liste le compte, ses groupes et ses privilèges ([Access Tokens](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-tokens)).

L'**UAC** (*User Account Control*, contrôle de compte d'utilisateur) fait que même un compte administrateur lance ses programmes avec un jeton **filtré**, sans les droits d'administration. Ces droits ne sont accordés qu'à un processus précis, après confirmation ([User Account Control](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/user-account-control/)).

| Situation | Jeton du processus lancé |
|---|---|
| Programme lancé normalement, même par un administrateur | Filtré : droits d'utilisateur standard |
| « Exécuter en tant qu'administrateur », puis confirmation | Complet, pour ce seul processus |
| Compte standard + identifiants d'un administrateur tapés dans la fenêtre UAC | Jeton de cet administrateur, pour ce seul processus ; le compte connecté ne gagne aucun droit |

Analogie : une caissière (compte standard) appelle la responsable, qui tape son code sur la caisse pour valider une seule opération. La responsable ne donne pas son code, et la caisse ne reste pas déverrouillée pour la suite.

```powershell
# affiche les groupes du jeton de la console courante ;
# la ligne "Mandatory Label" indique Medium (filtré) ou High (élevé)
whoami /groups
# lance une nouvelle console PowerShell avec un jeton élevé (fenêtre UAC)
Start-Process powershell -Verb RunAs
```

> **Piège :** croire qu'un programme hérite des droits d'administrateur parce que le compte connecté est administrateur. Sans élévation explicite, il tourne avec un jeton filtré et échoue sur toute action réservée (écrire dans `C:\Program Files`, modifier un service).
>
> **Bonne pratique :** n'élever que le processus qui en a besoin, au moment où il en a besoin, plutôt que de donner des droits d'administration permanents au compte.

## Comptes de service : local ou domaine

Un **compte de service** est un compte utilisateur dédié à une application plutôt qu'à une personne ([Service User Accounts](https://learn.microsoft.com/en-us/windows/win32/services/service-user-accounts)). Il ne faut pas le confondre avec le compte de service utilisé entre applications web, vu dans [la propagation d'identité](/?c=securite&s=delegation-et-federation-didentite&p=on-behalf-of) : ici, c'est un vrai compte Windows qui ouvre des sessions et lance des processus.

En entreprise, les comptes sont souvent gérés par **Active Directory** (AD) : un annuaire central, hébergé sur des serveurs dédiés, qui connaît tous les comptes et toutes les machines de l'entreprise ; on appelle **domaine** l'ensemble des machines qu'il gère ([Active Directory Domain Services](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)).

| Type de compte | Existe | Si son mot de passe est volé |
|---|---|---|
| **Local** | Sur une seule machine | L'attaquant n'agit que sur cette machine |
| **Du domaine** (AD) | Sur toutes les machines du domaine | L'attaquant peut s'en servir partout où ce compte a des droits |

> **Bonne pratique :** pour un programme qui tourne sur une seule machine, préférer un compte local sans droits d'administration : le vol de son mot de passe (par exemple via l'autologon ci-dessus) ne donne accès qu'à cette machine.

## Les stratégies de groupe (GPO)

Une **stratégie de groupe** (*Group Policy Object*, GPO) est un ensemble de réglages définis une fois par les administrateurs d'un domaine, puis appliqués automatiquement à des machines ou à des comptes ([Group Policy overview](https://learn.microsoft.com/en-us/troubleshoot/windows-server/group-policy/group-policy-overview)). Exemple : verrouiller l'écran après 10 minutes d'inactivité sur toutes les machines.

Une GPO s'applique à un groupe de machines ou de comptes : les administrateurs peuvent donc prévoir une exception, par exemple ne pas verrouiller la session d'un compte de service dont le programme a besoin d'un écran actif.

```powershell
# affiche les stratégies de groupe appliquées à la machine et au compte courant
gpresult /r
```

> **Piège :** régler à la main sur la machine un paramètre qu'une GPO impose : il est écrasé à la prochaine actualisation des stratégies (par défaut toutes les 90 minutes environ, et à chaque redémarrage).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Chaque session a son bureau ; les services tournent dans la Session 0, sans écran. Les droits sont portés par le jeton de chaque processus (UAC), pas par la session. L'autologon rouvre une session à chaque démarrage en gardant le mot de passe dans les secrets LSA. |
| **Outils utilisables** | `query session`, `Get-Service`, `whoami /groups`, `Start-Process -Verb RunAs`, `gpresult /r`, Sysinternals Autologon. |
| **Pièges à éviter** | Lancer comme service un programme qui a besoin d'une fenêtre visible ; activer l'autologon avec un compte du domaine ; régler à la main ce qu'une GPO impose. |
| **Bonnes pratiques** | Compte dédié, local et sans droits d'administration pour un programme autonome ; élever un seul processus, au moment où il en a besoin ; demander une exception de GPO plutôt que la contourner. |
