---
order: 11
---

# Receitas: verificar, filtrar e tornar confiável

Última série de receitas: medir a estabilidade de um modelo de decisão estruturada, usá-lo como filtro de segurança, e empregá-lo para tarefas de busca ou chamada de função geralmente confiadas a um LLM generativo.

## Self-consistency: medir a estabilidade de uma resposta

A [self-consistency](/?c=ia&s=nlp-llm&p=reduire-la-variance-des-reponses#self-consistency-votar-na-conclusao-de-varios-raciocinios) de um LLM generativo vota na conclusão de vários raciocínios. Para um modelo de decisão estruturada, o equivalente consiste em repetir a mesma pergunta várias vezes (15 vezes nos testes do fornecedor) e medir o desvio padrão das probabilidades obtidas:

| Tipo de pergunta | Resultado medido |
|---|---|
| Noul, repetido 15 vezes | Desvio padrão médio de 0,0102 (muito estável), contra LLMs generativos que variam mesmo à temperatura 0 |
| Choice, repetido 15 vezes | 99,2% de concordância entre repetições com uma faixa de incerteza (probabilidade máxima < 0,60 retornada como "incerto"), contra 90,8% sem essa faixa |

Em vez de forçar uma decisão binária em 0,5 para um Noul, uma **faixa de incerteza** absorve os casos limite:

```python
if probabilidade < 0.30:
    decisao = "nao"
elif probabilidade > 0.70:
    decisao = "sim"
else:
    decisao = "incerto"   # escalar para um humano, a probabilidade continua visivel
```

## Re-ranking: reordenar uma lista já pré-selecionada

Uma busca rápida (por palavras-chave) produz primeiro uma lista curta de candidatos; o **re-ranking** reordena então essa lista julgando cada candidato individualmente contra a requisição, por meio de uma pergunta Noul repetida sobre cada par requisição/candidato. Em 40 consultas jurídicas testadas, essa etapa fez a precisão do primeiro resultado passar de 5% para 18%, e a dos dez primeiros de 38% para 62%.

## Busca semântica linha por linha

Para localizar a resposta a uma pergunta em um documento de várias centenas de linhas, cada linha recebe um identificador (`L001`, `L002`...), e depois duas perguntas são executadas em uma única requisição: um Choice classifica as linhas por pertinência, um Noul verifica em paralelo se o documento contém sequer uma resposta. Esta segunda pergunta distingue uma má correspondência (o documento não responde) de uma resposta simplesmente mal classificada.

## Chamada de função: transformar uma requisição em linguagem natural em uma chamada tipada

Uma requisição em linguagem natural ("trace a correlação móvel entre NVDA e SPY do último mês") se converte em uma chamada de função tipada, onde cada parâmetro aceita apenas um conjunto fechado de valores:

```text
"trace a correlacao movel entre nvda e spy do ultimo mes"
   -> rolling_correlation(symbol='NVDA', benchmark='SPY', window='1mo')
      confianca : 0.91
```

A confiança reportada é a do julgamento **menos certo** da cadeia (nem uma média nem um produto de probabilidades): um único parâmetro mal identificado basta para reduzir a confiança global da chamada.

## Verificação de citações: detectar uma fonte fabricada

Para verificar que uma citação produzida por um LLM realmente existe em um documento fonte:

```text
1. Busca textual normalizada (espacos, aspas) da citacao na
   fonte -> ausente = veredito "fabricada" imediato, sem necessidade do modelo
2. Se encontrada, uma pergunta Choice julga a relacao entre a citacao
   e a afirmacao: apoia / contradiz / nao aborda
```

| Veredito | Significado |
|---|---|
| Verificada | A fonte apoia a afirmação |
| Contradita | A fonte contradiz a afirmação |
| Não sustentada | A fonte não aborda o assunto |
| Fabricada | A citação não existe na fonte |

## Barreiras de segurança: uma camada de segurança independente do modelo principal

Em vez de colocar as regras de segurança nas instruções de sistema de um LLM (contornáveis) ou fazê-las verificar por um segundo LLM (caro, também contornável), uma única requisição de decisão estruturada avalia cada mensagem recebida e enviada, com um Noul por risco (contorno de instruções, ajuda a uma atividade ilegal, angústia...) e um Score de gravidade global:

```text
aprovado    <- risco abaixo de todos os limiares
revisao     <- pelo menos um risco proximo do limiar, sem ultrapassa-lo
bloqueado   <- um risco ultrapassa o limiar de bloqueio
suporte     <- um padrao de angustia e detectado
```

Os limiares continuam definidos e ajustáveis pela aplicação, em vez de herdados do comportamento padrão de um modelo.

## Descoberta de features: transformar texto livre em colunas numéricas

Um modelo de machine learning clássico (ex: CatBoost) precisa de uma tabela de números, não de texto livre. Um loop automatizado propõe perguntas sobre o texto (intensidade de um traço, presença de um fato), converte-as em colunas por meio de probabilidades calibradas, treina o modelo, e depois usa seu erro para propor novas perguntas. Em 2000 avaliações testadas, o erro de previsão (RMSE) caiu de 2,47 (texto bruto) para 1,77 após cinco iterações desse loop, sem que nenhuma das 38 perguntas finais fosse escrita à mão.

> **Armadilha comum a estas sete receitas:** tratar uma única execução como definitivamente confiável, sem nunca medir sua estabilidade (self-consistency), sem um filtro de segurança independente (barreiras de segurança), ou sem verificar que uma fonte citada realmente existe (verificação de citações).
>
> **Boa prática comum:** adicionar uma etapa de verificação dedicada (repetição e medição de desvio padrão, barreira de segurança a montante/jusante, busca textual antes do julgamento) em vez de confiar em uma única resposta bruta, em particular em tudo que toque a segurança ou a exatidão factual.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | Sete receitas de confiabilidade: medir a estabilidade por repetição (self-consistency), reordenar uma lista por julgamento individual (re-ranking), localizar uma resposta linha por linha, converter uma requisição em chamada de função tipada, verificar que uma citação realmente existe, filtrar mensagens recebidas/enviadas por barreiras de segurança independentes, transformar texto livre em colunas numéricas utilizáveis por um modelo clássico. |
| **Ferramentas utilizáveis** | Repetições e desvio padrão para a self-consistency; perguntas Noul/Choice para re-ranking, busca, chamada de função, citações, barreiras de segurança; loop de proposta/medição para a descoberta de features. |
| **Armadilhas a evitar** | Confiar em uma única execução sem verificação de estabilidade nem barreira de segurança independente. |
| **Boas práticas** | Adicionar sistematicamente uma etapa de verificação dedicada antes de confiar em uma resposta, em particular na segurança e na exatidão factual. |
