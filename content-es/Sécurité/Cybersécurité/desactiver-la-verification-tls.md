---
order: 23
---

# Desactivar la verificación TLS: lo que la opción realmente desactiva (01/11/2026)

Cuando un programa llama a una dirección que empieza por `https://`, él es el **cliente** (quien pide) y la máquina llamada es el **servidor** (la que responde), como se explica en [los intercambios de datos: API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). **HTTPS** es HTTP transportado en una conexión protegida por **TLS** (*Transport Layer Security*), el protocolo que cifra la conversación y permite al cliente **verificar la identidad del servidor** gracias a un **certificado** (un documento de identidad digital que presenta el servidor). Casi todas las herramientas ofrecen una opción para **saltarse esta verificación**: `curl -k` (el [programa curl](https://curl.se/docs/manpage.html), que envía una petición a una dirección desde la terminal), `verify=False` (en Python) o `verify => FALSE` (en PHP), por ejemplo. Hace desaparecer el error que bloquea, en una sola línea, y precisamente eso la vuelve peligrosa: el programa funciona, y nada garantiza ya con quién habla.

Este capítulo explica lo que controla la verificación, por qué se tiende a desactivarla, lo que expone (con un laboratorio que se ejecuta en su propia máquina y que no toca ninguna red, salvo una prueba facultativa con un sitio público señalada en su lugar), y después las soluciones que resuelven la causa real. Complementa [la criptografía aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (que explica el cifrado y fabrica un certificado autofirmado) y la parte [ataques de red](/?c=langages&s=php&p=securite#ataques-de-red) del capítulo de PHP sobre seguridad (que presenta el ataque del hombre en medio en una definición); no los repite.

| Parte | Pregunta |
|---|---|
| [Lo que garantiza la verificación](#lo-que-garantiza-la-verificacion-tls) | ¿Qué controla exactamente el cliente, y qué hace el cifrado por sí solo? |
| [Por qué se tiende a desactivarla](#por-que-se-tiende-a-desactivarla) | ¿Qué errores llevan a escribir `verify=False`? |
| [Lo que expone la desactivación](#lo-que-expone-la-desactivacion) | ¿Qué puede hacer un tercero colocado entre el cliente y el servidor? |
| [El laboratorio local](#laboratorio-local-ver-la-desactivacion-en-accion) | ¿Cómo verlo con sus propios ojos, sin peligro? |
| [Las opciones equivalentes](#la-misma-desactivacion-en-cada-herramienta) | ¿Cómo se escribe la desactivación en cada herramienta? |
| [Un ejemplo en un framework PHP](#un-ejemplo-en-un-framework-php-drupal-y-guzzle) | ¿Cómo se ve en un proyecto real? |
| [Las buenas soluciones](#las-buenas-soluciones) | ¿Qué hacer en su lugar, y cómo detectar el olvido? |

## Lo que garantiza la verificación TLS

TLS aporta **tres garantías**, de las cuales solo una la retira la opción que desactiva la verificación, y la confusión entre ellas es la fuente del peligro:

| Garantía | Pregunta a la que responde | Quién la aporta |
|---|---|---|
| **Confidencialidad** | ¿Puede alguien que escucha el cable leer? | El cifrado de la conversación |
| **Integridad** | ¿Puede alguien modificar un mensaje por el camino sin que se note? | El cifrado autenticado (un control de alteración adjunto a cada mensaje) |
| **Autenticidad del servidor** | ¿El servidor que tengo delante es el que creo? | **La verificación del certificado** |

El cifrado por sí solo protege frente a un curioso que observa desde fuera. No dice nada sobre el interlocutor: se puede cifrar perfectamente una conversación con un desconocido. Imagen: una puerta blindada que da al pasillo (el cifrado) no sirve de nada si la persona a la que se ha dejado entrar no es la que se esperaba. La verificación del certificado es el control del documento de identidad en la puerta.

### Lo que ocurre al conectarse

Dos términos del esquema: la **clave pública** es la mitad no secreta de un par de claves (la otra mitad, la clave privada, nunca sale del servidor), y la **clave de sesión** es una clave temporal, creada solo para esta conversación, que sirve para cifrar los mensajes (el capítulo [criptografía aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) detalla las claves).

```
 CLIENTE                                     SERVIDOR
   |  1. «Hola, quiero hablar con api.ejemplo.org»     |
   |-------------------------------------------------->|
   |  2. Aquí tienes mi certificado y mi clave pública |
   |<--------------------------------------------------|
   |                                                   |
   |  3. EL CLIENTE VERIFICA (es lo que se desactiva): |
   |     a. la firma sube hasta una autoridad conocida |
   |     b. el nombre del certificado = el pedido      |
   |     c. el certificado está en su periodo de       |
   |        validez                                    |
   |                                                   |
   |  4. Si todo está bien: clave de sesión compartida |
   |<=================================================>|
   |  5. Conversación cifrada con esta clave           |
```

Una **autoridad de certificación** (*certificate authority*, CA) es un organismo de confianza que firma los certificados después de verificar la identidad del solicitante (el capítulo [criptografía aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#el-certificado-tls-autofirmado) da la definición completa, con la clave pública y la clave privada). Cada sistema operativo (o cada herramienta) incluye una lista de CA en la que cree sin comprobarlo: es el **almacén de confianza** (*trust store*). Un certificado se acepta si su firma **sube**, de firma en firma, hasta una CA de ese almacén: esa cadena de firmas es la **cadena de certificados**.

| Control del cliente | Verifica que... | Mensaje típico cuando falla |
|---|---|---|
| **Cadena** | La firma del certificado sube hasta una CA del almacén de confianza | `self-signed certificate`; `unable to get local issuer certificate` (mensaje de OpenSSL, no reproducido aquí) |
| **Nombre** | El nombre pedido (`api.ejemplo.org`) figura en la lista de nombres del certificado (el campo **SAN**, *Subject Alternative Name*) | `no alternative certificate subject name matches target host name` |
| **Fechas** | La fecha de hoy está entre la fecha de inicio y la fecha de fin del certificado | `certificate has expired` |
| **Clave** | El servidor posee realmente la clave privada ligada al certificado (lo demuestra durante el intercambio) | Fallo de la conexión (el mensaje varía según la herramienta) |

Un certificado sirve para ligar **un nombre** a **una clave pública**, y la CA responde de ese vínculo. Si el cliente no controla la cadena, cualquiera puede fabricar un certificado a nombre de `api.ejemplo.org`; si no controla el nombre, cualquier certificado válido (el de otro sitio) se acepta en su lugar. Un quinto control, la **revocación** (un certificado anulado antes de su fecha de fin), depende del cliente y no se detalla aquí.

## Por qué se tiende a desactivarla

La opción no se escribe por mala intención. Aparece casi siempre en el momento en que un error bloquea el trabajo y la causa real requiere tiempo:

| Situación | Lo que se ve | Causa real | Por qué tienta la desactivación |
|---|---|---|---|
| Servidor de desarrollo con un certificado **autofirmado** (fabricado por uno mismo) | `self-signed certificate` | El certificado no sube a ninguna CA del almacén | «Es solo mi equipo, no importa» |
| Certificado **caducado** en un servidor de pruebas o interno | `certificate has expired` | Nadie renovó el certificado | La renovación depende de otro servicio, y la entrega es mañana |
| Llamada por una **dirección IP** o un alias | `no alternative certificate subject name matches...` | El certificado está emitido para otro nombre | El nombre correcto todavía no está en el DNS (el directorio que traduce un nombre en dirección) |
| Red de empresa con un **proxy** (un intermediario por el que pasan todas las llamadas) que inspecciona el tráfico | `certificate verify failed` | El proxy vuelve a emitir sus propios certificados, que la herramienta no conoce (ver [la nota sobre el proxy TLS](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server#nota-un-proxy-corporativo-puede-ralentizar-composer-sin-bloquearlo)) | Todas las llamadas fallan de golpe |
| Almacén de confianza demasiado antiguo (sistema viejo, contenedor mínimo) | `unable to get local issuer certificate` | La CA que firmó el certificado no está en la lista | El sitio funciona en el navegador, no en el script |

En cada uno de estos casos, la opción que desactiva la verificación **suprime el control** en lugar de **corregir la causa**. El error desaparece, como una luz de alarma que se desconectaría en lugar de reparar el motor. Y la opción, una vez escrita, tiene la mala costumbre de quedarse: se copia en otro archivo, se aprueba en la revisión sin comentario y se entrega. La prueba que pasa en desarrollo pasa también en producción, incluso cuando no debería.

## Lo que expone la desactivación

El escenario que hay que temer se llama **ataque del hombre en medio** (*man-in-the-middle*, MITM). Un tercero se interpone entre el cliente y el servidor: habla con el cliente haciéndose pasar por el servidor, y con el servidor verdadero haciéndose pasar por el cliente.

```
 Verificación ACTIVA
   CLIENTE ----> ATACANTE        El certificado del atacante no sube a ninguna CA
                   X             conocida: el cliente RECHAZA, la conexión se detiene.

 Verificación DESACTIVADA
   CLIENTE ====== ATACANTE ====== SERVIDOR
      conversación 1     conversación 2
      cifrada con la     cifrada con la
      clave del atacante clave del servidor real

   El atacante descifra la conversación 1, lee o modifica, y cifra de nuevo la conversación 2.
```

El cliente cree hablar con `api.ejemplo.org`: la conversación está cifrada, pero **con el atacante**. ¿Quién puede ponerse en medio? Más gente de la que se imagina:

| Posición del atacante | Cómo se sitúa entre los dos |
|---|---|
| Red Wi-Fi pública o compartida | Controla el punto de acceso, o se hace pasar por la pasarela (el equipo por el que sale todo el tráfico de la red) |
| Nombre de dominio desviado | Corrompe la respuesta del DNS para que el nombre apunte a su máquina |
| Equipo comprometido en el trayecto | Un router (el equipo que dirige el tráfico entre redes), un proxy, una máquina de una red de alojamiento compartido |
| Proveedor de acceso o alojamiento comprometido | Ve pasar el tráfico y puede redirigirlo |

Sin desactivación, el atacante tendría que presentar un certificado válido para `api.ejemplo.org`, firmado por una CA de confianza: es muy difícil de conseguir. **Con la desactivación, basta un certificado fabricado en tres segundos.** La dificultad del ataque baja a cero.

Lo que puede hacer depende de lo que el programa envía y recibe:

| Lo que circula | Lo que hace el atacante con ello |
|---|---|
| Un **token** (un texto secreto que demuestra la identidad de quien llama) o una clave de API en la **cabecera** `Authorization` (una línea de información que acompaña a la petición) | Lo copia y llama a la API en su lugar (ver [autenticar una API](/?c=securite&s=cybersecurite&p=securite-api-web#autenticar-una-api-clave-o-token-segun-el-cliente)) |
| Una contraseña, datos personales | Los lee |
| Una respuesta (saldo, estado de pago, configuración) | La sustituye por una falsa: «pago aceptado», «usuario autorizado» |
| Un archivo descargado (actualización, dependencia, script) | Lo sustituye por una versión trampa, que se ejecutará en su máquina |
| Una llamada de servidor a servidor ([webhook](/?c=securite&s=cybersecurite&p=securite-des-webhooks), sincronización entre dos aplicaciones, llamada a una API de un socio) | Todo lo anterior, sin que ningún humano vea nunca una advertencia |

El último caso es el más insidioso: un **navegador** muestra una gran pantalla roja ante un certificado sospechoso, y una persona puede renunciar. Un **programa** que tiene la opción desactivada no muestra nada y nunca renuncia. El tema de las peticiones salientes de un servidor es también el del capítulo [SSRF: eludir la lista blanca](/?c=securite&s=cybersecurite&p=ssrf-en-detail): un servidor que llama a otros servidores es un objetivo, y la verificación TLS es una de sus protecciones.

> **Para recordar:** la desactivación no anula el cifrado. La conversación sigue cifrada. Lo que anula es la **prueba de la identidad del interlocutor**, es decir, lo único que garantiza que el cifrado lleva al destinatario correcto.

## Laboratorio local: ver la desactivación en acción

Todo lo que sigue ocurre **en su máquina**, en la dirección `127.0.0.1` (la dirección de la propia máquina, también llamada `localhost`), en un **puerto** libre (el número que distingue varios servicios en la misma máquina; aquí 7251, muy por encima de los puertos habituales). Ningún paquete sale hacia Internet. El laboratorio necesita una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), un [editor de texto](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide) para crear los archivos, y cuatro herramientas: [`openssl`](https://docs.openssl.org/3.0/man1/openssl/) (el programa de referencia para fabricar certificados), `python3` (el lenguaje [Python](/?c=langages&s=python&p=python)), [`curl`](https://curl.se/docs/manpage.html) (el programa que envía una petición a una dirección, visto más arriba) y `node` (el entorno que ejecuta [JavaScript](/?c=langages&s=javascript&p=javascript) fuera del navegador). La biblioteca Python `requests` se instala con `pip install requests` (`pip` es el instalador de paquetes de Python, ver [los módulos y entornos](/?c=langages&s=python&p=modules-et-environnements)). Las líneas de `PHP` (el lenguaje [PHP](/?c=langages&s=php&p=php)) son opcionales. Los mensajes y las salidas de este capítulo se han obtenido con curl 8.5, Python 3.12 (requests 2.31), Node.js 22, PHP 8.3 y OpenSSL 3.0: según las versiones, la formulación de un mensaje varía un poco.

El plan, en tres tiempos:

| Tiempo | Servidor en el puerto 7251 | Lo que se muestra |
|---|---|---|
| 1 | El servidor **A**, con el certificado A | El error de verificación, y después las opciones que lo «arreglan» |
| 2 | El servidor **B**, con **otro** certificado B, en el mismo lugar | El cliente con la verificación desactivada no nota nada |
| 3 | A y después B, con el fijado (*pinning*) | Un control más estricto que la simple confianza |

El servidor B hace aquí el papel del atacante: ha ocupado el lugar de A. En una red real, sería el DNS corrompido, el Wi-Fi trampa o el proxy los que llevarían al cliente hasta él; el resultado del lado del cliente es el mismo.

### Paso 1: dos certificados autofirmados

```bash
# crea una carpeta de trabajo desechable y se sitúa dentro
# && : el 2.º comando solo se ejecuta si el 1.º ha tenido éxito
mkdir labo-tls && cd labo-tls
# bucle: dos vueltas, con la variable n valiendo a y luego b (un certificado por vuelta)
# $n da el valor de n : clave-$n.pem pasa a ser clave-a.pem, y luego clave-b.pem
for n in a b; do
  # req -x509 fabrica un certificado autofirmado ; -nodes deja la clave privada en claro
  # -days 30 : válido 30 días
  # -newkey rsa:2048 : crea a la vez un par de claves RSA de 2048 bits
  # -keyout / -out : los archivos donde escribir la clave privada / el certificado
  # -subj "/CN=localhost" : CN (nombre común) = el nombre del titular del certificado
  # -addext : añade la lista de nombres válidos (SAN): localhost, 127.0.0.1
  # \ al final de la línea : el comando continúa en la línea siguiente
  # 2>/dev/null : descarta los mensajes de error (el canal 2) que muestra openssl,
  # aquí puntos de progreso (/dev/null es un archivo papelera)
  openssl req -x509 -nodes -days 30 -newkey rsa:2048 -keyout clave-$n.pem -out cert-$n.pem \
    -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null
done
```

Los comandos `mkdir`, `cd`, `&&`, `>` y `2>/dev/null` se explican en [los comandos básicos](/?c=langages&s=bash&p=commandes-de-base) y [las redirecciones](/?c=langages&s=bash&p=redirections-et-pipes). Las opciones de `openssl req` se detallan en [el capítulo sobre el certificado autofirmado](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#el-certificado-tls-autofirmado) y en la [documentación de OpenSSL](https://docs.openssl.org/3.0/man1/openssl-req/). Los dos certificados llevan **el mismo nombre** (`localhost`) y la misma duración, pero cada uno tiene **su propio par de claves**: son indistinguibles a simple vista, y sin embargo el cliente debe poder diferenciarlos.

### Paso 2: un servidor HTTPS sencillo

Los archivos de este laboratorio (`servidor.py`, luego `cliente.py`, `cliente.mjs`, `cliente-ssl.py` y `cliente.php`) se crean con el editor de texto: se pega en él el contenido del bloque y se guarda con el nombre indicado, en esta misma carpeta `labo-tls`. El archivo `servidor.py` arranca un servidor HTTPS que responde «respuesta del servidor» seguido de su nombre, y que anota la cabecera `Authorization` recibida (la cabecera que sirve para enviar un token de identificación, vista más arriba).

```python
# ssl : el módulo de Python que añade TLS a una conexión
import ssl
# sys : lectura de los argumentos de la línea de comandos
import sys
# http.server : un servidor web mínimo que viene con Python
from http.server import BaseHTTPRequestHandler, HTTPServer

# argumentos: el puerto, el certificado, la clave y el nombre del servidor
# a, b = x, y : asignación múltiple (a recibe x y b recibe y, ver las tuplas)
# int convierte el texto del puerto en número; sys.argv[1] es el primer argumento dado
puerto, certificado, clave, nombre = int(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]


# una clase agrupa funciones; esta describe cómo responder a las peticiones
class Gestor(BaseHTTPRequestHandler):
    # do_GET se llama con cada petición GET recibida; self designa la petición en curso
    def do_GET(self):
        # muestra la cabecera Authorization recibida
        # (la f delante del texto inserta en él las {variables})
        # flush=True : escribe enseguida en el registro, sin esperar a que se llene un búfer
        print(f"[{nombre}] Authorization:", self.headers.get("Authorization"), flush=True)
        # el texto devuelto (\n: salto de línea); encode lo convierte en bytes
        cuerpo = f"respuesta del servidor {nombre}\n".encode()
        # código 200: la petición ha tenido éxito
        self.send_response(200)
        # anuncia el tamaño de la respuesta en bytes
        self.send_header("Content-Length", str(len(cuerpo)))
        # termina las cabeceras
        self.end_headers()
        # envía el cuerpo de la respuesta
        self.wfile.write(cuerpo)

    # sustituye el registro por defecto por nada, para mantener una salida legible
    # (*args acepta cualesquiera argumentos; pass: no hace nada)
    def log_message(self, *args):
        pass


# crea el servidor: escucha en 127.0.0.1 (solo esta máquina) en el puerto dado
servidor = HTTPServer(("127.0.0.1", puerto), Gestor)
# contexto TLS del lado del servidor: lleva el certificado y la clave privada
contexto = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
# carga el certificado presentado a los clientes y la clave privada que le corresponde
contexto.load_cert_chain(certificado, clave)
# envuelve el socket (el punto de entrada de red) en TLS: el servidor habla HTTPS
# server_side=True : este socket es el de un servidor (que presenta un certificado)
servidor.socket = contexto.wrap_socket(servidor.socket, server_side=True)
# atiende peticiones hasta que se detiene el programa
servidor.serve_forever()
```

La asignación múltiple de la línea `puerto, certificado, clave, nombre = ...` es el desempaquetado de tuplas visto en [las listas y las tuplas](/?c=langages&s=python&p=listes-et-tuples#desempaquetado-unpacking). El comando de arranque recibe cuatro argumentos: el puerto, el certificado, la clave y el nombre del servidor.

```bash
# lanza el servidor A en segundo plano (&), limitado a 120 segundos con timeout
# > registro-a.txt : lo que muestra el servidor va a ese archivo
timeout 120 python3 servidor.py 7251 cert-a.pem clave-a.pem A > registro-a.txt &
# $! : número del último proceso lanzado en segundo plano; lo guardamos para detenerlo
PID_A=$!
# espera un segundo a que el servidor esté listo para escuchar
sleep 1
```

`timeout` detiene el servidor por sí solo al cabo de 120 segundos, incluso si se olvida hacerlo (volver a lanzar los comandos del paso si se supera el plazo, ver [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout#detener-un-comando-demasiado-largo-timeout)). El `&` al final de la línea devuelve el control a la terminal dejando el servidor en marcha (ver [la gestión de procesos](/?c=langages&s=bash&p=gestion-des-processus)), y `>` envía lo que muestra el servidor a un archivo (ver [las redirecciones](/?c=langages&s=bash&p=redirections-et-pipes)). El código Python usa [las clases](/?c=langages&s=python&p=poo) y [la gestión de errores](/?c=langages&s=python&p=gestion-des-erreurs).

### Paso 3: la verificación falla

```bash
# -s : sin barra de progreso ; -S : pero los errores siguen mostrándose
curl -sS https://localhost:7251/
# $? : el código de salida del último comando lanzado (aquí curl)
echo $?
```

```
curl: (60) SSL certificate problem: self-signed certificate
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
60
```

Es exactamente el comportamiento correcto: el certificado A es **autofirmado**, no sube a ninguna CA del almacén de confianza, y `curl` lo rechaza. Termina con el **código de salida** 60, el último número que muestra `echo $?` (un número que todo programa devuelve al acabar; 0 significa «éxito», cualquier otro valor «fallo»). Las demás herramientas dicen lo mismo con sus palabras:

| Herramienta | Mensaje obtenido |
|---|---|
| `curl` | `curl: (60) SSL certificate problem: self-signed certificate` |
| Python `requests` | `certificate verify failed: self-signed certificate` (el cliente Python lanza el error `CERTIFICATE_VERIFY_FAILED`) |
| Node.js (`fetch`) | `DEPTH_ZERO_SELF_SIGNED_CERT` («certificado autofirmado, profundidad cero»: la cadena solo tiene un eslabón) |
| PHP (extensión cURL) | `SSL certificate problem: self-signed certificate` |

### Paso 4: la opción «arregla» el error

```bash
# -k (o --insecure) : curl ya no verifica nada
curl -sS -k https://localhost:7251/
```

```
respuesta del servidor A
```

El error ha desaparecido, la respuesta llega. Estas son las mismas pruebas con las demás herramientas. El script Python, guardado en `cliente.py` (el módulo `re` de expresiones regulares se presenta en [las regex en Python](/?c=langages&s=python&p=regex-en-python)):

```python
# re : las expresiones regulares, que buscan un patrón en un texto
import re
# sys : lectura de los argumentos de la línea de comandos
import sys
# requests : la biblioteca de Python más usada para llamar a una dirección web
import requests

# primer argumento : la dirección a la que llamar
direccion = sys.argv[1]
# 2.º argumento : "no" da False (verificación desactivada), si no el archivo de confianza
verificacion = False if sys.argv[2] == "no" else sys.argv[2]
# try : intenta el bloque ; si falla con el error de except, se ejecuta except
try:
    # verify=False desactiva la verificación ; verify="fichier.pem" la hace con ese archivo
    # de confianza, que REEMPLAZA la lista habitual
    # timeout=5 : abandona la llamada tras 5 segundos sin respuesta
    respuesta = requests.get(direccion, verify=verificacion, timeout=5)
    # muestra el texto recibido
    print(respuesta.text.strip())
except requests.exceptions.SSLError as error:
    # la verificación ha fallado : busca el patrón, que sigue a «certificate verify failed»
    # [^(]* : todos los caracteres que siguen, hasta el primer paréntesis (excluido)
    # re.search devuelve el primer lugar del texto que coincide con el patrón
    motivo = re.search(r"certificate verify failed: [^(]*", str(error))
    # .group(0) : el texto encontrado completo ; .strip() quita los espacios del final
    print("RECHAZADO:", motivo.group(0).strip())
```

```bash
# primer argumento : la dirección ; segundo argumento : «no» (desactivar la verificación)
python3 cliente.py https://localhost:7251/ no
```

```
.../urllib3/connectionpool.py:1112: InsecureRequestWarning: Unverified HTTPS request [...]
  warnings.warn(
respuesta del servidor A
```

(Las líneas demasiado largas se cortan aquí con `[...]`; la ruta de la primera depende de su instalación. `urllib3` es la biblioteca HTTP sobre la que se apoya `requests`, ver su [documentación](https://urllib3.readthedocs.io/en/stable/).) Python **avisa**: es una advertencia, no un error. Se cuela en la salida de error de un programa, donde se pierde con facilidad, y algunos proyectos la silencian (ver [las trampas](#las-trampas)). El script JavaScript, guardado en `cliente.mjs` (la extensión `.mjs` indica a Node.js que el archivo es un módulo, lo que permite usar `await` fuera de una función; `fetch` requiere Node.js 18 o más reciente, `node --version` muestra la versión instalada; `await` se presenta en [el JavaScript asíncrono](/?c=langages&s=javascript&p=asynchrone)):

```javascript
// process.argv : el array de los argumentos de la línea de comandos
// [0] es node, [1] es el script, así que [2] es el primer argumento dado por el usuario
// const declara una variable que ya no cambiará
// try/catch : intenta el bloque try ; si hay un error, se ejecuta el bloque catch
// await : espera el resultado de una operación asíncrona antes de continuar
const direccion = process.argv[2];
try {
  // fetch llama a la dirección ; la verificación TLS la hace Node.js
  const respuesta = await fetch(direccion);
  // muestra el texto recibido
  console.log((await respuesta.text()).trim());
} catch (error) {
  // error : muestra el código de la causa si existe (?.), si no el mensaje (??)
  console.log("RECHAZADO:", error.cause?.code ?? error.message);
}
```

Una particularidad de Node.js: la desactivación se ajusta con una **variable de entorno** (un valor que la terminal pasa al programa que lanza, ver [las variables de entorno](/?c=langages&s=bash&p=variables-denvironnement)), así que **sin tocar el código**.

```bash
# verificación activa (por defecto) : el programa rechaza
node cliente.mjs https://localhost:7251/
# la variable NODE_TLS_REJECT_UNAUTHORIZED=0 desactiva la verificación de TODO el proceso
NODE_TLS_REJECT_UNAUTHORIZED=0 node cliente.mjs https://localhost:7251/
```

```
RECHAZADO: DEPTH_ZERO_SELF_SIGNED_CERT
(node:169057) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment [...]
(Use `node --trace-warnings ...` to show where the warning was created)
respuesta del servidor A
```

Esta variable es la más peligrosa de las opciones de este capítulo: basta una sola línea en un archivo de configuración, un script de arranque o una definición de contenedor para desactivar la verificación en **cada** llamada del programa, incluidas las de bibliotecas de terceros que no escribimos nosotros.

### La forma correcta de arreglar este error: confiar en ESTE certificado

El certificado A es conocido: somos nosotros quienes lo hemos fabricado. En lugar de desactivarlo todo, le decimos al cliente «confía en este certificado»:

```bash
# --cacert : da el archivo de certificados de confianza, solo para esta llamada
curl -sS --cacert cert-a.pem https://localhost:7251/
# Python : el 2.º argumento es el archivo de confianza (verify="cert-a.pem")
python3 cliente.py https://localhost:7251/ cert-a.pem
# Node.js : NODE_EXTRA_CA_CERTS añade certificados de confianza sin quitar ninguno
NODE_EXTRA_CA_CERTS=cert-a.pem node cliente.mjs https://localhost:7251/
```

```
respuesta del servidor A
respuesta del servidor A
respuesta del servidor A
```

Las tres llamadas funcionan **con** la verificación activa. La diferencia con `-k` no se ve aquí, porque es el servidor A el que responde. Se verá en el paso siguiente.

#### Añadir o reemplazar: lo que hace cada opción de confianza

Estas opciones no se comportan todas igual. Algunas **añaden** el certificado indicado a la lista de confianza habitual (la de las CA públicas), y otras la **reemplazan**: con ellas, un sitio público como `https://example.com/` sería rechazado, porque su CA ya no está en la lista. Prueba facultativa (contacta con este sitio público real, el único de este capítulo) con el servidor A siempre en marcha:

```bash
# curl : -o /dev/null descarta la página, -w '%{http_code}\n' muestra solo el código HTTP
curl -sS -o /dev/null -w '%{http_code}\n' --cacert cert-a.pem https://example.com/
# Python : el archivo de confianza es solo cert-a.pem
python3 cliente.py https://example.com/ cert-a.pem
# Node.js : NODE_EXTRA_CA_CERTS añade cert-a.pem a las CA públicas
# head -c 15 solo conserva los 15 primeros caracteres de la página
NODE_EXTRA_CA_CERTS=cert-a.pem node cliente.mjs https://example.com/ | head -c 15; echo
```

```
200
RECHAZADO: certificate verify failed: unable to get local issuer certificate
<!doctype html>
```

| Herramienta | Opción | Efecto sobre la lista de confianza | Resultado en `https://example.com/` |
|---|---|---|---|
| Python `requests` | `verify="fichier.pem"` (o la variable `REQUESTS_CA_BUNDLE`) | **Reemplaza** la lista | Rechazado |
| Python (módulo `ssl`) | `create_default_context(cafile="fichier.pem")` | **Reemplaza** la lista | Rechazado |
| Node.js (código) | `ca: contenido del certificado` | **Reemplaza** la lista | Rechazado (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`) |
| Node.js (variable) | `NODE_EXTRA_CA_CERTS=fichier.pem` | **Añade** a la lista | Aceptado |
| `curl` | `--cacert fichier.pem` | Reemplaza el **archivo** de CA por defecto; pero el **directorio** de CA del sistema, que también lee el curl de Debian y Ubuntu, sigue usándose | Aceptado aquí; rechazado con además `--capath` hacia un directorio vacío (`unable to get local issuer certificate`) |
| PHP (extensión cURL) | `CURLOPT_CAINFO` | Igual que `curl`, cuya biblioteca reutiliza | Aceptado aquí |

Lo que hay que retener: solo `NODE_EXTRA_CA_CERTS` **añade** de verdad. Para las demás, poner en el archivo solo la CA de su servidor de prueba **corta el acceso a los sitios públicos**; para conservar los dos, hay que copiar también en él las CA públicas (el archivo del sistema, a menudo `/etc/ssl/certs/ca-certificates.crt` en Debian y Ubuntu). El comportamiento de `curl` depende de cómo se compiló: no cuente con el directorio del sistema.

### Paso 5: otro servidor ocupa el lugar del primero

Detenemos A y arrancamos B en el **mismo puerto**, con **el otro certificado** (B). Desde el punto de vista del cliente, la misma dirección `https://localhost:7251/` responde, pero ya no es la misma máquina.

```bash
# detiene el servidor A (wait espera a que termine, sleep deja que el puerto se libere)
kill $PID_A; wait $PID_A 2>/dev/null; sleep 1
# arranca el servidor B : mismo puerto, certificado y clave diferentes
timeout 120 python3 servidor.py 7251 cert-b.pem clave-b.pem B > registro-b.txt &
# guarda su número de proceso y espera a que escuche
PID_B=$!
sleep 1
```

El cliente cuya verificación está **desactivada**:

```bash
# -H añade una cabecera : aquí un token de API inventado, como enviaría un cliente real
curl -sS -k -H "Authorization: Bearer token-secreto-123" https://localhost:7251/
# código de salida de curl : 0, todo ha salido bien
echo $?
# Python, verificación desactivada
python3 cliente.py https://localhost:7251/ no
```

```
respuesta del servidor B
0
.../urllib3/connectionpool.py:1112: InsecureRequestWarning: Unverified HTTPS request [...]
  warnings.warn(
respuesta del servidor B
```

El cliente **no se entera de nada**: la respuesta está bien formada y el código de salida vale 0 (legible con `echo $?`, como en el paso 3). La única huella está en el registro del servidor B, que el cliente nunca verá:

```bash
# muestra lo que ha anotado el servidor B
cat registro-b.txt
```

```
[B] Authorization: Bearer token-secreto-123
[B] Authorization: None
```

El servidor B ha **leído el token en claro**. Podría igualmente devolver una respuesta falsificada. La primera línea viene de `curl`, la segunda de Python (que no enviaba cabecera `Authorization`).

El cliente que **conoce el certificado correcto** (el de A):

```bash
# verificación activa, con la confianza dada al certificado A
curl -sS --cacert cert-a.pem https://localhost:7251/
# lo mismo en Python
python3 cliente.py https://localhost:7251/ cert-a.pem
# lo mismo en Node.js
NODE_EXTRA_CA_CERTS=cert-a.pem node cliente.mjs https://localhost:7251/
```

```
curl: (60) SSL certificate problem: self-signed certificate
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
RECHAZADO: certificate verify failed: self-signed certificate
RECHAZADO: DEPTH_ZERO_SELF_SIGNED_CERT
```

Las tres herramientas **rechazan**: el certificado que presenta B no es aquel en el que confían. Este es el balance del laboratorio:

| Cliente | Servidor A (legítimo) | Servidor B (impostor) |
|---|---|---|
| Verificación **desactivada** (`-k`, `verify=False`) | Respuesta | **Respuesta también: B ha leído el token** |
| Verificación **sobre el certificado A** (`--cacert`, `verify="cert-a.pem"`) | Respuesta | **Rechazo** |

Fíjese en que el certificado de B tiene **el mismo nombre** `localhost` que el de A, y que también es válido en el tiempo: un control del nombre no lo habría detenido. Es la **cadena de confianza** (saber en quién se confía) la que protege aquí.

### Paso 6: fijar una huella

Confiar en un certificado concreto es el **fijado** (*pinning*): el cliente solo acepta un servidor cuya clave pública corresponde a una huella conocida de antemano. Una **huella** es el resultado de un [hash](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#hashing-frente-a-cifrado-una-confusion-frecuente) (aquí SHA-256): un valor corto que cambia en cuanto cambia el dato.

```bash
# extrae la clave pública del certificado A, la convierte a formato binario (DER), la hashea
# en SHA-256 y la escribe en base64 (una codificación de texto) ; | encadena los comandos
# $(...) : ejecuta el comando de dentro y guarda su resultado en HUELLA
# x509 -pubkey -noout : muestra la clave pública del certificado, pero no el certificado en sí
# pkey -pubin -outform der : lee una clave pública (-pubin) y la saca en binario DER
# dgst -sha256 -binary : calcula la huella SHA-256, en binario
# enc -base64 : convierte ese binario en texto legible
HUELLA=$(openssl x509 -in cert-a.pem -pubkey -noout | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary | openssl enc -base64)
# --pinnedpubkey : curl exige que la clave pública del servidor tenga esa huella
# -k se añade aquí para mostrar que el fijado actúa
# incluso sin la verificación de la cadena
curl -sS -k --pinnedpubkey "sha256//$HUELLA" https://localhost:7251/
```

```
curl: (90) SSL: public key does not match pinned public key
```

El servidor B (todavía en marcha) es rechazado con el código 90. Sustituimos B por A y repetimos:

```bash
# detiene B, vuelve a lanzar A (registro-a2.txt), y repite exactamente el mismo comando curl
kill $PID_B; wait $PID_B 2>/dev/null; sleep 1
timeout 120 python3 servidor.py 7251 cert-a.pem clave-a.pem A > registro-a2.txt &
PID_A=$!
sleep 1
curl -sS -k --pinnedpubkey "sha256//$HUELLA" https://localhost:7251/
# detiene este servidor A (los ejemplos siguientes lo relanzan)
kill $PID_A
```

```
respuesta del servidor A
```

En un uso real, **no se quita** la verificación normal: el fijado se añade a ella. Las huellas cambian en cada fabricación de certificado, por eso no se copian aquí. Los límites del fijado están en [las buenas soluciones](#las-buenas-soluciones).

### Los otros dos controles, con mensajes reales

El nombre y la fecha se verifican de la misma manera. Estas pruebas usan un certificado emitido solo para el nombre `otro.example`, y un certificado con fecha de enero de 2025. El primero se fabrica como en el paso 1, con otro `-subj`; el segundo pide `openssl ca`, cuyas opciones `-startdate` y `-enddate` permiten elegir las fechas (`openssl req` no lo permite):

```bash
# certificado emitido para el nombre otro.example (y no localhost)
openssl req -x509 -nodes -days 30 -newkey rsa:2048 -keyout clave-otro.pem -out cert-otro.pem \
  -subj "/CN=otro.example" -addext "subjectAltName=DNS:otro.example" 2>/dev/null
# solicitud de certificado (-new), firmada luego por openssl ca; crea la clave clave-exp.pem
openssl req -new -nodes -newkey rsa:2048 -keyout clave-exp.pem -out exp.csr \
  -subj "/CN=localhost" 2>/dev/null
# archivos de trabajo de openssl ca : registro de certificados (vacío) y número de serie
: > index.txt
echo 01 > serial.txt
# configuración mínima de openssl ca ; <<'FIN' escribe las líneas siguientes hasta FIN
cat > ca.cnf <<'FIN'
[ca]
default_ca = ca_lab
[ca_lab]
database = index.txt
new_certs_dir = .
serial = serial.txt
default_md = sha256
policy = reglas_politica
[reglas_politica]
commonName = supplied
FIN
# los nombres válidos (SAN) del certificado, leídos por -extfile
echo "subjectAltName = DNS:localhost,IP:127.0.0.1" > ext.cnf
# -selfsign : firma con su propia clave (autofirmado) ; válido solo el 1 de enero de 2025
openssl ca -batch -selfsign -config ca.cnf -keyfile clave-exp.pem -in exp.csr \
  -out cert-exp.pem -startdate 20250101000000Z -enddate 20250102000000Z \
  -extfile ext.cnf -notext
```

Para probarlos, se detiene el servidor en marcha y se lanza el servidor con uno de estos dos certificados (`python3 servidor.py 7251 cert-otro.pem clave-otro.pem N` o `python3 servidor.py 7251 cert-exp.pem clave-exp.pem E`), y después se llama con `curl --cacert cert-otro.pem https://localhost:7251/` (o `cert-exp.pem`). Mensajes obtenidos:

| Situación | `curl` | Python `requests` | Node.js |
|---|---|---|---|
| Nombre diferente | `SSL: no alternative certificate subject name matches target host name 'localhost'` | `certificate verify failed: Hostname mismatch, certificate is not valid for 'localhost'.` | `ERR_TLS_CERT_ALTNAME_INVALID` |
| Certificado caducado | `SSL certificate problem: certificate has expired` | `certificate verify failed: certificate has expired` | `CERT_HAS_EXPIRED` |

En los dos casos, el cliente había recibido el certificado del servidor como certificado de confianza (estaba autofirmado, como A): solo fallaba la propiedad comprobada, y un cliente con la verificación desactivada (`curl -k`) acepta sin reaccionar, tanto si el nombre es incorrecto como si el certificado ha caducado (probado en los dos casos).

## La misma desactivación en cada herramienta

Cada herramienta tiene su nombre para la misma idea. La tabla indica también **hasta dónde llega** la desactivación, porque su alcance cambia la magnitud del daño:

| Herramienta | Escritura que desactiva | Alcance | Escritura segura en su lugar |
|---|---|---|---|
| `curl` | `curl -k` o `curl --insecure` | Una llamada | `curl --cacert fichier.pem` ([manual de curl](https://curl.se/docs/manpage.html)) |
| Python `requests` | `requests.get(url, verify=False)` | Una llamada | `verify="fichier.pem"` ([documentación de requests](https://requests.readthedocs.io/en/latest/user/advanced/#ssl-cert-verification)) |
| Python (módulo `ssl`) | `contexto.check_hostname = False` y luego `contexto.verify_mode = ssl.CERT_NONE` | Todas las llamadas que usan ese contexto | `ssl.create_default_context(cafile="fichier.pem")` ([módulo `ssl`](https://docs.python.org/3/library/ssl.html)) |
| Node.js (variable) | `NODE_TLS_REJECT_UNAUTHORIZED=0` | **Todo el proceso** | `NODE_EXTRA_CA_CERTS=fichier.pem` ([opciones de Node.js](https://nodejs.org/api/cli.html#node_extra_ca_certsfile)) |
| Node.js (código) | `https.get({ rejectUnauthorized: false })` | Una llamada (o un agente compartido) | La opción `ca: contenido del certificado` de la misma petición, leído por ejemplo con `fs.readFileSync("fichier.pem")` ([módulo `https`](https://nodejs.org/api/https.html)) |
| PHP, extensión cURL | `CURLOPT_SSL_VERIFYPEER` a `false` y `CURLOPT_SSL_VERIFYHOST` a `0` | Una llamada | `CURLOPT_CAINFO` (el archivo de CA, ver [`curl_setopt`](https://www.php.net/curl_setopt)) |
| PHP, flujos | `'ssl' => ['verify_peer' => false]` | Una llamada | `'cafile'` (ver [`verify_peer` en PHP](/?c=langages&s=php&p=http#verify-peer-verify-peer-name-verificar-el-certificado-del-servidor-remoto)) |
| Guzzle (PHP) | `'verify' => FALSE` | Una llamada, o **todas** si se pone en la configuración común | `'verify' => '/ruta/ca.pem'` ([opciones de Guzzle](https://docs.guzzlephp.org/en/stable/request-options.html#verify)) |

Las escrituras de Python (`verify=False`, `check_hostname`, `CERT_NONE`, `cafile`), Node.js (`rejectUnauthorized`, `ca`, las dos variables) y PHP cURL pueden probarse todas contra el servidor del laboratorio. El servidor A se detuvo al final del paso 6: lo relanzamos primero, con el mismo comando que en el paso 2.

```bash
# relanza el servidor A, limitado a 120 segundos, y guarda su número de proceso
timeout 120 python3 servidor.py 7251 cert-a.pem clave-a.pem A > registro-a3.txt &
PID_A=$!
# espera un segundo a que el servidor esté listo para escuchar
sleep 1
```

Ejemplo de la línea «módulo `ssl`», que debe desactivar primero el control del **nombre** y después el de la **cadena** (si no, Python se niega a modificar el contexto). Guardado en `cliente-ssl.py`, se lanza con `python3 cliente-ssl.py` (`urllib.request` es la biblioteca HTTP incluida con Python, [documentación](https://docs.python.org/3/library/urllib.request.html)):

```python
# ssl : el módulo de Python para TLS ; urllib.request : un cliente HTTP que viene con Python
import ssl
import urllib.request

# contexto por defecto : verifica la cadena y el nombre
contexto = ssl.create_default_context()
# primer intento : la verificación sigue activa
try:
    urllib.request.urlopen("https://localhost:7251/", context=contexto)
except Exception as error:
    # muestra el motivo del rechazo
    print("RECHAZADO:", error.reason.verify_message)
# desactiva la verificación del nombre, y luego la de la cadena (en este orden)
contexto.check_hostname = False
contexto.verify_mode = ssl.CERT_NONE
# segundo intento : la conexión funciona
respuesta = urllib.request.urlopen("https://localhost:7251/", context=contexto)
# muestra el texto recibido
print(respuesta.read().decode().strip())
```

```
RECHAZADO: self-signed certificate
respuesta del servidor A
```

Y el equivalente PHP con la extensión cURL, guardado en `cliente.php`, que muestra los tres casos (por defecto, desactivada, confianza dada). La sintaxis básica de PHP (variables con `$`, funciones) está en [las variables PHP](/?c=langages&s=php&p=variables) y [las funciones PHP](/?c=langages&s=php&p=methodes); `===` y el ternario `? :` están en [las condiciones PHP](/?c=langages&s=php&p=conditions):

```php
<?php
// $verificacion : null mantiene la verificación por defecto, false la desactiva,
// una ruta de archivo da ese certificado de confianza
// string $direccion : el parámetro debe ser un texto ; : void : la función no devuelve nada
function llamar(string $direccion, $verificacion): void
{
    // curl_init prepara una llamada a la dirección dada
    $llamada = curl_init($direccion);
    // CURLOPT_RETURNTRANSFER : curl_exec devuelve el texto recibido en lugar de mostrarlo
    curl_setopt($llamada, CURLOPT_RETURNTRANSFER, true);
    // === : igual Y del mismo tipo (0 === false es falso; 0 == false, verdadero)
    if ($verificacion === false) {
        // desactiva la verificación de la cadena de certificados
        curl_setopt($llamada, CURLOPT_SSL_VERIFYPEER, false);
        // desactiva la verificación del nombre (0 : no comparar el nombre del certificado)
        curl_setopt($llamada, CURLOPT_SSL_VERIFYHOST, 0);
    } elseif ($verificacion !== null) {
        // CURLOPT_CAINFO : el archivo de certificados de confianza para esta llamada
        curl_setopt($llamada, CURLOPT_CAINFO, $verificacion);
    }
    // ejecuta la llamada : devuelve false si falla
    $texto = curl_exec($llamada);
    // condición ? a : b (ternario) vale a si la condición es verdadera, si no b
    // . une dos textos ; trim quita los espacios del final ; "\n" : salto de línea
    // muestra, por tanto, el texto recibido o el mensaje de error de cURL
    echo $texto === false ? 'RECHAZADO: ' . curl_error($llamada) : trim($texto), "\n";
}

// sin opción : la verificación sigue activa por defecto
llamar('https://localhost:7251/', null);
// con false : la verificación queda desactivada
llamar('https://localhost:7251/', false);
// $argv : los argumentos de la línea de comandos ; $argv[1] es el primero (el archivo)
llamar('https://localhost:7251/', $argv[1]);
```

El servidor A relanzado para el ejemplo anterior sigue en marcha si tiene menos de 120 segundos; si no, `timeout` lo ha detenido. Este comando solo lo relanza si está parado:

```bash
# kill -0 no mata nada: solo comprueba si el proceso sigue existiendo
# || : si esa comprobación falla, el bloque entre llaves relanza el servidor A
kill -0 $PID_A 2>/dev/null || {
  # el mismo comando de arranque que en el paso 2
  timeout 120 python3 servidor.py 7251 cert-a.pem clave-a.pem A > registro-a4.txt &
  # guarda el nuevo número de proceso, y luego espera un segundo
  PID_A=$!; sleep 1
}
```

```bash
# contra el servidor A : el argumento es el archivo del certificado de confianza
php cliente.php cert-a.pem
# detiene el servidor A al final del laboratorio
# (2>/dev/null oculta el error si ya está detenido)
kill $PID_A 2>/dev/null
```

```
RECHAZADO: SSL certificate problem: self-signed certificate
respuesta del servidor A
respuesta del servidor A
```

| Llamada | Resultado |
|---|---|
| `llamar(..., null)` (verificación por defecto) | Rechazada: el certificado está autofirmado |
| `llamar(..., false)` (desactivada) | Aceptada |
| `llamar(..., 'cert-a.pem')` (confianza dada a A) | Aceptada |

## Un ejemplo en un framework PHP: Drupal y Guzzle

> **Ejemplo ilustrativo de un framework.** Muestra cómo se escribe la desactivación en un proyecto real; las direcciones y los nombres son inventados, los nombres de API están verificados en el código fuente de Drupal 11.x.

**Drupal** ([drupal.org](https://www.drupal.org/)) es un **CMS** (*content management system*, sistema de gestión de contenidos: un programa para construir y administrar un sitio) escrito en [PHP](/?c=langages&s=php&p=php). También es un **framework**: una caja de herramientas de código ya escrito, sobre la que se construye un sitio a medida. Ofrece un servicio que devuelve un **cliente HTTP** (un [objeto](/?c=langages&s=php&p=poo) que envía peticiones), basado en **Guzzle**, la biblioteca de PHP de referencia para ello (una **biblioteca** es un conjunto de código reutilizable escrito por otros; ver [su documentación](https://docs.guzzlephp.org/en/stable/)). Una llamada a una API de socio se escribe así:

```php
<?php
// servicio de un framework que devuelve un cliente HTTP (aquí, un cliente Guzzle)
// \Drupal::httpClient() : :: llama a la función httpClient asociada a la clase \Drupal
$cliente = \Drupal::httpClient();
// $cliente->get(...) : -> llama al método get del objeto $cliente (una petición GET)
// [ 'clave' => valor, ... ] es una tabla de opciones : => asocia un valor a un nombre
// PELIGROSO : 'verify' => FALSE desactiva toda la verificación TLS para esta llamada
$respuesta = $cliente->get('https://api.socio.example/clientes', [
  'verify' => FALSE,
  'timeout' => 10,
]);
// lee el cuerpo de la respuesta ; (string) lo convierte en texto
$texto = (string) $respuesta->getBody();
```

La línea `'verify' => FALSE` es la que se encuentra, copiada de un foro o de un proyecto antiguo, cuando la API del socio presenta un certificado que hace fallar la llamada. Hace lo mismo que `curl -k`: ningún control de la cadena ni del nombre. El capítulo sobre los flujos de PHP presenta la misma idea con `verify_peer`, en [Realizar llamadas HTTP de forma nativa](/?c=langages&s=php&p=http#verify-peer-verify-peer-name-verificar-el-certificado-del-servidor-remoto).

Dos variantes agravantes, frecuentes en este tipo de proyecto:

| Variante | Por qué es peor |
|---|---|
| La opción puesta en la **configuración común** de las llamadas salientes del framework | Desactiva la verificación para todos los módulos del sitio, incluidos los de terceros, e incluso para llamadas que transportan secretos |
| La opción puesta **condicionalmente** («solo si el entorno es el de desarrollo»), pero la condición lee una variable que producción también define | La desactivación llega a producción sin que nadie la haya querido |

Lo que este ejemplo debería hacer en su lugar: ver [las buenas soluciones](#las-buenas-soluciones). Para Guzzle, `'verify'` acepta `TRUE` (el valor por defecto, verificación activa), `FALSE` (desactivada) o **la ruta de un archivo** de CA de confianza. Según [su documentación](https://docs.guzzlephp.org/en/stable/faq.html), Guzzle usa cURL cuando la extensión está disponible, pero no depende de ella. Con su gestor cURL, `'verify' => FALSE` pone `CURLOPT_SSL_VERIFYPEER` a falso y `CURLOPT_SSL_VERIFYHOST` a 0, las dos opciones de la línea «PHP, extensión cURL» de la tabla anterior; con su gestor de flujos PHP, son otras opciones (`verify_peer` y `verify_peer_name`). Este ejemplo no se ejecuta en el laboratorio: necesita Drupal y Guzzle instalados.

## Las buenas soluciones

La regla general: **corregir la causa del error, no suprimirlo**. Cada caso de la tabla «Por qué se tiende a desactivarla» tiene una respuesta:

| Causa del error | Solución duradera |
|---|---|
| Certificado autofirmado en desarrollo | Dar **ese** certificado al cliente como certificado de confianza (`--cacert`, `verify="fichier.pem"`, `NODE_EXTRA_CA_CERTS`, `CURLOPT_CAINFO`), exactamente como en el laboratorio. Para un puesto de desarrollador, una herramienta como [mkcert](https://github.com/FiloSottile/mkcert) crea una pequeña CA local que el sistema acepta, lo que evita multiplicar las excepciones. Node.js incluye su propia lista de CA y no siempre lee la del sistema: hay que darle la CA local con `NODE_EXTRA_CA_CERTS` (ver [la documentación de Node.js](https://nodejs.org/api/cli.html#node_extra_ca_certsfile)); `requests` puede leer la lista del sistema o la suya propia según la instalación |
| Certificado caducado | **Renovarlo**, y sobre todo **automatizar** la renovación: [Let's Encrypt](https://letsencrypt.org/docs/) entrega gratis certificados de una CA reconocida, renovables por un programa gracias al protocolo **ACME** (un intercambio estandarizado entre el servidor y la CA) |
| Nombre que no coincide | Llamar al servidor **por el nombre del certificado**, o hacer emitir un certificado que contenga el nombre realmente usado (el SAN) |
| Proxy de empresa que vuelve a emitir los certificados | Añadir la **CA del proxy** (facilitada por el departamento de informática) al almacén de confianza de la herramienta, en lugar de desactivarlo todo. Con `NODE_EXTRA_CA_CERTS`, se añade; con `--cacert` o `verify=`, el archivo reemplaza la lista (ver [añadir o reemplazar](#anadir-o-reemplazar-lo-que-hace-cada-opcion-de-confianza)): hay que copiar entonces también en él las CA públicas |
| Almacén de confianza demasiado antiguo | Actualizar el paquete de CA del sistema o de la imagen del contenedor |
| Llamada a un socio que presenta un certificado fijo conocido | **Fijar** su huella, además de la verificación normal |

### Fijar: qué aporta y qué cuesta

| | Aporte | Coste |
|---|---|---|
| **Fijado de la clave pública** (como en el paso 6) | Incluso una CA malintencionada o comprometida no puede hacerse pasar por el servidor | Si el servidor cambia de clave (renovación, incidente), todos los clientes fijados **dejan de funcionar** hasta actualizar la huella |
| **Fijar la clave y no el certificado entero** | Una renovación que conserva la misma clave sigue aceptándose | Hay que comprobar que el servidor conserva su clave |
| **Prever una huella de respaldo** | Una segunda clave, generada de antemano y guardada en un lugar seguro, evita la caída el día del cambio | Un secreto más que conservar (ver [la gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |

El fijado conviene a un cliente que controlamos y a un servidor que controlamos (una aplicación móvil que habla con su propia API, dos servicios de un mismo equipo). Conviene mal a un sitio público de terceros cuyas claves o renovaciones no controlamos.

### No entregar nunca la opción desactivada en producción

Incluso cuando una desactivación es aceptable durante un tiempo en un puesto de desarrollo, no debe poder llegar a producción:

| Regla | Cómo aplicarla |
|---|---|
| La verificación está **activa por defecto** | No escribir nunca `verify=False` fijo en el código: leer el ajuste de la configuración, cuyo valor por defecto es «verificar» |
| El desarrollo no necesita la desactivación | Dar el certificado local de confianza (más arriba) en lugar de un interruptor |
| Un ajuste de desactivación, si existe, **se niega a arrancar** en producción | El programa se detiene con un mensaje claro si el entorno es producción y la verificación está desactivada: es el principio de [fallar de forma segura](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise#fallar-de-forma-segura-fail-securely) |
| Las advertencias del lenguaje **no** se silencian | No filtrar la advertencia (por ejemplo con `urllib3.disable_warnings` en Python, la función de `urllib3` que silencia esa advertencia): es la última alarma |
| El secreto que pasa por esta conexión se trata como expuesto | Si la verificación se ha desactivado en producción, renovar el token que ha pasado (ver [la rotación de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |

### Detectar el fallo: revisión y análisis estático

Este fallo es fácil de encontrar, porque se escribe con patrones reconocibles. En **revisión de código** (relectura por otro desarrollador antes de la fusión), se buscan esos patrones en los cambios. Un **análisis estático** (*SAST*, que lee el código sin ejecutarlo, ver [SAST: analizar el código sin ejecutarlo](/?c=securite&s=cybersecurite&p=tests-et-audit-de-securite#sast-analizar-el-codigo-sin-ejecutarlo)) puede buscarlos automáticamente en cada cambio, por ejemplo en una [canalización de integración continua](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd). Una regla de partida muy sencilla es un `grep` (la herramienta de búsqueda de texto de la terminal), probado aquí sobre una pequeña carpeta de ejemplo que contiene un archivo por patrón, más un archivo correcto:

```bash
# -r : todos los archivos de la carpeta ; -n : número de línea ; -E : patrones extendidos
# -i : sin distinguir mayúsculas (FALSE o false) ; cada | separa un patrón buscado
# \ al final de la línea : el comando continúa ; el detalle de los símbolos está en la tabla
grep -rnE -i "verify[\"']?\s*(=>|=|:)\s*false|rejectUnauthorized\s*:\s*false|\
NODE_TLS_REJECT_UNAUTHORIZED|CURLOPT_SSL_VERIFY(PEER|HOST)|(^|\s)(-k|--insecure)(\s|$)|\
CERT_NONE|check_hostname\s*=\s*False|verify_peer" ejemplo
```

```
ejemplo/src/Llamada.php:1:$cliente->get($url, ["verify" => FALSE]);
ejemplo/src/agente.js:1:const agente = { rejectUnauthorized: false };
ejemplo/src/copia.sh:1:curl -k https://interno.example/api
ejemplo/src/cliente.py:1:respuesta = requests.get(url, verify=False)
ejemplo/src/llamada.js:1:process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
ejemplo/src/heredado.php:1:curl_setopt($c, CURLOPT_SSL_VERIFYPEER, false);
```

Los símbolos de estos patrones son [expresiones regulares](/?c=langages&s=python&p=regex-en-python):

| Símbolo | Significado | Ejemplo en el patrón |
|---|---|---|
| `\s*` | cero espacios o más (`\s`: un espacio, un tabulador) | `verify\s*=` encuentra `verify=` y `verify  =` |
| `["']?` | una comilla doble o simple, o nada (`?`: cero o una vez) | `"verify"` o `verify` |
| `(=>\|=\|:)` | uno de los tres signos `=>`, `=` o `:` (aquí `\|`: «o») | `verify=false`, `'verify' => false` |
| `(PEER\|HOST)` | una de las dos palabras | `CURLOPT_SSL_VERIFYPEER` o `...VERIFYHOST` |
| `(^\|\s)` y `(\s\|$)` | principio de línea o espacio, fin de línea o espacio (`^`: inicio, `$`: fin) | `-k` solo, pero no el `-k` pegado en `archivo-k8s` |

Los seis patrones desactivados se encuentran; el archivo correcto (`verify=True`) no aparece. El patrón `verify_peer` encontraría también un valor a `true` (una falsa alarma que hay que leer a mano). Y cada resultado es solo un **indicio**: hay que leer la línea para saber si vale `false` en producción. Una regla de canalización que bloquee la fusión cuando aparece el patrón, con una excepción documentada caso por caso (por ejemplo, una prueba que apunta a un servidor local), es más fiable que un recordatorio oral.

Por último, tres indicios de ejecución que no hay que ignorar: el `InsecureRequestWarning` de Python, la advertencia de Node.js sobre `NODE_TLS_REJECT_UNAUTHORIZED`, y cualquier programa que acepte un certificado que un navegador, en cambio, rechazaría.

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| «Es solo desarrollo» | La opción se copia, se aprueba en la revisión y se entrega; el código de desarrollo acaba siendo el código de producción | Dar el certificado local al cliente de confianza, sin interruptor en el código |
| Creer que `verify=False` desactiva el cifrado | La conversación sigue cifrada: la trampa es creerse protegido cuando quizá se habla con un impostor | Recordar que la desactivación elimina la prueba de identidad, no el cifrado |
| `NODE_TLS_REJECT_UNAUTHORIZED=0` en un archivo de configuración o un contenedor | Desactiva la verificación de **todas** las llamadas del proceso, incluidas las de bibliotecas de terceros | Usar `NODE_EXTRA_CA_CERTS` |
| Opción puesta en la configuración común de un framework | Afecta a todos los módulos y a todas las llamadas salientes, incluidas las que llevan secretos | Ninguna desactivación global; si hace falta, una CA de confianza global |
| Silenciar la advertencia (`disable_warnings`) | La advertencia es la única señal que queda | Corregir la causa, nunca la alarma |
| Desactivar solo el control del nombre (`verify_peer_name`, `check_hostname`) | Un certificado válido de **otro** sitio se acepta en lugar del correcto | Corregir el nombre o el certificado |
| Fijar el certificado entero sin plan de renovación | El día que cambie el certificado, todos los clientes caen | Fijar la clave, prever una huella de respaldo |
| Creer que un certificado autofirmado cifra peor | El cifrado es el mismo; solo falta la prueba de identidad | Dar ese certificado en confianza al cliente afectado |
| Llamadas de servidor a servidor sin humano que vea una alerta | Ninguna advertencia visible, nadie renuncia | Rechazar en producción cualquier configuración con verificación desactivada |
| No renovar el token que ha pasado por una conexión no verificada | Un token ya leído por un tercero sigue siendo válido | Renovarlo después de corregir la conexión |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Dejar la verificación activa en todas partes, y corregir la causa del error | Un error de verificación es un diagnóstico: dice exactamente qué no va bien (cadena, nombre, fecha) |
| Dar al cliente el certificado o la CA de confianza (`--cacert`, `verify="fichier.pem"`, `NODE_EXTRA_CA_CERTS`, `CURLOPT_CAINFO`) | La confianza es precisa y se limita a lo que conocemos |
| Automatizar la renovación de los certificados con Let's Encrypt o con la herramienta de la organización | Un certificado caducado no debe volver a bloquear a nadie |
| Añadir la CA de un proxy de empresa al almacén de confianza (sin perder las CA públicas) en lugar de desactivarlo todo | El proxy es de confianza, no un desconocido cualquiera |
| Fijar la clave pública para un cliente y un servidor que controlamos, con una huella de respaldo | Incluso una CA comprometida no puede hacerse pasar por el servidor |
| Leer el ajuste de verificación en la configuración, con «verificar» por defecto, y negarse a arrancar en producción si está desactivado | Una desactivación no puede llegar a producción por accidente |
| Buscar los patrones de desactivación en la revisión de código y en una canalización (análisis estático, `grep`) | El fallo se escribe con patrones reconocibles |
| Dejar visibles las advertencias del lenguaje | Es la última señal si la desactivación pasa de todos modos |
| Renovar los secretos que han pasado por una conexión no verificada | Un tercero puede haberlos leído |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | TLS aporta la confidencialidad, la integridad **y** la prueba de la identidad del servidor; solo la verificación del certificado (cadena hasta una CA de confianza, nombre, fechas) aporta esta última. `curl -k`, `verify=False`, `NODE_TLS_REJECT_UNAUTHORIZED=0` y `verify => FALSE` no desactivan el cifrado, sino esa prueba: un tercero colocado entre el cliente y el servidor (DNS corrompido, Wi-Fi, proxy) presenta su propio certificado, y lee o modifica todo, sin que el cliente vea nada. El laboratorio lo ha mostrado: un segundo servidor con un certificado distinto ha leído un token enviado por el cliente con la verificación desactivada, y ha sido rechazado por el cliente que conocía el certificado correcto. La buena respuesta corrige la causa: dar el certificado de confianza (`--cacert`, `verify="fichier.pem"`, `NODE_EXTRA_CA_CERTS`), renovar y automatizar (Let's Encrypt), corregir el nombre, añadir la CA del proxy, fijar una clave. |
| **Trampas que evitar** | «Es solo desarrollo»; una variable de entorno o una configuración común que desactiva todo el proceso o todo el sitio; silenciar la advertencia; desactivar solo el control del nombre; fijar sin huella de respaldo; no renovar un token que ha pasado por una conexión no verificada. |
| **Buenas prácticas** | Verificación activa por defecto y leída desde la configuración; certificado o CA dados al cliente en lugar de desactivarlo todo; renovación automática de certificados; negativa a arrancar en producción si la verificación está desactivada; búsqueda de patrones de desactivación en la revisión de código y con análisis estático; advertencias del lenguaje dejadas visibles. |
