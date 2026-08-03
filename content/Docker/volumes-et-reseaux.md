---
order: 4
---

# Volumes et réseaux

## Le système de fichiers d'un conteneur est éphémère

La couche inscriptible d'un conteneur (cf. chapitre sur les concepts de base) disparaît avec lui : supprimer un conteneur perd toutes les données qu'il a écrites, à moins qu'elles ne vivent dans un **volume**.

```bash
docker run -v mes-donnees:/var/lib/mysql mysql:8
```

Ici, `mes-donnees` est un **volume nommé**, géré par Docker et stocké indépendamment de tout conteneur : supprimer le conteneur ne supprime pas le volume, et un nouveau conteneur peut être rattaché au même volume pour retrouver les données.

## Volumes nommés vs bind mounts

| | Volume nommé | Bind mount |
|---|---|---|
| Emplacement | Géré par Docker, chemin interne non pertinent | Un chemin **précis** de la machine hôte |
| Syntaxe | `-v mes-donnees:/chemin` | `-v /chemin/hote:/chemin` (chemin hôte commence par `/` ou `./`) |
| Usage typique | Données persistantes d'une base de données, d'un service | Monter le code source en développement pour voir les changements sans reconstruire l'image |

```bash
# Bind mount : le dossier courant de l'hôte devient /app dans le conteneur
docker run -v $(pwd):/app mon-app:1.0
```

> **Piège fréquent en développement** : un bind mount sur `/app` masque entièrement ce que l'image avait copié à cet endroit au moment du build — si l'image installe des dépendances dans `/app/node_modules` et que le bind mount écrase tout `/app` avec le dossier de l'hôte (où `node_modules` n'existe pas forcément), le conteneur démarre sans ses dépendances.

## Réseaux : les conteneurs se voient par leur nom

Par défaut, Docker crée un réseau **bridge** : chaque conteneur y reçoit sa propre adresse IP interne, et deux conteneurs sur le même réseau peuvent se joindre directement **par leur nom**, sans configuration manuelle — Docker fait résoudre ce nom en interne, sur le même principe que le [DNS](/?c=langages-de-programmation&s=php&p=securite) qui traduit un nom de domaine en adresse IP sur Internet.

```bash
docker network create mon-reseau
docker run --network mon-reseau --name base mysql:8
docker run --network mon-reseau --name api mon-app:1.0
```

Depuis le conteneur `api`, se connecter à la base de données se fait en visant l'hôte `base` (ex. `mysql://base:3306`), pas une adresse IP — cette adresse changerait à chaque redémarrage, le nom, lui, reste stable.

## Publier un port vers l'extérieur

`EXPOSE` dans un Dockerfile (cf. chapitre dédié) ne fait que **documenter** un port ; seul `-p` sur `docker run` le rend réellement accessible depuis l'extérieur du conteneur :

```bash
docker run -p 8080:80 mon-app:1.0
# hôte:8080  -->  conteneur:80
```

Deux conteneurs sur le même réseau communiquent déjà entre eux sans `-p` (ils se voient directement sur le réseau interne) ; `-p` n'est nécessaire que pour exposer un service **hors** de Docker, vers la machine hôte ou l'extérieur.
