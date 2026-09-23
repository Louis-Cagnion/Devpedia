---
order: 1
---

# O modelo em estrela

O capítulo [SQL](/?c=domain-specific-languages-dsl&p=sql) trata cada tabela como uma planilha isolada. Assim que se quer analisar um histórico completo (anos de vendas, por exemplo), organizam-se deliberadamente várias tabelas umas ao redor das outras segundo um esquema preciso: o **modelo em estrela** (*star schema*), o mais usado em um data warehouse.

## OLTP contra OLAP: dois usos, duas organizações

Um banco de dados de aplicação clássico (aquele que registra um pedido quando um cliente clica em "Comprar") é otimizado para escritas rápidas e frequentes, uma linha por vez: é o **OLTP** (*Online Transaction Processing*). Um data warehouse é otimizado para o inverso: poucas escritas, mas leituras que percorrem milhões de linhas de uma vez ("o total de vendas por região nos últimos três anos"): é o **OLAP** (*Online Analytical Processing*). O modelo em estrela é uma organização pensada para o OLAP.

| | OLTP (aplicação) | OLAP (data warehouse) |
|---|---|---|
| Operação típica | Inserir um pedido | Agregar três anos de vendas |
| Volume por consulta | Um punhado de linhas | Milhões de linhas |
| Prioridade | Escrita rápida, sem duplicata | Leitura rápida, mesmo que duplique |

## A tabela de fatos: o que se mede

A **tabela de fatos** (*fact table*) contém os eventos mensuráveis: uma linha por venda, por exemplo, com colunas numéricas (valor, quantidade) e chaves estrangeiras para cada eixo de análise.

```sql
CREATE TABLE fato_vendas (
    id_produto  INT,   -- chave estrangeira -> dim_produto
    id_cliente  INT,   -- chave estrangeira -> dim_cliente
    id_data     INT,   -- chave estrangeira -> dim_data
    valor       DECIMAL(10, 2),
    quantidade  INT
);
```

## A tabela de dimensão: sob qual ângulo se olha

Uma **tabela de dimensão** (*dimension table*) descreve um dos eixos sob o qual se quer olhar os fatos: o produto vendido, o cliente, a data. Ela carrega as colunas descritivas (nome, categoria, cidade...) usadas para filtrar ou agrupar.

```sql
CREATE TABLE dim_produto (
    id_produto  INT PRIMARY KEY,
    nome        VARCHAR(100),
    categoria   VARCHAR(50)
);
```

## Por que "em estrela": o esquema

Uma tabela de fatos no centro, uma tabela de dimensão em cada ramo: visto de cima, a forma lembra uma estrela.

```text
                dim_data
                    |
dim_cliente ---- fato_vendas ---- dim_produto
                    |
               dim_loja
```

Uma consulta de análise ("o total de vendas por categoria de produto, em 2025") passa a fazer apenas um `JOIN` (veja [SQL](/?c=domain-specific-languages-dsl&p=sql)) entre a tabela de fatos e cada dimensão envolvida, nunca uma longa cadeia de junções por dezenas de tabelas:

```sql
SELECT p.categoria, SUM(f.valor) AS total
FROM fato_vendas f
JOIN dim_produto p ON p.id_produto = f.id_produto
JOIN dim_data d ON d.id_data = f.id_data
WHERE d.ano = 2025
GROUP BY p.categoria;
```

## Uma tabela de fatos única por união de vários fluxos, com coluna discriminante

Vários fluxos de dados heterogêneos (por exemplo dois processos de negócio distintos que produzem cada um eventos mensuráveis) podem alimentar uma única tabela de fatos em vez de tabelas separadas por fluxo, desde que compartilhem o mesmo grão (o mesmo nível de detalhe por linha): as linhas de cada fluxo são concatenadas (`UNION`), marcadas por uma coluna discriminante que indica sua origem.

```sql
SELECT id_produto, id_cliente, id_data, valor, quantidade, 'venda_direta' AS tipo_fluxo
FROM fato_vendas_diretas
UNION ALL
SELECT id_produto, id_cliente, id_data, valor, quantidade, 'venda_online' AS tipo_fluxo
FROM fato_vendas_online;
```

> **Armadilha:** unificar dois fluxos que não compartilham realmente o mesmo grão (ex: um fluxo no nível do pedido, o outro no nível da linha do pedido): a coluna discriminante não conserta um grão inconsistente, ela apenas indica a origem de uma linha.
>
> **Boa prática:** preferir essa união a tabelas separadas por fluxo assim que uma consulta de análise precisar consumir vários fluxos juntos (ex: o total de todas as vendas combinadas): uma única tabela a consultar em vez de um `UNION` a refazer em cada consulta.

## Formato largo (wide) contra formato longo (long/tidy)

Duas formas de representar várias medidas para uma mesma observação. O **formato largo** dá uma coluna por medida; o **formato longo** dá uma linha por medida, com um par `(rótulo, valor)` que identifica de qual medida se trata.

```text
Formato largo (uma coluna por medida)
| id_produto | vendas_janeiro | vendas_fevereiro | vendas_marco |
|------------|-----------------|-------------------|--------------|
| 1          | 120             | 95                | 140          |

Formato longo (uma linha por medida)
| id_produto | mes       | vendas |
|------------|-----------|--------|
| 1          | janeiro   | 120    |
| 1          | fevereiro | 95     |
| 1          | marco     | 140    |
```

