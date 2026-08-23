---
order: 5
---

# Agentes: loop de reflexão/ação e orquestração

Um LLM sozinho só produz texto a partir de texto (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)): ele não pode consultar um banco de dados atualizado, nem executar um cálculo confiável, nem enviar um e-mail. Um **agente** é a forma de superar essa limitação: dá-se ao modelo **ferramentas** que ele pode decidir chamar, e um loop que repete a operação até que ele tenha o suficiente para responder.

## Dar uma ferramenta a um modelo: o function calling

O mecanismo básico se chama *function calling* (ou *tool use*): o modelo recebe, além do prompt, a descrição estruturada de uma ou várias funções disponíveis (seu nome, o que fazem, os parâmetros que esperam), um simples documento [JSON](/?c=infrastructure&p=json):

```json
{
  "name": "obter_clima",
  "description": "Retorna o clima atual para uma cidade dada",
  "parameters": {
    "cidade": { "type": "string", "description": "Nome da cidade" }
  }
}
```

O modelo não consegue executar essa função ele mesmo; ele apenas **decide** que ela seria útil aqui, e produz os argumentos a passar para ela, também em JSON:

```json
{ "chamada": "obter_clima", "argumentos": { "cidade": "Curitiba" } }
```

É o código em volta do modelo que recebe essa decisão, executa de fato a função correspondente (Python, a chamada [HTTP](/?c=infrastructure&p=api-et-http), a consulta [SQL](/?c=domain-specific-languages-dsl&p=sql)...), e devolve seu resultado ao modelo para que ele continue.

> **Cuidado:** confiar cegamente nos argumentos produzidos pelo modelo antes de passá-los para a função real: o modelo nunca "sabe" de verdade o que uma função faz além de sua descrição em texto; uma descrição imprecisa ou ambígua produz chamadas com os argumentos errados tão certeiramente quanto uma função mal documentada engana um desenvolvedor humano que só lesse sua assinatura.
>
> **Boa prática:** validar os argumentos recebidos (tipos, valores esperados) antes de executar a função real, exatamente como se validaria uma entrada vinda de qualquer fonte não confiável.

## JSON Schema: um sistema de tipos para os argumentos de uma ferramenta

A seção `parameters` do exemplo anterior segue uma convenção padrão chamada **JSON Schema**: ela cumpre o mesmo papel que um sistema de tipos em uma linguagem clássica, expresso em JSON em vez de na sintaxe da linguagem.

| JSON Schema | Equivalente em uma linguagem tipada clássica |
|---|---|
| `type: "string"` / `"integer"` / `"boolean"` | `string` / `int` / `bool` |
| `type: "array", items: {...}` | Um array/lista tipada |
| `type: "object", properties: {...}, required: [...]` | Uma struct/classe com campos obrigatórios |
| `enum: ["fr", "en", "es"]` | Um tipo enumerado |

Uma linguagem tipada clássica valida uma chamada descrita em JSON Schema com suas próprias ferramentas: em [Python](/?c=langages-de-programmation&s=python&p=python), a biblioteca **Pydantic** transforma diretamente um esquema em uma classe validada; em Node.js, a biblioteca **Ajv** valida um objeto JSON contra um esquema; em Go, as tags `json` nos campos de uma struct cumprem um papel parecido, sem uma biblioteca de validação JSON Schema tão padrão quanto as duas anteriores.

## Um parâmetro livre em vez de um valor fixo: de onde vem a variação

O parâmetro `cidade` do exemplo anterior só assume valores de um conjunto limitado e previsível (nomes de cidades). Nada obriga um parâmetro a ser tão restrito: ele pode igualmente ser um **texto livre que o próprio modelo escreve**, como um comando shell, uma consulta SQL ou um trecho de código:

```json
{
  "name": "executar_bash",
  "description": "Executa um comando shell e retorna sua saida padrao",
  "parameters": {
    "comando": { "type": "string", "description": "O comando a executar" }
  }
}
```

A função que realmente executa essa ferramenta (do lado do código, não do modelo) é tão básica quanto parece: geralmente um simples `subprocess.run(comando)` que lança a string recebida sem entender nada dela. Ela nunca muda entre duas chamadas. O que varia é o **conteúdo de `comando`**, composto de novo pelo modelo a cada chamada de acordo com o que ele acabou de aprender:

```text
Turno 1 -> o modelo gera : { "comando": "ls -la /var/log" }
        -> resultado : a lista dos arquivos de log
Turno 2 -> o modelo gera : { "comando": "grep ERROR /var/log/app.log | tail -20" }
        -> mesma ferramenta, mesma funcao Python por tras, comando totalmente diferente
```

