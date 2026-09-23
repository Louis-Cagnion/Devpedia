---
order: 12
---

# Chamar o modelo: API, SDK, erros tipados e novas tentativas

Os capítulos anteriores descrevem o que é enviado (o [estado e as perguntas](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles)) e o que é recebido (as [respostas tipadas](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)). Este último capítulo cobre o transporte: como essas trocas circulam de fato pela rede, apoiando-se nas noções já vistas em [API e HTTP](/?c=infrastructure&p=api-et-http) (método, código de status, autenticação).

## Um único ponto de entrada

Toda a API cabe em um único endpoint [HTTP](/?c=infrastructure&p=api-et-http):

```text
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <chave_api>

{ "state": ..., "model": "jev-latest", "questions": { ... } }
```

A resposta retorna o modelo usado, um mapa de respostas (uma por pergunta feita) e uma contagem de tokens consumidos.

## SDKs clientes para evitar escrever essas requisições à mão

Duas bibliotecas oficiais (Python, JavaScript/TypeScript) encapsulam essa chamada HTTP, gerenciam as novas tentativas automaticamente e expõem as primitivas [Choice/Score/Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul) como classes em vez de objetos JSON brutos a construir à mão:

```python
from typesafe_sdk import TypeSafeClient, Choice

with TypeSafeClient() as client:                    # le TYPESAFE_API_KEY do ambiente
    resultado = client.system_one(
        state="Fui cobrado duas vezes, me ajudem.",
        questions={"faturamento": Choice(instructions="...", criteria={...})},
    )
    print(resultado.answers["faturamento"].choice)
```

Sem SDK oficial para uma dada linguagem, a API HTTP continua diretamente utilizável: os SDKs são apenas uma comodidade, nunca uma passagem obrigatória.

## Exceções tipadas, uma por código de status

Em vez de um único tipo de erro genérico a inspecionar, o SDK define uma exceção distinta por [código de status HTTP](/?c=infrastructure&p=api-et-http), todas herdando de uma exceção comum: um padrão reutilizável para qualquer biblioteca cliente de API, não específico a este fornecedor.

| Exceção | Código HTTP | Causa |
|---|---|---|
| `AuthenticationError` | 401 | Chave API inválida ou ausente |
| `PermissionDeniedError` | 403 | Acesso negado ao recurso solicitado |
| `NotFoundError` | 404 | Recurso inexistente |
| `BadRequestError` | 400 | Requisição malformada |
| `UnprocessableEntityError` | 422 | A requisição está bem formada mas é rejeitada após validação pelo servidor |
| `RateLimitError` | 429 | Muitas requisições; traz um tempo de espera recomendado (`retry_after_ms`) |
| `InternalServerError` | 5xx | Erro do lado do servidor |
| `APIConnectionError` | (nenhum) | A requisição nunca alcançou o servidor (rede caída, DNS...) |
| `APITimeoutError` | (nenhum) | O prazo máximo configurado foi ultrapassado antes de qualquer resposta |

Capturar a exceção comum (`TypeSafeError`) basta para cobrir todos os casos; capturar uma exceção precisa permite uma reação diferenciada (reautenticar no 401, desacelerar no 429).

## Tentar novamente automaticamente, mas não de qualquer jeito

O SDK tenta novamente automaticamente certos erros, nunca todos: um erro 400 (requisição malformada) nunca se torna válido repetindo-o tal como está, enquanto um erro 429 (muitas requisições) ou 503 (servidor temporariamente indisponível) pode ter sucesso na próxima tentativa. A documentação oficial não publica valores padrão precisos para essa política; o exemplo abaixo ilustra os parâmetros configuráveis, não valores impostos:

```python
# max_retries     : numero de tentativas extras apos a chamada inicial
# backoff_initial : atraso antes da primeira nova tentativa
# backoff_max     : teto do atraso, mesmo apos varias falhas
# jitter          : variacao aleatoria adicionada ao atraso, para evitar que
#                    varios clientes tentem novamente todos no mesmo instante
retry = RetryPolicy(
    max_retries=3,
    backoff_initial=0.5,
    backoff_max=5.0,
    jitter=0.25,
    http_statuses={429, 500, 502, 503, 504},
)
```

Quando o servidor fornece um cabeçalho `Retry-After`, o cliente o usa em prioridade sobre seu próprio cálculo de atraso: o servidor conhece melhor que o cliente a duração real de sua própria sobrecarga.

> **Armadilha:** tentar novamente um erro 400 ou 401 em loop, esperando que ele finalmente passe. Esses erros sinalizam um problema na própria requisição (malformada, mal autenticada), nunca resolvido pela simples repetição.
>
> **Boa prática:** tentar novamente apenas os erros realmente transitórios (rede, sobrecarga temporária, limite de taxa), com um atraso crescente e uma parte de aleatoriedade (jitter), respeitando o cabeçalho `Retry-After` do servidor quando fornecido.

## Designar o modelo: alias estável ou versão fixada

O modelo Jev ilustra uma precificação específica dessa família de modelos: cobrado apenas sobre os tokens de **entrada** (o texto do estado e das perguntas), cerca de US$ 0,042/milhão de tokens segundo o anúncio do fornecedor, nunca sobre a saída, coerente com o fato de que a saída é sempre uma estrutura tipada curta, nunca um texto gerado de peso variável.

| | Valor |
|---|---|
| Alias padrão | `jev-latest` (sempre aponta para a última versão) |
| Versão fixada (exemplo) | `jev-1.13.0` (nunca muda de comportamento) |
| Entradas aceitas | Apenas texto (string, objeto ou array JSON) |

> **Armadilha:** fixar `jev-latest` em produção sem supervisão. Um alias que aponta para "a última versão" pode mudar de comportamento sem aviso quando o fornecedor lança uma atualização.
>
> **Boa prática:** fixar uma versão precisa (`jev-1.13.0`) para um sistema em produção cujo comportamento deva permanecer estável, e passar para `jev-latest` apenas em um ambiente de teste onde uma mudança de comportamento seja aceitável a qualquer momento.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | Um único endpoint HTTP autenticado por chave portadora, SDKs Python/JS opcionais que o encapsulam, uma exceção tipada por código de status (padrão reutilizável para qualquer API cliente), uma nova tentativa automática limitada a erros transitórios com atraso crescente e respeito ao `Retry-After`. |
| **Ferramentas utilizáveis** | A API REST diretamente, ou os SDKs Python/JavaScript oficiais; uma política de novas tentativas configurável. |
| **Armadilhas a evitar** | Tentar novamente um erro de requisição malformada (400) ou de autenticação (401) em loop. |
| **Boas práticas** | Tentar novamente apenas os erros transitórios (rede, 429, 5xx), com atraso crescente, aleatoriedade (jitter), e prioridade ao cabeçalho `Retry-After` do servidor. |
