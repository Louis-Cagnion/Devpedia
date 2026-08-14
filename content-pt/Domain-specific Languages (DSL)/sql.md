# SQL

O SQL (*Structured Query Language*) é uma linguagem com um único objetivo: consultar e manipular dados armazenados sob a forma de tabelas. Tal como a regex, não é uma linguagem de programação generalista — não possui loops, nem funções definidas pelo usuário, nem variáveis no sentido clássico. É interpretada por um motor de base de dados (MySQL, PostgreSQL, SQL Server, SQLite...), geralmente controlada a partir de uma linguagem anfitriã (PHP, Python, JS...) através de um conector.

## Uma tabela = um conjunto de estruturas / uma lista de dicionários

Uma tabela relacional tem colunas fixas (como os campos de um `struct` em C ou as chaves de um `dict` em Python); cada linha é uma instância dessa estrutura.

```sql
SELECT id, nome FROM clients WHERE cidade = 'Lyon';
```

«Colunas `id` / `nome`, da tabela `clients`, apenas as linhas em que `cidade = 'Lyon'`.» `SELECT *` seleciona todas as colunas.

## As funções de agregação

Estas resumem várias linhas num único valor:

| Função | Papel |
|---|---|
| `COUNT(*)` | Número de linhas |
| `SUM(coluna)` | Soma de uma coluna numérica |
| `AVG(coluna)` | Média de uma coluna numérica |
| `MAX(coluna)` / `MIN(coluna)` | Valor máximo / mínimo |

```sql
SELECT COUNT(*) AS nb_clients FROM clients WHERE cidade = 'Lyon';
```

`AS nome` atribui um alias a uma coluna do resultado (neste caso, a coluna calculada passará a chamar-se «`nb_clients`»).

## `JOIN` : combinar duas tabelas com base numa coluna comum

Equivalente declarativo para emparelhar duas coleções através de uma chave partilhada, em vez de escrever um ciclo com uma pesquisa manual:

```sql
SELECT c.nome, v.date_achat
FROM clients c
JOIN ventes v ON v.client_id = c.id; -- INNER JOIN : les lignes sans correspondance disparaissent
```

```sql
SELECT c.nome, v.date_achat
FROM clients c
LEFT JOIN ventes v ON v.client_id = c.id; -- garde TOUTES les lignes de gauche, NULL si pas de correspondance
```

- `c` / `v` são aliases de tabela, indispensáveis sempre que duas tabelas partilham o nome de uma coluna (por exemplo, `c.nome` versus uma eventual `v.nome`, sem ambiguidade).
- `JOIN` (ou `INNER JOIN`): mantém apenas as linhas que correspondem em ambos os lados.
- `LEFT JOIN` : mantém todas as linhas da tabela da esquerda; as colunas da direita são substituídas por «`NULL`» se não houver correspondência — útil quando se pretende listar *todos os elementos*, independentemente de ter sido encontrada ou não uma correspondência (por exemplo: todos os clientes, quer já tenham comprado ou não).

## Utilizar o SQL a partir do PHP com o PDO

O PDO (*PHP Data Objects*) é a interface nativa do PHP para interagir com uma base de dados, independentemente do seu motor.

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=boutique', 'utilisateur', 'motdepasse');

$stmt = $pdo->prepare('SELECT * FROM clients WHERE ville = :ville');
$stmt->execute([':ville' => 'Lyon']);

$linha  = $stmt->fetch(\PDO::FETCH_ASSOC);    // uma única linha, tabela associativa
$toutes = $stmt->fetchAll(\PDO::FETCH_ASSOC); // todas as linhas
?>
```

O ciclo é sempre o mesmo: `prepare()` (escrever a consulta, com espaços reservados como `:cidade`) → `execute()` (introduzir os valores reais) → `fetch()` / `fetchAll()` (obter o resultado).

> **Nota:** `$pdo->query($sql)` é um atalho **sem** espaço reservado, utilizável apenas se `$sql` for uma cadeia de caracteres 100% fixa, sem qualquer variável externa concatenada. Assim que um único valor externo (usuário, URL, sessão...) for incluído na consulta, é necessário utilizar `prepare()` / `execute()`.

## Injeção SQL: por que nunca se deve concatenar um valor externo

```php
<?php
// NUNCA:
$sql = "SELECT * FROM clients WHERE ville = '" . $_GET['ville'] . "'";
?>
```

Se `$_GET['cidade']` contivesse `Lyon' OR '1'='1`, a consulta tornar-se-ia uma condição sempre verdadeira, devolvendo todas as linhas da tabela. Equivalente conceptual a um estouro de buffer em C: uma entrada não controlada que altera a **estrutura** do comando, em vez de se manter como um simples dado.

Os espaços reservados denominados (`:cidade`) impedem isso estruturalmente: o valor passado para `execute()` é **sempre** tratado como dados puros pelo driver, nunca reinterpretado como SQL, independentemente do seu conteúdo.

```php
<?php
// A construção dinâmica de uma cláusula WHERE continua a ser segura,
// desde que apenas os NOMES dos placeholders sejam concatenados — nunca os próprios valores:
function construireEt(array $criteres): array
{
    $clauses = [];
    $params  = [];
    foreach ($criteres as $coluna => $valor) {
        $clauses[] = "{$coluna} = :{$coluna}";
        $params[":{$coluna}"] = $valor;
    }
    return [implode(' AND ', $clauses), $params];
}
// construireEt(['cidade' => 'Lyon']) -> ["cidade = :cidade", [':cidade' => 'Lyon']]
?>
```

O texto SQL gerado nunca contém o valor real, apenas o nome literal do placeholder (`:cidade`) — o valor real é enviado separadamente em `$params`, utilizado por `execute($params)`.

> **Nota (segurança):** este mecanismo protege os **valores** (`$valor`), mas não os **nomes das colunas** (`$coluna`) — estes são concatenados diretamente no SQL, sem passar por um placeholder (isso não é tecnicamente possível: o PDO só permite passar valores como parâmetros, nunca nomes de colunas ou de tabelas). Se `$criteres` proviesse diretamente de uma entrada do usuário não filtrada (por exemplo, `construireEt($_GET)`), um nome de coluna falsificado poderia reintroduzir uma injeção SQL. `$coluna` deve, portanto, provir sempre de uma lista branca de colunas autorizadas previamente, nunca diretamente de uma entrada externa.

## Para saber mais

- [Documentação PDO — php.net](https://www.php.net/manual/fr/book.pdo.php)
- [W3Schools SQL (em inglês, bom guia de referência de sintaxe)](https://www.w3schools.com/sql/)
