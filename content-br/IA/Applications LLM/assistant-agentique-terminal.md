---
order: 2
---

# O assistente de IA agêntico no terminal: além do prompt simples

Os capítulos anteriores cobrem separadamente os blocos de um assistente LLM moderno: as [ferramentas e o loop de agente](/?c=ia&s=nlp-llm&p=agents), o [RAG](/?c=ia&s=nlp-llm&p=rag), o [prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering), os [limites de produção](/?c=ia&s=nlp-llm&p=llm-en-production). Este capítulo não os repete: ele reúne o que ainda falta para entender como um assistente que trabalha em um terminal (capaz de ler e modificar arquivos, executar comandos, buscar na web) funciona de fato de um turno para outro. O Claude em linha de comando serve aqui de ilustração concreta, mas nada é específico de um fornecedor em particular: cada mecanismo descrito é publicamente documentado e se encontra, sob nomes às vezes diferentes, na maioria dos assistentes agênticos atuais.

## Geração pura vs dado realmente obtido

Sem ferramenta, um LLM apenas **gera texto plausível** a partir do que aprendeu no treinamento (veja sua definição em [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)): ele não tem meio nenhum de consultar nada externo. Duas solicitações que produzem, na superfície, o mesmo tipo de resposta são, na realidade, muito diferentes:

| Solicitação | O que acontece | Confiabilidade |
|---|---|---|
| "Me dê um exemplo de JSON representando um usuário" | O modelo **inventa** valores plausíveis (nome, e-mail, id): é exatamente o que se pede a ele | Confiável para o uso: nenhum valor deve ser real |
| "Qual é o número de versão atual da biblioteca X?" | Sem ferramenta para verificar, o modelo produz uma resposta igualmente plausível **na aparência**, mas que pode ser falsa, uma alucinação (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)) | Não confiável sem verificação |

A diferença nunca se vê na forma da resposta: um texto inventado e um texto exato são escritos com a mesma segurança. Ela depende apenas de uma ferramenta ter realmente sido usada para obter o dado, ou de o modelo tê-lo produzido de memória.

> **Cuidado:** pedir uma informação factual verificável sem dar ao assistente (nem verificar que ele usou) uma ferramenta capaz de obtê-la de fato: nada no tom da resposta distingue um dado obtido de um dado inventado.
>
> **Boa prática:** para qualquer dado que possa mudar ou precise ser exato, garantir que uma ferramenta (busca na web, RAG, chamada de API) tenha realmente sido chamada em vez de confiar na memória do modelo (veja as categorias de ferramentas abaixo).

## O raciocínio interno estendido

Alguns modelos geram, antes da resposta final, uma fase de **raciocínio interno estendido**: uma sequência de tokens que exploram o problema, tentam caminhos, se corrigem, sem fazer parte da resposta destinada ao usuário (ela pode ser ocultada, resumida, ou exibida separadamente de acordo com a interface).

Não se deve confundir esse mecanismo com o [*chain-of-thought* do prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering): ali, o raciocínio detalhado é uma **técnica de prompt**, pedida explicitamente pelo usuário em sua pergunta. O raciocínio interno estendido, por sua vez, é uma **fase de geração distinta e nativa**, que existe independentemente de qualquer instrução do prompt sobre isso:

```text
Chain-of-thought (via prompt)     Raciocinio interno estendido (nativo)
--------------------------------  ---------------------------------------
Pedido explicitamente pelo        Gerado por padrao de acordo com o
prompt ("pense passo a passo")    modelo, antes mesmo de comecar a
                                   escrever a resposta destinada ao usuario
       |                                     |
Faz parte da resposta visivel     Pode ser ocultado, resumido, ou exibido
                                   separadamente da resposta final
```

O mesmo alerta do chain-of-thought via prompt se aplica, ainda mais marcado: um raciocínio exibido ou resumido não garante que corresponda fielmente ao mecanismo interno que realmente produziu a resposta (veja [essa armadilha detalhada no prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering)).

## Categorias concretas de ferramentas

O capítulo [Agentes](/?c=ia&s=nlp-llm&p=agents) apresenta o mecanismo genérico do function calling em um único exemplo (o clima). Na prática, um assistente que trabalha com código ou informação se apoia em categorias de ferramentas recorrentes, cada uma com seu próprio compromisso.

### Editar um arquivo: diff/patch vs reescrita completa

| | Diff / patch | Reescrita completa |
|---|---|---|
| O que a ferramenta recebe | As linhas a substituir, mais seu contexto imediato | O conteúdo integral do novo arquivo |
| Custo em tokens | Baixo, proporcional ao que muda | Alto, proporcional ao tamanho total do arquivo |
| Fragilidade | Falha se o contexto esperado não corresponder mais exatamente ao arquivo real (modificado desde a última leitura) | Insensível a esse problema: o arquivo inteiro é substituído tal como fornecido |

