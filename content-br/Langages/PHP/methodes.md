---
order: 6
---

# As funções e métodos mais úteis

## O que é uma função / método?

Uma **função** é um bloco de código reutilizável, que tem um nome, e que pode receber informações (*parâmetros*) para realizar uma ação ou retornar um resultado (um *valor de retorno*).

```php
<?php
    //funcao classica
    function adicao($a, $b) {
        return $a + $b;
    }

    echo adicao(2, 3); // exibe 5

    //funcao de seta
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
calcularDesconto("cem", 10);   // TypeError: "cem" nao e um float
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
    strtoupper("Hello");             // "HELLO" -> coloca em maiusculas
    strtolower("Hello");             // "hello" -> coloca em minusculas
    str_replace("a", "o", "Hello");  // "Hello" -> substitui uma substring
    trim("  Hello  ");               // "Hello" -> remove os espacos no inicio/fim
    substr("Hello", 1, 3);           // "ell" -> extrai uma parte da string
    explode(",", "a,b,c");           // ["a", "b", "c"] -> divide uma string em array
    implode(",", ["a", "b"]);        // "a,b" -> junta um array em uma string
    str_contains("Hello", "ell");    // true -> verifica se uma string contem outra
?>
```

## Funções para arrays (`array`)

```php
<?php
    count([1, 2, 3]);                      // 3 -> numero de elementos
    $arr[] = "valor";                      // adiciona um elemento ao final (preferido a array_push() para um unico elemento)
    array_pop($arr);                       // remove e retorna o ultimo elemento
    array_merge($arr1, $arr2);             // mescla dois arrays
    in_array("maca", $frutas);             // true/false -> verifica a presenca de um valor
    array_search("maca", $frutas);         // retorna a chave/indice encontrado
    sort($arr);                            // ordena um array (valores)
    array_map(fn($n) => $n * 2, $arr);     // aplica uma funcao a cada elemento
    array_filter($arr, fn($n) => $n > 0);  // filtra os elementos segundo uma condicao
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
    array_combine(["a", "b"], [1, 2]);   // ["a" => 1, "b" => 2] -> cria um array associativo a partir de 2 arrays
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
    rand(1, 10);      // gera um numero aleatorio entre 1 e 10
    max(1, 5, 3);     // 5 -> valor maximo
    min(1, 5, 3);     // 1 -> valor minimo
?>
```

## Funções de verificação de tipo

```php
<?php
    is_string($var);  // true/false
    is_int($var);     // true/false
    is_array($var);   // true/false
    is_null($var);    // true/false
    empty($var);      // true se vazio, null, ou nao definido
    isset($var);      // true se a variavel existe e nao e null
?>
```

> **Nota:** você encontrará a lista completa das funções nativas do PHP na documentação oficial: [php.net/manual/pt_BR/funcref.php](https://www.php.net/manual/pt_BR/funcref.php). Para adicionar um **único** elemento, `$arr[] = "valor";` também é preferido a `array_push($arr, "valor")`: mesmo resultado, sem o custo de uma chamada de função: `array_push()` só se torna realmente útil para adicionar vários elementos em uma única chamada (`array_push($arr, "a", "b", "c")`).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma função é um bloco de código reutilizável; um método é uma função definida em uma classe, chamada via `->`/`::`. PHP verifica os tipos anotados na execução, não na compilação. |
| **Ferramentas utilizáveis** | Funções nativas para strings, arrays, arrays associativos, matemática, verificação de tipo; `?Tipo` para um tipo anulável. |
| **Armadilhas a evitar** | Usar `@` para esconder sistematicamente os warnings: reservar para falhas realmente antecipadas e testadas logo depois. |
| **Boas práticas** | Tipar os parâmetros e o retorno de uma função sempre que possível; usar `$arr[] = valor` em vez de `array_push()` para um único elemento. |
