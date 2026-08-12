---
order: 1
---

# A sintaxe do PHP

Para escrever e manipular código em PHP, terá de abrir as seguintes tags:

```php
<?php
    // código...
?>
```

Fora destas balizas, o que escrever será considerado texto normal e não código PHP.

> **Nota:** num ficheiro que contenha apenas código PHP, recomenda-se omitir a tag de fecho `?>` no final do ficheiro, para evitar problemas de espaços ou saltos de linha indesejados na saída.

## Sintaxe clássica e sintaxe alternativa

O PHP oferece duas formas de escrever as estruturas de controlo (`if`, `foreach`, `while`, `for`...).

**Sintaxe clássica (com chaves)**:

```php
<?php
if ($connecte) {
    echo "<p>Bienvenue !</p>";
}
```

**Sintaxe alternativa (com `:` e `end...`)**, concebida para integrar de forma mais elegante o PHP e o HTML:

```php
<?php if ($connecte): ?>
    <p>Bienvenue <?= htmlspecialchars($user) ?>!</p>
<?php endif; ?>
```

> **Nota:** «`<?= $user ?>`» é um atalho para «`<?php echo $user; ?>`», o que permite utilizar variáveis PHP no HTML. Sempre que a variável apresentada puder provir de uma entrada do utilizador (um nome de utilizador, por exemplo), é necessário colocá-la entre `htmlspecialchars()`, tal como acima — consulte o capítulo sobre segurança para saber mais sobre a vulnerabilidade XSS que isto evita.

Ambas as sintaxes fazem exatamente a mesma coisa:
- Com as chaves `{ }`, tudo está escrito em PHP, e o HTML deve ser apresentado através de `echo`.
- Com `:` e `end...`, é possível sair do PHP (`?>`), escrever HTML normal e, em seguida, voltar ao PHP (`<?php`) para fechar a estrutura.

| Clássica | Alternativa |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |

A sintaxe clássica é a mais utilizada no código PHP «puro». A sintaxe alternativa é utilizada principalmente em modelos que apresentam HTML.

Em PHP, deve também terminar cada instrução com um «`;`», quer seja na sintaxe clássica ou na alternativa.

## Os comentários

Para escrever comentários em PHP, tem duas opções:

```php
<?php
    // Comentário numa única linha
    # Alternative pour une seule ligne

    /*
        Commentaire
        sur
        plusieurs
        lignes.
    */
?>
```

> **Nota:** «`//`» é a convenção mais comum para escrever um comentário numa única linha.
