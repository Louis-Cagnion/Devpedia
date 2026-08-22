---
order: 2
---

# As variáveis

Para lembrar, [uma variável é uma caixa etiquetada que contém um valor](/?c=bases-de-l-informatique&p=la-variable), o que segue cobre apenas o que é específico do PHP.

## As variáveis clássicas
Para declarar uma variável em PHP, é preciso colocar um `$` antes do nome de sua variável. PHP é fracamente tipado: você não indica o tipo, ele é deduzido automaticamente conforme o valor atribuído.

```php
<?php
    // Inteiro (int)
    $num = 2;

    // Numero de ponto flutuante (float)
    $pi = 3.14;

    // String (string)
    $str = "Hello world";
    $str = 'Hello world';

    // Booleano (bool)
    $bool = false;

    // Valor nulo (null)
    $nulo = null;

    // Array indexado (array)
    $frutas = ["maca", "banana", "cereja"];
    $frutas = array("maca", "banana", "cereja");

    // Array associativo (array)
    $pessoa = ["nome" => "Silva", "idade" => 25];
    $pessoa = array("nome" => "Silva", "idade" => 25);

    // Objeto (object)
    $data = new DateTime();
?>
```

> **Nota:** você pode verificar o tipo de uma variável com a função `var_dump($variavel);` ou `gettype($variavel);`.

Em seguida, para comparar ou manipular suas variáveis entre si, você precisará usar vários operadores diferentes:

```php
<?php
    $num1 = 3;
    $num2 = 6;
    $resultado = 0;

    // *** operadores ***
    //adicao
    $resultado = $num1 + $num2;
    $num1 += $num2;
    //subtracao
    $resultado = $num1 - $num2;
    $num1 -= $num2;
    //multiplicacao
    $resultado = $num1 * $num2;
    $num1 *= $num2;
    //potencia
    $resultado = $num1 ** $num2;
    $num1 **= $num2;
    //divisao
    $resultado = $num1 / $num2;
    $num1 /= $num2;
    //modulo
    $resultado = $num1 % $num2;
    $num1 %= $num2;
    //+1
    ++$resultado;
    $resultado++;
    //-1
    --$resultado;
    $resultado--;


    // *** operadores logicos ***
    //E
    $resultado = $num1 && $num2;
    //OU
    $resultado = $num1 || $num2;
    //OU exclusivo
    $resultado = $num1 xor $num2;
    //negar
    $resultado = !true;

    // *** operadores de comparacao ***
    //iguais
    $resultado = $num1 == $num2;
    //identicos
    $resultado = $num1 === $num2;
    //diferente
    $resultado = $num1 != $num2;
    $resultado = $num1 <> $num2;
    //nao identicos
    $resultado = $num1 !== $num2;
    //menor
    $resultado = $num1 < $num2;
    //maior
    $resultado = $num1 > $num2;
    //menor ou igual
    $resultado = $num1 <= $num2;
    //maior ou igual
    $resultado = $num1 >= $num2;
?>
```

> **Nota:** `==`/`!=` convertem os tipos antes de comparar, o que pode dar resultados surpreendentes conforme os valores comparados (fonte de bugs históricos bem conhecidos em PHP). `===`/`!==` exigem o mesmo tipo E o mesmo valor: preferir sistematicamente, em particular para comparar strings.

Se você quiser concatenar strings, tem 2 métodos:

```php
<?php
    $str1 = "Hello";
    $str2 = "world";

    echo "O tema do dia e: {$str1} {$str2}";
    echo 'O tema do dia e: ' . $str1 . ' ' . $str2;

    //os dois resultados dao "O tema do dia e: Hello world".
?>
```

## As variáveis globais
As variáveis abaixo permitem recuperar os elementos de um formulário conforme seu método de envio (`GET` ou `POST`):

```php
<?php
    $_GET['nome_do_campo'];
    $_POST['nome_do_campo'];

    //nome_do_campo = atributo 'name' nas tags HTML
?>
```

Quando o método `GET` é usado, os dados do formulário ficam visíveis diretamente na URL, na forma de uma *query string* (ex: `?nome=Joao&idade=25`).

