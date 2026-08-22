---
order: 3
---

# Documentación y comunicación en equipo

Un equipo que crece ya no puede decírselo todo en voz alta: el trabajo se coordina entonces por escrito, en tickets y una documentación compartida. Mal escritos, estos dos soportes ralentizan al equipo en lugar de ayudarlo.

## Escribir un ticket o una user story explotable

Una **user story** formaliza una necesidad según un formato simple:

```text
Como [rol],
quiero [acción],
para [beneficio].

Criterios de aceptación:
- [condición verificable que indica que está terminado]
```

```text
Como cliente,
quiero recibir un email de confirmación tras mi pedido,
para saber que se ha registrado correctamente.

Criterios de aceptación:
- El email se envía en los 2 minutos siguientes al pedido.
- Contiene el número de pedido y el importe total.
```

> **Trampa:** escribir un ticket vago ("corregir el bug de conexión"), sin pasos de reproducción ni criterio de fin. Nadie sabe con precisión qué debe ser cierto para considerar el ticket terminado, lo que lleva a idas y vueltas para aclarar lo que se podría haber precisado desde el principio.
>
> **Buena práctica:** escribir un ticket que otra persona pueda retomar sin hacer preguntas (contexto, pasos de reproducción si es un bug, criterios de aceptación explícitos).

## Señalar un bloqueo

> **Trampa:** señalar un bloqueo con "no funciona", sin detalle. La persona solicitada debe entonces reconstruir ella misma el contexto antes de poder ayudar, lo que retrasa la resolución del propio bloqueo.
>
> **Buena práctica:** precisar qué está bloqueado exactamente, desde cuándo, y qué se ha intentado ya (ver el [proceso de depuración](/?c=bases-de-l-informatique&p=le-bug) para estructurar este diagnóstico): la persona solicitada puede entonces retomar directamente donde se sitúa el bloqueo.

## Las herramientas comunes

| Necesidad | Herramientas típicas |
|---|---|
| Seguimiento de tickets y del trabajo | [Jira](https://www.atlassian.com/software/jira), [Azure Boards](/?c=ci-cd&p=azure-devops-plateforme) |
| Documentación compartida | [Confluence](https://www.atlassian.com/software/confluence), [Notion](https://www.notion.so) |
| Comunicación informal, preguntas rápidas | [Slack](https://slack.com), [Microsoft Teams](https://www.microsoft.com/microsoft-teams) |

> **Trampa:** hacer circular una información importante únicamente en un mensaje de chat instantáneo (Slack, Teams), que se ahoga rápido en el flujo y se vuelve imposible de encontrar unas semanas después.
>
> **Buena práctica:** reservar el chat instantáneo para el intercambio rápido, y consignar toda información destinada a durar (una decisión de arquitectura, un procedimiento) en la documentación compartida, donde sigue siendo fácil de encontrar.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un ticket o una user story explotable precisa el rol, la acción, el beneficio esperado y criterios de aceptación verificables. Un bloqueo se señala con qué está bloqueado, desde cuándo, y qué se ha intentado ya. |
| **Herramientas utilizables** | Jira/[Azure Boards](/?c=ci-cd&p=azure-devops-plateforme) para los tickets, Confluence/Notion para la documentación duradera, Slack/Teams para el intercambio rápido. |
| **Trampas a evitar** | Escribir un ticket vago sin criterio de fin. Señalar un bloqueo sin detalle explotable. Dejar vivir una información duradera únicamente en un mensaje de chat instantáneo. |
| **Buenas prácticas** | Escribir un ticket que un tercero pueda retomar sin hacer preguntas. Detallar un bloqueo para permitir una ayuda directa. Consignar toda información duradera en la documentación compartida. |
