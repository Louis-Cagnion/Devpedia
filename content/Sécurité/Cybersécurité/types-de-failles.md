---
order: 1
---

# Les grandes familles de failles

Une **faille** (ou *vulnérabilité*) est un défaut dans un système (code, configuration, infrastructure) qui permet à quelqu'un de le faire agir autrement que prévu. Une **attaque** est la tentative d'exploiter cette faille ; un **exploit** est le code ou la méthode concrète utilisée pour le faire.

```text
Faille (le defaut) --exploite par--> Exploit (la methode) --produit--> Attaque reussie
```

## Qui attaque, et pourquoi

Toutes les attaques ne viennent pas du même type d'acteur, ni avec le même objectif :

| Acteur | Motivation | Niveau de moyens |
|---|---|---|
| *Script kiddie* | Curiosité, réputation, sans cible précise | Faible : outils tout faits, sans les comprendre en profondeur |
| Cybercriminel | Gain financier (rançon, revente de données) | Variable, souvent organisé |
| Hacktiviste | Message politique ou idéologique | Variable |
| Employé malveillant (menace interne) | Vengeance, gain personnel | Accès légitime déjà en place, souvent le plus dangereux |
| Acteur étatique / APT (*Advanced Persistent Threat*) | Espionnage, sabotage à long terme | Très élevé : discrétion et patience recherchées |

## Le zero-day : une faille inconnue de l'éditeur

Une faille suit en général un cycle de vie :

```text
Faille introduite --> Decouverte --> Signalee a l'editeur --> Corrigee (patch) --> Deployee chez les utilisateurs
                           |
                           v
              Si exploitee AVANT d'etre signalee/corrigee : c'est un "zero-day"
              (l'editeur a eu "zero jour" pour s'en proteger)
```

Un **zero-day** est donc une faille exploitée avant que l'éditeur du logiciel concerné n'en ait connaissance, et donc avant qu'un correctif (*patch*) n'existe. C'est la situation la plus dangereuse pour les utilisateurs : aucune mise à jour ne peut encore les protéger. Une fois la faille connue et corrigée, chaque système qui n'applique pas le correctif reste exposé, cette fois sans excuse : l'information est publique, souvent via un identifiant **CVE** (*Common Vulnerabilities and Exposures*), un catalogue public référençant les failles connues, consultable sur la [base CVE officielle](https://www.cve.org).

## Les grandes catégories de failles applicatives

| Catégorie | Ce qu'elle recouvre | Exemple concret |
|---|---|---|
| **Injection** | Une donnée non fiable est interprétée comme une instruction plutôt que comme une simple valeur | Injection [SQL](/?c=domain-specific-languages-dsl&p=sql), déjà détaillée avec sa protection dans [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite) |
| **Authentification défaillante** | Un mécanisme de connexion mal conçu permet d'usurper une identité | Mot de passe stocké en clair (voir [Mots de passe et hachage sécurisé](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)) |
| **Contrôle d'accès défaillant** | Un utilisateur accède à une ressource ou une action qui devrait lui être interdite | Modifier l'identifiant dans une URL (`/commande/42` → `/commande/43`) pour voir la commande d'un autre client, sans que le serveur ne revérifie les droits |
| **Mauvaise configuration de sécurité** | Un réglage par défaut, trop permissif ou oublié, ouvre un accès non voulu | Panneau d'administration accessible sans authentification, message d'erreur détaillé exposé en production |
| **Défaillance cryptographique** | Un secret ou une donnée sensible est mal protégé par le chiffrement/hachage utilisé (ou son absence) | Voir [Cryptographie appliquée](/?c=cybersecurite&p=cryptographie-appliquee) |
| **Composants vulnérables** | Une bibliothèque ou un outil tiers utilisé contient lui-même une faille connue | Voir [Sécurité des dépendances](/?c=cybersecurite&p=securite-des-dependances) |
| **Journalisation et supervision insuffisantes** | Une attaque en cours, ou déjà survenue, passe inaperçue faute de traces exploitables | Aucune alerte après des centaines de tentatives de connexion échouées sur un même compte |

Ce classement recoupe très largement l'[OWASP Top 10](/?c=cybersecurite&p=owasp-top-10), le référentiel standard de l'industrie détaillé en fin de catégorie.

## Comment éviter d'en laisser dans son propre code

Ces catégories partagent une racine commune : une donnée ou une situation considérée à tort comme fiable. Trois réflexes réduisent la plupart de ces risques, développés en détail dans [Principes de développement sécurisé](/?c=cybersecurite&p=principes-de-developpement-securise) :

```text
// Pseudocode -- le meme piege existe dans n'importe quel langage
requete = "SELECT * FROM users WHERE nom = '" + nomSaisiParUtilisateur + "'"
// Si nomSaisiParUtilisateur vaut :  x'; DROP TABLE users; --
// la requete executee n'est plus celle prevue par le developpeur

requetePreparee = "SELECT * FROM users WHERE nom = ?"
executer(requetePreparee, [nomSaisiParUtilisateur])
// La donnee reste une donnee, jamais interpretee comme une instruction
```

- Ne jamais faire confiance à une donnée venant de l'extérieur (utilisateur, API tierce, fichier importé) sans la valider.
- Appliquer le **principe de moindre privilège** : un composant ne doit avoir accès qu'à ce dont il a strictement besoin.
- Garder ses dépendances à jour, pour ne pas hériter d'une faille déjà corrigée ailleurs.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une faille est un défaut exploitable ; un zero-day est une faille exploitée avant d'être connue de l'éditeur. Les failles applicatives se regroupent en quelques grandes familles récurrentes (injection, authentification, contrôle d'accès, configuration, cryptographie, dépendances, journalisation). |
| **Outils utilisables** | La [base CVE](https://www.cve.org) pour suivre les failles publiques connues. |
| **Pièges à éviter** | Considérer une donnée externe comme fiable par défaut ; laisser une dépendance ou une configuration par défaut sans revue. |
| **Bonnes pratiques** | Valider systématiquement toute donnée externe ; appliquer le principe de moindre privilège ; maintenir ses dépendances à jour. |
