---
order: 6
---

# Un código, varios sitios: el patrón multisitio

Un **sitio** es aquí lo que un visitante alcanza al escribir una dirección en su navegador: `boutique.example` es un sitio, `blog.example` es otro. Cada sitio tiene su apariencia, sus ajustes, sus datos y su público. Cuando una organización gestiona diez, cuarenta o doscientos (una marca por país, un sitio por cliente, un sitio por evento), se plantea una cuestión de arquitectura: ¿hay que escribir, desplegar y corregir el programa diez, cuarenta o doscientas veces, o hacerlo **una sola vez**, para todos? El **patrón multisitio** (*multisite* en inglés) elige la segunda respuesta: **una única base de código** (el conjunto de archivos del programa) sirve a N sitios, y cada sitio conserva su propia configuración, sus propios archivos y sus propios datos. El conjunto de sitios servidos por el mismo código se llama el **parque**.

Este capítulo es un capítulo de diseño, en la continuidad de [Autoscaling y balanceo de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) (varios **servidores de aplicación**, las máquinas que ejecutan el código, idénticas detrás de un balanceador de carga): allí, N servidores ejecutan el mismo código para **un** sitio; aquí, el mismo código sirve a **N** sitios. Ambos se combinan. Supone que ya se sabe qué es una [base de datos](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) (un software que guarda información en **tablas**, como hojas de cálculo con una fila por elemento y una columna por característica) y el lenguaje [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) que permite consultarla.

