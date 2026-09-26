---
order: 6
---

# Cache da CPU e vetorização (SIMD)

Os capítulos anteriores tratam do tempo perdido esperando por **outro componente** (rede, disco, serviço remoto). Para cálculo puro (somar números, transformar um array), a mesma distinção [custo fixo / custo marginal](/?c=performance&p=limiter-les-aller-retours) existe, mas o que domina o custo marginal já não é uma latência de rede: é a forma como o processador acessa a memória.

## A hierarquia de cache

Um processador nunca lê a RAM diretamente a cada acesso: vários níveis de memória, cada vez menores e mais rápidos, se intercalam entre ele e a RAM.

| Nível | Tamanho típico | Latência relativa |
|---|---|---|
| Registradores | Algumas dezenas de bytes | ~1 ciclo |
| Cache L1 | 32-64 KB | ~4 ciclos |
| Cache L2 | 256 KB-1 MB | ~15 ciclos |
| Cache L3 | Alguns MB (compartilhado entre núcleos) | ~40 ciclos |
| RAM | Vários GB | ~200 ciclos |

Um **registrador** é um local de armazenamento embutido no próprio processador (não em memória): é ali que ele coloca os valores sobre os quais opera diretamente. Um **ciclo** é o batimento do relógio interno do processador, a unidade de tempo mais fina em que ele pode agir; todas as latências acima são expressas em número de ciclos em vez de segundos, porque esse número permanece estável de uma máquina para outra, ao contrário da duração real de um ciclo (que depende da frequência do processador).

Esses números são ordens de grandeza (variam conforme a arquitetura), mas a proporção entre eles é o que importa: um acesso à RAM custa facilmente 50 vezes mais do que um acesso ao L1. Um programa que multiplica as idas e vindas à RAM em vez de reaproveitar o que já está em cache pode ser dezenas de vezes mais lento, com o número de operações estritamente idêntico.

## Linhas de cache: a memória contígua é "grátis"

O processador nunca carrega um único byte: ele sempre carrega um bloco de tamanho fixo, a **linha de cache** (64 bytes na maioria das arquiteturas atuais), mesmo que apenas um byte desse bloco seja solicitado.

Consequência direta: ler dados **contíguos** (um array percorrido em ordem) se beneficia de linhas já carregadas pelos acessos anteriores: a maioria das leituras quase não custa nada. Ler dados **dispersos** (uma lista encadeada, objetos espalhados no heap) dispara um novo carregamento de linha a cada acesso, sem reaproveitar nada.

> É a mesma unidade (o byte como endereço, o bloco como granularidade de transferência) vista em [A organização dos dados em memória](/?c=representation-des-donnees&p=organisation-en-memoire): o alinhamento e o padding influenciam diretamente quantas linhas de cache uma estrutura ocupa.

## Custo fixo vs custo marginal, aplicado ao cálculo

Chamar uma função vetorizada (`array.sum()`, `array * 2`) tem, como uma chamada de rede, um **custo fixo**: escolher qual rotina de baixo nível executar, alocar o array de resultado: independente do número de elementos `n`. O **custo marginal** (o custo por elemento) depende então de duas coisas: a localidade de memória vista acima, e a capacidade do processador de processar vários elementos por instrução em vez de um só.

É esse segundo ponto que se chama **SIMD** (*Single Instruction, Multiple Data*): uma instrução de processador que aplica a mesma operação a vários valores contíguos de uma vez (ex. somar 8 inteiros em uma única instrução, em vez de 8 instruções separadas). SIMD só é aproveitável se os dados forem **contíguos e de tamanho uniforme**: exatamente o que um array tipado garante, e nunca o que uma coleção de objetos espalhados garante.

## Por que um array NumPy é rápido e uma lista [Python](/?c=langages-de-programmation&s=python&p=python) não é

Uma lista Python é um array de **ponteiros** para objetos, potencialmente espalhados em qualquer lugar do heap e de tamanhos diferentes. Um laço `for` sobre uma lista Python precisa, a cada iteração: seguir um ponteiro (acesso à memória potencialmente fora do cache), verificar o tipo do objeto apontado, e então chamar a rotina certa: tudo pilotado pelo interpretador, instrução por instrução.

