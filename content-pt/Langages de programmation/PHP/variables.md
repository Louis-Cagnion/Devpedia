---
order: 2
---

# As variáveis

## As variáveis clássicas
Para declarar uma variável em PHP, é necessário colocar um «`$`» antes do nome da variável. O PHP é uma linguagem de tipagem fraca: não é necessário indicar o tipo, pois este é deduzido automaticamente com base no valor atribuído.

```php
<?php
    // Número inteiro (int)
    $nb = 2;

    // Número de vírgula flutuante (float)
    $pi = 3.14;

    // Cadeia de caracteres (string)
    $str = "Hello world";
    $str = 'Hello world';

    // Booleano (bool)
    $bool = false;

    // Valor nulo (null)
    $null = null;

    // Matriz (array)
    $frutas = ["pomme", "banane", "cerise"];
    $frutas = array("pomme", "banane", "cerise");

    // Matriz (array)
    $pessoa = ["nom" => "Dupont", "age" => 25];
    $pessoa = array("nom" => "Dupont", "age" => 25);

    // Objeto (object)
    $date = new DateTime();
?>
```

> **Nota:** pode verificar o tipo de uma variável com a função `var_dump($variable);` ou `gettype($variable);`.

Em seguida, para comparar ou manipular as suas variáveis entre si, terá de utilizar vários operadores diferentes:

```php
<?php
    $nb1 = 3;
    $nb2 = 6;
    $result = 0;

    // *** operadores ***
    // adição
    $result = $nb1 + $nb2;
    $nb1 += $nb2;
    // subtração
    $result = $nb1 - $nb2;
    $nb1 -= $nb2;
    // multiplicação
    $result = $nb1 * $nb2;
    $nb1 *= $nb2;
    // potência
    $result = $nb1 ** $nb2;
    $nb1 **= $nb2;
    // divisão
    $result = $nb1 / $nb2;
    $nb1 /= $nb2;
    // modulo
    $result = $nb1 % $nb2;
    $nb1 %= $nb2;
    // +1
    ++$result;
    $result++;
    // -1
    --$result;
    $result--;


    // *** operadores lógicos ***
    // E
    $result = $nb1 && $nb2;
    // OU
    $result = $nb1 || $nb2;
    // OU exclusivo
    $result = $nb1 xor $nb2;
    // opor
    $result = !true;

    // *** operadores de comparação ***
    // iguais
    $result = $nb1 == $nb2;
    // idênticos
    $result = $nb1 === $nb2;
    // diferente
    $result = $nb1 != $nb2;
    $result = $nb1 <> $nb2;
    // não idênticos
    $result = $nb1 !== $nb2;
    // inferior
    $result = $nb1 < $nb2;
    // superior
    $result = $nb1 > $nb2;
    // menor ou igual a
    $result = $nb1 <= $nb2;
    // maior ou igual a
    $result = $nb1 >= $nb2;
?>
```

> **Nota:** `==` / `!=` convertem os tipos antes de comparar, o que pode dar origem a resultados surpreendentes, dependendo dos valores comparados (fonte de erros históricos bem conhecidos em PHP). `===` / `!==` exigem o mesmo tipo E o mesmo valor — a utilizar sistematicamente, em particular para comparar cadeias de caracteres.

Se pretender concatenar cadeias de caracteres, tem à sua disposição dois métodos:

```php
<?php
    $str1 = "Hello";
    $str2 = "world";

    echo "Le thème du jour est : {$str1} {$str2}";
    echo 'Le thème du jour est : ' . $str1 . ' ' . $str2;

    // Ambos os resultados dão «O tema do dia é: Hello world».
?>
```

## As variáveis globais
As variáveis abaixo permitem recuperar os elementos de um formulário consoante o seu método de envio (`GET` ou `POST`):

```php
<?php
    $_GET['nom_du_champ'];
    $_POST['nom_du_champ'];

    // nome_do_campo = atributo «name» nas tags HTML
?>
```

Quando se utiliza o método `GET`, os dados do formulário ficam visíveis diretamente no URL, sob a forma de *uma cadeia de consulta* (por exemplo: `?nome=Jean&idade=25`).

O método `POST` é mais frequentemente utilizado para enviar dados sensíveis (palavras-passe, informações pessoais...), uma vez que estes não são exibidos na URL e não estão sujeitos a limitações de tamanho, ao contrário do que acontece com uma URL.

> **Nota:** `GET` e `POST` não servem para proteger dados — os dados continuam visíveis através das ferramentas de desenvolvimento do navegador ou por interceção de rede, caso o site não utilize HTTPS. Para dados verdadeiramente sensíveis (palavras-passe...), é necessário ter também em conta a encriptação e o HTTPS.

## As variáveis superglobais

`$_GET` e `$_POST` fazem parte de uma família mais ampla de tabelas associativas, denominadas **«superglobais»**, que o PHP preenche automaticamente logo no início da execução — acessíveis a partir de qualquer função ou método, sem necessidade de importar nada:

| Superglobale | Conteúdo |
|---|---|
| `$_GET` / `$_POST` | Dados enviados por um formulário |
| `$_SERVER` | Informações sobre o pedido e o servidor (URL solicitada, método HTTP...) |
| `$_SESSION` | Dados armazenados no servidor para o utilizador atual (requer o `session_start()`) |
| `$_COOKIE` | Cookies enviados pelo navegador |

> **Nota:** ao contrário de uma variável clássica (de âmbito local, invisível numa função se não for passada como parâmetro), as superglobais são visíveis **em todo o lado**, tal como uma constante — mas contêm dados que mudam a cada pedido, e não configurações fixas.

## Constantes com o «`define()`»

`define('NOME', valor)` Cria uma **constante global**, também acessível a partir de qualquer ficheiro, função ou método:

```php
<?php
define('TVA_TAUX', 0.20);

function prixTTC(float $prixHT): float
{
    return $prixHT * (1 + TVA_TAUX); // disponível aqui sem necessidade de importar nada
}
?>
```

> **Nota:** uma «`$variable`» clássica, por sua vez, permanece local, mesmo que o ficheiro que a declara tenha sido carregado com «`require`» — não é automaticamente visível no interior de uma função ou de um método definido noutro ficheiro. É por isso que os ficheiros de configuração utilizam frequentemente `define()` em vez de simples variáveis: isso garante que a configuração permaneça legível em todo o projeto.

## Aceder a uma chave de tabela que não existe

A leitura de uma chave de matriz que não existe desencadeia um **aviso** («Undefined array key») — não é uma falha do sistema, mas sim um sinal de erro que não deve ser ignorado:

```php
<?php
$pessoa = ["nom" => "Dupont"];

echo $pessoa["age"]; // Aviso: Chave de matriz «age» não definida
?>
```

`isset()` e `empty()` são construções especiais da linguagem que toleram a ausência total da chave, sem ativar este aviso:

```php
<?php
if (!empty($pessoa["age"])) {
    echo $pessoa["age"];
}
// equivalente a: a chave existe E o seu valor não é vazio, nem nulo, nem falso, nem 0...
?>
```

> **Nota:** `empty($x)` devolve `true` se a variável/chave não existir de todo, OU se contiver um valor «vazio» (`''`, `0`, `null`, `false`, tabela vazia...). Isto difere de `array_key_exists()` (ver capítulo sobre funções), que verifica apenas a existência da chave, mesmo que o seu valor seja `null`.
