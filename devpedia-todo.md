# TODO — Devpedia

## Lecture audio automatique du site (priorité de la prochaine session)
- Piste non implémentée, sans lien avec le code du site : Brave sur Linux ne renvoie aucune voix (`speechSynthesis.getVoices()` vide, protection anti-fingerprinting), donc toute la lecture audio y est inutilisable — limitation de Brave, pas un bug Devpedia. On pourrait détecter `getVoices().length === 0` pour masquer/adapter le bouton de lecture plutôt que de laisser un bouton qui semble buggé sur ce genre de navigateur.
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
