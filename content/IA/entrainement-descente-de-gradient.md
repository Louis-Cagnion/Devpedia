---
order: 2
---

# L'entraînement d'un modèle et la descente de gradient

Un [réseau de neurones](/?c=ia&p=reseaux-de-neurones) commence avec des poids **aléatoires** — ses prédictions initiales n'ont donc aucun sens. **L'entraînement** est le processus qui ajuste progressivement ces poids pour que les prédictions se rapprochent des bonnes réponses, à partir d'exemples.

## La fonction de perte (*loss function*)

Une **fonction de perte** mesure numériquement à quel point les prédictions du modèle sont éloignées des bonnes réponses — plus la perte est faible, meilleur est le modèle sur ces exemples précis.

```python
# Erreur quadratique moyenne (MSE) : courante pour une tâche de régression (prédire un nombre)
def erreur_quadratique_moyenne(predictions, vraies_valeurs):
    erreurs = [(p - v) ** 2 for p, v in zip(predictions, vraies_valeurs)]
    return sum(erreurs) / len(erreurs)

erreur_quadratique_moyenne([3.2, 5.1], [3.0, 5.0])   # petite perte -> prédictions proches
erreur_quadratique_moyenne([1.0, 1.0], [3.0, 5.0])    # grande perte -> prédictions éloignées
```

Pour une tâche de classification, on utilise plus couramment l'**entropie croisée** (*cross-entropy*), qui pénalise fortement une prédiction confiante mais fausse.

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

Voir aussi [Deep learning avec PyTorch](/?c=ia&p=deep-learning-pytorch), qui automatise entièrement cette boucle d'entraînement (`loss.backward()`, `optimizer.step()`).
