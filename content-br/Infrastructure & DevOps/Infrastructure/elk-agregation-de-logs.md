---
order: 7
---

# ELK: centralizar e consultar os logs de uma infraestrutura

Um **log** é um evento datado (uma requisição recebida, um erro ocorrido, uma conexão estabelecida), distinto de uma **métrica**, que mede uma quantidade ao longo do tempo (taxa de uso da CPU, número de requisições por segundo). Em uma única máquina, um `grep` em um arquivo de log já basta; assim que vários servidores ou containers passam a gerar cada um seus próprios logs, é preciso um jeito de reuni-los e consultá-los todos juntos.

## O problema: logs espalhados em cada máquina

```text
Sem centralizacao:                   Com centralizacao:

Servidor A: logs locais              Servidor A -\
Servidor B: logs locais                          Elasticsearch (busca indexada)
Servidor C: logs locais              Servidor B -/       |
                                      Servidor C -/     Kibana (interface de busca)

-> conectar em cada maquina          -> uma unica busca, em todos os logs de uma vez
   para procurar um erro
```

Encontrar um erro específico exige, sem centralização, conectar-se a cada máquina uma por uma e buscar em cada arquivo separadamente: uma operação que não escala além de alguns servidores.

## ELK: três ferramentas, uma cadeia

**ELK** (Elasticsearch, Logstash, Kibana) designa a stack mais usada para essa necessidade, cada letra cobrindo uma etapa distinta:

| Ferramenta | Papel |
|---|---|
| **Elasticsearch** | Motor de busca e armazenamento: indexa cada log recebido para torná-lo imediatamente pesquisável, mesmo entre milhões de entradas |
| **Logstash** (ou um agente mais leve, como o Filebeat) | Coleta os logs na origem (arquivo, fluxo de rede), os formata, e os envia ao Elasticsearch |
| **Kibana** | Interface web para buscar, filtrar e visualizar os logs indexados (painéis, gráficos de frequência de um tipo de evento) |

```text
Servidor/container -> agente de coleta (Logstash/Filebeat) -> Elasticsearch -> Kibana
      (gera o log)          (coleta, formata)                  (indexa)      (busca, visualiza)
```

## Logs e métricas: duas naturezas de dados, duas ferramentas

| | Métrica | Log |
|---|---|---|
| Natureza | Um número, amostrado em intervalos regulares | Um evento datado, com seu contexto completo |
| Exemplo | 72% de uso de CPU às 14h03 | "Erro 500 em `/pedido/1234` às 14h03:27, usuário 42" |
| Pergunta típica | "Como esse valor evolui ao longo do tempo?" | "O que aconteceu exatamente nesse momento?" |
| Ferramenta típica | Prometheus/Grafana e equivalentes | ELK e equivalentes |

As duas seguem complementares, não concorrentes: uma métrica alerta que existe um problema (uma taxa de erro que sobe), um log detalha o que de fato aconteceu para diagnosticá-lo.

## Estruturar os logs para torná-los realmente utilizáveis

Um log escrito como uma simples frase livre (`"Erro ao processar o pedido 1234"`) continua difícil de filtrar com precisão depois que milhões de linhas se acumulam. Um log **estruturado**, geralmente em JSON, separa cada informação em seu próprio campo:

```json
{"timestamp": "2026-08-20T14:03:27Z", "nivel": "error", "service": "commandes", "id_commande": 1234, "mensagem": "Echec du paiement"}
```

> **Cuidado:** registrar em texto livre não estruturado, e depois descobrir em produção que é impossível filtrar com precisão por serviço, nível de gravidade ou identificador sem recorrer a expressões regulares frágeis sobre o texto da mensagem.
>
> **Boa prática:** estruturar cada log desde sua emissão (um campo por informação: data/hora, nível, serviço, identificadores relevantes), para que a busca no Kibana filtre por campos exatos em vez de texto livre.

## O que reter

| | |
|---|---|
| **O que reter** | O ELK (Elasticsearch, Logstash, Kibana) centraliza os logs de várias máquinas para torná-los pesquisáveis em um único lugar: o Logstash coleta e formata, o Elasticsearch indexa, o Kibana permite buscar e visualizar. Os logs (eventos datados) e as métricas (números ao longo do tempo) respondem a perguntas diferentes e geralmente usam ferramentas diferentes. |
| **Ferramentas úteis** | Logstash ou Filebeat para a coleta, Elasticsearch para a indexação e a busca, Kibana para a interface de busca e os painéis. |
| **Armadilhas a evitar** | Registrar em texto livre não estruturado, tornando o filtro preciso impossível em grande escala. |
| **Boas práticas** | Estruturar cada log em campos distintos (data/hora, nível, serviço, identificadores) desde sua emissão, para uma busca precisa na ferramenta de centralização. |
