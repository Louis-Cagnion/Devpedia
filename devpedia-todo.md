# TODO — Devpedia

## Langues
- 6 langues manquantes en plus d'ES/EN/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Traduction de la catégorie `Authentification` (créée le 2026-08-15, 4 subjects/7 chapitres) et du chapitre `reduire-la-variance-des-reponses.md` (IA > NLP et LLM) — **terminée** dans les 4 langues (FR/ES/EN/BR) : contenu, `categoryLabels`/`subjectLabels` dans `ui-strings.json`, struct régénéré par langue, 0 lien cassé, comptes de fichiers alignés 12/12/12/12 (Authentification) et 8/8 (NLP et LLM FR/BR). Décalage d'`order` sur `agents.md`/`rag.md`/`prompt-injection.md` fait dans les 3 langues cibles (8→9/9→10/10→11).
  - Remarque de convention notée en cours de route (BR) : contrairement à FR/ES/EN qui mélangent l'en-tête de récap `## 📋 Résumé` (majoritaire) et une variante texte simple, **100% du contenu BR existant** utilise uniquement `## O que reter` (jamais la variante emoji) — à respecter pour tout futur chapitre BR.
- FR/ES/EN/BR sont désormais strictement alignées sur l'ensemble du contenu (vérifié le 2026-08-15) : 292 fichiers `.md` dans chaque langue, même répartition dossier par dossier, aucun lien interne cassé, `categoryLabels`/`subjectLabels` renseignés dans `ui-strings.json`. Avant de déclarer une nouvelle langue ou un nouveau chantier de traduction "terminé", toujours comparer les comptes de fichiers `.md` par catégorie/sujet entre langues (`find`), pas seulement la qualité de ce qui existe déjà côté cible.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Revue exhaustive des cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis.
