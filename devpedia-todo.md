# TODO — Devpedia

## Reste à faire

### Traduction anglaise (EN)
- 22 fichiers IA jamais traduits en EN : les 9 fichiers de `Vision et OCR` (8 chapitres + intro de subject), les 9 de `Voix IA` (idem), et 4 intros de subject restantes (`Applications LLM/applications-llm.md`, `Fondamentaux du deep learning/fondamentaux-du-deep-learning.md`, `NLP et LLM/nlp-llm.md`, `Production et gouvernance/production-et-gouvernance.md`).
- `IA/description.md` (EN) à adapter le jour où `content-en/IA` sera restructuré en subjects (actuellement plat, décision explicite, pas un oubli).

### Tirets cadratins (`—`) jamais nettoyés hors FR
Le sweep du 2026-08-10/11 ne portait que sur `content/` (FR) ; jamais sur les traductions. Recensé le 2026-08-13 (rien corrigé, juste l'état des lieux) :
- `content-en/` : 1172 occurrences dans 178 fichiers
- `content-pt/` : 472 occurrences dans 110 fichiers
- `content-es/` : 123 occurrences dans 56 fichiers

Chantier du même ordre de grandeur que le sweep FR original ; les fichiers déjà retouchés cette session (voir plus haut) sont déjà nettoyés, ce recensement porte sur le reste.

### Traductions ES/PT à rattraper
- 125 fichiers manquants **par langue** (ES et PT à l'identique), répartis sur 14 catégories entièrement absentes : Bases de l'informatique (7), Performance (9), Représentation des données (6), IA (39), Data Science (6), Qualité et architecture du code (7), Mathématiques (7), Infrastructure (5), UI-UX (11), Docker (7), Bases de données (7), CI-CD (5), Organisation en entreprise (5), Traitement de documents (4). Shells/Bash/PowerShell/Zsh également concernés (non quantifié précisément).
- Liens internes ES/PT vérifiés 2026-08-13 : 0 lien cassé sur ce qui existe déjà (le sous-ensemble ancien reste cohérent en interne).
- 6 langues manquantes en plus d'ES/PT : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Bug dans `scripts/translate-content.mjs` : le pipeline DeepL traduit parfois par erreur des morceaux d'URL à l'intérieur d'un lien Markdown, cassant la navigation sans erreur visible — à corriger (protéger la portion `(...)` d'un lien comme les spans `` `code` `` le sont déjà) avant de refaire tourner l'API sur ES/PT.
- À vérifier : comportement du sélecteur de langue sur une page qui n'existe pas encore dans la langue cible — doit afficher "cette page n'existe pas" dans la langue choisie, rediriger vers l'anglais si disponible, sinon vers le français.
- Supprimer le pipeline DeepL, devenu inutilisable (quota épuisé, abonnement probablement non renouvelable).
- Quand la catégorie IA sera traduite pour ES/PT, l'écrire directement en subjects (comme la structure FR actuelle), pas à plat.

### Lecture audio automatique du site
- Le mot français "déréférencement" (chapitre pointeurs en C) est mal prononcé par la voix : pas encore diagnostiqué (nécessite le retour de Louis en écoute directe pour identifier ce qui cloche).
- Revue exhaustive demandée par Louis : identifier systématiquement tous les cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Les phrases choisies pour les symboles de la table de prononciation (`js/reader.js`) n'ont pas été validées mot à mot par Louis, seulement l'architecture.
