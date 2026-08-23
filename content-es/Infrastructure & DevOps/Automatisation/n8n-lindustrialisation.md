---
order: 5
---

# n8n: llevarlo a producción

Construir un flujo de trabajo que funcione es una cosa; hacerlo funcionar de forma fiable en producción, con varias personas contribuyendo, es otra. Este capítulo cubre lo que cambia entre "funciona en mi máquina" y un despliegue industrializado de n8n.

## Self-hosted o n8n Cloud: retomar la pregunta con más detalle

El capítulo sobre la [automatización por flujo de trabajo visual](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) ya planteaba la distinción SaaS/self-hosted. Para n8n en concreto, cada opción desplaza la responsabilidad de forma distinta:

| | n8n Cloud | Self-hosted |
|---|---|---|
| **Infraestructura** | Gestionada íntegramente por n8n | A cargo del usuario |
| **Actualizaciones** | Automáticas, gestionadas por n8n | A aplicar uno mismo |
| **Control** | Limitado a lo que ofrece la plataforma | Total sobre la configuración y el despliegue |
| **Coste** | Suscripción de pago (prueba gratuita limitada en el tiempo) | Edición Community gratuita para la mayoría de funcionalidades |

Ninguna de las dos es universalmente mejor: n8n Cloud elimina la carga operativa, el self-hosted elimina la dependencia de un tercero y los costes recurrentes, al precio del mantenimiento.

## Dos nociones de "variable" que no hay que confundir

La palabra "variable" designa dos mecanismos distintos en n8n, con usos diferentes:

| | Variable de entorno | Variable de n8n (`$vars`) |
|---|---|---|
| **Configura qué** | La propia instancia de n8n (base de datos, seguridad, puertos) | Un valor reutilizable dentro de los flujos de trabajo |
| **Definida dónde** | A nivel del sistema operativo/contenedor que aloja n8n | En la interfaz de n8n (menú Variables) |
| **Usada cómo** | Leída por n8n al arrancar | Referenciada en un flujo de trabajo vía `$vars.nombreDeVariable` |
| **Ejemplo** | `NODES_EXCLUDE`, la configuración de la base de datos | Una URL de API que cambia entre entornos |

> **Trampa:** confundir ambas y tratar de definir una variable de entorno del sistema para un valor que en realidad solo es útil dentro de un flujo de trabajo (o al revés). Las dos tienen un ciclo de vida y un modo de configuración distintos.
>
> **Buena práctica:** reservar las variables de entorno a la configuración de la propia instancia, y las variables de n8n (`$vars`) a cualquier valor que un flujo de trabajo deba poder leer sin quedar fijado en sus parámetros.

## Las credentials: propias de cada instancia

Como se vio en el capítulo sobre el [formato JSON de un flujo de trabajo](/?c=infrastructure-devops&s=automatisation&p=n8n-le-format-json-dun-workflow), un export solo contiene una referencia a una credential, nunca el secreto en sí: cada instancia de n8n (dev, staging, producción) mantiene por tanto sus propias credentials, almacenadas y cifradas por separado, a reconfigurar manualmente una vez importado un flujo de trabajo en una nueva instancia.

## Entornos dev/prod: instancias separadas

n8n no ofrece una única instancia con un selector "dev/prod" integrado: cada entorno es una **instancia de n8n distinta**, con sus propias credentials y su propio historial de ejecuciones. Hacer pasar un flujo de trabajo de un entorno a otro se hace de dos formas:

| Método | Funcionamiento |
|---|---|
| **Export/import manual** | Descargar el JSON desde la instancia origen, importarlo en la instancia destino (visto en el capítulo anterior) |
| **Source Control ([Git](/?c=qualite-performance-et-outils&s=git&p=git))** | Una instancia de n8n se conecta a una rama de un repositorio Git; un mismo flujo de trabajo versionado puede empujarse de un entorno a otro siguiendo el flujo Git habitual (dev → staging → producción) |

