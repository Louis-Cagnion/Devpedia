---
order: 2
---

# JWT y tokens

El capítulo anterior muestra que la sesión obliga al servidor a mantener un espacio de almacenamiento dedicado, consultado en cada petición. Esto funciona muy bien para un servidor único, pero se vuelve más complicado en cuanto varios servidores atienden las peticiones de un mismo sitio: cada uno debe entonces acceder al mismo espacio de sesiones, una dependencia adicional que hacer funcionar. Otro enfoque evita este problema: en lugar de almacenar la información del lado del servidor, se codifica directamente **dentro** del token que transporta el cliente.

## El JWT: una información autosuficiente y verificable

Un **JWT** (*JSON Web Token*) codifica información en [JSON](/?c=infrastructure&p=json) directamente en el token, y luego la firma criptográficamente. Un JWT siempre se compone de tres partes separadas por un punto:

```text
encabezado.datos.firma

eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxMiwiZXhwIjoxNzM1Njg5NjAwfQ.4f8a2c...
      |                          |                                  |
  encabezado                   datos                              firma
  (algoritmo                  (la informacion                  (calculada a partir
   utilizado)                  codificada, en JSON)               de las dos primeras
                                                                    partes + un secreto
                                                                    conocido por el servidor)
```

El servidor que recibe un JWT recalcula la firma a partir del encabezado y los datos recibidos, con su propio secreto, y la compara con la proporcionada: si coinciden, el contenido no fue modificado desde su emisión. Esta verificación no requiere **ningún acceso a un espacio de almacenamiento**: es lo que hace que un JWT sea *stateless* (sin estado), a diferencia de una sesión.

## Lo que contiene un JWT: nunca cifrado, solo firmado

Los datos de un JWT se codifican en [Base64](https://en.wikipedia.org/wiki/Base64), no se cifran: cualquiera puede decodificar esos datos y leerlos, incluido un atacante que intercepte el token. Solo la firma impide **modificarlos** sin que se note, no impide a nadie **leerlos**.

```text
Datos decodificados de un JWT :  { "user_id": 12, "exp": 1735689600 }
                                  -> legible por cualquiera que posea el token,
                                     incluso sin conocer el secreto del servidor
```

> **Trampa:** colocar un dato sensible (contraseña, número de tarjeta bancaria, información confidencial) en los datos de un JWT, pensando que la firma lo protege. La firma garantiza la integridad (nada se modificó), nunca la confidencialidad (todo el mundo puede leer).
>
> **Buena práctica:** poner en un JWT solo información que pueda leerse sin riesgo si el token es interceptado (un identificador de usuario, una fecha de expiración, un rol), nunca un secreto.

## La verdadera trampa del stateless: revocar un JWT antes de su expiración

Una sesión se revoca instantáneamente: basta con eliminar el dato correspondiente del lado del servidor, y el identificador se vuelve inútil. Un JWT, en cambio, sigue siendo válido mientras no se alcance su fecha de expiración, precisamente porque el servidor no guarda ningún rastro de los que emitió: desconectarlo por la fuerza antes de su expiración natural (una cuenta hackeada, un empleado que deja la empresa) requiere un mecanismo adicional (una lista negra consultada en cada petición), lo que anula parte de la ventaja stateless buscada al principio.

| | Sesión | JWT |
|---|---|---|
| Dónde vive la información | Del lado del servidor | En el propio token |
| Revocación antes de la expiración | Inmediata (eliminar del lado del servidor) | Difícil sin mecanismo adicional |
| Compartir entre varios servidores | Requiere un espacio de almacenamiento común | No requiere ningún espacio compartido |
| Contenido legible si es interceptado | No (solo un identificador opaco) | Sí (datos en claro, solo firmados) |

> **Trampa:** elegir un JWT por su aparente simplicidad sin haber anticipado el caso en que un token deba revocarse antes de su expiración natural (desconexión forzada, cuenta comprometida).
>
> **Buena práctica:** mantener una vida corta para un JWT (algunos minutos a algunas horas), y prever un mecanismo de renovación en lugar de un token válido durante varios días, para limitar la ventana donde sería necesaria una revocación anticipada.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un JWT codifica información en JSON directamente en el token y la firma, lo que permite verificarla sin almacenamiento del lado del servidor (stateless). Sus datos se codifican, nunca se cifran: legibles por quien posea el token, solo su modificación queda impedida por la firma. |
| **Herramientas utilizables** | Una biblioteca JWT del lenguaje utilizado para generar y verificar la firma, en lugar de una implementación manual. |
| **Trampas a evitar** | Colocar un dato sensible en un JWT pensando que está protegido. Elegir un JWT sin haber anticipado la necesidad de revocación anticipada. |
| **Buenas prácticas** | No poner en un JWT más que datos que puedan leerse sin riesgo. Mantener una vida corta y prever una renovación en lugar de un token de larga duración. |
