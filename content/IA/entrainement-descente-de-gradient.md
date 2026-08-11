---
order: 2
---

# L'entraînement d'un modèle et la descente de gradient

Un [réseau de neurones](/?c=ia&p=reseaux-de-neurones) commence avec des poids **aléatoires** : ses prédictions initiales n'ont donc aucun sens. **L'entraînement** est le processus qui ajuste progressivement ces poids pour que les prédictions se rapprochent des bonnes réponses, à partir d'exemples.

## La fonction de perte (*loss function*)

Une **fonction de perte** est une [fonction mathématique](/?c=mathematiques&p=la-fonction-mathematique) qui mesure numériquement à quel point les prédictions du modèle sont éloignées des bonnes réponses : plus la perte est faible, meilleur est le modèle sur ces exemples précis.

```python
# Erreur quadratique moyenne (MSE) : courante pour une tâche de régression (prédire un nombre)
def erreur_quadratique_moyenne(predictions, vraies_valeurs):
    erreurs = [(p - v) ** 2 for p, v in zip(predictions, vraies_valeurs)]
    return sum(erreurs) / len(erreurs)

erreur_quadratique_moyenne([3.2, 5.1], [3.0, 5.0])   # petite perte -> prédictions proches
erreur_quadratique_moyenne([1.0, 1.0], [3.0, 5.0])    # grande perte -> prédictions éloignées
```

Pour une tâche de classification, on utilise plus couramment l'**entropie croisée** (*cross-entropy*) : elle compare deux [distributions de probabilité](/?c=mathematiques&p=les-probabilites-de-base) : celle prédite par le modèle et celle, connue, de la bonne réponse (100% sur la bonne classe, 0% sur les autres). Elle vaut `-log(probabilité attribuée à la bonne classe)` ; on retrouve directement la propriété du [logarithme](/?c=mathematiques&p=le-logarithme) vue plus tôt : plus cette probabilité se rapproche de 0, plus `-log(...)` explose, pénalisant fortement une prédiction confiante mais fausse :

```python
import math

def entropie_croisee(probabilite_bonne_classe):
    return -math.log(probabilite_bonne_classe)

entropie_croisee(0.99)   # ~0.01 -> confiant ET juste : perte quasi nulle
entropie_croisee(0.5)     # ~0.69 -> hésitant : perte modérée
entropie_croisee(0.01)    # ~4.6  -> confiant MAIS faux : perte très élevée
```

> **Piège :** utiliser l'erreur quadratique moyenne pour une classification (des catégories), ou l'entropie croisée pour une régression (un nombre continu) : chaque fonction de perte suppose un type de sortie précis, les mélanger produit un entraînement incohérent (voir la même distinction entre `LinearRegression` et `LogisticRegression` dans [Introduction au machine learning](/?c=data-science&p=machine-learning-scikit-learn)).
>
> **Bonne pratique :** choisir la fonction de perte en fonction du type de sortie attendu (nombre continu → MSE, catégorie → entropie croisée), jamais par habitude ou par défaut.

> **Note :** une fonction de perte doit être dérivable (voir [la dérivée et le gradient](/?c=mathematiques&p=la-derivee-et-le-gradient)), puisque l'entraînement calcule son gradient à chaque étape, une contrainte mathématique, pas un choix de lisibilité. Une fois le modèle entraîné, on juge en revanche sa qualité avec des métriques pensées pour être comprises par un humain (exactitude, précision, rappel...), pas nécessairement dérivables ; voir [Mesurer la qualité d'un modèle](/?c=data-science&p=machine-learning-scikit-learn).

## La descente de gradient : trouver le minimum de la perte

Entraîner un réseau revient exactement au principe déjà vu dans [la dérivée et le gradient](/?c=mathematiques&p=la-derivee-et-le-gradient) : la fonction de perte joue le rôle de la courbe à descendre, et les poids du réseau jouent le rôle du vecteur qu'on ajuste pas à pas, dans le sens opposé au gradient :

```python
nouveau_poids = ancien_poids - taux_apprentissage * gradient
```

À chaque étape, l'algorithme calcule le gradient de la perte par rapport à **chaque** poids du réseau (potentiellement des millions), puis les ajuste tous simultanément dans la direction qui diminue la perte.

## Le taux d'apprentissage (*learning rate*)

Le **taux d'apprentissage** est le `taux` de la formule ci-dessus : il contrôle la taille de chaque pas de descente.

