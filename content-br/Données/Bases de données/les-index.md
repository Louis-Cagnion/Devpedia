---
order: 6
---

# Os índices

A tabela OLTP/OLAP do capítulo [O modelo em estrela](/?c=bases-de-donnees&p=modeles-en-etoile) menciona leituras que percorrem milhões de linhas. Sem ajuda, um banco só consegue encontrar as linhas que atendem a uma condição examinando-as uma por uma: é isso que um **índice** vem evitar.

## O problema: buscar em uma tabela não ordenada

Sem índice, `WHERE id_produto = 42` obriga o banco a ler cada linha da tabela, uma por uma, até ter todas as linhas correspondentes. Isso é uma **varredura completa** (*full scan*): o tempo de busca aumenta com o número de linhas da tabela, mesmo que apenas uma corresponda à condição.

```text
Tabela sem indice: 1.000.000 de linhas lidas para encontrar as 3 linhas onde id_produto = 42
```

## O índice: uma estrutura para encontrar sem ler tudo

Um **índice** é uma estrutura separada que associa um valor de coluna à localização exata das linhas que o carregam, um pouco como o índice alfabético no final de um livro, que dá diretamente o número da página de uma palavra em vez de fazer buscar página por página. Uma vez criado o índice em `id_produto`, o banco pode pular diretamente para as linhas envolvidas sem ler as outras.

```sql
CREATE INDEX idx_fato_vendas_produto ON fato_vendas (id_produto);
```

```text
Tabela com indice em id_produto: o banco consulta o indice, encontra diretamente a localizacao
das 3 linhas onde id_produto = 42, sem ler as outras 999.997.
```

## O compromisso: leitura mais rápida, escrita mais lenta

Um índice não é gratuito: a cada inserção, modificação ou remoção de uma linha, o banco também precisa atualizar todos os índices que incidem sobre essa tabela, além de escrever a linha em si. Quanto mais índices uma tabela tem, mais cara fica cada escrita.

| | Sem índice | Com índice |
|---|---|---|
| Leitura (`WHERE`, `JOIN`) | Varredura completa, lenta em uma tabela grande | Acesso direto, rápido |
| Escrita (`INSERT`/`UPDATE`/`DELETE`) | Rápida (nada a mais para manter) | Mais lenta (o índice também precisa ser atualizado) |
| Espaço em disco | Mínimo | Um índice ocupa espaço adicional |

Esse compromisso se conecta à tabela OLTP/OLAP do capítulo sobre o modelo em estrela: um banco OLTP, que escreve sem parar, limita seus índices ao estritamente necessário; um data warehouse OLAP, que lê muito mais do que escreve, pode se dar ao luxo de ter mais.

## Armadilha: não indexar as chaves estrangeiras de uma tabela de fatos

> **Armadilha:** criar uma tabela de fatos com suas chaves estrangeiras para cada dimensão (`id_produto`, `id_cliente`, `id_data`), sem colocar índice nessas colunas. Cada `JOIN` para uma dimensão (veja [O modelo em estrela](/?c=bases-de-donnees&p=modeles-en-etoile)) acaba então varrendo integralmente a tabela de fatos, exatamente o caso que o índice deveria evitar.
>
> **Boa prática:** indexar sistematicamente as colunas de chave estrangeira de uma tabela de fatos, já que elas servem de ponto de entrada para quase todas as consultas de análise que a envolvem.

## Armadilha: indexar sem critério

> **Armadilha:** colocar um índice em cada coluna "só por precaução", ou em uma coluna com muito poucos valores distintos (um booleano `ativo` verdadeiro/falso, por exemplo). Nesse último caso, o índice quase não reduz o número de linhas a examinar (metade da tabela tem `verdadeiro`), mas ainda assim custa a cada escrita.
>
> **Boa prática:** indexar as colunas realmente usadas em um `WHERE`, um `JOIN` ou um `ORDER BY`, priorizando aquelas com muitos valores distintos (um identificador, uma data) em vez de um simples indicador verdadeiro/falso.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um índice é uma estrutura separada que permite encontrar linhas sem varrer a tabela inteira, ao custo de uma escrita mais lenta e de espaço em disco adicional a cada inserção, modificação ou remoção. |
| **Ferramentas utilizáveis** | `CREATE INDEX nome_indice ON tabela (coluna)` para acelerar leituras filtradas ou unidas nessa coluna. |
| **Armadilhas a evitar** | Tabela de fatos sem índice em suas chaves estrangeiras (cada `JOIN` varre tudo); índice colocado em uma coluna com poucos valores distintos ou "só por precaução" sem uso real. |
| **Boas práticas** | Indexar sistematicamente as chaves estrangeiras de uma tabela de fatos; reservar os índices às colunas realmente filtradas, unidas ou ordenadas, com valores distintos suficientes para que o índice realmente reduza a busca. |
