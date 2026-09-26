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
    """Cláusulas "no máximo k verdadeiras entre xs" e a próxima variável livre."""
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

## Nomear uma subfórmula: variáveis auxiliares definicionais

Uma restrição como "a casa i é visível" se desdobra em uma fórmula longa (ela depende de todas as casas anteriores). Copiá-la a cada vez que é usada faria o tamanho da codificação explodir. A **[transformação de Tseitin](https://doi.org/10.1007/978-3-642-81955-1_28)** (1968) evita isso: inventa-se uma nova variável que **nomeia** a subfórmula, com cláusulas que a obrigam a valer o mesmo que ela nomeia. Essas variáveis não existiam no enunciado do problema: são **definicionais**, acrescentadas apenas para encurtar a codificação.

```python
from itertools import product


def clausulas_tseitin_e(p, a, b):
    """Cláusulas que impõem p <-> (a e b); -x significa "não x"."""
    return [[-p, a], [-p, b], [p, -a, -b]]          # p ⇒ a, p ⇒ b, (a e b) ⇒ p


def satisfeita(clausula, valores):
    """Verdadeiro se pelo menos um literal da cláusula for verdadeiro."""
    return any(valores[abs(lit)] == (lit > 0) for lit in clausula)


acordos = 0
for a, b, p in product((False, True), repeat=3):    # as 8 combinações possíveis
    valores = {1: a, 2: b, 3: p}                      # variáveis: a = 1, b = 2, p = 3
    clausulas_ok = all(satisfeita(c, valores) for c in clausulas_tseitin_e(3, 1, 2))
    acordos += clausulas_ok == (p == (a and b))       # de acordo com a definição de p?
print(f"{acordos}/8 combinações de acordo")
```

```
8/8 combinações de acordo
```

As 3 cláusulas aceitam exatamente as combinações em que p vale "a e b": p é de fato um nome para essa subfórmula. No solucionador Skyscraper, duas subfórmulas são nomeadas assim: "altura máxima vista entre as i primeiras casas de uma linha" e "a casa i é visível". Sem essas duas famílias de variáveis auxiliares, cada restrição de visibilidade voltaria a ser uma fórmula de tamanho proporcional ao número de casas anteriores a ela, em vez de um punhado de cláusulas ligadas a uma variável compartilhada: em uma grade 72 × 72, essas variáveis definicionais representam 68% do total de variáveis da codificação.

## Cláusulas implícitas: recuperadas por cálculo em vez de armazenadas

Algumas famílias de cláusulas têm uma **estrutura regular**: seus literais se deduzem de um índice (número da casa, altura, posição na linha) por uma fórmula simples. Armazená-las uma a uma desperdiça memória com uma informação que poderia ser recalculada. Por isso uma **cláusula implícita** nunca é escrita em um vetor: ela é reconstruída no momento em que o solucionador precisa dela, por cálculo de índices.

Isso complica um ponto específico: quando o solucionador deduz que uma variável é verdadeira, ele precisa lembrar **por quê** (a cláusula que a forçou), para reconstruir esse raciocínio mais tarde durante a análise do conflito. Se a cláusula não está armazenada, essa razão também precisa ser codificada de forma compacta: em 32 bits, alguns bits mais significativos designam a **família** de cláusula envolvida, e os bits restantes carregam o número de uma **variável de ancoragem**, a partir da qual toda a cláusula se recalcula.

| Abordagem | O que é armazenado | Memória (grade 72 × 72) | Velocidade (grade 48 × 48) |
|---|---|---|---|
| Cláusulas enumeradas | Cada literal de cada cláusula regular | 674 MB | referência |
| Cláusulas implícitas (família + ancoragem) | Um código de 32 bits por razão, a cláusula é recalculada | 263 MB | 1,5 vezes mais rápida |

## Propagadores e geração preguiçosa de cláusulas

Um **propagador** é código dedicado a uma restrição global (por exemplo "todas essas variáveis assumem valores diferentes"): em vez de traduzir a restrição em cláusulas de antemão, o solucionador executa diretamente o algoritmo que sabe deduzir suas consequências. O propagador só produz uma **cláusula de explicação** (por que tal variável foi forçada) quando a [análise do conflito](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) precisa dela: a tradução em cláusulas acontece então sob demanda em vez de de uma vez só no início, daí o nome **[geração preguiçosa de cláusulas](https://doi.org/10.1007/s10601-008-9064-x)** (*Lazy Clause Generation*, Ohrimenko, Stuckey e Codish, 2009). As cláusulas implícitas da seção anterior são uma forma simples disso, escrita à mão para uma única restrição; a geração preguiçosa de cláusulas generaliza a ideia para qualquer restrição global por meio de um propagador. É o princípio dos solucionadores híbridos que combinam SAT e programação por restrições, como o [Chuffed](https://github.com/chuffed/chuffed) ou o solucionador CP-SAT do [OR-Tools](https://github.com/google/or-tools).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um mesmo problema pode ser codificado de várias formas corretas, com diferenças de velocidade de um fator de 10 ou mais. A codificação por ordem ("pelo menos v") serve para comparações; "no máximo um" e as contagens têm, cada um, várias codificações. Uma variável auxiliar pode nomear uma subfórmula (Tseitin); uma cláusula de estrutura regular pode ficar implícita (recuperada por cálculo); um propagador pode adiar a tradução em cláusulas até que uma explicação seja pedida (geração preguiçosa de cláusulas). |
| **Ferramentas utilizáveis** | Codificação direta e por ordem, cláusulas de canal; "no máximo um" por pares ou compacto; contador sequencial e totalizer para as cardinalidades; cláusulas redundantes (unitárias quando possível); variáveis auxiliares definicionais; cláusulas implícitas (razão codificada como família + ancoragem); propagadores e geração preguiçosa de cláusulas. |
| **Armadilhas a evitar** | Escolher a codificação mais compacta sem medir (propagação mais lenta); recalcular em cada restrição uma informação que uma variável compartilhada poderia carregar; armazenar uma cláusula de estrutura regular em vez de recalculá-la. |
| **Boas práticas** | Verificar uma codificação por força bruta em tamanhos pequenos; acrescentar as deduções fáceis como cláusulas unitárias; comparar as codificações em muitas instâncias; reservar as cláusulas implícitas e os propagadores a famílias realmente regulares, medidas antes e depois. |
