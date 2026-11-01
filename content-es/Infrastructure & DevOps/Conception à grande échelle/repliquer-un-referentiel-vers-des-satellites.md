---
order: 7
---

# Replicar un referencial hacia satélites

Imagine una cadena de tiendas: un catálogo central describe cada artículo (título, precio), y cada tienda mantiene su propia copia para responder deprisa a sus clientes, incluso si la sede está cerrada. Cada vez que cambia un precio en la sede, las tiendas tienen que enterarse. Este capítulo explica cómo una aplicación se las arregla para **copiar datos desde un lugar central hacia varios otros**, y sobre todo qué ocurre cuando una copia es inalcanzable. Solo supone las nociones de [petición HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (un mensaje que un programa envía a otro a través de la red, y que responde con un código de estado) y de [base de datos](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) (el software que guarda los datos en tablas). El caso de varios sitios construidos sobre un mismo código se describe en [Un código, varios sitios: el patrón multisitio](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=un-code-plusieurs-sites).

Tres palabras aparecen en todas partes:

| Palabra | Definición | En la cadena de tiendas |
|---|---|---|
| **Referencial** | El lugar que hace fe: la fuente de verdad. Un dato se crea y se modifica ahí; en cualquier otro sitio solo se copia. | El catálogo de la sede |
| **Satélite** | Una copia local del referencial, mantenida por otro programa u otro sitio, que la lee sin contradecirla nunca. | El catálogo de cada tienda |
| **Replicación a nivel de aplicación** | Copiar los datos **mediante el código de la aplicación** (ella misma envía los cambios), a diferencia de la replicación de la base de datos, donde es el software de base de datos el que copia sus tablas. | Un empleado que llama a las tiendas, en lugar de una fotocopiadora automática |

Un ejemplo habitual: varios sitios web construidos sobre un mismo sistema de gestión de contenidos (una herramienta para crear y actualizar un sitio sin programar, como [Drupal](https://www.drupal.org/docs), un software libre para publicar sitios) reciben cada uno las fichas de un sitio central. Nada en este capítulo depende de ello: los ejemplos son inventados y neutros.

## ¿Por qué no la replicación de la base de datos?

La [replicación de base de datos](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#replicas-de-lectura) (las réplicas de lectura) copia **toda** la base, de forma idéntica, hacia una máquina que sirve para leer. Es excelente cuando la copia es un simple refuerzo de lectura. No conviene en los casos siguientes, donde se elige la replicación a nivel de aplicación:

| Situación | Replicación de base | Replicación a nivel de aplicación |
|---|---|---|
| El satélite solo quiere una parte de los datos (los artículos, no las cuentas de clientes) | En general todo o nada (algunos motores filtran por tabla, a costa de una configuración pesada) | El código envía solo lo que es útil |
| El satélite tiene su propia estructura (otras tablas, otras columnas, otras claves) | Imposible: las tablas se copian de forma idéntica | El código traduce cada ficha a la estructura del satélite |
| El satélite añade sus propios datos junto a la copia | La copia es de solo lectura | Los datos locales y la copia conviven |
| Los sistemas no usan el mismo software de base de datos | Imposible | Un mensaje HTTP pasa por todas partes |
| Se quiere aplicar una regla de negocio a la llegada (una regla propia de la actividad, por ejemplo rechazar un precio negativo) | Ninguna mano sobre la copia | El satélite ejecuta su propio código |

El precio a pagar: todo lo que la base hacía sola (orden de los cambios, recuperación tras una avería) pasa a ser **su** trabajo. El resto del capítulo es la lista de ese trabajo.

## El esquema general

```text
                 +--------------------------+
                 |       REFERENCIAL        |
                 |  (fuente de verdad)      |
                 |  ART-1  Lámpara LED  v2  |
                 |  ART-2  Silla        v2  |
                 +------------+-------------+
                              |
        un mensaje por cambio: identificador externo + versión + datos
              +---------------+---------------+
              |               |               |
              v               v               v
       +-------------+ +-------------+ +-------------+
       | SATÉLITE A  | | SATÉLITE B  | | SATÉLITE C  |
       | clave local | | clave local | | clave local |
       | ART-1 -> 1  | | ART-1 -> 100| | ART-1 -> 500|
       +-------------+ +-------------+ +-------------+
```

El sentido es único: el referencial envía, los satélites reciben. Las tres copias llevan la **misma ficha** (`ART-1`) bajo tres **claves locales** distintas (1, 100, 500): es el tema de la sección sobre el identificador externo.

## Tres formas de propagar un cambio

Cuando una ficha cambia en el referencial, tres estrategias permiten informar a los satélites. Antes, algunas palabras:

- La **coherencia** describe hasta qué punto las copias muestran lo mismo en el mismo instante. Es **inmediata** si, en cuanto el cambio se confirma, todos los satélites lo tienen; es **eventual** (*eventual consistency*) si las copias acaban siendo idénticas tras un retraso.
- La **latencia** es el tiempo que espera quien desencadena la operación (aquí, el usuario que guarda una ficha) antes de obtener su respuesta.
- Una [cola](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#colas-y-procesamiento-asincrono) es una lista de tareas pendientes, depositada por un programa y tratada más tarde por otro (el *worker*).

```text
1. SÍNCRONA            2. COLA                    3. SONDEO PERIÓDICO
   (el referencial         (el referencial deja       (cada satélite pide
    llama y espera)         un mensaje y sigue)        por sí mismo)

 usuario                   usuario                     usuario
     |                         |                           |
     v                         v                           v
 referencial               referencial                 referencial
   |   |   |                   |                           ^
   v   v   v                   v                           | «¿qué hay de nuevo
   A   B   C                 [ cola ]                      |  desde la v. 41?»
 (uno a uno,                   |  |  |                   A   B   C
  respuesta esperada)          v  v  v                 (a intervalo regular)
                               A  B  C
                           (worker, más tarde)
```

| | Propagación síncrona | Cola | Sondeo periódico (*pull*) |
|---|---|---|---|
| **Quién toma la iniciativa** | El referencial, durante la petición | El referencial deposita, un worker entrega | Cada satélite, a su ritmo |
| **Coherencia** | Inmediata si todos responden; una diferencia en cuanto falla un envío | Eventual: unos segundos | Eventual: el intervalo entre dos sondeos (minutos, horas) |
| **Latencia para el usuario** | La **suma** de los intercambios con los N satélites | Una sola escritura en la cola | Ninguna (el satélite trabaja por su cuenta) |
| **Avería de un satélite** | La petición espera el plazo máximo (*timeout*: el tiempo que aceptamos esperar una respuesta antes de abandonar) o falla; aparece una diferencia | El mensaje se queda en la cola hasta que el satélite vuelve | Nada se pierde: al volver, el satélite pide todo lo que le faltó |
| **Qué hay que añadir** | Un registro de envíos fallidos (ver más abajo) | Una infraestructura de cola y un worker | Del lado del referencial, una forma de decir «qué ha cambiado desde tal versión» |
| **Conviene cuando** | Pocos satélites, fiables, y se quiere ver el cambio de inmediato | Muchos satélites, o averías frecuentes | Satélites muy numerosos o a menudo apagados (un satélite que despierta se pone al día) |

El sondeo exige que cada cambio lleve un número que solo crece (una **versión**, o un **cursor**: el último número ya visto por el satélite). El satélite pide «dame todo lo que tenga un número superior a 41» y ya no hace falta que el referencial lo recuerde.

Este capítulo toma la **propagación síncrona** como hilo conductor: es la más sencilla de escribir, por tanto la más extendida en las primeras versiones de una aplicación, y la que más trampas muestra. Las otras dos se obtienen desplazando el paso «enviar al satélite» a otro lugar: a un worker para la cola, al propio satélite para el sondeo. Todo lo demás (identificador externo, idempotencia, reenvío, reconciliación) se aplica igual a las tres.

La elección entre empujar pronto (escritura) y ensamblar tarde (lectura) aparece en [el feed de noticias](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out), que responde a un desafío parecido: un cambio que dar a conocer a muchos destinatarios. La visión general de la sección está en [el diseño a gran escala](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=conception-a-grande-echelle).

## El identificador externo: encontrar la misma ficha

Cada base de datos da a sus filas una **clave local** (también llamada clave primaria): un número (o un texto) único que designa una sola fila, asignado por la propia base cuando se crea la fila. El satélite A numera sus artículos 1, 2, 3; el satélite B, que ya tiene otros datos, empieza en 100. La clave local no tiene sentido fuera de su base.

Para que el satélite sepa «esta ficha que recibo es la que ya tengo», se le envía con cada ficha la clave que **el referencial** le ha dado: el **identificador externo**. El satélite lo guarda en una columna aparte y lo usa para encontrar su fila.

| | Clave local | Identificador externo |
|---|---|---|
| **Quién la elige** | El satélite (su base) | El referencial |
| **Valor para una misma ficha** | Distinto en cada satélite (1, 100, 500) | Idéntico en todas partes (`ART-1`) |
| **Sirve para** | Relacionar entre sí las tablas del satélite | Encontrar, en el satélite, la ficha que llega del referencial |
| **¿Se puede cambiar?** | Sí, mientras el satélite siga coherente | No: es el hilo que une las copias |
| **Cuándo usarla** | En el código y las consultas del satélite | En los mensajes entre referencial y satélites |

Sin identificador externo, el satélite solo puede **crear** una nueva fila con cada mensaje recibido. Esto es lo que ocurre cuando se pierde una respuesta. El código siguiente simula un satélite ingenuo (escrito en [Python](/?c=langages&s=python&p=python), cuyos términos se explican línea a línea: una **clase** agrupa datos y funciones, véase [la programación orientada a objetos](/?c=langages&s=python&p=poo); una **excepción** es un error que se puede interceptar, véase [la gestión de errores](/?c=langages&s=python&p=gestion-des-erreurs), que también cubre `try` / `except`). Las construcciones básicas se explican en los capítulos sobre las [funciones](/?c=langages&s=python&p=fonctions) (`def`, `return`), las [condiciones](/?c=langages&s=python&p=conditions) (`if`, `elif`, `else`), los [bucles](/?c=langages&s=python&p=boucles) (`for`) y los [módulos](/?c=langages&s=python&p=modules-et-environnements) (`import`).

```python
# clase que hace de satélite SIN identificador externo: numera él mismo
class SateliteIngenuo:
    # __init__ prepara un objeto nuevo (self designa el objeto que se está creando)
    def __init__(self):
        # lista de fichas recibidas, en orden de llegada
        self.fichas = []
        # si True, la respuesta «bien recibido» se pierde por el camino: quien llama no la ve
        self.respuesta_perdida = False

    # recibir simula la recepción de una petición de envío
    def recibir(self, titulo):
        # cada recepción añade una ficha nueva, sin comprobar si ya existe
        self.fichas.append(titulo)
        # la ficha queda guardada, pero quien llama solo obtiene el error
        if self.respuesta_perdida:
            # raise dispara la excepción: quien llama la recibe en lugar de un resultado
            raise TimeoutError("sin respuesta antes del plazo máximo")


# crea un satélite sin identificador externo
satelite = SateliteIngenuo()
# la respuesta se va a perder: el envío parecerá haber fallado
satelite.respuesta_perdida = True
# intento 1: el referencial envía la ficha
try:
    satelite.recibir("Lámpara de escritorio")
# TimeoutError se lanza cuando la respuesta no llega a tiempo
except TimeoutError as error:
    # el referencial no sabe si la ficha ha llegado: lo vuelve a intentar
    print("intento 1 :", error)
# la respuesta se volverá a perder, para mostrar el segundo envío
try:
    # intento 2: la misma ficha, reenviada por precaución
    satelite.recibir("Lámpara de escritorio")
# el mismo error que en el intento 1
except TimeoutError as error:
    # muestra el segundo fallo aparente
    print("intento 2 :", error)
# número de fichas realmente presentes en el satélite
print("fichas en el satélite :", len(satelite.fichas))
```

Salida obtenida:

```text
intento 1 : sin respuesta antes del plazo máximo
intento 2 : sin respuesta antes del plazo máximo
fichas en el satélite : 2
```

El referencial ha recibido **dos** veces un error, así que ha reenviado la ficha. Pero la primera recepción sí había tenido éxito: solo se había perdido la respuesta, y el satélite contiene ahora dos veces «Lámpara de escritorio». Un envío que falla **no dice** si el satélite lo ha aplicado: un plazo vencido (*timeout*) es ambiguo.

## La idempotencia: hacer que el envío se pueda reenviar sin peligro

Una operación es **idempotente** cuando hacerla varias veces da el mismo resultado que hacerla una sola vez. Poner el interruptor en «encendido» es idempotente (repetirlo no cambia nada); «invertir el interruptor» no lo es. El mismo principio, con otros ejemplos, se describe en [la robustez de un tratamiento por lotes](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots), en [las migraciones de datos seguras](/?c=donnees&s=bases-de-donnees&p=migrations-de-donnees-sures) y, para un identificador de evento ya tratado, en [la seguridad de los webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks).

Para que el envío sea idempotente, el satélite necesita **dos** cosas en el mensaje:

| Elemento del mensaje | Función | Sin él |
|---|---|---|
| El identificador externo | Decir **qué** ficha es | Un duplicado en cada reenvío |
| La versión (o la fecha de modificación) | Decir **en qué estado** está la ficha | Un mensaje antiguo, llegado tarde, sobrescribe un estado más reciente |

La regla del satélite cabe en tres líneas:

| Caso a la recepción | Acción |
|---|---|
| Identificador externo desconocido | Crear la ficha (nueva clave local) |
| Identificador conocido, versión recibida **más reciente** | Reemplazar la ficha |
| Identificador conocido, versión recibida **igual o más antigua** | No hacer nada, pero **responder «éxito»** |

La última línea es esencial: un mensaje ignorado no es un error. Si el satélite respondiera «error» a un duplicado, el referencial lo reenviaría sin fin.

En HTTP, la forma natural es una petición `PUT` («reemplaza el recurso que está en esta dirección»), cuyo sentido mismo es idempotente, mientras que un `POST` («añade un recurso») crea un duplicado en cada repetición (véase [los métodos HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)). El identificador externo va en la dirección, y la versión en el cuerpo de la petición (los datos adjuntos a esta), en formato [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) (un texto estructurado en pares nombre-valor):

```text
PUT /api/fichas/ART-1 HTTP/1.1
Host: satelite-b.ejemplo.test
Content-Type: application/json

{"id_externo": "ART-1", "titulo": "Lámpara LED", "precio": 12, "version": 2}
```

La primera línea indica el método, la dirección y el protocolo (`HTTP/1.1`: la versión de las reglas de intercambio); `Host` nombra la máquina de destino y `Content-Type` anuncia el formato del cuerpo. Respuestas posibles del satélite:

| Respuesta | Significado para el referencial |
|---|---|
| `200` o `201` | Recibido y tratado (o ignorado como duplicado): retirar el envío del registro |
| `4xx` (por ejemplo `422`, familia de errores atribuidos a quien llama), salvo `408` (plazo vencido) y `429` (demasiadas peticiones), que se reintentan más tarde como un `5xx` | El mensaje se rechaza por inválido: reenviarlo tal cual no sirve de nada, hay que corregirlo o alertar |
| `5xx` (familia de errores del servidor), o ninguna respuesta antes del plazo | El satélite tiene problemas: reintentar más tarde |

## Cuando un satélite es inalcanzable

Un satélite puede estar apagado, saturado, en mantenimiento, o simplemente detrás de una red que se corta. Tres palabras describen lo que sigue:

| Palabra | Significado | Cómo se gestiona |
|---|---|---|
| **Diferencia** | La distancia entre lo que posee el referencial y lo que posee el satélite | Se registra: el referencial anota, en un **registro de pendientes**, qué identificadores no ha recibido el satélite |
| **Reenvío** | Volver a enviar lo que contiene el registro cuando el satélite responde de nuevo | Una tarea programada (véase [cron](/?c=langages&s=bash&p=automatisation-cron)) o un worker reintenta a intervalos regulares |
| **Reconciliación** | Comparar **todo** el contenido del satélite con el del referencial, sin fiarse del registro, y corregir lo que difiere | Una verificación completa, lanzada a mano o periódicamente |

Dos detalles pesan mucho:

- El reenvío devuelve la ficha **en su estado actual**, no el mensaje original. Si una ficha ha cambiado tres veces durante la avería, el satélite recibe una sola vez la última versión: no hace falta repetirle todo el historial.
- El registro puede perderse (reinicio de un programa que lo guardaba en memoria, error, restauración de una copia de seguridad antigua). Un satélite cuyo registro se ha perdido no será reenviado nunca. La reconciliación existe para ese caso: es la red de seguridad, que no depende de nada más que de la comparación de los datos.

| Mecanismo | Coste | Atrapa | Se le escapa |
|---|---|---|---|
| Reenvío del registro | Bajo (solo las diferencias anotadas) | Un satélite que vuelve tras una avería | Un envío cuyo fallo el referencial no anotó |
| Reconciliación | Alto (lee todo, o todas las versiones) | Cualquier diferencia, sea cual sea su origen | Nada, pero solo se ejecuta a intervalos |

Se combinan ambas: el reenvío recupera deprisa el caso habitual, y la reconciliación (por ejemplo cada noche) recupera el resto.

## Detectar la desincronización

Una desincronización silenciosa es la peor: todo funciona, pero una tienda muestra un precio caducado. Hacen falta medidas sencillas, comparadas con regularidad.

| Medida | Cómo | Detecta | No detecta |
|---|---|---|---|
| **Contador** | Número de fichas del referencial frente al número de fichas del satélite | Una ficha que falta o que sobra | Una ficha modificada pero presente en ambos (mismo número, versiones distintas) |
| **Huella** | Un resumen calculado sobre las versiones de todas las fichas; dos resúmenes distintos significan que el contenido difiere | Cualquier diferencia de versión, incluso con el mismo número de fichas | **Cuál** difiere (hay que comparar después ficha a ficha) |
| **Fecha de última actualización** | Cada satélite anota la fecha del último mensaje recibido; se alerta si es demasiado antigua respecto al referencial | Un satélite que ya no recibe nada | Un satélite que recibe pero se equivoca |
| **Comparación ficha a ficha** | Para cada identificador, comparar la versión de los dos lados | La lista exacta de las diferencias | Nada, pero es lo más costoso |

Una **huella** (en inglés *hash*) es el resultado de una función de hash: un cálculo que transforma cualquier texto en un resumen corto de tamaño fijo, de modo que dos textos distintos dan, en la práctica, dos resúmenes distintos (véase [hashing frente a cifrado](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#hashing-frente-a-cifrado-una-confusion-frecuente)). Una de estas funciones, SHA-256, se usa en la simulación de más abajo. Aquí se resume la lista de pares (identificador, versión). El resumen del referencial y el del satélite se comparan de un vistazo, sin transferir los datos.

Un detalle que hay que tener presente: una huella calculada sobre las **versiones** ve que un satélite tiene una versión caducada, pero no que una ficha se haya corrompido con la misma versión. Para este segundo riesgo, se calcula la huella sobre el **contenido** (título, precio...) además de la versión.

La estrategia que funciona: comparar contadores y huellas a menudo (es poco costoso), y lanzar la comparación ficha a ficha solo si la huella difiere.

## Los límites del envío síncrono

Con la propagación síncrona, la petición del usuario **depende de N satélites**: no termina hasta que los N han respondido (o hasta que se ha abandonado). Esto se paga de tres maneras.

**1. La latencia se suma.** Los envíos se hacen uno a uno. Con tres satélites que responden en 40, 90 y 60 ms, el usuario espera 190 ms. Con diez satélites de 100 ms cada uno, espera un segundo solo para guardar una ficha.

**2. Una avería cuesta todo el plazo máximo.** Un satélite apagado no responde «no» enseguida: se queda callado, y el referencial espera hasta el final del plazo máximo (aquí, 3 segundos) antes de abandonar. Cada registro durante la avería cuesta, pues, 3 segundos más al usuario.

**3. La disponibilidad se multiplica.** La **disponibilidad** es la parte del tiempo en que un sistema responde. Si el registro exige que todos los satélites respondan, la probabilidad de que tenga éxito es el **producto** de las disponibilidades. Por ejemplo, con satélites disponibles el 99 % del tiempo cada uno (es decir, 0,99) y que fallan de forma independiente unos de otros:

| Número de satélites | Cálculo | Probabilidad de que todos respondan |
|---|---|---|
| 1 | 0,99 | 99 % |
| 3 | 0,99 × 0,99 × 0,99 | alrededor del 97 % |
| 10 | 0,99 elevado a 10 | alrededor del 90 % |
| 20 | 0,99 elevado a 20 | alrededor del 82 % |

Con veinte satélites, casi una escritura de cada cinco caería sobre al menos una avería. Dos remedios, a menudo combinados:

| Remedio | Principio | Efecto |
|---|---|---|
| No **hacer** fracasar la petición cuando un satélite está mudo | El registro tiene éxito en el referencial; el fallo va al registro de pendientes | La disponibilidad de la aplicación ya no depende de los satélites |
| Sacar el envío de la petición (cola) | La petición deposita un mensaje, y un worker envía en segundo plano | La latencia ya no depende del número de satélites |

La simulación de más abajo aplica el primer remedio (la diferencia se anota, la petición tiene éxito) y muestra su coste (3 segundos de espera); el segundo es el tema de [la cola](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#colas-y-procesamiento-asincrono).

> **Trampa:** creer que una propagación que funciona con tres satélites en pruebas aguantará con treinta en condiciones reales, ante los usuarios. La latencia y la probabilidad de avería crecen con el número de satélites.

## Una simulación completa

El programa de abajo lo reúne todo de principio a fin: un referencial y tres satélites, uno de los cuales se avería. Está en Python (véase [los diccionarios y los conjuntos](/?c=langages&s=python&p=dictionnaires-et-ensembles) para `{}` y `set()`). La «red» se sustituye por una simple llamada de función que puede lanzar `ConnectionError`; las duraciones son **simuladas** (números sumados, nunca una espera real), lo que hace que el resultado sea idéntico en cada ejecución.

### El satélite

```python
# hashlib (biblioteca estándar: viene con Python, nada que instalar)
# calcula las huellas
import hashlib
# json transforma una estructura de Python en texto, para calcular la huella
import json

# tiempo perdido esperando a un satélite mudo antes de abandonar (en ms, simulado)
ESPERA_MAX_MS = 3000


# una huella resume una tabla {identificador: versión} en 8 caracteres
def huella(versiones):
    # items() da los pares (identificador, versión); sorted los ordena: mismo texto
    # json.dumps convierte esta lista en texto
    texto = json.dumps(sorted(versiones.items()))
    # encode() convierte el texto en bytes (números de 0 a 255, la forma almacenada);
    # sha256 lo convierte en un resumen de 64 caracteres hexadecimales (cifras y letras a-f);
    # [:8] conserva los 8 primeros
    return hashlib.sha256(texto.encode()).hexdigest()[:8]


# un satélite: una copia local que tiene sus propias claves
class Satelite:
    # primera_clave: primera clave local libre (cada satélite tiene su historial)
    def __init__(self, nombre, primera_clave, latencia_ms):
        # nombre legible, para los mensajes
        self.nombre = nombre
        # duración simulada de un intercambio exitoso
        self.latencia_ms = latencia_ms
        # True: el satélite ya no responde
        self.caido = False
        # clave local -> ficha (es la tabla del satélite)
        self.fichas = {}
        # identificador externo -> clave local (para encontrar «la misma ficha»)
        self.clave_por_id_externo = {}
        # próxima clave local que repartir
        self.proxima_clave = primera_clave

    # recibe un mensaje del referencial; recibirlo dos veces cambia el resultado una vez
    def recibir(self, mensaje):
        # un satélite caído no responde: quien llama recibe una excepción
        if self.caido:
            # f"..." inserta el valor de self.nombre en lugar de {self.nombre}
            raise ConnectionError(f"{self.nombre} inalcanzable")
        # el identificador externo es la clave del referencial, nunca la clave local
        id_externo = mensaje["id_externo"]
        # get() devuelve el valor de la clave, o None (el valor «nada») si está ausente
        # aquí: la clave local de la ficha si ya es conocida
        clave = self.clave_por_id_externo.get(id_externo)
        # ficha desconocida: se crea bajo una nueva clave local
        if clave is None:
            # toma la próxima clave local libre
            clave = self.proxima_clave
            # la clave siguiente será la siguiente
            self.proxima_clave += 1
            # memoriza la correspondencia identificador externo -> clave local
            self.clave_por_id_externo[id_externo] = clave
        # ficha conocida con versión igual o más reciente: nada que hacer (idempotencia)
        elif self.fichas[clave]["version"] >= mensaje["version"]:
            # responde «ignorado»: el envío es un éxito, pero no cambia nada
            return "ignorado"
        # dict(mensaje) hace una copia del mensaje, guardada bajo la clave local
        self.fichas[clave] = dict(mensaje)
        # responde que el mensaje ha modificado el satélite
        return "aplicado"

    # identificador externo -> versión: vista general de lo que posee el satélite
    def versiones(self):
        # comprensión de diccionario: construye un diccionario en una línea recorriendo
        # una colección, aquí una entrada por ficha (values() lista las fichas)
        return {f["id_externo"]: f["version"] for f in self.fichas.values()}
```

### El referencial

```python
# el referencial: la fuente de verdad, que propaga cada cambio
class Referencial:
    # satelites: la lista de copias que hay que mantener al día
    def __init__(self, satelites):
        # identificador -> ficha (título, precio, versión)
        self.fichas = {}
        # los satélites que hay que alimentar
        self.satelites = satelites
        # el registro: por satélite, un set (sin duplicados) de identificadores no recibidos
        self.a_reenviar = {s.nombre: set() for s in satelites}

    # crea o modifica una ficha, y luego la propaga; devuelve la duración total simulada
    def registrar(self, id_externo, titulo, precio):
        # versión anterior de la ficha (None si es nueva)
        anterior = self.fichas.get(id_externo)
        # la versión aumenta en 1 con cada modificación (1 para una ficha nueva)
        version = 1 if anterior is None else anterior["version"] + 1
        # escribe la ficha en el referencial, con su identificador y su versión
        self.fichas[id_externo] = {
            # el identificador externo viaja con la ficha
            "id_externo": id_externo,
            # los datos de la ficha: un título y un precio
            "titulo": titulo,
            "precio": precio,
            # la versión permite comparar dos estados de la misma ficha
            "version": version,
        }
        # propaga de forma síncrona: un satélite tras otro, respuesta esperada;
        # sum suma las duraciones devueltas (una por satélite, calculada bajo demanda)
        return sum(self.enviar(s, id_externo) for s in self.satelites)

    # envía la versión ACTUAL de una ficha a un satélite; devuelve la duración simulada
    def enviar(self, satelite, id_externo):
        # try / except: intenta el envío e intercepta el error de conexión
        try:
            satelite.recibir(self.fichas[id_externo])
        # satélite mudo: se anota la diferencia en el registro
        except ConnectionError:
            self.a_reenviar[satelite.nombre].add(id_externo)
            # y hemos perdido todo el plazo de espera
            return ESPERA_MAX_MS
        # envío exitoso: discard quita el identificador del registro (sin error si no está)
        self.a_reenviar[satelite.nombre].discard(id_externo)
        # duración del intercambio exitoso
        return satelite.latencia_ms

    # reenvío: vuelve a enviar todo lo anotado en el registro
    def reenviar(self):
        # para cada satélite...
        for satelite in self.satelites:
            # sorted crea una copia fija, porque enviar() modifica el conjunto en el bucle
            for id_externo in sorted(self.a_reenviar[satelite.nombre]):
                # ...vuelve a enviar cada ficha anotada
                self.enviar(satelite, id_externo)

    # reconciliación: compara todo, sin fiarse del registro
    def reconciliar(self, satelite):
        # versiones que el satélite posee realmente
        poseidas = satelite.versiones()
        # fichas ausentes o caducadas en el lado del satélite (comprensión de lista:
        # construye una lista en una línea); items() da los pares (identificador, ficha),
        # get() la versión poseída (None si ausente)
        diferencias = [
            id_externo for id_externo, ficha in self.fichas.items()
            if poseidas.get(id_externo) != ficha["version"]
        ]
        # vuelve a enviar cada una de estas fichas
        for id_externo in diferencias:
            self.enviar(satelite, id_externo)
        # lista de las fichas corregidas
        return diferencias

    # huella de lo que posee el referencial
    def huella(self):
        # mismo cálculo que para un satélite, sobre las versiones del referencial
        return huella({i: f["version"] for i, f in self.fichas.items()})


# muestra el contador y la huella del referencial, y luego los de cada satélite
def estado(referencial):
    # huella de referencia, calculada una vez
    referencia = referencial.huella()
    # línea del referencial
    print(f"  referencial : {len(referencial.fichas)} fichas, huella {referencia}")
    # una línea por satélite, con el veredicto de la comparación
    for s in referencial.satelites:
        # huella de lo que posee este satélite
        e = huella(s.versiones())
        # «ok» si es idéntica a la referencia, «DIFERENCIA» si no
        veredicto = "ok" if e == referencia else "DIFERENCIA"
        # {s.nombre:<10} completa el nombre con espacios hasta 10 caracteres
        print(f"  {s.nombre:<10}: {len(s.fichas)} fichas, huella {e}  {veredicto}")
```

### El escenario

```python
# tres satélites, con historiales locales distintos (claves de partida 1, 100, 500)
satelite_a = Satelite("A", 1, 40)
# B responde en 90 ms y numera a partir de 100
satelite_b = Satelite("B", 100, 90)
# C responde en 60 ms y numera a partir de 500
satelite_c = Satelite("C", 500, 60)
# el referencial que los alimenta
ref = Referencial([satelite_a, satelite_b, satelite_c])

# --- 1. funcionamiento normal ---
print("1. tres fichas creadas, todos responden")
# enumerate numera los títulos a partir de 1: (1, "Lámpara"), (2, "Silla"), ...
for i, titulo in enumerate(["Lámpara", "Silla", "Escritorio"], start=1):
    # crea las fichas ART-1, ART-2, ART-3; duracion guarda la última duración
    duracion = ref.registrar(f"ART-{i}", titulo, 10 * i)
print(f"  duración de la petición del usuario : {duracion} ms (40 + 90 + 60)")
# muestra los contadores y las huellas
estado(ref)
# la misma ficha lleva tres claves locales distintas
print("  clave local de ART-1 :",
      {s.nombre: s.clave_por_id_externo["ART-1"] for s in ref.satelites})

# --- 2. idempotencia: el mismo mensaje enviado dos veces ---
print("2. mismo mensaje enviado dos veces a un satélite de prueba, fuera del referencial")
# satélite de prueba, vacío
prueba = Satelite("prueba", 900, 10)
# primer envío de la versión 1 de ART-1
primero = prueba.recibir(ref.fichas["ART-1"])
# segundo envío, idéntico, como tras una respuesta perdida
segundo = prueba.recibir(ref.fichas["ART-1"])
print(" ", primero, "y luego", segundo, "; fichas en la prueba :", len(prueba.fichas))

# --- 3. B cae durante dos cambios ---
print("3. B caído ; ART-2 modificado, ART-4 creado")
# B ya no responde
satelite_b.caido = True
# modificación de una ficha existente
d1 = ref.registrar("ART-2", "Silla", 25)
# creación de una ficha nueva
d2 = ref.registrar("ART-4", "Estantería", 40)
print(f"  duraciones : {d1} ms y {d2} ms (40 + 3000 + 60 para cada una)")
print("  a reenviar :", {s: sorted(ids) for s, ids in ref.a_reenviar.items() if ids})
# muestra los contadores y las huellas
estado(ref)

# --- 4. B vuelve: reenvío ---
print("4. B vuelve, reenvío del registro de pendientes")
# B responde de nuevo
satelite_b.caido = False
# vuelve a enviar lo que contiene el registro
ref.reenviar()
# muestra los contadores y las huellas
estado(ref)

# --- 5. C cae, luego se pierde el registro: reconciliación ---
print("5. C caído durante un cambio, luego el referencial pierde su registro")
# C ya no responde durante la modificación de ART-1
satelite_c.caido = True
ref.registrar("ART-1", "Lámpara LED", 12)
# reinicio del referencial: el registro, guardado en memoria, se vacía
ref.a_reenviar = {s.nombre: set() for s in ref.satelites}
# C vuelve
satelite_c.caido = False
# el reenvío no encuentra nada que enviar
ref.reenviar()
print("  tras el reenvío (registro vacío) :")
# muestra los contadores y las huellas
estado(ref)
# la reconciliación compara las versiones ficha a ficha y devuelve las diferencias
print("  reconciliación de C :", ref.reconciliar(satelite_c))
# muestra los contadores y las huellas
estado(ref)
```

Salida obtenida al ejecutar este programa (Python 3 debe estar instalado, véase [Python](/?c=langages&s=python&p=python); los tres bloques de arriba, del satélite al escenario, se pegan en orden en un solo archivo `simulation.py`, y luego `python3 simulation.py` en una terminal):

```text
1. tres fichas creadas, todos responden
  duración de la petición del usuario : 190 ms (40 + 90 + 60)
  referencial : 3 fichas, huella 20791267
  A         : 3 fichas, huella 20791267  ok
  B         : 3 fichas, huella 20791267  ok
  C         : 3 fichas, huella 20791267  ok
  clave local de ART-1 : {'A': 1, 'B': 100, 'C': 500}
2. mismo mensaje enviado dos veces a un satélite de prueba, fuera del referencial
  aplicado y luego ignorado ; fichas en la prueba : 1
3. B caído ; ART-2 modificado, ART-4 creado
  duraciones : 3100 ms y 3100 ms (40 + 3000 + 60 para cada una)
  a reenviar : {'B': ['ART-2', 'ART-4']}
  referencial : 4 fichas, huella 90b23cec
  A         : 4 fichas, huella 90b23cec  ok
  B         : 3 fichas, huella 20791267  DIFERENCIA
  C         : 4 fichas, huella 90b23cec  ok
4. B vuelve, reenvío del registro de pendientes
  referencial : 4 fichas, huella 90b23cec
  A         : 4 fichas, huella 90b23cec  ok
  B         : 4 fichas, huella 90b23cec  ok
  C         : 4 fichas, huella 90b23cec  ok
5. C caído durante un cambio, luego el referencial pierde su registro
  tras el reenvío (registro vacío) :
  referencial : 4 fichas, huella 8b61e9c0
  A         : 4 fichas, huella 8b61e9c0  ok
  B         : 4 fichas, huella 8b61e9c0  ok
  C         : 4 fichas, huella 90b23cec  DIFERENCIA
  reconciliación de C : ['ART-1']
  referencial : 4 fichas, huella 8b61e9c0
  A         : 4 fichas, huella 8b61e9c0  ok
  B         : 4 fichas, huella 8b61e9c0  ok
  C         : 4 fichas, huella 8b61e9c0  ok
```

### Leer la salida

| Paso | Lo que se observa | Lo que hay que entender |
|---|---|---|
| 1 | La petición dura 190 ms; ART-1 lleva las claves locales 1, 100 y 500 | La latencia es la suma (40 + 90 + 60); la clave local difiere, y el identificador externo `ART-1` une las copias |
| 2 | «aplicado y luego ignorado», una sola ficha en el satélite de prueba | El mismo mensaje recibido dos veces no crea un duplicado (idempotencia) |
| 3 | Cada petición dura 3100 ms; B muestra DIFERENCIA; el registro contiene ART-2 y ART-4 | La avería de B cuesta 3000 ms en cada registro; el contador de B (3) es inferior al de los demás (4) |
| 4 | Tras el reenvío, las cuatro huellas son idénticas | El registro bastó para recuperar a B |
| 5 | El contador de C vale 4 como los demás, pero su huella difiere; el reenvío no cambia nada; la reconciliación devuelve `ART-1` | El contador no ve una ficha caducada, la huella sí; la reconciliación repara incluso cuando el registro se ha perdido |

## Las trampas

| Trampa | Consecuencia | Corrección |
|---|---|---|
| Usar la clave local del referencial como identificador en los satélites | Las claves colisionan con las que el satélite ya ha repartido | Un identificador externo distinto, guardado en una columna dedicada del satélite |
| Sin identificador externo: crear en cada mensaje | Duplicados en cada reenvío | Buscar la ficha por identificador externo antes de crear |
| Sin versión: aplicar todo mensaje recibido | Un mensaje antiguo, llegado tarde, sobrescribe un estado más reciente | Ignorar toda versión inferior o igual a la que ya se posee |
| Responder «error» a un duplicado | El referencial reenvía sin fin | Responder «éxito» y no cambiar nada |
| Hacer fracasar el registro cuando un satélite está mudo | La disponibilidad de la aplicación depende de la más débil de las copias | Registrar en el referencial, anotar la diferencia y reenviar más tarde |
| Registro de fallos guardado solo en memoria | Un reinicio borra la lista; el satélite no será recuperado nunca | Escribir el registro en una tabla del referencial, y reconciliar periódicamente |
| Reenviar el mensaje original | Varios mensajes que aplicar en orden, o un mensaje caducado | Reenviar el estado actual de la ficha |
| No propagar la eliminación | Una ficha eliminada en el referencial sigue visible en los satélites | Enviar un mensaje «eliminado» (o conservar una marca de borrado: una columna `suprimido = verdadero` en lugar de borrar la fila) y tratar, en la reconciliación, las fichas del satélite ausentes del referencial (la simulación no gestiona este caso) |
| Fiarse solo del contador | Una ficha caducada pasa desapercibida | Añadir una huella de las versiones |
| Una huella que solo ve las versiones | Una ficha corrompida con la misma versión pasa desapercibida | Incluir el contenido en el cálculo de la huella |
| Plazo de espera ausente o enorme | Un satélite mudo congela la petición del usuario | Un plazo máximo corto, fijado para cada llamada |
| Reintentar de inmediato y sin fin | Un satélite ya saturado recibe aún más peticiones | Espaciar los reintentos, alargando la espera en cada fallo |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Un identificador externo y una versión en **cada** mensaje | El satélite sabe qué ficha y en qué estado, así que el envío se puede reenviar sin peligro |
| Envíos idempotentes, siempre confirmados con un éxito | Un plazo vencido es ambiguo: solo el reenvío disipa la duda |
| Anotar cada fallo en un registro **duradero** (una tabla) | Ningún satélite se olvida tras un reinicio |
| Reenviar el estado actual de la ficha, no el mensaje original | Un solo envío basta, incluso tras varios cambios |
| Reconciliar periódicamente | La red de seguridad que recupera todo lo que el registro no captó |
| Comparar contadores y huellas, y alertar ante la diferencia | Detectar la desincronización antes de que la vea un usuario |
| Un plazo máximo corto en cada llamada al satélite | Una avería ya no congela la petición del usuario |
| Sacar el envío de la petición (cola) en cuanto N crece | La latencia y la disponibilidad ya no dependen del número de satélites |
| Mantener el sentido único: el referencial envía, los satélites reciben | Una modificación local de un satélite se sobrescribiría en el siguiente envío |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un **referencial** (fuente de verdad) envía sus cambios a **satélites** (copias locales) mediante el código de la aplicación: es la **replicación a nivel de aplicación**, a diferencia de la replicación de la base de datos. Tres estrategias: propagación síncrona (la petición espera a los N satélites), cola (un worker entrega más tarde) y sondeo periódico (el satélite pide lo que le faltó). Cada mensaje lleva un **identificador externo** (la clave del referencial, distinta de la clave local del satélite) y una **versión**, para que el envío sea **idempotente**: recibirlo dos veces no cambia nada más. Un satélite inalcanzable crea una **diferencia**, anotada en un **registro** para un **reenvío**; la **reconciliación** compara todo y recupera lo que el registro no captó. Se detecta la desincronización con contadores, huella de las versiones y fecha de última actualización. El envío síncrono suma las latencias y multiplica los riesgos de avería. |
| **Trampas que evitar** | Reutilizar la clave local como identificador; crear en cada mensaje; no versionar; responder «error» a un duplicado; hacer fracasar el registro cuando un satélite está mudo; registro guardado en memoria; reenviar el mensaje antiguo en lugar del estado actual; olvidar las eliminaciones; fiarse solo del contador; plazo de espera ausente; reintentos sin pausa. |
| **Buenas prácticas** | Identificador externo y versión en cada mensaje; envíos idempotentes confirmados con un éxito; registro duradero; reenvío del estado actual; reconciliación periódica; alertas por contador y huella; plazo máximo corto; cola en cuanto crece el número de satélites; flujo de sentido único. |
