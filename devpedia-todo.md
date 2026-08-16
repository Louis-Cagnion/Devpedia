# TODO — Devpedia

## Lecture audio automatique du site (priorité de la prochaine session)
- Symboles rares en prose non traités (`↔`, `±`, `…`, `·` isolé) : laissés de côté faute de volume (1-2 occurrences chacun).
- Table de prononciation des symboles (`js/reader-pronunciation.js`) à valider mot à mot par Louis, chapitre par chapitre : reste tout hors C/C++/SQL/Git/PHP, déjà testés en écoute directe le 2026-08-15 (modulo/times/bitwise, XOR, emoji 📋, flèche →, ≈/≥/≠/°).

## Langues
- 6 langues manquantes en plus d'ES/EN/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.

## Suite de l'audit best-practice du 2026-08-16
- Scinder `js/router.js` (684 lignes) : mélange déjà 5 responsabilités distinctes (résolution cross-langue, URL/historique, widgets DOM de navigation, rendu de page, points d'entrée). Découpage proposé : `router-language-fallback.js` (résolution cross-langue) + `nav-url.js` (URL/historique) + garder `router.js` pour le rendu de page ; les widgets DOM de navigation (breadcrumb, boutons chapitre) pourraient rejoindre `nav.js`. À valider avant de l'entreprendre.
- Scinder `css/base.css` (928 lignes, > seuil de 750) : mélange 4 responsabilités déjà bien délimitées par ses propres commentaires de section (navbar/recherche/langue, layout de contenu + tableaux/graphiques, sidebars, contrôle de lecture à voix haute). Découpage proposé : `navbar.css`, `content.css` (+ éventuellement `charts.css`), `sidebar.css`, `reader.css`.
- Décider du sort de `scripts/build-variable-glossary.mjs` et `scripts/fix-variable-glossary.mjs` : tous deux appellent l'API DeepL, dont l'abonnement a expiré (voir README) — inexécutables en l'état, sans raison de conservation documentée. À supprimer, ou à documenter explicitement comme filet de sécurité si un retour à DeepL est envisagé un jour.
- `js/router.js` `resolveAcrossLanguages()` : fallback linguistique `["en", ""]` codé en dur, pas dérivé de `structure/languages.json`. Avec les 6 langues prévues ci-dessus, cette liste devra être maintenue à la main à chaque ajout (ou le choix EN/FR comme langues de référence doit être documenté explicitement s'il est volontaire).
- `css/base.css` : 2 groupes de règles dupliquées à fusionner (`.categories > button`/`.categoriesMoreButton`/`.categoriesDropdownOption` ; `.searchResultButton`/`.langOption`).
- `js/reader-control.js:65` : commentaire "In-progress order requested by Louis on 2026-08-16" semble déjà obsolète (l'ordre des boutons ajoutés à la ligne suivante correspond déjà à celui décrit comme "en cours") — à vérifier avec Louis, pas un vrai bug.
