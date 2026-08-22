---
order: 5
---

# Diffusion en direct et chat à grande échelle

Le chapitre [CDN et diffusion adaptative](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) couvre une vidéo qui existe déjà en entier avant d'être regardée (un film Netflix, encodé et stocké à l'avance). Un direct (Twitch, mais le principe s'applique à tout live streaming) pose un problème différent : la vidéo n'existe pas encore quand le spectateur la demande, elle est produite **en ce moment même**, et doit atteindre des dizaines de milliers de spectateurs quelques secondes seulement après avoir été filmée.

## Le chemin d'un direct : ingestion, transcodage, diffusion

```text
Streamer (logiciel de capture)
   |  envoie un flux vidéo continu
   v
Serveur d'ingestion (le plus proche possible du streamer)
   |  transcode en direct, en plusieurs qualités
   v
Réseau CDN (mêmes nœuds que pour une vidéo à la demande)
   |  diffusion adaptative, comme vu au chapitre précédent
   v
Spectateurs (des dizaines de milliers, chacun choisissant sa qualité)
```

La différence avec une vidéo à la demande se joue aux deux premières étapes : un **serveur d'ingestion** reçoit en continu le flux brut envoyé par le streamer, et le **transcodage** (réencodage en plusieurs qualités, comme pour Netflix) doit se faire en quelques secondes, en continu, plutôt qu'une seule fois à l'avance sur un fichier déjà complet.

## Le prix du direct : un délai incompressible

Chaque étape (transcodage, découpage en segments, propagation jusqu'au nœud CDN le plus proche du spectateur) prend un peu de temps. Additionnées, ces étapes créent un **délai de diffusion** (*stream delay*) de plusieurs secondes entre l'instant réel et ce que voit le spectateur, même dans les meilleures conditions.

> **Piège :** attendre d'un direct une latence nulle, identique à une conversation en face à face. Le passage par le transcodage et le CDN, indispensable pour servir des dizaines de milliers de spectateurs à la fois, ajoute mécaniquement plusieurs secondes de délai : c'est pour cela qu'un message de chat peut sembler réagir à un événement "avant" que le spectateur ne le voie lui-même à l'écran.
>
> **Bonne pratique :** pour une interaction qui exige une latence minimale entre un petit nombre de participants (deux joueurs dans une même partie, par exemple), passer par une connexion directe de type [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) plutôt que par le pipeline vidéo, sans pour autant chercher à éliminer le délai de la vidéo elle-même, structurellement incompressible à cette échelle.

## Le chat : diffuser le même message à tout le monde, pas un flux personnalisé

Le [fil d'actualité](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out) construit un contenu **différent pour chaque utilisateur** (les publications des comptes qu'il suit). Le chat d'un direct résout un problème inverse : des centaines de milliers de messages par seconde, mais **tous les spectateurs d'un même canal doivent recevoir exactement les mêmes messages**, dans le même ordre, au même moment.

```text
Spectateur 1 ─┐
Spectateur 2 ─┼── tous abonnés au même canal
Spectateur 3 ─┘

Message envoyé -> publié une seule fois -> diffusé à tous les abonnés du canal simultanément
```

Ce modèle s'appelle **publication/abonnement** (*publish/subscribe*, ou *pub/sub*) : chaque spectateur s'abonne au canal du direct qu'il regarde, et chaque message n'est traité qu'une seule fois par le serveur puis renvoyé à tous les abonnés, plutôt que d'être recalculé individuellement pour chacun.

| | Fil d'actualité (fan-out) | Chat d'un direct (pub/sub) |
|---|---|---|
| Contenu reçu | Différent pour chaque utilisateur (selon qui il suit) | Identique pour tous les abonnés d'un même canal |
| Ce qui varie | La liste de comptes suivis | Rien : tout le monde reçoit tout |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un direct ajoute une étape d'ingestion et un transcodage en continu avant de rejoindre le même CDN qu'une vidéo à la demande, ce qui crée un délai de diffusion incompressible de quelques secondes. Le chat associé diffuse le même message à tous les abonnés d'un canal (pub/sub), à l'inverse d'un fil d'actualité qui personnalise le contenu par utilisateur (fan-out). |
| **Outils utilisables** | Un WebSocket pour une interaction qui exige une latence minimale, indépendante du délai vidéo. |
| **Pièges à éviter** | Attendre une latence nulle d'un direct diffusé à grande échelle. |
| **Bonnes pratiques** | Séparer les interactions à faible latence (WebSocket direct) du pipeline vidéo, sans chercher à réduire le délai structurel de ce dernier. |
