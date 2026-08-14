---
order: 13
---

# O roteamento sem framework (front controller)

Sem framework ([Laravel](https://laravel.com), [Symfony](https://symfony.com)...), PHP não fornece nenhum roteador integrado comparável ao [Express](https://expressjs.com) (`app.get('/caminho', callback)`). Um projeto "PHP puro" precisa organizar ele mesmo a correspondência entre uma URL solicitada e o código a executar.

## O front controller e a tabela de dispatch

Um padrão comum consiste em fazer todas as requisições passarem por um único ponto de entrada (frequentemente `index.php`), que consulta um array associativo "rota → arquivo":

```php
<?php
$rotas = [
    'inicio'  => '/pages/inicio.php',
    'contato' => '/pages/contato.php',
];

$uri  = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$arquivo = $rotas[$uri] ?? null;

if ($arquivo && file_exists(__DIR__ . $arquivo)) {
    require __DIR__ . $arquivo; // o "handler" e um arquivo executado, nao uma funcao chamada
} else {
    http_response_code(404);
    echo "Pagina nao encontrada";
}
?>
```

Diferença chave em relação a um roteador JS (Express): cada rota aponta para um **caminho de arquivo**, não uma função. Não há callback a chamar: o próprio arquivo produz a resposta HTTP (`echo`, `header()`...) lendo diretamente as superglobais.

- `$_SERVER['REQUEST_URI']` contém o caminho **e** a query string colados (`/contato?ref=pub`). `parse_url(..., PHP_URL_PATH)` extrai apenas o caminho, descartando a query string.
- `trim(..., '/')` remove as `/` do início/fim, para que `'contato'` corresponda à chave do array `$rotas` (sem barra inicial).

## O modelo "sistema de arquivos = URLs"

Em um servidor PHP clássico (sem configuração especial), **todo arquivo fisicamente presente sob a raiz web é acessível via seu caminho na URL**: um `.php` é executado, um arquivo estático é servido tal como está. É o inverso do Express/[Node](https://nodejs.org), onde uma rota só existe se for explicitamente declarada: em PHP "à moda antiga", **tudo é acessível por padrão, exceto o que é bloqueado explicitamente**.

Consequência concreta: uma pasta contendo classes ou dados sensíveis (credenciais de conexão a um banco, chaves de API...) deve ser **bloqueada explicitamente**, mesmo que nenhuma rota jamais a referencie no código aplicativo: senão nada impede um visitante de digitar diretamente seu caminho no navegador.

## O contrato do servidor de desenvolvimento embutido (`php -S`)

`php -S host:porta roteador.php` não tem as capacidades de um servidor web real (sem arquivo `.htaccess`, sem configuração Apache/nginx). O arquivo passado como argumento é executado em **cada** requisição, e controla o comportamento via seu valor de `return`:

- `return false;` → "eu não fiz nada, sirva você mesmo essa requisição normalmente" (o servidor então serve o arquivo físico solicitado se existir, senão 404).
- `return true;` → "eu já tratei essa requisição sozinho (resposta já produzida), não faça mais nada".

```php
<?php
// roteador.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1) bloqueios explicitos primeiro
$pastasBloqueadas = ['/data/', '/src/'];
foreach ($pastasBloqueadas as $pasta) {
    if (str_starts_with($uri, $pasta)) {
        http_response_code(403);
        echo 'Acesso negado.';
        return true; // ja respondido, nao fazer mais nada
    }
}

// 2) arquivo estatico existente -> deixar o servidor servi-lo sozinho
if (is_file(__DIR__ . $uri)) {
    return false;
}

// 3) senao, dispatch aplicativo
require __DIR__ . '/index.php';
return true;
?>
```

> **Nota:** a ordem dos blocos importa. Se o teste `is_file()` fosse colocado **antes** dos bloqueios, uma requisição a um arquivo sensível mas fisicamente presente (ex. `/data/config.php`) passaria nesse teste com `true` e retornaria `false`, deixando o servidor embutido **executar** esse arquivo diretamente, sem passar pelas proteções.

> **Nota (segurança):** `$uri` vem diretamente da requisição (`$_SERVER['REQUEST_URI']`): sem normalização, um valor contendo subidas de diretório (`/../../etc/passwd`) poderia fazer `is_file(__DIR__ . $uri)` escapar da raiz web. Na prática, é preciso resolver o caminho real (ex. `realpath()`) e verificar que ele permanece dentro de `__DIR__` antes de servi-lo, em vez de confiar em `$uri` tal como está.

## Redirecionar e parar a execução

`header('Location: ...')` apenas adiciona uma informação à resposta HTTP: ela **não** interrompe o script. Sem um `exit` logo depois, o código seguinte continua a executar (e a produzir conteúdo) mesmo após um redirecionamento:

```php
<?php
if (!$usuarioConectado) {
    header('Location: /login');
    exit; // indispensavel: sem isso, o resto do script executa mesmo assim
}
?>
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Sem framework, um front controller único recebe todas as requisições e faz o dispatch via uma tabela "rota → arquivo". Por padrão, todo arquivo físico sob a raiz web é acessível: o inverso de um roteador JS onde nada existe sem declaração explícita. |
| **Ferramentas utilizáveis** | `parse_url()`, `$_SERVER['REQUEST_URI']`, `php -S` para um servidor de desenvolvimento. |
| **Armadilhas a evitar** | Testar a existência de um arquivo antes de verificar as pastas bloqueadas (ordem invertida = proteção contornada); redirecionar sem `exit` logo depois. |
| **Boas práticas** | Bloquear explicitamente toda pasta sensível antes de servir um arquivo físico; sempre `exit` imediatamente após um `header('Location: ...')`. |
