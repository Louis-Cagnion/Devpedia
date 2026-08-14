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
| **Para lembrar** | O modelo em estrela organiza um data warehouse em torno de uma tabela de fatos (as medidas) ligada a tabelas de dimensão (os eixos de análise), ao contrário de um banco OLTP normalizado. |
| **Ferramentas utilizáveis** | `JOIN` e `GROUP BY` em SQL para consultar uma tabela de fatos segundo uma ou várias dimensões. |
| **Armadilhas a evitar** | Julgar uma dimensão desnormalizada com reflexos de banco OLTP; usar uma chave natural (sujeita a mudar) como chave de dimensão. |
| **Boas práticas** | Gerar uma chave substituta própria do data warehouse para cada dimensão; manter o modelo em estrela por padrão, só migrar para floco de neve se uma necessidade concreta justificar. |
