---
order: 2
---

# As três primitivas de pergunta: Choice, Score e Noul

O [capítulo anterior](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm) explica que um modelo de decisão estruturada nunca responde com texto livre: ele responde a uma **pergunta fechada**, feita contra um **estado** (o conteúdo a avaliar, uma mensagem, um documento...). Concretamente, essa pergunta fechada sempre assume uma dessas três formas, chamadas **primitivas**:

| Primitiva | A pergunta que ela faz | O que ela retorna |
|---|---|---|
| **Choice** | "Qual dessas opções?" | A opção escolhida, uma probabilidade por opção, uma confiança |
| **Score** | "Em que nível, nessa escala?" | Uma posição na escala, uma probabilidade por nível, uma confiança |
| **Noul** | "Essa afirmação é verdadeira?" | Uma única probabilidade, entre 0 e 1 |

Cada pergunta carrega um identificador, um tipo (`choice`, `score` ou `noul`) e instruções. Várias perguntas podem ser feitas em uma única requisição contra o mesmo estado: cada uma é avaliada **independentemente**, sem ver a resposta das outras.

## Choice: escolher entre opções sem ordem

**Choice** serve para selecionar uma categoria entre um conjunto conhecido previamente, sem hierarquia entre as opções (ao contrário de Score, ver abaixo). Exemplo: rotear um ticket de suporte para a equipe certa.

```json
{
  "departamento": {
    "type": "choice",
    "instructions": "Qual equipe deve tratar este ticket?",
    "criteria": {
      "devolucoes": "Trocas, itens faltando ou danificados",
      "entrega": "Status de entrega, atrasos, pacotes perdidos",
      "faturamento": "Faturamento, faturas, problemas de pagamento"
    }
  }
}
```

A resposta contém três elementos:

```json
{
  "choice": "devolucoes",
  "confidence": 1.0,
  "probabilities": { "devolucoes": 1.0, "entrega": 0.0, "faturamento": 0.0 }
}
```

`probabilities` sempre soma 1 (é uma distribuição); `choice` é a opção que recebeu a maior probabilidade; `confidence` (entre 0 e 1) mede o quanto essa probabilidade domina as outras.

| Armadilha | Boa prática |
|---|---|
| Propor opções que se sobrepõem (ex: "devoluções" e "trocas" como duas opções distintas quando um mesmo caso se encaixa em ambas) | Redigir critérios mutuamente exclusivos, com descrições que listam explicitamente o que uma opção cobre (e o que ela exclui) |
| Não prever nenhuma opção para um caso fora do escopo | Adicionar sistematicamente uma opção "outro", para nunca forçar uma escolha que não corresponda a nada |

Uma requisição aceita até 255 opções por pergunta Choice.

## Score: pontuar em uma escala ordenada

**Score** serve para posicionar uma avaliação em um contínuo, quando os níveis têm uma ordem natural (severidade, satisfação, competência). Os níveis são numerados de `0` até sua posição na lista:

```json
{
  "severidade_bug": {
    "type": "score",
    "instructions": "Qual e a severidade do problema?",
    "criteria": [
      "Sem impacto funcional",
      "Funcionalidade degradada mas existe uma solucao alternativa",
      "Bloqueio completo"
    ]
  }
}
```

A resposta retorna uma posição **ponderada**, não necessariamente um inteiro:

```json
{
  "score": 1.43,
  "confidence": 0.35,
  "probabilities": { "0": 0.0, "1": 0.57, "2": 0.43 },
  "legend": { "0": "Sem impacto", "1": "Existe solucao alternativa", "2": "Bloqueio completo" }
}
```

`score` é calculado como uma média ponderada pelas probabilidades de cada nível:

```python
# score = soma, sobre cada nivel, de (numero_do_nivel x probabilidade_do_nivel)
niveis         = [0, 1, 2]
probabilidades = [0.0, 0.57, 0.43]
score = sum(nivel * proba for nivel, proba in zip(niveis, probabilidades))
# -> 0*0.0 + 1*0.57 + 2*0.43 = 1.43
```

Uma escala Score aceita entre 2 e 10 níveis.

| Armadilha | Boa prática |
|---|---|
| Descrever graus abstratos ("moderadamente grave") em vez de situações concretas | Descrever o que é observável ("funcionalidade quebrada com solução alternativa"), mais fácil de avaliar de forma coerente |
| Avaliar várias dimensões em uma única pergunta ("rápido E experiente") | Uma dimensão por pergunta Score; combinar depois vários scores em código (média ponderada, limiares) |

