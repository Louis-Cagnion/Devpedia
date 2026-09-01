# Audit zéro-connaissance

Suivi de travail (pas destiné au public) pour la réécriture de Devpedia niveau zéro-connaissance. Contient uniquement les écarts **encore ouverts** détectés en relisant un chapitre contre la checklist de `plan-zero-connaissance.md` (section "Méthode") : jargon non défini, notion présupposée sans lien, plateforme/produit externe nommé sans être enseigné ni introduit (ex : GitHub), tableau/schéma manquant là où un paragraphe suffirait moins bien, redite au lieu d'un lien, récapitulatif final absent ou mal formaté.

Processus : après avoir retravaillé un lot de chapitres, les relire contre cette checklist, noter les écarts trouvés ci-dessous, les corriger, puis relire à nouveau — jusqu'à ce que la section de la tâche en cours soit vide. Une tâche ne disparaît de ce fichier qu'une fois entièrement propre.

## Rien en cours

Le réaudit zéro-connaissance sur l'ensemble du site (23/23 groupes, catégorie par catégorie) est terminé et propre au 2026-08-12 : jargon défini, redirects corrects, tableaux/schémas utilisés, récaps présents et bien placés partout. Tous les écarts relevés pendant ce réaudit ont été corrigés :
- Alignement des commentaires de code (`#`/`//`) recalculé sur les 81 fichiers concernés (Git, Python, JavaScript, PHP, PowerShell, Bash, IA, C et quelques autres catégories touchées par le même problème).
- `PHP/synthaxe.md` renommé en `syntaxe.md` (dans `content/` et les 3 arborescences traduites qui portaient le même typo).
- Style des 5 fichiers JS incohérents (`objets.md`, `regex.md`, `html-elements.md`, `tableaux.md`, `strings.md`) aligné sur le reste du site (listes de méthodes en tableaux comparatifs plutôt qu'en prose).
- `C/variables.md` enrichi (encadrés piège/bonne pratique par section, lien vers `pointeurs.md`).
- 2 bugs structurels de récap mal placé (`C++/exceptions.md`, `JavaScript/html-elements.md`) déjà corrigés au passage.

(Avant cette reprise : les 19 tâches du plan de réécriture zéro-connaissance initial étaient terminées — tableau récapitulatif standard et renvois en vrais liens Markdown sur tous les chapitres. Le bug camelCase est corrigé : fichiers renommés en kebab-case le 2026-08-07, lien réel restauré dans `include.md`.)
