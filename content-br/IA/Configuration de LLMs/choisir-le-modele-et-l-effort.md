---
order: 2
---

# Escolher o modelo e o nível de esforço do Claude

> **Valores verificados em 11/10/2026.** Os modelos, os níveis de esforço e os preços mudam: verificar a documentação oficial da [Anthropic](https://www.anthropic.com), a empresa que desenvolve o Claude, na [página dos modelos](https://docs.claude.com/en/docs/about-claude/models) e na [página de preços](https://www.anthropic.com/pricing).

**Claude** é uma família de [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) (grandes modelos de linguagem, programas que produzem texto). Dois ajustes determinam o resultado e a conta: o **modelo** (qual programa responde) e o **esforço** (quanto trabalho ele faz antes de responder). Uma escolha ruim custa caro nos dois sentidos: fraco demais, a tarefa falha; forte demais, paga-se por [tokens](/?c=ia&s=nlp-llm&p=nlp-et-llm) (os fragmentos de palavras que o modelo lê e escreve, e que são cobrados) sem necessidade. Este capítulo dá as referências para escolher e depois mostra onde definir cada ajuste no [Claude Code](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) e na [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (o meio de enviar requisições a um serviço a partir de um programa).

## Dois ajustes distintos

| Ajuste | Pergunta | O que muda |
|---|---|---|
| Modelo | Qual programa responde? | O preço por token, a capacidade de raciocínio, o tempo de resposta (a latência, ver [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)) |
| Esforço | Que trabalho ele faz nesta resposta? | O número de tokens produzidos, portanto o custo e o tempo; um esforço baixo também gera menos chamadas de ferramentas (ações como ler um arquivo, ver [Agentes](/?c=ia&s=nlp-llm&p=agents)), menos preâmbulo (texto introdutório antes de agir) e confirmações mais breves |

Os dois se combinam e se escolhem juntos, como mostra a árvore de decisão mais abaixo.

## Os modelos atuais

Cada modelo tem um **identificador de API**: a sequência exata de caracteres a fornecer quando um programa chama o serviço pela API. Os preços são em dólares por milhão de tokens (M). A **entrada** designa os tokens enviados ao modelo (o [prompt](/?c=ia&s=nlp-llm&p=prompt-engineering), a instrução e os documentos fornecidos), a **saída** os que ele produz (a resposta), mais caros.

| Modelo | Identificador de API | Entrada ($/M) | Saída ($/M) | Esforço padrão | Quando escolher |
|---|---|---|---|---|---|
| Claude Haiku 5.5 | `claude-haiku-5-5` | 0,10 | 0,50 | medium | Tarefas simples e numerosas (classificar, extrair, conversar), subagentes: o mais barato |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 2,00 | 10,00 | high | Nível intermediário: quando o Haiku falha em uma amostra real (algumas tarefas representativas do próprio trabalho) e o sobrecusto do Opus não se justifica |
| Claude Opus 5.5 | `claude-opus-5-5` | 4,00 | 20,00 | medium | Quando o Sonnet falha em uma amostra real; o raciocínio dele não pode ser desativado, o esforço é o seu único ajuste de profundidade |
| Claude Fable 5.1 | `claude-fable-5-1` | 10,00 | 50,00 | high | O mais caro: somente quando o Opus falha com um esforço adequado |

Duas precisões:

- O Haiku 5.5 é cobrado pelo preço acima para prompts de até 100.000 tokens; acima disso, 0,50 $ na entrada e 2,50 $ na saída.
- Os quatro modelos têm uma janela de contexto de 1 milhão de tokens: a quantidade máxima de texto (prompt e resposta incluídos) que eles processam de uma vez (ver [a janela de contexto](/?c=ia&s=nlp-llm&p=llm-en-production)).

A coluna « Quando escolher » aplica uma regra simples: pegar o modelo mais barato que tem sucesso em uma amostra real das próprias tarefas, e subir um degrau somente se uma medição o exigir.

## Os níveis de esforço

Os quatro modelos aceitam os mesmos cinco níveis, do mais econômico ao mais custoso. A referência oficial é dada para cada um, com um exemplo de tarefa.

| Nível | Referência oficial | Exemplo concreto |
|---|---|---|
| `low` | Subagentes, tarefas simples, chat, classificação | Classificar uma mensagem de suporte ao cliente em uma de três categorias (faturamento, bug, outra); um [subagente](/?c=ia&s=nlp-llm&p=agents) (agente secundário lançado por outro agente para uma subtarefa) que procura em qual arquivo está uma função |
| `medium` | Nível econômico e ponto de partida para código agêntico (um agente que lê, modifica e testa código) | Modificar uma função cujo comportamento esperado está descrito com precisão, depois rodar os testes |
| `high` | Bom equilíbrio qualidade/tokens; mínimo para um trabalho em que a qualidade depende diretamente da finura do raciocínio | Fazer uma revisão de código (reler modificações para encontrar erros) de um módulo de pagamento |
| `xhigh` | Recomendado para a maioria dos usos de código e de agentes, sobretudo os longos | Acrescentar uma funcionalidade que toca uma dezena de arquivos, em várias etapas encadeadas |
| `max` | Quando a precisão conta mais que o custo, somente se uma medição mostrar uma margem no nível inferior | Uma anomalia intermitente (que só aparece de vez em quando), cuja causa continua desconhecida após uma tentativa completa em `xhigh` |

## O custo: avaliar por tarefa concluída

O custo de uma chamada é: tokens de entrada × preço de entrada + tokens de saída × preço de saída. Exemplo calculado a partir da tabela dos modelos, para uma tarefa de 100.000 tokens de entrada e 20.000 de saída (sem considerar o efeito do esforço, que faz variar a saída):

| Modelo | Entrada (0,1 M) | Saída (0,02 M) | Total |
|---|---|---|---|
| Haiku 5.5 | 0,01 $ | 0,01 $ | 0,02 $ |
| Sonnet 5.5 | 0,20 $ | 0,20 $ | 0,40 $ |
| Opus 5.5 | 0,40 $ | 0,40 $ | 0,80 $ |
| Fable 5.1 | 1,00 $ | 1,00 $ | 2,00 $ |

Subir o esforço faz crescer a saída, portanto a conta. Mas o bom indicador não é o preço de uma requisição: é o custo por **tarefa concluída**. Uma requisição mais barata que obriga a encadear mais turnos (trocas sucessivas com o modelo) não custa menos no total. O acompanhamento se faz como para qualquer [custo de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm).

O nível `max` segue, portanto, uma regra estrita: só se justifica para um problema de fronteira (sem solução conhecida), **após uma falha constatada em `xhigh`**. Nunca por padrão, nunca por precaução.

## O que um esforço maior não garante

| Limite | Explicação |
|---|---|
| Retornos decrescentes | Cada degrau custa mais tokens e tempo, por um ganho de qualidade cada vez menor, até nulo em uma tarefa já bem-sucedida no nível inferior |
| Excesso de reflexão | Em uma tarefa simples, um esforço alto gasta tokens examinando o que não precisava ser examinado |
| Nenhuma verdade garantida | Um esforço alto não elimina as [alucinações](/?c=ia&s=nlp-llm&p=llm-en-production) (afirmações inventadas, enunciadas com segurança): o resultado deve sempre ser verificado |
| Nenhum substituto para uma boa instrução | Um pedido vago continua vago em `max`: a [redação do prompt](/?c=ia&s=nlp-llm&p=prompt-engineering) tem prioridade |

## Árvore de decisão

```text
Tarefa a confiar ao Claude
        │
        ▼
1. MODELO: partir do mais barato (Haiku 5.5), testá-lo em uma amostra real
        │
        ├─ tem sucesso ──────────► mantê-lo
        └─ falha ────────────────► Sonnet 5.5, depois Opus 5.5, depois Fable 5.1
        │
        ▼
2. ESFORÇO: partir do padrão do modelo, aumentar somente se a tarefa
   justificar concretamente (ambiguidade forte, alto risco, falha constatada)
        │
        ├─ simples, subagente, classificação ──► low
        ├─ código bem especificado ────────────► medium
        ├─ revisão, trabalho sensível ─────────► high
        ├─ código ou agente longo ─────────────► xhigh
        └─ falha constatada em xhigh, problema
           sem solução conhecida ──────────────► max
        │
        ▼
3. Medir o custo por tarefa concluída: insuficiente? subir um degrau e medir de novo
```

## Pedir um nível no Claude Code e na API

[Claude Code](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) é o assistente de IA que se pilota a partir de um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Uma **sessão** é uma conversa em andamento. A escolha se faz em três lugares:

| Onde | Ajuste | Alcance |
|---|---|---|
| Sessão do Claude Code | Comandos `/model` e `/effort` | A sessão em andamento e as novas sessões (ajuste salvo por padrão) |
| Definição de agente | Linhas `model:` e `effort:` do cabeçalho do arquivo | Cada vez que este [agente](/?c=ia&s=nlp-llm&p=agents) é chamado |
| API | Campo `output_config` com `effort` | A requisição enviada |

### Na sessão

```text
/model sonnet
```

Um comando que começa com `/` se digita na conversa do Claude Code. `/model <nome>` muda o modelo da sessão e o salva como padrão para as novas sessões.

```text
/effort medium
```

`/effort <nível>` ajusta o esforço. Resposta observada: « Set effort level to medium (saved as your default for new sessions): Balanced approach with standard implementation and testing ». O nível continua aplicado às sessões seguintes: restaure-o ao valor habitual depois de uma necessidade pontual.

### Em uma definição de agente

Uma definição de agente é um arquivo da pasta `~/.claude/agents/` (o `~` designa a pasta pessoal do usuário, ver [árvore de diretórios e caminhos](/?c=fondamentaux&s=bases-de-l-informatique&p=arborescence-et-chemins)), chamado `<nome>.md`. Seu **cabeçalho** (*frontmatter*) é um bloco de ajustes delimitado por duas linhas `---`, no formato [YAML](/?c=infrastructure-devops&s=docker&p=docker-compose) (linhas `chave: valor`). Trecho do arquivo real `builder-sonnet-medium.md` (descrição abreviada e traduzida; as linhas `tools` e `color`, sem relação com o assunto, são omitidas):

```yaml
---
# Início do cabeçalho
name: builder-sonnet-medium
# Nome pelo qual o agente é chamado
description: Realiza UMA subtarefa de um plano validado (sonnet, effort medium : trabalho cotidiano).
# Papel do agente em uma frase
model: sonnet
# Modelo do agente: um nome curto é aceito aqui
effort: medium
# Nível de esforço do agente: low, medium, high, xhigh ou max
---
# Fim do cabeçalho: o texto que segue no arquivo contém as instruções do agente
```

O arquivo `builder-haiku.md` traz `model: haiku`, mas nenhuma linha `effort:`: o arquivo portanto não fixa nenhum esforço. Sua descrição diz « sans effort » (sem esforço), o que significa aqui « nenhuma configuração definida », e não « o Haiku não lida com esforço »: o Haiku 5.5 aceita os cinco níveis.

### Do lado da API

Uma requisição é uma mensagem [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) (um formato de troca de dados em texto) enviada ao serviço. O esforço se define no campo `output_config`:

```text
// Conteúdo parcial da requisição: os outros campos (as mensagens, em especial) são omitidos
{
    // Identificador de API do modelo (ver a tabela de modelos)
    "model": "claude-sonnet-5-5",
    // Ajustes da saída; "effort" recebe um dos cinco níveis
    "output_config": { "effort": "medium" }
}
```

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| Escolher `max` por padrão ou por precaução | Custo máximo para um ganho quase sempre nulo: ele se reserva a uma falha constatada em `xhigh` |
| Subir o esforço antes de medir | Sem medição em uma amostra real, não se sabe se o nível inferior bastaria |
| Julgar o custo por requisição | Uma requisição mais barata que exige mais turnos custa igual ou mais por tarefa concluída |
| Comparar dois modelos com esforços diferentes | Os padrões diferem (Sonnet 5.5 em `high`, Opus 5.5 em `medium`): a comparação não mede mais o modelo sozinho |
| Esquecer que um ajuste fica salvo | `/model` e `/effort` persistem para as novas sessões: um nível alto deixado no lugar cobra cada sessão seguinte |
| Achar que o Haiku não lida com nenhum esforço | Verdade para os antigos Haiku 4.5, falso para a geração atual: o Haiku 5.5 aceita de `low` a `max` |
| Contar com o esforço para compensar uma instrução vaga | Ele aprofunda o raciocínio, não adivinha a intenção: esclarecer o prompt primeiro |
| Confiar em valores da memória | Modelos, níveis e preços mudam: reler a documentação oficial antes de decidir |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Começar pelo modelo mais barato e pelo esforço padrão dele | É o ponto de partida mais econômico; sobe-se somente se a tarefa justificar |
| Aumentar por um motivo concreto: ambiguidade forte, alto risco ou falha constatada | Cada degrau tem um custo; um motivo preciso evita pagá-lo sem necessidade |
| Reservar `max` para uma falha constatada em `xhigh` num problema sem solução conhecida | É o único caso em que a margem extra pode valer o preço |
| Medir em uma amostra real antes de subir um padrão | Uma medição prevalece sobre a intuição (ver [medir antes de otimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)) |
| Definir o nível no cabeçalho de cada agente | Cada papel mantém seu modelo e seu esforço, por exemplo `low` para um subagente de pesquisa |
| Acompanhar o custo por tarefa concluída | É o único indicador que conta os turnos extras |

## O que reter

| | |
|---|---|
| **O que reter** | Dois ajustes: o modelo (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1, do mais barato ao mais caro) e o esforço (`low`, `medium`, `high`, `xhigh`, `max`). Começa-se pelo padrão e aumenta-se somente por um motivo concreto. `max` é reservado a uma falha constatada em `xhigh`. No Claude Code: `/model`, `/effort`, as linhas `model:` e `effort:` de um agente; na API: `output_config`. |
| **Armadilhas a evitar** | `max` por padrão, subir sem medir, julgar o custo por requisição, comparar com esforços diferentes, esquecer que um ajuste fica salvo, achar que o Haiku 5.5 não lida com esforço, esperar que o esforço corrija uma instrução vaga. |
| **Boas práticas** | O mais barato primeiro, medir em uma amostra real, definir o nível no cabeçalho dos agentes, julgar o custo por tarefa concluída, conferir a documentação oficial. |
