---
order: 2
---

# SQL

SQL (*Structured Query Language*) é uma linguagem com um único propósito: consultar e manipular dados armazenados na forma de tabelas. Como [a regex](/?c=domain-specific-languages-dsl&p=regex), não é uma linguagem de programação generalista: não tem laços, nem funções definidas pelo usuário, nem variáveis no sentido clássico. Ela é interpretada por um motor de banco de dados ([MySQL](https://dev.mysql.com/doc/), [PostgreSQL](https://www.postgresql.org/docs/), [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), [SQLite](https://sqlite.org/docs.html)...), geralmente controlada a partir de uma linguagem hospedeira ([PHP](/?c=langages-de-programmation&s=php&p=php), [Python](/?c=langages-de-programmation&s=python&p=python), [JS](/?c=langages-de-programmation&s=javascript&p=javascript)...) via um conector.

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

## `JOIN`: combinar duas tabelas por uma coluna comum

Equivalente declarativo de emparelhar duas coleções por uma chave compartilhada, em vez de escrever um laço com uma busca manual:

```sql
SELECT c.nome, v.data_compra
FROM clientes c
JOIN vendas v ON v.cliente_id = c.id; -- INNER JOIN: as linhas sem correspondencia desaparecem
```

```sql
SELECT c.nome, v.data_compra
FROM clientes c
LEFT JOIN vendas v ON v.cliente_id = c.id; -- mantem TODAS as linhas da esquerda, NULL se nao houver correspondencia
```

- `c`/`v` são aliases de tabela, indispensáveis assim que duas tabelas compartilham um nome de coluna (`c.nome` vs uma eventual `v.nome`, sem ambiguidade).
- `JOIN` (ou `INNER JOIN`): mantém apenas as linhas que correspondem dos dois lados.
- `LEFT JOIN`: mantém todas as linhas da tabela da esquerda, colunas da direita com `NULL` se não houver correspondência: útil quando se quer listar *todo mundo*, correspondência encontrada ou não (ex: todos os clientes, tenham comprado ou não).

> **Armadilha:** usar `JOIN` (INNER) quando na verdade se quer *todo mundo*: um cliente sem nenhuma venda desapareceria silenciosamente do resultado, enquanto um `LEFT JOIN` o teria mantido com colunas em `NULL`.
>
> **Boa prática:** perguntar-se explicitamente, antes de escrever a junção, se as linhas sem correspondência devem desaparecer (`JOIN`) ou permanecer visíveis (`LEFT JOIN`); ambas produzem um resultado sintaticamente válido, mas semanticamente diferente.

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
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)  -- toda venda deve apontar para um cliente existente
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

## `NULL`: um dado ausente, não um valor como os outros

`NULL` significa "não se sabe" ou "nada foi informado"; **não** é a mesma coisa que um valor sentinela como `-1` ou uma string vazia, que significa "sabe-se que estruturalmente não existe nenhum".

```sql
SELECT AVG(desconto) FROM vendas;
-- AVG/SUM/COUNT(coluna) ignoram as linhas com NULL: um desconto com NULL não conta como 0
```

> **Armadilha:** guardar `-1` em vez de `NULL` para "sem desconto" distorce `AVG(desconto)`, que passaria a contar `-1` como um valor numérico real em vez de ignorá-lo.
>
> **Boa prática:** reservar `NULL` para "valor desconhecido/não informado"; usar um valor sentinela apenas se seu significado de negócio estiver documentado, e nunca misturar os dois na mesma coluna.

## Controlar o SQL a partir do PHP com PDO

PDO (*PHP Data Objects*) é a interface nativa do PHP para dialogar com um banco de dados, seja qual for seu motor.

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=loja', 'usuario', 'senha');

$stmt = $pdo->prepare('SELECT * FROM clientes WHERE cidade = :cidade');
$stmt->execute([':cidade' => 'Lyon']);

$linha  = $stmt->fetch(\PDO::FETCH_ASSOC);     // uma unica linha, array associativo
$todas  = $stmt->fetchAll(\PDO::FETCH_ASSOC);  // todas as linhas
?>
```

O ciclo é sempre o mesmo: `prepare()` (escrever a consulta, com espaços reservados como `:cidade`) → `execute()` (fornecer os valores reais) → `fetch()`/`fetchAll()` (recuperar o resultado).

> **Nota:** `$pdo->query($sql)` é um atalho **sem** espaço reservado, utilizável apenas se `$sql` for uma string 100% fixa, sem nenhuma variável externa concatenada nela. Assim que um único valor externo (usuário, URL, sessão...) entra na consulta, é preciso passar por `prepare()`/`execute()`.

## Controlar o SQL a partir do Python com `pyodbc`

[`pyodbc`](https://github.com/mkleehammer/pyodbc/wiki) é o equivalente em [Python](/?c=langages-de-programmation&s=python&p=python) do PDO para dialogar com um banco de dados via um driver ODBC.

```python
import pyodbc

conexao = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=meu_servidor;DATABASE=loja;UID=usuario;PWD=senha"
)  # abre a conexao com o banco de dados

