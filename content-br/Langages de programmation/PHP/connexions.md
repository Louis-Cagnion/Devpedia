---
order: 10
---

# Gerir as ligações

Quando um usuário navega num site, o servidor precisa frequentemente de se lembrar dele de uma página para outra, ou mesmo de uma visita para outra: manter a sessão ativa, recuperar as suas preferências, o seu carrinho de compras... Para tal, o PHP disponibiliza várias ferramentas, cada uma com as suas próprias finalidades: os **cookies** (armazenados no dispositivo do usuário), as **sessões** (armazenadas no servidor) e os **tokens de ligação** (para uma ligação de longa duração). Este capítulo apresenta estas três ferramentas e explica quando utilizar uma em vez de outra.

## Os cookies
Um **cookie** é um pequeno arquivo de dados armazenado pelo navegador do usuário, enviado automaticamente para o servidor sempre que é feita uma solicitação ao mesmo site. Ao contrário das variáveis PHP clássicas (que desaparecem no final de cada script), um cookie persiste entre várias visitas, mesmo que o usuário feche o navegador.

Os cookies servem normalmente para:
- Lembrar-se de um usuário (manter-se ligado, «lembrar-se de mim»)
- Guardar preferências (idioma, tema claro/escuro...)
- Acompanhar um cesto de compras antes da criação de uma conta

### Criar um cookie
```php
<?php
    setcookie("nom_cookie", "valeur", time() + 3600); // expira dentro de 1 hora
?>
```

`setcookie()` aceita principalmente 3 parâmetros:
- O nome do cookie
- O valor a armazenar
- A data de validade (em timestamp Unix: `time()` devolve a hora atual, pelo que `time() + 3600` significa «daqui a 1 hora»)

> **Nota importante:** a função `setcookie()` deve ser chamada **antes** **de** qualquer conteúdo HTML (antes de qualquer baliza, espaço ou retorno de linha), uma vez que altera os cabeçalhos (*headers*) HTTP da resposta. Trata-se da mesma lógica que se aplica à baliza de fecho `?>`, mencionada anteriormente.

### Ler um cookie
Depois de criado, um cookie fica acessível através da variável global `$_COOKIE`:

```php
<?php
    if (isset($_COOKIE["nom_cookie"])) {
        echo $_COOKIE["nom_cookie"];
    }
?>
```

> **Nota:** um cookie criado com `setcookie()` só fica disponível em `$_COOKIE` a partir da **próxima atualização** da página, e não imediatamente no mesmo script.

### Alterar um cookie
Não existe uma função «update»: para alterar um cookie, basta recriá-lo com o mesmo nome e um novo valor, o que substitui o anterior:

```php
<?php
    setcookie("nom_cookie", "nouvelle_valeur", time() + 3600);
?>
```

### Eliminar um cookie
Para eliminar um cookie, basta recriá-lo com uma data de validade **no passado**:

```php
<?php
    setcookie("nom_cookie", "", time() - 3600);
?>
```

### Proteger um cookie
`setcookie()` aceita opções adicionais para reforçar a segurança:

```php
<?php
    setcookie("nom_cookie", "valeur", [
        "expires" => time() + 3600,
        "path" => "/",
        "secure" => true,
        "httponly" => true,
        "samesite" => "Strict"
    ]);
?>
```

- `secure` : o cookie só é transmitido se a ligação for em HTTPS.
- `httponly` : impede que o JavaScript (`document.cookie`) acesse o cookie, o que limita os danos em caso de falha XSS.
- `samesite` : impede que o cookie seja enviado durante um pedido proveniente de outro site, o que protege contra ataques CSRF.

> **Nota:** nunca armazene informações confidenciais (senhas, números de cartões de crédito, etc.) num cookie, mesmo que este seja seguro. Um cookie pode ser manipulado pelo próprio usuário. Para dados confidenciais do lado do servidor, opte por utilizar **sessões** (`$_SESSION`).

## As sessões

Uma **sessão** permite armazenar dados **no servidor**, associando-os a um visitante específico. Ao contrário de um cookie (armazenado no computador do usuário e que este pode alterar), os dados da sessão permanecem no servidor, pelo que o usuário não tem qualquer forma de os ler ou alterar diretamente.

O PHP estabelece a ligação entre o visitante e os seus dados através de um identificador de sessão único, enviado automaticamente para o navegador sob a forma de um cookie (geralmente denominado «`PHPSESSID`»). Este cookie não contém, portanto, quaisquer dados sensíveis: apenas um identificador, que remete para os dados reais armazenados no servidor.

