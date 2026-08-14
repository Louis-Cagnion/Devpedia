---
order: 6
---

# Prompt engineering: estruturar uma requisição para melhores resultados

O capítulo sobre [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) distingue o *prompting* do fine-tuning: sem tocar em um único peso do modelo, a forma de formular a entrada influencia fortemente a qualidade da saída. O **prompt engineering** é a prática, em grande parte empírica, que consiste em projetar essa entrada metodicamente em vez de improvisá-la: algumas técnicas aparecem com frequência suficiente para serem tratadas como um vocabulário básico, não como simples truques isolados.

## Dar um papel e instruções explícitas

Um modelo ao qual não se especifica nem papel nem restrições precisa adivinhar o registro esperado (tom, nível de detalhe, formato) só a partir do conteúdo da pergunta. Deixar isso explícito nas instruções (geralmente no início do prompt, em um papel "sistema") reduz essa ambiguidade:

```text
Prompt ruim :  "Explique indices em banco de dados."

Prompt melhor :  "Voce e um instrutor que se dirige a desenvolvedores juniores.
                  Explique indices em banco de dados em no maximo 3 frases,
                  com uma analogia concreta, sem jargao SQL nao explicado."
```

Veja a configuração de um system prompt em [Construindo um chatbot](/?c=ia&s=applications-llm&p=chatbot) para esse mesmo princípio aplicado a um assistente conversacional completo.

### Anticipar a informação ausente

Diante de uma informação ausente, um modelo não para por conta própria para pedi-la: ele preenche o vazio com uma suposição silenciosa, que pode divergir do que era realmente desejado sem que nada sinalize isso. Especificar nas instruções a conduta a seguir nesse caso retira essa escolha implícita do modelo:

```text
Se uma informacao necessaria estiver ausente, indique isso explicitamente
em vez de fazer uma suposicao silenciosa, ou faca a pergunta, se o
contexto permitir.
```

A escolha entre fazer uma pergunta e avançar sobre uma suposição explícita depende do contexto: um uso interativo (chat) se beneficia da pergunta direta, enquanto um uso automatizado (pipeline, agente, sem humano para responder em tempo real) precisa que o modelo avance mesmo assim, indicando claramente qual suposição foi feita em vez de deixá-la implícita.

> **Cuidado:** não especificar nada sobre esse caso, supondo que o modelo vai pedir esclarecimento por conta própria se necessário. Sem instrução explícita, ele geralmente completa silenciosamente com a suposição mais plausível estatisticamente, não necessariamente a que o usuário tinha em mente.
>
> **Boa prática:** sempre especificar explicitamente a conduta esperada diante de uma informação ausente, em vez de contar com o bom senso do modelo.

## Identificar um prompt impreciso e propor uma versão refinada

A seção anterior trata do caso em que uma informação falta *no meio* da tarefa, uma vez já iniciada. Um prompt também pode ser impreciso *desde o início* (um objetivo vago, um formato não especificado, uma escolha que na verdade pertence a quem pergunta), a ponto de nenhuma tentativa, mesmo cautelosa, ter um bom motivo para seguir em uma direção em vez de outra. Nesse caso, a melhor resposta não é adivinhar, nem produzir um resultado genérico: é devolver uma **versão refinada do prompt**, que lista precisamente o que falta e propõe uma reformulação concreta, antes de se comprometer com um trabalho que tem boas chances de precisar ser refeito:

```text
Prompt recebido :  "Faca um relatorio sobre as vendas."

Sem refinamento  ->  um relatorio produzido ao acaso de suposicoes implicitas
                      (qual periodo? quais produtos? qual formato? para quem?)

Com refinamento  ->  "Para este relatorio, voce pode especificar:
                      - o periodo abrangido (mes atual? ano? comparacao
                        com o ano passado?)
                      - o formato esperado (resumo de uma pagina? tabela
                        detalhada?)
                      - o destinatario (diretoria? equipe comercial?)
                      Caso contrario, eu sigo com: o mes atual, um resumo
                      de uma pagina, para a diretoria."
```

