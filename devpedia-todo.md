# TODO — Devpedia

## Nouveau contenu à écrire (FR)
- Une partie sur l'authentification, avec Okta comme exemple (demandé par Louis, catégorie/chapitre précis pas encore décidé).
- Techniques de réduction de la variance des réponses LLM (self-consistency, majority voting, ensembling...) : `content/IA/NLP et LLM/llm-en-production.md` couvre déjà le réglage de la température, mais aucune de ces techniques dédiées n'est abordée (catégorie/chapitre précis pas encore décidé).

## Traduction anglaise (EN)
- `IA/description.md` (EN) à adapter quand `content-en/IA` sera restructuré en subjects (actuellement plat, décision explicite).

## Tirets cadratins (`—`) hors FR
- `content-es/` : 123 occurrences dans 56 fichiers, à traiter une fois `content-es/` à jour structurellement.

## Traductions ES à rattraper
- Structure des dossiers `content-es/` alignée sur le FR (2026-08-14) : 14 catégories créées, IA + ses 6 subjects, Shells + Bash/PowerShell/Zsh, OCaml, chacun avec sa page d'intro traduite. Il reste à traduire tous les chapitres des catégories nouvellement créées (volumineux, pas commencé).
- Réécriture des chapitres ES **déjà existants** mais legacy (décidé le 2026-08-14, comme pour BR, sans agents) : audit initial sur 118 fichiers a trouvé 89 sans résumé final, 29 tronqués (jusqu'à 54% du FR actuel), 48 avec tirets cadratins.
  - Git : 11/11 faits, catégorie terminée.
  - CSS : 8/8 faits, catégorie terminée.
  - Pas commencé : HTML (7), Langages de programmation/C (17), C++ (11), JavaScript (11), PHP (13), Python (12), Shells/Bash (12), DSL (2).
  - Une fois la réécriture terminée : sweep dédié des tirets cadratins résiduels (comme pour BR), y compris sur des fichiers par ailleurs déjà corrects (ex: css.md, cpp.md, python.md).
- 3 chapitres Git entièrement absents en ES (contenu neuf, pas une correction) : github-et-plateformes.md, issues-et-projets-github.md, pull-requests-github.md.
- `ui-strings.json` n'a pas d'entrées `categoryLabels`/`subjectLabels` pour `es` (seul `br` les a) : tant que ce n'est pas ajouté, la sidebar/navbar/breadcrumb ES affichent les noms de dossiers bruts en français pour les catégories/subjects. À faire en même temps qu'un futur passage de traduction ES, sur le modèle de ce qui a été fait pour BR.
- 6 langues manquantes en plus d'ES : allemand, russe, chinois simplifié, arabe, indonésien, japonais.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Revue exhaustive des cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis.
