---
order: 5
---

# Secrets oubliés en production

[Gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets) couvre où stocker un secret correctement (variable d'environnement, coffre-fort dédié) et comment l'injecter dans un pipeline CI/CD sans l'écrire en dur. Ce chapitre couvre deux façons dont un secret bien géré au départ finit malgré tout exposé : un fichier resté accessible publiquement, et un secret présent dans l'historique Git après suppression du fichier qui le contenait.

## Un fichier de configuration resté accessible par une URL devinable

Un fichier `.env` (variables d'environnement, souvent des secrets) ou une sauvegarde (`.bak`, `.sql`, `.zip` du site entier) déposée par erreur dans le dossier servi publiquement par le serveur web reste accessible à quiconque devine ou teste son adresse, exactement comme n'importe quelle autre page du site :

```text
https://site.example/index.php    -> la page normale du site
https://site.example/.env          -> si le fichier est dans le dossier public : TOUT LE CONTENU,
                                       secrets compris, s'affiche tel quel dans le navigateur
https://site.example/backup.sql    -> un dump de base de donnees entier, si oublie au meme endroit
```

Ce risque ne vient jamais d'une faille applicative (aucun code n'est exploité) : c'est une simple erreur de placement de fichier, combinée à l'absence de restriction du serveur web sur ce type d'extension.

| | |
|---|---|
| **Piège** | Déposer un `.env`, une sauvegarde, ou tout fichier de travail (`.git/`, un export de base) dans le même dossier que les fichiers réellement destinés à être servis au public, en supposant qu'"il n'y a pas de lien vers ce fichier donc personne ne le trouvera" — un scan automatisé teste des chemins connus (`.env`, `.git/config`, `backup.zip`...) sur des millions de sites, sans avoir besoin d'un lien |
| **Bonne pratique** | Stocker tout fichier sensible HORS du dossier servi publiquement par le serveur web (`public/` ou équivalent) ; configurer le serveur pour refuser explicitement toute requête vers un `.env`/`.git`/fichier de sauvegarde, en défense supplémentaire même si le placement est déjà correct |

## Un secret resté dans l'historique Git après sa suppression

Supprimer un fichier contenant un secret (ou remplacer sa valeur dans un commit suivant) ne le retire pas de l'historique : chaque ancienne version d'un fichier reste consultable dans les commits précédents, tant que l'historique lui-même n'est pas réécrit.

```text
Commit 1 : ajout de config.php avec API_KEY="sk_live_abc123..."
Commit 2 : suppression de la ligne API_KEY (ou du fichier entier)

git log -p -- config.php   -> affiche TOUJOURS le commit 1, cle en clair comprise
```

N'importe qui avec accès au dépôt (y compris après un dépôt rendu privé devenu public par erreur, ou un fork déjà réalisé avant la suppression) peut retrouver ce secret en consultant l'historique, même si le fichier actuel n'en contient plus trace.

> **Piège :** croire qu'un `git commit` de suppression "efface" un secret déjà commité. Le seul retrait réel du fichier courant n'a aucun effet sur les versions déjà enregistrées dans l'historique.
>
> **Bonne pratique :** en cas de secret commité par erreur, le considérer comme définitivement compromis et le RÉVOQUER/régénérer immédiatement (nouvelle clé API, nouveau mot de passe) — c'est la seule protection fiable, une réécriture d'historique (`git filter-repo`, BFG Repo-Cleaner) n'empêche pas qu'une copie déjà clonée/forkée avant la réécriture garde l'ancien historique intact.

## Une seule page qui expose les secrets de TOUS les comptes

Une variante plus grave qu'une fuite ordinaire : une page d'administration/configuration qui affiche, en une seule vue, la liste complète des tokens d'accès de TOUS les comptes/clients d'un système (plutôt que uniquement celui de la personne connectée). Un seul accès non prévu à cette page (contrôle d'accès manquant, lien partagé par erreur) compromet alors l'ensemble du périmètre d'un coup, pas un seul compte.

> **Piège :** regrouper les secrets de tous les tenants/comptes sur un même écran par confort d'administration ("c'est plus pratique pour tout gérer au même endroit"), sans mesurer que ça transforme un contrôle d'accès manquant SUR CETTE SEULE PAGE en compromission totale plutôt que partielle.
>
> **Bonne pratique :** n'afficher jamais un secret en clair une fois généré (uniquement au moment de sa création, ensuite masqué ou régénérable mais plus consultable) ; si une vue d'ensemble reste nécessaire pour l'administration, n'y afficher que des métadonnées (date de création, dernière utilisation), jamais la valeur du secret lui-même.

## Secrets et pipeline CI/CD ouvert à des contributions externes

[Gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets) montre comment déclarer un secret CI correctement (espace dédié, injecté en variable d'environnement). Le risque supplémentaire apparaît quand ce pipeline peut être déclenché par une contribution externe non fiable (une *pull request* venant d'un compte extérieur au projet) :

```text
1. Le pipeline CI est configure pour s'executer automatiquement sur chaque pull request,
   secrets du projet injectes comme d'habitude (deploiement, cle API...)
2. Un attaquant ouvre une pull request depuis son propre fork, modifiant
   le script de build pour qu'il exfiltre les variables d'environnement
   (ex : les envoyer vers un serveur externe qu'il controle)
3. Si le pipeline execute ce script AVEC les secrets du projet injectes,
   l'attaquant recupere ces secrets sans jamais avoir eu acces au depot lui-meme
```

| | |
|---|---|
| **Piège** | Injecter les secrets du dépôt principal dans l'exécution CI déclenchée par une pull request venant d'un fork externe, en traitant cette exécution comme si elle était aussi fiable qu'un commit direct de l'équipe |
| **Bonne pratique** | Configurer la plateforme CI pour ne PAS exposer les secrets du dépôt principal aux pipelines déclenchés par une pull request externe (option déjà proposée par la plupart des plateformes, ex. `pull_request_target` à éviter côté GitHub Actions sans revue manuelle préalable), ou exiger une approbation manuelle avant l'exécution d'une PR externe |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un secret correctement stocké au départ peut malgré tout s'exposer : fichier `.env`/sauvegarde resté dans le dossier public du serveur, secret encore lisible dans l'historique Git après suppression du fichier, page d'administration qui regroupe les secrets de tous les comptes en une seule vue, ou pipeline CI qui injecte les secrets du projet dans l'exécution d'une pull request externe non fiable. |
| **Outils utilisables** | Configuration serveur pour bloquer l'accès aux fichiers sensibles ; `git filter-repo`/BFG Repo-Cleaner pour réécrire un historique (en complément de la révocation, jamais à sa place) ; option de la plateforme CI pour restreindre les secrets aux exécutions internes. |
| **Pièges à éviter** | Placer un fichier sensible dans le dossier servi publiquement. Croire qu'un commit de suppression retire un secret de l'historique. Regrouper les secrets de tous les comptes sur une même page d'administration. Exposer les secrets du projet à une exécution CI déclenchée par une pull request externe. |
| **Bonnes pratiques** | Stocker tout fichier sensible hors du dossier public, avec un blocage serveur en défense supplémentaire. Révoquer immédiatement tout secret commité par erreur, indépendamment d'une éventuelle réécriture d'historique. Ne jamais réafficher un secret en clair après sa création. Restreindre les secrets CI aux exécutions internes, jamais aux pull requests externes. |