Uma pergunta concreta, formulada em opções identificáveis (como acima), obtém uma resposta mais rápida e mais útil que uma pergunta aberta do tipo "você pode especificar?", que deixa para a pessoa a tarefa de adivinhar sozinha o que faltava.

> **Cuidado:** pedir um refinamento em um prompt já suficientemente preciso para ser executado sem ambiguidade real. Sistematizar a pergunta em vez de reservá-la para os casos que a justificam torna a troca mais lenta e dá a impressão de que o modelo está evitando a tarefa em vez de tentar fazê-la bem.
>
> **Boa prática:** reservar o refinamento para os casos em que várias interpretações permanecem igualmente plausíveis, ou em que uma escolha (escopo, formato, restrição) claramente pertence a quem pergunta; e sempre propor, junto com a pergunta, uma suposição padrão razoável para não bloquear totalmente o andamento caso ela não responda.

### Propor várias direções em vez de uma única pergunta

A pergunta acima funciona bem quando a informação ausente é um parâmetro factual (um período, um destinatário): a pessoa sabe imediatamente o que responder. Funciona menos bem quando a incerteza recai sobre uma direção estilística ou criativa (um tom, uma estrutura, um ângulo), difícil de decidir no abstrato, sem nada concreto diante dos olhos. Nesse caso, em vez de uma pergunta aberta, esboçar diretamente duas ou três direções curtas e claramente diferentes deixa a pessoa reagir a algo tangível, em vez de precisar se projetar em uma descrição verbal:

```text
Prompt recebido :  "Escreva um slogan para nosso novo app de fitness."

Sem direcoes  ->  um unico slogan, em um tom escolhido arbitrariamente
                  pelo modelo

Com direcoes  ->  "Tres direcoes possiveis, me diga qual desenvolver:
                   1. Humoristica: 'Seu sofa vai precisar achar um novo
                      melhor amigo.'
                   2. Factual: 'Acompanhe seu progresso, dia apos dia.'
                   3. Premium: 'Performance, sem concessoes.'"
```

Cada direção deve permanecer curta (uma linha, não um parágrafo): o objetivo é fazer escolher uma direção, não entregar um trabalho pronto em várias versões: o desenvolvimento completo vem depois da escolha, uma vez validada a direção.

> **Cuidado:** multiplicar as direções além de 3-4, ou propor variantes que só se distinguem por detalhes de formulação em vez de um eixo realmente diferente (tom, estrutura, ângulo). Além de certo número, ou sem diferença clara entre elas, a pessoa perde mais tempo comparando do que teria gasto respondendo a uma pergunta direta.
>
> **Boa prática:** limitar as direções a 2-3 opções realmente distintas no eixo problemático, cada uma curta o suficiente para permanecer barata de produzir; e reservar a técnica para os casos em que a diferença se julga melhor em um exemplo concreto do que em uma descrição abstrata.

## O few-shot prompting: mostrar em vez de descrever

Em vez de descrever abstratamente o formato ou estilo esperado, dar diretamente um ou vários exemplos entrada → saída no prompt (o *few-shot prompting*) explora a capacidade do modelo de identificar um padrão e reproduzi-lo:

```text
Classifique o sentimento de cada avaliacao em positivo/negativo/neutro.

Avaliacao : "Entrega rapida, produto conforme."          -> positivo
Avaliacao : "Correto sem mais, nada excepcional."         -> neutro
Avaliacao : "Pacote chegou danificado, nenhuma resposta do SAC." -> negativo

Avaliacao : "O produto funciona mas a embalagem estava rasgada." -> ?
```

Um prompt sem exemplo (*zero-shot*) funciona para tarefas simples ou já bem representadas no treinamento do modelo; adicionar 2 a 5 exemplos bem escolhidos melhora nitidamente a confiabilidade em um formato ou estilo específico, sem custar o tempo nem os dados de um fine-tuning.

