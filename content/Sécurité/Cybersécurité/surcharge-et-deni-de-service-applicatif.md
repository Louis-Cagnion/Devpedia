---
order: 16
---

# Surcharge et déni de service applicatif

[Sécurité des API web](/?c=securite&s=cybersecurite&p=securite-api-web) couvre le rate limiting : limiter le NOMBRE de requêtes qu'un client peut envoyer. Ce chapitre couvre une famille différente, complémentaire : des requêtes en apparence légitimes et peu nombreuses, mais conçues pour coûter beaucoup plus cher à traiter que ce que leur taille laisse supposer. Un rate limiting bien réglé ne protège pas contre une seule requête déjà démesurément coûteuse.

## ReDoS : une regex dont le temps d'exécution explose

Certains motifs d'expression régulière, notamment ceux qui empilent plusieurs groupes quantifiés (`(a+)+`, `(a|a)*`), ont un temps d'exécution qui peut croître de façon EXPONENTIELLE avec la longueur de l'entrée testée, sur une entrée précisément conçue pour ne jamais trouver de correspondance.

```text
Motif vulnerable :  ^(a+)+$
Entree adverse   :  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"
                     (30-40 "a" suivis d'un caractere qui ne correspond jamais)

-> Le moteur regex essaie TOUTES les facons de decouper la chaine de "a" entre
   le groupe interne et le groupe externe avant de conclure a l'echec :
   le nombre de combinaisons double a chaque "a" supplementaire

30 "a"  -> quelques millisecondes
40 "a"  -> quelques secondes
50 "a"  -> plusieurs MINUTES, pour une seule requete
```

Une seule requête, de taille minuscule, suffit alors à occuper un processus entier pendant un temps disproportionné : plus besoin d'envoyer un gros volume de trafic pour saturer un service.

> **Bonne pratique :** éviter les groupes quantifiés imbriqués dans une regex appliquée à une entrée externe ; imposer un délai maximal d'exécution à toute évaluation de regex sur une donnée non fiable ; tester une regex avec un outil dédié à la détection de motifs vulnérables au ReDoS avant de la déployer.

## Bombes de décompression

Un fichier compressé minuscule peut représenter, une fois décompressé, une taille démesurément plus grande : un ratio de compression extrême, atteignable en répétant volontairement la même donnée des millions de fois avant compression (qui compresse très efficacement des données répétitives).

```text
Fichier "zip bomb" typique : quelques kilo-octets compresses
  -> plusieurs GIGA-octets une fois decompresses

Si l'application decompresse ENTIEREMENT le fichier en memoire avant
de l'examiner (scan antivirus, extraction d'un import), elle epuise
sa memoire disponible sur un seul fichier de quelques Ko recu
```

