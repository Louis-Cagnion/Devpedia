---
order: 11
---

# Geração paralela de texto: difusão e NCM (31/10/2026)

Um assistente como o [ChatGPT](https://chatgpt.com) (assistente conversacional da OpenAI) escreve sua resposta **um pedaço de palavra depois do outro**, da esquerda para a direita, e não pode escrever o fim antes do começo. Este capítulo explica por que esse método é lento e depois apresenta duas famílias de pesquisa que tentam produzir **muito texto de uma vez**: os modelos de **difusão** e um método publicado em outubro de 2026 chamado **NCM**. O assunto está na **fase de pesquisa**: essas abordagens são melhores em algumas tarefas precisas, ficam atrás na maioria das outras e não substituem os LLM atuais. Os números citados vêm do artigo de pesquisa, do blog de seus autores e da ficha de um modelo, levantados em 31/10/2026; eles vão mudar.

O capítulo supõe conhecidos [os tokens e os LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) (um LLM, *Large Language Model*, é um "grande modelo de linguagem" treinado para prever a continuação de um texto), [o Transformer](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) e [o custo de um LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production).

## Por que um LLM escreve lentamente

### Um token depois do outro

Um **token** é um pedaço de texto: uma palavra curta, uma parte de palavra, um sinal de pontuação (ver [a tokenização](/?c=ia&s=nlp-llm&p=nlp-et-llm#a-tokenizacao-dividir-o-texto)). Um LLM clássico é **autorregressivo**: ele produz o texto token por token, cada novo token sendo calculado **a partir de todos os anteriores**, inclusive os que ele mesmo acabou de escrever. "Regressivo" vem da ideia de se apoiar no que precede, "auto" do fato de que são as próprias saídas do modelo.

O código deste capítulo é escrito em Python (ver [as variáveis](/?c=langages&s=python&p=variables), [as listas](/?c=langages&s=python&p=listes-et-tuples) e [os laços](/?c=langages&s=python&p=boucles)): `print` mostra um valor, `len` dá o comprimento de uma lista, `append` acrescenta um elemento ao seu fim, `round` arredonda um número, `abs` dá o valor absoluto de um número (sua distância até zero, sem sinal) e `if` executa as linhas que seguem apenas se a condição for verdadeira. `while` repete suas linhas enquanto a condição for verdadeira, e `for x in sequência` as repete para cada elemento da sequência. `+=` acrescenta um valor a uma variável (`n += 1` equivale a `n = n + 1`). `lista[3]` lê o elemento de posição 3 (a contagem começa em 0). Uma **tupla** como `(1, 100, 1024)` é uma lista não modificável, e `for nome, passes in` coloca os dois valores de cada elemento em duas variáveis. Os operadores `*`, `/`, `//` e `<` significam multiplicar, dividir, dividir mantendo apenas a parte inteira do resultado, e "é menor que".

```python
# O texto que nosso falso modelo vai "produzir" (um token por elemento da lista)
frase = ["O", "gato", "dorme", "sobre", "o", "tapete", "."]
# O texto escrito até aqui: vazio no início
texto = []
# Contador do número de vezes que o modelo precisa reler todos os seus pesos
leituras_dos_pesos = 0
# Enquanto o texto escrito for mais curto que a frase visada
while len(texto) < len(frase):
    # Cada token obriga a reler o conjunto dos pesos do modelo (explicado abaixo)
    leituras_dos_pesos += 1
    # O falso modelo acrescenta UM único token: o próximo da lista
    texto.append(frase[len(texto)])
# Mostra o texto final e o número de leituras
print(texto, leituras_dos_pesos)
```

Saída obtida: `['O', 'gato', 'dorme', 'sobre', 'o', 'tapete', '.'] 7`. Sete tokens, sete leituras. Não existe atalho: o token 5 não pode ser calculado antes do token 4, pois depende dele.

### Os pesos, a memória e a largura de banda

Os **pesos** (ou **parâmetros**) são os milhões ou bilhões de números aprendidos durante o treinamento, que definem o comportamento do modelo (ver [as redes neurais](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)). Eles ficam armazenados na **memória** da placa gráfica (a GPU, ver [CPU vs GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu)). Para calcular **um único** token, o chip de cálculo precisa ler **quase todos** esses pesos da memória (exceto em um modelo "de mistura de especialistas", explicado com o DiffusionGemma mais abaixo, em que apenas os pesos dos especialistas ativados são lidos).

A **largura de banda de memória** é a quantidade de dados que a memória consegue enviar ao chip por segundo, em gigabytes por segundo (**GB/s**, um gigabyte valendo um bilhão de bytes). Um **bit** é um algarismo binário (0 ou 1), e um **byte** tem 8 bits. Analogia: uma cozinheira muito rápida cujos ingredientes estão num porão. Se ela precisa subir **todo o porão** para cada prato, é a subida da escada que limita o ritmo, não a velocidade com que ela cozinha. Diz-se que o trabalho é limitado pela **memória** (*memory-bound*) e não pelo **cálculo** (*compute-bound*).

```
  Memória (pesos: 16 GB)                     Chip de cálculo
  +------------------------+   leitura    +--------------------+
  | todos os pesos         | -----------> | algumas operações  |
  +------------------------+  por token   | por peso lido      |
          ^                                +----------+---------+
          |                                           |
          +---------- token seguinte, recomeça -------+
```

Uma operação de cálculo custa muito pouco diante do deslocamento de um peso: o chip passa a maior parte do tempo esperando os dados.

### Um cálculo de ordem de grandeza

A fórmula é: **tempo ≈ tamanho do modelo × número de tokens ÷ largura de banda** (≈ : aproximadamente igual a ; × : multiplicado por ; ÷ : dividido por). Ela dá um **mínimo** (apenas o tempo de leitura), pois o resto do trabalho só pode aumentá-lo.

Dados do exemplo: um modelo de **16 GB** de pesos, **1.024 tokens** a produzir, uma placa [NVIDIA GeForce RTX 5090](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/) (placa gráfica do fabricante NVIDIA). Sua largura de banda de memória anunciada pelo fabricante é de **1.792 GB/s**. Ela se deduz da ficha: o **barramento** é o número de fios que transportam bits em paralelo (aqui 512), um **pino** é um desses fios de conexão do chip, um **gigabit** é um bilhão de bits, e a **GDDR7** é um tipo de memória gráfica, aqui a 28 gigabits por segundo e por pino: 512 × 28 ÷ 8 = 1.792 (divide-se por 8 para passar de bits a bytes). Esse valor não pôde ser conferido novamente na ficha oficial da NVIDIA na data de redação: verificar antes de usá-lo.

```python
# Largura de banda em GB/s: 512 bits de largura x 28 gigabits por segundo
# O total é dividido por 8, pois um byte tem 8 bits
largura_de_banda = 512 * 28 / 8
# Mostra a largura de banda usada
print("largura de banda (GB/s):", largura_de_banda)

# Tamanho do modelo em gigabytes (GB)
tamanho_modelo = 16
# Testa três comprimentos de resposta
for nb_tokens in (1, 100, 1024):
    # Fórmula: tamanho do modelo x número de tokens / largura de banda (resultado em segundos)
    tempo = tamanho_modelo * nb_tokens / largura_de_banda
    # Mostra o tempo arredondado com 3 casas decimais
    print(nb_tokens, "tokens ->", round(tempo, 3), "s")
# Número de tokens por segundo: uma leitura completa dos pesos por token
print("tokens por segundo:", round(largura_de_banda / tamanho_modelo, 1))
```

Saída obtida:

```
largura de banda (GB/s): 1792.0
1 tokens -> 0.009 s
100 tokens -> 0.893 s
1024 tokens -> 9.143 s
tokens por segundo: 112.0
```

| Grandeza | Valor | Origem |
|---|---|---|
| Tamanho dos pesos | 16 GB | Hipótese do exemplo |
| Largura de banda de memória | 1.792 GB/s | Ficha do fabricante da RTX 5090 (valor não conferido novamente aqui) |
| Leitura dos pesos para um token | cerca de 8,9 ms | 16 ÷ 1.792 |
| Resposta de 1.024 tokens | cerca de 9,1 s | 1.024 × 8,9 ms |
| Vazão máxima (uma única conversa) | cerca de 112 tokens por segundo | 1.792 ÷ 16 |

Chega-se à ordem de grandeza de "cerca de 9 segundos". O tempo real é maior (cálculo, dados de contexto, software), mas **nunca menor** que essa leitura. Comprar um chip capaz de calcular duas vezes mais rápido não muda quase nada se a memória não envia duas vezes mais dados.

### O agrupamento de requisições (batch)

Um **batch** (em português, "lote") consiste em tratar **várias requisições ao mesmo tempo**: o chip lê os pesos **uma única vez** e os usa para avançar um token em cada uma das conversas do lote. A leitura, que custa caro, é compartilhada.

```python
# Reutiliza a largura de banda e o tamanho do modelo do exemplo anterior
largura_de_banda = 1792
tamanho_modelo = 16
# Testa vários tamanhos de lote (número de conversas tratadas juntas)
for tamanho_lote in (1, 8, 64, 256):
    # Uma leitura dos pesos produz um token por conversa do lote
    vazao = tamanho_lote * largura_de_banda / tamanho_modelo
    # Mostra a vazão máxima total (soma de todas as conversas)
    print("lote", tamanho_lote, "->", round(vazao), "tokens/s (teto)")
```

Saída obtida: 112, 896, 7.168 e 28.672 tokens por segundo. São **tetos teóricos** (o cálculo usa os valores do exemplo): a partir de certo tamanho de lote, o chip não tem mais potência de cálculo suficiente, e cada conversa mantém ainda sua própria **memória de contexto** (o **cache KV**: as chaves e os valores da atenção, já calculados para os tokens anteriores), que não é compartilhada entre elas.

| | Provedor de [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (muitos usuários) | Uso local (uma conversa) |
|---|---|---|
| Requisições simultâneas | Centenas, agrupadas em lotes | Uma só |
| Leituras de pesos compartilhadas | Sim: um custo dividido pelo tamanho do lote | Não: cada token paga sua leitura inteira |
| Fator limitante | Sobretudo o cálculo, a partir de certo lote | A largura de banda de memória |
| Efeito de um modelo que escreveria vários tokens por leitura | Ganho modesto: a leitura já está amortizada | Ganho potencialmente grande |
| Onde a lentidão se sente | Sobretudo na latência (o tempo de espera) de cada usuário | Em tudo |

É por isso que um provedor é pouco sensível a esse gargalo, enquanto a mesma pergunta feita a um modelo executado no próprio computador é lenta. Para o custo de uma chamada do lado do provedor, ver [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production).

## As duas abordagens paralelas

Ideia comum: **produzir vários tokens por leitura dos pesos**. Uma leitura serve então a muitas posições do texto ao mesmo tempo; o cálculo aumenta, mas o número de leituras diminui.

### A difusão de texto

A **difusão** é um método nascido para imagens: parte-se de um resultado cheio de ruído (uma imagem de pixels aleatórios, um **pixel** sendo um ponto de cor da imagem) e um modelo o **limpa** passo a passo até obter uma imagem nítida. Cada etapa é um **passe de remoção de ruído**: o modelo observa a imagem inteira com ruído e produz uma versão um pouco menos ruidosa.

Para texto, o princípio é transposto: parte-se de um **rascunho completo** do texto, cujas posições estão mascaradas ou são aleatórias, e a cada **passe** o modelo **reescreve o rascunho inteiro** de uma vez, tornando-o mais coerente. O número de passes é escolhido antecipadamente e pode ser bem inferior ao número de tokens.

Exemplo utilizável hoje: **DiffusionGemma**, modelo da família Gemma (modelos abertos do Google) cuja [ficha oficial](https://ai.google.dev/gemma/docs/diffusiongemma/model_card) descreve uma remoção de ruído paralela de **blocos de 256 tokens**, com 15 a 20 tokens obtidos por passe.

### NCM: uma pirâmide de códigos

**NCM** significa *Next-Concept Modeling*, "modelagem do conceito seguinte". É um método submetido em 9 de outubro de 2026 por uma equipe ligada à Universidade Stanford. Aqui, um "conceito" **não** é uma ideia no sentido comum: é um **código** escolhido em um dicionário. Ele funciona em duas etapas.

**Etapa 1: fabricar um tokenizador hierárquico.** Um **tokenizador** é o programa que converte um texto em tokens e vice-versa; aqui, ele produz uma hierarquia de códigos. Ele se apoia em um **VQ-VAE** (*Vector Quantized Variational Auto-Encoder*, "auto-codificador variacional com quantização vetorial"). Um VQ-VAE é uma rede neural em três partes: um codificador que comprime um texto, uma **quantização** que substitui cada resultado pelo código mais próximo de um **dicionário** (*codebook*, uma lista fixa de vetores, ou seja, de listas de números; ver [os vetores](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)), e um decodificador que reconstrói o texto a partir dos códigos. O NCM usa uma variante **residual** e **multiescala**: o primeiro nível codifica o texto de forma **grosseira**, o segundo codifica o que **sobra** (o resíduo: o erro do primeiro), o terceiro codifica o que sobra do que sobrou, e assim por diante até o nível mais fino. Cada nível tem seu próprio dicionário. A ideia vem do [VAR](https://arxiv.org/abs/2404.02905) (*Visual AutoRegressive modeling*), um método de geração de imagens.

A versão de brinquedo a seguir codifica **um único número** em três níveis, para ver o princípio (códigos reais são vetores, não números isolados).

```python
# Um dicionário por nível (uma lista de códigos, aqui uma lista Python)
# O nível 1 é grosseiro, o 3 é fino
niveis_de_codigos = [
    [0, 4, 8, 12],
    [-2, -1, 0, 1, 2],
    [-0.5, -0.25, 0, 0.25, 0.5],
]
# O número a codificar
alvo = 7.3
# O que já foi reconstruído até aqui: nada no início
reconstrucao = 0
# Número do nível atual
nivel = 0
# Percorre os dicionários do grosseiro ao fino
for dicionario in niveis_de_codigos:
    # Passa para o nível seguinte
    nivel += 1
    # O resto a codificar: o que a reconstrução ainda não alcançou
    resto = alvo - reconstrucao
    # Supõe primeiro que o primeiro código do dicionário é o melhor
    melhor = dicionario[0]
    # Examina cada código do dicionário
    for codigo in dicionario:
        # abs dá o valor absoluto (distância sem sinal); guarda o código mais próximo
        if abs(codigo - resto) < abs(melhor - resto):
            melhor = codigo
    # O código escolhido é somado à reconstrução
    reconstrucao += melhor
    # Mostra o nível, o código escolhido, a reconstrução acumulada e o erro restante
    print(nivel, "código", melhor, "reconstrução", reconstrucao,
          "erro", round(abs(alvo - reconstrucao), 2))
```

Saída obtida:

```
1 código 8 reconstrução 8 erro 0.7
2 código -1 reconstrução 7 erro 0.3
3 código 0.25 reconstrução 7.25 erro 0.05
```

Cada nível **refina** o anterior: o erro passa de 0,7 para 0,3 e depois para 0,05.

**Etapa 2: gerar.** O tokenizador é **congelado** (não se muda mais). Um Transformer prevê **um nível por vez**: a cada passe, ele escreve **todos os códigos de um nível em paralelo**, apoiando-se na reconstrução acumulada dos níveis já produzidos. Quando a hierarquia está completa, o decodificador do tokenizador a converte em texto. O exemplo de tradução do blog dos autores tem **11 níveis**, portanto 11 passes do Transformer. A hierarquia é **fixa** dentro de uma tarefa (12 avaliações do modelo para o Sudoku, segundo o artigo).

### As três formas de escrever, em esquema

```
Autorregressivo: um token por passe, da esquerda para a direita
  passe 1 : [O] .  .  .  .  .  .
  passe 2 : [O][gato] .  .  .  .  .
  passe 3 : [O][gato][dorme] .  .  .  .      ... 1 passe por token

Difusão: todo o rascunho é reescrito a cada passe
  passe 1 : [?][?][?][?][?][?][?]    rascunho muito borrado
  passe 2 : [O][?][dorme][?][o][?][.]
  passe 3 : [O][gato][dorme][sobre][o][tapete][.]   ... alguns passes

NCM: um nível da pirâmide por passe, sobre todo o texto
  nível 1 (grosseiro) : forma geral do texto
  nível 2             : correção do nível 1
  ...
  nível 11 (fino)     : detalhes         -> decodificador -> texto
```

O esquema da difusão é uma ilustração de princípio: as posições fixadas a cada passe dependem do modelo real.

### Comparativo

| | Autorregressivo | Difusão de texto | NCM |
|---|---|---|---|
| O que faz um passe | Acrescenta um token | Reescreve todo o rascunho | Escreve um nível de códigos para todo o texto |
| Número de passes | Um por token | Escolhido antecipadamente, em geral bem abaixo do número de tokens | Fixo dentro de uma tarefa: um por nível (11 no exemplo de tradução do blog) |
| O que é produzido | Tokens | Tokens | Códigos, convertidos em texto por um decodificador |
| Ordem da escrita | Da esquerda para a direita | Todas as posições juntas | Do grosseiro ao fino |
| Disponibilidade | Em toda parte | Um modelo utilizável: DiffusionGemma | Código e pesos publicados pelos autores (GitHub e Hugging Face) |
| Maturidade | Muito difundida | Pesquisa, um primeiro modelo publicado | Pesquisa, testes de pequeno porte |

Os passes são fáceis de contar: com o modelo de 16 GB do exemplo e uma leitura de 8,9 ms por passe, um texto de 1.024 tokens exige 1.024 passes no autorregressivo. Se um passe de difusão produzisse 16 tokens (valor **inventado** para a ilustração, próximo dos 15 a 20 da ficha do DiffusionGemma), seriam necessários 64; com 11 níveis, o NCM precisa de 11.

```python
# Tempo de leitura dos pesos para um passe: 16 GB / 1792 GB/s
tempo_por_passe = 16 / 1792
# Três cenários, cada um um par (nome, número de passes); os dois últimos são hipóteses.
# 1024 // 16 é a divisão inteira: 64 passes de 16 tokens
cenarios = (
    ("autorregressivo", 1024),
    ("difusão, 16 tokens por passe", 1024 // 16),
    ("NCM, 11 níveis", 11),
)
# Percorre cada cenário
for nome, passes in cenarios:
    # Tempo total de leitura dos pesos (sem cálculo) para este cenário
    print(nome, passes, "passes ->", round(passes * tempo_por_passe, 3), "s")
```

Saída obtida: 9,143 s, 0,571 s e 0,098 s. Atenção: é um cálculo de **leitura apenas**. Um modelo NCM desse tamanho não existe (o maior tem 725 milhões de parâmetros), e cada passe faz mais cálculo que um passe autorregressivo, já que trata muitas posições. O comparativo mostra a **origem** do ganho esperado, não um ganho medido.

## Resultados e limites

### O que o NCM mediu

Os autores comparam o NCM, em uma placa [NVIDIA H100](https://www.nvidia.com/en-us/data-center/h100/) (placa de centro de dados), ao **melhor modelo de difusão de texto**. Eles **não comparam** a velocidade com um modelo autorregressivo: o anúncio "10 a 31 vezes mais rápido" diz respeito à difusão, nunca aos LLM habituais.

[**ROUGE-L**](https://aclanthology.org/W04-1013/) é uma pontuação que mede a sobreposição entre um resumo produzido e um resumo de referência escrito por uma pessoa (ela se baseia na maior sequência de palavras comuns às duas, na mesma ordem). A **perplexidade** mede o quanto um texto "surpreende" um modelo de linguagem: quanto mais baixa, mais previsível o texto é para ele. A **perplexidade generativa** aplica essa medida aos textos que um modelo acabou de gerar, medida por outro modelo, dito de referência (artigo, anexo E.1). Os próprios autores precisam que ela **não mede toda a qualidade**: um texto plano e repetitivo pode obter uma boa perplexidade.

| Conjunto de teste | Tarefa | Resultado anunciado contra o melhor modelo de difusão |
|---|---|---|
| [LM1B](https://arxiv.org/abs/1312.3005) (conjunto de frases) | Gerar texto | 21 vezes mais rápido, melhor perplexidade generativa |
| [OpenWebText](https://skylion007.github.io/OpenWebTextCorpus/) (textos da web) | Gerar texto | 10 vezes mais rápido, qualidade comparável |
| [XSum](https://arxiv.org/abs/1808.08745) (resumos de artigos) | Resumir | 31 vezes mais rápido, com **ROUGE-L igual** |

Outros pontos relatados:

| Ponto | Valor |
|---|---|
| Tamanhos testados | 97 M, 317 M e 725 M de parâmetros (M: milhões), testes descritos como **preliminares** |
| Treinamento | 4 a 5 vezes menos tokens que os modelos de difusão de referência (4,9 vezes no LM1B, 4 vezes no OpenWebText, treinamento do tokenizador e do gerador somados) |
| Tradução (conjunto de teste [WMT14](https://www.statmt.org/wmt14/), alemão e inglês) e resumo | "Desempenho semelhante ou melhor" que os melhores modelos de difusão; nenhuma comparação numérica com um autorregressivo |

### O Sudoku

Um Sudoku é uma grade de 9 × 9 casas a preencher com algarismos de 1 a 9, sem repetição por linha, coluna e **bloco** (um dos nove quadrados de 3 × 3 casas); as **pistas** são os algarismos já colocados. Um programa clássico o resolve por [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) (tentativas e retornos atrás). Aqui, os modelos devem escrever a grade. **MDLM** e **DUO** são dois modelos de difusão de referência citados pelo [artigo](https://arxiv.org/abs/2610.14162). A tabela dá a porcentagem de grades **totalmente resolvidas**, por nível de dificuldade.

| Nível | Autorregressivo | MDLM (difusão) | DUO (difusão) | NCM |
|---|---|---|---|---|
| Fácil (40 pistas) | 14,6 % | 92,0 % | 96,3 % | 99,5 % |
| Médio (35 pistas) | 5,1 % | 77,1 % | 84,7 % | 96,5 % |
| Difícil (30 pistas) | 1,0 % | 30,2 % | 58,4 % | 86,1 % |

O NCM lidera em cada nível, com bem menos **avaliações** do modelo (número de passagens completas pela rede para produzir uma grade): 12 para o NCM contra 128 para o modelo autorregressivo (artigo, tabela 3). Esse resultado diz respeito a uma tarefa **precisa** e nada diz sobre a redação de texto livre. O modelo autorregressivo comparado é um modelo pequeno de 25 milhões de parâmetros, treinado para essa tarefa (artigo, tabela 3). Ler "86,1 % contra 1,0 %" como "o NCM é 86 vezes melhor que os LLM" seria portanto abusivo: nada o equipara a um assistente comercial.

### DiffusionGemma

A ficha do modelo compara a variante **26B A4B** do [DiffusionGemma](https://ai.google.dev/gemma/docs/diffusiongemma/model_card) à variante de mesmo nome do Gemma 4, modelo autorregressivo da mesma família (neste nome, 26B evoca o tamanho total e A4B o número de parâmetros ativos ao mesmo tempo; a ficha informa exatamente 25,2 bilhões no total e 3,8 bilhões ativos). São modelos ditos de **mistura de especialistas**: a rede contém muitas sub-redes especializadas (os especialistas) e, para cada token, apenas algumas são ativadas. Apenas os pesos delas são lidos, daí a diferença entre parâmetros no total e parâmetros ativos. Os testes são concursos ou conjuntos de perguntas padrão.

| Teste | Conteúdo | Gemma 4 26B A4B | DiffusionGemma 26B A4B | Diferença |
|---|---|---|---|---|
| [AIME](https://artofproblemsolving.com/wiki/index.php/American_Invitational_Mathematics_Examination) 2026 (sem ferramentas) | Problemas de matemática de concurso | 88,3 % | 69,1 % | 19,2 pontos percentuais perdidos |
| [LiveCodeBench](https://livecodebench.github.io/) v6 | Problemas de programação | 77,1 % | 69,1 % | 8,0 pontos perdidos |
| [Codeforces](https://codeforces.com/) (classificação ELO) | Concurso de programação | 1.718 | 1.429 | 289 pontos perdidos |
| [GPQA](https://arxiv.org/abs/2311.12022) Diamond | Perguntas de ciências difíceis | 82,3 % | 73,2 % | 9,1 pontos perdidos |
| [MMLU Pro](https://arxiv.org/abs/2406.01574) | Conhecimentos variados | 82,6 % | 77,6 % | 5,0 pontos perdidos |

"Sem ferramentas" significa que o modelo não pode chamar uma calculadora ou um código. O **ELO** é um sistema de classificação: um número mais alto indica um nível melhor. A difusão é portanto **utilizável hoje**, mas ao preço de uma qualidade inferior em cada um desses testes.

Para a velocidade, a ficha menciona 15 a 20 tokens por passe e mais de 1.100 tokens por segundo e por usuário, em lotes pequenos, em H100 com FP8 (ficha consultada em 26/10/2026; FP8 é um formato de números de 8 bits). Um artigo secundário cita 1.107 tokens por segundo contra 303 no autorregressivo, mas esses dois números precisos não aparecem na ficha: eles são **não verificados** e não devem ser retidos.

### Consequência material

Se um passe produz muitos tokens, cada peso lido serve para **muito mais cálculos** antes de ser relido. O trabalho passaria então de "limitado pela largura de banda de memória" para "limitado pelo cálculo". É um raciocínio, não uma medição das fontes lidas. Ele aproxima o uso local de um provedor que já trabalha com lotes: os chips que contariam seriam então os que calculam rápido, um terreno diferente dos chips concebidos contra o gargalo de memória, como o LPU apresentado em [TPU, NPU, LPU e VPU](/?c=infrastructure-devops&s=infrastructure&p=tpu-npu-lpu-vpu).

| | Autorregressivo, uma conversa | Geração paralela (hipótese) |
|---|---|---|
| Gargalo principal | Largura de banda de memória | Potência de cálculo |
| O que ajuda | Memória mais rápida, pesos na memória do chip | Mais unidades de cálculo |
| Leitura dos pesos | Uma por token | Uma por passe |

## O que continua incerto

| Pergunta | Estado |
|---|---|
| O NCM escala para modelos de vários bilhões de parâmetros? | Desconhecido: testes até 725 M, descritos como preliminares pelos autores |
| Como o NCM se compara a um LLM autorregressivo, em velocidade e em qualidade? | Não medido nas fontes lidas |
| A hierarquia fixa limita os textos? | Limite apontado pelos autores, efeitos não detalhados aqui |
| A perplexidade generativa reflete a qualidade real? | Não inteiramente, segundo os autores |
| Os números de 1.107 e de 303 tokens por segundo (DiffusionGemma, autorregressivo) estão corretos? | Não verificados: ausentes da ficha, que fala em mais de 1.100 tokens por segundo |
| A geração paralela se generaliza além de algumas tarefas? | Desconhecido: o DiffusionGemma perde 5,0 a 19,2 pontos percentuais em quatro testes e 289 pontos de ELO no Codeforces (ficha) |

O artigo foi submetido em 9 de outubro de 2026, três semanas antes da redação deste capítulo: os resultados de uma publicação recente e isolada costumam ser confirmados ou corrigidos depois, por outras equipes.

## Fontes consultadas

| Fonte | Endereço |
|---|---|
| Artigo de pesquisa, « Next-Concept Modeling: Fast, Parallel Coarse-to-Fine Text Generation » (9 de outubro de 2026) | [arxiv.org/abs/2610.14162](https://arxiv.org/abs/2610.14162) (arXiv: site público de depósito de artigos de pesquisa) |
| Blog dos autores (Hazy Research) | [hazyresearch.stanford.edu/blog/2026-10-12-ncm](https://hazyresearch.stanford.edu/blog/2026-10-12-ncm) |
| Ficha oficial do DiffusionGemma | [ai.google.dev/gemma/docs/diffusiongemma/model_card](https://ai.google.dev/gemma/docs/diffusiongemma/model_card?hl=pt-br) |
| Código do NCM no [GitHub](/?c=git&p=github-et-plateformes) (plataforma de hospedagem de código) | [github.com/HazyResearch/ncm](https://github.com/HazyResearch/ncm) |
| Pesos do NCM (coleção Hugging Face, indicada pelo README do repositório) | [huggingface.co/hazyresearch](https://huggingface.co/hazyresearch) |

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Ler "31 vezes mais rápido" como "31 vezes mais rápido que o ChatGPT" | A medição compara o NCM ao melhor modelo de **difusão**, nunca a um autorregressivo | Sempre ler o ponto de comparação |
| Concluir pelo fim dos LLM atuais | Os resultados são pontuais, e o DiffusionGemma perde qualidade nos cinco testes citados de sua ficha (diferença de 5,0 a 19,2 pontos percentuais, 289 pontos de ELO no Codeforces) | Apresentar a geração paralela como uma pista de pesquisa |
| Generalizar o Sudoku | Uma tarefa precisa não prevê a qualidade em um texto livre | Citar a tarefa junto com o número |
| Achar que "conceito" designa uma ideia | No NCM, é um código de um dicionário | Dizer "código" |
| Confiar apenas na perplexidade | Ela não mede toda a qualidade | Olhar também pontuações de tarefa (ROUGE-L, resolução) |
| Tomar um teto de vazão por uma medição | O cálculo de leitura apenas ignora o cálculo e a memória de contexto | Medir na máquina real |
| Reutilizar um número de artigo secundário | Ele está ausente da ficha oficial (caso de 1.107 e 303 tokens/s) | Voltar à ficha ou ao artigo |
| Supor que um modelo de pesquisa está pronto para uso | Os pesos do NCM são publicados (README do repositório, Hugging Face), mas são testes de pequeno porte (725 M no máximo) | Ler o README e os limites antes de testar |
| Confundir tamanho do modelo e velocidade | Com o mesmo tamanho, o número de leituras dos pesos decide o tempo | Contar os passes |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Calcular primeiro a ordem de grandeza tamanho × tokens ÷ largura de banda | Saber se uma lentidão vem da memória ou do cálculo |
| Indicar a fonte e a data de todo número de velocidade | As medições mudam rápido e dependem da placa |
| Comparar modelos do mesmo tipo na mesma tarefa | Evitar comparações que não dizem nada |
| Manter um LLM autorregressivo em produção enquanto um modelo paralelo não atingir sua qualidade | As perdas do DiffusionGemma são medidas |
| Distinguir provedor (lotes) e uso local (uma conversa) | O gargalo não é o mesmo em cada caso |
| Ler a seção "limites" de uma publicação antes do resumo | Os autores ali dizem o que não está provado |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um LLM **autorregressivo** escreve um token de cada vez e relê todos os seus pesos para cada um: ele é limitado pela **largura de banda de memória**, não pelo cálculo (modelo de 16 GB, 1.024 tokens, 1.792 GB/s: pelo menos 9,1 s). Um provedor amortiza essas leituras com **lotes**; um uso local com uma só conversa não consegue fazer isso. A **difusão** reescreve todo o rascunho a cada **passe de remoção de ruído** (DiffusionGemma, utilizável, mas 19,2 e 8,0 pontos perdidos no AIME 2026 e no LiveCodeBench v6); o **NCM** codifica o texto por um VQ-VAE residual multiescala e gera um nível de códigos, do grosseiro ao fino, por passe ("31 vezes" medido contra a difusão, Sudoku difícil 86,1 % contra 1,0 %, testes até 725 M de parâmetros). Se a geração paralela se generalizar, o gargalo passaria da memória para o cálculo. Assunto de **pesquisa**. |
| **Armadilhas a evitar** | Confundir "mais rápido que a difusão" com "mais rápido que um LLM"; anunciar o fim dos LLM; generalizar o Sudoku; achar que um "conceito" é uma ideia; julgar só pela perplexidade; reutilizar um número sem fonte primária. |
| **Boas práticas** | Estimar o gargalo pela fórmula tamanho × tokens ÷ largura de banda; datar e citar a fonte de cada número; comparar na mesma tarefa; manter o autorregressivo em produção enquanto a qualidade não for igual; ler as limitações dos autores. |