> **Cuidado:** escolher exemplos não representativos ou tendenciosos (todos positivos, todos escritos no mesmo tom, todos muito curtos). O modelo reproduz fielmente o padrão dos exemplos fornecidos, incluindo seus vieses, não apenas seu formato.
>
> **Boa prática:** escolher exemplos que cubram a diversidade real dos casos esperados (estilos, comprimentos, casos limites), não apenas casos fáceis ou parecidos entre si.

## O raciocínio passo a passo (*chain-of-thought*)

Um LLM gera sua resposta token por token, cada token se apoiando em todos os já produzidos (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)), incluindo os de sua própria resposta em elaboração. Pedir explicitamente ao modelo para detalhar seu raciocínio antes de concluir ("pense passo a passo antes de responder") dá a ele, concretamente, mais tokens intermediários nos quais se apoiar para construir uma conclusão: um ganho especialmente claro em tarefas com várias etapas (cálculo, lógica, decomposição de um problema):

```text
Sem chain-of-thought :  "Um trem parte as 14h12 a 80km/h, outro as 14h27
                         a 100km/h na mesma via. A que hora o segundo
                         alcanca o primeiro?"
                         -> risco de dar um resultado direto, sem verifica-lo

Com chain-of-thought :  "... Detalhe seu raciocinio passo a passo,
                         e de a resposta final na ultima linha."
                         -> o modelo faz os calculos intermediarios antes de concluir
```

Pedir também uma etapa de verificação antes de concluir ("releia sua resposta e verifique se ela respeita [restrição]") prolonga o mesmo princípio: isso dá ao modelo a chance de detectar sozinho uma restrição não respeitada antes que ela chegue à saída final, em vez de descobrir a diferença só relendo depois por conta própria.

> **Cuidado:** tomar o raciocínio exibido pelo modelo como um relato fiel do que realmente produziu a resposta. Nada garante que as etapas exibidas correspondam exatamente ao mecanismo interno que levou à conclusão: um raciocínio que *parece* coerente pode acompanhar uma conclusão errada, ou o contrário.
>
> **Boa prática:** tratar um raciocínio chain-of-thought como uma ajuda à confiabilidade da resposta (e à sua releitura por um humano), não como uma prova garantida de sua exatidão.

## Estruturar o prompt: separar instruções, contexto e dados

Um prompt que mistura instruções, contexto e dados a processar em um único bloco de texto deixa para o modelo a tarefa de adivinhar onde termina um e começa o outro. Delimitar claramente cada parte (tags, aspas triplas, títulos) reduz essa ambiguidade, e também torna mais difícil que um dado injetado no contexto seja interpretado como uma instrução (veja a [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)):

```text
### Instrucoes
Resuma o texto abaixo em 2 frases, em portugues.

### Texto a resumir
"""
{texto_usuario}
"""
```

Especificar o formato de saída esperado (JSON com chaves nomeadas, uma lista com marcadores, uma tabela) nas próprias instruções também evita ter que analisar de volta uma resposta em linguagem livre.

> **Cuidado:** misturar em um único bloco de texto as instruções e um dado externo (entrada do usuário, conteúdo de um arquivo ou site obtido automaticamente...) sem nenhuma separação visual: o modelo então não tem meio confiável de distinguir uma instrução legítima de um texto que, dentro do próprio dado, se faça passar por uma instrução (veja a [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)).
>
> **Boa prática:** sempre delimitar explicitamente cada parte (tags, aspas triplas, títulos) e especificar nas instruções que o conteúdo assim delimitado é um dado a processar, nunca um comando a executar.

## Template: um prompt único para uma tarefa simples

O esqueleto abaixo reúne todas as técnicas anteriores em um único modelo reutilizável, a adaptar tarefa por tarefa: cada seção corresponde a uma técnica vista acima (papel, gestão da ambiguidade, few-shot, verificação, formato):

