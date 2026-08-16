# TODO — Devpedia

## Lecture audio automatique du site (priorité de la prochaine session)
- Lecture des tableaux reconstruite le 2026-08-16 (`collectTableSegments` dans `js/reader-table.js`, testée en direct sur les 3 formes) : à confirmer par Louis à l'oreille sur un vrai site.
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
