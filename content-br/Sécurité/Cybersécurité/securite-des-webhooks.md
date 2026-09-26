---
order: 7
---

# Segurança dos webhooks

Um **webhook** é o inverso de uma chamada de API clássica: em vez de a sua aplicação buscar uma informação em um serviço de terceiros, é esse serviço que envia por conta própria uma requisição para uma URL da sua aplicação assim que um evento acontece (um pagamento confirmado, uma mensagem recebida, um arquivo enviado). Essa inversão cria um problema que a API clássica não tem: a sua aplicação agora precisa provar que uma requisição RECEBIDA vem realmente do serviço esperado, e não de um atacante que simplesmente adivinhou a URL.

## O problema: qualquer um pode enviar uma requisição para essa URL

```text
Serviço de terceiros (pagamento) -----> POST https://seu-site.example/webhooks/pagamento
                                         { "pedido_id": 42, "status": "pago" }

Atacante (adivinhou ou achou a URL) -----> POST https://seu-site.example/webhooks/pagamento
                                            { "pedido_id": 42, "status": "pago" }
                                            (notificação FALSA: pedido nunca pago)
```

Sem verificação, o código que recebe esse webhook não consegue distinguir as duas requisições: as duas chegam com a mesma forma, na mesma URL.

## A solução: HMAC, já visto, aplicado a esse cenário específico

O [HMAC](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (assinatura simétrica por segredo compartilhado) é o mecanismo padrão para autenticar um webhook: o serviço de terceiros e a sua aplicação compartilham um segredo de antemão (fornecido na configuração do webhook), e cada requisição enviada vem acompanhada de uma assinatura calculada com esse segredo.

```text
Serviço de terceiros (conhece o segredo compartilhado)
  1. Calcula assinatura = HMAC(corpo_da_requisição, segredo)
  2. Envia a requisição com um cabeçalho: X-Signature: <assinatura>

Sua aplicação (conhece o mesmo segredo)
  3. Recalcula a sua PRÓPRIA assinatura a partir do corpo recebido + o segredo
  4. Compara a sua assinatura com a recebida no cabeçalho X-Signature
  5. Se forem diferentes -> requisição rejeitada (não enviada de fato pelo serviço,
     ou corpo modificado no caminho)
```

```php
// Verificação do lado da aplicação (PHP), ao receber o webhook
$corpo_recebido = file_get_contents('php://input');
// cabeçalho ausente: string vazia, que hash_equals() rejeita
$assinatura_recebida = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
$assinatura_calculada = hash_hmac('sha256', $corpo_recebido, $segredo_compartilhado);

// hash_equals() (já visto em criptografia aplicada): comparação em tempo constante,
// nunca == / === em uma assinatura, para evitar um ataque por medição de tempo
if (!hash_equals($assinatura_calculada, $assinatura_recebida)) {
    http_response_code(401);
    exit;
}
```

> **Armadilha:** verificar a origem de um webhook só pelo endereço IP de origem ou, pior, não verificar nada supondo que "a URL é secreta, então ninguém mais a conhece". Um endereço IP é mais fácil de falsificar do que uma assinatura HMAC, e uma URL "secreta" quase sempre acaba aparecendo em um log, em um histórico de navegador compartilhado ou em uma configuração exposta.
>
> **Boa prática:** verificar sistematicamente uma assinatura HMAC em todo webhook recebido, com uma comparação em tempo constante (`hash_equals()`, nunca `==`), o mesmo reflexo de qualquer comparação de segredos.

## O replay: uma requisição legítima capturada e reenviada mais tarde

Uma assinatura válida garante que a requisição vem do serviço de terceiros e não foi modificada, mas não garante nada sobre o MOMENTO em que ela é recebida. Um atacante que intercepta uma requisição webhook legítima (rede sem criptografia, log exposto, serviço de terceiros comprometido) pode reenviá-la do jeito que está mais tarde: a assinatura continua válida, já que o conteúdo não mudou.

```text
1. O atacante captura uma requisição webhook legítima já enviada e validada
   ("pedido 42 pago", assinatura válida)
2. Dias depois, o atacante reenvia EXATAMENTE a mesma requisição
3. A assinatura continua válida (mesmo corpo, mesmo segredo)
   -> se a aplicação só verifica a assinatura, ela processa
      o evento "pedido 42 pago" uma segunda vez
```

| Defesa contra o replay | Princípio |
|---|---|
| Carimbo de tempo (*timestamp*) incluído na assinatura | O serviço de terceiros inclui a hora do envio nos dados assinados; a aplicação rejeita toda requisição cujo carimbo de tempo ultrapasse uma janela de tolerância (ex.: 5 minutos), o que invalida automaticamente uma requisição reenviada mais tarde |
| Identificador de uso único (*nonce*) | O serviço de terceiros inclui um identificador único por evento; a aplicação guarda os identificadores já processados (pelo menos durante a janela de tolerância) e rejeita qualquer duplicata |

> **Boa prática:** combinar o HMAC (autenticidade) com um carimbo de tempo verificado e/ou um identificador de evento já processado (idempotência), em vez de contar só com a assinatura.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um webhook inverte o sentido habitual de uma chamada de API: o serviço de terceiros envia uma requisição para a sua aplicação, que precisa verificar que ela vem mesmo dele. O HMAC (assinatura por segredo compartilhado) autentica a requisição; um carimbo de tempo ou um identificador de evento impede que uma requisição legítima capturada seja reenviada mais tarde. |
| **Ferramentas utilizáveis** | `hash_hmac()` + `hash_equals()` para verificar uma assinatura; um carimbo de tempo assinado ou um identificador de evento guardado do lado da aplicação para impedir o replay. |
| **Armadilhas a evitar** | Verificar um webhook só pelo endereço IP de origem ou pelo segredo da URL. Comparar uma assinatura com `==`/`===`. Verificar só a assinatura, sem proteção contra o replay de uma requisição já processada. |
| **Boas práticas** | Verificar sistematicamente uma assinatura HMAC em tempo constante. Acrescentar uma janela de carimbo de tempo e/ou uma deduplicação por identificador de evento para impedir o replay. |