```text
## Papel
Voce e [papel / especialidade esperada].
Sua missao : [objetivo principal, em uma frase].

## Instrucoes
1. [instrucao precisa]
2. [instrucao precisa]

Restricoes : [conteudo a respeitar] ; [o que evitar].
Se uma informacao necessaria estiver ausente : [faca uma pergunta / sinalize a suposicao feita].

## Contexto
"""
[informacoes necessarias para realizar a tarefa]
"""

## Dados a processar
"""
[texto / codigo / arquivo / problema em questao]
"""

## Exemplo(s)
Entrada : [exemplo de entrada]  ->  Saida esperada : [exemplo de saida]

## Metodo
Antes de concluir, verifique se o resultado respeita bem as restricoes acima.

## Formato de saida
[formato exato esperado : curto / detalhado / estruturado / diretamente utilizavel]
```

Nem todas essas seções são sempre necessárias: uma pergunta simples e já sem ambiguidade não precisa de exemplo nem de uma seção "Contexto" separada. O modelo serve como lista de verificação, não como formulário a preencher integralmente sempre.

## Decompor uma tarefa complexa em vez de um único prompt monolítico

Um único prompt que pede ao mesmo tempo para analisar, calcular e redigir acumula os riscos de erro de cada subtarefa. Dividir em vários prompts menores e encadeados (*prompt chaining*, a saída de um se torna a entrada do seguinte) permite verificar um resultado intermediário antes de continuar, em vez de descobrir um erro só no resultado final. É o mesmo princípio, não automatizado aqui, que motiva o loop dos [agentes](/?c=ia&s=nlp-llm&p=agents): um agente nada mais é que esse encadeamento passando a ser pilotado pelo modelo em vez de por um desenvolvedor que encadeia os prompts manualmente.

Em um projeto de tamanho significativo, essa divisão se estrutura em etapas sucessivas, cada uma limitada a um objetivo preciso antes de passar para a seguinte:

1. **Enquadramento**: objetivos, restrições, recursos disponíveis; pedir ao modelo para identificar as informações ausentes e os riscos, sem ainda produzir nada.
2. **Concepção**: divisão em subtarefas, dependências entre elas, arquitetura geral; sempre sem codificar.
3. **Plano de implementação**: para cada subtarefa: entradas, saída esperada, critérios de sucesso, testes a realizar.
4. **Realização**, uma subtarefa por vez, lembrando em cada prompt o contexto relevante e a arquitetura validada, para não fazer o modelo rededuzi-la a cada etapa.
5. **Verificação independente**: um prompt separado no qual o modelo assume um papel de revisor em vez de autor: essa separação reduz o risco de ele validar seu próprio trabalho sem espírito crítico, um viés mais marcado quando redação e revisão se misturam no mesmo prompt.
6. **Correção**, focada apenas nos problemas apontados na etapa anterior.
7. **Testes**, e depois **finalização**: uma última revisão global que compara o resultado com os requisitos iniciais.

> **Cuidado:** deixar o modelo se apressar para uma implementação antes que o enquadramento e a concepção tenham sido validados: uma pressa frequente, que produz um resultado técnico antes mesmo de o problema estar corretamente colocado.
>
> **Boa prática:** pedir explicitamente ao modelo para não produzir nada ("ainda não codifique") nas etapas de enquadramento e concepção; essa instrução raramente é dispensável.

### Template: uma cadeia de prompts para um projeto complexo

Cada etapa abaixo se torna um prompt separado, cuja saída (validada antes de continuar) alimenta o prompt seguinte:

```text
[1. Enquadramento]
Objetivos : [...]  |  Restricoes : [...]  |  Recursos disponiveis : """[...]"""
-> Nao implemente nada: liste riscos, informacoes ausentes, decisoes a tomar.

[2. Concepcao]
Enquadramento validado : """[saida da etapa 1]"""
-> Divisao em subtarefas, dependencias entre elas, arquitetura geral. Sempre sem codificar.

[3. Plano de implementacao]
Concepcao validada : """[saida da etapa 2]"""
-> Para cada subtarefa: entradas, saida esperada, arquivos envolvidos, criterios de sucesso.

[4. Realizacao de uma subtarefa]
Contexto relevante + arquitetura validada : """[...]"""  |  Subtarefa atual : """[...]"""
-> Realize apenas essa subtarefa; sinalize sem corrigir um problema detectado em outro lugar.

[5. Verificacao independente]
Resultado a verificar : """[saida da etapa 4]"""  |  Criterios de sucesso : """[...]"""
-> Aja como um revisor independente. Nao modifique nada. Classifique os problemas encontrados
   (CRITICO / IMPORTANTE / MENOR), conclua com APROVADO ou A CORRIGIR.

[6. Correcao]
Resultado da verificacao : """[saida da etapa 5]"""
-> Corrija apenas os problemas listados, sem tocar no resto.

[7. Testes e finalizacao]
Estado final : """[...]"""  |  Requisitos iniciais : """[saida da etapa 1]"""
-> Verifique se cada requisito esta satisfeito; liste o que resta, se houver.
```

