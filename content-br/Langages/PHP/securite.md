---
order: 14
---

# Proteger seus dados

Ao recuperar dados vindos do usuário (formulários, URL, cookies...), sempre é preciso considerá-los **não confiáveis**, mesmo que pareçam corretos. Um visitante mal-intencionado pode enviar qualquer coisa: código HTML, JavaScript, ou consultas SQL malformadas. PHP fornece várias funções para filtrar, validar e escapar esses dados.

Este capítulo cobre primeiro as proteções diretamente acionáveis em PHP (validação, XSS, injeção SQL, senhas), depois situa essas proteções em um panorama mais amplo das famílias de ataques que uma aplicação web pode sofrer: algumas se defendem no nível do código aplicativo, outras no nível da rede ou da infraestrutura.

## `filter_input()`

Permite recuperar **e** validar/filtrar ao mesmo tempo um dado vindo de `$_GET`, `$_POST`, etc.:

```php
<?php
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $idade = filter_input(INPUT_GET, 'idade', FILTER_VALIDATE_INT);

    if ($email === false) {
        echo "Email invalido.";
    }
?>
```

Se o dado não corresponder ao filtro solicitado, `filter_input()` retorna `false`. Se o campo não existir de forma alguma, ela retorna `null`.

Alguns filtros comuns:

```php
<?php
    FILTER_VALIDATE_EMAIL;   // verifica um formato de email
    FILTER_VALIDATE_INT;     // verifica um numero inteiro
    FILTER_VALIDATE_FLOAT;   // verifica um numero decimal
    FILTER_VALIDATE_URL;     // verifica uma URL
    FILTER_SANITIZE_STRING;  // limpa uma string (obsoleto desde o PHP 8.1)
?>
```

## `htmlspecialchars()`: proteger-se de falhas XSS

Se você exibir um dado do usuário na página (ex: um comentário, um apelido), um visitante poderia injetar código HTML/JavaScript malicioso. É uma falha chamada **XSS** (*Cross-Site Scripting*), uma forma de [injeção](/?c=cybersecurite&p=types-de-failles): um dado não confiável interpretado como código em vez de texto puro.

```php
<?php
    $comentario = "<script>alert('hackeado');</script>";

    echo htmlspecialchars($comentario);
    // exibe o texto tal como esta, sem executar o script
?>
```

`htmlspecialchars()` converte os caracteres especiais (`<`, `>`, `"`, `'`) em entidades HTML, o que impede o navegador de interpretar o conteúdo como código.

> **Nota:** sempre exiba os dados do usuário com `htmlspecialchars()`, a menos que você tenha uma razão precisa para não fazê-lo.

## Proteger-se de injeções SQL

Se você inserir diretamente um dado do usuário em uma consulta SQL, um visitante pode manipular a consulta para acessar dados que não deveria ver, ou até removê-los. É uma **injeção SQL**, já detalhada com o mecanismo das consultas preparadas PDO no capítulo [SQL](/?c=domain-specific-languages-dsl&p=sql): a proteção em PHP continua exatamente a mesma, nunca concatenar um dado do usuário no texto da consulta.

```php
<?php
    // ❌ Perigoso: o dado e inserido diretamente na consulta
    $consulta = "SELECT * FROM users WHERE email = '" . $_POST['email'] . "'";

    // ✅ Seguro: o dado passa por um espaco reservado, nunca interpretado como SQL
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
?>
```

## `password_hash()` e `password_verify()`: armazenar senhas

Uma senha **nunca** deve ser armazenada em texto claro em um banco de dados. PHP fornece funções nativas para hasheá-la de forma segura:

```php
<?php
    // Hashea a senha
    $user['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Salva o hash no banco de dados (nao a senha em texto claro)
    $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :password)");
    $stmt->execute([
        'email' => $_POST['email'],
        'password' => $user['password'],
    ]);

    // Recupera o hash armazenado no banco, a partir do email informado
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
    $user = $stmt->fetch();

    // Compara a senha informada com o hash recuperado do banco
    if (password_verify($_POST['password'], $user['password'])) {
        echo "Conexao bem-sucedida.";
    } else {
        echo "Senha incorreta.";
    }
?>
```