| Sección | Pregunta a la que responde |
|---|---|
| [El problema](#el-problema-copiar-el-codigo-para-cada-sitio) | ¿Por qué no copiar simplemente el programa para cada sitio? |
| [El patrón en una imagen](#el-patron-en-una-imagen) | ¿Qué ocurre, paso a paso, cuando llega una petición? |
| [Reconocer el sitio](#reconocer-el-sitio-solicitado) | ¿Cómo sabe el código qué sitio se le pide? |
| [Compartido y aislado](#compartido-y-aislado) | ¿Qué es común a todos los sitios y qué sigue siendo propio de cada uno? |
| [Tres variantes de almacenamiento](#donde-viven-los-datos-tres-variantes) | ¿Una base por sitio, un prefijo de tablas por sitio o un esquema por sitio? |
| [Copia de seguridad de un sitio](#hacer-copia-de-seguridad-y-restaurar-un-solo-sitio) | ¿Cómo extraer un solo sitio de un conjunto? |
| [Actualizar el parque](#actualizar-todo-el-parque) | ¿Cómo aplicar un cambio de estructura a N sitios? |
| [Los riesgos](#los-riesgos-del-patron) | ¿Qué puede salir mal cuando todo está compartido? |
| [Cuándo usarlo](#cuando-elegir-este-patron) | ¿Frente a qué alternativas, y para qué casos? |
| [Un ejemplo de CMS](#un-ejemplo-de-cms-drupal) | ¿Cómo se ve esto en un sistema de gestión de contenidos real? |

## El problema: copiar el código para cada sitio

Cuarenta sitios que comparten la misma lógica (un catálogo, cuentas de usuario, páginas editoriales) se gestionan de dos formas opuestas:

| | Una copia del código por sitio | Un solo código para todos los sitios |
|---|---|---|
| Corrección de un error | Hay que hacerla en 40 copias, arriesgando olvidar una | Una corrección, efectiva en todas partes en el siguiente despliegue (la puesta en servicio de una nueva versión) |
| Nueva funcionalidad | Desarrollada una vez, copiada 40 veces | Desarrollada una vez, disponible en todas partes |
| Divergencia entre sitios | Inevitable: cada copia acaba diferenciándose de las demás | Imposible en cuanto al código (solo existe una vez) |
| Espacio en disco y memoria | 40 juegos de archivos idénticos | Un solo juego de archivos |
| Libertad de un sitio | Total: se puede modificar su copia | Limitada: todo cambio de código afecta a todos |
| Riesgo de un error | Limitado a un sitio | Extendido a todo el parque |

La última fila es el precio del patrón: se gana en esfuerzo y coherencia, se pierde en independencia. Todo el capítulo consiste en conservar la ganancia limitando esa pérdida.

> **Analogía:** un edificio de oficinas. El edificio (el código), el ascensor y la caldera (las actualizaciones, el mantenimiento) son comunes. Cada empresa tiene su puerta, su llave, sus muebles y sus archivadores (la configuración, los archivos, los datos). Una avería del ascensor molesta a todos; un incendio en una oficina mal compartimentada puede extenderse a las demás.

## El patrón en una imagen

Una **petición** es el mensaje que envía el navegador de un visitante a un servidor; contiene el **nombre de host** del sitio al que apunta (por ejemplo `blog.example`, detallado en la sección siguiente). El **prefijo** de un sitio es un trozo de texto colocado delante del nombre de sus tablas (`blog_articulos` en lugar de `articulos`), explicado más abajo.

```text
  boutique.example      blog.example      club.example      <- tres nombres de host
        |                    |                  |
        +--------------------+------------------+
                             |
                             v
                  Balanceador de carga            <- el mismo para todos
                             |
                +------------+------------+
                v                         v
          Servidor de aplicación 1     Servidor de aplicación 2   <- UN ÚNICO código
                |                         |
                +------------+------------+
                             |
        1. leer el nombre de host de la petición
        2. elegir la configuración de este sitio  (título, idioma, prefijo, base...)
        3. abrir SU base o SUS tablas
        4. responder con SUS archivos
                             |
          +------------------+-------------------+
          v                  v                   v
     datos de            datos del          datos del
     tienda              blog               club          <- aislados por sitio
```

| Paso | Lo que ocurre | Lo que debe seguir siendo verdad |
|---|---|---|
| 1. Leer el nombre de host | El código extrae de la petición el nombre del sitio solicitado | El nombre viene de la petición, es decir, de un tercero: hay que verificarlo |
| 2. Elegir la configuración | Una tabla de correspondencia «nombre de host hacia ajustes» da el título, el idioma y los accesos a la base | Un nombre desconocido se rechaza, nunca se redirige a un sitio cualquiera |
| 3. Abrir los datos | Una conexión hacia la base del sitio, o hacia sus tablas con prefijo | Ninguna consulta debe poder tocar los datos de otro sitio |
| 4. Responder | La página se construye con los archivos, la caché y la sesión de este sitio | Nada de lo que produce un sitio debe aparecer en otro |

## Reconocer el sitio solicitado

El **nombre de host** es el nombre de la máquina o del sitio al que apunta la petición: `blog.example` en la dirección `https://blog.example/articulos` (`https` designa HTTP cifrado). El **DNS** (véase la [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034)) es el directorio de Internet que traduce ese nombre en una dirección numérica de máquina; varios nombres pueden apuntar a la misma máquina, y eso es lo que hace posible el patrón: los tres sitios de la imagen anterior llegan todos al mismo balanceador. Una petición [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (el mensaje que un navegador envía a un servidor) transporta el nombre al que apunta en una **cabecera** (una línea de información añadida a la petición) llamada `Host` (véase [la especificación HTTP](https://www.rfc-editor.org/rfc/rfc9110#name-host-and-authority)). El código lee esa cabecera y deduce de ella el sitio.

| Criterio de elección | Ejemplo | Ventaja | Límite |
|---|---|---|---|
| Nombre de host completo | `blog.example` y `boutique.example` | Natural, un nombre por sitio, un certificado por nombre (el documento digital que prueba la identidad de un sitio en HTTPS) | Un nombre (y un registro DNS) que crear para cada sitio |
| Subdominio (un nombre añadido delante de un dominio existente) | `blog.groupe.example` | Un solo dominio que gestionar, un certificado «comodín» (`*.groupe.example`) posible | Los sitios comparten el dominio padre: cuidado con las **cookies**, esos pequeños archivos que el navegador guarda y devuelve en cada petición (véase más abajo) |
| Inicio de la ruta | `groupe.example/blog/` | Ningún nombre adicional que comprar | El código debe quitar el prefijo de cada dirección; los enlaces relativos se rompen fácilmente |
| Puerto (el número de la «puerta» de una máquina, 443 para HTTPS) | `groupe.example:8081` | Práctico en desarrollo | Raro en producción (el sitio realmente abierto a los visitantes): los visitantes no escriben un puerto |

La elección más habitual es el nombre de host. Los ejemplos de este capítulo usan el sufijo `.example`, **reservado** para la documentación por la [RFC 2606](https://www.rfc-editor.org/rfc/rfc2606) (un **RFC** es un documento de referencia de los estándares de Internet): esos nombres nunca designarán un sitio real.

### Un ejemplo ejecutable en Python

El programa siguiente simula el núcleo del patrón: una petición llega con un nombre de host, el código elige la configuración del sitio y luego lee las tablas **de ese sitio** en una base compartida donde cada tabla lleva el **prefijo** del sitio (un trozo de texto colocado delante del nombre de la tabla: `blog_articulos` en lugar de `articulos`). Usa [Python](/?c=langages&s=python&p=python) y [SQLite](https://www.sqlite.org/docs.html), una base de datos contenida en un solo archivo (o en memoria), sin servidor que instalar, manejada aquí por el módulo `sqlite3` que viene con Python. Está escrito en un solo archivo `multisite.py`, presentado en tres trozos seguidos. Usa nociones básicas de Python: un [diccionario](/?c=langages&s=python&p=dictionnaires-et-ensembles) (una tabla «clave hacia valor»), una [tupla](/?c=langages&s=python&p=listes-et-tuples) (una secuencia de valores fija), una [función](/?c=langages&s=python&p=fonctions) (un bloque de código con nombre, cuyo texto entre triples comillas colocado bajo su nombre, la *docstring*, es la descripción) y un [módulo](/?c=langages&s=python&p=modules-et-environnements) (un archivo de código que se importa). En las docstrings de este capítulo, `@brief` resume la función, `@param` describe un argumento y `@returns` el valor devuelto. Para probarlo, se pegan los tres trozos, en orden, en un archivo `multisite.py` creado con un editor de texto, y se ejecuta desde una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Cada otro programa del capítulo se pega de la misma manera en un archivo `.py` aparte.

Primer trozo: la configuración y la verificación de los prefijos. Una **expresión regular** (véase [las regex en Python](/?c=langages&s=python&p=regex-en-python)) es un patrón de texto que describe las cadenas aceptadas; aquí solo acepta una letra minúscula, luego letras minúsculas o cifras (de 0 a 15 veces, anotado `{0,15}`), y después un guion bajo final. Algunas notaciones de Python sirven desde este primer trozo. Una [*f-string*](/?c=langages&s=python&p=variables#las-f-strings-insertar-variables-en-texto) es un texto precedido de `f` donde `{expresión}` se sustituye por su valor; `{valor!r}` muestra el valor con sus comillas. Una **excepción** (véase [el manejo de errores](/?c=langages&s=python&p=gestion-des-erreurs)) es la señal que emite un programa cuando no puede continuar con normalidad: `raise` emite una ([lanzar tus propias excepciones](/?c=langages&s=python&p=gestion-des-erreurs#lanzar-tus-propias-excepciones)), y `ValueError` señala un valor inaceptable. Una [comprensión de lista](/?c=langages&s=python&p=listes-et-tuples#las-comprensiones-de-lista), `[x for x in secuencia]`, construye una lista en una sola línea. La `r` de `r"..."` indica una cadena en bruto, donde la barra invertida no tiene ningún sentido especial.

```python
# re : módulo de Python de expresiones regulares (patrones de texto)
import re
# sqlite3 : módulo incluido en Python para hablar con una base SQLite
import sqlite3

# Un diccionario: a cada nombre de host, los ajustes de su sitio
SITIOS = {
    # Un título visible y el prefijo de las tablas de cada sitio
    "boutique.example": {"titulo": "La Tienda", "prefijo": "tienda_"},
    "blog.example": {"titulo": "El Blog", "prefijo": "blog_"},
    "club.example": {"titulo": "El Club", "prefijo": "club_"},
}

# Un prefijo seguro: una minúscula, de 0 a 15 minúsculas o cifras, y luego un « _ » final
PREFIJO_SEGURO = re.compile(r"[a-z][a-z0-9]{0,15}_")


def verificar_los_prefijos():
    """
    @brief Rechaza un prefijo peligroso o que cubre a otro.
    """
    # Lista de los prefijos de todos los sitios, construida en una línea; values() da
    # los ajustes de cada sitio
    prefijos = [sitio["prefijo"] for sitio in SITIOS.values()]
    # enumerate da cada prefijo junto con su posición i en la lista
    for i, prefijo in enumerate(prefijos):
        # fullmatch exige que TODO el texto corresponda al patrón
        if not PREFIJO_SEGURO.fullmatch(prefijo):
            # raise detiene el programa con un mensaje; !r pone el prefijo entre comillas
            raise ValueError(f"prefijo rechazado: {prefijo!r}")
        # Se compara con todos los demás prefijos
        for j, otro in enumerate(prefijos):
            # startswith comprueba si « otro » empieza por « prefijo »: riesgo de mezcla
            if i != j and otro.startswith(prefijo):
                raise ValueError(f"prefijo solapado: {prefijo!r}")
```

Segundo trozo: la elección del sitio según el nombre de host, y el cálculo del nombre real de una tabla. Este trozo también lanza excepciones (definidas más arriba); `LookupError` señala «no encuentro lo que se pide».

```python
def elegir_sitio(anfitrion):
    """
    @brief Encuentra la configuración del sitio que pide la petición.

    @param anfitrion Texto «nombre» o «nombre:puerto», en mayúsculas o minúsculas.

    @returns El diccionario de configuración del sitio.
    """
    # split(":") corta en el « : », [0] conserva la parte anterior (el puerto se quita) ;
    # lower() pasa a minúsculas
    nombre = anfitrion.split(":")[0].lower()
    # Un nombre ausente de la tabla de correspondencia NO es un sitio de este parque
    if nombre not in SITIOS:
        # Se rechaza en lugar de recurrir a un sitio por defecto
        raise LookupError(f"sitio ajeno: {nombre}")
    # Si no, se devuelven los ajustes de ese sitio
    return SITIOS[nombre]


def tabla(sitio, nombre):
    """
    @brief Da el nombre real de una tabla: el prefijo del sitio, seguido del nombre común.

    @param sitio Diccionario de configuración de un sitio.
    @param nombre Nombre de tabla escrito en el código, nunca introducido por un visitante.

    @returns El nombre completo, seguro para insertar en una consulta SQL.
    """
    # El prefijo se validó al arrancar: solo contiene caracteres seguros
    return sitio["prefijo"] + nombre
```

Tercer trozo: la creación de las tablas de cada sitio, la respuesta a una petición y la ejecución. El signo de interrogación `?` en una consulta SQL es un **parámetro ligado**: el valor se transmite aparte, nunca pegado al texto de la consulta, lo que impide la [inyección SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql#inyeccion-sql-por-que-nunca-concatenar-un-valor-externo). Solo sirve para **valores**. Un nombre de tabla no puede ser un parámetro: por eso se compone en el texto de la consulta (con una *f-string*, vista más arriba), lo cual solo es seguro porque el prefijo viene de la configuración y se ha validado.

```python
def instalar(conexion, sitio):
    """
    @brief Crea las tablas de un sitio y le pone un primer artículo.

    @param conexion Conexión SQLite abierta.
    @param sitio Diccionario de configuración de un sitio.
    """
    # Nombre real de la tabla de artículos de este sitio, por ejemplo « blog_articulos »
    articulos = tabla(sitio, "articulos")
    # CREATE TABLE IF NOT EXISTS crea la tabla solo si todavía no existe
    conexion.execute(
        f"CREATE TABLE IF NOT EXISTS {articulos} "
        "(id INTEGER PRIMARY KEY, titulo TEXT NOT NULL)"
    )
    # INSERT añade una fila; el valor pasa por el parámetro « ? »
    # (la coma final convierte el valor en una tupla de un solo elemento, exigida por execute)
    conexion.execute(
        f"INSERT INTO {articulos} (titulo) VALUES (?)",
        (f"Bienvenido a {sitio['titulo']}",),
    )


def servir(conexion, anfitrion):
    """
    @brief Responde a una petición: elige el sitio y luego lee sus artículos.

    @param conexion Conexión SQLite abierta.
    @param anfitrion Nombre de host de la petición.

    @returns El título del sitio y la lista de títulos de artículos.
    """
    # Pasos 1 y 2 de la imagen: leer el nombre de host, elegir la configuración
    sitio = elegir_sitio(anfitrion)
    # Paso 3: SELECT lee las filas, solo en las tablas de ESTE sitio
    filas = conexion.execute(f"SELECT titulo FROM {tabla(sitio, 'articulos')}")
    # Cada fila es una tupla; lista construida en una línea con su primer elemento
    return sitio["titulo"], [fila[0] for fila in filas]


# Arranque: se rechaza seguir si un prefijo es dudoso
verificar_los_prefijos()
# Una base SQLite en memoria: desaparece al terminar el programa
conexion = sqlite3.connect(":memory:")
# Se crean las tablas de cada uno de los tres sitios en la MISMA base
for sitio in SITIOS.values():
    instalar(conexion, sitio)

# Cinco peticiones simuladas: tres sitios conocidos (uno con puerto y mayúsculas), dos falsos
ANFITRIONES = [
    "boutique.example",
    "BLOG.example:8080",
    "club.example",
    "pirate.example",
    "boutique.example.pirate.example",
]
# Por cada nombre de host recibido
for anfitrion in ANFITRIONES:
    # try / except: se intenta responder; si el sitio es desconocido, se captura la excepción
    try:
        # :33 reserva 33 caracteres para el nombre de host, y alinea las columnas
        print(f"{anfitrion:33} -> {servir(conexion, anfitrion)}")
    except LookupError as error:
        print(f"{anfitrion:33} -> rechazado ({error})")

# sqlite_master es la tabla interna que lista todo lo que contiene la base
nombres = conexion.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
# Se muestran los nombres de las tablas: tres sitios, tres juegos de tablas en una base
print("tablas de la base :", [nombre[0] for nombre in nombres])
```

Ejecutado con `python3 -I multisite.py` (la opción `-I` inicia Python en modo aislado, que ignora el entorno del usuario), el programa muestra:

```text
boutique.example                  -> ('La Tienda', ['Bienvenido a La Tienda'])
BLOG.example:8080                 -> ('El Blog', ['Bienvenido a El Blog'])
club.example                      -> ('El Club', ['Bienvenido a El Club'])
pirate.example                    -> rechazado (sitio ajeno: pirate.example)
boutique.example.pirate.example   -> rechazado (sitio ajeno: boutique.example.pirate.example)
tablas de la base : ['tienda_articulos', 'blog_articulos', 'club_articulos']
```

Las tres primeras líneas muestran el patrón funcionando: la misma función `servir` responde de forma distinta según el nombre de host, y `BLOG.example:8080` se reconoce a pesar de las mayúsculas y el puerto. Las dos últimas peticiones se rechazan: **un nombre desconocido no se redirige a un sitio por defecto**, y un nombre que *empieza* como uno real (`boutique.example.pirate.example`) no se toma por él, porque la comparación se hace sobre el nombre completo. La última línea muestra el almacenamiento: una sola base, tres juegos de tablas.

> **Trampa:** volver a «el primer sitio» o a un «sitio por defecto» cuando el nombre de host es desconocido. Un visitante (o un robot) que envía una cabecera `Host` falsa recibe entonces las páginas, a veces los datos, de un sitio que no era el solicitado, y una caché intermedia puede memorizar esa mezcla para otros visitantes. **Buena práctica:** una lista cerrada de nombres autorizados, como `SITIOS` arriba, y un error claro para todo lo demás (404, el código «página no encontrada», o 421 *Misdirected Request* «petición mal dirigida», descrito en la misma [especificación HTTP](https://www.rfc-editor.org/rfc/rfc9110#name-421-misdirected-request)).

La cabecera `Host` la proporciona el visitante: **nunca** debe usarse tal cual para fabricar una dirección absoluta (por ejemplo, el enlace de un correo de restablecimiento de contraseña), o un atacante haría enviar a su víctima un enlace hacia un dominio que él controla. La dirección «oficial» de cada sitio se lee en la configuración, no en la petición. Detrás de un balanceador o de un servidor intermedio, el nombre de origen también puede viajar en una cabecera de reenvío (a menudo llamada [`X-Forwarded-Host`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host)): solo hay que tenerla en cuenta si el intermediario es de confianza y sobrescribe él mismo esa cabecera.

## Compartido y aislado

| Elemento | Compartido entre los sitios | Propio de cada sitio |
|---|---|---|
| Código de la aplicación (archivos) | Sí, un único ejemplar | No |
| Bibliotecas (código reutilizable escrito por otros) y extensiones (módulos que añaden funciones) instaladas | Sí, mismas versiones para todos | Activadas o no según el sitio |
| Actualizaciones del código | Sí: un despliegue afecta a todos los sitios | No |
| Servidores, memoria, procesador | Sí, salvo que se establezcan cuotas | No por defecto |
| Configuración (título, idioma, acceso a la base, [claves de API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) | No | Sí, un juego de ajustes por sitio |
| Datos (artículos, cuentas, pedidos) | No | Sí |
| Archivos subidos (imágenes, documentos) | No | Sí, una carpeta por sitio |
| **Caché** (memoria donde se guarda un resultado para no recalcularlo) y **sesiones** (el recuerdo de quién ha iniciado sesión) | El motor puede serlo (un mismo servidor de caché), nunca las claves | Sí: las claves llevan el identificador del sitio |
| Secretos (contraseñas de base, claves) | No | Sí, un juego por sitio (véase [Gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |
| Tareas programadas (programas que se lanzan a hora fija) | El disparador puede serlo | El trabajo se ejecuta para cada sitio |
| Registros (*logs*, los archivos donde el programa anota lo que hace) | A menudo un mismo flujo | Cada línea indica el sitio afectado |

La regla que se deduce de la tabla: **todo lo compartido es una superficie de contagio** (un fallo o una vulnerabilidad se propaga a todos), y **todo lo aislado debe estarlo de verdad**, es decir, sin que un olvido en una consulta o una clave de caché deje pasar los datos de un sitio a otro. Esta lógica es la del *radio de impacto* descrito en [Principios de desarrollo seguro](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise): se trata de reducir lo que un error o un compromiso puede alcanzar.

## Dónde viven los datos: tres variantes

La elección más estructurante del patrón es el lugar donde se encuentran los datos de cada sitio. Existen tres organizaciones:

```text
 A. Una base por sitio        B. Prefijo de tablas        C. Esquema por sitio
                                 (base compartida)          (base compartida)

 +-----------+ +-----------+   +-----------------------+    +-----------------------+
 | base      | | base      |   | base única            |    | base única            |
 | tienda    | | blog      |   |  tienda_articulos     |    |  esquema tienda       |
 |  articulos| |  articulos|   |  tienda_clientes      |    |   articulos, clientes |
 |  clientes | |  clientes |   |  blog_articulos       |    |  esquema blog         |
 +-----------+ +-----------+   |  blog_clientes        |    |   articulos, clientes |
  (una base más                +-----------------------+    +-----------------------+
   por cada sitio)
```

Un **esquema** es un espacio de nombres (un agrupamiento que evita los conflictos de nombres) dentro de una base: dos tablas con el mismo nombre pueden coexistir si pertenecen a esquemas distintos (véase [Esquemas y tablas técnicas](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques)). Una **conexión** es un enlace abierto entre la aplicación y la base, con sus propias credenciales.

| | A. Una base por sitio | B. Prefijo de tablas por sitio | C. Esquema por sitio |
|---|---|---|---|
| Principio | Cada sitio tiene su base, con sus credenciales | Una base común; el nombre de cada tabla empieza por el prefijo del sitio | Una base común; cada sitio tiene su espacio de nombres |
| Ventajas | La separación más nítida; copia de seguridad, restauración y supresión de un sitio muy sencillas | Una sola base que alojar y vigilar; funciona en todas partes, incluso con un motor de base de datos sin esquemas (SQLite, por ejemplo) | Separación clara sin multiplicar las bases; mismos nombres de tablas para todos los sitios |
| Límites | N bases que crear, alojar, vigilar y actualizar; N juegos de conexiones | Ninguna barrera real entre sitios; los nombres de tabla se alargan; el catálogo de la base (la lista interna de sus tablas) crece: N veces el número de tablas | Depende del motor: no todos ofrecen esquemas reales; la actualización sigue haciéndose N veces |
| Escribir código | Una conexión distinta por sitio | Pensar en el prefijo en cada consulta | Elegir el esquema de la conexión, o nombrar `esquema.tabla` |

| | A. Una base por sitio | B. Prefijo de tablas por sitio | C. Esquema por sitio |
|---|---|---|---|
| Aislamiento de los datos | Fuerte: una consulta solo alcanza la base abierta | Débil: todas las tablas son visibles desde la misma conexión | Media a fuerte, según los permisos dados en cada esquema |
| Permisos SQL (véase el [mínimo privilegio](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)) | Una cuenta por base, sencillo | Una cuenta lo ve todo, salvo permisos dados tabla por tabla (tedioso) | Posible una cuenta por esquema |
| Copia de seguridad de un solo sitio | Copiar o exportar una base | Exportar solo las tablas del prefijo (véase más abajo) | Exportar un esquema |
| Restauración de un solo sitio | Reemplazar una base | Reemplazar un juego de tablas, sin tocar los demás | Reemplazar un esquema |
| Conexiones a la base | Una por sitio usado y por proceso (un programa en ejecución; véase [los riesgos](#los-riesgos-del-patron)) | Una por proceso, sea cual sea el sitio | Una por proceso, con el esquema elegido al vuelo |
| Coste de alojamiento | Más alto: memoria y archivos por base | El más bajo | Bajo |
| Paso a otro servidor para un sitio que se ha vuelto enorme | Fácil: se mueve la base | Penoso: hay que extraer las tablas del prefijo | Medio: se mueve el esquema |

Ninguna variante es la mejor en sí misma. En la práctica: **A** cuando el aislamiento y la autonomía pesan más que el coste (clientes que exigen la separación de sus datos, sitios muy desiguales); **B** cuando hay muchos sitios pequeños parecidos y un motor de base sencillo; **C** cuando el motor ofrece esquemas reales y se busca un compromiso. La [escalabilidad de la base](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) (caché, réplicas, particionado) se plantea después, sitio por sitio o para el conjunto.

### Variante A en código: un archivo por sitio

Con SQLite, una «base por sitio» es un archivo por sitio. Este programa crea dos archivos, muestra que la conexión de un sitio no ve las tablas de otro, y luego hace copia de seguridad de un solo sitio. El módulo `tempfile` crea una carpeta temporal, `pathlib.Path` manipula rutas de archivos (véase [manejar archivos y carpetas](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)).

```python
# sqlite3 : acceso a SQLite ; tempfile : carpeta temporal ; Path : rutas de archivos
import sqlite3
import tempfile
from pathlib import Path

# Los nombres de sitio los elige el código, nunca un visitante
SITIOS = ["tienda", "blog"]
# Una carpeta temporal creada para la prueba (mkdtemp no la borra al final)
carpeta = Path(tempfile.mkdtemp())


def abrir(sitio):
    """
    @brief Abre la base propia de un sitio: un archivo por sitio.

    @param sitio Nombre del sitio, elegido por el código (nunca por un visitante).

    @returns Una conexión SQLite sobre el archivo de este sitio.
    """
    # El archivo se crea en la primera apertura; el operador / une las rutas
    return sqlite3.connect(carpeta / f"{sitio}.sqlite")


# Se prepara un archivo por sitio
for sitio in SITIOS:
    # Conexión al archivo de este sitio
    base = abrir(sitio)
    # Mismo nombre « articulos » para todos: ya no hay prefijo, la separación es el archivo
    base.execute("CREATE TABLE articulos (id INTEGER PRIMARY KEY, titulo TEXT)")
    # Una fila de ejemplo
    base.execute("INSERT INTO articulos (titulo) VALUES (?)", (f"Artículo de {sitio}",))
    # commit hace definitivos los cambios en el archivo
    base.commit()
    # Se cierra la conexión
    base.close()

# Una tabla « ventas » creada solo en la base de la tienda
tienda = abrir("tienda")
tienda.execute("CREATE TABLE ventas (id INTEGER PRIMARY KEY, monto REAL)")
tienda.commit()
tienda.close()

# Aislamiento: la conexión del blog solo ve el archivo del blog
blog = abrir("blog")
# Lectura de sus propios artículos; fetchall devuelve todas las filas en forma de lista
print("blog :", blog.execute("SELECT titulo FROM articulos").fetchall())
# Intento de leer una tabla que solo existe en el archivo de la tienda
try:
    blog.execute("SELECT monto FROM ventas")
except sqlite3.OperationalError as error:
    print("tabla de otro sitio ->", error)

# Copia de seguridad de un solo sitio: copiar su base en un archivo nuevo
copia = sqlite3.connect(carpeta / "blog-copia.sqlite")
# backup copia toda la base del blog, aunque lleguen escrituras durante la copia
blog.backup(copia)
# iterdir() lista el contenido de la carpeta; la lista ordenada de nombres se construye en
# una línea (expresión generadora: una comprensión sin corchetes)
print("archivos :", sorted(ruta.name for ruta in carpeta.iterdir()))
# Se cierran las dos conexiones que quedan
blog.close()
copia.close()
```

Salida obtenida:

```text
blog : [('Artículo de blog',)]
tabla de otro sitio -> no such table: ventas
archivos : ['blog-copia.sqlite', 'blog.sqlite', 'tienda.sqlite']
```

La consulta que apunta a la tabla `ventas`, presente solo en el archivo de la tienda, falla desde la conexión del blog: es el aislamiento de la variante A. La copia de seguridad de un solo sitio no necesita ningún filtrado, ya que todo el contenido del archivo le pertenece.

### Variante C en código: un esquema por sitio

SQLite no tiene esquemas en el sentido de otros motores, pero su instrucción `ATTACH DATABASE` («adjuntar una base») adjunta a una conexión varias bases con nombre, a las que se consulta con la misma escritura `nombre.tabla` que un esquema. Es una buena simulación del comportamiento, sin pretender reproducir los permisos de un motor más completo.

```python
# sqlite3 : módulo de Python para hablar con una base SQLite
import sqlite3

# Una conexión principal, en memoria
conexion = sqlite3.connect(":memory:")

# ATTACH adjunta una base adicional con un nombre: aquí, una por sitio
conexion.execute("ATTACH DATABASE ':memory:' AS tienda")
conexion.execute("ATTACH DATABASE ':memory:' AS blog")
# Las dos tablas tienen el mismo nombre; el nombre delante del punto las distingue
conexion.execute("CREATE TABLE tienda.articulos (id INTEGER PRIMARY KEY, titulo TEXT)")
conexion.execute("CREATE TABLE blog.articulos (id INTEGER PRIMARY KEY, titulo TEXT)")
# Una sola fila, añadida en la tabla del blog
conexion.execute("INSERT INTO blog.articulos (titulo) VALUES ('Artículo del blog')")
# Lectura en el espacio « blog »
filas_blog = conexion.execute("SELECT titulo FROM blog.articulos").fetchall()
print("blog.articulos    :", filas_blog)
# Lectura en el espacio « tienda »: mismo nombre de tabla, contenido separado
filas_tienda = conexion.execute("SELECT titulo FROM tienda.articulos").fetchall()
print("tienda.articulos  :", filas_tienda)
```

Salida obtenida:

```text
blog.articulos    : [('Artículo del blog',)]
tienda.articulos  : []
```

Las dos tablas `articulos` coexisten sin conflicto. En un motor que conoce los esquemas (PostgreSQL, por ejemplo, cuya [documentación de los esquemas](https://www.postgresql.org/docs/current/ddl-schemas.html) describe también la ruta de búsqueda que evita escribir el nombre del esquema delante de cada tabla), se elige el esquema una sola vez al abrir la conexión.

## Hacer copia de seguridad y restaurar un solo sitio

En la variante A, hacer copia de seguridad de un sitio es evidente: se copia su base. En la variante B hay que encontrar **las tablas de ese sitio** entre todas las de la base. La idea natural es buscar los nombres que empiezan por el prefijo, con el operador SQL `LIKE`, que compara un texto con un patrón. Tiene una trampa clásica: en un patrón `LIKE`, el guion bajo `_` no significa «un guion bajo» sino «**cualquier carácter único**» (y `%` significa «cualquier secuencia de caracteres»).

```python
# sqlite3 : módulo de Python para hablar con una base SQLite
import sqlite3

# Una base en memoria que contiene las tablas de dos sitios con nombres parecidos
conexion = sqlite3.connect(":memory:")
# « blog_ » y « blogger_ » son dos prefijos distintos; ninguno empieza por el otro
for nombre in ["blog_articulos", "blog_notas", "blogger_articulos"]:
    # Se crea una tabla mínima para cada nombre
    conexion.execute(f"CREATE TABLE {nombre} (id INTEGER)")

# sqlite_master lista las tablas; LIKE ? compara el nombre con el patrón recibido
consulta = "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE ?"
# « _ » vale « cualquier carácter »: « blog_% » también atrapa blogger_articulos
ingenuo = conexion.execute(consulta, ("blog_%",)).fetchall()
print("LIKE 'blog_%'          :", sorted(nombre[0] for nombre in ingenuo))
# Se escapa el « _ » con « \ » y se declara con ESCAPE: vuelve a ser un guion bajo real
exacto = conexion.execute(consulta + " ESCAPE '\\'", ("blog\\_%",)).fetchall()
print("LIKE 'blog\\_%' ESCAPE  :", sorted(nombre[0] for nombre in exacto))
```

Salida obtenida:

```text
LIKE 'blog_%'          : ['blog_articulos', 'blog_notas', 'blogger_articulos']
LIKE 'blog\_%' ESCAPE  : ['blog_articulos', 'blog_notas']
```

Sin el escape, la copia de seguridad del blog habría arrastrado la tabla `blogger_articulos` de otro sitio: una fuga de datos en un archivo de copia. Incluso con el escape, conviene una regla de seguridad: **comprobar al arrancar que el prefijo de un sitio no es el comienzo de ningún otro** (lo que hace `verificar_los_prefijos` más arriba) y **construir la lista de tablas del sitio en el código** (`prefijo + nombre` para cada tabla conocida) en lugar de deducirla de un patrón. En las variantes A y C no existe este paso de filtrado, lo que es un argumento concreto a favor de su aislamiento.

| Operación | Variante A (base) | Variante B (prefijo) | Variante C (esquema) |
|---|---|---|---|
| Copia de seguridad de un sitio | Una exportación de la base | Exportar la lista exacta de tablas del sitio | Exportar el esquema |
| Restaurar un sitio | Reemplazar la base | Eliminar y volver a crear las tablas del prefijo, comprobando que no se toca ninguna tabla de otro sitio | Reemplazar el esquema |
| Eliminar un sitio | Eliminar la base | Eliminar sus tablas, una por una | Eliminar el esquema |
| Clonar un sitio (preproducción: copia de prueba antes de la puesta en línea) | Copiar la base | Copiar las tablas con un nuevo prefijo | Copiar el esquema |
| Riesgo principal | Olvidar una base en la lista de copias | Confundir dos prefijos parecidos | Permisos demasiado amplios sobre varios esquemas |

## Actualizar todo el parque

Compartir el código también significa compartir los **cambios de estructura**: añadir una columna a la tabla de artículos (véanse [Migraciones de datos seguras](/?c=donnees&s=bases-de-donnees&p=migrations-de-donnees-sures) y la sección sobre migraciones del [ORM](/?c=donnees&s=bases-de-donnees&p=orm) para la noción de migración versionada) debe hacerse **en cada uno de los N sitios**, puesto que cada uno tiene sus propias tablas. El código se despliega una vez; la estructura, en cambio, se actualiza N veces.

```text
Despliegue del nuevo código  (una vez, instantáneo)
        |
        v
El nuevo código espera una columna « publicado » en los artículos
        |
        v
Migración de la estructura
   sitio 1 ... OK
   sitio 2 ... OK
   sitio 3 ... ERROR            <- el parque queda AHORA EN UN ESTADO MIXTO
   sitios 4 a 40 ... en espera    (el nuevo código sobre tablas con la estructura antigua)
```

El estado mixto es el riesgo propio de este patrón: mientras el bucle no termine, el mismo código se ejecuta frente a estructuras distintas. Las defensas son las mismas que para una migración de datos: una operación **repetible sin riesgo** (la **idempotencia**, es decir, dar el mismo resultado se ejecute una o varias veces), un registro de lo que ya está hecho, y un código compatible con la estructura antigua **y** la nueva durante la transición.

```python
# sqlite3 : módulo de Python para hablar con una base SQLite
import sqlite3

# Los prefijos de tres sitios que comparten una misma base
PREFIJOS = ["tienda_", "blog_", "club_"]
# Base en memoria para la prueba
conexion = sqlite3.connect(":memory:")
# Se crea la tabla de artículos de cada sitio, con la estructura antigua
for prefijo in PREFIJOS:
    conexion.execute(f"CREATE TABLE {prefijo}articulos (id INTEGER, titulo TEXT)")
# Un sitio ya recibió la nueva columna en una prueba anterior interrumpida
conexion.execute("ALTER TABLE blog_articulos ADD COLUMN publicado INTEGER DEFAULT 0")


def migrar(conexion, prefijo):
    """
    @brief Añade la columna «publicado» si falta (repetible sin riesgo).

    @param conexion Conexión SQLite abierta.
    @param prefijo Prefijo de tablas de un sitio, ya validado.

    @returns «migrado» o «ya actualizado».
    """
    # Nombre real de la tabla de este sitio
    tabla = f"{prefijo}articulos"
    # PRAGMA table_info lista las columnas; el índice 1 de cada fila es el nombre
    columnas = [fila[1] for fila in conexion.execute(f"PRAGMA table_info({tabla})")]
    # Columna ya presente: nada que hacer, y sobre todo nada de error « duplicate column »
    if "publicado" in columnas:
        # Respuesta sin modificar nada
        return "ya actualizado"
    # ALTER TABLE ... ADD COLUMN añade la columna, con valor 0 para las filas existentes
    conexion.execute(f"ALTER TABLE {tabla} ADD COLUMN publicado INTEGER DEFAULT 0")
    # Se indica que este sitio acaba de modificarse
    return "migrado"


# Una migración del parque = un bucle sobre todos los sitios; se ejecuta dos veces
for pasada in (1, 2):
    # Un diccionario por pasada (construido en una línea): prefijo -> resultado
    balance = {prefijo: migrar(conexion, prefijo) for prefijo in PREFIJOS}
    print(f"pasada {pasada} :", balance)
```

Salida obtenida:

```text
pasada 1 : {'tienda_': 'migrado', 'blog_': 'ya actualizado', 'club_': 'migrado'}
pasada 2 : {'tienda_': 'ya actualizado', 'blog_': 'ya actualizado', 'club_': 'ya actualizado'}
```

La primera pasada migra dos sitios y reconoce que el tercero ya lo estaba; la segunda ya no cambia nada. Sin la comprobación de la columna, la primera pasada habría fallado en el blog y dejado los sitios siguientes sin migrar.

| Práctica de despliegue | Efecto | Precaución |
|---|---|---|
| Migrar primero un sitio piloto, y luego los demás por lotes | Un defecto se descubre en un solo sitio | Elegir un sitio representativo pero poco crítico |
| Escribir el nuevo código para que tolere la estructura antigua | Sin interrupción durante el bucle de migración | Retirar el código de compatibilidad cuando todos los sitios estén migrados |
| Registrar, por sitio, la versión de estructura alcanzada | Se sabe exactamente dónde retomar tras un fallo | Una tabla de seguimiento por sitio, o un identificador de versión en la configuración |
| Prever el tiempo total (número de sitios por duración de una migración) | Evita la sorpresa de una migración de varias horas | 40 sitios a 3 minutos cada uno son dos horas de bucle |
| Conservar una vuelta atrás por sitio | Un sitio con fallo no bloquea a los demás | Hacer copia de seguridad de cada sitio antes de migrarlo |

## Los riesgos del patrón

Compartir el código convierte cada problema local en un problema potencialmente colectivo:

| Riesgo | Mecanismo | Defensa |
|---|---|---|
| Una actualización afecta a todos los sitios | Un despliegue defectuoso rompe los N sitios de golpe | Despliegue progresivo (un sitio piloto, luego lotes); prueba sobre una copia; vuelta atrás preparada (véanse [actualizaciones progresivas](/?c=infrastructure-devops&s=kubernetes&p=autoscaling-et-rolling-updates)) |
| Un fallo de código afecta a todo el parque | El código es idéntico en todas partes: una inyección o un fallo de acceso explotable en un sitio lo es en todos | Actualizaciones de seguridad rápidas; permisos SQL limitados; aislamiento de los datos (variantes A o C); vigilancia por sitio |
| Un sitio «ruidoso» ralentiza a los demás | Un sitio muy solicitado (campaña, robot, importación masiva) consume el procesador, la memoria o las conexiones de la base compartida: es el efecto del **vecino ruidoso** (*noisy neighbor*) | Cuotas por sitio; limitación del caudal (véase [sobrecarga y denegación de servicio a nivel de aplicación](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)); sacar el sitio del parque (véase más abajo) |
| Saturación de las conexiones de la base | Cada proceso abre conexiones: al multiplicar por el número de sitios, se supera el límite de la base | Un [pool de conexiones](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#connection-pooling) compartido (un conjunto de conexiones ya abiertas y reutilizadas); conexiones abiertas bajo demanda; tope por sitio |
| Fuga de datos entre sitios | Una consulta que olvida el prefijo o el esquema, una clave de caché sin identificador de sitio | Una sola función construye los nombres de tabla; revisión de código; prueba automática de no mezcla |
| Caché mezclada | Dos sitios escriben con la misma clave (`carrito:42`) en el mismo servidor de caché | Prefijar todas las claves con el sitio (`tienda:carrito:42`), véase [Redis](/?c=donnees&s=bases-de-donnees&p=redis) |
| Sesiones compartidas por una cookie demasiado amplia | Una cookie creada para el dominio padre (`.groupe.example`) se envía a todos los subsitios | Una cookie por nombre de host, sin atributo de dominio; véanse [sesiones y cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) |
| Tareas programadas demasiado pesadas | Una tarea que recorre 40 sitios dura 40 veces más; un sitio lento retrasa a los siguientes | Un trabajo dividido por sitio, ejecutado en paralelo con un tope |
| Registros ilegibles | Imposible saber qué sitio causa un problema | Cada línea de registro contiene siempre el identificador del sitio (véase [agregación de logs](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs)) |

### La aritmética de las conexiones

Una base solo acepta un número limitado de conexiones simultáneas. Si cada proceso de la aplicación abre una conexión **por sitio**, el total crece como un producto. Con cifras de ejemplo (inventadas): 6 servidores, 8 procesos por servidor, 40 sitios, y una base que acepta 200 conexiones.

| Organización | Cálculo | Conexiones en el peor caso |
|---|---|---|
| Una base común (variantes B y C), una conexión por proceso | 6 × 8 | 48 |
| Una base por sitio (variante A), una conexión abierta bajo demanda por sitio atendido | 6 × 8 × 40 | 1 920 |
| Misma variante A con un pool compartido limitado a 100 conexiones | límite | 100 |

La variante A, la más aislada, es la que satura más rápido: sin pool ni tope, 1 920 conexiones posibles frente a las 200 aceptadas significan rechazos de conexión a la primera afluencia. El escalado de los servidores de aplicación (añadir máquinas con el [autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge)) multiplica además el primer factor: **añadir un servidor aumenta el número de conexiones que la base debe soportar**, lo cual debe anticiparse.

### Cuándo un sitio debe salir del parque

Un sitio cuyo tráfico supera con creces el de los demás plantea el mismo problema que la «cuenta famosa» del [feed de noticias](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out): tratarlo como a los demás cuesta caro a todos. La defensa es comparable, un **modelo híbrido**: la mayoría de los sitios pequeños se queda en el parque compartido, y el sitio gigante recibe su propia base, incluso sus propios servidores, mientras sigue ejecutando **el mismo código**. Es un argumento para que la configuración de un sitio decida dónde viven sus datos (y no el código), de modo que esa mudanza solo exija un cambio de ajuste.

## Cuándo elegir este patrón

El patrón multisitio no es la única forma de servir varios sitios o varios clientes:

| | Una instalación por sitio | Multisitio (este capítulo) | Una sola instalación, una columna «sitio» |
|---|---|---|---|
| Principio | Cada sitio tiene su propio despliegue completo (código, base, servidores), por ejemplo un [contenedor](/?c=infrastructure-devops&s=docker&p=concepts-de-base) por sitio | Un código, N configuraciones, N juegos de datos | Un solo sitio técnico; cada fila de cada tabla lleva el identificador del **inquilino** (el cliente o la marca a la que pertenece) |
| Aislamiento | Máximo | Bueno a medio según la variante | Débil: todo depende de un `WHERE sitio = ...` (la cláusula SQL que filtra las filas) sin olvidos |
| Coste por sitio | Alto | Medio | Bajo |
| Actualización | N despliegues, pero independientes, desplazables | Un despliegue para el código, N migraciones | Un despliegue, una migración |
| Personalización de un sitio | Libre | Por configuración, o extensiones activadas por sitio | Limitada |
| Cuándo elegirla | Pocos sitios, gran autonomía o restricciones legales | Muchos sitios parecidos, un equipo que quiere un código único | Muchísimos inquilinos idénticos (miles), aislamiento garantizado por el código |

El multisitio se justifica cuando los sitios **se parecen mucho** (mismas funcionalidades, mismos ciclos de actualización) y un mismo equipo los gestiona. Se justifica menos cuando los sitios divergen en funcionalidades (el código acaba lleno de «si este sitio...»), cuando obligaciones contractuales o legales exigen una separación estricta (alojamiento en países distintos, por ejemplo), o cuando la independencia de las fechas de actualización es una exigencia de cada sitio.

## Un ejemplo de CMS: Drupal

> **Este ejemplo no es el tema del capítulo.** El patrón descrito más arriba se aplica a cualquier software. Drupal se presenta aquí solo para mostrar una implementación real de este patrón: es un [sistema de gestión de contenidos](https://www.drupal.org/docs) (*CMS* por *Content Management System*, un software que permite publicar y organizar páginas sin escribirlas a mano) escrito en [PHP](/?c=langages&s=php&p=syntaxe) que sabe, por diseño, servir varios sitios desde un solo código. Los nombres y el comportamiento descritos aquí están verificados en el código fuente de Drupal 11.x.

Drupal organiza sus sitios en una carpeta `sites/` situada junto al código común. Cada sitio tiene su subcarpeta, cuyos archivos cumplen las funciones de la tabla del patrón:

| Elemento del patrón | Realización en Drupal |
|---|---|
| Un código compartido | Un solo ejemplar de los archivos de Drupal y de sus módulos |
| Tabla «nombre de host hacia sitio» | Un archivo `sites/sites.php` que asocia una dirección con una subcarpeta; sin él, Drupal sirve siempre `sites/default` |
| Configuración de un sitio | Un archivo `settings.php` en la subcarpeta del sitio |
| Archivos propios del sitio | Una carpeta de archivos en la subcarpeta del sitio |
| Base de datos del sitio | Configurada en `settings.php`: base propia, o base compartida con un **prefijo de tablas** |

La estructura de carpetas se parece a esto:

```text
 raíz del proyecto
  ├── (código común de la aplicación y de sus módulos)
  └── sites/
        ├── sites.php            <- correspondencias «dirección -> subcarpeta»
        ├── default/             <- sitio por defecto
        ├── tienda/
        │     ├── settings.php   <- base, prefijo, ajustes del sitio «tienda»
        │     └── files/         <- archivos subidos de este sitio
        └── blog/
              ├── settings.php
              └── files/
```

El archivo `settings.php` de un sitio declara la conexión a la base y, en su caso, el prefijo. Esta es una versión mínima, escrita para este capítulo (nombres inventados). `$databases` es un **arreglo** de PHP (una lista de pares clave-valor) cuyas claves describen la conexión (`mysql` designa [MySQL](https://dev.mysql.com/doc/), un software de base de datos):

```php
<?php

// Ajustes de la conexión a la base del sitio «blog», en el arreglo $databases
$databases['default']['default'] = [
  // Nombre de la base: una base propia del sitio (variante A del capítulo)
  'database' => 'base_blog',
  // Cuenta de acceso a la base, limitada a esta base
  'username' => 'cuenta_blog',
  // getenv lee una variable de entorno: la contraseña no está escrita en el archivo
  'password' => getenv('CONTRASENA_BLOG'),
  // Dirección del servidor de base de datos
  'host' => 'base.interne.example',
  // Motor de base de datos utilizado (MySQL aquí)
  'driver' => 'mysql',
  // Prefijo de tablas: vacío aquí; con una base compartida (variante B), 'blog_'
  'prefix' => '',
];
```

El archivo `sites/sites.php` asocia un nombre de host con la subcarpeta que lo sirve. No existe en la instalación: se copia el archivo de ejemplo `sites/example.sites.php` bajo el nombre `sites/sites.php`. Sin `sites/sites.php`, Drupal sirve siempre el sitio `sites/default`, y es este archivo el que activa el multisitio:

```php
<?php

// El nombre de host pedido (clave) sirve los ajustes de la subcarpeta «blog» (valor)
$sites['blog.example'] = 'blog';
// Mismo principio para la tienda: una línea por sitio del parque
$sites['boutique.example'] = 'tienda';
```

Un nombre de host ausente de `sites.php` no se rechaza: Drupal recurre también a `sites/default`, el «sitio por defecto» que el capítulo desaconseja. Solo el ajuste `trusted_host_patterns` de `settings.php` (la lista de nombres de host aceptados) puede rechazar un nombre desconocido.

Lo que ilustra el ejemplo del patrón: el **código es común**, la **tabla de correspondencias** es una simple lista, la **configuración** (incluida la elección entre base propia y prefijo de tablas) es un archivo por sitio, y los **archivos** tienen una carpeta por sitio. También ilustra sus riesgos: una actualización de Drupal o de un módulo afecta a todos los sitios a la vez, y los comandos de administración desde la línea de comandos deben designar explícitamente el sitio al que van dirigidos (la herramienta de administración de Drupal en línea de comandos, [Drush](https://www.drush.org/), lo hace mediante una opción que indica la dirección del sitio), so pena de actuar sobre el equivocado.

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Un «sitio por defecto» para todo nombre desconocido | Una cabecera `Host` falsa obtiene las páginas o los datos de otro sitio; una caché puede memorizar la mezcla | Lista cerrada de nombres; error (404 o 421) para el resto |
| Fabricar direcciones absolutas a partir de la cabecera `Host` | Un atacante hace enviar a su víctima un enlace hacia su propio dominio | Leer la dirección oficial del sitio en la configuración |
| Prefijo de tabla introducido o modificable por un visitante | Inyección SQL por el nombre de tabla, que un parámetro ligado no puede proteger | Prefijo procedente de la configuración, validado al arrancar mediante un patrón estricto |
| Dos prefijos idénticos, o uno que es el comienzo de otro (`blog_` y `blog_ue_`, si el patrón admite un `_` interno) | Las tablas de un sitio pueden confundirse con las de otro | Comprobar al arrancar que ningún prefijo cubre a otro |
| `LIKE 'prefijo_%'` para encontrar las tablas de un sitio | El `_` del patrón vale «cualquier carácter»: una copia de seguridad puede arrastrar las tablas de otro sitio | `ESCAPE`, o mejor, una lista de tablas construida en el código |
| Claves de caché sin identificador de sitio | Un sitio lee el dato almacenado en caché por otro | Prefijar todas las claves por el sitio |
| Cookie de sesión para el dominio padre | Una sesión válida en un sitio lo es en todos los subsitios | Una cookie por nombre de host |
| Migrar los sitios sin haber previsto que sea repetible | Un fallo en el sitio 3 deja un parque en estado mixto, y el reintento falla | Operación idempotente, registro por sitio |
| Una conexión por proceso y por sitio, sin tope | Las conexiones superan el límite de la base en cuanto llega la afluencia | Pool compartido, apertura bajo demanda, tope por sitio |
| Registros sin identificador de sitio | No se sabe qué sitio causa un incidente | El identificador del sitio en cada línea |
| Tratar a un sitio gigante con el mismo régimen que a los pequeños | El sitio molesta a todo el parque | Mover sus datos y sus servidores, con el mismo código |
| Personalizar el código para un sitio | El código único se convierte en una colección de casos particulares | Pasar por la configuración o por una extensión activada por sitio |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Una tabla de correspondencia cerrada «nombre de host hacia configuración», verificada al arrancar | No se sirve ningún sitio inesperado |
| Toda diferencia entre sitios vive en la configuración, nunca en el código | El código sigue siendo único y comprobable |
| Una sola función construye los nombres de tabla (o elige la conexión) | Ninguna consulta puede olvidar el aislamiento |
| Una prueba automática que consulta dos sitios y verifica que ningún dato pasa de uno a otro | Una fuga se detecta antes de producción |
| Elegir la variante de almacenamiento según el aislamiento exigido, no según la comodidad del primer día | Cambiar de variante más tarde cuesta caro |
| Desplegar primero en un sitio piloto, y luego por lotes | Un defecto no afecta a todo el parque |
| Migraciones idempotentes, con la versión alcanzada registrada por sitio | Un fallo a mitad de camino se corrige |
| Contabilizar las conexiones (procesos × sitios) antes de añadir servidores | La base no se colapsa con la afluencia |
| Poner el identificador del sitio en los registros, las claves de caché y las métricas (medidas cuantitativas de la actividad) | Se localiza el sitio ruidoso y se aísla un incidente |
| Prever desde el principio la salida de un sitio del parque | Un sitio gigante se muda con un cambio de ajuste |
| Hacer copia de seguridad y probar la restauración sitio por sitio | La recuperación de un sitio no afecta a los demás |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | El **patrón multisitio** sirve N sitios desde **una sola base de código**: en cada petición, el código lee el nombre de host, elige la configuración del sitio en una lista cerrada, y luego abre los datos de **ese** sitio. El código y sus actualizaciones son **compartidos**; la configuración, los datos, los archivos, las claves de caché y los secretos están **aislados**. Los datos se organizan de tres maneras: una **base por sitio** (aislamiento fuerte, coste y conexiones más altos), un **prefijo de tablas** en una base compartida (lo más barato, el aislamiento más débil, precauciones para hacer copias de seguridad), un **esquema por sitio** (compromiso, según el motor). El precio del patrón es un riesgo colectivo: una actualización o un fallo de código afecta a todos los sitios, un sitio ruidoso ralentiza a los demás, las conexiones de la base se multiplican con el número de sitios. Drupal es solo un ejemplo de producto que implementa este patrón. |
| **Trampas que evitar** | Servir un sitio por defecto para un nombre desconocido; construir direcciones a partir de la cabecera `Host`; dejar que un visitante influya en el prefijo; prefijos que se solapan; buscar las tablas de un sitio con un `LIKE` sin escapar; claves de caché o cookies comunes a varios sitios; una migración no repetible; una conexión por proceso y por sitio sin tope; registros sin identificador de sitio; personalizar el código para un sitio. |
| **Buenas prácticas** | Una lista cerrada de sitios, verificada al arrancar; la configuración para toda diferencia entre sitios; una función única para construir los nombres de tabla o elegir la conexión; una prueba de no mezcla entre dos sitios; un despliegue progresivo con un sitio piloto; migraciones idempotentes seguidas por sitio; un cálculo de conexiones antes de añadir servidores; el identificador del sitio en todas partes (registros, caché, métricas); una salida prevista para un sitio que ha crecido demasiado. |
