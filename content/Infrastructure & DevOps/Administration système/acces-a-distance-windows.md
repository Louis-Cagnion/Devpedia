---
order: 8
---

# Windows : accès à distance (RDP, tscon, shadowing)

Ce chapitre s'appuie sur [les sessions Windows](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#les-sessions-windows) : une session regroupe un bureau et les programmes d'un utilisateur connecté, et la **console** est celle qui s'affiche sur l'écran physique de la machine. Se connecter à distance déplace une session d'un écran à l'autre, ce qui compte dès qu'un programme sans surveillance (un robot qui pilote un navigateur, un test d'interface) a besoin d'une fenêtre réellement affichée.

## Le Bureau à distance (RDP)

Le **Bureau à distance** permet d'utiliser une machine Windows depuis une autre, comme si l'on était assis devant : son écran s'affiche dans une fenêtre, et le clavier et la souris la pilotent. Il repose sur le protocole **RDP** (*Remote Desktop Protocol*), qui écoute par défaut sur le [port](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement#lancer-un-serveur-local) 3389 de la machine distante ([Enable Remote Desktop on your PC](https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/remotepc/remote-desktop-allow-access)).

| Rôle | Éditions de Windows possibles |
|---|---|
| Machine à laquelle on se connecte (hôte) | Professionnel, Entreprise, Éducation, Windows Server ; jamais Famille |
| Machine depuis laquelle on se connecte (client) | Toutes, y compris Famille |