É exatamente isso que permite a um agente produzir comandos bash diferentes a cada vez para uma mesma ferramenta: a função executada não muda (ela apenas obedece), mas o texto que ela recebe é escrito na hora pelo modelo, como um humano que digitaria um comando diferente de acordo com o que acabou de ver aparecer no terminal.

> **Cuidado:** um parâmetro livre carrega um risco muito mais alto que um parâmetro restrito: nada garante que o texto gerado pelo modelo esteja correto, nem mesmo que seja inofensivo. Um comando shell gerado pelo modelo pode conter, por acidente ou por manipulação (veja a [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)), os mesmos caracteres especiais que tornam possível uma [injeção de comando](/?c=shells&s=bash&p=variables).
>
> **Boa prática:** tratar qualquer parâmetro livre gerado por um modelo com a mesma desconfiança que uma entrada de usuário não controlada: nunca interpolá-lo cegamente em um comando ou consulta sem as mesmas precauções de sempre.

## O loop reflexão/ação (ReAct)

Ter ferramentas disponíveis (seção anterior) não basta, por si só, para fazer um agente: um programa que chama uma lista fixa de funções em uma ordem escrita antecipadamente por um desenvolvedor continua sendo um script clássico, mesmo que consulte um LLM em uma etapa. O que faz com que se chame isso de agente é que **o modelo decide ele mesmo, em cada etapa, o que fazer a seguir** (qual ferramenta chamar, com quais argumentos, ou se já terminou), de acordo com o resultado das etapas anteriores, sem que nenhum humano tenha escrito esse fluxo com antecedência. Um agente é, portanto, essa sequência repetida até que o modelo julgue ter elementos suficientes para responder, em vez de uma simples troca pergunta/resposta, ou de um script de sequência fixa:

```text
1. O modelo recebe a pergunta e o historico
2. Ele decide: responder diretamente, OU chamar uma ferramenta
3. Se ferramenta: o codigo a executa, o resultado e adicionado ao historico
4. Volta a etapa 1, com esse novo elemento de contexto
```

