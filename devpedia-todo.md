# TODO — Devpedia

## Langues
- 6 langues manquantes en plus d'ES/EN/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Catégorie `Authentification` (créée le 2026-08-15, 4 subjects/7 chapitres) et le chapitre `reduire-la-variance-des-reponses.md` (IA > NLP et LLM) pas encore traduits en ES/EN/BR : à inclure dans un futur passage de traduction, sur le modèle de ce qui a été fait pour Performance/UI-UX.
- FR/ES/EN/BR sont strictement alignées sur le reste du contenu (2026-08-15) : mêmes fichiers par catégorie/sujet, aucun lien interne cassé, `categoryLabels`/`subjectLabels` renseignés dans `ui-strings.json` pour les 4. Avant de déclarer une nouvelle langue ou un nouveau chantier de traduction "terminé", toujours comparer les comptes de fichiers `.md` par catégorie/sujet entre langues (`find`), pas seulement la qualité de ce qui existe déjà côté cible.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Revue exhaustive des cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis.
