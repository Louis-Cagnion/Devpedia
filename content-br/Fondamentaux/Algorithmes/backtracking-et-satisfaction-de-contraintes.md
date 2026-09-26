---
order: 6
---

# O backtracking e a satisfação de restrições (CSP)

Um [CSP](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem) (*Constraint Satisfaction Problem*, problema de satisfação de restrições) consiste em encontrar um valor para cada **variável** de um problema, dentro de um conjunto de valores possíveis (seu **domínio**), sem violar nenhuma **restrição** entre elas. O [sudoku](https://pt.wikipedia.org/wiki/Sudoku), o [problema das N-rainhas](https://pt.wikipedia.org/wiki/Problema_das_oito_rainhas) (colocar N rainhas em um tabuleiro N×N sem que nenhuma possa capturar outra) e a coloração de grafos (colorir cada nó sem que dois nós vizinhos compartilhem a mesma cor) são todos CSP.

## Tentar de novo em vez de recuar ao acaso: o backtracking

O **backtracking** (busca com retrocesso) explora as soluções possíveis uma variável de cada vez: tenta um valor, **recorre** à variável seguinte (a função chama a si mesma sobre um subproblema menor; veja a ordenação por mistura em [A ordenação por comparação](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) para outro exemplo de recursão), e se nenhum valor funciona para a variável seguinte, **desfaz** a tentativa atual para testar a próxima -- daí o nome "retrocesso".

Exemplo com as N-rainhas, colocando uma rainha por coluna:

```c
int colunas[N]; // colunas[i] = linha onde está a rainha da coluna i

int e_valido(int coluna, int linha)
{
    for (int c = 0; c < coluna; c++)
    {
        if (colunas[c] == linha)                     // mesma linha de uma rainha já colocada
            return 0;
        if (abs(colunas[c] - linha) == coluna - c)    // mesma diagonal
            return 0;
    }
    return 1;
}

int resolver(int coluna)
{
    if (coluna == N)
        return 1; // todas as colunas estão colocadas: solução encontrada

    for (int linha = 0; linha < N; linha++)
    {
        if (e_valido(coluna, linha))
        {
            colunas[coluna] = linha;    // tentativa
            if (resolver(coluna + 1))
                return 1;
            // falha mais adiante: nada a desfazer aqui, a casa é apenas sobrescrita na próxima volta
        }
    }
    return 0; // nenhuma linha funciona: retrocesso para a chamada anterior
}
```

`resolver` tenta cada linha para a coluna atual; se uma linha leva a um beco sem saída mais adiante (`resolver(coluna + 1)` retorna `0`), o laço simplesmente passa para a próxima linha -- esse é todo o mecanismo de retrocesso, sem nenhuma estrutura de dados dedicada. Em um array desordenado usado para representar os candidatos restantes de uma variável, o [swap-remove](/?c=fondamentaux&s=algorithmes&p=swap-remove) permite desfazer um candidato já removido sem nenhuma cópia.

## Escolher a variável certa primeiro: a heurística MRV

Em que ordem tratar as variáveis? A coluna no exemplo acima, mas nada impõe essa ordem. A heurística **MRV** (*Minimum Remaining Values*) escolhe primeiro a variável com **menos** valores possíveis restantes:

| Variável | Valores possíveis restantes | Ordem MRV |
|---|---|---|
| A | 4 valores | 3ª |
| B | 1 valor | 1ª |
| C | 2 valores | 2ª |

Tratar `B` primeiro falha (ou tem sucesso) imediatamente se seu único valor possível já é inválido, em vez de descobrir isso depois de explorar inutilmente `A` e `C` primeiro. Uma variável com um único valor possível que falha corta um ramo inteiro da busca já no primeiro passo: apostar primeiro na variável mais restrita faz os ramos ruins falharem o quanto antes.

## Reduzir os domínios antes mesmo de tentar: a propagação de restrições

O backtracking sozinho tenta e depois desfaz. A **propagação de restrições** vai além: antes (ou durante) a busca, ela reduz diretamente os valores possíveis das variáveis ainda não atribuídas, com base nas já fixadas, até que nenhuma redução adicional seja possível (um **ponto fixo**).

```text
Restrição: coluna A ≠ coluna B (já fixada em 3)

Antes da propagação: A pode ser {1, 2, 3, 4}
Depois da propagação: A pode ser {1, 2, 4}      (3 removido, incompatível com B)
```

Se essa redução esvaziar completamente o domínio de uma variável (nenhum valor permanece possível), o ramo atual é matematicamente impossível -- inútil tentar qualquer coisa, ele é abandonado imediatamente (*fail-fast*, falhar o quanto antes em vez de descobrir isso após vários passos de busca inúteis). Essa técnica de redução até o ponto fixo, combinada com essa detecção de contradição, tem um nome na literatura CSP: [**AC-3**](https://en.wikipedia.org/wiki/AC-3_algorithm) (*Arc Consistency 3*).

| | Só backtracking | + Propagação de restrições (AC-3) |
|---|---|---|
| Detecção da falha | Depois de tentar um valor inválido | Antes mesmo de tentar, se um domínio fica vazio |
| Custo | Menos cálculo por passo | Mais cálculo por passo, mas ramos inteiros evitados |
| Uso típico | Problemas pequenos, poucas restrições cruzadas | Sudoku, planejamento, problemas com fortes restrições cruzadas |

> **Boa prática:** combinar os três -- propagação para eliminar ramos impossíveis cedo, MRV para apostar primeiro na variável mais propensa a falhar rápido, backtracking para explorar o resto -- em vez de depender de um único mecanismo.

## Sobre o que ramificar: uma variável pequena em vez de uma restrição inteira

O MRV diz **qual** variável tratar primeiro, mas antes é preciso escolher **o que conta como variável**. No quebra-cabeça *Skyscraper* (uma grade n × n de alturas 1 a n, cada uma uma vez por linha e por coluna, com dicas de visibilidade na borda), dá para ramificar de duas formas:

| Ramificação | Uma decisão testa | Um fracasso elimina |
|---|---|---|
| Sobre uma **linha** inteira | Uma permutação entre as compatíveis com as dicas (milhares em 10 × 10) | Só essa permutação |
| Sobre uma **casa** | Um valor entre no máximo n | Todas as permutações que põem esse valor nessa casa, de uma vez |

Medido em um solucionador de Skyscraper, com a mesma propagação: a grade 10 × 10 mais difícil passava de 55 s de busca ramificando por linha para 0,14 s ramificando por casa. Um domínio pequeno torna cada fracasso muito mais instrutivo.

> **Nota:** para ir mais longe, ver [Paralelizar uma busca: dividir em subproblemas independentes](/?c=fondamentaux&s=algorithmes&p=recherche-parallele-par-sous-problemes) (explorar vários ramos ao mesmo tempo em vários núcleos) e [Os solucionadores SAT e o algoritmo CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) (aprender com cada fracasso em vez de só voltar atrás).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um CSP busca um valor por variável sem violar nenhuma restrição. O backtracking tenta um valor, recorre, e o desfaz se falhar mais adiante. MRV escolhe primeiro a variável mais restrita. A propagação de restrições (AC-3) reduz os domínios e detecta uma contradição antes mesmo de tentar. |
| **Ferramentas utilizáveis** | Recursão para a exploração; swap-remove para desfazer um candidato removido sem copiar. |
| **Armadilhas a evitar** | Explorar as variáveis em uma ordem arbitrária em vez de com MRV, o que descobre as falhas mais tarde do que o necessário. |
| **Boas práticas** | Combinar backtracking, MRV e propagação de restrições em vez de um único mecanismo isolado; cortar um ramo assim que uma contradição for detectável (fail-fast), sem explorar mais além; ramificar sobre variáveis de domínio pequeno em vez de restrições inteiras. |
