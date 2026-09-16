---
order: 15
---

# Logique métier et contournements automatisés

Les chapitres précédents couvrent des failles TECHNIQUES (une donnée mal validée, un accès mal vérifié). Cette famille est différente : le code peut être irréprochable techniquement et rester exploitable, parce que la RÈGLE MÉTIER elle-même est incomplète ou mal placée. Aucun scanner automatique ne détecte ces failles : il faut connaître le métier de l'application pour savoir quoi tester.

## Mass assignment : accepter plus de champs que prévu

Un endpoint qui met à jour un objet en acceptant directement TOUS les champs reçus dans la requête (au lieu d'une liste explicite de champs autorisés) laisse le client envoyer un champ qu'il ne devrait jamais pouvoir modifier lui-même.

```php
// DANGEREUX : accepte tous les champs recus, y compris ceux qu'un formulaire legitime
// n'exposerait jamais
$utilisateur->update($_POST);
// Si le client ajoute discretement "role=admin" a sa requete de modification de profil,
// et que la table "utilisateurs" possede bien une colonne "role"...
// ce champ est mis a jour comme n'importe quel autre, sans distinction

// SUR : liste blanche explicite des champs modifiables par CE endpoint precis
$champs_autorises = ['nom', 'email', 'bio'];
$donnees = array_intersect_key($_POST, array_flip($champs_autorises));
$utilisateur->update($donnees);
```

> **Bonne pratique :** définir explicitement, pour chaque endpoint, la liste des champs qu'il a le droit de modifier, plutôt que de transmettre telle quelle toute donnée reçue à la mise à jour d'un objet.

## Salami slicing : accumuler de nombreux petits gains négligeables

Le nom vient des fines tranches de salami : une fraude qui prélève, à chaque opération, un montant individuellement si petit qu'aucun contrôle unitaire ne le remarque, mais qui devient significatif une fois répété à très grande échelle. Cas d'école : un arrondi de calcul (division, taux, conversion) systématiquement tronqué dans le même sens plutôt qu'arrondi correctement, dont le reliquat est redirigé vers un compte contrôlé par l'attaquant.

```text
1000000 transactions x 0,004 centime "perdu" a chaque arrondi = 4000 centimes = 40 euros
-> invisible transaction par transaction, significatif a l'echelle du volume traite
```

> **Piège :** tester une règle de calcul financier avec un seul montant de référence, qui ne révèle jamais une dérive qui n'apparaît qu'à grande échelle ou sur une distribution de valeurs variées.
>
> **Bonne pratique :** tester une logique d'arrondi/répartition sur un grand volume de valeurs variées en vérifiant la somme cumulée plutôt qu'un seul cas ; s'assurer qu'un reliquat d'arrondi est toujours comptabilisé quelque part de traçable, jamais silencieusement perdu ni redirigé sans trace.

## Énumération d'utilisateurs : un message d'erreur trop précis

Un formulaire de connexion (ou de réinitialisation de mot de passe) qui distingue "mot de passe incorrect" de "ce compte n'existe pas" révèle, sans donner l'accès, quels comptes existent réellement.

| Réponse | Ce qu'elle révèle |
|---|---|
| "Aucun compte associé à cet email" | Confirme que l'email n'est PAS enregistré (info utile à un attaquant sur les autres emails testés) |
| "Mot de passe incorrect" | Confirme que le compte EXISTE, restreint la suite de l'attaque à deviner le seul mot de passe |
| "Identifiants invalides" (même message dans les deux cas) | Ne révèle rien de plus qu'un couple email/mot de passe incorrect, sans préciser lequel |

Cette information, gratuite pour l'attaquant, économise une étape entière d'une attaque par force brute ou d'un phishing ciblé (savoir QUI a un compte avant même de tenter de s'y connecter).

> **Bonne pratique :** renvoyer un message d'erreur strictement identique, que l'email existe ou non, sur le formulaire de connexion ET sur celui de réinitialisation de mot de passe.

## Race condition / TOCTOU : exploiter le délai entre vérifier et agir

**TOCTOU** (*time-of-check to time-of-use*) nomme le délai, même très court, entre le moment où le code VÉRIFIE qu'une condition est vraie et le moment où il AGIT en conséquence. Si l'état peut changer pendant cette fenêtre, deux requêtes simultanées peuvent toutes les deux passer la vérification avant qu'aucune des deux n'ait encore agi.

