---
order: 6
---

# As funções e métodos mais úteis

## O que é uma função / método?

Uma **função** é um bloco de código reutilizável, que tem um nome, e que pode receber informações (*parâmetros*) para realizar uma ação ou retornar um resultado (um *valor de retorno*).

```php
<?php
    //função clássica
    function adicao($a, $b) {
        return $a + $b;
    }

    echo adicao(2, 3); // exibe 5

    //função de seta
    $dobro = fn($n) => $n * 2;

    echo $dobro(5); // exibe 10
?>
```
> **Nota:** ao contrário de [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), onde uma função de seta pode ser escrita com chaves e um `return` (`(n) => { return n * 2; }`), PHP só permite a forma curta com uma única expressão, sem chaves nem `return` (`fn($n) => $n * 2;`).

Um **método** é exatamente a mesma coisa que uma função, com uma diferença: ele é definido **dentro de uma classe**, e é usado em um objeto (veja [A programação orientada a objetos](/?c=langages-de-programmation&s=php&p=poo)).

```php
<?php
    class Calculadora {
        public function adicao($a, $b) {
            return $a + $b;
        }
    }

    $calc = new Calculadora();
    echo $calc->adicao(2, 3); // exibe 5
?>
```

Em resumo: **função** = autônoma, chamada diretamente pelo seu nome. **Método** = pertence a um objeto, chamado via `->` (ou `::` para um método estático).

## Tipar os parâmetros e o retorno de uma função

PHP é tipado dinamicamente por padrão, mas aceita anotações de tipo nos parâmetros e no valor de retorno. Ao contrário de uma linguagem compilada, esses tipos não são verificados antes da execução: eles são verificados **na execução**, a cada chamada.

```php
<?php
function calcularDesconto(float $preco, int $porcentagem): float
{
    return $preco - ($preco * $porcentagem / 100);
}

calcularDesconto(100, 10);     // OK -> 90.0
calcularDesconto("cem", 10);   // TypeError: "cem" não é um float
?>
```

## Tipos anuláveis (`?Tipo`)

Uma função declarada `: array` (sem `?`) **não** permite `null` como valor de retorno: tentar isso provoca um `TypeError` na execução. Para permitir explicitamente `null` além do tipo declarado, prefixa-se o tipo com um `?`:

```php
<?php
function encontrarUsuario(int $id): ?array
{
    if ($id <= 0) {
        return null; // OK: ?array permite explicitamente null
    }
    return ['id' => $id, 'nome' => 'Silva'];
}
?>
```