### Iniciar uma sessão

```php
<?php
    session_start(); // Deve ser chamada antes de qualquer exibição de HTML, tal como setcookie()
?>
```

### Armazenar dados na sessão

```php
<?php
    session_start();

    $_SESSION["user_id"] = 12;
    $_SESSION["email"] = "jean@example.com";
?>
```

### Ler dados de uma sessão

```php
<?php
    session_start();

    if (isset($_SESSION["user_id"])) {
        echo "Connecté en tant qu'utilisateur n°" . $_SESSION["user_id"];
    }
?>
```

> **Nota:** «`session_start()`» deve ser chamado no início de **cada** página em que pretenda acessar «`$_SESSION`», caso contrário, o PHP não saberá a que visitante associar os dados.

### Eliminar dados ou encerrar a sessão

```php
<?php
    session_start();

    unset($_SESSION["user_id"]); // elimina apenas este dado
    session_destroy();           // elimina toda a sessão (por exemplo: ao terminar a sessão)
?>
```

> **Nota:** por padrão, o cookie `PHPSESSID` (e, consequentemente, a sessão) desaparece ao fechar o navegador ou após um período de inatividade do lado do servidor. Para prolongar a duração de uma ligação (vários dias/semanas), as sessões clássicas não são suficientes; consulte a secção sobre tokens de ligação abaixo.

## Os tokens de sessão («lembrar-me»)

Para manter um usuário ligado a longo prazo (vários dias/semanas), mesmo após o encerramento do navegador, nem o cookie clássico (que não é seguro para esse fim) nem a sessão (demasiado efémera) são suficientes. Recorre-se, então, a um **token de ligação** (*remember token*): uma prova de ligação de longa duração, armazenada tanto no dispositivo do usuário como no servidor.

O princípio:
- **Nunca** se armazena a senha para o fazer, apenas um token aleatório.
- O token é enviado em texto simples num cookie no dispositivo do usuário.
- A sua versão **hash** é armazenada numa base de dados, associada à sua conta (tal como acontece com uma senha).

### Criar o token aquando da ligação

```php
<?php
    $token = bin2hex(random_bytes(32)); // token aleatório (64 caracteres hexadecimais)
    $tokenHache = hash('sha256', $token);

    // O $tokenHache é armazenado na base de dados, associado ao usuário (por exemplo: coluna «remember_token»)

    // Envia-se o $token (não hashado) num cookie seguro e de longa duração
    setcookie("remember_token", $token, time() + 60 * 60 * 24 * 30, "/", "", true, true);
?>
```

### Reconectar automaticamente o usuário

A cada visita, se a sessão estiver vazia mas o cookie `remember_token` existir, verifica-se se este corresponde aos dados da base de dados:

```php
<?php
    session_start();

    if (!isset($_SESSION["user_id"]) && isset($_COOKIE["remember_token"])) {
        $tokenHache = hash('sha256', $_COOKIE["remember_token"]);

        // procura-se na base de dados um usuário cujo «remember_token» corresponda
        $stmt = $pdo->prepare("SELECT * FROM users WHERE remember_token = :token");
        $stmt->execute(['token' => $tokenHache]);
        $user = $stmt->fetch();

        if ($user) {
            $_SESSION["user_id"] = $user["id"]; // reautentica o usuário
        }
    }
?>
```

> **Nota:** compara-se sempre o **hash** do token recebido com o que está armazenado na base de dados, nunca o token em texto simples, exatamente como acontece com uma senha em `password_hash()` / `password_verify()`. Se o cookie for roubado, o ladrão não consegue deduzir o hash armazenado, mas, acima de tudo, é possível revogar esse token a qualquer momento, eliminando-o da base de dados (por exemplo: em caso de alteração da senha ou de desligamento explícito).

### Cookie, sessão ou token de ligação: qual escolher?

| | Cookie | Sessão | Token de sessão |
|---|---|---|---|
| Armazenamento | Lado do navegador | Lado do servidor | Ambos (token no lado do usuário, hash na base de dados) |
| Manipulável pelo usuário | Sim | Não | O token sim, mas inútil sem o hash correspondente na base |
| Persistência | Pode durar dias/meses | Geralmente até ao encerramento do navegador | Pode durar dias/meses |
| Revogável a qualquer momento | Não | Sim (`session_destroy()`) | Sim (eliminação do hash da base de dados) |
| Utilização típica | Preferências, idioma, tema | Início de sessão do usuário (curta duração), cesto de compras, dados sensíveis | Início de sessão do usuário (longa duração), «lembrar-me» |

