---
order: 6
---

# As funções e métodos mais úteis

## O que é uma função/método?

Uma **função** é um bloco de código reutilizável, que tem um nome e que pode receber informações (*parâmetros*) para realizar uma ação ou devolver um resultado (um *valor de retorno*).

```php
<?php
    // função clássica
    function addition($a, $b) {
        return $a + $b;
    }

    echo addition(2, 3); // página 5

    // função com seta
    $double = fn($n) => $n * 2;

    echo $double(5); // página 10
?>
```
> **Nota:** ao contrário do JavaScript, onde uma função com seta pode ser escrita com chaves e um «`return`» (`(n) => { return n * 2; }`), o PHP só permite a forma curta com uma única expressão, sem chaves nem «`return`» (`fn($n) => $n * 2;`).

Um **método** é exatamente o mesmo que uma função, com uma única diferença: é definido **no interior de uma classe** e é utilizado num objeto (ver os capítulos sobre classes e programação orientada para objetos).

```php
<?php
    class Calculatrice {
        public function addition($a, $b) {
            return $a + $b;
        }
    }

    $calc = new Calculatrice();
    echo $calc->addition(2, 3); // página 5
?>
```

Em resumo: **função** = autónoma, chamada diretamente pelo seu nome. **Método** = pertence a um objeto, chamado através de `->` (ou `::` no caso de um método estático).

## Definir os tipos dos parâmetros e do valor de retorno de uma função

O PHP é dinamicamente tipado por predefinição, mas aceita anotações de tipo nos parâmetros e no valor de retorno. Ao contrário de uma linguagem compilada, estes tipos não são verificados antes da execução: são verificados **durante a execução**, em cada chamada.

```php
<?php
function calculerRemise(float $preço, int $pourcentage): float
{
    return $preço - ($preço * $pourcentage / 100);
}

calculerRemise(100, 10);      // OK -> 90,0
calculerRemise("cent", 10);   // TypeError: «cent» não é um número real
?>
```

## Tipos nulos (`?Type`)

Uma função declarada como «`: array`» (sem «`?`») **não** permite «`null`» como valor de retorno — tentar fazê-lo provoca um «`TypeError`» durante a execução. Para permitir explicitamente «`null`» além do tipo declarado, deve-se prefixar o tipo com «`?`»:

```php
<?php
function trouverUtilisateur(int $id): ?array
{
    if ($id <= 0) {
        return null; // OK: ?array permite explicitamente o valor nulo
    }
    return ['id' => $id, 'nom' => 'Dupont'];
}
?>
```

> **Nota:** «`?array`» é uma declaração de contrato, não uma mera convenção de escrita — é o equivalente em PHP a «`std::optional<T>`» no C++ moderno ou a «`Optional[T]`» em Python: a função pode devolver este tipo específico, OU «`null`», e nada mais.

## Eliminar um aviso esperado com «`@`»

Muitas funções nativas do PHP devolvem `false` em caso de falha, em vez de lançarem uma exceção (um estilo semelhante ao da linguagem C, onde `fopen()` devolve um ponteiro nulo e define `errno`). Quando essa falha já está prevista e é gerida pelo código subsequente, o operador `@` colocado antes da chamada suprime o aviso que o PHP emitiria caso contrário:

```php
<?php
$mtime = @filemtime('fichier_qui_peut_ne_pas_exister.txt');
$version = $mtime ? "v{$mtime}" : 'v-inconnue';
?>
```

> **Nota:** `@` oculta o aviso, mas não altera o comportamento da própria função (o `filemtime()` continua a devolver `false` se o ficheiro não existir). Deve ser utilizado apenas nos casos em que a falha é realmente prevista e testada imediatamente a seguir — utilizá-lo em todas as situações também ocultaria erros reais.

O PHP disponibiliza uma grande variedade de funções nativas prontas a utilizar, classificadas abaixo por categoria.

## Funções sobre cadeias de caracteres

