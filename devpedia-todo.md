# TODO — Devpedia

## Langues
- 6 langues manquantes en plus d'ES/EN/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Traduction de la catégorie `Authentification` (créée le 2026-08-15, 4 subjects/7 chapitres) et du chapitre `reduire-la-variance-des-reponses.md` (IA > NLP et LLM) — **en cours**, reprendre ici :
  - ES : **fait** (contenu + `categoryLabels`/`subjectLabels` dans `ui-strings.json`, struct régénéré, 0 lien cassé).
  - EN : **partiel**. Faits : `reduire-la-variance-des-reponses.md`, `Fondamentaux` (2/2), `Sessions et tokens` (2/2), `Délégation et fédération d'identité` > `oauth2-et-openid-connect.md`. Restant : `sso-et-gestion-didentite-entreprise.md`, le subject entier `Renforcer l'authentification` (fichier principal + `authentification-multifacteur.md`), puis `categoryLabels`/`subjectLabels` EN dans `ui-strings.json` (modèle : voir ce qui a été ajouté pour ES), régénérer `struct-en.json` et revalider les liens.
  - BR : **pas commencé**, ni le chapitre ni la catégorie.
  - Décalage d'`order` déjà fait sur `agents.md`/`rag.md`/`prompt-injection.md` (IA > NLP et LLM) pour ES et EN (8→9/9→10/10→11) ; à faire aussi pour BR en même temps que sa traduction.
- FR/ES sont strictement alignées sur le reste du contenu (2026-08-15) : mêmes fichiers par catégorie/sujet, aucun lien interne cassé, `categoryLabels`/`subjectLabels` renseignés dans `ui-strings.json`. EN et BR le seront aussi une fois le point ci-dessus terminé. Avant de déclarer une nouvelle langue ou un nouveau chantier de traduction "terminé", toujours comparer les comptes de fichiers `.md` par catégorie/sujet entre langues (`find`), pas seulement la qualité de ce qui existe déjà côté cible.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Revue exhaustive des cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis.
