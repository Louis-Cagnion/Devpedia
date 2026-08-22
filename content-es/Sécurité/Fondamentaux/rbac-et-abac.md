---
order: 3
---

# RBAC y ABAC: dos formas de modelar la autorización

El capítulo [autenticación vs autorización](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation) plantea la distinción (quién eres frente a lo que tienes derecho a hacer) sin decir *cómo* esta segunda pregunta se modela concretamente en un sistema. **RBAC** y **ABAC** son los dos modelos de control de acceso más extendidos para responder a esto.

## RBAC: derechos vinculados a un rol

**RBAC** (*Role-Based Access Control*) atribuye permisos a **roles**, y luego asigna uno o varios roles a cada usuario. El usuario hereda los permisos de sus roles, nunca permisos vinculados directamente a él:

```text
Usuario           Rol               Permisos

Alice        -->  contabilidad  --> ver_salarios, modificar_facturas
Bob          -->  desarrollo    --> ver_codigo, desplegar_staging
```

> **Analogía:** una tarjeta de acceso con un nivel de seguridad impreso en ella ("nivel 2"). Toda puerta compatible con "nivel 2" se abre, sin importar quién porte exactamente la tarjeta; cambiar los derechos de un nivel (añadir una puerta) actualiza de golpe todas las tarjetas de ese nivel, sin reimprimir cada tarjeta individualmente.

| | |
|---|---|
| Ventaja | Sencillo de administrar: cambiar el rol de un usuario basta para cambiar de golpe todos sus derechos |
| Límite | Una decisión de acceso que depende de un contexto preciso (la hora, la ubicación, el estado de un dato) no se modela de forma natural: habría que crear un rol para cada combinación de contexto posible |

## ABAC: reglas evaluadas sobre atributos

**ABAC** (*Attribute-Based Access Control*) sustituye el rol fijo por una **regla** evaluada en cada solicitud de acceso, a partir de **atributos**: propiedades del usuario, del recurso solicitado y del contexto de la solicitud:

```text
Regla: permitir SI usuario.departamento == recurso.departamento
       Y hora_actual entre las 9h y las 18h
       Y usuario.dispositivo == "equipo_profesional"

Alice, contabilidad, 14h, equipo pro     -> solicita una factura "contabilidad" -> PERMITIDO
Alice, contabilidad, 22h, equipo pro     -> solicita una factura "contabilidad" -> DENEGADO (fuera de horario)
Alice, contabilidad, 14h, equipo pro     -> solicita una carpeta legal         -> DENEGADO (departamento diferente)
```

> **Analogía:** un vigilante que verifica una lista de condiciones en cada paso, en lugar de una tarjeta con un nivel fijo: mira quién eres, qué solicitas y el contexto del momento, antes de decidir, en lugar de fiarse de un simple nivel ya impreso.

| | |
|---|---|
| Ventaja | Puede expresar reglas finas y contextuales, imposibles de representar mediante un simple rol |
| Límite | Más complejo de escribir, probar y auditar: cada regla combina potencialmente varios atributos, y prever el efecto exacto de un cambio de regla se vuelve más difícil que un simple cambio de rol |

## Comparativa

| | RBAC | ABAC |
|---|---|---|
| Base de la decisión | El rol asignado al usuario | Atributos evaluados en el momento de la solicitud (usuario, recurso, contexto) |
| Granularidad | Gruesa (por rol) | Fina (por combinación de condiciones) |
| Simplicidad de administración | Elevada | Menor, la complejidad de las reglas puede crecer rápido |
| Caso de uso típico | La mayoría de las aplicaciones de negocio (roles estables y poco numerosos) | Control de acceso sensible al contexto (horarios, ubicación, sensibilidad del dato) |

Los dos no se excluyen: un sistema puede usar RBAC para la mayoría de sus permisos, y reservar ABAC para las pocas decisiones que dependen realmente del contexto.

> **Trampa:** añadir un rol muy específico para cada excepción encontrada en RBAC (`contabilidad_manana`, `contabilidad_edificio_A`...), en lugar de reconocer que la necesidad real es contextual: el número de roles se dispara y se vuelve tan difícil de auditar como un conjunto de reglas ABAC mal diseñado, sin tener su flexibilidad.
>
> **Buena práctica:** mantener RBAC para los permisos estables y poco numerosos, y pasar a ABAC (o a un modelo híbrido) en cuanto una regla dependa de un atributo que cambia con frecuencia (la hora, la ubicación, una propiedad del propio dato) en lugar de multiplicar los roles.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | RBAC atribuye permisos a roles asignados al usuario (decisión gruesa, sencilla de administrar). ABAC evalúa una regla sobre atributos (usuario, recurso, contexto) en cada solicitud (decisión fina, más compleja). Los dos modelos suelen combinarse en un mismo sistema. |
| **Herramientas utilizables** | Un sistema de roles para los permisos estables; un motor de reglas ABAC para las decisiones contextuales (horarios, ubicación, sensibilidad del dato). |
| **Trampas a evitar** | Multiplicar los roles RBAC para representar cada excepción contextual, en lugar de pasar a ABAC. |
| **Buenas prácticas** | Mantener RBAC para los casos estables y poco numerosos; pasar a ABAC en cuanto una regla dependa de un atributo que cambia con frecuencia. |
