---
order: 6
---

# Bonnes pratiques et sécurité

## Une image minimale

Chaque paquet installé dans une image est une surface d'attaque et un poids supplémentaire au téléchargement. Préférer une image de base minimale (`alpine`, ou une variante `-slim`) et un build multi-étapes (cf. chapitre sur le Dockerfile) pour ne livrer que le strict nécessaire à l'exécution, jamais les outils de compilation.

## Épingler les versions, ne jamais utiliser `latest` en production

```dockerfile
FROM node:latest    # à éviter : le contenu réel de "latest" change avec le temps, sans prévenir
FROM node:20.11.1    # reproductible : le même Dockerfile construit toujours la même chose
```

Une image `latest` qui change silencieusement sous les pieds d'un déploiement échoue de la pire façon possible : le build réussit, mais avec un contenu différent de la dernière fois — mieux vaudrait qu'une version absente fasse échouer le build explicitement plutôt que de construire quand même avec un contenu imprévisible.

## Ne jamais faire tourner un conteneur en `root`

Par défaut, un processus dans un conteneur s'exécute en tant que `root` — un `USER` explicite dans le Dockerfile limite les dégâts si le conteneur est compromis :

```dockerfile
RUN adduser -D monapp
USER monapp
```

Cette précaution rejoint le [principe du moindre privilège](/?c=domain-specific-languages-dsl&p=sql) déjà vu pour un compte de connexion à une base de données, rubrique SQL : un processus ne devrait jamais disposer de plus de droits que ce dont il a réellement besoin.

## Ne jamais embarquer de secret dans une image

Une valeur passée par `ENV` ou `ARG` reste lisible dans les métadonnées de l'image (`docker history`), même après un build multi-étapes qui ne la copie pas dans l'image finale — le secret a existé dans une couche intermédiaire, et cette couche reste inspectable.

```dockerfile
# À ÉVITER : le mot de passe reste visible dans l'historique de l'image
ARG DB_PASSWORD=motdepasse123
```

Les secrets doivent être injectés **à l'exécution** (variables d'environnement passées à `docker run -e`, fichiers montés via un volume, ou un gestionnaire de secrets dédié), jamais gravés dans une couche de l'image — le même principe que ne jamais committer une clé d'API dans le code source (cf. chapitre [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite), rubrique PHP).

## `.dockerignore` systématique

Sans `.dockerignore` (cf. chapitre sur le Dockerfile), un `COPY . .` embarque tout ce qui se trouve dans le dossier — y compris un `.env` local, un `.git/` complet, ou des identifiants de configuration oubliés. La liste minimale à exclure : `.git/`, `.env`, `node_modules/` (ou équivalent), tout fichier de log.

## L'isolation d'un conteneur n'est pas celle d'une machine virtuelle

Un conteneur partage le noyau de la machine hôte (cf. chapitre sur les concepts de base) : une faille dans ce noyau, ou une mauvaise configuration (conteneur lancé en mode privilégié `--privileged`, socket Docker monté à l'intérieur d'un conteneur) peut permettre d'en sortir et d'atteindre l'hôte directement. Une VM oppose une frontière matérielle bien plus étanche. Pour un service exposé publiquement et particulièrement sensible, cette différence doit peser dans le choix entre conteneur et VM — Docker isole des processus, pas des noyaux.