Esse padrão, muitas vezes chamado de [*ReAct*](https://arxiv.org/abs/2210.03629) (*Reasoning + Acting*), permite encadeamentos com várias etapas: buscar uma informação, usá-la para refinar uma segunda busca, calcular um resultado intermediário, antes de compor a resposta final, cada etapa se apoiando no resultado real da anterior em vez de uma suposição do modelo.

## Os riscos próprios de um loop pilotado por um modelo não determinístico

Um loop clássico para em uma condição conhecida com antecedência. Um loop de agente para quando o modelo **decide** parar, uma decisão não garantida, tomada por um sistema que pode errar (veja as limitações do capítulo [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)).

> **Cuidado:** um loop não limitado. Sem um limite explícito no número de turnos, um modelo que não consegue concluir pode repetir chamadas indefinidamente.
>
> **Boa prática:** impor um limite rígido (número de turnos, orçamento de tokens), no mesmo espírito de um timeout em qualquer chamada de rede.

> **Cuidado:** um custo que se acumula silenciosamente. Cada turno do loop é uma chamada LLM completa, cobrada independentemente (veja [o custo em produção](/?c=ia&s=nlp-llm&p=llm-en-production)): responder em um único turno custa o preço de uma chamada, um agente que precisou de 20 turnos para chegar à sua resposta cobrou 20, mesmo que o usuário tenha feito apenas uma pergunta. O multiplicador é na prática pior que um simples x20: a cada turno, todo o histórico dos turnos anteriores (pergunta inicial, chamadas de ferramentas, resultados obtidos) é enviado de novo como entrada do modelo para que ele mantenha o contexto: o prompt do turno 20 é, portanto, muito maior que o do turno 1, de modo que o custo total cresce mais rápido que o próprio número de turnos.
>
> **Boa prática:** monitorar o custo acumulado de um loop de agente em produção (veja o [monitoramento de custo](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), não apenas o custo médio por pergunta: o ganho de um agente nem sempre é proporcional a esse custo adicional.

> **Cuidado:** ações irreversíveis decididas por um sistema falível. Um agente que pode enviar um e-mail ou modificar um banco de dados também pode fazê-lo erroneamente, com base em um raciocínio equivocado.
>
> **Boa prática:** exigir uma confirmação humana antes de qualquer ação com consequência real (financeira, destrutiva, visível publicamente); para um sistema classificado como de alto risco, é uma obrigação legal explícita da [regulamentação europeia de IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia), não apenas uma boa prática.

## Um agente, ou vários que dividem o trabalho?

Duas arquiteturas se opõem para tarefas complexas:

| | Um agente generalista | Vários agentes especializados |
|---|---|---|
| Princípio | Um único modelo, muitas ferramentas disponíveis | Cada agente tem um papel restrito (busca, redação, verificação) e transmite seu resultado ao seguinte |
| Vantagem | Mais simples de construir e acompanhar | Cada agente permanece focado em uma tarefa que domina melhor, mais fácil de avaliar isoladamente |
| Desvantagem | Um prompt de sistema que cresce a cada ferramenta adicionada, até diluir a atenção do modelo | Coordenação a ser projetada explicitamente (quem fala com quem, em que ordem, o que fazer se um agente falhar) |

A escolha segue a mesma lógica de outros lugares na arquitetura de software: um único agente generalista basta enquanto a tarefa permanecer limitada; a especialização se justifica quando a complexidade (número de ferramentas, extensão do raciocínio) começa a degradar a confiabilidade de um agente único.

## Coordenar vários agentes: os padrões comuns

"Coordenação a ser projetada explicitamente" cobre, na prática, alguns padrões recorrentes, não incompatíveis entre si:

| Padrão | Princípio | Adequado quando |
|---|---|---|
| **Encadeamento sequencial** (*pipeline*) | A saída do agente A se torna a entrada do agente B, em uma ordem fixa (ex.: um agente "busca" e depois um agente "redação") | As etapas são conhecidas com antecedência e sempre são executadas na mesma ordem |
| **Orquestrador/trabalhadores** | Um agente "orquestrador" decompõe a tarefa, decide qual agente especializado chamar e em que ordem, e então reúne seus resultados | A ordem das etapas depende da própria tarefa e não pode ser fixada com antecedência |
| **Estado compartilhado** (*blackboard*) | Os agentes não falam diretamente entre si: eles leem e escrevem em um espaço comum (um banco, um documento compartilhado), cada um reagindo ao que os outros depositaram ali | Vários agentes precisam colaborar sem dependência estrita de ordem, cada um contribuindo quando tiver o que oferecer |
| **Avaliador/otimizador** | Um agente gera uma primeira versão, um segundo papel (o mesmo modelo ou outro) a critica de acordo com critérios explícitos, e então uma nova versão incorpora essa crítica, repetido até um critério de parada (veja o detalhe em [O assistente de IA agêntico no terminal](/?c=ia&s=applications-llm&p=assistant-agentique-terminal)) | A qualidade da saída importa mais que a latência, e existe um critério de julgamento explícito (checklist, testes, formato esperado) |

Qualquer que seja o padrão escolhido, cada subagente começa por padrão com um contexto **vazio**: é o prompt redigido pelo agente que chama que constitui todo o contexto transmitido, não uma herança automática do histórico do agente pai. Um subagente que precise de uma informação estabelecida antes na conversa deve recebê-la explicitamente nesse prompt, salvo mecanismo dedicado de cópia completa do histórico.

> **Cuidado:** com um estado compartilhado principalmente, nada impede que dois agentes ajam com base em informações que se tornaram inconsistentes entre si (um leu o estado antes que o outro o modificasse), a mesma classe de problema que um acesso concorrente a um recurso compartilhado na programação clássica.
>
> **Boa prática:** prever explicitamente, para cada um desses três padrões, o que fazer se um agente falhar ou produzir um resultado inutilizável (um agente "verificador" intercalado, um controle de formato na saída de cada etapa) e quem tem a palavra final em caso de escrita concorrente, as mesmas soluções de um acesso concorrente clássico (bloqueio, um único agente autorizado a escrever por vez).

## O que reter

| | |
|---|---|
| **O que reter** | Um agente dá ferramentas a um LLM (function calling) e o deixa decidir por si mesmo, a cada etapa, qual ferramenta chamar e quando parar (loop ReAct), em oposição a um script de sequência fixa escrito com antecedência. |
| **Ferramentas úteis** | Uma descrição JSON de cada ferramenta disponível (nome, parâmetros, descrição); um limite de turnos/orçamento para restringir o loop. |
| **Armadilhas a evitar** | Confiar cegamente nos argumentos gerados pelo modelo. Um parâmetro livre (comando, consulta) tratado sem as mesmas precauções de uma entrada não confiável. Um loop não limitado. Um custo que se acumula silenciosamente. Uma ação irreversível decidida sem confirmação humana. |
| **Boas práticas** | Validar os argumentos recebidos antes de executar uma ferramenta. Tratar qualquer parâmetro livre gerado pelo modelo como uma entrada não confiável. Impor um limite rígido no número de turnos. Monitorar o custo acumulado de um loop. Exigir confirmação humana antes de qualquer ação com consequência real. |
