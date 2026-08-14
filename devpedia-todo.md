# TODO — Devpedia

## Traduction anglaise (EN)
- `IA/description.md` (EN) à adapter quand `content-en/IA` sera restructuré en subjects (actuellement plat, décision explicite).

## Tirets cadratins (`—`) hors FR
- `content-br/` : 472 occurrences dans 110 fichiers
- `content-es/` : 123 occurrences dans 56 fichiers
- À traiter une fois `content-br/`/`content-es/` à jour structurellement (voir ci-dessous), pour ne pas nettoyer des fichiers qui vont être réécrits.

## Traductions ES/BR à rattraper
- **75 fichiers BR encore manquants**, répartis sur 6 catégories entièrement absentes (PowerShell 14, Langages de programmation — sous-dossiers manquants 11, UI-UX 11, Performance 9, Docker 7, Qualité et architecture du code 7, Zsh 7) + rattrapages dans des catégories partielles (Bash 3, Git 3, DSL 1, Shells 1). Ordre de traitement : catégories manquantes par taille croissante.
- `Bash` existe en catégorie plate en BR/ES au lieu d'un sous-dossier de `Shells` (comme en FR) ; le Bash déjà traduit manque en plus `automatisation-cron.md` et `commandes-de-base.md`.
- 6 langues manquantes en plus d'ES/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Quand la catégorie IA sera traduite pour ES/BR, l'écrire directement en subjects (comme la structure FR actuelle), pas à plat.
- ES : audit structurel complet (comme celui fait pour BR) encore à faire.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Revue exhaustive des cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis.
