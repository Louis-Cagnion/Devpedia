---
order: 1
---

# Autenticación multifactor

El capítulo [Autenticación vs autorización](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation) distingue tres familias de pruebas de identidad: algo que sabemos, que tenemos, o que somos. La mayoría de las cuentas dependen de una sola (la contraseña): un secreto único, que basta para comprometerlo todo si se filtra. La **autenticación multifactor** (MFA, *Multi-Factor Authentication*) consiste en exigir al menos dos pruebas **de familias diferentes** antes de conceder el acceso.

> **Trampa:** confundir "dos verificaciones" con "dos factores". Una contraseña seguida de una pregunta secreta ("¿el nombre de tu primera mascota?") sigue siendo un solo factor (algo que sabemos) repetido dos veces: ambas pruebas pertenecen a la misma familia, y un atacante capaz de adivinar o encontrar una tiene buenas probabilidades de encontrar la otra por el mismo medio (búsqueda en redes sociales, por ejemplo).
>
> **Buena práctica:** combinar dos factores de familias realmente diferentes (una contraseña + un código generado por una aplicación, por ejemplo), nunca dos variantes del mismo tipo de prueba.

## Por qué combinar dos factores reduce drásticamente el riesgo

Las fugas de contraseñas son masivas y regulares: circulan bases enteras de contraseñas robadas, y una contraseña reutilizada en varios sitios puede probarse automáticamente en todos donde se usó. Sin un segundo factor, una contraseña comprometida basta para abrir la cuenta. Con un segundo factor de otra familia, el atacante debe además poseer físicamente el objeto (teléfono, llave de seguridad) o la característica biológica de la víctima: un obstáculo notablemente más difícil de superar a distancia.

## Los métodos comunes de segundo factor

| Método | Principio | Punto débil principal |
|---|---|---|
| Código por SMS | Un código enviado por mensaje al teléfono del usuario | Vulnerable al [*SIM swapping*](https://en.wikipedia.org/wiki/SIM_swap_scam) (transferir el número de teléfono a una tarjeta SIM controlada por el atacante) |
| Aplicación de autenticación ([TOTP](https://en.wikipedia.org/wiki/Time-based_one-time_password)) | Un código generado localmente, que cambia cada 30 segundos | Sigue siendo utilizable si el usuario lo introduce en un sitio falso ([phishing](https://en.wikipedia.org/wiki/Phishing)) |
| Llave de seguridad física ([FIDO2](https://en.wikipedia.org/wiki/FIDO2_Project)/[WebAuthn](https://en.wikipedia.org/wiki/WebAuthn)) | Un objeto físico que responde criptográficamente a una solicitud del sitio | Costo del objeto, debe estar físicamente presente |

## TOTP: generar un código sin conexión de red

Un código **TOTP** (*Time-based One-Time Password*) funciona sin que la aplicación y el servidor se comuniquen en el momento de la generación: ambos comparten un secreto, establecido una sola vez (típicamente vía un código QR escaneado en la activación), y luego calculan cada uno por su lado un código a partir de ese secreto y la hora actual, redondeada a una ventana de 30 segundos:

```text
Secreto compartido (establecido una sola vez, en la activacion)
        |
        +-- Aplicacion : calcula un codigo a partir del secreto + la hora actual
        +-- Servidor    : calcula el mismo codigo, de forma independiente, con el
                           mismo secreto + la misma hora

Ambos codigos coinciden sin que haya transitado ningun mensaje entre ambos
```

Esto es lo que permite a una aplicación de autenticación funcionar incluso sin conexión a internet: solo necesita un reloj más o menos sincronizado, no un intercambio de red.

## La llave de seguridad física: la protección más robusta frente al phishing

Un código TOTP sigue siendo vulnerable si el usuario lo introduce él mismo en un sitio falso que imita al verdadero (un ataque de *phishing*): nada impide técnicamente escribir el código correcto en el lugar equivocado. Una llave de seguridad física (FIDO2/WebAuthn) elimina este riesgo de otra forma: verifica criptográficamente la dirección exacta del sitio que la solicita, y se niega a responder si la dirección no corresponde a la registrada originalmente, incluso si el sitio falso es visualmente idéntico al verdadero.

> **Trampa:** implementar una autenticación multifactor robusta, pero dejar un medio de recuperación de cuenta demasiado permisivo ("¿perdiste el segundo factor? responde estas preguntas de seguridad"). Un atacante entonces apunta a ese camino de recuperación más débil en lugar de atacar el segundo factor en sí, lo que anula todo el beneficio del MFA.
>
> **Buena práctica:** aplicar al proceso de recuperación del segundo factor el mismo nivel de exigencia que a la autenticación misma, en lugar de tratarlo como un simple filtro de seguridad secundario.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La autenticación multifactor exige al menos dos pruebas de identidad de familias diferentes (saber/tener/ser), no dos variantes del mismo tipo. Una contraseña comprometida ya no basta entonces, el atacante también debe poseer el segundo factor. |
| **Herramientas utilizables** | Una aplicación TOTP (código generado localmente, sin red); una llave de seguridad física FIDO2/WebAuthn para la protección más robusta frente al phishing. |
| **Trampas a evitar** | Confundir dos verificaciones del mismo factor con un verdadero segundo factor. Dejar un camino de recuperación de cuenta demasiado permisivo, que sortea el MFA. |
| **Buenas prácticas** | Combinar dos factores de familias realmente diferentes. Aplicar el mismo nivel de exigencia al proceso de recuperación que a la autenticación misma. |
