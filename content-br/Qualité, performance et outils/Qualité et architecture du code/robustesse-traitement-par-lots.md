---
order: 9
---

# Robustez de um processamento em lote

Um **processamento em lote** (*batch*) é um programa que processa uma longa lista de elementos em uma única execução: 10 000 arquivos a converter, 300 páginas web a ler, todas as linhas de uma tabela a recalcular. Ele muitas vezes roda sem ninguém na frente da tela, por exemplo disparado toda noite por uma [tarefa agendada](/?c=langages&s=bash&p=automatisation-cron). Três situações o colocam em apuros: uma interrupção no meio do caminho, um recurso que sai do ar e um resultado vazio confundido com um erro. Este capítulo traz uma ferramenta para cada uma; os exemplos estão em [Python](/?c=langages&s=python&p=gestion-des-erreurs).

## Retomar depois de uma interrupção: o ponto de controle

Sem precauções, um processamento de 3 horas interrompido às 2 h 50 (queda de rede, reinicialização da máquina) precisa recomeçar do zero. Um **ponto de controle** (*checkpoint*) evita isso: depois de cada elemento processado, o programa anota em um arquivo de estado o que já foi feito; disparado de novo com uma opção como `--resume`, ele pula esses elementos.

| | Sem ponto de controle | Com ponto de controle |
|---|---|---|
| Interrupção em 95 % | Tudo precisa ser refeito | Só os 5 % restantes são processados |
| Custo | Nenhum | Uma escrita de arquivo por elemento |

```python
import json
import os

ARQUIVO_ESTADO = "estado.json"             # arquivo que memoriza os elementos já processados

def carregar_estado():
    if not os.path.exists(ARQUIVO_ESTADO): # primeira execução: nada foi feito ainda
        return set()
    with open(ARQUIVO_ESTADO, encoding="utf-8") as f:
        return set(json.load(f))           # lista JSON relida como conjunto

def salvar_estado(feitos):
    temporario = ARQUIVO_ESTADO + ".tmp"
    with open(temporario, "w", encoding="utf-8") as f:
        json.dump(sorted(feitos), f)       # escreve primeiro um arquivo à parte...
    os.replace(temporario, ARQUIVO_ESTADO) # ...e depois o coloca no lugar de uma vez

feitos = carregar_estado()
for elemento in elementos:
    if elemento in feitos:
        continue                           # já processado em uma execução anterior
    processar(elemento)                    # o trabalho real, resultado salvo aqui
    feitos.add(elemento)
    salvar_estado(feitos)                  # marcado como feito só depois de salvo
```

O arquivo de estado está no formato [JSON](/?c=infrastructure-devops&s=infrastructure&p=json); a leitura e a escrita de arquivos são detalhadas em [manipular arquivos](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers).

