---
order: 5
---

# Docker Compose

Un projet réel implique rarement un seul conteneur : une API, sa base de données, un cache, un **reverse proxy** (un serveur qui reçoit toutes les requêtes entrantes et les redirige vers le bon service interne, Nginx ou Traefik par exemple, servant de point d'entrée unique)... Enchaîner les `docker run` à la main devient vite ingérable. **Docker Compose** décrit tous ces services dans un unique fichier déclaratif au format **YAML** (*YAML Ain't Markup Language* : un format texte structuré par indentation, largement utilisé pour la configuration), `docker-compose.yml`, et les démarre ensemble.

## Un exemple complet

```yaml
services:
  api:
    build: .                    # construit l'image depuis le Dockerfile du dossier courant
    ports:
      - "8080:3000"
    environment:
      - DATABASE_URL=mysql://base:3306/app
    depends_on:
      - base

  base:
    image: mysql:8               # utilise directement une image existante, pas de build
    volumes:
      - donnees-mysql:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=changeme

volumes:
  donnees-mysql:
```

```bash
docker compose up -d       # construit (si nécessaire) et démarre tous les services en arrière-plan
docker compose logs -f api  # suit les logs d'un service précis
docker compose down         # arrête et supprime les conteneurs (les volumes nommés survivent)
```

> **YAML est sensible à l'indentation**, exactement comme [Python](/?c=langages-de-programmation&s=python&p=python) : deux lignes au même niveau doivent avoir la même indentation, et une tabulation y est généralement invalide (YAML n'accepte que des espaces). Une erreur d'indentation change silencieusement la structure du document plutôt que de provoquer une erreur explicite : à vérifier en premier en cas de comportement inattendu.

## Ce que Compose automatise

- **Le réseau** : tous les services d'un même fichier sont placés sur un réseau commun automatiquement : `base` est déjà joignable par son nom depuis `api`, sans `docker network create` manuel (voir [Volumes et réseaux](/?c=docker&p=volumes-et-reseaux)).
- **L'ordre de démarrage** : `depends_on` démarre `base` avant `api`. Cela garantit l'ordre de **démarrage** du conteneur, pas que le service interne (ici MySQL) soit déjà prêt à accepter des connexions : une application qui se connecte trop tôt doit encore prévoir une nouvelle tentative (cf. [Attendre sans perdre de temps](/?c=performance&p=attentes-et-temps-morts), rubrique Performance) plutôt que de supposer que la base répond dès le premier instant.
- **Les volumes déclarés une fois** : `donnees-mysql` défini en bas du fichier est créé automatiquement s'il n'existe pas encore.

## Rebuild après un changement de Dockerfile

Compose ne reconstruit pas une image automatiquement à chaque `up` si elle existe déjà en cache :

```bash
docker compose up -d --build   # force la reconstruction des images avant de démarrer
```

## Redémarrage automatique en cas de crash

Par défaut, un conteneur qui plante reste arrêté ; `restart` définit la conduite à tenir :

| Valeur | Comportement |
|---|---|
| `no` (défaut) | Ne redémarre jamais automatiquement |
| `on-failure` | Redémarre uniquement si le processus principal se termine avec un code d'erreur |
| `always` | Redémarre toujours, y compris après un `docker stop` suivi d'un redémarrage du daemon Docker |
| `unless-stopped` | Comme `always`, sauf si le conteneur a été explicitement arrêté (`docker stop`) avant le redémarrage du daemon |

```yaml
services:
  api:
    build: .
    restart: unless-stopped   # redémarre après un crash ou un reboot de la machine hôte
```

## Déclarer explicitement son réseau

Compose crée un réseau par défaut même sans rubrique `networks:` (cf. plus haut) ; le déclarer explicitement reste préférable dès qu'on veut lui donner un nom clair ou plusieurs réseaux distincts (ex. isoler la base de données du reste) :

```yaml
services:
  api:
    networks:
      - mon-reseau
  base:
    networks:
      - mon-reseau

networks:
  mon-reseau:
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Docker Compose décrit plusieurs services dans un fichier YAML unique et les démarre ensemble, avec un réseau commun automatique. `depends_on` ordonne le démarrage, sans garantir qu'un service interne soit déjà prêt. |
| **Outils utilisables** | `docker compose up -d`/`logs -f`/`down`, `restart: unless-stopped`, secrets Compose (fichier monté, pas une variable d'environnement). |
| **Pièges à éviter** | Une erreur d'indentation YAML, qui change silencieusement la structure sans erreur explicite ; supposer qu'un service dépendant est déjà prêt dès son démarrage. |
| **Bonnes pratiques** | Prévoir une nouvelle tentative de connexion côté application plutôt que de supposer qu'un service dépendant répond dès le premier instant ; déclarer explicitement les réseaux dès qu'on veut les nommer ou en isoler certains. |