`password_hash()` gera um hash diferente a cada chamada (mesmo com a mesma senha), graças a um "sal" (*salt*) integrado automaticamente. É, portanto, impossível voltar à senha original a partir do hash.

Esse sal não é perdido: ele é incluído diretamente no hash gerado, por exemplo:

```text
2y $10 N9qo8uLOickgx2ZMRZoMye IjZAgcfl7p92ldGxad68LJZdL17lhWy
```

- `$2y$` → o algoritmo usado ([bcrypt](https://en.wikipedia.org/wiki/Bcrypt))
- `$10$` → o custo (a dificuldade do cálculo)
- Os 22 caracteres seguintes → o sal usado para esse hash preciso
- O resto → o resultado do hash, calculado com esse sal

É por isso que `password_verify($_POST['password'], $user['password'])` funciona apesar de tudo: ela lê o sal já presente em `$user['password']`, hasheia `$_POST['password']` com **esse mesmo sal**, depois compara o resultado obtido com o resto de `$user['password']` usando o mesmo algoritmo e custo. É por essa razão que sempre se usa `password_verify()` para comparar, e nunca um novo `password_hash()` comparado diretamente ao hash armazenado: este último sempre daria um resultado diferente, mesmo com a senha correta.

### Comparar hashes: a armadilha do `==`

Uma razão adicional para nunca comparar um hash você mesmo: a **comparação flexível** do PHP (veja o capítulo [As condições](/?c=langages-de-programmation&s=php&p=conditions)) converte strings numéricas em números antes de compará-las.

Ora, PHP interpreta uma string como `"0e123456"` em notação científica: `0` elevado a uma potência, portanto **zero**. Dois hashes totalmente diferentes começando com `0e` seguido de dígitos são, portanto, ambos convertidos em `0`, e considerados iguais:

```php
<?php
    var_dump("0e123456" == "0e999999");   // true !  0 == 0
    var_dump("0e123456" === "0e999999");  // false, como esperado
?>
```

Isso não é teórico: essa falha (*magic hash*) permitiu contornar autenticações reais, fornecendo uma senha cujo hash [MD5](https://en.wikipedia.org/wiki/MD5) ou [SHA-1](https://en.wikipedia.org/wiki/SHA-1) cai nessa forma. Bastava que o código comparasse com `==`.

Três proteções, cumulativas:

- usar `password_verify()`, que não faz nenhuma conversão de tipo;
- para comparar duas strings sensíveis, usar `hash_equals()`, que compara em **tempo constante** e além disso evita ataques temporais;
- nunca comparar dados sensíveis com `==`.

```php
if (hash_equals($token_esperado, $token_recebido)) { /* ... */ }
```

## CSRF: Cross-Site Request Forgery

Um exemplo concreto de [controle de acesso falho](/?c=cybersecurite&p=types-de-failles): uma ação sensível disparada sem reconferir se a requisição reflete uma intenção real do usuário, e não apenas um cookie de sessão válido. Um site malicioso faz executar, sem o conhecimento do usuário, uma ação em outro site onde este já está autenticado, apoiando-se no fato de que o navegador reenvia automaticamente os cookies de sessão para esse site, seja qual for a página de origem da requisição.

```html
<!-- em um site terceiro, armadilha -->
<img src="https://banco.example/transferencia?valor=1000&para=atacante">
```

Se a vítima estiver conectada ao seu banco no mesmo navegador, essa requisição parte com seus cookies de sessão válidos, sem que ela tenha clicado em nada no próprio `banco.example`. Isso só é possível porque a ação é disparada por uma simples requisição `GET`/`POST` sem nenhuma outra verificação além da presença de um cookie de sessão válido.

**Proteção: um token CSRF**, um valor aleatório gerado do lado do servidor, armazenado em sessão, e exigido em cada formulário/requisição sensível:

```php
<?php
session_start();

// na geracao do formulario
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>
<form action="/transferencia" method="POST">
    <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
    <!-- ... resto do formulario ... -->
</form>
```

```php
<?php
// no recebimento do formulario
session_start();

$tokenRecebido = $_POST['csrf_token'] ?? '';
if (!hash_equals($_SESSION['csrf_token'] ?? '', $tokenRecebido)) {
    http_response_code(403);
    exit('Requisicao recusada (token CSRF invalido).');
}
// processamento normal...
?>
```

Um site terceiro não tem meio de conhecer esse token (ele é armazenado em sessão, nunca acessível de outro domínio): ele não pode, portanto, colocá-lo em sua requisição armadilha. `hash_equals()` em vez de um `===` clássico, pela mesma razão da verificação de um token assinado (veja [Gerenciar as conexões](/?c=langages-de-programmation&s=php&p=connexions)): uma comparação em tempo constante, que evita um ataque por timing.

> **Nota:** o atributo de cookie `samesite` (veja [Gerenciar as conexões](/?c=langages-de-programmation&s=php&p=connexions)) traz uma proteção complementar no próprio nível do navegador, mas um token CSRF aplicativo continua sendo a proteção de referência, independente do navegador usado.

## Panorama das outras famílias de ataques

As proteções anteriores cobrem o próprio código aplicativo PHP. Outros ataques visam a rede, a infraestrutura, ou o usuário diretamente: conhecê-los permite saber *onde* se situa uma dada proteção, e o que ela não cobre.

### Ataques de rede

Três siglas retornam em tudo o que segue:

- **SSL** (*Secure Sockets Layer*) e seu sucessor **TLS** (*Transport Layer Security*): os protocolos que criptografam uma conexão de rede e permitem ao cliente verificar a identidade do servidor via um **certificado**. SSL está obsoleto há muito tempo, mas o nome permaneceu no uso comum: quando se diz "certificado SSL", na prática trata-se de TLS.
- **HTTPS**: simplesmente HTTP transportado em uma conexão criptografada por TLS. Nada mais muda do lado do protocolo aplicativo.
- **DNS** (*Domain Name System*): o catálogo que traduz um nome de domínio em endereço IP. É uma etapa indispensável antes de qualquer conexão, e portanto um alvo.

- **Man-in-the-middle (MITM)**: o atacante se intercala entre o cliente e o servidor legítimo, e retransmite (ou altera) a conversa sem que nenhuma das duas partes perceba. A criptografia sozinha (TLS) não basta para impedi-lo: um atacante pode criptografar *sua própria* conversa com o cliente, enquanto criptografa outra conversa com o servidor real. **Proteção:** a verificação do certificado SSL/TLS apresentado pelo servidor (`verify_peer`/`verify_peer_name`, veja [Fazer chamadas HTTP nativamente](/?c=langages-de-programmation&s=php&p=http)): sem ela, um certificado forjado pelo atacante seria aceito sem problema. A criptografia assimétrica por trás dessa verificação de certificado é detalhada em [Criptografia aplicada](/?c=cybersecurite&p=cryptographie-appliquee).
- **DNS spoofing / cache poisoning**: o atacante corrompe a resolução DNS para que um nome de domínio legítimo aponte para o IP dele. A verificação de certificado continua sendo uma proteção mesmo que o DNS esteja comprometido, pois não depende da resolução DNS mas da identidade criptográfica apresentada pelo servidor.
- **Sniffing (escuta passiva)**: simples leitura do tráfego de rede não criptografado. Não exige nenhuma interação ativa com o tráfego: apenas observá-lo, por exemplo em uma rede Wi-Fi pública não controlada. **Proteção:** HTTPS em tudo, sem exceção para um dado considerado "não tão sensível".

### Session hijacking (roubo de sessão)

Roubar o identificador de sessão de um usuário (o cookie, veja [Gerenciar as conexões](/?c=langages-de-programmation&s=php&p=connexions)) para se passar por ele sem conhecer sua senha. Um atacante que obtivesse esse identificador (por XSS: leitura do cookie em JS, daí o interesse de `httponly`, por sniffing em uma conexão não criptografada, ou por roubo físico do aparelho) pode literalmente se fazer passar pela vítima enquanto a sessão permanecer válida.

### Brute force

Testar um grande número de combinações (senhas, tokens, credenciais) até encontrar uma válida. `password_verify()` (cf. acima) protege contra a leitura direta de uma senha no banco, mas não contra um atacante que tentasse milhares de senhas no próprio formulário de login. **Proteção típica:** limitar o número de tentativas por unidade de tempo (*rate limiting*), por IP, por conta, ou ambos, com um atraso ou um bloqueio temporário após um limiar de falhas.

### DDoS: Distributed Denial of Service

Sobrecarregar um servidor (ou um recurso de rede) com requisições, vindas de numerosas fontes simultâneas, para torná-lo indisponível aos usuários legítimos. Diferente do brute force: o objetivo não é adivinhar um valor, mas esgotar um recurso (largura de banda, CPU, conexões abertas). Raramente se protege apenas no nível do código aplicativo: mais via a infraestrutura (firewall, CDN, limitação de taxa antes do servidor).

### Phishing

O lado humano mais do que técnico, detalhado em [Engenharia social e phishing](/?c=cybersecurite&p=ingenierie-sociale-et-phishing). Fazer a vítima acreditar que está interagindo com um site/serviço legítimo para extrair informações dela (credenciais, dados bancários), tipicamente via um nome de domínio visualmente próximo do real (*typosquatting*) e um certificado SSL válido, mas emitido para esse falso domínio. Um certificado válido prova a identidade **do domínio chamado**, não que esse domínio seja confiável: uma nuance que explica por que o cadeado do navegador sozinho nunca garante que um site é legítimo.

### SSRF: Server-Side Request Forgery

Classificada A10 no [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10). Forçar um servidor a realizar, em nome de um atacante, uma requisição HTTP para um destino que ele normalmente não deveria alcançar, tipicamente um recurso interno da rede (painel de administração, metadados de nuvem, serviço interno não exposto publicamente).

```php
<?php
// perigoso se $_GET['url'] puder visar um endereco interno (ex: http://169.254.169.254/, http://localhost:6379/...)
$resposta = file_get_contents($_GET['url']);
?>
```

Todo código que constrói uma URL/host de destino a partir de uma entrada influenciada, mesmo indiretamente, pelo usuário (veja [Fazer chamadas HTTP nativamente](/?c=langages-de-programmation&s=php&p=http)) é um candidato à auditoria SSRF. **Proteção:** validar o host alvo contra uma lista branca explícita em vez de confiar em uma URL arbitrária fornecida pelo cliente.

## Resumo

| Risco | Defesa principal |
|---|---|
| Dado malformado (email, número...) | `filter_input()` |
| Injeção de HTML/JS (XSS) | `htmlspecialchars()` |
| Injeção SQL | Consultas preparadas (PDO) |
| Senha em texto claro | `password_hash()` / `password_verify()` |
| CSRF | Token CSRF em sessão, verificado via `hash_equals()` |
| MITM / DNS spoofing | Verificação de certificado SSL (`verify_peer`/`verify_peer_name`) |
| Sniffing | HTTPS sistemático |
| Session hijacking | Cookie `httponly`/`secure`, identificador de sessão com alta entropia |
| Brute force | Limitação do número de tentativas (*rate limiting*) |
| SSRF | Lista branca dos hosts/URLs permitidos |

> **Nota:** nenhuma dessas proteções substitui o HTTPS, que criptografa os dados trocados entre o navegador e o servidor.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Todo dado do usuário é não confiável por padrão. As principais falhas aplicativas (XSS, injeção SQL, CSRF) são neutralizadas por mecanismos dedicados (`htmlspecialchars`, consultas preparadas, token CSRF): outros ataques visam a rede ou a infraestrutura, fora do código aplicativo sozinho. |
| **Ferramentas utilizáveis** | `filter_input()`, `htmlspecialchars()`, PDO (consultas preparadas), `password_hash`/`password_verify`, `hash_equals()`. |
| **Armadilhas a evitar** | Comparar dois hashes com `==` (falha *magic hash*); concatenar um dado do usuário diretamente em uma consulta SQL. |
| **Boas práticas** | Sempre validar/escapar um dado do usuário conforme seu uso (exibição, SQL, comparação); HTTPS sistemático, sem exceção para um dado considerado "não tão sensível". |
