---
order: 5
---

# Cryptographie appliquée pour développeurs

La cryptographie regroupe les techniques qui protègent une donnée contre la lecture ou la modification par quelqu'un qui ne devrait pas y avoir accès. Ce chapitre couvre le vocabulaire et les erreurs les plus fréquentes ; le hachage spécifique des mots de passe, déjà détaillé en profondeur, est traité dans [Mots de passe et hachage sécurisé](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage).

## Hachage contre chiffrement : une confusion fréquente

Ces deux notions transforment une donnée, mais dans des buts opposés :

| | Hachage | Chiffrement |
|---|---|---|
| Sens de l'opération | À sens unique : impossible de retrouver l'entrée | Réversible : la donnée d'origine se retrouve avec la bonne clé |
| Objectif | Vérifier qu'une donnée n'a pas changé, ou la comparer sans la stocker en clair | Rendre une donnée illisible sans la clé, tout en pouvant la relire plus tard |
| Exemple d'usage | Stocker un mot de passe, vérifier l'intégrité d'un fichier téléchargé | Protéger un fichier confidentiel, sécuriser une connexion réseau (TLS) |

> **Piège :** parler de "cryptage" ou penser qu'un mot de passe haché peut être "déchiffré" pour être récupéré. Un hash n'a pas de clé associée qui permettrait de revenir en arrière : c'est précisément ce qui le rend adapté aux mots de passe (voir [Mots de passe et hachage sécurisé](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)), et inadapté à toute donnée qu'il faudra un jour relire (auquel cas le chiffrement est le bon outil).

## Chiffrement symétrique et asymétrique

| | Symétrique | Asymétrique |
|---|---|---|
| Clé(s) | Une seule clé, utilisée pour chiffrer **et** déchiffrer | Une paire : une clé publique (chiffrer, ou vérifier une signature) et une clé privée (déchiffrer, ou signer) |
| Vitesse | Rapide | Beaucoup plus lente |
| Problème principal | Faire parvenir la clé secrète à l'autre partie, sans qu'elle soit interceptée | Aucun secret à transmettre : la clé publique peut circuler librement |
| Exemple d'algorithme | [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) | [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem), courbes elliptiques (ECC) |

```text
Symetrique                              Asymetrique

  Emetteur         Destinataire           Emetteur              Destinataire
  cle secrete K    cle secrete K          cle publique du       cle privee du
       |                 |                destinataire          destinataire
       v                 v                     |                     |
  chiffre avec K   dechiffre avec K             v                     v
                                          chiffre avec la        dechiffre avec
                                          cle publique           la cle privee
                                          (n'importe qui          (seul le
                                           peut chiffrer)          destinataire peut lire)
```

En pratique, les deux se combinent souvent : TLS (voir le panorama des attaques réseau dans [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite)) utilise l'asymétrique pour échanger une clé de session, puis bascule sur du symétrique (plus rapide) pour le reste de la connexion.

## La signature numérique : l'inverse du chiffrement asymétrique

Une **signature numérique** prouve qu'une donnée vient bien de l'émetteur attendu, et n'a pas été modifiée depuis : l'émetteur signe avec sa clé **privée**, et n'importe qui peut vérifier avec sa clé **publique** (l'inverse du chiffrement, où on chiffre avec la clé publique du destinataire). Le principe est le même que la signature d'un [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) : garantir l'intégrité, jamais la confidentialité à elle seule.

## HMAC : la signature symétrique par secret partagé

La signature vue plus haut est **asymétrique** : une clé privée signe, une clé publique vérifie. **HMAC** (*Hash-based Message Authentication Code*) signe autrement, de façon **symétrique** : un hachage combiné à une clé secrète, connue à la fois du signataire et du vérificateur.

| | Signature asymétrique | HMAC |
|---|---|---|
| Qui signe | Le détenteur de la clé privée | N'importe qui connaît le secret partagé |
| Qui vérifie | N'importe qui, avec la clé publique | Uniquement quelqu'un qui connaît le même secret |
| Clé publique séparée | Oui | Non : un seul secret, jamais transmis |

```php
<?php
$signature = hash_hmac('sha256', $donnees, $secret);
// $signature accompagne $donnees ; le vérificateur recalcule le HMAC avec le même $secret
// et compare le résultat à la signature reçue.
?>
```

Cas d'usage concret : un **token auto-suffisant**, sur le même principe qu'un [JWT](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens) (données + signature, aucun stockage serveur nécessaire pour vérifier), mais signé HMAC directement plutôt que via une bibliothèque JWT complète : un format plus artisanal, pour un besoin plus simple.

> **Piège :** comparer la signature reçue à la signature recalculée avec `==`/`===`. Comme pour tout secret comparé en PHP (voir [Sécuriser vos données](/?c=langages&s=php&p=securite)), ça expose à une attaque par timing.
>
> **Bonne pratique :** toujours comparer avec `hash_equals()`, jamais `==`/`===`, pour toute comparaison de signature ou de secret.

## Erreurs courantes à éviter

| Erreur | Pourquoi c'est dangereux | Bonne pratique |
|---|---|---|
| Implémenter son propre algorithme de chiffrement | Un algorithme maison n'a jamais subi l'analyse poussée des algorithmes standards, publiés et testés par toute la communauté cryptographique depuis des années | Toujours utiliser une bibliothèque cryptographique reconnue, jamais une implémentation artisanale |
| Générer une clé ou un sel avec un générateur aléatoire classique | Un générateur non cryptographique est prévisible (voir [Pseudo-aléatoire et générateurs](/?c=representation-des-donnees&p=aleatoire-et-generateurs)) | Toujours utiliser un CSPRNG pour tout ce qui doit rester secret |
| Réutiliser la même clé pour tout | Une clé compromise dans un contexte compromet alors tous les usages qui la partagent | Une clé dédiée par usage, avec une rotation régulière (voir [Gestion des secrets](/?c=cybersecurite&p=gestion-des-secrets)) |
| Stocker la clé de chiffrement à côté de la donnée chiffrée | Revient à laisser la clé de la maison sous le paillasson : quiconque accède aux données accède aussi à la clé | Stocker la clé séparément (voir [Gestion des secrets](/?c=cybersecurite&p=gestion-des-secrets)) |
| Utiliser un algorithme obsolète (DES, RC4) | Cassable avec des moyens de calcul modernes, parfois en quelques heures | Utiliser les standards actuels (AES, courbes elliptiques modernes) |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le hachage est à sens unique (vérifier/comparer) ; le chiffrement est réversible (protéger puis relire). Le chiffrement symétrique utilise une seule clé partagée ; l'asymétrique une paire clé publique/privée. Une signature numérique (asymétrique) ou HMAC (symétrique) garantit l'intégrité, pas la confidentialité. |
| **Outils utilisables** | AES (symétrique), RSA/ECC (asymétrique), HMAC (`hash_hmac()`) pour une signature symétrique, une bibliothèque cryptographique standard du langage utilisé plutôt qu'une implémentation maison. |
| **Pièges à éviter** | Confondre hachage et chiffrement ; implémenter son propre algorithme ; réutiliser une même clé partout ; utiliser un générateur aléatoire non cryptographique pour une clé ou un sel ; comparer une signature HMAC avec `==`/`===`. |
| **Bonnes pratiques** | Une clé dédiée par usage ; un CSPRNG pour tout secret ; des algorithmes standards, jamais artisanaux ; une clé stockée séparément des données qu'elle protège ; `hash_equals()` pour toute comparaison de signature ou de secret. |
