---
order: 11
---

# Gerenciar as conexões

Quando um usuário navega em um site, o servidor frequentemente precisa se lembrar dele de uma página para outra, ou até de uma visita para outra: permanecer conectado, recuperar suas preferências, seu carrinho... Para isso, PHP oferece várias ferramentas, cada uma com seus próprios usos: os **cookies** (armazenados no usuário), as **sessões** (armazenadas no servidor), e os **tokens de conexão** (para uma conexão de longa duração). Este capítulo apresenta essas três ferramentas e explica quando usar uma em vez da outra.

## Os cookies
Um **cookie** é um pequeno dado armazenado pelo navegador do usuário, enviado automaticamente ao servidor a cada requisição para o mesmo site. Ao contrário das variáveis PHP clássicas (que desaparecem ao final de cada script), um cookie persiste entre várias visitas, mesmo que o usuário feche o navegador.

Os cookies servem tipicamente para:
- Lembrar de um usuário (permanecer conectado, "lembrar de mim")
- Salvar preferências (idioma, tema claro/escuro...)
- Rastrear um carrinho de compras antes da criação de uma conta

### Criar um cookie
```php
<?php
    setcookie("nome_cookie", "valor", time() + 3600); // expira em 1h
?>
```

`setcookie()` recebe principalmente 3 parâmetros:
- O nome do cookie
- O valor a armazenar
- A data de expiração (em timestamp Unix, `time()` retorna a hora atual, então `time() + 3600` significa "em 1h")

> **Nota importante:** `setcookie()` deve ser chamada **antes** de qualquer exibição HTML (antes de qualquer tag, espaço ou quebra de linha), pois ela modifica os cabeçalhos (*headers*) HTTP da resposta. É a mesma lógica da tag de fechamento `?>` mencionada mais acima.

### Ler um cookie
Uma vez criado, um cookie é acessível via a variável global `$_COOKIE`:

```php
<?php
    if (isset($_COOKIE["nome_cookie"])) {
        echo $_COOKIE["nome_cookie"];
    }
?>
```

> **Nota:** um cookie criado com `setcookie()` só fica disponível em `$_COOKIE` a partir do **próximo carregamento** da página, não imediatamente no mesmo script.

### Modificar um cookie
Não existe função "update": para modificar um cookie, basta recriá-lo com o mesmo nome e um novo valor, o que sobrescreve o antigo:

```php
<?php
    setcookie("nome_cookie", "novo_valor", time() + 3600);
?>
```

### Remover um cookie
Para remover um cookie, recria-se ele com uma data de expiração **no passado**:

```php
<?php
    setcookie("nome_cookie", "", time() - 3600);
?>
```

### Proteger um cookie
`setcookie()` aceita opções adicionais para reforçar a segurança:

```php
<?php
    setcookie("nome_cookie", "valor", [
        "expires" => time() + 3600,
        "path" => "/",
        "secure" => true,
        "httponly" => true,
        "samesite" => "Strict"
    ]);
?>
```

- `secure`: o cookie só é transmitido se a conexão for HTTPS.
- `httponly`: impede que JavaScript (`document.cookie`) acesse o cookie, o que limita os danos em caso de falha XSS.
- `samesite`: impede que o cookie seja enviado em uma requisição vinda de outro site, o que protege contra ataques CSRF.

> **Nota:** nunca armazene informações sensíveis (senha, número de cartão de crédito...) em um cookie, mesmo protegido. Um cookie continua manipulável pelo próprio usuário. Para dados sensíveis do lado do servidor, prefira as **sessões** (`$_SESSION`).

## As sessões

Uma **sessão** permite armazenar dados **do lado do servidor**, associando-os a um visitante específico. Ao contrário de um cookie (armazenado no usuário e modificável por ele), o dado de sessão permanece no servidor: o usuário não tem, portanto, nenhum meio de lê-lo ou modificá-lo diretamente.

PHP faz a ligação entre o visitante e seus dados graças a um identificador de sessão único, enviado automaticamente ao navegador na forma de um cookie (geralmente chamado `PHPSESSID`). Esse cookie então não contém nenhum dado sensível: apenas um identificador, que aponta para os dados reais armazenados no servidor.

### Iniciar uma sessão

```php
<?php
    session_start(); // deve ser chamada antes de qualquer exibicao HTML, como setcookie()
?>
```

### Armazenar um dado na sessão

