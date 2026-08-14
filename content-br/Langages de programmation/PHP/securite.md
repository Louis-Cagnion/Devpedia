---
order: 13
---

# Proteja os seus dados

Ao recolher dados fornecidos pelo usuário (formulários, URLs, cookies...), deve considerá-los sempre como **não fiáveis**, mesmo que pareçam corretos. Um visitante mal-intencionado pode enviar qualquer coisa: código HTML, JavaScript ou consultas SQL malformadas. O PHP disponibiliza várias funções para filtrar, validar e escapar esses dados.

## `filter_input()`

Permite recuperar **e,** ao mesmo tempo, validar/filtrar dados provenientes de `$_GET`, `$_POST`, etc.:

```php
<?php
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $idade = filter_input(INPUT_GET, 'age', FILTER_VALIDATE_INT);

    if ($email === false) {
        echo "Email invalide.";
    }
?>
```

Se os dados não corresponderem ao filtro solicitado, `filter_input()` devolve `false`. Se o campo não existir de todo, devolve `null`.

Alguns filtros comuns:

```php
<?php
    FILTER_VALIDATE_EMAIL;    // verifica um formato de e-mail
    FILTER_VALIDATE_INT;      // verifica um número inteiro
    FILTER_VALIDATE_FLOAT;    // verifica um número decimal
    FILTER_VALIDATE_URL;      // verifica um URL
    FILTER_SANITIZE_STRING;   // limpa uma cadeia de caracteres (obsoleto desde o PHP 8.1)
?>
```

## `htmlspecialchars()`: proteger-se contra falhas XSS

Se apresentar dados do usuário na página (por exemplo: um comentário, um nome de usuário), um visitante poderá injetar código HTML/JavaScript malicioso. Trata-se de uma falha denominada **XSS** (*Cross-Site Scripting*).

```php
<?php
    $commentaire = "<script>alert('piraté');</script>";

    echo htmlspecialchars($commentaire);
    // exibe o texto tal como está, sem executar o script
?>
```

`htmlspecialchars()` Converte os caracteres especiais (`<`, `>`, `"`, `'`) em entidades HTML, o que impede que o navegador interprete o conteúdo como código.

> **Nota:** apresente sempre os dados do usuário com «`htmlspecialchars()`», a menos que tenha um motivo específico para não o fazer.

## Proteger-se contra injeções SQL

Se inserir diretamente dados do usuário numa consulta SQL, um visitante pode manipular a consulta para acessar dados que não deveria ver, ou mesmo eliminá-los. Trata-se de uma **injeção SQL**.

```php
<?php
    // ❌ Perigoso: os dados são inseridos diretamente na consulta
    $consulta = "SELECT * FROM users WHERE email = '" . $_POST['email'] . "'";
?>
```

A solução consiste em utilizar **consultas preparadas**, através do PDO (*PHP Data Objects*, a ferramenta integrada no PHP para comunicar com uma base de dados), que separam a consulta SQL dos dados:

```php
<?php
    // Ligação à base de dados (tipo, endereço, nome da base de dados, nome de usuário, senha)
    $pdo = new PDO('mysql:host=localhost;dbname=mabase', 'utilisateur', 'motdepasse');

    // Preparação da solicitação: «:email» é um espaço reservado, ainda não é um valor real
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");

    // Execução da consulta com o valor real, enviado pelo usuário
    $stmt->execute(['email' => $_POST['email']]);

    // Recuperação do resultado sob a forma de uma tabela PHP
    $user = $stmt->fetch();
?>
```

Com este método, os dados enviados pelo usuário através de `$_POST` nunca são interpretados como código SQL, independentemente do seu conteúdo. Serão sempre considerados como um valor da consulta.

## `password_hash()` e `password_verify()`: guardar senhas

Uma senha **nunca** deve ser armazenada em texto simples numa base de dados. O PHP disponibiliza funções nativas para a encriptar de forma segura:

```php
<?php
    // A senha é submetida a um algoritmo de hash
    $user['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // O hash é guardado na base de dados (não a senha em texto simples)
    $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :password)");
    $stmt->execute([
        'email' => $_POST['email'],
        'password' => $user['password'],
    ]);

    // Recupera-se o hash armazenado na base de dados, a partir do endereço de e-mail introduzido
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
    $user = $stmt->fetch();

    // A senha introduzida é comparada com o hash recuperado da base de dados
    if (password_verify($_POST['password'], $user['password'])) {
        echo "Connexion réussie.";
    } else {
        echo "Mot de passe incorrect.";
    }
?>
```

`password_hash()` Gera um hash diferente em cada chamada (mesmo com a mesma senha), graças a um «salt» integrado automaticamente. Por isso, é impossível recuperar a senha original a partir do hash.

Este sel não se perde: é incluído diretamente no hash gerado, por exemplo:

```
2y $10 N9qo8uLOickgx2ZMRZoMye IjZAgcfl7p92ldGxad68LJZdL17lhWy
```

- `$2y$` → o algoritmo utilizado (bcrypt)
- `$10$` → o custo (a dificuldade do cálculo)
- Os 22 caracteres seguintes → o sal utilizado para este hash específico
- O resto → o resultado do hash, calculado com este salt

É por isso que `password_verify($_POST['password'], $user['password'])` funciona na mesma: lê a chave já presente em `$user['password']`, faz o hash de `$_POST['password']` com **essa mesma chave** e, em seguida, compara o resultado obtido com o resto de `$user['password']`, utilizando o mesmo algoritmo e o mesmo custo. É por esta razão que se utiliza sempre `password_verify()` para comparar, e nunca um novo `password_hash()` comparado diretamente com o hash armazenado: este último daria sempre um resultado diferente, mesmo com a senha correta.

## Resumo

| Risco | Função / método |
|---|---|
| Dados malformados (e-mail, número...) | `filter_input()` |
| Injeção de HTML/JS (XSS) | `htmlspecialchars()` |
| Injeção SQL | Consultas preparadas (PDO) |
| Senha em texto simples | `password_hash()` / `password_verify()` |

> **Nota:** nenhuma destas medidas de proteção substitui o HTTPS, que encripta os dados trocados entre o navegador e o servidor.
