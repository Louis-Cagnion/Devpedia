---
order: 3
---

# n8n: catálogo de funcionalidades y tipos de nodos

El capítulo anterior sentó las piezas genéricas de un nodo (disparador, acción) y su configuración. Este capítulo detalla las grandes familias de nodos específicos que ofrece n8n, más allá de un simple conector hacia un servicio externo.

## Los disparadores: más allá del webhook

Un **disparador** puede tomar varias formas, no solo un evento externo:

| Tipo de disparador | Arranca el flujo de trabajo cuando... |
|---|---|
| **Webhook** | Llega una petición HTTP a una URL propia del flujo de trabajo |
| **Planificado** (*Schedule*) | A intervalo regular (cada hora) o a una hora precisa (todos los días a las 8h) |
| **Manual** | Una persona hace clic en "Test workflow" en el editor |
| **Desde otro flujo de trabajo** | Otro flujo de trabajo de n8n lo llama explícitamente (ver más abajo) |

Un flujo de trabajo solo tiene un disparador activo a la vez (el que realmente lo arrancó): varios nodos de tipo disparador pueden coexistir en el mismo canvas, pero cada uno arranca su propia ejecución independiente.

## Los nodos de código: salir del no-code cuando hace falta

El **Code node** ejecuta directamente [JavaScript](/?c=langages&s=javascript&p=javascript) o [Python](/?c=langages&s=python&p=python) dentro del flujo de trabajo, para tratamientos demasiado específicos para un conector preconfigurado (una transformación de datos compleja, un cálculo, un filtrado a medida):

```javascript
// Code node (JavaScript): conserva solo los elementos cuyo
// importe supera 100, y añade un campo calculado
return $input.all().filter(item => item.json.importe > 100).map(item => {
  item.json.importeConIva = item.json.importe * 1.2;
  return item;
});
```

> **Trampa:** usar sistemáticamente el Code node por reflejo de desarrollador, incluso cuando un nodo preconfigurado existente (filtro, edición de campos) haría lo mismo. Un flujo de trabajo repleto de código pierde la ventaja de legibilidad del no-code para alguien que no escribió ese código.
>
> **Buena práctica:** reservar el Code node para los tratamientos que ningún nodo preconfigurado cubre, y documentar brevemente (comentario en el código, o nombre explícito del nodo) lo que hace, para la próxima persona que abra el flujo de trabajo.

## Los nodos condicionales: hacer bifurcar el flujo de trabajo

Ya mencionados en el capítulo anterior, estos nodos merecen más detalle: el nodo **IF** evalúa una condición y envía los datos por una de dos ramas (verdadero / falso); el nodo **Switch** generaliza el principio a varias ramas según el valor de un campo.

```text
Nodo IF: condición = "importe > 1000"

  Entrada                    Salida "verdadero"    Salida "falso"
  [importe: 1500]  ------>   [importe: 1500]
  [importe: 50]    --------------------------->     [importe: 50]
```

Cada rama lleva después a su propia secuencia de acciones (ej. una alerta específica para importes altos), antes de potencialmente reunirse más adelante en el flujo de trabajo.

## El error workflow: qué hacer cuando una ejecución falla

Por defecto, un nodo que falla detiene la ejecución del flujo de trabajo que lo contiene, sin ninguna acción adicional automática. Un **error workflow** es un flujo de trabajo separado, designado en los ajustes de un flujo de trabajo principal, que se dispara específicamente cuando este último falla: recibe como entrada los detalles del error (qué nodo, qué mensaje) y puede alertar a un equipo (Slack, email) o intentar una acción de compensación.

> **Trampa:** no configurar ningún error workflow en un flujo de trabajo crítico, suponiendo que un fallo se notará de otra forma. Sin una alerta explícita, un fallo silencioso (ej. un webhook que deja de recibir nada por un error anterior) puede pasar desapercibido durante mucho tiempo.
>
> **Buena práctica:** configurar un error workflow al menos para los flujos de trabajo cuyo fallo tiene un impacto real (pérdida de datos, acción de negocio no realizada), con una alerta que llegue de verdad a una persona responsable.

## Llamar a un flujo de trabajo desde otro

El nodo **"Execute Workflow"** llama a otro flujo de trabajo de n8n como si fuera una subfunción, pasándole datos y recuperando su resultado. Este mecanismo permite factorizar una lógica común a varios flujos de trabajo (ej. un paso de validación de datos reutilizado en todas partes) en lugar de duplicarla en cada uno.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un disparador puede ser un webhook, una planificación, un disparo manual, o la llamada desde otro flujo de trabajo. El Code node ejecuta JS/Python para los casos fuera del alcance de los conectores. Los nodos IF/Switch hacen bifurcar el flujo de trabajo según una condición. Un error workflow se dispara específicamente cuando falla el flujo de trabajo principal. |
| **Herramientas utilizables** | El Code node (JavaScript/Python); los nodos IF y Switch; el ajuste "error workflow"; el nodo "Execute Workflow" para llamar a otro flujo de trabajo. |
| **Trampas a evitar** | Usar el Code node por reflejo incluso cuando un nodo preconfigurado bastaría. No configurar ningún error workflow en un flujo de trabajo crítico. |
| **Buenas prácticas** | Reservar el Code node para los casos no cubiertos por un nodo existente, documentándolo. Configurar un error workflow con una alerta que llegue de verdad a alguien, en todo flujo de trabajo cuyo fallo tenga un impacto real. |
