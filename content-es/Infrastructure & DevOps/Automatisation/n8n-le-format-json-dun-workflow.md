---
order: 4
---

# n8n: el formato JSON de un flujo de trabajo

Bajo la interfaz visual, un flujo de trabajo de n8n no es más que un archivo [JSON](/?c=infrastructure-devops&s=infrastructure&p=json): cada nodo colocado en el canvas y cada conexión trazada entre ellos se encuentra ahí en una forma legible. Entender esta estructura permite exportar, compartir y versionar un flujo de trabajo como cualquier otro archivo de configuración.

## Exportar e importar

El menú del flujo de trabajo (tres puntos, arriba a la derecha del editor) ofrece **"Download"**, que descarga el flujo de trabajo completo como un archivo `.json`. A la inversa, **"Import from File"** recarga un flujo de trabajo a partir de ese archivo. También existe un atajo para una parte del canvas: seleccionar nodos y luego `Ctrl+C`/`Ctrl+V` copia y pega su JSON, incluso entre dos pestañas distintas de n8n.

## La estructura general

Un flujo de trabajo exportado se organiza en torno a dos claves principales, `nodes` y `connections`, junto con información general sobre el propio flujo de trabajo (nombre, estado activo o no, ajustes):

```json
{
  "name": "Notificar un nuevo pedido",
  "active": false,
  "nodes": [ /* la lista de nodos, detallada más abajo */ ],
  "connections": { /* los enlaces entre nodos, detallados más abajo */ },
  "settings": {}
}
```

## Un nodo en el JSON

Cada nodo del canvas corresponde a un objeto en el array `nodes`: su nombre (tal como se muestra en el canvas), su tipo (qué conector o qué función), su posición visual, y sus **parámetros** (el contenido realmente configurado en el panel visto en el primer capítulo):

```json
{
  "name": "Enviar un mensaje de Slack",
  "type": "n8n-nodes-base.slack",
  "typeVersion": 1,
  "position": [900, 300],
  "parameters": {
    "channel": "ventas",
    "text": "Nuevo pedido recibido"
  },
  "credentials": {
    "slackApi": {
      "id": "17",
      "name": "slack_credentials"
    }
  }
}
```

El campo `credentials` solo contiene una **referencia** (un id y un nombre) a credenciales almacenadas por separado por n8n, nunca la contraseña o la clave de API en sí: un archivo exportado puede compartirse por tanto sin revelar ningún secreto, pero sigue siendo inutilizable tal cual hasta que las credenciales correspondientes se hayan reconfigurado en la instancia de destino.

## Las conexiones: quién envía sus datos a quién

El objeto `connections` asocia el **nombre** de un nodo origen a la lista de nodos que reciben sus datos de salida:

```json
{
  "connections": {
    "Nuevo pedido": {
      "main": [
        [
          { "node": "Enviar un mensaje de Slack", "type": "main", "index": 0 }
        ]
      ]
    }
  }
}
```

Esta estructura anidada (un array de arrays) existe para representar los nodos con varias salidas (como los nodos IF o Switch vistos en el capítulo anterior): cada salida del nodo origen tiene su propio array de nodos destino, en el orden en que aparecen en el canvas.

> **Trampa:** modificar el nombre de un nodo directamente en el JSON en bruto, olvidando que ese nombre se usa como clave en el objeto `connections`. Un nombre desincronizado rompe silenciosamente el enlace entre los dos nodos afectados en la siguiente importación.
>
> **Buena práctica:** renombrar un nodo desde el editor visual en lugar de en el JSON en bruto; n8n se encarga entonces de actualizar automáticamente todas las referencias en `connections`.

## El formato de los datos que circulan

Además del propio archivo del flujo de trabajo, resulta útil conocer el formato de los **datos** que cada nodo manipula internamente (visible en el panel de ejecución): n8n siempre hace circular un array de objetos, cada uno con una clave `json` (datos habituales) o `binary` (un archivo):

```json
[
  {
    "json": {
      "cliente": "Alicia",
      "importe": 149.90
    }
  }
]
```

Es esta misma estructura la que manipula un Code node (ver el capítulo anterior) mediante `$input.all()`.

## Versionar un flujo de trabajo como código

Como un flujo de trabajo no es más que un archivo de texto estructurado, nada impide hacerle commit en un repositorio [Git](/?c=qualite-performance-et-outils&s=git&p=commandes-essentielles): el historial de sus versiones, las diferencias entre dos versiones (`git diff`), y una revisión antes de un cambio se vuelven entonces posibles, exactamente igual que con código fuente clásico.

> **Trampa:** hacer commit de un export de flujo de trabajo sin haber comprobado que no contiene ningún dato sensible fijado directamente en los `parameters` (una URL con un token de acceso en texto plano, por ejemplo): a diferencia de las `credentials`, un valor escrito directamente en un campo de texto se exporta tal cual.
>
> **Buena práctica:** usar las credenciales de n8n, o variables de entorno, para cualquier valor sensible, nunca un campo de texto fijo, para que un export siga siendo seguro de compartir o versionar.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un flujo de trabajo exportado es un JSON con dos claves principales: `nodes` (nombre, tipo, posición, parámetros) y `connections` (qué nodo envía sus datos a qué otro, por nombre). Las `credentials` solo almacenan una referencia, nunca el secreto en sí. Los datos que circulan entre nodos son siempre un array de objetos `{json: ...}` o `{binary: ...}`. |
| **Herramientas utilizables** | "Download"/"Import from File" para exportar/importar; `Ctrl+C`/`Ctrl+V` para copiar una selección de nodos; Git para versionar un flujo de trabajo como código. |
| **Trampas a evitar** | Renombrar un nodo directamente en el JSON en bruto, desincronizando las referencias en `connections`. Hacer commit de un export que contenga un dato sensible fijado en un parámetro. |
| **Buenas prácticas** | Renombrar un nodo desde el editor visual, nunca en el JSON en bruto. Usar las credenciales de n8n o variables de entorno para cualquier valor sensible antes de compartir o versionar un export. |
