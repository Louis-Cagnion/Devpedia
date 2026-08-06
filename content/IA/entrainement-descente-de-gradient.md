---
order: 2
---

# L'entraînement d'un modèle et la descente de gradient

Un [réseau de neurones](/?c=ia&p=reseaux-de-neurones) commence avec des poids **aléatoires** — ses prédictions initiales n'ont donc aucun sens. **L'entraînement** est le processus qui ajuste progressivement ces poids pour que les prédictions se rapprochent des bonnes réponses, à partir d'exemples.

## La fonction de perte (*loss function*)

Une **fonction de perte** mesure numériquement à quel point les prédictions du modèle sont éloignées des bonnes réponses — plus la perte est faible, meilleur est le modèle sur ces exemples précis.

> **Perte vs métrique d'évaluation :** la perte doit être **dérivable**, puisque la descente de gradient calcule son gradient à chaque étape (voir plus bas) — c'est une contrainte mathématique, pas un choix de lisibilité. Une fois le modèle entraîné, on juge en revanche sa qualité avec des métriques pensées pour être comprises par un humain (exactitude, précision, rappel, F1-score...), pas nécessairement dérivables — voir [Mesurer la qualité d'un modèle](/?c=data-science&p=machine-learning-scikit-learn).

```python
# Erreur quadratique moyenne (MSE) : courante pour une tâche de régression (prédire un nombre)
def erreur_quadratique_moyenne(predictions, vraies_valeurs):
    erreurs = [(p - v) ** 2 for p, v in zip(predictions, vraies_valeurs)]
    return sum(erreurs) / len(erreurs)

erreur_quadratique_moyenne([3.2, 5.1], [3.0, 5.0])   # petite perte -> prédictions proches
erreur_quadratique_moyenne([1.0, 1.0], [3.0, 5.0])    # grande perte -> prédictions éloignées
```

Pour une tâche de classification, on utilise plus couramment l'**entropie croisée** (*cross-entropy*) : elle ne mesure pas un écart numérique comme le MSE, mais compare deux distributions de probabilité — celle prédite par le modèle et celle, connue, de la bonne réponse (100% sur la bonne classe, 0% sur les autres). Concrètement, elle vaut `-log(probabilité attribuée à la bonne classe)` : plus le modèle attribue une probabilité élevée à la bonne classe, plus cette valeur est proche de 0 (perte faible) ; plus il attribue une probabilité faible à la bonne classe (y compris en étant "sûr de lui" sur une mauvaise classe), plus `-log(...)` grandit vite (perte élevée) — c'est cette croissance rapide du logarithme près de 0 qui pénalise fortement une prédiction confiante mais fausse, bien plus qu'une simple hésitation :

```python
import math

def entropie_croisee(probabilite_bonne_classe):
    return -math.log(probabilite_bonne_classe)

entropie_croisee(0.99)   # ~0.01 -> confiant ET juste : perte quasi nulle
entropie_croisee(0.5)     # ~0.69 -> hésitant : perte modérée
entropie_croisee(0.01)    # ~4.6  -> confiant MAIS faux : perte très élevée
```

## La descente de gradient : trouver le minimum de la perte

Imaginez la fonction de perte comme un **relief** : chaque point de ce relief correspond à un jeu de poids possible, et son altitude à la perte obtenue avec ces poids. Entraîner le modèle revient à **descendre ce relief** jusqu'à son point le plus bas — les poids qui minimisent la perte.

```
Perte
  |     .
  |    / \
  |   /   \        <- point de départ (poids aléatoires)
  |  /     \  .
  | /       \/ \
  |/           \___     <- minimum recherché
  +------------------ Valeur du poids
```

À chaque étape, l'algorithme calcule le **gradient** de la perte par rapport à chaque poids (dans quelle direction, et de combien, la perte varie si on augmente légèrement ce poids), puis ajuste le poids dans la direction qui **diminue** la perte :

```python
nouveau_poids = ancien_poids - taux_apprentissage * gradient
```

## Le taux d'apprentissage (*learning rate*)

Le **taux d'apprentissage** contrôle la taille de chaque pas de descente :

| Taux d'apprentissage | Effet |
|---|---|
| Trop élevé | Le modèle "saute" par-dessus le minimum, la perte oscille voire diverge (augmente au lieu de diminuer) |
| Trop faible | La descente est très lente, l'entraînement peut prendre un temps déraisonnable, ou rester bloqué dans un minimum local peu satisfaisant |
| Bien ajusté | Descente régulière et raisonnablement rapide vers un bon minimum |

C'est l'un des paramètres les plus déterminants (et les plus souvent ajustés manuellement) d'un entraînement de réseau de neurones.

## La rétropropagation (*backpropagation*) : calculer le gradient efficacement

Pour un réseau à plusieurs couches, calculer l'effet de **chaque** poids sur la perte finale semble coûteux — un poids de la première couche influence la sortie via une longue chaîne de calculs intermédiaires. La **rétropropagation** exploite la règle de dérivation en chaîne (*chain rule*) pour calculer **tous** ces gradients efficacement, en propageant l'erreur de la sortie vers l'entrée, couche par couche :

```
Sens du calcul normal (forward) :  Entrée -> Couche 1 -> Couche 2 -> Sortie -> Perte
Sens de la rétropropagation :      Entrée <- Couche 1 <- Couche 2 <- Sortie <- Perte
```

> **Note :** ce n'est pas une opération à comprendre en profondeur mathématique pour utiliser un framework comme [PyTorch](/?c=ia&p=deep-learning-pytorch) — `autograd` (différenciation automatique) effectue ce calcul automatiquement. Comprendre le **principe** (propager l'erreur en arrière, couche par couche, via la règle de dérivation en chaîne) suffit pour raisonner sur pourquoi certains problèmes d'entraînement surviennent (ex. le "vanishing gradient", voir [Architectures — CNN, RNN et Transformers](/?c=ia&p=architectures-cnn-rnn-transformers)).

