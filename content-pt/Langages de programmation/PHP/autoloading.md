---
order: 9
---

# Carregamento automático de classes

Sem o carregamento automático, cada ficheiro que utiliza uma classe tem de efetuar um «`require`» explícito do ficheiro que a contém — o que se torna pesado e frágil assim que um projeto tem muitas classes. O «`spl_autoload_register()`» permite delegar esse carregamento ao próprio motor PHP.

## `spl_autoload_register()`

```php
<?php
spl_autoload_register(function (string $classe) {
    $ficheiro = __DIR__ . '/' . $classe . '.php';
    if (file_exists($ficheiro)) {
        require $ficheiro;
    }
});

$obj = new MaClasse(); // O PHP chama automaticamente o resolvedor com «MaClasse»
// -> não é necessário incluir o ficheiro «require» em nenhuma outra parte do projeto
?>
```

`spl_autoload_register()` Regista **uma vez** uma função «resolver». Posteriormente, sempre que o motor PHP encontra um nome de classe ainda não carregado, chama automaticamente essa função, passando-lhe o nome da classe (na forma de string), e aguarda que esta carregue o ficheiro correto. Se nenhuma função registada conseguir carregar a classe, o PHP gera um erro fatal «Class not found».

## A função passada como argumento é um closure

O argumento de `spl_autoload_register()` não é nem um nome de função, nem uma variável: é uma **função anónima (closure)**, definida diretamente no local onde é utilizada. Equivalente em PHP a um callback em JS (`matriz.map(function(x) { ... })` ou `x => ...`) ou a um lambda em C++11. Não é executada na linha em que está escrita: é armazenada e **chamada mais tarde**, sempre que uma classe desconhecida for referenciada.

## Associar um namespace a uma pasta

Um resolvedor mais realista associa cada **prefixo de namespace** a uma pasta raiz e reconstrói o caminho do ficheiro a partir do nome completo da classe:

```php
<?php
spl_autoload_register(function (string $classe): void {
    $namespaces = [
        'App\\Modeles\\'  => __DIR__ . '/Modeles/',
        'App\\Services\\' => __DIR__ . '/Services/',
    ];

    foreach ($namespaces as $prefixe => $dossierBase) {
        if (str_starts_with($classe, $prefixe)) {
            $caminho = $dossierBase . str_replace('\\', '/', substr($classe, strlen($prefixe))) . '.php';
            if (file_exists($caminho)) {
                require $caminho;
            }
            return;
        }
    }
});
?>
```

Exemplo de resolução, com o «`$classe = 'App\Services\Facturation\Calculateur'`»:
1. `str_starts_with($classe, 'App\\Services\\')` → `true`, este prefixo corresponde.
2. `substr(...)` remove o prefixo correspondente → `'Facturation\Calculateur'`.
3. `str_replace('\\', '/', ...)` transforma o separador de namespace num separador de pasta → `'Facturation/Calculateur'`.
4. Caminho final: `.../Services/Facturation/Calculateur.php` — que deve corresponder à localização real do ficheiro.

> **Nota:** «`'App\\Modeles\\'`» numa cadeia de caracteres entre aspas simples: «`\\`» representa **um único** carácter «`\`» (deve ser duplicado para ser escrito literalmente) — trata-se da cadeia «`App\Modeles\`», o separador de namespace.

O `return;`, após o `if`, é executado, quer o ficheiro exista ou não (é colocado após o `if (file_exists(...))`, e não dentro dele): uma vez que os prefixos dos namespaces são mutuamente exclusivos no seu primeiro segmento, assim que o prefixo correto for encontrado, continuar a testar os outros seria sempre inútil.

> **Convenção indispensável para que isto funcione:** o nome do namespace + o nome da classe devem codificar literalmente o caminho do ficheiro — um ficheiro por classe, estrutura de pastas = estrutura de namespaces.
