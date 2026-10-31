---
order: 12
---

# Migrações de dados seguras

Um **banco de dados** é um programa que guarda informações em **tabelas** (como planilhas: uma **linha** por item, uma **coluna** por característica). Quando uma aplicação evolui, muitas vezes é preciso alterar linhas que já existem: corrigir a escrita de um status, preencher uma coluna nova, excluir contas antigas. Essa operação se chama **migração de dados**. Ela é mais arriscada do que uma mudança de código: um código defeituoso se corrige voltando à versão anterior, ao passo que linhas destruídas ou reescritas de forma errada não voltam sozinhas. Este capítulo apresenta quatro proteções: a migração versionada, a simulação, o SQL em massa e a salvaguarda antes da exclusão.

As migrações que alteram a **estrutura** das tabelas (acrescentar uma coluna, uma tabela) são apresentadas na seção « As migrações » do capítulo sobre [o ORM](/?c=donnees&s=bases-de-donnees&p=orm); aqui, cuidamos dos **dados**. O ciclo de vida de uma entidade (o que é disparado em torno do registro de um objeto) é tema de outro capítulo.

Os exemplos usam [SQLite](https://www.sqlite.org/docs.html), um banco de dados contido em um único arquivo, sem servidor para instalar, e [PHP](/?c=langages&s=php&p=syntaxe) para comandar o banco. Os comandos são digitados em um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). A linguagem de consultas é o [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql).

## A migração versionada

Uma **migração versionada** é um arquivo que descreve **uma única alteração**, numerado para fixar a ordem, e que não se modifica mais depois de aplicado. Uma **tabela de controle** registra quais migrações já foram executadas, para nunca executar a mesma duas vezes. Eis três arquivos de uma pasta `migrations/`. Cada linha de SQL que começa com `--` é um comentário.

Primeiro arquivo, `migrations/0001_creer_clients.sql`:

```sql
-- Cria a tabela dos clientes (uma linha por cliente)
CREATE TABLE clientes (
    id INTEGER PRIMARY KEY,      -- número único da linha
    email TEXT NOT NULL,         -- endereço do cliente
    status TEXT NOT NULL         -- situação da conta, escrita à mão no início
);
-- Dados iniciais, com status escritos de formas diferentes
INSERT INTO clientes (email, status) VALUES
    ('ana@exemplo.org', 'Actif'),
    ('bob@exemplo.org', 'actif '),
    ('chloe@exemplo.org', 'ACTIF'),
    ('dan@exemplo.org', 'inactif'),
    ('eva@exemplo.org', 'Inactif');
```

Segundo arquivo, `migrations/0002_normaliser_statuts.sql`: um `UPDATE` (comando SQL que altera linhas existentes), que se apoia na tabela criada pelo primeiro.

```sql
-- Uniformiza o status: minúsculas, sem espaço em volta
UPDATE clientes SET status = lower(trim(status));
```

Terceiro arquivo, `migrations/0003_ajouter_derniere_connexion.sql`:

```sql
-- Acrescenta uma coluna para a data do último acesso
ALTER TABLE clientes ADD COLUMN ultima_conexao TEXT;
-- Preenche a coluna para as linhas já existentes
UPDATE clientes SET ultima_conexao = '2020-01-01' WHERE status = 'inactif';
UPDATE clientes SET ultima_conexao = '2026-10-01' WHERE status = 'actif';
```

| Regra | Motivo |
|---|---|
| Um arquivo por alteração | Uma falha se localiza logo; o arquivo se relê por inteiro |
| Um número no início do nome (`0001`, `0002`) | A ordem de execução é a mesma em todos os computadores e servidores |
| Nunca modificar após a aplicação | Os bancos já migrados não executariam o arquivo de novo: os ambientes divergiriam |
| Uma tabela que registra as migrações executadas | Executar o programa de novo não faz nada; um arquivo novo é identificado sozinho |
| Uma impressão digital por arquivo | Uma alteração posterior é detectada em vez de ignorada |

Uma **impressão digital** (*hash*) é uma sequência curta de caracteres calculada a partir do texto do arquivo; se uma única letra mudar, a impressão digital muda (veja [o hash](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) para o princípio). O programa seguinte, `migrate.php`, aplica todas as migrações que ainda não foram executadas. Ele as envolve em uma **transação**, um grupo de operações que dá certo por inteiro ou é totalmente desfeito (`beginTransaction`, `commit` para confirmar, `rollBack` para desfazer). `PDO` é a interface do PHP para falar com um banco (veja [Pilotar SQL a partir do PHP com PDO](/?c=langages&s=domain-specific-languages-dsl&p=sql)); a função SQL `total_changes()` do SQLite devolve o número de linhas modificadas desde a abertura da conexão, o que serve para contar o efeito de cada arquivo.

```php
<?php
// Uso: php migrate.php [--dry-run]
$simulation = in_array('--dry-run', $argv, true);   // verdadeiro se a opção for dada
$pdo = new PDO('sqlite:app.db');                    // abre (ou cria) o banco
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // erro = exceção

// Tabela que registra as migrações já executadas, com a impressão digital do arquivo
$pdo->exec('CREATE TABLE IF NOT EXISTS migracoes (
    nome TEXT PRIMARY KEY, impressao TEXT NOT NULL, executada_em TEXT NOT NULL)');

// Lê as migrações já executadas: nome => impressão digital
$jouees = $pdo->query('SELECT nome, impressao FROM migracoes')
    ->fetchAll(PDO::FETCH_KEY_PAIR);

$fichiers = glob(__DIR__ . '/migrations/*.sql');    // lista os arquivos
sort($fichiers);                                    // ordem do número: 0001, 0002...

/** Conta todas as linhas modificadas desde a abertura da conexão. */
function lignesModifiees(PDO $pdo): int
{
    return (int) $pdo->query('SELECT total_changes()')->fetchColumn();
}

$pdo->beginTransaction();       // abre a transação: tudo ou nada
try {
    foreach ($fichiers as $fichier) {
        $nom = basename($fichier);
        $sql = file_get_contents($fichier);
        $empreinte = hash('sha256', $sql);
        if (isset($jouees[$nom])) {
            if ($jouees[$nom] !== $empreinte) {     // arquivo modificado depois
                throw new RuntimeException("$nom foi modificado após a aplicação");
            }
            continue;                               // já executada: passa adiante
        }
        $avant = lignesModifiees($pdo);
        $pdo->exec($sql);                           // executa a migração
        $touchees = lignesModifiees($pdo) - $avant; // linhas que ela modificou
        $pdo->prepare('INSERT INTO migracoes VALUES (?, ?, datetime())')
            ->execute([$nom, $empreinte]);          // registra como executada
        echo "$nom : $touchees linha(s)\n";
    }
    if ($simulation) {
        $pdo->rollBack();                           // simulação: desfaz tudo
        echo "Simulação concluída: nada foi gravado.\n";
    } else {
        $pdo->commit();                             // aplicação: confirma tudo
    }
} catch (Throwable $erreur) {
    $pdo->rollBack();                               // a qualquer falha: volta atrás
    fwrite(STDERR, 'Falha: ' . $erreur->getMessage() . "\n");
    exit(1);
}
```

A primeira execução é descrita na seção seguinte. Depois de uma aplicação real, executar o comando de novo não exibe nada, pois os três nomes constam da tabela `migracoes`. Se acrescentarmos uma linha a `0002_normaliser_statuts.sql` depois, o comando falha:

```text
Falha: 0002_normaliser_statuts.sql foi modificado após a aplicação
```

A correção de um erro passa por um arquivo **novo** (`0004_...`), nunca pela reescrita de `0002`. As migrações de dados desse tipo também devem ser **idempotentes** sempre que possível: executá-las de novo por engano não muda nada a mais. O `lower(trim(...))` acima é (pôr em minúsculas o que já está em minúsculas não muda nada); um `UPDATE ... SET preco = preco * 2` não é.

Para um processamento que precisa retomar depois de uma interrupção, veja também [o ponto de controle](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots).

## O modo simulação («dry run»)

O **modo simulação** (*dry run*, «ensaio a seco») executa a migração de verdade, conta o que ela teria modificado, e em seguida **desfaz tudo**. Ele responde à pergunta: « o que aconteceria se eu a executasse? » antes que a resposta se torne irreversível.

Aqui, basta não confirmar a transação: a opção `--dry-run` de `migrate.php` chama `rollBack` no fim, em vez de `commit`. Todas as migrações pendentes rodam na mesma transação, para que a segunda veja as tabelas criadas pela primeira.

```text
$ php migrate.php --dry-run
0001_creer_clients.sql : 5 linha(s)
0002_normaliser_statuts.sql : 5 linha(s)
0003_ajouter_derniere_connexion.sql : 5 linha(s)
Simulação concluída: nada foi gravado.
$ php migrate.php
0001_creer_clients.sql : 5 linha(s)
0002_normaliser_statuts.sql : 5 linha(s)
0003_ajouter_derniere_connexion.sql : 5 linha(s)
```

| Maneira de simular | Princípio | Limite |
|---|---|---|
| Transação desfeita (este exemplo) | Executa-se tudo, depois `rollBack` | Funciona se o banco também desfizer as alterações de estrutura, o que o SQLite faz; outros motores validam certos comandos de estrutura automaticamente |
| Contar antes (`SELECT COUNT(*)` com a mesma condição) | Lê-se o volume visado sem escrever nada | Não prova que a consulta de alteração vai dar certo |
| Cópia do banco | Migra-se uma cópia, não o original | Demora e ocupa espaço em um banco grande |
| Ambiente de teste | Migra-se um banco de pré-produção | Seus dados raramente se parecem com os de produção |

Um detalhe: o número exibido conta as linhas que a consulta **selecionou**, não aquelas cujo valor realmente mudou. Aqui, `0002` anuncia 5 linhas, mas só 3 mudam de valor: duas já estavam em minúsculas. Para saber o que realmente muda, acrescente à condição `WHERE status <> lower(trim(status))`.

## SQL em massa ou registro por registro

Para alterar 20 000 linhas, existem duas abordagens. **Uma por uma**: o programa lê cada linha, calcula o novo valor, depois envia uma consulta por linha. **Em massa**: uma só consulta SQL descreve a alteração e o motor do banco faz o laço sozinho. O programa seguinte mede as duas, mais duas variantes.

```php
<?php
$fichier = __DIR__ . '/bench.db';
@unlink($fichier);                                   // recomeça com um banco vazio
$pdo = new PDO("sqlite:$fichier");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

/** Recria 20 000 clientes com status mal escritos. */
function preparer(PDO $pdo): void
{
    $pdo->exec('DROP TABLE IF EXISTS clientes');
    $pdo->exec('CREATE TABLE clientes (id INTEGER PRIMARY KEY, status TEXT)');
    $pdo->beginTransaction();                        // uma só transação: rápido
    $insertion = $pdo->prepare('INSERT INTO clientes (status) VALUES (?)');
    for ($i = 0; $i < 20000; $i++) {
        $insertion->execute([$i % 2 ? 'Actif ' : 'ACTIF']);
    }
    $pdo->commit();
}

/** Mede a duração de uma ação, em segundos. */
function mesurer(string $titre, callable $action): void
{
    $debut = microtime(true);                        // hora antes da ação
    $action();
    printf("%-34s %6s s\n", $titre, number_format(microtime(true) - $debut, 2, ',', ''));
}

// 1. Uma por uma, cada UPDATE é sua própria transação (valor padrão)
preparer($pdo);
mesurer('uma por uma, sem transação', function () use ($pdo) {
    $maj = $pdo->prepare('UPDATE clientes SET status = ? WHERE id = ?');
    foreach ($pdo->query('SELECT id, status FROM clientes')->fetchAll() as $c) {
        $maj->execute([strtolower(trim($c['status'])), $c['id']]);
    }
});

// 2. Uma por uma, mas todas as gravações em uma só transação
preparer($pdo);
mesurer('uma por uma, uma transação', function () use ($pdo) {
    $pdo->beginTransaction();
    $maj = $pdo->prepare('UPDATE clientes SET status = ? WHERE id = ?');
    foreach ($pdo->query('SELECT id, status FROM clientes')->fetchAll() as $c) {
        $maj->execute([strtolower(trim($c['status'])), $c['id']]);
    }
    $pdo->commit();
});

// 3. Em massa: uma só consulta, o motor faz o laço sozinho
preparer($pdo);
mesurer('uma consulta em massa', function () use ($pdo) {
    $pdo->exec('UPDATE clientes SET status = lower(trim(status))');
});

// 4. Em massa por fatias: uma consulta e uma transação por fatia
preparer($pdo);
mesurer('em massa, fatias de 5 000', function () use ($pdo) {
    $maj = $pdo->prepare(
        'UPDATE clientes SET status = lower(trim(status)) WHERE id > ? AND id <= ?'
    );
    for ($debut = 0; $debut < 20000; $debut += 5000) {
        $maj->execute([$debut, $debut + 5000]);      // uma fatia de identificadores
    }
});
```

Na máquina de teste, o resultado é:

```text
uma por uma, sem transação          48,91 s
uma por uma, uma transação           0,02 s
uma consulta em massa                0,01 s
em massa, fatias de 5 000            0,01 s
```

As durações dependem da máquina e do disco; só a ordem de grandeza importa. Sem transação explícita, cada `UPDATE` é confirmado e força a gravação no disco, 20 000 vezes; é isso que custa, não o cálculo.

| Critério | Uma por uma | Em massa (uma consulta) | Em massa por fatias |
|---|---|---|---|
| Custo | Uma ida e volta com o banco por linha (veja [limitar as idas e vindas](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)) | Uma só ida e volta | Algumas idas e vindas |
| Bloqueio | Curto, mas repetido a cada linha | Longo: a tabela (ou as linhas) fica presa para os outros durante toda a consulta | Curto por fatia; os outros usuários passam entre duas fatias |
| Memória | Todas as linhas lidas na memória do programa, se forem carregadas de uma vez | Quase nula do lado do programa | Pequena e limitada |
| Transação | Uma por linha (padrão): uma falha deixa a metade migrada | Uma só: tudo ou nada | Uma por fatia: uma falha deixa as fatias já confirmadas |
| Caso adequado | Cálculo impossível em SQL (chamada a um serviço, regra complexa) | Alteração expressável em SQL, volume moderado | Volume muito grande, banco em uso durante a migração |

Um **bloqueio** (*lock*) é uma reserva que o banco faz sobre linhas ou uma tabela enquanto as altera: as outras consultas que as tocam esperam. Uma consulta em massa muito longa pode, portanto, travar o site; as fatias do último teste (`WHERE id > ? AND id <= ?`) devolvem o controle entre cada fatia. Uma migração por fatias deve continuar **reiniciável**: se parar na fatia 3, a nova execução não deve refazer as fatias 1 e 2, daí o interesse da idempotência vista acima.

## A salvaguarda antes da exclusão

Excluir é a operação que não se desfaz: um `DELETE` cuja condição é larga demais (ou vazia) apaga tudo. Uma **salvaguarda** é uma verificação que bloqueia a operação quando algo não está certo. Quatro gestos, nesta ordem:

| Gesto | Pergunta feita | Exemplo no programa |
|---|---|---|
| Contar | Quantas linhas a condição visa? | `SELECT COUNT(*)` com a mesma condição do `DELETE` |
| Limitar | Esse volume é plausível? | Recusa acima de `MAXIMUM` (100) linhas por execução |
| Confirmar | O humano espera mesmo esse número? | O número passado como argumento deve igualar o número contado, depois `--confirmar` |
| Salvaguardar | Dá para voltar atrás? | `VACUUM INTO` (comando SQLite que grava uma cópia completa do banco em um novo arquivo) antes da exclusão |

O programa `purge.php` exclui os clientes inativos desde antes de 2021. Sem `--confirmar`, ele permanece em simulação; com a opção, ele faz a cópia de segurança, exclui numa transação e verifica se o número de linhas excluídas é o que havia sido contado.

```php
<?php
// Uso: php purge.php <número esperado> [--confirmar]
$attendu = (int) ($argv[1] ?? -1);                  // número de linhas a excluir
$confirme = in_array('--confirmar', $argv, true);   // sem esta opção: simulação
const MAXIMUM = 100;                                // teto: nunca mais por execução
$pdo = new PDO('sqlite:' . __DIR__ . '/app.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$filtre = "status = 'inactif' AND ultima_conexao < '2021-01-01'";

// 1. Contar: quantas linhas a condição visa?
$nombre = (int) $pdo->query("SELECT COUNT(*) FROM clientes WHERE $filtre")->fetchColumn();
echo "$nombre linha(s) visada(s)\n";

// 2. Limitar: recusar um volume anormal
if ($nombre > MAXIMUM) {
    exit("Recusado: mais de " . MAXIMUM . " linhas.\n");
}
// 3. Confirmar: o número informado pelo humano deve igualar o número contado
if ($nombre !== $attendu) {
    exit("Recusado: $attendu esperada(s), $nombre encontrada(s).\n");
}
if (!$confirme) {
    exit("Simulação: acrescente --confirmar para excluir.\n");
}

// 4. Salvaguardar: cópia completa do banco antes de qualquer exclusão
$copie = __DIR__ . '/copia-' . date('Ymd-His') . '.db';
$pdo->exec("VACUUM INTO '$copie'");
echo "Cópia de segurança: $copie\n";

// 5. Excluir numa transação, verificando o resultado
$pdo->beginTransaction();
$supprimees = $pdo->exec("DELETE FROM clientes WHERE $filtre");
if ($supprimees !== $nombre) {
    $pdo->rollBack();                               // desvio: desfaz tudo
    exit("Cancelado: $supprimees excluída(s) em vez de $nombre.\n");
}
$pdo->commit();
echo "$supprimees linha(s) excluída(s).\n";
```

Quatro chamadas sobre o banco do capítulo (o nome da cópia traz a data e a hora):

```text
$ php purge.php 5
2 linha(s) visada(s)
Recusado: 5 esperada(s), 2 encontrada(s).
$ php purge.php 2
2 linha(s) visada(s)
Simulação: acrescente --confirmar para excluir.
$ php purge.php 2 --confirmar
2 linha(s) visada(s)
Cópia de segurança: /caminho/copia-20261031-111248.db
2 linha(s) excluída(s).
$ php purge.php 2 --confirmar
0 linha(s) visada(s)
Recusado: 2 esperada(s), 0 encontrada(s).
```

A última linha mostra um benefício: executar por engano o mesmo comando de novo não exclui nada a mais, pois a contagem cai para 0 e não corresponde ao que era esperado. Para uma tabela muito volumosa, a cópia completa pode ser pesada demais: copia-se então só as linhas visadas para uma tabela de arquivo (`INSERT INTO arquivo SELECT ... WHERE <mesma condição>`) antes do `DELETE`.

## As armadilhas

| Armadilha | Consequência | Remédio |
|---|---|---|
| Modificar um arquivo de migração já aplicado | As bases já migradas não o executam de novo: os ambientes divergem sem aviso | Escrever uma nova migração; conferir a impressão digital |
| Migrar direto em produção sem simulação | A surpresa (volume, condição errada) aparece quando já é tarde demais | Simular, contar, depois aplicar |
| `UPDATE` ou `DELETE` sem `WHERE` | Todas as linhas da tabela são atingidas | Contar antes; recusar uma condição vazia |
| Um `UPDATE` por linha fora de transação | Muito lento, e uma parada deixa a tabela pela metade migrada | Uma consulta em massa, ou uma transação por fatia |
| Uma única consulta enorme sobre uma tabela muito usada | Bloqueio longo: o site trava | Trabalhar por fatias |
| Migração não idempotente executada de novo por engano | Os valores são alterados duas vezes | Escrever a condição para que atinja só o que ainda falta fazer |
| Excluir sem cópia de segurança | Nenhum retorno possível | Copiar o banco ou arquivar as linhas antes |
| Confundir « linhas selecionadas » e « linhas modificadas » em um relatório | Um relatório que parece falso | Filtrar pelas linhas realmente diferentes |

## Boas práticas

| Prática | Detalhe |
|---|---|
| Um arquivo numerado por alteração | Nunca modificado após a aplicação; um erro se corrige com o arquivo seguinte |
| Registrar cada migração executada | Tabela de controle com nome e impressão digital, como `migracoes` acima |
| Simular antes de aplicar | Transação desfeita, ou cópia do banco, e leitura das contagens |
| Preferir SQL em massa | Fatias para volumes muito grandes; linha por linha só se o SQL não bastar |
| Tudo em transação | Uma falha deixa o banco no estado anterior |
| Salvaguarda antes da exclusão | Contar, limitar, confirmar pelo número esperado, salvaguardar |
| Escrever migrações idempotentes | Uma reexecução acidental não muda nada |

## O que reter

| Conceito | O que reter |
|---|---|
| Migração versionada | Um arquivo numerado por alteração, nunca modificado após a aplicação, uma tabela que registra as migrações executadas |
| Simulação (*dry run*) | Executa-se, conta-se, desfaz-se: a resposta chega antes do irreversível |
| Em massa ou uma por uma | Uma consulta SQL é bem mais rápida; as fatias limitam bloqueio e risco; uma por uma fica para os cálculos fora do SQL |
| Transação | Tudo ou nada: uma falha não deixa metade das linhas migrada |
| Salvaguarda de exclusão | Contar, limitar, confirmar o número, salvaguardar; depois verificar o número excluído |
