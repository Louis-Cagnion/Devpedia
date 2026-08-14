---
order: 11
---

# Efetuar chamadas HTTP de forma nativa

O PHP oferece, pelo menos, duas formas nativas de efetuar pedidos HTTP de saída (por exemplo, consultar uma API externa), sem depender de nenhuma biblioteca de terceiros: a extensão cURL e os fluxos (streams).

## cURL

API em 4 etapas: criar um identificador, configurar opções, executar, libertar.

```php
<?php
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $corpsJson,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'], // indispensável para um corpo JSON
    CURLOPT_RETURNTRANSFER => true, // devolver a resposta como uma string, em vez de a apresentar diretamente
    CURLOPT_TIMEOUT        => 10,
]);

$resposta  = curl_exec($ch);        // false em caso de falha de rede (estilo de erro «à la C»)
$codeHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
?>
```

`CURLOPT_*` são constantes inteiras padrão pela extensão cURL (tal como os flags de `open()`m em C): cada uma configura um aspeto específico da solicitação.

### Converter um retorno «à la C» numa exceção

`curl_exec()` retorna `false` em caso de falha de rede, em vez de lançar uma exceção — um ponto de entrada pode absorver esse detalhe e permitir que apenas as exceções sejam transmitidas para o resto do programa:

```php
<?php
if ($resposta === false || $codeHttp !== 200) {
    throw new \RuntimeException("HTTP $codeHttp");
}
?>
```

Depois de efetuada esta conversão num único local, o resto do projeto já não precisa de saber que `curl_exec()` pode devolver `false`: pode simplesmente utilizar `try` / `catch`, tal como acontece com qualquer outro erro PHP moderno.

## Os fluxos PHP (streams) — outra API para a mesma finalidade

O PHP trata as URLs como uma variante de «arquivo» que `file_get_contents()` consegue ler diretamente. `stream_context_create()` configura este comportamento (método HTTP, cabeçalhos, corpo, SSL...):

```php
<?php
$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $corpsJson,
    ],
];
$contexte = stream_context_create($options);
$resposta  = file_get_contents($url, false, $contexte); // false em caso de falha, ao estilo do curl_exec
?>
```

> **Nota:** numa tabela associativa literal, quando uma chave está duplicada, o **último** valor é automaticamente adotado — a primeira gravação é código morto, nunca utilizado. Uma boa razão para submeter este tipo de tabela (opções HTTP, configuração...) à análise de um linter, ou para a ler você mesmo, linha a linha, perguntando-se «qual é o último valor atribuído a esta chave?».

## `json_decode()` : um retorno «`null`» ambíguo

```php
<?php
$dados = json_decode($resposta, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    throw new \RuntimeException('Réponse JSON invalide');
}
?>
```

`json_decode()` Uma string inválida devolve «`null`» — mas uma string JSON **válida** que contenha literalmente «`"null"`» também é descodificada como «`null`». Um simples «`if ($dados === null)`» não permitiria, portanto, distinguir «JSON inválido» de «JSON que era efetivamente `null`». Daí `json_last_error()`: uma função separada que indica se a última conversão falhou efetivamente, independentemente do valor obtido — a mesma lógica que `isset()` / `empty()` quando se trata de uma chave de matriz (ver capítulo sobre variáveis): nunca confiar num valor ambíguo quando existe um mecanismo específico para esclarecer a dúvida.

`json_encode()` / `json_decode(..., true)` são o equivalente em PHP de `JSON.stringify()` / `JSON.parse()` em JavaScript (o `true` requer um array associativo, em vez de um objeto `stdClass`).

## A aprofundar

Restam ainda dois aspetos relacionados com a segurança e a robustez das chamadas HTTP a explorar:

- `verify_peer` / `verify_peer_name` em `false` no bloco `ssl` de um contexto de fluxo: isto desativa a verificação do certificado SSL do servidor remoto. Por que razão se faria isto e qual é a desvantagem?
- `ignore_errors` (streams): como é que esta configuração altera o comportamento d`file_get_contents()`o perante uma resposta HTTP de erro (4xx/5xx)?