```php
<?php
    session_start();

    $_SESSION["user_id"] = 12;
    $_SESSION["email"] = "joao@exemplo.com";
?>
```

### Ler um dado da sessão

```php
<?php
    session_start();

    if (isset($_SESSION["user_id"])) {
        echo "Conectado como usuario n." . $_SESSION["user_id"];
    }
?>
```

> **Nota:** `session_start()` deve ser chamada no início de **cada** página onde você quer acessar `$_SESSION`, senão PHP não sabe a qual visitante associar os dados.

### Remover um dado ou destruir a sessão

```php
<?php
    session_start();

    unset($_SESSION["user_id"]);  // remove apenas esse dado
    session_destroy();            // destroi toda a sessao (ex: ao desconectar)
?>
```

> **Nota:** por padrão, o cookie `PHPSESSID` (e portanto a sessão) desaparece ao fechar o navegador, ou após um período de inatividade do lado do servidor. Para manter uma conexão por mais tempo (vários dias/semanas), as sessões clássicas não bastam: veja a parte sobre tokens de conexão abaixo.

## Os tokens de conexão ("lembrar de mim")

Para manter um usuário conectado a longo prazo (vários dias/semanas), mesmo após fechar o navegador, nem o cookie clássico (inseguro para isso) nem a sessão (muito efêmera) bastam. Usa-se então um **token de conexão** (*remember token*): uma prova de conexão de longa duração, armazenada tanto no usuário quanto no servidor.

O princípio:
- Nunca se armazena a senha para fazer isso: apenas um token aleatório.
- O token é enviado em texto claro em um cookie no usuário.
- Sua versão **hasheada** é armazenada no banco de dados, associada à sua conta (como para uma senha).

### Criar o token na conexão

```php
<?php
    $token = bin2hex(random_bytes(32)); // token aleatorio (64 caracteres hexadecimais)
    $tokenHash = hash('sha256', $token);

    // armazena-se $tokenHash no banco, ligado ao usuario (ex: coluna "remember_token")

    // envia-se $token (nao hasheado) em um cookie seguro, de longa duracao
    setcookie("remember_token", $token, time() + 60 * 60 * 24 * 30, "/", "", true, true);
?>
```

### Reconectar automaticamente o usuário

A cada visita, se a sessão estiver vazia mas o cookie `remember_token` existir, verifica-se sua correspondência no banco:

```php
<?php
    session_start();

    if (!isset($_SESSION["user_id"]) && isset($_COOKIE["remember_token"])) {
        $tokenHash = hash('sha256', $_COOKIE["remember_token"]);

        // busca-se no banco um usuario cujo remember_token corresponda
        $stmt = $pdo->prepare("SELECT * FROM users WHERE remember_token = :token");
        $stmt->execute(['token' => $tokenHash]);
        $user = $stmt->fetch();

        if ($user) {
            $_SESSION["user_id"] = $user["id"]; // reconecta o usuario
        }
    }
?>
```

> **Nota:** sempre se compara o **hash** do token recebido com o armazenado no banco, nunca o token em texto claro: exatamente como para uma senha com `password_hash()`/`password_verify()`. Se o cookie for roubado, o ladrão não consegue deduzir o hash armazenado, mas sobretudo, é possível revogar esse token a qualquer momento removendo-o do banco (ex: em caso de troca de senha ou desconexão explícita).

### Cookie, sessão ou token de conexão, o que escolher?

| | Cookie | Sessão | Token de conexão |
|---|---|---|---|
| Armazenamento | Do lado do navegador | Do lado do servidor | Os dois (token no usuario, hash no banco) |
| Manipulável pelo usuário | Sim | Não | O token sim, mas inutil sem o hash correspondente no banco |
| Persistência | Pode durar dias/meses | Geralmente ate o fechamento do navegador | Pode durar dias/meses |
| Revogável a qualquer momento | Não | Sim (`session_destroy()`) | Sim (remocao do hash no banco) |
| Uso típico | Preferencias, idioma, tema | Conexao de usuario (curta duracao), carrinho, dados sensiveis | Conexao de usuario (longa duracao), "lembrar de mim" |

## O que o cookie de sessão realmente contém

Erro frequente: acreditar que `$_SESSION` é armazenado no cookie do navegador. Na realidade:

