---
order: 10
---

# Os k vizinhos mais próximos (k-NN)

Ao contrário da [regressão linear](/?c=donnees&s=data-science&p=regression-lineaire), da [regressão logística](/?c=donnees&s=data-science&p=regression-logistique), das [árvores de decisão](/?c=donnees&s=data-science&p=arbres-de-decision) ou dos [SVM](/?c=donnees&s=data-science&p=svm), o algoritmo dos **k vizinhos mais próximos** (*k-Nearest Neighbors*, k-NN) não aprende nenhuma fórmula, nenhuma fronteira, nenhuma regra: no treinamento, ele se limita a **memorizar** todos os dados. Todo o trabalho acontece no momento da predição.

## A ideia: pedir a opinião dos vizinhos mais próximos

Um serviço de streaming quer classificar um novo filme por gênero, com base nos filmes já catalogados. Para um novo filme, o k-NN:

1. Calcula a **distância** entre esse filme e cada um dos filmes já conhecidos (a partir de características numéricas: duração, orçamento, número de cenas de ação detectadas...).
2. Retém os **k** filmes mais próximos (ex.: k = 5).
3. Vota: a categoria majoritária entre esses k vizinhos se torna a predição.

```
    ○ ○
  ○   ○  ×?          × : novo filme a classificar
    ○   ●            k = 5 vizinhos mais próximos destacados
  ●   ○
```

Se 4 dos 5 vizinhos mais próximos são "ficção científica", o novo filme é classificado como "ficção científica". Nenhuma reta, nenhuma curva, nenhuma árvore foi calculada: apenas distâncias e uma votação.

## Em código

```python
from sklearn.neighbors import KNeighborsClassifier

modelo = KNeighborsClassifier(n_neighbors=5)   # k = 5
modelo.fit(X_treinamento, y_treinamento)       # não calcula nada : apenas armazena os dados

modelo.predict([[novo_filme]])                  # calcula as distâncias AGORA, na hora
```

## A armadilha de desempenho: todo o trabalho acontece na predição

Nos algoritmos anteriores, `fit()` faz todo o trabalho custoso uma única vez, e `predict()` depois aplica uma fórmula já pronta (rápida, mesmo com muitos dados novos). Para o k-NN, é o inverso: `fit()` é instantâneo (ele apenas armazena os dados), mas cada chamada a `predict()` precisa recalcular a distância entre o novo ponto e **todos** os exemplos conhecidos.

| Tamanho do catálogo | Tempo por predição |
|---|---|
| 68 filmes | Instantâneo |
| 4.200.000 filmes | Nitidamente mais lento: cada predição recompara o novo filme com os outros 4,2 milhões |

Esse compromisso (nenhum treinamento, mas uma predição cada vez mais custosa à medida que os dados crescem) dá ao k-NN o nome de algoritmo "preguiçoso" (*lazy learning*), em oposição aos algoritmos "eager" (SVM, árvores, regressões) que investem todo o custo computacional em `fit()`.

## Escolher k

| k | Efeito |
|---|---|
| Pequeno demais (ex.: 1) | Muito sensível a ruído: um único vizinho atípico muda a predição ([sobreajuste](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#sobreajuste-overfitting-e-subajuste-underfitting)) |
| Grande demais | Suaviza demais a fronteira entre categorias, a ponto de ignorar padrões locais reais ([subajuste](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#sobreajuste-overfitting-e-subajuste-underfitting)) |
| Equilibrado | Escolhido por [validação cruzada](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#a-validacao-cruzada-cross-validation), testando vários valores |

> **Armadilha:** assim como o [SVM](/?c=donnees&s=data-science&p=svm#armadilha-entradas-nao-escalonadas-distorcem-a-margem), o k-NN depende inteiramente de distâncias: entradas não colocadas na mesma escala (`StandardScaler`) distorcem as distâncias calculadas, exatamente pela mesma razão.

## Comparativo dos 5 algoritmos

| Algoritmo | O que aprende | O que traça | Tipo de saída |
|---|---|---|---|
| [Regressão linear](/?c=donnees&s=data-science&p=regression-lineaire) | Um peso por entrada | Uma reta (ou um plano) | Um número contínuo |
| [Regressão logística](/?c=donnees&s=data-science&p=regression-logistique) | Um peso por entrada + limiar | Uma curva em S (probabilidade) | Uma categoria, com probabilidade |
| [Árvore de decisão](/?c=donnees&s=data-science&p=arbres-de-decision) | Uma sequência de perguntas | Retângulos (cortes retos) | Uma categoria (ou um número) |
| [SVM](/?c=donnees&s=data-science&p=svm) | A fronteira de margem máxima | Uma margem entre categorias | Uma categoria |
| k-NN | Nada (memoriza os dados) | Uma votação entre vizinhos | Uma categoria (ou uma média) |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | O k-NN classifica um novo exemplo por votação majoritária entre seus k vizinhos mais próximos, sem jamais construir um modelo explícito: todo o cálculo acontece na predição, não no treinamento. |
| **Ferramentas úteis** | `sklearn.neighbors.KNeighborsClassifier`, `n_neighbors`, `StandardScaler`. |
| **Armadilhas a evitar** | Usá-lo em um catálogo muito grande sem prever o custo por predição; esquecer de escalonar as entradas. |
| **Boas práticas** | Escolher k por validação cruzada em vez de aleatoriamente; reservar o k-NN para volumes de dados em que uma predição lenta permaneça aceitável. |
