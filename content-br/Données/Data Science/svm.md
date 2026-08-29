---
order: 9
---

# Os SVM (separadores de margem máxima)

Um **SVM** (*Support Vector Machine*, separador de margem máxima) é um algoritmo de classificação que, como as [árvores de decisão](/?c=donnees&s=data-science&p=arbres-de-decision), traça uma fronteira entre categorias, mas escolhe essa fronteira segundo um critério diferente: a maior **margem** possível entre as duas categorias.

## A ideia: a fronteira mais larga possível

Para separar duas espécies de flores (íris) a partir do comprimento e da largura de suas pétalas, **várias retas** podem separar perfeitamente os exemplos de treinamento:

```
largura da pétala
   |     ● ●
   |   ●   ●  ╲
   |  ●         ╲←── várias retas possíveis
   |       ○   ○  ╲
   |     ○   ○      ╲
   +──────────────────── comprimento da pétala
   ● espécie A    ○ espécie B
```

Um SVM não escolhe qualquer uma delas: ele busca aquela que deixa mais espaço vazio de cada lado, a **margem máxima**. Em dados reais de íris, essa margem mede, por exemplo, 1.397 cm: a distância entre a fronteira e o exemplo mais próximo de cada lado.

## Os vetores de suporte: só alguns pontos contam

Uma vez encontrada a fronteira de margem máxima, **apenas os exemplos situados exatamente nas bordas da margem** influenciaram sua posição: são os **vetores de suporte** (*support vectors*), que dão nome ao algoritmo. Todos os outros exemplos, mais distantes da fronteira, poderiam ter sido deslocados ou removidos sem alterar em nada o resultado.

```python
from sklearn.svm import SVC

modelo = SVC(kernel="linear")
modelo.fit(X_treinamento, y_treinamento)

modelo.support_vectors_    # os únicos exemplos que determinam a fronteira (frequentemente um punhado, entre centenas)
```

## O *kernel trick*: quando uma reta não basta

Se as duas categorias não forem separáveis por uma linha reta, um SVM com kernel linear (`kernel="linear"`) atinge um teto (ex.: 60% de classificações corretas em um conjunto de dados não linearmente separável). O **kernel trick** troca de kernel (ex.: `kernel="rbf"`) para transformar implicitamente os dados em um espaço onde uma separação se torna possível, produzindo uma fronteira curva no espaço original:

```python
modelo_curvo = SVC(kernel="rbf")   # kernel RBF : permite uma fronteira curva
modelo_curvo.fit(X_treinamento, y_treinamento)
# pode atingir 100% onde kernel="linear" tinha um teto de 60%, em um problema não linearmente separável
```

Tecnicamente, o kernel evita calcular explicitamente as coordenadas nesse espaço transformado (potencialmente de dimensão muito alta): ele calcula diretamente, por uma fórmula matemática, o quão "próximos" dois pontos estariam depois de transformados, o que basta para o algoritmo sem jamais construir o próprio espaço transformado.

## Armadilha: entradas não escalonadas distorcem a margem

Um SVM mede **distâncias** entre pontos para encontrar a margem máxima: uma característica em milhões (ex.: um salário) esmagaria totalmente uma característica em unidades (ex.: uma idade) nesse cálculo de distância, mesmo que a idade seja igualmente relevante. Ao contrário das árvores de decisão, um SVM precisa, portanto, que todas as entradas sejam colocadas na mesma escala antes do treinamento:

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_escalonado = scaler.fit_transform(X_treinamento)   # centraliza e reduz cada coluna (média 0, desvio-padrão 1)
```

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um SVM traça a fronteira de classificação que maximiza a margem entre categorias; apenas os vetores de suporte (os pontos mais próximos da fronteira) determinam sua posição. |
| **Ferramentas úteis** | `sklearn.svm.SVC`, `kernel="linear"`/`"rbf"`, `.support_vectors_`, `StandardScaler`. |
| **Armadilhas a evitar** | Treinar sem escalonar as entradas (distâncias distorcidas); manter um kernel linear em dados não linearmente separáveis. |
| **Boas práticas** | Escalonar sistematicamente as entradas antes de um SVM; experimentar `kernel="rbf"` se `kernel="linear"` atingir um teto. |
