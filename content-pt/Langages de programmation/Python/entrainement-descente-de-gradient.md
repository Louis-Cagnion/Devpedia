---
order: 19
---

# O treino de um modelo e o gradiente descendente

Uma rede neural (ver capítulo dedicado) começa com pesos **aleatórios** — pelo que as suas previsões iniciais não fazem qualquer sentido. **O treino** é o processo que ajusta progressivamente esses pesos para que as previsões se aproximem das respostas corretas, com base em exemplos.

## A função de perda (*loss function*)

Uma **função de perda** mede numericamente o grau de desvio das previsões do modelo em relação às respostas corretas — quanto menor for a perda, melhor será o modelo nesses exemplos específicos.

```python
# Erro quadrático médio (MSE): comum numa tarefa de regressão (prever um número)
def erreur_quadratique_moyenne(predictions, vraies_valeurs):
    erreurs = [(p - v) ** 2 for p, v in zip(predictions, vraies_valeurs)]
    return sum(erreurs) / len(erreurs)

erreur_quadratique_moyenne([3.2, 5.1], [3.0, 5.0])   # pequena perda -> previsões próximas
erreur_quadratique_moyenne([1.0, 1.0], [3.0, 5.0])    # grande perda -> previsões distantes
```

Numa tarefa de classificação, utiliza-se mais frequentemente **a entropia cruzada** (*cross-entropy*), que penaliza fortemente uma previsão confiante, mas errada.

## O algoritmo de gradiente descendente: encontrar o mínimo da perda

Imagine a função de perda como um **relevo**: cada ponto desse relevo corresponde a um conjunto possível de pesos, e a sua altitude corresponde à perda obtida com esses pesos. Treinar o modelo equivale a **descer esse relevo** até ao seu ponto mais baixo — os pesos que minimizam a perda.

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

Em cada etapa, o algoritmo calcula o **gradiente** da perda em relação a cada peso (em que direção e em que medida a perda varia se esse peso for ligeiramente aumentado) e, em seguida, ajusta o peso na direção que **diminui** a perda:

```python
nouveau_poids = ancien_poids - taux_apprentissage * gradient
```

## A taxa de aprendizagem (*learning rate*)

A **taxa de aprendizagem** controla a dimensão de cada passo de descida:

| Taxa de aprendizagem | Efeito |
|---|---|
| Demasiado elevado | O modelo «ultrapassa» o mínimo, a perda oscila ou até diverge (aumenta em vez de diminuir) |
| Demasiado fraco | A descida é muito lenta, o treino pode demorar um tempo excessivo ou ficar bloqueado num mínimo local pouco satisfatório |
| Bem ajustado | Descida regular e razoavelmente rápida até um bom mínimo |

Este é um dos parâmetros mais determinantes (e mais frequentemente ajustados manualmente) num treino de redes neurais.

## A retropropagação (*backpropagation*): calcular o gradiente de forma eficiente

Numa rede de várias camadas, calcular o efeito de **cada** peso na perda final parece dispendioso — um peso da primeira camada influencia a saída através de uma longa cadeia de cálculos intermédios. A **retropropagação** utiliza a regra da cadeia (*chain rule*) para calcular **todos** esses gradientes de forma eficiente, propagando o erro da saída para a entrada, camada a camada:

```
Sens du calcul normal (forward) :  Entrée -> Couche 1 -> Couche 2 -> Sortie -> Perte
Sens de la rétropropagation :      Entrée <- Couche 1 <- Couche 2 <- Sortie <- Perte
```

> **Nota:** não é necessário compreender este processo em profundidade matemática para utilizar um framework como o PyTorch (ver capítulo dedicado) — a «`autograd`» (derivação automática) efetua este cálculo automaticamente. Compreender o **princípio** (propagar o erro para trás, camada a camada, através da regra da derivação em cadeia) é suficiente para entender por que razão surgem certos problemas de treino (por exemplo, o «vanishing gradient», ver capítulo sobre as arquiteturas CNN/RNN/Transformer).

## Épocas, lotes e descida do gradiente estocástico

```python
for epoque in range(nombre_epoques):        # uma «época» = uma passagem completa por TODOS os dados
    for lot in donnees_par_lots(dados, taille_lot=32):  # um «batch»/lote = um pequeno subconjunto
        predictions = modelo.forward(lot)
        perte = calculer_perte(predictions, vraies_valeurs)
        gradients = retropropager(perte)
        ajuster_poids(gradients, taux_apprentissage)
```

Em vez de recalcular o gradiente sobre a **totalidade** dos dados em cada etapa (o que é dispendioso, sobretudo com milhões de exemplos), utiliza-se geralmente pequenos lotes (*mini-batch*) — daí o nome **«descida estocástica do gradiente»** (SGD): cada ajuste dos pesos baseia-se numa amostra, e não na totalidade dos dados, o que introduz algum ruído, mas acelera consideravelmente cada etapa.

Consulte também o capítulo sobre o PyTorch, que automatiza totalmente este ciclo de treino (`loss.backward()`, `optimizer.step()`).
