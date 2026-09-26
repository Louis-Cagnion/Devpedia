---
order: 7
---

# Seguridad de los webhooks

Un **webhook** es lo contrario de una llamada a una API clásica: en lugar de que tu aplicación vaya a buscar una información a un servicio de terceros, es ese servicio el que envía por su cuenta una petición a una URL de tu aplicación en cuanto ocurre un evento (un pago confirmado, un mensaje recibido, un archivo depositado). Esta inversión crea un problema que la API clásica no tiene: tu aplicación debe ahora comprobar que una petición ENTRANTE viene realmente del servicio esperado, y no de un atacante que simplemente ha adivinado la URL.

## El problema: cualquiera puede enviar una petición a esta URL

```text
Servicio de terceros (pago) -----> POST https://tu-sitio.example/webhooks/pago
                                    { "pedido_id": 42, "estado": "pagado" }

Atacante (adivinó o encontró la URL) -----> POST https://tu-sitio.example/webhooks/pago
                                             { "pedido_id": 42, "estado": "pagado" }
                                             (notificación FALSA: pedido nunca pagado)
```

Sin verificación, el código que recibe este webhook no puede distinguir las dos peticiones: ambas llegan con la misma forma, a la misma URL.

## La solución: HMAC, ya visto, aplicado a este escenario concreto

[HMAC](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (firma simétrica con secreto compartido) es el mecanismo estándar para autenticar un webhook: el servicio de terceros y tu aplicación comparten un secreto de antemano (proporcionado al configurar el webhook), y cada petición enviada va acompañada de una firma calculada con ese secreto.

```text
Servicio de terceros (conoce el secreto compartido)
  1. Calcula firma = HMAC(cuerpo_de_la_petición, secreto)
  2. Envía la petición con una cabecera: X-Signature: <firma>

Tu aplicación (conoce el mismo secreto)
  3. Vuelve a calcular su PROPIA firma a partir del cuerpo recibido + el secreto
  4. Compara su firma con la recibida en la cabecera X-Signature
  5. Si son distintas -> petición rechazada (no la envió realmente el servicio de terceros,
     o el cuerpo se modificó por el camino)
```

```php
// Verificación del lado de la aplicación (PHP), al recibir el webhook
$cuerpo_recibido = file_get_contents('php://input');
// cabecera ausente: cadena vacía, que hash_equals() rechaza
$firma_recibida = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
$firma_calculada = hash_hmac('sha256', $cuerpo_recibido, $secreto_compartido);

// hash_equals() (ya visto en criptografía aplicada): comparación en tiempo constante,
// nunca == / === sobre una firma, para evitar un ataque por medición de tiempo
if (!hash_equals($firma_calculada, $firma_recibida)) {
    http_response_code(401);
    exit;
}
```

> **Trampa:** verificar el origen de un webhook solo por su dirección IP de origen o, peor, no verificar nada suponiendo que "la URL es secreta, así que nadie más la conoce". Una dirección IP se falsifica más fácilmente que una firma HMAC, y una URL "secreta" acaba casi siempre apareciendo en un log, un historial de navegador compartido o una configuración expuesta.
>
> **Buena práctica:** verificar sistemáticamente una firma HMAC en todo webhook recibido, con una comparación en tiempo constante (`hash_equals()`, nunca `==`), el mismo reflejo que para cualquier comparación de secretos.

## La reproducción: una petición legítima capturada y reenviada más tarde

Una firma válida garantiza que la petición viene del servicio de terceros y no se ha modificado, pero no garantiza nada sobre el MOMENTO en que se recibe. Un atacante que intercepta una petición webhook legítima (red sin cifrar, log expuesto, servicio de terceros comprometido) puede reenviarla tal cual más tarde: la firma sigue siendo válida, puesto que el contenido no ha cambiado.

```text
1. El atacante captura una petición webhook legítima ya enviada y validada
   ("pedido 42 pagado", firma válida)
2. Días después, el atacante reenvía EXACTAMENTE la misma petición
3. La firma sigue siendo válida (mismo cuerpo, mismo secreto)
   -> si la aplicación solo verifica la firma, procesa
      el evento "pedido 42 pagado" una segunda vez
```

| Defensa contra la reproducción | Principio |
|---|---|
| Marca de tiempo (*timestamp*) incluida en la firma | El servicio de terceros incluye la hora de envío en los datos firmados; la aplicación rechaza toda petición cuya marca de tiempo supere una ventana de tolerancia (p. ej. 5 minutos), lo que invalida automáticamente una petición reproducida más tarde |
| Identificador de un solo uso (*nonce*) | El servicio de terceros incluye un identificador único por evento; la aplicación guarda los identificadores ya procesados (al menos durante la ventana de tolerancia) y rechaza cualquier duplicado |

> **Buena práctica:** combinar HMAC (autenticidad) con una marca de tiempo verificada y/o un identificador de evento ya procesado (idempotencia), en lugar de confiar solo en la firma.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un webhook invierte el sentido habitual de una llamada a una API: el servicio de terceros envía una petición a tu aplicación, que debe comprobar que viene realmente de él. HMAC (firma con secreto compartido) autentica la petición; una marca de tiempo o un identificador de evento impide que una petición legítima capturada se reproduzca más tarde. |
| **Herramientas utilizables** | `hash_hmac()` + `hash_equals()` para verificar una firma; una marca de tiempo firmada o un identificador de evento guardado del lado de la aplicación para impedir la reproducción. |
| **Trampas a evitar** | Verificar un webhook solo por su dirección IP de origen o por el secreto de la URL. Comparar una firma con `==`/`===`. Verificar solo la firma, sin protección contra la reproducción de una petición ya procesada. |
| **Buenas prácticas** | Verificar sistemáticamente una firma HMAC en tiempo constante. Añadir una ventana de marca de tiempo y/o una deduplicación por identificador de evento para impedir la reproducción. |