```php
<?php
    strlen("Hello");           // 5 -> comprimento da cadeia
    strtoupper("Hello");       // «HELLO» -> coloca em maiúsculas
    strtolower("Hello");       // «hello» -> converte para minúsculas
    str_replace("a", "o", "Hello"); // «Hello» -> substitui uma subcadeia
    trim("  Hello  ");         // «Hello» -> remove os espaços no início e no fim
    substr("Hello", 1, 3);     // «ell» -> extrai uma parte de uma cadeia de caracteres
    explode(",", "a,b,c");     // ["a", "b", "c"] -> divide uma cadeia de caracteres numa matriz
    implode(",", ["a", "b"]);  // "a,b" -> agrupa uma matriz numa cadeia
    str_contains("Hello", "ell"); // true -> verifica se uma cadeia de caracteres contém outra
?>
```

## Funções sobre tabelas (`array`)

```php
<?php
    count([1, 2, 3]);                  // 3 -> número de elementos
    $tab[] = "valeur";                  // Adiciona um elemento ao final (preferível a `array_push()` para um único elemento)
    array_pop($tab);                   // retira e devolve o último elemento
    array_merge($tab1, $tab2);         // combina duas tabelas
    in_array("pomme", $frutas);        // true/false -> verifica a existência de um valor
    array_search("pomme", $frutas);    // retorna a chave/o índice encontrado
    sort($tab);                        // ordena um array (valores)
    array_map(fn($n) => $n * 2, $tab); // aplica uma função a cada elemento
    array_filter($tab, fn($n) => $n > 0); // filtra os elementos de acordo com uma condição
?>
```
## Funções sobre tabelas associativas

```php
<?php
    $pessoa = ["nom" => "Dupont", "age" => 25];

    array_keys($pessoa);             // ["nome", "idade"] -> devolve todas as chaves
    array_values($pessoa);           // ["Dupont", 25] -> devolve todos os valores
    array_key_exists("nom", $pessoa); // true/false -> verifica se uma chave existe
    unset($pessoa["age"]);            // retira uma chave (e o seu valor) da tabela
    ksort($pessoa);                   // ordena a matriz de acordo com as chaves
    asort($pessoa);                   // ordena o tabuleiro de acordo com os valores (mantendo as chaves)
    array_combine(["a", "b"], [1, 2]);  // ["a" => 1, "b" => 2] -> cria um tabuleiro associativo a partir de dois tabuleiros
    array_flip($pessoa);              // inversão de chaves e valores
?>
```

> **Nota:** `array_key_exists()` verifica se uma chave existe, mesmo que o seu valor seja `null`. `isset($pessoa["nome"])` devolve `false` neste caso, pois verifica adicionalmente se o valor não é `null`.
ex.:
```php
<?php
    $pessoa = ["nom" => "Dupont", "age" => null];

    array_key_exists("age", $pessoa); // true
    isset($pessoa["age"]);             // false
?>
```

## Funções matemáticas

```php
<?php
    abs(-5);        // 5 -> valor absoluto
    round(3.456, 2); // 3,46 -> arredonda
    rand(1, 10);     // gera um número aleatório entre 1 e 10
    max(1, 5, 3);    // 5 -> valor máximo
    min(1, 5, 3);    // 1 -> valor mínimo
?>
```

## Funções de verificação de tipos

```php
<?php
    is_string($var);  // verdadeiro/falso
    is_int($var);      // verdadeiro/falso
    is_array($var);    // verdadeiro/falso
    is_null($var);     // verdadeiro/falso
    empty($var);       // true se estiver vazio, for nulo ou não estiver definido
    isset($var);        // true se a variável existir e não for nula
?>
```

> **Nota:** encontrará a lista completa das funções nativas do PHP na documentação oficial: [php.net/manual/fr/funcref.php](https://www.php.net/manual/fr/funcref.php). Para adicionar um **único** elemento, «`$tab[] = "valor";`» é também preferível a «`array_push($tab, "valor")`»: o resultado é o mesmo, sem o custo de uma chamada de função — «`array_push()`» só se torna realmente útil para adicionar vários elementos numa única chamada (`array_push($tab, "a", "b", "c")`).
