# TODO — Devpedia

## Lecture audio automatique du site (priorité de la prochaine session)
- Lecture des tableaux reconstruite le 2026-08-16 (`collectTableSegments` dans `js/reader-table.js`, testée en direct sur les 3 formes) : à confirmer par Louis à l'oreille sur un vrai site.
- Prononciation de "déréférencement" (chapitre pointeurs C) à diagnostiquer en écoute directe avec Louis.
- Symboles rares en prose non traités (`↔`, `±`, `…`, `·` isolé) : laissés de côté faute de volume (1-2 occurrences chacun).
- `^` en prose comme exposant lu "accent circonflexe" au lieu de "puissance" (ex. `nombres-flottants.md`, "mantisse × 2^exposant") : à ajouter à `PROSE_SYMBOL_SPEECH` dans `js/reader-pronunciation.js`, même traitement que les exposants Unicode.
- Table de prononciation des symboles (`js/reader-pronunciation.js`) à valider mot à mot par Louis, chapitre par chapitre : reste tout hors C/C++/SQL/Git/PHP, déjà testés en écoute directe le 2026-08-15 (modulo/times/bitwise, XOR, emoji 📋, flèche →, ≈/≥/≠/°).

## Langues
- 6 langues manquantes en plus d'ES/EN/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
