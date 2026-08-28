---
order: 1
---

# Hooks: automatizar um agente LLM em pontos precisos de seu ciclo de vida

Um [assistente agêntico](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) roda, turno após turno, em um [loop reflexão/ação](/?c=ia&s=nlp-llm&p=agents): ele recebe uma requisição, decide chamar uma ferramenta ou não, recebe um resultado, recomeça. Esse loop é executado por um programa (a aplicação ou a ferramenta de linha de comando que hospeda o agente), não pelo modelo em si: esse programa é o **harness**. Um **hook** é um trecho de código que o harness executa por conta própria em um ponto preciso desse loop, sem nunca passar pelo modelo: ele roda sempre, que o modelo pense nisso ou não. Este capítulo explica esse mecanismo como um padrão geral de configuração de LLMs, com um agente de linha de comando como ilustração concreta (o Claude Code serve de exemplo, mas o princípio se encontra, sob outros nomes, na maioria das ferramentas agênticas).

## O problema: uma instrução no prompt nunca é garantida

Pedir ao modelo para fazer algo sistematicamente ("releia sempre o arquivo antes de modificá-lo", "avise-me antes de qualquer exclusão") continua sendo um simples pedido dirigido a um sistema probabilístico (veja os [limites de um LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)): nada força sua execução.

| | Instrução no prompt | Hook |
|---|---|---|
| Quem executa | O modelo, se ele escolher segui-la | O harness, fora do modelo |
| Garantia de execução | Nenhuma: pode ser esquecida, contornada, diluída por um contexto longo | Sistemática: o código roda a cada ocorrência do ponto de ancoragem |
| Pode ser ignorada por um dado manipulado (*[prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)*) | Sim | Não: ela nunca passa pelo raciocínio do modelo |

## O princípio: um gatilho, uma ação, fora do controle do modelo

O mecanismo retoma a ideia de um [gatilho que dispara uma ação](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) (um e-mail recebido dispara um fluxo de trabalho) ou de um [`addEventListener` em uma página web](/?c=langages&s=javascript&p=dom-et-evenements) (um clique dispara uma função): um evento ocorre, uma função é executada em reação. Aqui, o evento não é mais uma ação do usuário nem um e-mail, mas um ponto preciso do ciclo de vida do agente.

```text
Evento do ciclo de vida do agente
        │
        ▼
   ┌─────────┐
   │  Hook   │  ← código escrito pelo desenvolvedor, não pelo modelo
   └─────────┘
        │
        ▼
Decisão: deixar passar / bloquear / modificar / adicionar contexto
```

## Os pontos de ancoragem típicos de um agente

Os nomes exatos variam de uma ferramenta para outra, mas os mesmos momentos se repetem em toda parte:

| Ponto de ancoragem (nome genérico) | Se dispara | Exemplo de uso |
|---|---|---|
| Início de sessão | No lançamento ou na retomada de uma conversa | Carregar um contexto de projeto, verificar um estado externo |
| Antes da chamada de uma ferramenta | Pouco antes de o agente executar uma ação (comando, escrita de arquivo...) | Bloquear um comando perigoso, pedir uma confirmação |
| Depois da chamada de uma ferramenta | Logo após o resultado de uma ação | Formatar automaticamente um arquivo que acabou de ser modificado |
| Antes do envio ao modelo | Pouco antes de o prompt partir para o modelo | Injetar uma informação atualizada (data, estado de um sistema) |
| Fim de turno / de sessão | Quando o agente para ou termina uma resposta | Registrar em log, notificar, salvar um resumo |

## Anatomia de um hook: entrada, decisão, saída

Um hook recebe dados estruturados ([JSON](/?c=infrastructure-devops&s=infrastructure&p=json)) descrevendo o evento, e responde da mesma forma: é essa resposta que pilota a continuação.

```text
// Entrada recebida pelo hook (exemplo: antes da chamada de uma ferramenta)
{ "tool_name": "delete_file", "tool_input": { "path": "config/prod.yaml" } }

// Saída possível do hook: bloqueia a ação e explica o motivo
{ "decision": "block", "reason": "Exclusão de um arquivo de configuração sem confirmação explícita" }
```

| Decisão possível | Efeito |
|---|---|
| Deixar passar | O agente continua normalmente, nada muda |
| Bloquear | A ação nunca acontece, o agente recebe o motivo da recusa |
| Modificar | A entrada da ação é reescrita antes da execução |
| Adicionar contexto | Uma informação é injetada no que o modelo vê, sem passar por uma ação do agente |

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| Hook lento e síncrono | Cada ocorrência do ponto de ancoragem espera o fim do hook: um hook mal escrito deixa todo o agente lento |
| Falha silenciosa | Um hook que quebra sem reportar erro dá a impressão de que a automação aconteceu, quando na verdade nada aconteceu |
| Executar um dado não confiável | Um hook que constrói um comando a partir de um dado vindo de fora (arquivo, página web, resultado de ferramenta) abre a mesma brecha que uma [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection): o dado pode pilotar o próprio hook |
| Confundir garantia de hook e instrução de prompt | Acreditar que escrever uma regra no prompt de sistema oferece a mesma confiabilidade que um hook, quando só o segundo é realmente sempre executado |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Fixar um prazo máximo (*timeout*) curto | Evita que um hook travado congele todo o agente |
| Falhar de forma barulhenta, nunca em silêncio | Um erro de hook deve ser visível, como qualquer [erro que se registra em log](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) |
| Limitar o hook ao estritamente necessário | Quanto menos coisas um hook faz, menos [superfície de ataque](/?c=ia&s=nlp-llm&p=prompt-injection) ele oferece em caso de dado manipulado, e menos formas diferentes de falhar ele tem |
| Testar o hook isoladamente antes de conectá-lo | Verificar seu comportamento com uma entrada simulada, sem depender de um turno de agente real para dispará-lo |

## O que reter

| | |
|---|---|
| **O que reter** | Um hook é código executado pelo harness, não pelo modelo, em um ponto preciso do ciclo de vida de um agente: ele roda sempre, ao contrário de uma instrução de prompt. |
| **Armadilhas a evitar** | Hook lento e bloqueante, falha silenciosa, execução de um dado não confiável, confundir garantia de hook e simples instrução. |
| **Boas práticas** | Timeout curto, falha visível, escopo mínimo, teste isolado antes da integração. |
