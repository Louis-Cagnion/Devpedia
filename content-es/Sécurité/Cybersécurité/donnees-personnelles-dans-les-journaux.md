---
order: 25
---

# Datos personales en los registros y las copias (31/10/2026)

Un **registro** (en inglés *log*) es el archivo donde un programa anota lo que hace y lo que no va bien, una línea por evento (véase [la inundación de logs](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inondation-de-logs) para el caso en que escribe demasiado). Se lee para entender una avería. El problema de este capítulo: de tanto anotar «lo que ha pasado», el programa anota también **quién** estaba implicado, y el registro se convierte, sin que nadie lo haya decidido, en un segundo archivo de clientes.

Este capítulo responde a cuatro preguntas: qué es un dato personal, por dónde entra en un registro, cómo se multiplica en las copias (**satélites**, es decir, copias mantenidas en otras aplicaciones, véase más abajo; copias de seguridad; agregador de registros, es decir, un servicio que reúne en un mismo lugar los registros de muchas máquinas), y cómo impedir que se filtre, enmascararlo o borrarlo. Los ejemplos funcionan en [Python](/?c=langages&s=python&p=python), que se ejecuta desde una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal); se apoyan en las [funciones](/?c=langages&s=python&p=fonctions), las [listas y tuplas](/?c=langages&s=python&p=listes-et-tuples), los [diccionarios](/?c=langages&s=python&p=dictionnaires-et-ensembles), los [bucles](/?c=langages&s=python&p=boucles), las [clases](/?c=langages&s=python&p=poo), la [gestión de errores](/?c=langages&s=python&p=gestion-des-erreurs) y los [módulos](/?c=langages&s=python&p=modules-et-environnements). Un último ejemplo muestra el mismo problema en un sistema de gestión de contenidos (Drupal), solo a título ilustrativo.

> **Este capítulo no es un dictamen jurídico.** Explica principios generales y técnicas. Lo que una ley impone en su situación (plazos exactos, bases jurídicas, obligaciones de notificación) depende de su país, de su actividad y de sus contratos: eso se decide con un jurista o, en una organización, con su delegado de protección de datos (el **DPO**, la persona encargada de velar por este cumplimiento). No se cita aquí ningún número de artículo, al no poder verificarlo: el texto oficial está enlazado más abajo.

