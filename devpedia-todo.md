# TODO — Devpedia

## Lecture audio automatique du site (priorité de la prochaine session)
- Détection "aucune voix disponible" (`hasUsableVoice()` dans `js/reader.js`, implémentée le 2026-08-16) : remplace les boutons du lecteur par un message explicatif plutôt que les laisser sembler buggés, sur n'importe quel navigateur sans voix utilisable (Brave sur Linux confirmé concerné, mais la détection réagit à l'état réel plutôt qu'à Brave spécifiquement). Testé en simulant `getVoices()` vide ; **à confirmer par Louis sur son vrai Brave**.
- Lecture des tableaux à revoir (demandé par Louis le 2026-08-15) : chaque cellule `th`/`td` est lue seule, sans lien avec sa colonne. Voulu : sauter la ligne d'en-tête, et pour chaque ligne de données dire "valeur, titre de colonne" (ex. tableau Bits/Combinaisons/Entiers, ligne `8 | 256 | 0 → 255` → "8 Bits, 256 Combinaisons, 0 à 255 Entiers non signé"). Touche `collectLeafSegments` dans `js/reader.js` (`TH`/`TD` sont des `LEAF_TAGS` lus indépendamment).
- Voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation de "déréférencement" (chapitre pointeurs C) à diagnostiquer en écoute directe avec Louis.
- Symboles rares en prose non traités (`↔`, `±`, `…`, `·` isolé) : laissés de côté faute de volume (1-2 occurrences chacun).
- `^` en prose comme exposant lu "accent circonflexe" au lieu de "puissance" (ex. `nombres-flottants.md`, "mantisse × 2^exposant") : à ajouter à `PROSE_SYMBOL_SPEECH` dans `js/reader-pronunciation.js`, même traitement que les exposants Unicode.
- Table de prononciation des symboles (`js/reader-pronunciation.js`) à valider mot à mot par Louis, chapitre par chapitre : reste tout hors C/C++/SQL/Git/PHP, déjà testés en écoute directe le 2026-08-15 (modulo/times/bitwise, XOR, emoji 📋, flèche →, ≈/≥/≠/°).

## Nouveau contenu
- Nouvelle catégorie "Cybersécurité" à la racine de `content/`, à créer au moment d'écrire ces chapitres (aucune catégorie de ce nom n'existe actuellement — juste du contenu sécurité localisé par techno comme `Langages de programmation/PHP/securite.md`, à ne pas dupliquer). Liste validée par Louis le 2026-08-16 :
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