Um [array NumPy](/?c=data-science&p=numpy) (`ndarray`) é um único bloco de memória **contíguo**, contendo os valores em si (não ponteiros), todos do mesmo tipo e do mesmo tamanho. Uma operação vetorizada (`a + b`) delega a um laço **compilado** que percorre esse bloco sequencialmente: as linhas de cache são reaproveitadas ao máximo, e o processador pode empregar instruções SIMD em vários elementos de uma vez. Mesmo número de operações aritméticas, mas um custo marginal por elemento bem inferior.

## A armadilha do `dtype=object`: contíguo não significa uniforme

Um array NumPy criado com tipos heterogêneos (ex. uma mistura de inteiros e strings) recorre a `dtype=object`: o array continua sendo um bloco **contíguo**... de ponteiros para objetos Python potencialmente espalhados, de tipos diferentes. Cada acesso volta a ser um seguir-ponteiro seguido de uma verificação de tipo por elemento: o custo marginal explode e volta a ser comparável ao de uma lista Python, apesar da contiguidade do array em si.

A contiguidade da memória é necessária para aproveitar o cache e o SIMD, mas **não suficiente**: também é preciso que os elementos tenham tamanho e tipo uniformes, para que o processador possa processá-los em bloco sem reverificar cada um individualmente.

## Contar os acessos aleatórios à memória, não as instruções

O número de instruções executadas é um mau indicador do tempo real: de acordo com a hierarquia de cache acima, o que custa é o número de acessos **aleatórios** à memória (os que erram o cache), não o número de operações.

Em um solucionador SAT (ver [Os solucionadores SAT e o algoritmo CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)):