> **Nota:** `?array` é uma declaração de contrato, não apenas um hábito de escrita: é o equivalente PHP de [`std::optional<T>`](https://en.cppreference.com/w/cpp/utility/optional) em [C++](/?c=langages-de-programmation&s=cpp&p=cpp) moderno ou de [`Optional[T]`](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) em [Python](/?c=langages-de-programmation&s=python&p=python): a função pode retornar esse tipo preciso, OU `null`, nada mais.

## Funções anônimas: capturar uma variável com `use`

Uma **função anônima** (também chamada de *closure*) é uma função sem nome: você a guarda em uma variável ou a passa diretamente para outra função. Ela **não** enxerga as variáveis do código ao redor. Para usar uma delas, é preciso listá-la em `use (...)`, de uma destas duas formas:

| Escrita | O que a função recebe | Se a função a modifica... |
|---|---|---|
| `function () use ($x)` | uma **cópia** de `$x`, feita no momento em que a função é criada | só a cópia muda |
| `function () use (&$x)` | a própria variável `$x` (uma *referência*) | `$x` muda também do lado de fora |
| `fn() => ...` (arrow function, ver acima) | uma cópia automática de cada variável usada | impossível: uma única expressão, nenhuma instrução |

Analogia: `use ($x)` entrega uma fotocópia de um documento (dá para rabiscar nela, o original fica intacto); `use (&$x)` empresta o próprio original.

```php
<?php
$contador = 0;

$porValor = function () use ($contador) {       // recebe uma cópia de $contador (0)
    $contador++;                                 // incrementa só a cópia
    return $contador;                            // devolve a cópia: 1
};

$porReferencia = function () use (&$contador) { // recebe a verdadeira variável $contador
    $contador++;                                 // incrementa o original
    return $contador;
};

echo $porValor(), " ", $contador, "\n";       // exibe "1 0": o original não mudou
echo $porReferencia(), " ", $contador, "\n";  // exibe "1 1"
echo $porReferencia(), " ", $contador, "\n";  // exibe "2 2"
?>
```

**Armadilha: a cópia é feita quando a função é criada, não quando é chamada.**

```php
<?php
$x = 10;
$ler = function () use ($x) { return $x; };   // cópia de $x feita AQUI, vale 10
$x = 99;                                      // tarde demais: a cópia não acompanha
echo $ler();                                  // exibe 10, não 99
?>
```

O mesmo `&` serve também para um **parâmetro**: sem ele, uma função recebe uma cópia do que lhe é passado (até um array); com ele, modifica diretamente a variável de quem chama.

```php
<?php
function adicionarUm(array &$arr): void {  // &: a função recebe o array de quem chama
    $arr[] = 1;                            // adiciona um elemento a ESSE array
}

$lista = [];
adicionarUm($lista);
echo count($lista);                        // exibe 1 (sem o &, exibiria 0)
?>
```

### O tipo `callable`: aceitar "algo que pode ser chamado"

Um parâmetro tipado `callable` aceita qualquer valor que o PHP saiba chamar como uma função:

| Valor passado | Exemplo |
|---|---|
| Função anônima ou arrow function | `fn($n) => $n * 2` |
| Nome de uma função, como string | `'abs'` |
| Método estático de uma classe | `['Calculadora', 'dobro']` |
| Método de um objeto | `[$calculadora, 'triplo']` |

```php
<?php
function aplicar(callable $acao, int $n): int {
    return $acao($n);                         // chama o que recebeu, com $n
}

echo aplicar(fn($n) => $n * 2, 4);            // exibe 8
echo aplicar('abs', -3);                      // exibe 3 (valor absoluto)
aplicar('funcao_inexistente', 1);             // TypeError: essa string não é chamável
// ArgumentCountError, lançada DENTRO de aplicar()
aplicar(fn($a, $b) => $a + $b, 1);
?>
```

> **Nota:** o PHP só verifica que o valor é chamável quando ele entra em `aplicar()`. Ele **não** verifica quantos parâmetros a função espera nem seus tipos: uma função que quer dois só falha quando `aplicar()` a chama com um (ver [As exceções](/?c=langages&s=php&p=exceptions) para `TypeError` e `ArgumentCountError`).

Um uso comum: uma função que prepara algo, deixa uma função recebida como parâmetro fazer seu trabalho e depois termina de forma limpa. A seção seguinte dá um exemplo completo.

## Travar um arquivo compartilhado entre requisições: `flock()`

Um servidor PHP trata várias requisições **ao mesmo tempo**, cada uma em seu próprio processo (ver [PHP-FPM](/?c=langages&s=php&p=php-fpm)). Se duas requisições leem e depois reescrevem o mesmo arquivo (por exemplo um pequeno arquivo JSON usado como mini banco de dados), uma pode apagar a alteração da outra:

```
Requisição A                       Requisição B
lê visitas = 5
                                   lê visitas = 5
escreve visitas = 6
                                   escreve visitas = 6   <- a visita de A se perde
```

É o mesmo problema que entre duas threads que compartilham uma variável (ver [Memória compartilhada](/?c=langages&s=c&p=threads#memoria-compartilhada-uma-vantagem-e-um-perigo)). A solução: **uma trava**. `flock()` coloca uma trava em um arquivo já aberto com `fopen()`, e só uma requisição por vez pode segurá-la.

| Chamada | Efeito |
|---|---|
| `flock($arquivo, LOCK_EX)` | trava **exclusiva**: espera até ninguém mais segurar a trava e então a pega |
| `flock($arquivo, LOCK_SH)` | trava **compartilhada**: vários leitores ao mesmo tempo, mas nenhuma trava exclusiva enquanto isso |
| `flock($arquivo, LOCK_EX \| LOCK_NB)` | como `LOCK_EX`, mas não espera: devolve `false` se a trava já estiver pega |
| `flock($arquivo, LOCK_UN)` | libera a trava |

O padrão completo, que combina `flock()` com as funções anônimas da seção anterior:

```php
<?php
// Abre o arquivo, trava, deixa $modificar alterar os dados e depois os reescreve.
function comStoreCompartilhado(string $caminho, callable $modificar): void
{
    // leitura/escrita, criado se não existir, nunca esvaziado
    $arquivo = fopen($caminho, 'c+');
    flock($arquivo, LOCK_EX);                  // espera a sua vez
    $conteudo = stream_get_contents($arquivo); // lê o arquivo inteiro
    $dados = $conteudo === '' ? [] : json_decode($conteudo, true);
    $modificar($dados);                        // a função recebida modifica $dados
    ftruncate($arquivo, 0);                    // esvazia o arquivo...
    rewind($arquivo);                          // ...volta ao início...
    fwrite($arquivo, json_encode($dados));     // ...e escreve a nova versão
    fflush($arquivo);                          // tudo é escrito ANTES de liberar a trava
    flock($arquivo, LOCK_UN);                  // a próxima requisição pode passar
    fclose($arquivo);
}

$antes = null;
comStoreCompartilhado('store.json', function (array &$d) use (&$antes) {
    $antes = $d['visitas'] ?? 0;               // use (&$antes): o valor sai da função
    $d['visitas'] = $antes + 1;                // &$d: a alteração é mantida e reescrita
});
echo $antes;                                   // número de visitas antes desta
?>
```

Resultado medido com PHP 8.3: 4 processos iniciados ao mesmo tempo, cada um adicionando 300 visitas ao mesmo arquivo:

| Versão | Visitas contadas no fim (esperado: 1.200) |
|---|---|
| Sem `flock()` | 16 |
| Com `flock()` | 1.200 |

Duas sutilezas:

| Armadilha | Por quê |
|---|---|
| Abrir com `'w'` em vez de `'c+'` | `'w'` esvazia o arquivo **assim que é aberto**, ou seja, antes de ter a trava: outra requisição pode ler um arquivo vazio nesse meio-tempo. |
| Achar que a trava protege contra tudo | `flock()` é uma trava **consultiva** (*advisory lock*): só bloqueia o código que também chama `flock()` nesse arquivo. Um `file_put_contents()` sem trava escreve mesmo assim. |

> **Nota:** o mesmo mecanismo existe na linha de comando para impedir que duas execuções de um mesmo script se sobreponham (ver [Evitar execuções concorrentes com `flock`](/?c=langages&s=bash&p=automatisation-cron#evitar-execucoes-concorrentes-com-flock)). Para muitas escritas simultâneas, um banco de dados de verdade continua mais adequado que um arquivo travado: cada requisição espera a sua vez, o que deixa tudo mais lento assim que o tráfego aumenta.

## Suprimir um warning esperado com `@`

Muitas funções nativas do PHP retornam `false` em caso de falha em vez de lançar uma exceção (um estilo próximo do [C](/?c=langages-de-programmation&s=c&p=c), onde `fopen()` retorna um ponteiro nulo e define `errno`). Quando essa falha já é prevista e tratada pelo resto do código, o operador `@` colocado antes da chamada suprime o warning que o PHP emitiria de outra forma:

```php
<?php
$mtime = @filemtime('arquivo_que_pode_nao_existir.txt');
$versao = $mtime ? "v{$mtime}" : 'v-desconhecida';
?>
```

> **Nota:** `@` esconde o warning, mas não muda nada no comportamento da própria função (`filemtime()` continua retornando `false` se o arquivo não existir). Reservar para os casos em que a falha é realmente antecipada e testada logo depois: usá-lo em todo lugar também esconderia erros reais.

PHP fornece uma enorme quantidade de funções nativas já prontas para uso, classificadas abaixo por categoria.

## Funções para strings

```php
<?php
    strlen("Hello");                 // 5 -> comprimento da string
    strtoupper("Hello");             // "HELLO" -> coloca em maiúsculas
    strtolower("Hello");             // "hello" -> coloca em minúsculas
    str_replace("a", "o", "Hello");  // "Hello" -> substitui uma substring
    trim("  Hello  ");               // "Hello" -> remove os espaços no início/fim
    substr("Hello", 1, 3);           // "ell" -> extrai uma parte da string
    explode(",", "a,b,c");           // ["a", "b", "c"] -> divide uma string em array
    implode(",", ["a", "b"]);        // "a,b" -> junta um array em uma string
    str_contains("Hello", "ell");    // true -> verifica se uma string contém outra
?>
```

## Funções para arrays (`array`)

```php
<?php
    count([1, 2, 3]);                      // 3 -> número de elementos
    // adiciona um elemento ao final (preferido a array_push() para um único elemento)
    $arr[] = "valor";
    array_pop($arr);                       // remove e retorna o último elemento
    array_merge($arr1, $arr2);             // mescla dois arrays
    in_array("maca", $frutas);             // true/false -> verifica a presença de um valor
    array_search("maca", $frutas);         // retorna a chave/índice encontrado
    sort($arr);                            // ordena um array (valores)
    array_map(fn($n) => $n * 2, $arr);     // aplica uma função a cada elemento
    array_filter($arr, fn($n) => $n > 0);  // filtra os elementos segundo uma condição
?>
```
## Funções para arrays associativos

```php
<?php
    $pessoa = ["nome" => "Silva", "idade" => 25];

    array_keys($pessoa);               // ["nome", "idade"] -> retorna todas as chaves
    array_values($pessoa);             // ["Silva", 25] -> retorna todos os valores
    array_key_exists("nome", $pessoa);  // true/false -> verifica que uma chave existe
    unset($pessoa["idade"]);            // remove uma chave (e seu valor) do array
    ksort($pessoa);                    // ordena o array pelas chaves
    asort($pessoa);                    // ordena o array pelos valores (mantendo as chaves)
    // ["a" => 1, "b" => 2] -> cria um array associativo a partir de 2 arrays
    array_combine(["a", "b"], [1, 2]);
    array_flip($pessoa);               // inverte chaves e valores
?>
```

> **Nota:** `array_key_exists()` verifica que uma chave existe, mesmo que seu valor seja `null`. `isset($pessoa["nome"])` retorna `false` nesse caso, pois também verifica que o valor não é `null`.
exemplo:
```php
<?php
    $pessoa = ["nome" => "Silva", "idade" => null];

    array_key_exists("idade", $pessoa);  // true
    isset($pessoa["idade"]);             // false
?>
```

## Funções matemáticas

```php
<?php
    abs(-5);          // 5 -> valor absoluto
    round(3.456, 2);  // 3.46 -> arredonda
    rand(1, 10);      // gera um número aleatorio entre 1 e 10
    max(1, 5, 3);     // 5 -> valor máximo
    min(1, 5, 3);     // 1 -> valor mínimo
?>
```

## Funções de verificação de tipo

```php
<?php
    is_string($var);  // true/false
    is_int($var);     // true/false
    is_array($var);   // true/false
    is_null($var);    // true/false
    empty($var);      // true se vazio, null, ou não definido
    isset($var);      // true se a variável existe e não é null
?>
```

> **Nota:** você encontrará a lista completa das funções nativas do PHP na documentação oficial: [php.net/manual/pt_BR/funcref.php](https://www.php.net/manual/pt_BR/funcref.php). Para adicionar um **único** elemento, `$arr[] = "valor";` também é preferido a `array_push($arr, "valor")`: mesmo resultado, sem o custo de uma chamada de função: `array_push()` só se torna realmente útil para adicionar vários elementos em uma única chamada (`array_push($arr, "a", "b", "c")`).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma função é um bloco de código reutilizável; um método é uma função definida em uma classe, chamada via `->`/`::`. PHP verifica os tipos anotados na execução, não na compilação. Uma função anônima só enxerga as variáveis listadas em `use`: uma cópia com `use ($x)`, a variável original com `use (&$x)`. |
| **Ferramentas utilizáveis** | Funções nativas para strings, arrays, arrays associativos, matemática, verificação de tipo; `?Tipo` para um tipo anulável; `use`, `&` e `callable` para as funções anônimas; `fopen(..., 'c+')` e `flock()` para um arquivo compartilhado. |
| **Armadilhas a evitar** | Usar `@` para esconder sistematicamente os warnings: reservar para falhas realmente antecipadas e testadas logo depois. Achar que `use ($x)` acompanha as mudanças de `$x` (a cópia é feita na criação). Abrir um arquivo compartilhado com `'w'`, que o esvazia antes mesmo de ter a trava. |
| **Boas práticas** | Tipar os parâmetros e o retorno de uma função sempre que possível; usar `$arr[] = valor` em vez de `array_push()` para um único elemento; travar (`LOCK_EX`) todo arquivo lido e depois reescrito por várias requisições, e chamar `fflush()` antes de liberar a trava. |
