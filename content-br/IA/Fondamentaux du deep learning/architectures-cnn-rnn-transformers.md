---
order: 3
---

# Arquiteturas: CNN, RNN e Transformers

A rede "totalmente conectada" do [capítulo sobre os fundamentos](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) (cada neurônio ligado a todos os da camada seguinte) não é a única forma de organizar camadas. Dependendo do tipo de dado tratado (imagem, sequência, texto), certas arquiteturas são muito mais eficientes. Este capítulo apresenta as três famílias mais influentes.

## As redes convolucionais (CNN): para imagens

Uma rede totalmente conectada tratando uma imagem de 1000x1000 pixels exigiria um número enorme de pesos (um peso por pixel, por neurônio da camada seguinte); impraticável, e ignorando uma propriedade essencial das imagens: um padrão (uma borda, um olho, uma textura) mantém o mesmo sentido **onde quer que apareça** na imagem.

Uma **CNN** (*Convolutional Neural Network*) desliza um pequeno **filtro** (uma grade de pesos, ex. 3x3) sobre toda a imagem, reutilizando **os mesmos pesos** em cada posição:

```text
Imagem (trecho)          Filtro (3x3)
1  2  0  1               0  1  0
0  1  1  0        *       1 -1  1     -> um único valor de saída, por posição do filtro
2  0  1  1                0  1  0
```

- O mesmo filtro detecta o mesmo padrão (ex. uma borda vertical) **em qualquer lugar** da imagem: uma propriedade chamada invariância por translação.
- O número de pesos a aprender permanece pequeno (o tamanho do filtro), independentemente do tamanho da imagem.
- As camadas de **pooling** (ex. *max pooling*) reduzem em seguida a resolução mantendo apenas o valor máximo de uma pequena região, o que diminui o volume de cálculo e torna a rede mais robusta a pequenos deslocamentos.

Empilhar várias camadas convolucionais permite que as primeiras detectem padrões simples (bordas, cantos), e que as seguintes os combinem em padrões cada vez mais abstratos (formas, depois objetos inteiros).

> **Cuidado:** usar uma CNN em dados sem estrutura espacial local (um dado tabular clássico, por exemplo, onde cada coluna tem um sentido fixo e diferente das outras): a hipótese central da CNN (um padrão mantém o mesmo sentido onde quer que apareça) não tem então nenhum fundamento.
>
> **Boa prática:** reservar a CNN para dados em que a posição **relativa** importa mas a posição **absoluta** não (imagens, grades, sons representados como espectrograma), não para dados em que cada posição tem um sentido fixo e não intercambiável.

## As redes recorrentes (RNN): para sequências

Uma frase, uma série temporal, um sinal de áudio: esses dados têm uma ordem significativa, que nem uma rede totalmente conectada nem uma CNN tratam naturalmente. Uma **RNN** (*Recurrent Neural Network*) trata uma sequência elemento por elemento, mantendo um **estado oculto** que resume o que foi visto até então:

```text
palavra1 -> [RNN] -> estado1 --\
                                 +-> palavra2 -> [RNN] -> estado2 --\
                                                                       +-> palavra3 -> [RNN] -> estado3 -> saída
```

Cada etapa recebe ao mesmo tempo o elemento atual **e** o estado oculto da etapa anterior: é isso que permite à rede "lembrar" o contexto anterior ao processar uma frase, por exemplo.

### O problema do gradiente que desaparece

Para uma sequência longa, a retropropagação (veja [O treinamento de um modelo e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) precisa percorrer **todas** as etapas anteriores: o gradiente pode se tornar extremamente pequeno (ou extremamente grande) ao longo do caminho, tornando o aprendizado de dependências **distantes** na sequência muito difícil. Variantes como **LSTM** e **GRU** adicionam mecanismos de portas (*gates*) para controlar melhor qual informação manter ou esquecer, atenuando esse problema.

> **Cuidado:** usar uma RNN "simples" (sem portas) em sequências longas onde dependências distantes importam (o início de um parágrafo influencia sua conclusão, por exemplo): o gradiente que desaparece torna esse aprendizado pouco confiável na prática.
>
> **Boa prática:** preferir uma variante com portas (LSTM, GRU) sempre que a sequência for longa e dependências distantes puderem ser importantes para a tarefa.

## Os Transformers: o mecanismo de atenção

Uma RNN trata uma sequência **sequencialmente** (impossível calcular a etapa 5 antes da etapa 4): um freio importante para a paralelização em sequências longas e grandes volumes de dados (veja o cálculo paralelo em [CPU vs GPU](/?c=infrastructure&p=cpu-vs-gpu)). O **Transformer** (2017) substitui a recorrência por um mecanismo de **atenção**: cada elemento da sequência "olha" diretamente para todos os outros (incluindo ele mesmo), ponderando sua importância relativa, sem depender de um estado propagado passo a passo.

```text
"O gato que dorme no sofá é preto"
                            ^
             a atenção permite que "é preto" se conecte diretamente a "gato",
             apesar da distância na frase, sem passar por todas as palavras intermediárias
```

- A atenção pode ser calculada **em paralelo** para toda a sequência (ao contrário de uma RNN), o que permitiu treinar modelos muito maiores, com muito mais dados.
- É essa arquitetura que está na base dos grandes modelos de linguagem (LLM) modernos (veja [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

> **Cuidado:** aplicar um Transformer padrão a uma sequência extremamente longa sem atenção a isso: o custo de cálculo da atenção aumenta mais rápido que o próprio comprimento da sequência (cada elemento olha para todos os outros), ao contrário de uma RNN cujo custo por etapa permanece constante.
>
> **Boa prática:** para uma sequência muito longa, verificar os limites de contexto do modelo usado (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)) em vez de supor que um Transformer absorve qualquer comprimento sem custo adicional.

## Comparativo rápido

| Arquitetura | Tipo de dado adequado | Ponto forte | Limite |
|---|---|---|---|
| **CNN** | Imagens, grades espaciais | Poucos pesos, detecta padrões locais | Menos natural para sequências longas |
| **RNN** (LSTM/GRU) | Sequências (texto, séries temporais) | Modela a ordem e a memória curta | Difícil de paralelizar, dependências distantes fragéis |
| **Transformer** | Sequências, texto, cada vez mais imagens também | Paralelizável, captura dependências longas via atenção | Custo de memória/cálculo elevado em sequências muito longas |

Veja também [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) para a aplicação da arquitetura Transformer ao processamento de linguagem.

## O que reter

| | |
|---|---|
| **O que reter** | A CNN explora a estrutura espacial local das imagens via filtros de pesos compartilhados. A RNN trata uma sequência passo a passo mantendo um estado oculto, mas sofre com o gradiente que desaparece em dependências distantes. O Transformer substitui a recorrência pela atenção, paralelizável e base dos LLMs modernos. |
| **Ferramentas úteis** | As bibliotecas de deep learning fornecem camadas prontas para cada arquitetura (veja [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)). |
| **Armadilhas a evitar** | Usar uma CNN em dados sem estrutura espacial local. Usar uma RNN simples em sequências longas com dependências distantes. Subestimar o custo da atenção em uma sequência muito longa. |
| **Boas práticas** | Escolher a arquitetura de acordo com a estrutura real dos dados (espacial, sequencial curta, sequencial longa), não por hábito. Preferir LSTM/GRU a uma RNN simples sempre que dependências distantes importarem. Verificar os limites de contexto antes de submeter uma sequência muito longa a um Transformer. |
