# TODO : Devpedia

> Prochaine tâche : reprendre l'audit qualité EN (point 2) là où il s'est arrêté -- prochain candidat identifié : les 3 fichiers `Qualité, performance et outils/Git/*.md` (architecture-interne, rebase, resoudre-conflits), `order` EN décalé de -3 par rapport au FR, à investiguer (sections manquantes probables, comme pour le lot déjà corrigé). Régénération audio complète seulement une fois tout ajouté.

> Restent : un test navigateur en attente de Louis pour continuer l'investigation (point 1), et le point 2 (audit EN, partiellement fait). L'audio (FR et autres langues) sera régénéré en un seul passage une fois tous les chapitres ajoutés, pas point par point.

Convention de suivi : ce fichier ne demande plus de relecture, d'écoute ni de décision de régénération audio à Louis -- il s'en charge à son rythme et note lui-même son retour ici quand il le fait. Le fait/pourquoi/décisions déjà tranchées (progression, historique) va dans `journal-de-bord.md`, jamais ici : seuls les points restants, avec le contexte minimal pour les exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 2. Audit qualité de la traduction EN (en cours)
- Vérifier `Qualité, performance et outils/Git/architecture-interne.md`/`rebase.md`/`resoudre-conflits.md` : `order` EN décalé de -3 par rapport au FR, probablement des sections manquantes (méthode : `journal-de-bord.md`, entrée du 15/09/2026).
- Balayage systématique du reste du site (FR vs EN, puis ES/BR) : comparer le nombre de sections `##` par fichier pour repérer d'autres cas, pas encore fait au-delà des chapitres déjà examinés.

## 3. Notion manquante : `os.environ` (Python, variables d'environnement)
- Repéré dans le projet PDF_parser (`table_extraction.py`, revue `/review`) : aucun chapitre dédié dans `content/` (recherche `os.environ` sans résultat).
- Angle à couvrir : `os.environ` comme objet mapping (dict-like) donnant accès aux variables d'environnement du processus courant -- lecture (`os.environ["X"]`, `.get("X")` avec valeur de repli), écriture (`os.environ["X"] = valeur`), suppression (`.pop("X", None)` pour éviter un `KeyError` si la clé est déjà absente). Préciser qu'une modification n'affecte que le processus courant et ses enfants créés après coup (qui héritent d'une copie de l'environnement au moment de leur création), jamais le shell parent ni le système.
- Rubrique cible probable : `Langages/Python`.
