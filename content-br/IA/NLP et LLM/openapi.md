---
order: 10
---

# OpenAPI: descrever um contrato de API, para humanos e para máquinas

O capítulo sobre [APIs e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) apresenta uma API como um servidor que responde a requisições estruturadas. Mas nada, na própria API, diz de antemão quais rotas existem, quais parâmetros esperam, nem qual formato de resposta esperar: essa informação precisa ser descrita em algum lugar. O **OpenAPI** é o formato padrão (YAML ou JSON) mais usado para essa descrição: um único arquivo que documenta cada endpoint de uma API REST, legível tanto por um humano quanto por ferramentas.

## Um contrato, dois usos

```yaml
# openapi.yaml (trecho)
paths:
  /clima:
    get:
      summary: Recupera o clima de uma cidade
      parameters:
        - name: cidade
          in: query
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Clima encontrado
          content:
            application/json:
              schema:
                type: object
                properties:
                  temperatura: { type: number }
                  condicoes: { type: string }
```

| Uso | O que oferece |
|---|---|
| Documentação legível | Uma interface gerada automaticamente (estilo Swagger UI) onde um desenvolvedor explora as rotas disponíveis sem ler o código |
| Geração de ferramentas | Um cliente HTTP gerado automaticamente na linguagem escolhida, a partir apenas da spec |
| Verificação | A spec pode ser testada contra a implementação real, para detectar uma diferença entre o que está documentado e o que é realmente servido |

O mesmo arquivo serve então tanto de documentação quanto de **fonte de verdade verificável**: diferente de um comentário de código ou uma página de wiki, uma diferença entre a spec e o comportamento real da API pode ser detectada automaticamente.

## A ligação com os agentes LLM: descrever ações, não apenas rotas

O [function calling](/?c=ia&s=nlp-llm&p=agents) permite que um modelo decida chamar uma ferramenta, descrita por um nome, parâmetros e seu tipo. Um arquivo OpenAPI já existente fornece **exatamente** essa descrição para uma API REST: em vez de reescrever manualmente cada rota no formato esperado pelo function calling, um agente pode ler diretamente o arquivo OpenAPI de uma API e deduzir quais ações pode chamar.

| | OpenAPI | [MCP](/?c=ia&s=nlp-llm&p=mcp) |
|---|---|---|
| Natureza | Um contrato **estático**: um arquivo que descreve uma API REST já existente | Um **protocolo de execução**: um cliente e um servidor que se comunicam ao vivo |
| O que descreve | Rotas HTTP clássicas, originalmente pensadas para qualquer cliente (não só um LLM) | Ferramentas, dados e prompts pensados desde o início para um cliente que roda um LLM |
| Origem | Anterior aos LLMs, reaproveitado para eles (GPT Actions, function calling) | Projetado especificamente para padronizar a integração de um LLM com ferramentas externas |

Os dois não se opõem: uma integração pode expor uma API REST clássica documentada em OpenAPI, e depois um servidor MCP vem envolvê-la para torná-la diretamente utilizável por um cliente compatível com MCP, sem reescrever a integração.

> **Armadilha:** deixar um arquivo OpenAPI se distanciar da implementação real com o tempo (uma rota adicionada sem atualizar a spec, um parâmetro renomeado). Um agente que se apoia nessa spec para saber quais chamadas são possíveis pode então tentar uma chamada inválida, ou ignorar uma ação realmente disponível.
>
> **Boa prática:** gerar a spec OpenAPI diretamente a partir do código (anotações, decorators conforme o framework) em vez de mantê-la manualmente em paralelo, ou testá-la automaticamente contra a implementação real (teste de contrato) para detectar qualquer desvio assim que ele aparecer.

---

## 📋 O que reter

| | |
|---|---|
| **O que reter** | O OpenAPI descreve, em um único arquivo (YAML/JSON), as rotas de uma API REST: parâmetros, formatos de resposta. Serve tanto de documentação legível quanto de contrato verificável. Cada vez mais reaproveitado para descrever a um agente LLM quais ações ele pode chamar. |
| **Ferramentas úteis** | Uma interface de documentação gerada (estilo Swagger UI), um cliente HTTP gerado a partir da spec, um teste de contrato comparando a spec com a implementação real. |
| **Armadilhas a evitar** | Deixar a spec se distanciar da implementação real sem detectar isso. |
| **Boas práticas** | Gerar a spec a partir do código em vez de mantê-la manualmente em paralelo; testá-la automaticamente contra a API real. |
