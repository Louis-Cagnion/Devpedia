# TODO — Devpedia

## Reste à faire

### Traduction anglaise (EN)
- `IA/description.md` (EN) à adapter le jour où `content-en/IA` sera restructuré en subjects (actuellement plat, décision explicite, pas un oubli).

### Tirets cadratins (`—`) jamais nettoyés hors FR
Le sweep du 2026-08-10/11 ne portait que sur `content/` (FR) ; jamais sur les traductions. `content-en/` est intégralement nettoyé (2026-08-14, 178 fichiers). Reste :
- `content-pt/` : 472 occurrences dans 110 fichiers
- `content-es/` : 123 occurrences dans 56 fichiers

### Traductions ES/PT à rattraper
- Vocabulaire `content-pt/` corrigé vers du vrai portugais brésilien (2026-08-14) : le contenu existant utilisait du vocabulaire européen (`ficheiro`, `utilizador`, `ecrã`, `rato`, `predefinição`, `telemóvel`, `palavra-passe`, `morada`, `registo`, `contacto`, `aceder`, gérondif "estar a + infinitif") malgré le label "Português (Brasil)". Remplacé par `arquivo`, `usuário`, `tela`, `mouse`, `padrão`, `celular`, `senha`, `endereço`, `registro`, `contato`, `acessar`, gérondif `-ndo` — accords de genre et prépositions corrigés en même temps (`endereço`/`tela` sont respectivement masculin/féminin, contrairement à `morada`/`ecrã`). `scripts/variable-glossary.json` corrigé pour que les futures traductions générées repartent sur le bon vocabulaire. Script réutilisable : `scripts/fix-pt-br-vocabulary.mjs`.
- 125 fichiers manquants **par langue** (ES et PT à l'identique), répartis sur 14 catégories entièrement absentes : Bases de l'informatique (7), Performance (9), Représentation des données (6), IA (39), Data Science (6), Qualité et architecture du code (7), Mathématiques (7), Infrastructure (5), UI-UX (11), Docker (7), Bases de données (7), CI-CD (5), Organisation en entreprise (5), Traitement de documents (4). Shells/Bash/PowerShell/Zsh également concernés (non quantifié précisément) : PT/ES ont encore `Bash` en catégorie plate au lieu d'un sous-dossier de `Shells` aligné avec PowerShell/Zsh, et il manque au moins `automatisation-cron.md`/`commandes-de-base.md` dans le Bash déjà traduit. Au moins un fichier existant (`jupyter-notebooks.md`) est classé dans une catégorie que le FR a depuis déplacée (`Langages de programmation/Python` → `Data Science`) : les autres traductions déjà existantes ne sont pas garanties d'être à jour sur leur classement.
- Liens internes ES/PT vérifiés 2026-08-13 : 0 lien cassé sur ce qui existe déjà (le sous-ensemble ancien reste cohérent en interne).
- 6 langues manquantes en plus d'ES/PT : allemand, russe, chinois simplifié, arabe, indonésien, japonais.
- Quand la catégorie IA sera traduite pour ES/PT, l'écrire directement en subjects (comme la structure FR actuelle), pas à plat.

### Lecture audio automatique du site
- Le mot français "déréférencement" (chapitre pointeurs en C) est mal prononcé par la voix : pas encore diagnostiqué (nécessite le retour de Louis en écoute directe pour identifier ce qui cloche).
- Revue exhaustive demandée par Louis : identifier systématiquement tous les cas limites restants de la voix IA, pas seulement ceux trouvés au fil de l'eau.
- Les phrases choisies pour les symboles de la table de prononciation (`js/reader.js`) n'ont pas été validées mot à mot par Louis, seulement l'architecture.
