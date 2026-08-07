---
order: 9
---

# Résoudre un conflit de fusion

Un **conflit** survient quand Git ne peut pas fusionner automatiquement deux versions d'un même fichier — typiquement, quand les **mêmes lignes** ont été modifiées différemment de part et d'autre (lors d'un `merge`, d'un `rebase`, ou d'un `pull`).

## Ce que Git écrit dans le fichier en conflit

```
<<<<<<< HEAD
const TVA = 0.20;
=======
const TVA_TAUX = 0.20;
>>>>>>> feature
```

- Tout ce qui est entre `<<<<<<< HEAD` et `=======` correspond à **votre** version (la branche sur laquelle vous êtes).
- Tout ce qui est entre `=======` et `>>>>>>> feature` correspond à la version de l'**autre** branche (fusionnée).
- Ces marqueurs (`<<<<<<<`, `=======`, `>>>>>>>`) sont insérés **directement dans le fichier** — le fichier ne compile/n'exécute plus tel quel tant qu'ils sont présents.

## Résoudre le conflit

1. Ouvrir le fichier, décider quelle version garder (ou combiner les deux manuellement).
2. Supprimer entièrement les marqueurs `<<<<<<<`, `=======`, `>>>>>>>` — ils ne doivent **jamais** rester dans le fichier final.
3. Marquer le fichier comme résolu, puis poursuivre l'opération en cours :

```bash
git add fichier_en_conflit.js

git commit                # si le conflit venait d'un "merge"
git rebase --continue     # si le conflit venait d'un "rebase"
```

## Voir quels fichiers sont en conflit

```bash
git status
# affiche explicitement la liste des fichiers "both modified" (modifiés des deux côtés)
```

## Abandonner la fusion/le rebase en cours

Si la résolution s'avère trop complexe ou qu'on préfère repartir de zéro :

```bash
git merge --abort     # annule un merge en cours, restaure l'état d'avant la tentative
git rebase --abort    # annule un rebase en cours
```

## Réduire le risque de conflits

- Intégrer fréquemment les changements des autres (`git pull`/`git fetch` régulier) plutôt que de laisser une branche diverger longtemps.
- Garder des branches de fonctionnalité courtes et ciblées.
- Communiquer avec l'équipe quand plusieurs personnes travaillent sur les mêmes fichiers en parallèle.

Voir aussi [Les branches](/?c=git&p=branches) et [Le rebase](/?c=git&p=rebase), les deux opérations qui provoquent le plus souvent des conflits.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un conflit apparaît quand Git ne peut pas fusionner automatiquement deux versions des mêmes lignes. Les marqueurs `<<<<<<<`/`=======`/`>>>>>>>` doivent être retirés manuellement avant de continuer. |
| **Outils utilisables** | `git status` (fichiers en conflit), `git add` + `git commit`/`git rebase --continue`, `git merge --abort`/`git rebase --abort`. |
| **Pièges à éviter** | Oublier de supprimer un marqueur de conflit — le fichier reste invalide (ne compile/n'exécute plus) tant qu'il y est. |
| **Bonnes pratiques** | Intégrer fréquemment les changements des autres pour limiter la divergence ; garder des branches de fonctionnalité courtes et ciblées. |
