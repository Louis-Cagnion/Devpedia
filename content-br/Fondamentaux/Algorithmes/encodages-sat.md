---
order: 9
---

# Codificar um problema em SAT

Um [solucionador SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) só conhece variáveis verdadeiro/falso e cláusulas. **Codificar** um problema é traduzi-lo para essa linguagem. Quase sempre existem várias traduções corretas, e a escolha muda a velocidade de resolução por um fator de 10 ou mais.

Exemplo condutor: o quebra-cabeça **Skyscraper**. Uma grade n × n contém prédios de altura 1 a n, cada altura uma única vez por linha e por coluna. Uma dica na borda de uma linha diz quantos prédios são visíveis desse lado: um prédio esconde todos os menores que estão atrás dele.

```
dica 3 ->  1  2  4  3      vê-se 1, depois 2, depois 4 (o 4 esconde o 3): 3 prédios
```

## Codificação direta ou codificação por ordem

| Codificação | Variáveis para uma casa de altura 1 a 4 | O que uma variável afirma |
|---|---|---|
| **Direta** | `x1, x2, x3, x4` | `x3`: "a casa vale exatamente 3" |
| **Por ordem** | `y2, y3, y4` | `y3`: "a casa vale **pelo menos** 3" |

A codificação por ordem precisa de cláusulas "escada": se a casa vale pelo menos 4, ela vale pelo menos 3 (`¬y4 ∨ y3`), e assim por diante. As duas codificações podem coexistir, ligadas por **cláusulas de canal** (*channeling*): `x3` é verdadeiro exatamente quando `y3` é verdadeiro e `y4` falso.

Por que isso ajuda aqui: a visibilidade é uma questão de **comparações** ("este prédio é mais alto que todos os anteriores?"). Com a codificação por ordem, "mais alto que 3" é uma única variável, compartilhada pelas quatro direções de visão em vez de ser recalculada por cada uma.

| Codificação da visibilidade | Grade 16 × 16 |
|---|---|
| Direta | 0,42 s |
| Por ordem, compartilhada pelas 4 direções | 0,03 s (13 vezes mais rápida) |

## "Pelo menos um" e "no máximo um"

Em uma linha, cada altura aparece **pelo menos uma vez** (ALO, *at least one*) e **no máximo uma vez** (AMO, *at most one*). "Pelo menos um" cabe em uma única cláusula: `(a ∨ b ∨ c ∨ d)`. "No máximo um" pode ser traduzido de várias formas:

```python
from itertools import combinations

def no_maximo_um_pares(xs):
    """Uma cláusula (¬a ∨ ¬b) para cada par de variáveis."""
    return [[-a, -b] for a, b in combinations(xs, 2)]  # -a: literal ¬a, como no DIMACS

print(no_maximo_um_pares([1, 2, 3]))  # [[-1, -2], [-1, -3], [-2, -3]]
```

| Codificação de "no máximo um" | Cláusulas para 100 variáveis | Propagação |
|---|---|---|
| Por pares | 4.950 (n(n-1)/2) | Máxima: assim que uma variável vira verdadeira, todas as outras são forçadas a falso em um passo |
| Compacta (escada, contador) | cerca de 300 | Passa por variáveis auxiliares: vários passos de propagação |

Mais compacto não quer dizer mais rápido: no solucionador Skyscraper, a codificação compacta era **50% mais lenta** que os pares, porque cada dedução precisava de mais passos. A resposta certa depende do problema: é preciso medir.

## Contar: o contador sequencial

"Exatamente k prédios visíveis" é uma **restrição de cardinalidade**: exatamente k variáveis verdadeiras entre n. O **contador sequencial** (Sinz, 2005) acrescenta variáveis auxiliares `s[i][j]` = "entre as i primeiras variáveis, pelo menos j são verdadeiras", como um contador que avança casa após casa:

```python
def no_maximo_k_contador(xs, k, proxima_var):
    """Cláusulas "no máximo k verdadeiras entre xs", e o próximo número de variável livre."""
    n = len(xs)
    # s[i][j]: pelo menos j+1 verdadeiras entre x1..x(i+1)
    s = [[proxima_var + i * k + j for j in range(k)] for i in range(n)]
    clauses = []
    for i in range(n):
        # xi verdadeira => pelo menos 1 verdadeira até aqui
        clauses.append([-xs[i], s[i][0]])
        if i > 0:
            # a contagem nunca diminui
            for j in range(k):
                clauses.append([-s[i - 1][j], s[i][j]])
            # xi verdadeira => a contagem avança 1
            for j in range(1, k):
                clauses.append([-xs[i], -s[i - 1][j - 1], s[i][j]])
            # já há k verdadeiras: xi é proibida
            clauses.append([-xs[i], -s[i - 1][k - 1]])
    return clauses, proxima_var + n * k
```

Verificado por força bruta com 5 variáveis e k = 2: as 21 cláusulas produzidas (com 10 variáveis auxiliares) aceitam exatamente as combinações em que no máximo 2 variáveis são verdadeiras. Para "exatamente k", acrescenta-se o outro sentido ("pelo menos k"). Uma alternativa conhecida é o **totalizer** (Bailleux e Boufkhad, 2003), que conta por uma árvore de pequenos contadores em vez de uma cadeia.

## Acrescentar cláusulas redundantes

Uma cláusula **redundante** (ou *implícita*) já pode ser deduzida das outras: ela não muda o conjunto de soluções. Mesmo assim ajuda o solucionador, porque lhe entrega diretamente uma dedução que ele teria de redescobrir pela busca.

Exemplo: as **regras de borda** do Skyscraper. Com a dica k na borda de uma linha de n casas, a casa na posição d (contando a partir dessa borda, d = 1 para a primeira) vale no máximo n − k + d. Verificado em todas as linhas de 4 casas com a dica 3:

| Casa | Alturas possíveis | Regra: no máximo 4 − 3 + d |
|---|---|---|
| 1 | 1, 2 | 2 |
| 2 | 1, 2, 3 | 3 |
| 3 | 1 a 4 | 4 |

Cada regra vira **cláusulas unitárias** (um único literal, por exemplo "a casa 1 não vale 3"), verdadeiras antes de qualquer busca. Medido no solucionador Skyscraper: 2,4 vezes mais rápido (grade 13 × 13: 0,30 → 0,13 s). Outro fato redundante acrescentado sem custo: o prédio mais alto entre as i primeiras casas de uma linha mede pelo menos i, já que todas têm alturas diferentes.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um mesmo problema pode ser codificado de várias formas corretas, com diferenças de velocidade de um fator de 10 ou mais. A codificação por ordem ("pelo menos v") serve para comparações; "no máximo um" e as contagens têm, cada um, várias codificações. |
| **Ferramentas utilizáveis** | Codificação direta e por ordem, cláusulas de canal; "no máximo um" por pares ou compacto; contador sequencial e totalizer para as cardinalidades; cláusulas redundantes (unitárias quando possível). |
| **Armadilhas a evitar** | Escolher a codificação mais compacta sem medir (propagação mais lenta); recalcular em cada restrição uma informação que uma variável compartilhada poderia carregar. |
| **Boas práticas** | Verificar uma codificação por força bruta em tamanhos pequenos; acrescentar as deduções fáceis como cláusulas unitárias; comparar as codificações em muitas instâncias. |
