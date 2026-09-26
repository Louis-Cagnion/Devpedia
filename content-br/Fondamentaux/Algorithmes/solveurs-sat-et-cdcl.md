---
order: 8
---

# Os solucionadores SAT e o algoritmo CDCL

Um **solucionador SAT** é um programa genérico que responde a uma única pergunta: "dá para atribuir um valor verdadeiro/falso a cada variável de modo que todas estas regras sejam respeitadas?". Você traduz o seu problema para ele (quebra-cabeça, agenda, verificação de circuito...: ver [Codificar um problema em SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat)) e deixa o solucionador procurar. Ele se apoia no [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes), mas **aprende com cada fracasso**: é o algoritmo **CDCL**.

Exemplo medido em um solucionador do quebra-cabeça *Skyscraper*: o backtracking com propagação empacava em grades 11 × 11, enquanto um solucionador CDCL escrito para a ocasião resolve grades 32 × 32 em menos de um segundo.

## O problema SAT: variáveis verdadeiro/falso e cláusulas

| Termo | Definição | Exemplo |
|---|---|---|
| Variável booleana | Uma incógnita que vale **verdadeiro** ou **falso** | `a`: "a casa 1 contém um 3" |
| Literal | Uma variável ou a sua negação (`¬`, "não") | `a`, `¬a` |
| Cláusula | Vários literais ligados por **OU**: pelo menos um deve ser verdadeiro | `(¬a ∨ b)`: "se `a` é verdadeiro, então `b` também é" |
| Fórmula em **CNF** (*Conjunctive Normal Form*, forma normal conjuntiva) | Várias cláusulas ligadas por **E**: todas devem ser verdadeiras | `(¬a ∨ b) ∧ (¬b ∨ ¬c)` |

O símbolo `∨` se lê "ou", `∧` se lê "e". Uma cláusula como `(¬a ∨ b)` expressa uma regra "se... então": ela só é falsa se `a` for verdadeiro e `b` falso.

O problema SAT é **NP-completo**: nenhum algoritmo conhecido o resolve rapidamente em todos os casos (ver [A complexidade](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)). Na prática, porém, os solucionadores modernos tratam fórmulas com milhões de cláusulas, porque os problemas reais são muito estruturados.

## O formato DIMACS: a língua comum dos solucionadores

Todos os solucionadores leem o mesmo formato de texto, **DIMACS**. As variáveis são numeradas a partir de 1, um número negativo é uma negação e cada cláusula termina com `0`:

```
c a=1 b=2 c=3 d=4 x=5 y=6     <- linha "c": comentário
p cnf 6 5                     <- cabeçalho: 6 variáveis, 5 cláusulas
-1 2 0                        <- (¬a ∨ b)
-1 3 0                        <- (¬a ∨ c)
-2 -3 4 0                     <- (¬b ∨ ¬c ∨ d)
-2 -4 0                       <- (¬b ∨ ¬d)
-5 6 0                        <- (¬x ∨ y)
```

