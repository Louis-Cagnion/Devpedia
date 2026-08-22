---
order: 11
---

# L'OWASP Top 10 : le référentiel standard de l'industrie

L'**[OWASP](https://owasp.org)** (*Open Worldwide Application Security Project*) est une organisation à but non lucratif dédiée à la sécurité des applications web, connue avant tout pour son **Top 10** : un classement, mis à jour tous les quelques années, des dix catégories de failles les plus critiques observées dans les applications réelles. Ce chapitre reprend ce classement (édition 2021, la plus récente à ce jour) comme synthèse de toute la catégorie [Cybersécurité](/?c=cybersecurite), chaque ligne renvoyant vers le chapitre qui la détaille déjà.

## Le classement

| # | Catégorie | Ce que ça recouvre | Approfondi dans |
|---|---|---|---|
| A01 | Contrôle d'accès défaillant | Un utilisateur accède à une ressource ou une action qui devrait lui être interdite | [Les grandes familles de failles](/?c=cybersecurite&p=types-de-failles) |
| A02 | Défaillances cryptographiques | Un secret ou une donnée sensible mal protégé par le chiffrement/hachage, ou son absence | [Cryptographie appliquée](/?c=cybersecurite&p=cryptographie-appliquee) |
| A03 | Injection | Une donnée non fiable interprétée comme une instruction | [Les grandes familles de failles](/?c=cybersecurite&p=types-de-failles), [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite) |
| A04 | Conception non sécurisée (*insecure design*) | La sécurité pensée après coup plutôt que dès la conception d'une fonctionnalité | [Principes de développement sécurisé](/?c=cybersecurite&p=principes-de-developpement-securise) |
| A05 | Mauvaise configuration de sécurité | Un réglage par défaut, trop permissif ou oublié, ouvre un accès non voulu | [Les grandes familles de failles](/?c=cybersecurite&p=types-de-failles) |
| A06 | Composants vulnérables et obsolètes | Une bibliothèque ou un outil tiers utilisé contient une faille connue | [Sécurité des dépendances](/?c=cybersecurite&p=securite-des-dependances) |
| A07 | Défaillances d'identification et d'authentification | Un mécanisme de connexion mal conçu permet d'usurper une identité | Catégorie [Authentification](/?c=authentification) |
| A08 | Défaillances d'intégrité logicielle et des données | Une donnée ou un composant modifié sans que rien ne le détecte (signature absente ou non vérifiée, dépendance compromise) | [Cryptographie appliquée](/?c=cybersecurite&p=cryptographie-appliquee) (signature), [Sécurité des dépendances](/?c=cybersecurite&p=securite-des-dependances) |
| A09 | Défaillances de journalisation et de supervision | Une attaque en cours, ou déjà survenue, passe inaperçue faute de traces exploitables | [Les grandes familles de failles](/?c=cybersecurite&p=types-de-failles), [Tests et audit de sécurité](/?c=cybersecurite&p=tests-et-audit-de-securite) |
| A10 | SSRF (*Server-Side Request Forgery*) | Un serveur forcé à effectuer, pour le compte d'un attaquant, une requête vers une destination qu'il ne devrait pas atteindre | [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite) |

## Pourquoi un classement plutôt qu'une simple liste

L'ordre n'est pas arbitraire : il reflète la fréquence et la gravité observées sur un grand nombre d'applications réelles auditées, pas un jugement théorique. Une catégorie qui remonte d'une édition à l'autre (le contrôle d'accès défaillant, par exemple, en tête depuis 2021) signale un problème qui reste difficile à éliminer dans la pratique, malgré des protections déjà bien documentées.

```text
OWASP Top 10                    Chapitres de cette categorie
(le "quoi" standardise)         (le "comment" concret)

     A01-A10        <-------->   types-de-failles, principes-de-
                                  developpement-securise, gestion-
                                  des-secrets, cryptographie-
                                  appliquee, securite-des-
                                  dependances, securite-api-web,
                                  tests-et-audit-de-securite,
                                  ingenierie-sociale-et-phishing
```

Le Top 10 donne le vocabulaire et les priorités communément admis dans l'industrie ; les autres chapitres de cette catégorie donnent les moyens concrets d'agir sur chacune de ces priorités.

## Utiliser le Top 10 en pratique

- Comme **checklist de revue de code** : vérifier qu'aucune des dix catégories n'est ignorée avant une mise en production.
- Comme **vocabulaire commun** entre développeurs, testeurs de sécurité et auditeurs externes, pour désigner un même type de faille sans ambiguïté.
- Comme **repère de priorisation** : à ressources limitées, traiter d'abord les catégories les plus hautes du classement, statistiquement les plus fréquentes.

> **Piège :** traiter le Top 10 comme une liste exhaustive de tout ce qu'il faut vérifier. C'est un classement des dix catégories **les plus fréquentes**, pas la totalité des failles possibles : une revue de sécurité qui s'arrête strictement à ces dix points laisse volontairement de côté tout le reste.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'OWASP Top 10 classe les dix catégories de failles les plus fréquentes et graves observées dans les applications réelles, mis à jour périodiquement. Il sert de référentiel transversal reliant tous les chapitres de la catégorie Cybersécurité. |
| **Outils utilisables** | Le Top 10 comme checklist de revue avant mise en production, et comme vocabulaire commun entre équipes. |
| **Pièges à éviter** | Considérer le Top 10 comme une liste exhaustive plutôt qu'un classement des catégories les plus fréquentes. |
| **Bonnes pratiques** | Utiliser le classement pour prioriser l'effort de sécurité à ressources limitées, sans jamais y limiter la revue de sécurité dans son ensemble. |