O método `POST` é usado principalmente para enviar dados sensíveis (senhas, informações pessoais...), pois eles não são exibidos na URL e não têm limite de tamanho como uma URL pode ter.

> **Nota:** `GET` e `POST` não servem para proteger dados: os dados permanecem visíveis via as ferramentas de desenvolvedor do navegador ou por interceptação de rede se o site não usar HTTPS. Para dados realmente sensíveis (senhas...), também é preciso pensar em criptografia e HTTPS.

## As superglobais

`$_GET` e `$_POST` fazem parte de uma família mais ampla de arrays associativos, chamados **superglobais**, que o PHP preenche automaticamente desde o início da execução, acessíveis de qualquer função ou método, sem precisar importar nada:

| Superglobal | Conteúdo |
|---|---|
| `$_GET` / `$_POST` | Dados enviados por um formulário |
| `$_SERVER` | Informações sobre a requisição e o servidor (URL solicitada, método HTTP...) |
| `$_SESSION` | Dados armazenados do lado do servidor para o usuário atual (exige `session_start()`) |
| `$_COOKIE` | Cookies enviados pelo navegador |

> **Nota:** ao contrário de uma variável clássica (escopo local, invisível em uma função sem repassá-la como parâmetro), as superglobais são visíveis **em todo lugar**, exatamente como uma constante, mas contêm dados que mudam a cada requisição, não configurações fixas.

## Constantes com `define()`

`define('NOME', valor)` cria uma **constante global**, também acessível de qualquer arquivo, função ou método:

```php
<?php
define('TAXA_IMPOSTO', 0.20);

function precoComImposto(float $precoSemImposto): float
{
    return $precoSemImposto * (1 + TAXA_IMPOSTO); // visivel aqui sem importar nada
}
?>
```

> **Nota:** uma `$variavel` clássica, por sua vez, permanece local mesmo que o arquivo que a declara tenha sido carregado com `require`: ela não fica automaticamente visível dentro de uma função ou método definido em outro arquivo. É por isso que os arquivos de configuração frequentemente usam `define()` em vez de simples variáveis: isso garante que a configuração permaneça legível em qualquer lugar do projeto.

## Acessar uma chave de array que não existe

Ler uma chave de array totalmente ausente dispara um **warning** ("Undefined array key"), não um crash, mas um sinal de erro a não ignorar:

```php
<?php
$pessoa = ["nome" => "Silva"];

echo $pessoa["idade"]; // Warning: Undefined array key "idade"
?>
```

`isset()` e `empty()` são construções especiais da linguagem que toleram a ausência total da chave, sem disparar esse warning:

```php
<?php
if (!empty($pessoa["idade"])) {
    echo $pessoa["idade"];
}
// equivalente a: a chave existe E seu valor nao e vazio, nem null, nem false, nem 0...
?>
```

> **Nota:** `empty($x)` retorna `true` se a variável/chave não existir de forma alguma, OU se contiver um valor "vazio" (`''`, `0`, `null`, `false`, array vazio...). Isso é diferente de `array_key_exists()` (veja [As funções e métodos mais úteis](/?c=langages-de-programmation&s=php&p=methodes)), que verifica apenas a existência da chave, mesmo que seu valor seja `null`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma variável PHP se declara com `$`, sem tipo explícito (fracamente tipado). As superglobais (`$_GET`, `$_POST`, `$_SERVER`...) são visíveis em todo lugar, pré-preenchidas pelo PHP. |
| **Ferramentas utilizáveis** | `var_dump`/`gettype` para inspecionar um tipo, `isset()`/`empty()` para testar uma chave sem warning, `define()` para uma constante global. |
| **Armadilhas a evitar** | Comparar com `==` em vez de `===` (conversões de tipo surpreendentes); ler uma chave de array ausente sem `isset()`/`empty()` (dispara um warning). |
| **Boas práticas** | Usar `===`/`!==` por padrão; verificar `isset()`/`empty()` antes de ler uma chave que pode não existir. |
