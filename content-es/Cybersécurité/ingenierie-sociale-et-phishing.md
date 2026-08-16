---
order: 2
---

# Ingeniería social y phishing

No todos los fallos son técnicos: la **ingeniería social** consiste en manipular a una persona, en lugar de a una máquina, para que ella misma realice la acción que busca el atacante (revelar una contraseña, hacer clic en un enlace, autorizar un acceso). De esta forma evita cualquier protección técnica, por sólida que sea: el eslabón atacado es humano.

## Los resortes psicológicos explotados

| Resorte | Principio | Ejemplo |
|---|---|---|
| Autoridad | Obedecer a alguien que parece legítimo | Un correo firmado "Dirección" o "Soporte informático" |
| Urgencia | Impedir que se tome el tiempo de verificar | "Su cuenta se cerrará en 24h" |
| Miedo | Impulsar a actuar para evitar una consecuencia negativa | "Se detectó actividad sospechosa en su cuenta" |
| Confianza / familiaridad | Hacerse pasar por un contacto conocido | Un mensaje que parece venir de un compañero o amigo |
| Curiosidad | Dar ganas de hacer clic o abrir un adjunto | "Aquí está la foto de la que hablábamos" |

## Las principales técnicas

| Técnica | Vector | Descripción |
|---|---|---|
| **Phishing** | Correo electrónico | Un mensaje que imita a un remitente legítimo, con un enlace a un sitio falso o un adjunto trampa |
| **Spear phishing** | Correo dirigido | Un phishing personalizado para una persona concreta, a partir de información real sobre ella (nombre, cargo, proyecto en curso) |
| **Vishing** (*voice phishing*) | Teléfono | Una llamada que se hace pasar por un banco, soporte técnico o una autoridad |
| **Smishing** (*SMS phishing*) | SMS | El mismo principio que el phishing, por mensaje de texto |
| **Pretexting** | Cualquiera | Inventar un escenario creíble (falso técnico, falsa auditoría) para obtener información o acceso |
| **Baiting** (cebo) | Físico o digital | Dejar una memoria USB infectada en un lugar público, u ofrecer una descarga gratuita infectada |
| **Tailgating** | Físico | Seguir a alguien a través de una puerta segura aprovechando que acaba de abrirla |

El phishing se detalla en mayor profundidad, con el enfoque del typosquatting y de un certificado válido en un dominio falso, en el panorama de ataques del capítulo [Asegurar tus datos](/?c=langages-de-programmation&s=php&p=securite): este capítulo cubre la ingeniería social como disciplina, de la que el phishing es solo una técnica.

## Un ejemplo concreto de phishing

```text
De:       support@paypa1-securite.com
Asunto:   Accion requerida: su cuenta ha sido suspendida

Hola,

Hemos detectado actividad inusual en su cuenta.
Haga clic aqui para reactivarla en 24h: http://paypa1-secure-login.com/verify

El equipo de Soporte
```

| Indicio sospechoso | Qué revela |
|---|---|
| `paypa1` en lugar de `paypal` | Typosquatting: un dominio visualmente parecido al real |
| Urgencia ("en 24h") | Un resorte psicológico clásico, para impedir la verificación |
| Enlace mostrado ≠ dominio oficial de la empresa | Pasar el cursor sobre el enlace (sin hacer clic) suele revelar el destino real |
| Fórmula genérica ("Hola") | Una empresa que ya conoce al cliente suele dirigirse a él por su nombre |

## Cómo protegerse

- No hacer clic nunca directamente en un enlace recibido por correo/SMS para una acción sensible (inicio de sesión, pago): abrir uno mismo el sitio oficial en una pestaña nueva, escribiendo la dirección o mediante un favorito ya guardado.
- Comprobar la dirección de envío completa, no solo el nombre mostrado (a menudo falsificable sin relación con la dirección real).
- Desconfiar de cualquier urgencia o presión inusual: una empresa legítima da tiempo para verificar.
- Confirmar una solicitud inusual (transferencia, acceso, información sensible) por un segundo canal independiente (volver a llamar a un número ya conocido, no al proporcionado en el mensaje).
- En la empresa, reportar cualquier mensaje sospechoso al equipo correspondiente en lugar de eliminarlo en silencio: un reporte también protege a otros destinatarios de la misma campaña.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La ingeniería social manipula a una persona en lugar de a una máquina, apoyándose en resortes psicológicos (autoridad, urgencia, miedo, confianza). El phishing (y sus variantes vishing/smishing) es su técnica más extendida. |
| **Herramientas utilizables** | Pasar el cursor sobre un enlace antes de hacer clic, comprobar la dirección de envío completa, favoritos ya guardados para los sitios sensibles. |
| **Errores a evitar** | Hacer clic directamente en un enlace recibido para una acción sensible; confiar solo en el nombre mostrado de un remitente; ceder ante una urgencia artificial. |
| **Buenas prácticas** | Confirmar cualquier solicitud inusual por un segundo canal independiente; reportar un mensaje sospechoso en lugar de eliminarlo sin decir nada. |