> **Cuidado:** aplicar um patch calculado sobre uma versão do arquivo que não é mais a versão real no disco: dependendo da ferramenta, isso falha explicitamente, ou, pior, se aplica nas linhas erradas sem erro visível.
>
> **Boa prática:** reler um arquivo imediatamente antes de calcular um patch sobre ele em vez de confiar em uma leitura antiga.

### Busca na web em tempo real vs RAG

O [RAG](/?c=ia&s=nlp-llm&p=rag) consulta uma base **pré-indexada com antecedência** e estática entre duas reindexações. Uma ferramenta de busca na web em tempo real, ao contrário, envia uma requisição **no exato momento da solicitação**, sem etapa de indexação prévia:

| | RAG | Busca na web em tempo real |
|---|---|---|
| Base consultada | Um índice vetorial construído com antecedência (veja [RAG](/?c=ia&s=nlp-llm&p=rag)) | A web tal como está no momento da requisição |
| Atualidade | Tão recente quanto a última reindexação | Sempre atualizada |
| Reprodutibilidade | Duas buscas idênticas retornam os mesmos fragmentos | Duas buscas idênticas podem retornar resultados diferentes |
| Curadoria das fontes | Escolhida com antecedência (decide-se o que indexar) | Depende do que o motor de busca retorna |

> **Cuidado:** tratar um resultado de busca na web com a mesma confiança de uma fonte escolhida com antecedência para ser indexada: uma página encontrada em tempo real não passou por nenhuma curadoria prévia, diferente de uma base RAG constituída deliberadamente.
>
> **Boa prática:** citar a fonte de qualquer informação obtida por busca na web, para que um humano possa verificar a origem em vez de confiar apenas no assistente.

## O padrão avaliador-otimizador

A tabela de [padrões de coordenação multiagente](/?c=ia&s=nlp-llm&p=agents) cobre o encadeamento sequencial, o orquestrador/trabalhadores e o estado compartilhado. Um quarto padrão, igualmente comum para um assistente que produz conteúdo (código, texto, plano): o **avaliador-otimizador**.

```text
1. Geracao     -> uma primeira versao da resposta/do codigo
2. Avaliacao   -> critica de acordo com criterios explicitos (checklist,
                  testes, formato esperado)
3. Revisao     -> uma nova versao que incorpora a critica
4. Volta a 2, ate um criterio de parada (qualidade julgada suficiente,
   numero de turnos atingido)
```

> **Cuidado:** um ciclo sem critério de parada explícito herda o mesmo risco de loop não limitado de um loop de agente clássico (veja [Agentes](/?c=ia&s=nlp-llm&p=agents)), exceto que aqui o loop roda para uma única tarefa de qualidade questionável, não por falta de informação.
>
> **Boa prática:** definir um critério de parada mensurável desde o design (uma nota mínima, um número máximo de turnos) em vez de deixar o ciclo rodar até uma interrupção manual.

## Cache de prompt e compactação de contexto

Duas otimizações complementares, distintas dos mecanismos já vistos.

### Reutilizar um prefixo já calculado

Uma chamada a um LLM normalmente recalcula todo o prompt a cada turno, incluindo os tokens já enviados no turno anterior (veja a tokenização em [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)). No entanto, uma grande parte de um prompt agêntico permanece idêntica de um turno para outro dentro de uma mesma sessão: as instruções de sistema, a lista de ferramentas disponíveis, o início do histórico. O cache de prompt reutiliza o cálculo já feito nesse prefixo comum em vez de refazer tudo do zero a cada turno: uma aplicação concreta do princípio [nunca recalcular um resultado que nada pôde mudar desde então](/?c=performance&p=eviter-le-recalcul-redondant).

> **Cuidado:** modificar o início do prompt (as instruções de sistema, por exemplo) para um único turno: isso invalida o cache construído sobre esse prefixo para todos os turnos seguintes da sessão, anulando o ganho por uma mudança que só afetava um único turno.
>
> **Boa prática:** manter estável a parte do prompt destinada ao cache (instruções de sistema, descrição das ferramentas), e só variar o que realmente muda de um turno para outro.

### Compactar o contexto em uma sessão longa

A [janela de contexto](/?c=ia&s=nlp-llm&p=llm-en-production) permanece limitada seja qual for o modelo. Em uma sessão agêntica longa, o histórico completo cresce a cada turno e acaba se aproximando desse limite. A compactação resume os turnos antigos em um condensado mais curto antes de serem removidos do prompt, em vez de truncá-los silenciosamente (a armadilha já sinalizada para a janela de contexto em [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)).

