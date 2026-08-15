# TODO — Devpedia

## Langues
- 6 langues manquantes en plus d'ES/EN/BR : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Convention BR : tout le contenu BR existant utilise exclusivement `## O que reter` comme en-tête de récapitulatif de fin de chapitre, jamais la variante emoji `## 📋 Resumo` utilisée (en minorité) en FR/ES/EN — à respecter pour tout futur chapitre BR.
- Avant de déclarer une nouvelle langue ou un nouveau chantier de traduction "terminé", toujours comparer les comptes de fichiers `.md` par catégorie/sujet entre langues (`find`), pas seulement la qualité de ce qui existe déjà côté cible.

## Lecture audio automatique du site
- CSS de surbrillance mot par mot synchronisé avec la synthèse vocale (demandé par Louis) : pas encore cadré techniquement (vérifier fiabilité/support de l'événement `boundary` de `SpeechSynthesisUtterance` avant de s'appuyer dessus).
- Correction de la voix BR (mapping `br` → `pt-BR`) à revérifier par Louis sur son téléphone.
- Prononciation du mot "déréférencement" (chapitre pointeurs C) à diagnostiquer, avec le retour de Louis en écoute directe.
- Revue exhaustive des cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Phrases de la table de prononciation des symboles (`js/reader.js`) à valider mot à mot par Louis.
