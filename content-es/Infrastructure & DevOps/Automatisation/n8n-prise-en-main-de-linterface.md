---
order: 2
---

# n8n: primeros pasos con la interfaz

El capítulo sobre la [automatización por flujo de trabajo visual](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) sienta el vocabulario común a estas herramientas (disparador, acción, conector). Este capítulo lo aplica concretamente a la interfaz de [n8n](https://n8n.io), para saber dónde está cada cosa antes de construir un primer flujo de trabajo.

## El canvas: el espacio de trabajo visual

El **canvas** es la zona principal del editor de n8n: un espacio en blanco donde cada **nodo** (*node*) aparece como un bloque rectangular, colocado libremente con el ratón. Un nodo siempre representa una de las tres piezas ya vistas (disparador, acción, o un nodo especial de lógica); su icono y su nombre indican de inmediato el servicio o la función que representa.

```text
Canvas de n8n (vista simplificada):

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Disparador  │─────▶│   Acción 1   │─────▶│   Acción 2   │
│  (Webhook)   │      │  (HTTP Req.) │      │   (Slack)    │
└──────────────┘      └──────────────┘      └──────────────┘
```

Añadir un nodo se hace mediante el botón **+** (en el canvas o a continuación de un nodo existente), que abre un panel de búsqueda con todos los conectores disponibles (más de 400 servicios integrados, más un nodo HTTP genérico para cualquier servicio sin conector dedicado).

## Las conexiones: hacer circular los datos

Una **conexión** es la línea que une la salida de un nodo con la entrada del siguiente: representa a la vez el orden de ejecución (el nodo siguiente se ejecuta después del que lo precede) y el paso de datos entre ellos (cada nodo recibe como entrada lo que el anterior produjo como salida).

> **Trampa:** creer que una conexión transporta únicamente una señal de "ejecútate ahora", sin datos. En realidad, cada nodo recibe un array de elementos de datos (a menudo en formato JSON) producido por el nodo anterior, y puede usarlo en su propia configuración (ej. reutilizar la dirección de correo extraída por el nodo anterior).
>
> **Buena práctica:** antes de configurar un nodo, comprobar en el panel de ejecución (ver más abajo) la forma exacta de los datos recibidos del nodo anterior, en lugar de adivinarla.

Un nodo puede tener varias conexiones salientes: así es como un **nodo condicional** (*IF*, *Switch*) hace bifurcar el flujo de trabajo según un criterio, cada rama llevando a un conjunto de acciones distinto. Este tipo de nodo se detalla en el capítulo siguiente sobre el catálogo de funcionalidades.

## Configurar un nodo

Hacer doble clic en un nodo abre su panel de configuración, específico del servicio que representa: credenciales de conexión (a menudo gestionadas aparte, como **credentials** reutilizables entre flujos de trabajo), campos a rellenar (destinatario de un correo, canal de Slack, URL de una petición HTTP), y el mapeo de los datos recibidos del nodo anterior hacia esos campos.

```text
Configuración de un nodo "Enviar correo":

  Destinatario: {{ $json.email }}     <- valor tomado de los datos
  Asunto      : "Confirmación"           recibidos del nodo
  Cuerpo      : "Hola {{ $json.nombre }}"  anterior
```

La sintaxis `{{ ... }}` inserta una **expresión**: en lugar de un valor fijo, el campo busca un dato dinámico (aquí, en el JSON recibido como entrada del nodo).

## El panel de ejecución: ver lo que realmente pasó

Cada ejecución de un flujo de trabajo (manual o realmente disparada) deja un rastro consultable: el **panel de ejecución** lista, nodo por nodo, los datos recibidos como entrada y producidos como salida, con un código de color (verde para un éxito, rojo para un error) que permite localizar de inmediato dónde falló un flujo de trabajo.

| Información visible | Utilidad |
|---|---|
| Datos de entrada/salida de cada nodo | Verificar que los datos esperados son realmente los recibidos |
| Estado (éxito/error) por nodo | Localizar con precisión dónde se detuvo un flujo de trabajo |
| Historial de ejecuciones pasadas | Comparar una ejecución fallida con una ejecución exitosa anterior |

## Probar manualmente antes de activar

Un flujo de trabajo recién creado permanece **inactivo** por defecto: su disparador real (un webhook, una planificación) solo se pone en marcha una vez activado explícitamente el flujo de trabajo. El botón **"Test workflow"** ejecuta el flujo de trabajo inmediatamente, una sola vez, sin esperar al disparador real, insertando datos de ejemplo si es necesario.

> **Trampa:** activar un flujo de trabajo justo después de construirlo, sin haberlo probado manualmente antes. Un webhook mal configurado o una acción que envía realmente un mensaje puede entonces ejecutarse en condiciones reales antes de haber sido verificada, potencialmente de forma repetida si el disparador se produce a menudo.
>
> **Buena práctica:** ejecutar siempre "Test workflow" al menos una vez, comprobar cada nodo en el panel de ejecución, antes de activar el interruptor de activación.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | El canvas muestra los nodos de un flujo de trabajo enlazados por conexiones, que transportan a la vez el orden de ejecución y los datos. Configurar un nodo consiste en rellenar sus campos, a veces con expresiones dinámicas (`{{ }}`) tomadas de los datos recibidos. El panel de ejecución muestra el detalle de entrada/salida de cada nodo, éxito o fallo. |
| **Herramientas utilizables** | El botón "+" para añadir un nodo; el panel de ejecución para inspeccionar los datos; el botón "Test workflow" para una ejecución manual. |
| **Trampas a evitar** | Creer que una conexión no transporta ningún dato. Activar un flujo de trabajo sin haberlo probado manualmente antes. |
| **Buenas prácticas** | Comprobar la forma de los datos recibidos antes de configurar un nodo que los usa. Probar siempre manualmente antes de activar. |
