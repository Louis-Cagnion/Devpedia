---
order: 1
---

# Authentification multifacteur

Le chapitre [Authentification vs autorisation](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation) distingue trois familles de preuves d'identité : quelque chose que l'on sait, que l'on a, ou que l'on est. La plupart des comptes ne s'appuient que sur une seule (le mot de passe) : un secret unique, qui suffit à tout compromettre s'il fuite. L'**authentification multifacteur** (MFA, *Multi-Factor Authentication*) consiste à exiger au moins deux preuves **de familles différentes** avant d'accorder l'accès.

> **Piège :** confondre "deux vérifications" et "deux facteurs". Un mot de passe suivi d'une question secrète ("le nom de votre premier animal ?") reste un seul facteur (quelque chose que l'on sait) répété deux fois : les deux preuves relèvent de la même famille, et un attaquant capable de deviner ou trouver l'une a de bonnes chances de trouver l'autre par le même moyen (recherche sur les réseaux sociaux, par exemple).
>
> **Bonne pratique :** combiner deux facteurs de familles réellement différentes (un mot de passe + un code généré par une application, par exemple), jamais deux variantes du même type de preuve.

## Pourquoi combiner deux facteurs réduit drastiquement le risque

Les fuites de mots de passe sont massives et régulières : des bases entières de mots de passe volés circulent, et un mot de passe réutilisé sur plusieurs sites peut être testé automatiquement partout où il a servi. Sans second facteur, un mot de passe compromis suffit à ouvrir le compte. Avec un second facteur d'une autre famille, l'attaquant doit en plus posséder physiquement l'objet (téléphone, clé de sécurité) ou la caractéristique biologique de la victime : un obstacle nettement plus difficile à franchir à distance.

## Les méthodes courantes de second facteur

| Méthode | Principe | Point faible principal |
|---|---|---|
| Code par SMS | Un code envoyé par message au téléphone de l'utilisateur | Vulnérable au [*SIM swapping*](https://en.wikipedia.org/wiki/SIM_swap_scam) (transférer le numéro de téléphone vers une carte SIM contrôlée par l'attaquant) |
| Application d'authentification ([TOTP](https://en.wikipedia.org/wiki/Time-based_one-time_password)) | Un code généré localement, qui change toutes les 30 secondes | Reste utilisable si l'utilisateur le saisit sur un faux site ([hameçonnage](https://en.wikipedia.org/wiki/Hame%C3%A7onnage)) |
| Clé de sécurité physique ([FIDO2](https://en.wikipedia.org/wiki/FIDO2_Project)/[WebAuthn](https://en.wikipedia.org/wiki/WebAuthn)) | Un objet physique qui répond cryptographiquement à une demande du site | Coût de l'objet, doit être physiquement présent |

## TOTP : générer un code sans connexion réseau

Un code **TOTP** (*Time-based One-Time Password*) fonctionne sans que l'application et le serveur communiquent au moment de la génération : les deux partagent un secret, établi une seule fois (typiquement via un QR code scanné à l'activation), puis calculent chacun de leur côté un code à partir de ce secret et de l'heure actuelle, arrondie à une fenêtre de 30 secondes :

```text
Secret partage (etabli une seule fois, a l'activation)
        |
        +-- Application : calcule un code a partir du secret + l'heure actuelle
        +-- Serveur      : calcule le meme code, independamment, avec le meme secret + la meme heure

Les deux codes correspondent sans qu'aucun message n'ait transite entre les deux
```

C'est ce qui permet à une application d'authentification de fonctionner même sans connexion internet : elle n'a besoin que d'une horloge à peu près synchronisée, pas d'un échange réseau.

## La clé de sécurité physique : la protection la plus robuste face au phishing

Un code TOTP reste vulnérable si l'utilisateur le saisit lui-même sur un faux site qui imite le vrai (une attaque d'[hameçonnage](https://en.wikipedia.org/wiki/Hame%C3%A7onnage), *phishing*) : rien n'empêche techniquement de taper le bon code au mauvais endroit. Une clé de sécurité physique (FIDO2/WebAuthn) élimine ce risque différemment : elle vérifie cryptographiquement l'adresse exacte du site qui la sollicite, et refuse de répondre si l'adresse ne correspond pas à celle enregistrée à l'origine, même si le faux site est visuellement identique au vrai.

> **Piège :** mettre en place une authentification multifacteur robuste, mais laisser un moyen de récupération de compte trop permissif ("second facteur perdu ? répondez à ces questions de sécurité"). Un attaquant cible alors ce chemin de récupération plus faible plutôt que d'attaquer le second facteur lui-même, ce qui annule tout le bénéfice du MFA.
>
> **Bonne pratique :** appliquer au processus de récupération du second facteur le même niveau d'exigence qu'à l'authentification elle-même, plutôt que de le traiter comme un simple filet de sécurité secondaire.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'authentification multifacteur exige au moins deux preuves d'identité de familles différentes (savoir/avoir/être), pas deux variantes du même type. Un mot de passe compromis ne suffit alors plus, l'attaquant doit aussi posséder le second facteur. |
| **Outils utilisables** | Une application TOTP (code généré localement, sans réseau) ; une clé de sécurité physique FIDO2/WebAuthn pour la protection la plus robuste face au phishing. |
| **Pièges à éviter** | Confondre deux vérifications du même facteur avec un vrai second facteur. Laisser un chemin de récupération de compte trop permissif, qui contourne le MFA. |
| **Bonnes pratiques** | Combiner deux facteurs de familles réellement différentes. Appliquer le même niveau d'exigence au processus de récupération qu'à l'authentification elle-même. |