| Taux d'apprentissage | Effet |
|---|---|
| Trop élevé | Le modèle "saute" par-dessus le minimum, la perte oscille voire diverge (augmente au lieu de diminuer) |
| Trop faible | La descente est très lente, l'entraînement peut prendre un temps déraisonnable, ou rester bloqué dans un minimum local peu satisfaisant |
| Bien ajusté | Descente régulière et raisonnablement rapide vers un bon minimum |

> **Piège :** garder le même taux d'apprentissage sans jamais le questionner. Une perte qui stagne ou qui oscille sans converger indique presque toujours un taux d'apprentissage mal réglé, pas nécessairement un modèle inadapté au problème.
>
> **Bonne pratique :** surveiller l'évolution de la perte au fil de l'entraînement, et ajuster le taux d'apprentissage (souvent en le réduisant progressivement) si elle n'évolue pas comme attendu, plutôt que de la traiter comme un paramètre fixé une fois pour toutes.

## La rétropropagation (*backpropagation*) : calculer le gradient efficacement

Un réseau à plusieurs couches est une **composition** de fonctions : la sortie de la couche 1 devient l'entrée de la couche 2, et ainsi de suite. Calculer l'effet d'un poids de la toute première couche sur la perte finale suppose donc de remonter toute cette chaîne. La **règle de dérivation en chaîne** (*chain rule*) permet de calculer ce gradient sans recalculer chaque effet depuis zéro : la dérivée d'une composition de fonctions est le produit des dérivées de chaque fonction qui la compose. La **rétropropagation** applique cette règle couche par couche, en partant de la sortie pour remonter vers l'entrée :

```text
Sens du calcul normal (forward) :  Entrée -> Couche 1 -> Couche 2 -> Sortie -> Perte
Sens de la rétropropagation :      Entrée <- Couche 1 <- Couche 2 <- Sortie <- Perte
```

> **Note :** ce n'est pas une opération à recalculer à la main pour utiliser un framework comme [PyTorch](/?c=ia&p=deep-learning-pytorch) : `autograd` (différenciation automatique) effectue ce calcul automatiquement. Comprendre le **principe** (propager le gradient en arrière, couche par couche, via la règle de dérivation en chaîne) suffit pour raisonner sur pourquoi certains problèmes d'entraînement surviennent (ex. le "vanishing gradient", voir [Architectures : CNN, RNN et Transformers](/?c=ia&p=architectures-cnn-rnn-transformers)).

## Époques, batches, et descente de gradient stochastique

```python
for epoque in range(nombre_epoques):        # une "époque" = un passage complet sur TOUTES les données
    for lot in donnees_par_lots(donnees, taille_lot=32):  # un "batch"/lot = un petit sous-ensemble
        predictions = modele.forward(lot)
        perte = calculer_perte(predictions, vraies_valeurs)
        gradients = retropropager(perte)
        ajuster_poids(gradients, taux_apprentissage)
```

Plutôt que de recalculer le gradient sur l'**intégralité** des données à chaque étape (coûteux, surtout avec des millions d'exemples), on utilise généralement de petits lots (*mini-batch*) ; d'où le nom **descente de gradient stochastique** (SGD) : chaque ajustement de poids est basé sur un échantillon, pas sur la totalité des données, ce qui introduit un peu de bruit mais accélère considérablement chaque étape.

> **Piège :** choisir une taille de lot mal adaptée à la mémoire disponible (voir le coût des transferts entre CPU et [GPU](/?c=infrastructure&p=cpu-vs-gpu)) : un lot trop grand peut dépasser la mémoire disponible, un lot trop petit multiplie inutilement le nombre d'aller-retours.
>
> **Bonne pratique :** ajuster la taille de lot à la mémoire réellement disponible (en particulier celle du GPU utilisé), plutôt que de fixer une valeur arbitraire recopiée d'un autre projet.

## D'où viennent les données, et comment les rendre exploitables

Tout ce qui précède suppose déjà des données prêtes à être passées au modèle : en pratique, cette préparation représente souvent plus de travail que l'entraînement lui-même.

