# TODO : Devpedia

> Prochaine tâche : balayage plus fin décrit au point 2 (compter aussi les blocs `> **Piège`/`> **Bonne pratique` par fichier, pas seulement les `##`, sur les 4 langues). Régénération audio complète seulement une fois tout ajouté.

> Restent : un test navigateur en attente de Louis pour continuer l'investigation (point 1), et le point 2 (balayage plus fin, pas encore fait). L'audio (FR et autres langues) sera régénéré en un seul passage une fois tous les chapitres ajoutés, pas point par point.

Convention de suivi : ce fichier ne demande plus de relecture, d'écoute ni de décision de régénération audio à Louis -- il s'en charge à son rythme et note lui-même son retour ici quand il le fait. Le fait/pourquoi/décisions déjà tranchées (progression, historique) va dans `journal-de-bord.md`, jamais ici : seuls les points restants, avec le contexte minimal pour les exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 1. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 2. Audit qualité de traduction : angle mort du comptage de sections
Le comptage de `##` par fichier (FR vs EN/ES/BR) est terminé sur tout le site, 0 écart restant. Mais un bloc `> **Piège :**`/`> **Bonne pratique :**` ne crée pas de nouveau `##` : une traduction peut en perdre plusieurs entiers sans que ce comptage le détecte (cas trouvé le 15/09/2026 sur 3 fichiers ES `IA/Fondamentaux du deep learning`/`IA/NLP et LLM` -- détail dans `journal-de-bord.md`).
- Reste à faire : balayage équivalent en comptant les blocs `> **Piège`/`> **Bonne pratique` par fichier (FR vs chaque langue), sur les 4 arborescences, pour vérifier qu'aucun autre fichier n'a ce type de perte silencieuse.

## 3. Notion manquante : `os.environ` (Python, variables d'environnement)
- Repéré dans le projet PDF_parser (`table_extraction.py`, revue `/review`) : aucun chapitre dédié dans `content/` (recherche `os.environ` sans résultat).
- Angle à couvrir : `os.environ` comme objet mapping (dict-like) donnant accès aux variables d'environnement du processus courant -- lecture (`os.environ["X"]`, `.get("X")` avec valeur de repli), écriture (`os.environ["X"] = valeur`), suppression (`.pop("X", None)` pour éviter un `KeyError` si la clé est déjà absente). Préciser qu'une modification n'affecte que le processus courant et ses enfants créés après coup (qui héritent d'une copie de l'environnement au moment de leur création), jamais le shell parent ni le système.
- Rubrique cible probable : `Langages/Python`.

## 4. Notion manquante : compréhension imbriquée (double `for`) pour aplatir une liste de listes
- Repéré dans le projet PDF_parser (`table_extraction.py`, revue `/review`) : `listes-et-tuples.md` couvre la compréhension simple (un seul `for`, avec filtrage optionnel) mais pas la variante à deux `for` du type `[x for sous_liste in liste_de_listes for x in sous_liste]`.
- Angle à couvrir : l'ordre des clauses `for` dans une compréhension imbriquée reproduit l'ordre de boucles `for` classiques imbriquées (la première clause est la boucle EXTÉRIEURE, la suivante l'intérieure) -- piège classique de croire que l'ordre est inversé. Cas d'usage typique : aplatir une liste de listes (équivalent à `itertools.chain.from_iterable`, à mentionner comme alternative plus lisible au-delà de 2 niveaux).
- Rubrique cible probable : `Langages/Python` (à la suite de `listes-et-tuples.md`).
