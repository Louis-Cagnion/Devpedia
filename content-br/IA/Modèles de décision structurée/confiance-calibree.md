---
order: 4
---

# A confiança calibrada: agir, hesitar ou escalar

As respostas Choice e Score ([capítulo anterior](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)) carregam um campo `confidence` distinto da resposta em si. Este capítulo explica o que esse número mede, e como o código deve usá-lo para decidir entre agir automaticamente ou escalar para um humano.

## O que a confiança mede

A confiança é deduzida da **forma da distribuição de probabilidades** retornada por uma pergunta Choice ou Score: uma distribuição concentrada em uma única resposta sinaliza uma confiança alta, uma distribuição espalhada entre várias respostas sinaliza uma confiança baixa.

```text
Distribuicao concentrada (confianca alta)      Distribuicao espalhada (confianca baixa)
devolucoes:  0.95  #################           devolucoes:  0.40  ########
entrega:     0.03  #                            entrega:     0.35  #######
faturamento: 0.02  #                            faturamento: 0.25  #####
```

Para uma pergunta de três opções, a documentação do fornecedor dá uma fórmula aproximada:

```python
# confianca aproximada para 3 opcoes, a partir da maior probabilidade
maior_probabilidade = 0.95
confianca = (3 * maior_probabilidade - 1) / 2
# -> (3*0.95 - 1) / 2 = 0.925
```

Uma distribuição perfeitamente plana (cada opção em igualdade) dá uma confiança próxima de 0; uma distribuição que concentra todo seu peso em uma única opção dá uma confiança próxima de 1.

Para uma pergunta **Noul**, não existe um campo `confidence` separado: a probabilidade retornada exerce os dois papéis ao mesmo tempo (a resposta E seu grau de certeza), como visto no [capítulo sobre as primitivas](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul#noul-verificar-uma-afirmacao-binaria).

## Três limiares, três comportamentos

Na prática, uma confiança se traduz em código em três zonas de decisão, cada uma associada a um comportamento diferente:

| Zona | Comportamento |
|---|---|
| Confiança alta | Agir automaticamente, sem intervenção humana |
| Confiança média | Proceder com cautela (ex: pedir confirmação ao usuário antes de agir) |
| Confiança baixa | Escalar para um humano em vez de arriscar uma decisão automática |

Esses limiares nunca são universais: dependem do **risco associado à ação**. Uma operação destrutiva ou irreversível exige um limiar mais alto que uma simples leitura.

```python
def decidir(resposta_choice, acao_de_baixo_risco: bool):
    if acao_de_baixo_risco:
        limiar_acao_direta = 0.60
    else:
        limiar_acao_direta = 0.85

    if resposta_choice.confidence >= limiar_acao_direta:
        return "executar"
    if resposta_choice.confidence >= 0.40:
        return "pedir_confirmacao"
    return "escalar_para_humano"
```

## Exemplo: uma interface bancária por voz

Uma mesma ação (uma transferência) pode ter limiares diferentes segundo seu valor ou seu status:

| Ação | Risco | Limiar de confiança exigido |
|---|---|---|
| Consultar um saldo | Baixo (somente leitura) | 0,60 basta para responder diretamente |
| Transferência já aprovada, valor baixo | Moderado | 0,85 para executar automaticamente |
| Transferência, confiança moderada | Alto se houver erro | Pedir confirmação antes de executar |

> **Armadilha:** fixar um limiar único para todas as ações de um sistema, sem distinguir uma simples consulta de uma ação irreversível.
>
> **Boa prática:** calibrar os limiares por ação segundo seu risco real, começando com limiares conservadores (mais exigentes) e depois ajustando-os a partir dos resultados observados em produção, em vez de adivinhar um valor definitivo desde o início.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | A confiança deriva da forma da distribuição de probabilidades (concentrada = confiante, espalhada = incerta) para Choice e Score; para Noul, a probabilidade sozinha faz esse papel. Três zonas de decisão (agir, confirmar, escalar) se aplicam segundo limiares que dependem do risco da ação, não de um valor universal. |
| **Ferramentas utilizáveis** | O campo `confidence` das respostas Choice/Score; limiares programados em código, distintos por ação. |
| **Armadilhas a evitar** | Um limiar único aplicado a todas as ações, sem levar em conta seu risco respectivo. |
| **Boas práticas** | Limiares mais altos para as ações irreversíveis ou de alto risco. Começar com limiares conservadores, e depois ajustá-los segundo os resultados observados em produção. |
