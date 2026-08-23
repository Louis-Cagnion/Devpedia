---
order: 3
---

# O formato JSON

Uma [API](/?c=infrastructure&p=api-et-http) responde com dados; ainda é preciso um formato comum para escrevê-los, que o programa que os recebe consiga entender sem ambiguidade. O **JSON** (*[JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) Object Notation*) é o formato mais usado para isso: um texto estruturado, legível tanto por um humano quanto por um programa.

## Os tipos de valores em JSON

| Tipo | Exemplo | Observação |
|---|---|---|
| Texto (*string*) | `"Curitiba"` | Sempre entre aspas duplas |
| Número | `18`, `3.14` | Nunca entre aspas |
| Booleano | `true`, `false` | |
| Valor ausente | `null` | "Nenhum valor", não é a mesma coisa que um texto vazio `""` ou um `0` |
| Lista (*array*) | `[1, 2, 3]` | Uma sequência ordenada de valores |
| Objeto | `{"chave": valor}` | Um conjunto de pares chave/valor |

Texto, número e booleano são os mesmos tipos básicos já vistos em [a variável](/?c=bases-de-l-informatique&p=la-variable); o JSON adiciona a lista e o objeto, para representar dados compostos por vários valores.

## Um exemplo concreto

```json
{
  "cidade": "Curitiba",
  "temperatura": 18,
  "nublado": true,
  "previsoes": [19, 21, 17],
  "estacao": null
}
```

Um objeto (delimitado por `{ }`) associa cada chave (`"cidade"`, `"temperatura"`...) a um valor: aqui um texto, um número, um booleano, uma lista de números, e um valor ausente.

## Objetos e listas podem se aninhar

Nada impede uma lista de conter objetos, ou um objeto de conter uma lista; é até a estrutura mais comum para dados reais:

```json
{
  "clientes": [
    {"nome": "Souza", "idade": 34},
    {"nome": "Martins", "idade": 28}
  ]
}
```

Aqui, `clientes` é uma lista de dois objetos, cada um com suas próprias chaves `nome` e `idade`.

> **Cuidado:** perder o fio do aninhamento em um JSON profundamente aninhado (objetos em listas dentro de objetos...) e acessar o valor errado, principalmente quando escrito ou relido manualmente.
>
> **Boa prática:** usar uma ferramenta que formata e colore o JSON (a maioria dos editores de código faz isso nativamente) para identificar visualmente qual chave corresponde a qual outra, em vez de relê-lo como texto puro.

## O JSON não aceita qualquer coisa

Diferente de muitos formatos de configuração, o JSON é estrito: sem comentários, sem vírgula após o último elemento de uma lista ou objeto, e as chaves precisam estar entre aspas **duplas** (nunca simples).

```json
{
  "nome": "João",
  "idade": 30,   <- uma virgula aqui, depois do ultimo elemento, e um erro de sintaxe
}
```

> **Cuidado:** adicionar um comentário (`// ...`) ou uma vírgula final por hábito de outra linguagem. Um JSON inválido por esse motivo falha explicitamente na análise (o programa que tenta lê-lo gera um erro); ele nunca é interpretado "mais ou menos".
>
> **Boa prática:** validar um JSON escrito manualmente com uma ferramenta dedicada (linter, validador online, ou simplesmente o editor de código) antes de usá-lo, em vez de descobrir o erro de sintaxe só depois de rodar o programa.

## Converter entre JSON e um programa

Um texto JSON continua sendo uma simples string enquanto não for **analisado** (*parsed*): transformado em uma estrutura de dados que a linguagem pode manipular diretamente (acessar uma chave, percorrer uma lista...). A operação inversa (converter de volta uma estrutura de dados em texto JSON) é chamada de **geração** ou **serialização**:

```text
texto_json = '{"cidade": "Curitiba", "temperatura": 18}'

dado = analisar_json(texto_json)    // texto -> estrutura nativa da linguagem
dado.temperatura                     // 18, usavel como um numero normal

novo_texto = gerar_json(dado)       // estrutura -> texto JSON de novo
```

> **Cuidado:** tentar extrair um valor diretamente do texto puro (busca por um padrão, divisão de string) em vez de analisar o JSON corretamente: um valor que contém por coincidência a mesma sequência de caracteres da chave procurada em outro lugar no texto pode distorcer o resultado.
>
> **Boa prática:** sempre usar uma função de análise JSON dedicada (presente nativamente em quase todas as linguagens) em vez de tratar o JSON como texto comum.

## O que reter

| | |
|---|---|
| **O que reter** | O JSON representa dados estruturados em texto, com objetos (chave/valor) e listas, que podem se aninhar livremente. É o formato mais comum para trocas via API. |
| **Ferramentas úteis** | Um editor de código (realce de sintaxe, formatação automática); um validador JSON online; a função de análise JSON nativa da linguagem usada. |
| **Armadilhas a evitar** | Adicionar um comentário ou uma vírgula depois do último elemento (sintaxe inválida). Manipular o JSON como texto puro em vez de analisá-lo. |
| **Boas práticas** | Validar um JSON escrito manualmente antes de usá-lo. Sempre usar uma função de análise dedicada para extrair um valor dele. |
