---
order: 12
---

# Fazer chamadas HTTP nativamente

PHP oferece pelo menos duas formas nativas de fazer requisições HTTP de saída (consultar uma API externa, por exemplo), sem depender de nenhuma biblioteca externa: a extensão cURL, e os fluxos (streams).

> Uma **API** (*Application Programming Interface*, interface de programação) é o contrato pelo qual um software expõe suas funcionalidades a outro: quais requisições enviar, em qual formato, e quais respostas esperar. O termo designa tanto um serviço web consultável via HTTP (o caso aqui) quanto o conjunto de funções públicas de uma biblioteca.
>
> As respostas de uma API web geralmente estão no formato **JSON** (*[JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) Object Notation*): um formato texto de representação de dados estruturados, legível por humanos, nascido em JavaScript mas hoje independente de qualquer linguagem. PHP o converte com `json_encode()` / `json_decode()`.

## cURL

API em 4 etapas: criar um handle, configurar opções, executar, liberar.

```php
<?php
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $corpoJson,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],  // indispensavel para um corpo JSON
    CURLOPT_RETURNTRANSFER => true,                                // retornar a resposta como string, em vez de exibi-la diretamente
    CURLOPT_TIMEOUT        => 10,
]);

$resposta = curl_exec($ch);        // false em caso de falha de rede (estilo de erro "a moda C")
$codigoHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
?>
```

`CURLOPT_*` são constantes inteiras padrão pela extensão cURL (como flags de `open()` em [C](/?c=langages-de-programmation&s=c&p=c)): cada uma configura um aspecto preciso da requisição.

### Converter um retorno "à moda C" em exceção

`curl_exec()` retorna `false` em caso de falha de rede, em vez de lançar uma exceção: um ponto de entrada pode absorver esse detalhe e deixar subir apenas exceções para o resto do programa:

```php
<?php
if ($resposta === false || $codigoHttp !== 200) {
    throw new \RuntimeException("HTTP $codigoHttp");
}
?>
```

Uma vez feita essa conversão em um único lugar, o resto do projeto nunca mais precisa saber que `curl_exec()` pode retornar `false`: ele pode simplesmente usar `try`/`catch`, como com qualquer outro erro PHP moderno.

## Os fluxos PHP (streams): outra API para a mesma necessidade

PHP trata URLs como uma variante de "arquivo" que `file_get_contents()` sabe ler diretamente. `stream_context_create()` configura esse comportamento (método HTTP, cabeçalhos, corpo, SSL...):

```php
<?php
$opcoes = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $corpoJson,
    ],
];
$contexto = stream_context_create($opcoes);
$resposta = file_get_contents($url, false, $contexto); // false em caso de falha, mesmo estilo que curl_exec
?>
```

> **Nota:** em um array associativo literal, uma chave duplicada tem seu **último** valor vencendo silenciosamente: a primeira escrita é código morto, nunca usada. Uma boa razão para fazer revisar esse tipo de array (opções HTTP, configuração...) por um linter, ou lê-lo você mesmo linha por linha se perguntando "qual é o último valor atribuído a essa chave?".

## `json_decode()`: um retorno `null` ambíguo

```php
<?php
$dados = json_decode($resposta, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    throw new \RuntimeException('Resposta JSON invalida');
}
?>
```

`json_decode()` em uma string inválida retorna `null`, mas uma string JSON **válida** contendo literalmente `"null"` também se decodifica em `null`. Um simples `if ($dados === null)` então não permitiria distinguir "JSON inválido" de "JSON realmente valia `null`". Daí `json_last_error()`: uma função separada que informa se a última conversão realmente falhou, independentemente do valor obtido, mesma lógica que `isset()`/`empty()` diante de uma chave de array (veja [As variáveis](/?c=langages-de-programmation&s=php&p=variables)): nunca confiar em um valor ambíguo quando existe um mecanismo dedicado para eliminar a dúvida.

`json_encode()` / `json_decode(..., true)` são o equivalente PHP de `JSON.stringify()` / `JSON.parse()` em JavaScript (o `true` pede um array associativo, em vez de um objeto `stdClass`).

## `verify_peer` / `verify_peer_name`: verificar o certificado do servidor remoto