| Tema cercano | Lo que cubre el otro capítulo | Lo que añade este capítulo |
|---|---|---|
| [Gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets) | Dónde guardar una contraseña o una clave de [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (el identificador secreto que da acceso a un servicio) | Impedir que acaben en un registro |
| [Secretos olvidados en producción](/?c=securite&s=cybersecurite&p=secrets-oublies-en-production) | Archivo `.env` público, secreto que queda en el historial de Git | El secreto que se filtra por una línea de registro |
| [ELK, la agregación de logs](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs) | Reunir y buscar en los registros de muchas máquinas | Lo que se ha copiado en ellos, y durante cuánto tiempo |
| [Las grandes familias de fallos de seguridad](/?c=securite&s=cybersecurite&p=types-de-failles) | Las grandes familias de fallos | Una filtración que no es un ataque: un error de diseño |
| [Gobernanza de datos para un sistema IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) | Clasificar, conservar y borrar los datos de un sistema IA | El caso general de un registro de aplicación corriente |

## Qué es un dato personal

Un **dato personal** es toda información que se refiere a una persona física **identificada o identificable**. «Identificable» es la palabra que engaña: un dato no necesita llevar un nombre para ser personal; basta con que se pueda **llegar a una persona**, sola o cruzándola con otra información.

| Dato | Por qué es personal | Dónde se cuela en un registro |
|---|---|---|
| Dirección de correo electrónico | Designa a menudo directamente a una persona (`nombre.apellido@...`) | Mensaje de error de envío, formulario de inicio de sesión fallido |
| Dirección [IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau) | Identifica la conexión de un abonado en su proveedor de acceso; las autoridades europeas la tratan en general como un dato personal | Registro de accesos del **servidor web** (el programa que recibe las visitas de un sitio y les responde), línea «conexión desde ...» |
| Identificador interno (número de usuario) | Remite a una fila de la base que contiene el resto | Cada línea «usuario 42 ha hecho ...» |
| Texto libre (mensaje, comentario, dirección postal) | Una persona escribe cualquier cosa: un nombre, un teléfono, un problema de salud | Cuerpo de una petición copiado en un error |
| Identificador de sesión o de cookie | Sigue a un navegador, y por tanto a una persona, de una página a otra (véase [sesiones y cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies)) | Dirección web (**URL**) o **cabecera** [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (una línea de información adjunta a una petición) copiada tal cual |
| Número de tarjeta bancaria | Está ligado a un titular; además es un secreto que proteger | Mensaje de rechazo de pago, cuerpo de petición |

Hay que distinguir tres nociones que se parecen:

| Noción | Definición | Ejemplo | ¿Sigue siendo un dato personal? |
|---|---|---|---|
| Dato directamente identificador | Designa a la persona sin esfuerzo | `lea.martin@example.org` | Sí |
| Dato **seudonimizado** | El vínculo con la persona se sustituye por un seudónimo; una información separada (una clave, una tabla) permite recuperarlo | `0ce0c9442134de90` (véase más abajo) | **Sí**, mientras se pueda rehacer el vínculo |
| Dato **anonimizado** | Ningún medio razonable de encontrar a la persona, ni siquiera cruzando otras fuentes | «1 200 conexiones este martes» | No, pero la anonimización real es difícil de lograr |

> **Trampa:** creer que un dato «hasheado» o «seudonimizado» ha salido del ámbito de la protección de datos. Mientras alguien, en algún lugar, tenga con qué rehacer el vínculo (la clave, la tabla de correspondencia, o simplemente la posibilidad de adivinar la entrada), sigue siendo personal.

Un dato personal no es un **secreto** en el sentido del capítulo sobre la [gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets): un secreto (clave de API, contraseña) da un poder a quien lo posee; un dato personal concierne a una persona. Un número de tarjeta es ambas cosas a la vez. Las contramedidas de este capítulo tratan las dos familias con el mismo filtro, porque se filtran por los mismos caminos.

## Cómo entra un dato personal en un registro

Nadie escribe `registro.info("aquí el correo de Léa")` con mala intención. Las filtraciones vienen casi siempre de **mensajes útiles para el diagnóstico** que copian demasiado contexto.

| Canal de filtración | Qué pasa | Ejemplo (inventado) |
|---|---|---|
| Mensaje que copia la petición | El desarrollador quiere saber «con qué ha fallado» y escribe la entrada entera | `Fallo en la petición {"correo": "lea@example.org", "mensaje": "..."}` |
| Traza de error con sus parámetros | Una **traza** (*stack trace*) es la lista de funciones llamadas en el momento de una [excepción](/?c=langages&s=python&p=gestion-des-erreurs) (un error señalado por el programa); según la herramienta, muestra los valores de los argumentos, o la línea de código con sus valores | `ValueError: invalid literal for int() with base 10: 'lea@example.org'` |
| URL con token | Una URL de restablecimiento de contraseña contiene un **token** (un valor secreto de un solo uso) en la dirección, y el servidor web registra la dirección completa | `GET /reset?token=a1b2c3d4e5f6` |
| Cuerpo de petición | Un modo de depuración registra el **cuerpo** de cada petición HTTP (véase [API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)), incluido el formulario de pago | `POST /pago  tarjeta=4111 1111 1111 1111` |
| Consulta SQL registrada con sus valores | El nivel de detalle máximo muestra la consulta [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) con los valores ya insertados | `SELECT * FROM clientes WHERE correo = 'lea@example.org'` |
| Registro de accesos del servidor web | Cada petición recibida deja la dirección IP del visitante, la dirección solicitada y a veces el identificador de conexión | `203.0.113.7 - lea.martin [31/Oct/2026] "GET /cuenta" 200` |
| Mensaje de una biblioteca de terceros | Una biblioteca copia en su mensaje de error la dirección del destinatario o la cabecera de autorización enviada | `Envío imposible: destinatario <lea@example.org> desconocido` |
| Herramienta de seguimiento de errores | Un servicio externo recibe automáticamente cada excepción con el contexto de la petición | Copia fuera de su infraestructura |

Este es un extracto de registro tal como circula en muchos servidores. Cada línea contiene algo que no debería estar ahí:

```text
2026-10-31 09:12:03 INFO Conexión de lea.martin@example.org desde 203.0.113.7
2026-10-31 09:12:41 WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr rechazado
2026-10-31 09:13:10 ERROR Pago rechazado para la tarjeta 4111 1111 1111 1111
2026-10-31 09:14:02 INFO Pedido 1234 validado
```

Las líneas 1 a 3 contienen, respectivamente, una dirección de correo y una IP, un token de restablecimiento y un número de tarjeta; solo la línea 4 está sana. Quien lea este archivo (un compañero que depura, un proveedor de alojamiento, un atacante que ha encontrado un fallo de lectura de archivos, véase [tipos de fallos](/?c=securite&s=cybersecurite&p=types-de-failles)) obtiene esta información sin haber atacado la base de datos.

Tres razones hacen este riesgo más serio de lo que parece:

| Razón | Explicación |
|---|---|
| Los registros están menos protegidos que la base | Más gente accede a ellos (desarrolladores, soporte, alojamiento), a menudo en lectura libre, sin rastro de quién leyó qué |
| Duran mucho tiempo sin que nadie se ocupe | Una base tiene una lógica de negocio (se borra una cuenta); un archivo de registro crece hasta que el disco se llena |
| Se copian a otro sitio automáticamente | El agregador, la copia de seguridad, la herramienta de seguimiento de errores: véase la sección siguiente |

## Las copias: cada réplica es una copia más que proteger y borrar

Un dato escrito una vez en la base rara vez acaba en un solo lugar. El esquema siguiente muestra un caso habitual: un **referencial** (la base que hace autoridad, aquella donde se crean y corrigen las personas) que envía sus datos a unos **satélites** (copias mantenidas por otras aplicaciones u otros sitios, para que funcionen sin llamar al referencial cada vez).

```
                          +-----------------------+
   Usuario      --------->|  Aplicación           |
                          |  (referencial)        |
                          +----------+------------+
                                     |
          +--------------------------+--------------------------+
          |                          |                          |
          v                          v                          v
   +-------------+          +----------------+          +---------------+
   | Satélite A  |          | Satélite B     |          | Registro      |
   | (copia)     |          | (copia)        |          | aplicación    |
   +------+------+          +--------+-------+          +-------+-------+
          |                          |                          |
          v                          v                          v
   +-------------+          +----------------+          +---------------+
   | Respaldo    |          | Respaldo       |          | Agregador de  |
   | de A        |          | de B           |          | logs (ELK)    |
   +-------------+          +----------------+          +---------------+
```

Cada recuadro de este esquema contiene quizá la dirección de correo de Léa. La tabla siguiente indica lo que implica:

| Copia | Quién la controla | Cómo borrarla | Trampa habitual |
|---|---|---|---|
| Referencial | El equipo de la aplicación | Una petición de borrado | La única copia en la que se piensa |
| Satélite | A veces otro equipo, a veces un tercero | Una llamada de borrado a cada uno | El satélite está apagado o con error en el momento de la llamada |
| Registro de la aplicación | El equipo de la aplicación | Reescribir el archivo o dejar expirar la **retención** (el tiempo durante el que se guarda un archivo antes de borrarlo) | Un archivo en el que siempre se escribe a continuación, al final, no se corrige fácilmente |
| Agregador de logs | El equipo de explotación | Borrado por consulta en el índice, o expiración | El índice guarda una copia de lo que el archivo ya perdió |
| Copia de seguridad | La explotación, a veces un proveedor | A menudo imposible línea por línea: se espera a la expiración | Una restauración vuelve a introducir a una persona ya borrada |
| Herramienta externa de seguimiento de errores | Un tercero | Sus propias reglas de retención | Los datos salen de su infraestructura |

Dos consecuencias prácticas:

1. **Cada copia debe estar protegida**: derechos de acceso, [cifrado](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (hacer ilegibles los datos sin clave), duración de conservación. Una fuga en la copia menos vigilada equivale a una fuga en la base.
2. **Cada copia debe poder borrarse**, o expirar lo bastante pronto para que el borrado se tenga en cuenta sin intervención. Una copia que no sabemos encontrar es una copia que no sabemos borrar.

El capítulo sobre los [sistemas de IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) da la misma lista de «lugares donde el dato pudo copiarse» para un prompt enviado a un modelo; la lógica es idéntica para un registro corriente.

## Lo que dice el RGPD, a grandes rasgos

El **RGPD** (Reglamento General de Protección de Datos, un reglamento de la Unión Europea en vigor desde 2018) fija las reglas para el tratamiento de los datos personales de las personas que se encuentran en la Unión. En Francia, la autoridad que vela por su cumplimiento es la **CNIL** (Comisión Nacional de Informática y Libertades). Un registro que contiene una dirección de correo es un **tratamiento** de datos personales como cualquier otro: está sometido a los mismos principios, aunque nadie lo haya creado para eso.

Los principios generales, traducidos a un registro:

| Principio (formulación general) | Lo que significa para un registro |
|---|---|
| **Minimización**: recoger solo lo necesario | Registrar un identificador interno en lugar de un correo; no registrar el cuerpo de una petición |
| **Limitación del plazo de conservación**: no guardar más allá de lo necesario | Una duración decidida, aplicada automáticamente |
| **Integridad y confidencialidad**: proteger contra el acceso no autorizado | Derechos de acceso a los archivos, cifrado, acceso a los registros limitado |
| **Limitación de la finalidad**: usar solo para lo que se recogió | Un registro de errores sirve para depurar, no para seguir el comportamiento de un cliente |
| **Derecho de supresión** («derecho al olvido»): una persona puede pedir el borrado de sus datos, en determinadas condiciones | Una solicitud debe llegar a **todas** las copias, incluidos los registros |

Lo que esta tabla no dice, y que hay que hacer verificar: el derecho de supresión no es **absoluto** (una obligación legal de conservar un dato puede prevalecer), y algunos registros de seguridad pueden justificar un plazo más largo que otros. Asimismo, una violación de datos personales puede obligar a avisar a la autoridad en un plazo breve; el capítulo [Informar de una vulnerabilidad encontrada en un sitio web: lo que permite la ley y la divulgación responsable](/?c=securite&s=cybersecurite&p=signaler-une-faille-trouvee) da el referente de 72 horas y también remite al texto oficial.

| Dónde leer el texto | Dirección |
|---|---|
| El propio reglamento (Unión Europea) | [RGPD en EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) |
| La autoridad francesa y sus guías prácticas | [CNIL](https://www.cnil.fr) |

## Primera defensa: no registrar

La mejor protección de un dato es **no escribirlo nunca**. Antes de enmascarar, preguntarse si el dato es útil para el diagnóstico.

| Me gustaría escribir | Puedo escribir en su lugar | Por qué basta |
|---|---|---|
| La dirección de correo del usuario | Su identificador interno (`uid 42`) | Se encuentra a la persona en la base; si la fila se borra de la base, el identificador ya no designa a nadie |
| El cuerpo completo de la petición que falló | Los **nombres** de los campos y su tamaño (`campos: correo, mensaje; mensaje: 412 caracteres`) | Se sabe qué campo causa el problema sin conocer su contenido |
| La URL con su token | La URL sin la parte posterior a `?` | La ruta basta para situar la página |
| El mensaje bruto de una biblioteca | El **tipo** del error y un código | El texto bruto puede copiar la entrada |
| El número de tarjeta | Los cuatro últimos dígitos | Basta para que el soporte reconozca la tarjeta |
| La dirección IP completa | La dirección truncada (`203.0.113.0`) | Útil para detectar un grupo de direcciones vecinas abusivo, menos preciso para identificar |

La segunda palanca es el **nivel de registro**. Un nivel es un umbral de gravedad: el programa clasifica cada mensaje (del más charlatán, `DEBUG`, al más grave, `CRITICAL`) y solo escribe los que alcanzan el umbral configurado. Python numera los niveles:

| Nivel | Valor en Python | Uso típico | Riesgo para los datos |
|---|---|---|---|
| `DEBUG` | 10 | Detalles para el desarrollador: consultas SQL, cuerpos de petición | **El más alto**: aquí es donde más contexto se copia |
| `INFO` | 20 | Eventos normales: arranque, conexión, pedido | Medio: el identificador de la persona aparece a menudo |
| `WARNING` | 30 | Anomalía que no impide continuar | Medio |
| `ERROR` | 40 | Una operación ha fallado | Medio: la entrada causante a menudo se copia |
| `CRITICAL` | 50 | El programa ya no puede continuar | Bajo en volumen |

El programa siguiente registra la misma consulta SQL en el nivel `DEBUG` y dos mensajes corrientes, primero con el umbral `INFO` y luego con el umbral `DEBUG`. Usa el módulo [`logging`](https://docs.python.org/es/3/library/logging.html), incluido con Python (se habla de su «biblioteca estándar», véanse los [módulos](/?c=langages&s=python&p=modules-et-environnements)). Se escribe cada bloque en un archivo con el mismo nombre que su primer comentario, y luego se ejecuta con `python3 nombre.py`:

```python
# niveles.py : muestra el efecto del umbral de registro
import logging  # módulo de registro de la biblioteca estándar
import sys      # da acceso a la salida estándar (la pantalla de la terminal)

# Escribe los mensajes en la pantalla. El formato es una plantilla de línea:
# %(levelname)s se sustituye por el nivel, %(message)s por el texto.
logging.basicConfig(stream=sys.stdout, format="%(levelname)s %(message)s")
# Obtiene un registro llamado "tienda" (el nombre sirve para encontrarlo).
registro = logging.getLogger("tienda")

# Prueba dos umbrales: INFO (20) y luego DEBUG (10).
for nivel in (logging.INFO, logging.DEBUG):
    # Fija el umbral: todo mensaje por debajo de él se ignora.
    registro.setLevel(nivel)
    # Anuncia el umbral en curso (getLevelName devuelve el nombre de un nivel).
    print("--- nivel", logging.getLevelName(nivel), "---")
    # Un mensaje DEBUG. El marcador %s se sustituye por el argumento que sigue,
    # aquí el correo, en el momento en que se escribe el mensaje.
    registro.debug(
        "Consulta SQL: SELECT * FROM clientes WHERE correo = %s",
        "lea@example.org",
    )
    # Un mensaje INFO, sin dato personal.
    registro.info("Pedido 1234 validado")
    # Un mensaje ERROR, sin dato personal.
    registro.error("Pago rechazado para el pedido 1234")
```

Salida obtenida:

```text
--- nivel INFO ---
INFO Pedido 1234 validado
ERROR Pago rechazado para el pedido 1234
--- nivel DEBUG ---
DEBUG Consulta SQL: SELECT * FROM clientes WHERE correo = lea@example.org
INFO Pedido 1234 validado
ERROR Pago rechazado para el pedido 1234
```

> **Trampa:** dejar el nivel `DEBUG` activo «temporalmente» en producción para buscar un fallo, y olvidarlo. Durante semanas, cada consulta SQL y cada cuerpo de petición acaba en los registros, con los datos de los clientes.
>
> **Buena práctica:** el nivel por defecto en producción es `INFO` o superior; el paso a `DEBUG` se decide por una duración corta, en una máquina concreta, y se deshace al terminar la investigación.

## Segunda defensa: enmascarar con un filtro

Cuando un dato sensible puede llegar igualmente a un mensaje (porque una biblioteca lo copia, o porque un desarrollador lo olvidó), se coloca en el camino del registro un **filtro de enmascaramiento** (en inglés *redaction*): un código que relee cada mensaje **justo antes de su escritura** y sustituye los patrones sensibles por un valor neutro.

```
   registro.info("Conexión de lea@example.org")
                           |
                           v
              +-------------------------+
              | Filtro de enmascarado   |    busca: correo, token, tarjeta, IP
              +------------+------------+
                           |
                           v
        "Conexión de [ENMASCARADO]"  --->  archivo / pantalla / agregador
```

Para reconocer los patrones se usan **expresiones regulares** (*regex*), una notación que describe la forma de un texto, por ejemplo «letras, una `@`, un dominio» (véase [las regex en Python](/?c=langages&s=python&p=regex-en-python)). Un matiz para los números de tarjeta: una secuencia cualquiera de dieciséis cifras no es una tarjeta (tampoco un número de pedido). Por eso se añade el [**control de Luhn**](https://es.wikipedia.org/wiki/Algoritmo_de_Luhn), una fórmula de verificación que cumplen los números de tarjeta reales: partiendo de la derecha, se duplica la segunda cifra, la cuarta, la sexta... (la última cifra no se duplica; a un doble que supera 9 se le resta 9), se suma todo, y el total debe ser múltiplo de 10. Un número de pedido cualquiera suele fallar esta prueba y se queda legible. El filtro trata también la cabecera `Authorization: Bearer <token>`, la forma habitual de presentar un token de acceso a una API (véase [la seguridad de las API web](/?c=securite&s=cybersecurite&p=securite-api-web)).

Los patrones del módulo siguiente usan la notación de las expresiones regulares. La tabla decodifica los símbolos; `re.compile(r"...")` prepara un patrón (la `r` delante de las comillas indica que hay que conservar las barras invertidas tal cual), y `patron.sub(reemplazo, texto)` sustituye cada parte del texto que coincide:

| Símbolo | Significado |
|---|---|
| `[abc]`, `[^abc]` | Un carácter de los listados; con `^`, un carácter que **no** está en la lista |
| `\w`, `\d`, `\s` | Un carácter de palabra (letra, cifra o `_`), una cifra, un espacio; en mayúscula (`\D`), lo contrario |
| `+`, `?` | Uno o más de lo que precede; cero o uno (opcional) |
| `{12,18}`, `{1,3}` | De 12 a 18 veces, de 1 a 3 veces lo que precede |
| `\.` | Un punto real (sin la barra, el punto significa «cualquier carácter») |
| `\b` | Un límite de palabra: el inicio o el fin de una palabra, sin consumir ningún carácter |
| `(a\|b)` | Un grupo que memoriza lo que encuentra; `\|` significa «o», y `\1` designa el primer grupo en el reemplazo |
| `(?:...)` | Un grupo que sirve para agrupar, sin memorizar nada |
| `(?i)` | No distinguir mayúsculas y minúsculas (al inicio del patrón) |

El primer bloque escribe el módulo de enmascaramiento:

```python
# enmascaramiento.py : enmascara los datos sensibles en un texto y en un registro
import logging    # módulo de registro de la biblioteca estándar
import re         # expresiones regulares
import traceback  # genera el texto de una traza de error

# El texto que sustituye a un dato enmascarado.
MASCARA = "[ENMASCARADO]"

# Dirección de correo: parte local, arroba, dominio con al menos un punto.
PATRON_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")

# Parámetro sensible de URL o de formulario: nombre=valor (token, contraseña).
# password y contrasena (la palabra «contraseña» sin tilde) son dos nombres posibles.
PATRON_PARAMETRO = re.compile(
    r"(?i)\b(token|access_token|api_key|password|contrasena)=([^&\s]+)"
)

# Cabecera de autorización de tipo Bearer: la palabra Bearer y después el token.
PATRON_BEARER = re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+")

# Secuencia de 13 a 19 cifras, separadas o no por un espacio o un guion.
PATRON_TARJETA = re.compile(r"\b\d(?:[ -]?\d){12,18}\b")

# Dirección IPv4 (la forma de cuatro números): de una a tres cifras, separadas por
# puntos. El grupo \1 retiene los tres primeros números, el cuarto se pierde.
PATRON_IPV4 = re.compile(r"\b(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\b")


def suma_de_luhn_valida(digitos):
    """Dice si una secuencia de cifras pasa el control de Luhn de las tarjetas."""
    # Acumulado de las cifras, tras duplicar una de cada dos.
    total = 0
    # reversed lee las cifras de derecha a izquierda; enumerate añade un rango.
    for rango, digito in enumerate(reversed(digitos)):
        # Convierte el carácter en número.
        valor = int(digito)
        # Los rangos impares (la segunda, la cuarta... cifra desde la derecha) se duplican.
        if rango % 2 == 1:
            valor *= 2
            # Si el doble supera 9, se resta 9.
            if valor > 9:
                valor -= 9
        # Suma la cifra al acumulado.
        total += valor
    # El número es válido si el total es múltiplo de 10.
    return total % 10 == 0


def enmascarar_tarjeta(coincidencia):
    """Sustituye una secuencia de cifras solo si se parece a una tarjeta."""
    # coincidencia.group(0) es el texto entero que encuentra el patrón.
    # Quita espacios y guiones (todo lo que no es una cifra: \D).
    digitos = re.sub(r"\D", "", coincidencia.group(0))
    # Control de Luhn: si pasa, probablemente es una tarjeta, se enmascara.
    if suma_de_luhn_valida(digitos):
        return MASCARA
    # Si no (un número de pedido, por ejemplo), se deja el texto intacto.
    return coincidencia.group(0)


def enmascarar(texto):
    """Aplica todos los enmascaramientos a un texto y devuelve el texto limpio."""
    # Sustituye cada correo por la máscara.
    texto = PATRON_EMAIL.sub(MASCARA, texto)
    # Conserva los tres primeros números de la IP y sustituye el último por 0.
    texto = PATRON_IPV4.sub(r"\1.0", texto)
    # Conserva el nombre del parámetro (\1) y enmascara su valor.
    texto = PATRON_PARAMETRO.sub(r"\1=" + MASCARA, texto)
    # Conserva la palabra Bearer y enmascara el token.
    texto = PATRON_BEARER.sub("Bearer " + MASCARA, texto)
    # Las secuencias de cifras pasan por el control de Luhn.
    return PATRON_TARJETA.sub(enmascarar_tarjeta, texto)


class FiltroDeEnmascaramiento(logging.Filter):
    """Enmascara los datos sensibles de un registro antes de su escritura."""

    def filter(self, record):
        # record es el «enregistro»: el objeto que el módulo fabrica para cada mensaje.
        # msg = el texto, args = los valores que se insertan en los %s,
        # exc_info = la excepción en curso (tipo, valor, traza), o None si no hay.
        # getMessage() inserta los argumentos en el mensaje; se enmascara el resultado.
        record.msg = enmascarar(record.getMessage())
        # Los argumentos ya están insertados: se vacían para no volver a insertarlos.
        record.args = ()
        # Una excepción adjunta al mensaje la formatea más tarde el registro.
        if record.exc_info:
            # La traza se genera ahora (el asterisco * desempaqueta la tupla exc_info
            # en tres argumentos), y luego se enmascara.
            traza = "".join(traceback.format_exception(*record.exc_info))
            # exc_text: el texto de la traza que el registro escribirá en lugar de la suya.
            record.exc_text = enmascarar(traza).rstrip("\n")
        # True significa: «conserva este registro y escríbelo».
        return True
```

La clase `FiltroDeEnmascaramiento` hereda de [`logging.Filter`](https://docs.python.org/es/3/library/logging.html#filter-objects): el módulo llama a su método `filter` para cada mensaje, y el mensaje solo se escribe si devuelve `True`.

El segundo bloque repite seis eventos, primero sin filtro y luego con el filtro colocado en el **gestor** (el *handler*, el elemento que escribe realmente el mensaje en la pantalla o en un archivo):

```python
# antes_despues.py : mismo escenario, sin y con el filtro de enmascaramiento
import logging  # módulo de registro de la biblioteca estándar
import sys      # da acceso a la salida estándar (la pantalla de la terminal)

from enmascaramiento import FiltroDeEnmascaramiento  # definido en enmascaramiento.py

# Formato de una línea: el nivel y luego el mensaje.
FORMATO = "%(levelname)s %(message)s"


def fabricar_registro(nombre, con_filtro):
    """Crea un registro que escribe en la salida estándar, con o sin filtro."""
    # Un registro con nombre: dos nombres distintos dan dos registros separados.
    registro = logging.getLogger(nombre)
    # Deja pasar INFO y los niveles superiores.
    registro.setLevel(logging.INFO)
    # El gestor escribe en la salida estándar.
    gestor = logging.StreamHandler(sys.stdout)
    gestor.setFormatter(logging.Formatter(FORMATO))
    # El filtro se coloca en el gestor: ve todo lo que sale.
    if con_filtro:
        gestor.addFilter(FiltroDeEnmascaramiento())
    # Conecta el gestor al registro.
    registro.addHandler(gestor)
    return registro


def escenario(registro):
    """Reproduce eventos que filtran datos personales."""
    # Un correo pasado como argumento del mensaje (sustituye al %s) y una IP escrita
    # directamente en el texto.
    registro.info("Conexión de %s desde 203.0.113.7", "lea.martin@example.org")
    # Una URL de restablecimiento con su token.
    registro.warning("GET /reset?token=a1b2c3d4e5f6&lang=fr rechazado")
    # Un número de tarjeta de prueba (válido para el control de Luhn).
    registro.error("Pago rechazado para la tarjeta 4111 1111 1111 1111")
    # Una cabecera de autorización copiada.
    registro.info("Llamada API con cabecera Authorization: Bearer eyJhbGciOi.abc.def")
    # Un número de pedido de 16 cifras que NO es una tarjeta.
    registro.info("Pedido nº 1234567890123456 registrado")
    # Una excepción cuyo mensaje contiene el correo: int() intenta convertir
    # un texto en número, y falla con un ValueError (error de valor).
    try:
        int("lea.martin@example.org")
    except ValueError:
        # registro.exception escribe un mensaje ERROR seguido de la traza de la excepción.
        registro.exception("Fallo de lectura")


# Primera pasada: sin filtro.
print("--- Sin filtro ---")
escenario(fabricar_registro("sin", False))
# Segunda pasada: con filtro.
print("--- Con filtro ---")
escenario(fabricar_registro("con", True))
```

Se ejecuta `python3 antes_despues.py` en la carpeta que contiene los dos archivos. Salida obtenida (la ruta completa del archivo en las trazas se acorta a `antes_despues.py`):

```text
--- Sin filtro ---
INFO Conexión de lea.martin@example.org desde 203.0.113.7
WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr rechazado
ERROR Pago rechazado para la tarjeta 4111 1111 1111 1111
INFO Llamada API con cabecera Authorization: Bearer eyJhbGciOi.abc.def
INFO Pedido nº 1234567890123456 registrado
ERROR Fallo de lectura
Traceback (most recent call last):
  File "antes_despues.py", line 44, in escenario
    int("lea.martin@example.org")
ValueError: invalid literal for int() with base 10: 'lea.martin@example.org'
--- Con filtro ---
INFO Conexión de [ENMASCARADO] desde 203.0.113.0
WARNING GET /reset?token=[ENMASCARADO]&lang=fr rechazado
ERROR Pago rechazado para la tarjeta [ENMASCARADO]
INFO Llamada API con cabecera Authorization: Bearer [ENMASCARADO]
INFO Pedido nº 1234567890123456 registrado
ERROR Fallo de lectura
Traceback (most recent call last):
  File "antes_despues.py", line 44, in escenario
    int("[ENMASCARADO]")
ValueError: invalid literal for int() with base 10: '[ENMASCARADO]'
```

Lectura de la comparación:

| Evento | Antes | Después | Observación |
|---|---|---|---|
| Correo en un argumento | `lea.martin@example.org` | `[ENMASCARADO]` | El mensaje sigue siendo legible |
| Dirección IP | `203.0.113.7` | `203.0.113.0` | Truncado del último número, no supresión |
| Token en la URL | `token=a1b2c3d4e5f6` | `token=[ENMASCARADO]` | El parámetro `lang=fr` no se toca |
| Tarjeta bancaria | `4111 1111 1111 1111` | `[ENMASCARADO]` | Pasa el control de Luhn |
| Cabecera Bearer | `Bearer eyJhbGciOi.abc.def` | `Bearer [ENMASCARADO]` | La palabra `Bearer` queda, el token desaparece |
| Número de pedido de 16 cifras | `1234567890123456` | `1234567890123456` | No pasa el control de Luhn: se conserva, como se quiere |
| Traza de excepción | Correo visible en el mensaje de error y en la línea de código | Enmascarado en todas partes | Gracias al tratamiento de `exc_info` |

### Los límites del enmascaramiento, comprobados ejecutando el código

Este filtro es una **última red de seguridad**, nunca la primera defensa. Se han reproducido dos olvidos frecuentes. Recordatorio: en Python, los registros forman una jerarquía por su nombre, separado por puntos; `app.pago` es el **hijo** de `app`, su **padre**. Segundo punto: el parámetro `extra=` de una llamada al registro recibe un diccionario de campos adicionales (`registro.info("texto", extra={"campo": valor})`) que el formato puede después mostrar con `%(campo)s`.

```python
# trampas.py : dos lugares donde un filtro mal colocado no enmascara nada
import logging  # módulo de registro de la biblioteca estándar
import sys      # da acceso a la salida estándar (la pantalla de la terminal)

from enmascaramiento import FiltroDeEnmascaramiento  # definido en enmascaramiento.py

# El registro padre "app", con un gestor de pantalla.
padre = logging.getLogger("app")
padre.setLevel(logging.INFO)
padre.addHandler(logging.StreamHandler(sys.stdout))
# El filtro se coloca en el REGISTRO padre, no en el gestor.
padre.addFilter(FiltroDeEnmascaramiento())

# Un mensaje enviado directamente al padre: pasa por el filtro.
logging.getLogger("app").info("directo: lea@example.org")
# Un mensaje enviado a un registro HIJO ("app.pago"): el filtro se ignora.
logging.getLogger("app.pago").info("hijo: lea@example.org")

# Segundo caso: un campo añadido con el parámetro extra= (véase más arriba).
gestor = logging.StreamHandler(sys.stdout)
# El formato muestra el mensaje y luego el campo «correo» añadido con extra=.
gestor.setFormatter(logging.Formatter("%(message)s | %(correo)s"))
otro = logging.getLogger("otro")
otro.setLevel(logging.INFO)
# Esta vez el filtro sí está puesto en el gestor.
gestor.addFilter(FiltroDeEnmascaramiento())
otro.addHandler(gestor)
# El filtro enmascara el mensaje, no los campos añadidos.
otro.info("extra", extra={"correo": "lea@example.org"})
```

Salida obtenida:

```text
directo: [ENMASCARADO]
hijo: lea@example.org
extra | lea@example.org
```

| Límite | Causa | Remedio |
|---|---|---|
| El mensaje de un registro hijo no se enmascara | Un filtro colocado en un **registro** solo se aplica a los mensajes enviados **directamente** a ese registro, no a sus hijos | Colocar el filtro en cada **gestor** |
| Un campo añadido con `extra=` no se enmascara | El filtro anterior solo trata el mensaje y la traza | No poner ningún dato personal en `extra`, o ampliar el filtro |
| Un nombre o un texto libre no se reconoce | Una expresión regular reconoce una forma (correo, tarjeta), no «un nombre de persona» | No registrar nunca el texto libre |
| Un falso positivo enmascara un valor útil | Una secuencia de cifras que pasa el control de Luhn por azar se enmascara | Asumir este coste: mejor enmascarar de más que de menos |
| Un formato inesperado se escapa | Una dirección escrita de otra forma (`lea (at) example.org`) no se reconoce | Mantener una lista de patrones, revisada con regularidad |
| Una dirección IPv6 no se enmascara | El patrón solo trata IPv4; IPv6, la forma reciente de dirección IP, se escribe en hexadecimal separado por `:` (por ejemplo `2001:db8::1`) y pasa tal cual | Añadir un patrón IPv6, o no registrar la dirección |
| Un número de versión se toma por una IP | `version 1.2.3.4` se convierte en `version 1.2.3.0`: cuatro números separados por puntos se parecen a una IPv4 | Asumir este falso positivo, o restringir el patrón al contexto («desde ...») |
| Los otros gestores ven el mensaje ya enmascarado | El filtro modifica el objeto `record` compartido: los gestores llamados **después** del que lleva el filtro reciben el mensaje enmascarado, y los llamados **antes** ya lo han escrito en claro (con tres gestores, el segundo con el filtro, el primero escribe el correo en claro y los otros dos lo enmascaran) | Colocar el filtro en cada gestor: cada uno enmascara antes de escribir, sea cual sea el orden |
| El coste de cálculo | Cada mensaje es releído por varias expresiones regulares | Medir; enmascarar en el nivel del gestor, tras el filtrado por nivel |

> **Trampa:** creer que un filtro de enmascaramiento «resuelve» el problema y dejar de preocuparse por lo que se registra. El filtro se escapa de todo lo que no sabe describir.
>
> **Buena práctica:** combinar: no registrar el dato (sección anterior), enmascarar como red de seguridad, y **comprobar** el resultado buscando periódicamente filtraciones en los registros existentes (véase la lista de control más abajo).

## Tercera defensa: seudonimizar con un HMAC

A veces hace falta **seguir a una persona** en los registros («todos los errores de la misma persona esta semana») sin escribir su correo. La **seudonimización** sustituye la identidad por un seudónimo estable: la misma persona produce siempre el mismo seudónimo, pero el seudónimo no revela quién es.

El método ingenuo es un hash simple (por ejemplo SHA-256, una función que convierte un texto en una huella de tamaño fijo, véase [hashing frente a cifrado](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). Tiene un defecto: el espacio de correos plausibles es pequeño. Un atacante calcula la huella de cada candidato (un **ataque por diccionario**) y compara. El **HMAC** (*Hash-based Message Authentication Code*, descrito en [el capítulo de criptografía](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)) combina el hash con una **clave secreta**: sin la clave, el atacante no puede calcular las huellas de sus candidatos.

El código siguiente manipula **bytes** (los números de 0 a 255 en los que se almacena un texto, véase [la codificación de los textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)): un prefijo `b` delante de las comillas (`b"..."`) crea bytes, y `.encode("utf-8")` convierte un texto en bytes según la codificación UTF-8.

```python
# seudonimo.py : seudónimo estable y no reversible sin clave
import hashlib  # funciones de hash (SHA-256)
import hmac     # HMAC: un hash combinado con una clave secreta

# Clave de demostración (en bytes, gracias al prefijo b).
# En la realidad: leída de una bóveda, nunca escrita en el código.
CLAVE = b"clave-secreta-de-demostracion"
# Otra clave, para mostrar que lo cambia todo.
OTRA_CLAVE = b"otra-clave-secreta"


def seudonimo(correo, clave):
    """Devuelve un seudónimo estable: HMAC-SHA256 del correo normalizado, acortado."""
    # Normaliza: quita los espacios, pasa a minúsculas, convierte a bytes.
    mensaje = correo.strip().lower().encode("utf-8")
    # Calcula el HMAC, lo escribe en hexadecimal (0-9, a-f) y conserva 16 caracteres
    # (64 bits: bastante para que dos personas tengan el mismo seudónimo muy raramente).
    return hmac.new(clave, mensaje, hashlib.sha256).hexdigest()[:16]


def huella_simple(correo):
    """Devuelve el hash SHA-256 del correo, sin clave (no usar aquí)."""
    # Misma normalización, pero sin clave.
    return hashlib.sha256(correo.strip().lower().encode("utf-8")).hexdigest()[:16]


# Misma persona, misma clave, pero escrita de otra forma: mismo seudónimo.
print("misma persona, misma clave :", seudonimo("Lea.Martin@example.org", CLAVE))
print("misma persona, otro formato:", seudonimo(" lea.martin@example.org ", CLAVE))
# Otra persona: seudónimo distinto.
print("otra persona               :", seudonimo("hugo.durand@example.org", CLAVE))
# Misma persona, otra clave: seudónimo distinto.
print("misma persona, otra clave  :", seudonimo("lea.martin@example.org", OTRA_CLAVE))

# Una lista de candidatos que el atacante prueba uno por uno.
candidatos = ["hugo.durand@example.org", "lea.martin@example.org", "zoe.petit@example.org"]
# Los dos seudónimos que ha encontrado en un registro robado.
objetivo_simple = huella_simple("lea.martin@example.org")
objetivo_hmac = seudonimo("lea.martin@example.org", CLAVE)

print("--- Atacante sin la clave ---")
for candidato in candidatos:
    # Calcula la huella simple de cada candidato: la conoce, sin clave.
    if huella_simple(candidato) == objetivo_simple:
        print("SHA-256 simple : encontrado ->", candidato)
    # Para el HMAC debe adivinar la clave: prueba una clave inventada.
    if seudonimo(candidato, b"clave-adivinada") == objetivo_hmac:
        print("HMAC           : encontrado ->", candidato)
print("fin de las pruebas")
```

Salida obtenida:

```text
misma persona, misma clave : 0ce0c9442134de90
misma persona, otro formato: 0ce0c9442134de90
otra persona               : 5d7bc274c6fe60a6
misma persona, otra clave  : df44f04ed5137ae9
--- Atacante sin la clave ---
SHA-256 simple : encontrado -> lea.martin@example.org
fin de las pruebas
```

| Propiedad | Hash simple | HMAC con clave secreta |
|---|---|---|
| Misma persona, mismo seudónimo | Sí | Sí (mientras no cambie la clave) |
| Localizable por prueba de candidatos | **Sí** (demostración anterior) | No, sin la clave |
| Depende de un secreto que guardar | No | Sí: la clave debe guardarse como un [secreto](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| Efecto de un cambio de clave | Ninguno | Todos los seudónimos cambian: se pierde el vínculo con el historial |
| ¿Sigue siendo un dato personal? | Sí | Sí, mientras exista la clave o se puedan probar los candidatos |

El seudónimo del registro no sirve de nada por sí solo: cuando hace falta volver a encontrar a la persona (soporte quiere entender la avería de un cliente concreto), se recalcula el HMAC de su correo y se busca ese valor en los registros. Esta búsqueda de un solo sentido es precisamente lo que se quiere. Acortar la huella a 16 caracteres mantiene las líneas legibles, pero cuanto más corta es la huella, más riesgo hay de que dos personas distintas obtengan el mismo seudónimo (una **colisión**): para un número muy grande de personas, se conservan más caracteres.

> **Trampa:** usar un hash sin clave, o una clave escrita en el código y versionada, y creer que los registros son «anónimos». Quien los lee prueba la lista de todos los correos que conoce.
>
> **Buena práctica:** una clave dedicada a este uso, guardada fuera del repositorio y fuera de los registros; una comparación con [`hmac.compare_digest`](https://docs.python.org/es/3/library/hmac.html#hmac.compare_digest) al verificar un valor (esta función compara dos valores en un tiempo que no depende del lugar donde difieren, lo que impide deducir un secreto midiendo los tiempos de respuesta), y la conciencia de que un registro seudonimizado sigue sujeto a las mismas reglas que un registro en claro.

Un detalle útil: **destruir la clave** hace imposible verificar los seudónimos de un registro para todo el mundo, incluido usted. Es una herramienta de fin de vida de un registro, no un borrado garantizado: ante una solicitud de supresión, haga validar esta decisión por un jurista o un DPO.

## Cuarta defensa: retención y acceso restringido

La **retención** (vista más arriba) es el tiempo durante el que se guarda un registro antes de borrarlo. Un registro que nunca se borra es un riesgo que crece. En Python, la **rotación** (cerrar el archivo del día, abrir uno nuevo, borrar los más antiguos) la proporciona la biblioteca estándar:

```python
# rotacion.py : un archivo por día, como máximo 30 archivos antiguos conservados
import logging           # módulo de registro de la biblioteca estándar
import logging.handlers  # contiene los gestores que rotan los archivos

# A medianoche, el archivo del día se archiva y empieza uno nuevo.
# backupCount=30: como máximo 30 ARCHIVOS antiguos se conservan (y no 30 días),
# los más antiguos, más allá de ese número, se borran.
gestor = logging.handlers.TimedRotatingFileHandler(
    "app.log", when="midnight", backupCount=30, encoding="utf-8"
)
registro = logging.getLogger("tienda")
# Sin esta línea, el registro conserva el umbral por defecto (WARNING, 30):
# los mensajes INFO se ignorarían y app.log quedaría vacío.
registro.setLevel(logging.INFO)
registro.addHandler(gestor)
# Un mensaje INFO, que debe aparecer en app.log.
registro.info("Pedido 1234 validado")
```

Tras `python3 rotacion.py`, el archivo `app.log` creado en la carpeta actual contiene la línea `Pedido 1234 validado` (sin `setLevel`, se crearía pero quedaría vacío). El gestor cuenta **archivos**, no días: la rotación solo se produce en la primera escritura posterior a medianoche, y un día sin ningún mensaje no genera ningún archivo. Treinta archivos pueden cubrir, por tanto, más de treinta días. Para una retención estricta en días, se añade una limpieza por fecha (borrar los archivos más antiguos que la duración decidida), o se deja la tarea a la herramienta [logrotate](https://github.com/logrotate/logrotate), que realiza en Linux la misma rotación para los archivos de cualquier programa.

| Registro | Contenido típico | Retención, valor de ejemplo inventado | Quién debe decidirlo |
|---|---|---|---|
| Registro de depuración | Detalles técnicos, consultas | Unos días, nunca en producción de forma permanente | El equipo técnico |
| Registro de la aplicación (`INFO` y superiores) | Eventos y errores | Unas semanas | El equipo, con el jurista |
| Registro de accesos del servidor web | Direcciones IP, URL | A fijar según la finalidad (seguridad, estadísticas) | El DPO o el jurista |
| Registro de seguridad | Conexiones, fallos de autenticación | Más largo, justificado por la finalidad | El DPO o el jurista |
| Copia de seguridad | Copia completa | Duración del ciclo de copias, conocida y corta | La explotación |

Los valores anteriores son **órdenes de magnitud inventados** para ilustrar la idea de una duración por tipo de registro, no recomendaciones legales: la duración adecuada se justifica por la finalidad del registro, y algunos textos pueden obligar a conservar ciertos registros (para un alojador o un operador, por ejemplo); eso hay que hacerlo verificar.

El **acceso restringido** completa la retención: un registro que pocas personas pueden leer se filtra menos.

| Medida | En concreto | Por qué |
|---|---|---|
| Derechos sobre los archivos | El archivo solo es legible por la cuenta del servicio y un grupo de explotación (véase [permisos y archivos](/?c=langages&s=bash&p=permissions-et-fichiers)) | Otra cuenta de la máquina no puede leerlo |
| Acceso al agregador por rol | Cada equipo ve sus registros, no los de los demás | Menos personas expuestas |
| Rastro de las lecturas | Saber quién ha consultado los registros sensibles | Detectar un uso anormal |
| Sin envío a una herramienta tercera sin necesidad | Los datos salen de su infraestructura | Se pierde el control del borrado |
| Cifrado de discos y copias de seguridad | Un soporte robado es ilegible | Protege las copias «en reposo» |

## Quinta defensa: propagar el borrado a todas las copias

Cuando una persona pide el borrado de sus datos, la operación debe **llegar a cada copia** (véase el esquema de las copias más arriba). Dos errores son frecuentes: borrar solo en el referencial, y olvidar el caso de una copia momentáneamente inalcanzable.

La simulación siguiente monta un **referencial** (una base [SQLite](https://www.sqlite.org/docs.html) en memoria: SQLite es un motor de base de datos incluido con Python, que no necesita servidor, es decir, un programa aparte que funciona permanentemente), dos **satélites** (copias remotas, aquí simples diccionarios) y un **registro** (un archivo de texto). Borra a Léa en cuatro situaciones y cuenta cada vez las trazas que quedan, para Léa y para Hugo (que nunca debe verse afectado).

El código usa dos módulos de la biblioteca estándar: [`tempfile`](https://docs.python.org/es/3/library/tempfile.html), que crea una carpeta temporal que se borra al final, y `pathlib`, que representa una ruta de archivo mediante un objeto (véase [manipular archivos y carpetas](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)). Las consultas SQL usan allí un **parámetro** `?`: el valor se transmite aparte de la instrucción, nunca pegado en el texto SQL, lo que impide que un valor malicioso se ejecute como instrucción (es la [inyección SQL](/?c=securite&s=cybersecurite&p=injections-au-dela-du-sql)).

```python
# borrado.py : un borrado que alcanza referencial, satélites y registro
import sqlite3   # base de datos SQLite, incluida con Python
import tempfile  # carpeta temporal, borrada automáticamente al final
from pathlib import Path  # manipulación de rutas de archivos


class Satelite:
    """Una copia remota de las personas, ordenada por identificador externo."""

    def __init__(self, nombre):
        # El nombre del satélite, para los mensajes (self es el objeto que se está creando).
        self.nombre = nombre
        # Las copias: identificador externo -> correo.
        self.copias = {}
        # Verdadero si el satélite responde; falso simula una avería.
        self.alcanzable = True

    def suprimir(self, identificador_externo):
        """Suprime la copia; falla si el satélite es inalcanzable."""
        # Un satélite averiado no puede borrar nada: se señala un error.
        # La f delante de las comillas (cadena f) sustituye {self.nombre} por su valor.
        if not self.alcanzable:
            raise ConnectionError(f"{self.nombre} no responde")
        # pop con un valor por defecto: sin error si la copia ya no existe.
        self.copias.pop(identificador_externo, None)


def borrar_registro(ruta, patrones):
    """Reescribe el registro sin las líneas que contienen uno de los patrones."""
    # Solo hacerlo sobre un archivo en el que ningún programa esté escribiendo en ese momento:
    # reescribir un registro «vivo» puede perder o estropear líneas.
    # Lee todas las líneas del archivo.
    lineas = ruta.read_text(encoding="utf-8").splitlines()
    # Conserva las líneas que no contienen ninguno de los patrones.
    guardadas = [linea for linea in lineas if not any(pat in linea for pat in patrones)]
    # Reescribe el archivo con las líneas conservadas.
    ruta.write_text("\n".join(guardadas) + "\n", encoding="utf-8")
    # Devuelve el número de líneas borradas.
    return len(lineas) - len(guardadas)


def borrar(persona_id, correo, base, satelites, registro, completo):
    """Borra una persona; con completo=False, solo se toca el referencial."""
    # Suprime a la persona; el ? se sustituye por el valor transmitido aparte.
    base.execute("DELETE FROM personas WHERE id = ?", (persona_id,))
    # Modo «ingenuo»: aquí se para (es el error que se quiere ilustrar).
    if not completo:
        return []
    # Satélites que no se han podido alcanzar.
    pendientes = []
    for satelite in satelites:
        try:
            satelite.suprimir(persona_id)
        except ConnectionError:
            # Se anota el satélite para repetir el borrado más tarde.
            pendientes.append(satelite.nombre)
    # Borra también las líneas de registro que citan el correo.
    borrar_registro(registro, [correo])
    return pendientes


def contar(base, satelites, registro, correo):
    """Cuenta las trazas que quedan del correo en cada almacenamiento."""
    # Número de filas del referencial que contienen este correo.
    en_base = base.execute(
        "SELECT COUNT(*) FROM personas WHERE correo = ?", (correo,)
    ).fetchone()[0]
    resumen = {"referencial": en_base}
    # Número de copias del correo en cada satélite.
    for satelite in satelites:
        resumen[satelite.nombre] = sum(copia == correo for copia in satelite.copias.values())
    # Número de apariciones del correo en el archivo de registro.
    texto = registro.read_text(encoding="utf-8")
    resumen["registro"] = texto.count(correo)
    return resumen


def montar_escenario(carpeta):
    """Crea el referencial, dos satélites y un registro que citan a Léa."""
    # Base en memoria: desaparece al terminar el programa.
    base = sqlite3.connect(":memory:")
    base.execute("CREATE TABLE personas (id INTEGER PRIMARY KEY, correo TEXT)")
    # Dos personas: Léa (1) y Hugo (2).
    base.execute("INSERT INTO personas VALUES (1, 'lea.martin@example.org')")
    base.execute("INSERT INTO personas VALUES (2, 'hugo.durand@example.org')")
    # Dos satélites que han recibido una copia de las dos personas.
    satelites = [Satelite("satelite-norte"), Satelite("satelite-sur")]
    for satelite in satelites:
        satelite.copias = {1: "lea.martin@example.org", 2: "hugo.durand@example.org"}
    # Un registro de tres líneas: dos citan a Léa, una cita a Hugo.
    registro = carpeta / "app.log"
    registro.write_text(
        "INFO Conexión de lea.martin@example.org\n"
        "ERROR Fallo al enviar a lea.martin@example.org\n"
        "INFO Conexión de hugo.durand@example.org\n",
        encoding="utf-8",
    )
    return base, satelites, registro


def ejecutar(titulo, borra, completo, sur_alcanzable):
    """Monta un escenario nuevo, borra a Léa si se pide, y muestra lo que queda."""
    print(titulo)
    # Carpeta temporal: se borra al salir del bloque with.
    with tempfile.TemporaryDirectory() as nombre_carpeta:
        base, satelites, registro = montar_escenario(Path(nombre_carpeta))
        # Simula una posible avería del segundo satélite.
        satelites[1].alcanzable = sur_alcanzable
        pendientes = []
        if borra:
            pendientes = borrar(1, LEA, base, satelites, registro, completo)
        print("  pendientes :", pendientes)
        print("  Léa  :", contar(base, satelites, registro, LEA))
        print("  Hugo :", contar(base, satelites, registro, HUGO))


# Las dos direcciones que usan los escenarios.
LEA = "lea.martin@example.org"
HUGO = "hugo.durand@example.org"
# Parámetros: (título, ¿se pide el borrado?, ¿completo?, ¿satélite sur alcanzable?).
ejecutar("1. Antes de cualquier borrado", False, True, True)
ejecutar("2. Solo el referencial", True, False, True)
ejecutar("3. Completo, satélite sur caído", True, True, False)
ejecutar("4. Completo, todo alcanzable", True, True, True)
```

Salida obtenida:

```text
1. Antes de cualquier borrado
  pendientes : []
  Léa  : {'referencial': 1, 'satelite-norte': 1, 'satelite-sur': 1, 'registro': 2}
  Hugo : {'referencial': 1, 'satelite-norte': 1, 'satelite-sur': 1, 'registro': 1}
2. Solo el referencial
  pendientes : []
  Léa  : {'referencial': 0, 'satelite-norte': 1, 'satelite-sur': 1, 'registro': 2}
  Hugo : {'referencial': 1, 'satelite-norte': 1, 'satelite-sur': 1, 'registro': 1}
3. Completo, satélite sur caído
  pendientes : ['satelite-sur']
  Léa  : {'referencial': 0, 'satelite-norte': 0, 'satelite-sur': 1, 'registro': 0}
  Hugo : {'referencial': 1, 'satelite-norte': 1, 'satelite-sur': 1, 'registro': 1}
4. Completo, todo alcanzable
  pendientes : []
  Léa  : {'referencial': 0, 'satelite-norte': 0, 'satelite-sur': 0, 'registro': 0}
  Hugo : {'referencial': 1, 'satelite-norte': 1, 'satelite-sur': 1, 'registro': 1}
```

| Escenario | Lo que muestra |
|---|---|
| 1 | El estado de partida: Léa está presente cinco veces (referencial, dos satélites, dos líneas de registro) |
| 2 | El borrado «clásico» solo retira la fila del referencial: Léa sigue presente en cuatro trazas más, repartidas en tres lugares (dos satélites, el registro), y nadie lo ve |
| 3 | Un satélite caído: el borrado falla, **pero el programa lo sabe** y devuelve `['satelite-sur']`, para repetir |
| 4 | El caso completo: ni rastro de Léa, y Hugo intacto |

Lo que la simulación no cubre, y que hay que prever en la realidad:

| Caso | Dificultad | Práctica habitual |
|---|---|---|
| Satélite inalcanzable | La supresión no debe «perderse» | Una **cola** de borrados que se repite hasta que tenga éxito, con alerta si permanece demasiado tiempo sin vaciarse |
| Copias de seguridad | No se edita línea a línea una copia de seguridad | Una retención corta, más un **registro de borrados** que se repite tras cada restauración |
| Agregador de logs | El índice tiene su propia copia | Borrado por consulta en el índice, o expiración programada |
| Registro seudonimizado | La línea ya no contiene el correo | Recalcular el HMAC del correo de la persona y buscar ese valor |
| Prueba | Poder decir lo que se ha hecho | Guardar una traza de la solicitud y de sus pasos **sin** copiar en ella el dato borrado |
| Registro en curso de escritura | Reescribir `app.log` mientras el programa escribe en él puede perder o estropear líneas | Primero rotar el archivo y después limpiar el antiguo, o reescribir una copia fuera de servicio |

> **Trampa:** considerar el borrado terminado en cuanto la petición de supresión de la base tiene éxito.
>
> **Buena práctica:** escribir el borrado como un recorrido explícito de **todas** las copias, que devuelva un resumen (quién ha respondido, quién está pendiente), y probarlo con una simulación como esta.

## Ejemplo en un sistema de gestión de contenidos: el registro de Drupal

> **Ejemplo ilustrativo.** **Drupal** es un sistema de gestión de contenidos (un programa para construir y administrar un sitio web) escrito en [PHP](/?c=langages&s=php&p=php) (véase [el sitio oficial](https://www.drupal.org/docs)). Lo que sigue describe su sistema de registro; los nombres están verificados en el código fuente de Drupal 11.x. La idea general vale para cualquier aplicación.

En Drupal, un módulo escribe en el registro a través de un **canal** (un nombre que indica el origen del mensaje) con **variables de sustitución**: el texto contiene marcadores (`@mail`) y una tabla da sus valores. La ventaja es evitar pegar en el mensaje texto no controlado; los marcadores `@` y `%` escapan el contenido, `:` sirve para las direcciones. El módulo `dblog` guarda estos mensajes en la base, en una tabla llamada `watchdog`; se pueden consultar desde la pantalla de administración. Esta tabla guarda además, para cada mensaje, información de contexto (usuario, dirección de la página solicitada, dirección IP del visitante).

```php
<?php

/**
 * Ejemplo genérico: recordatorio enviado a un usuario.
 */
function ejemplo_enviar_recordatorio(int $uid, string $correo): void {
  try {
    // Simula el fallo de un envío de mensaje.
    throw new \RuntimeException('Servidor de correo inalcanzable');
  }
  catch (\Exception $e) {
    // A evitar: la dirección va al registro, en claro, con su variable.
    \Drupal::logger('ejemplo')->error('Fallo al enviar a @mail', [
      '@mail' => $correo,
    ]);
    // Mejor: un identificador interno, que ya no tiene sentido tras el borrado.
    \Drupal::logger('ejemplo')->error('Fallo al enviar el recordatorio (uid @uid)', [
      '@uid' => $uid,
    ]);
  }
}
```

| Idea a retener | Por qué |
|---|---|
| Una variable de sustitución protege la **visualización**, no la **confidencialidad** | El marcador `@mail` evita que se ejecute HTML al mostrarse, pero el valor de `$correo` se guarda igualmente con el mensaje |
| La tabla del registro guarda otros datos personales | La dirección IP y el usuario de cada mensaje son datos personales además del texto |
| El registro en la base es también una copia | Está en las copias de seguridad de la base, y a menudo en un satélite o en una exportación |
| El número de líneas conservadas se configura | Un límite y una limpieza periódica (tarea programada, véase [cron](/?c=langages&s=bash&p=automatisation-cron)) hacen de retención: hay que verificarlo en la configuración del módulo |
| El identificador interno vale más que el correo | Tras el borrado de la persona, el número ya no lleva a nada |
| No registrar `$e->getMessage()` a ciegas | El mensaje de una biblioteca puede copiar la dirección del destinatario |

## Controlar lo existente: buscar las filtraciones ya escritas

Poner el filtro en marcha protege el futuro. Para saber qué hay **ya** en los registros, se recorren con [`grep`](/?c=langages&s=bash&p=traitement-de-texte) (un comando que muestra las líneas que contienen un patrón; `-E` activa las expresiones regulares extendidas, `-o` muestra solo la parte que coincide, `-n` añade el número de línea, `-c` cuenta las líneas). Los comandos siguientes se han ejecutado sobre el extracto de registro mostrado más arriba. El primero crea el archivo `registro_ejemplo.log` con estas cuatro líneas (`cat > archivo <<'FIN'` escribe en el archivo todo lo que sigue, hasta la línea `FIN`):

```bash
# Crea registro_ejemplo.log con las cuatro líneas del extracto.
cat > registro_ejemplo.log <<'FIN'
2026-10-31 09:12:03 INFO Conexión de lea.martin@example.org desde 203.0.113.7
2026-10-31 09:12:41 WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr rechazado
2026-10-31 09:13:10 ERROR Pago rechazado para la tarjeta 4111 1111 1111 1111
2026-10-31 09:14:02 INFO Pedido 1234 validado
FIN
# Las direcciones de correo: letras, cifras o . _ + - antes de la arroba, dominio después.
grep -n -E -o '[[:alnum:]._+-]+@[[:alnum:].-]+\.[[:alpha:]]+' registro_ejemplo.log
# El número de líneas que contienen un token o una contraseña en la URL.
grep -c -E '(token|password)=' registro_ejemplo.log
# Las direcciones IPv4: cuatro números de 1 a 3 cifras separados por puntos.
grep -n -E -o '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' registro_ejemplo.log
```

Salida obtenida:

```text
1:lea.martin@example.org
1
1:203.0.113.7
```

| Pregunta que plantearse | Cómo comprobarlo |
|---|---|
| ¿Qué direcciones de correo circulan en los registros? | `grep` con el patrón anterior, sobre una muestra reciente |
| ¿Hay tokens o contraseñas en las URL? | `grep -c -E '(token\|password)=' archivo`: todo resultado distinto de cero debe tratarse |
| ¿Un satélite o una copia de seguridad contiene a una persona ya borrada? | Comparar la lista de borrados con el contenido de las copias |
| ¿Quién puede leer los registros? | Listar los derechos de los archivos y los roles del agregador |
| ¿Cuánto tiempo se conserva cada registro? | Releer la configuración de rotación y expiración, y compararla con la duración decidida |
| ¿Recibe una herramienta externa registros? | Listar los envíos automáticos (seguimiento de errores, monitorización) |

## Preguntas frecuentes

| Pregunta | Respuesta |
|---|---|
| ¿Mis registros están en formato JSON (un objeto por línea): basta con el filtro del capítulo? | No. El filtro solo lee el texto del mensaje (y la traza). Dato guardado en un campo del JSON (por ejemplo mediante `extra=`) no se toca: hay que enmascarar campo por campo, o mejor no poner nunca el dato ahí |
| ¿Se puede enmascarar en el agregador en lugar de en la aplicación? | Se pueden transformar las líneas antes de indexarlas (véase [ELK](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs)), pero el archivo original sigue en claro en la máquina y el dato ya ha viajado: enmascarar primero en el origen, y además en el agregador si hace falta |
| ¿Y las direcciones IPv6? | El patrón del capítulo solo trata IPv4 (véase la tabla de límites): hay que añadir un patrón IPv6, o no registrar la dirección |

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| Registrar el cuerpo completo de una petición «para depurar» | Contiene formularios, contraseñas, números de tarjeta |
| Dejar `DEBUG` activo en producción | Las consultas SQL y los cuerpos de petición acaban en los archivos |
| Registrar `str(exception)` sin pensar | El mensaje de una biblioteca suele copiar la entrada |
| Poner un token en la dirección (`?token=...`) | El servidor web y los intermediarios (proxies, servidores situados entre el visitante y el sitio) registran la dirección completa |
| Confiar solo en el filtro de enmascaramiento | Solo reconoce las formas descritas, no un nombre en texto libre |
| Colocar el filtro en un registro padre en lugar del gestor | Los registros hijos escapan del filtro (reproducido más arriba) |
| Poner un dato personal en `extra=` | El filtro presentado solo trata el mensaje y la traza |
| Hacer hash de un correo sin clave y llamarlo «anonimización» | Un ataque por diccionario recupera el valor (reproducido más arriba) |
| Guardar la clave de seudonimización en el código | Cualquiera que lea el repositorio puede recalcular los seudónimos |
| Borrar solo en el referencial | Los satélites, los registros y el agregador conservan a la persona (escenario 2) |
| Ignorar un satélite caído durante el borrado | La persona sigue en esa copia, sin que nadie lo sepa |
| Restaurar una copia de seguridad sin repetir los borrados | Una persona borrada vuelve a aparecer |
| Conservar los registros «por si acaso» | Cuanto más largo el plazo, mayor la exposición |
| Enviar los registros a una herramienta tercera sin haberlo decidido | Los datos salen de la infraestructura, con sus propias reglas de conservación |
| Tomar este capítulo por un dictamen jurídico | Los plazos y obligaciones dependen del país y de la actividad |

## Buenas prácticas

| Práctica | Efecto |
|---|---|
| Preguntarse en cada línea de registro si el dato es útil para el diagnóstico | La mejor protección es no escribir nada |
| Registrar un identificador interno en lugar de un correo o un nombre | Tras el borrado en la base, la línea ya no designa a nadie |
| Registrar los nombres y tamaños de los campos, no su contenido | Se diagnostica sin ver el dato |
| Nivel `INFO` o superior en producción, `DEBUG` puntual | Menos contexto copiado |
| Filtro de enmascaramiento en cada gestor | Última red para correo, token, tarjeta, IP |
| Seudonimizar con un HMAC y una clave guardada como un secreto | Seguir a una persona sin nombrarla |
| Rotación automática con una duración decidida por tipo de registro | Los registros no se acumulan indefinidamente |
| Derechos de acceso restringidos, acceso al agregador por rol | Menos personas expuestas, lecturas trazables |
| Borrado escrito como un recorrido por todas las copias, con un resumen | Ningún olvido silencioso, un satélite caído se repite |
| Registro de borrados repetido tras una restauración | Una persona borrada no vuelve |
| Buscar periódicamente filtraciones en los registros existentes | Se detecta lo que el filtro no vio |
| Hacer validar plazos y obligaciones por un jurista o un DPO | El capítulo explica principios, no decide por usted |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un **dato personal** es toda información que permite llegar a una persona: correo, dirección IP, identificador interno, texto libre. Entra en un registro a través de mensajes útiles para el diagnóstico que copian demasiado contexto: petición, traza, URL con token, cuerpo de petición, consulta SQL, registro de accesos. Cada **copia** (satélite, copia de seguridad, agregador, herramienta externa) es una copia más que proteger y borrar. El RGPD fija, a grandes rasgos, la **minimización**, una **conservación limitada**, la **seguridad** de los datos y un **derecho de supresión** no absoluto; el texto oficial, un jurista o un DPO deciden los detalles. Defensas, en este orden: **no registrar**, **niveles** de registro, **enmascaramiento** con filtro (última red), **seudonimización** con HMAC y clave secreta (el seudónimo sigue siendo un dato personal mientras el vínculo sea rehacible), **retención** limitada, **acceso restringido**, **borrado propagado** a todas las copias con un resumen. |
| **Trampas que evitar** | Cuerpo de petición registrado; `DEBUG` dejado en producción; `str(exception)` copiado; token en la URL; filtro solo para tranquilizarse; filtro puesto en un registro padre; dato en `extra=`; hash sin clave tomado por anonimización; clave versionada con el código; borrado limitado al referencial; satélite caído ignorado; copia de seguridad restaurada sin repetir los borrados; registros guardados «por si acaso»; envío automático a una herramienta tercera; este capítulo tomado por un dictamen jurídico. |
| **Buenas prácticas** | Registrar un identificador interno, no el correo; registrar los nombres de los campos, no sus valores; `INFO` por defecto; un filtro de enmascaramiento en cada gestor; HMAC con clave guardada como un secreto; rotación automática y duración decidida por tipo de registro; derechos de acceso estrictos; borrado escrito como un recorrido por todas las copias, con cola de repetición y registro de borrados repetido tras una restauración; búsqueda periódica de filtraciones en lo existente; plazos y obligaciones validados por un jurista o un DPO. |
