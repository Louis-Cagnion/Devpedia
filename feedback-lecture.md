## guidelines a suivre pour ce fichier
- tu dois traiter ces points comme des todos, une fois un point corriger et valider, tu peux le supprimer pour garder ce qu'il reste a traiter uniquement
- tu as le droit de reformatter les messages de l'utilisateur pour que ce soit plus clair a suivre
- si un point semble avoir besoin d'un travail consequent, tu devra discuter avec l'utilisateur d'un plan detailler a suivre pour mener a bien la tache demandee
- tu as le droit de poser des questions a l'utilisateur si une demande te semble flou

## nouvelles modifications
- Bouton bas de page fait le 2026-08-16 : "Paragraphe précédent/suivant" du bas de page dupliqué à la fin du contenu de chaque chapitre (`appendBottomChapterNav` dans `js/router.js`), testé en cliquant dessus. À confirmer visuellement.
- Live-server qui revient à l'accueil et navigation sans retour arrière possible : même cause racine (la navigation en JS ne met jamais à jour l'URL du navigateur, `history.pushState` n'est jamais appelé) — nécessite un plan détaillé avant de commencer, cf. discussion à suivre.

## general
- Prononciation des points de fichier corrigée le 2026-08-16 (`texte.txt`, `.py` → "pi") dans `js/reader-pronunciation.js`. À valider à l'oreille.
- Surlignage des tableaux et défilement des dernières lignes coupées par la barre du bas corrigés le 2026-08-16 (`css/base.css`, `js/reader.js`). À valider visuellement.

## acceuil
- Prononciation de "Devpédia" corrigée le 2026-08-16 (`js/reader-pronunciation.js`). À valider à l'oreille.