| Otimização | Efeito nas instruções | Efeito no tempo |
|---|---|---|
| Busca circular do substituto ([Gent 2013](https://www.jair.org/index.php/jair/article/view/10839)) | Divide por 2,5 o número de literais percorridos | Nenhuma mudança |
| Remover um acesso aleatório à memória por propagação (ver "Filtro por bitmap" mais abaixo) | Muda pouco o número de instruções | −21% |

A primeira otimização reduz o trabalho medido em instruções, mas esse trabalho já estava no cache: menos instruções para o mesmo número de acessos à memória já baratos não muda nada. A segunda remove um acesso que errava o cache a cada propagação: um acesso aleatório a menos pesa mais do que milhares de instruções a menos que, essas sim, já eram baratas.

> Isso se conecta com [Comparar em contadores de trabalho, não só no tempo](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparar-em-contadores-de-trabalho-nao-so-no-tempo): o contador que prevê um ganho em um programa limitado pela memória não é o número de instruções, mas o número de acessos à memória fora do cache.

## Array de estruturas vs estrutura de arrays (AoS/SoA)

Quando um algoritmo lê e escreve juntos dois campos de um mesmo dado a cada etapa (por exemplo a razão e o nível de decisão de uma variável em um solucionador SAT), guardá-los em dois arrays separados (**estrutura de arrays**, *Structure of Arrays*, SoA) custa duas linhas de cache por acesso: uma por array. Guardá-los lado a lado em uma única estrutura, guardada por sua vez em um único array (**array de estruturas**, *Array of Structures*, AoS), faz com que caibam em uma única linha de cache se a estrutura for pequena o suficiente.

| Disposição | O que fica próximo na memória | Linhas de cache tocadas por acesso |
|---|---|---|
| Estrutura de arrays (SoA) | Todos os `razao[i]` juntos, todos os `nivel[i]` juntos, separadamente | 2 |
| Array de estruturas (AoS) | `razao[i]` e `nivel[i]` lado a lado para cada i | 1 |

Nesse solucionador, agrupar a razão e o nível de uma variável em uma única estrutura deu −7%. A regra não é «AoS é sempre melhor que SoA»: a estrutura de arrays continua preferível sempre que um algoritmo percorre um único campo de cada vez em muitos elementos (o caso típico do cálculo vetorial visto antes neste capítulo). A regra é «guardar junto o que é lido e escrito junto».

> Ver também [AoS and SoA (Wikipédia, em inglês)](https://en.wikipedia.org/wiki/AoS_and_SoA) e [A organização dos dados em memória](/?c=representation-des-donnees&p=organisation-en-memoire) para o alinhamento e o padding de uma estrutura.

## Filtro por bitmap

Um **bitmap** (ou *bitset*, array de bits) usa um único bit por elemento em vez de um byte ou mais: 8 elementos cabem em um único byte. Aqui ele serve de filtro: antes de carregar um cabeçalho custoso de um array de 147 MB (bem maior do que qualquer cache), um bit diz se há algo para ler naquele lugar.

| Estrutura consultada | Tamanho | Resultado |
|---|---|---|
| Bitmap (1 bit por elemento) | 575 KB, cabe no cache L2 | Acesso barato, quase sempre em cache |
| Array completo de cabeçalhos | 147 MB | Acesso aleatório à memória custoso (fora do cache) |

Consultar o bitmap antes do cabeçalho evitou 91 % das leituras no array de 147 MB: a maioria dos acessos aleatórios custosos é substituída por um acesso barato em uma estrutura que permanece em cache.

> Princípio geral: filtrar com uma estrutura pequena que caiba em cache, antes de pagar um acesso aleatório em uma estrutura grande demais para caber. Ver também [bit array (Wikipédia, em inglês)](https://en.wikipedia.org/wiki/Bit_array).

## Escrever apenas o que será relido

Escrever não é de graça: para modificar um dado, o processador primeiro carrega a sua linha de cache, como numa leitura, e depois terá de devolvê-la à memória quando ela for despejada do cache. Atualizar um dado que ninguém vai reler é pagar esses acessos à toa.

Em um solucionador SAT (ver [Os solucionadores SAT e o algoritmo CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)), duas estruturas auxiliares, a **fase** registrada de uma variável e sua posição no **heap** de prioridades (ver [a fila de prioridade](/?c=fondamentaux&s=algorithmes&p=file-de-priorite-et-tas-binaire)), só servem às variáveis **decidíveis**: aquelas sobre as quais o solucionador tem o direito de tomar uma decisão (no solucionador Skyscraper, apenas uma parte das variáveis; as outras são sempre deduzidas por propagação). Atualizá-las também para as outras variáveis escreve em linhas de cache que ninguém jamais vai ler. Restringir as duas atualizações às variáveis decidíveis elimina essas escritas; junto com outros ajustes do mesmo tipo, o ganho medido é de alguns por cento, com contadores de trabalho idênticos.

> O princípio se conecta com o filtro por bitmap acima: nos dois casos, a pergunta feita antes de agir é «esse dado será relido?», não só «esse cálculo está correto?».

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um acesso à RAM custa ~50× mais do que um acesso ao cache L1. Dados contíguos e de tipo uniforme (array tipado) se beneficiam do cache e do SIMD; dados dispersos (lista encadeada, objetos espalhados) recarregam uma linha de cache a cada acesso. O número de acessos aleatórios à memória prevê o tempo bem melhor do que o número de instruções. |
| **Ferramentas utilizáveis** | Um array tipado e contíguo (NumPy `ndarray`) em vez de uma coleção de objetos espalhados para cálculo intensivo; um bitmap como filtro barato antes de um acesso aleatório custoso. |
| **Armadilhas a evitar** | Um array NumPy em `dtype=object`: continua contíguo em aparência, mas perde todo o benefício do cache/SIMD (ponteiros para objetos dispersos). |
| **Boas práticas** | Preferir um array tipado e contíguo assim que o volume de cálculo justificar o esforço; percorrer os dados na ordem de sua disposição em memória; guardar junto (AoS) os campos lidos e escritos juntos, separar (SoA) os percorridos um a um em muitos elementos; atualizar apenas os dados ainda úteis. |
