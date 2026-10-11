# TODO : Devpedia

> Prochaine tâche : point 2, rédiger le chapitre sur les modèles Claude et leurs niveaux d'effort (FR, puis EN, ES et BR). Point 1 : en attente de Louis (test navigateur).

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois, sans attente de validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés ; toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 2. Chapitre : choisir le modèle et le niveau d'effort de Claude
Louis veut un chapitre pour que les développeurs sachent quel modèle et quel effort demander à Claude selon la tâche. Emplacement proposé : `content/IA/Configuration de LLMs/` (catégorie IA existante, jamais une 12ᵉ catégorie de premier niveau). Rédiger en français, puis lancer les 3 agents de traduction EN, ES et BR (autorisation permanente de Louis pour un nouveau chapitre).
- Contenu à couvrir : les familles de modèles (Haiku, Sonnet, Opus) et quand choisir chacune ; les niveaux d'effort (low, medium, high, xhigh, max) et la tâche qui justifie chacun, avec un exemple concret par niveau ; le coût en tokens et le retour sur investissement (le max n'est justifié que pour un problème de frontière, après un échec constaté à xhigh) ; ce qu'un effort supérieur ne garantit pas (rendements décroissants, sur-réflexion) ; comment demander un niveau à Claude Code (modèle de session, agents, paramètre d'effort) ; erreurs fréquentes.
- Les identifiants de modèles, les niveaux d'effort pris en charge par chaque modèle (Haiku n'en gère aucun) et les tarifs évoluent : les vérifier au moment d'écrire, avec le skill `claude-api`, jamais de mémoire.