Uma confiança baixa geralmente sinaliza uma sobreposição entre níveis vizinhos ou uma pergunta que mistura várias dimensões.

## Noul: verificar uma afirmação binária

**Noul** responde a uma pergunta sim/não, ou julga a veracidade de uma afirmação, por meio de uma única probabilidade:

```json
{
  "pede_humano": {
    "type": "noul",
    "instructions": "O cliente pede para falar com um humano?"
  }
}
```

```json
{ "noul": 0.92 }
```

Um valor próximo de 1 significa sim com quase certeza, próximo de 0 significa não com quase certeza, próximo de 0,5 significa incerteza. Não há um campo `confidence` separado: a própria probabilidade carrega ao mesmo tempo a resposta e o grau de certeza.

No código, essa probabilidade é limiarizada em vez de tratada como um booleano bruto:

```python
LIMIAR_SIM = 0.8
LIMIAR_NAO = 0.2

probabilidade = resposta["noul"]
if probabilidade > LIMIAR_SIM:
    decisao = "sim"
elif probabilidade < LIMIAR_NAO:
    decisao = "nao"
else:
    decisao = "incerto"   # escalar para um humano
```

| Armadilha | Boa prática |
|---|---|
| Combinar duas condições em uma única afirmação ("o cliente está irritado E pede um reembolso") | Uma afirmação por Noul; fazer dois Nouls distintos se duas condições realmente precisam ser verificadas |
| Tratar a probabilidade como um booleano estrito (`> 0.5`) sem zona de incerteza | Adaptar os dois limiares ao custo de um erro: um limiar mais amplo para uma ação reversível, mais estreito para uma ação de alto risco |

## Comparar as três primitivas

| | Choice | Score | Noul |
|---|---|---|---|
| Natureza das respostas possíveis | Categorias sem ordem | Níveis ordenados | Verdadeiro/falso |
| Número de opções | Até 255 | 2 a 10 | Sempre 2 (implícito) |
| Resposta retornada | Uma categoria + distribuição | Uma posição ponderada + distribuição | Uma única probabilidade |
| Campo de confiança separado | Sim | Sim | Não (a probabilidade faz esse papel) |
| Exemplo de uso | Rotear, classificar | Pontuar uma severidade, uma qualidade | Verificar uma afirmação, filtrar |

## Estruturar os critérios em JSON em vez de texto livre

Os campos `instructions` e `criteria` das três primitivas aceitam tanto uma simples string quanto uma estrutura [JSON](/?c=infrastructure&p=json) (objeto ou array). Estruturar se torna útil em dois casos: uma pergunta com vários aspectos (as chaves nomeiam cada aspecto, o que uma frase não faz com a mesma clareza) e um dado já estruturado a reutilizar tal como está (um esquema, uma taxonomia), em vez de transcrevê-lo em prosa.

```json
{
  "type": "noul",
  "instructions": "Este comentario menciona um problema ja reportado?",
  "criteria": {
    "true": "Menciona uma tentativa, um ticket ou um relato anterior preciso",
    "false": "Nenhum rastro de um contato ou relato anterior"
  }
}
```

Essa forma estruturada (`true`/`false` detalhados, ou `what`/`examples` para uma opção Choice ou um nível Score) desambiguiza os casos limite, onde uma única frase de critério permaneceria vaga sobre a fronteira exata entre duas respostas possíveis.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | Um modelo de decisão estruturada só conhece três formas de pergunta: Choice (escolher uma categoria sem ordem), Score (posicionar em uma escala ordenada) e Noul (julgar uma afirmação verdadeiro/falso). Cada pergunta retorna uma resposta tipada acompanhada de uma probabilidade, nunca texto livre a interpretar. |
| **Ferramentas utilizáveis** | As três primitivas Choice/Score/Noul, expressas em JSON (requisição) e interpretadas em código (limiares, médias ponderadas, roteamento). |
| **Armadilhas a evitar** | Opções Choice que se sobrepõem, sem opção "outro". Níveis Score descritos em graus abstratos, ou pergunta Score que mistura várias dimensões. Noul que combina duas condições, ou tratado como booleano estrito sem zona de incerteza. |
| **Boas práticas** | Critérios mutuamente exclusivos mais opção "outro" para Choice. Níveis Score descritos por situações observáveis, uma dimensão por pergunta. Limiares Noul adaptados ao custo de um erro. Critérios estruturados em JSON para desambiguizar os casos limite. |
