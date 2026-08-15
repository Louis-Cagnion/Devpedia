# TODO — Devpedia

## Nouveau contenu à écrire (FR)
- Une partie sur l'authentification, avec Okta comme exemple (demandé par Louis, catégorie/chapitre précis pas encore décidé).
- Techniques de réduction de la variance des réponses LLM (self-consistency, majority voting, ensembling...) : `content/IA/NLP et LLM/llm-en-production.md` couvre déjà le réglage de la température, mais aucune de ces techniques dédiées n'est abordée (catégorie/chapitre précis pas encore décidé).

## Traduction anglaise (EN)
- `IA/description.md` (EN) à adapter quand `content-en/IA` sera restructuré en subjects (actuellement plat, décision explicite).

## Traductions ES à rattraper
- Structure des dossiers `content-es/` alignée sur le FR (2026-08-14) : 14 catégories créées, IA + ses 6 subjects, Shells + Bash/PowerShell/Zsh, OCaml, chacun avec sa page d'intro traduite. Il reste à traduire tous les chapitres des catégories nouvellement créées (volumineux, pas commencé).
- Réécriture des chapitres ES **déjà existants** mais legacy (décidé le 2026-08-14, comme pour BR, sans agents) : **chantier terminé**, les 10 catégories/sujets concernés (Git, CSS, HTML, DSL, PHP, JavaScript, C++, C, Shells/Bash, Python, ~118 fichiers) sont tous à jour. Diagnostic récurrent sur tout le chantier : résumés finaux manquants, code laissé en français, tirets cadratins/guillemets français, chapitres entièrement absents côté ES à créer (`exceptions.md` et `structures-de-langage.md` pour PHP, `commandes-de-base.md`/`automatisation-cron.md` pour Bash, `dataclasses.md`/`cli-avec-argparse.md` pour Python), plus quelques bugs de traduction plus sérieux à corriger au passage (`source` traduit littéralement en `fuente` dans du code Bash, confusions hash/chiffrement, `nom`→`número`) et un écart de structure (10 fichiers Data Science/IA mal placés dans Python, déplacés).
- Sweep des tirets cadratins (`—`) résiduels dans `content-es/` : **terminé** (123 occurrences dans 56 fichiers au départ, 0 restante). Fait uniquement sur les tirets eux-mêmes (remplacés par deux-points/point-virgule/parenthèses selon le contexte) dans les fichiers pas encore réécrits (ex : `Data Science/`, `IA/Fondamentaux du deep learning/`, `IA/NLP et LLM/`) : ces fichiers restent par ailleurs legacy (code encore en français par endroits) tant que la traduction des catégories/sujets nouvellement créées ci-dessous n'est pas faite.
- 3 chapitres Git entièrement absents en ES (contenu neuf, pas une correction) : **faits** (github-et-plateformes.md, issues-et-projets-github.md, pull-requests-github.md), catégorie Git ES désormais alignée 14/14 sur le FR.
- `ui-strings.json` n'a pas d'entrées `categoryLabels`/`subjectLabels` pour `es` (seul `br` les a) : tant que ce n'est pas ajouté, la sidebar/navbar/breadcrumb ES affichent les noms de dossiers bruts en français pour les catégories/subjects. À faire en même temps qu'un futur passage de traduction ES, sur le modèle de ce qui a été fait pour BR.
- 6 langues manquantes en plus d'ES : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Bugs de structure côté FR (pas ES) repérés en réécrivant ce chantier : plusieurs paires de chapitres partagent le même `order` au sein d'un même sujet, alors que `generate-struct.js` documente cet `order` comme censé être unique entre chapitres d'un même sujet (les valeurs concurrentes rendent leur ordre de tri non déterministe) : `content/Langages de programmation/PHP/php.md` et `conditions.md` (`order: 3`), `content/Shells/Bash/bash.md` et `commandes-de-base.md` (`order: 1`), `content/Langages de programmation/Python/listes-et-tuples.md` et `python.md` (`order: 4`). Hors périmètre de la réécriture ES : à corriger côté FR séparément.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Revue exhaustive des cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis.
