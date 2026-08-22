---
order: 10
---

# O autoloading de classes

Sem autoloading, cada arquivo que usa uma classe precisa fazer um `require` explícito do arquivo que a contém: pesado e frágil assim que um projeto tem muitas classes. `spl_autoload_register()` permite delegar esse carregamento ao próprio motor PHP.

## `spl_autoload_register()`

```php
<?php
spl_autoload_register(function (string $classe) {
    $arquivo = __DIR__ . '/' . $classe . '.php';
    if (file_exists($arquivo)) {
        require $arquivo;
    }
});

$obj = new MinhaClasse(); // PHP chama automaticamente o resolvedor com "MinhaClasse"
// -> nenhum require manual necessario em outro lugar do projeto
?>
```

`spl_autoload_register()` registra **uma vez** uma função "resolvedora". Depois, cada vez que o motor PHP encontra um nome de classe ainda não carregado, ele chama automaticamente essa função passando o nome da classe (na forma de string), e espera que ela carregue o arquivo correto. Se nenhuma função registrada conseguir carregar a classe, PHP lança um erro fatal "Class not found".

## A função passada como argumento é uma closure

O argumento de `spl_autoload_register()` não é nem um nome de função, nem uma variável: é uma **função anônima (closure)**, definida diretamente no local onde é usada. Equivalente PHP de um callback JS (`array.map(function(x) { ... })` ou `x => ...`) ou de um lambda C++11. Ela não é executada na linha onde é escrita: ela é armazenada, e **chamada de volta mais tarde**, cada vez que uma classe desconhecida é referenciada.

## Fazer corresponder um namespace a uma pasta

Um resolvedor mais realista associa cada **prefixo de namespace** a uma pasta base, e reconstrói o caminho do arquivo a partir do nome completo da classe:

```php
<?php
spl_autoload_register(function (string $classe): void {
    $namespaces = [
        'App\\Modelos\\'  => __DIR__ . '/Modelos/',
        'App\\Servicos\\' => __DIR__ . '/Servicos/',
    ];

    foreach ($namespaces as $prefixo => $pastaBase) {
        if (str_starts_with($classe, $prefixo)) {
            $caminho = $pastaBase . str_replace('\\', '/', substr($classe, strlen($prefixo))) . '.php';
            if (file_exists($caminho)) {
                require $caminho;
            }
            return;
        }
    }
});
?>
```

Exemplo de resolução, com `$classe = 'App\Servicos\Faturamento\Calculadora'`:
1. `str_starts_with($classe, 'App\\Servicos\\')` → `true`, esse prefixo corresponde.
2. `substr(...)` remove o prefixo correspondido → `'Faturamento\Calculadora'`.
3. `str_replace('\\', '/', ...)` transforma o separador de namespace em separador de pasta → `'Faturamento/Calculadora'`.
4. Caminho final: `.../Servicos/Faturamento/Calculadora.php`, que deve corresponder ao local real do arquivo.

> **Nota:** `'App\\Modelos\\'` em uma string com aspas simples: `\\` representa **um único** caractere `\` (ele deve ser duplicado para ser escrito literalmente): é a string `App\Modelos\`, o separador de namespace.

O `return;` depois do `if` é executado, exista o arquivo ou não (ele está colocado depois do `if (file_exists(...))`, não dentro): como os prefixos de namespaces são mutuamente exclusivos em seu primeiro segmento, uma vez encontrado o prefixo correto, continuar testando os outros seria sempre inútil.

> **Convenção indispensável para funcionar:** o nome do namespace + o nome da classe devem codificar literalmente o caminho do arquivo: um arquivo por classe, árvore de pastas = árvore de namespaces.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `spl_autoload_register()` registra uma função chamada automaticamente assim que uma classe não carregada é referenciada: não é mais necessário `require` manual para cada classe. |
| **Ferramentas utilizáveis** | `spl_autoload_register()`, correspondência prefixo de namespace → pasta. |
| **Armadilhas a evitar** | Não fazer a árvore de pastas corresponder exatamente à dos namespaces: o resolvedor não encontraria mais o arquivo. |
| **Boas práticas** | Respeitar a convenção "um arquivo por classe, árvore de pastas = árvore de namespaces" para que o autoloading funcione de forma previsível. |
