---
order: 2
---

# Proxy inverse et limitation de débit

Un site web reçoit des **requêtes** (des demandes envoyées par un navigateur ou un programme, le **client**) et y répond : c'est le principe de [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). Le programme qui exécute le code du site et fabrique les réponses s'appelle ici le **serveur d'application**. Le rôle d'un [serveur web](/?c=infrastructure-devops&s=serveurs-web&p=serveurs-web) (le programme qui écoute les requêtes arrivant sur une machine et leur répond) est présenté dans un chapitre à part.

Ce chapitre répond à deux questions qui se posent dès que le site sort de l'ordinateur de son auteur :

- **Qui doit recevoir les requêtes en premier ?** Réponse : un **proxy inverse**, un intermédiaire placé devant les serveurs d'application.
- **Comment éviter qu'un seul client prenne toute la place ?** Réponse : la **limitation de débit** (*rate limiting*), qui plafonne le nombre de requêtes acceptées par client et par durée.

Les deux sujets sont liés par un piège : derrière un proxy, l'application ne voit plus l'[adresse IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#l-adresse-ip-identifier-une-machine) réelle du client (le numéro qui identifie sa machine sur le réseau), et la limitation de débit se trompe de cible. La dernière partie le traite.

| Partie | Question | Outil étudié |
|---|---|---|
| [Proxy direct et proxy inverse](#proxy-direct-contre-proxy-inverse) | Qui est caché, et de qui ? | Schémas |
| [Ce que fait un proxy inverse](#ce-que-fait-un-proxy-inverse) | Quels services rend-il ? | TLS, répartition, cache, compression |
| [Un exemple avec nginx](#un-exemple-avec-nginx) | À quoi ressemble la configuration ? | `upstream`, `proxy_pass`, `proxy_set_header` |
| [La limitation de débit](#la-limitation-de-debit) | Comment compter les requêtes ? | Seau à jetons, `limit_req` |
| [Le piège de l'adresse vue derrière un proxy](#le-piege-de-l-adresse-vue-derriere-un-proxy) | Qui est vraiment le client ? | `X-Forwarded-For` |

Les blocs de code JavaScript s'exécutent avec **Node.js** (un programme qui exécute du JavaScript en dehors du navigateur, [documentation officielle](https://nodejs.org/docs/latest/api/)) depuis un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Les mots *fonction*, *classe* et *variable* sont expliqués dans [les fonctions JavaScript](/?c=langages&s=javascript&p=fonctions), [les classes](/?c=langages&s=javascript&p=poo) et [la variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable). Le bloc `/** ... */` placé au-dessus d'une fonction est un commentaire de documentation : `@brief` résume ce que fait la fonction, `@param` décrit une valeur qu'elle reçoit, `@returns` la valeur qu'elle rend. Entre accolades, on note le type de la valeur : `number` = nombre, `boolean` = vrai ou faux, `string` = texte, `Set<string>` = ensemble de textes, `{{autorise: boolean, attente: number}}` = objet qui regroupe un vrai/faux et un nombre. Les tests `if`, les objets `{ ... }`, les boucles `for` et les tableaux `[ ... ]` sont expliqués dans [les conditions](/?c=langages&s=javascript&p=conditions), [les objets](/?c=langages&s=javascript&p=objets), [les boucles](/?c=langages&s=javascript&p=boucles) et [les tableaux](/?c=langages&s=javascript&p=tableaux) ; une **fonction fléchée** `(a) => ...` est une écriture courte de fonction (voir [les fonctions](/?c=langages&s=javascript&p=fonctions)). Les fichiers en `.mjs` sont des modules JavaScript : ils se lancent avec `node nom.mjs` et peuvent s'échanger du code par `import` et `export`. Les commandes Bash du chapitre sont expliquées sur place, avec des liens vers [les redirections et pipes](/?c=langages&s=bash&p=redirections-et-pipes), [le traitement de texte](/?c=langages&s=bash&p=traitement-de-texte), [les commandes de base](/?c=langages&s=bash&p=commandes-de-base), [les scripts et le shebang](/?c=langages&s=bash&p=scripts-et-shebang) et [les permissions](/?c=langages&s=bash&p=permissions-et-fichiers).

## Proxy direct contre proxy inverse

Un **proxy** (mot anglais, « mandataire » en français) est un programme qui s'intercale entre un client et un serveur : il reçoit la requête à la place du serveur, puis la transmet. Il existe deux variantes, selon le côté du réseau qu'il protège.

```
PROXY DIRECT (forward proxy) : il protège les clients

  Réseau de l'entreprise                                Internet
  +----------+
  | Poste 1  |--+
  +----------+  |   +-------+
                +-->| Proxy |-------------------------> Site web
  +----------+  |   +-------+                           (voit le proxy,
  | Poste 2  |--+                                        pas les postes)
  +----------+

PROXY INVERSE (reverse proxy) : il protège les serveurs

  Internet                                  Hébergeur
  +----------+
  | Client A |--+                           +-----------+
  +----------+  |   +---------+        +--->| Appli 1   |
                +-->| Proxy   |--------+    +-----------+
  +----------+  |   | inverse |        |    +-----------+
  | Client B |--+   +---------+        +--->| Appli 2   |
  +----------+   (les clients voient        +-----------+
                  le proxy, pas les applications)
```

| | Proxy direct | Proxy inverse |
|---|---|---|
| Se place devant | Les **clients** (postes d'un réseau interne) | Les **serveurs** (applications) |
| Qui cache-t-il ? | Les clients, aux yeux des serveurs d'Internet | Les serveurs, aux yeux des clients |
| Qui sait qu'il existe ? | Le client (il est configuré pour l'utiliser) | Personne côté client : il croit parler au site |
| Qui l'installe ? | L'organisation qui gère les postes | L'équipe qui gère le site |
| Usages typiques | Filtrer les sites visités, consigner chaque requête dans un fichier (le journal), garder en mémoire les pages demandées souvent | Chiffrement, répartition de charge, cache, protection |
| Exemples de logiciels | [Squid](https://www.squid-cache.org/) | [nginx](https://nginx.org/), [HAProxy](https://www.haproxy.org/), [Traefik](https://doc.traefik.io/traefik/), [Caddy](https://caddyserver.com/) |

Une adresse web comme `https://exemple.fr/public/a.css` se lit en parties : le **nom de domaine** (`exemple.fr`, le nom lisible de la machine, [explication de MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL)), le **chemin** (`/public/a.css`, ce qui est demandé sur cette machine) et, quand il est écrit, le **port** (le numéro qui distingue plusieurs services sur une même machine ; sans lui, HTTPS utilise le 443).

Le reste du chapitre ne parle plus que du proxy inverse, celui qu'un développeur de site installe. Dans un projet à plusieurs conteneurs, il apparaît comme un service parmi d'autres (voir [Docker Compose](/?c=infrastructure-devops&s=docker&p=docker-compose)). Sa proche parente, la [passerelle d'API](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=microservices#la-passerelle-api-api-gateway), lit le contenu de chaque requête pour la **router** (l'aiguiller vers le bon service) ; le proxy inverse, lui, n'examine en général que l'adresse, le nom de domaine et le chemin.

## Ce que fait un proxy inverse

Placé à l'entrée, le proxy inverse voit passer toutes les requêtes et toutes les réponses. Il en profite pour rendre cinq services, que chaque application n'a plus à implémenter elle-même.

```
Client ==(1) HTTPS chiffré==> +------------------------------+
                              |        PROXY INVERSE         |
                              |  (1) déchiffre (TLS)         |
                              |  (3) répond depuis le cache  |-- si absent --+
                              |  (5) compresse la réponse    |               |
                              +--------------+---------------+               |
                                             | (2) choisit un serveur        |
                                  +----------+----------+                    |
                                  v                     v                    |
                            +-----------+         +-----------+              |
                            | Appli 1   |         | Appli 2   |<-------------+
                            +-----------+         +-----------+
                            (4) adresses privées, invisibles depuis Internet
```

| Service | Ce qu'il fait | Pourquoi c'est utile | Pour approfondir |
|---|---|---|---|
| Terminaison TLS | Reçoit la connexion chiffrée (HTTPS), la déchiffre, puis parle en clair aux applications | Un seul endroit détient le certificat et sa clé privée ; les applications n'ont aucun code de chiffrement | [Cryptographie appliquée](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#le-certificat-tls-auto-signe) |
| Répartition de charge | Envoie chaque requête à l'un des serveurs d'application | Plusieurs serveurs se partagent le trafic ; un serveur en panne est évité | [Autoscaling et répartition de charge](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#le-repartiteur-de-charge-load-balancer) |
| Cache | Garde la réponse à une requête et la rejoue telle quelle aux clients suivants | L'application n'est plus sollicitée pour une page qui n'a pas changé | [CDN et diffusion adaptative](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative#le-cdn-des-copies-du-contenu-reparties-dans-le-monde-entier) pour la version répartie dans le monde |
| Masquage des serveurs | Seul le proxy a une adresse publique ; les applications restent sur le réseau privé | Une application ne peut pas être attaquée directement depuis Internet | [WAF](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif), qui s'installe souvent à cette même place |
| Compression | Réduit la taille des réponses (par exemple avec **gzip**, un format de compression) avant de les envoyer | Moins de données sur le réseau, pages plus rapides à charger | [Documentation du module gzip de nginx](https://nginx.org/en/docs/http/ngx_http_gzip_module.html) |

**TLS** (*Transport Layer Security*) est le protocole qui chiffre la connexion ; **HTTPS** est HTTP transporté dans une connexion TLS. Un **certificat** est le document qui prouve que le serveur est bien celui du nom de domaine demandé. Un **cache** est une mémoire qui garde une réponse pour la rejouer sans refaire le travail qui l'a produite.

Ces services ont un coût : le proxy devient un **point unique de défaillance** (*single point of failure*), c'est-à-dire un élément dont la panne arrête tout, même si les applications derrière vont bien. On le protège en lançant plusieurs proxys identiques, répartis eux-mêmes par une adresse virtuelle (une adresse IP qui passe automatiquement d'un proxy à l'autre quand le premier tombe) ou par un service du fournisseur d'hébergement (voir [la répartition de charge](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#le-repartiteur-de-charge-load-balancer)).

## Un exemple avec nginx

**nginx** (prononcé « engine X », [site officiel](https://nginx.org/)) est un logiciel qui sert de serveur web et de proxy inverse. Sa configuration est un fichier texte fait de **directives** : un nom, des valeurs, un point-virgule final (`gzip on;`). Des accolades `{ }` regroupent des directives en **blocs**. Un **en-tête** (*header*) est une ligne `Nom: valeur` jointe à une requête ou à une réponse pour la décrire (le nom de domaine demandé, la langue acceptée...). Les en-têtes de contrôle et les codes de statut ont leur [chapitre dédié](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle).

| Bloc ou directive | Rôle |
|---|---|
| `upstream nom { ... }` | Déclare un groupe de serveurs d'application sous un nom (« en amont » du proxy) |
| `server { ... }` | Décrit un site : port d'écoute, nom de domaine, certificat |
| `location chemin { ... }` | Règles appliquées aux requêtes dont l'adresse commence par ce chemin |
| `proxy_pass adresse;` | Transmet la requête à cette adresse, ou à un groupe `upstream` |
| `proxy_set_header Nom valeur;` | Ajoute ou remplace un en-tête de la requête transmise |

La configuration suivante fait la terminaison TLS, répartit entre deux applications, compresse et transmet les informations sur le client. Les adresses `10.0.0.11` et `10.0.0.12` sont des adresses de réseau privé inventées (voir [l'adresse IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#l-adresse-ip-identifier-une-machine)) ; `3000` est le port où chaque application écoute.

```nginx
# upstream : groupe nommé « application », les serveurs entre lesquels nginx répartit
upstream application {
    # première application, adresse privée et port 3000
    server 10.0.0.11:3000;
    # seconde application ; sans autre réglage, nginx les prend à tour de rôle
    server 10.0.0.12:3000;
}

# server : un site
server {
    # écoute le port 443 (celui de HTTPS) et active TLS
    listen 443 ssl;
    # ce bloc répond aux requêtes demandant ce nom de domaine
    server_name exemple.fr;

    # fichier du certificat (la pièce d'identité du site) suivi des certificats intermédiaires
    # (ceux des organismes qui garantissent sa signature) : c'est la « chaîne complète »
    ssl_certificate     /etc/ssl/exemple.fr/fullchain.pem;
    # fichier de la clé privée (le secret qui prouve que le certificat est bien à nous) :
    # il ne doit être lisible que par nginx
    ssl_certificate_key /etc/ssl/exemple.fr/privkey.pem;

    # active la compression des réponses
    gzip on;
    # types MIME à compresser : un type MIME est l'étiquette du format d'un contenu
    # (text/css = feuille de style) ; le texte se compresse bien, les images déjà moins
    gzip_types text/css application/javascript application/json;

    # Host : nom de domaine demandé par le client, recopié sans le port
    proxy_set_header Host $host;
    # X-Real-IP : adresse du client, telle que nginx la voit ($remote_addr)
    proxy_set_header X-Real-IP $remote_addr;
    # X-Forwarded-For : chaîne des adresses traversées, avec celle du client ajoutée à la fin
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # X-Forwarded-Proto : protocole utilisé par le client (https ici)
    proxy_set_header X-Forwarded-Proto $scheme;

    # location / : toutes les adresses du site
    location / {
        # transmet la requête à l'un des serveurs du groupe « application »
        proxy_pass http://application;
    }
}
```

Un **type MIME** ([documentation de MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types)) s'écrit `catégorie/format`, par exemple `application/json` pour des données JSON. Les mots qui commencent par `$` (`$host`, `$remote_addr`, `$scheme`) sont des **variables** de nginx : il les remplace à chaque requête par la valeur du moment. Les en-têtes ajoutés sont indispensables, car l'application ne voit plus le client mais le proxy :

| En-tête | Ce que l'application ne saurait pas sans lui |
|---|---|
| `Host` | Le nom de domaine demandé. Sans `proxy_set_header Host`, nginx envoie le nom du groupe (`application`) |
| `X-Forwarded-For` | L'adresse du client et celles des proxys traversés (détail [plus bas](#le-piege-de-l-adresse-vue-derriere-un-proxy)) |
| `X-Forwarded-Proto` | Si le client est venu en `https` ; l'application, jointe en `http` par le proxy, ne peut pas le deviner et risque de fabriquer des liens en `http` |
| `X-Real-IP` | L'adresse du pair direct de nginx (la machine qui s'y connecte), quand un seul proxy est en jeu ; le standard `Forwarded` ([RFC 7239](https://www.rfc-editor.org/rfc/rfc7239)) vise à remplacer la famille `X-Forwarded-*` |

### Ce qui a été essayé

nginx a été exécuté dans une image **Docker** (voir [les concepts de base de Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base)), sans l'installer sur la machine. La configuration ci-dessus a été validée par `nginx -t` (la commande qui vérifie la syntaxe d'un fichier sans démarrer le serveur) avec un [certificat auto-signé](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#le-certificat-tls-auto-signe) (signé par son propre porteur, donc sans organisme garant), puis exécutée pour de bon : les adresses `10.0.0.x:3000` remplacées par deux petits serveurs locaux (ports 18431 et 18433) qui renvoient les en-têtes qu'ils reçoivent. Le format du journal est personnalisé par ces deux directives, placées dans le bloc `http` (le bloc qui contient les blocs `server`) :

```nginx
# log_format : définit un format de ligne nommé « suivi » : adresse du client, code de la
# réponse, adresse du serveur d'application choisi
log_format suivi '$remote_addr $status $upstream_addr';
# access_log : écrit une ligne par requête dans ce fichier, au format « suivi »
access_log /var/log/nginx/acces.log suivi;
```

Journal de nginx pour quatre requêtes consécutives :

```text
127.0.0.1 200 127.0.0.1:18431
127.0.0.1 200 127.0.0.1:18433
127.0.0.1 200 127.0.0.1:18431
127.0.0.1 200 127.0.0.1:18433
```

Les deux applications sont bien prises à tour de rôle. Voici les en-têtes que l'application a reçus pour une requête arrivée en HTTPS (extrait : les en-têtes que nginx a ajoutés) :

```text
host: 127.0.0.1            <- Host recopié
x-real-ip: 127.0.0.1       <- adresse du client vue par nginx
x-forwarded-for: 127.0.0.1 <- chaîne des adresses : ici le client seul
x-forwarded-proto: https   <- le client était en HTTPS
```

> **Piège :** un `location` qui contient sa propre directive `proxy_set_header` n'hérite plus de celles du bloc `server`. Essai avec `X-Real-IP` posé au niveau `server` et un `location /autre/` qui ajoute `Host` : l'application a bien reçu `Host`, mais plus `X-Real-IP`.
>
> **Bonne pratique :** soit poser tous les `proxy_set_header` au même niveau, soit les regrouper dans un fichier inclus par chaque `location` avec la directive `include`, qui insère le contenu d'un autre fichier :

```nginx
# dans chaque location : insère les proxy_set_header communs, écrits dans ce fichier
include /etc/nginx/proxy-headers.conf;
```

### Ajouter un cache

Pour les pages qui ne changent pas d'un visiteur à l'autre, le proxy peut garder la réponse. La directive `proxy_cache_path` se place hors du bloc `server`, les autres dans un `location` dédié :

```nginx
# proxy_cache_path : dossier de stockage, 10 Mo d'index en mémoire (keys_zone),
# 100 Mo au plus de réponses, et suppression d'une réponse non demandée depuis 10 minutes
proxy_cache_path /var/cache/nginx/pages keys_zone=pages:10m max_size=100m inactive=10m;

# dans le bloc « server » existant :
location /public/ {
    # range les réponses dans la zone « pages »
    proxy_cache pages;
    # garde les réponses de code 200 pendant 1 minute
    proxy_cache_valid 200 1m;
    # ajoute à la réponse HIT (servie par le cache) ou MISS (venue de l'application)
    add_header X-Cache $upstream_cache_status;
    # transmet à l'application les requêtes que le cache ne sait pas servir
    proxy_pass http://application;
}
```

Trois requêtes successives sur `/public/a.css` ont donné `MISS`, `HIT`, `HIT`, et l'application n'a compté qu'**un seul** appel : les deux dernières réponses venaient du cache. Une requête sur un fichier JSON avec `Accept-Encoding: gzip` a reçu `Content-Encoding: gzip`, preuve que la compression est active.

> **Piège :** mettre en cache une réponse **personnalisée** (la page « mon compte » d'un utilisateur connecté). Le cache la rejouerait à un autre visiteur. nginx range les réponses sous une clé construite à partir de l'adresse demandée : si deux visiteurs demandent la même adresse, ils reçoivent la même réponse.
>
> **Bonne pratique :** ne placer `proxy_cache` que sur des chemins publics (fichiers statiques, pages identiques pour tous) et donner au cache une durée courte.

## La limitation de débit

La **limitation de débit** (*rate limiting*) consiste à refuser les requêtes d'un client qui en envoie trop, par exemple plus de 5 par seconde. Le **débit** est ce nombre de requêtes rapporté à une durée.

| Raison | Exemple |
|---|---|
| Se protéger de la force brute | Un programme teste des milliers de mots de passe sur le formulaire de connexion (voir [la sécurité des API web](/?c=securite&s=cybersecurite&p=securite-api-web#limiter-le-debit-des-requetes-rate-limiting)) |
| Absorber un bug côté client | Une application mobile qui rappelle l'API en boucle après une erreur |
| Garder le service juste | Un client qui télécharge tout le catalogue ne ralentit pas les autres |
| Maîtriser les coûts | Chaque requête déclenche un appel facturé à un service tiers (voir [la surcharge et le déni de service applicatif](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| Compléter un WAF | Un [WAF](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif) filtre par motif d'attaque, la limitation de débit filtre par quantité : une requête valide, répétée un million de fois, passe le premier mais pas la seconde |

La limitation de débit ne remplace pas l'[autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#le-probleme-un-seul-serveur-a-une-capacite-limitee), qui ajoute des serveurs pour absorber un trafic légitime : elle ne sert qu'à refuser l'excès d'un client donné.

### Où la placer : proxy ou application

| | Dans le proxy inverse | Dans l'application |
|---|---|---|
| Avantage | Refus avant tout travail applicatif, une seule règle pour toutes les applications | Connaît le compte connecté, le plan tarifaire, le coût réel de chaque route |
| Limite | Ne connaît que ce que contient la requête (adresse, en-têtes) | Chaque instance (chaque copie du programme qui tourne) a ses compteurs : avec 3 instances, un client peut obtenir 3 fois la limite |
| Remède à la limite | Compléter par une règle dans l'application | Partager les compteurs dans un [store en mémoire comme Redis](/?c=donnees&s=bases-de-donnees&p=redis) |

En pratique on combine les deux : une limite large au proxy, des limites fines dans l'application.

### Deux façons de compter : fenêtre fixe et seau à jetons

La **fenêtre fixe** découpe le temps en tranches (par exemple 10 secondes) et compte les requêtes de chaque tranche : au-delà de la limite, refus jusqu'à la tranche suivante. Le **seau à jetons** (*token bucket*) fonctionne comme une réserve : un seau contient au plus *N* jetons, chaque requête en prend un, et le seau se remplit à vitesse constante. Seau vide, la requête est refusée, avec le code **429** (« trop de requêtes », détaillé plus bas). Une **rafale** est un groupe de requêtes envoyées presque toutes en même temps.

```
        jetons ajoutés à vitesse constante (ex. 1 par seconde)
                          |
                          v
                    +-----------+  <- capacité maximale : 5 jetons
                    |  o o o o  |     (le trop-plein est perdu)
                    |  o o      |
                    +-----+-----+
                          |
         chaque requête retire UN jeton :
           jeton disponible -> requête acceptée
           seau vide        -> requête refusée (429)
```

| | Fenêtre fixe | Seau à jetons |
|---|---|---|
| Principe | Un compteur remis à zéro à chaque tranche | Une réserve de jetons qui se recharge en continu |
| Mémoire par client | Un compteur et un numéro de tranche | Un nombre de jetons et un instant |
| Rafale permise | Toute la limite d'un coup, en début de tranche | Au plus la capacité du seau, puis le rythme du débit |
| Défaut principal | **Effet de frontière** : 5 requêtes en fin de tranche + 5 au début de la suivante = 10 requêtes en une fraction de seconde | Deux réglages à comprendre (capacité et débit) |
| Attente avant de réessayer | Jusqu'à la fin de la tranche | Le temps de recevoir un jeton, calculable exactement |
| Utilisé par | Quotas mensuels ou journaliers | Limites par seconde ou par minute sur une API |

La **fenêtre glissante** (variante de la fenêtre fixe qui recalcule le quota en continu) est présentée dans [la sécurité des API web](/?c=securite&s=cybersecurite&p=securite-api-web#limiter-le-debit-des-requetes-rate-limiting). Le même principe de plafonnement existe aussi côté navigateur sous le nom de *throttle* (voir [debounce et throttle](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence#debounce-et-throttle-deux-facons-de-limiter-la-frequence-d-une-fonction)).

### Un seau à jetons en JavaScript

Le temps est passé en paramètre (`maintenant`, en secondes) plutôt que lu dans la fonction : le comportement devient reproductible, donc testable.

Enregistrez cette classe dans le fichier `seau.mjs`.

```js
/**
 * @brief Seau à jetons : chaque requête prend un jeton, le seau se remplit avec le temps.
 *
 * @param {number} capacite - entier au moins égal à 1
 * @param {number} debit - nombre strictement positif (jetons par seconde)
 */
// export : rend la classe utilisable depuis un autre fichier ; class : un modèle d'objets
export class SeauAJetons {
  // constructor : appelé par « new » à la création d'un seau
  constructor(capacite, debit) {
    // this désigne le seau en cours de création : on y range ses réglages
    // taille maximale du seau = taille de la plus grande rafale acceptée
    this.capacite = capacite;
    // vitesse de remplissage, en jetons par seconde
    this.debit = debit;
    // le seau démarre plein
    this.jetons = capacite;
    // instant du dernier prélèvement (null = « rien » : il n'y en a pas eu)
    this.dernierInstant = null;
  }

  /**
   * @brief Tente de prélever un jeton à l'instant donné.
   *
   * @param {number} maintenant - secondes, jamais inférieur à l'appel précédent
   *
   * @returns {{autorise: boolean, attente: number}} attente en secondes avant un jeton
   */
  prelever(maintenant) {
    // !== veut dire « différent de » : sauf au tout premier appel, on recharge le seau
    if (this.dernierInstant !== null) {
      // jetons gagnés depuis le dernier appel : durée écoulée x débit
      const gagnes = (maintenant - this.dernierInstant) * this.debit;
      // Math.min garde le plus petit des deux nombres : le seau ne déborde pas
      this.jetons = Math.min(this.capacite, this.jetons + gagnes);
    }
    // on retient cet instant pour le prochain calcul
    this.dernierInstant = maintenant;
    // >= veut dire « supérieur ou égal à »
    if (this.jetons >= 1) {
      // il reste au moins un jeton : -= 1 en retire un, et on accepte la requête
      this.jetons -= 1;
      // { ... } est un objet : deux valeurs rangées sous les noms autorise et attente
      return { autorise: true, attente: 0 };
    }
    // il manque (1 - jetons) jeton : à ce débit, il arrivera dans ce délai
    return { autorise: false, attente: (1 - this.jetons) / this.debit };
  }
}
```

Essai, à enregistrer dans `essai-seau.mjs` : un seau de capacité 5, rempli à 1 jeton par seconde, reçoit 7 requêtes simultanées, puis 4 requêtes trois secondes plus tard.

```js
// import : récupère la classe écrite dans le fichier seau.mjs
import { SeauAJetons } from "./seau.mjs";

// décrit le résultat d'un prélèvement sur une ligne
function ligne(instant, numero, verdict) {
  // opérateur ? : : si l'accès est autorisé on écrit « ok », sinon « refusée »
  const etat = verdict.autorise ? "ok" : "refusée";
  // les ${...} insèrent la valeur d'une variable dans le texte entre accents graves
  return `t=${instant} s  requête ${numero} : ${etat} (attente ${verdict.attente} s)`;
}

// seau de capacité 5, rempli à 1 jeton par seconde
const seau = new SeauAJetons(5, 1);
// boucle for : répète le bloc pour i = 1, 2, ... 7 (i++ ajoute 1 à i à chaque tour) ;
// 7 requêtes au même instant (t = 0 s)
for (let i = 1; i <= 7; i++) {
  // console.log affiche une ligne dans le terminal
  console.log(ligne(0, i, seau.prelever(0)));
}
// 3 secondes plus tard, 3 jetons ont été ajoutés : 4 requêtes
for (let i = 1; i <= 4; i++) {
  console.log(ligne(3, i, seau.prelever(3)));
}
```

Sortie obtenue (fichiers `seau.mjs` et `essai-seau.mjs`, commande `node essai-seau.mjs`) :

```text
t=0 s  requête 1 : ok (attente 0 s)
t=0 s  requête 2 : ok (attente 0 s)
t=0 s  requête 3 : ok (attente 0 s)
t=0 s  requête 4 : ok (attente 0 s)
t=0 s  requête 5 : ok (attente 0 s)
t=0 s  requête 6 : refusée (attente 1 s)
t=0 s  requête 7 : refusée (attente 1 s)
t=3 s  requête 1 : ok (attente 0 s)
t=3 s  requête 2 : ok (attente 0 s)
t=3 s  requête 3 : ok (attente 0 s)
t=3 s  requête 4 : refusée (attente 1 s)
```

La rafale de 5 passe, la 6e est refusée avec une attente de 1 s, exactement le temps de produire un jeton ; après 3 s le seau a regagné 3 jetons. Une requête refusée ne consomme rien.

### L'effet de frontière de la fenêtre fixe, mesuré

Même limite pour les deux méthodes (5 requêtes par 10 secondes, soit 0,5 jeton par seconde) ; 5 requêtes arrivent à 9,9 s, 5 autres à 10,1 s. Le script s'enregistre dans `fixe.mjs` et se lance avec `node fixe.mjs`.

```js
// import : la classe SeauAJetons vue plus haut
import { SeauAJetons } from "./seau.mjs";

/**
 * @brief Compteur à fenêtre fixe : au plus `limite` requêtes par tranche de `duree` s.
 *
 * @param {number} limite - entier au moins égal à 1
 * @param {number} duree - nombre strictement positif (secondes)
 */
class FenetreFixe {
  constructor(limite, duree) {
    // nombre de requêtes permises par tranche, et durée d'une tranche (this : voir plus haut)
    this.limite = limite;
    this.duree = duree;
    // numéro de la tranche en cours et nombre de requêtes déjà vues dedans
    this.tranche = null;
    this.compte = 0;
  }

  /**
   * @brief Compte une requête à l'instant donné.
   *
   * @param {number} maintenant - secondes
   *
   * @returns {boolean} true si la requête est acceptée
   */
  prelever(maintenant) {
    // Math.floor arrondit à l'entier inférieur : 9,9 / 10 donne 0 ; 10,1 / 10 donne 1
    const tranche = Math.floor(maintenant / this.duree);
    // nouvelle tranche (!== : « différent de ») : le compteur repart de zéro
    if (tranche !== this.tranche) {
      this.tranche = tranche;
      this.compte = 0;
    }
    // compte cette requête, puis accepte-la tant que la limite n'est pas dépassée
    this.compte += 1;
    // <= veut dire « inférieur ou égal à »
    return this.compte <= this.limite;
  }
}

// 5 requêtes par tranche de 10 s, contre un seau de 5 jetons rechargé de 0,5 jeton/s
const fenetre = new FenetreFixe(5, 10);
const seau = new SeauAJetons(5, 0.5);
// compteurs des requêtes acceptées par chaque méthode
let acceptesFenetre = 0;
let acceptesSeau = 0;
// 5 requêtes à t = 9,9 s (fin de tranche), puis 5 à t = 10,1 s (début de la suivante) ;
// for...of : parcourt la liste, t prend chaque valeur à son tour
for (const t of [9.9, 9.9, 9.9, 9.9, 9.9, 10.1, 10.1, 10.1, 10.1, 10.1]) {
  // += 1 ajoute 1 au compteur quand la méthode accepte la requête
  if (fenetre.prelever(t)) acceptesFenetre += 1;
  if (seau.prelever(t).autorise) acceptesSeau += 1;
}
console.log(`fenêtre fixe : ${acceptesFenetre} requêtes acceptées en 0,2 s`);
console.log(`seau à jetons : ${acceptesSeau} requêtes acceptées en 0,2 s`);
```

```text
fenêtre fixe : 10 requêtes acceptées en 0,2 s
seau à jetons : 5 requêtes acceptées en 0,2 s
```

La fenêtre fixe laisse passer le **double** de la limite autour de la frontière entre deux tranches ; le seau ne laisse passer que sa capacité.

### Brancher le seau sur un serveur HTTP

Le serveur ci-dessous, à enregistrer dans `app.mjs`, crée un seau par client, refuse avec le code **429** quand il est vide et joint l'en-tête `Retry-After` (le nombre de secondes à attendre avant de réessayer). Le sens exact de ce code et de cet en-tête est détaillé dans [le chapitre sur les codes de statut et les en-têtes de contrôle](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle) ; ici, retenez seulement que 429 signifie « trop de requêtes ».

Le serveur importe une fonction `adresseClient`, qui décide quelle adresse compter pour chaque requête. Elle est écrite dans la dernière partie ; en attendant, le fichier `adresse.mjs` contient une version provisoire qui renvoie l'adresse de la connexion :

```js
// version provisoire : renvoie toujours l'adresse de la connexion ; le « pair » est la
// machine qui a ouvert la connexion avec nous (le client, ou un proxy placé devant)
export function adresseClient(pair) {
  // return rend la valeur à celui qui a appelé la fonction
  return pair;
}
```

```js
// node:http est le module de Node.js qui sait écouter des requêtes HTTP
import http from "node:http";
// performance.now() donne un temps en millisecondes qui ne recule jamais
import { performance } from "node:perf_hooks";
import { SeauAJetons } from "./seau.mjs";
import { adresseClient } from "./adresse.mjs";

// port d'écoute, lu dans une variable d'environnement ; Number convertit le texte en nombre
const PORT = Number(process.env.PORT);
// clés d'API connues (exemples inventés) ; un Set est un ensemble sans doublons, où
// .has(x) répond à « x en fait-il partie ? » (documentation : MDN, Set)
const CLES = new Set(["cle-alice", "cle-bob"]);
// ?? prend la valeur de droite si celle de gauche est absente ; split coupe le texte
// à chaque virgule ; filter(Boolean) retire les morceaux vides ; new Set(...) en fait
// un ensemble
const FIABLES = new Set((process.env.FIABLES ?? "").split(",").filter(Boolean));
// chaque clé de limitation reçoit un seau de 3 jetons, rempli à 1 jeton par seconde
const CAPACITE = 3;
const DEBIT = 1;
// un seau par clé de limitation, créé à la première requête ; une Map associe une valeur
// à une clé : .set(clé, valeur) l'ajoute, .get(clé) la relit, .has(clé) teste sa présence
const seaux = new Map();

// createServer : la fonction fléchée (req, res) => { ... } (une fonction écrite avec =>)
// est appelée à chaque requête reçue (req) pour y répondre (res)
const serveur = http.createServer((req, res) => {
  // adresse du client, selon les règles de confiance vues plus bas
  const adresse = adresseClient(
    req.socket.remoteAddress,
    req.headers["x-forwarded-for"],
    FIABLES,
  );
  // en-tête X-Api-Key envoyé par le client (undefined s'il est absent)
  const cleApi = req.headers["x-api-key"];
  // clé d'API connue : on limite par clé ; sinon, par adresse
  const cle = CLES.has(cleApi) ? `cle:${cleApi}` : `ip:${adresse}`;
  // première requête de cette clé : on lui crée son seau
  if (!seaux.has(cle)) seaux.set(cle, new SeauAJetons(CAPACITE, DEBIT));
  // horloge monotone en secondes : elle ne recule jamais, contrairement à l'heure système
  const verdict = seaux.get(cle).prelever(performance.now() / 1000);
  if (!verdict.autorise) {
    // Retry-After s'écrit en secondes entières : Math.ceil arrondit vers le haut, String
    // convertit le nombre en texte ; writeHead envoie le code et les en-têtes de la réponse
    res.writeHead(429, { "Retry-After": String(Math.ceil(verdict.attente)) });
    res.end(`trop de requêtes pour ${cle}\n`);
    return;
  }
  // sinon la requête passe (code 200 par défaut)
  res.end(`ok pour ${cle}\n`);
});

// n'écoute que sur la machine locale : 127.0.0.1 désigne toujours votre propre machine
serveur.listen(PORT, "127.0.0.1");
```

Lancement dans un premier terminal (syntaxe Bash, voir [les variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement)), puis cinq requêtes avec **curl** (un outil qui envoie une requête HTTP depuis le terminal, [documentation](https://curl.se/docs/)) depuis un second terminal. L'option `-s` supprime les messages de progression, `-i` affiche l'en-tête de la réponse. Le `|` (*pipe*) envoie la sortie de curl à `grep`, qui ne garde que les lignes correspondant à un motif : `-E` active les motifs étendus, `^` signifie « au début de la ligne » et un `|` dans le motif « ou », donc les lignes qui commencent par `HTTP` (le code de statut) ou `Retry-After` (voir [les redirections et pipes](/?c=langages&s=bash&p=redirections-et-pipes) et [le traitement de texte](/?c=langages&s=bash&p=traitement-de-texte)). `for i in 1 2 3 4 5; do ... done` répète les commandes une fois par valeur (voir [les boucles Bash](/?c=langages&s=bash&p=boucles)).

```bash
# lance le serveur sur le port 18431 (PORT est lue par le programme)
PORT=18431 node app.mjs
# second terminal : cinq requêtes de suite depuis la même adresse
for i in 1 2 3 4 5; do
  curl -si http://127.0.0.1:18431/ | grep -E "^HTTP|^Retry-After"
done
```

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
Retry-After: 1
HTTP/1.1 429 Too Many Requests
Retry-After: 1
```

Les trois premières passent (capacité 3), les deux suivantes sont refusées avec `Retry-After: 1`.

### Par adresse IP ou par clé d'API

La **clé de limitation** est ce qui désigne « un client » : il faut choisir ce que l'on compte.

| Clé | Avantage | Limite |
|---|---|---|
| Adresse IP | Disponible pour tout visiteur, même anonyme | Plusieurs personnes derrière la même adresse publique (un bureau, une école, une box : voir [NAT](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#deux-mecanismes-complementaires-dhcp-et-nat)) partagent un seau ; un attaquant qui dispose de nombreuses adresses en obtient un seau par adresse |
| Clé d'API (identifiant donné à chaque développeur ou application cliente) | Précise : suit le client réel, quelle que soit son adresse | Seulement pour les clients qui en ont une ; une clé divulguée est utilisée par n'importe qui |
| Compte utilisateur | Suit la personne | Requiert d'être connecté ; ne protège pas le formulaire de connexion lui-même |

Le serveur ci-dessus limite par clé d'API quand elle est connue, sinon par adresse. Essai (`X-Api-Key` est l'en-tête où le client envoie sa clé ; `-H` ajoute un en-tête à la requête ; `--interface` fait partir la requête d'une adresse locale choisie : sous Linux, toute adresse en `127.x.y.z` désigne votre propre machine, ce qui permet de simuler plusieurs clients ; `head -n 1` ne garde que la première ligne de la réponse) :

```bash
# clé connue, envoyée depuis deux adresses alternées : un seul seau pour la clé
for a in 127.0.0.4 127.0.0.5 127.0.0.4 127.0.0.5; do
  curl -si --interface $a -H "X-Api-Key: cle-alice" http://127.0.0.1:18431/ | head -n 1
done
```

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
```

Deux adresses différentes, un seul quota : celui de la clé. Une clé **inconnue** (`cle-x1`, `cle-x2`, `cle-x3`, `cle-x4`, envoyées depuis la même adresse) retombe sur la limite par adresse : 3 réponses 200, puis 429. Si le serveur créait un seau pour toute clé reçue, un attaquant obtiendrait un seau neuf en inventant une clé à chaque requête.

> **Piège :** garder tous les seaux en mémoire sans jamais les supprimer. Chaque adresse ou clé vue crée une entrée ; un attaquant qui change d'adresse fait grossir la table jusqu'à saturer la mémoire.
>
> **Bonne pratique :** supprimer les seaux inactifs (un seau plein depuis longtemps est équivalent à un seau neuf) et plafonner le nombre d'entrées.

### La même limite dans nginx

Le proxy sait limiter sans écrire une ligne de code applicatif. Les directives `limit_req_zone` et `limit_req_status` se placent hors du bloc `server` (au même niveau que `upstream`), `limit_req` dans un `location` :

```nginx
# limit_req_zone : crée une zone de compteurs en mémoire (10 Mo), un par valeur de clé
# $binary_remote_addr : adresse du client, sous forme compacte ; rate : 1 requête/seconde
limit_req_zone $binary_remote_addr zone=par_ip:10m rate=1r/s;
# même principe avec la clé d'API ; une requête sans l'en-tête X-Api-Key n'est pas comptée
limit_req_zone $http_x_api_key zone=par_cle:10m rate=1r/s;
# code renvoyé quand la limite est dépassée (503 si la directive est absente)
limit_req_status 429;

# dans le bloc « server » existant :
location /api/ {
    # applique la zone par_ip ; burst=3 : jusqu'à 3 requêtes d'avance ; nodelay : sans attente
    limit_req zone=par_ip burst=3 nodelay;
    # même règle par clé d'API : les deux limites s'appliquent
    limit_req zone=par_cle burst=3 nodelay;
    # transmet à l'application ce qui a passé les limites
    proxy_pass http://application;
}

# quand nginx décide un 429, il passe par le bloc nommé « limite » ci-dessous
error_page 429 @limite;
location @limite {
    # always : l'en-tête est ajouté même sur un code d'erreur
    add_header Retry-After 1 always;
    # répond 429 avec un texte court
    return 429 "Trop de requêtes\n";
}
```

| Réglage | Effet |
|---|---|
| `rate=1r/s` | Vitesse de recharge : 1 requête par seconde (`r/m` pour par minute) |
| `burst=3` | Nombre de requêtes d'avance tolérées au-delà du rythme |
| `nodelay` | Les requêtes de la rafale passent tout de suite ; sans lui, nginx les fait **attendre** pour respecter le rythme |
| `$binary_remote_addr` | Clé = adresse du client, stockée sur peu d'octets ; plus économe que `$remote_addr` (texte) |
| `$http_x_api_key` | Clé = valeur de l'en-tête `X-Api-Key` (nginx fabrique `$http_` + nom de l'en-tête en minuscules, tirets remplacés par `_`) |

Résultats observés avec ce fichier (7 requêtes rapides sur `/api/x` depuis une même adresse) :

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
HTTP/1.1 429 Too Many Requests
HTTP/1.1 429 Too Many Requests
```

Quatre acceptées puis des refus : `burst=3` donne **1 + 3** requêtes d'emblée, soit un seau de capacité 4 rempli à 1 par seconde. Le journal d'erreurs de nginx note chaque refus (`limiting requests, excess: 3.961 by zone "par_ip"`). La réponse 429 portait bien `Retry-After: 1`. Avec la clé `k1` envoyée depuis deux adresses alternées, la 5e requête était refusée par la zone `par_cle` (journal : `by zone "par_cle"`).

La documentation de nginx décrit son algorithme comme un « leaky bucket » (*seau qui fuit*), cousin du seau à jetons ; le comportement mesuré (1 + `burst` requêtes d'emblée, puis le rythme `rate`) est celui d'un seau à jetons de capacité `burst + 1`. Sans `nodelay`, avec `burst=3` et des requêtes envoyées à la suite, chacune a été retardée d'environ 1 seconde (mesures : 0,99 s pour les requêtes 2 à 5) au lieu d'être refusée.

> **Piège :** croire que `limit_req_zone $http_x_api_key` protège tout. Les requêtes **sans** en-tête `X-Api-Key` ont une clé vide, que nginx ne compte pas : il faut garder la zone `par_ip` à côté.
>
> **Bonne pratique :** toujours une limite par adresse en filet de sécurité, et la limite par clé en plus pour les clients identifiés.

## Le piège de l'adresse vue derrière un proxy

Toute connexion réseau a deux bouts, et le serveur voit l'adresse de **celui qui lui parle directement**, appelé le **pair** (*peer*). Derrière un proxy, le pair de l'application est toujours le proxy.

```
Sans proxy

Client A (198.51.100.7) --> Application
   l'application voit 198.51.100.7

Avec un proxy inverse

Client A (198.51.100.7) --+
                          +--> Proxy (10.0.0.2) --> Application
Client B (203.0.113.9)  --+
   l'application voit 10.0.0.2 pour A ET pour B
```

Conséquence directe pour la limitation de débit : tous les clients partagent **un seul seau**, celui de l'adresse du proxy, et le premier qui consomme les jetons bloque les autres. Pour le mesurer, un petit proxy joue le rôle de nginx : il reçoit la requête, ajoute l'adresse du client à `X-Forwarded-For`, puis la transmet à l'application. Il s'enregistre dans `proxy.mjs` ; la transmission du contenu utilise `pipe`, expliqué dans [les streams](/?c=langages&s=javascript&p=streams).

```js
// node:http : le module HTTP de Node.js
import http from "node:http";

// port d'écoute du proxy et port de l'application derrière lui
const PORT = Number(process.env.PORT);
const AMONT = Number(process.env.AMONT);

http.createServer((req, res) => {
  // adresse de celui qui vient d'appeler ce proxy
  const vu = req.socket.remoteAddress;
  // chaîne déjà reçue, si un autre proxy est passé avant (undefined sinon)
  const chaine = req.headers["x-forwarded-for"];
  // un proxy ajoute l'adresse qu'il a vue à la fin de la chaîne ; ... recopie les en-têtes
  const entetes = { ...req.headers, "x-forwarded-for": chaine ? `${chaine}, ${vu}` : vu };
  // refait la requête vers l'application, avec les en-têtes complétés
  const options = { host: "127.0.0.1", port: AMONT, path: req.url, headers: entetes };
  const amont = http.request(options, (reponse) => {
    // recopie le code et les en-têtes de la réponse, puis son contenu (pipe : branche un
    // flux de lecture sur un flux d'écriture, voir les streams)
    res.writeHead(reponse.statusCode, reponse.headers);
    reponse.pipe(res);
  });
  // la requête est transmise telle quelle à l'application
  req.pipe(amont);
}).listen(PORT, "127.0.0.1");
```

Les essais ont besoin d'un petit script Bash, `client.sh`, qui joue le client. Il envoie le nombre de requêtes demandé depuis l'adresse locale donnée (`--interface`, comme plus haut) et affiche pour chacune le code de réponse et le texte reçu. Un troisième argument, facultatif, ajoute un en-tête `X-Forwarded-For` à chaque requête. Les commandes qui suivent `curl` mettent le tout sur une ligne : `tr -d '\r'` supprime les retours chariot (`\r`), caractère invisible qui termine chaque ligne d'une réponse HTTP et qui, sinon, ferait écraser la ligne de statut par la suite de l'affichage ; `sed -n '1p;$p'` n'affiche que la première et la dernière ligne ; `paste -sd'|'` joint les lignes en une seule, séparées par `|` ; le dernier `sed` remplace ce `|` par trois espaces. `$1`, `$2` et `$3` sont les arguments donnés au script ; `seq 1 N` produit les nombres de 1 à N ; `$(...)` est remplacé par le résultat de la commande qu'il contient ; un `\` en fin de ligne continue la commande sur la ligne suivante. Le fichier s'enregistre sous le nom `client.sh` ; `chmod +x client.sh` le rend exécutable (voir [les scripts et le shebang](/?c=langages&s=bash&p=scripts-et-shebang) et [les permissions](/?c=langages&s=bash&p=permissions-et-fichiers)).

```bash
#!/bin/bash
# $1 : adresse locale de départ, $2 : nombre de requêtes
# $3 (facultatif) : début de l'adresse écrite dans X-Forwarded-For, suivi de 1, 2, 3...
s=""
# la suite de && ne s'exécute que si le test est vrai ; -gt : « plus grand que »
[ "$2" -gt 1 ] && s="s"
echo "client $1 : $2 requête$s"
for i in $(seq 1 "$2"); do
  # tableau vide, qui reçoit l'option -H (ajouter un en-tête) si $3 est donné
  xff=()
  [ -n "$3" ] && xff=(-H "X-Forwarded-For: $3.$i")
  # -s : silencieux, -i : affiche l'en-tête, --interface : adresse de départ de la requête
  # tr retire les \r de fin de ligne ; sed garde la première ligne (statut) et la dernière
  # (corps) ; paste les joint
  curl -si --interface "$1" "${xff[@]}" http://127.0.0.1:18432/ \
    | tr -d '\r' | sed -n '1p;$p' | paste -sd'|' | sed 's/|/   /'
done
```

Premier essai : l'application tourne avec la version provisoire de `adresseClient` (qui renvoie toujours le pair), et le proxy écoute sur le port 18432 devant elle. Dans trois terminaux, on lance l'application (port 18431), le proxy (`PORT` est son port d'écoute, `AMONT` celui de l'application), puis le client `127.0.0.2` envoie 3 requêtes et le client `127.0.0.3` une seule :

```bash
# terminal 1 : l'application, sur le port 18431
PORT=18431 node app.mjs
# terminal 2 : le proxy, sur le port 18432, qui transmet à l'application du port 18431
PORT=18432 AMONT=18431 node proxy.mjs
# terminal 3 : 3 requêtes du client 127.0.0.2, puis 1 requête du client 127.0.0.3
./client.sh 127.0.0.2 3
./client.sh 127.0.0.3 1
```

```text
client 127.0.0.2 : 3 requêtes
HTTP/1.1 200 OK   ok pour ip:127.0.0.1
HTTP/1.1 200 OK   ok pour ip:127.0.0.1
HTTP/1.1 200 OK   ok pour ip:127.0.0.1
client 127.0.0.3 : 1 requête
HTTP/1.1 429 Too Many Requests   trop de requêtes pour ip:127.0.0.1
```

Le client `127.0.0.3`, qui n'avait encore rien envoyé, est refusé : l'application a compté tout le monde sous l'adresse `127.0.0.1`, celle du proxy.

### X-Forwarded-For : la chaîne des adresses

Le remède est l'en-tête `X-Forwarded-For` (« transmis pour », [description de MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)). Chaque proxy y **ajoute à la fin** l'adresse de celui qui lui a parlé :

```
Client (198.51.100.7) --> Proxy 1 (10.0.0.1) --> Proxy 2 (10.0.0.2) --> Application

En-tête reçu par l'application :   X-Forwarded-For: 198.51.100.7, 10.0.0.1
Pair vu par l'application :        10.0.0.2

  198.51.100.7 : ajouté par Proxy 1 (il a vu le client)
  10.0.0.1     : ajouté par Proxy 2 (il a vu Proxy 1)
  10.0.0.2     : n'est PAS dans l'en-tête : c'est le pair, l'application le voit elle-même
```

L'en-tête est **écrit par les proxys, mais aussi par n'importe quel client** : un client malveillant peut le **forger** (le fabriquer de toute pièce), par exemple envoyer `X-Forwarded-For: 1.1.1.1` pour se faire passer pour une autre adresse. Il n'est digne de confiance que s'il vient d'un proxy **connu**. D'où la règle :

1. Si le pair n'est pas un proxy fiable, on **ignore** l'en-tête et on prend le pair.
2. Si le pair est un proxy fiable, on lit la chaîne **de droite à gauche** et on retient la première adresse qui n'est pas un proxy fiable. Ce qui est à gauche de cette adresse a été écrit par le client, donc n'est pas fiable.

```js
/**
 * @brief Détermine l'adresse du vrai client, derrière zéro, un ou plusieurs proxys.
 *
 * Exemple : pair 10.0.0.2 (fiable), en-tête "1.2.3.4, 10.0.0.1" -> 1.2.3.4
 *
 * @param {string} pair - adresse IP de la machine qui a ouvert la connexion
 * @param {string|undefined} enTete - valeur brute de X-Forwarded-For, ou undefined
 * @param {Set<string>} fiables - adresses des proxys dont on accepte l'en-tête
 *
 * @returns {string} adresse retenue pour identifier le client
 */
export function adresseClient(pair, enTete, fiables) {
  // ! veut dire « non », || « ou » : pair inconnu ou pas d'en-tête, on prend le pair
  // (un pair inconnu peut écrire n'importe quoi dans l'en-tête)
  if (!fiables.has(pair) || !enTete) return pair;
  // découpe "a, b, c" en liste d'adresses ; map applique la fonction (a) => a.trim() à chaque
  // élément, et trim retire les espaces autour
  const chaine = enTete.split(",").map((a) => a.trim());
  // on remonte de la droite : chaque proxy fiable a ajouté l'adresse qu'il a vue ;
  // les positions d'une liste commencent à 0, donc la dernière est à longueur - 1 ;
  // i-- retire 1 à i à chaque tour, et chaine[i] lit l'élément à la position i
  for (let i = chaine.length - 1; i >= 0; i--) {
    // première adresse qui n'est pas un proxy fiable = le client
    if (!fiables.has(chaine[i])) return chaine[i];
  }
  // toute la chaîne est fiable : le client est la première adresse
  return chaine[0];
}
```

Six cas essayés (deux proxys fiables, `10.0.0.1` et `10.0.0.2`), dans un fichier `cas.mjs` lancé par `node cas.mjs` :

```js
// la fonction qu'on vient d'écrire
import { adresseClient } from "./adresse.mjs";

// deux proxys fiables : 10.0.0.1 et 10.0.0.2
const fiables = new Set(["10.0.0.1", "10.0.0.2"]);
// chaque cas : un nom, l'adresse de la connexion, l'en-tête reçu, les proxys fiables
const cas = [
  ["pair inconnu, en-tête forgé", "203.0.113.9", "1.1.1.1", fiables],
  ["pair fiable, un proxy", "10.0.0.2", "198.51.100.7", fiables],
  ["pair fiable, début de chaîne forgé", "10.0.0.2", "1.1.1.1, 198.51.100.7", fiables],
  ["deux proxys fiables", "10.0.0.2", "198.51.100.7, 10.0.0.1", fiables],
  ["pair fiable, pas d'en-tête", "10.0.0.2", undefined, fiables],
  ["aucun proxy fiable", "10.0.0.2", "198.51.100.7", new Set()],
];
// for...of parcourt la liste ; les crochets à gauche extraient les 4 valeurs de chaque cas
for (const [nom, pair, enTete, liste] of cas) {
  console.log(`${nom} -> ${adresseClient(pair, enTete, liste)}`);
}
```

```text
pair inconnu, en-tête forgé -> 203.0.113.9
pair fiable, un proxy -> 198.51.100.7
pair fiable, début de chaîne forgé -> 198.51.100.7
deux proxys fiables -> 198.51.100.7
pair fiable, pas d'en-tête -> 10.0.0.2
aucun proxy fiable -> 10.0.0.2
```

| Cas | Adresse retenue | Raison |
|---|---|---|
| Pair inconnu qui envoie un en-tête | Le pair | L'en-tête vient d'un inconnu : il est ignoré |
| Pair fiable, un proxy | Le client de l'en-tête | Le proxy fiable a écrit cette adresse |
| Client qui forge le début de la chaîne | Le vrai client | La lecture de droite à gauche s'arrête à la première adresse non fiable, ajoutée par le proxy |
| Pair fiable sans en-tête | Le pair | Rien à lire |
| Aucun proxy déclaré fiable | Le pair | Réglage prudent : on voit toujours le proxy |

Second essai, avec la fonction complète. On remplace le contenu de `adresse.mjs` par la fonction `adresseClient` ci-dessus, puis on arrête l'application (`Ctrl+C` dans le terminal 1) et on la relance avec `FIABLES=127.0.0.1` (l'adresse du proxy de test). Cette relance remet aussi tous les seaux à zéro. Le proxy, lui, continue de tourner :

```bash
# terminal 1 : relance l'application ; FIABLES liste les proxys dont on croit l'en-tête
FIABLES=127.0.0.1 PORT=18431 node app.mjs
# terminal 3 : mêmes requêtes qu'au premier essai
./client.sh 127.0.0.2 3
./client.sh 127.0.0.3 1
```


```text
client 127.0.0.2 : 3 requêtes
HTTP/1.1 200 OK   ok pour ip:127.0.0.2
HTTP/1.1 200 OK   ok pour ip:127.0.0.2
HTTP/1.1 200 OK   ok pour ip:127.0.0.2
client 127.0.0.3 : 1 requête
HTTP/1.1 200 OK   ok pour ip:127.0.0.3
```

Chaque client a maintenant son seau. Enfin, le client `127.0.0.2` envoie à travers le proxy cinq requêtes avec un `X-Forwarded-For` **différent** à chaque fois (`1.1.1.1`, `1.1.1.2`...) pour tenter d'obtenir cinq seaux neufs. Mais le seau de `127.0.0.2` vient d'être vidé par l'essai précédent, et il se remplit à 1 jeton par seconde. Lancées tout de suite, les cinq requêtes seraient toutes refusées (`429`), sans rien prouver sur la forgerie. Il faut donc attendre 3 secondes, le temps que les 3 jetons reviennent (`sleep 3` met le terminal en pause 3 secondes) :

```bash
# attend 3 secondes pour que le seau se remplisse
sleep 3
# cinq requêtes avec un X-Forwarded-For différent : 1.1.1.1, 1.1.1.2, ...
./client.sh 127.0.0.2 5 1.1.1
```

```text
client 127.0.0.2 : 5 requêtes
HTTP/1.1 200 OK   ok pour ip:127.0.0.2
HTTP/1.1 200 OK   ok pour ip:127.0.0.2
HTTP/1.1 200 OK   ok pour ip:127.0.0.2
HTTP/1.1 429 Too Many Requests   trop de requêtes pour ip:127.0.0.2
HTTP/1.1 429 Too Many Requests   trop de requêtes pour ip:127.0.0.2
```

L'application voit `1.1.1.i, 127.0.0.2`, retient `127.0.0.2` et répond `200`, `200`, `200`, `429`, `429`. La forgerie échoue.

### L'équivalent dans nginx : le module realip

Quand nginx est lui-même derrière un autre proxy, c'est lui qui doit retrouver l'adresse du client avant d'appliquer `limit_req` (sinon la zone `par_ip` compte l'adresse du proxy de devant). Le module *realip* ([documentation](https://nginx.org/en/docs/http/ngx_http_realip_module.html)) applique la même règle que `adresseClient` :

```nginx
# dans le bloc « server », avant les « location » :
# les pairs de ce réseau privé (10.x.x.x, adresses inventées) sont des proxys fiables
set_real_ip_from 10.0.0.0/8;
# lit l'adresse du client dans cet en-tête plutôt que dans la connexion
real_ip_header X-Forwarded-For;
# saute les adresses de confiance en partant de la droite
real_ip_recursive on;
```

(La notation `10.0.0.0/8` est la [notation CIDR](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#la-notation-cidr-une-ecriture-abregee-du-masque).) Avec cette configuration (adaptée au réseau de test : `127.0.0.1/32`), derrière le petit proxy, un client en `127.0.0.2` qui envoie `X-Forwarded-For: 1.1.1.i` a été compté sous `127.0.0.2` : `200`, `200`, `200`, `200`, `429`, `429` (burst de 3, soit 4 requêtes d'emblée).

Second essai : une connexion directe depuis `127.0.0.2` (pair non fiable) avec un en-tête forgé était comptée sous `127.0.0.2` aussi. La zone était encore épuisée par l'essai précédent, d'où six `429` de suite : l'en-tête forgé n'a pas donné de seau neuf.

> **Piège :** après `real_ip_header`, la variable `$remote_addr` contient l'adresse du **client** et plus celle de la connexion. Avec `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`, nginx ajoute alors l'adresse du client une seconde fois : l'application a reçu `1.1.1.1, 127.0.0.2, 127.0.0.2` au lieu de `1.1.1.1, 127.0.0.2`. L'adresse de la connexion reste disponible dans `$realip_remote_addr`.
>
> **Bonne pratique :** laisser l'application lire la chaîne de droite à gauche avec la liste de ses proxys fiables, et ne pas déduire le nombre de proxys du nombre d'adresses de la chaîne.

| Version de l'adresse | Où la lire | Fiable ? |
|---|---|---|
| Pair de la connexion | `req.socket.remoteAddress` en Node.js, `$remote_addr` dans nginx sans `realip` | Oui : c'est la connexion réelle |
| Début de `X-Forwarded-For` | Première adresse de la liste | Non : écrite par le client |
| Fin de `X-Forwarded-For` | Dernière adresse de la liste | Oui si le pair est un proxy fiable, parce qu'il l'a ajoutée |
| Adresse retenue par `adresseClient` ou `realip` | Résultat de la règle ci-dessus | Oui, à condition que la liste des proxys fiables soit exacte |

Pour que cette règle suffise, l'application ne doit accepter que les connexions venant du proxy : un [pare-feu](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld) qui bloque l'accès direct complète le dispositif. Exemple avec ufw, si le proxy est en `10.0.0.2` et l'application sur le port 3000 :

```bash
# n'autorise que le proxy (10.0.0.2) à joindre le port 3000 de cette machine
sudo ufw allow from 10.0.0.2 to any port 3000 proto tcp
# refuse tout autre accès à ce port (la règle d'autorisation, posée avant, passe en premier)
sudo ufw deny 3000/tcp
```

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| Lire l'adresse de la connexion derrière un proxy | Tous les clients portent l'adresse du proxy et se partagent un seau | Lire `X-Forwarded-For` uniquement si le pair est un proxy fiable |
| Faire confiance à `X-Forwarded-For` sans condition | N'importe quel client écrit l'adresse qu'il veut et contourne la limite | Ignorer l'en-tête si le pair n'est pas fiable, lire la chaîne de droite à gauche |
| Prendre la première adresse de la chaîne | C'est celle qu'un client peut forger | S'arrêter à la première adresse non fiable en partant de la droite |
| Laisser l'application joignable en direct | Un attaquant contourne le proxy, ses limites et son WAF | Pare-feu : n'accepter que les connexions du proxy |
| Un seul proxy sans redondance | Sa panne arrête tout le site | Au moins deux proxys identiques |
| Mettre en cache une page personnalisée | Un visiteur reçoit la page d'un autre | `proxy_cache` seulement sur les chemins publics |
| `proxy_set_header` dans un `location` | Les en-têtes du bloc `server` ne sont plus hérités | Mettre tous les en-têtes au même niveau ou les inclure |
| Oublier les WebSocket et les délais d'attente | Sans `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;` et `proxy_set_header Connection "upgrade";`, une connexion [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) échoue ; au bout de `proxy_read_timeout` (60 s par défaut), nginx coupe une réponse trop lente | Ajouter ces trois directives pour les chemins WebSocket et régler le délai |
| Oublier `Host` | L'application reçoit le nom du groupe `upstream` | `proxy_set_header Host $host;` |
| Limiter seulement par clé d'API | Les requêtes sans clé échappent à la zone | Garder une limite par adresse en plus |
| Un seau par clé reçue, sans validation | Un attaquant invente une clé neuve à chaque requête | Ne créer un seau propre qu'aux clés connues |
| Seaux jamais supprimés | La mémoire grossit avec le nombre d'adresses vues | Purger les seaux inactifs, plafonner leur nombre |
| Compteur dans chaque instance | Avec *n* instances, un client obtient *n* fois la limite | Compteur partagé (Redis) ou limite au proxy |
| Horloge système pour mesurer le temps | Un changement d'heure peut faire reculer le temps | Une horloge monotone (`performance.now()`) |
| `Retry-After` non entier | L'en-tête s'écrit en secondes entières | Arrondir vers le haut (`Math.ceil`) |
| Fenêtre fixe pour une limite par seconde | Le double de la limite passe autour de la frontière | Seau à jetons pour les limites courtes |
| Compter aussi les requêtes refusées | Un client poli qui insiste ne s'en sort plus | Un refus ne consomme aucun jeton |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Terminer TLS sur le proxy et re-chiffrer vers les applications si le réseau interne n'est pas sûr | Un seul endroit gère les certificats ; le trafic interne reste protégé quand il le faut |
| Transmettre `Host`, `X-Forwarded-For` et `X-Forwarded-Proto` | L'application connaît le domaine, le client et le protocole d'origine |
| Déclarer explicitement la liste des proxys fiables | La confiance est un choix écrit, pas un défaut |
| Limiter par adresse au proxy, puis par clé ou par compte dans l'application | Chaque couche voit ce qu'elle connaît |
| Régler la capacité du seau sur la rafale légitime et le débit sur la moyenne | Un utilisateur normal n'atteint jamais la limite |
| Répondre 429 avec `Retry-After` plutôt que couper la connexion | Les clients bien écrits savent quand revenir |
| Tester le comportement avec des horloges simulées et des adresses forgées | Les cas limites se vérifient sans attendre ni attaquer |
| Surveiller le nombre de refus | Un pic de refus signale un bug client ou une attaque |
| Lancer `nginx -t` avant chaque rechargement | Une erreur de syntaxe ne coupe pas le site |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un **proxy inverse** est un intermédiaire placé devant les serveurs d'application : il termine TLS, répartit la charge, garde un cache, cache les serveurs et compresse. Un **proxy direct** protège au contraire des clients. La **limitation de débit** plafonne les requêtes par client ; le **seau à jetons** accepte une rafale égale à sa capacité puis suit le rythme du débit, alors que la fenêtre fixe laisse passer le double de la limite autour de la frontière (10 requêtes acceptées contre 5 dans l'essai). Une réponse **429** avec `Retry-After` dit quand réessayer. Derrière un proxy, l'application voit l'adresse du proxy : l'adresse du client se lit dans `X-Forwarded-For`, seulement si le pair est un proxy connu, de droite à gauche. |
| **Pièges à éviter** | Lire l'adresse de la connexion derrière un proxy ; croire `X-Forwarded-For` quand le pair est inconnu ou prendre sa première adresse ; laisser l'application joignable sans passer par le proxy ; mettre en cache une page personnalisée ; limiter seulement par clé d'API ; créer un seau pour toute clé inventée ; garder les seaux sans les purger ; compter dans chaque instance séparément ; perdre les `proxy_set_header` dans un `location`. |
| **Bonnes pratiques** | Transmettre `Host`, `X-Forwarded-For` et `X-Forwarded-Proto` ; déclarer la liste des proxys fiables ; limiter par adresse au proxy et par clé dans l'application ; seau à jetons pour les limites courtes ; 429 avec `Retry-After` ; compteurs partagés quand il y a plusieurs instances ; `nginx -t` avant tout rechargement. |
