---
order: 10
---

# Les injections au-delà du SQL

[Les grandes familles de failles](/?c=securite&s=cybersecurite&p=types-de-failles) présente l'injection comme *"une donnée non fiable interprétée comme une instruction plutôt que comme une simple valeur"*, avec l'injection [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) comme exemple de référence (protection détaillée dans [Sécuriser vos données](/?c=langages&s=php&p=securite)). Le même principe touche bien d'autres systèmes dès qu'ils reçoivent une donnée externe et la traitent, à tort, comme une partie de leur propre code ou de leurs propres instructions.

## Vue d'ensemble : le même piège, un système cible différent

| Variante | Système visé | Donnée piégée typique | Défense |
|---|---|---|---|
| Commande shell/OS | Le terminal du serveur | `; rm -rf /` ajouté à un nom de fichier | Ne jamais construire une commande par concaténation de texte (détail ci-dessous) |
| LDAP | Un [annuaire LDAP](https://ldap.com/basic-ldap-concepts/) (répertoire d'utilisateurs/machines d'une entreprise) | `*)(uid=*))(|(uid=*` dans un champ de recherche, qui élargit le filtre à tous les comptes | Requête paramétrée, comme pour SQL |
| XPath | Un moteur qui interroge un document [XML](https://developer.mozilla.org/fr/docs/Web/XML/XML_introduction) | `' or '1'='1` dans un identifiant, qui fait correspondre tous les nœuds du document | Requête paramétrée, échappement des caractères spéciaux XPath |
| Template côté serveur (SSTI) | Un moteur de rendu comme [Jinja2](https://jinja.palletsprojects.com/) ou [Twig](https://twig.symfony.com/) | `{{7*7}}` dans un champ affiché tel quel dans un template | Détail ci-dessous |
| En-tête HTTP (CRLF) | Le navigateur ou un serveur intermédiaire (proxy, cache) | Retour à la ligne (`\r\n`) injecté dans une valeur d'en-tête réponse | Rejeter/échapper tout retour à la ligne dans une valeur d'en-tête générée dynamiquement |
| Journal (*log forging*) | Le fichier de log lui-même, et quiconque le lit ensuite | Retour à la ligne injecté dans une donnée journalisée, qui fabrique une fausse ligne de log | Échapper les retours à la ligne avant d'écrire une donnée externe dans un log |

## Injection de commande shell/OS

Un programme qui construit une commande système en assemblant du texte, puis la transmet telle quelle au terminal, laisse l'utilisateur ajouter ses propres instructions dans ce texte :

```python
import subprocess

# DANGEREUX : shell=True execute la chaine telle quelle, comme si on la tapait au terminal
nom_fichier = "photo.jpg; rm -rf /"  # fourni par l'utilisateur
subprocess.run(f"convert {nom_fichier} sortie.png", shell=True)
# La commande reellement executee est DEUX commandes separees par ";" :
# convert photo.jpg sortie.png   ET   rm -rf /

# SUR : chaque argument reste une donnee separee, jamais interpretee comme du shell
subprocess.run(["convert", nom_fichier, "sortie.png"])
# nom_fichier entier (y compris le "; rm -rf /") est passe comme UN SEUL argument a convert,
# qui echouera proprement (fichier introuvable) plutot que d'executer quoi que ce soit
```

Le réflexe est le même qu'une requête SQL préparée : ne jamais laisser une donnée externe faire partie du texte de la commande elle-même, toujours la passer à côté, comme un argument distinct.

> **Angle moins évident :** un outil d'orchestration de workflow (n8n, Zapier, Airflow) propose souvent un nœud "Exécuter une commande", où la commande est construite dans la CONFIGURATION du workflow plutôt que dans le code du projet lui-même. Le même risque de concaténation s'y applique à l'identique, mais devient facile à manquer lors d'une revue de code classique qui n'examine que le dépôt applicatif, jamais la configuration de l'outil d'orchestration.

## SSTI : quand le moteur de rendu HTML devient un interpréteur

Un moteur de template transforme un texte contenant des espaces réservés (`{{ nom }}`) en page finale, en y insérant les vraies valeurs. Certains de ces moteurs acceptent aussi de vraies expressions de programmation dans ces espaces réservés (calculs, appels de fonction) : si une donnée utilisateur atterrit directement dans le template AVANT son rendu (au lieu d'être seulement une valeur insérée DANS un espace réservé), le moteur l'exécute comme du code.

```text
Template normal, valeur inseree dans un espace reserve prevu :
  "Bonjour {{ nom_utilisateur }}"  +  nom_utilisateur = "Louis"
  -> "Bonjour Louis"                                    (aucun risque)

Template vulnerable, donnee utilisateur inseree DANS la structure du template :
  template = "Bonjour " + nom_utilisateur                (deja un template, pas une valeur)
  si nom_utilisateur = "{{ 7*7 }}"
  -> le moteur rend "Bonjour 49" : l'expression a ete EXECUTEE, pas juste affichee
```

Un attaquant qui confirme ce comportement (`{{7*7}}` affiche `49`) peut ensuite tenter des expressions plus dangereuses propres au moteur utilisé (lecture de fichier, exécution de commande système), selon ce que son langage d'expression autorise.

## XXE : quand un document XML lit ce qu'il ne devrait pas

Un document XML peut déclarer ses propres raccourcis de texte, appelés **entités**, et une entité peut pointer vers une ressource EXTERNE (un fichier local, une URL) plutôt qu'un simple texte :

```xml
<?xml version="1.0"?>
<!DOCTYPE donnee [
  <!ENTITY fichier_secret SYSTEM "file:///etc/passwd">
]>
<donnee>&fichier_secret;</donnee>
```

Si le parseur XML résout cette entité (va réellement lire `/etc/passwd`) avant d'insérer le résultat dans le document traité, le contenu du fichier se retrouve exposé dans la réponse de l'application, alors que rien dans ce document ne ressemble à une "donnée" au sens classique : c'est une instruction cachée dans la syntaxe même du format.

| | |
|---|---|
| **Défense** | Désactiver la résolution des entités externes dans la configuration du parseur XML utilisé (la plupart des bibliothèques modernes le font par défaut, mais pas toutes selon la version) |

## Désérialisation non sûre : reconstruire un objet à partir de données non fiables

**Sérialiser** un objet, c'est le convertir en texte/binaire pour le stocker ou l'envoyer ; **désérialiser**, c'est l'opération inverse : reconstruire l'objet à partir de ce texte. Certains formats de sérialisation (le module [`pickle`](https://docs.python.org/3/library/pickle.html) de Python, `unserialize()` en PHP, ou un chargement YAML non restreint) permettent d'encoder bien plus qu'une simple valeur : jusqu'à des instructions à exécuter à la reconstruction.

```python
import pickle

# DANGEREUX : pickle.loads() peut executer du code arbitraire contenu dans la donnee,
# si celle-ci vient d'une source non fiable (upload, parametre, message recu)
objet = pickle.loads(donnee_recue_de_lexterieur)

# SUR : un format de serialisation qui ne represente QUE des valeurs (jamais du code)
import json
objet = json.loads(donnee_recue_de_lexterieur)
```

| | |
|---|---|
| **Défense** | Ne jamais désérialiser une donnée d'origine externe avec un format qui peut encoder du code (`pickle`, `unserialize` PHP, YAML avec un chargeur non restreint) ; préférer un format qui ne représente que des valeurs, comme JSON |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le principe de l'injection SQL se retrouve à l'identique dès qu'un système externe (shell, annuaire LDAP, document XML, moteur de template, format de sérialisation) reçoit une donnée et la traite à tort comme une instruction plutôt qu'une simple valeur. |
| **Outils utilisables** | `subprocess.run([...])` (liste d'arguments) plutôt que `shell=True` ; requêtes paramétrées pour LDAP/XPath ; `json` plutôt que `pickle`/`unserialize` pour échanger des données. |
| **Pièges à éviter** | Construire une commande/requête par concaténation de texte ; laisser une donnée utilisateur atteindre le texte d'un template avant son rendu ; désérialiser une donnée externe avec un format capable d'encoder du code ; laisser un parseur XML résoudre des entités externes. |
| **Bonnes pratiques** | Toujours séparer structure (code/requête/commande) et donnée, quel que soit le système visé ; désactiver la résolution d'entités externes XML ; choisir un format de sérialisation qui ne représente que des valeurs pour toute donnée non fiable. |
