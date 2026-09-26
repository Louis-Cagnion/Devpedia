---
order: 11
---

# Os problemas NP-completos: por que um problema "exponencial" é resolvido mesmo assim

Alguns problemas não têm **nenhum algoritmo rápido conhecido** que funcione em todos os casos: eles são chamados de **NP-completos**. Mesmo assim, programas resolvem todos os dias **instâncias** enormes deles (uma instância é um exemplar concreto do problema: uma grade dada, uma fórmula dada). Este capítulo explica o que "NP-completo" quer dizer, o que esse rótulo realmente promete e por que ele não impede de resolver na prática.

Exemplo condutor, medido em um solucionador do quebra-cabeça *Skyscraper* (uma grade n × n de alturas de prédios, veja [Contar permutações](/?c=fondamentaux&s=mathematiques&p=combinatoire-des-permutations)): uma grade 72 × 72 tem um número de preenchimentos possíveis que se escreve com **7.473 algarismos**, e ainda assim um [solucionador CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) a resolve em cerca de **2 milhões de decisões**, ou seja, de escolhas livres do solucionador (mediana sobre 100 grades: 13 segundos).

## Verificar é fácil, encontrar é difícil

| Pergunta | Trabalho necessário para uma grade n × n |
|---|---|
| **Verificar**: esta grade preenchida respeita as regras? | Ler cada casa um número fixo de vezes: `O(n²)` (veja [a notação Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)) |
| **Encontrar**: qual grade respeita as regras? | Nenhum método conhecido garante um tempo razoável em todos os casos |

Verificar que uma grade é um [quadrado latino](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme) (cada valor uma única vez por linha e por coluna), em [Python](/?c=langages&s=python&p=python):

```python
def eh_quadrado_latino(grade):
    n = len(grade)                                   # tamanho: n linhas de n casas
    esperado = set(range(1, n + 1))                  # o conjunto {1, 2, ..., n}
    for linha in grade:                              # cada linha...
        if set(linha) != esperado:                   # ...deve conter 1..n uma vez
            return False                             # um único erro basta para recusar
    for c in range(n):                               # cada coluna...
        coluna = {grade[r][c] for r in range(n)}     # ...reúne seus n valores
        if coluna != esperado:
            return False
    return True                                      # 2 × n × n casas lidas: O(n²)


print(eh_quadrado_latino([[1, 2, 3, 4], [2, 1, 4, 3], [3, 4, 1, 2], [4, 3, 2, 1]]))
print(eh_quadrado_latino([[1, 2, 3, 4], [2, 1, 4, 3], [3, 4, 1, 2], [4, 3, 1, 2]]))
```

```
True
False
```

A segunda grade é recusada: sua última linha coloca 1 e 2 nas colunas 3 e 4, onde a linha 3 já os tinha colocado. Mesmo para uma grade 1.000 × 1.000, essa verificação continua instantânea. Encontrar a grade é outra história.

## As classes P e NP

