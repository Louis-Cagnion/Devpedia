---
order: 7
---

# Sécurité des webhooks

Un **webhook** est l'inverse d'un appel d'API classique : au lieu que votre application aille chercher une information chez un service tiers, c'est ce service tiers qui envoie de lui-même une requête vers une URL de votre application dès qu'un événement survient (un paiement confirmé, un message reçu, un fichier déposé). Cette inversion crée un problème que l'API classique n'a pas : votre application doit maintenant prouver qu'une requête ENTRANTE vient réellement du service attendu, et pas d'un attaquant qui a simplement deviné l'URL.

## Le problème : n'importe qui peut envoyer une requête à cette URL

```text
Service tiers (paiement) -----> POST https://votre-site.example/webhooks/paiement
                                 { "commande_id": 42, "statut": "paye" }

Attaquant (a deviné ou trouvé l'URL) -----> POST https://votre-site.example/webhooks/paiement
                                             { "commande_id": 42, "statut": "paye" }
                                             (FAUSSE notification, commande jamais réellement payée)
```

Sans vérification, le code qui reçoit ce webhook ne peut pas distinguer les deux requêtes : les deux arrivent avec la même forme, sur la même URL.

## La solution : HMAC, déjà vu, appliqué à ce scénario précis

[HMAC](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (signature symétrique par secret partagé) est le mécanisme standard pour authentifier un webhook : le service tiers et votre application partagent un secret à l'avance (fourni lors de la configuration du webhook), et chaque requête envoyée est accompagnée d'une signature calculée avec ce secret.

```text
Service tiers (connait le secret partage)
  1. Calcule signature = HMAC(corps_de_la_requete, secret)
  2. Envoie la requete avec un en-tete : X-Signature: <signature>

Votre application (connait le meme secret)
  3. Recalcule sa PROPRE signature a partir du corps recu + du secret
  4. Compare sa signature a celle recue dans l'en-tete X-Signature
  5. Si differentes -> requete rejetee (pas vraiment envoyee par le service tiers,
     ou corps modifie en chemin)
```

```php
// Verification cote application (PHP), au moment de recevoir le webhook
$corps_recu = file_get_contents('php://input');
$signature_recue = $_SERVER['HTTP_X_SIGNATURE'];
$signature_calculee = hash_hmac('sha256', $corps_recu, $secret_partage);

// hash_equals() (déjà vu en cryptographie appliquée) : comparaison à temps constant,
// jamais == / === sur une signature, pour éviter une attaque par mesure de temps
if (!hash_equals($signature_calculee, $signature_recue)) {
    http_response_code(401);
    exit;
}
```

> **Piège :** vérifier l'origine d'un webhook uniquement par son adresse IP source, ou pire, ne rien vérifier du tout en supposant que "l'URL est secrète donc personne d'autre ne la connaît". Une adresse IP se falsifie plus facilement qu'une signature HMAC, et une URL "secrète" finit presque toujours par apparaître dans un log, un historique de navigateur partagé ou une configuration exposée.
>
> **Bonne pratique :** vérifier systématiquement une signature HMAC sur tout webhook reçu, avec une comparaison à temps constant (`hash_equals()`, jamais `==`), le même réflexe que pour toute comparaison de secret.

## Le rejeu : une requête légitime capturée, renvoyée plus tard

Une signature valide garantit que la requête vient bien du service tiers et n'a pas été modifiée, mais ne garantit rien sur le MOMENT où elle est reçue. Un attaquant qui intercepte une requête webhook légitime (réseau non chiffré, log exposé, service tiers lui-même compromis) peut la renvoyer telle quelle plus tard : la signature reste valide, puisque le contenu n'a pas changé.

```text
1. Attaquant capture une requete webhook legitime deja envoyee et validee
   ("commande 42 payee", signature valide)
2. Des jours plus tard, l'attaquant renvoie EXACTEMENT la meme requete
3. La signature est toujours valide (meme corps, meme secret)
   -> si l'application ne verifie que la signature, elle retraite
      l'evenement "commande 42 payee" une seconde fois
```

| Défense contre le rejeu | Principe |
|---|---|
| Horodatage (*timestamp*) inclus dans la signature | Le service tiers inclut l'heure d'envoi dans les données signées ; l'application rejette toute requête dont l'horodatage dépasse une fenêtre de tolérance (ex. 5 minutes), rendant une requête rejouée plus tard automatiquement invalide |
| Identifiant à usage unique (*nonce*) | Le service tiers inclut un identifiant unique par événement ; l'application garde en mémoire les identifiants déjà traités (au moins le temps de la fenêtre de tolérance) et rejette tout doublon |

> **Bonne pratique :** combiner HMAC (authenticité) avec un horodatage vérifié et/ou un identifiant d'événement déjà traité (idempotence), plutôt que de ne compter que sur la signature seule.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un webhook inverse le sens habituel d'un appel d'API : le service tiers envoie une requête vers votre application, qui doit vérifier qu'elle en est bien l'origine. HMAC (signature par secret partagé) authentifie la requête ; un horodatage ou un identifiant d'événement empêche qu'une requête légitime capturée soit rejouée plus tard. |
| **Outils utilisables** | `hash_hmac()` + `hash_equals()` pour vérifier une signature ; un horodatage signé ou un identifiant d'événement stocké côté application pour empêcher le rejeu. |
| **Pièges à éviter** | Ne vérifier un webhook que par son adresse IP source ou par le secret de l'URL. Comparer une signature avec `==`/`===`. Ne vérifier que la signature, sans protection contre le rejeu d'une requête déjà traitée. |
| **Bonnes pratiques** | Vérifier systématiquement une signature HMAC à temps constant. Ajouter une fenêtre d'horodatage et/ou une déduplication par identifiant d'événement pour empêcher le rejeu. |
