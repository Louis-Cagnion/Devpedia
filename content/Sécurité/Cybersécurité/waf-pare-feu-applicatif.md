---
order: 8
---

# Le WAF : filtrer le trafic avant qu'il n'atteigne l'application

Un **WAF** (*Web Application Firewall*, pare-feu applicatif) inspecte chaque requête HTTP avant qu'elle n'atteigne l'application, et bloque celles qui correspondent à un motif d'attaque connu (une tentative d'[injection SQL](/?c=cybersecurite&p=types-de-failles), un script XSS glissé dans un paramètre). Il n'inspecte pas le contenu réseau brut comme un pare-feu réseau classique, mais spécifiquement la structure d'une requête [HTTP](/?c=infrastructure&p=api-et-http) : méthode, en-têtes, corps, paramètres.

## Une couche de plus, pas un remplacement du code sécurisé

```text
Client -> [ WAF ] -> Application

Requete normale :        laissee passer
Requete avec injection :  bloquee avant meme d'atteindre l'application
```

Un WAF s'intercale entre le client et l'application, le plus souvent comme un reverse proxy dédié ou un module intégré au serveur web. Il filtre **avant** que la requête n'atteigne le code de l'application, ce qui le rend utile même contre une vulnérabilité pas encore corrigée dans ce code.

> **Piège :** considérer un WAF comme un substitut à un code applicatif sécurisé (voir [Principes de développement sécurisé](/?c=cybersecurite&p=principes-de-developpement-securise)). Un WAF filtre par **motif** : une variante d'attaque suffisamment différente de ses règles connues (encodage inhabituel, technique récente) peut passer au travers sans le déclencher, alors qu'une validation d'entrée correcte côté application bloquerait la faille elle-même, quelle que soit la forme de l'attaque.
>
> **Bonne pratique :** traiter le WAF comme une couche de défense supplémentaire (*defense in depth*), qui réduit la surface d'attaque exploitable en pratique, jamais comme la seule protection contre les failles listées dans l'[OWASP Top 10](/?c=cybersecurite&p=owasp-top-10).

## ModSecurity et les jeux de règles

**ModSecurity** est le WAF open source le plus répandu, déployable comme module de serveur web (Apache, Nginx) ou en reverse proxy autonome. Il n'embarque aucune règle par défaut : ses règles viennent le plus souvent du **Core Rule Set** (CRS) de l'OWASP, un ensemble de motifs déjà écrits et maintenus pour les familles de failles les plus courantes.

```text
# Regle simplifiee, esprit du CRS : bloquer un motif d'injection SQL classique
SecRule ARGS "@detectSQLi" \
    "id:942100,deny,status:403,msg:'Tentative d\'injection SQL detectee'"
```

| Élément de la règle | Rôle |
|---|---|
| `ARGS` | Cible : tous les paramètres de la requête (query string, corps de formulaire) |
| `@detectSQLi` | Opérateur : détection de motif d'injection SQL, fournie par le moteur du CRS |
| `deny,status:403` | Action : bloquer la requête avec un code `403 Forbidden` |

## Le compromis : faux positifs contre faux négatifs

Un jeu de règles trop strict bloque parfois des requêtes légitimes (un commentaire utilisateur qui contient, par coïncidence, une chaîne ressemblant à du code [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql)) ; un jeu trop permissif laisse passer des attaques réelles. La plupart des déploiements de WAF passent par un **mode d'apprentissage** (*detection only*, qui journalise sans bloquer) avant d'activer le blocage, pour ajuster les règles au trafic réel de l'application sans casser un usage légitime dès la mise en production.

> **Piège :** activer le blocage immédiatement en production, sans phase d'observation préalable. Une règle trop agressive peut bloquer une part du trafic légitime sans que personne ne le remarque avant que les utilisateurs concernés ne se plaignent.
>
> **Bonne pratique :** démarrer en mode journalisation seule, analyser les faux positifs sur un trafic réel, puis activer le blocage une fois les règles ajustées à l'application concernée.

## Ce que le WAF ne couvre pas

Le WAF filtre le trafic HTTP entrant ; il ne protège ni les secrets applicatifs (clé d'API, mot de passe de base de données — voir [Gestion des secrets](/?c=cybersecurite&p=gestion-des-secrets) pour ce volet, distinct du filtrage réseau), ni une dépendance vulnérable déjà installée (voir [Sécurité des dépendances](/?c=cybersecurite&p=securite-des-dependances)), ni une mauvaise configuration côté serveur. Chacune de ces couches de sécurité répond à une menace différente ; aucune ne remplace les autres.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un WAF inspecte chaque requête HTTP et bloque celles qui correspondent à un motif d'attaque connu, avant qu'elles n'atteignent l'application. ModSecurity, combiné au Core Rule Set de l'OWASP, est le déploiement open source le plus courant. C'est une couche de défense supplémentaire, pas un substitut au code applicatif sécurisé. |
| **Outils utilisables** | ModSecurity avec l'OWASP Core Rule Set, un mode journalisation seule pour ajuster les règles avant d'activer le blocage. |
| **Pièges à éviter** | Considérer un WAF comme suffisant à lui seul contre les failles applicatives. Activer le blocage en production sans phase d'observation préalable. |
| **Bonnes pratiques** | Traiter le WAF comme une couche de défense en profondeur, en complément d'un code sécurisé. Démarrer en mode détection seule avant d'activer le blocage. |
