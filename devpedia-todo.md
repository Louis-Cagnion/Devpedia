# TODO — Devpedia

## Traduction anglaise (EN)
- `IA/description.md` (EN) à adapter quand `content-en/IA` sera restructuré en subjects (actuellement plat, décision explicite).

## Tirets cadratins (`—`) hors FR
- `content-es/` : 123 occurrences dans 56 fichiers, à traiter une fois `content-es/` à jour structurellement.

## Reste français non traduit repéré dans content-br/
- `content-br/Langages de balisage/HTML/semantique-html5.md` : un bloc HTML d'exemple contient encore `<p>&copy; 2026 — Mentions légales</p>` en français au lieu du portugais.

## Traductions ES à rattraper
- `Bash` existe en catégorie plate en ES au lieu d'un sous-dossier de `Shells` (BR déjà corrigé).
- Audit structurel complet (comme celui fait pour BR) encore à faire pour ES.
- Quand la catégorie IA sera traduite pour ES, l'écrire directement en subjects (comme la structure FR actuelle), pas à plat.
- 6 langues manquantes en plus d'ES : allemand, russe, chinois simplifié, arabe, indonésien, japonais.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Revue exhaustive des cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis.
