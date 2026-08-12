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

> **Note :** une fois activé, `pip install` et `python` pointent vers les exécutables **de l'environnement virtuel**, pas ceux installés globalement sur le système : c'est ce qui garantit l'isolation. Le dossier `.venv/` ne doit jamais être versionné avec Git (voir [Le fichier .gitignore](/?c=git&p=gitignore)) : il se régénère entièrement à partir de `requirements.txt`.

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

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `import` charge un module ; `if __name__ == "__main__":` distingue exécution directe et import. `pip` installe des bibliothèques, un environnement virtuel isole les dépendances d'un projet. |
| **Outils utilisables** | `pip install`/`freeze`, `requirements.txt`, `python -m venv`, `__init__.py` pour un package. |
| **Pièges à éviter** | Installer des bibliothèques globalement plutôt que dans un environnement virtuel : conflits de versions entre projets. |
| **Bonnes pratiques** | Toujours travailler dans un environnement virtuel par projet ; versionner `requirements.txt`, jamais `.venv/`. |
