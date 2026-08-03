---
order: 2
---

# Le Dockerfile

Un **Dockerfile** est une recette texte : une suite d'instructions décrivant comment construire une image, étape par étape. `docker build` l'exécute et produit l'image correspondante.

## Les instructions essentielles

```dockerfile
FROM node:20-alpine        # image de base : Node.js 20 sur une distribution Alpine (minimale)
WORKDIR /app                # dossier de travail dans le conteneur pour toutes les instructions suivantes

COPY package*.json ./       # copie ces fichiers depuis la machine hôte vers l'image
RUN npm install              # exécute une commande PENDANT la construction de l'image

COPY . .                    # copie le reste du code source

ENV NODE_ENV=production      # variable d'environnement, disponible au build et à l'exécution
EXPOSE 3000                  # documente le port utilisé (n'ouvre rien lui-même, cf. chapitre réseaux)

CMD ["node", "server.js"]    # commande exécutée quand le CONTENEUR démarre, pas pendant le build
```

| Instruction | Rôle |
|---|---|
| `FROM` | Image de base sur laquelle construire (toujours la première instruction) |
| `WORKDIR` | Change le dossier courant pour le reste du Dockerfile — évite les `cd` répétés |
| `COPY` | Copie des fichiers de l'hôte vers l'image |
| `RUN` | Exécute une commande au moment de la construction, son résultat est capturé dans une nouvelle couche |
| `ENV` | Définit une variable d'environnement, persistante dans l'image et pour le conteneur |
| `EXPOSE` | Documente le port sur lequel l'application écoute (informatif seulement) |
| `CMD` | Commande par défaut au démarrage du conteneur, remplaçable en ligne de commande |
| `ENTRYPOINT` | Comme `CMD`, mais non remplaçable — utile pour forcer un exécutable fixe et ne laisser que ses arguments varier |

> **`RUN` vs `CMD`** : `RUN` s'exécute une fois, **pendant** la construction de l'image (installer des paquets, compiler du code) et son résultat est figé dans une couche. `CMD` ne s'exécute jamais pendant le build : il ne fait qu'enregistrer la commande à lancer **à chaque démarrage** d'un conteneur à partir de cette image.

`RUN` exécute sa commande via un shell (cf. chapitre [Scripts et shebang](/?c=shells&s=bash&p=scripts-et-shebang)) : les mêmes pièges s'appliquent, notamment l'injection de commande si une valeur externe est interpolée sans précaution dans une instruction `RUN`.

## Chaque instruction crée une couche, et l'ordre compte

Chaque `RUN`/`COPY`/`ADD` ajoute une couche, mise en cache : si une instruction et tout ce qui la précède n'ont pas changé depuis le dernier build, Docker réutilise la couche en cache plutôt que de la reconstruire.

```dockerfile
# Mauvais ordre : le moindre changement de code source invalide le cache de `npm install`
COPY . .
RUN npm install

# Bon ordre : `npm install` n'est refait que si package.json change réellement
COPY package*.json ./
RUN npm install
COPY . .
```

C'est pourquoi les fichiers qui changent le moins souvent (dépendances) sont copiés et installés **avant** le code source, qui change à chaque commit.

## Les builds multi-étapes

Un build multi-étapes sépare l'environnement de **compilation** (lourd : compilateur, outils de build) de l'environnement d'**exécution** (léger : seulement le binaire final) — le même principe que séparer compilation et édition de liens en C (cf. chapitre [Le processus de compilation](/?c=langages-de-programmation&s=c&p=compilation)) : le résultat final n'a pas besoin de la chaîne d'outils qui l'a produit.

```dockerfile
# Étape 1 : compilation, avec toute la toolchain Go
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o serveur

# Étape 2 : exécution, image minimale sans aucun outil de compilation
FROM alpine:3.19
COPY --from=builder /app/serveur /usr/local/bin/serveur
CMD ["serveur"]
```

Seul le binaire `serveur` est copié de l'étape `builder` vers l'image finale — le compilateur Go (plusieurs centaines de Mo) ne fait jamais partie de l'image livrée.

## `.dockerignore`

Fonctionne comme [`.gitignore`](/?c=git&p=gitignore) mais pour `docker build` : les fichiers listés ne sont jamais envoyés au moteur Docker pour la construction de l'image, qu'un `COPY . .` les aurait copiés ou non.

```
node_modules/
.git/
*.log
.env
```

Exclure `node_modules/` accélère le build (moins de données à transmettre) ; exclure `.env` évite qu'un secret local ne se retrouve embarqué dans une image (cf. chapitre sur les bonnes pratiques et la sécurité).
