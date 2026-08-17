---
order: 3
---

# Propagación de identidad entre servicios (On-Behalf-Of)

Una aplicación casi nunca es un solo servicio aislado: un frontend llama a un servicio A, que necesita llamar a un servicio B para completar la solicitud. Cuando el usuario se autenticó mediante [OAuth 2.0](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) ante el servicio A, surge de inmediato una pregunta: ¿con **qué identidad** debe llamar el servicio A al servicio B?

## La mala respuesta: una cuenta de servicio genérica

La solución más simple, pero la menos segura, consiste en dar al servicio A una **cuenta de servicio** propia, con derechos amplios, para llamar al servicio B:

```text
Usuario -> Servicio A -> Servicio B
(identidad      (cuenta de       (recibe una solicitud de la
 perdida         servicio,       "cuenta de servicio del Servicio A",
 en el camino)   derechos        no del usuario)
                 amplios)
```

> **Trampa:** el servicio B nunca ve la identidad del usuario final, solo la del servicio A. Es imposible saber, del lado del servicio B, qué usuario realmente desencadenó la acción; y la cuenta de servicio, para cubrir a todos los usuarios posibles, debe tener derechos más amplios que los de un usuario individual, un riesgo en caso de compromiso del servicio A.
>
> **Buena práctica:** propagar la identidad real del usuario de un servicio a otro, en lugar de sustituirla por una cuenta técnica genérica.

## La buena respuesta: el flujo On-Behalf-Of

El flujo **On-Behalf-Of** (OBO) responde a este problema: el servicio A intercambia el token recibido del usuario por un nuevo token, siempre en nombre de ese usuario, pero **con el alcance (scope)** para llamar al servicio B:

```text
1. El usuario se autentica, obtiene un token para el Servicio A
2. El Servicio A debe llamar al Servicio B para responder a la solicitud
3. El Servicio A intercambia su token de usuario por un nuevo token
   (ante el servidor de autorizacion), siempre en nombre del mismo usuario,
   pero con el alcance (scope) del Servicio B
4. El Servicio A llama al Servicio B con ese nuevo token
5. El Servicio B ve la identidad real del usuario, y aplica
   SUS permisos a el, no los de una cuenta de servicio
```

El servicio B puede entonces aplicar un [control de acceso (RBAC/ABAC)](/?c=authentification&s=fondamentaux&p=rbac-et-abac) basado en los derechos reales del usuario final, exactamente como si lo hubiera recibido directamente, en lugar de basarse en los derechos (a menudo más amplios) de una cuenta técnica.

## Comparativa

| | Cuenta de servicio genérica | On-Behalf-Of |
|---|---|---|
| Identidad vista por el servicio final | El servicio llamante | El usuario final |
| Derechos aplicados | Los, amplios, de la cuenta de servicio | Los, reales, del usuario |
| Trazabilidad | Imposible saber qué usuario desencadenó la llamada | El usuario exacto sigue siendo identificable en cada salto |
| Riesgo en caso de compromiso de un servicio intermedio | Alto: la cuenta de servicio puede actuar por cualquier usuario | Limitado a lo que el usuario actual puede hacer él mismo |

> **Trampa:** propagar el token **original** del usuario tal cual hacia el servicio B, en lugar de intercambiarlo por uno nuevo con el alcance de ese servicio. Un token pensado para el servicio A (con el alcance del servicio A) aceptado tal cual por el servicio B rompe el aislamiento entre servicios: un token robado en el servicio B también daría acceso al servicio A.
>
> **Buena práctica:** intercambiar siempre un nuevo token, con el alcance específico para el servicio llamado, en lugar de hacer circular el mismo token de un servicio a otro.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El flujo On-Behalf-Of permite a un servicio backend llamar a otro servicio en nombre del usuario final, intercambiando su token por un nuevo token con alcance limitado, en lugar de usar una cuenta de servicio genérica con derechos amplios. |
| **Herramientas utilizables** | El mecanismo de intercambio de token (*token exchange*) proporcionado por la mayoría de los servidores de autorización OAuth 2.0 / OpenID Connect. |
| **Trampas a evitar** | Usar una cuenta de servicio genérica para las llamadas entre servicios. Hacer circular el token original del usuario tal cual entre varios servicios. |
| **Buenas prácticas** | Propagar la identidad real del usuario en cada salto. Intercambiar un nuevo token con el alcance limitado para cada servicio llamado. |
