---
order: 9
---

# Receitas: extrair e reestruturar texto livre

Este capítulo e os dois seguintes aplicam a [metodologia](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one) a problemas concretos, documentados pela TypeSafe AI em forma de receitas ("cookbooks"). Esta primeira série trata da extração: encontrar um valor preciso, ou uma estrutura, em um texto que não a tem.

## Recuperação de estrutura: reconstruir um documento mal formatado

Um texto colado sem formatação (títulos, listas, citações perdidas) é reestruturado em duas passagens, sem nunca reescrever um único caractere do texto fonte:

| Passagem | Pergunta feita | Objetivo |
|---|---|---|
| 1. Costura (*stitching*) | Um Noul por par de linhas vizinhas: "esta linha continua a frase anterior?" | Fundir linhas cortadas por erro |
| 2. Classificação | Um Choice por bloco fundido: título, parágrafo, item de lista, citação, código, destaque | Recuperar a estrutura lógica do documento |

O modelo só responde a perguntas factuais estreitas; é o código quem cuida da pontuação e dos espaços, eliminando todo risco de reescrita involuntária do texto original.

## Cascata de extração estruturada: economizar sem perder qualidade

A **cascata SDE** (*structured-data-extraction cascade*) processa um documento em várias etapas de custo crescente, escalando para a etapa seguinte apenas se necessário:

```text
1. Um modelo economico extrai os campos (rapido, barato)
        |
        v
2. O modelo de decisao estruturada VERIFICA cada campo (um Noul por campo,
   detecta uma extracao duvidosa ou alucinada)
        |
        v
3. Apenas os campos julgados duvidosos (confianca acima de um limiar) sao
   reprocessados por um modelo potente (caro, reservado aos casos dificeis)
```

O modelo econômico pode alucinar um valor plausível mas falso (ex: inventar uma data de cadastro ausente de uma página); o papel do modelo de decisão estruturada é justamente detectar esse tipo de desvio antes que se propague, sem recorrer ao modelo potente para os campos já corretos.

## Extração de datas: ler e depois resolver em código

Consequência direta da [armadilha nº 3 do capítulo anterior](/?c=ia&s=modeles-de-decision-structuree&p=limites-et-pieges-jev) (o modelo calcula mal as datas): nunca se pede a ele calcular uma data, apenas **ler como ela está escrita**.

```text
1. O modelo responde a perguntas Choice: data absoluta ou relativa?
   quais componentes sao nomeados (mes, dia, ano, dia da semana)?
2. O CODIGO converte essas respostas em uma data real (ex: qual quinta-feira
   para "quinta-feira que vem"), deduzindo o ano faltante se necessario
```

| Armadilha | Boa prática |
|---|---|
| Perguntar diretamente ao modelo "qual é a data exata?" | Perguntar a ele como o texto a expressa, resolver o cálculo em código |

## Extração de valores pré-localizados: o regex encontra, o modelo escolhe

Para valores com um padrão reconhecível (email, telefone, valor monetário), uma expressão regular localiza primeiro todos os candidatos plausíveis (mesmo que às custas de encontrar demais), e depois uma pergunta Choice seleciona aquele que realmente corresponde ao que é pedido:

```text
Texto -> regex (padroes email/telefone/valor) -> N candidatos
Candidatos + pergunta -> Choice -> o candidato pertinente
Candidato escolhido -> codigo -> copia verbatim + normalizacao (ex: formato E.164)
```

O modelo nunca copia ele mesmo um valor: ele **designa** um candidato já encontrado pelo regex, que o código copia tal como está. Ele não pode, portanto, nem inventar um valor, nem transpor um dígito por erro, ao contrário de um LLM generativo que retiparia o valor ele mesmo.

> **Armadilha comum a estas quatro receitas:** deixar o modelo produzir ou calcular diretamente um valor exato (uma data resolvida, um valor copiado), em vez de confiná-lo a um julgamento (qual? de que tipo? isso parece coerente?) e deixar o código fazer o cálculo ou a cópia exata.
>
> **Boa prática comum:** sempre repartir o trabalho segundo os pontos fortes de cada um: ao modelo, o julgamento contextual (qual desses candidatos? que tipo de bloco? esta extração parece correta?); ao código, todo cálculo ou cópia que deva ser exato a 100%.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | Quatro receitas de extração compartilham o mesmo princípio: o modelo de decisão estruturada nunca faz o cálculo ou a cópia exata ele mesmo, ele julga (esta linha continua? este campo parece correto? como está escrita esta data? qual candidato corresponde?), e o código executa a parte que deve ser exata. |
| **Ferramentas utilizáveis** | Perguntas Noul/Choice em cascata ou em passagens sucessivas; uma expressão regular a montante para localizar candidatos; código de resolução/normalização a jusante. |
| **Armadilhas a evitar** | Fazer o modelo calcular ou copiar um valor exato em vez do código. |
| **Boas práticas** | Reservar o modelo ao julgamento contextual, confiar ao código todo cálculo ou cópia que deva permanecer exato. |
