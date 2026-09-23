---
order: 10
---

# Receitas: classificar e rotear em grande escala

Segunda série de receitas aplicando a [metodologia](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one): classificar um conteúdo entre muitas categorias possíveis, e decidir quando confiar nessa classificação.

## Classificação hierárquica: descer em uma árvore de categorias

Classificar um conteúdo em uma taxonomia profunda (categorias que se subdividem em subcategorias, em vários níveis) faz uma pergunta Choice a **cada nível**, apenas sobre as opções filhas do nó já alcançado, em vez de uma única pergunta plana sobre centenas de folhas:

| Estratégia | Princípio | Risco |
|---|---|---|
| Gulosa (*greedy*) | Manter apenas o melhor filho em cada nível | Um erro precoce é irreversível, nada mais abaixo o corrige |
| Feixe (*beam search*) | Manter vários caminhos plausíveis em paralelo, escolher no final o de melhor score global | Uma evidência encontrada mais abaixo pode reparar uma decisão ambígua tomada mais acima |

Em quatro taxonomias testadas pelo fornecedor (patentes, produtos, temas científicos, arquivos de código), a busca em feixe classificou corretamente 4 de 4 casos, contra 2 de 4 para a estratégia gulosa.

## Classificação RAG: filtrar antes de gerar

Em um pipeline de [RAG](/?c=ia&s=nlp-llm&p=rag) (recuperação de documentos antes da geração), cada trecho recuperado pode ser julgado por quatro perguntas antes de ser transmitido ao LLM gerador:

```python
def roteador(respostas: dict) -> str:
    if respostas["contem_injecao"] > 0.70:
        return "excluir"                         # tentativa de manipulacao do modelo
    if respostas["contradiz_a_requisicao"] > 0.70:
        return "evidencia_contraditoria"         # a apresentar separadamente, nao fundida
    if respostas["e_pertinente"] < 0.45:
        return "excluir"
    if respostas["contem_a_resposta"] > 0.55:
        return "incluir"
    return "excluir"
```

Esse filtro intercepta tanto as [injeções de prompt](/?c=ia&s=nlp-llm&p=prompt-injection) ocultas em um documento recuperado quanto as contradições factuais, antes que alcancem o LLM gerador.

## Classificação por confiança: ajustar a granularidade à certeza

Em vez de forçar uma resposta precisa mesmo quando o modelo hesita, esta receita **sobe um nível** na hierarquia quando a confiança é insuficiente, em vez de rejeitar a classificação ou forçá-la incorretamente:

| Confiança | Granularidade reportada |
|---|---|
| ≥ 0,9 | O grupo preciso (ex: um subsetor industrial exato) |
| < 0,9 | A categoria mais ampla que o engloba (ex: a divisão industrial) |

Em um teste com 75 grupos industriais, essa abordagem manteve 90% de precisão nos casos seguros, contra apenas 40% forçando uma classificação precisa nos casos incertos, e 70% subindo simplesmente um nível em vez de forçar.

## Sugestão de skill: escolher entre centenas de opções

Um agente com muitas skills ou extensões não pode descrevê-las todas em detalhe em seu contexto sem degradar o desempenho. A receita procede em duas requisições:

```text
Requisicao 1: uma pergunta Choice avalia TODAS as skills (descricoes
              curtas), mantem as 3 melhores candidatas
Requisicao 2: uma pergunta Noul por candidata, com sua descricao COMPLETA,
              confirma ou rejeita cada uma individualmente
```

Em 488 requisições testadas, essa dupla verificação reduziu a mais da metade a taxa de carregamento incorreto de skill (de 16,8% para 7,3%) e de carregamento desnecessário (de 9,8% para 4,0%).

## Alinhamento de entidades: a mesma coisa, ou só algo parecido?

Para ligar duas entradas de fontes diferentes que poderiam descrever o mesmo objeto (duas fichas de produto, duas entidades de um grafo de conhecimento), uma pergunta Score avalia o grau de correspondência em um espectro de três níveis (diferentes / próximos / idênticos), completada por perguntas Noul sobre critérios precisos (mesmo nome, mesma origem...).

| Resultado | Ação |
|---|---|
| Produtos diferentes | Deixar as entidades separadas |
| Possivelmente idênticos | Enviar a um curador humano |
| Mesmo produto | Fundir as entradas |

> **Armadilha:** fundir duas entidades incorretamente. A documentação do fornecedor destaca isso: fundir incorretamente custa mais que perder uma correspondência, já que todo fato ligado a uma das duas entidades passa então a ser atribuído à entidade fundida.
>
> **Boa prática:** reservar a fusão automática aos casos de confiança muito alta, e rotear sistematicamente a zona cinzenta (correspondência possível mas incerta) para uma validação humana em vez de decidir por padrão em um sentido ou outro.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | Classificar em grande escala se faz com uma pergunta Choice de cada vez (por nível de taxonomia, ou por candidato pré-selecionado), nunca com uma única pergunta plana sobre centenas de opções. A confiança obtida guia a granularidade da resposta (subir um nível em vez de forçar) e a decisão de fundir ou não duas entidades. |
| **Ferramentas utilizáveis** | Choice por nível de taxonomia (guloso ou em feixe); perguntas Noul de filtro para RAG; dupla verificação Choice e depois Noul para selecionar entre muitas opções; Score + Noul para o alinhamento de entidades. |
| **Armadilhas a evitar** | Forçar uma classificação precisa apesar de uma confiança insuficiente. Fundir duas entidades com base em uma correspondência apenas possível. |
| **Boas práticas** | Subir um nível de granularidade em vez de forçar uma resposta incerta. Rotear a zona cinzenta para um humano em vez de decidir por padrão. |