## Iterar e avaliar em vez de julgar em uma única tentativa

O não determinismo de um LLM (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)) torna uma única tentativa pouco confiável para julgar que um prompt "funciona": uma boa resposta uma vez não garante que ela se repetirá em um caso ligeiramente diferente. Executar sistematicamente um prompt candidato em um pequeno conjunto de casos representativos (o mesmo *golden set* usado para avaliar um sistema em produção, veja [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)) antes de considerá-lo estável é o que distingue o prompt engineering de uma simples tentativa e erro.

> **Cuidado:** validar um prompt em uma única tentativa bem-sucedida, e então considerá-lo confiável. O não determinismo do modelo significa que um mesmo prompt pode produzir uma saída diferente entre uma chamada e outra: um único sucesso não prova nada sobre a confiabilidade geral.
>
> **Boa prática:** executar sistematicamente um prompt candidato em vários casos representativos (um *golden set*) antes de considerá-lo estável, em vez de julgar em uma única tentativa.

## Os limites do prompt engineering

Nenhuma dessas técnicas adiciona conhecimento ou capacidade que o modelo já não tenha adquirido durante seu treinamento: elas apenas exploram ao máximo o que já existe (veja a distinção fine-tuning vs prompting em [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)). Um modelo que nunca viu dados relevantes sobre um assunto, ou que não conhece eventos posteriores à sua data de corte, não vai produzir uma resposta melhor porque o prompt está melhor escrito: é o papel do [RAG](/?c=ia&s=nlp-llm&p=rag) (dados externos) ou do fine-tuning (novas capacidades), não do prompt engineering.

## O que reter

| | |
|---|---|
| **O que reter** | O prompt engineering formula a entrada de um LLM metodicamente: papel e instruções explícitas, identificação de um prompt impreciso antes de se comprometer (por uma pergunta pontual ou por várias direções concretas), exemplos (few-shot), raciocínio passo a passo (chain-of-thought), separação instruções/contexto/dados, decomposição de uma tarefa complexa em etapas verificáveis. Não adiciona nenhuma capacidade que o modelo já não tenha. |
| **Ferramentas úteis** | Um template de prompt reutilizável (veja o modelo acima); um *golden set* de casos representativos para avaliar um prompt antes de considerá-lo estável. |
| **Armadilhas a evitar** | Não especificar a conduta a seguir diante de uma informação ausente. Sistematizar um pedido de refinamento mesmo em um prompt já preciso. Multiplicar as direções propostas ou torná-las muito parecidas entre si. Exemplos few-shot não representativos ou tendenciosos. Misturar instruções e dados sem delimitá-los. Tomar um raciocínio chain-of-thought como prova de exatidão. Apressar-se para a implementação antes de ter validado enquadramento e concepção. Validar um prompt em uma única tentativa bem-sucedida. |
| **Boas práticas** | Sempre especificar a conduta esperada em caso de ambiguidade. Reservar o refinamento para casos de ambiguidade real, com uma suposição padrão além da pergunta. Diante de uma incerteza estilística ou criativa, propor 2-3 direções curtas e claramente distintas em vez de uma pergunta abstrata. Escolher exemplos few-shot representativos da diversidade real dos casos. Sempre delimitar explicitamente instruções, contexto e dados. Executar um prompt em vários casos antes de considerá-lo confiável. |
