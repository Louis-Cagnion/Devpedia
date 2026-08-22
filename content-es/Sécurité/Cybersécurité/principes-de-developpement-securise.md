---
order: 3
---

# Principios de desarrollo seguro

El capítulo [Las grandes familias de fallos de seguridad](/?c=cybersecurite&p=types-de-failles) muestra que la mayoría de las vulnerabilidades comparten una raíz común: un dato o una situación tratados equivocadamente como confiables. Este capítulo detalla cuatro principios que, aplicados de forma sistemática, eliminan gran parte de ese riesgo incluso antes de escribir la lógica de negocio.

## Secure by design: pensar la seguridad desde el diseño

Añadir la seguridad *después*, una vez que una funcionalidad ya está escrita, casi siempre equivale a tapar agujeros uno por uno, sin garantía de haberlos encontrado todos. **Secure by design** consiste en integrar las cuestiones de seguridad desde el diseño de una funcionalidad, al mismo nivel que sus requisitos funcionales: *¿quién puede hacer qué? ¿qué pasa si este dato es falsificado? ¿qué pasa si este servicio falla?*

```text
Enfoque "parche"                         Enfoque secure by design

Funcionalidad escrita                    Funcionalidad disenada
        |                                        |
        v                                        v
  Puesta en produccion                   Quien accede? Que datos
        |                                son sensibles? Que hacer
        v                                si algo falla?
  Fallo descubierto                              |
        |                                        v
        v                                Funcionalidad escrita,
    Correccion                           fallos evidentes ya evitados
  (el ciclo se repite
   con cada fallo)
```

## Validar las entradas: nunca confiar por defecto

Todo dato que entra en un sistema desde el exterior (campo de formulario, parámetro de URL, cabecera HTTP, archivo importado, respuesta de una API de terceros) debe validarse antes de usarse. Existen dos estrategias:

| Estrategia | Principio | Fiabilidad |
|---|---|---|
| **Lista blanca** (*allowlist*) | Permitir explícitamente solo los valores/formatos conocidos como válidos | Alta: todo lo que no está explícitamente permitido se rechaza |
| **Lista negra** (*denylist*) | Rechazar explícitamente los valores/formatos conocidos como peligrosos | Baja: siempre se le escapa algún caso no previsto |

```text
// Lista negra (fragil): bloquea lo que ya se conoce
si entrada contiene "<script>" entonces rechazar
// Un atacante lo evita con una variante no prevista: "<ScRiPt>", "<img onerror=...>"...

// Lista blanca (robusta): solo permite lo esperado
si entrada coincide exactamente con el formato "email valido" entonces aceptar
// Todo lo demas se rechaza, incluida una variante no anticipada
```

La lista blanca es, por tanto, la estrategia por defecto a preferir. Un ejemplo concreto de validación por lista blanca, con `filter_input()`, ya se detalla en [Asegurar tus datos](/?c=langages-de-programmation&s=php&p=securite).

> **Error común:** validar un dato solo en el lado del cliente (en el navegador) y luego confiar en él en el servidor. La validación del lado del cliente es solo una comodidad de uso (respuesta inmediata): nada impide que un atacante envíe una solicitud directamente al servidor, evitando por completo el navegador.
>
> **Buena práctica:** revalidar siempre en el servidor, sin importar la validación ya hecha en el cliente.

## El principio de mínimo privilegio

Un componente (usuario, servicio, proceso) solo debe disponer de los permisos estrictamente necesarios para su tarea, nunca más "por si acaso":

| Contexto | Exceso de privilegio | Aplicación del principio |
|---|---|---|
| Base de datos | Una cuenta de la aplicación con permisos `DROP TABLE`/`ALTER` | Una cuenta limitada a `SELECT`/`INSERT`/`UPDATE` solo en las tablas necesarias |
| Sistema de archivos | Un proceso web ejecutándose como administrador | Un usuario dedicado, sin permiso de escritura fuera de su propia carpeta |
| API de terceros | Una clave API que da acceso a todas las operaciones de la cuenta | Una clave restringida solo a las operaciones realmente usadas (solo lectura si no se necesita escritura) |
| Equipo humano | Todo el mundo tiene acceso a producción | Solo las personas que realmente lo necesitan, con una revisión regular de los accesos |

El beneficio va más allá de la prevención: si un componente resulta comprometido de todos modos, el daño queda limitado a lo que sus permisos restringidos permiten, en lugar de extenderse a todo el sistema.

## La defensa en profundidad (*defense in depth*)

Ninguna protección es infalible: la defensa en profundidad consiste en apilar varias capas de protección independientes, para que un solo fallo nunca baste para comprometer todo el sistema.

```text
Atacante
   |
   v
[ Firewall / infraestructura de red ]   <- 1a capa
   |
   v
[ Validacion de entradas ]              <- 2a capa
   |
   v
[ Consultas preparadas (anti-inyeccion) ] <- 3a capa
   |
   v
[ Minimo privilegio de la cuenta BD ]   <- 4a capa
   |
   v
Datos protegidos, aunque UNA capa falle
```

Si se elude una capa (un fallo aún sin corregir, por ejemplo), las capas siguientes igualmente limitan el impacto, en lugar de dejar un acceso total desde la primera brecha.

## Fallar de forma segura (*fail securely*)

Cuando una comprobación de seguridad falla o se rompe de forma inesperada (error de red, excepción no prevista), el comportamiento por defecto debe ser **denegar** el acceso, nunca concederlo por defecto:

```text
// Peligroso: un error inesperado concede acceso (fail open)
intentar:
    si usuarioEstaAutorizado(usuario) entonces conceder acceso
capturar error:
    conceder acceso   // "por si acaso, dejamos pasar"

// Seguro: un error inesperado deniega acceso (fail closed)
intentar:
    si usuarioEstaAutorizado(usuario) entonces conceder acceso
    si no denegar acceso
capturar error:
    denegar acceso   // por defecto, sin autorizacion confirmada, ningun acceso
```

Este reflejo coincide con la robustez general esperada de cualquier código: un error debe fallar de forma explícita, nunca quedar enmascarado silenciosamente por un comportamiento permisivo por defecto.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Cuatro principios reducen la mayoría de los fallos: pensar la seguridad desde el diseño, validar toda entrada externa con una lista blanca, aplicar el mínimo privilegio, apilar varias capas de defensa independientes. |
| **Herramientas utilizables** | `filter_input()` (PHP) y equivalentes en otros lenguajes para la validación por lista blanca; cuentas de aplicación dedicadas con permisos restringidos para la base de datos. |
| **Errores a evitar** | Validar un dato solo en el lado del cliente; usar una lista negra en lugar de una lista blanca; conceder acceso por defecto ante un error inesperado (*fail open*). |
| **Buenas prácticas** | Revalidar siempre en el servidor; restringir cada componente a lo estrictamente necesario; denegar el acceso por defecto ante la duda (*fail closed*). |
