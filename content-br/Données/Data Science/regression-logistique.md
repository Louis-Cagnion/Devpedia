---
order: 7
---

# A regressão logística

Apesar do nome parecido com o da [regressão linear](/?c=donnees&s=data-science&p=regression-lineaire), a regressão logística não prediz um número contínuo, mas uma **categoria**: é um algoritmo de **classificação**. Ela responde a perguntas do tipo "este e-mail é spam?" ou "este assinante vai cancelar?", apoiando-se nas mesmas bases da regressão linear (viés, pesos, `fit`/`predict`, veja [Introdução ao machine learning](/?c=donnees&s=data-science&p=machine-learning-scikit-learn)).

## O problema: uma reta não basta para classificar

Um serviço de assinatura quer prever se um usuário vai **cancelar** (*churn*) a partir do número de dias desde seu último acesso. A saída esperada não é um número qualquer, mas uma **probabilidade**, obrigatoriamente entre 0 e 1 (0% a 100% de chance de cancelar). Uma reta clássica (regressão linear) pode ultrapassar 1 ou descer abaixo de 0 para entradas extremas: um resultado que, então, deixa de fazer sentido como probabilidade.

## A solução: achatar a reta em uma curva em S

A regressão logística primeiro calcula uma soma ponderada clássica (`viés + peso × entrada`, exatamente como a regressão linear), depois passa esse resultado por uma [função matemática](/?c=fondamentaux&s=mathematiques&p=la-fonction-mathematique) particular, a **função sigmoide**, que comprime qualquer número (por maior ou menor que seja) no intervalo ]0, 1[:

```
probabilidade
    1 |                              ●●●●●●
      |                          ●●●
  0.5 |                      ●●
      |                  ●●●
    0 |●●●●●●●●●●●●
      +──────────────────────────────────── dias desde o último acesso
```

```python
import math

def sigmoide(x):
    return 1 / (1 + math.exp(-x))   # achata x no intervalo ]0, 1[, seja qual for x

sigmoide(-10)   # ≈ 0.00005  -> próximo de 0
sigmoide(0)     # 0.5        -> bem no meio
sigmoide(10)    # ≈ 0.99995  -> próximo de 1
```

Para um assinante que não acessa o serviço há 17 dias, o modelo treinado calcula, por exemplo, uma probabilidade de cancelamento de **82%**. Acima de um **limiar de decisão** (0.5 por padrão), o usuário é classificado como "em risco".

## Em código

```python
from sklearn.linear_model import LogisticRegression

# X : dias desde o último acesso ; y : cancelou (1) ou não (0)
X = [[2], [5], [10], [15], [25], [30]]
y = [0, 0, 0, 1, 1, 1]

modelo = LogisticRegression()
modelo.fit(X, y)

modelo.predict([[17]])         # [1] -> classificado como "vai cancelar" (probabilidade > limiar)
modelo.predict_proba([[17]])   # [[0.18, 0.82]] -> [probabilidade de 0, probabilidade de 1]
```

`predict()` já aplica o limiar de 0.5 e retorna diretamente a categoria; `predict_proba()` retorna a probabilidade bruta, útil quando o limiar padrão não é adequado (veja a armadilha abaixo).

## Como o modelo encontra os pesos

Assim como na regressão linear, `fit()` busca os pesos/viés que minimizam um erro, mas o erro quadrático médio (adequado a um número contínuo) não serve para uma probabilidade: a regressão logística usa a **entropia cruzada** (*cross-entropy*), uma função de perda que penaliza fortemente uma predição confiante mas errada (ex.: prever 99% de chance de "não cancelamento" para um usuário que cancela), já detalhada em [o treinamento de um modelo](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient).

## Armadilha: o limiar de 0.5 nem sempre é o certo

Baixar ou subir o limiar de decisão desloca diretamente o compromisso entre precisão e recall (veja [essas métricas](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#medir-a-qualidade-de-um-modelo)): um limiar mais baixo classifica mais usuários como "em risco" (mais recall, menos precisão), um limiar mais alto faz o inverso. Em um problema onde os falsos negativos custam caro (ex.: não identificar um usuário que realmente vai cancelar), baixar o limiar abaixo de 0.5 via `predict_proba()` costuma ser preferível a usar apenas `predict()`, que impõe 0.5 sem discussão.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | A regressão logística classifica uma entrada calculando uma probabilidade (via a função sigmoide), depois comparando-a a um limiar de decisão. Apesar do nome, é um algoritmo de classificação, não de regressão. |
| **Ferramentas úteis** | `sklearn.linear_model.LogisticRegression`, `.predict()` (categoria), `.predict_proba()` (probabilidade bruta). |
| **Armadilhas a evitar** | Confundir com a regressão linear por causa do nome; confiar no limiar padrão de 0.5 sem verificar se ele é adequado ao problema. |
| **Boas práticas** | Usar `predict_proba()` em vez de `predict()` sempre que o custo de um falso negativo e de um falso positivo forem diferentes, para ajustar o limiar de acordo. |
