---
order: 3
---

# Les commandes essentielles

## Construire et lancer

```bash
docker build -t mon-app:1.0 .  # construit une image nommée "mon-app", tag "1.0", depuis le Dockerfile du dossier courant (.)
docker run mon-app:1.0         # lance un conteneur à partir de cette image
```

Options courantes de `docker run` :

```bash
docker run -d --name serveur -p 8080:80 mon-app:1.0
```

| Option | Effet |
|---|---|
| `-d` | Détaché (*detached*) : le conteneur tourne en arrière-plan, le terminal reste disponible, même principe que `&` en [Bash](/?c=shells&s=bash&p=bash) |
| `--name` | Donne un nom explicite au conteneur, plutôt qu'un identifiant généré aléatoirement |
| `-p 8080:80` | Publie le port : le port `80` du conteneur devient accessible sur le port `8080` de l'hôte (voir [Volumes et réseaux](/?c=docker&p=volumes-et-reseaux)) |
| `-it` | Interactif + pseudo-terminal (*tty*) : nécessaire pour un conteneur avec lequel on veut interagir directement (ex. un shell) |
| `--rm` | Supprime automatiquement le conteneur dès qu'il s'arrête : pratique pour un usage ponctuel, sans laisser de conteneurs arrêtés s'accumuler |
| `-e VAR=valeur` | Définit une variable d'environnement dans le conteneur |

## Observer ce qui tourne

```bash
docker ps               # conteneurs en cours d'exécution
docker ps -a            # tous les conteneurs, y compris ceux arrêtés
docker logs serveur     # sortie standard/erreur du conteneur "serveur"
docker logs -f serveur  # suit les logs en direct (equivalent de `tail -f`)
```

Un conteneur n'est, du point de vue du système hôte, qu'un processus parmi d'autres : `docker ps` est l'équivalent de `ps aux` filtré sur les processus lancés par Docker (cf. chapitre [La gestion des processus](/?c=shells&s=bash&p=gestion-des-processus), rubrique [Bash](/?c=shells&s=bash&p=bash)).

## Entrer dans un conteneur en cours d'exécution

```bash
docker exec -it serveur sh    # ouvre un shell interactif à l'intérieur du conteneur "serveur"
```

Utile pour inspecter l'état d'un conteneur qui tourne déjà (fichiers, variables d'environnement, processus internes) sans avoir à le relancer.

## Arrêter et nettoyer

```bash
docker stop serveur     # envoie SIGTERM, laisse le conteneur s'arrêter proprement (cf. [tableau des signaux](/?c=shells&s=bash&p=gestion-des-processus), rubrique Bash)
docker kill serveur     # envoie SIGKILL, arrêt immédiat et inconditionnel
docker rm serveur       # supprime un conteneur arrêté
docker rmi mon-app:1.0  # supprime une image
```

> **Note :** `docker stop` puis `docker kill` reproduisent exactement la même hiérarchie SIGTERM → SIGKILL vue au chapitre sur la gestion des processus : Docker ne réinvente pas un mécanisme d'arrêt, il pilote celui du système hôte.

```bash
docker system prune        # supprime conteneurs arrêtés, images non utilisées, caches de build inutilisés
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `docker build`/`run` construisent et lancent un conteneur ; `docker ps`/`logs`/`exec` permettent de l'observer et d'y entrer ; `docker stop`/`kill`/`rm` l'arrêtent et le suppriment. |
| **Outils utilisables** | `-d` (détaché), `-p` (publier un port), `-e` (variable d'environnement), `--rm` (nettoyage automatique). |
| **Pièges à éviter** | Laisser s'accumuler des conteneurs arrêtés et des images inutilisées sans jamais faire de `docker system prune`. |
| **Bonnes pratiques** | Utiliser `--rm` pour un conteneur ponctuel ; `docker stop` (arrêt propre) avant `docker kill` (arrêt forcé). |