## Époques, batches, et descente de gradient stochastique

```python
for epoque in range(nombre_epoques):        # une "époque" = un passage complet sur TOUTES les données
    for lot in donnees_par_lots(donnees, taille_lot=32):  # un "batch"/lot = un petit sous-ensemble
        predictions = modele.forward(lot)
        perte = calculer_perte(predictions, vraies_valeurs)
        gradients = retropropager(perte)
        ajuster_poids(gradients, taux_apprentissage)
```

Plutôt que de recalculer le gradient sur l'**intégralité** des données à chaque étape (coûteux, surtout avec des millions d'exemples), on utilise généralement de petits lots (*mini-batch*) — d'où le nom **descente de gradient stochastique** (SGD) : chaque ajustement de poids est basé sur un échantillon, pas sur la totalité des données, ce qui introduit un peu de bruit mais accélère considérablement chaque étape.

## D'où viennent les données, et comment les rendre exploitables

Tout ce qui précède suppose déjà des données prêtes à être passées au modèle — en pratique, cette préparation représente souvent plus de travail que l'entraînement lui-même.

**La quantité et la nature des données.** Le principe général (collecter, nettoyer, séparer en entraînement/test) est le même que pour un modèle classique, voir [le déroulement type d'un projet de machine learning](/?c=data-science&p=machine-learning-scikit-learn) — un réseau de neurones en demande simplement beaucoup plus, souvent par milliers voire millions d'exemples, pour ajuster ses nombreux paramètres sans se contenter de les mémoriser. Deux cas se distinguent par la façon d'obtenir la "bonne réponse" à comparer à la prédiction :

- **Supervisé** : chaque exemple est étiqueté à la main (une image classée "chat", un email marqué "spam") — coûteux à produire en volume.
- **Auto-supervisé** : la bonne réponse est dérivée automatiquement des données brutes elles-mêmes, sans intervention humaine — c'est le cas d'un LLM entraîné à prédire le mot suivant (voir [NLP et LLM](/?c=ia&p=nlp-et-llm)) : la "bonne réponse" de chaque exemple d'entraînement est simplement le mot qui suit réellement dans le texte source. C'est ce qui permet d'entraîner sur des volumes de texte bien plus grands qu'aucune équipe humaine ne pourrait étiqueter.

**Transformer des données brutes en données exploitables.** Un réseau de neurones ne prend en entrée qu'un vecteur de nombres, de **taille fixe** (voir la couche d'entrée dans [Les réseaux de neurones](/?c=ia&p=reseaux-de-neurones)) — jamais une image, un texte ou une ligne de tableur telle quelle. Chaque type de donnée a sa propre étape de conversion vers cette forme numérique fixe : un texte est découpé en tokens puis converti en embeddings (voir [NLP et LLM](/?c=ia&p=nlp-et-llm)), une image est redimensionnée à une résolution fixe puis ses pixels normalisés dans un intervalle standard (ex. 0 à 1, plutôt que 0 à 255), une donnée tabulaire est nettoyée et ses colonnes catégorielles converties en nombres (voir [pandas](/?c=data-science&p=pandas)). Sans cette normalisation des échelles, des colonnes aux amplitudes très différentes (un âge entre 0 et 100, un salaire entre 0 et 100 000) feraient converger la descente de gradient de façon très inégale selon la direction.

**L'environnement nécessaire.** Un modèle classique (scikit-learn) s'entraîne en quelques secondes sur un CPU ordinaire. Un réseau de neurones profond, avec ses millions voire milliards de paramètres, devient rapidement impraticable sans **GPU** — voir [Deep learning avec PyTorch](/?c=ia&p=deep-learning-pytorch) pour pourquoi le calcul vectorisé massivement parallèle change cet ordre de grandeur. Concrètement, monter cet environnement suppose : un framework de deep learning (PyTorch, TensorFlow), des dépendances isolées du reste du système pour rester reproductibles (voir les environnements virtuels en [Python](/?c=langages-de-programmation&s=python&p=modules-et-environnements) — le principe se généralise à tout langage), et le plus souvent une machine équipée d'un GPU accessible en local ou louée à la demande dans le cloud pour les entraînements trop lourds pour une machine personnelle. Un notebook (voir [Les notebooks Jupyter](/?c=data-science&p=jupyter-notebooks)) reste l'outil habituel pour expérimenter rapidement sur un petit échantillon, avant de lancer un entraînement complet, plus long, via un script.

Voir aussi [Deep learning avec PyTorch](/?c=ia&p=deep-learning-pytorch), qui automatise entièrement cette boucle d'entraînement (`loss.backward()`, `optimizer.step()`).
