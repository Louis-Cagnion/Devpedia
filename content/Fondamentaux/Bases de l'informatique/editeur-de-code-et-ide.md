---
order: 3
---

# L'éditeur de code et l'IDE

Un [fichier de code](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) est un fichier texte : techniquement, l'écrire avec [Notepad](https://learn.microsoft.com/en-us/windows/win32/menurc/notepad) ou [TextEdit](https://support.apple.com/guide/textedit/welcome/mac) suffirait. En pratique, personne ne fait ça : un outil dédié rend l'écriture de code bien plus confortable.

## Éditeur de texte simple vs éditeur de code

| | Éditeur de texte simple (Notepad, TextEdit) | Éditeur de code |
|---|---|---|
| Ce qu'il fait | Affiche et modifie du texte brut | Affiche et modifie du texte, en comprenant que c'est du code |
| Coloration syntaxique | Non : tout le texte a la même couleur | Oui : mots-clés, chaînes de texte, commentaires... chacun sa couleur |
| Aide à l'écriture | Aucune | Complétion automatique, détection d'erreur, navigation dans le code |

**La coloration syntaxique** consiste à afficher chaque type d'élément du code dans une couleur différente, pour que sa structure se voie d'un coup d'œil, sans même lire chaque mot. Vous en voyez un exemple concret sur cette page même : chaque bloc de code de Devpédia est coloré ainsi.

```python
# Ceci est un commentaire       -> une couleur
nom = "Jean"                    # "Jean" est une chaîne de texte -> une autre couleur
```

> **Piège :** utiliser un traitement de texte ([Word](https://www.microsoft.com/microsoft-365/word), [WordPad](https://learn.microsoft.com/en-us/windows/win32/menurc/wordpad)) pour écrire du code. Au-delà de l'absence de coloration syntaxique, ces logiciels remplacent silencieusement certains caractères par leur équivalent "typographique" (guillemets courbes `“ ”` au lieu de `" "`, tirets longs...), invisibles à l'œil, mais qui rendent le code syntaxiquement invalide.
>
> **Bonne pratique :** toujours écrire du code dans un éditeur de **texte brut** (simple ou de code), jamais dans un traitement de texte, même "juste pour dépanner".

## L'IDE : un éditeur de code, plus des outils intégrés

**IDE** signifie *Integrated Development Environment* (environnement de développement intégré) : en plus d'éditer du code, il regroupe dans une seule application des outils qu'on utiliserait sinon séparément.

| Outil intégré | Rôle |
|---|---|
| Terminal intégré | Un [terminal](/?c=bases-de-l-informatique&p=le-terminal) directement dans la fenêtre, sans en ouvrir un autre à côté |
| Bouton "Exécuter" | Lance le programme sans taper la commande à la main : en coulisses, il exécute exactement la même chose que si vous l'aviez tapée dans un terminal |
| Détection d'erreur | Signale une erreur probable avant même d'exécuter le code (ex. une parenthèse jamais fermée) |
| Débogueur | Permet d'exécuter le code pas à pas, pour observer l'état des données à chaque étape |

> **Note :** la frontière entre "simple éditeur de code" et "IDE complet" n'est pas stricte : un éditeur comme VS Code démarre léger, mais devient proche d'un IDE une fois des extensions installées pour un langage donné.

> **Piège :** dans un projet à plusieurs fichiers, supposer que le bouton "Exécuter" relance toujours le fichier actuellement affiché à l'écran : beaucoup d'IDE se souviennent d'une **configuration de lancement** distincte, qui peut cibler un autre fichier que celui qu'on regarde, sans le signaler clairement.
>
> **Bonne pratique :** en cas de résultat qui ne change pas malgré une modification, vérifier quel fichier est réellement exécuté avant de chercher un bug ailleurs.

| Outil | Catégorie | Langages ciblés |
|---|---|---|
| [VS Code](https://code.visualstudio.com) | Éditeur de code extensible | Généraliste : presque tous, via des extensions |
| [PyCharm](https://www.jetbrains.com/pycharm/) | IDE complet | [Python](/?c=langages-de-programmation&s=python&p=python) |
| [Visual Studio](https://visualstudio.microsoft.com) (à ne pas confondre avec VS Code) | IDE complet | [C](/?c=langages-de-programmation&s=c&p=c), [C++](/?c=langages-de-programmation&s=cpp&p=cpp), [C#](https://learn.microsoft.com/en-us/dotnet/csharp/), [.NET](https://learn.microsoft.com/en-us/dotnet/) |

## Par quoi commencer

Pour débuter, un éditeur généraliste et gratuit comme **VS Code** (disponible sur Windows, macOS et Linux) couvre largement les besoins des premiers chapitres de ce site, quel que soit le langage abordé ensuite ; nul besoin d'un IDE dédié à un langage précis avant d'en avoir vraiment besoin.

> **Piège :** installer d'un coup de nombreuses extensions "au cas où" : au-delà de ralentir l'éditeur, des extensions qui se chevauchent (ex. deux extensions de coloration pour le même langage) peuvent entrer en conflit, rendant difficile de savoir laquelle est responsable d'un comportement inattendu.
>
> **Bonne pratique :** installer une extension à la fois, seulement quand un besoin précis se présente, pas par anticipation.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un éditeur de code ajoute la coloration syntaxique et l'aide à l'écriture qu'un éditeur de texte simple n'a pas. Un IDE va plus loin : terminal intégré, bouton "Exécuter", détection d'erreur, débogueur, tous regroupés dans une seule application. |
| **Outils utilisables** | Un éditeur généraliste comme VS Code pour commencer ; un IDE dédié (PyCharm, Visual Studio...) seulement une fois un langage précis choisi. |
| **Pièges à éviter** | Écrire du code dans un éditeur de texte simple (Notepad, TextEdit) sans coloration syntaxique ni détection d'erreur, rien ne l'empêche techniquement, mais chaque erreur devient bien plus difficile à repérer. |
| **Bonnes pratiques** | Le bouton "Exécuter" d'un IDE ne fait rien de magique : il lance la même commande qu'un terminal exécuterait ; comprendre cette commande reste utile même si on ne la tape jamais à la main. |
