---
order: 8
---

# Description

Cette section couvre l'intelligence artificielle moderne, à partir d'une base commune (**Fondamentaux du deep learning** : comment un modèle apprend et fonctionne en interne), puis trois familles de modèles construites sur cette base selon le type de donnée traité : le texte, jusqu'aux grands modèles de langage (**NLP et LLM**, puis des exemples concrets d'applications dans **Applications LLM**), l'image, notamment la reconnaissance de caractères (**Vision et OCR**), et l'audio, la synthèse vocale (**Voix IA**). La partie **Production et gouvernance** couvre ce qui entoure un système IA une fois en usage réel : monitoring, réglementation, obligations sur les données qui y transitent, quelle que soit la modalité traitée.

Le fil conducteur de la partie LLM est qu'un LLM seul ne suffit presque jamais : il a une mémoire de travail bornée, aucune connaissance des événements postérieurs à son entraînement, et ne peut agir seul sur le monde réel. Le RAG et les agents sont les deux façons courantes de compenser ces limites, et le prix de cette puissance supplémentaire se paie en coût, en risques opérationnels et en obligations de gouvernance.

Pour les outils [Python](/?c=langages&s=python&p=python) utilisés pour manipuler des données et construire des modèles classiques (NumPy, pandas, scikit-learn...), voir la section [Data Science](/?c=donnees&s=data-science&p=data-science) : cette section-ci se concentre sur les modèles eux-mêmes et les systèmes construits autour d'eux, indépendamment du langage utilisé pour les implémenter.

Vous retrouverez les différentes notions ci-dessous :
