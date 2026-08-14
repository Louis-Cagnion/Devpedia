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

## Por que um array NumPy é rápido e uma lista Python não é

Uma lista Python é um array de **ponteiros** para objetos, potencialmente espalhados em qualquer lugar do heap e de tamanhos diferentes. Um laço `for` sobre uma lista Python precisa, a cada iteração: seguir um ponteiro (acesso à memória potencialmente fora do cache), verificar o tipo do objeto apontado, e então chamar a rotina certa: tudo pilotado pelo interpretador, instrução por instrução.

Um [array NumPy](/?c=data-science&p=numpy) (`ndarray`) é um único bloco de memória **contíguo**, contendo os valores em si (não ponteiros), todos do mesmo tipo e do mesmo tamanho. Uma operação vetorizada (`a + b`) delega a um laço **compilado** que percorre esse bloco sequencialmente: as linhas de cache são reaproveitadas ao máximo, e o processador pode empregar instruções SIMD em vários elementos de uma vez. Mesmo número de operações aritméticas, mas um custo marginal por elemento bem inferior.

## A armadilha do `dtype=object`: contíguo não significa uniforme

Um array NumPy criado com tipos heterogêneos (ex. uma mistura de inteiros e strings) recorre a `dtype=object`: o array continua sendo um bloco **contíguo**... de ponteiros para objetos Python potencialmente espalhados, de tipos diferentes. Cada acesso volta a ser um seguir-ponteiro seguido de uma verificação de tipo por elemento: o custo marginal explode e volta a ser comparável ao de uma lista Python, apesar da contiguidade do array em si.

A contiguidade da memória é necessária para aproveitar o cache e o SIMD, mas **não suficiente**: também é preciso que os elementos tenham tamanho e tipo uniformes, para que o processador possa processá-los em bloco sem reverificar cada um individualmente.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um acesso à RAM custa ~50× mais do que um acesso ao cache L1. Dados contíguos e de tipo uniforme (array tipado) se beneficiam do cache e do SIMD; dados dispersos (lista encadeada, objetos espalhados) recarregam uma linha de cache a cada acesso. |
| **Ferramentas utilizáveis** | Um array tipado e contíguo (NumPy `ndarray`) em vez de uma coleção de objetos espalhados para cálculo intensivo. |
| **Armadilhas a evitar** | Um array NumPy em `dtype=object`: continua contíguo em aparência, mas perde todo o benefício do cache/SIMD (ponteiros para objetos dispersos). |
| **Boas práticas** | Preferir um array tipado e contíguo assim que o volume de cálculo justificar o esforço; percorrer os dados na ordem de sua disposição em memória. |