O formato largo facilita a leitura humana direta (uma linha = todas as medidas de uma vez) mas multiplica as colunas vazias (`NULL`) assim que uma observação não tem todas as medidas. O formato longo permanece compacto seja qual for o número de medidas, ao custo de um `GROUP BY`/pivot para voltar a uma visão por coluna. Noção conhecida em análise de dados como dados "tidy"; conversível nos dois sentidos (`melt`/`pivot` em pandas, `PIVOT`/`UNPIVOT` em SQL Server).

> **Boa prática:** armazenar em formato longo assim que o número ou a natureza das medidas variar de uma observação para outra (evita colunas sempre `NULL`); pivotar para o formato largo apenas no momento da apresentação final (tabela, exportação), não no armazenamento.

## O compromisso: desnormalização proposital

Um banco OLTP evita repetir a mesma informação em várias linhas (a **normalização**): cada fato é escrito uma única vez, para evitar inconsistências caso precise ser corrigido. Uma dimensão faz a escolha inversa: ela **desnormaliza** propositalmente, repetindo por exemplo a categoria do produto em cada linha de `dim_produto` em vez de armazená-la em uma tabela `dim_categoria` separada.

| | Normalizado (OLTP) | Desnormalizado (dimensão) |
|---|---|---|
| Duplicação | Mínima | Aceita |
| Escrita | Rápida, sem inconsistência possível | Mais lenta de corrigir (várias linhas a atualizar) |
| Leitura | Exige vários `JOIN` | Um único `JOIN` basta |

> **Armadilha:** julgar a dimensão desnormalizada como "mal projetada" com reflexos de OLTP (busca por duplicação). A duplicação aqui é uma escolha assumida: o data warehouse é reescrito em lote (uma vez por noite, por exemplo), não linha por linha como uma aplicação, então a inconsistência que a normalização evita não tem o mesmo custo.
>
> **Boa prática:** julgar uma tabela conforme o uso que ela atende (escrita unitária frequente vs. leitura massiva), não segundo uma regra universal de projeto.

## Chave substituta em vez de chave natural

Uma **chave natural** é um identificador que já existe no mundo real (uma referência de produto, um número de identificação nacional). Uma **chave substituta** (*surrogate key*) é um inteiro gerado apenas para servir de chave, sem nenhum sentido fora do banco (o `id_produto` dos exemplos acima).

> **Armadilha:** usar uma chave natural como chave de dimensão. Se o sistema de origem um dia mudar essa referência (renumeração de um catálogo de produtos, fusão de dois identificadores de clientes), todas as linhas de fatos que apontam para ela ficam órfãs.
>
> **Boa prática:** gerar uma chave substituta própria do data warehouse para cada dimensão, e manter a chave natural apenas como coluna descritiva entre outras. Ela permanece estável mesmo se o sistema de origem mudar seus próprios identificadores.

## Variante a conhecer: o modelo em floco de neve

O **modelo em floco de neve** (*snowflake schema*) leva a normalização um passo além, dentro das próprias dimensões: `dim_produto` referencia uma tabela `dim_categoria` separada em vez de repetir a categoria em cada linha.

| | Estrela | Floco de neve |
|---|---|---|
| Dimensões | Desnormalizadas (uma única tabela por eixo) | Normalizadas (dimensão dividida em subtabelas) |
| Espaço em disco | Mais duplicação | Menos duplicação |
| Consulta | Um único `JOIN` por dimensão | Um `JOIN` a mais por subdimensão |

> **Boa prática:** partir do modelo em estrela por padrão (mais simples de consultar); só migrar para floco de neve se o espaço em disco ou a manutenção de uma dimensão muito grande justificar isso concretamente, não por princípio de normalização.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O modelo em estrela organiza um data warehouse em torno de uma tabela de fatos (as medidas) ligada a tabelas de dimensão (os eixos de análise), ao contrário de um banco OLTP normalizado. Vários fluxos do mesmo grão podem alimentar uma única tabela de fatos via `UNION` e uma coluna discriminante. As medidas se armazenam em formato longo (uma linha por medida) ou largo (uma coluna por medida), permanecendo o longo compacto quando o número de medidas varia. |
| **Ferramentas utilizáveis** | `JOIN` e `GROUP BY` em SQL para consultar uma tabela de fatos segundo uma ou várias dimensões; `UNION ALL` + coluna discriminante para unificar vários fluxos; `melt`/`pivot` (pandas) ou `PIVOT`/`UNPIVOT` (SQL Server) para converter entre formato longo e largo. |
| **Armadilhas a evitar** | Julgar uma dimensão desnormalizada com reflexos de banco OLTP; usar uma chave natural (sujeita a mudar) como chave de dimensão; unificar via `UNION` dois fluxos que não compartilham o mesmo grão. |
| **Boas práticas** | Gerar uma chave substituta própria do data warehouse para cada dimensão; manter o modelo em estrela por padrão, só migrar para floco de neve se uma necessidade concreta justificar; armazenar em formato longo assim que as medidas variarem de uma observação para outra, pivotar para largo apenas na apresentação. |
