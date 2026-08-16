---
order: 4
---

# Gestion des secrets

Un **secret** est une information qui donne un accès si elle est connue : mot de passe, clé d'API, jeton d'authentification, clé privée de chiffrement, chaîne de connexion à une base de données. Un secret compromis équivaut à donner directement à un attaquant l'accès qu'il protège, quelle que soit la solidité du reste du système.

## Le piège le plus fréquent : le secret en dur dans le code

```text
// Dangereux : le secret est ecrit directement dans le code source
cle_api = "sk_live_51H8xJ2eZvKYlo2C..."

// Ce code, une fois commite dans Git, expose ce secret :
// - a quiconque a acces au depot (y compris un depot prive, si son acces fuit un jour)
// - definitivement dans l'historique, meme si la ligne est supprimee plus tard
//   (voir Annuler des changements et naviguer dans l'historique)
```

Une fois un secret commité, le simple retirer du fichier ne suffit pas : il reste consultable dans l'historique Git tant qu'il n'a pas été réécrit (opération lourde et risquée sur un dépôt partagé, voir [Annuler des changements et naviguer dans l'historique](/?c=git&p=annuler-et-historique)) ; et même après une réécriture, un clone déjà existant ailleurs peut avoir conservé la version compromise. La seule protection fiable une fois un secret exposé est de le **révoquer et le remplacer immédiatement**, jamais de compter sur sa suppression du dépôt.

## Où stocker un secret : trois approches, du plus simple au plus robuste

| Approche | Principe | Cas d'usage typique |
|---|---|---|
| **Variable d'environnement** | Le secret est fourni au programme par le système d'exploitation au démarrage, jamais écrit dans un fichier suivi par Git | Développement local, petits projets |
| **Fichier `.env` ignoré par Git** | Un fichier séparé du code, listé dans [`.gitignore`](/?c=git&p=gitignore), qui définit les variables d'environnement du projet | Développement local avec plusieurs secrets, équipe réduite |
| **Coffre-fort de secrets** (*secrets vault*) | Un service dédié qui stocke, chiffre et distribue les secrets à la demande, avec traçabilité de qui y accède | Production, équipes plus grandes, conformité réglementaire |

```bash
# Fichier .env (jamais commité, voir .gitignore)
DATABASE_URL=postgres://user:motdepasse@localhost/mabase
API_KEY=sk_live_51H8xJ2eZvKYlo2C...
```

```text
// Le code lit la variable d'environnement, jamais une valeur ecrite en dur
cle_api = lire_variable_environnement("API_KEY")
```

## Les coffres-forts de secrets (*vaults*)

Au-delà d'un simple fichier `.env`, un coffre-fort de secrets est un service dédié (par exemple [HashiCorp Vault](https://www.vaultproject.io) ou un gestionnaire de secrets intégré à un fournisseur cloud comme [AWS Secrets Manager](https://aws.amazon.com/secrets-manager)) qui apporte ce qu'un fichier `.env` ne peut pas offrir :

| Besoin | Fichier `.env` | Coffre-fort de secrets |
|---|---|---|
| Stockage chiffré au repos | Non (texte brut sur le disque) | Oui |
| Qui a consulté quel secret, et quand | Aucune trace | Journalisé (audit) |
| Rotation automatique des secrets | Manuelle | Souvent automatisable |
| Accès révocable individuellement | Difficile (le fichier entier est partagé) | Un accès précis peut être retiré sans toucher aux autres |

## La rotation des secrets

**Faire tourner** (*rotate*) un secret signifie le remplacer périodiquement par une nouvelle valeur, même en l'absence de compromission connue : cela réduit la fenêtre de temps pendant laquelle un secret volé, mais pas encore détecté, reste exploitable. Un secret jamais renouvelé reste valide indéfiniment, y compris pour un attaquant qui l'aurait obtenu des mois auparavant sans que personne ne le sache.

## Secrets et intégration continue

Un pipeline [CI/CD](/?c=ci-cd&p=pipeline-cicd) a lui aussi besoin de secrets (déployer sur un serveur, publier un paquet, appeler une API tierce), sans jamais les écrire dans le fichier de configuration du pipeline lui-même (suivi par Git, donc visible par quiconque a accès au dépôt) : la plateforme CI fournit à la place un espace dédié, chiffré, où déclarer ces secrets une fois, puis les injecter comme variables d'environnement lors de l'exécution du pipeline.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un secret (mot de passe, clé d'API, jeton) donne un accès direct s'il est connu. Ne jamais l'écrire en dur dans le code ; une fois commité, il reste exposé dans l'historique même après suppression. |
| **Outils utilisables** | Variables d'environnement, fichier `.env` [ignoré par Git](/?c=git&p=gitignore), coffre-fort de secrets (Vault, gestionnaire de secrets cloud) pour la production. |
| **Pièges à éviter** | Coder un secret en dur ; croire qu'une suppression du fichier suffit à le sécuriser après une exposition ; ne jamais faire tourner un secret. |
| **Bonnes pratiques** | Révoquer et remplacer immédiatement tout secret exposé ; faire tourner les secrets périodiquement ; utiliser l'espace de secrets dédié d'une plateforme CI plutôt que le fichier de configuration du pipeline. |
