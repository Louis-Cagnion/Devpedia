---
order: 8
---

# Contar permutações: fatorial, coeficiente binomial e números de Stirling

A **combinatória** é a arte de **contar sem enumerar tudo**. Na programação, ela serve para prever o tamanho de um problema antes de executá-lo: quantos casos um algoritmo vai examinar, quanta memória será preciso reservar? (ver [A complexidade e a notação Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)).

Exemplo condutor: uma linha do quebra-cabeça **Skyscraper**, que contém prédios de altura 1 a n, cada altura uma única vez; uma dica na borda diz quantos prédios são visíveis desse lado, e um prédio esconde todos os menores que estão atrás dele.

## O fatorial: o número de ordens possíveis

Uma **permutação** é uma maneira de arrumar n elementos distintos em uma ordem. O número delas é o **fatorial** de n, escrito `n!`: n escolhas para o primeiro lugar, n − 1 para o segundo, e assim por diante.

```
n! = n × (n − 1) × ... × 2 × 1          exemplo: 4! = 4 × 3 × 2 × 1 = 24
```

| n | n! |
|---|---|
| 4 | 24 |
| 10 | 3.628.800 |
| 11 | 39.916.800 |
| 13 | 6.227.020.800 |

O fatorial cresce ainda mais rápido que uma exponencial. Consequência medida em um solucionador de Skyscraper que guardava, para cada linha, todas as permutações compatíveis com as suas dicas: em uma grade 12 × 12, a geração já produzia 660 milhões de candidatos (5,3 GB de memória) antes mesmo de buscar.

## O coeficiente binomial: escolher k elementos entre n

O **coeficiente binomial** `C(n, k)` conta as maneiras de escolher k elementos entre n, sem levar a ordem em conta. Por exemplo, escolher 2 coberturas entre 4: `C(4, 2) = 6`.

```
C(n, k) = n! / (k! × (n − k)!)
```

Calcular os três fatoriais logo ultrapassaria a capacidade de um inteiro (`21!` já não cabe em 64 bits). Por isso o cálculo é feito passo a passo, multiplicando e depois dividindo:

```python
def binomial(n, k):
    r = 1
    for i in range(1, k + 1):
        r = r * (n - k + i) // i  # divisão sempre exata: r × (n-k+i) é divisível por i
    return r

print(binomial(4, 2))    # 6
print(binomial(60, 30))  # 118264581564861424, sem nunca calcular 60!
```

A divisão é sempre exata porque, depois do passo i, `r` vale `C(n − k + i, i)`, um número inteiro. Verificado para todos os `n` até 60.

## Os recordes de uma permutação

Um **recorde** é um elemento maior que todos os que vêm antes dele, lendo da esquerda para a direita. No Skyscraper, os recordes são exatamente os prédios **visíveis** a partir da esquerda:

```
permutação: 1  2  4  3
recordes  : 1  2  4        (3 é menor que 4, que vem antes dele)  -> 3 recordes, 3 prédios visíveis
```

## Os números de Stirling de primeira espécie

Quantas permutações de n elementos têm exatamente k recordes? Esse número se chama **número de Stirling de primeira espécie** (sem sinal), escrito `c(n, k)`.

| n \ k | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 1 | 1 | | | | |
| 2 | 1 | 1 | | | |
| 3 | 2 | 3 | 1 | | |
| 4 | 6 | 11 | 6 | 1 | |
| 5 | 24 | 50 | 35 | 10 | 1 |

Cada linha soma `n!` (24 + 50 + 35 + 10 + 1 = 120 = 5!). A tabela é preenchida linha a linha graças a uma **recorrência**, olhando onde está o menor elemento (o 1):

| Posição do 1 | É um recorde? | Número de permutações |
|---|---|---|
| Em primeiro lugar | Sim (nada antes dele), e ele não esconde nada, já que é o menor: os n − 1 outros devem fornecer os k − 1 recordes restantes | `c(n − 1, k − 1)` |
| Em um dos outros n − 1 lugares | Não (um maior vem antes), e ele continua sem esconder nada: os outros devem fornecer os k recordes | `(n − 1) × c(n − 1, k)` |

```python
def stirling1(n):
    """Tabela c[i][j]: número de permutações de i elementos com j recordes."""
    c = [[0] * (n + 1) for _ in range(n + 1)]
    c[0][0] = 1                                          # a permutação vazia: 0 recorde
    for i in range(1, n + 1):
        for j in range(1, i + 1):
            c[i][j] = c[i - 1][j - 1] + (i - 1) * c[i - 1][j]
    return c

print(stirling1(5)[5])  # [0, 24, 50, 35, 10, 1]
```

## Ver dos dois lados ao mesmo tempo

Uma linha de Skyscraper costuma ter uma dica à esquerda (a prédios visíveis) **e** outra à direita (b visíveis). O prédio mais alto, n, é visível dos dois lados. O número de permutações que respeitam as duas dicas é:

```
C(a + b − 2, a − 1) × c(n − 1, a + b − 2)
```

Exemplo: n = 5, a = 2, b = 2 dá `C(2, 1) × c(4, 2) = 2 × 11 = 22`, o que a enumeração das 120 permutações confirma. Fórmula verificada por enumeração para todos os tamanhos até 7.

Uso concreto: conhecer esse número **antes** de gerar os candidatos de uma linha permite reservar exatamente a quantidade certa de memória de uma só vez, em vez de aumentar um array aos poucos.

## Escolher uma ordem de construção que verifique cedo

Para gerar as permutações que respeitam uma dica, a ordem em que os valores são colocados importa:

| Ordem de colocação | Quando se sabe se um prédio é visível? |
|---|---|
| Casas da esquerda para a direita | Visibilidade pela esquerda: na hora. Pela direita: só com a linha completa. |
| Valores do **maior para o menor** | Dos dois lados, assim que ele é colocado: todos os prédios já colocados são mais altos, então ele é visível de um lado se nenhum deles estiver desse lado; e os valores colocados depois, menores, nunca poderão escondê-lo. |

Com a segunda ordem, uma permutação parcial que já ultrapassa uma dica (à esquerda **ou** à direita) é abandonada na hora, junto com todas as suas continuações. Medido no gerador do solucionador Skyscraper: 5 a 6 vezes mais rápido que o preenchimento da esquerda para a direita.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `n!` conta as ordens de n elementos e explode muito rápido; `C(n, k)` conta as escolhas de k entre n; `c(n, k)`, o número de Stirling de primeira espécie, conta as permutações com k recordes (k prédios visíveis). |
| **Ferramentas utilizáveis** | Cálculo incremental do coeficiente binomial; recorrência `c(n, k) = c(n − 1, k − 1) + (n − 1) × c(n − 1, k)`; fórmula com duas dicas `C(a + b − 2, a − 1) × c(n − 1, a + b − 2)`. |
| **Armadilhas a evitar** | Calcular `C(n, k)` passando por três fatoriais (estouro de capacidade); materializar todas as permutações de um problema sem ter contado quantas existem. |
| **Boas práticas** | Contar antes de gerar, para estimar o custo e reservar a memória exata; escolher uma ordem de construção que torne as restrições verificáveis o mais cedo possível; verificar uma fórmula por enumeração em tamanhos pequenos. |