L'hôte s'active dans **Paramètres > Système > Bureau à distance** (droits d'administrateur requis) ; les membres du groupe Administrateurs et les comptes ajoutés à la liste peuvent alors s'y connecter. Côté client, l'application **Connexion Bureau à distance** se lance aussi en ligne de commande, sous le nom [`mstsc`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/mstsc) :

```powershell
# ouvre une connexion vers la machine nommée poste-robot (demande un compte et un mot de passe)
mstsc /v:poste-robot
```

## Se connecter « prend » la session

Si le compte utilisé pour se connecter a déjà une session ouverte sur la console, le Bureau à distance ne crée pas de seconde session : il **déplace** la session existante vers la fenêtre de connexion. L'écran physique affiche alors l'écran de connexion de Windows.

```text
Avant           Session 1 (compte robot) ──► écran physique (console)
Connexion RDP   Session 1 (compte robot) ──► fenêtre mstsc de l'opérateur
                écran physique           ──► écran de connexion
Fenêtre fermée  Session 1 (compte robot) ──► aucun écran : déconnectée et verrouillée
```

| Étape | Programmes du compte robot | Affichage de leurs fenêtres |
|---|---|---|
| Avant la connexion | Tournent | Sur l'écran physique |
| Pendant la connexion | Tournent | Dans la fenêtre de l'opérateur |
| Après fermeture de la fenêtre | Tournent toujours | Nulle part : la session est déconnectée (`Disc` dans `query session`) et verrouillée |

> **Piège :** fermer la fenêtre du Bureau à distance après être passé vérifier le robot. Ses programmes continuent de tourner, mais sans écran : une automatisation qui clique dans une interface ou fait des captures d'écran échoue dès cet instant. Microsoft le signale pour les tests d'interface lancés par un agent de déploiement ([Configure for UI testing](https://learn.microsoft.com/en-us/azure/devops/pipelines/test/ui-testing-considerations)).

## Rendre la session à la console : `tscon`

[`tscon`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tscon) relie une session à un autre écran. Avec `/dest:console`, il renvoie la session vers l'écran physique au lieu de la laisser déconnectée : la fenêtre du Bureau à distance se ferme, et les programmes retrouvent un écran, sans verrouillage.

```powershell
# liste les sessions ; la ligne marquée ">" est la session courante,
# son numéro est dans la colonne ID
query session
# renvoie la session numéro 1 vers l'écran physique (à lancer en tant qu'administrateur)
tscon 1 /dest:console
```

Le numéro change d'une connexion à l'autre. Microsoft propose un fichier de commandes qui le retrouve seul, à enregistrer sous un nom en `.bat`, puis à lancer depuis un raccourci réglé sur « Exécuter en tant qu'administrateur » :

```text
rem pour chaque session du compte connecté, lit le numéro (3e colonne)
rem et la renvoie vers la console
for /f "skip=1 tokens=3" %%s in ('query user %USERNAME%') do (
  %windir%\System32\tscon.exe %%s /dest:console
)
```

| | Fermer la fenêtre du Bureau à distance | `tscon … /dest:console` |
|---|---|---|
| Session du compte | Déconnectée, sans écran | Affichée sur l'écran physique |
| Verrouillage | Oui | Non |
| Programmes qui ont besoin d'une fenêtre visible | Échouent | Continuent |
| Droits nécessaires | Aucun | Administrateur (voir [l'élévation UAC](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#uac-des-droits-portes-par-chaque-processus)) |

> **Piège :** oublier que la machine reste **déverrouillée** : quiconque passe devant son écran physique utilise la session, avec les droits du compte. À réserver à une machine dans une pièce fermée, avec un compte dédié aux droits minimaux.
>
> **Piège :** `tscon` vers la session d'un **autre** compte échoue sans le mot de passe de ce compte (paramètre `/password`), même pour un administrateur.

## Observer une session sans la prendre : le shadowing

Le **shadowing** (« suivre comme une ombre ») affiche, dans une fenêtre du Bureau à distance, la session d'un autre compte **sans la déplacer** : elle reste sur son écran, l'opérateur la regarde en même temps, et peut en prendre le contrôle. Il n'a besoin ni de son mot de passe, ni de fermer quoi que ce soit en partant.

```powershell
# liste les sessions de la machine distante poste-robot, pour trouver le numéro (ID) à observer
query session /server:poste-robot
# observe la session 1 de poste-robot, avec le contrôle, sans demande d'autorisation
mstsc /v:poste-robot /shadow:1 /control /noConsentPrompt
```

| Paramètre de `mstsc` | Effet |
|---|---|
| `/shadow:<ID>` | Numéro de la session à observer |
| `/control` | Autorise clavier et souris ; sans lui, on ne fait que regarder |
| `/noConsentPrompt` | Ne demande pas l'accord de l'utilisateur observé, si la stratégie de la machine le permet |

Trois conditions doivent être réunies sur la machine observée :

| Condition | Détail |
|---|---|
| Stratégie autorisant le shadowing | [Stratégie de groupe](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#les-strategies-de-groupe-gpo) « Définir des règles pour le contrôle à distance des sessions utilisateur des services Bureau à distance » (Configuration ordinateur > Modèles d'administration > Composants Windows > Services Bureau à distance > Hôte de session Bureau à distance > Connexions). Cinq niveaux : aucun contrôle, contrôle total ou simple observation, chacun avec ou sans l'autorisation de l'utilisateur ([Session Shadowing](https://learn.microsoft.com/en-us/archive/technet-wiki/19804.remote-desktop-services-session-shadowing)). Par défaut : contrôle total **avec** autorisation |
| Droits de l'opérateur | Administrateur de la machine, ou permission de contrôle à distance accordée à son compte (règle documentée pour l'ancienne commande [`shadow`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/shadow), que `mstsc /shadow` remplace depuis Windows Server 2012 R2) |
| Accès réseau | Le shadowing ne passe pas seulement par le port 3389 : il utilise aussi le partage de fichiers de Windows ([SMB](https://learn.microsoft.com/en-us/windows-server/storage/file-server/file-server-smb-overview), port 445) et des [ports attribués à la volée](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/default-dynamic-port-range-tcpip-chang). Un [pare-feu](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld) qui n'ouvre que 3389 le bloque ; Windows fournit pour cela une règle intégrée, nommée « Remote Desktop - Shadow (TCP-In) » en anglais |

> **Piège :** lancer `/noConsentPrompt` alors que la stratégie impose l'autorisation de l'utilisateur. Une demande s'affiche sur la session observée, et sur celle d'un robot, personne n'est là pour l'accepter : l'opérateur ne voit rien.
>
> **Bonne pratique :** l'observation sans autorisation permet d'espionner une session : la réserver par stratégie aux comptes d'opérateurs qui en ont besoin, sur les seules machines concernées.

| | Connexion classique puis `tscon` | Shadowing |
|---|---|---|
| Mot de passe du compte observé | Nécessaire (on se connecte avec lui) | Inutile (l'opérateur utilise le sien) |
| Session du robot pendant l'intervention | Quitte l'écran physique | Reste sur son écran |
| En partant | `tscon` obligatoire, sinon session verrouillée | Fermer la fenêtre suffit |
| Réglages préalables | Bureau à distance activé | Stratégie de groupe, droits de l'opérateur, ouvertures réseau |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Se connecter en Bureau à distance avec un compte déplace sa session vers la fenêtre de connexion ; fermer cette fenêtre la laisse déconnectée et verrouillée, sans écran. `tscon … /dest:console` la rend à l'écran physique ; le shadowing la montre à un opérateur sans la déplacer. |
| **Outils utilisables** | `mstsc /v:<machine>`, `query session` (avec `/server:<machine>` à distance), `tscon <ID> /dest:console` en administrateur, `mstsc /shadow:<ID> /control /noConsentPrompt`, la stratégie de groupe de contrôle à distance. |
| **Pièges à éviter** | Fermer la fenêtre du Bureau à distance sur la session d'un robot ; oublier que `tscon` laisse la machine déverrouillée ; `/noConsentPrompt` contredit par la stratégie ; un pare-feu qui n'ouvre que le port 3389 au shadowing. |
| **Bonnes pratiques** | Pour vérifier un robot, préférer le shadowing à une connexion avec son compte ; sinon, toujours repartir par `tscon` ; réserver le shadowing sans autorisation aux opérateurs et machines qui en ont besoin. |
