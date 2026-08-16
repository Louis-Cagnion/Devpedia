# Description

Cette section couvre l'outillage [Python](/?c=langages-de-programmation&s=python&p=python) de la data science : manipuler de grands volumes de données efficacement (NumPy, pandas), les explorer visuellement (Matplotlib, Jupyter), et construire des modèles de machine learning classiques (scikit-learn), par opposition aux réseaux de neurones et aux LLM, traités dans la section [IA](/?c=ia).

Le fil conducteur est la performance : ces bibliothèques existent parce qu'une boucle [Python](/?c=langages-de-programmation&s=python&p=python) pure sur des millions de lignes est trop lente pour un usage réel (voir [Cache CPU et vectorisation (SIMD)](/?c=performance&p=cache-cpu-et-simd)) ; chacune délègue le calcul lourd à du code compilé, en échange d'une façon particulière d'écrire ce calcul (vectorisé plutôt qu'en boucle explicite).

Vous retrouverez les différentes notions ci-dessous :