> **Trampa:** empujar un cambio directamente a producción sin pasar por un entorno intermedio, en particular para un flujo de trabajo que toca datos reales (una base de datos de producción, un envío de correo a clientes reales).
>
> **Buena práctica:** hacer pasar todo cambio por un entorno de dev/staging antes de producción, igual que con cualquier despliegue de código.

## Supervisión de las ejecuciones

La pestaña **Executions** (accesible desde la página de inicio o un flujo de trabajo concreto) lista todas las ejecuciones pasadas, con su estado. Para una ejecución fallida, existen dos opciones de recuperación: **"Retry with original workflow"** (repite la ejecución exactamente como ocurrió, sin tener en cuenta una corrección hecha desde entonces) y **"Retry with currently saved workflow"** (repite los mismos datos de entrada, pero con la versión actual del flujo de trabajo, tras la corrección).

Un ajuste complementario, **"Retry on Fail"**, disponible en cada nodo individualmente, relanza automáticamente ese nodo un número determinado de veces en caso de fallo, útil para absorber un error transitorio (un servicio externo temporalmente no disponible) sin intervención humana.

Combinado con el error workflow visto en el [capítulo sobre el catálogo de funcionalidades](/?c=infrastructure-devops&s=automatisation&p=n8n-catalogue-des-fonctionnalites), estos mecanismos cubren lo esencial de la supervisión de un despliegue en producción: ser notificado de un fallo, entender por qué ocurrió, y repetirlo sin partir de cero.

## Seguridad del editor: restringir nodos sensibles

En una instancia self-hosted compartida por varias personas que no son todas igual de confiables, algunos nodos representan un riesgo real: el nodo **Execute Command**, por ejemplo, ejecuta un comando de shell arbitrario en el servidor que aloja n8n. La variable de entorno `NODES_EXCLUDE` retira uno o varios nodos de la lista de los utilizables en la instancia:

```text
NODES_EXCLUDE=["n8n-nodes-base.executeCommand", "n8n-nodes-base.readWriteFile"]
```

El nodo Execute Command está, de hecho, **bloqueado por defecto** en una instalación self-hosted reciente, precisamente por esta razón; hay que permitirlo explícitamente (`NODES_EXCLUDE=[]`) para que esté disponible.

> **Trampa:** permitir Execute Command (o un nodo equivalente igual de potente) en una instancia compartida sin haber pensado en quién puede realmente crear flujos de trabajo en ella. Un nodo capaz de ejecutar comandos del sistema otorga, de facto, un acceso equivalente al del propio servidor.
>
> **Buena práctica:** mantener los nodos más sensibles bloqueados por defecto, y permitirlos solo para una necesidad identificada, en una instancia donde todos los usuarios merecen una confianza equivalente a la que se otorgaría a un acceso directo al servidor.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | n8n Cloud y self-hosted desplazan la responsabilidad de la infraestructura de forma distinta, sin opción universalmente mejor. Las variables de entorno configuran la instancia, las variables de n8n (`$vars`) configuran valores dentro de los flujos de trabajo. Las credentials siguen siendo propias de cada instancia. Los entornos dev/prod son instancias de n8n separadas, sincronizadas por export/import o Source Control Git. |
| **Herramientas utilizables** | La pestaña Executions y sus opciones de retry; el ajuste "Retry on Fail" por nodo; la variable de entorno `NODES_EXCLUDE` para bloquear nodos sensibles como Execute Command. |
| **Trampas a evitar** | Confundir variables de entorno y variables de n8n. Empujar un cambio directamente a producción sin pasar por un entorno intermedio. Permitir un nodo potente (Execute Command) en una instancia compartida sin reflexionar sobre la confianza otorgada a los usuarios. |
| **Buenas prácticas** | Reservar cada tipo de variable a su uso propio. Hacer pasar todo cambio por dev/staging antes de producción. Mantener los nodos sensibles bloqueados por defecto, permitidos solo para una necesidad identificada. |
