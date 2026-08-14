---
order: 7
---

# Incluir funções

Para inserir funções PHP em código HTML, é possível usar a estrutura de linguagem *include*:

```php
<?php
    // inclui um arquivo contendo as funcoes de que precisamos
    include("boasvindas.php");
    include("insetos.php");
    /*
    variantes de declaracao:
    include "boasvindas.php";
    include "insetos.php";
    */
?>

<main>
    <!-- funcao de boasvindas.php -->
    <h1><?php echo boasVindasAoSite(); ?></h1>

    <!-- funcao de insetos.php -->
    <p><?php echo exibirParteInseto(); ?></p>
</main>
```

> **Nota:** `include` é uma [estrutura de linguagem](/?c=langages-de-programmation&s=php&p=structures-de-langage), não uma função clássica.

## `require` e `require_once`

`include` e `require` fazem a mesma coisa (inserir o conteúdo de um arquivo PHP no local onde a instrução é escrita), mas reagem diferentemente se o arquivo não existir:

| | Arquivo não encontrado |
|---|---|
| `include` | Warning, o script continua |
| `require` | Erro fatal, o script para |

`require_once` adiciona uma garantia extra: o arquivo só é carregado **uma única vez**, mesmo que `require_once` seja chamado várias vezes sobre ele (útil para evitar redefinir duas vezes a mesma classe/função):

```php
<?php
require_once "config.php";  // carregado
require_once "config.php";  // ignorado silenciosamente, ja carregado
?>
```

## Um arquivo pode terminar com um simples `return`

Um arquivo PHP não precisa conter uma `class` ou uma `function`: ele pode se limitar a um `return [...]`, e o valor sobe diretamente para o local onde o arquivo é carregado:

```php
<?php
// parametros.php
return [
    'nome_site' => 'Minha Loja',
    'moeda'     => 'BRL',
];
?>
```

```php
<?php
$parametros = require "parametros.php";
echo $parametros['nome_site']; // "Minha Loja"
?>
```

Esse padrão frequentemente serve como arquivo de config/dados simples, sem precisar de um banco de dados.

## `__DIR__`

`__DIR__` é uma constante que representa o diretório **do arquivo onde ela aparece**, não um "diretório do projeto" global. Dois arquivos em pastas diferentes, portanto, não têm o mesmo `__DIR__`:

```php
<?php
// em /app/pages/inicio.php
require __DIR__ . '/../config.php'; // sempre correto, seja qual for o local de onde o script e executado
?>
```

> **Nota:** construir os caminhos com `__DIR__ . '/caminho/relativo'` em vez de um caminho fixo evita erros conforme o contexto de execução (servidor embutido, Apache, linha de comando...), que não têm necessariamente a mesma "pasta atual".

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `include`/`require` inserem o conteúdo de um arquivo PHP no local onde a instrução é escrita. `require` para o script se o arquivo não for encontrado, `include` se contenta com um warning. `require_once` só carrega o arquivo uma única vez. |
| **Ferramentas utilizáveis** | `require_once`, `__DIR__`, um arquivo terminando com `return [...]` como mini-config. |
| **Armadilhas a evitar** | Usar `include` para um arquivo indispensável ao funcionamento (uma classe central): um arquivo ausente continua silenciosamente com apenas um warning. |
| **Boas práticas** | Usar `require_once` para os arquivos de classes/funções, `__DIR__` para construir caminhos independentes do contexto de execução. |
