---
order: 3
---

# LLM em produção: casos de uso e limites

Usar um LLM a partir de uma interface de chat e integrá-lo em um produto são dois exercícios diferentes. No primeiro caso, uma resposta ruim se corrige reformulando a pergunta. No segundo, a mesma resposta segue sem supervisão para um usuário ou um sistema posterior: isso muda completamente o que é preciso verificar antes de escolher essa tecnologia para uma tarefa específica.

## Quando um LLM é a ferramenta certa

Um LLM se destaca em tarefas cuja entrada e saída são **linguagem**: entender um texto livre, reformulá-lo, extrair uma informação dele, traduzi-lo, classificá-lo, gerar um novo a partir de instruções. É precisamente o objetivo para o qual ele foi treinado (veja [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

| Caso de uso | Adequado? | Por quê |
|---|---|---|
| Extrair uma informação de um texto não estruturado (ex.: um e-mail) | Sim | É compreensão de linguagem natural |
| Resumir um documento longo | Sim | Mesma razão, com um compromisso comprimento/fidelidade |
| Classificar um ticket de suporte por categoria | Sim, muitas vezes é overkill | Um modelo clássico (regressão logística sobre embeddings) faz igualmente bem, mais barato, mais rápido |
| Calcular um imposto ou uma data de vencimento | Não | Um LLM prediz o token mais plausível, não o resultado exato de um cálculo (veja abaixo) |
| Decidir uma ação irreversível sozinho (enviar uma transferência) | Não, não sem trava humana | Resposta não determinística, nunca garantida a 100% |

> **Nota:** para o cálculo exato, a arquitetura correta não é melhorar o prompt do LLM, é dar a ele uma ferramenta (uma função [Python](/?c=langages-de-programmation&s=python&p=python), uma consulta [SQL](/?c=domain-specific-languages-dsl&p=sql)) que ele chama e cujo resultado ele retransmite (veja o capítulo [Agentes](/?c=ia&s=nlp-llm&p=agents)). O LLM continua excelente para entender *que é preciso* calcular um imposto e *com quais números*, mas nunca deve ser o calculador em si.

## As limitações estruturais a conhecer antes de projetar

Essas limitações não são bugs que uma versão melhor do modelo vai corrigir um dia: elas decorrem diretamente do que é um LLM (veja seu princípio de treinamento no capítulo [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

**As alucinações.** Um LLM não "sabe" nada no sentido em que um banco de dados saberia: ele gera o texto estatisticamente mais plausível considerando o que veio antes. Nada em seu treinamento o leva a dizer *"não sei"* em vez de inventar uma resposta plausível: uma citação, uma referência legal, uma função de uma biblioteca que não existe. Essa é a limitação mais perigosa em produção, porque uma alucinação é escrita com a mesma segurança que uma resposta correta.

> **Cuidado:** confiar em uma resposta gerada com segurança sem verificá-la, principalmente sobre um fato verificável (uma citação, um número de lei, uma função de biblioteca). O tom seguro de uma resposta nunca é um indicador confiável de sua exatidão.
>
> **Boa prática:** verificar sistematicamente, por uma fonte independente ou uma ferramenta (veja [Agentes](/?c=ia&s=nlp-llm&p=agents)), qualquer afirmação factual verificável produzida por um LLM antes de considerá-la confiável, ainda mais se o erro tiver um custo real.

**A janela de contexto.** Um LLM não lê um texto indefinidamente longo: ele é limitado a um número máximo de tokens (o prompt e sua própria resposta incluídos). Além disso, ou a requisição falha, ou o início do contexto é truncado silenciosamente, dependendo da implementação. Um documento de 500 páginas não pode ser colado tal como está em um prompt: é um dos problemas que o [RAG](/?c=ia&s=nlp-llm&p=rag) resolve.

> **Cuidado:** exceder a janela de contexto sem perceber: dependendo da implementação, o início do prompt pode ser truncado silenciosamente, sem aviso explícito. O modelo então responde com base em um contexto parcial, sem que nada sinalize isso.
>
> **Boa prática:** medir o tamanho real do prompt em tokens (veja [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) antes do envio, e tratar explicitamente um excesso (resumo, RAG) em vez de deixar a implementação truncar silenciosamente.

**O não determinismo.** O mesmo prompt, enviado duas vezes, pode produzir duas respostas diferentes: a cada token, o modelo não escolhe automaticamente o mais provável, ele **sorteia** entre os tokens plausíveis de acordo com a distribuição de probabilidade que acabou de calcular (veja [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)), um sorteio regulado por um parâmetro chamado **temperatura**, detalhado logo abaixo. Consequência direta: um teste automatizado que compara uma saída de LLM a uma string exata é frágil por construção (veja o capítulo [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) para avaliar uma saída de outra forma).

## A temperatura: controlar o acaso da geração

A temperatura não muda as probabilidades calculadas pelo modelo para o próximo token: ela muda a forma como esse sorteio as usa depois, estreitando ou achatando a diferença entre o token mais provável e os outros:

```text
Distribuicao bruta calculada pelo modelo para "O gato dorme no ___":
  "sofa" : 45%   "tapete" : 20%   "quarto" : 15%   "telhado" : 5%   ...

Temperatura baixa (ex. 0.2) -> estreita a diferenca, "sofa" se torna quase sistematico
  "sofa" : ~90%   "tapete" : ~7%   "quarto" : ~2%   "telhado" : ~0.1%   ...

Temperatura alta (ex. 1.5) -> achata a diferenca, as alternativas voltam a competir
  "sofa" : ~30%   "tapete" : ~25%   "quarto" : ~20%   "telhado" : ~12%   ...
```

```python
resposta = client.chat.completions.create(
    model="...",
    messages=[...],
    temperature=0.2,  # estreita o sorteio: respostas estaveis, pouca variacao entre chamadas
)
```

| Temperatura | Efeito no sorteio | Caso de uso típico |
|---|---|---|
| 0 | (quase) sempre o token mais provável | Extração de informação, classificação, tarefa factual |
| 0,2 – 0,5 | Respostas estáveis, pouca variação entre chamadas | Suporte ao cliente, documentação, geração de código |
| 0,7 – 1,0 (valor padrão da maioria das APIs) | Bom equilíbrio entre coerência e variedade | Redação geral, conversação |
| 1,2 e mais | Muita variedade, ao custo da coerência | Brainstorming, geração criativa |

> **Nota:** uma temperatura em 0 reduz o acaso ao mínimo, mas não garante um determinismo perfeito em todos os casos. Em uma infraestrutura que processa muitas requisições em paralelo (o caso da maioria dos fornecedores em produção), a ordem em que os cálculos de ponto flutuante são executados pode variar ligeiramente entre chamadas, produzindo ocasionalmente um resultado diferente apesar de uma temperatura nula.

> **Cuidado:** usar uma temperatura alta por padrão porque "torna as respostas mais interessantes", inclusive em uma tarefa factual (extração, classificação, cálculo retransmitido a uma ferramenta, veja acima): é um dos casos em que o acaso adicionado não agrega nada e só aumenta o risco de resposta inconsistente ou alucinada.
>
> **Boa prática:** escolher a temperatura de acordo com a tarefa em vez de copiar um valor padrão em todo lugar: baixa para tudo que precisa permanecer confiável e reproduzível, mais alta só quando a variedade da saída é ela mesma desejada (veja também *"A temperatura de acordo com o uso"* em [Construindo um chatbot](/?c=ia&s=applications-llm&p=chatbot)).

**O conhecimento congelado em uma data.** Um LLM só conhece o que existia em seus dados de treinamento, até uma data de corte (*cutoff*). Ele ignora qualquer evento posterior, e não pode adivinhá-lo: no máximo pode sinalizar isso se foi treinado para fazê-lo, ou alucinar uma resposta caso contrário. O RAG e os agentes (busca na web em tempo real) são as duas formas de contornar essa limitação.

> **Cuidado:** fazer uma pergunta sobre um evento recente sem verificar a data de corte do modelo usado: uma resposta segura sobre um assunto posterior a essa data é quase sempre uma alucinação em vez de um conhecimento real.
>
> **Boa prática:** verificar a data de corte do modelo antes de fazer a ele uma pergunta sensível à atualidade, e recorrer ao RAG ou a um agente capaz de buscar uma informação atualizada se necessário.

**Nenhuma ação sobre o mundo real.** Um LLM apenas produz texto. Enviar um e-mail, escrever em um banco de dados, chamar uma API: nada disso é possível sem um sistema à sua volta que interprete sua saída e aja em seu lugar: é o papel dos agentes.

## O custo, uma restrição de design em si

Diferente de um serviço clássico em que o custo marginal de uma requisição é próximo de zero, cada chamada a um LLM tem um **custo real e variável**, proporcional ao número de tokens lidos (o prompt, geralmente cobrado mais barato) e gerados (a resposta, mais cara porque calculada token por token, veja o mecanismo de atenção). Um prompt que carrega um longo histórico de conversa ou um documento inteiro multiplica esse custo a cada turno.

A latência segue a mesma lógica: um modelo maior geralmente responde mais lentamente, e uma resposta longa leva mais tempo que uma curta: um modelo não pode "pensar em silêncio" e então exibir o resultado de uma vez, ele produz sua resposta token após token.

O compromisso que resulta disso é sistemático no design de um sistema em produção:

| | Modelo menor/mais rápido | Modelo maior |
|---|---|---|
| Custo por requisição | Mais baixo | Mais alto |
| Latência | Mais baixa | Mais alta |
| Capacidade de raciocínio | Limitada em tarefas complexas | Melhor |
| Caso de uso típico | Classificação, extração simples, primeiro filtro | Raciocínio em várias etapas, redação refinada |

Uma arquitetura comum faz os dois coexistirem: um modelo pequeno filtra ou direciona a maioria das requisições simples, e só as que realmente exigem são enviadas ao modelo mais caro.

> **Cuidado:** ignorar o custo até a fatura do fim do mês. Diferente de um serviço clássico em que o custo marginal de uma requisição é insignificante, cada chamada a um LLM tem um custo mensurável e acumulativo, invisível enquanto nenhum acompanhamento é implementado.
>
> **Boa prática:** implementar um acompanhamento de custo por funcionalidade ou por usuário desde o design (veja [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), em vez de descobrir isso depois do fato.

## O que reter

| | |
|---|---|
| **O que reter** | Um LLM se destaca em tarefas de linguagem, não em cálculo exato nem em ação autônoma sobre o mundo real. Suas limitações estruturais (alucinações, janela de contexto limitada, não determinismo, conhecimento congelado em uma data) decorrem do seu próprio princípio, não de bugs que uma versão melhor vai corrigir. Cada chamada tem um custo e uma latência reais. |
| **Ferramentas úteis** | O parâmetro temperatura para controlar o acaso da geração. Uma ferramenta de tokenização para medir o tamanho real de um prompt. Um modelo menor como primeiro filtro para reduzir o custo médio. |
| **Armadilhas a evitar** | Confiar em uma resposta segura sem verificá-la. Exceder silenciosamente a janela de contexto. Questionar o modelo sobre um evento posterior à sua data de corte. Ignorar o custo até a fatura. |
| **Boas práticas** | Verificar qualquer afirmação factual verificável produzida pelo modelo. Medir o tamanho do prompt em tokens reais. Verificar a data de corte antes de uma pergunta sensível à atualidade. Implementar um acompanhamento de custo desde o design. |
