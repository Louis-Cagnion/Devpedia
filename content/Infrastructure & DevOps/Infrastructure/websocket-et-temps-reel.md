---
order: 2
---

# WebSocket : la communication temps réel

[HTTP](/?c=infrastructure&p=api-et-http) répond bien à une demande ponctuelle, mais reste mal adapté à un flux continu où le serveur doit pouvoir parler **sans attendre de question** : un message de chat qui arrive, le score d'une partie qui change chez un autre joueur, une notification en direct. **WebSocket** répond à ce besoin précis avec une connexion qui reste ouverte, dans les deux sens, plutôt qu'un aller-retour à chaque échange.

## Le problème : HTTP est pensé pour une question, pas pour un flux

Avec [HTTP](/?c=infrastructure&p=api-et-http) seul, le serveur ne peut jamais initier un envoi : il ne fait que répondre à une requête du client. Simuler un flux en temps réel demande donc de **redemander** en boucle :

```text
Polling (interroger a intervalles reguliers) :

Client -> GET /nouveaux-messages -> Serveur : rien de nouveau
Client -> GET /nouveaux-messages -> Serveur : rien de nouveau
Client -> GET /nouveaux-messages -> Serveur : 1 nouveau message !
```

Chaque requête recrée une connexion, avec ses en-têtes et sa négociation, pour un résultat le plus souvent vide : soit l'intervalle est court et la majorité des requêtes ne servent à rien, soit il est long et la mise à jour arrive en retard.

## WebSocket : une connexion qui reste ouverte

Une connexion WebSocket démarre comme une requête [HTTP](/?c=infrastructure&p=api-et-http) normale, avec un en-tête `Upgrade: websocket` qui demande au serveur de faire évoluer cette même connexion TCP vers un protocole différent, plutôt que d'en fermer une puis d'en ouvrir une autre :

```text
Client                                    Serveur
  ---- GET /chat  Upgrade: websocket -->
  <--- 101 Switching Protocols ---------

  (a partir d'ici : la connexion reste ouverte, dans les deux sens)

  ---- message "Bonjour" -------------->
  <--- message "Salut !" ---------------
  <--- message "Un tiers vient d'arriver" ---   (le serveur initie, sans requete prealable)
```

Une fois la connexion établie, chaque partie peut envoyer un message à tout moment, sans que l'autre ait rien demandé : c'est précisément ce que ne permet pas [HTTP](/?c=infrastructure&p=api-et-http) seul.

> **Note :** l'échange initial ("handshake") emprunte [HTTP](/?c=infrastructure&p=api-et-http), ce qui permet à une connexion WebSocket de passer par les mêmes ports (80/443) et la plupart des mêmes infrastructures réseau (proxys, pare-feux) qu'un trafic web classique ; seule la connexion, une fois établie, bascule vers un protocole différent.

## Socket.IO : une bibliothèque au-dessus du protocole WebSocket

**Socket.IO** n'est pas un synonyme de WebSocket, mais une bibliothèque construite dessus, qui ajoute ce que le protocole brut ne fournit pas :

| | WebSocket (protocole brut) | Socket.IO (bibliothèque) |
|---|---|---|
| Niveau | Protocole réseau standardisé | Bibliothèque, avec un serveur et un client dédiés |
| Repli si la connexion échoue | Aucun | Retombe automatiquement sur du *long-polling* si WebSocket est indisponible |
| Reconnexion | À gérer soi-même | Automatique, avec relivraison des événements manqués selon la configuration |
| Modèle | Envoyer/recevoir des messages bruts (texte ou binaire) | Émettre des **événements** nommés, avec des données structurées, éventuellement groupés en salons (*rooms*) |

> **Piège :** supposer qu'un client WebSocket brut peut se connecter directement à un serveur Socket.IO (ou l'inverse). Socket.IO ajoute sa propre couche de protocole par-dessus WebSocket (identification des événements, accusés de réception) : un client qui ne parle que le protocole WebSocket standard ne comprend pas ces messages, même si la connexion initiale s'établit sans erreur.
>
> **Bonne pratique :** choisir WebSocket brut pour un besoin simple et un contrôle total du format des messages ; choisir Socket.IO (ou une bibliothèque équivalente) dès que la reconnexion automatique, le repli de compatibilité ou un modèle par événements nommés font gagner un temps de développement réel, en acceptant la dépendance à cette bibliothèque des deux côtés (serveur et client).

