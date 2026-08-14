# Journal de bord — Devpedia

Suivi de progression du projet (pas destiné au public) : ce qui a été fait, comment, pourquoi. Le todo (`devpedia-todo.md`) ne garde que les points restants ; ce fichier garde la trace de ce qui est terminé.

## 2026-08-14 — Rattrapage `content-br/` (portugais brésilien)

- **Code langue renommé `pt` → `br`** : `content-pt/` → `content-br/`, `structure/languages.json`, `structure/struct-pt.json` → `struct-br.json`, `structure/ui-strings.json`, `scripts/variable-glossary.json`, `scripts/build-variable-glossary.mjs`. Routing du site entièrement piloté par `languages.json`, aucune référence en dur restante.
- **Vocabulaire des 125 fichiers existants corrigé** : remplacement du vocabulaire européen (`ficheiro`, `utilizador`, `ecrã`, `rato`, `predefinição`, `telemóvel`, `palavra-passe`, `morada`, `registo`, `contacto`, `aceder`, gérondif "estar a + infinitif") par du portugais brésilien réel (`arquivo`, `usuário`, `tela`, `mouse`, `padrão`, `celular`, `senha`, `endereço`, `registro`, `contato`, `acessar`, gérondif `-ndo`), accords de genre/prépositions corrigés à la main. Script réutilisable : `scripts/fix-br-vocabulary.mjs`.
- **Audit structurel `content-br/` vs `content/` (FR)** : 279 fichiers FR, 167 manquants au départ + 12 fichiers BR mal placés (chapitres IA/Data Science encore sous `Langages de programmation/Python/`, 2 noms en camelCase). Les 12 fichiers mal placés corrigés (réécrits depuis le FR actuel, pas simplement déplacés).
- **Catégories traduites intégralement cette session** : IA (38/38, 6 subjects), Traitement de documents (4/4), CI-CD (5/5), Organisation en entreprise (5/5). Ordre de traitement choisi par Louis : catégories manquantes par taille croissante, commit + push à la fin de chaque catégorie.
- **`content-br/acceuil.md` réécrit** : l'ancienne version était le texte pré-refonte, remis au niveau du FR actuel.
- **`HTMLElements.md`/`structuresDeLangagues.md` renommés en kebab-case** et remis au niveau du FR actuel. `scripts/generate-struct.js` : `validateInternalLinks` exportée pour vérifier les liens d'un `content-<lang>/` autre que FR (avertissements attendus tant que la traduction est incomplète : `resolveAcrossLanguages` gère ça au runtime, ce n'est pas une vraie casse).
- **Fichier orphelin repéré, pas supprimé** : `content-br/.translation-cache.json` (cache de l'ancien pipeline DeepL), lu par aucun script actuel. Décision laissée à Louis.

## 2026-08-14 — Bug de labels non traduits

`category.label`/`subject.label` (nom de dossier brut, français par construction, nécessaire au cross-language linking) n'était affiché nulle part traduit (hamburger, barre desktop, sidebar, fil d'Ariane, recherche, `<h1>` d'une page d'intro de subject). Ajout de `categoryLabels`/`subjectLabels` dans `structure/ui-strings.json` + `tEntityLabel(kind, id, fallback)` dans `js/i18n.js` (repli sur le nom de dossier si non traduit, jamais d'exception), câblé dans `js/sidebar.js`, `js/nav.js`, `js/router.js` (nouveau paramètre `titleOverride` de `generatePageContent`) et `js/search.js`. Testé en direct au navigateur (desktop + mobile).

## 2026-08-14 — Bug TTS : mauvaise voix sur contenu BR

`document.documentElement.lang` recevait le code interne brut `"br"`, pas une balise BCP-47 valide (`"br"` = breton en ISO 639-1) : `js/reader.js` ne trouvait donc aucune voix portugais-brésilien et retombait sur une voix arbitraire (signalé par Louis, voix FR jouée sur du contenu BR). Corrigé dans `js/lang.js` (`applyDocumentLanguage`) avec une table de correspondance code interne → BCP-47 (`br` → `pt-BR`).

## 2026-08-13 — Chantier OCR/vision + restructuration IA

- **8/8 chapitres OCR/vision écrits** (`ocr-classique-vs-deep-learning.md`, `detection-de-mise-en-page.md`, `modeles-document-ai.md`, `fine-tuning-modele-vision.md`, `evaluer-un-ocr.md`, `post-traitement-correction.md`, `ocr-en-production.md`, `gouvernance-documents-scannes.md`), sur demande explicite de Louis d'écrire tous les chapitres restants d'un coup (dérogation ponctuelle à la règle "un chapitre à la fois").
- **Catégorie IA restructurée en subjects** (était plate, 17 chapitres) : Fondamentaux du deep learning, NLP et LLM, Production et gouvernance, Applications LLM, Vision et OCR. 165 liens internes réécrits en conséquence. `content-en/IA/` reste plat (décision explicite, à rattraper).
- **Piège structurel documenté** (`scripts/generate-struct.js:151-166`) : une catégorie est soit 100% plate, soit 100% en subjects ; un fichier `.md` resté à plat une fois un sous-dossier créé est silencieusement ignoré.
- **Bug du validateur de liens corrigé** : un lien "racine de catégorie" (`?c=data-science`, sans `&p=`) n'était jamais vérifié ; `&p=` rendu optionnel dans `INTERNAL_LINK_PATTERN`.
- **Règle d'auteur ajoutée** (`prompt.md`, instruction 7bis) : tout outil/jargon/concept nommé doit avoir un lien, interne en priorité, externe stable à défaut.
- **Tri par `order`** (frontmatter) ajouté pour les subjects, au lieu de l'alphabétique par défaut : IA + rétroactivement Langages de programmation, Shells, Langages de balisage.

## 2026-08-12 — Réaudit zéro-connaissance + nouvelle catégorie Traitement de documents

- Réaudit zéro-connaissance sur l'ensemble du site (23/23 groupes) terminé, détail dans `audit-zero-connaissance.md`.
- Catégorie **Traitement de documents** créée (extraction PDF, OCR structuré, arbitrage local/cloud vision) + chapitres Python (dataclasses, argparse) + 1 chapitre DSL (parsing incrémental).
- Faille zéro-connaissance corrigée : GitHub présupposé sans être enseigné → série de 3 chapitres Git ajoutée.
- 2 bugs de rendu corrigés dans `js/parser.js` (spans `` `code` `` n'échappaient pas `<`/`>`/`&` ; état "blockquote ouvert" non réinitialisé à l'ouverture d'un bloc de code).
- Lecture audio du site (TTS) cadrée mais pas encore implémentée à cette date (implémentée le 2026-08-14, voir plus haut).

## Avant le 2026-08-12

Voir `audit-zero-connaissance.md` pour l'historique du plan de réécriture zéro-connaissance initial (19 tâches, terminé) et le bug camelCase (fichiers renommés en kebab-case le 2026-08-07).
