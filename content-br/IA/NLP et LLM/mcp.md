---
order: 12
---

# MCP (Model Context Protocol): padronizar as ferramentas de um agente

O [function calling](/?c=ia&s=nlp-llm&p=agents) descreve *como* um modelo chama uma ferramenta (uma descrição JSON, uma decisão do modelo, uma execução do lado do código), mas não *como* essa ferramenta chega até a aplicação que executa o modelo. Sem uma convenção comum, cada aplicação que quer dar acesso a um mesmo serviço (por exemplo, o GitHub) precisa reescrever sua própria integração: seu próprio código para listar os repositórios, criar uma issue etc. O **MCP** (*Model Context Protocol*) é um protocolo padronizado que resolve esse segundo problema: expor ferramentas uma única vez, de forma reutilizável por qualquer aplicação compatível.

> **Analogia:** antes do USB, cada periférico (mouse, impressora, disco rígido) tinha seu próprio conector e exigia um driver escrito sob medida para cada computador. O USB padronizou o conector e o protocolo: um periférico compatível com USB funciona com qualquer computador compatível com USB, sem integração específica. O MCP cumpre o mesmo papel entre uma ferramenta (GitHub, um banco de dados, um sistema de arquivos) e uma aplicação que usa um LLM.

## Cliente e servidor MCP

O MCP retoma o vocabulário cliente/servidor já visto para o [HTTP](/?c=infrastructure&p=api-et-http), com papéis diferentes:

| Papel | Quem é | Exemplo |
|---|---|---|
| **Servidor MCP** | Expõe um serviço específico (ferramentas, dados) segundo o protocolo MCP | Um servidor MCP do GitHub, um servidor MCP para um banco de dados local |
| **Cliente MCP** | A aplicação que executa o modelo e se conecta a um ou mais servidores MCP | Um IDE, um assistente de linha de comando, uma aplicação de chat |

```text
Aplicacao (cliente MCP)  <-- protocolo MCP -->  Servidor MCP do GitHub
           |                                               |
        executa                                    sabe se comunicar
       o modelo                                   com a API do GitHub
```

O mesmo servidor MCP do GitHub funciona, sem nenhuma modificação, com qualquer aplicação compatível com MCP: é o servidor que carrega a integração com o GitHub, uma única vez, não cada aplicação que o utiliza.

## Três tipos de recursos expostos

Um servidor MCP pode oferecer três coisas distintas, não apenas ferramentas:

| Tipo | Papel | Exemplo |
|---|---|---|
| **Tools** | Funções que o modelo pode decidir chamar (o [function calling](/?c=ia&s=nlp-llm&p=agents) de sempre) | `create_issue`, `list_pull_requests` |
| **Resources** | Dados que o cliente pode ler e fornecer como contexto ao modelo, sem chamada decidida pelo próprio modelo | O conteúdo de um arquivo, o esquema de um banco de dados |
| **Prompts** | Templates de prompt reutilizáveis, fornecidos pelo servidor em vez de escritos à mão em cada aplicação | Um template "resuma esta pull request" pronto para uso |

## Transporte: local ou remoto

Um cliente MCP se comunica com um servidor MCP por um destes dois canais:

| Transporte | Princípio | Caso de uso típico |
|---|---|---|
| `stdio` | O servidor roda como um processo local, comunicação por entrada/saída padrão | Uma ferramenta que acessa o sistema de arquivos local |
| HTTP / SSE | O servidor roda remotamente, comunicação via rede | Um serviço compartilhado entre vários usuários ou máquinas |

> **Cuidado:** conectar um cliente a um servidor MCP concedendo a ele mais permissões do que o necessário (um servidor "arquivos" que pode escrever em todo o disco em vez de uma pasta específica), o mesmo risco de um acesso a um parâmetro livre em function calling.
>
> **Boa prática:** limitar cada servidor MCP ao escopo estritamente necessário (uma pasta específica, um banco somente leitura), e exigir uma confirmação humana antes de qualquer ação com consequência real, exatamente como para um [agente](/?c=ia&s=nlp-llm&p=agents) clássico.

## O que reter

| | |
|---|---|
| **O que reter** | O MCP padroniza a forma como uma ferramenta (tool), um dado (resource) ou um template de prompt é exposto a uma aplicação que executa um LLM, para que um mesmo servidor MCP seja reutilizável por qualquer cliente compatível, sem integração reescrita a cada vez. |
| **Ferramentas úteis** | Um servidor MCP por serviço a integrar (GitHub, banco de dados, sistema de arquivos...); transporte `stdio` localmente, HTTP/SSE remotamente. |
| **Armadilhas a evitar** | Conceder a um servidor MCP mais permissões do que o escopo realmente necessário. |
| **Boas práticas** | Limitar cada servidor MCP ao escopo estritamente necessário; exigir uma confirmação humana antes de qualquer ação com consequência real. |