Um algoritmo é **polinomial** se o seu custo é no máximo `O(nᵏ)` para um número `k` fixo (`O(n)`, `O(n²)`, `O(n³)`...): ele continua utilizável quando `n` cresce. Ao contrário, um custo **exponencial** como `O(2ⁿ)` ou [fatorial](/?c=fondamentaux&s=mathematiques&p=combinatoire-des-permutations#o-fatorial-o-numero-de-ordens-possiveis) como `O(n!)` se torna impossível muito rápido.

| Classe | Definição | Exemplos |
|---|---|---|
| **P** | Problemas que sabemos **resolver** em tempo polinomial | [Ordenar um array](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison), procurar um elemento |
| **NP** | Problemas cuja solução proposta se **verifica** em tempo polinomial | Todos os de P, mais SAT, o Sudoku, o Skyscraper |

O nome NP significa "polinomial não determinístico": um problema de NP seria resolvido em tempo polinomial por uma máquina teórica que sempre adivinhasse a escolha certa em cada etapa. Uma máquina real ainda precisa **procurar** essa escolha certa.

Todo problema de P está em NP (se sabemos resolver rápido, sabemos verificar rápido). A pergunta inversa, **P = NP?** (tudo o que se verifica rápido se resolve rápido?), continua sem resposta: é um dos sete [problemas do milênio](https://www.claymath.org/millennium/p-vs-np/) do instituto Clay, com prêmio de um milhão de dólares. A maioria dos pesquisadores acredita que P ≠ NP.

## NP-completo: os problemas mais difíceis de NP

Uma **redução** transforma qualquer instância de um problema A em uma instância de um problema B, em tempo polinomial, de modo que a resposta de B dê a de A. Resolver B permite então resolver A: B é "pelo menos tão difícil" quanto A.

Exemplo já visto neste site: [codificar um Skyscraper em SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat) é uma redução do Skyscraper para SAT. Um solucionador SAT sabe, portanto, resolver Skyscrapers.

| Termo | Definição | Exemplos |
|---|---|---|
| **NP-difícil** | Pelo menos tão difícil quanto **qualquer** problema de NP (todo problema de NP se reduz a ele) | Encontrar o circuito mais curto do [caixeiro-viajante](https://pt.wikipedia.org/wiki/Problema_do_caixeiro-viajante) (provar que nenhum circuito é mais curto: não se sabe verificar isso rápido) |
| **NP-completo** | NP-difícil **e** em NP | SAT, completar um quadrado latino, o Skyscraper |

```
+------------------------------ NP --------------------------------+
|  +--------- P ---------+     +-------- NP-completos ---------+   |
|  | ordenar um array    |     | SAT, Skyscraper,              |   |
|  | procurar um elemento|     | completar um quadrado latino  |   |
|  +---------------------+     +-------------------------------+   |
+------------------------------------------------------------------+
  (esquema válido se P ≠ NP; os NP-difíceis incluem os
   NP-completos e outros problemas, fora de NP)
```

| Resultado | Referência |
|---|---|
| SAT é o primeiro problema demonstrado NP-completo | Cook, [*The Complexity of Theorem-Proving Procedures*](https://doi.org/10.1145/800157.805047) (1971) |
| 21 problemas clássicos (coloração de grafos, mochila...) são NP-completos, por reduções a partir de SAT | Karp, [*Reducibility Among Combinatorial Problems*](https://doi.org/10.1007/978-1-4684-2001-2_9) (1972) |
| Completar um quadrado latino parcialmente preenchido é NP-completo | Colbourn, [*The Complexity of Completing Partial Latin Squares*](https://doi.org/10.1016/0166-218X(84)90075-1) (1984) |
| O Skyscraper (também chamado de *Building puzzle*) é NP-completo | Iwamoto e Matsui, [*Computational Complexity of Building Puzzles*](https://doi.org/10.1587/transfun.E99.A.1145) (2016) |

Consequência prática: se alguém encontrasse um algoritmo polinomial para **um único** problema NP-completo, todos os problemas de NP se tornariam polinomiais, por redução.

## O que "NP-completo" não diz: pior caso e caso típico

NP-completo fala do **pior caso** (veja a nota sobre o pior caso em [a notação Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)): existem instâncias nas quais nenhum algoritmo conhecido evita uma explosão do tempo de cálculo. Isso não diz nada sobre as instâncias que encontramos de verdade.

| "NP-completo" diz | "NP-completo" não diz |
|---|---|
| Nenhum algoritmo conhecido é rápido em **todas** as instâncias; se P ≠ NP, nenhum jamais será | Que as instâncias reais são difíceis |
| Cada método conhecido tem instâncias nas quais seu tempo explode | Que a busca precisa percorrer todo o espaço de possibilidades |

Tamanho do espaço bruto de um Skyscraper, preenchendo cada linha com uma permutação qualquer (`n!` escolhas por linha, portanto `(n!)ⁿ` grades):

```python
import math

for n in (4, 9, 16, 72):
    algarismos = n * math.log10(math.factorial(n))  # log10((n!)^n) = n × log10(n!)
    print(n, math.floor(algarismos) + 1)            # número de algarismos de (n!)^n
```

| n | `(n!)ⁿ` grades | Comentário |
|---|---|---|
| 4 | 331.776 | Enumerável em uma fração de segundo |
| 9 | cerca de 1,1 × 10⁵⁰ (51 algarismos) | A um bilhão de grades por segundo: cerca de 3 × 10³³ anos |
| 16 | cerca de 1,3 × 10²¹³ (214 algarismos) | |
| 72 | cerca de 4,6 × 10⁷⁴⁷² (7.473 algarismos) | Resolvido em cerca de 2 milhões de decisões |

O número de algarismos é calculado com o [logaritmo](/?c=fondamentaux&s=mathematiques&p=le-logarithme) na base 10, sem nunca calcular o próprio número. A diferença entre 10⁷⁴⁷² e 2 milhões vem do fato de que cada decisão elimina de uma vez famílias inteiras de grades:

| Mecanismo | O que ele elimina |
|---|---|
| [Propagação de restrições](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#reduzir-os-dominios-antes-mesmo-de-tentar-a-propagacao-de-restricoes) | Todos os valores que se tornaram impossíveis após uma decisão, sem testá-los |
| [Cláusulas aprendidas do CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) | Todo ramo futuro que reproduziria a causa de uma falha já encontrada |

## As transições de fase: onde se escondem as instâncias difíceis

Para estudar a dificuldade "típica", sorteamos [fórmulas SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#o-problema-sat-variaveis-verdadeiro-falso-e-clausulas) ao acaso: **fórmulas 3-SAT aleatórias**, em que cada cláusula contém 3 variáveis escolhidas ao acaso, cada uma negada ou não ao acaso. O único ajuste é o número de cláusulas por variável.

Experimento com 40 variáveis e 40 fórmulas por ajuste, resolvidas por um [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) simples sobre as cláusulas ([DPLL](https://doi.org/10.1145/368273.368557), o ancestral do CDCL, sem aprendizado):

```python
import random


def dpll(clausulas, atribuicao, contador):
    contador[0] += 1                                  # um nó da árvore de busca
    restantes = []                                    # cláusulas ainda não satisfeitas
    for clausula in clausulas:
        if any(atribuicao.get(abs(lit)) == (lit > 0) for lit in clausula):
            continue                                  # um literal verdadeiro: satisfeita
        livres = [lit for lit in clausula if abs(lit) not in atribuicao]
        if not livres:
            return False                              # todos os literais falsos: beco
        restantes.append(livres)                      # manter só os literais livres
    if not restantes:
        return True                                   # nada mais a satisfazer: solução
    v = abs(min(restantes, key=len)[0])               # variável da cláusula mais curta
    for valor in (True, False):                       # tentar verdadeiro, depois falso
        atribuicao[v] = valor
        if dpll(restantes, atribuicao, contador):
            return True
        del atribuicao[v]                             # retrocesso
    return False


rng = random.Random(1)                                # semente fixa: resultados reprodutíveis
n = 40                                                # 40 variáveis
for razao in (2, 3, 4, 4.3, 5, 6, 8):
    sat = nos = 0
    for _ in range(40):                               # 40 fórmulas sorteadas por razão
        formula = []
        for _ in range(round(razao * n)):             # razão × n cláusulas de 3 literais
            variaveis = rng.sample(range(1, n + 1), 3)        # 3 variáveis distintas
            formula.append([v * rng.choice((1, -1)) for v in variaveis])  # sinais ao acaso
        contador = [0]
        sat += dpll(formula, {}, contador)
        nos += contador[0]
    print(f"{razao:>3} cláusulas por variável: {sat * 100 // 40:3d} % satisfatíveis, "
          f"{nos // 40:4d} nós em média")
```

```
  2 cláusulas por variável: 100 % satisfatíveis,   46 nós em média
  3 cláusulas por variável: 100 % satisfatíveis,  126 nós em média
  4 cláusulas por variável:  82 % satisfatíveis,  898 nós em média
4.3 cláusulas por variável:  65 % satisfatíveis,  920 nós em média
  5 cláusulas por variável:   7 % satisfatíveis,  948 nós em média
  6 cláusulas por variável:   0 % satisfatíveis,  621 nós em média
  8 cláusulas por variável:   0 % satisfatíveis,  296 nós em média
```

| Zona | Fórmulas | Dificuldade |
|---|---|---|
| Poucas cláusulas por variável | Quase sempre muitas soluções: encontramos rápido uma delas | Fácil |
| **Transição** | Cerca de uma chance em duas de ter solução | **Difícil**: nem solução evidente, nem contradição rápida |
| Muitas cláusulas por variável | Quase nunca há solução, e a contradição aparece rápido | Fácil de refutar |

Esse perfil "fácil, difícil, fácil" se chama **transição de fase**, por analogia com a água que congela a uma temperatura precisa. Para fórmulas 3-SAT grandes, o limiar fica perto de 4,3 cláusulas por variável; com apenas 40 variáveis como aqui, ele é difuso e o pico de dificuldade se espalha de 4 a 5.

| Problema | Limiar de dificuldade medido | Referência |
|---|---|---|
| Vários problemas NP-completos (coloração de grafos, ciclos hamiltonianos...) | Pico de dificuldade no ponto onde a probabilidade de ter solução passa de 1 para 0 | Cheeseman, Kanefsky e Taylor, [*Where the Really Hard Problems Are*](https://www.ijcai.org/Proceedings/91-1/Papers/052.pdf) (1991) |
| 3-SAT aleatório | Perto de 4,3 cláusulas por variável | Mitchell, Selman e Levesque, [*Hard and Easy Distributions of SAT Problems*](https://cdn.aaai.org/AAAI/1992/AAAI92-071.pdf) (1992) |
| Completar um quadrado latino | Perto de 42 % de casas já preenchidas, qualquer que seja o tamanho | Gomes e Selman, [*Problem Structure in the Presence of Perturbations*](https://cdn.aaai.org/AAAI/1997/AAAI97-035.pdf) (1997) |

> **Armadilha:** avaliar um solucionador apenas com instâncias sorteadas longe do limiar (todas fáceis) ou apenas no limiar (todas difíceis) dá uma imagem falsa do seu desempenho. Varie a origem das instâncias de teste, como para [os quadrados latinos](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme).

## O teorema de Hall: quando as casas se bloqueiam entre si

Uma **casa** que não tem mais nenhum valor possível é uma contradição fácil de ver. Mais traiçoeiro: várias casas que ainda têm, cada uma, valores possíveis, mas **não o suficiente para todas juntas**. Exemplo em uma linha onde três casas vazias, por causa das suas colunas, só aceitam estes valores:

| Casa | Valores ainda possíveis |
|---|---|
| A | 2 ou 5 |
| B | 2 ou 5 |
| C | 2 ou 5 |

Cada casa, sozinha, tem escolha. Mas três casas precisam receber três valores **diferentes**, e só têm dois para dividir: é impossível.

O **teorema dos casamentos de Hall** ([P. Hall, 1935](https://doi.org/10.1112/jlms/s1-10.37.26)) diz exatamente quando essa atribuição existe: podemos dar a cada casa um valor da sua lista, sem que duas casas recebam o mesmo, **se e somente se** todo grupo de k casas dispõe, juntas, de pelo menos k valores diferentes. O nome vem da versão original: formar casais em que cada pessoa aceita seu par, sem que duas pessoas tenham o mesmo.

Esse teorema dá um resultado tranquilizador sobre os quadrados latinos ([M. Hall, 1945](https://projecteuclid.org/journals/bulletin-of-the-american-mathematical-society/volume-51/issue-6.P1/An-existence-theorem-for-latin-squares/bams/1183506980.full)): se k linhas **completas** já estão preenchidas sem repetição, sempre é possível completar o quadrado inteiro. O perigo vem das casas preenchidas **espalhadas**. Grade 4 × 4 encontrada por busca exaustiva (5 casas preenchidas):

```
          col 1  col 2  col 3  col 4
linha 1     2      1      .      .
linha 2     .      .      .      4
linha 3     1      3      .      .
linha 4     .      .      .      .
```

| Etapa | Raciocínio |
|---|---|
| 1 | A linha 1 ainda precisa colocar 3 e 4 nas colunas 3 e 4. A coluna 4 já tem um 4: portanto, 4 na coluna 3. |
| 2 | A linha 3 ainda precisa colocar 2 e 4 nas colunas 3 e 4. Mesmo motivo: 4 na coluna 3. |
| 3 | A coluna 3 receberia dois 4: nenhuma solução. |

No entanto, cada casa vazia tem pelo menos um valor possível, e cada linha e cada coluna, **sozinha**, pode ser completada (verificado por programa). A contradição só aparece ao combinar duas linhas e duas colunas.

É o bloqueio observado no solucionador Skyscraper: algumas execuções chegam a 99,8 % das variáveis fixadas e depois ficam travadas por mais de um minuto em 56 casas espalhadas em 7 linhas. Acrescentar ao solucionador um teste de Hall nas linhas e colunas quase cheias (no máximo 16 casas livres) detecta esses becos sem saída mais cedo: medido em grades 104 × 104 sobre as mesmas 18 execuções (9 grades, 2 ajustes do acaso cada uma), 15 terminam dentro do orçamento fixado com esse teste, contra 8 sem ele.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | NP reúne os problemas cuja solução se verifica rápido; os NP-completos são os mais difíceis de NP (SAT, quadrado latino, Skyscraper). NP-completo descreve o pior caso: as instâncias reais costumam ser resolvidas graças à propagação e ao aprendizado, e as instâncias aleatórias difíceis se concentram perto de uma transição de fase. |
| **Ferramentas utilizáveis** | Redução para SAT e depois um solucionador SAT; o logaritmo para estimar o tamanho de um espaço de busca; o teorema de Hall para detectar que um grupo de casas não tem valores suficientes para dividir. |
| **Armadilhas a evitar** | Concluir "NP-completo, portanto impossível na prática"; julgar um solucionador com instâncias todas fáceis ou todas no limiar; verificar as contradições apenas casa por casa. |
| **Boas práticas** | Verificar uma solução com um programa separado, simples e polinomial; medir com instâncias de origens variadas; procurar as contradições entre grupos de casas, não apenas em uma casa isolada. |
