---
order: 19
---

# Tests et audit de sécurité

Un test fonctionnel classique vérifie qu'un programme fait ce qu'il est censé faire ; un test de sécurité vérifie, en plus, qu'il ne fait **rien d'autre** que ce qui est prévu, même face à une entrée délibérément malveillante. Plusieurs familles d'outils et de méthodes couvrent cet objectif, à des moments différents du cycle de développement.

## SAST : analyser le code sans l'exécuter

Le **SAST** (*Static Application Security Testing*) analyse le code source lui-même, sans le lancer, à la recherche de motifs connus comme dangereux : une requête [SQL](/?c=domain-specific-languages-dsl&p=sql) construite par concaténation plutôt que par requête préparée, un secret écrit en dur (voir [Gestion des secrets](/?c=cybersecurite&p=gestion-des-secrets)), une fonction de hachage inadaptée à un mot de passe (voir [Mots de passe et hachage sécurisé](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)).

```text
Code source  -->  Analyseur SAST  -->  Liste des motifs a risque detectes,
(jamais execute)                       avec fichier + ligne concernes
```

Comme il n'exécute jamais le code, un outil SAST s'intègre tôt et automatiquement, par exemple à chaque `git push` dans un [pipeline CI/CD](/?c=ci-cd&p=pipeline-cicd), avant même qu'un test fonctionnel ne tourne.

## DAST : attaquer l'application en fonctionnement

Le **DAST** (*Dynamic Application Security Testing*) fait l'inverse : il lance réellement l'application (typiquement une API ou un site web déployé sur un environnement de test) et lui envoie des requêtes conçues pour révéler une faille, exactement comme le ferait un attaquant, mais de façon automatisée et systématique.

| | SAST | DAST |
|---|---|---|
| Ce qu'il examine | Le code source | L'application en cours d'exécution |
| Moment typique | Tôt, à chaque changement de code | Sur un environnement déployé (test, pré-production) |
| Détecte | Des motifs de code à risque | Un comportement réellement exploitable, y compris des failles de configuration invisibles dans le code seul |
| Limite | Peut signaler un motif risqué qui n'est en réalité pas exploitable (faux positif) | Ne couvre que les chemins de l'application réellement sollicités pendant le test |

## Le fuzzing : bombarder un programme d'entrées inattendues

Le **fuzzing** consiste à envoyer à un programme un très grand nombre d'entrées aléatoires, malformées ou limites (chaînes extrêmement longues, caractères spéciaux, valeurs hors intervalle), dans l'espoir de provoquer un plantage, une exception non gérée, ou un comportement révélateur d'une faille :

```text
Programme cible : analyseur de fichiers CSV

Entrees testees automatiquement par le fuzzer :
  ""                          (vide)
  "a,b,c\n" * 1000000         (fichier enorme)
  "\x00\xFF\x00\xFF"          (octets non textuels)
  "a,\"b\nc\",d"               (guillemets et retour a la ligne imbriques)

-> Si l'une de ces entrees fait planter l'analyseur, le fuzzer isole
   l'entree exacte responsable, a corriger avant qu'un vrai fichier
   malveillant ne produise le meme effet en production.
```

Un plantage provoqué par une entrée non prévue est souvent le symptôme d'une faille plus large (dépassement de mémoire tampon, déni de service) qu'une simple relecture du code manquerait.

## Le pentest : une attaque simulée par un professionnel

Un **test d'intrusion** (*pentest*, *penetration testing*) consiste à mandater une personne ou une équipe pour attaquer réellement un système, avec les mêmes techniques qu'un vrai attaquant, mais dans un cadre légal et défini à l'avance :

| Élément du cadre | Rôle |
|---|---|
| Périmètre (*scope*) | Définit précisément ce qui peut être testé (quels systèmes, quelles techniques), pour ne jamais impacter un système hors périmètre |
| Règles d'engagement | Fixe les limites (horaires autorisés, techniques interdites comme le déni de service réel) |
| Rapport final | Liste les failles trouvées, leur gravité, et des recommandations de correction |