cursor = conexao.cursor()
cursor.execute("SELECT * FROM clientes WHERE cidade = ?", "Lyon")  # ? = espaco reservado, valor passado a parte

uma_linha = cursor.fetchone()  # uma unica linha
todas     = cursor.fetchall()  # todas as linhas

conexao.commit()  # confirma as escritas (INSERT/UPDATE/DELETE); desnecessario apos um simples SELECT
```

Mesmo ciclo que o PDO: `connect()` (abrir a conexão) → `cursor()` → `execute()` (com `?` como espaço reservado, valor passado à parte, nunca concatenado) → `fetchone()`/`fetchall()`. `executemany()` repete a mesma consulta para uma lista de conjuntos de valores (inserção em massa), mais rápido que um laço de `execute()` um por um.

## Injeção SQL: por que nunca concatenar um valor externo

```php
<?php
// NUNCA:
$sql = "SELECT * FROM clientes WHERE cidade = '" . $_GET['cidade'] . "'";
?>
```

Se `$_GET['cidade']` contivesse `Lyon' OR '1'='1`, a consulta se tornaria uma condição sempre verdadeira, retornando todas as linhas da tabela. Equivalente conceitual de um [estouro de buffer](/?c=langages-de-programmation&s=c&p=memoire) em [C](/?c=langages-de-programmation&s=c&p=c): uma entrada não controlada que modifica a **estrutura** do comando, em vez de permanecer um simples dado.

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
-- em vez de dar todos os direitos a uma unica conta aplicativa:
GRANT SELECT, INSERT, UPDATE ON loja.pedidos TO 'app_loja'@'%';
-- sem DROP, DELETE, nem acesso as outras tabelas/bancos, se a aplicacao nunca precisar deles
```

Concretamente, uma conta aplicativa comprometida (via uma falha no código, um vazamento de credenciais...) só pode causar danos na medida de seus próprios direitos: uma conta limitada a `SELECT`/`INSERT`/`UPDATE` em uma única tabela não permite a um atacante apagar um banco de dados inteiro, mesmo que consiga executar consultas arbitrárias. É uma proteção **complementar** às consultas preparadas, não um substituto: ela limita os danos *se* uma injeção acontecer mesmo assim (bug não detectado, consulta dinâmica mal construída...), em vez de impedir a própria injeção.

## SCD2: preservar o histórico de mudanças de uma tabela

Um `UPDATE` clássico sobrescreve o valor anterior para sempre:

```sql
UPDATE clientes SET cidade = 'Paris' WHERE id = 1;  -- a cidade anterior 'Lyon' e perdida definitivamente
```

O padrão **SCD2** (*[Slowly Changing Dimension](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/) tipo 2*) evita essa perda: em vez de sobrescrever uma linha, fecha-se a versão atual e insere-se uma nova, mantendo as duas.

| Coluna | Papel |
|---|---|
| `valid_from` | Data a partir da qual essa versão da linha é válida |
| `valid_to` | Data até a qual ela era válida (`NULL` se ainda válida) |
| `is_current` | Verdadeiro apenas para a versão atual dessa linha |

```sql
-- 1. fechar a versao atual
UPDATE clientes SET valid_to = GETDATE(), is_current = 0
WHERE id_cliente = 1 AND is_current = 1;

-- 2. inserir a nova versao
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
| **Para lembrar** | SQL consulta (DML) e define a estrutura (DDL) de tabelas (colunas fixas, linhas = registros). `JOIN` combina duas tabelas por uma coluna comum; `INNER JOIN` elimina as linhas sem correspondência, `LEFT JOIN` as mantém. `NULL` = valor desconhecido, nunca confundir com um valor sentinela. |
| **Ferramentas utilizáveis** | `SELECT`/`WHERE`, funções de agregação (`COUNT`/`SUM`/`AVG`), `JOIN`/`LEFT JOIN`, `CREATE TABLE`/`ALTER TABLE`, índices, consultas preparadas via PDO ([PHP](/?c=langages-de-programmation&s=php&p=php)) ou `pyodbc` ([Python](/?c=langages-de-programmation&s=python&p=python)), SCD2 para preservar o histórico de mudanças. |
| **Armadilhas a evitar** | Concatenar um valor externo diretamente em uma consulta SQL (injeção SQL); usar `INNER JOIN` quando se quer manter as linhas sem correspondência; reordenar colunas com `ALTER TABLE` (impossível, é preciso recriar a tabela); confundir `NULL` com um valor sentinela. |
| **Boas práticas** | Sempre passar por uma consulta preparada (`prepare`/`execute`) para um valor externo; limitar os direitos da conta aplicativa ao estritamente necessário (princípio do menor privilégio); chave técnica (`IDENTITY`) em vez de chave natural larga para indexação. |
