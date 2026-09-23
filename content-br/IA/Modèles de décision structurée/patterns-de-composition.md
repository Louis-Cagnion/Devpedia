---
order: 5
---

# Compor decisões: pontuação composta e roteamento de intenção

Um modelo de decisão estruturada nunca responde além de perguntas estreitas e atômicas ([Choice/Score/Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)). Compor um comportamento mais rico (uma decisão final, um roteamento) é trabalho do **código chamador**, não do modelo. Quatro padrões aparecem com mais frequência para essa composição:

| Padrão | Princípio | Onde é coberto |
|---|---|---|
| Fan-out especulativo | Fazer de uma vez todas as perguntas plausíveis, filtrar em código | [Estado e perguntas paralelas](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#o-padrao-do-fan-out-especulativo) |
| Roteamento por confiança | Agir, confirmar ou escalar segundo o nível de confiança | [Confiança calibrada](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#tres-limiares-tres-comportamentos) |
| **Pontuação composta** | Combinar vários scores independentes em uma decisão única | Este capítulo |
| **Roteamento de intenção** | Classificar uma requisição e depois direcioná-la para o tratamento certo | Este capítulo |

## Pontuação composta: combinar dimensões independentes

A **pontuação composta** decompõe um julgamento complexo em dimensões separadas, pontua cada uma independentemente (uma pergunta Score por dimensão, feitas em uma única requisição graças ao [fan-out](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#o-padrao-do-fan-out-especulativo)), e depois as combina por meio de uma fórmula ponderada totalmente controlada pelo código.

```text
1. Fazer uma pergunta Score por dimensao (em paralelo, mesma requisicao)
2. Normalizar cada score entre 0 e 1 (dividir pelo nivel maximo)
3. Combinar por meio de uma soma ponderada, com pesos fixos em codigo
```

Exemplo: avaliar um currículo segundo vários eixos, com pesos que mudam segundo o cargo visado.

```python
# Cada score e normalizado entre 0 e 1 antes de ser ponderado
def pontuar_candidato(respostas, pesos: dict[str, float]) -> float:
    total = 0.0
    for dimensao, peso_dimensao in pesos.items():
        score_bruto   = respostas[dimensao].score                  # ex: 3 em uma escala 0-4
        nivel_maximo  = len(respostas[dimensao].legend) - 1        # 4
        score_normalizado = score_bruto / nivel_maximo
        total += peso_dimensao * score_normalizado
    return total

# Um cargo de gerente pesa mais a dimensao "lideranca" que um cargo de IC senior
pesos_ic_senior = {"profundidade_python": 0.5, "lideranca": 0.1, "design_de_sistemas": 0.4}
pesos_gerente    = {"profundidade_python": 0.2, "lideranca": 0.5, "design_de_sistemas": 0.3}
```

Essa abordagem preserva a granularidade de cada dimensão (é possível inspecionar por que um candidato obtém tal score global) permitindo ao mesmo tempo ajustar rapidamente as prioridades (mudar os pesos) sem reconstruir todo o sistema de avaliação.

> **Armadilha:** pontuar diretamente uma impressão global ("bom candidato" em uma única pergunta Score), que mistura várias dimensões sem permitir depois ajustar sua importância relativa separadamente.
>
> **Boa prática:** uma pergunta Score por dimensão realmente independente, combinada em código com pesos explícitos e ajustáveis, sem tocar nas perguntas em si.

## Roteamento de intenção: classificar antes de tratar

O **roteamento de intenção** (*intent routing*) coloca um modelo de decisão estruturada antes de vários tratamentos possíveis, para direcionar cada requisição ao tratamento certo sem sempre passar pelo tratamento mais caro (um LLM, um humano).

```text
Mensagem do cliente
     |
     v
Modelo de decisao estruturada (2 perguntas em paralelo: Choice + Score)
     |
     v
Respostas + confianca
     |
     +-- confianca da intencao < 0.5 ---------------> Agente humano
     +-- intencao = "status_pedido" -----------------> Busca deterministica (sem LLM)
     +-- intencao = "pergunta_produto" --------------> LLM especializado em produto
     +-- intencao = "reclamacao" + complexidade > 1 -> Agente humano
     +-- intencao = "reclamacao" + complexidade <= 1 -> LLM de resolucao
```

```python
resposta = client.system_one(
    state=mensagem_cliente,
    questions={
        "intencao":     Choice(instructions="Categoria da requisicao?", criteria=CATEGORIAS),
        "complexidade": Score(instructions="Complexidade da requisicao?", criteria=NIVEIS_COMPLEXIDADE),
    },
)

if resposta.answers["intencao"].confidence < 0.5:
    rotear_para("agente_humano")
elif resposta.answers["intencao"].choice == "status_pedido":
    rotear_para("busca_deterministica")
elif resposta.answers["intencao"].choice == "reclamacao" and resposta.answers["complexidade"].score > 1:
    rotear_para("agente_humano")
else:
    rotear_para("llm_especializado")
```

O ganho principal é econômico: os recursos caros (um LLM de raciocínio, um humano) só são mobilizados para os casos que realmente justificam, tratando-se o resto por lógica determinística ou um modelo mais leve.

> **Armadilha:** rotear apenas com base na intenção escolhida, sem considerar a confiança associada: uma intenção mal classificada mas tratada como certa pode enviar uma requisição para o tratamento errado sem que nenhum sinal o revele.
>
> **Boa prática:** sempre verificar a confiança da intenção antes de rotear sobre ela (ver o [roteamento por confiança](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#tres-limiares-tres-comportamentos)), e combinar intenção com outros sinais (aqui, a complexidade) em vez de rotear sobre um único critério isolado.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | Compor uma decisão rica a partir de perguntas atômicas continua sendo trabalho do código, não do modelo. A pontuação composta combina vários scores independentes por meio de uma fórmula ponderada; o roteamento de intenção classifica uma requisição e depois a direciona para o tratamento menos caro que se aplica, sujeito a uma confiança suficiente. |
| **Ferramentas utilizáveis** | Várias perguntas Score em paralelo, uma fórmula de ponderação em código, uma pergunta Choice para classificar uma intenção antes de rotear. |
| **Armadilhas a evitar** | Uma única pergunta Score que mistura várias dimensões. Rotear sobre uma intenção sem verificar sua confiança. |
| **Boas práticas** | Uma dimensão por pergunta Score, pesos explícitos e ajustáveis em código. Verificar a confiança antes de rotear, combinar vários sinais em vez de um só. |
