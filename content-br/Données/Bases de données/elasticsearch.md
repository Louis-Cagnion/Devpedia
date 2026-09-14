---
order: 10
---

# Elasticsearch: o banco orientado a documentos para busca

Um banco relacional (ver [Bancos de dados](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) organiza os dados em tabelas, linhas e colunas, ligadas por *joins*. O **Elasticsearch** organiza os dados de outra forma: cada registro é um **documento** JSON completo, guardado em um **índice** (o equivalente de uma tabela), e o motor é construído desde o início para a **busca full-text** em vez dos *joins*.

| | Banco relacional (SQL) | Redis | Elasticsearch |
|---|---|---|---|
| Unidade de dado | Uma linha, em uma tabela de colunas fixas | Um valor por chave (ver [Redis](/?c=donnees&s=bases-de-donnees&p=redis)) | Um documento JSON, dentro de um índice |
| Ponto forte | *Joins*, consistência transacional | Velocidade de acesso em RAM | Busca full-text, tolerância a erros de digitação |
| Consultas | [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) | Comandos por tipo de estrutura | Consultas em JSON (*Query DSL*) |

## Um documento, um índice

```json
// Documento indexado sob o indice "veiculos"
{
  "marca": "Peugeot",
  "modelo": "308",
  "ano": 2022,
  "descricao": "Sedã compacto, baixa quilometragem, manutenção em dia"
}
```

Diferente de uma tabela SQL, dois documentos do mesmo índice não precisam ter exatamente os mesmos campos: o Elasticsearch deduz o tipo de cada campo (texto, número, data...) na primeira inserção, e o índice que constrói para esse campo depende desse tipo deduzido.

## Consultar com o Query DSL

Uma consulta não é uma string ao estilo SQL, mas um objeto JSON enviado ao servidor:

```json
// Busca "sedan" na descricao, limitado a anuncios abaixo de 20000€
{
  "query": {
    "bool": {
      "must": [
        { "match": { "descricao": "sedan" } }
      ],
      "filter": [
        { "range": { "preco": { "lte": 20000 } } }
      ]
    }
  },
  "from": 0,
  "size": 20
}
```

| Cláusula | Papel |
|---|---|
| `match` | Busca full-text, tolera variantes de palavras (acentos, plurais conforme o idioma configurado) |
| `filter` | Condição exata (faixa, igualdade), sem influenciar o score de relevância |
| `from` / `size` | Paginação: `from` = quantos resultados pular, `size` = quantos retornar |

## O *fuzzy matching*: tolerar erros de digitação

Um `match` clássico pode ativar a **tolerância a erros de digitação** (*fuzziness*): "peugot" ainda encontra "peugeot", dentro de uma distância de edição (número de letras a mudar) definida pelo parâmetro.

```json
{ "match": { "modelo": { "query": "peugot", "fuzziness": "AUTO" } } }
```

> **Armadilha:** ativar o fuzzy matching em um campo que deveria ser um valor exato vindo de uma faceta (uma lista suspensa "Marca", por exemplo, onde o usuário só pode escolher valores já válidos). O fuzzy matching se torna permissivo demais ali: pode fazer "Renault" aparecer para uma busca "Peugeot" se a distância de edição ficar abaixo do limite, um resultado absurdo para um campo de opções fechadas.
>
> **Boa prática:** reservar o fuzzy matching para campos de texto livre realmente digitados por um humano (uma descrição, uma busca em linguagem natural); em um campo de valores fechados (faceta, filtro), usar uma correspondência exata (`term`), nunca `match` com fuzziness.

## As agregações: contar e agrupar sem *joins*

Uma **agregação** calcula uma estatística sobre o conjunto de documentos que correspondem a uma consulta, na mesma resposta que os resultados:

```json
// Quantos anuncios por marca, entre os resultados filtrados acima
{
  "aggs": {
    "por_marca": {
      "terms": { "field": "marca.keyword" }
    }
  }
}
```

É o equivalente de um `GROUP BY` SQL, mas calculado diretamente sobre o índice de busca em vez de por um *join* entre tabelas.

## Busca híbrida: combinar vetores e filtros exatos

Um campo do Elasticsearch também pode armazenar um **embedding** (veja [RAG](/?c=ia&s=nlp-llm&p=rag)) do tipo `dense_vector`: um array de números que representa o sentido de um texto, comparado por similaridade em vez de igualdade.

```json
// Mapping: declara um campo vetorial ao lado dos campos classicos
{
  "mappings": {
    "properties": {
      "description": { "type": "text" },
      "concessionaria_id": { "type": "keyword" },
      "embedding": { "type": "dense_vector", "dims": 768 }
    }
  }
}
```

A cláusula `knn` (*k-nearest neighbors*, os k vizinhos mais próximos) busca os documentos cujo `embedding` está mais próximo de um vetor dado -- a mesma similaridade de cosseno de um pipeline RAG (veja [o pipeline em quatro etapas](/?c=ia&s=nlp-llm&p=rag)), mas calculada diretamente pelo Elasticsearch em vez de no código da aplicação.

```json
// Busca os 10 veiculos cuja descricao mais se parece com a pergunta,
// mas SOMENTE na concessionaria atual
{
  "knn": {
    "field": "embedding",
    "query_vector": [0.021, -0.13, 0.58],
    "k": 10,
    "num_candidates": 50,
    "filter": {
      "term": { "concessionaria_id": "concessionaria-42" }
    }
  }
}
```

| Parâmetro | Papel |
|---|---|
| `field` | O campo `dense_vector` a comparar |
| `query_vector` | O embedding da pergunta feita (calculado pelo mesmo modelo usado na indexação) |
| `k` | Quantos resultados retornar no final |
| `num_candidates` | Quantos candidatos explorar antes de manter os `k` melhores (compromisso velocidade/precisão: quanto maior, mais precisa mas mais lenta a busca) |
| `filter` | Uma condição exata (como um `term`/`bool` clássico) aplicada **antes** de buscar os vizinhos |

> **Armadilha:** filtrar depois (buscar os 10 vizinhos mais próximos e só então excluir os de outra concessionária no código da aplicação) pode retornar menos de 10 resultados, ou até nenhum, se todos os vizinhos mais próximos pertencerem a outras concessionárias. O `filter` aninhado em `knn` restringe o espaço de busca antes de procurar os vizinhos: a comparação recai então só sobre os documentos já filtrados.
>
> **Boa prática:** sempre passar uma restrição exata conhecida de antemão (um id de concessionária, um intervalo de datas) pelo `filter` do próprio `knn`, nunca como pós-processamento na aplicação.

`knn` também se combina com uma busca de texto completo clássica na mesma consulta, para misturar relevância semântica e relevância textual:

```json
{
  "query": {
    "match": { "description": "sedan familiar" }
  },
  "knn": {
    "field": "embedding",
    "query_vector": [0.021, -0.13, 0.58],
    "k": 10,
    "num_candidates": 50
  }
}
```

O Elasticsearch então funde os dois rankings (score textual e score vetorial) em um único score final -- daí o nome **busca híbrida**.

## Painless: personalizar a ordenação no servidor

**Painless** é uma pequena linguagem de script executada no lado do servidor Elasticsearch, usada quando a ordenação padrão (relevância textual, ou um campo simples) não basta:

```json
// Ordena por um score proprio: nota x numero de avaliacoes, em vez da nota sozinha
{
  "sort": {
    "_script": {
      "type": "number",
      "script": { "source": "doc['nota'].value * doc['nb_avaliacoes'].value" },
      "order": "desc"
    }
  }
}
```

## Importar em massa: a Bulk API

Inserir um documento por vez (uma requisição de rede por documento) fica muito lento em uma importação de vários milhares de registros. A **Bulk API** agrupa muitas operações (inserção, atualização, exclusão) em uma única chamada de rede:

```text
Um documento por vez:      1000 documentos -> 1000 requisicoes de rede
Bulk API (lotes de 500):   1000 documentos -> 2 requisicoes de rede
```

> **Armadilha:** continuar inserindo documento por documento em uma importação volumosa "porque já funciona assim": o gargalo quase nunca é o Elasticsearch em si, mas o número de idas e vindas de rede (ver [Reduzir as idas e vindas](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)).
>
> **Boa prática:** usar a Bulk API em lotes (algumas centenas a alguns milhares de documentos por chamada, conforme o tamanho), em vez de uma requisição por documento.

---

## 📋 O que reter

| | |
|---|---|
| **O que reter** | O Elasticsearch guarda documentos JSON em índices, construídos para busca full-text em vez de *joins*. Consultas são escritas em JSON (Query DSL); agregações calculam estatísticas sem *joins*; `knn` busca por similaridade vetorial e pode se combinar com um filtro exato ou uma busca full-text (busca híbrida); Painless permite ordenação personalizada no servidor. |
| **Ferramentas úteis** | `match` (full-text, com fuzziness opcional), `filter`/`term` (valor exato), `knn`/`dense_vector` (similaridade vetorial), `aggs` (agregações), scripts Painless, Bulk API para importações em massa. |
| **Armadilhas a evitar** | Ativar o fuzzy matching em um campo de valores fechados (faceta); importar documento por documento em vez de em lotes; filtrar depois uma busca `knn` em vez de usar seu `filter` embutido. |
| **Boas práticas** | Reservar `match`/fuzziness ao texto livre, `term` às facetas; usar a Bulk API em lotes para qualquer importação volumosa; passar toda restrição exata conhecida de antemão pelo `filter` do `knn`. |
