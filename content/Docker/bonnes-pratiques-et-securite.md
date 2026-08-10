---
order: 6
---

# Bonnes pratiques et sécurité

## Une image minimale

Chaque paquet installé dans une image est une **surface d'attaque** (un point d'entrée potentiel de plus qu'un attaquant pourrait exploiter : une vulnérabilité dans un paquet jamais utilisé reste une vulnérabilité) et un poids supplémentaire au téléchargement. Préférer une image de base minimale (`alpine`, ou une variante `-slim`) et un [build multi-étapes](/?c=docker&p=dockerfile) pour ne livrer que le strict nécessaire à l'exécution, jamais les outils de compilation.

## Épingler les versions, ne jamais utiliser `latest` en production

```dockerfile
FROM node:latest    # à éviter : le contenu réel de "latest" change avec le temps, sans prévenir
FROM node:20.11.1    # reproductible : le même Dockerfile construit toujours la même chose
```

Une image `latest` qui change silencieusement sous les pieds d'un déploiement échoue de la pire façon possible : le build réussit, mais avec un contenu différent de la dernière fois : mieux vaudrait qu'une version absente fasse échouer le build explicitement plutôt que de construire quand même avec un contenu imprévisible.

## Ne jamais faire tourner un conteneur en `root`

Par défaut, un processus dans un conteneur s'exécute en tant que `root` ; un `USER` explicite dans le Dockerfile limite les dégâts si le conteneur est compromis :

```dockerfile
RUN adduser -D monapp
USER monapp
```

Cette précaution rejoint le [principe du moindre privilège](/?c=domain-specific-languages-dsl&p=sql) déjà vu pour un compte de connexion à une base de données, rubrique SQL : un processus ne devrait jamais disposer de plus de droits que ce dont il a réellement besoin.

## Ne jamais embarquer de secret dans une image

Une valeur passée par `ENV` ou `ARG` reste lisible dans les métadonnées de l'image (`docker history`), même après un build multi-étapes qui ne la copie pas dans l'image finale : le secret a existé dans une couche intermédiaire, et cette couche reste inspectable.

```dockerfile
# À ÉVITER : le mot de passe reste visible dans l'historique de l'image
ARG DB_PASSWORD=motdepasse123
```

Les secrets doivent être injectés **à l'exécution** (variables d'environnement passées à `docker run -e`, fichiers montés via un volume, ou un gestionnaire de secrets dédié), jamais gravés dans une couche de l'image, le même principe que ne jamais committer une clé d'API dans le code source (cf. chapitre [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite), rubrique PHP).

### Secrets Docker Compose vs simples variables d'environnement

Une variable d'environnement (`environment:` en Compose) reste lisible par quiconque peut inspecter le conteneur (`docker inspect`, ou lire `/proc/<pid>/environ` depuis l'hôte), suffisant pour une configuration ordinaire, mais peu adapté à un mot de passe. Les **secrets** de Compose passent plutôt par un fichier, monté en lecture seule uniquement dans les conteneurs qui le déclarent explicitement :

```yaml
services:
  base:
    secrets:
      - db_password        # monté en lecture seule dans /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt   # jamais commité, cf. .gitignore
```

L'application lit alors le mot de passe comme un fichier ordinaire (`cat /run/secrets/db_password`) plutôt que comme une variable d'environnement : un secret ainsi monté n'apparaît ni dans `docker inspect`, ni dans les variables d'environnement du processus.

## `.dockerignore` systématique

Sans [`.dockerignore`](/?c=docker&p=dockerfile), un `COPY . .` embarque tout ce qui se trouve dans le dossier, y compris un `.env` local, un `.git/` complet, ou des identifiants de configuration oubliés. La liste minimale à exclure : `.git/`, `.env`, `node_modules/` (ou équivalent), tout fichier de log.

## L'isolation d'un conteneur n'est pas celle d'une machine virtuelle

Un conteneur partage le noyau de la machine hôte (voir [Les concepts de base](/?c=docker&p=concepts-de-base)) : une faille dans ce noyau, ou une mauvaise configuration (conteneur lancé en mode privilégié `--privileged`, socket Docker monté à l'intérieur d'un conteneur) peut permettre d'en sortir et d'atteindre l'hôte directement. Une VM oppose une frontière matérielle bien plus étanche. Pour un service exposé publiquement et particulièrement sensible, cette différence doit peser dans le choix entre conteneur et VM : Docker isole des processus, pas des noyaux.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une image minimale réduit la surface d'attaque. Un conteneur ne devrait jamais tourner en `root`, ni embarquer de secret dans ses couches : les secrets s'injectent à l'exécution, jamais dans le Dockerfile. |
| **Outils utilisables** | `USER` (utilisateur non-root), secrets Docker Compose (fichier monté), `.dockerignore`. |
| **Pièges à éviter** | Utiliser `latest` en production (contenu imprévisible) ; passer un secret via `ARG`/`ENV` : reste lisible dans l'historique de l'image même après un build multi-étapes. |
| **Bonnes pratiques** | Épingler une version précise de chaque image de base ; injecter les secrets à l'exécution (variable d'environnement au lancement, fichier monté, gestionnaire dédié) ; ne jamais faire tourner un conteneur en `root`. |
