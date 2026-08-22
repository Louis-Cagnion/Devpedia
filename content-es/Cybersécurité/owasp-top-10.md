---
order: 10
---

# El OWASP Top 10: el referente estándar de la industria

**[OWASP](https://owasp.org)** (*Open Worldwide Application Security Project*) es una organización sin ánimo de lucro dedicada a la seguridad de las aplicaciones web, conocida sobre todo por su **Top 10**: una clasificación, actualizada cada pocos años, de las diez categorías de fallos más críticas observadas en aplicaciones reales. Este capítulo recorre esa clasificación (edición 2021, la más reciente hasta la fecha) como síntesis de toda la categoría [Ciberseguridad](/?c=cybersecurite), donde cada fila remite al capítulo que ya la detalla en profundidad.

## La clasificación

| # | Categoría | Qué abarca | Detallado en |
|---|---|---|---|
| A01 | Control de acceso deficiente | Un usuario accede a un recurso o acción que debería estarle prohibido | [Las grandes familias de fallos de seguridad](/?c=cybersecurite&p=types-de-failles) |
| A02 | Fallos criptográficos | Un secreto o dato sensible mal protegido por el cifrado/hashing, o sin protección alguna | [Criptografía aplicada](/?c=cybersecurite&p=cryptographie-appliquee) |
| A03 | Inyección | Un dato no confiable interpretado como una instrucción | [Las grandes familias de fallos de seguridad](/?c=cybersecurite&p=types-de-failles), [Asegurar tus datos](/?c=langages-de-programmation&s=php&p=securite) |
| A04 | Diseño inseguro (*insecure design*) | La seguridad pensada después, en lugar de incorporarse desde el diseño de una funcionalidad | [Principios de desarrollo seguro](/?c=cybersecurite&p=principes-de-developpement-securise) |
| A05 | Configuración de seguridad incorrecta | Un ajuste por defecto, demasiado permisivo u olvidado, abre un acceso no deseado | [Las grandes familias de fallos de seguridad](/?c=cybersecurite&p=types-de-failles) |
| A06 | Componentes vulnerables y desactualizados | Una biblioteca o herramienta de terceros usada contiene un fallo conocido | [Seguridad de las dependencias](/?c=cybersecurite&p=securite-des-dependances) |
| A07 | Fallos de identificación y autenticación | Un mecanismo de inicio de sesión mal diseñado permite suplantar una identidad | Categoría [Autenticación](/?c=authentification) |
| A08 | Fallos de integridad de software y datos | Un dato o componente modificado sin que nada lo detecte (firma ausente o no verificada, dependencia comprometida) | [Criptografía aplicada](/?c=cybersecurite&p=cryptographie-appliquee) (firma), [Seguridad de las dependencias](/?c=cybersecurite&p=securite-des-dependances) |
| A09 | Fallos de registro y monitorización de seguridad | Un ataque en curso, o ya ocurrido, pasa desapercibido por falta de rastros utilizables | [Las grandes familias de fallos de seguridad](/?c=cybersecurite&p=types-de-failles), [Pruebas y auditoría de seguridad](/?c=cybersecurite&p=tests-et-audit-de-securite) |
| A10 | SSRF (*Server-Side Request Forgery*) | Un servidor forzado a realizar, por cuenta de un atacante, una solicitud hacia un destino que no debería alcanzar | [Asegurar tus datos](/?c=langages-de-programmation&s=php&p=securite) |

## Por qué una clasificación y no una simple lista

El orden no es arbitrario: refleja la frecuencia y gravedad observadas en un gran número de aplicaciones reales auditadas, no un juicio teórico. Una categoría que sube de una edición a otra (el control de acceso deficiente, por ejemplo, en primer lugar desde 2021) señala un problema que sigue siendo difícil de eliminar en la práctica, pese a protecciones ya bien documentadas.

```text
OWASP Top 10                    Capitulos de esta categoria
(el "que" estandarizado)        (el "como" concreto)

     A01-A10        <-------->   types-de-failles, principes-de-
                                  developpement-securise, gestion-
                                  des-secrets, cryptographie-
                                  appliquee, securite-des-
                                  dependances, securite-api-web,
                                  tests-et-audit-de-securite,
                                  ingenierie-sociale-et-phishing
```

El Top 10 aporta el vocabulario y las prioridades comúnmente aceptados en la industria; los demás capítulos de esta categoría aportan los medios concretos para actuar sobre cada una de esas prioridades.

## Usar el Top 10 en la práctica

- Como **checklist de revisión de código**: comprobar que ninguna de las diez categorías se ha pasado por alto antes de una puesta en producción.
- Como **vocabulario común** entre desarrolladores, testers de seguridad y auditores externos, para nombrar sin ambigüedad un mismo tipo de fallo.
- Como **guía de priorización**: con recursos limitados, atender primero las categorías más altas de la clasificación, estadísticamente las más frecuentes.

> **Error común:** tratar el Top 10 como una lista exhaustiva de todo lo que hay que comprobar. Es una clasificación de las diez categorías **más frecuentes**, no la totalidad de fallos posibles: una revisión de seguridad que se detiene estrictamente en estos diez puntos deja deliberadamente todo lo demás sin cubrir.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El OWASP Top 10 clasifica las diez categorías de fallos más frecuentes y graves observadas en aplicaciones reales, actualizado periódicamente. Sirve como referente transversal que conecta todos los capítulos de la categoría Ciberseguridad. |
| **Herramientas utilizables** | El Top 10 como checklist de revisión antes de una puesta en producción, y como vocabulario común entre equipos. |
| **Errores a evitar** | Considerar el Top 10 como una lista exhaustiva en lugar de una clasificación de las categorías más frecuentes. |
| **Buenas prácticas** | Usar la clasificación para priorizar el esfuerzo de seguridad con recursos limitados, sin limitar nunca a ella la revisión de seguridad en su conjunto. |