> **Piège :** confondre un pentest autorisé avec une intrusion réelle. Sans mandat écrit et périmètre défini au préalable, la même action est illégale, même avec de bonnes intentions.

### Le bug bounty : une variante ouverte et continue

Un **programme de bug bounty** invite n'importe quel chercheur en sécurité externe à signaler une faille trouvée sur un périmètre défini, en échange d'une récompense proportionnelle à sa gravité. Contrairement à un pentest ponctuel réalisé par une équipe mandatée, il reste ouvert en continu, ce qui multiplie le nombre et la diversité des personnes qui cherchent activement une faille.

## Où s'intègrent l'audit de dépendances et le suivi des CVE

L'audit des bibliothèques tierces (`npm audit`, `pip-audit`, déjà détaillé dans [Sécurité des dépendances](/?c=securite&s=cybersecurite&p=securite-des-dependances)) et la veille sur les identifiants [CVE](/?c=securite&s=cybersecurite&p=types-de-failles) complètent ces méthodes : SAST/DAST/fuzzing/pentest cherchent des failles **dans le code écrit par le projet**, l'audit de dépendances cherche des failles **déjà connues dans le code écrit par d'autres**, réutilisé par le projet.

## Journalisation et détection : savoir qu'une attaque a eu lieu

Toutes les méthodes vues plus haut cherchent des failles AVANT qu'elles ne soient exploitées. La **journalisation** (*logging*) et sa supervision couvrent le cas où une attaque a malgré tout lieu : sans trace exploitable, elle passe simplement inaperçue, parfois pendant des mois.

| Ce qu'un log d'audit minimal doit capturer | Exemple |
|---|---|
| QUI | Compte/IP à l'origine de l'action |
| QUOI | L'action précise effectuée (connexion, modification, suppression, export) |
| QUAND | Horodatage précis |
| RÉSULTAT | Succès ou échec, avec le motif d'échec le cas échéant |

Ce log d'audit se distingue d'un log de débogage classique (destiné à comprendre un bug technique) par son objectif : reconstituer après coup qui a fait quoi, sur des actions SENSIBLES précisément (connexion, changement de droits, suppression, export de données), pas l'intégralité du trafic.

> **Piège :** ne journaliser que ce qui aide à déboguer un problème technique, sans jamais capturer les actions sensibles au sens sécurité (qui a changé ce rôle, qui a exporté cette table) : une intrusion réussie mais jamais "cassée" techniquement (pas d'erreur, pas de crash) ne laisse alors aucune trace.
>
> **Bonne pratique :** journaliser systématiquement les actions sensibles avec qui/quoi/quand/résultat, et mettre en place une alerte sur un signal anormal simple (ex. des centaines de tentatives de connexion échouées sur un même compte) plutôt que de compter uniquement sur une relecture manuelle a posteriori.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | SAST analyse le code sans l'exécuter ; DAST attaque l'application en fonctionnement ; le fuzzing bombarde un programme d'entrées inattendues pour provoquer un plantage révélateur ; un pentest est une attaque simulée par un professionnel mandaté, dans un périmètre défini. La journalisation des actions sensibles (qui/quoi/quand/résultat) permet de détecter une attaque qui a malgré tout réussi. |
| **Outils utilisables** | Un analyseur SAST/DAST intégré au pipeline CI/CD, un fuzzer, un programme de bug bounty pour une surveillance continue, un système d'alerte sur log anormal. |
| **Pièges à éviter** | Confondre un pentest autorisé avec une intrusion réelle ; ne tester la sécurité qu'une seule fois, au lieu d'un contrôle continu à chaque changement ; ne journaliser que ce qui aide au débogage technique, sans les actions sensibles. |
| **Bonnes pratiques** | Intégrer SAST au pipeline CI/CD, dès le premier commit ; définir un périmètre et des règles d'engagement écrites avant tout pentest ; journaliser systématiquement qui/quoi/quand/résultat sur toute action sensible. |