**La quantité et la nature des données.** Le principe général (collecter, nettoyer, séparer en entraînement/test) est le même que pour un modèle classique, voir [le déroulement type d'un projet de machine learning](/?c=data-science&p=machine-learning-scikit-learn) : un réseau de neurones en demande simplement beaucoup plus, souvent par milliers voire millions d'exemples, pour ajuster ses nombreux paramètres sans se contenter de les mémoriser. Deux cas se distinguent par la façon d'obtenir la "bonne réponse" à comparer à la prédiction :

- **Supervisé** : chaque exemple est étiqueté à la main (une image classée "chat", un email marqué "spam") : coûteux à produire en volume.
- **Auto-supervisé** : la bonne réponse est dérivée automatiquement des données brutes elles-mêmes, sans intervention humaine ; c'est le cas d'un LLM entraîné à prédire le mot suivant (voir [NLP et LLM](/?c=ia&p=nlp-et-llm)) : la "bonne réponse" de chaque exemple d'entraînement est simplement le mot qui suit réellement dans le texte source. C'est ce qui permet d'entraîner sur des volumes de texte bien plus grands qu'aucune équipe humaine ne pourrait étiqueter.

**Transformer des données brutes en données exploitables.** Un réseau de neurones ne prend en entrée qu'un [vecteur](/?c=mathematiques&p=vecteurs-et-produit-scalaire) de nombres, de **taille fixe** (voir la couche d'entrée dans [Les réseaux de neurones](/?c=ia&p=reseaux-de-neurones)), jamais une image, un texte ou une ligne de tableur telle quelle. Chaque type de donnée a sa propre étape de conversion vers cette forme numérique fixe : un texte est découpé en tokens puis converti en embeddings (voir [NLP et LLM](/?c=ia&p=nlp-et-llm)), une image est redimensionnée à une résolution fixe puis ses pixels normalisés dans un intervalle standard (ex. 0 à 1, plutôt que 0 à 255), une donnée tabulaire est nettoyée et ses colonnes catégorielles converties en nombres (voir [pandas](/?c=data-science&p=pandas)). Sans cette normalisation des échelles, des colonnes aux amplitudes très différentes (un âge entre 0 et 100, un salaire entre 0 et 100 000) feraient converger la descente de gradient de façon très inégale selon la direction.

> **Piège :** entraîner un modèle sur des données non représentatives de son usage réel (un jeu de données biaisé, incomplet, ou trop différent des cas rencontrés en production). Le modèle apprend alors fidèlement les régularités de ces données (y compris leurs biais) sans qu'aucune erreur de code ne le signale.
>
> **Bonne pratique :** vérifier que les données d'entraînement couvrent bien la diversité des cas attendus en usage réel, avant de faire confiance à la qualité du modèle qui en résulte.

**L'environnement nécessaire.** Un modèle classique (scikit-learn) s'entraîne en quelques secondes sur un CPU ordinaire. Un réseau de neurones profond, avec ses millions voire milliards de paramètres, devient rapidement impraticable sans [GPU](/?c=infrastructure&p=cpu-vs-gpu). Concrètement, monter cet environnement suppose : un framework de deep learning (PyTorch, TensorFlow), des dépendances isolées du reste du système pour rester reproductibles (voir les environnements virtuels en [Python](/?c=langages-de-programmation&s=python&p=modules-et-environnements)), et le plus souvent une machine équipée d'un GPU accessible en local ou louée à la demande dans le [cloud](/?c=infrastructure&p=le-cloud) pour les entraînements trop lourds pour une machine personnelle. Un notebook (voir [Les notebooks Jupyter](/?c=data-science&p=jupyter-notebooks)) reste l'outil habituel pour expérimenter rapidement sur un petit échantillon, avant de lancer un entraînement complet, plus long, via un script.

Voir aussi [Deep learning avec PyTorch](/?c=ia&p=deep-learning-pytorch), qui automatise entièrement cette boucle d'entraînement (`loss.backward()`, `optimizer.step()`).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | L'entraînement ajuste les poids d'un réseau pour minimiser une fonction de perte, en descendant son gradient pas à pas (voir [la dérivée et le gradient](/?c=mathematiques&p=la-derivee-et-le-gradient)). La rétropropagation calcule ce gradient efficacement via la règle de dérivation en chaîne. |
| **Outils utilisables** | `autograd` (PyTorch et équivalents) calcule automatiquement le gradient par rétropropagation : aucun calcul à la main en pratique. |
| **Pièges à éviter** | Mélanger MSE et entropie croisée selon le type de sortie. Garder un taux d'apprentissage mal réglé sans le questionner. Une taille de lot incompatible avec la mémoire disponible. Entraîner sur des données non représentatives de l'usage réel. |
| **Bonnes pratiques** | Choisir la fonction de perte selon le type de sortie. Surveiller l'évolution de la perte pour ajuster le taux d'apprentissage. Adapter la taille de lot à la mémoire réellement disponible. Vérifier la représentativité des données d'entraînement. |