O bloco `ssl` de um contexto de fluxo (cf. exemplo acima) controla duas verificações **independentes**, não a mesma coisa duas vezes:

```php
<?php
$opcoes = [
    'ssl' => [
        'verify_peer'      => false,  // o certificado e assinado por uma autoridade reconhecida?
        'verify_peer_name' => false,  // o nome do certificado corresponde ao dominio chamado?
    ],
];
?>
```

- `verify_peer`: o certificado apresentado pelo servidor é assinado por uma autoridade certificadora (CA) reconhecida? Desativado, um certificado autoassinado (fabricado em poucos segundos com `openssl`) é aceito sem problema.
- `verify_peer_name`: o nome inscrito nesse certificado corresponde ao nome de domínio realmente chamado? Um certificado perfeitamente válido (assinado por uma CA real) mas emitido para *outro* domínio falha nesse teste.

Desativar `verify_peer` é a falha mais ampla das duas: ela abre a porta para um ataque **man-in-the-middle** sem o menor esforço de um atacante, que nem precisa obter um certificado assinado por uma CA real (veja [Proteger seus dados](/?c=langages-de-programmation&s=php&p=securite) para o detalhe desse ataque). `verify_peer_name` sozinho, desativado, é um grau menos grave (ainda seria necessário um certificado assinado por uma CA, apenas para o domínio errado), mas continua sendo uma falha.

> **Nota:** desativar os dois é um compromisso comum em desenvolvimento local (uma API auto-hospedada com um certificado autoassinado, por exemplo), mas volta a ser um risco de segurança real se o mesmo código rodar em produção sem distinção de ambiente. cURL tem o equivalente exato via `CURLOPT_SSL_VERIFYPEER` e `CURLOPT_SSL_VERIFYHOST`.

## `ignore_errors`: o que `file_get_contents()` faz diante de uma resposta HTTP de erro?

Por padrão (sem `ignore_errors`), se o servidor responder com um código HTTP de erro (4xx/5xx), `file_get_contents()` retorna `false` e descarta o corpo da resposta, **mesmo que PHP tenha recebido esse corpo corretamente**. Com `ignore_errors => true`, a função retorna o corpo real da resposta, seja qual for o código HTTP:

```php
<?php
$opcoes = ['http' => ['ignore_errors' => true]];
$contexto = stream_context_create($opcoes);

$resposta = file_get_contents($url, false, $contexto);
// com ignore_errors: $resposta contem o corpo mesmo para um 404/500
// sem ignore_errors : $resposta vale false para um 404/500, mesmo que o servidor tenha respondido
```

Consequência direta em uma conversão "valor de retorno → exceção" como a vista acima (`if ($resposta === false) { throw ... }`): com `ignore_errors => true`, esse teste não é mais acionado **de forma alguma** para um erro HTTP (4xx/5xx): apenas para uma falha de comunicação mais radical (servidor inacessível, DNS não resolve, timeout de rede, um caso em que PHP não recebe nada, nem mesmo cabeçalhos).

> **Nota:** os dois mecanismos são complementares, não redundantes. Uma vez ativado `ignore_errors`, cada chamador precisa reverificar ele mesmo o código HTTP real (`$http_response_header`, veja a documentação PHP) para distinguir "comunicação bem-sucedida mas resposta de erro aplicativa" de "tudo correu bem": algo que o `throw` inicial (reservado para falha de rede) não cobre mais.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | PHP faz requisições HTTP de saída nativamente via cURL ou os fluxos (streams), sem biblioteca externa. Ambos retornam `false` em caso de falha de rede, estilo de erro "à moda C" em vez de uma exceção. |
| **Ferramentas utilizáveis** | `curl_init`/`curl_setopt_array`/`curl_exec`, `stream_context_create`/`file_get_contents`, `json_encode`/`json_decode`, `json_last_error()`. |
| **Armadilhas a evitar** | Desativar `verify_peer`/`verify_peer_name` em produção (abre a porta para um MITM); confundir um `json_decode()` que retorna `null` por falha com um JSON válido contendo literalmente `null`. |
| **Boas práticas** | Converter um retorno "à moda C" (`false`) em exceção em um único lugar do código; verificar `json_last_error()` em vez de testar diretamente o valor decodificado. |
