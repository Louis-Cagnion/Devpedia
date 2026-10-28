---
order: 22
---

# Informar de una vulnerabilidad encontrada en un sitio web: lo que permite la ley y la divulgación responsable (28/10/2026)

Este capítulo ofrece referencias generales y no constituye un asesoramiento jurídico: la ley varía de un país a otro y cambia con el tiempo, y solo una persona cualificada (abogado, abogada o jurista) puede decir qué se aplica a un caso concreto; Francia sirve de ejemplo principal, con referencias para la Unión Europea y Estados Unidos.

Un **fallo** (o *vulnerabilidad*) es un defecto de un sistema que permite hacerlo actuar de forma distinta a la prevista (véase [las grandes familias de fallos](/?c=securite&s=cybersecurite&p=types-de-failles)). La pregunta que se trata aquí es la de cualquier persona curiosa que aprende seguridad: «¿Puedo buscar fallos en un sitio web y después avisar a quienes lo gestionan por correo electrónico u otro medio, o es ilegal?» La respuesta depende menos de lo que se hace que de la **autorización** que se tiene, y de la forma en que después se avisa. Los nombres de sitio de este capítulo (`example.org`) son ficticios.

## La respuesta corta

| Pregunta | Respuesta corta |
|---|---|
| ¿Puedo buscar fallos en un sitio que no es mío? | En general **no, no sin autorización**, incluso sin mala intención: en la mayoría de los casos constituye una infracción |
| ¿Puedo avisar a los responsables del sitio? | **Sí**, es posible y útil, pero el informe conlleva riesgos y no borra lo que se hizo antes |
| ¿Qué hace legítima la búsqueda? | Una **autorización explícita**: contrato o mandato de prueba, política de divulgación o programa de recompensas, dentro de su perímetro preciso |
| ¿Y si me topo con un fallo sin buscarlo? | Detenerse, anotar lo mínimo, informar **en privado** por el canal previsto, no publicar nada antes de la corrección |

El resto del capítulo explica cada fila de esta tabla.

## Por qué es ilegal: el acceso no autorizado

Una imagen ayuda a entender. La puerta de una tienda cerrada tiene una cerradura rota: entrar «para avisar al propietario» sigue siendo entrar en un lugar donde no se tiene derecho a estar. En informática, es la misma lógica: lo que cuenta no es la dificultad técnica ni la intención, sino el hecho de **haber estado autorizado** o no.

