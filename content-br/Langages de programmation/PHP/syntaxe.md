---
order: 1
---

# A sintaxe do PHP

Para escrever e manipular código em PHP, você precisará abrir tags:

```php
<?php
    //codigo...
?>
```

Fora dessas tags, o que você escrever será considerado texto normal, e não código PHP.

> **Nota:** em um arquivo contendo apenas PHP, é recomendado omitir a tag de fechamento `?>` no final do arquivo, para evitar problemas de espaços ou quebras de linha involuntárias na saída.

## Sintaxe clássica e sintaxe alternativa

PHP oferece duas formas de escrever as estruturas de controle (`if`, `foreach`, `while`, `for`...).

**Sintaxe clássica (com chaves)**:

```php
<?php
if ($conectado) {
    echo "<p>Bem-vindo!</p>";
}
```

**Sintaxe alternativa (com `:` e `end...`)**, pensada para misturar PHP e HTML de forma mais limpa:

```php
<?php if ($conectado): ?>
    <p>Bem-vindo <?= htmlspecialchars($usuario) ?>!</p>
<?php endif; ?>
```

> **Nota:** `<?= $usuario ?>` é um atalho para `<?php echo $usuario; ?>`, dessa forma você pode usar variáveis PHP no HTML. Assim que a variável exibida puder vir de uma entrada do usuário (um apelido, por exemplo), é preciso envolvê-la em `htmlspecialchars()` como acima (veja [Proteger seus dados](/?c=langages-de-programmation&s=php&p=securite) para a falha XSS que isso evita).

As duas escritas fazem exatamente a mesma coisa:
- Com as chaves `{ }`, tudo é escrito em PHP, e o HTML deve ser exibido via `echo`.
- Com `:` e `end...`, é possível sair do PHP (`?>`), escrever HTML normal, e depois voltar ao PHP (`<?php`) para fechar a estrutura.

| Clássica | Alternativa |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |

A sintaxe clássica é a mais usada em código PHP "puro". A sintaxe alternativa é usada principalmente em templates que exibem HTML.

Em PHP, você também deve terminar cada instrução com um `;`, seja em sintaxe clássica ou alternativa.

## Os comentários

Para escrever comentários em PHP, você tem 2 opções:

```php
<?php
    // Comentario em uma unica linha
    # Alternativa para uma unica linha

    /*
        Comentario
        em
        varias
        linhas.
    */
?>
```

> **Nota:** `//` é a convenção mais difundida para escrever um comentário em uma única linha.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O código PHP se escreve entre `<?php ?>`; a sintaxe alternativa (`:`/`end...`) facilita a mistura com HTML. Cada instrução termina com `;`. |
| **Ferramentas utilizáveis** | `<?= $var ?>` (atalho de exibição), comentários `//`, `#`, `/* */`. |
| **Armadilhas a evitar** | Exibir um dado do usuário sem `htmlspecialchars()`: risco de falha XSS. |
| **Boas práticas** | Omitir a tag de fechamento `?>` no final de um arquivo 100% PHP; usar a sintaxe alternativa em templates que misturam PHP e HTML. |
