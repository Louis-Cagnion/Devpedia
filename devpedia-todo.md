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
  - HTML : 8/8 faits, catégorie terminée.
  - DSL : 2/2 faits, catégorie terminée.
  - PHP : 14/14 faits, catégorie terminée. `exceptions.md` était un chapitre entièrement absent côté ES (contenu neuf, pas une réécriture) : créé. `structuresDeLangagues.md` (camelCase, id non conforme) renommé en `structures-de-langage.md` pour matcher l'id FR ; `struct-es.json` régénéré via `buildStruct`/`writeStruct` (`scripts/generate-struct.js`) plutôt qu'édité à la main.
  - JavaScript : 14/14 faits, catégorie terminée (fait avant ce chantier de suivi, todo pas mis à jour à l'époque).
  - C++ : 11/11 faits, catégorie terminée (fait avant ce chantier de suivi, todo pas mis à jour à l'époque).
  - C : 18/18 faits, catégorie terminée (fait avant ce chantier de suivi, todo pas mis à jour à l'époque).
  - Pas commencé, traités par ordre croissant de taille : Shells/Bash (13 fichiers), Python (15 fichiers propres au sujet, voir écart de structure ci-dessous).
  - Écart de structure repéré dans `content-es/Langages de programmation/Python/` : 10 fichiers qui n'y ont pas leur place (appartiennent en réalité à `Data Science/` ou `IA/Fondamentaux du deep learning/`/`IA/NLP et LLM/` côté FR) : `jupyter-notebooks.md`, `numpy.md`, `pandas.md`, `matplotlib.md`, `machine-learning-scikit-learn.md`, `architectures-cnn-rnn-transformers.md`, `deep-learning-pytorch.md`, `entrainement-descente-de-gradient.md`, `reseaux-de-neurones.md`, `nlp-et-llm.md`. Il manque aussi `cli-avec-argparse.md` et `dataclasses.md`, présents en FR mais absents en ES. À traiter avant ou pendant la réécriture de Python.
  - Une fois la réécriture terminée : sweep dédié des tirets cadratins résiduels (comme pour BR), y compris sur des fichiers par ailleurs déjà corrects (ex: css.md, cpp.md, python.md).
- 3 chapitres Git entièrement absents en ES (contenu neuf, pas une correction) : github-et-plateformes.md, issues-et-projets-github.md, pull-requests-github.md.
- `ui-strings.json` n'a pas d'entrées `categoryLabels`/`subjectLabels` pour `es` (seul `br` les a) : tant que ce n'est pas ajouté, la sidebar/navbar/breadcrumb ES affichent les noms de dossiers bruts en français pour les catégories/subjects. À faire en même temps qu'un futur passage de traduction ES, sur le modèle de ce qui a été fait pour BR.
- 6 langues manquantes en plus d'ES : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Bug de structure côté FR (pas ES) repéré en réécrivant PHP : `content/Langages de programmation/PHP/php.md` et `conditions.md` partagent tous les deux `order: 3` alors que `generate-struct.js` documente cet `order` comme censé être unique entre chapitres d'un même sujet ; les deux valeurs concurrentes rendent l'ordre de tri de ces deux chapitres non déterministe. Hors périmètre de la réécriture ES : à corriger côté FR séparément.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Revue exhaustive des cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis.
