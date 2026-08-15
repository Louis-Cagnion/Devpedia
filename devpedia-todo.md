# TODO — Devpedia

## Langues
- 6 langues manquantes en plus d'ES/EN/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Lecture des tableaux à revoir (demandé par Louis le 2026-08-15, chantier notable donc reporté) : actuellement chaque cellule `th`/`td` est lue seule, sans lien avec sa colonne (la ligne d'en-tête est lue à part, avant les lignes de données). Comportement voulu : sauter la lecture de la ligne d'en-tête en tant que telle, et pour chaque ligne de données, dire chaque valeur suivie du titre de sa colonne, dans la langue d'affichage de la page. Exemple donné (tableau Bits/Combinaisons/Non signé/Signé, ligne `8 | 256 | 0 → 255 | −128 → 127`) : "8 Bits, 256 Combinaisons, 0 to 255 unsigned values, -128 to 127 signed values". Touche la structure de lecture des tableaux dans `js/reader.js` (actuellement `TH`/`TD` sont des `LEAF_TAGS` lus indépendamment, sans notion de ligne/colonne).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Symboles typographiques rares en prose non traités (`↔`, `±`, `…`, `·` isolé) : laissés de côté le 2026-08-15 faute de volume suffisant pour justifier le travail (1-2 occurrences chacun), à reprendre si besoin.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis, chapitre par chapitre : reste la majorité de la table hors C/C++/SQL/Git/PHP déjà testés en écoute directe le 2026-08-15 (modulo/times/bitwise, XOR, emoji 📋, fluidité du code trivial, flèche →, ≈/≥/≠/°).
