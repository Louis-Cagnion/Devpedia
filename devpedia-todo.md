# TODO — Devpedia

## Lecture audio automatique du site (priorité de la prochaine session)
- Surbrillance à la lecture (implémentée le 2026-08-16 dans `js/reader.js`/`css/base.css` : `setHighlightedEntry()`/`.readerActiveParagraph` pour le paragraphe/segment en cours, `setActiveWord()`/`.readerActiveWord` pour le mot précis rapporté par l'événement `boundary`). Aucune détection de navigateur : `wordIndexAtChar()` utilise directement ce que `boundary` rapporte, donc le rendu se dégrade naturellement selon le moteur (mot par mot sur Chrome desktop, figé sur le premier mot sur Safari qui ne rapporte qu'une fois par phrase, jamais activé sur Chrome Android qui ne déclenche pas l'événement) sans code de branchement dédié. Testé en navigateur le 2026-08-16 : surbrillance de paragraphe validée visuellement (padding 4px, fin de ligne correcte y compris dernière ligne courte, aucune régression sur les liens/gras dans le texte) ; le mot par mot n'a pas pu être vérifié visuellement dans cet environnement de test précis, `boundary` n'y étant jamais déclenché (vérifié via un test direct) — à confirmer par Louis sur un vrai Chrome desktop.
- Contrôles de lecture à étendre (demandé par Louis le 2026-08-15, à cadrer en même temps que la surbrillance ci-dessus puisque les deux dépendent du même événement `boundary` pour connaître la position mot par mot) :
  - Mémoriser le mot exact où la lecture s'est arrêtée (pas seulement le paragraphe, cf. `lastSpokenIndex`/`replayParagraph()` actuels dans `js/reader.js`), pour reprendre pile à cet endroit plutôt que de tout relire depuis le début du paragraphe.
  - Ajouter un bouton paragraphe suivant/précédent.
  - Louis laisse le choix de l'agencement UI/UX des boutons (desktop `createReaderControl()` sidebar + barre flottante mobile), avec les 4 déjà existants (lecture/arrêt, depuis le début, relire le paragraphe, continuer après un bloc de code) : à concevoir proprement plutôt qu'entassé.
- Lecture des tableaux à revoir (demandé par Louis le 2026-08-15, chantier notable donc reporté) : actuellement chaque cellule `th`/`td` est lue seule, sans lien avec sa colonne (la ligne d'en-tête est lue à part, avant les lignes de données). Comportement voulu : sauter la lecture de la ligne d'en-tête en tant que telle, et pour chaque ligne de données, dire chaque valeur suivie du titre de sa colonne, dans la langue d'affichage de la page. Exemple donné (tableau Bits/Combinaisons/Entiers non signé/Entiers signé, ligne `8 | 256 | 0 → 255 | −128 → 127`) : "8 Bits, 256 Combinaisons, 0 à 255 Entiers non signé, −128 à 127 Entiers Signé". Touche la structure de lecture des tableaux dans `js/reader.js` (actuellement `TH`/`TD` sont des `LEAF_TAGS` lus indépendamment, sans notion de ligne/colonne).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Symboles typographiques rares en prose non traités (`↔`, `±`, `…`, `·` isolé) : laissés de côté le 2026-08-15 faute de volume suffisant pour justifier le travail (1-2 occurrences chacun), à reprendre si besoin.
- `^` en prose comme notation d'exposant (caret normal, pas les caractères exposants Unicode déjà corrigés) lu "accent circonflexe" au lieu de "puissance" (repéré par Louis le 2026-08-16, exemple : `nombres-flottants.md`, "mantisse × 2^exposant") : à ajouter à `PROSE_SYMBOL_SPEECH` dans `js/reader-pronunciation.js`, même traitement que les exposants Unicode (mot "puissance"/"to the power of" localisé).
- Phrases de la table de prononciation des symboles (`js/reader-pronunciation.js`, séparé de `js/reader.js` le 2026-08-16 — cf. Maintenabilité) à valider mot à mot par Louis, chapitre par chapitre : reste la majorité de la table hors C/C++/SQL/Git/PHP déjà testés en écoute directe le 2026-08-15 (modulo/times/bitwise, XOR, emoji 📋, fluidité du code trivial, flèche →, ≈/≥/≠/°).

## Nouveau contenu
- Nouvelle catégorie "Cybersécurité" à la racine de `content/` (demandé par Louis le 2026-08-16 ; à créer au moment d'écrire ces chapitres, pas avant — aucune catégorie de ce nom n'existe actuellement, seulement du contenu sécurité localisé par techno comme `Langages de programmation/PHP/securite.md` ou `Docker/bonnes-pratiques-et-securite.md`, à ne pas dupliquer). Liste de chapitres validée par Louis le 2026-08-16 :
  - Types de failles : zero day, injection, etc., ce qu'elles recouvrent en général, et comment éviter d'en laisser dans le code qu'on écrit.
  - Principes de développement sécurisé (secure by design, validation des entrées, moindre privilège, defense in depth).
  - Cryptographie appliquée pour développeurs (hachage vs chiffrement, erreurs courantes).
  - Gestion des secrets (clés API, coffres-forts/vaults, variables d'environnement).
  - Sécurité des dépendances/supply chain (audit de paquets, lockfiles, typosquatting).
  - Sécurité des API web (CORS, CSRF, rate limiting, tokens).
  - Tests et audit de sécurité (pentest, fuzzing, SAST/DAST).
  - Ingénierie sociale et phishing (volet humain, hors code).
  - OWASP Top 10 comme référentiel transversal.

## Langues
- 6 langues manquantes en plus d'ES/EN/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
