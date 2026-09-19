# TODO : Devpedia

> Prochaine tâche : point 5 -- `content/` FR terminé, passer à `content-en`/`content-es`/`content-br` (chiffrer d'abord avec le compteur Python correct, cf. point 5 : le premier chiffrage `awk` comptait des octets, pas des caractères). Point 4 (BR, accents) pas encore commencé, même découpage par chapitre.

> Restent : un test navigateur en attente de Louis (point 3). 17 chapitres en échec espeak-ng à investiguer par Louis (point 1). Double mécanisme de résumé dans 8 chapitres à trancher avec Louis (point 2).

## 1. Régénération audio complète : terminée (lots 1 à 6 + 8 chapitres Kubernetes/worktree/distillation/CUDA)
Nécessite `ffmpeg` sur le PATH : `export PATH="/c/Users/lcagnion/tools/ffmpeg-9.0.1-essentials_build/bin:$PATH"` avant chaque commande (cf. `journal-de-bord.md` pour l'installation).
- **17 chapitres en échec espeak-ng (`UnicodeEncodeError: ... surrogates not allowed`), à investiguer par Louis, détail dans `journal-de-bord.md`** : `fr/editeur-de-code-et-ide`, `fr/complexite-et-notation-big-o`, `en/code-programmes-et-fichiers`, `en/editeur-de-code-et-ide`, `en/arborescence-et-chemins`, `en/le-bug`, `en/complexite-et-notation-big-o`, `es/editeur-de-code-et-ide`, `es/complexite-et-notation-big-o`, `es/le-logarithme`, `es/wavefront-obj-et-modele-de-phong`, `br/editeur-de-code-et-ide`, `br/complexite-et-notation-big-o`, `en/architecture-interne`, `en/jupyter-notebooks`, `en/machine-learning-scikit-learn`, `es/k-plus-proches-voisins`. `editeur-de-code-et-ide` et `complexite-et-notation-big-o` échouent dans les 4 langues (pointe vers un caractère du contenu source partagé entre traductions), les 15 autres restent plus proches d'un flaky d'environnement. Retenter individuellement une fois la cause identifiée : `node scripts/generate-audio.mjs <chemin-audio> --lang=<code>`.

Convention de suivi : ce fichier ne demande plus de relecture, d'écoute ni de décision de régénération audio à Louis -- il s'en charge à son rythme et note lui-même son retour ici quand il le fait. Le fait/pourquoi/décisions déjà tranchées (progression, historique) va dans `journal-de-bord.md`, jamais ici : seuls les points restants, avec le contexte minimal pour les exécuter sans revenir en arrière.

**Règle générale pour tout contenu rédigé à partir de cette todo** : suivre le plan zéro-connaissance défini dans `plan-zero-connaissance.md` (niveau débutant absolu, aucun jargon/outil/plateforme nommé sans définition ni lien, tableaux/schémas/blocs de code privilégiés au texte narratif, un chapitre à la fois avec validation, ordre logique des sous-sections). Non répété tâche par tâche ci-dessous ; conformité trackée dans `audit-zero-connaissance.md`.

## 2. 8 chapitres avec un double mécanisme de résumé (`## Résumé` + `## 📋 Récapitulatif`)
Repéré en lisant `nombres-flottants.md` (item #14) : ce chapitre a un ancien `## Résumé` (table "À retenir/Pourquoi") juste avant le `## 📋 Récapitulatif` standard, deux mécanismes qui se recoupent largement (cf. critère Simplicité de `/best-practice`). Même motif dans 7 autres fichiers : `Langages/PHP/securite.md`, `Langages/JavaScript/nombres.md`, `Langages/C++/gestion-memoire-raii.md`, `Données/Représentation des données/organisation-en-memoire.md`, `entiers-et-debordements.md`, `encodage-des-textes.md`, `aleatoire-et-generateurs.md`. À trancher avec Louis : fusionner en gardant `## 📋 Récapitulatif` seul, ou une autre unification ; changement d'ampleur, pas à faire sans confirmation.

## 3. Fond étoilé des pages chapitre invisible sur mobile (iOS 16.7.16)
Reste gris uni sur iPhone (Safari), y compris en navigation privée, alors qu'il s'affiche normalement sur desktop (`css/content.css`, `.page::before`). Deux hypothèses déjà invalidées par le retest de Louis (détail dans `journal-de-bord.md`) : `@supports` autour de `color-mix()`, puis son remplacement complet par `rgba()` + triplets RGB précalculés -- toujours gris dans les deux cas. Plus aucune fonction CSS exotique ne subsiste dans `.page::before` (uniquement `var()`, `rgba()`, `radial-gradient()`, `inset: 0`).
- Reste à Louis : sur la page d'un chapitre (iPhone), bouton "aA" de la barre d'adresse Safari → "Demander la version pour ordinateur", et dire si le fond s'affiche correctement dans ce mode. Si ça ne suffit pas à trancher, étape suivante : inspecteur Safari distant (Mac connecté à l'iPhone).

## 4. Accents manquants dans les commentaires de code de `content-br/` (portugais, ancienne convention FR abandonnée le 31/08/2026 apparemment aussi appliquée aux traductions)
`content/` (FR) entièrement corrigé (commits `ff20be6` et `83e6cb2`). `content-en/` n'a pas ce problème (l'anglais n'utilise pas ces diacritiques). `content-es/` vérifié sur 3 fichiers volumineux (`methodes.md`, `variables.md`, `nombres.md`) : accents déjà corrects, rien à faire a priori, mais pas de balayage exhaustif. `content-br/` : confirmé fautif sur `Langages/PHP/conditions.md` (`notacao`/`cientifica`/`sao`/`numericas`/`conteudo` sans diacritiques portugais). 252 fichiers `content-br/*.md` contiennent des commentaires de code (`/tmp/.../scratchpad/find_comments.sh content-br` pour la liste triée par volume), ampleur non vérifiée au-delà de cet échantillon. Chantier plus gros que la correction FR : nécessite un balayage systématique (mots portugais courants sans diacritique : `nao`, `sao`, `entao`, `funcao`, `posicao`, `variavel`, `numero`, `indice`, `referencia`...) plutôt qu'une relecture manuelle fichier par fichier ; à chiffrer avant de se lancer, risque d'introduire un mauvais diacritique sans relecture native.

## 5. Lignes de code de plus de 95 caractères dans `content-en`/`content-es`/`content-br`, à reformater selon les règles de `/best-practice`
**`content/` FR terminé** (commits `48d3a50`..`50004a0`, 19/09/2026). Méthode : un chapitre à la fois (découpage confirmé par Louis). Commentaire de fin de ligne trop long déplacé au-dessus du code plutôt que raccourci (script `/tmp/.../scratchpad/fix_long_lines.py`, ne touche jamais le code lui-même, uniquement la position d'un commentaire identifié sans ambiguïté hors chaîne). Compréhension/appel de fonction/définition trop long : explosé un élément par ligne à la main. Exception assumée et documentée par fichier : un diagramme ASCII/Unicode (arbre, flux, alignement de données) n'est jamais retouché même au-delà de 95 caractères, le couper détruirait l'information visuelle.

**Correction de méthode importante (19/09/2026) :** le premier chiffrage ("1719 lignes sur les 4 langues") comptait des **octets**, pas des caractères -- `awk`/`mawk` sur ce système ne gère pas l'UTF-8, et `length()` compte 2 octets pour chaque caractère accentué. Sur du contenu français truffé d'accents, ça gonflait artificiellement le nombre de lignes détectées (ex : FR est retombé de 180 lignes "détectées" à 60 lignes réellement >95 caractères une fois recompté correctement). Ne jamais recompter avec `awk`/`wc -m` sans vérifier l'encodage : utiliser Python (`len()` sur une chaîne décodée UTF-8 compte des caractères, pas des octets), cf. script de comptage ci-dessous. Cette correction ne remet pas en cause les lignes déjà reformatées pour FR (déplacer un commentaire par ailleurs trop long à l'œil n'est jamais nuisible), mais le chiffrage initial donné à Louis était surestimé.

Prochaine étape : chiffrer et traiter `content-en`, `content-es`, `content-br` avec le compteur correct :
```bash
find content-en content-es content-br -name "*.md" -print0 | xargs -0 python3 - <<'EOF'
import sys
LIMIT = 95
for path in sys.argv[1:]:
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")
    in_code = False
    for i, line in enumerate(lines, start=1):
        if line.startswith("```"):
            in_code = not in_code
            continue
        if in_code and len(line) > LIMIT:
            print(f"{path}:{i}:{len(line)}")
EOF
```