Resposta do solucionador [kissat](https://github.com/arminbiere/kissat) para este arquivo:

```
s SATISFIABLE                 <- existe uma solução
v -1 -2 -3 -4 -5 -6 0         <- a solução: todas as variáveis falsas
```

O código de saída do programa vale `10` se existe uma solução e `20` caso contrário (`s UNSATISFIABLE`), o que permite usá-lo a partir de um script.

## A propagação unitária, os níveis e o rastro

Quando todos os literais de uma cláusula são falsos menos um, este último é **forçado** a verdadeiro: é a **propagação unitária**. Cada escolha livre (uma *decisão*) abre um novo **nível**. O **rastro** (*trail*) anota cada atribuição, o seu nível e a sua **razão** (a cláusula que a forçou).

Na fórmula acima, o solucionador decide primeiro `x = verdadeiro` e depois `a = verdadeiro`:

| Nível | Atribuição | Razão |
|---|---|---|
| 1 | `x = verdadeiro` | decisão |
| 1 | `y = verdadeiro` | `(¬x ∨ y)`: `¬x` é falso, então `y` é forçado |
| 2 | `a = verdadeiro` | decisão |
| 2 | `b = verdadeiro` | `(¬a ∨ b)` |
| 2 | `c = verdadeiro` | `(¬a ∨ c)` |
| 2 | `d = verdadeiro` | `(¬b ∨ ¬c ∨ d)`: `¬b` e `¬c` são falsos |
| 2 | **conflito** | `(¬b ∨ ¬d)`: `¬b` e `¬d` são ambos falsos |

## O conflito e o aprendizado de cláusulas (CDCL)

Um backtracking simples voltaria ao nível anterior e tentaria `a = falso`. O **CDCL** (*Conflict-Driven Clause Learning*, aprendizado de cláusulas guiado por conflitos) procura primeiro **por que** o conflito aconteceu, subindo pelas razões do rastro. A cada passo, combina-se a cláusula atual com a razão de uma das suas variáveis (essa combinação se chama *resolução*):

| Passo | Cláusula atual | Substituída graças à razão de... |
|---|---|---|
| Início | `(¬b ∨ ¬d)` (a cláusula em conflito) | |
| 1 | `(¬b ∨ ¬c)` | `d`, forçada por `(¬b ∨ ¬c ∨ d)` |
| 2 | `(¬b ∨ ¬a)` | `c`, forçada por `(¬a ∨ c)` |
| 3 | `(¬a)` | `b`, forçada por `(¬a ∨ b)` |

Para-se assim que resta **um único** literal do nível do conflito: é o **primeiro ponto de implicação único** (*1UIP*). A cláusula obtida, `(¬a)`, é **aprendida**: adicionada à fórmula, ela diz "`a` nunca pode ser verdadeiro".

O solucionador volta então ao nível mais alto que resta na cláusula aprendida, aqui o nível 0: ele desfaz também a decisão `x = verdadeiro`, que não tinha nada a ver com o conflito. É o **retrocesso não cronológico** (*backjumping*). Em seguida, `(¬a)` força imediatamente `a = falso`.

| | Backtracking | CDCL |
|---|---|---|
| Depois de um fracasso | Tenta o próximo valor no nível anterior | Aprende uma cláusula e salta para o nível útil |
| Memória dos fracassos | Nenhuma: o mesmo beco sem saída pode ser revisitado em outro lugar | Cada cláusula aprendida poda todos os ramos onde a mesma causa se repetiria |
| Retrocesso | Um nível de cada vez | Direto para o nível certo, pulando as decisões sem relação |

Os solucionadores reais depois **minimizam** a cláusula aprendida, retirando os literais já implicados pelos outros (técnica introduzida pelo MiniSat).

## Dois literais vigiados: propagar sem reler tudo

Com milhões de cláusulas, reler cada cláusula a cada atribuição seria lento demais. Cada cláusula **vigia apenas dois** dos seus literais (*two watched literals*):

```
Cláusula (¬b ∨ ¬c ∨ d ∨ e)    vigiados: ¬b e ¬c
  b vira verdadeiro (¬b falso) -> procurar outro literal não falso para vigiar: d
  c vira verdadeiro (¬c falso) -> procurar um substituto: e
  d vira falso               -> não sobra substituto: e é forçado a verdadeiro
```

Enquanto nenhum dos dois literais vigiados for falso, a cláusula não pode forçar nada nem estar em conflito: ela não é examinada. E no retrocesso **não há nada a desfazer**: literais que voltam a ficar livres continuam sendo bons candidatos para vigiar.

## Escolher a variável: VSIDS e salvamento de fase

| Mecanismo | Princípio | Por quê |
|---|---|---|
| **VSIDS** (*Variable State Independent Decaying Sum*) | Cada variável tem uma **atividade**, aumentada quando participa de um conflito e que depois "se desgasta" com o tempo. Decide-se sempre pela mais ativa. | Concentra a busca na parte difícil do problema, a que está produzindo conflitos agora. |
| Decaimento pelo incremento | Em vez de diminuir todas as atividades a cada conflito, **aumenta-se** o valor somado às seguintes (×1,05 por conflito), e tudo é reescalado antes de ultrapassar a capacidade de um número de ponto flutuante. | Mesmo efeito, com custo constante por conflito. |
| Heap binário | Estrutura que dá a variável mais ativa em tempo logarítmico. | Evita percorrer todas as variáveis a cada decisão. |
| **Salvamento de fase** (*phase saving*) | Uma variável retoma o último valor que tinha antes de ser desfeita. | Depois de um retrocesso, o solucionador reconstrói rápido as partes que já eram coerentes. |

## Reiniciar e esquecer: Luby e LBD

Um **reinício** desfaz todas as decisões e recomeça do nível 0, **mantendo** as cláusulas aprendidas e as atividades. Ele evita ficar preso por muito tempo em uma região ruim da árvore.

| Estratégia | Quando reiniciar | Medido no solucionador Skyscraper |
|---|---|---|
| **Sequência de Luby** | Depois de 1, 1, 2, 1, 1, 2, 4, 1, 1, 2... vezes uma unidade de conflitos (aqui 300) | A escolhida |
| Glucose | Quando a qualidade recente das cláusulas aprendidas piora | 2 vezes mais lenta |
| Nenhum reinício | Nunca | Todas as seeds testadas em grade 56 × 56 passam de 90 s |

As cláusulas aprendidas se acumulam: metade delas é apagada regularmente, mantendo as melhores segundo o seu **LBD** (*Literal Block Distance*): o número de níveis diferentes entre os seus literais. Uma cláusula de LBD 2 liga apenas duas decisões: ela vai ser útil com frequência.

## As caudas pesadas: algumas instâncias catastróficas

Entre grades do mesmo tamanho, a maioria é resolvida rápido, mas algumas levam 100 vezes mais tempo: o tempo de resolução segue uma distribuição de **cauda pesada** (*heavy-tailed*). Medido no solucionador Skyscraper com grades 72 × 72, em 100 grades:

| Versão | Tempo mediano | Grades acima de 90 s |
|---|---|---|
| Um único solucionador | 13,4 s | 7 |
| 4 cópias do solucionador iniciadas em paralelo, cada uma com uma parte de acaso diferente; a primeira que encontra vence | 9,3 s | 0 |

Os reinícios e o acaso controlado servem justamente para sair dessas trajetórias ruins.

## Os solucionadores de referência

| Solucionador | Contribuição | Link |
|---|---|---|
| MiniSat (Eén e Sörensson, 2003) | Implementação curta e clara de tudo deste capítulo, a referência para aprender | [minisat.se](http://minisat.se/) |
| Glucose (Audemard e Simon, 2009) | Medida LBD e os reinícios associados | [github.com/audemard/glucose](https://github.com/audemard/glucose) |
| kissat (Armin Biere) | Entre os melhores das competições SAT atuais | [github.com/arminbiere/kissat](https://github.com/arminbiere/kissat) |

Medido na codificação do quebra-cabeça (grade 48 × 48, 8 milhões de cláusulas): a configuração padrão do kissat estoura o orçamento, porque as suas simplificações prévias custam mais do que rendem nesse problema volumoso mas fácil; com a opção `--plain`, que as desativa, ele resolve em 2,2 s.

Fontes: Marques-Silva e Sakallah, *GRASP* (1996); Moskewicz et al., *Chaff* (2001); Eén e Sörensson, *An Extensible SAT-solver* (MiniSat, 2003); Audemard e Simon, *Predicting Learnt Clauses Quality in Modern SAT Solvers* (Glucose, 2009); *Handbook of Satisfiability*, 2ª edição (2021).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um solucionador SAT procura valores verdadeiro/falso que satisfaçam uma fórmula em CNF (cláusulas OU ligadas por E). O CDCL acrescenta ao backtracking a análise de cada conflito: uma cláusula aprendida e um retrocesso direto ao nível útil. |
| **Ferramentas utilizáveis** | Formato DIMACS; solucionadores MiniSat, Glucose, kissat; propagação unitária com dois literais vigiados; VSIDS e salvamento de fase; reinícios de Luby; ordenação das cláusulas aprendidas por LBD. |
| **Armadilhas a evitar** | Suprimir os reinícios (instâncias travadas); manter todas as cláusulas aprendidas (memória e propagação mais lentas); supor que as configurações padrão de um solucionador servem para qualquer problema. |
| **Boas práticas** | Começar com um solucionador existente em um arquivo DIMACS antes de escrever o seu; medir em muitas instâncias, não em uma só, por causa das caudas pesadas. |