Une variante XML porte le nom d'**attaque "billion laughs"** : un document XML déclare une entité qui en référence plusieurs autres, elles-mêmes référençant plusieurs autres, sur plusieurs niveaux : un document de quelques lignes se développe en milliards d'occurrences une fois toutes les entités résolues (mécanisme d'entité déjà vu pour le [XXE](/?c=securite&s=cybersecurite&p=injections-au-dela-du-sql), ici détourné pour épuiser des ressources plutôt que pour lire un fichier).

> **Bonne pratique :** imposer une taille maximale de décompression AVANT de décompresser entièrement un fichier (la plupart des bibliothèques de (dé)compression exposent une limite configurable), et désactiver la résolution d'entités XML externes/imbriquées par défaut (même défense que pour le XXE).

## Pagination et requêtes sans limite

Un endpoint qui renvoie une collection entière faute de `LIMIT`/pagination imposée CÔTÉ SERVEUR permet d'extraire une table entière en une seule requête. Un paramètre de pagination laissé au choix du client (`?limit=`), sans plafond, revient au même problème sous une autre forme.

```text
GET /api/clients            -> sans limite serveur, renvoie TOUS les clients en un appel

GET /api/clients?limit=999999999
                             -> si le parametre client n'est jamais plafonne cote serveur,
                                revient exactement au meme resultat
```

> **Bonne pratique :** imposer une limite maximale côté serveur sur toute collection retournée, indépendamment de ce que le client demande ; plafonner explicitement toute valeur de `limit`/`per_page` fournie par le client à un maximum raisonnable, jamais la transmettre telle quelle à la requête.

## Épuisement de ressources locales

Ouvrir une connexion, un processus ou un thread par requête, sans limite ni réutilisation, permet de saturer le serveur avec un nombre de requêtes qui resterait pourtant raisonnable pour une application qui gère cette ressource correctement.

| Ressource | Risque sans limite | Mitigation |
|---|---|---|
| Connexions réseau/base de données | Une requête par client ouvre une nouvelle connexion sans jamais la réutiliser ni la fermer | Pool de connexions à taille fixe, réutilisées entre requêtes |
| Processus/sous-processus lancés par requête | Un serveur qui lance un nouveau processus lourd (navigateur piloté, conversion de fichier) par requête utilisateur, sans file d'attente ni limite de parallélisme | File d'attente avec un nombre maximal de tâches simultanées, le reste patiente plutôt que de tout lancer en même temps |
| Upload de fichier | Absence de limite de taille sur un fichier envoyé | Limite de taille imposée côté serveur, pas seulement côté formulaire |

## Amplification de coût via une API tierce

Une fonctionnalité qui déclenche un appel à une API tierce PAYANTE ou À QUOTA (un LLM, un service d'envoi de SMS, une API de géocodage) pour chaque requête utilisateur, sans limite ni cache, déplace le risque : la ressource épuisée n'est même plus locale (CPU, mémoire), c'est directement le budget ou le quota du compte.

```text
Fonctionnalite : "Resume ce texte avec l'IA" -> 1 appel LLM par clic utilisateur,
                                                  sans limite ni cache

Attaquant : script qui declenche cette action des milliers de fois
            -> facture explose, ou quota mensuel epuise en quelques minutes,
               sans qu'aucune ressource LOCALE ne soit jamais saturee
```

> **Bonne pratique :** appliquer un rate limiting spécifique à toute fonctionnalité qui déclenche un appel tiers facturé, indépendamment du rate limiting général de l'API ; mettre en cache un résultat identique déjà obtenu plutôt que de rappeler le service tiers à chaque fois.

## Email/notification bombing

Un formulaire (contact, inscription, réinitialisation de mot de passe) qui envoie un email ou un SMS à une adresse/un numéro FOURNI PAR L'UTILISATEUR, sans limite de fréquence, peut être détourné pour spammer un tiers dont on connaît juste l'adresse, sans jamais avoir besoin d'accéder à son compte.

> **Bonne pratique :** limiter le nombre d'envois par destinataire (pas seulement par IP/compte expéditeur) sur toute fonctionnalité qui envoie une communication à une adresse fournie par un tiers.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Au-delà du simple rate limiting (nombre de requêtes), une requête individuelle peut coûter démesurément plus cher que sa taille ne le suggère : ReDoS (temps de calcul), bombe de décompression (mémoire), pagination sans limite (base de données), épuisement de connexions/processus, amplification de coût via une API tierce facturée, ou email bombing vers un tiers. |
| **Outils utilisables** | Délai maximal d'exécution sur une regex ; limite de taille de décompression ; plafond serveur sur toute pagination ; pool de connexions/file d'attente à taille fixe ; cache pour un appel tiers répété. |
| **Pièges à éviter** | Une regex à groupes quantifiés imbriqués sur une entrée externe. Décompresser un fichier entièrement avant d'en vérifier la taille. Faire confiance à un paramètre `limit` fourni par le client sans plafond serveur. Appeler une API tierce facturée sans limite ni cache. Envoyer un email/SMS à une adresse tierce sans limite de fréquence. |
| **Bonnes pratiques** | Tester une regex contre le ReDoS avant déploiement. Limiter la taille de décompression en amont. Plafonner toute collection retournée côté serveur. Mettre en cache et limiter spécifiquement tout appel tiers facturé. Limiter les envois par destinataire, pas seulement par expéditeur. |
