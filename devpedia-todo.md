# TODO — Devpedia

## Lecture audio automatique du site (priorité de la prochaine session)
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Contrôles de lecture à étendre (demandé par Louis le 2026-08-15, à cadrer en même temps que la surbrillance ci-dessus puisque les deux dépendent du même événement `boundary` pour connaître la position mot par mot) :
  - Mémoriser le mot exact où la lecture s'est arrêtée (pas seulement le paragraphe, cf. `lastSpokenIndex`/`replayParagraph()` actuels dans `js/reader.js`), pour reprendre pile à cet endroit plutôt que de tout relire depuis le début du paragraphe.
  - Ajouter un bouton paragraphe suivant/précédent.
  - Louis laisse le choix de l'agencement UI/UX des boutons (desktop `createReaderControl()` sidebar + barre flottante mobile), avec les 4 déjà existants (lecture/arrêt, depuis le début, relire le paragraphe, continuer après un bloc de code) : à concevoir proprement plutôt qu'entassé.
- Lecture des tableaux à revoir (demandé par Louis le 2026-08-15, chantier notable donc reporté) : actuellement chaque cellule `th`/`td` est lue seule, sans lien avec sa colonne (la ligne d'en-tête est lue à part, avant les lignes de données). Comportement voulu : sauter la lecture de la ligne d'en-tête en tant que telle, et pour chaque ligne de données, dire chaque valeur suivie du titre de sa colonne, dans la langue d'affichage de la page. Exemple donné (tableau Bits/Combinaisons/Entiers non signé/Entiers signé, ligne `8 | 256 | 0 → 255 | −128 → 127`) : "8 Bits, 256 Combinaisons, 0 à 255 Entiers non signé, −128 à 127 Entiers Signé". Touche la structure de lecture des tableaux dans `js/reader.js` (actuellement `TH`/`TD` sont des `LEAF_TAGS` lus indépendamment, sans notion de ligne/colonne).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Symboles typographiques rares en prose non traités (`↔`, `±`, `…`, `·` isolé) : laissés de côté le 2026-08-15 faute de volume suffisant pour justifier le travail (1-2 occurrences chacun), à reprendre si besoin.
- `^` en prose comme notation d'exposant (caret normal, pas les caractères exposants Unicode déjà corrigés) lu "accent circonflexe" au lieu de "puissance" (repéré par Louis le 2026-08-16, exemple : `nombres-flottants.md`, "mantisse × 2^exposant") : à ajouter à `PROSE_SYMBOL_SPEECH` dans `js/reader.js`, même traitement que les exposants Unicode (mot "puissance"/"to the power of" localisé).
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis, chapitre par chapitre : reste la majorité de la table hors C/C++/SQL/Git/PHP déjà testés en écoute directe le 2026-08-15 (modulo/times/bitwise, XOR, emoji 📋, fluidité du code trivial, flèche →, ≈/≥/≠/°).

## Langues
- 6 langues manquantes en plus d'ES/EN/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
