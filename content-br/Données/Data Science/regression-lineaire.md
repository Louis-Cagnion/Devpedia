---
order: 6
---

# A regressão linear

Este capítulo aplica a um algoritmo específico o vocabulário estabelecido em [Introdução ao machine learning](/?c=donnees&s=data-science&p=machine-learning-scikit-learn) (treinamento/teste, `fit`/`predict`). A **regressão linear** é o mais simples dos algoritmos de machine learning supervisionado: ela prediz um **número** (um valor contínuo) a partir de uma ou várias entradas, traçando a reta que melhor se ajusta a exemplos conhecidos.

## A ideia: encontrar a melhor reta

Uma empresa de entregas quer estimar a duração de uma corrida a partir da distância a percorrer. Em corridas passadas, ela já conhece a distância E a duração real: esses são os dados de treinamento.

```
duração (min)
   50 |                                    ●
   40 |                          ●      ╱
   30 |                 ●     ╱‾
   20 |        ●     ╱‾
   10 |  ●  ╱‾
    0 +──────────────────────────────── distância (km)
      0    5    10   15   20
```

Cada ponto ● é uma corrida passada real. A reta é aquela que passa **o mais próximo possível do conjunto de pontos**, não necessariamente por um único deles: é essa reta que o modelo aprende, e depois reutiliza para prever a duração de uma nova corrida da qual só se conhece a distância.

## A fórmula de uma reta

Uma reta com uma única entrada se escreve:

```
predição = viés + peso × entrada
```

No exemplo da entrega, o treinamento (veja mais abaixo *como* esses dois números são encontrados) dá concretamente:

```
duração = 7.6 + 2.52 × distância
```

- **7.6** (o viés, ou *intercept*): a duração base, incompressível, mesmo para uma distância próxima de 0 (preparação, saída do depósito...).
- **2.52** (o peso, ou *coeficiente*): o número de minutos adicionados por quilômetro extra.

Para uma corrida de 12 km: `duração = 7.6 + 2.52 × 12 = 37.8` minutos.

Com **várias** entradas (distância, mas também número de semáforos no trajeto, hora do dia...), a fórmula adiciona um peso por entrada: `predição = viés + peso1 × entrada1 + peso2 × entrada2 + ...`. É exatamente a [soma ponderada de um produto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) entre o vetor das entradas e o vetor dos pesos aprendidos.

## Em código

```python
from sklearn.linear_model import LinearRegression

# X : distância em km (uma única coluna aqui) ; y : duração real em minutos
X = [[2], [5], [9], [14], [20]]
y = [12, 20, 30, 42, 58]

modelo = LinearRegression()
modelo.fit(X, y)          # encontra o viés e o(s) peso(s) que minimizam o erro (veja mais abaixo)

modelo.intercept_          # 7.6  -> o viés
modelo.coef_                # [2.52] -> um peso por coluna de X

modelo.predict([[12]])     # [37.8] -> predição para uma distância de 12 km
```

## Como o modelo encontra essa reta

Uma infinidade de retas poderia atravessar a nuvem de pontos; `fit()` escolhe aquela que minimiza o **erro quadrático médio** (veja essa métrica em [Introdução ao machine learning](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#medir-a-qualidade-de-um-modelo)) entre as durações previstas e as durações reais dos exemplos de treinamento: a soma dos desvios ao quadrado, a menor possível.

Dois métodos encontram esse mínimo, dependendo do tamanho dos dados:

| Método | Princípio | Usado quando |
|---|---|---|
| Equação normal (forma fechada) | Calcula diretamente o viés/pesos ótimos por uma fórmula matemática, de uma só vez | Poucas colunas (algumas dezenas) |
| Descida do gradiente | Ajusta progressivamente viés/pesos em pequenos passos, na direção que reduz o erro (veja [o treinamento de um modelo](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) | Muitas colunas ou dados: a fórmula direta se torna cara demais para calcular |

`LinearRegression` do scikit-learn usa a equação normal automaticamente; a descida do gradiente serve principalmente para modelos mais complexos (redes neurais).

## Limite: a regressão linear supõe uma relação... linear

O modelo só consegue traçar uma reta (ou um plano, com várias entradas): se a relação real entre as entradas e a saída é uma curva, uma reta jamais conseguirá se ajustar bem a ela, sejam quais forem o viés e os pesos escolhidos. É um caso clássico de [subajuste](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#sobreajuste-overfitting-e-subajuste-underfitting) estrutural, não um problema de dados insuficientes.

> **Armadilha:** aplicar `LinearRegression` a uma saída categórica (ex.: "sim"/"não") em vez de a um número contínuo. O modelo não retornará um erro, mas um número sem significado (ex.: 0.73), inutilizável como categoria: para classificar, veja o próximo capítulo, a [regressão logística](/?c=donnees&s=data-science&p=regression-logistique).

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | A regressão linear prediz um número contínuo traçando a reta (ou o plano) que minimiza o erro quadrático médio sobre os exemplos de treinamento. |
| **Ferramentas úteis** | `sklearn.linear_model.LinearRegression`, `.fit()`, `.predict()`, `.intercept_`, `.coef_`. |
| **Armadilhas a evitar** | Usá-la em uma saída categórica; aplicá-la tal como está a uma relação não linear (subajuste garantido). |
| **Boas práticas** | Verificar visualmente (nuvem de pontos) que a relação parece realmente linear antes de treinar o modelo. |