## Un exemple d'usage : la boucle de jeu autoritaire côté serveur

Dans un jeu multijoueur en temps réel (un jeu de balle type Pong, par exemple), le serveur ne se contente pas de relayer des messages : il fait tourner sa propre simulation du jeu (position de la balle, collisions, score) à intervalles réguliers, et n'accepte des clients que leurs **entrées** (touches pressées), jamais leur position. C'est le modèle **serveur autoritaire** : la position réelle du jeu n'existe qu'en un seul endroit (le serveur), ce qui empêche un client de tricher en annonçant lui-même une fausse position.

```text
Client A -- entrees (haut/bas) -->
Client B -- entrees (haut/bas) -->   Serveur : simule le jeu a un rythme fixe (ex. 60 Hz)
                                      (position, collisions, score...), puis diffuse
                                      l'etat obtenu via WebSocket a tous les clients

Les clients n'envoient jamais leur position : ils recoivent l'etat et l'affichent, sans rien calculer.
```

## Le rythme de simulation (tick rate) peut différer du rythme d'émission

La boucle de simulation tourne à un intervalle fixe (le **tick**, par exemple toutes les 1/60e de seconde, soit 60 Hz), typiquement via un minuteur répété (`setInterval`). Mais rien n'oblige à envoyer l'état du jeu à chaque tick : diffuser un tick sur deux, par exemple, réduit de moitié la bande passante réseau sans perdre en précision de calcul, la simulation continuant de tourner à plein régime.

| | Tick rate (simulation) | Emit rate (diffusion réseau) |
|---|---|---|
| Rôle | Calculer le prochain état du jeu | Envoyer cet état aux clients par WebSocket |
| Peut être plus rapide que l'autre ? | Oui, toujours au moins aussi rapide | Non, jamais plus rapide que le tick rate |
| Coût si trop élevé | Charge CPU du serveur | Bande passante réseau |

> **Piège :** calculer le déplacement d'un tick à partir d'un temps écoulé (`dt`) non plafonné. Si le serveur ralentit ponctuellement (un pic de charge, une pause du ramasse-miettes), le `dt` du tick suivant peut devenir anormalement grand, faisant traverser un mur à un objet qui, à un rythme normal, aurait été arrêté par la collision au tick intermédiaire.
>
> **Bonne pratique :** plafonner `dt` à une valeur maximale raisonnable (par exemple jamais plus de 50 ms simulées d'un coup, même si le tick réel a pris plus longtemps), pour que la simulation reste cohérente même après un ralentissement ponctuel du serveur.

## Quand WebSocket est la bonne réponse, quand une autre suffit

| Besoin | Solution adaptée |
|---|---|
| Le client demande, le serveur répond une fois | [HTTP](/?c=infrastructure&p=api-et-http) classique |
| Un service tiers doit notifier le sien d'un événement ponctuel, serveur à serveur | Un *webhook* ([HTTP](/?c=infrastructure&p=api-et-http) simple, déclenché par l'événement) |
| Les deux parties doivent pouvoir s'envoyer des messages en continu, sans latence d'attente | WebSocket |

Un *webhook* ressemble à du temps réel côté serveur (il notifie sans requête explicite), mais reste une requête [HTTP](/?c=infrastructure&p=api-et-http) ponctuelle à sens unique : il ne maintient aucune connexion ouverte, contrairement à WebSocket.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | WebSocket transforme une connexion HTTP initiale en une connexion bidirectionnelle qui reste ouverte, permettant au serveur d'envoyer un message sans requête préalable du client. Socket.IO est une bibliothèque construite sur ce protocole, qui ajoute repli automatique, reconnexion et un modèle par événements nommés. |
| **Outils utilisables** | WebSocket brut pour un contrôle total et un besoin simple ; Socket.IO (ou équivalent) quand la reconnexion automatique et le repli de compatibilité valent la dépendance ajoutée. |
| **Pièges à éviter** | Simuler du temps réel par polling répété, coûteux et en retard. Connecter un client WebSocket brut à un serveur Socket.IO en attendant qu'ils s'entendent nativement. Calculer un tick de simulation avec un `dt` non plafonné. |
| **Bonnes pratiques** | Réserver WebSocket aux échanges réellement bidirectionnels et continus ; un webhook HTTP simple suffit pour une notification ponctuelle serveur à serveur. Pour un jeu ou une simulation multijoueur, garder le serveur autoritaire et découpler le tick rate de l'emit rate. |
