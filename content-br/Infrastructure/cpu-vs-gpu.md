---
order: 3
---

# CPU vs GPU: o cálculo paralelo

Um computador executa seus cálculos em um ou mais **processadores**, mas existem duas famílias de processadores, projetadas para dois tipos de tarefas muito diferentes: o **CPU** (*Central Processing Unit*), presente em todo computador, e o **GPU** (*Graphics Processing Unit*), originalmente pensado para a exibição gráfica.

## O CPU: poucos operários versáteis e rápidos

Um CPU tem poucos **núcleos** (tipicamente de 4 a algumas dezenas): cada um capaz de executar instruções complexas muito rapidamente, incluindo desvios condicionais (se tal condição, faça isso, senão faça aquilo).

> **Analogia:** uma pequena equipe de poucos operários altamente qualificados, cada um capaz de gerenciar sozinho uma tarefa complexa do início ao fim, se adaptando a cada imprevisto.

## O GPU: milhares de operários simples, ao mesmo tempo

Um GPU, ao contrário, tem **milhares** de núcleos, cada um mais simples e menos versátil que um núcleo de CPU, mas todos capazes de executar a **mesma** operação simultaneamente, cada um em um dado diferente.

> **Analogia:** uma linha de montagem com milhares de operários, cada um repetindo o mesmo gesto simples em uma peça diferente, todos ao mesmo tempo: muito mais rápido para esse tipo de tarefa repetitiva, mas cada operário, isoladamente, só sabe fazer um único gesto.

## Por que o cálculo vetorial se beneficia particularmente da GPU

O [produto escalar](/?c=mathematiques&p=vecteurs-et-produit-scalaire) entre dois vetores (e mais geralmente, qualquer cálculo matricial) repete uma mesma operação simples (multiplicar dois números, somar) milhares ou milhões de vezes, em dados independentes entre si:

```text
Multiplicar dois vetores de 1000 números, termo a termo:

CPU (poucos nucleos)   : processa as 1000 multiplicacoes em varias ondas sucessivas
GPU (milhares de nucleos): pode processar as 1000 multiplicacoes quase todas de uma vez
```

É exatamente esse tipo de cálculo (repetitivo, idêntico, em dados independentes) que compõe quase todas as operações realizadas por uma [rede neural](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones): daí o uso sistemático de uma GPU para o treinamento de um modelo de deep learning.

| | CPU | GPU |
|---|---|---|
| Número de núcleos | Poucos (4 a algumas dezenas) | Milhares |
| Potência por núcleo | Alta, versátil | Baixa, especializada |
| Adequado para | Tarefas sequenciais, lógica complexa, desvios condicionais | Tarefas repetitivas e idênticas, em dados independentes |
| Exemplo de uso | Executar um sistema operacional, um navegador | Treinar uma rede neural, renderização gráfica 3D |

## Cuidado: mover dados entre CPU e GPU tem um custo

O CPU e a GPU têm cada um sua própria memória: fazer a GPU calcular um dado exige **transferi-lo** previamente da memória do CPU, e depois recuperar o resultado no sentido inverso. Essa transferência leva tempo, independentemente da velocidade do cálculo em si.

> **Cuidado:** transferir dados entre CPU e GPU a cada pequena operação. O custo fixo de cada transferência pode superar o ganho de paralelismo obtido, se os dados movidos forem muito pequenos ou se a transferência se repetir com muita frequência.
>
> **Boa prática:** agrupar os dados a processar em um número mínimo de transferências (uma única transferência volumosa em vez de milhares de pequenas), e reservar a GPU para cálculos grandes o suficiente para compensar esse custo de transferência.

## Cuidado: uma GPU não acelera qualquer cálculo

> **Cuidado:** esperar que uma GPU acelere qualquer programa. Um processamento em que cada etapa depende do resultado da anterior (impossível de distribuir entre núcleos independentes), ou que se baseia em muitos desvios condicionais diferentes de acordo com o dado, não se beneficia de milhares de núcleos simples feitos para repetir a mesma operação.
>
> **Boa prática:** reservar a GPU para cálculos realmente paralelizáveis (a mesma operação simples, repetida em um grande número de dados independentes) e deixar o resto para o CPU.

## O que reter

| | |
|---|---|
| **O que reter** | Um CPU tem poucos núcleos versáteis e rápidos, adequados a tarefas sequenciais e desvios condicionais. Uma GPU tem milhares de núcleos simples, adequados a repetir a mesma operação em dados independentes: o caso do cálculo vetorial/matricial por trás de uma rede neural. |
| **Ferramentas úteis** | As bibliotecas de deep learning ([PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch), [TensorFlow](https://www.tensorflow.org)) gerenciam a transferência dos dados para a GPU e a paralelização do cálculo automaticamente. |
| **Armadilhas a evitar** | Transferir dados entre CPU e GPU com muita frequência ou em quantidades muito pequenas. Esperar aceleração de uma GPU em um cálculo intrinsecamente sequencial. |
| **Boas práticas** | Agrupar as transferências CPU/GPU em um número mínimo de operações volumosas. Reservar a GPU para cálculos realmente paralelizáveis. |
