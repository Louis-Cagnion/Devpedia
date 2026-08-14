---
order: 12
---

# Roteamento sem framework (front controller)

Sem um framework (Laravel, Symfony...), o PHP não fornece nenhum router integrado comparável ao Express (`app.get('/caminho', callback)`). Um projeto em «PHP puro» tem de organizar por si próprio a correspondência entre uma URL solicitada e o código a executar.

## O controlador frontal e a tabela de distribuição

Um padrão comum consiste em fazer com que **todas** as solicitações passem por um único ponto de entrada (muitas vezes `índice.php`), que consulta uma tabela associativa «rota → arquivo»:

```php
<?php
$routes = [
    'accueil' => '/pages/accueil.php',
    'contact' => '/pages/contact.php',
];

$uri  = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$file = $routes[$uri] ?? null;

if ($file && file_exists(__DIR__ . $file)) {
    require __DIR__ . $file; // O «handler» é um arquivo executável, não uma função chamada
} else {
    http_response_code(404);
    echo "Page introuvable";
}
?>
```

Principal diferença em relação a um router JS (Express): cada rota aponta para um **caminho de arquivo**, e não para uma função. Não há qualquer callback a ser chamado: o próprio arquivo gera a resposta HTTP (`echo`, `header()`...) ao ler diretamente as superglobais.

- `$_SERVER['REQUEST_URI']` contém o caminho **e** a string de consulta colados (`/contact?ref=pub`). `parse_url(..., PHP_URL_PATH)` extrai apenas o caminho, descartando a string de consulta.
- `trim(..., '/')` remove os caracteres «`/`» do início e do fim, para que «`'contact'`» corresponda à chave da tabela «`$routes`» (sem a barra inicial).

## O modelo «sistema de arquivos = URLs»

Num servidor PHP clássico (sem configuração específica), **qualquer arquivo fisicamente presente na raiz do site é acessível através do seu caminho na URL**: um `.php` é aí executado, um arquivo estático é aí servido tal como está. É o oposto do Express/Node, onde uma rota só existe se for explicitamente declarada: no PHP «à moda antiga», **tudo é acessível por padrão, exceto o que for explicitamente bloqueado**.

Consequência prática: um arquivo que contenha classes ou dados sensíveis (identificadores de ligação a uma base de dados, chaves de API...) deve ser **bloqueado explicitamente**, mesmo que nenhuma rota o referencie no código da aplicação; caso contrário, nada impede que um visitante digite diretamente o seu caminho no navegador.

## A especificação do servidor de desenvolvimento integrado (`php -S`)

`php -S host:port routeur.php` não possui as capacidades de um verdadeiro servidor web (sem arquivo «`.htaccess`», sem configuração do Apache/nginx). O arquivo passado como argumento é executado em **cada** pedido e controla o comportamento através do seu valor de «`return`»:

- `return false;` → «Não fiz nada, trate você mesmo desse pedido normalmente» (o servidor fornece então o arquivo físico solicitado, se este existir; caso contrário, retorna um erro 404).
- `return true;` → «Já tratei eu próprio desta solicitação (resposta já fornecida), não faças mais nada».

```php
<?php
// routeur.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1) bloqueios explícitos em primeiro lugar
$dossiersBloques = ['/data/', '/src/'];
foreach ($dossiersBloques as $pasta) {
    if (str_starts_with($uri, $pasta)) {
        http_response_code(403);
        echo 'Accès interdit.';
        return true; // Já respondi, não é preciso fazer mais nada
    }
}

// 2) arquivo estático existente -> deixar que o servidor o sirva por si próprio
if (is_file(__DIR__ . $uri)) {
    return false;
}

// 3) caso contrário, despacho da aplicação
require __DIR__ . '/index.php';
return true;
?>
```

> **Nota:** a ordem dos blocos é importante. Se o teste `is_file()` fosse colocado **antes** dos bloqueios, uma solicitação relativa a um arquivo sensível, mas fisicamente presente (por exemplo, `/data/config.php`), passaria neste teste com `true` e devolveria `false`, permitindo que o servidor integrado **executasse** esse arquivo diretamente, sem passar pelas proteções.

> **Nota (segurança):** `$uri` provém diretamente da consulta (`$_SERVER['REQUEST_URI']`): sem normalização, um valor que contenha subdiretórios (`/../../etc/passwd`) poderia permitir que `is_file(__DIR__ . $uri)` escapasse para a raiz do servidor web. Na prática, é necessário resolver o caminho real (por exemplo, `realpath()`) e verificar se este se mantém efetivamente dentro de `__DIR__` antes de o servir, em vez de confiar em `$uri` tal como está.

## Redirecionar e interromper a execução

`header('Location: ...')` apenas adiciona uma informação à resposta HTTP; não interrompe o script. Sem um `exit` imediatamente a seguir, o código seguinte continua a ser executado (e a produzir conteúdo) mesmo após um redirecionamento:

```php
<?php
if (!$utilisateurConnecte) {
    header('Location: /connexion');
    exit; // indispensável: sem isto, o resto do script é executado na mesma
}
?>
```