## O que o cookie de sessão realmente contém

Erro frequente: acreditar que `$_SESSION` está armazenado no cookie do navegador. Na realidade:

- `session_start()` Gera um **identificador aleatório opaco** (por exemplo, `a3f9c1...`), enviado ao cliente num cookie (por padrão, `PHPSESSID`). É tudo o que o cookie contém.
- Os dados (`$_SESSION['...'] = ...`) são gravados **no lado do servidor** (arquivo ou base de dados), associados a este identificador.
- A cada pedido subsequente, o navegador reenvia o cookie; o PHP lê novamente o identificador, localiza o armazenamento no servidor correspondente e recarrega `$_SESSION`.

> **Analogia:** um bilhete de vestiário. O número no bilhete é sorteado aleatoriamente **no momento em que o casaco é entregue**: não tem qualquer relação com o próprio casaco. A ligação entre o número e o casaco existe apenas no registro do funcionário (o armazenamento no servidor), nunca no próprio número.

### O risco de roubo de sessão

Se um atacante adivinhasse ou roubasse o identificador de uma sessão já aberta, herdaria o seu conteúdo, mas não pode *escolher* o alvo: o identificador é gerado por um CSPRNG (gerador aleatório criptograficamente seguro) com uma entropia enorme, comparável a uma senha de várias centenas de bits. `session_set_cookie_params(['httponly' => true])` acrescenta uma proteção adicional: impede que o JavaScript da página leia esse cookie, o que limita os danos em caso de uma falha XSS.

### Porque não derivar simplesmente o identificador a partir do hash de um dado conhecido?

Um hash simples (`sha256($identifiant_connu)`) é **determinístico e não contém segredos**: qualquer pessoa pode recalculá-lo. Se existir um número limitado de valores possíveis (por exemplo, cerca de trinta contas), um atacante nem sequer precisa de recorrer a um ataque de força bruta num espaço extenso: basta-lhe aplicar o hash a cada valor possível para obter todos os identificadores válidos. Um hash, por si só, não acrescenta **qualquer entropia** para além da que já está presente na entrada.

## Tokens assinados (HMAC): transmitir dados de forma a que não possam ser falsificados

O token de ligação mencionado anteriormente é um segredo **opaco** (aleatório, sem significado), verificado por comparação com um hash armazenado na base de dados. Mas, por vezes, é necessário um token que **contenha ele próprio uma informação** (por exemplo, um identificador), mantendo-se, ao mesmo tempo, impossível de falsificar sem acesso ao servidor. Nesse caso, utiliza-se um`hash_hmac()`: um hash calculado com uma **chave secreta**, conhecida apenas pelo servidor.

```php
<?php
function creerToken(string $donnee, string $secret): string
{
    $encode = base64_encode($donnee);                 // codificada, NÃO encriptada: legível se descodificada
    $signature = hash_hmac('sha256', $encode, $secret);
    return $encode . '.' . $signature;
}

function verifierToken(string $token, string $secret): ?string
{
    [$encode, $signature] = explode('.', $token, 2);
    $attendu = hash_hmac('sha256', $encode, $secret);

    if (!hash_equals($attendu, $signature)) {
        return null; // assinatura inválida -> dado rejeitado, mesmo que pareça correto
    }
    return base64_decode($encode);
}
?>
```

Se a parte `$encode` for alterada por alguém que não conheça `$secret`, a assinatura recalculada durante a verificação deixará de corresponder: a alteração não é impedida fisicamente, mas **é detetada**.

### Identificador de sessão vs. token assinado: duas necessidades diferentes

| | Identificador de sessão | Token assinado (HMAC) |
|---|---|---|
| Contém informação? | Não: chave opaca, sem dados | Sim: os dados estão codificados nela |
| Requer armazenamento num servidor? | Sim: os dados estão num arquivo/base de dados associado à chave | Não: autossuficiente, verificável através do recálculo da assinatura a qualquer momento |
| Caso de utilização típico | Usuário já identificado, sessão em curso | Dados a transmitir de forma verificável sem necessidade de consultar uma base de dados (ligação de ativação, convidado sem conta...) |

> **Nota:** Utilize `hash_equals()` em vez de simplesmente `===` para comparar dois hashes: esta função efetua a comparação em tempo constante, o que impede que um atacante deduza progressivamente o valor correto medindo o tempo de resposta (ataque por timing).
