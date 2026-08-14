# Journal de bord — Devpedia

Suivi de progression du projet (pas destiné au public) : le pourquoi, les pièges, les décisions non évidentes. Le todo (`devpedia-todo.md`) garde les points restants ; `git log` garde le detail mecanique de ce qui a été fait (quels fichiers, quelle catégorie). Ce qui a été traité et commité ne doit pas apparaître ici comme une simple reformulation du commit : seul ce que Git seul ne montre pas mérite une entrée.

## Rattrapage `content-br/` (portugais brésilien)

- Le contenu existant utilisait du vocabulaire européen malgré le label "Português (Brasil)" (`ficheiro`, `utilizador`, `ecrã`... au lieu de `arquivo`, `usuário`, `tela`...), avec des accords de genre/préposition qui changent entre les deux variantes (`endereço`/`tela` masculin/féminin, contrairement à `morada`/`ecrã`). Script réutilisable : `scripts/fix-br-vocabulary.mjs`.
- Ordre de traitement des catégories manquantes choisi par Louis : taille croissante (nombre de fichiers), commit + push à la fin de chaque catégorie plutôt qu'en fin de session.
- `scripts/generate-struct.js` : `validateInternalLinks` exportée pour vérifier les liens d'un `content-<lang>/` autre que FR. Elle lève dès qu'un lien pointe vers une catégorie pas encore traduite dans cette langue : attendu tant que la traduction est incomplète (`resolveAcrossLanguages` gère ça au runtime), pas une vraie casse à corriger.
- Fichier orphelin repéré (`content-br/.translation-cache.json`, cache de l'ancien pipeline DeepL) : signalé à Louis avant suppression plutôt que supprimé unilatéralement (pas une décision à trancher seul).

## Bug de labels non traduits

`category.label`/`subject.label` viennent du nom de dossier brut (toujours en français par construction, nécessaire au cross-language linking) : rien ne les traduisait à l'affichage. Piège retenu : le `#` d'une page d'intro de subject doit rester littéralement le nom de dossier français dans le fichier pour que `generate-struct.js` la reconnaisse comme intro, indépendamment de ce que l'UI affiche désormais via `tEntityLabel()`.

## Bug TTS : mauvaise voix sur contenu BR

`document.documentElement.lang` recevait le code interne brut `"br"`, qui n'est pas une balise BCP-47 valide (`"br"` = breton en ISO 639-1) : le navigateur ne trouvait donc aucune voix portugais-brésilien. Corrigé par une table de correspondance code interne → BCP-47 (`br` → `pt-BR`) dans `js/lang.js`, sans changer le code interne du site.

## Chantier OCR/vision + restructuration IA (2026-08-13)

- Piège structurel retenu (`scripts/generate-struct.js:151-166`) : une catégorie est soit 100% plate, soit 100% en subjects ; un fichier `.md` resté à plat une fois un sous-dossier créé est silencieusement ignoré par le générateur, sans erreur.
- Bug du validateur de liens : un lien "racine de catégorie" (`?c=data-science`, sans `&p=`) n'était jamais vérifié avant que `&p=` soit rendu optionnel dans `INTERNAL_LINK_PATTERN`.

## Avant le 2026-08-13

Voir `audit-zero-connaissance.md` pour l'historique du plan de réécriture zéro-connaissance (terminé) et le bug camelCase (fichiers renommés en kebab-case le 2026-08-07).
