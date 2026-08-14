---
order: 5
---

# Introdução ao machine learning (scikit-learn)

O **machine learning** (aprendizado de máquina) consiste em fazer um programa aprender um comportamento a partir de **dados**, em vez de codificar explicitamente cada regra. Este capítulo estabelece o vocabulário e o fluxo geral de um projeto de ML, antes dos capítulos mais avançados sobre redes neurais.

## Aprendizado supervisionado vs não supervisionado

| | Aprendizado supervisionado | Aprendizado não supervisionado |
|---|---|---|
| Dados | Rotulados (já se conhece a resposta certa para cada exemplo de treinamento) | Não rotulados |
| Objetivo | Prever um rótulo para novos dados | Descobrir uma estrutura oculta nos dados |
| Exemplos de tarefas | Classificação (spam/não spam), regressão (prever um preço) | Clustering (agrupar clientes semelhantes), redução de dimensionalidade |

```python
# Aprendizado supervisionado: X (os dados) E y (as respostas certas conhecidas)
X = [[25, 50000], [45, 80000], [30, 45000]]  # ex: idade, salário
y = ["nao", "sim", "nao"]                    # ex: contratou um empréstimo ou não

# Aprendizado não supervisionado: apenas X, sem "resposta certa" a aprender
X = [[25, 50000], [45, 80000], [30, 45000]]
```

## O princípio fundamental: separar treinamento e teste

Um modelo que "aprende de cor" os dados de treinamento (em vez de aprender o padrão geral subjacente) obteria um score perfeito nesses dados, mas falharia em dados novos, nunca vistos. Para detectar esse problema, **sempre se separam** os dados disponíveis em dois conjuntos distintos:

```python
from sklearn.model_selection import train_test_split

X_treinamento, X_test, y_treinamento, y_test = train_test_split(X, y, test_size=0.2)
# 80% para treinar o modelo, 20% reservados, nunca vistos durante o treinamento
```

O modelo é então avaliado **apenas** com `X_test`/`y_test`, nunca com os dados usados para treiná-lo.

## Um terceiro conjunto: a validação

Ajustar um modelo (comparar vários algoritmos, escolher hiperparâmetros) com base no score obtido em `X_test` equivale a trapacear indiretamente: as escolhas feitas nesse processo acabam influenciadas por esse score, que deixa então de ser um conjunto realmente nunca visto. A prática correta introduz um terceiro conjunto, a **validação**, usado durante o ajuste em vez de no final:

| Conjunto | Papel |
|---|---|
| Treinamento | Ajustar os parâmetros internos do modelo (`fit`) |
| Validação | Comparar modelos/hiperparâmetros entre si, antes de qualquer teste final |
| Teste | Avaliar uma única vez, ao final, o modelo escolhido |

```python
X_treinamento, X_temp, y_treinamento, y_temp = train_test_split(X, y, test_size=0.4)
X_validacao, X_test, y_validacao, y_test = train_test_split(X_temp, y_temp, test_size=0.5)
# 60% treinamento / 20% validação / 20% teste
```

## Sobreajuste (*overfitting*) e subajuste (*underfitting*)

| | Score no treinamento | Score no teste |
|---|---|---|
| **Subajuste** (*underfitting*) | Baixo | Baixo: o modelo é muito simples para capturar o padrão |
| **Bom ajuste** | Alto | Alto: o modelo generaliza bem |
| **Sobreajuste** (*overfitting*) | Muito alto | Baixo: o modelo "memorizou" os dados de treinamento em vez de aprender um padrão geral |

> **Nota:** uma grande diferença entre o score de treinamento (excelente) e o score de teste (mediocre) é o sinal clássico de um sobreajuste: o modelo reteve os exemplos específicos em vez da regra geral que os fundamenta, um pouco como um aluno que memorizou as respostas de um exercício específico sem entender o método.

## A API uniforme do scikit-learn: `fit` / `predict`

Seja qual for o algoritmo escolhido, o scikit-learn expõe sistematicamente a mesma interface:

```python
from sklearn.linear_model import LogisticRegression   # classificação: y é categórico ("sim"/"nao")

modelo = LogisticRegression()
modelo.fit(X_treinamento, y_treinamento)  # "aprende" a partir dos dados de treinamento

predicoes = modelo.predict(X_test)        # aplica o que foi aprendido a novos dados

modelo.score(X_test, y_test)              # avalia a qualidade das predições no teste
```

- `fit(X, y)`: ajusta os parâmetros internos do modelo para que ele se encaixe da melhor forma nos dados fornecidos.
- `predict(X)`: usa esses parâmetros aprendidos para produzir uma predição em novos dados.
- Essa interface (`fit`/`predict`) permanece idêntica ao simplesmente trocar `LogisticRegression()` por outro algoritmo (`RandomForestClassifier()`, `KMeans()`...), o que torna muito fácil testar rapidamente várias abordagens no mesmo problema.

> **Nota:** a escolha do algoritmo depende do tipo de `y`. Aqui `y` é **categórico** (`"sim"`/`"nao"`): é um problema de classificação, daí `LogisticRegression` (apesar do nome, um algoritmo de classificação, não de regressão). `LinearRegression` se usa quando `y` é um valor **numérico contínuo** a prever (um preço, uma temperatura...): usá-lo em rótulos textuais como aqui causaria um erro.

