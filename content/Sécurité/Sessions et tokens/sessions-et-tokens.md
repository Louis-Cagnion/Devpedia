---
order: 3
---

# Sessions et tokens

Une fois l'identité vérifiée (voir [Fondamentaux](/?c=authentification&s=fondamentaux&p=fondamentaux)), un problème concret se pose : comment le serveur se souvient-il qu'un utilisateur reste connecté d'une requête HTTP à l'autre ? Ce subject couvre les deux réponses classiques à cette question : la **session**, où le serveur garde l'état de connexion de son côté, et le **token**, où cet état est porté directement par le client à chaque requête.

Vous retrouverez les différentes notions ci-dessous :
