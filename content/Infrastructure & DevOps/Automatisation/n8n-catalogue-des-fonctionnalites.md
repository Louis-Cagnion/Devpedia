---
order: 3
---

# n8n : catalogue des fonctionnalités et types de nœuds

Le chapitre précédent a posé les briques génériques d'un nœud (déclencheur, action) et sa configuration. Ce chapitre détaille les grandes familles de nœuds spécifiques que propose n8n, au-delà d'un simple connecteur vers un service externe.

## Les déclencheurs : au-delà du webhook

Un **déclencheur** peut prendre plusieurs formes, pas seulement un événement externe :

| Type de déclencheur | Démarre le workflow quand... |
|---|---|
| **Webhook** | Une requête HTTP arrive sur une URL propre au workflow |
| **Planifié** (*Schedule*) | À intervalle régulier (toutes les heures) ou à une heure précise (tous les jours à 8h) |
| **Manuel** | Un humain clique sur "Test workflow" dans l'éditeur |
| **Sur un autre workflow** | Un autre workflow n8n l'appelle explicitement (voir plus bas) |

Un workflow n'a qu'un seul déclencheur actif à la fois (celui qui l'a réellement démarré) : plusieurs nœuds de type déclencheur peuvent cohabiter sur le même canvas, mais chacun démarre sa propre exécution indépendante.

## Les nœuds de code : sortir du no-code quand il le faut

Le **Code node** exécute directement du JavaScript ou du Python à l'intérieur du workflow, pour les traitements trop spécifiques pour un connecteur préconfiguré (une transformation de données complexe, un calcul, un filtrage sur mesure) :

```javascript
// Code node (JavaScript) : ne garde que les éléments dont le
// montant dépasse 100, et ajoute un champ calculé
return $input.all().filter(item => item.json.montant > 100).map(item => {
  item.json.montantTTC = item.json.montant * 1.2;
  return item;
});
```

> **Piège :** utiliser systématiquement le Code node par réflexe de développeur, même quand un nœud préconfiguré existant (filtre, édition de champs) ferait la même chose. Un workflow truffé de code perd l'avantage de lisibilité du no-code pour quelqu'un qui n'a pas écrit ce code.
>
> **Bonne pratique :** réserver le Code node aux traitements qu'aucun nœud préconfiguré ne couvre, et documenter brièvement (commentaire dans le code, ou nom explicite du nœud) ce qu'il fait pour la prochaine personne qui ouvrira le workflow.

## Les nœuds conditionnels : faire bifurquer le workflow

Déjà mentionnés au chapitre précédent, ces nœuds méritent un détail : le nœud **IF** évalue une condition et envoie les données sur l'une de deux branches (vrai / faux) ; le nœud **Switch** généralise le principe à plusieurs branches selon la valeur d'un champ.

```text
Nœud IF : condition = "montant > 1000"

  Entrée                    Sortie "vrai"         Sortie "faux"
  [montant: 1500]  ------>  [montant: 1500]
  [montant: 50]    --------------------------->    [montant: 50]
```

Chaque branche mène ensuite à sa propre suite d'actions (ex. une alerte spécifique pour les montants élevés), avant de potentiellement se rejoindre plus loin dans le workflow.

## L'error workflow : que faire quand une exécution échoue

Par défaut, un nœud en échec arrête l'exécution du workflow qui le contient, sans action supplémentaire automatique. Un **error workflow** est un workflow séparé, désigné dans les paramètres d'un workflow principal, qui se déclenche spécifiquement quand ce dernier échoue : il reçoit en entrée les détails de l'erreur (quel nœud, quel message) et peut alerter une équipe (Slack, e-mail) ou tenter une action de compensation.

> **Piège :** ne configurer aucun error workflow sur un workflow critique, en supposant qu'un échec sera remarqué autrement. Sans alerte explicite, un échec silencieux (ex. un webhook qui ne reçoit plus rien à cause d'une erreur en amont) peut passer inaperçu pendant longtemps.
>
> **Bonne pratique :** configurer un error workflow au minimum pour les workflows dont l'échec a un impact réel (perte de données, action métier non effectuée), avec une alerte qui atteint réellement une personne responsable.

## Appeler un workflow depuis un autre

Le nœud **"Execute Workflow"** appelle un autre workflow n8n comme une sous-fonction, en lui transmettant des données et en récupérant son résultat. Ce mécanisme permet de factoriser une logique commune à plusieurs workflows (ex. une étape de validation de données réutilisée partout) plutôt que de la dupliquer dans chacun.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un déclencheur peut être un webhook, une planification, un déclenchement manuel, ou l'appel depuis un autre workflow. Le Code node exécute du JS/Python pour les cas hors de portée des connecteurs. Les nœuds IF/Switch font bifurquer le workflow selon une condition. Un error workflow se déclenche spécifiquement en cas d'échec du workflow principal. |
| **Outils utilisables** | Le Code node (JavaScript/Python) ; les nœuds IF et Switch ; le paramètre "error workflow" ; le nœud "Execute Workflow" pour appeler un autre workflow. |
| **Pièges à éviter** | Utiliser le Code node par réflexe même quand un nœud préconfiguré suffirait. Ne configurer aucun error workflow sur un workflow critique. |
| **Bonnes pratiques** | Réserver le Code node aux cas non couverts par un nœud existant, en le documentant. Configurer un error workflow avec une alerte qui atteint réellement quelqu'un, sur tout workflow dont l'échec a un impact réel. |
