---
order: 6
---

# Cola de espera, worker y bloqueo de aplicación (31/10/2026)

Una **tarea** es un trabajo que el programa debe realizar: enviar un correo, recalcular una ficha, purgar datos antiguos. Cuando un sitio recibe una **petición** (la solicitud que envía el navegador de un visitante), puede hacer la tarea él mismo antes de responder, o **ponerla en cola** y responder enseguida, dejando que otro programa la haga después. Este capítulo construye la segunda vía, de principio a fin, en seis piezas:

| Pieza | Pregunta a la que responde | Sección |
|---|---|---|
| La **cola de espera** | ¿Dónde guardar las tareas mientras tanto? | [La cola](#el-minisistema-de-ensayo-la-cola) |
| El **worker** | ¿Quién las ejecuta, y cómo escribir varios workers sin copiar el bucle? | [Método plantilla](#el-patron-metodo-plantilla-un-esqueleto-fijo-un-hueco-que-rellenar) |
| El **bloqueo de aplicación** | ¿Cómo impedir que dos workers toquen la misma ficha al mismo tiempo? | [El bloqueo](#el-bloqueo-de-aplicacion-sobre-una-entidad) |
| El **planificador** | ¿Quién deposita las tareas recurrentes? | [El planificador](#el-planificador-de-aplicacion-un-unico-cron-que-decide) |
| Los **reintentos** | ¿Qué hacer cuando una tarea falla, o falla siempre? | [Reintentos](#reintentos-tarea-envenenada-e-idempotencia) |
| El **supervisor** | ¿Quién relanza un worker que se ha parado? | [El supervisor](#mantener-vivo-un-worker-el-supervisor) |

El código está escrito en [Python](/?c=langages&s=python) con una base [SQLite](https://www.sqlite.org/docs.html) (una base de datos contenida en un solo archivo), consultada en [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql). Es un **minisistema inventado para la ocasión**, lo bastante pequeño para leerlo entero y ejecutarlo; muestra el principio, no sustituye a un verdadero gestor de colas. Una última sección muestra las mismas ideas en un framework (un marco de software que proporciona la estructura de una aplicación) [PHP](/?c=langages&s=php) muy extendido, [Drupal](https://www.drupal.org), solo a título de **ejemplo**.

| Herramienta real | Qué es | Para profundizar |
|---|---|---|
| Redis | Base de datos en memoria cuya lista puede servir de cola | [Redis](/?c=donnees&s=bases-de-donnees&p=redis) |
| RabbitMQ | Programa dedicado a las colas de mensajes, con confirmación y reintentos | [Documentación](https://www.rabbitmq.com/docs) |
| Amazon SQS | Servicio de cola alojado por Amazon Web Services, sin servidor que gestionar | [Documentación](https://docs.aws.amazon.com/sqs/) |
| Celery | Biblioteca de Python que guarda tareas en una cola y las ejecuta | [Documentación](https://docs.celeryq.dev/) |

El capítulo vecino sobre [las bases de datos de alto tráfico](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#colas-y-procesamiento-asincrono) presenta la cola de espera en pocas líneas como remedio a una consulta lenta; este entra en el detalle de su funcionamiento. La sección [Automatización](/?c=infrastructure-devops&s=automatisation) cubre otro medio de encadenar tareas: [el workflow visual](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow), donde se encadenan bloques en una pantalla en lugar de escribir código.

## Por qué poner un trabajo en cola

Sin cola, el visitante espera al final del trabajo. Con una cola, la petición deposita una tarea (unos milisegundos) y responde; el trabajo pesado se hace detrás, a su ritmo.

```text
SIN COLA                                   CON COLA

visitante --petición--> servidor           visitante --petición--> servidor
                       | hace el trabajo                          | deposita la tarea
                       | (8 segundos)                             v
visitante <--respuesta-- servidor          visitante <--respuesta-- COLA (instantáneo)
          (tras 8 s)                                                |
                                                                    v
                                                      worker: hace el trabajo
                                                      (8 segundos, entre bastidores)
```

| Necesidad | Sin cola | Con cola |
|---|---|---|
| **Responder rápido** | La petición dura lo que el trabajo | La petición dura el tiempo de un depósito |
| **Absorber un pico** | Mil envíos a la vez saturan el servidor | Las mil tareas esperan, 2 o 3 workers las despachan a velocidad constante |
| **Repetir un fallo** | El trabajo fallido se pierde, o el visitante ve un error | La tarea vuelve a la cola y se reintenta más tarde |
| **Sobrevivir a un reinicio** | El trabajo en memoria desaparece | La cola se guarda (aquí en base): las tareas esperan a que vuelva el worker |
| **Separar los ritmos** | Un envío de correo lento ralentiza todo el sitio | Cada tipo de tarea tiene sus propios workers |

El precio a pagar: el resultado ya no es inmediato (hay que avisar al usuario o permitirle consultar un estado), el sistema tiene una pieza más que vigilar, y una tarea puede ejecutarse **más de una vez** (véase [Reintentos](#reintentos-tarea-envenenada-e-idempotencia)).

## Productor, cola y worker

Tres roles se reparten el trabajo:

```text
  PRODUCTOR               COLA DE ESPERA                 WORKER
 (deposita)              (guarda, en orden)             (ejecuta)

 petición web  --+       +---------------------+        +--> worker A
 planificador -+------> | tarea 1             | -----> |
 otro worker  --+       | tarea 2             |        +--> worker B
                        | tarea 3  ...        |
                        +---------------------+
                          el primero en llegar, el primero en salir
```

| Rol | Definición | Ejemplo |
|---|---|---|
| **Productor** | Todo lo que deposita una tarea | El código que trata un formulario; el planificador |
| **Cola de espera** (*queue*) | Una lista ordenada donde se deposita por un lado y se toma por el otro: el primero en llegar es el primero en ser atendido | Una tabla en base, un servicio dedicado |
| **Worker** («obrero») | Un [proceso](/?c=langages&s=c&p=processus) (un programa en ejecución) que gira en bucle: toma una tarea, la trata, y vuelve a empezar | El script `lancer_worker.py` más abajo |
| **Planificador** (*scheduler*) | Un productor que deposita tareas a horas fijas | Véase [el planificador](#el-planificador-de-aplicacion-un-unico-cron-que-decide) |
| **Supervisor** | Un programa que relanza un worker parado | [`systemd`](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html), [`supervisord`](https://supervisord.org/) |

Se dice que el procesamiento es **asíncrono**: quien deposita no se queda esperando el resultado. Una tarea atraviesa cuatro estados:

```text
                  tomar                     confirmar
 en_espera -------------------> en_curso -------------------> terminada
     ^                              |
     |   fallo, o bloqueo rechazado |   demasiados fallos
     +------------------------------+--------------------------> muerta
```

| Estado | Significado |
|---|---|
| `en_espera` | Depositada, nadie la ha tomado todavía (o ha vuelto tras un fallo) |
| `en_curso` | Un worker la ha tomado y la trata |
| `terminada` | El worker ha **confirmado**: confirma que la tarea está hecha (la fila sigue en la base, pero ya nadie la retoma) |
| `muerta` | La tarea ha fallado demasiadas veces: se aparta para que una persona la revise |

## El minisistema de ensayo: la cola

Los archivos del ensayo, todos en Python legible en cualquier editor. Se colocan en **una misma carpeta**; la primera línea de cada bloque de código de abajo (`# archivo: ...`) indica el nombre del archivo que hay que crear:

| Archivo | Función |
|---|---|
| `fileq.py` | El esquema SQL de las tablas, dos relojes, la apertura de la base |
| `file_attente.py` | La cola: depositar, tomar, confirmar, aplazar, abandonar |
| `verrou.py` | El bloqueo con caducidad |
| `worker.py` | El esqueleto de un worker (método plantilla) |
| `recalculateur.py` | Un worker concreto |
| `planificateur.py` | El planificador de aplicación |
| `demo.py` | Seis escenas que ponen en marcha el conjunto |
| `deposer_taches.py` | Crea una base y deposita en ella tres tareas, antes de lanzar el worker real |
| `lancer_worker.py` | El bucle de un worker real, para el supervisor |

En el código, los bloques entre `"""` (comillas triples) colocados al inicio de una función o de una clase son **docstrings**, textos de documentación: `@brief` resume lo que hace el elemento, `@param` describe un argumento, `@returns` el valor devuelto. Las líneas que empiezan por `#` son comentarios, ignorados al ejecutarse.

Primera pieza: el esquema y los relojes. El **reloj simulado** (`Reloj`) es el truco que hace reproducible el ensayo: en lugar de esperar de verdad 30 segundos, se avanza un contador.

```python
# archivo: fileq.py
# sqlite3: módulo de Python que maneja una base SQLite (una base guardada en un archivo)
import sqlite3
# time: módulo de Python que da la hora del sistema
import time

# ESQUEMA: el texto SQL que crea las cuatro tablas (una tabla = una tabla de filas)
ESQUEMA = """
-- (dos guiones: comentario SQL) tareas: la cola; una fila por tarea por hacer
-- CREATE TABLE IF NOT EXISTS: crea la tabla solo si todavía no existe
CREATE TABLE IF NOT EXISTS tareas (
    id INTEGER PRIMARY KEY,                   -- INTEGER: entero; número único
    clave TEXT NOT NULL,                      -- TEXT: texto; NOT NULL: obligatorio
    accion TEXT NOT NULL,                     -- lo que hay que hacer: "recalcular"
    estado TEXT NOT NULL DEFAULT 'en_espera', -- DEFAULT: valor de partida
    intentos INTEGER NOT NULL DEFAULT 0,      -- número de intentos ya empezados
    disponible_en INTEGER NOT NULL DEFAULT 0  -- no antes de este momento (segundos)
);
-- bloqueos: una fila por clave actualmente reservada
CREATE TABLE IF NOT EXISTS bloqueos (
    clave TEXT PRIMARY KEY,                   -- la clave reservada; PRIMARY KEY = única
    propietario TEXT NOT NULL,                -- el nombre del worker que la reservó
    expira_en INTEGER NOT NULL                -- momento en que la reserva se apaga
);
-- planificacion: las tareas recurrentes que el planificador debe depositar
CREATE TABLE IF NOT EXISTS planificacion (
    accion TEXT PRIMARY KEY,                  -- el nombre de la tarea recurrente
    intervalo INTEGER NOT NULL,               -- el intervalo, en segundos
    proxima INTEGER NOT NULL                  -- el próximo vencimiento
);
-- resultados: lo que producen los workers, una fila por tarea procesada
CREATE TABLE IF NOT EXISTS resultados (
    tarea INTEGER PRIMARY KEY,                -- el número de la tarea
    texto TEXT NOT NULL                       -- el resultado
);
"""


class Reloj:
    """
    @brief Reloj simulado: se avanza el tiempo a mano, sin esperar.
    """

    def __init__(self):
        # __init__ es el constructor: prepara el objeto nuevo; t = tiempo actual (s)
        self.t = 0

    def ahora(self):
        # devuelve el tiempo actual
        return self.t

    def avanzar(self, segundos):
        # hace pasar el tiempo sin esperar de verdad
        self.t += segundos


class RelojReal:
    """
    @brief Reloj del sistema, en segundos enteros.
    """

    def ahora(self):
        # time.time() da los segundos transcurridos desde 1970; int() los redondea
        return int(time.time())


def abrir(ruta):
    """
    @brief Abre la base SQLite y crea las tablas si faltan.

    @param ruta: texto, ruta del archivo de la base

    @returns: una conexión con confirmación automática
    """
    # isolation_level=None: cada consulta se confirma sola, enseguida
    # timeout=5: si la base está ocupada por otro, esperamos 5 s antes de fallar
    base = sqlite3.connect(ruta, isolation_level=None, timeout=5)
    # row_factory: permite leer una columna por su nombre (fila["clave"])
    base.row_factory = sqlite3.Row
    # ejecuta el texto SQL de creación de las tablas
    base.executescript(ESQUEMA)
    return base
```

La cola en sí. Una **clase** (`class Cola`) agrupa funciones (llamadas **métodos**) y datos; `self` designa el objeto actual (véase [la programación orientada a objetos en Python](/?c=langages&s=python&p=poo)). Los valores entre paréntesis, como `(clave, accion)`, forman una **tupla**, una lista fija (véase [las listas y las tuplas](/?c=langages&s=python&p=listes-et-tuples)).

```python
# archivo: file_attente.py
class Cola:
    """
    @brief La cola: depositar, tomar, confirmar, aplazar, abandonar.
    """

    # DEMORA_VISIBILIDAD: una tarea tomada reaparece si nadie la confirma en 30 s
    DEMORA_VISIBILIDAD = 30

    def __init__(self, base, reloj):
        # base: la conexión SQLite; reloj: la fuente del tiempo
        self.base = base
        self.reloj = reloj

    def depositar(self, clave, accion):
        # INSERT añade una fila; cada « ? » toma, en orden, un valor de la tupla
        self.base.execute(
            "INSERT INTO tareas (clave, accion) VALUES (?, ?)", (clave, accion)
        )

    def tomar(self):
        """
        @brief Reserva la tarea debida más antigua, en una sola consulta.

        @returns: una fila de la tabla tareas, o None si no hay nada debido
        """
        ahora = self.reloj.ahora()
        cursor = self.base.execute(
            # UPDATE modifica la fila elegida: pasa a en_curso, un intento más,
            # y su fecha de reaparición se aplaza 30 s (* = todas las columnas)
            "UPDATE tareas SET estado = 'en_curso', intentos = intentos + 1,"
            " disponible_en = ? WHERE id = (SELECT id FROM tareas"
            # candidatas: en espera, o en curso pero dejadas sin confirmar
            " WHERE estado IN ('en_espera', 'en_curso') AND disponible_en <= ?"
            # ORDER BY id LIMIT 1: la más antigua; RETURNING devuelve la fila modificada
            " ORDER BY id LIMIT 1) RETURNING *",
            (ahora + self.DEMORA_VISIBILIDAD, ahora),
        )
        # fetchall() lee las filas devueltas (cero o una aquí)
        filas = cursor.fetchall()
        return filas[0] if filas else None

    def confirmar(self, id_tarea):
        # tarea lograda: estado terminada, sin demora, sin intento devuelto
        self._cambiar(id_tarea, "terminada", 0, 0)

    def aplazar(self, id_tarea, demora, devolver_intento):
        # vuelta a la cola, invisible durante « demora » segundos
        self._cambiar(id_tarea, "en_espera", demora, devolver_intento)

    def abandonar(self, id_tarea):
        # tarea envenenada: estado muerta, nunca más retomada
        self._cambiar(id_tarea, "muerta", 0, 0)

    def _cambiar(self, id_tarea, estado, demora, devolver_intento):
        # el « _ » delante del nombre indica un método interno de la clase
        self.base.execute(
            "UPDATE tareas SET estado = ?, disponible_en = ?,"
            " intentos = intentos - ? WHERE id = ?",
            (estado, self.reloj.ahora() + demora, devolver_intento, id_tarea),
        )
```

Todo se juega en `tomar()`. Si el worker A leyera la tarea más antigua (`SELECT`) y luego la marcara «en curso» (`UPDATE`) en dos consultas separadas, el worker B podría leerla entre las dos y tomarla también. Aquí, **una sola consulta** elige y marca: una operación se dice **atómica** cuando se ejecuta de un bloque, sin que ninguna otra pueda intercalarse. SQLite serializa las escrituras, así que dos `tomar()` simultáneos se suceden, no se mezclan.

| Paso de `tomar()` | Qué ocurre | Por qué |
|---|---|---|
| `WHERE estado IN ('en_espera', 'en_curso') AND disponible_en <= ?` | Candidatas: las tareas debidas, más las «en curso» cuya demora ha vencido | Una tarea abandonada por un worker caído **reaparece** |
| `ORDER BY id LIMIT 1` | Se queda con la más antigua | El primero en llegar, el primero en ser atendido |
| `SET estado = 'en_curso', intentos = intentos + 1, disponible_en = ?` | Queda reservada 30 s | Los demás workers ya no la ven durante esta **demora de visibilidad** |
| `confirmar()` | Estado `terminada` | Sin confirmación, la tarea vuelve: nunca una pérdida silenciosa |

El acceso a la base por varios procesos a la vez funciona aquí porque SQLite bloquea el archivo durante una escritura; `timeout=5` dice «espera hasta 5 segundos si el archivo está ocupado». Las palabras `RETURNING` y `ON CONFLICT` requieren una versión reciente de SQLite (`python3 -c "import sqlite3; print(sqlite3.sqlite_version)"` muestra la tuya; véanse [la cláusula RETURNING](https://www.sqlite.org/lang_returning.html) y [el upsert](https://www.sqlite.org/lang_upsert.html), «insertar, o modificar si la fila ya existe»). Para un despliegue real, se suele usar un servicio dedicado o una base de servidor; el principio sigue siendo idéntico.

## El patrón «método plantilla»: un esqueleto fijo, un hueco que rellenar

Un **patrón de diseño** (*design pattern*) es una solución probada a un problema de estructura que aparece a menudo. El **método plantilla** (*template method*) se aplica aquí: todos los workers hacen la **misma secuencia de pasos** (tomar, bloquear, procesar, confirmar o reintentar, liberar), solo cambia el «procesar». En lugar de copiar el bucle en cada worker (y olvidar el bloqueo en uno de ellos), una **clase base** fija el esqueleto, y cada **clase hija** solo proporciona el paso variable (véase [la herencia en Python](/?c=langages&s=python&p=poo#la-herencia)).

```text
Worker.una_vuelta()   <- esqueleto, escrito UNA vez
  1. tomar una tarea
  2. tomar el bloqueo de su clave
  3. self.procesar(tarea)     <- el hueco: definido por la clase hija
  4. confirmar, o reintentar / abandonar
  5. liberar el bloqueo
```

El esqueleto usa el bloque `try` / `except` / `else` / `finally` (véase [el manejo de errores en Python](/?c=langages&s=python&p=gestion-des-erreurs)): `try` intenta el trabajo, `except` se ejecuta si falla, `else` si tiene éxito, `finally` en todos los casos. Usa también `raise`, que provoca un error a mano.

```python
# archivo: worker.py
class Worker:
    """
    @brief Esqueleto de un worker. Las clases hijas proporcionan procesar().
    """

    # MAX_INTENTOS: tras 3 fallos, la tarea se abandona
    MAX_INTENTOS = 3
    # DURACION_BLOQUEO: el bloqueo se apaga solo tras 20 s
    DURACION_BLOQUEO = 20

    def __init__(self, nombre, cola, bloqueo, reloj):
        # nombre: identidad del worker; cola, bloqueo, reloj: sus tres herramientas
        self.nombre = nombre
        self.cola = cola
        self.bloqueo = bloqueo
        self.reloj = reloj

    def procesar(self, tarea):
        # raise provoca un error; NotImplementedError = « todavía no escrito »:
        # la clase base no sabe trabajar, la clase hija debe redefinir procesar()
        raise NotImplementedError("la clase hija debe definir procesar()")

    def decir(self, texto):
        # f"...": las {...} se sustituyen por su valor; :>3 alinea a la derecha en 3
        print(f"[t={self.reloj.ahora():>3}] {self.nombre}: {texto}")

    def una_vuelta(self):
        """
        @brief Una vuelta: tomar, bloquear, procesar, confirmar o reintentar.

        @returns: False si la cola estaba vacía, True si no
        """
        # 1. lectura de la cola
        tarea = self.cola.tomar()
        if tarea is None:
            return False
        id_tarea, clave = tarea["id"], tarea["clave"]
        # 2. bloqueo sobre la clave; rechazado: aplazamos 5 s y devolvemos el intento
        if not self.bloqueo.tomar(clave, self.nombre, self.DURACION_BLOQUEO):
            self.decir(f"tarea {id_tarea}, {clave} está bloqueada, se aplaza")
            self.cola.aplazar(id_tarea, demora=5, devolver_intento=1)
            return True
        try:
            # 3. el trabajo: la única parte que cambia de una clase hija a otra
            self.procesar(tarea)
        except Exception as error:
            # atrapa cualquier error y la nombra « error »
            # 4a. fallo: reintento más tarde, o abandono
            self._fallo(tarea, error)
        else:
            # 4b. éxito: confirmamos, la tarea no volverá
            self.cola.confirmar(id_tarea)
            self.decir(f"tarea {id_tarea} ({tarea['accion']}) terminada")
        finally:
            # 5. en todos los casos, devolvemos el bloqueo
            self.bloqueo.liberar(clave, self.nombre)
        return True

    def _fallo(self, tarea, error):
        # intentos: número de intentos ya hechos, este incluido
        id_tarea, intentos = tarea["id"], tarea["intentos"]
        if intentos >= self.MAX_INTENTOS:
            # demasiados fallos: la tarea pasa al estado «muerta»
            self.cola.abandonar(id_tarea)
            self.decir(f"tarea {id_tarea} abandonada tras {intentos} intentos: {error}")
            return
        # espera doblada en cada fallo (2 ** n = 2 elevado a n): 10 s, 20 s, 40 s...
        # con MAX_INTENTOS = 3, la 3.ª espera (40 s) no existe: el fallo n.º 3 abandona
        espera = 10 * 2 ** (intentos - 1)
        self.cola.aplazar(id_tarea, demora=espera, devolver_intento=0)
        self.decir(f"tarea {id_tarea} falla (intento {intentos}), reintento en {espera} s")
```

La clase hija solo debe escribir el trabajo propio:

```python
# archivo: recalculateur.py
# importa la clase Worker desde el archivo worker.py
from worker import Worker


class Recalculador(Worker):
    """
    @brief Worker concreto: solo escribe procesar().
    """

    def __init__(self, nombre, cola, bloqueo, reloj, durante=None):
        # super() llama al constructor de Worker; durante simula un trabajo largo
        super().__init__(nombre, cola, bloqueo, reloj)
        self.durante = durante

    def procesar(self, tarea):
        # una acción « corrupta » simula un dato que siempre hace fallar
        if tarea["accion"] == "corrupta":
            raise ValueError("datos ilegibles")
        self.decir(f"procesa {tarea['accion']} sobre {tarea['clave']}")
        # momento en que puede pasar otro worker (usado en la demostración)
        if self.durante:
            self.durante()
        # INSERT OR REPLACE: repetir la tarea sobrescribe la misma fila (idempotencia)
        self.cola.base.execute(
            "INSERT OR REPLACE INTO resultados (tarea, texto) VALUES (?, ?)",
            (tarea["id"], f"{tarea['accion']} hecho sobre {tarea['clave']}"),
        )
```

Lo que importa en `una_vuelta()`: el `finally` **libera siempre el bloqueo**, tanto si el procesamiento tiene éxito como si falla.

| Fijado por la clase base | Aportado por la clase hija |
|---|---|
| Lectura de la cola | El trabajo (`procesar`) |
| Toma y liberación del bloqueo | Nada más |
| Confirmación, número de intentos, espera entre intentos, abandono | |
| Diario de eventos | |

El principio tiene un nombre general: la **inversión de control**. Ya no es tu código el que dirige la secuencia de pasos: es el esqueleto el que llama a tu código en el momento adecuado (véase [la inversión de control y los puntos de extensión](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension)). Cuando el framework encuentra por sí mismo las clases hijas disponibles, se obtiene una [arquitectura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins).

## El bloqueo de aplicación sobre una entidad

Una **entidad** es un dato que tiene identidad propia y que se puede designar: aquí una **ficha** (una fila de base de datos con su número). Dos tareas distintas pueden apuntar a la misma ficha («recalcular la ficha 7» y «enviar un correo sobre la ficha 7»); si dos workers las tratan a la vez, uno puede sobrescribir el trabajo del otro. El script siguiente reproduce la escena: dos workers leen un contador de visitas, y cada uno suma 1.

```python
# archivo: compteur.py
# os.path.join une una ruta; sqlite3 maneja SQLite; tempfile crea una carpeta
import os
import sqlite3
import tempfile

# dos conexiones a la misma base: dos workers que trabajan al mismo tiempo
# (isolation_level=None: cada consulta se confirma enseguida)
ruta = os.path.join(tempfile.mkdtemp(), "contador.db")
a = sqlite3.connect(ruta, isolation_level=None)
b = sqlite3.connect(ruta, isolation_level=None)
# una ficha número 7 cuyo contador de visitas vale 0
a.execute("CREATE TABLE ficha (id INTEGER PRIMARY KEY, visitas INTEGER)")
a.execute("INSERT INTO ficha VALUES (7, 0)")

# A lee el contador (0), luego B también lo lee (0) antes de que A haya escrito
# fetchone() lee una fila del resultado; [0] toma la primera columna
leido_por_a = a.execute("SELECT visitas FROM ficha WHERE id = 7").fetchone()[0]
leido_por_b = b.execute("SELECT visitas FROM ficha WHERE id = 7").fetchone()[0]
# cada uno escribe « lo que ha leído + 1 »: B sobrescribe el trabajo de A
a.execute("UPDATE ficha SET visitas = ? WHERE id = 7", (leido_por_a + 1,))
b.execute("UPDATE ficha SET visitas = ? WHERE id = 7", (leido_por_b + 1,))
# se han producido dos sumas, el contador debería valer 2
final = a.execute("SELECT visitas FROM ficha WHERE id = 7").fetchone()[0]
print(f"valor final: {final} (esperado: 2)")

# SELECT ... FOR UPDATE (bloqueo de fila de otras bases) no existe en SQLite
try:
    a.execute("SELECT visitas FROM ficha WHERE id = 7 FOR UPDATE")
except sqlite3.OperationalError as error:
    print(f"SQLite rechaza: {error}")
```

Salida obtenida:

```text
valor final: 1 (esperado: 2)
SQLite rechaza: near "FOR": syntax error
```

Dos sumas, una sola cuenta: es la **actualización perdida** (*lost update*). La segunda línea muestra que el bloqueo de fila `SELECT ... FOR UPDATE`, que ofrecen otras bases, no existe en SQLite. Entonces construimos un **bloqueo de aplicación**: una reserva gestionada por nuestro propio código, aquí en una tabla `bloqueos`.

Un **bloqueo** (o *mutex*, de *mutual exclusion*, «exclusión mutua») garantiza que un solo actor a la vez posee un recurso; la misma palabra existe entre [hilos](/?c=langages&s=c&p=threads) dentro de un programa. Aquí el recurso es una **clave** (`"ficha:7"`) y los actores son workers, es decir, procesos separados. Nuestro bloqueo tiene una **caducidad**: la reserva se apaga sola tras `duracion` segundos.

```python
# archivo: verrou.py
class Bloqueo:
    """
    @brief Bloqueo en base, con una fecha de caducidad.
    """

    def __init__(self, base, reloj):
        # base: la conexión SQLite; reloj: la fuente del tiempo
        self.base = base
        self.reloj = reloj

    def tomar(self, clave, propietario, duracion):
        """
        @brief Pone el bloqueo si la clave está libre o si el bloqueo anterior caducó.

        @param clave: texto, lo que se bloquea ("ficha:7")
        @param propietario: texto, nombre del worker
        @param duracion: entero, segundos antes de la caducidad

        @returns: True si el bloqueo es nuestro, False si lo tiene otro
        """
        ahora = self.reloj.ahora()
        cursor = self.base.execute(
            # intentamos insertar la fila: solo funciona si la clave no existe
            "INSERT INTO bloqueos (clave, propietario, expira_en)"
            # clave ya presente (ON CONFLICT): retomamos la fila (excluded = la
            # fila que intentábamos insertar), pero...
            " VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET"
            " propietario = excluded.propietario,"
            # ... solo si el bloqueo anterior ha caducado; si no, no cambia nada
            " expira_en = excluded.expira_en WHERE bloqueos.expira_en <= ?",
            (clave, propietario, ahora + duracion, ahora),
        )
        # rowcount: número de filas tocadas; 1 = bloqueo obtenido, 0 = rechazado
        return cursor.rowcount == 1

    def liberar(self, clave, propietario):
        # solo borramos SU bloqueo: si otro lo ha retomado, no lo tocamos
        self.base.execute(
            "DELETE FROM bloqueos WHERE clave = ? AND propietario = ?",
            (clave, propietario),
        )
```

| Mecanismo de bloqueo | Alcance | Límite |
|---|---|---|
| `flock` sobre un archivo (véase [cron y `flock`](/?c=langages&s=bash&p=automatisation-cron#evitar-ejecuciones-concurrentes-con-flock)) | Una sola máquina | Inútil en cuanto los workers están en varios servidores |
| Bloqueo de fila de la base (`SELECT ... FOR UPDATE` en las bases que lo ofrecen) | La fila, durante una transacción (un grupo de operaciones confirmado de un bloque) | Ligado a una transacción: poco adecuado para un trabajo largo |
| **Bloqueo de aplicación en tabla, con caducidad** (nuestro caso) | Todas las máquinas que ven la base | Hay que gestionar la caducidad uno mismo |
| Servicio externo de bloqueos | Todas las máquinas | Una pieza más que mantener en marcha |

### El riesgo de un bloqueo que nunca se libera

Si el worker se cae mientras tiene el bloqueo, nadie lo libera. Sin caducidad, la ficha queda bloqueada **para siempre**. Esa es la razón de ser de `expira_en`. Pero la duración se elige con cuidado:

| Duración del bloqueo | Peligro |
|---|---|
| **Demasiado corta** (menos que el trabajo) | El bloqueo caduca mientras el worker todavía trabaja: entra un segundo worker, y los dos modifican la ficha |
| **Demasiado larga** | Tras una caída, la ficha queda intocable mucho tiempo |
| **Justa** (un poco más que el peor caso del trabajo) | El compromiso; se completa con una tarea **idempotente** (véase más abajo) para que incluso un solapamiento excepcional no cause daño |

Para un trabajo cuya duración varía mucho, se puede **renovar** el bloqueo (aplazar `expira_en`) durante el trabajo; también se puede dar a cada toma un número creciente (un **token de control**, *fencing token*) que la base verifica al escribir para rechazar a un worker que se haya vuelto demasiado lento. Nuestro ensayo no hace ni una cosa ni otra.

## El planificador de aplicación: un único cron que decide

[`cron`](/?c=langages&s=bash&p=automatisation-cron) es el programa del sistema que lanza un comando a horas fijas. Escribir una línea en el **crontab** (el archivo donde se listan los comandos de `cron`) por cada tarea recurrente de la aplicación tiene defectos: el sistema ignora los datos de la aplicación, cada nueva tarea exige acceso al servidor, y nada impide que dos lanzamientos se solapen. El **planificador de aplicación** invierte el enfoque: el sistema solo lanza **un** script, cada minuto, y es la aplicación la que decide, según una tabla `planificacion`, qué tareas están **debidas** (llegadas a su vencimiento).

```text
 crontab:  * * * * *  /usr/bin/python3 /srv/app/tick.py      (UNA línea)
                  |
                  v
          tick(): lee la tabla planificacion
                  |   "purga: cada 60 s, próximo vencimiento = t"
                  v
          por cada fila debida: avanzar el vencimiento, depositar una tarea
                  |
                  v
               COLA  ->  workers
```

| Enfoque | Quién conoce el calendario | Añadir una tarea recurrente |
|---|---|---|
| Una línea `crontab` por tarea | El sistema | Modificar el crontab en cada servidor |
| **Planificador de aplicación** | La aplicación (tabla `planificacion`) | Insertar una fila en la base |

En el código siguiente, el bucle `for` (véase [los bucles en Python](/?c=langages&s=python&p=boucles)) repite su bloque una vez por cada elemento de una lista.

```python
# archivo: planificateur.py
class Planificador:
    """
    @brief Lanzado por cron: deposita en la cola las tareas llegadas a su vencimiento.
    """

    def __init__(self, base, cola, reloj):
        # base: la conexión SQLite; cola: dónde depositar; reloj: la fuente del tiempo
        self.base = base
        self.cola = cola
        self.reloj = reloj

    def tick(self):
        """
        @brief Una pasada: detecta las tareas debidas y las pone en cola una vez.
        """
        ahora = self.reloj.ahora()
        # las tareas recurrentes cuyo vencimiento ya ha llegado
        vencidas = self.base.execute(
            "SELECT accion, intervalo FROM planificacion WHERE proxima <= ?",
            (ahora,),
        ).fetchall()
        # for: un giro del bucle por tarea debida, « fila » es la tarea del giro
        for fila in vencidas:
            # avanzamos el vencimiento PRIMERO: si pasan dos planificadores, gana uno solo
            cursor = self.base.execute(
                "UPDATE planificacion SET proxima = ? WHERE accion = ?"
                " AND proxima <= ?",
                (ahora + fila["intervalo"], fila["accion"], ahora),
            )
            # una fila cambiada = avanzamos nosotros el vencimiento: depositamos
            if cursor.rowcount == 1:
                self.cola.depositar(fila["accion"], fila["accion"])
                print(f"[t={ahora:>3}] planificador: deposita {fila['accion']}")
```

Tres detalles importan. Primero, el planificador **solo deposita**; no hace el trabajo, así que termina en un instante y no corre el riesgo de rebasar la pasada siguiente. Después, el vencimiento se avanza **antes** de depositar, con un `UPDATE ... WHERE proxima <= ?` cuyo `rowcount` se verifica: si dos pasadas se solapan, solo una modifica la fila y deposita; la otra ve `0` y no hace nada. Por último, `proxima = ahora + intervalo` significa que, tras una avería de la máquina, la tarea perdida se deposita **una vez**, no diez.

## El ensayo completo, escena por escena

`demo.py` encadena seis escenas, cada una sobre una base nueva. Aquí está el archivo (los `import` se explican en [los módulos de Python](/?c=langages&s=python&p=modules-et-environnements)):

```python
# archivo: demo.py
# os.path.join une una ruta; tempfile crea carpetas temporales
import os
import tempfile

# « from X import Y »: importa Y desde el archivo X.py del ensayo
from file_attente import Cola
from fileq import Reloj, abrir
from planificateur import Planificador
from recalculateur import Recalculador
from verrou import Bloqueo


def mundo():
    """
    @brief Crea una base nueva, un reloj, una cola y un bloqueo.

    @returns: el cuarteto (base, reloj, cola, bloqueo)
    """
    # mkdtemp() crea una carpeta temporal nueva; la base vive en ella durante el ensayo
    base = abrir(os.path.join(tempfile.mkdtemp(), "ensayo.db"))
    reloj = Reloj()
    return base, reloj, Cola(base, reloj), Bloqueo(base, reloj)


def mostrar_tareas(base):
    # una fila por tarea (* = todas las columnas); :<8 alinea a la izquierda en 8
    for t in base.execute("SELECT * FROM tareas ORDER BY id"):
        print(f"  tarea {t['id']} {t['clave']:<8} {t['accion']:<13} {t['estado']:<11}"
              f" intentos={t['intentos']}")


print("--- Escena 1: el planificador ---")
base, reloj, cola, bloqueo = mundo()
# una tarea recurrente: « purga », cada 60 s, debida desde el instante 0
base.execute("INSERT INTO planificacion VALUES ('purga', 60, 0)")
planificador = Planificador(base, cola, reloj)
# tres pasadas de cron, separadas 30 s: en los instantes 0, 30 y 60
# range(3) da 0, 1, 2: tres vueltas; « _ »: el número de la vuelta, que se ignora
for _ in range(3):
    planificador.tick()
    reloj.avanzar(30)

print("--- Escena 2: dos workers, una misma ficha ---")
base, reloj, cola, bloqueo = mundo()
# tres tareas: dos sobre la ficha 7, una sobre la ficha 8
cola.depositar("ficha:7", "recalcular")
cola.depositar("ficha:7", "enviar_correo")
cola.depositar("ficha:8", "recalcular")
b = Recalculador("B", cola, bloqueo, reloj)
# lambda: mini función sin nombre; mientras A « trabaja », B da dos vueltas
a = Recalculador("A", cola, bloqueo, reloj, durante=lambda: (b.una_vuelta(), b.una_vuelta()))
# A toma la tarea 1 (ficha 7); B pasa durante ese tiempo
a.una_vuelta()
# 6 s después, la tarea aplazada por B vuelve a estar disponible
reloj.avanzar(6)
b.una_vuelta()
mostrar_tareas(base)

print("--- Escena 3: un worker se cae sosteniendo el bloqueo ---")
base, reloj, cola, bloqueo = mundo()
cola.depositar("ficha:9", "recalcular")
# el worker C reserva ficha:9 durante 20 s, luego « se cae » sin liberar nada
bloqueo.tomar("ficha:9", "C", 20)
b = Recalculador("B", cola, bloqueo, reloj)
# B choca con el bloqueo de C y aplaza la tarea
b.una_vuelta()
# 21 s después, el bloqueo de C ha caducado: B puede trabajar
reloj.avanzar(21)
b.una_vuelta()

print("--- Escena 4: un worker se cae antes de confirmar ---")
base, reloj, cola, bloqueo = mundo()
cola.depositar("ficha:5", "recalcular")
# C toma la tarea, luego se detiene sin confirmarla ni aplazarla
tarea = cola.tomar()
print(f"[t=  0] C: toma la tarea {tarea['id']} y se detiene en seco")
# pasado el plazo de visibilidad (30 s), la tarea reaparece para B
reloj.avanzar(31)
Recalculador("B", cola, bloqueo, reloj).una_vuelta()
mostrar_tareas(base)

print("--- Escena 5: una tarea envenenada ---")
base, reloj, cola, bloqueo = mundo()
cola.depositar("ficha:3", "corrupta")
b = Recalculador("B", cola, bloqueo, reloj)
# tres vueltas, en los instantes 0, 10 y 30: las esperas de 10 s y 20 s transcurren
# for paso in (0, 10, 20): una vuelta por valor de la tupla; « paso » vale 0, luego 10 y 20
for paso in (0, 10, 20):
    reloj.avanzar(paso)
    b.una_vuelta()
mostrar_tareas(base)

print("--- Escena 6: repetir una tarea ---")
base, reloj, cola, bloqueo = mundo()
cola.depositar("ficha:2", "recalcular")
b = Recalculador("B", cola, bloqueo, reloj)
b.una_vuelta()
# releemos la tarea 1 y la hacemos procesar por segunda vez, a mano
fila = base.execute("SELECT * FROM tareas WHERE id = 1").fetchone()
b.procesar(fila)
# COUNT(*) cuenta las filas de la tabla resultados
n = base.execute("SELECT COUNT(*) FROM resultados").fetchone()[0]
print(f"filas en resultados tras dos procesamientos: {n}")
```

Lanzado con `python3 demo.py`, escribe (salida copiada tal cual):

```text
--- Escena 1: el planificador ---
[t=  0] planificador: deposita purga
[t= 60] planificador: deposita purga
--- Escena 2: dos workers, una misma ficha ---
[t=  0] A: procesa recalcular sobre ficha:7
[t=  0] B: tarea 2, ficha:7 está bloqueada, se aplaza
[t=  0] B: procesa recalcular sobre ficha:8
[t=  0] B: tarea 3 (recalcular) terminada
[t=  0] A: tarea 1 (recalcular) terminada
[t=  6] B: procesa enviar_correo sobre ficha:7
[t=  6] B: tarea 2 (enviar_correo) terminada
  tarea 1 ficha:7  recalcular    terminada   intentos=1
  tarea 2 ficha:7  enviar_correo terminada   intentos=1
  tarea 3 ficha:8  recalcular    terminada   intentos=1
--- Escena 3: un worker se cae sosteniendo el bloqueo ---
[t=  0] B: tarea 1, ficha:9 está bloqueada, se aplaza
[t= 21] B: procesa recalcular sobre ficha:9
[t= 21] B: tarea 1 (recalcular) terminada
--- Escena 4: un worker se cae antes de confirmar ---
[t=  0] C: toma la tarea 1 y se detiene en seco
[t= 31] B: procesa recalcular sobre ficha:5
[t= 31] B: tarea 1 (recalcular) terminada
  tarea 1 ficha:5  recalcular    terminada   intentos=2
--- Escena 5: una tarea envenenada ---
[t=  0] B: tarea 1 falla (intento 1), reintento en 10 s
[t= 10] B: tarea 1 falla (intento 2), reintento en 20 s
[t= 30] B: tarea 1 abandonada tras 3 intentos: datos ilegibles
  tarea 1 ficha:3  corrupta      muerta      intentos=3
--- Escena 6: repetir una tarea ---
[t=  0] B: procesa recalcular sobre ficha:2
[t=  0] B: tarea 1 (recalcular) terminada
[t=  0] B: procesa recalcular sobre ficha:2
filas en resultados tras dos procesamientos: 1
```

| Escena | Qué se observa | Qué muestra |
|---|---|---|
| **1** | La purga se deposita en `t=0` y `t=60`, no en `t=30` | El planificador solo deposita lo que está debido |
| **2** | Mientras A trabaja sobre la ficha 7, B recibe la tarea 2 (misma ficha), choca con el bloqueo y la aplaza; luego B trata la ficha 8, que no está bloqueada; en `t=6`, B termina la tarea 2 | Dos fichas distintas se tratan en paralelo; una misma ficha se trata en sucesión |
| **3** | C muere sosteniendo `ficha:9`; B es rechazado en `t=0`, y consigue en `t=21` | El bloqueo caduca solo |
| **4** | C toma la tarea y desaparece sin confirmar; en `t=31`, B la retoma (`intentos=2`) | El plazo de visibilidad devuelve la tarea a la cola |
| **5** | La tarea `corrupta` falla en `t=0` (espera 10 s), `t=10` (espera 20 s), y se abandona en `t=30`: estado `muerta` | Reintentos espaciados, luego abandono |
| **6** | La tarea procesada dos veces deja una sola fila en `resultados` | La escritura es idempotente |

El escenario de la escena 2 es **simulado**: el parámetro `durante` llama a B en medio del trabajo de A, lo que hace que el orden de las líneas sea idéntico en cada lanzamiento. Con workers **reales** simultáneos, el orden de las líneas variaría de un lanzamiento a otro; la simulación lo fija para que se pueda leer.

## Reintentos, tarea envenenada e idempotencia

Un procesamiento falla por razones pasajeras (red caída, servicio externo ocupado) o duraderas (dato ilegible). La cola debe distinguir ambos casos sin intervención.

| Estrategia de reintento | Principio | Efecto / límite |
|---|---|---|
| Reintentar enseguida | Vuelta inmediata a la cola | Martillea un servicio que ya está en dificultades |
| Demora fija | Siempre la misma espera | Todos los fallos de una avería vuelven al mismo tiempo |
| **Espera exponencial** (*exponential backoff*) | 10 s, 20 s, 40 s...: la espera se duplica en cada fallo (con `MAX_INTENTOS = 3`, nuestro ensayo se detiene antes de los 40 s) | Las tareas duraderamente defectuosas esperan cada vez más (es nuestra elección) |
| Espera exponencial con **variación aleatoria** (*jitter*) | La misma, más una pequeña parte de azar | Evita que tareas fallidas juntas vuelvan juntas |

Una **tarea envenenada** (*poison message*) es una tarea que falla **en cada intento**, pase lo que pase (dato corrupto, error de programación). Sin límite, daría vueltas sin fin y ocuparía un worker indefinidamente. De ahí `MAX_INTENTOS`: tras el último intento, pasa al estado `muerta` (una **cola de mensajes muertos**, *dead-letter queue*, en el vocabulario de las colas), y se conserva la fila para que una persona la lea y decida. Una cola que acumula tareas muertas sin alerta oculta un problema: hay que vigilar su número.

Tercera noción, la más importante. La cola garantiza que una tarea se ejecuta **al menos una vez**: si un worker se cae después de hacer el trabajo pero antes de confirmar (escena 4), la tarea vuelve y el trabajo se rehace. Para que ese segundo paso sea inofensivo, el procesamiento debe ser **idempotente**: rehacerlo da el mismo resultado que hacerlo una vez (véase [la idempotencia en la robustez de un procesamiento por lotes](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots)).

| Operación | ¿Idempotente? | Por qué |
|---|---|---|
| `INSERT OR REPLACE` sobre la clave de la tarea (escena 6) | Sí | La segunda escritura reemplaza a la primera |
| `UPDATE ficha SET estado = 'valida'` | Sí | El resultado es el mismo tras una o dos veces |
| `UPDATE cuenta SET saldo = saldo + 10` | **No** | Cada ejecución suma 10 |
| Enviar un correo | **No** | Imposible «desenviar»; se envía y luego se anota el envío. Una avería entre las dos cosas deja un posible duplicado: para evitarlo, se adjunta un identificador propio de la tarea que el servicio de envío, si lo permite, usa para ignorar una segunda solicitud idéntica |

| Garantía de entrega | Significado | Coste |
|---|---|---|
| **Como máximo una vez** | Una tarea se intenta una sola vez, nunca se repite | Una avería la pierde |
| **Al menos una vez** (nuestro caso) | Se repite mientras no se confirme | Puede ejecutarse dos veces: exige idempotencia |

## Mantener vivo un worker: el supervisor

Un worker es un proceso que puede pararse: error imprevisto, falta de memoria, reinicio de la máquina. Hace falta un **supervisor**, un programa cuyo único oficio es lanzar el worker al arrancar y relanzarlo cuando se para. Este es el bucle de un worker real. Reacciona a las **señales**: mensajes cortos que el sistema envía a un proceso (véase [las señales de Unix](/?c=langages&s=c&p=signaux-unix)).

```python
# archivo: lancer_worker.py
# signal: módulo de Python que permite reaccionar a las señales enviadas por el sistema
import signal
# sys: da acceso a los argumentos de la línea de comandos (sys.argv)
import sys
# time: proporciona sleep(), una pausa
import time

# cada import toma una clase o una función de un archivo del ensayo
# la cola de espera (file_attente.py)
from file_attente import Cola
# el reloj del sistema y la apertura de la base (fileq.py)
from fileq import RelojReal, abrir
# el worker concreto (recalculateur.py)
from recalculateur import Recalculador
# el bloqueo con caducidad (verrou.py)
from verrou import Bloqueo

# interruptor global (variable visible en todo el archivo): pasa a True
# cuando el sistema pide la parada
parada_pedida = False


# función que Python llama al recibir una señal, con dos argumentos
def pedir_parada(numero, marco):
    """
    @brief Anota que se ha recibido SIGTERM o SIGINT: el bucle terminará su vuelta.

    @param numero: entero, número de la señal
    @param marco: objeto, estado de ejecución (no usado)
    """
    # global: modificamos la variable del archivo, no una copia local
    global parada_pedida
    parada_pedida = True


# SIGTERM: « párate » enviado por un supervisor; SIGINT: Ctrl+C del teclado
signal.signal(signal.SIGTERM, pedir_parada)
signal.signal(signal.SIGINT, pedir_parada)

# el worker real: reloj verdadero; sys.argv es la lista de las palabras del comando
# (sys.argv[0]: lancer_worker.py, sys.argv[1]: w.db), de donde sale la ruta de la base
reloj = RelojReal()
base = abrir(sys.argv[1])
worker = Recalculador("W1", Cola(base, reloj), Bloqueo(base, reloj), reloj)
# bucle mientras no se pida ninguna parada; la vuelta en curso siempre llega a su fin
while not parada_pedida:
    # cola vacía: dormimos 1 s en lugar de consultar la base sin parar
    if not worker.una_vuelta():
        time.sleep(1)
print("parada pedida: tarea en curso terminada, salida limpia")
```

`SIGTERM` significa «párate correctamente»: el supervisor lo envía antes de una parada o un reinicio. `SIGINT` es el que envía el teclado al pulsar Ctrl+C. El worker no se interrumpe a mitad de una tarea: anota la petición y sale del bucle **después** de la vuelta en curso.

Para ver trabajar a este worker hace falta una base que contenga tareas. El script `deposer_taches.py` de abajo la crea, deposita en ella tres tareas y luego termina. Se sitúa en la misma carpeta que los demás archivos del ensayo.

```python
# archivo: deposer_taches.py
# importa el reloj del sistema y abrir(), que crea la base, desde fileq.py
from fileq import RelojReal, abrir
# importa la clase Cola (la cola de espera) desde file_attente.py
from file_attente import Cola

# abrir() crea el archivo w.db si no existe, con sus cuatro tablas vacías
base = abrir("w.db")
# la cola leerá la hora en el reloj del sistema, como lo hará el worker real
cola = Cola(base, RelojReal())
# un bucle « for » repite su bloque una vez por valor: aquí, tres fichas
for clave in ("ficha:1", "ficha:2", "ficha:3"):
    # depositar() añade una fila en la tabla tareas, en estado en_espera
    cola.depositar(clave, "recalcular")
# COUNT(*) cuenta las filas de la tabla tareas; [0] toma la primera columna
n = base.execute("SELECT COUNT(*) FROM tareas").fetchone()[0]
# mostramos el total para comprobar que el depósito ha tenido lugar
print(f"{n} tareas depositadas en w.db")
```

Lanzado con `python3 deposer_taches.py`, escribe `3 tareas depositadas en w.db` (relanzado, deposita tres más en la misma base). Después, en la misma carpeta, se arranca el worker en [segundo plano](/?c=langages&s=bash&p=gestion-des-processus), se le deja unos segundos y luego se le envía `SIGTERM`:

```bash
# el « & » final lanza el worker en segundo plano: la terminal sigue disponible
python3 lancer_worker.py w.db &
# sleep 3: pausa de 3 segundos, el tiempo que tarda el worker en tratar las tres tareas
sleep 3
# $! contiene el número (PID, identificador del proceso) del último lanzado en segundo plano
# kill -TERM envía SIGTERM al proceso de ese número (o kill -TERM <PID>, si se conoce el PID)
kill -TERM $!
```

En primer plano (sin el `&`), el worker ocupa la terminal: Ctrl+C lo detiene del mismo modo, mediante `SIGINT`. Salida medida, con la hora sustituida por `...` (son los segundos transcurridos desde 1970; cambia en cada lanzamiento):

```text
[t=...] W1: procesa recalcular sobre ficha:1
[t=...] W1: tarea 1 (recalcular) terminada
[t=...] W1: procesa recalcular sobre ficha:2
[t=...] W1: tarea 2 (recalcular) terminada
[t=...] W1: procesa recalcular sobre ficha:3
[t=...] W1: tarea 3 (recalcular) terminada
parada pedida: tarea en curso terminada, salida limpia
```

Las tres tareas se tratan en el orden de depósito; después, con la cola vacía, el worker duerme en pausas de un segundo hasta la señal. El mensaje final aparece cuando el bucle termina: el programa sale entonces con el código 0, es decir, sin error (véase [los códigos de retorno](/?c=langages&s=c&p=exit-et-codes-de-retour)). El comando `timeout -s TERM 3 python3 lancer_worker.py w.db` da la misma salida: [`timeout`](/?c=langages&s=bash&p=gestion-des-processus#limitar-la-duracion-de-un-comando-timeout-y-ctrl-c) lanza un programa y le envía aquí `SIGTERM` tras 3 segundos. El worker sale bien con 0, pero `timeout` devuelve él mismo 124 para señalar que se alcanzó el plazo.

Dos supervisores habituales. [systemd](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html) es el programa que arranca y vigila todo lo que corre en una máquina Linux moderna (véase también [los límites de recursos con `systemd-run`](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources)). [supervisord](https://supervisord.org/) es un programa independiente, más simple, que solo vigila procesos; su herramienta de línea de comandos, `supervisorctl`, sirve para arrancar, parar y listar los procesos que vigila.

```ini
# worker-cola.service: archivo de unidad systemd (en /etc/systemd/system/)
[Unit]
# texto mostrado en las listas de servicios
Description=Worker de la cola de espera

[Service]
# cuenta del sistema con la que corre el worker (nunca root sin necesidad)
User=app
# carpeta de trabajo del proceso
WorkingDirectory=/srv/app
# el comando a lanzar: rutas absolutas, como para cron
ExecStart=/usr/bin/python3 /srv/app/lancer_worker.py /srv/app/ensayo.db
# relanzar el worker si se para, sea cual sea el motivo
Restart=always
# esperar 5 s antes de relanzar, para no entrar en bucle a toda velocidad ante una avería
RestartSec=5
# dejar 30 s al worker para terminar su tarea tras SIGTERM, luego matarlo
TimeoutStopSec=30

[Install]
# arrancar este servicio al inicio normal de la máquina
WantedBy=multi-user.target
```

```ini
; worker_cola.conf: sección de un archivo de configuración de supervisord (suele
; colocarse en /etc/supervisor/conf.d/; véase la documentación de supervisord)
; un « programa » supervisado; el nombre sirve para los comandos de supervisorctl
[program:worker_cola]
; el comando a lanzar
command=/usr/bin/python3 /srv/app/lancer_worker.py /srv/app/ensayo.db
; carpeta de trabajo y cuenta del sistema
directory=/srv/app
user=app
; arrancar con supervisord y relanzar en caso de parada
autostart=true
autorestart=true
; dos workers en paralelo, llamados worker_cola_00 y worker_cola_01
numprocs=2
process_name=%(program_name)s_%(process_num)02d
; segundos que se dejan tras la señal de parada antes de matar el proceso
stopwaitsecs=30
; los errores van al mismo registro que la salida normal
redirect_stderr=true
stdout_logfile=/var/log/worker_cola.log
```

| Supervisor | Punto fuerte | Punto de atención |
|---|---|---|
| **systemd** | Ya presente en la mayoría de distribuciones Linux; arranque con la máquina, registro integrado | Archivos de unidad que escribir; propio de Linux |
| **supervisord** | Simple; varios procesos idénticos con una línea (`numprocs`); funciona sin systemd | Hay que instalarlo y vigilarlo uno mismo |
| Un `cron` que relanza el worker cada minuto, protegido con `flock` | Ninguna herramienta adicional | Hasta 1 minuto sin worker tras una parada |

Con `numprocs=2`, dos workers leen la misma cola: justamente el caso en que el bloqueo sobre la clave se vuelve indispensable. Un worker que funciona durante días puede crecer en memoria; algunos proyectos hacen que salga voluntariamente tras un número fijo de tareas, y el supervisor lo relanza limpio.

## El mismo esquema en Drupal (ejemplo)

Drupal es un sistema de gestión de contenidos escrito en PHP. Ya ofrece cada pieza de este capítulo, con otros nombres. **Esta sección es un ejemplo.** Los nombres de API de abajo están verificados en el código fuente de Drupal 11.x (el atributo `#[QueueWorker]` existe desde Drupal 10.3); para otra versión, consulta la documentación (véase el grupo [Queue](https://api.drupal.org/api/drupal/core!core.api.php/group/queue/11.x) de la API y la interfaz [LockBackendInterface](https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Lock!LockBackendInterface.php/interface/LockBackendInterface/11.x)).

| Noción del capítulo | Equivalente Drupal |
|---|---|
| Productor + cola | `\Drupal::queue('nombre')->createItem($datos)` deposita; `claimItem()`, `deleteItem()`, `releaseItem()` toman, confirman, devuelven |
| Worker, clase base, hueco que rellenar | Un **plugin** `QueueWorker` que extiende `QueueWorkerBase` y escribe `processItem($data)` |
| Planificador de aplicación | `hook_cron()`, llamado en cada pasada del cron de Drupal (un solo `crontab` lanza ese cron) |
| Bucle del worker | El cron de Drupal vacía las colas cuyo plugin declara una clave `cron` (duración máxima por pasada); o `drush queue:run nombre` ([`drush`](https://www.drush.org/) es la herramienta de línea de comandos de Drupal) lanzado bajo systemd/supervisord |
| Bloqueo de aplicación con caducidad | `\Drupal::lock()`, de tipo `LockBackendInterface`: `acquire($nombre, $espera)` devuelve `true` o `false`, `release($nombre)` libera |
| Reintento | Lanzar `RequeueException` libera el elemento de inmediato: el cron puede retomarlo en el mismo pase (para esperar antes de un nuevo intento, se lanza `DelayedRequeueException`); lanzar `SuspendQueueException` detiene el procesamiento de la cola, pero solo para el pase de cron en curso, y el elemento se libera |

Notación PHP de los dos bloques (véase [la sintaxis](/?c=langages&s=php&p=syntaxe), [la programación orientada a objetos](/?c=langages&s=php&p=poo) y [las excepciones](/?c=langages&s=php&p=exceptions)):

| Notación | Sentido |
|---|---|
| `$nombre` | Una variable: el `$` la marca |
| `A::b()` | Llamada a una función ligada a la clase `A`, sin crear un objeto |
| `$objeto->b()` | Llamada a un método del objeto `$objeto`; `\Drupal::queue('x')->createItem(...)` encadena las dos |
| `['a' => 7]` | Un array donde la clave `'a'` vale 7 |
| `foreach ([...] as $id)` | Una vuelta de bucle por elemento del array |
| `throw new E()` | Dispara el error `E`, como `raise` en Python |
| `!` | Negación: `!$x` significa « no $x » |

El worker (un plugin cuyo identificador se declara mediante un atributo PHP, según el modelo descrito en [la arquitectura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins)):

```php
<?php

// namespace: la « dirección » de la clase, que corresponde a su carpeta en el módulo
namespace Drupal\ejemplo\Plugin\QueueWorker;

// use: anuncia las clases de Drupal que usa este archivo
use Drupal\Core\Queue\Attribute\QueueWorker;
use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\Core\Queue\RequeueException;
use Drupal\Core\StringTranslation\TranslatableMarkup;

// el atributo #[...] etiqueta la clase como worker: identificador, título mostrado,
// y duración máxima (60 s) que el cron puede dedicar a esta cola en cada pasada
#[QueueWorker(
  id: 'ejemplo_recalculo',
  title: new TranslatableMarkup('Recálculo de fichas'),
  cron: ['time' => 60],
)]
// extends: hereda el esqueleto de QueueWorkerBase, la « clase base » del capítulo
class RecalculoFicha extends QueueWorkerBase {

  /**
   * @brief Procesa un elemento de la cola « ejemplo_recalculo ».
   *
   * @param mixed $data: lo que se depositó, aquí ['ficha_id' => 7]
   */
  // public: se puede llamar desde fuera; mixed: el tipo de $data no está restringido
  public function processItem($data) {
    // la clave del bloqueo, construida a partir de la ficha objetivo
    $clave = 'ejemplo_ficha:' . $data['ficha_id'];
    // el servicio de bloqueos de Drupal
    $bloqueo = \Drupal::lock();
    // acquire() devuelve false si la clave está tomada; 30.0: caducidad en segundos
    if (!$bloqueo->acquire($clave, 30.0)) {
      // liberamos el elemento: vuelve a estar disponible de inmediato
      throw new RequeueException();
    }
    try {
      // ... el trabajo real sobre la ficha, a escribir de forma idempotente ...
    }
    finally {
      // pase lo que pase, liberamos el bloqueo
      $bloqueo->release($clave);
    }
  }

}
```

El productor, en forma de `hook_cron`: una función que el cron de Drupal llama por convención de nombre, según el mecanismo de los [hooks](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension):

```php
<?php

/**
 * @brief Llamado en cada pasada del cron de Drupal: deposita los trabajos debidos.
 */
function ejemplo_cron() {
  // \Drupal::queue(...) devuelve el objeto de cola llamado « ejemplo_recalculo »
  $cola = \Drupal::queue('ejemplo_recalculo');
  // tres fichas a recalcular (lista inventada para el ejemplo)
  foreach ([7, 8, 9] as $id) {
    // createItem() deposita los datos; el worker los recibirá en $data
    $cola->createItem(['ficha_id' => $id]);
  }
}
```

Se encuentran las tres ideas del capítulo: un esqueleto proporcionado (`QueueWorkerBase` juega el papel de nuestra clase `Worker`, siendo `processItem` el método que llama el esqueleto), un bloqueo con caducidad (el `30.0` de `acquire` es una duración en segundos) y un reintento mediante excepción. La diferencia está en la infraestructura: Drupal decide, mediante sus plugins y su cron, **quién** llama al worker, mientras que nuestro ensayo lo decidía en `lancer_worker.py`.

## Preguntas frecuentes

| Pregunta | Respuesta |
|---|---|
| ¿Por qué no un simple `cron` que lance el trabajo? | `cron` lanza un programa a horas fijas, pero no retoma un fallo, no reparte un pico entre varios workers y no sabe reaccionar a una petición del visitante |
| ¿Cuándo pasar a un verdadero gestor de colas? | Cuando los workers están en varias máquinas, cuando el caudal supera lo que una base única aguanta en escritura, o cuando hacen falta funciones ya hechas (prioridades, plazos, vigilancia): véase la tabla de herramientas al inicio del capítulo |
| ¿Cómo vigilar la cola? | Contar las tareas `en_espera` y `muerta`, y medir la antigüedad de la tarea en espera más vieja: si crece, los workers están caídos o son demasiado lentos |
| ¿Qué hacer con una tarea muerta? | Leerla, corregir la causa (dato o error), y luego devolverla a la cola: `UPDATE tareas SET estado = 'en_espera', intentos = 0 WHERE id = 1`; o borrarla si ya no tiene interés |

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Leer una tarea y marcarla en dos consultas | Dos workers toman la misma tarea | Una sola consulta atómica que elige y marca |
| Olvidar confirmar | La tarea vuelve y se rehace hasta el infinito | Confirmar tras el éxito, en el esqueleto |
| Confirmar **antes** de procesar | Una avería pierde la tarea | Confirmar tras el trabajo, y hacer el trabajo idempotente |
| Procesamiento no idempotente | Un segundo paso duplica el efecto (dos correos, dos cargos) | Escribir en modo «reemplaza» en lugar de «añade», anotar lo ya hecho |
| Bloqueo sin caducidad | Una avería bloquea la ficha para siempre | `expira_en` en cada bloqueo |
| Caducidad más corta que el trabajo | Dos workers entran juntos | Duración superior al peor caso, o renovación |
| Liberar un bloqueo que ya no se posee | Se borra el bloqueo de otro worker | Borrar solo si `propietario` es uno mismo |
| Bloqueo puesto fuera del esqueleto | Un worker se olvida de ponerlo | Ponerlo en la clase base, con `finally` |
| Reintentar sin límite | Una tarea envenenada da vueltas sin fin | `MAX_INTENTOS` y estado `muerta` |
| Reintentar sin espera | Se martillea el servicio que ya está caído | Espera exponencial, con variación aleatoria |
| Tareas muertas que nadie mira | Un defecto duradero pasa inadvertido | Contarlas, avisar |
| Planificador que hace el trabajo él mismo | Se desborda sobre la pasada siguiente | Solo deposita; avanzar el vencimiento antes de depositar |
| Dos pasadas simultáneas del planificador | Tarea depositada dos veces | `UPDATE` condicional y comprobación de `rowcount` |
| Worker sin gestión de `SIGTERM` | Una parada corta una tarea en plena ejecución | Terminar la vuelta en curso, luego salir |
| Ningún supervisor | Un worker parado, la cola crece en silencio | `systemd` o `supervisord`, más una alerta sobre el tamaño de la cola |
| Poner todo en cola | Complejidad inútil para un trabajo de unos milisegundos | Reservar la cola para trabajos lentos, frágiles o en pico |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Una operación atómica para tomar una tarea | Ningún duplicado entre workers |
| Confirmar solo tras el éxito | Ninguna tarea perdida; la idempotencia absorbe los reenvíos |
| Diseñar cada procesamiento como idempotente | La entrega «al menos una vez» se vuelve inofensiva |
| Esqueleto en una clase base, trabajo en la clase hija | La lógica de cola, de bloqueo y de reintento solo existe en un lugar |
| Bloqueo con caducidad, liberado en un `finally`, sobre la clave más fina posible (la ficha, no toda la tabla) | Ningún bloqueo duradero, un máximo de paralelismo |
| Espera exponencial, número de intentos acotado, cola de muertos vigilada | Las averías pasajeras se resuelven, los defectos duraderos se ven |
| Un único `cron` que lanza el planificador, el calendario en base | Añadir una tarea recurrente no exige acceso al servidor |
| Worker que se para limpiamente con `SIGTERM`, supervisor que lo relanza | Despliegues y reinicios sin tareas cortadas |
| Vigilar la longitud de la cola y la antigüedad de su tarea más vieja | Un worker averiado se ve antes que los usuarios |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Una **cola de espera** separa al que **deposita** una tarea (productor) del que la **ejecuta** (worker): la petición responde rápido, los picos se absorben, un fallo se repite. Tomar una tarea debe ser **atómico** (una consulta que elige y marca), y la **confirmación** solo ocurre tras el éxito: la cola garantiza «al menos una vez», por tanto el procesamiento debe ser **idempotente**. El **planificador de aplicación** es un `cron` único que lee una tabla y deposita las tareas debidas, avanzando antes el vencimiento. El **método plantilla** coloca el bucle (tomar, bloquear, procesar, confirmar o reintentar, liberar) en una clase base; la clase hija solo escribe `procesar`. Un **bloqueo de aplicación** en tabla, sobre una clave como `ficha:7`, impide que dos workers toquen la misma entidad; su **caducidad** evita el bloqueo tras una avería, pero debe superar la duración del trabajo. Una tarea que falla vuelve con una **espera exponencial**; tras `MAX_INTENTOS`, pasa a **muerta**. Un **supervisor** (`systemd`, `supervisord`) relanza los workers, que se paran limpiamente con `SIGTERM`. |
| **Trampas que evitar** | Leer y marcar en dos consultas; olvidar confirmar, o confirmar antes de procesar; procesamiento no idempotente; bloqueo sin caducidad, o más corto que el trabajo; liberar el bloqueo de otro; bloqueo puesto fuera del esqueleto; reintentos sin límite ni espera; tareas muertas ignoradas; planificador que trabaja en lugar de depositar; dos pasadas del planificador sin guarda; worker que ignora `SIGTERM`; ningún supervisor; poner en cola un trabajo trivial. |
| **Buenas prácticas** | Toma atómica; confirmación tras el éxito; idempotencia sistemática; esqueleto en clase base; bloqueo con caducidad liberado en `finally`, sobre la clave más fina; espera exponencial, intentos acotados, muertas vigiladas; un solo `cron` y un calendario en base; parada limpia con `SIGTERM` y supervisor; vigilar el tamaño y la antigüedad de la cola. |
