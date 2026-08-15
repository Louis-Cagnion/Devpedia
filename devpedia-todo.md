# TODO — Devpedia

## Langues
- 6 langues manquantes en plus d'ES/EN/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Emoji `📋` du titre "Récapitulatif", lu tel quel dans tous les chapitres : à vérifier à l'oreille par Louis avant de toucher au code (pas de bug confirmé pour l'instant, cf. journal de bord).
- Symboles typographiques rares en prose non traités (`↔`, `±`, `…`, `·` isolé) : laissés de côté le 2026-08-15 faute de volume suffisant pour justifier le travail (1-2 occurrences chacun), à reprendre si besoin.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis : opening tag PHP, heredoc `<<`/`EOF` Git, "to" sur les comparaisons, le bug `"$(...)"`/`"$((...))"` (Bash/Zsh/PowerShell/Git), les bugs `&`/`++`/compound bitwise (C/C++) et SQL, et les symboles de prose `→`/`≈`/`≥`/`≠`/`°` faits le 2026-08-15, reste le reste de la table.
