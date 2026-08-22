---
order: 9
---

# HashiCorp Vault : au-delà du fichier .env

[Gestion des secrets](/?c=cybersecurite&p=gestion-des-secrets) présente le coffre-fort de secrets (*vault*) comme la solution la plus robuste, avec **HashiCorp Vault** en exemple. Ce chapitre entre dans le fonctionnement concret de cet outil : ce qu'un coffre-fort de secrets sait faire qu'un simple fichier `.env` ne peut pas.

## Secret statique vs secret dynamique

Un secret **statique** (un mot de passe fixé une fois pour toutes, comme dans un fichier `.env`) reste valide indéfiniment tant que personne ne le change à la main. Vault peut en plus générer des secrets **dynamiques** : une identification créée à la demande, valable seulement pour une durée limitée, puis automatiquement révoquée.

```text
Application demande un identifiant de base de donnees a Vault
        |
        v
Vault cree un compte temporaire (login/mot de passe uniques)
        |
        v
Application utilise ce compte pendant 1h (duree de vie = "lease")
        |
        v
Au bout d'1h : Vault revoque automatiquement ce compte
```

| | Secret statique | Secret dynamique |
|---|---|---|
| Origine | Créé une fois par un humain, stocké tel quel | Généré à la demande par Vault, à chaque nouvelle utilisation |
| Durée de vie | Indéfinie, jusqu'à rotation manuelle | Limitée (*lease*), révoqué automatiquement à expiration |
| Fenêtre d'exploitation si volé | Illimitée tant que personne ne le change | Bornée à la durée du bail restant |

> **Piège :** traiter un secret dynamique comme un secret classique qu'on peut mettre en cache indéfiniment côté application. Un secret dynamique expire réellement : une application qui ne renouvelle jamais son bail (*lease renewal*) perd l'accès sans prévenir dès que le délai est écoulé.
>
> **Bonne pratique :** renouveler le bail avant son expiration pour un usage continu (la plupart des bibliothèques clientes Vault le font automatiquement), plutôt que de considérer un secret dynamique comme acquis une fois pour toutes.

## S'authentifier auprès de Vault : les auth methods

Avant de pouvoir lire un secret, un client (une application, un humain) doit lui-même prouver son identité à Vault via une **auth method** :

| Auth method | Principe | Cas d'usage typique |
|---|---|---|
| Token | Une chaîne opaque, générée à l'avance et transmise au client | Test manuel, script ponctuel |
| AppRole | Un identifiant + secret propres à une application, pensés pour une authentification automatisée sans intervention humaine | Un service qui démarre seul (serveur, conteneur) |
| Identité cloud (AWS IAM, Azure AD...) | Vault fait confiance à l'identité déjà prouvée par le fournisseur cloud sur lequel le client tourne | Application hébergée sur ce même cloud |

Une fois authentifié, le client reçoit un **token Vault** temporaire, qui accompagne chacune de ses requêtes suivantes.

## Contrôler l'accès : les policies

Une **policy** Vault définit, en texte, quels chemins de secrets un token peut lire, écrire ou lister — le même principe que le [contrôle d'accès (IDOR)](/?c=cybersecurite&p=owasp-top-10) vu ailleurs, appliqué ici aux secrets eux-mêmes plutôt qu'aux données d'une application :

```text
# Policy simplifiee : lecture seule sur les secrets de l'application "facturation"
path "secret/data/facturation/*" {
  capabilities = ["read"]
}
```

> **Piège :** accorder une policy trop large "pour ne pas bloquer le développement" (ex : accès à `secret/*` plutôt qu'au seul chemin nécessaire). Un token compromis expose alors tous les secrets de l'organisation, pas seulement ceux de l'application concernée.
>
> **Bonne pratique :** appliquer le principe du moindre privilège (déjà vu dans [Principes de développement sécurisé](/?c=cybersecurite&p=principes-de-developpement-securise)) à chaque policy : n'autoriser que les chemins et les capacités réellement nécessaires à ce client précis.

## Sealing et unsealing : Vault protège ses propres données

Toutes les données stockées par Vault sont chiffrées au repos avec une clé de chiffrement, elle-même protégée par un mécanisme de partage de clé (*Shamir's Secret Sharing*) : la clé n'existe jamais en entier chez une seule personne, elle est répartie en plusieurs parts.

| État | Description |
|---|---|
| **Sealed** (scellé) | Vault refuse toute opération : la clé de chiffrement n'est pas assemblée, les données restent illisibles même par un accès direct au disque |
| **Unsealed** (descellé) | Un nombre suffisant de détenteurs de parts ont fourni la leur : la clé est reconstituée en mémoire, Vault peut servir des requêtes |

Un redémarrage de Vault revient à l'état scellé : quelqu'un doit à nouveau fournir assez de parts de la clé pour le desceller, une protection délibérée contre un serveur qui redémarrerait de façon inattendue (ex : après une compromission) sans que personne ne s'en aperçoive.

## Vault Agent : automatiser l'authentification et la récupération des secrets

Plutôt que chaque application ne réimplémente sa propre logique d'authentification et de renouvellement de bail, **Vault Agent** tourne comme un processus à côté de l'application et s'en charge à sa place : il s'authentifie, récupère les secrets demandés, les écrit dans un fichier local (ou les injecte directement), et renouvelle automatiquement les baux qui approchent de leur expiration.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Vault va au-delà du fichier `.env` : secrets dynamiques à durée de vie limitée, authentification par auth method, contrôle d'accès fin par policy, données chiffrées et protégées par sealing/unsealing, Vault Agent pour automatiser authentification et renouvellement. |
| **Outils utilisables** | AppRole pour l'authentification automatisée d'un service, Vault Agent pour déléguer la gestion des baux à un processus dédié. |
| **Pièges à éviter** | Mettre en cache un secret dynamique sans jamais renouveler son bail. Accorder une policy trop large par simplicité. |
| **Bonnes pratiques** | Renouveler les baux avant expiration. Appliquer le moindre privilège à chaque policy, un chemin de secrets à la fois. |
