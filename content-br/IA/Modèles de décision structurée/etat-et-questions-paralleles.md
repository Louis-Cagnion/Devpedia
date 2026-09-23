---
order: 3
---

# O estado e o fan-out especulativo: fazer todas as perguntas de uma vez

As [primitivas Choice, Score e Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul#comparar-as-tres-primitivas) sempre são avaliadas contra um **estado**: o conteúdo que o modelo deve julgar. Este capítulo detalha o que um estado pode conter, e depois uma consequência direta da independência das perguntas: fazer muitas perguntas de uma vez custa pouco mais do que fazer uma só.

## O estado: o conteúdo a avaliar

O estado é o dado fornecido ao modelo, contra o qual uma ou várias perguntas são feitas. Ele aceita três formatos:

| Formato | Caso de uso típico |
|---|---|
| String simples | Uma mensagem única, uma passagem de texto isolada |
| Objeto [JSON](/?c=infrastructure&p=json) | Vários campos nomeados, um estado de aplicação estruturado (ex: `{"ticket": "...", "historico": [...]}`) |
| Array [JSON](/?c=infrastructure&p=json) | Uma sequência de mensagens ou registros |

```json
{
  "ticket": {
    "assunto": "Pacote nunca recebido",
    "mensagem": "Pedido feito ha 12 dias, ainda nao recebi nada.",
    "cliente_vip": true
  }
}
```

O objeto estruturado preserva as relações entre dados (aqui, o fato de que `cliente_vip` descreve justamente este ticket) melhor do que uma única string que misturaria tudo em prosa. Apenas texto é aceito: nem imagem, nem áudio, nem vídeo. O modelo também favorece o inglês, tendo os demais idiomas (incluindo o português) atualmente uma precisão menor segundo a documentação do fornecedor.

| Armadilha | Boa prática |
|---|---|
| Amontoar tudo em uma única string de texto sem estrutura | Separar o conteúdo (o estado) dos julgamentos pedidos (as perguntas), e agrupar em um objeto JSON apenas a informação realmente ligada à decisão |

## Perguntas avaliadas independentemente

Ponto central do funcionamento desses modelos: **todas as perguntas feitas em uma mesma requisição veem o mesmo estado, e são avaliadas independentemente umas das outras**. Nenhuma pergunta "vê" a resposta de outra. Essa independência tem uma consequência direta: nada impede fazer várias perguntas de uma vez, incluindo perguntas cuja utilidade da resposta ainda não se sabe.

## O padrão do fan-out especulativo

O **fan-out especulativo** (*speculative fan-out*) consiste em enviar de imediato todas as perguntas plausíveis para um dado caso, em vez de encadear as chamadas uma por uma conforme as necessidades surgem, e deixar o código escolher depois quais respostas manter:

```text
Abordagem sequencial (3 chamadas, uma apos a outra)
  Chamada 1 -> categoria do ticket = "bug"
  Chamada 2 -> (ja que e um bug) severidade = "bloqueante"
  Chamada 3 -> (ja que bloqueante) um reembolso e pedido?

Fan-out especulativo (1 unica chamada, 5 perguntas em paralelo)
  categoria, severidade_bug, passos_reproduziveis, reembolso_pedido, frustracao
  -> o codigo ignora depois severidade_bug se a categoria nao for "bug"
```

Como as perguntas são avaliadas em paralelo contra o mesmo estado, adicionar perguntas extras tem pouco efeito no tempo de resposta: o custo dominante é a leitura do estado em si, não o número de perguntas feitas sobre ele.

```python
resposta = client.system_one(
    state=ticket,
    questions={
        "categoria": Choice(instructions="Categoria do ticket?", criteria=CATEGORIAS),
        "severidade_bug": Score(instructions="Severidade se for um bug?", criteria=NIVEIS),
        "passos_reproduziveis": Noul(instructions="Passos de reproducao sao dados?"),
        "reembolso_pedido": Noul(instructions="Um reembolso e pedido?"),
        "frustracao": Score(instructions="Nivel de frustracao expresso?", criteria=NIVEIS_FRUSTRACAO),
    },
)

# O codigo escolhe depois quais respostas explorar, segundo a categoria obtida
if resposta.answers["categoria"].choice == "bug":
    tratar_bug(resposta.answers["severidade_bug"], resposta.answers["passos_reproduziveis"])
```

## O que isso muda em custo e velocidade

Em um caso medido pelo fornecedor (13 perguntas regulatórias feitas sobre um mesmo documento), agrupar as perguntas em uma única requisição em vez de 13 requisições separadas resulta em:

| | 13 requisições separadas | 1 requisição agrupada |
|---|---|---|
| Custo | Referência | **12,2× mais barato** (o documento é transmitido apenas uma vez) |
| Velocidade | Referência | **10× mais rápido** |
| Confiabilidade das respostas | Referência | Idêntica: cada pergunta continua independente das demais |

Esse número vem do fornecedor e não foi verificado de forma independente; o que importa aqui é o princípio que ele ilustra (o custo dominante é a leitura do estado, não o número de perguntas), não o benchmark exato.

> **Armadilha:** acreditar que adicionar perguntas especulativas arrisca "poluir" as respostas úteis, como faria um prompt sobrecarregado enviado a um LLM generativo. Aqui, cada pergunta é avaliada independentemente contra o mesmo estado: uma pergunta desnecessária nunca modifica a resposta de outra.
>
> **Boa prática:** assim que uma decisão depende potencialmente de vários fatores, fazer todas as perguntas plausíveis em uma única chamada em vez de encadear chamadas conforme surgem, e deixar o código (não uma nova requisição) filtrar as respostas não pertinentes.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | O estado (texto, objeto ou array JSON) é o conteúdo avaliado. As perguntas feitas contra um mesmo estado são independentes umas das outras, o que permite o fan-out especulativo: fazer de uma vez todas as perguntas plausíveis, e depois filtrar as respostas úteis em código, para um custo e uma latência próximos de uma única pergunta. |
| **Ferramentas utilizáveis** | Um objeto JSON estruturado como estado; várias perguntas Choice/Score/Noul em uma única requisição; código de aplicação para filtrar as respostas especulativas não pertinentes. |
| **Armadilhas a evitar** | Amontoar tudo em uma única string de texto sem estrutura. Temer que adicionar perguntas degrade as outras respostas (não é o caso, elas são independentes). |
| **Boas práticas** | Separar conteúdo e perguntas, estruturar o estado em JSON. Agrupar todas as perguntas plausíveis de um caso em uma única requisição em vez de encadear chamadas sequenciais. |