```text
Code vulnerable (utilisation d'un coupon a usage unique) :

  Requete A                          Requete B
  ---------                          ---------
  1. Verifie : coupon "PROMO"
     est-il deja utilise ? NON
                                      2. Verifie : coupon "PROMO"
                                         est-il deja utilise ? NON
                                         (etat pas encore modifie par A)
  3. Marque "PROMO" comme utilise
     applique la reduction
                                      4. Marque "PROMO" comme utilise
                                         applique la reduction UNE 2e FOIS
```

Les deux requêtes, envoyées à quelques millisecondes d'écart (souvent automatisées exprès pour ça), passent toutes les deux la vérification AVANT qu'aucune n'ait eu le temps de marquer le coupon comme utilisé.

> **Bonne pratique :** rendre l'opération "vérifier puis agir" ATOMIQUE (une seule étape indivisible, garantie par la base de données elle-même — une contrainte d'unicité, une mise à jour conditionnelle en une seule requête) plutôt que deux étapes séparées dans le code applicatif, où une autre requête peut toujours s'intercaler entre les deux.

## Usurpation par homographe Unicode

Deux caractères peuvent s'afficher de façon identique ou quasi identique à l'écran tout en étant, pour l'ordinateur, des caractères totalement DIFFÉRENTS (des codes [Unicode](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) distincts). Un nom d'utilisateur ou un domaine choisi avec ces caractères trompe l'œil humain sans déclencher de conflit d'unicité côté base de données.

```text
"admin"  (caracteres latins standards)
"аdmin"  (le "а" est cyrillique, U+0430, visuellement identique au "a" latin U+0061)

-> Les deux textes SEMBLENT identiques a l'oeil, mais sont deux valeurs
   DIFFERENTES pour une comparaison de chaine classique : un attaquant peut
   creer "аdmin" a cote d'un vrai compte "admin" deja existant, sans conflit
```

> **Bonne pratique :** normaliser (voir les fonctions de normalisation Unicode standard, ex. NFKC) et/ou restreindre le jeu de caractères autorisé pour tout identifiant destiné à être comparé pour son unicité (nom d'utilisateur, sous-domaine), plutôt que d'accepter n'importe quel caractère Unicode.

## Contournement de filtre par encodage

Un filtre de validation qui décode ou normalise une donnée UNE SEULE FOIS avant de la vérifier peut être contourné par un encodage supplémentaire, révélé seulement lors d'un traitement ultérieur.

```text
Filtre qui bloque le caractere "/" (path traversal) :
  Entree recue directement :        ../secret          -> bloquee (contient "/")
  Entree double-encodee en URL :    %252e%252e%252f     -> decodee UNE fois donne
                                                            "%2e%2e%2f" (ne contient pas
                                                            encore de "/" litteral)
                                                         -> passe le filtre
                                     puis une couche ULTERIEURE (serveur web,
                                     framework) la decode une SECONDE fois
                                                         -> devient bien "../secret"
                                                            APRES le filtre
```

> **Bonne pratique :** décoder entièrement une donnée (jusqu'à stabilité, plus aucun changement à un nouveau décodage) AVANT de la valider, jamais valider un encodage intermédiaire en espérant qu'aucune couche ultérieure ne le décodera une nouvelle fois.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une faille de logique métier reste exploitable même avec un code techniquement propre : un endpoint qui accepte trop de champs (mass assignment), une dérive d'arrondi accumulée à grande échelle (salami slicing), un délai exploitable entre vérification et action (TOCTOU), un message d'erreur trop précis (énumération), un identifiant visuellement trompeur (homographe Unicode), ou un filtre appliqué avant un décodage supplémentaire. |
| **Outils utilisables** | Liste blanche explicite de champs modifiables par endpoint ; contrainte d'unicité ou mise à jour conditionnelle en base pour une opération atomique ; normalisation Unicode (NFKC) sur tout identifiant comparé pour son unicité. |
| **Pièges à éviter** | Transmettre toute donnée reçue telle quelle à la mise à jour d'un objet. Tester un calcul financier sur un seul cas plutôt qu'un grand volume. Séparer "vérifier" et "agir" en deux étapes non atomiques. Un message d'erreur qui distingue compte inexistant et mot de passe incorrect. Valider une donnée avant son décodage complet. |
| **Bonnes pratiques** | Liste blanche de champs par endpoint. Test de dérive cumulée sur un grand volume de valeurs. Rendre atomique toute opération "vérifier puis agir" sensible. Message d'erreur générique et identique en cas d'échec d'authentification. Normalisation/restriction du jeu de caractères pour un identifiant unique. Décodage complet avant validation, jamais l'inverse. |