> **Armadilha:** escrever diretamente em `estado.json`. Uma queda durante a escrita deixa um arquivo pela metade, ilegível no próximo disparo: todo o acompanhamento se perde. [`os.replace`](https://docs.python.org/3/library/os.html#os.replace) substitui o arquivo em uma única operação, então sempre se encontra ou a versão antiga completa, ou a nova.
>
> **Armadilha:** marcar um elemento como feito antes de ter salvo seu resultado. Uma queda entre os dois, e o elemento é considerado processado enquanto seu resultado não existe em lugar nenhum.
>
> **Boa prática:** tornar o processamento de um elemento **idempotente** (fazê-lo duas vezes dá o mesmo resultado que uma vez): se a queda acontecer logo depois de `processar()`, mas antes de `salvar_estado()`, o elemento simplesmente é processado de novo, sem estrago.

## Parar de chamar um recurso fora do ar: o disjuntor

Quando um recurso (um site, um banco de dados) para de responder, tentar de novo cada elemento, um por um, desperdiça tempo e pode agravar a pane. Um **disjuntor** (*circuit breaker*) corta as chamadas a esse recurso depois de várias falhas consecutivas, como um disjuntor elétrico corta a energia depois de uma sobrecarga ([CircuitBreaker, Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html); [Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)).

```text
            N falhas consecutivas
 FECHADO ─────────────────────────▶  ABERTO
 (chamadas                           (chamadas recusadas
  normais)  ◀──── sucesso ───┐        sem tentar)
                              │           │
                        SEMIABERTO ◀──────┘ depois de um prazo
                        (uma única chamada de teste)
```

| Estado | Comportamento | Passa para |
|---|---|---|
| **Fechado** | As chamadas passam normalmente; as falhas consecutivas são contadas | Aberto, na N-ésima falha seguida |
| **Aberto** | As chamadas são recusadas na hora, sem contatar o recurso | Semiaberto, depois de um prazo |
| **Semiaberto** | Uma única chamada de teste é permitida | Fechado se ela der certo, aberto se falhar |

Em um processamento em lote, uma versão simples muitas vezes basta: depois de 3 falhas seguidas no mesmo site, abandonam-se seus elementos restantes nesta execução e isso é sinalizado.

```python
LIMIAR = 3                              # falhas consecutivas antes de cortar
falhas = {}                             # site -> número de falhas seguidas
cortados = set()                        # sites abandonados nesta execução

for pagina in paginas:
    if pagina.site in cortados:
        continue                        # disjuntor aberto: nem se tenta
    try:
        ler(pagina)
        falhas[pagina.site] = 0         # um sucesso zera o contador
    except ErroDeLeitura:
        falhas[pagina.site] = falhas.get(pagina.site, 0) + 1
        if falhas[pagina.site] >= LIMIAR:
            cortados.add(pagina.site)   # 3 falhas seguidas: este site é cortado
```

O disjuntor complementa o **backoff exponencial** (esperar cada vez mais entre duas tentativas da mesma chamada, veja [o SDK e a API](/?c=ia&s=modeles-de-decision-structuree&p=sdk-et-api)): o backoff espaça as tentativas de uma chamada, o disjuntor para de chamar um recurso claramente fora do ar.

> **Armadilha:** tentar de novo indefinidamente um recurso fora do ar: o processamento nunca termina, ou termina muito tarde, sem resultado nenhum.
>
> **Boa prática:** sempre sinalizar um recurso cortado no relatório final, para que ele seja tratado na próxima execução em vez de esquecido.

## Distinguir "resultado vazio" e "falha de leitura"

Uma página que não pôde ser lida e uma página que realmente não contém nada dão as duas "0 elemento". Confundi-las distorce o resultado nos dois sentidos:

| Situação real | Se "0" for contado sem distinção | Consequência |
|---|---|---|
| A loja realmente não tem nenhum anúncio | Correto | Alerta de negócio legítimo |
| A página não pôde ser lida (bloqueio, pane) | Mesmo "0" | Falso alerta de negócio, e o verdadeiro problema técnico passa despercebido |

A solução é devolver um **status explícito** com cada resultado, aqui com uma [dataclass](/?c=langages&s=python&p=dataclasses):

```python
from dataclasses import dataclass, field

@dataclass
class Resultado:
    status: str                           # "ok" ou "falha_leitura"
    anuncios: list = field(default_factory=list)

def contar(pagina):
    try:
        return Resultado("ok", extrair_anuncios(pagina))
    except ErroDeLeitura:
        return Resultado("falha_leitura") # nunca confundido com uma lista vazia
```

| Status | Número de anúncios | Tratamento no relatório |
|---|---|---|
| `ok` | pelo menos 1 | Resultado normal |
| `ok` | 0 | Status de negócio (loja vazia) |
| `falha_leitura` | desconhecido | Incidente técnico, contado à parte, nunca como "0" |

> **Boa prática:** contar separadamente os elementos vazios e as falhas no relatório final, e só disparar um alerta bloqueante para o que realmente exige (veja [controle bloqueante ou alerta não bloqueante](/?c=infrastructure-devops&s=ci-cd&p=yaml-pipelines-azure) em um pipeline).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um ponto de controle permite retomar um processamento interrompido; um disjuntor para de chamar um recurso fora do ar; um status explícito distingue um resultado vazio de uma falha de leitura. |
| **Ferramentas utilizáveis** | Um arquivo de estado JSON escrito por meio de um arquivo temporário e `os.replace`; um contador de falhas consecutivas por recurso; uma dataclass com um campo `status`. |
| **Armadilhas a evitar** | Escrever o arquivo de estado diretamente; marcar um elemento como feito antes de salvar seu resultado; tentar de novo indefinidamente um recurso fora do ar; contar uma falha de leitura como "0". |
| **Boas práticas** | Um processamento idempotente por elemento; sinalizar cada recurso cortado no relatório; contar separadamente vazios e falhas. |
