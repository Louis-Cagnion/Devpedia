---
order: 8
---

# As árvores de decisão

Uma **árvore de decisão** classifica (ou prediz um número, veja mais abaixo) fazendo uma **sequência de perguntas simples** sobre as entradas, cada uma com uma resposta binária, até chegar a uma decisão final. Ao contrário da [regressão logística](/?c=donnees&s=data-science&p=regression-logistique), que combina todas as entradas em uma única fórmula, uma árvore as examina uma a uma, em uma ordem aprendida automaticamente.

## A ideia: uma sequência de perguntas

Um aplicativo de streaming de música quer classificar uma faixa em uma playlist "Esporte" ou não, a partir de 3 características (hip-hop? energética? tarde da noite?).

```
                    Hip-hop?
                   /          \
                 Sim           Não
                  |              |
            Energética?    (não Esporte)
             /       \
           Sim        Não
            |            |
    Tarde da noite?  (não Esporte)
       /        \
     Sim         Não
      |            |
 (não Esporte)  Esporte
```

Cada nó faz uma pergunta sobre **uma única** característica; cada ramo leva a uma nova pergunta ou a uma **folha**: a decisão final.

## O que uma pergunta realmente faz: dividir o espaço em retângulos

Cada pergunta da árvore é literalmente um corte reto no espaço dos dados: "hip-hop?" separa todas as faixas em dois grupos segundo uma única característica, "energética?" subdivide um desses dois grupos segundo outra. Empilhar várias perguntas equivale, portanto, a dividir o espaço em **retângulos** (um retângulo por folha), cada um correspondendo a uma combinação precisa de respostas:

```
energia
   |  Não-Esporte │  Não-Esporte
   |             │
   |─────────────┼─────────────
   |  Não-Esporte │   Esporte
   |             │
   +──────────────────────────── hip-hop (0 = não, 1 = sim)
```

A árvore e essa divisão em retângulos são **o mesmo objeto** visto de duas formas diferentes: ler a árvore de cima para baixo equivale a percorrer os retângulos.

## Em código

```python
from sklearn.tree import DecisionTreeClassifier

# X : [hip-hop (0/1), energética (0/1), tarde da noite (0/1)] ; y : playlist Esporte (1) ou não (0)
X = [[1, 1, 0], [1, 1, 1], [0, 1, 0], [1, 0, 0], [0, 0, 1]]
y = [1, 0, 0, 0, 0]

modelo = DecisionTreeClassifier(max_depth=3)   # max_depth : limita o número de perguntas em cascata
modelo.fit(X, y)

modelo.predict([[1, 1, 0]])           # [1] -> classificado como "Esporte"
modelo.feature_importances_            # importância relativa de cada característica nas escolhas da árvore
```

## Como a árvore escolhe suas perguntas

Em cada nó, o algoritmo testa todas as características e todos os limiares possíveis, e retém a pergunta que torna os dois grupos resultantes os mais **puros** possível (cada grupo contém, tanto quanto possível, uma única categoria, não uma mistura). Essa pureza se mede com a **impureza de Gini** ou a **entropia**, duas fórmulas baseadas nas [probabilidades](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base) de cada categoria em um grupo: quanto mais misturado um grupo (probabilidades próximas entre categorias), mais alta sua impureza. O algoritmo repete essa escolha recursivamente em cada novo grupo, até uma profundidade máxima (`max_depth`) ou folhas já puras.

## Armadilha: uma árvore profunda demais memoriza em vez de aprender

Sem limite de profundidade, uma árvore pode continuar fazendo perguntas até isolar cada exemplo de treinamento em sua própria folha: um score perfeito no treinamento, mas um [sobreajuste](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#sobreajuste-overfitting-e-subajuste-underfitting) severo, já que a árvore aprendeu os exemplos específicos em vez de um padrão geral. `max_depth`, ou um número mínimo de exemplos exigido por folha (`min_samples_leaf`), limitam esse risco.

> **Vantagem a notar:** ao contrário da regressão linear/logística, uma árvore de decisão não precisa de nenhum escalonamento prévio das entradas (uma característica em dezenas e outra em milhões não a perturbam): ela sempre compara uma única característica a um limiar por vez, nunca uma soma ponderada entre elas.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Uma árvore de decisão classifica por meio de uma sequência de perguntas binárias, cada uma um corte reto no espaço dos dados; o conjunto das folhas forma uma divisão em retângulos. |
| **Ferramentas úteis** | `sklearn.tree.DecisionTreeClassifier`, `max_depth`, `min_samples_leaf`, `.feature_importances_`. |
| **Armadilhas a evitar** | Deixar a árvore crescer sem limite (sobreajuste quase garantido). |
| **Boas práticas** | Definir `max_depth`/`min_samples_leaf` desde o início; aproveitar a ausência de escalonamento necessário para esse tipo de modelo. |
