---
order: 2
---

# SQL

SQL (*Structured Query Language*) é uma linguagem com um único propósito: consultar e manipular dados armazenados na forma de tabelas. Como [a regex](/?c=domain-specific-languages-dsl&p=regex), não é uma linguagem de programação generalista: não tem laços, nem funções definidas pelo usuário, nem variáveis no sentido clássico. Ela é interpretada por um motor de banco de dados ([MySQL](https://dev.mysql.com/doc/), [PostgreSQL](https://www.postgresql.org/docs/), [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), [SQLite](https://sqlite.org/docs.html)...), geralmente controlada a partir de uma linguagem hospedeira ([PHP](/?c=langages&s=php&p=php), [Python](/?c=langages&s=python&p=python), [JS](/?c=langages&s=javascript&p=javascript)...) via um conector.

## DDL e DML: duas famílias de comandos

Os comandos SQL se dividem em duas famílias, conforme afetem a estrutura das tabelas ou os dados dentro delas:

| Família | Nome completo | Papel | Comandos |
|---|---|---|---|
| DDL | *Data Definition Language* | Criar/modificar/apagar a estrutura de uma tabela | `CREATE`, `ALTER`, `DROP` |
| DML | *Data Manipulation Language* | Ler/adicionar/modificar/apagar dados | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |

Os exemplos `SELECT` abaixo são, portanto, DML: eles leem dados de uma tabela já criada. O DDL (criar essa tabela) é abordado mais adiante.

## Uma tabela, como uma planilha

Uma tabela relacional se parece com uma planilha: colunas fixas, nomeadas antecipadamente (`id`, `nome`, `cidade`...), e cada linha representa um registro completo que preenche todas essas colunas.

```sql
SELECT id, nome FROM clientes WHERE cidade = 'Lyon';
```

"Colunas `id`/`nome`, da tabela `clientes`, apenas as linhas onde `cidade = 'Lyon'`." `SELECT *` seleciona todas as colunas.

## Linhas e colunas: as duas direções de uma tabela

Quando se está começando, mistura-se muito estas duas palavras. Uma **coluna** é vertical: é um tipo de informação, o mesmo para todos os registros (o título, o preço). Uma **linha** é horizontal: é um registro completo (um livro, com o seu título, o seu preço, a sua data). Os exemplos a seguir leem uma tabela `livros` de sete linhas e cinco colunas:

| id | titulo | genero | preco | publicado_em |
|---|---|---|---|---|
| 1 | As Noites de Névoa | romance | 12.50 | 2024-03-15 |
| 2 | Cozinha em família | culinária | 24.00 | 2023-11-02 |
| 3 | Atlas dos mares | ciência | 39.90 | 2022-06-30 |
| 4 | O Último Farol | romance | 9.90 | 2025-01-20 |
| 5 | Massas e molhos | culinária | 18.00 | 2024-09-05 |
| 6 | Viagem ao centro da Terra | romance | 15.00 | 2021-05-12 |
| 7 | Estrelas próximas | ciência | 22.00 | 2025-04-01 |

```
              colunas (verticais): escolhidas depois de SELECT
              id    titulo              genero    preco
                 \     |                     |      /
   linha 1  ->   1  As Noites de Névoa   romance   12.50
   linha 2  ->   2  Cozinha em família   culinária 24.00
   linha 3  ->   3  Atlas dos mares      ciência   39.90

   linhas (horizontais): retiradas com WHERE e TOP
```

Cada direção se regula, portanto, em um lugar diferente da **consulta** (o pedido escrito em SQL, detalhado [mais abaixo](#ler-uma-consulta-passo-a-passo-select-from-where)):

| Quero... | Ajusto... | Exemplo |
|---|---|---|
| Manter só certas colunas | a lista depois de `SELECT` | `SELECT titulo, preco` |
| Manter só certas linhas | `WHERE` | `WHERE genero = 'romance'` |
| Manter só as `n` primeiras linhas | `TOP n` (T-SQL, a variante do SQL própria do SQL Server) | `SELECT TOP 3 titulo` |
| Mudar a ordem das linhas | `ORDER BY` | `ORDER BY preco DESC` |

Confundir os dois é o erro mais comum: `WHERE` nunca faz uma coluna desaparecer, e a lista depois de `SELECT` nunca faz uma linha desaparecer.

### `SELECT *`: todas as colunas de uma vez

O asterisco `*` substitui a lista de colunas por "todas, na ordem em que a tabela as declara". Útil para uma primeira olhada em uma tabela desconhecida:

```sql
SELECT * FROM livros WHERE id = 2;  -- todas as colunas da linha cujo id vale 2
```

```
id  titulo              genero     preco  publicado_em
--  ------------------  ---------  -----  ------------
2   Cozinha em família  culinária  24     2023-11-02
```

| Risco do `SELECT *` fora de um teste | Por quê |
|---|---|
| Dados desnecessários transferidos | O **servidor** (o programa do motor de banco de dados, que guarda os dados e responde às consultas) lê e envia colunas de que não precisamos, às vezes volumosas |
| Dados sensíveis expostos | Uma coluna acrescentada depois (uma senha, um número) sai sem que ninguém tenha decidido |
| Código frágil | Um programa que lê o resultado "pela posição" quebra se uma coluna for acrescentada ou mudar de lugar |
| Tabela enorme | Sem `WHERE` nem `TOP`, traz-se a tabela inteira |

> **Boa prática:** `SELECT *` para explorar, a lista explícita de colunas (`SELECT titulo, preco`) em tudo o que for gravado ou executado de novo mais tarde.

## Ler uma consulta passo a passo: `SELECT`, `FROM`, `WHERE`

Uma **consulta** é um pedido escrito em SQL e enviado ao **servidor**: o programa do motor de banco de dados, que guarda os dados e responde. Ela se compõe de **cláusulas**: cada uma começa com uma palavra-chave (`SELECT`, `FROM`, `WHERE`...) e responde a uma pergunta.

```sql
SELECT titulo, preco     -- 1. quais colunas mostrar
FROM livros              -- 2. em qual tabela ler
WHERE genero = 'romance';  -- 3. quais linhas manter
```

| Cláusula | Pergunta a que responde | Aqui |
|---|---|---|
| `SELECT` | Quais colunas você quer ver? | `titulo` e `preco` |
| `FROM` | Em qual tabela você lê? | `livros` |
| `WHERE` | Quais linhas mantemos? | as que têm `genero` igual a `'romance'` |

```
titulo                     preco
-------------------------  -----
As Noites de Névoa         12.5
O Último Farol             9.9
Viagem ao centro da Terra  15
```

(Estes resultados foram obtidos com SQLite; a exibição das casas decimais, `12.5` ou `12.50`, varia de um motor para outro.)

### `FROM` e o nome completo `esquema.tabela`

Em um servidor de verdade, uma tabela pertence a um **esquema** (um espaço de nomes que organiza as tabelas, explicado em [Esquemas e tabelas técnicas](/?c=bases-de-donnees&p=schemas-et-tables-techniques)). O nome completo se escreve `esquema.tabela`, e no SQL Server o esquema padrão se chama `dbo`:

```sql
SELECT titulo FROM dbo.livros;  -- nome completo: esquema dbo, tabela livros
```

Escrever apenas `livros` funciona quando o motor sabe em qual esquema procurar; o nome completo evita a ambiguidade se dois esquemas tiverem uma tabela de mesmo nome. Para ler outro banco do mesmo servidor, acrescenta-se um terceiro segmento, visto em [a consulta entre bancos](#consulta-entre-bancos-de-dados-na-mesma-instancia).

### `WHERE`: o servidor testa cada linha

`WHERE` contém uma **condição**: uma afirmação que é verdadeira ou falsa para uma linha dada. O servidor a testa linha por linha: se for verdadeira, a linha fica; se for falsa, ela desaparece do resultado. As comparações possíveis:

| Operador | Sentido | Exemplo |
|---|---|---|
| `=` | igual a (um único sinal `=`, não dois) | `genero = 'romance'` |
| `<>` | diferente de (`!=` também aceito pela maioria dos motores) | `genero <> 'romance'` |
| `<` / `>` | estritamente menor / maior | `preco < 20` |
| `<=` / `>=` | menor ou igual / maior ou igual | `preco >= 20` |

Texto e datas se escrevem entre apóstrofos, os números como estão: a regra completa está em [Tipos de coluna e valores coerentes](#tipos-de-coluna-e-valores-coerentes).

### `AND` e `OR`: combinar várias condições

| Palavra-chave | A linha é mantida se... |
|---|---|
| `AND` | as duas condições forem verdadeiras ao mesmo tempo |
| `OR` | pelo menos uma das duas for verdadeira |

Veja o que o servidor faz para `WHERE genero = 'romance' AND preco < 12`, linha por linha:

| id | genero | preco | `genero = 'romance'` | `preco < 12` | Linha mantida? |
|---|---|---|---|---|---|
| 1 | romance | 12.50 | verdadeiro | falso | não |
| 2 | culinária | 24.00 | falso | falso | não |
| 3 | ciência | 39.90 | falso | falso | não |
| 4 | romance | 9.90 | verdadeiro | verdadeiro | **sim** |
| 5 | culinária | 18.00 | falso | falso | não |
| 6 | romance | 15.00 | verdadeiro | falso | não |
| 7 | ciência | 22.00 | falso | falso | não |

> **Armadilha:** `AND` passa antes de `OR`, como a multiplicação antes da adição. `WHERE genero = 'culinária' OR genero = 'romance' AND preco < 10` se lê "culinária, ou (romance e menos de 10)": todos os livros de culinária aparecem, mesmo a 24.00.
>
> **Boa prática:** assim que um `OR` aparece junto de um `AND`, use parênteses para que a leitura não dependa da regra de precedência.

```sql
-- sem parênteses: culinária (todos os preços) OU (romance abaixo de 10)
SELECT titulo, genero, preco FROM livros
WHERE genero = 'culinária' OR genero = 'romance' AND preco < 10;

-- com parênteses: (culinária OU romance) E abaixo de 10
SELECT titulo, genero, preco FROM livros
WHERE (genero = 'culinária' OR genero = 'romance') AND preco < 10;
```

```
titulo              genero     preco       titulo          genero   preco
------------------  ---------  -----       --------------  -------  -----
Cozinha em família  culinária  24          O Último Farol  romance  9.9
O Último Farol      romance    9.9
Massas e molhos     culinária  18
   (sem parênteses: 3 linhas)       (com parênteses: 1 linha)
```

## `ORDER BY`: ordenar o resultado

Uma tabela **não garante nenhuma ordem**: o servidor devolve as linhas na ordem que lhe convém (a do armazenamento, a de um [índice](/?c=bases-de-donnees&p=les-index), a de outro caminho de leitura), e essa ordem pode mudar de uma execução para outra. `ORDER BY` fixa a ordem, e fica depois de `WHERE`:

```sql
SELECT titulo, preco
FROM livros
WHERE publicado_em >= '2023-01-01'  -- primeiro, tirar as linhas antigas demais
ORDER BY preco DESC;                -- depois, ordenar o resto do mais caro ao mais barato
```

| Escrita | Efeito |
|---|---|
| `ORDER BY preco` | crescente (do menor ao maior); `ASC` é o valor padrão |
| `ORDER BY preco DESC` | decrescente (`DESC` de *descending*) |
| `ORDER BY genero, preco DESC` | primeiro por `genero`, e, para um mesmo gênero, por `preco` decrescente |

Resultado de `ORDER BY genero, preco DESC` sobre a tabela inteira:

```
titulo                     genero     preco
-------------------------  ---------  -----
Atlas dos mares            ciência    39.9
Estrelas próximas          ciência    22
Cozinha em família         culinária  24
Massas e molhos            culinária  18
Viagem ao centro da Terra  romance    15
As Noites de Névoa         romance    12.5
O Último Farol             romance    9.9
```

`WHERE` e `ORDER BY` não fazem o mesmo trabalho:

| | `WHERE` | `ORDER BY` |
|---|---|---|
| Papel | retira linhas | organiza as linhas |
| Número de linhas depois | diminui (ou fica igual) | idêntico |
| Posição na consulta | depois de `FROM` | no fim da consulta |

> **Armadilha:** achar que inserir as linhas na ordem desejada basta. O resultado de uma consulta sem `ORDER BY` não é garantido, mesmo que um dia ele saia na ordem de inserção: um índice acrescentado depois ou outra forma de ler a tabela basta para mudá-lo.
>
> **Boa prática:** todo resultado cuja ordem importa leva um `ORDER BY`, com uma segunda coluna se a primeira puder conter repetidos (dois livros com o mesmo preço sairiam, do contrário, em uma ordem indefinida entre eles).

Dois limites a conhecer:

- **O custo.** Ordenar uma tabela grande dá trabalho ao servidor; um [índice](/?c=bases-de-donnees&p=les-index) sobre a coluna de ordenação pode lhe entregar as linhas já organizadas.
- **Quando evitar.** Contar linhas (`COUNT(*)`, ver [As funções de agregação](#as-funcoes-de-agregacao)) ou testar se existe pelo menos uma não precisa de ordem nenhuma: ordená-las seria trabalho perdido.

## `TOP n` (T-SQL): limitar o número de linhas, e sua armadilha

Em T-SQL, a linguagem do [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), `TOP n` mantém as `n` primeiras linhas do resultado. Ele se escreve logo depois de `SELECT`. MySQL, PostgreSQL e SQLite têm o equivalente `LIMIT n`, escrito no fim da consulta. Detalhes de `TOP`: [documentação oficial](https://learn.microsoft.com/en-us/sql/t-sql/queries/top-transact-sql).

```sql
-- T-SQL: os 3 livros mais caros
SELECT TOP 3 titulo, preco
FROM livros
ORDER BY preco DESC;  -- sem esse ORDER BY, TOP 3 devolveria 3 linhas quaisquer

-- equivalente MySQL / PostgreSQL / SQLite
SELECT titulo, preco FROM livros ORDER BY preco DESC LIMIT 3;
```

```
titulo              preco
------------------  -----
Atlas dos mares     39.9
Cozinha em família  24
Estrelas próximas   22
```

(Saída obtida com a forma `LIMIT 3` sob SQLite.)

A armadilha se resume em dois pontos:

| Armadilha | O que acontece | Como evitar |
|---|---|---|
| `TOP` sem `ORDER BY` | `TOP` limita sem ordem precisa: o servidor devolve `n` linhas quaisquer, não "as primeiras" nem "as melhores" | combiná-lo sempre com `ORDER BY` |
| A mensagem "n linhas afetadas" | ela anuncia o número de linhas **devolvidas**, não o de linhas que correspondem à condição | executar um `COUNT(*)` com o mesmo `WHERE` |

```sql
-- AS qtd dá o nome qtd à coluna calculada (ver as funções de agregação)
SELECT COUNT(*) AS qtd FROM livros WHERE genero = 'romance';  -- quantos romances no total
```

```
qtd
---
3
```

Com `TOP 2` (ou `LIMIT 2`) sobre esses romances, o servidor mostra "2 linhas" embora haja 3: sem o `COUNT(*)`, tomaríamos 2 pelo total. Mesmo com `ORDER BY`, se a coluna de ordenação tiver repetidos na fronteira (por exemplo dois livros a 15.00 disputando o 2º lugar com `TOP 2`), a linha retida entre os dois é arbitrária: acrescente uma segunda coluna de ordenação.

## O ponto e vírgula: o fim de uma instrução

Uma **instrução** é um comando SQL completo. O ponto e vírgula `;` a termina: ele nunca separa duas cláusulas de uma mesma consulta.

```sql
SELECT titulo FROM livros WHERE genero = 'romance';  -- uma única instrução, um único ;
SELECT COUNT(*) FROM livros;                         -- uma segunda instrução, em seguida
```

> **Armadilha:** um `;` mal colocado corta a consulta em duas. `SELECT titulo FROM livros; WHERE genero = 'romance';` executa primeiro `SELECT titulo FROM livros;` **sem filtro** (todos os livros aparecem), depois falha em `WHERE ...`, que não forma uma instrução.

| Escrita | O que o motor faz (SQLite) |
|---|---|
| `SELECT titulo FROM livros;` | mostra os títulos de todos os livros |
| ` WHERE genero = 'romance';` (sozinha) | erro `near "WHERE": syntax error` |
| ` FROM livros;` (sozinha) | erro `near "FROM": syntax error` (a mensagem exata muda conforme o motor) |

No SQL Server, o `;` final é facultativo para a maioria das instruções, mas algumas o exigem (`MERGE`, visto [mais abaixo](#merge-um-upsert-em-uma-unica-consulta-sql-server)): colocá-lo em todo lugar é a regra mais segura.

## Tipos de coluna e valores coerentes

Cada coluna tem um **tipo**: o tipo de valor que ela aceita (citado mais abaixo em [`CREATE TABLE`](#create-table-criar-uma-tabela-ddl)). Um valor escrito em uma consulta deve corresponder a esse tipo, e a sua escrita depende dele.

### Escrever um valor: número, texto, data

| Tipo de valor | Escrita | Exemplo |
|---|---|---|
| Número | como está, com o ponto para as casas decimais | `24`, `12.5` |
| Texto | entre apóstrofos `'...'` | `'romance'` |
| Data | texto entre apóstrofos, no formato `'AAAA-MM-DD'` | `'2024-03-15'` |
| Valor ausente | a palavra `NULL`, sem apóstrofos (ver [`NULL`](#null-um-dado-ausente-nao-um-valor-como-os-outros)) | `NULL` |

Um texto que contém um apóstrofo o duplica: `'L''Isle'` designa o texto `L'Isle`. Os apóstrofos são obrigatórios: sem eles, o motor lê `romance` como o nome de uma coluna.

```sql
SELECT titulo FROM livros WHERE genero = romance;  -- esquecimento dos apóstrofos
```

```
Error: no such column: romance
```

> **Armadilha:** comparar uma coluna de datas com um número. `WHERE publicado_em = 2024` mistura dois tipos: o SQL Server se comporta conforme o tipo da coluna: uma coluna `date` recusa com o erro "Operand type clash" (tipos incompatíveis), enquanto uma coluna `datetime` aceita `2024` como um número de dias desde 1º de janeiro de 1900, sem erro; o SQLite, mais permissivo, não diz nada e devolve zero linhas, o que é pior (nenhum erro para ler).
>
> **Boa prática:** escrever cada valor no tipo de sua coluna, e procurar um ano com um intervalo de datas (`publicado_em >= '2024-01-01' AND publicado_em < '2025-01-01'`).

### Converter um valor: `CAST`

Quando o valor não tem o tipo certo, convertemo-lo (transformamo-lo em um valor de outro tipo). `CAST(valor AS tipo)` é a forma padrão, compreendida por todos os motores; o T-SQL acrescenta `CONVERT(tipo, valor)`.

```sql
-- INT: número inteiro (ver "Números" mais abaixo)
SELECT CAST('42' AS INT) + 1 AS resultado;  -- o texto '42' vira o número 42
```

```
resultado
---------
43
```

> **Armadilha:** uma conversão impossível (`CAST('abc' AS INT)`) não se comporta igual em todo lugar. O SQLite devolve `0` sem dizer nada, o que fabrica um dado falso; o SQL Server para com um erro de conversão.
>
> **Boa prática:** converter explicitamente, e preferir o erro ao silêncio: um erro se corrige, um `0` inventado vai parar nos totais.

### Números: `INT`, `numeric` e `decimal`

| Tipo | Conteúdo | Exato? |
|---|---|---|
| `INT` | número inteiro (`12`, `-3`) | sim |
| `decimal(p, s)` ou `numeric(p, s)` | número com vírgula decimal: `p` algarismos no total, dos quais `s` depois da vírgula | sim |
| `float` | número com vírgula "aproximado" | não |

No SQL Server, `numeric` e `decimal` são dois nomes para o mesmo tipo. `decimal(8, 2)` aceita até 999999.99 e mantém sempre duas casas decimais (`12.5` é armazenado como `12.50`).

O mesmo cálculo dá dois resultados conforme o motor. No **SQLite**, `0.1` e `0.2` são lidos como `float`, e uma comparação pode ser escrita diretamente na lista `SELECT`:

```sql
-- SQLite
SELECT 0.1 + 0.2 AS soma, 0.1 + 0.2 = 0.3 AS igual;  -- 1 = verdadeiro, 0 = falso
```

```
soma                 igual
-------------------  -----
0.30000000000000004  0
```

No **SQL Server**, esse mesmo `SELECT` não funciona: uma comparação não pode ser escrita na lista `SELECT`, e os literais `0.1` e `0.2` são lidos ali como `numeric` exatos, então `0.1 + 0.2 = 0.3` seria verdadeiro. Para observar o defeito do `float`, é preciso declarar variáveis `float` ([`DECLARE @a`](#variavel-de-tabela-praticar-sem-criar-nada-de-duradouro-t-sql) cria uma variável) e testar com `CASE WHEN condição THEN a ELSE b END` (devolve `a` se a condição for verdadeira, `b` caso contrário):

```sql
-- SQL Server
DECLARE @a FLOAT = 0.1, @b FLOAT = 0.2;  -- duas variáveis do tipo float
SELECT @a + @b AS soma,
       CASE WHEN @a + @b = 0.3 THEN 1 ELSE 0 END AS igual;  -- 1 = verdadeiro, 0 = falso
```

```
soma   igual
-----  -----
0.3    0
```

(Saída do SQL Server escrita à mão, não executada aqui: `igual` vale bem `0`, mas a ferramenta costuma mostrar `soma` arredondada em `0.3`, embora a diferença exista.)

Um `float` é armazenado em **binário** (o sistema de dois algarismos, 0 e 1, que o computador usa; ver [números de ponto flutuante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)), e `0.1` não tem uma escrita exata em binário (como um terço não tem em decimal): o motor guarda um valor muito próximo. A diferença é minúscula (da ordem de 0.00000000000000005), mas basta para tornar a igualdade falsa.

> **Armadilha:** guardar um preço em uma coluna aproximada, e depois fazer uma soma ou uma igualdade com ele.
>
> **Boa prática:** `decimal(p, s)` para tudo o que se conta até o centavo (preços, descontos), `float` somente para medidas em que o arredondamento é aceitável.

### Texto: `varchar(n)` contra `char(n)`

| Tipo | Comprimento armazenado | Exemplo com `'FR'` |
|---|---|---|
| `varchar(n)` | o do texto, até `n` caracteres | `FR` (2 caracteres) |
| `char(n)` | sempre `n`: completado com espaços à direita | `FR` seguido de 3 espaços se `n` valer 5 |

`char(n)` serve para códigos cujo comprimento nunca varia (um código de país com 2 letras); `varchar(n)` para nomes, títulos, endereços. Um texto mais longo que `n` é recusado (o SQL Server sinaliza um erro de truncamento: o texto seria cortado) ou cortado conforme o motor.

### Datas: `date` contra `datetime`

| Tipo | Conteúdo | Exemplo |
|---|---|---|
| `date` | só o dia | `'2026-10-31'` |
| `datetime` | o dia e a hora | `'2026-10-31 14:45:00'` |

Duas armadilhas, uma por tipo:

- **O formato.** `'AAAA-MM-DD'` é lido sem ambiguidade por uma coluna `date`. Para um `datetime`, o SQL Server pode, conforme o idioma da **conexão** (a sessão aberta entre o programa que envia as consultas e o servidor; ajuste `SET DATEFORMAT`, ver a [documentação](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-dateformat-transact-sql)), ler `'2026-10-11'` como 10 de novembro em vez de 11 de outubro; as formas `'AAAAMMDD'` (`'20261011'`) e `'AAAA-MM-DDThh:mm:ss'` são, por sua vez, independentes do idioma.
- **A hora escondida.** Comparar um `datetime` com um dia isolado equivale a compará-lo com a meia-noite: as linhas da tarde são perdidas. Filtra-se então por intervalo, da meia-noite inclusive até a meia-noite seguinte exclusive.

```sql
-- pedidos(id, realizado_em): id 1 às 09:30, id 2 às 14:45 de 31/10, id 3 em 01/11
SELECT id FROM pedidos WHERE realizado_em = '2026-10-31';  -- igual à meia-noite em ponto

SELECT id FROM pedidos
WHERE realizado_em >= '2026-10-31'  -- meia-noite do dia 31, inclusive
  AND realizado_em <  '2026-11-01'; -- meia-noite de 1º de novembro, exclusive
```

```
(primeira consulta)  nenhuma linha
(segunda consulta)   id = 1 e id = 2
```

(Teste feito com SQLite, que guarda as datas em uma coluna de texto: o raciocínio é o mesmo que para um `datetime` do SQL Server.)

### Chave primária

Uma **chave primária** é a coluna (ou o grupo de colunas) que identifica cada linha de forma única: duas linhas nunca têm o mesmo valor, e ela nunca é `NULL`. Uma tabela tem apenas uma. Aqui, `id`: procurar `WHERE id = 2` devolve no máximo uma linha. Ela se declara com `PRIMARY KEY` (ver [`CREATE TABLE`](#create-table-criar-uma-tabela-ddl)).

| Sem chave primária | Com chave primária |
|---|---|
| Dois livros idênticos são indistinguíveis | Cada linha tem seu identificador |
| Alterar "este" livro pode alterar dois | `WHERE id = 2` só toca em um |
| Outra tabela não consegue apontar para uma linha precisa | Uma [`FOREIGN KEY`](#create-table-criar-uma-tabela-ddl) aponta para ela |

A lista completa dos tipos do SQL Server está na sua [documentação oficial](https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql).

## As funções de agregação

Elas resumem várias linhas em um único valor:

| Função | Papel |
|---|---|
| `COUNT(*)` | Número de linhas |
| `SUM(coluna)` | Soma de uma coluna numérica |
| `AVG(coluna)` | Média de uma coluna numérica |
| `MAX(coluna)` / `MIN(coluna)` | Valor máximo / mínimo |

```sql
SELECT COUNT(*) AS nb_clientes FROM clientes WHERE cidade = 'Lyon';
```

`AS nome` dá um alias a uma coluna do resultado (aqui, a coluna calculada se chamará `nb_clientes`).

Combinada com `GROUP BY`, uma função de agregação calcula um valor por grupo em vez de um único valor global:

```sql
SELECT cidade, COUNT(*) AS nb_clientes
FROM clientes
GROUP BY cidade;  -- uma linha de resultado por cidade distinta
```

### Em que ordem o servidor processa uma consulta de agregação

Uma consulta se escreve em uma ordem (`SELECT` primeiro), mas o servidor a processa em outra. Para uma consulta que calcula por grupo, a ordem de processamento é esta:

```sql
SELECT genero, COUNT(*) AS qtd, AVG(preco) AS preco_medio
FROM livros
WHERE publicado_em >= '2023-01-01'  -- 1. retirar os livros mais antigos
GROUP BY genero                     -- 2. formar um grupo por gênero
                                    -- 3. (COUNT e AVG: um cálculo dentro de cada grupo)
ORDER BY qtd DESC, genero;          -- 4. ordenar o resultado final (genero desempata)
```

```
tabela livros: 7 linhas
      |  WHERE publicado_em >= '2023-01-01'    mantém 5 linhas
      v
5 linhas
      |  GROUP BY genero                       forma 3 grupos
      v
romance (2 linhas)   culinária (2 linhas)   ciência (1 linha)
      |  COUNT(*), AVG(preco)                 um cálculo por grupo
      v
3 linhas de resultado (uma por grupo)
      |  ORDER BY qtd DESC                    ordenação por último
      v
resultado final
```

```
genero     qtd  preco_medio
---------  ---  -----------
culinária  2    21.0
romance    2    11.2
ciência    1    22.0
```

| Etapa | Cláusula | O que acontece |
|---|---|---|
| 1 | `WHERE` | filtra as linhas **antes** de qualquer cálculo |
| 2 | `GROUP BY` | organiza as linhas restantes em grupos (um valor de `genero` = um grupo) |
| 3 | `COUNT`, `AVG`... | se aplicam **dentro de cada grupo**, não sobre a tabela inteira |
| 4 | `ORDER BY` | ordena por último: o total `qtd` só existe depois do cálculo, daí a possibilidade de ordenar pelo nome dele |

Algumas consequências:

- **Um cálculo incide sobre as linhas mantidas pelo `WHERE`**, não sobre a tabela inteira. Achar o contrário é um erro frequente: aqui `COUNT(*)` conta só os 5 livros recentes, não os 7.
- **Sem `GROUP BY`, uma função de cálculo sozinha devolve uma única linha** (um grupo único: todas as linhas mantidas). `SELECT COUNT(*) FROM livros WHERE genero = 'romance'` devolve `3`.
- **Em `COUNT(*)`, o asterisco não escolhe nenhuma coluna**: ele quer dizer "conte as linhas".
- **`GROUP BY` não ordena.** O resultado acima é ordenado pelo `ORDER BY qtd DESC, genero` da consulta (o segundo critério desempata `culinária` e `romance`, ambos com `qtd = 2`); sem `ORDER BY`, a ordem dos grupos não é garantida (eles podem sair em ordem alfabética por acaso de implementação, mas nada garante isso). Prova de que `GROUP BY` não é uma ordenação: `GROUP BY genero DESC` é recusado pelo SQL Server e pelo SQLite (erro de sintaxe), pois `DESC` só faz sentido em `ORDER BY`.
- **Conforme o motor, a média pode aparecer com mais casas decimais** do que a coluna contém (por exemplo `21.000000` para preços com duas casas decimais).

> **Armadilha:** valores digitados de forma diferente formam grupos separados. Um `GROUP BY cidade` sobre `Lyon`, `Lyon`, `Lyonn` produz dois grupos: `Lyon` (2) e `Lyonn` (1). O servidor não adivinha que se trata da mesma cidade.
>
> **Boa prática:** olhar os valores distintos de uma coluna (`SELECT DISTINCT cidade FROM clientes`: `DISTINCT` retira os repetidos) antes de agrupar por ela, e normalizar a digitação na escrita.

### `GROUPING SETS`: total e detalhe em uma única consulta (T-SQL)

Obter ao mesmo tempo o total global e o detalhe por cidade normalmente exigiria duas consultas separadas (uma com `GROUP BY`, outra sem), ou um [`UNION`](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/set-operators-union-transact-sql) (que empilha as linhas de duas consultas) das duas. `GROUPING SETS` (SQL Server, entre outros) calcula ambos na mesma passada pela tabela:

```sql
SELECT cidade, COUNT(*) AS nb_clientes
FROM clientes
GROUP BY GROUPING SETS ((cidade), ());
-- (cidade) : uma linha por cidade distinta, como um GROUP BY clássico
-- ()       : uma linha de total global, cidade exibida como NULL
```

| Conjunto pedido | Resultado |
|---|---|
| `(cidade)` | Uma linha por cidade distinta, igual a `GROUP BY cidade` sozinho |
| `()` (conjunto vazio) | Uma única linha: o total sobre toda a tabela, `cidade` vale `NULL` |

> **Armadilha:** na linha de total, `cidade` vale `NULL`, mas esse `NULL` significa "isto é um total agregado", não "valor desconhecido" como o `NULL` visto mais abaixo ([`NULL`: um dado ausente](#null-um-dado-ausente-nao-um-valor-como-os-outros)). Filtrar ingenuamente `WHERE cidade IS NOT NULL` removeria a linha de total por engano.
>
> **Boa prática:** usar `GROUPING(cidade)` para distinguir os dois sem ambiguidade: vale `1` na linha de total (a coluna é `NULL` porque está agregada), `0` caso contrário (mesmo se o valor real de `cidade` fosse ele próprio `NULL`).

```sql
SELECT
    cidade,
    COUNT(*) AS nb_clientes,
    GROUPING(cidade) AS eh_total  -- 1 = linha de total, 0 = linha de detalhe
FROM clientes
GROUP BY GROUPING SETS ((cidade), ());
```

Aparentada com `ROLLUP` (hierarquia de totais aninhados, ex. dia → mês → ano) e `CUBE` (todos os cruzamentos possíveis entre várias colunas), `GROUPING SETS` é a forma mais explícita das três: cada combinação de colunas desejada é escrita à mão entre parênteses.

## `JOIN`: combinar duas tabelas por uma coluna comum

Equivalente declarativo de emparelhar duas coleções por uma chave compartilhada, em vez de escrever um laço com uma busca manual:

```sql
SELECT c.nome, v.data_compra
FROM clientes c
-- INNER JOIN: as linhas sem correspondência desaparecem
JOIN vendas v ON v.cliente_id = c.id;
```

```sql
SELECT c.nome, v.data_compra
FROM clientes c
-- mantém TODAS as linhas da esquerda, NULL se não houver correspondência
LEFT JOIN vendas v ON v.cliente_id = c.id;
```

- `c`/`v` são aliases de tabela, indispensáveis assim que duas tabelas compartilham um nome de coluna (`c.nome` vs uma eventual `v.nome`, sem ambiguidade).
- `JOIN` (ou `INNER JOIN`): mantém apenas as linhas que correspondem dos dois lados.
- `LEFT JOIN`: mantém todas as linhas da tabela da esquerda, colunas da direita com `NULL` se não houver correspondência: útil quando se quer listar *todo mundo*, correspondência encontrada ou não (ex: todos os clientes, tenham comprado ou não).

> **Armadilha:** usar `JOIN` (INNER) quando na verdade se quer *todo mundo*: um cliente sem nenhuma venda desapareceria silenciosamente do resultado, enquanto um `LEFT JOIN` o teria mantido com colunas em `NULL`.
>
> **Boa prática:** perguntar-se explicitamente, antes de escrever a junção, se as linhas sem correspondência devem desaparecer (`JOIN`) ou permanecer visíveis (`LEFT JOIN`); ambas produzem um resultado sintaticamente válido, mas semanticamente diferente.

### `OUTER APPLY` / `CROSS APPLY`: uma junção que pode chamar uma função por linha (T-SQL)

A condição `ON` de um `JOIN` clássico só pode referenciar colunas, nunca chamar uma função ou uma subconsulta parametrizada pela linha atual. `APPLY` (SQL Server) remove essa limitação: ele executa uma subconsulta **para cada linha** da tabela da esquerda, passando as colunas dessa linha como parâmetro.

```sql
SELECT c.nome, ultima.data_compra
FROM clientes c
OUTER APPLY (
    SELECT TOP 1 v.data_compra
    FROM vendas v
    -- referência c, a linha atual: impossível em um ON de JOIN
    WHERE v.cliente_id = c.id
    ORDER BY v.data_compra DESC
) AS ultima;
```

| Variante | Comportamento se a subconsulta não retornar nada |
|---|---|
| `CROSS APPLY` | A linha de `clientes` desaparece do resultado (equivalente a `INNER JOIN`) |
| `OUTER APPLY` | A linha de `clientes` é mantida, colunas da subconsulta em `NULL` (equivalente a `LEFT JOIN`) |

> **Nota:** essa mesma necessidade (referenciar a linha atual a partir de uma subconsulta unida) se chama `LATERAL JOIN` no PostgreSQL -- conceito equivalente, sintaxe diferente conforme o motor.

## Consulta entre bancos de dados na mesma instância

Uma conexão aberta em um banco de dados pode ler diretamente uma tabela de outro banco, desde que ambos estejam no mesmo servidor/instância e o login tenha direitos sobre os dois: basta prefixar o nome da tabela com o banco e o schema, com a notação de três segmentos `Banco.schema.tabela`.

```sql
-- conectado a base_ouro, ainda assim le base_prata sem linked server nem conexao separada
SELECT *
FROM base_prata.dbo.scores_historico;
```

> **Armadilha:** confundir esse caso (mesma instância, apenas outro banco) com um acesso a um servidor remoto, que exige um `linked server` ou uma conexão separada: a notação de três segmentos só funciona na mesma instância.

## `CREATE TABLE`: criar uma tabela (DDL)

```sql
CREATE TABLE clientes (
    id      INT IDENTITY PRIMARY KEY,  -- identificador único, gerado automaticamente
    nome    VARCHAR(100) NOT NULL,     -- texto obrigatório, nunca vazio
    cidade  VARCHAR(100) NULL          -- texto opcional, pode ficar vazio
);

CREATE TABLE vendas (
    id           INT IDENTITY PRIMARY KEY,
    cliente_id   INT NOT NULL,
    data_compra  DATE NOT NULL,
    -- toda venda deve apontar para um cliente existente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);
```

- Cada coluna tem um tipo (`INT`, `VARCHAR(100)` para texto de até 100 caracteres, `DATE`...) que restringe o que ela pode conter.
- `NOT NULL` / `NULL`: obriga (ou não) a coluna a sempre ter um valor, independentemente do tipo.
- `PRIMARY KEY`: identifica cada linha de forma única; `IDENTITY` a gera automaticamente (1, 2, 3...), sem precisar informá-la.
- `FOREIGN KEY`: obriga `cliente_id` a sempre corresponder a um `id` existente em `clientes`, impedindo uma venda órfã.

> **Nota:** renomear a tabela `clientes` (ex: `sp_rename` no [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/)) não quebra a restrição `FOREIGN KEY`: ela é ligada internamente ao objeto, não ao seu nome.

## Índice: acelerar uma busca ou uma junção

Um índice é uma estrutura auxiliar (como o índice de um livro) que permite ao motor encontrar linhas sem percorrer toda a tabela.

```sql
CREATE INDEX idx_clientes_cidade ON clientes(cidade);
```

> **Armadilha:** uma chave composta por colunas largas demais pode ultrapassar o limite de tamanho de um índice (900 bytes no [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/)).
>
> **Boa prática:** preferir uma chave técnica autogerada (`IDENTITY`, chamada chave substituta) a uma chave "natural" (ex: nome + endereço combinados) larga demais para ser indexada eficazmente.

## `ALTER TABLE`: o que pode ser modificado depois

| Operação | Possível com `ALTER TABLE` (SQL Server) |
|---|---|
| Adicionar uma coluna | Sim, trivial |
| Remover uma coluna | Sim |
| Mudar o tipo de uma coluna | Sim, sob condições (ex: dado já presente compatível) |
| Reordenar fisicamente as colunas | Não: é preciso recriar a tabela e copiar os dados |

> **Armadilha:** querer reordenar colunas existentes achando que um simples `ALTER TABLE` basta, como para adicionar uma coluna.

## Variável de tabela: praticar sem criar nada de duradouro (T-SQL)

Uma **variável** é um nome que designa um valor guardado na memória; em T-SQL, seu nome começa com `@` e `DECLARE` a declara. Uma **variável de tabela** é uma variável que contém uma tabela inteira, pequena: declara-se com as suas colunas, preenche-se com `INSERT`, lê-se com `SELECT`, como uma tabela de verdade.

```sql
DECLARE @catalogo TABLE (           -- declara a variável de tabela @catalogo
    id      INT PRIMARY KEY,        -- mesma sintaxe de colunas que CREATE TABLE
    titulo  VARCHAR(100),
    preco   DECIMAL(8, 2)
);

INSERT INTO @catalogo (id, titulo, preco)  -- preenche a variável, linha por linha
VALUES (1, 'As Noites de Névoa', 12.50),
       (2, 'Atlas dos mares', 39.90),
       (3, 'O Último Farol', 9.90);

SELECT titulo, preco
FROM @catalogo                      -- o @ continua obrigatório no FROM
WHERE preco < 20
ORDER BY preco;
```

```
titulo              preco
------------------  -----
O Último Farol      9.90
As Noites de Névoa  12.50
```

(Saída esperada no SQL Server, escrita à mão: este script é T-SQL, e o SQLite não o executa. `decimal(8, 2)` mantém duas casas decimais, por isso `9.90`.)

Essa variável só existe durante uma execução: ao fim dela (o **lote**: o conjunto de instruções enviadas de uma vez ao servidor), ela desaparece com suas linhas. Não cria **nada de duradouro** no banco (nenhuma tabela, nada a limpar depois). Comparada às outras formas de guardar linhas (uma **tabela temporária** é uma tabela de verdade, mas efêmera, cujo nome começa com `#` e que o servidor apaga sozinho ao fim da **conexão**, ver a [documentação](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql#temporary-tables); a **conexão** é definida [mais acima](#datas-date-contra-datetime)):

| | `CREATE TABLE clientes` | tabela temporária `#t` | variável de tabela `@t` |
|---|---|---|---|
| Declara-se com | `CREATE TABLE` | `CREATE TABLE #t (...)` | `DECLARE @t TABLE (...)` |
| Tempo de vida | permanente, até `DROP TABLE` | enquanto a conexão viver (ou até `DROP`) | a execução em curso |
| Visível para | todas as contas autorizadas | a conexão que a criou | a execução que a declarou |
| Deixa rastro no banco | sim | não | não |
| Uso típico | dados da aplicação | resultados intermediários, volumes médios | pequenos testes, algumas linhas |

É um bom terreno de treino: pode-se praticar `SELECT`, `WHERE` e `ORDER BY` com dados inventados, sem direito de escrever nas tabelas do banco.

> **Armadilha:** selecionar e executar apenas a última parte do script (o `SELECT ... FROM @catalogo`): a variável foi declarada em uma execução anterior, portanto não existe mais, e o motor responde que `@catalogo` não foi declarada. Escrever `FROM catalogo` sem `@` também falha (o motor procura uma tabela com esse nome).
>
> **Boa prática:** executar o script inteiro (declaração, `INSERT`, leitura) a cada tentativa; para guardar dados de uma execução para outra, passar a uma tabela temporária `#t` ou a um [`CREATE TABLE`](#create-table-criar-uma-tabela-ddl); para um grande volume de linhas, não usar variável de tabela, que foi concebida para pequenos volumes.

Detalhes da sintaxe: [documentação oficial](https://learn.microsoft.com/en-us/sql/t-sql/data-types/table-transact-sql).

## `NULL`: um dado ausente, não um valor como os outros

`NULL` significa "não se sabe" ou "nada foi informado"; **não** é a mesma coisa que um valor sentinela como `-1` ou uma string vazia, que significa "sabe-se que estruturalmente não existe nenhum".

```sql
SELECT AVG(desconto) FROM vendas;
-- AVG/SUM/COUNT(coluna) ignoram as linhas com NULL: um desconto com NULL não conta como 0
```

> **Armadilha:** guardar `-1` em vez de `NULL` para "sem desconto" distorce `AVG(desconto)`, que passaria a contar `-1` como um valor numérico real em vez de ignorá-lo.
>
> **Boa prática:** reservar `NULL` para "valor desconhecido/não informado"; usar um valor sentinela apenas se seu significado de negócio estiver documentado, e nunca misturar os dois na mesma coluna.

### Comparar com `NULL`: `IS NULL`, a armadilha de `<>` e `COUNT`

Um teste como `cidade = 'Lyon'` dá "verdadeiro" ou "falso" para uma linha. Com `NULL` (valor desconhecido), a resposta é um terceiro estado: **desconhecido**, nem verdadeiro nem falso. Ora, `WHERE` só mantém as linhas cuja condição vale **verdadeiro**: uma condição desconhecida faz a linha desaparecer, como uma condição falsa.

Tabela `clientes` usada abaixo (David não tem cidade informada):

| id | nome | cidade |
|---|---|---|
| 1 | Alice | Lyon |
| 2 | Bruno | Paris |
| 3 | Chloé | Lyon |
| 4 | David | `NULL` |
| 5 | Emma | Paris |
| 6 | Farid | Marseille |

| Condição | Alice (`Lyon`) | David (`NULL`) | Linhas mantidas |
|---|---|---|---|
| `cidade = 'Lyon'` | verdadeiro | desconhecido | Alice, Chloé |
| `cidade <> 'Lyon'` | falso | desconhecido | Bruno, Emma, Farid |
| `NOT (cidade = 'Lyon')` | falso | desconhecido | Bruno, Emma, Farid |
| `cidade = NULL` | desconhecido | desconhecido | nenhuma |
| `cidade IS NULL` | falso | verdadeiro | David |
| `cidade IS NOT NULL` | verdadeiro | falso | todos menos David |

Duas consequências. Primeiro, `= NULL` nunca devolve nada (mesmo `NULL = NULL` é desconhecido, com a configuração padrão do SQL Server, `ANSI_NULLS ON`): é preciso `IS NULL` ou `IS NOT NULL`.

```sql
SELECT nome FROM clientes WHERE cidade = NULL;     -- nunca nenhuma linha, sem erro
SELECT nome FROM clientes WHERE cidade IS NULL;    -- David
```

```
(primeira consulta)  nenhuma linha
(segunda consulta)   David
```

Segundo, **`<>` também descarta as linhas sem valor**: "os clientes que não moram em Lyon" deveria incluir David, que provavelmente não mora lá, mas cuja cidade é desconhecida. A correção acrescenta explicitamente as linhas com `NULL`:

```sql
SELECT nome FROM clientes
WHERE cidade <> 'Lyon'      -- as cidades conhecidas e diferentes de Lyon
   OR cidade IS NULL;       -- mais os clientes sem cidade
```

```
nome
-----
Bruno
David
Emma
Farid
```

> **Armadilha:** escrever `WHERE cidade <> 'Lyon'` achando obter "todos os outros": as linhas com `NULL` desaparecem sem aviso. O mesmo efeito com `NOT (cidade = 'Lyon')`.
>
> **Boa prática:** para toda condição de negação sobre uma coluna que pode valer `NULL`, perguntar-se o que se quer das linhas sem valor, e então escrevê-lo (`OR coluna IS NULL`).

#### `COUNT(*)` contra `COUNT(coluna)`

| Escrita | O que conta |
|---|---|
| `COUNT(*)` | as **linhas**, quaisquer que sejam os valores |
| `COUNT(coluna)` | as linhas em que essa coluna tem um **valor** (não `NULL`) |

```sql
SELECT COUNT(*) AS qtd_linhas, COUNT(cidade) AS qtd_cidades FROM clientes;
```

```
qtd_linhas  qtd_cidades
----------  -----------
6           5
```

A mesma lógica vale para as outras funções: elas só consideram os valores conhecidos. Em uma tabela `filmes(id, titulo, ano, nota)`, sendo `nota` uma coluna numérica (ver [Números](#numeros-int-numeric-e-decimal)), em que dois filmes ainda não têm nota (`NULL`) e três têm `8`, `6` e `10`:

```sql
SELECT COUNT(*) AS qtd_linhas, COUNT(nota) AS qtd_notas,
       SUM(nota) AS total, AVG(nota) AS media
FROM filmes;
```

```
qtd_linhas  qtd_notas  total  media
----------  ---------  -----  -----
5           3          24     8.0
```

(Saída obtida com SQLite. No SQL Server, se `nota` for um `decimal`, as somas e médias aparecem com casas decimais, `24.0` por exemplo, e a quantidade varia conforme o motor. Se `nota` for um `INT`, `AVG` devolve um **inteiro**: `8` aqui, mas `4` e não `4.8` para a média com zeros abaixo. Para manter as casas decimais, escreva `AVG(CAST(nota AS decimal(4, 1)))`.)

A média vale `24 / 3 = 8` (três notas conhecidas), e não `24 / 5 = 4.8`. Os filmes sem nota não puxam a média para baixo: são ignorados, o que é o comportamento certo enquanto `NULL` significa "ainda não avaliado". Se primeiro substituirmos `NULL` por `0` ([`ISNULL`/`COALESCE`](#isnull-preencher-uma-coluna-apenas-se-ela-ainda-estiver-vazia)), a média cai para `4.8` (com `decimal` ou no SQLite): um `0` é uma nota de verdade, não uma ausência.

### `ISNULL()`: preencher uma coluna apenas se ela ainda estiver vazia

`SET coluna = valor` sempre sobrescreve a coluna, mesmo que ela já contivesse um dado válido. `ISNULL(coluna, valor)` (equivalente padrão SQL: `COALESCE(coluna, valor)`) só retorna `valor` se `coluna` estiver atualmente `NULL`, e a própria coluna caso contrário: um resgate de dados que nunca toca em uma linha já corretamente preenchida.

```sql
-- so modifica siret nas linhas onde ainda esta NULL; sem risco ao reexecutar
UPDATE clientes SET siret = ISNULL(siret, '12345678900010') WHERE id = 1;
```

> **Boa prática:** esse padrão é idempotente (pode ser reexecutado sem risco quantas vezes for preciso): útil para um script de resgate que pode ser relançado após uma carga parcial de dados, sem nunca sobrescrever um valor já presente.

## Controlar o SQL a partir do PHP com PDO

PDO (*[PHP](/?c=langages&s=php&p=php) Data Objects*) é a interface nativa do [PHP](/?c=langages&s=php&p=php) para dialogar com um banco de dados, seja qual for seu motor.

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=loja', 'usuario', 'senha');

$stmt = $pdo->prepare('SELECT * FROM clientes WHERE cidade = :cidade');
$stmt->execute([':cidade' => 'Lyon']);

$linha  = $stmt->fetch(\PDO::FETCH_ASSOC);     // uma única linha, array associativo
$todas  = $stmt->fetchAll(\PDO::FETCH_ASSOC);  // todas as linhas
?>
```

O ciclo é sempre o mesmo: `prepare()` (escrever a consulta, com espaços reservados como `:cidade`) → `execute()` (fornecer os valores reais) → `fetch()`/`fetchAll()` (recuperar o resultado).

> **Nota:** `$pdo->query($sql)` é um atalho **sem** espaço reservado, utilizável apenas se `$sql` for uma string 100% fixa, sem nenhuma variável externa concatenada nela. Assim que um único valor externo (usuário, URL, sessão...) entra na consulta, é preciso passar por `prepare()`/`execute()`.

## `IN (...)` com uma lista de tamanho variável no PDO

O PDO só permite parametrizar valores individuais, nunca um array inteiro em um único placeholder: `IN (:cidades)` com `execute([':cidades' => ['Lyon', 'Paris']])` não funciona -- o PDO trataria o array como um único valor (um erro, ou uma conversão incorreta conforme o driver).

```php
<?php
function consultaComIn(PDO $pdo, string $sql, string $prefixo, array $valores): PDOStatement
{
    // Gera um placeholder nomeado por valor: prefixo_0, prefixo_1...
    $placeholders = [];
    $params = [];
    foreach (array_values($valores) as $i => $valor) {
        $nome = ":{$prefixo}_{$i}";
        $placeholders[] = $nome;
        $params[$nome] = $valor;
    }

    // Substitui o marcador {IN} do SQL informado pela lista de placeholders gerada
    $sqlFinal = str_replace('{IN}', implode(', ', $placeholders), $sql);

    $stmt = $pdo->prepare($sqlFinal);
    $stmt->execute($params);
    return $stmt;
}

$stmt = consultaComIn(
    $pdo,
    'SELECT * FROM clientes WHERE cidade IN ({IN})',
    'cidade',
    ['Lyon', 'Paris']
);
// SQL gerado: SELECT * FROM clientes WHERE cidade IN (:cidade_0, :cidade_1)
```

| Etapa | Papel |
|---|---|
| Um placeholder nomeado por valor (`:cidade_0`, `:cidade_1`...) | Contorna o limite do PDO (um placeholder = um único valor) |
| `implode(', ', $placeholders)` | Constrói a lista `(:cidade_0, :cidade_1)` a inserir no `IN (...)` |
| `$params` | Cada valor continua sendo passado separadamente a `execute()`, nunca concatenado no texto SQL |

> **Armadilha:** uma lista vazia (`$valores = []`) gera um `IN ()` sintaticamente inválido na maioria dos motores SQL. Verificar que `$valores` não está vazio antes de chamar essa função (ou encerrar a consulta inteira mais cedo: uma busca sobre uma lista vazia de cidades não pode retornar nenhum resultado de qualquer forma).
>
> **Boa prática:** nunca concatenar diretamente os valores no `IN (...)` (seria a mesma falha de [injeção SQL](#injecao-sql-por-que-nunca-concatenar-um-valor-externo) que concatenar qualquer outro valor externo); gerar sempre um placeholder por valor, seja qual for o tamanho da lista.

## Controlar o SQL a partir do Python com `pyodbc`

[`pyodbc`](https://github.com/mkleehammer/pyodbc/wiki) é o equivalente em [Python](/?c=langages&s=python&p=python) do PDO para dialogar com um banco de dados via um driver ODBC.

```python
import pyodbc

conexao = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=meu_servidor;DATABASE=loja;UID=usuario;PWD=senha"
)  # abre a conexão com o banco de dados

cursor = conexao.cursor()
# ? = espaço reservado, valor passado a parte
cursor.execute("SELECT * FROM clientes WHERE cidade = ?", "Lyon")

uma_linha = cursor.fetchone()  # uma única linha
todas     = cursor.fetchall()  # todas as linhas

# confirma as escritas (INSERT/UPDATE/DELETE); desnecessário após um simples SELECT
conexao.commit()
```

Mesmo ciclo que o PDO: `connect()` (abrir a conexão) → `cursor()` → `execute()` (com `?` como espaço reservado, valor passado à parte, nunca concatenado) → `fetchone()`/`fetchall()`. `executemany()` repete a mesma consulta para uma lista de conjuntos de valores (inserção em massa), mais rápido que um laço de `execute()` um por um.

### Autenticação Windows integrada: uma mensagem de falha pode esconder duas causas diferentes

Com `Trusted_Connection=yes` na string de conexão, nenhum login ou senha é fornecido: o Windows negocia a identidade nos bastidores (Kerberos se um controlador de domínio estiver acessível, senão recuando para NTLM), e o servidor SQL recebe uma identidade já autenticada.

```python
conexao = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=meu_servidor;DATABASE=loja;Trusted_Connection=yes"
)
```

> **Armadilha:** uma mensagem `Login failed for user 'DOMINIO\usuario'` NÃO significa necessariamente que o Kerberos/NTLM falhou. A identidade Windows pode muito bem ter sido negociada com sucesso (autenticação), mas o servidor SQL não encontrou depois nenhum login mapeado para essa conta NESSA instância específica (autorização): duas causas distintas, exatamente a mesma mensagem de erro.
>
> **Boa prática:** antes de procurar um problema de rede/Kerberos, verificar se existe de fato um login para essa conta Windows na instância visada (ex: confirmando que a mesma conta, a partir da mesma máquina, se conecta sem problema a outra instância).

## `sqlcmd`: executar um script SQL na linha de comando, com variáveis (SQL Server)

`sqlcmd` executa um arquivo `.sql` diretamente na linha de comando, sem passar por uma linguagem hospedeira. A opção `-v` define uma **variável de script**, substituída no texto SQL antes da execução via `$(NOME)`:

```bash
sqlcmd -S meu_servidor -v DBNAME=base_homologacao -i script.sql
```

```sql
-- script.sql
USE [$(DBNAME)];

IF '$(DBNAME)' = '' OR '$(DBNAME)' = '$' + '(DBNAME)'
    RAISERROR('A variavel DBNAME deve ser fornecida via -v', 16, 1);
```

O segundo teste da guarda (`'$' + '(DBNAME)'`) captura o caso em que `$(DBNAME)` nem sequer foi substituída e aparece tal como está no texto executado (script lançado sem `-v`, ou com um nome de variável escrito errado). `:setvar NOME valor` faz a mesma coisa diretamente dentro do script, em vez de na linha de comando.

> **Boa prática:** parametrizar um mesmo script `.sql` para vários ambientes (homologação/produção) via `-v`, em vez de duplicá-lo ou gerá-lo dinamicamente a partir de uma linguagem hospedeira.

## Injeção SQL: por que nunca concatenar um valor externo

```php
<?php
// NUNCA:
$sql = "SELECT * FROM clientes WHERE cidade = '" . $_GET['cidade'] . "'";
?>
```

Se `$_GET['cidade']` contivesse `Lyon' OR '1'='1`, a consulta se tornaria uma condição sempre verdadeira, retornando todas as linhas da tabela. Equivalente conceitual de um [estouro de buffer](/?c=langages&s=c&p=memoire) em [C](/?c=langages&s=c&p=c): uma entrada não controlada que modifica a **estrutura** do comando, em vez de permanecer um simples dado.

Os espaços reservados nomeados (`:cidade`) impedem isso estruturalmente: o valor passado a `execute()` é **sempre** tratado como dado puro pelo driver, nunca reinterpretado como SQL, seja qual for seu conteúdo.

```php
<?php
// Construir dinamicamente uma clausula WHERE continua seguro,
// desde que apenas os NOMES dos placeholders sejam concatenados, nunca os valores em si:
function construirE(array $criterios): array
{
    $clausulas = [];
    $params    = [];
    foreach ($criterios as $coluna => $valor) {
        $clausulas[] = "{$coluna} = :{$coluna}";
        $params[":{$coluna}"] = $valor;
    }
    return [implode(' AND ', $clausulas), $params];
}
// construirE(['cidade' => 'Lyon']) -> ["cidade = :cidade", [':cidade' => 'Lyon']]
?>
```

O texto SQL gerado nunca contém o valor real, apenas o nome literal do placeholder (`:cidade`): o valor real vai separadamente em `$params`, usado por `execute($params)`.

> **Nota (segurança):** esse mecanismo protege os **valores** (`$valor`), mas não os **nomes de colunas** (`$coluna`): estes são concatenados diretamente no SQL, sem passar por um placeholder (isso não é tecnicamente possível: PDO só permite parametrizar valores, nunca nomes de colunas ou tabelas). Se `$criterios` viesse diretamente de uma entrada do usuário não filtrada (ex. `construirE($_GET)`), um nome de coluna forjado poderia reintroduzir uma injeção SQL. `$coluna` deve, portanto, sempre vir de uma lista branca de colunas autorizadas previamente, nunca diretamente de uma entrada externa.

## O princípio do menor privilégio

Além da injeção SQL (que protege o *como* se consulta o banco), uma boa prática de segurança trata do *quem*: a conta usada por uma aplicação para se conectar ao banco nunca deveria ter mais direitos do que ela realmente precisa.

```sql
-- em vez de dar todos os direitos a uma única conta aplicativa:
GRANT SELECT, INSERT, UPDATE ON loja.pedidos TO 'app_loja'@'%';
-- sem DROP, DELETE, nem acesso às outras tabelas/bancos, se a aplicação nunca precisar deles
```

Concretamente, uma conta aplicativa comprometida (via uma falha no código, um vazamento de credenciais...) só pode causar danos na medida de seus próprios direitos: uma conta limitada a `SELECT`/`INSERT`/`UPDATE` em uma única tabela não permite a um atacante apagar um banco de dados inteiro, mesmo que consiga executar consultas arbitrárias. É uma proteção **complementar** às consultas preparadas, não um substituto: ela limita os danos *se* uma injeção acontecer mesmo assim (bug não detectado, consulta dinâmica mal construída...), em vez de impedir a própria injeção.

## `MERGE`: um UPSERT em uma única consulta (SQL Server)

Um `SELECT` seguido de um `UPDATE`/`INSERT` condicional para sincronizar uma tabela destino a partir de uma origem exige duas consultas e uma decisão em código (ou em T-SQL) entre elas. `MERGE` faz as duas coisas em uma única instrução atômica: compara uma origem (`USING`) com o destino sobre uma chave (`ON`), e executa `WHEN MATCHED THEN UPDATE` ou `WHEN NOT MATCHED THEN INSERT` conforme o caso.

```sql
MERGE clientes AS destino
USING (SELECT 1 AS id_cliente, 'Dupont' AS nome, 'Marselha' AS cidade) AS origem
ON destino.id = origem.id_cliente
WHEN MATCHED THEN
    UPDATE SET destino.nome = origem.nome, destino.cidade = origem.cidade
WHEN NOT MATCHED THEN
    INSERT (id, nome, cidade) VALUES (origem.id_cliente, origem.nome, origem.cidade);
```

> **Boa prática:** gerar o texto do `MERGE` a partir de uma simples lista `(coluna, tipo)` em código em vez de escrever à mão cada `UPDATE SET`/`INSERT`: adicionar uma coluna ao esquema então só exige uma entrada nessa lista, nunca retocar o modelo SQL.

## SCD2: preservar o histórico de mudanças de uma tabela

Um `UPDATE` clássico sobrescreve o valor anterior para sempre:

```sql
-- a cidade anterior 'Lyon' é perdida definitivamente
UPDATE clientes SET cidade = 'Paris' WHERE id = 1;
```

O padrão **SCD2** (*[Slowly Changing Dimension](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/) tipo 2*) evita essa perda: em vez de sobrescrever uma linha, fecha-se a versão atual e insere-se uma nova, mantendo as duas.

| Coluna | Papel |
|---|---|
| `valid_from` | Data a partir da qual essa versão da linha é válida |
| `valid_to` | Data até a qual ela era válida (`NULL` se ainda válida) |
| `is_current` | Verdadeiro apenas para a versão atual dessa linha |

```sql
-- 1. fechar a versão atual
UPDATE clientes SET valid_to = GETDATE(), is_current = 0
WHERE id_cliente = 1 AND is_current = 1;

-- 2. inserir a nova versão
INSERT INTO clientes (id_cliente, nome, cidade, valid_from, valid_to, is_current)
VALUES (1, 'Dupont', 'Paris', GETDATE(), NULL, 1);
```

> **Armadilha:** `id_cliente` (o identificador de negócio) agora se repete em várias linhas (uma por versão): a `PRIMARY KEY` da tabela deve ser uma chave técnica separada (`IDENTITY`), não `id_cliente` sozinho.
>
> **Boa prática:** reservar SCD2 para as colunas cujo histórico realmente importa para o uso que se faz delas (ex: a cidade de um cliente, para uma análise geográfica ao longo do tempo); sobrescrever normalmente (`UPDATE` simples) as colunas onde só o valor atual importa.

## Para ir mais longe

- [Documentação PDO (php.net)](https://www.php.net/manual/pt_BR/book.pdo.php)
- [Documentação do `pyodbc` (repositório oficial)](https://github.com/mkleehammer/pyodbc/wiki)
- [W3Schools SQL (em inglês, bom guia de referência de sintaxe)](https://www.w3schools.com/sql/)

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Cada coluna tem um tipo (`INT`, `decimal`, `varchar`, `date`) e uma chave primária identifica cada linha. SQL consulta (DML) e define a estrutura (DDL) de tabelas (colunas fixas, linhas = registros). `JOIN` combina duas tabelas por uma coluna comum; `INNER JOIN` elimina as linhas sem correspondência, `LEFT JOIN` as mantém; `APPLY` combina uma junção com uma chamada de função/subconsulta parametrizada por linha. `GROUP BY`/`GROUPING SETS` resumem por grupo, com ou sem total global na mesma consulta. `NULL` = valor desconhecido, nunca confundir com um valor sentinela. `MERGE` faz em uma consulta o que um `SELECT` e depois `UPDATE`/`INSERT` fariam em duas. Uma consulta se lê cláusula por cláusula (`SELECT` as colunas, `FROM` a tabela, `WHERE` as linhas) e o servidor a processa na ordem `WHERE`, `GROUP BY`, cálculo, `ORDER BY`. Uma tabela não tem nenhuma ordem garantida: só `ORDER BY` a fixa. Com `NULL`, uma comparação vale "desconhecido" e `WHERE` só mantém o "verdadeiro". |
| **Ferramentas utilizáveis** | `SELECT`/`WHERE`, funções de agregação (`COUNT`/`SUM`/`AVG`), `GROUP BY`/`GROUPING SETS`/`GROUPING()`, `JOIN`/`LEFT JOIN`/`OUTER APPLY`/`CROSS APPLY`, notação de três segmentos para uma consulta entre bancos na mesma instância, `MERGE` para um UPSERT, `ISNULL()`/`COALESCE()` para um resgate idempotente, `CREATE TABLE`/`ALTER TABLE`, índices, consultas preparadas via PDO ([PHP](/?c=langages&s=php&p=php), incluindo um `IN (...)` de tamanho variável via placeholders gerados) ou `pyodbc` ([Python](/?c=langages&s=python&p=python)), `sqlcmd` para um script parametrizado na linha de comando, SCD2 para preservar o histórico de mudanças, `ORDER BY`, `TOP n`, `CAST`, `IS NULL`, variável de tabela `DECLARE @t TABLE` para praticar sem criar nada de duradouro. |
| **Armadilhas a evitar** | Concatenar um valor externo diretamente em uma consulta SQL (injeção SQL), inclusive dentro de um `IN (...)`; usar `INNER JOIN` quando se quer manter as linhas sem correspondência; reordenar colunas com `ALTER TABLE` (impossível, é preciso recriar a tabela); confundir `NULL` com um valor sentinela, inclusive o `NULL` de total de um `GROUPING SETS`; interpretar uma falha de login em uma conexão Windows integrada como necessariamente uma falha Kerberos/NTLM, quando a autenticação pode ter tido sucesso sem existir um login na instância; `TOP n` sem `ORDER BY`; um `;` colocado entre duas cláusulas; comparar tipos diferentes (número contra data); `<>` ou `= NULL` sobre uma coluna que contém `NULL`; achar que um cálculo incide sobre toda a tabela quando ele incide sobre as linhas mantidas por `WHERE`. |
| **Boas práticas** | Sempre passar por uma consulta preparada (`prepare`/`execute`) para um valor externo, inclusive um placeholder por valor dentro de um `IN (...)`; limitar os direitos da conta aplicativa ao estritamente necessário (princípio do menor privilégio); chave técnica (`IDENTITY`) em vez de chave natural larga para indexação; `GROUPING()` para distinguir uma linha de total de um valor `NULL` real; `ISNULL(coluna, valor)` em vez de um `UPDATE` direto para um resgate reexecutável sem risco; `ORDER BY` para todo resultado cuja ordem importa; parênteses em volta de um `OR` combinado com um `AND`; `decimal(p, s)` para dinheiro; `IS NULL` em vez de `= NULL`, e `COUNT(*)` para saber o total de linhas. |
