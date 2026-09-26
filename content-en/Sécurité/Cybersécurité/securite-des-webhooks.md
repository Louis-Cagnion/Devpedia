---
order: 7
---

# Webhook Security

A **webhook** is the reverse of a classic API call: instead of your application fetching information from a third-party service, that third-party service sends a request on its own to a URL of your application as soon as an event occurs (a confirmed payment, a received message, an uploaded file). This reversal creates a problem the classic API does not have: your application must now prove that an INCOMING request really comes from the expected service, and not from an attacker who simply guessed the URL.

## The Problem: Anyone Can Send a Request to This URL

```text
Third-party service (payment) -----> POST https://your-site.example/webhooks/payment
                                      { "order_id": 42, "status": "paid" }

Attacker (guessed or found the URL) -----> POST https://your-site.example/webhooks/payment
                                            { "order_id": 42, "status": "paid" }
                                            (FAKE notification: order never paid)
```

Without verification, the code receiving this webhook cannot tell the two requests apart: both arrive with the same shape, on the same URL.

## The Solution: HMAC, Already Seen, Applied to This Exact Scenario

[HMAC](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (a symmetric signature based on a shared secret) is the standard mechanism for authenticating a webhook: the third-party service and your application share a secret in advance (provided when the webhook is configured), and every request sent comes with a signature computed with that secret.

```text
Third-party service (knows the shared secret)
  1. Computes signature = HMAC(request_body, secret)
  2. Sends the request with a header: X-Signature: <signature>

Your application (knows the same secret)
  3. Recomputes its OWN signature from the received body + the secret
  4. Compares its signature with the one received in the X-Signature header
  5. If they differ -> request rejected (not really sent by the third-party service,
     or body modified on the way)
```

```php
// Verification on the application side (PHP), when receiving the webhook
$received_body = file_get_contents('php://input');
// missing header: empty string, which hash_equals() rejects
$received_signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
$computed_signature = hash_hmac('sha256', $received_body, $shared_secret);

// hash_equals() (already seen in applied cryptography): constant-time comparison,
// never == / === on a signature, to avoid a timing attack
if (!hash_equals($computed_signature, $received_signature)) {
    http_response_code(401);
    exit;
}
```

> **Pitfall:** verifying the origin of a webhook only by its source IP address, or worse, verifying nothing at all on the assumption that "the URL is secret so nobody else knows it". An IP address is easier to forge than an HMAC signature, and a "secret" URL almost always ends up appearing in a log, a shared browser history or an exposed configuration.
>
> **Best practice:** always verify an HMAC signature on every webhook received, with a constant-time comparison (`hash_equals()`, never `==`), the same reflex as for any secret comparison.

## Replay: a Legitimate Request Captured, Sent Again Later

A valid signature guarantees that the request really comes from the third-party service and was not modified, but guarantees nothing about WHEN it is received. An attacker who intercepts a legitimate webhook request (unencrypted network, exposed log, compromised third-party service) can send it again as is later: the signature stays valid, since the content has not changed.

```text
1. The attacker captures a legitimate webhook request already sent and validated
   ("order 42 paid", valid signature)
2. Days later, the attacker resends EXACTLY the same request
3. The signature is still valid (same body, same secret)
   -> if the application only checks the signature, it processes
      the "order 42 paid" event a second time
```

| Defense against replay | Principle |
|---|---|
| Timestamp included in the signature | The third-party service includes the sending time in the signed data; the application rejects any request whose timestamp falls outside a tolerance window (e.g. 5 minutes), which automatically invalidates a request replayed later |
| Single-use identifier (*nonce*) | The third-party service includes a unique identifier per event; the application remembers the identifiers already processed (at least for the length of the tolerance window) and rejects any duplicate |

> **Best practice:** combine HMAC (authenticity) with a verified timestamp and/or an already-processed event identifier (idempotence), rather than relying on the signature alone.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A webhook reverses the usual direction of an API call: the third-party service sends a request to your application, which must verify that the request really comes from it. HMAC (a signature based on a shared secret) authenticates the request; a timestamp or an event identifier prevents a captured legitimate request from being replayed later. |
| **Tools you can use** | `hash_hmac()` + `hash_equals()` to verify a signature; a signed timestamp or an event identifier stored on the application side to prevent replay. |
| **Pitfalls to avoid** | Verifying a webhook only by its source IP address or by the secrecy of its URL. Comparing a signature with `==`/`===`. Checking only the signature, with no protection against the replay of an already-processed request. |
| **Best practices** | Always verify an HMAC signature in constant time. Add a timestamp window and/or deduplication by event identifier to prevent replay. |
