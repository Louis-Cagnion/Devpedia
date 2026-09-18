---
order: 16
---

# Sobrecarga y denegación de servicio a nivel de aplicación

[Seguridad de las API web](/?c=securite&s=cybersecurite&p=securite-api-web) cubre el rate limiting: limitar el NÚMERO de peticiones que un cliente puede enviar. Este capítulo cubre una familia distinta y complementaria: peticiones en apariencia legítimas y poco numerosas, pero diseñadas para costar mucho más de procesar de lo que su tamaño hace suponer. Un rate limiting bien ajustado no protege contra una sola petición ya de por sí desmesuradamente costosa.

## ReDoS: una regex cuyo tiempo de ejecución explota

Algunos patrones de expresión regular, en particular los que apilan varios grupos cuantificados (`(a+)+`, `(a|a)*`), tienen un tiempo de ejecución que puede crecer de forma EXPONENCIAL con la longitud de la entrada probada, sobre una entrada precisamente diseñada para no encontrar nunca una coincidencia.

```text
Patron vulnerable:  ^(a+)+$
Entrada adversa  :  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"
                     (30-40 "a" seguidas de un caracter que nunca coincide)

-> El motor de regex prueba TODAS las formas de dividir la cadena de "a" entre
   el grupo interno y el grupo externo antes de concluir que falla:
   el numero de combinaciones se duplica con cada "a" adicional

30 "a"  -> unos milisegundos
40 "a"  -> unos segundos
50 "a"  -> varios MINUTOS, para una sola peticion
```

Una sola petición, de tamaño minúsculo, basta entonces para ocupar un proceso entero durante un tiempo desproporcionado: ya no hace falta enviar un gran volumen de tráfico para saturar un servicio.

> **Buena práctica:** evitar los grupos cuantificados anidados en una regex aplicada a una entrada externa; imponer un tiempo máximo de ejecución a cualquier evaluación de regex sobre un dato no fiable; probar una regex con una herramienta dedicada a detectar patrones vulnerables a ReDoS antes de desplegarla.

## Bombas de descompresión

Un archivo comprimido minúsculo puede representar, una vez descomprimido, un tamaño desmesuradamente mayor: una ratio de compresión extrema, alcanzable repitiendo voluntariamente el mismo dato millones de veces antes de comprimir (lo que comprime de forma muy eficiente datos repetitivos).

```text
Archivo "zip bomb" tipico: unos pocos kilobytes comprimidos
  -> varios GIGAbytes una vez descomprimidos

Si la aplicacion descomprime el archivo ENTERAMENTE en memoria antes
de examinarlo (escaneo antivirus, extraccion de una importacion), agota
su memoria disponible con un solo archivo de unos pocos KB recibido
```

Una variante XML se llama **ataque "billion laughs"**: un documento XML declara una entidad que referencia a varias otras, que a su vez referencian a varias más, a lo largo de varios niveles: un documento de apenas unas líneas se expande a miles de millones de repeticiones una vez resueltas todas las entidades (el mismo mecanismo de entidad ya visto para el [XXE](/?c=securite&s=cybersecurite&p=injections-au-dela-du-sql), aquí reutilizado para agotar recursos en lugar de leer un archivo).

> **Buena práctica:** imponer un tamaño máximo de descompresión ANTES de descomprimir enteramente un archivo (la mayoría de las bibliotecas de (des)compresión exponen un límite configurable), y desactivar la resolución de entidades XML externas/anidadas por defecto (la misma defensa que para el XXE).

## Paginación y consultas sin límite

Un endpoint que devuelve una colección entera por falta de un `LIMIT`/paginación impuesta EN EL SERVIDOR permite extraer una tabla entera en una sola petición. Un parámetro de paginación dejado a elección del cliente (`?limit=`), sin tope, equivale al mismo problema bajo otra forma.

```text
GET /api/clientes            -> sin limite en el servidor, devuelve TODOS los clientes en una llamada

GET /api/clientes?limit=999999999
                             -> si el parametro del cliente nunca se limita en el servidor,
                                termina en exactamente el mismo resultado
```

