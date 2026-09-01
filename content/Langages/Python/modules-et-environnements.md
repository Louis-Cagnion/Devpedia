---
order: 13
---

# Modules, pip et environnements virtuels

Un projet Python dépasse rarement un seul fichier bien longtemps : ce chapitre couvre comment organiser du code en plusieurs fichiers (modules), installer des bibliothèques externes (`pip`), et isoler les dépendances d'un projet à l'autre (environnements virtuels).

## Importer un module

```python
# fichier calculs.py
def addition(a, b):
    return a + b
```

```python
# fichier main.py
import calculs

print(calculs.addition(2, 3))   # 5, accès via le nom du module

from calculs import addition     # importe directement la fonction, sans préfixe
print(addition(2, 3))

import calculs as c               # renomme le module importé
print(c.addition(2, 3))
```

## `if __name__ == "__main__":`

Chaque fichier Python possède une variable spéciale `__name__` : elle vaut `"__main__"` uniquement si le fichier est **exécuté directement**, et le nom du module s'il est **importé** depuis un autre fichier.

```python
# calculs.py
def addition(a, b):
    return a + b

if __name__ == "__main__":
    print("Test rapide :", addition(2, 3))   # ne s'exécute QUE si on lance "python calculs.py" directement
```

> **Note :** ce garde-fou permet à un fichier de servir à la fois de module réutilisable (importé sans rien exécuter d'inattendu) et de script autonome (testable directement), sans que ces deux usages interfèrent.

## `pip` : installer des bibliothèques externes

```bash
pip install requests          # installe une bibliothèque
pip install requests==2.31.0  # installe une version précise
pip uninstall requests        # désinstalle
pip list                      # liste les bibliothèques installées
```

## `requirements.txt` : figer les dépendances d'un projet

```text
requests==2.31.0
numpy==1.26.0
```

```bash
pip freeze > requirements.txt    # génère ce fichier depuis l'environnement actuel
pip install -r requirements.txt  # réinstalle exactement les mêmes versions ailleurs
```

## Les environnements virtuels

Sans isolation, `pip install` installe les bibliothèques **globalement** sur la machine : deux projets qui ont besoin de versions différentes d'une même bibliothèque entrent alors en conflit. Un **environnement virtuel** crée une installation Python isolée, propre à un projet :

```bash
python -m venv .venv          # crée un environnement virtuel dans le dossier .venv

source .venv/bin/activate  # active l'environnement (Linux/macOS)
.venv\Scripts\activate     # active l'environnement (Windows)

pip install requests             # installe UNIQUEMENT dans cet environnement, pas globalement

deactivate                        # quitte l'environnement virtuel
```

> **Note :** une fois activé, `pip install` et `python` pointent vers les exécutables **de l'environnement virtuel**, pas ceux installés globalement sur le système : c'est ce qui garantit l'isolation. Le dossier `.venv/` ne doit jamais être versionné avec [Git](/?c=git&p=git) (voir [Le fichier .gitignore](/?c=git&p=gitignore)) : il se régénère entièrement à partir de `requirements.txt`.

## Organiser un projet en package

```text
mon_projet/
├── mon_package/
│   ├── __init__.py     # rend le dossier importable comme un package
│   ├── calculs.py
│   └── utils.py
└── main.py
```

```python
from mon_package import calculs
from mon_package.utils import une_fonction
```

Un simple fichier `__init__.py` (même vide) suffit à faire d'un dossier un **package** importable, regroupant plusieurs modules sous un même espace de noms.

> **Note :** depuis Python 3.3, `__init__.py` n'est plus obligatoire pour qu'un dossier soit importable : sans lui, Python le traite comme un **namespace package** ([PEP 420](https://peps.python.org/pep-0420/)). La différence est visible en pratique : sur un package classique (avec `__init__.py`), `mon_package.__file__` pointe vers ce fichier ; sur un namespace package, `__file__` vaut `None` et `__path__` devient un objet spécial plutôt qu'une simple liste. Un dossier sans `__init__.py` reste donc importable, mais ne se comporte pas exactement comme un package classique pour tout le code qui inspecte ces attributs.

## `pyproject.toml` : le packaging moderne

`requirements.txt` fige des versions, mais ne décrit pas le projet lui-même (son nom, comment l'installer, ses métadonnées) : `pyproject.toml` centralise cette description dans un format standard, reconnu par les outils de packaging modernes (`setuptools`, `poetry`...) :

```toml
[project]
name = "mon-projet"
version = "0.1.0"
dependencies = ["requests==2.31.0"]

[tool.setuptools.packages.find]
where = ["."]
```

`[tool.setuptools.packages.find]` détecte automatiquement les packages classiques (avec `__init__.py`) ; un projet qui s'appuie sur des namespace packages doit utiliser `find_namespace_packages` à la place, sans quoi les dossiers sans `__init__.py` sont silencieusement ignorés lors de l'installation.

```bash
pip install -e .   # installation "editable"
```

L'installation **éditable** (`pip install -e .`) installe le projet sans copier ses fichiers dans l'environnement virtuel : elle crée à la place un fichier `.pth` qui pointe vers le dossier source. Modifier le code source prend effet immédiatement, sans réinstallation, ce qui rend cette commande indispensable en développement actif d'une bibliothèque.

## Le Python "portable" (*embeddable*) et le fichier `._pth`

Une installation Python classique ajoute automatiquement le dossier du script lancé à `sys.path` (la liste des dossiers où `import` cherche un module). Le **Python embarqué** (distribution ZIP minimale de [python.org](https://docs.python.org/3/using/windows.html#the-embeddable-package), sans droits administrateur requis, utilisée par exemple pour livrer un outil sans dépendre d'une installation système) fonctionne différemment :

```text
python-3.12.0-embed-amd64/
├── python.exe
├── python312.zip     # la bibliothèque standard, compressée
├── python312._pth    # la liste FIGÉE des dossiers de sys.path
└── mon_script.py
```

```text
# python312._pth
python312.zip
.
#import site          # commenté : site-packages désactivé, installation plus légère
```

Le fichier `._pth` **fige** entièrement `sys.path` à cette liste : contrairement à une installation classique, le dossier du script lancé n'y est PAS ajouté automatiquement.

```python
# mon_script.py, situé dans le même dossier
import sys
sys.path.insert(0, ".")  # sans ceci, un package voisin non listé dans ._pth reste introuvable

import mon_package
```

> **Piège :** un projet qui tourne sans problème avec une installation Python classique peut échouer avec `ModuleNotFoundError` une fois déployé sur un Python embarqué, faute de ce `sys.path.insert(0, ...)` manuel avant tout import d'un package voisin.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `import` charge un module ; `if __name__ == "__main__":` distingue exécution directe et import. `pip` installe des bibliothèques, un environnement virtuel isole les dépendances d'un projet. `pyproject.toml` décrit le projet lui-même, au-delà des seules versions figées par `requirements.txt`. |
| **Outils utilisables** | `pip install`/`freeze`, `requirements.txt`, `python -m venv`, `__init__.py` pour un package classique, `pyproject.toml` et `pip install -e .` pour le packaging moderne. |
| **Pièges à éviter** | Installer des bibliothèques globalement plutôt que dans un environnement virtuel : conflits de versions entre projets. Oublier `find_namespace_packages` pour un projet sans `__init__.py`, qui fait ignorer silencieusement ces dossiers à l'installation. |
| **Bonnes pratiques** | Toujours travailler dans un environnement virtuel par projet ; versionner `requirements.txt`, jamais `.venv/`. Utiliser `pip install -e .` en développement actif d'une bibliothèque. |