## A validação cruzada (*cross-validation*)

Com poucos dados, reservar 40% para validação+teste (como visto acima) se torna custoso; a validação cruzada resolve esse problema sem sacrificar tantos dados de treinamento:

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(LogisticRegression(), X_treinamento, y_treinamento, cv=5)
# divide X_treinamento em 5 blocos ("folds"); treina 5 vezes, mantendo cada bloco como validação por vez
scores.mean()   # média dos 5 scores -> estimativa mais confiável que uma única divisão treino/validação
```

Cada exemplo serve assim tanto para o treinamento (4 vezes em 5) quanto para a validação (1 vez em 5), sem nunca tocar em `X_test`: a média dos 5 scores suaviza o efeito de uma divisão particularmente favorável ou desfavorável que uma única divisão poderia produzir por acaso.

## Medir a qualidade de um modelo

Para a regressão (`y` numérico contínuo), o erro quadrático médio basta na maioria dos casos:

```python
from sklearn.metrics import mean_squared_error

mean_squared_error(y_test, predicoes)   # erro quadrático médio
```

Para a classificação, a exatidão (`accuracy_score`, % de predições corretas) não basta assim que as classes ficam desbalanceadas: as métricas abaixo levam isso em conta, a partir da **matriz de confusão**.

### A matriz de confusão

Para uma classificação binária (positivo/negativo), cada predição cai em uma dessas quatro casas:

| | Previsto positivo | Previsto negativo |
|---|---|---|
| **Realmente positivo** | Verdadeiro positivo (VP) | Falso negativo (FN) |
| **Realmente negativo** | Falso positivo (FP) | Verdadeiro negativo (VN) |

```python
from sklearn.metrics import confusion_matrix

confusion_matrix(y_test, predicoes)
# [[VN, FP],
#  [FN, VP]]
```

### As métricas derivadas

| Métrica | Fórmula | Responde a |
|---|---|---|
| Exatidão (*accuracy*) | (VP + VN) / total | Do total de predições, qual proporção está correta? |
| Precisão (*precision*) | VP / (VP + FP) | Dos casos previstos como positivos, quantos realmente são? |
| Recall (*recall*, ou sensibilidade) | VP / (VP + FN) | Dos casos realmente positivos, quantos foram detectados? |
| Especificidade (*specificity*) | VN / (VN + FP) | Dos casos realmente negativos, quantos foram corretamente descartados? |
| F1-score | 2 × (precisão × recall) / (precisão + recall) | Média harmônica da precisão e do recall, em um único número |

```python
from sklearn.metrics import precision_score, recall_score, f1_score, classification_report

precision_score(y_test, predicoes)
recall_score(y_test, predicoes)
f1_score(y_test, predicoes)

print(classification_report(y_test, predicoes))   # precisão, recall e F1 ao mesmo tempo, por classe
```

> **Nota:** a exatidão é enganosa em classes desbalanceadas: um detector de fraude que sempre responde "não" atinge 99% de exatidão se 1% das transações forem fraudulentas, embora seja inútil (recall de 0%). Precisão e recall quase sempre se avaliam juntos: aumentar um geralmente se dá em detrimento do outro (deslocar o limiar de decisão para "positivo" aumenta o recall mas reduz a precisão, e vice-versa); o F1-score resume essa troca em um único número, prático para comparar modelos sem arbitrar manualmente entre os dois a cada vez. A especificidade completa o quadro do lado dos negativos: útil quando um falso positivo custa caro (ex.: um exame médico inútil disparado erroneamente), enquanto o recall se concentra no custo de um falso negativo (ex.: uma doença não detectada).

## O fluxo típico de um projeto de machine learning

1. Coletar e limpar os dados (valores ausentes, veja [pandas](/?c=data-science&p=pandas)).
2. Separar em conjuntos de treinamento e teste.
3. Escolher um ou mais algoritmos candidatos, treiná-los (`fit`).
4. Avaliar no conjunto de teste (`predict` + uma métrica adequada ao problema).
5. Ajustar (outro algoritmo, outros parâmetros, mais dados...) e recomeçar.

Veja também o capítulo sobre [as redes neurais](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones): uma família particular de modelos, mais complexa que as do scikit-learn, mas baseada exatamente nos mesmos princípios básicos (dados de treinamento/teste, aprendizado, generalização).

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um modelo se treina em um conjunto de dados separado do conjunto de teste, para detectar se ele generaliza ou "memoriza" (sobreajuste). A API do scikit-learn é uniforme: `fit()` e depois `predict()`, seja qual for o algoritmo. |
| **Ferramentas úteis** | `train_test_split`, `cross_val_score`, matriz de confusão, `precision_score`/`recall_score`/`f1_score`. |
| **Armadilhas a evitar** | Avaliar e ajustar um modelo no mesmo conjunto de teste, repetidamente: equivale a trapacear indiretamente; confiar apenas na exatidão em classes desbalanceadas. |
| **Boas práticas** | Reservar um conjunto de validação para ajustar os hiperparâmetros, deixando o teste final para ser usado apenas uma vez; usar o F1-score para resumir a troca entre precisão e recall. |