> **Buena práctica:** imponer un límite máximo en el servidor sobre cualquier colección devuelta, independientemente de lo que pida el cliente; limitar explícitamente cualquier valor de `limit`/`per_page` proporcionado por el cliente a un máximo razonable, nunca transmitirlo tal cual a la consulta.

## Agotamiento de recursos locales

Abrir una conexión, un proceso o un hilo por petición, sin límite ni reutilización, permite saturar el servidor con un número de peticiones que seguiría siendo razonable para una aplicación que gestiona ese recurso correctamente.

| Recurso | Riesgo sin límite | Mitigación |
|---|---|---|
| Conexiones de red/base de datos | Cada petición abre una nueva conexión sin reutilizarla ni cerrarla nunca | Pool de conexiones de tamaño fijo, reutilizadas entre peticiones |
| Procesos/subprocesos lanzados por petición | Un servidor que lanza un nuevo proceso pesado (navegador pilotado, conversión de archivo) por petición de usuario, sin cola ni límite de paralelismo | Cola con un número máximo de tareas simultáneas, el resto espera en lugar de lanzarse todo a la vez |
| Subida de archivo | Ausencia de límite de tamaño sobre un archivo enviado | Límite de tamaño impuesto en el servidor, no solo en el formulario |

## Amplificación de coste mediante una API externa

Una funcionalidad que dispara una llamada a una API de terceros DE PAGO o CON CUOTA (un LLM, un servicio de envío de SMS, una API de geocodificación) por cada petición de usuario, sin límite ni caché, desplaza el riesgo: el recurso agotado ya ni siquiera es local (CPU, memoria), es directamente el presupuesto o la cuota de la cuenta.

```text
Funcionalidad: "Resume este texto con IA" -> 1 llamada al LLM por clic del usuario,
                                               sin limite ni cache

Atacante: script que dispara esta accion miles de veces
          -> la factura explota, o la cuota mensual se agota en unos minutos,
             sin que ningun recurso LOCAL llegue nunca a saturarse
```

> **Buena práctica:** aplicar un rate limiting específico a cualquier funcionalidad que dispare una llamada de terceros facturada, independientemente del rate limiting general de la API; guardar en caché un resultado idéntico ya obtenido en lugar de volver a llamar al servicio externo cada vez.

## Email/notification bombing

Un formulario (contacto, registro, restablecimiento de contraseña) que envía un email o SMS a una dirección/número PROPORCIONADO POR EL USUARIO, sin límite de frecuencia, puede desviarse para hacer spam a un tercero cuya dirección simplemente se conoce, sin necesitar nunca acceder a su cuenta.

> **Buena práctica:** limitar el número de envíos por destinatario (no solo por IP/cuenta remitente) en cualquier funcionalidad que envíe una comunicación a una dirección proporcionada por un tercero.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Más allá del simple rate limiting (número de peticiones), una petición individual puede costar desmesuradamente más de lo que su tamaño sugiere: ReDoS (tiempo de cálculo), bomba de descompresión (memoria), paginación sin límite (base de datos), agotamiento de conexiones/procesos, amplificación de coste mediante una API de terceros facturada, o email bombing hacia un tercero. |
| **Herramientas utilizables** | Tiempo máximo de ejecución sobre una regex; límite de tamaño de descompresión; tope en el servidor sobre cualquier paginación; pool de conexiones/cola de tamaño fijo; caché para una llamada de terceros repetida. |
| **Trampas a evitar** | Una regex con grupos cuantificados anidados sobre una entrada externa. Descomprimir un archivo enteramente antes de verificar su tamaño. Confiar en un parámetro `limit` proporcionado por el cliente sin tope en el servidor. Llamar a una API de terceros facturada sin límite ni caché. Enviar un email/SMS a una dirección de un tercero sin límite de frecuencia. |
| **Buenas prácticas** | Probar una regex contra ReDoS antes del despliegue. Limitar el tamaño de descompresión de antemano. Limitar cualquier colección devuelta en el servidor. Cachear y limitar específicamente cualquier llamada de terceros facturada. Limitar los envíos por destinatario, no solo por remitente. |
