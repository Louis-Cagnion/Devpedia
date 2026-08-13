# TODO — Devpedia

## Reste à faire

### Traduction anglaise (EN)
- 22 fichiers IA jamais traduits en EN : les 9 fichiers de `Vision et OCR` (8 chapitres + intro de subject), les 9 de `Voix IA` (idem), et 4 intros de subject restantes (`Applications LLM/applications-llm.md`, `Fondamentaux du deep learning/fondamentaux-du-deep-learning.md`, `NLP et LLM/nlp-llm.md`, `Production et gouvernance/production-et-gouvernance.md`).
- `IA/description.md` (EN) à adapter le jour où `content-en/IA` sera restructuré en subjects (actuellement plat, décision explicite, pas un oubli).
- Seules 2 des 20 catégories (`Langages de programmation`, `Git`) ont été vérifiées avec l'heuristique de comparaison de longueur FR/EN pour détecter d'autres brouillons obsolètes côté EN ; les 18 restantes n'ont pas été passées au crible.

### Traductions ES/PT à rattraper
- ES/PT n'ont que l'ancien sous-ensemble (avant la réécriture zéro-connaissance) : catégories manquantes à traduire à la main — Bases de l'informatique, Performance, Représentation des données, IA (en grande partie), Data Science, Qualité et architecture du code, Mathématiques, Infrastructure, UI-UX, Docker, Shells/Bash/PowerShell/Zsh.
- 6 langues manquantes en plus d'ES/PT : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Bug dans `scripts/translate-content.mjs` : le pipeline DeepL traduit parfois par erreur des morceaux d'URL à l'intérieur d'un lien Markdown, cassant la navigation sans erreur visible — à corriger (protéger la portion `(...)` d'un lien comme les spans `` `code` `` le sont déjà) avant de refaire tourner l'API sur ES/PT.
- L'UI de la sidebar ("Catégories", "Sur cette page", "Rechercher...") reste en français quelle que soit la langue choisie.
- À vérifier : comportement du sélecteur de langue sur une page qui n'existe pas encore dans la langue cible — doit afficher "cette page n'existe pas" dans la langue choisie, rediriger vers l'anglais si disponible, sinon vers le français.
- Supprimer le pipeline DeepL, devenu inutilisable (quota épuisé, abonnement probablement non renouvelable).
- Quand la catégorie IA sera traduite pour ES/PT, l'écrire directement en subjects (comme la structure FR actuelle), pas à plat.

### Lecture audio automatique du site
- Le mot français "déréférencement" (chapitre pointeurs en C) est mal prononcé par la voix : pas encore diagnostiqué (nécessite le retour de Louis en écoute directe pour identifier ce qui cloche).
- Revue exhaustive demandée par Louis : identifier systématiquement tous les cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Les phrases choisies pour les symboles de la table de prononciation (`js/reader.js`) n'ont pas été validées mot à mot par Louis, seulement l'architecture.
