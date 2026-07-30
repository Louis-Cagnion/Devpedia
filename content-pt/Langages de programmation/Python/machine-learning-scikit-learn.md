---
order: 17
---

# Introdução ao machine learning (scikit-learn)

O **machine learning** (aprendizagem automática) consiste em ensinar a um programa um comportamento a partir de **dados**, em vez de codificar explicitamente cada regra. Este capítulo apresenta a terminologia e o desenrolar geral de um projeto de ML, antes dos capítulos mais avançados sobre redes neurais.

## Aprendizagem supervisionada vs. não supervisionada

| | Aprendizagem supervisionada | Aprendizagem não supervisionada |
|---|---|---|
| Dados | Rotulados (já se conhece a resposta correta para cada exemplo de treino) | Não rotulados |
| Objetivo | Prever um rótulo para novos dados | Descobrir uma estrutura oculta nos dados |
| Exemplos de tarefas | Classificação (spam/não spam), regressão (prever um preço) | Agrupamento (agrupar clientes semelhantes), redução de dimensão |

```python
# Aprendizagem supervisionada: X (os dados) E y (as respostas corretas conhecidas)
X = [[25, 50000], [45, 80000], [30, 45000]]   # ex.: idade, salário
y = ["non", "oui", "non"]                        # ex.: contraiu ou não um crédito

# Aprendizagem não supervisionada: apenas X, sem uma «resposta correta» a aprender
X = [[25, 50000], [45, 80000], [30, 45000]]
```

## O princípio fundamental: separar o treino do teste

Um modelo que «decore» os dados de treino (em vez de aprender o padrão geral subjacente) obteria uma pontuação perfeita nesses dados — mas falharia com dados novos, nunca antes vistos. Para detetar este problema, os dados disponíveis são **sempre separados** em dois conjuntos distintos:

```python
from sklearn.model_selection import train_test_split

X_entrainement, X_test, y_entrainement, y_test = train_test_split(X, y, test_size=0.2)
# 80% para treinar o modelo, 20% reservados, nunca utilizados durante o treino
```

O modelo é, posteriormente, avaliado **apenas** em `X_test` / `y_test`, nunca nos dados que foram utilizados para o treinar.

## Sobreajuste (*overfitting*) e subajuste (*underfitting*)

| | Pontuação no treino | Pontuação no teste |
|---|---|---|
| **Subajuste** (*underfitting*) | Baixo | Baixo — o modelo é demasiado simples para captar o padrão |
| **Bom ajuste** | Elevado | Elevado — o modelo generaliza bem |
| **Sobreaprendizagem** (*overfitting*) | Muito elevado | Baixo — o modelo «memorizou» os dados de treino em vez de aprender um padrão geral |

> **Nota:** uma grande diferença entre a pontuação de treino (excelente) e a pontuação de teste (medíocre) é o sinal clássico de sobreaprendizagem — o modelo memorizou os exemplos específicos em vez da regra geral subjacente a eles, um pouco como um aluno que tenha memorizado as respostas de um exercício específico sem compreender o método.

## A API unificada do scikit-learn: `fit` / `predict`

Independentemente do algoritmo escolhido, o scikit-learn apresenta sistematicamente a mesma interface:

```python
from sklearn.linear_model import LogisticRegression   # classificação: y é categórica («sim»/«não»)

modelo = LogisticRegression()
modelo.fit(X_entrainement, y_entrainement)   # «aprende» a partir dos dados de treino

predictions = modelo.predict(X_test)           # aplica o que foi aprendido a novos dados

modelo.score(X_test, y_test)                    # avalia a qualidade das previsões no teste
```

- `fit(X, y)` : ajusta os parâmetros internos do modelo para que este se adapte da melhor forma possível aos dados fornecidos.
- `predict(X)` : utiliza estes parâmetros aprendidos para gerar uma previsão sobre novos dados.
- Esta interface (`fit` / `predict`) permanece idêntica, bastando substituir `LogisticRegression()` por outro algoritmo (`RandomForestClassifier()`, `KMeans()`...) — o que torna muito fácil testar rapidamente várias abordagens para o mesmo problema.

> **Nota:** a escolha do algoritmo depende do tipo de `y`. Neste caso, `y` é **categórico** (`"oui"` / `"non"`): trata-se de um problema de classificação, pelo que se utiliza `LogisticRegression` (apesar do nome, trata-se de um algoritmo de classificação, não de regressão). `LinearRegression` é utilizado quando «`y`» é um valor **numérico contínuo** a prever (um preço, uma temperatura...) — utilizá-lo em rótulos textuais, como neste caso, provocaria um erro.

## Avaliar a qualidade de um modelo

```python
from sklearn.metrics import accuracy_score, mean_squared_error

accuracy_score(y_test, predictions)       # % de previsões corretas -> para classificação
mean_squared_error(y_test, predictions)    # erro quadrático médio -> para regressão
```

## O fluxo típico de um projeto de aprendizagem automática

1. Recolher e limpar os dados (valores em falta, ver capítulo sobre pandas).
2. Dividir em conjuntos de treino e de teste.
3. Escolher um ou mais algoritmos candidatos e treiná-los (`fit`).
4. Avaliar no conjunto de testes (`predict` + uma métrica adequada ao problema).
5. Ajustar (outro algoritmo, outros parâmetros, mais dados...) e recomeçar.

Ver também o capítulo sobre redes neurais: uma família específica de modelos, mais complexa do que os do scikit-learn, mas baseada exatamente nos mesmos princípios básicos (dados de treino/teste, aprendizagem, generalização).