- `session_start()` gera um **identificador aleatório opaco** (ex. `a3f9c1...`), enviado ao cliente em um cookie (`PHPSESSID` por padrão). É tudo que o cookie contém.
- Os dados (`$_SESSION['...'] = ...`) são escritos **do lado do servidor** (arquivo ou banco), associados a esse identificador.
- A cada requisição seguinte, o navegador reenvia o cookie; PHP relê o identificador, encontra o armazenamento do servidor correspondente, recarrega `$_SESSION`.

> **Analogia:** um ticket de guarda-volumes. O número no ticket é sorteado **no momento em que se deixa o casaco**: ele não tem nenhuma relação com o casaco em si. A ligação número ↔ casaco só existe no registro do funcionário (o armazenamento do servidor), nunca no número.

### O risco do roubo de sessão

Se um atacante adivinhasse ou roubasse o identificador de uma sessão já aberta, ele herdaria seu conteúdo, mas não pode *escolher* o alvo: o identificador é gerado por um CSPRNG (gerador aleatório criptograficamente seguro) com uma entropia enorme, comparável a uma senha de várias centenas de bits. `session_set_cookie_params(['httponly' => true])` adiciona uma proteção complementar: ela impede que o JavaScript da página leia esse cookie, o que limita os danos em caso de falha XSS.

### Por que não simplesmente derivar o identificador por hash de um dado conhecido?

Um hash simples (`sha256($identificador_conhecido)`) é **determinístico e sem segredo**: qualquer um pode recalculá-lo. Se existir um número limitado de valores possíveis (ex. umas trinta contas), um atacante nem precisa forçar um espaço grande: basta hashear cada valor possível para obter todos os identificadores válidos. Um hash sozinho não adiciona **nenhuma entropia** além daquela já presente na entrada.

## Tokens assinados (HMAC): carregar um dado permanecendo infalsificável

O token de conexão visto acima é um segredo **opaco** (aleatório, sem significado), verificado por correspondência com um hash armazenado no banco. Mas às vezes, precisa-se de um token que **carregue ele mesmo uma informação** (ex. um identificador), permanecendo impossível de falsificar sem acesso ao servidor. Usa-se então `hash_hmac()`: um hash calculado com uma **chave secreta**, conhecida apenas pelo servidor.

```php
<?php
function criarToken(string $dado, string $segredo): string
{
    $codificado = base64_encode($dado);                 // codificado, NAO cifrado: legivel se decodificado
    $assinatura = hash_hmac('sha256', $codificado, $segredo);
    return $codificado . '.' . $assinatura;
}

function verificarToken(string $token, string $segredo): ?string
{
    [$codificado, $assinatura] = explode('.', $token, 2);
    $esperado = hash_hmac('sha256', $codificado, $segredo);

    if (!hash_equals($esperado, $assinatura)) {
        return null; // assinatura invalida -> dado rejeitado, mesmo que parecesse correto
    }
    return base64_decode($codificado);
}
?>
```

Se a parte `$codificado` for modificada por alguém que não conhece `$segredo`, a assinatura recalculada na verificação nunca mais corresponderá: a modificação não é impedida fisicamente, mas **detectada**.

### Identificador de sessão vs token assinado: duas necessidades diferentes

| | Identificador de sessão | Token assinado (HMAC) |
|---|---|---|
| Contém a informação? | Não: chave opaca, nenhum dado | Sim: o dado esta codificado nele |
| Exige armazenamento no servidor? | Sim: o dado vive em um arquivo/banco associado a chave | Não: autossuficiente, verificavel recalculando a assinatura a qualquer momento |
| Caso de uso típico | Usuario ja identificado, sessao em andamento | Dado a transmitir de forma verificavel sem banco a consultar (link de ativacao, convidado sem conta...) |

> **Nota:** `hash_equals()` em vez de um simples `===` para comparar dois hashes: ela compara em tempo constante, o que evita que um atacante deduza progressivamente o valor correto medindo o tempo de resposta (ataque por timing).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um cookie é armazenado do lado do navegador (manipulável pelo usuário), uma sessão do lado do servidor (identificador opaco enviado via cookie). Um token de conexão combina os dois para uma conexão de longa duração. |
| **Ferramentas utilizáveis** | `setcookie()`, `$_SESSION`/`session_start()`, `hash_hmac()`/`hash_equals()` para um token assinado. |
| **Armadilhas a evitar** | Armazenar um dado sensível em um cookie; comparar dois hashes com `==`/`===` em vez de `hash_equals()`. |
| **Boas práticas** | `httponly`/`secure`/`samesite` em todo cookie de sessão; comparar o hash de um token recebido, nunca o token em texto claro. |
