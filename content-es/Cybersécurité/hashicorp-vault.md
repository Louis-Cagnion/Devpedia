---
order: 9
---

# HashiCorp Vault: más allá del archivo .env

[Gestión de secretos](/?c=cybersecurite&p=gestion-des-secrets) presenta la bóveda de secretos como la solución más robusta, con **HashiCorp Vault** como ejemplo. Este capítulo entra en el funcionamiento concreto de esta herramienta: lo que una bóveda de secretos sabe hacer que un simple archivo `.env` no puede.

## Secreto estático vs secreto dinámico

Un secreto **estático** (una contraseña fija de una vez por todas, como en un archivo `.env`) permanece válido indefinidamente hasta que alguien lo cambia a mano. Vault también puede generar secretos **dinámicos**: una credencial creada bajo demanda, válida solo por un tiempo limitado, y luego revocada automáticamente.

```text
La aplicacion pide una credencial de base de datos a Vault
        |
        v
Vault crea una cuenta temporal (usuario/contrasena unicos)
        |
        v
La aplicacion usa esa cuenta durante 1h (duracion = "lease")
        |
        v
Al cabo de 1h: Vault revoca automaticamente esa cuenta
```

| | Secreto estático | Secreto dinámico |
|---|---|---|
| Origen | Creado una vez por un humano, almacenado tal cual | Generado bajo demanda por Vault, cada vez que se usa |
| Duración de vida | Indefinida, hasta una rotación manual | Limitada (*lease*), revocado automáticamente al expirar |
| Ventana de explotación si se roba | Ilimitada mientras nadie lo cambie | Acotada a la duración restante del lease |

> **Trampa:** tratar un secreto dinámico como uno clásico que se puede cachear indefinidamente del lado de la aplicación. Un secreto dinámico expira de verdad: una aplicación que nunca renueva su lease pierde el acceso sin avisar en cuanto se acaba el plazo.
>
> **Buena práctica:** renovar el lease antes de que expire para un uso continuo (la mayoría de las bibliotecas cliente de Vault lo hacen automáticamente), en lugar de tratar un secreto dinámico como algo adquirido de una vez por todas.

## Autenticarse ante Vault: los auth methods

Antes de poder leer un secreto, un cliente (una aplicación, un humano) debe primero demostrar su identidad a Vault mediante un **auth method**:

| Auth method | Principio | Caso de uso típico |
|---|---|---|
| Token | Una cadena opaca, generada de antemano y entregada al cliente | Prueba manual, script puntual |
| AppRole | Un identificador + secreto propios de una aplicación, pensados para una autenticación automatizada sin intervención humana | Un servicio que arranca solo (servidor, contenedor) |
| Identidad cloud (AWS IAM, Azure AD...) | Vault confía en la identidad ya demostrada por el proveedor cloud sobre el que corre el cliente | Una aplicación alojada en ese mismo cloud |

Una vez autenticado, el cliente recibe un **token de Vault** temporal, que adjunta a cada petición siguiente.

## Controlar el acceso: las policies

Una **policy** de Vault define, en texto, qué rutas de secretos puede leer, escribir o listar un token — el mismo principio que el [control de acceso (IDOR)](/?c=cybersecurite&p=owasp-top-10) visto en otro lugar, aplicado aquí a los propios secretos en lugar de a los datos de una aplicación:

```text
# Policy simplificada: solo lectura sobre los secretos de la aplicacion "facturacion"
path "secret/data/facturacion/*" {
  capabilities = ["read"]
}
```

> **Trampa:** conceder una policy demasiado amplia "para no bloquear el desarrollo" (ej: acceso a `secret/*` en lugar de solo a la ruta necesaria). Un token comprometido expone entonces todos los secretos de la organización, no solo los de la aplicación en cuestión.
>
> **Buena práctica:** aplicar el principio de mínimo privilegio (ya visto en [Principios de desarrollo seguro](/?c=cybersecurite&p=principes-de-developpement-securise)) a cada policy: autorizar solo las rutas y capacidades realmente necesarias para ese cliente concreto.

## Sealing y unsealing: Vault protege sus propios datos

Todos los datos almacenados por Vault se cifran en reposo con una clave de cifrado, protegida a su vez por un mecanismo de reparto de clave (*Shamir's Secret Sharing*): la clave nunca existe entera en manos de una sola persona, se reparte en varias partes.

| Estado | Descripción |
|---|---|
| **Sealed** (sellado) | Vault rechaza cualquier operación: la clave de cifrado no está ensamblada, los datos permanecen ilegibles incluso con acceso directo al disco |
| **Unsealed** (desellado) | Suficientes poseedores de partes han aportado la suya: la clave se reconstruye en memoria, Vault puede atender peticiones |

Un reinicio de Vault lo devuelve al estado sellado: alguien debe aportar de nuevo suficientes partes de la clave para desellarlo, una protección deliberada frente a un servidor que se reiniciara de forma inesperada (ej: tras un compromiso) sin que nadie se dé cuenta.

## Vault Agent: automatizar la autenticación y la obtención de secretos

En lugar de que cada aplicación reimplemente su propia lógica de autenticación y renovación de lease, **Vault Agent** corre como un proceso junto a la aplicación y se encarga de ello en su lugar: se autentica, obtiene los secretos solicitados, los escribe en un archivo local (o los inyecta directamente), y renueva automáticamente los leases que se acercan a su expiración.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Vault va más allá de un archivo `.env`: secretos dinámicos de duración limitada, autenticación mediante auth method, control de acceso fino mediante policies, datos cifrados y protegidos por sealing/unsealing, Vault Agent para automatizar autenticación y renovación. |
| **Herramientas utilizables** | AppRole para la autenticación automatizada de un servicio, Vault Agent para delegar la gestión de leases a un proceso dedicado. |
| **Trampas a evitar** | Cachear un secreto dinámico sin renovar nunca su lease. Conceder una policy demasiado amplia por simplicidad. |
| **Buenas prácticas** | Renovar los leases antes de que expiren. Aplicar el mínimo privilegio a cada policy, una ruta de secretos a la vez. |
