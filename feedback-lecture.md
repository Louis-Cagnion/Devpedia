## guidelines a suivre pour ce fichier
- tu dois traiter ces points comme des todos, une fois un point corriger et valider, supprimes le pour garder ce qu'il reste a traiter uniquement
- tu as le droit de reformatter les messages de l'utilisateur pour que ce soit plus clair a suivre
- si un point semble avoir besoin d'un travail consequent, tu devra discuter avec l'utilisateur d'un plan detailler a suivre pour mener a bien la tache demandee
- tu as le droit de poser des questions a l'utilisateur si une demande te semble flou

## general
- Défilement des dernières lignes coupées par la barre du bas (`isElementFullyVisible` dans `js/reader.js`, corrigé le 2026-08-16) : logique corrigée mais jamais reproduite visuellement dans le cas exact (une clause qui retombe sur plusieurs lignes en écran étroit) faute d'un tel cas sous la main pour le déclencher. À valider visuellement.