> **Cuidado:** compactar perdendo uma informação ainda necessária para o que vem depois (um identificador, uma restrição dada no início da sessão): um resumo automático não garante preservar tudo o que ainda importa.
>
> **Boa prática:** manter os elementos críticos (identificadores, restrições explícitas) fora do resumo compactável, em vez de confiar tudo à compactação automática.

## As etapas do pós-treinamento de um assistente moderno

O capítulo [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) distingue, de forma genérica, o fine-tuning (retreinar) do prompting (não modificar nada). Um assistente conversacional moderno passa, na realidade, por várias etapas distintas de fine-tuning, cada uma documentada publicamente pelos principais fornecedores:

```text
1. Pre-treinamento     -> prever a proxima palavra em um corpus imenso
                          de texto (veja NLP e LLM) - o modelo "bruto"
2. SFT (Supervised     -> fine-tuning com exemplos cuidadosamente
   Fine-Tuning)           escritos (instrucao -> boa resposta), para
                          orientar o modelo para um comportamento
                          de assistente em vez de simples completude
3. RLHF (Reinforcement -> humanos comparam pares de respostas
   Learning from Human    ("qual e a melhor?"); essas comparacoes
   Feedback)              treinam um modelo de recompensa, e entao o
                          modelo principal e ajustado por aprendizado
                          por reforco para maximizar essa recompensa
4. Constitutional AI   -> variante publicada pela Anthropic: o modelo
   (variante)              critica e revisa ele mesmo suas respostas
                          conforme um conjunto escrito de principios,
                          reduzindo a necessidade de exemplos humanos
                          explicitamente rotulados como "nocivos"
```

| Etapa | Para se aprofundar |
|---|---|
| Pré-treinamento | Veja sua definição em [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) |
| SFT | [InstructGPT](https://arxiv.org/abs/2203.02155), o artigo que popularizou esse pipeline SFT + RLHF para assistentes conversacionais |
| RLHF | [Deep reinforcement learning from human preferences](https://arxiv.org/abs/1706.03741), o artigo fundador do RLHF |
| Constitutional AI | [A página de pesquisa da Anthropic sobre Constitutional AI](https://www.anthropic.com/news/claude-s-constitution) |

> **Cuidado:** confundir essas etapas com o fine-tuning genérico já visto em [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm): SFT, RLHF e Constitutional AI são cada um um método de fine-tuning entre outros possíveis, não sinônimos do termo genérico.
>
> **Boa prática:** distinguir, diante do anúncio de um novo modelo, a natureza real de seu pós-treinamento (apenas exemplos supervisionados? um modelo de recompensa aprendido? uma fase de autocrítica?) em vez de supor um único "fine-tuning" indiferenciado.

Um assistente moderno como o descrito aqui se apoia em um único modelo generalista, que cuida ao mesmo tempo da conversa, da geração de código e da chamada de ferramentas. Nem sempre foi assim: modelos antigos como o **Codex** (o modelo especializado em código da OpenAI, anterior a essa unificação) eram treinados separadamente para um uso específico, uma abordagem que os assistentes atuais substituem por um único modelo pós-treinado para cobrir todos esses casos de uma vez.

## O que reter

| | |
|---|---|
| **O que reter** | Um assistente agêntico combina geração pura (a distinguir de um dado realmente obtido), raciocínio interno estendido nativo (≠ chain-of-thought via prompt), categorias concretas de ferramentas (diff vs reescrita, busca em tempo real vs RAG), o padrão avaliador-otimizador, o cache de prompt, a compactação de contexto, e várias etapas de pós-treinamento (SFT, RLHF, Constitutional AI). |
| **Ferramentas úteis** | Uma ferramenta de edição por diff/patch para arquivos grandes, uma ferramenta de busca na web em tempo real para informação atualizada, um cache de prompt para prefixos estáveis, um mecanismo de compactação para sessões longas. |
| **Armadilhas a evitar** | Confundir um dado inventado com um dado obtido. Tomar um raciocínio exibido como um relato fiel. Aplicar um patch em um arquivo alterado desde sua última leitura. Confiar em uma fonte web sem curadoria. Um ciclo avaliador-otimizador sem critério de parada. Invalidar o cache modificando seu prefixo estável. Perder uma informação crítica ao compactar. Confundir SFT/RLHF/Constitutional AI com um fine-tuning genérico. |
| **Boas práticas** | Verificar que uma ferramenta foi realmente usada para qualquer dado factual verificável. Reler um arquivo antes de calcular um patch. Citar a fonte de qualquer informação encontrada por busca na web. Definir um critério de parada mensurável para um ciclo avaliador-otimizador. Manter estável o prefixo destinado ao cache. Preservar os elementos críticos fora do resumo compactável. Identificar a natureza real do pós-treinamento de um modelo em vez de supô-lo genérico. |
