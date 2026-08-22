---
order: 4
---

# Reduzir a variância das respostas: self-consistency, voto majoritário e ensembling

O capítulo [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production#a-temperatura-controlar-o-acaso-da-geracao) mostra que a temperatura estreita ou achata o sorteio de um LLM, mas nunca garante que uma única chamada produza a resposta certa: uma temperatura baixa limita o acaso, não o suprime, e um raciocínio de várias etapas sempre pode partir por um caminho errado já no primeiro token. Outra família de técnicas ataca o problema de forma diferente: em vez de mudar *como* uma geração faz seu sorteio, ela gera **várias respostas independentes** e as combina para obter um resultado mais confiável que uma única tentativa.

## Voto majoritário: perguntar várias vezes, ficar com a resposta mais frequente

O **voto majoritário** (*majority voting*) envia o mesmo prompt *N* vezes com uma temperatura diferente de zero (a temperatura 0, as *N* respostas seriam quase sempre idênticas, veja a nota sobre o determinismo imperfeito em [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production#a-temperatura-controlar-o-acaso-da-geracao)), e então mantém a resposta que aparece mais vezes entre as *N*:

```python
from collections import Counter

def votar_maioria(prompt, n=5, temperatura=0.7):
    respostas = [
        client.chat.completions.create(
            model="...",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperatura,
        ).choices[0].message.content
        for _ in range(n)
    ]
    mais_frequente, numero_de_votos = Counter(respostas).most_common(1)[0]
    return mais_frequente, numero_de_votos / n  # resposta escolhida + score de confianca
```

A razão `numero_de_votos / n` serve como score de confiança: 5 respostas idênticas em 5 inspiram mais confiança que 3 em 5, mesmo que o voto majoritário escolha a resposta vencedora nos dois casos.

| Adequado para | Não adequado para |
|---|---|
| Resposta discreta e verificável: classificação, extração de um campo, múltipla escolha, cálculo delegado a uma ferramenta | Geração aberta: redação, resumo, brainstorming criativo |
| Raramente existem várias formulações válidas de uma mesma resposta | Duas redações diferentes não "votam" uma na outra: não há maioria a apurar |

> **Cuidado:** comparar respostas de texto livre para um voto sem normalizá-las antes (ex: "Paris" e "paris." contadas como duas respostas diferentes por causa da caixa ou da pontuação). O voto subestima então artificialmente a maioria real.
>
> **Boa prática:** normalizar cada resposta (minúsculas, pontuação removida, formato unificado) antes de compará-las entre si, em particular para uma resposta que deveria ser um valor exato em vez de um texto livre.

## Self-consistency: votar na conclusão de vários raciocínios

A **self-consistency** aplica o mesmo princípio de voto, mas ao resultado final de vários [raciocínios chain-of-thought](/?c=ia&s=nlp-llm&p=prompt-engineering#o-raciocinio-passo-a-passo-chain-of-thought) independentes, em vez de a uma resposta produzida diretamente. Cada execução pode seguir um caminho de raciocínio diferente (um cálculo intermediário formulado de outra forma, uma ordem de etapas distinta), mas se a maioria dos caminhos convergir para a mesma conclusão, essa conclusão é bem mais confiável que um raciocínio isolado, mesmo que detalhado:

```text
Pergunta: "Um trem parte as 14h12 a 80km/h, outro as 14h27 a 100km/h na
mesma via. A que horas o segundo alcanca o primeiro ?"

5 raciocinios chain-of-thought independentes (temperatura > 0):

Execucao 1 -> caminho de calculo A -> conclusao: 15h39
Execucao 2 -> caminho de calculo B -> conclusao: 15h39
Execucao 3 -> caminho de calculo A -> conclusao: 15h39
Execucao 4 -> caminho de calculo C -> conclusao: 15h42   (erro de arredondamento)
Execucao 5 -> caminho de calculo A -> conclusao: 15h39

Voto na CONCLUSAO (nao no caminho): 15h39 escolhida (4 votos de 5)
```

A técnica vem de um artigo de pesquisa dedicado: [*Self-Consistency Improves Chain of Thought Reasoning in Language Models*](https://arxiv.org/abs/2203.11171) (Wang et al., 2022), que mostra ganhos de confiabilidade mensuráveis em tarefas de cálculo e raciocínio lógico em relação a um chain-of-thought executado uma única vez.

> **Cuidado:** aplicar a self-consistency a uma tarefa que ainda não se beneficia do chain-of-thought (uma extração direta, uma classificação simples): o custo extra (vários raciocínios completos a gerar, não apenas várias respostas curtas) não traz então nada que um simples voto majoritário já não desse por muito menos.
>
> **Boa prática:** reservar a self-consistency para as tarefas que já se beneficiam do chain-of-thought (cálculo de várias etapas, lógica, decomposição de um problema), e o voto majoritário simples para todo o resto.

## Ensembling: combinar modelos ou configurações diferentes

Em vez de reamostrar o mesmo modelo com o mesmo prompt, o **ensembling** combina as respostas de vários modelos diferentes (por exemplo dois fornecedores distintos) ou de várias variantes de um mesmo prompt (reformulação, exemplos few-shot diferentes), e então agrega tudo por voto ou por meio de um modelo "juiz" encarregado de comparar as respostas e escolher a melhor ou sintetizar uma nova.

| Técnica | O que varia entre as *N* tentativas | O que permanece idêntico |
|---|---|---|
| Voto majoritário | O sorteio aleatório (temperatura) | O modelo, o prompt |
| Self-consistency | O sorteio aleatório, o caminho de raciocínio | O modelo, o prompt |
| Ensembling | O modelo e/ou o próprio prompt | Nada é necessariamente fixo |

O ensembling ajuda mais quando os erros das diferentes tentativas são realmente independentes: modelos de fornecedores diferentes, treinados com dados e decisões de arquitetura distintas, não têm os mesmos pontos cegos, então seus erros respectivos têm menos chance de coincidir. É o mesmo princípio de um conjunto de modelos clássicos em machine learning (vários preditores independentes que votam), transposto para os LLMs.

> **Cuidado:** fazer ensembling com várias instâncias de um mesmo modelo subjacente (apenas prompts levemente reformulados, por exemplo), esperando o mesmo ganho que com modelos realmente diferentes. Se as tentativas compartilham o mesmo viés de fundo, seus erros também coincidem, e o ensembling perde grande parte do seu interesse.
>
> **Boa prática:** privilegiar fontes de erro realmente independentes (fornecedores ou arquiteturas diferentes) em vez de variações superficiais de um mesmo modelo, quando o risco justifica o custo do ensembling.

## O compromisso entre custo, latência e confiabilidade

Essas três técnicas compartilham o mesmo compromisso: a confiabilidade ganha se paga com chamadas multiplicadas por *N*, nunca de graça (veja também [o custo como restrição de design](/?c=ia&s=nlp-llm&p=llm-en-production) para uma única chamada).

| | Custo (número de chamadas) | Latência se sequencial | Ganho de confiabilidade |
|---|---|---|---|
| Uma única tentativa | 1× | Referência | Nenhum |
| Voto majoritário | *N*× | *N*× | Moderado, em resposta discreta |
| Self-consistency | *N*× (raciocínios completos) | *N*× | Alto, em tarefa de raciocínio |
| Ensembling | *N*× (geralmente mais caro: modelos diferentes) | *N*× | Alto, se os erros forem independentes |

As *N* chamadas podem ser executadas em paralelo (requisições de API simultâneas) para limitar o impacto na latência percebida pelo usuário, mas o custo de computação, esse, continua multiplicado por *N* mesmo quando o tempo de espera não está.

> **Cuidado:** multiplicar as amostras por reflexo em uma tarefa onde a latência é crítica (um chatbot conversacional em tempo real) sem ter medido o ganho real de confiabilidade obtido. O custo extra é sistemático, o benefício nem sempre é.
>
> **Boa prática:** reservar essas técnicas para decisões cujo erro custa realmente mais caro que *N* chamadas adicionais (cálculo crítico, classificação de alto risco, etapa-chave de um [agente](/?c=ia&s=nlp-llm&p=agents)), não como reflexo sistemático em cada requisição.

## O que reter

| | |
|---|---|
| **O que reter** | Baixar a temperatura reduz o acaso de uma única chamada, mas não o suprime. O voto majoritário, a self-consistency (voto na conclusão de vários chain-of-thought) e o ensembling (modelos ou prompts diferentes) geram várias respostas independentes e as combinam para obter um resultado mais confiável que uma única tentativa. |
| **Ferramentas úteis** | Várias chamadas de API em paralelo com temperatura diferente de zero, um contador de ocorrências para o voto, um modelo "juiz" para agregar respostas de ensembling. |
| **Armadilhas a evitar** | Comparar respostas de texto não normalizadas para um voto. Aplicar a self-consistency a uma tarefa que não precisa de chain-of-thought. Fazer ensembling com variantes próximas demais de um mesmo modelo. Multiplicar as amostras sem medir o ganho real de confiabilidade. |
| **Boas práticas** | Normalizar as respostas antes de votar. Reservar a self-consistency para tarefas de raciocínio de várias etapas. Privilegiar modelos realmente independentes para o ensembling. Reservar essas técnicas para decisões onde o risco justifica o custo multiplicado por *N*. |
