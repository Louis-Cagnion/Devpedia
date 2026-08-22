---
order: 4
---

# Traitement de documents

Cette section couvre l'extraction d'information depuis des documents existants (PDF, images scannées) : en tirer le texte, reconstruire des tableaux, choisir où faire tourner les modèles de vision qui rendent tout ça possible. Elle s'appuie sur [Python](/?c=langages-de-programmation&s=python) pour l'implémentation et sur les [réseaux de neurones](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)/[architectures de vision](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) de la section [IA](/?c=ia) pour le fonctionnement des modèles sous-jacents.

Le fil conducteur est qu'un document n'est jamais une seule chose : une page de PDF mélange du texte réellement stocké comme tel (natif, fiable à extraire) et du contenu qui n'existe que sous forme d'image (scan, tableau complexe), qui doit être interprété visuellement avant de devenir exploitable. Distinguer les deux, et savoir quand basculer de l'un à l'autre, est la question qui revient dans chaque chapitre de cette section.

Vous retrouverez les différentes notions ci-dessous :
