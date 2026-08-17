---
order: 16
---

# A stack de IA: as camadas de uma aplicação em produção

Os capítulos anteriores cobrem cada um um mecanismo: [treinar uma rede neural](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient), [dar ferramentas a um modelo](/?c=ia&s=nlp-llm&p=agents), [aumentá-lo com dados externos](/?c=ia&s=nlp-llm&p=rag), [monitorá-lo em produção](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)... Este capítulo não adiciona nenhum: ele mostra como essas peças realmente se empilham em uma aplicação, e nomeia as categorias concretas de ferramentas que existem em cada camada, um vocabulário que nenhum outro capítulo cobre, porque ele não trata do funcionamento de um mecanismo, mas do panorama das ferramentas que o implementam.

**Stack de IA**: o conjunto de camadas, cada uma com um papel distinto, que precisam se combinar para transformar um modelo de linguagem em uma aplicação utilizável, do cálculo bruto até o que o usuário final vê.

## As camadas, de baixo para cima

```text
Aplicacao         -> chatbot, assistente de linha de comando...
      |               (veja Construindo um chatbot, O assistente de
      |                IA agentico no terminal)
Orquestracao      -> encadeamento de prompts, loop de agente
      |               (veja Agentes)
Observabilidade   -> logs, custos, avaliacao das respostas
      |               (veja Monitoramento e gestao operacional)
Dados             -> banco vetorial, documentos fonte (RAG)
      |               (veja RAG)
Modelo            -> API hospedada OU modelo auto-hospedado
      |
Calculo / cloud   -> GPU, aluguel por demanda
                      (veja CPU vs GPU, O que e a nuvem)
```

Cada camada se apoia na de baixo, e um problema em uma camada inferior (uma GPU insuficiente, uma API de modelo fora do ar) se propaga para todas as camadas acima, mesmo que seu próprio código não tenha nenhum defeito.

