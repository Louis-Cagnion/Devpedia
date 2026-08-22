---
order: 2
---

# SSO y gestión de identidad en la empresa

En una empresa, un empleado suele usar decenas de herramientas distintas: correo, chat de equipo, repositorios de código, gestión de tickets, aplicaciones internas... Sin una solución centralizada, cada herramienta pediría su propia cuenta y su propia contraseña: agotador para el empleado (que termina reutilizando las mismas contraseñas en todas partes, ver [Contraseñas y hash seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)), y arriesgado para la empresa, que debe revocar el acceso en *cada* una de esas herramientas cuando alguien se va.

## Single Sign-On (SSO): una sola cuenta para todas las herramientas

El **SSO** (*Single Sign-On*, inicio de sesión único) permite a un empleado conectarse **una sola vez** ante un servicio central, y luego acceder a todas las herramientas de la empresa conectadas a ese servicio sin volver a introducir credenciales. Es el principio de la [delegación y federación de identidad](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) visto en el capítulo anterior, aplicado a la escala de una empresa entera en lugar de a un solo botón "Iniciar sesión con...".

## El proveedor de identidad (IdP): el punto central

El servicio central que autentica a los empleados y luego certifica su identidad ante las demás herramientas se llama **proveedor de identidad** (*Identity Provider*, IdP). [Okta](https://www.okta.com) es uno de los proveedores más extendidos: una empresa configura allí una vez a sus empleados y las herramientas autorizadas, y Okta se encarga luego de la autenticación real para cada una de esas herramientas.

Dos protocolos estandarizados permiten a una herramienta confiar en la identidad certificada por un IdP como Okta: [OpenID Connect](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) (visto en el capítulo anterior), y [**SAML**](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language) (*Security Assertion Markup Language*), más antiguo, todavía muy extendido en las grandes empresas. Ambos responden a la misma necesidad (certificar una identidad ante un tercero), con un formato de intercambio diferente (JSON para OpenID Connect, XML para SAML).

## Cómo se conecta concretamente un empleado

```text
1. El empleado abre "app-interna.empresa.com"
2. La aplicacion redirige a la pagina de conexion de Okta
3. El empleado se autentica ante Okta
   (o pasa directamente al paso 5 si ya tiene una sesion Okta activa,
    abierta antes en el dia en otra herramienta)
4. Okta verifica las credenciales (y puede exigir una autenticacion
   multifactor, centralizada para todas las herramientas conectadas)
5. Okta redirige hacia la aplicacion con una prueba de identidad
   (un token de identidad OpenID Connect, o una aserción SAML)
6. La aplicacion confia en esa prueba y concede el acceso
```

## El verdadero beneficio: una revocación centralizada

Más allá de la comodidad (una sola contraseña que recordar), el SSO resuelve un verdadero problema de seguridad: cuando un empleado deja la empresa, desactivar su cuenta **una sola vez** en el IdP corta instantáneamente su acceso a *todas* las herramientas conectadas, en lugar de depender de un servicio informático que debe recordar hacerlo herramienta por herramienta, con el riesgo de olvidar alguna.

> **Trampa:** considerar el SSO únicamente como una comodidad para el usuario, sin medir que concentra el acceso a todas las herramientas de la empresa detrás de una sola cuenta: una cuenta IdP comprometida se convierte en un objetivo mucho más interesante para un atacante que una sola contraseña aislada, ya que lo abre todo de golpe.
>
> **Buena práctica:** proteger la propia cuenta IdP con una seguridad reforzada (ver [Autenticación multifactor](/?c=authentification&s=renforcer-lauthentification&p=authentification-multifacteur)), ya que su compromiso tiene un impacto multiplicado respecto a una cuenta aislada.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El SSO permite autenticarse una sola vez ante un proveedor de identidad (IdP) central, como Okta, para luego acceder a todas las herramientas conectadas sin volver a introducir credenciales. OpenID Connect y SAML son los dos protocolos estandarizados que permiten esta confianza delegada. |
| **Herramientas utilizables** | Un IdP como Okta para centralizar la autenticación de todas las herramientas de una empresa. |
| **Trampas a evitar** | Ver el SSO únicamente como una comodidad, sin medir que concentra el acceso a todo detrás de una sola cuenta. |
| **Buenas prácticas** | Revocar el acceso de un empleado que se va en un solo gesto, a nivel del IdP. Proteger la cuenta IdP con una seguridad reforzada, ya que da acceso a todo lo demás. |
