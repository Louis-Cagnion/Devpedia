---
order: 7
---

# Incluir funções

Para inserir funções PHP em código HTML, podemos utilizar a estrutura de linguagem *«include*»:

```php
<?php
    // inclui um ficheiro que contém as funções necessárias
    include("bienvenue.php");
    include("insectes.php");
    /*
    variantes de déclaration:
    include "bienvenue.php";
    include "insectes.php";
    */
?>

<main>
    <!-- fonction depuis bienvenue.php -->
    <h1><?php echo bienvenueSurLeSiteWeb(); ?></h1>

    <!-- fonction depuis insectes.php -->
    <p><?php echo afficherPartieInsecte(); ?></p>
</main>
```

> **Nota:** consulte «estruturas de linguagens» se não souber o que isso é.

## `require` e `require_once`

`include` e `require` fazem o mesmo (inserir o conteúdo de um ficheiro PHP no local onde a instrução está escrita), mas reagem de forma diferente se o ficheiro não existir:

| | Ficheiro não encontrado |
|---|---|
| `include` | Atenção, o script continua |
| `require` | Erro fatal, o script é interrompido |

`require_once` Adiciona uma garantia adicional: o ficheiro só é carregado uma **vez**, mesmo que a função `require_once` seja chamada várias vezes sobre ele (útil para evitar redefinir duas vezes a mesma classe/função):

```php
<?php
require_once "config.php"; // carregado
require_once "config.php"; // ignorado silenciosamente, já carregado
?>
```

## Um ficheiro pode terminar com um simples «`return`»

Um ficheiro PHP não precisa de conter uma instrução «`class`» ou «`function`»: pode limitar-se a um «`return [...]`», e o valor é devolvido diretamente para o local onde o ficheiro é carregado:

```php
<?php
// parametres.php
return [
    'nom_site' => 'Ma Boutique',
    'devise'   => 'EUR',
];
?>
```

```php
<?php
$parametres = require "parametres.php";
echo $parametres['nom_site']; // «A Minha Loja»
?>
```

Este padrão é frequentemente utilizado como um ficheiro simples de configuração/dados, sem necessidade de uma base de dados.

## `__DIR__`

`__DIR__` é uma constante que representa o diretório **do ficheiro em que aparece** — não um «diretório do projeto» global. Por isso, dois ficheiros em pastas diferentes não têm o mesmo `__DIR__`:

```php
<?php
// em /app/pages/accueil.php
require __DIR__ . '/../config.php'; // sempre correta, independentemente do local a partir do qual o script é executado
?>
```

> **Nota:** construir os caminhos com `__DIR__ . '/caminho/relatif'` em vez de um caminho fixo evita erros dependendo do contexto de execução (servidor integrado, Apache, linha de comandos...), que nem sempre têm a mesma «pasta atual».