En Francia, el **Code pénal** (Código Penal francés, el texto que define las infracciones y sus penas, consultable en [Légifrance](https://www.legifrance.gouv.fr/), el sitio oficial del derecho francés) dedica sus artículos 323-1 y siguientes a los atentados contra un **sistema de tratamiento automatizado de datos** (en la práctica, cualquier sistema informático: un servidor, un sitio, una aplicación, una base de datos).

| Artículo | Lo que sanciona (resumen) |
|---|---|
| 323-1 | Acceder a un sistema de este tipo o permanecer en él, **de forma fraudulenta**, en todo o en parte |
| 323-2 | Obstaculizar o falsear su funcionamiento (por ejemplo, saturándolo, véase [la denegación de servicio](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| 323-3 | Introducir, extraer, poseer, reproducir, transmitir, suprimir o modificar de forma fraudulenta datos del sistema (a verificar en Légifrance la lista exacta de actos) |
| 323-3-1 | Suministrar o poseer sin motivo legítimo herramientas concebidas para cometer estas infracciones; la ley cita la investigación y la seguridad informática entre los motivos legítimos (a verificar en Légifrance) |
| 323-7 | La tentativa se castiga como la propia infracción (a verificar en Légifrance) |

Las penas son de prisión y multa; sus importes cambian según el artículo y la ley vigente: conviene consultarlos en Légifrance y no en un manual.

Tres términos requieren una aclaración:

| Término | Sentido |
|---|---|
| **Acceso** | Entrar en el sistema, incluso sin romper ninguna protección: un simple ensayo de credenciales, o una dirección adivinada, puede bastar |
| **Permanencia** | Seguir en un sistema después de haber comprendido que no se tiene derecho a estar en él: un acceso logrado por casualidad se convierte en un problema si se sigue explorando |
| **Fraudulentamente** | Sabiendo que no se está autorizado: es el elemento moral de la infracción |

### Lo que no borra la buena intención

Querer avisar al propietario no suprime la infracción: la intención de hacer bien no es una autorización. Los jueces tienen en cuenta, no obstante, el contexto, y la jurisprudencia (el conjunto de decisiones de los tribunales) es matizada: la buena fe, la ausencia de daño y la forma de avisar pesan en la decisión y en la pena, sin impedir el procedimiento. Un caso francés a menudo citado, el de la **extranet** (la parte de un sitio reservada a socios) de un organismo público, juzgado en apelación en 2014 y después por la Cour de cassation (Tribunal de Casación) en 2015, el tribunal supremo en materia penal, muestra también que un archivo **técnicamente accesible** (sin contraseña, encontrado mediante un motor de búsqueda) no está por ello **autorizado**: seguir accediendo a él sabiendo que no estaba destinado al público se ha considerado un mantenimiento fraudulento (a verificar en Légifrance para el detalle de la decisión).

Estos son, de lo más leve a lo más grave, los distintos gestos que pueden darse sobre un mismo tema. Esta tabla es una estimación pedagógica, nunca una decisión judicial:

| Acción en un sitio que no es suyo | Riesgo jurídico | Por qué |
|---|---|---|
| Leer lo que la página envía a cualquier visitante (su **código fuente**, el texto recibido por el navegador, o un mensaje de error mostrado espontáneamente) | Bajo | No se elude nada: el sitio envió esta información a todo el mundo |
| Lanzar un **escáner automático** (un programa que envía cientos de solicitudes de prueba) | Alto | Es un comportamiento de ataque, y puede perturbar el servicio |
| Adivinar una dirección oculta, o cambiar un número en la dirección para ver la página de otra persona | Alto | Se busca llegar a lo que no estaba destinado a uno |
| Probar una contraseña por defecto o unas credenciales | Alto | Es un acceso por elusión |
| Abrir, leer o descargar datos de terceros | Muy alto | Extracción de datos, con además un problema de vida privada |
| Probar en la cuenta de otra persona | Muy alto | Ataque directo contra un tercero |
| Sobrecargar el sitio para «ver si aguanta» | Muy alto | Obstaculización del funcionamiento |

## Las referencias fuera de Francia

| Zona | Referencias (a verificar en la fuente oficial) |
|---|---|
| Unión Europea | Una **directiva** (un texto que cada Estado debe transponer a su propia ley) de 2013, numerada 2013/40/UE, impone castigar el acceso ilegal a los sistemas de información. La directiva NIS2 (2022/2555) fomenta la divulgación coordinada y prevé un **CSIRT** nacional, un equipo de respuesta a incidentes que actúa de intermediario de confianza. El reglamento sobre la ciberresiliencia (2024/2847; un **reglamento** europeo se aplica directamente, sin pasar por una ley nacional) exige a los fabricantes de productos digitales gestionar los informes de vulnerabilidades |
| Estados Unidos | El *Computer Fraud and Abuse Act* (18 U.S.C. § 1030) castiga el acceso «sin autorización» o «excediendo la autorización». Una política del Departamento de Justicia, publicada en 2022, indica que no debe perseguirse la investigación de seguridad de buena fe, pero no es una ley: no impide ni procedimientos de otro tipo ni una demanda civil |
| Resto del mundo | Muy variable: algunos países protegen explícitamente a los investigadores, otros no. Pueden aplicarse varias leyes a la vez (la de la persona, la del país del servidor) |

La Unión Europea agrupa países cuyas leyes no son idénticas: el texto europeo fija un marco, y es la ley nacional la que se aplica.

## Lo que se encuentra típicamente por casualidad

Muchos informes proceden de un descubrimiento fortuito. Estos son los casos habituales, con el capítulo que explica el fallo:

| Lo que se nota | El fallo correspondiente |
|---|---|
| Una página que lista el contenido de una carpeta (un **listado de directorio**) con nombres de archivos sensibles | Archivo o copia de seguridad expuesto, véase [los secretos olvidados en producción](/?c=securite&s=cybersecurite&p=secrets-oublies-en-production) |
| Una clave de acceso (un secreto) visible en el código de la página | Secreto expuesto, véase [la gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| Una página de administración o de datos mostrada sin contraseña | Control de acceso deficiente, véase [el OWASP Top 10](/?c=securite&s=cybersecurite&p=owasp-top-10) |
| Un mensaje de error que revela detalles internos (rutas, versión, consulta) | Fuga de información, véase [las familias de fallos](/?c=securite&s=cybersecurite&p=types-de-failles) |
| Una versión muy antigua de un componente conocida por un fallo | Dependencia vulnerable, véase [la seguridad de las dependencias](/?c=securite&s=cybersecurite&p=securite-des-dependances) |

Advertir algo no cruza la línea; abrir, probar o profundizar sí puede cruzarla.

## Lo que cambia con una política de divulgación

Una **política de divulgación de vulnerabilidades** (en inglés *VDP*, por *Vulnerability Disclosure Policy*) es un texto público en el que una organización indica cómo informarle de un fallo, qué autoriza y qué promete a cambio. Un **programa de bug bounty** («caza de fallos recompensada») va más allá: paga una recompensa, según la gravedad, a quien informa de un fallo válido (véase [el bug bounty y el pentest](/?c=securite&s=cybersecurite&p=tests-et-audit-de-securite)).

Estos textos dan una **autorización explícita**, pero **solo** dentro de un perímetro preciso (las direcciones listadas, las técnicas permitidas):

| Situación | Autorización para buscar | Recompensa | Qué saber |
|---|---|---|---|
| Ninguna política publicada | Ninguna | Ninguna | Buscar sigue siendo arriesgado; solo se puede informar de un descubrimiento fortuito |
| Política de divulgación (VDP) | Sí, dentro de su perímetro | A menudo ninguna (agradecimientos) | Leer el perímetro y las reglas antes de cualquier prueba |
| Programa de bug bounty | Sí, dentro de su perímetro | Sí, según la gravedad | A menudo gestionado por una plataforma intermediaria, con sus propias reglas |
| Prueba de intrusión encargada | Sí, por contrato escrito | Remuneración del prestador | Marco fijado de antemano (perímetro, horarios, reglas) |

Una política seria contiene casi siempre:

| Elemento | Lo que dice |
|---|---|
| **Perímetro** | Las direcciones y servicios autorizados; todo lo demás está prohibido, incluso bajo el mismo **nombre de dominio** (la parte de la dirección que designa el sitio, como `example.org`) |
| Técnicas prohibidas | Por ejemplo la denegación de servicio, la ingeniería social (véase [el phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)), el acceso a los datos de otros usuarios |
| **Cláusula de no persecución** (*safe harbor*, «puerto seguro») | La organización promete no perseguir a quien respete las reglas |
| Contacto y plazos | A quién escribir, en qué plazo responde y corrige |

Esta cláusula solo compromete a la organización que la redacta: no vincula ni a la justicia, ni a un tercero cuyos datos o sistemas resultaran afectados (a verificar con un jurista para un caso concreto). Las plataformas de intermediación más conocidas:

| Plataforma | Función | Dirección oficial |
|---|---|---|
| YesWeHack | Pone en contacto a organizaciones e investigadores; empresa francesa | [yeswehack.com](https://www.yeswehack.com/) |
| HackerOne | Igual; empresa estadounidense | [hackerone.com](https://www.hackerone.com/) |
| Bugcrowd | Igual; empresa estadounidense | [bugcrowd.com](https://www.bugcrowd.com/) |
| Intigriti | Igual; empresa europea | [intigriti.com](https://www.intigriti.com/) |

### El archivo `security.txt`

Cuando una organización no tiene programa, puede indicar igualmente dónde informarle de un fallo. El archivo **`security.txt`** es un pequeño archivo de texto, definido por la norma **RFC 9116** (una **RFC**, documento técnico de referencia de Internet, [legible aquí](https://www.rfc-editor.org/rfc/rfc9116)), colocado en la dirección `/.well-known/security.txt` del sitio. La carpeta `.well-known` («bien conocido») está reservada a los archivos estándar que se buscan en una ubicación previsible.

```text
# Las líneas que empiezan por # son comentarios, ignorados por los lectores
# Contact: dónde escribir (obligatorio); mailto: introduce una dirección de correo
Contact: mailto:securite@example.org
# Expires: fecha de fin de validez del archivo (obligatorio), formato de fecha ISO 8601
Expires: 2027-06-30T23:00:00.000Z
# Encryption: la dirección de la clave pública para cifrar el mensaje
Encryption: https://example.org/.well-known/clave-publica.asc
# Policy: la dirección de la política de divulgación completa
Policy: https://example.org/politica-de-divulgacion
# Preferred-Languages: los idiomas aceptados en el informe
Preferred-Languages: fr, en
# Canonical: la dirección oficial de este archivo, para detectar una copia falsificada
Canonical: https://example.org/.well-known/security.txt
```

| Campo | Función | Obligatorio |
|---|---|---|
| `Contact` | Dirección de correo, formulario o teléfono para informar | Sí |
| `Expires` | Pasada esta fecha, el archivo ya no debe considerarse fiable: probablemente está abandonado | Sí |
| `Encryption` | Clave pública para cifrar el mensaje (véase [el cifrado asimétrico](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)) | No |
| `Policy` | Enlace a la política de divulgación | No |
| `Preferred-Languages` | Idiomas comprendidos | No |
| `Canonical` | Dirección oficial del archivo | No |
| `Acknowledgments` | Página que agradece a las personas que informaron de un fallo | No |

Hay que servirlo por **HTTPS** (la versión cifrada de HTTP, véase [API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)), para que nadie pueda sustituir un contacto falso. Atención: un `security.txt` indica **dónde informar**, no autoriza a probar; la autorización proviene de la política que referencia, si existe.

## La divulgación coordinada

**Divulgar** un fallo es hacerlo público. Existen tres actitudes:

| Modelo | Principio | Ventaja | Riesgo |
|---|---|---|---|
| Divulgación inmediata (*full disclosure*) | Publicar todo de inmediato | Presión máxima para corregir | Los atacantes aprovechan el fallo antes del **parche** (*patch*, la actualización que lo elimina): los usuarios quedan expuestos |
| **Divulgación coordinada** (llamada «responsable») | Informar **en privado**, dejar un plazo razonable para corregir, publicar tras la corrección o tras un plazo anunciado | Los usuarios quedan protegidos antes de que el fallo sea conocido | Requiere paciencia; la organización puede demorarse |
| Silencio | No decir nada a nadie | Poco riesgo para uno mismo | El fallo sigue abierto, y otros pueden encontrarlo |

La norma **ISO/IEC 29147** describe cómo recibir y publicar la información sobre una vulnerabilidad, y **ISO/IEC 30111** cómo tratarla internamente; la divulgación coordinada es la práctica que organizan estas normas.

El plazo se fija de antemano y se ajusta. Una duración de 90 días se cita a menudo en el sector (por ejemplo, por el equipo de seguridad de Google), pero no es una regla legal: un fallo ya explotado por atacantes justifica un plazo más corto, y una corrección compleja puede requerir uno más largo. Una vez corregido y publicado el fallo, puede recibir un identificador **CVE** en el catálogo público de fallos conocidos (véase [las familias de fallos](/?c=securite&s=cybersecurite&p=types-de-failles)).

## En Francia: la ANSSI y el CERT-FR

La **ANSSI** (*Agence nationale de la sécurité des systèmes d'information*, Agencia nacional de seguridad de los sistemas de información) es el servicio del Estado encargado de la ciberseguridad ([sitio oficial](https://cyber.gouv.fr/)). El **CERT-FR** (*Centre gouvernemental de veille, d'alerte et de réponse aux attaques informatiques*, centro gubernamental de vigilancia, alerta y respuesta ante los ataques informáticos) está vinculado a la ANSSI y es el centro gubernamental de vigilancia, alerta y respuesta a los ataques informáticos ([sitio oficial](https://www.cert.ssi.gouv.fr/)). *CERT* significa *Computer Emergency Response Team*, «equipo de respuesta a emergencias informáticas».

| Lo que se sabe | Lo que hay que verificar en el sitio oficial |
|---|---|
| El CERT-FR propone un dispositivo de informe de vulnerabilidades | La dirección exacta, el formulario eventual y la clave para cifrar el mensaje |
| Publica avisos y alertas de seguridad sobre fallos conocidos | Quién puede informar, y para qué tipos de sistemas |
| Puede servir de intermediario cuando no se encuentra ningún contacto | Qué hace después con el informe (transmisión a la organización, plazos) |
| Una ley de 2016 sobre lo digital protege la confidencialidad de quien informa de buena fe a la ANSSI (artículo L. 2321-4 del *Code de la défense*, Código de la Defensa) | El texto exacto y su alcance: organiza el informe, **no autoriza** a posteriori un acceso realizado sin derecho |
| La CNIL (*Commission nationale de l'informatique et des libertés*, Comisión nacional de informática y libertades, [cnil.fr](https://www.cnil.fr/)) trata las violaciones de datos personales | Su función precisa según el caso |

Fuera de Francia, el mismo papel lo desempeña el CERT o el CSIRT nacional, por ejemplo la [CISA](https://www.cisa.gov/) en Estados Unidos; a nivel europeo, la agencia [ENISA](https://www.enisa.europa.eu/) publica recursos.

## Cómo informar en la práctica

### A quién escribir

Se busca en este orden, deteniéndose en el primer contacto encontrado:

| Orden | Dónde buscar | Observación |
|---|---|---|
| 1 | Una página «seguridad» o una política de divulgación del sitio | Leer el perímetro y las reglas antes de escribir |
| 2 | El archivo `/.well-known/security.txt` | Comprobar la fecha `Expires` |
| 3 | Una dirección dedicada (por convención `security@` seguida del nombre de dominio) o la página de contacto | Evitar la dirección de atención al cliente, leída por mucha gente |
| 4 | La plataforma de bug bounty citada por la organización | Seguir sus reglas de envío |
| 5 | El CERT nacional (en Francia, el CERT-FR) | Si no existe ningún contacto o si la organización no responde |
| 6 | Para una biblioteca libre: el archivo `SECURITY.md` o el informe privado del repositorio de código (véase [GitHub y las plataformas](/?c=qualite-performance-et-outils&s=git&p=github-et-plateformes)) | Un fallo en una dependencia se comunica a sus **mantenedores** (las personas que gestionan el proyecto) (véase [la seguridad de las dependencias](/?c=securite&s=cybersecurite&p=securite-des-dependances)) |

Nunca en una red social, un foro, un comentario público o un ticket visible para todos: eso equivaldría a publicar antes de la corrección.

### Cifrar cuando se puede

Si el `security.txt` o la política facilitan una **clave pública**, el mensaje se cifra con ella: solo la organización, que posee la clave privada asociada, podrá leerlo (véase [el cifrado asimétrico](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). El estándar habitual para un correo es **OpenPGP** ([openpgp.org](https://www.openpgp.org/)). Sin clave facilitada, se escribe un mensaje sobrio (dónde, qué, impacto) y se evita adjuntar detalles que permitirían a un lector malintencionado reproducir el fallo; se propone un canal seguro para continuar.

### Qué poner en el mensaje

| Referencia | Contenido | Por qué |
|---|---|---|
| [1] Asunto | Una línea clara: «Informe de seguridad: …» | El correo no se toma por correo no deseado |
| [2] Dónde | La dirección (URL) precisa, la fecha y la hora del descubrimiento | Permite localizar el problema en los **registros** (los archivos donde el servidor anota lo ocurrido) |
| [3] Qué | Lo que se ha visto, en una o dos frases | El equipo entiende de qué se trata |
| [4] Reproducir | Los pasos **mínimos**, sin explotar el fallo | Demostrar sin ir más allá |
| [5] Impacto | Lo que un atacante podría hacer, sin haberlo hecho | Fijar la prioridad |
| [6] Datos | Ningún dato de terceros adjunto, ni en el texto ni en una captura | No difundir datos personales |
| [7] Seguimiento | Un plazo de publicación propuesto y un contacto para responder | Establecer la divulgación coordinada |

```text
[1] Asunto: Informe de seguridad: listado de directorio en www.example.org

Hola,

[2] El 28/10/2026, hacia las 14 h (hora de París), he notado que la dirección
    https://www.example.org/copias/ muestra la lista de los archivos de la carpeta.
[3] Esta lista contiene un archivo llamado «clientes-2026.sql».
[4] Para comprobarlo: abrir la dirección anterior en un navegador.
[5] Si este archivo es efectivamente una copia de la base de clientes, cualquiera
    podría descargarla.
[6] No he abierto ni descargado ningún archivo y no adjunto ningún dato.
[7] Propongo no publicar nada antes de su corrección, o como muy pronto dentro de
    90 días sin respuesta por su parte. Puede responderme a esta dirección.

Atentamente,
Nombre Apellido
```

El ejemplo ilustra la **prueba mínima**: la propia página basta para demostrar el fallo; no es necesario abrir el archivo, y hacerlo cambiaría la naturaleza del acto.

## El recorrido de un informe

```text
1. Descubrimiento       por casualidad, o dentro de un perímetro autorizado
        |               alto: no ir más allá de lo necesario
        v
2. Prueba mínima        dirección, fecha, hora; ningún dato de terceros
        |
        v
3. Contacto             política, security.txt, plataforma o CERT nacional
        |               mensaje privado, cifrado si se facilita una clave pública
        v
4. Acuse de recibo      la organización confirma haber recibido el mensaje
        |               sin respuesta: recordatorio, y después CERT nacional
        v
5. Corrección           la organización corrige; intercambios sobre el plazo
        |
        v
6. Publicación          tras la corrección, o tras el plazo anunciado
```

## Lo que nunca se hace

| Prohibido | Por qué | Lo que sigue permitido |
|---|---|---|
| Descargar o conservar datos de terceros | Atentado contra su vida privada, y extracción de datos en el sentido de la ley | Describir lo que se ha visto, sin copia |
| Probar en las cuentas de otras personas | Se afecta directamente a un tercero | Crear las propias cuentas de prueba, si la política lo permite |
| Provocar una denegación de servicio o una prueba de carga | Obstaculización del funcionamiento del servicio | Nada: casi siempre está excluido de las políticas |
| Ir más allá de la prueba mínima (saltar a otros sistemas, instalarse, permanecer conectado) | Cada paso adicional agrava el acceso | Detenerse en cuanto el fallo esté demostrado |
| Extorsionar: pedir dinero a cambio de silencio, amenazar con publicar | Parece extorsión o chantaje, infracciones graves | Aceptar una recompensa **prevista** por un programa de bug bounty |
| Publicar antes de la corrección o antes del plazo anunciado | Expone a los usuarios | Publicar tras la corrección, de común acuerdo |
| Ignorar el perímetro de un bug bounty | Fuera del perímetro, la autorización desaparece | Tocar solo las direcciones listadas, o pedirlo por escrito |
| Engañar a las personas del sitio (mensajes falsos, véase [el phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)) | Fuera del marco de casi cualquier política | Mantenerse en el solo punto técnico |
| Vender el fallo a terceros | Grave riesgo penal y daños a los usuarios | Informarlo al propietario |

## Desde el lado del responsable del sitio

El capítulo también se dirige a quienes gestionan un sitio: son ellos quienes facilitan un informe o lo desalientan.

| Acción | Por qué | Cómo |
|---|---|---|
| Publicar una política de divulgación | Indica claramente qué está autorizado y en qué condiciones | Una página del sitio: perímetro, reglas, contacto, plazos |
| Publicar un `security.txt` | Un investigador encuentra el contacto en pocos segundos | `/.well-known/security.txt`, renovar `Expires` |
| Vigilar la dirección de contacto | Un informe ignorado acaba a veces publicado | Dirección dedicada, leída por más de una persona |
| Responder pronto | Un acuse de recibo tranquiliza y evita una publicación precipitada | En la práctica, en pocos días laborables |
| Corregir y mantener informado | El investigador puede entonces publicar con su acuerdo | Indicar una fecha de corrección, aunque sea aproximada |
| Agradecer | Anima a los informes futuros | Página de agradecimientos (`Acknowledgments`) |
| No amenazar con acciones judiciales a un investigador de buena fe | Desalienta cualquier informe, y el fallo sigue abierto | Escribir una cláusula de no persecución en la política |
| Notificar si se ven afectados datos personales | El **RGPD** (el reglamento europeo sobre la protección de datos personales) exige avisar a la autoridad (en Francia, la CNIL) en 72 horas, según el riesgo (artículo 33, a verificar en el sitio oficial) | Conservar la prueba de la fecha de descubrimiento |

## ¿Qué hacer si encuentro un fallo por casualidad?

| Situación | Qué hacer | Por qué |
|---|---|---|
| He notado un defecto visible sin forzar nada | Anotar la dirección, la fecha y la hora; no explorar; buscar el contacto | Advertir no cruza la línea |
| El sitio tiene un bug bounty o una política | Leer el perímetro, seguir las reglas, enviar el informe por el canal indicado | La autorización existe, pero solo dentro del perímetro |
| Quisiera comprobar si es realmente explotable | No hacerlo por mi cuenta; **pedir por escrito** una autorización de prueba | Sin autorización, probar es el acto arriesgado |
| Ya he abierto o descargado datos de terceros | Detenerme, no difundirlos ni enviarlos, no mencionarlos en el mensaje, consultar con un abogado antes de actuar | Las copias son una prueba en mi contra y un perjuicio para terceros |
| No encuentro ningún contacto | Escribir al CERT nacional (CERT-FR en Francia), comprobar el procedimiento en su sitio | Actúa de intermediario (a verificar en el sitio oficial) |
| Sin respuesta tras varios días | Recordar por el mismo canal, y después acudir al CERT nacional; no publicar | El silencio no autoriza la publicación |
| Me amenazan con acciones judiciales | Conservar los intercambios, no publicar nada como represalia, consultar a un abogado | Publicar bajo el enfado agrava la situación |
| El fallo está en un sistema de mi empleador o de mi cliente | Seguir la vía interna (responsable de seguridad, contrato) | El contrato puede ya fijar la regla |
| Quiero entrenarme sin riesgo | Usar un CTF o un laboratorio propio (véase [el CTF](/?c=securite&s=securite-offensive&p=ctf-capture-the-flag) y [la explotación web desde el lado del atacante](/?c=securite&s=securite-offensive&p=exploitation-web-cote-attaquant)) | El marco está pensado para eso |

## Síntesis

Buscar fallos en un sitio que no es suyo es, en general, ilegal por falta de autorización, incluso con buenas intenciones; un descubrimiento fortuito se comunica, en privado, con la prueba mínima y sin tocar los datos de otros. Un programa de recompensas o una política de divulgación dan una autorización, pero solo dentro de su perímetro; el archivo `security.txt` indica dónde escribir. La divulgación coordinada deja tiempo para corregir antes de publicar, y las organizaciones hacen posible todo esto publicando una política, respondiendo pronto y no amenazando a las personas de buena fe. En Francia, el CERT-FR de la ANSSI es el recurso cuando no existe ningún contacto.

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| «Avisé amablemente, así que es legal» | El aviso no borra el acceso no autorizado que lo precedió, y puede servir de prueba de ese acceso |
| Creer que una dirección sin contraseña está autorizada | Técnicamente accesible no significa autorizado; seguir entrando es un mantenimiento fraudulento |
| «Solo pruebo un poco para estar seguro» | Cada prueba es un acto: la verificación es lo que hace arriesgada la situación |
| Lanzar un escáner «para ayudar» | Un escáner actúa como un ataque y puede perturbar el servicio |
| Pedir dinero en un sitio sin programa de recompensas | Puede considerarse extorsión |
| Creer que un bug bounty autoriza todo el dominio | Solo están permitidos los elementos listados en el perímetro (un subdominio o un proveedor externo no forma necesariamente parte de él) |
| Creer que una promesa de no persecución vincula a la justicia y a terceros | Solo compromete a la organización que la hace (a verificar con un jurista) |
| Publicar tras cierto número de días sin avisar | La divulgación coordinada exige un plazo anunciado y un último recordatorio |
| Adjuntar capturas con datos personales | Uno mismo difunde datos que debía proteger |
| Fiarse de un `security.txt` caducado | Un archivo cuya fecha `Expires` ha pasado ya no está garantizado |
| Tomar este capítulo por un asesoramiento jurídico | Las referencias son generales: la ley cambia y cada caso es particular |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Leer la política de divulgación y su perímetro **antes** de tocar nada | La autorización solo existe dentro de ese marco |
| Entrenarse en sistemas propios, CTF o laboratorios previstos para ello | Ningún riesgo jurídico, y la misma competencia |
| Anotar la dirección, la fecha y la hora, y detenerse en la prueba mínima | Un informe preciso y sin exceso |
| Escribir un mensaje breve, neutro y factual, sin amenazas ni petición de dinero | Se tomará en serio, y la relación se mantiene sana |
| Cifrar el mensaje cuando se facilita una clave pública | Solo la organización lee los detalles |
| Conservar los intercambios por escrito | Una traza útil en caso de desacuerdo |
| Respetar el plazo anunciado, y avisar antes de publicar | El principio mismo de la divulgación coordinada |
| Pedir consejo a un abogado **antes** de ir más lejos en caso de duda | Después, es más difícil corregir |
| Del lado del sitio: publicar una política, un `security.txt`, responder pronto y no amenazar | El informe se vuelve fácil y el fallo se corrige |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Buscar un fallo sin autorización en un sitio que no es suyo es, en general, ilegal, incluso sin mala intención: en Francia, los artículos 323-1 y siguientes del Code pénal castigan el acceso o la permanencia fraudulentos en un sistema de tratamiento automatizado de datos. Una política de divulgación o un programa de bug bounty da una autorización explícita, dentro de un perímetro preciso. El archivo `security.txt` (RFC 9116, en `/.well-known/security.txt`) da el contacto de seguridad. La divulgación coordinada consiste en informar en privado, dejar un plazo para corregir y luego publicar; se opone a la divulgación inmediata. El CERT-FR de la ANSSI es el recurso en Francia (procedimiento a verificar en el sitio oficial). Un buen informe indica dónde, qué, cómo reproducir de forma breve y el impacto, sin datos de terceros. |
| **Trampas que evitar** | Creer que avisar amablemente vuelve legal lo que se hizo; confundir accesible con autorizado; escanear o probar «para ayudar»; pedir dinero fuera de un programa de recompensas; ignorar el perímetro; publicar antes de la corrección; adjuntar datos personales; contar con una promesa de no persecución como si fuera una ley. |
| **Buenas prácticas** | Leer la política antes de cualquier prueba; entrenarse en un marco previsto; detenerse en la prueba mínima; escribir un mensaje sobrio, cifrado si se facilita una clave; respetar el plazo anunciado; pedir consejo a un abogado en caso de duda; del lado del sitio, publicar una política de divulgación y un `security.txt`, responder pronto y no amenazar a las personas de buena fe. |