| Camada | Papel | Já cobertos em outro lugar |
|---|---|---|
| Cálculo / cloud | Fornecer o poder de cálculo bruto | [CPU vs GPU](/?c=infrastructure&p=cpu-vs-gpu), [A nuvem](/?c=infrastructure&p=le-cloud) |
| Modelo | Produzir uma resposta a partir de um prompt | [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production) |
| Dados | Fornecer ao modelo uma informação que ele não tem em memória | [RAG](/?c=ia&s=nlp-llm&p=rag) |
| Orquestração | Decidir o que chamar, em que ordem | [Agentes](/?c=ia&s=nlp-llm&p=agents) |
| Observabilidade | Saber o que aconteceu, quanto custou | [Monitoramento e gestão operacional](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) |
| Aplicação | Expor tudo isso a um usuário final | [Construindo um chatbot](/?c=ia&s=applications-llm&p=chatbot), [O assistente de IA agêntico no terminal](/?c=ia&s=applications-llm&p=assistant-agentique-terminal), ou uma interface pronta para uso ([Open WebUI](https://openwebui.com), [LibreChat](https://www.librechat.ai)) sem necessidade de desenvolvimento |

As seções seguintes detalham as três camadas cujo apenas *mecanismo* (não o *panorama de ferramentas*) já foi visto em outro lugar.

## A camada modelo: API hospedada ou modelo auto-hospedado

Usar um LLM exige escolher entre duas formas radicalmente diferentes de acessá-lo:

| | API hospedada | Modelo auto-hospedado |
|---|---|---|
| Princípio | Um fornecedor hospeda o modelo, chama-se ele por [API](/?c=infrastructure&p=api-et-http) | Roda-se você mesmo um modelo de pesos abertos no próprio hardware (ou em [cloud](/?c=infrastructure&p=le-cloud) alugado) |
| Custo | Pago pelo uso (por token), nenhum investimento em hardware | Custo fixo (GPUs próprias ou alugadas continuamente), rentável só em alto volume |
| Controle dos dados | O dado passa por um terceiro (veja a [governança de dados](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) | O dado nunca deixa a infraestrutura da empresa |
| Manutenção | A cargo do fornecedor | A cargo da empresa (atualizações, escalonamento, disponibilidade) |
| Qualidade disponível | Acesso aos modelos mais performáticos do mercado | Limitada ao que o hardware disponível consegue rodar |

> **Cuidado:** escolher a auto-hospedagem apenas para economizar o custo por token, sem contar o custo fixo do hardware nem o tempo de engenharia necessário para igualar a confiabilidade de um serviço gerenciado: a equação só se torna favorável a partir de um volume de uso suficiente.
>
> **Boa prática:** calcular as duas opções com base no volume de uso real previsto (não um uso hipotético), e reavaliar essa escolha se esse volume mudar significativamente: a troca nunca é definitiva.

### A passarela LLM: um ponto de entrada único para vários fornecedores

Um aplicativo que chama diretamente a API de um fornecedor de modelo acopla todo seu código a esse fornecedor específico: trocar de modelo, dividir um orçamento entre equipes, ou esconder as chaves de API de cada aplicativo que precisa delas se torna um problema resolvido separadamente por cada aplicativo. Uma **passarela LLM** (*LLM gateway*, por exemplo [LiteLLM](https://www.litellm.ai)) se posiciona entre os aplicativos e os fornecedores para centralizar essas necessidades transversais:

| Necessidade | O que a passarela oferece |
|---|---|
| Trocar de fornecedor | Uma interface comum, sem reescrever o código de chamada para cada fornecedor |
| Orçamento por equipe | Um teto de gasto configurado uma única vez, na passarela, em vez de em cada aplicativo |
| Chaves de API | Os aplicativos chamam a passarela, nunca diretamente o fornecedor: as chaves de API reais permanecem ocultas, conhecidas apenas pela passarela |
| Cache de respostas | Um cache centralizado (veja o [cache semântico](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)) beneficia todos os aplicativos que passam pela passarela, em vez de cada um reimplementar o seu |

## A camada dados: o banco vetorial

O capítulo [RAG](/?c=ia&s=nlp-llm&p=rag) explica o mecanismo (divisão, indexação, busca por similaridade) sem citar uma ferramenta específica. Na prática, a etapa de indexação se apoia em uma dessas duas famílias:

| | Banco vetorial dedicado | Extensão de um banco existente |
|---|---|---|
| Princípio | Um sistema projetado unicamente para armazenar e buscar embeddings ([Pinecone](https://www.pinecone.io), [Weaviate](https://weaviate.io), [Milvus](https://milvus.io)...) | Uma extensão adicionada a um banco já existente (ex.: [`pgvector`](https://github.com/pgvector/pgvector) para PostgreSQL) |
| Vantagem | Otimizado para busca por similaridade em grande escala | Nenhuma infraestrutura nova a operar se o banco existente bastar em volume |
| Desvantagem | Um sistema adicional a operar e proteger | Menos performática que um banco dedicado além de certo volume |

A escolha segue a mesma lógica de outros lugares em arquitetura: uma extensão basta enquanto o volume de documentos permanecer modesto; um banco dedicado se justifica quando a busca por similaridade se torna, ela mesma, um gargalo.

## A camada orquestração: escrever o loop você mesmo, ou se apoiar em um framework

O capítulo [Agentes](/?c=ia&s=nlp-llm&p=agents) descreve o loop reflexão/ação e os padrões de coordenação multiagente em geral, sem dizer como são concretamente implementados. Duas abordagens:

| | Escrever o loop você mesmo | Framework de orquestração | Estúdio agêntico visual |
|---|---|---|---|
| Princípio | Codificar diretamente as chamadas ao modelo, às ferramentas, e o loop que as encadeia | Apoiar-se em uma biblioteca ([LangChain](https://www.langchain.com), [LlamaIndex](https://www.llamaindex.ai)...) que já fornece esses blocos | Montar o loop e as ferramentas em uma interface gráfica low-code ([Dify](https://dify.ai)), sem escrever código de orquestração |
| Vantagem | Controle total, nenhuma dependência externa, mais simples de depurar linha por linha | Interface comum para vários fornecedores de modelos, gestão da memória de conversa e do encadeamento já resolvidas | O início mais rápido dos três, acessível sem habilidades de desenvolvimento |
| Desvantagem | Cada bloco (retries, gestão de memória, formato das ferramentas) precisa ser reescrito | Uma camada de abstração adicional a entender, às vezes mais pesada que a necessidade real | Menos controle fino sobre o comportamento exato do loop do que código ou um framework |

> **Cuidado:** adotar um framework de orquestração completo para uma necessidade que se resume a uma única chamada de ferramenta, o mesmo erro de superengenharia de qualquer outro sistema antes de precisar dele.
>
> **Boa prática:** começar pelo loop mais simples que atenda à necessidade real, e só introduzir um framework quando a coordenação (várias ferramentas, vários agentes, gestão fina da memória) superar o que um código escrito manualmente pode razoavelmente manter.

Qualquer que seja a abordagem escolhida, as ferramentas que o loop chama (function calling ou não) se beneficiam de ser expostas de forma padronizada em vez de reintegradas manualmente em cada projeto: veja [MCP](/?c=ia&s=nlp-llm&p=mcp).

## A armadilha transversal: um acoplamento oculto entre as camadas

Cada camada parece independente: até que uma mudança em uma quebre o funcionamento de outra sem erro visível. O exemplo já encontrado em [RAG](/?c=ia&s=nlp-llm&p=rag): trocar de modelo de embedding (camada modelo) invalida silenciosamente um banco vetorial existente (camada dados), já que os dois modelos não compartilham o mesmo espaço vetorial.

> **Cuidado:** modificar uma camada isoladamente e testar apenas essa camada, supondo que as outras não têm nenhum motivo para serem afetadas.
>
> **Boa prática:** após qualquer mudança de componente em uma camada (modelo, banco vetorial, framework de orquestração), executar novamente um teste de integração de ponta a ponta, não apenas um teste isolado da camada modificada.

## O que reter

| | |
|---|---|
| **O que reter** | Uma aplicação de IA se monta em camadas distintas (cálculo, modelo, dados, orquestração, observabilidade, aplicação), cada uma coberta mecanicamente em outro lugar do site. A escolha API hospedada vs auto-hospedado, banco vetorial dedicado vs extensão, e loop codificado manualmente vs framework de orquestração são decisões de arquitetura específicas de cada camada. |
| **Ferramentas úteis** | Uma API de modelo hospedada para começar sem infraestrutura, uma passarela LLM (LiteLLM) assim que vários aplicativos ou equipes compartilham o acesso aos modelos. Uma extensão como `pgvector` para um volume modesto de documentos, um banco vetorial dedicado além disso. Um framework de orquestração quando a coordenação fica complexa demais para código escrito à mão, ou um estúdio agêntico visual (Dify) para uma necessidade sem desenvolvimento. |
| **Armadilhas a evitar** | Escolher a auto-hospedagem só pelo custo por token sem contar o custo fixo. Adotar um framework completo para uma necessidade trivial. Modificar uma camada sem testar novamente a integração de ponta a ponta. |
| **Boas práticas** | Calcular as duas opções de hospedagem com base no volume real previsto. Começar pelo loop mais simples antes de introduzir um framework. Executar novamente um teste de integração de ponta a ponta após qualquer mudança de componente. |
