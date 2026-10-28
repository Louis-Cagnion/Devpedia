---
order: 4
---

# Las contraseñas: buenas prácticas para el usuario y para el sitio (28/10/2026)

Una **contraseña** es un secreto que el usuario conoce y que entrega a un sitio para demostrar quién es: es la prueba de la familia « lo que se sabe », presentada en [Autenticación vs autorización](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation). Sigue siendo el método más extendido, y también el más frágil. Este capítulo se dirige a dos lectores a la vez: el **usuario**, que elige y conserva sus contraseñas, y el **sitio** (el programa que funciona en un servidor y que recibe esas contraseñas), cuyos desarrolladores deciden qué se acepta, qué se almacena y qué se registra.

| Parte | Para quién | Preguntas tratadas |
|---|---|---|
| [Por qué la contraseña es el eslabón débil](#por-que-la-contrasena-es-el-eslabon-debil) | Todos | Cómo se roban o se adivinan las contraseñas |
| [La fuerza de una contraseña](#la-fuerza-de-una-contrasena-un-calculo) | Todos | Cuántas combinaciones debe probar un atacante |
| [Lado del usuario](#lado-del-usuario) | Usuario | Elegir, guardar, proteger y reaccionar ante una fuga |
| [Lado del sitio](#lado-del-sitio) | Desarrollador | Aceptar, almacenar, limitar, restablecer, vigilar |
| [Los errores habituales](#los-errores-habituales-lado-del-usuario-y-lado-del-sitio) | Todos | Los fallos más frecuentes y su corrección |

Este capítulo no vuelve a explicar el almacenamiento de una contraseña: el **hash** (convertir la contraseña en una huella de sentido único) y la **sal** (un valor aleatorio añadido antes del hash) se detallan en [Contraseñas y hash seguro](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage). Los códigos JavaScript del lado del sitio se apoyan en [las funciones](/?c=langages&s=javascript&p=fonctions), [las condiciones](/?c=langages&s=javascript&p=conditions), [los arrays](/?c=langages&s=javascript&p=tableaux) y [los objetos](/?c=langages&s=javascript&p=objets).

Las recomendaciones de las normas evolucionan: las citadas aquí son del 28/10/2026, y cada enlace oficial permite volver a verificar el texto vigente.

## Por qué la contraseña es el eslabón débil

Una contraseña es un secreto que las personas deben inventar, recordar y escribir. De ello se derivan cuatro debilidades, humanas y técnicas.

| Debilidad | Lo que ocurre |
|---|---|
| **Reutilización** | La misma contraseña sirve en diez sitios: basta con que uno la filtre para que caigan las diez cuentas |
| **Fuga de base de datos** | Una **fuga** es la publicación o la reventa de datos robados a un sitio; contiene direcciones de correo electrónico y contraseñas, o sus huellas |
| **Phishing** | Un sitio o un mensaje falsos llevan al usuario a dar él mismo su contraseña (véase [Ingeniería social y phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)) |
| **Elecciones previsibles** | Las personas eligen `123456`, su nombre de pila o una fecha: los atacantes lo saben y prueban esas opciones primero |

Estas debilidades son explotadas por ataques concretos, que se desarrollan en lugares distintos:

| Ataque | Principio | Lo que lo frena |
|---|---|---|
| **Fuerza bruta en línea** | Probar todas las combinaciones posibles, una por una, a través del formulario de inicio de sesión del sitio | Límite de intentos, contraseña larga |
| **Fuerza bruta fuera de línea** | Probar todas las combinaciones sobre huellas robadas, en la propia máquina, sin ningún límite impuesto por el sitio | Contraseña larga, hash lento y con sal |
| **Ataque de diccionario** | Probar primero una lista de contraseñas probables (véase [el capítulo sobre el hash](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)) | Contraseña elegida al azar, rechazo de las contraseñas comunes por el sitio |
| **Pulverización de contraseñas** (*password spraying*) | Probar una sola contraseña muy común en miles de cuentas, para quedar por debajo de los umbrales de bloqueo por cuenta | Rechazo de las contraseñas comunes, detección en el lado del sitio |
| **Relleno de credenciales** (*credential stuffing*) | Tomar los pares correo y contraseña de una fuga y probarlos automáticamente en otros sitios | Contraseña única por sitio, segundo factor |
| **Phishing** | Obtener la contraseña de la propia víctima | Gestor de contraseñas, claves de acceso, vigilancia |

El relleno de credenciales es el más rentable para el atacante, porque la reutilización convierte la fuga de un sitio en una llave para todos los demás:

```text
Sitio A (pequeño foro) es pirateado
        |
        v
Lista robada: alice@exemple.fr + "chat2020!"   (en claro, o recuperada por diccionario)
        |
        v
Un programa prueba automáticamente esa pareja en:
        +--> el correo          : acceso concedido si Alice reutilizó la contraseña
        +--> el banco           : rechazado si la contraseña allí es distinta
        +--> las redes sociales : acceso concedido si Alice reutilizó la contraseña
```

Una cuenta de correo comprometida es la más grave: casi todos los procesos de « contraseña olvidada » envían un enlace a esa dirección (véase [el restablecimiento seguro](#un-proceso-de-restablecimiento-seguro)), así que el atacante puede después apoderarse de todas las demás cuentas.

## La fuerza de una contraseña: un cálculo

La **fuerza** de un secreto se mide por el número de combinaciones que un atacante debería probar, en el peor de los casos, para encontrarlo. Para un secreto elegido al azar, el cálculo es sencillo: **tamaño del alfabeto elevado a la potencia de la longitud**. La notación `94^8` (« 94 elevado a 8 ») quiere decir 94 × 94 × 94 × 94 × 94 × 94 × 94 × 94 (ocho veces 94). La notación científica `3,7 × 10^15` quiere decir 3,7 seguido de quince ceros desplazados, es decir, 3 700 000 000 000 000 (unos 3,7 mil billones).

Aquí se comparan dos secretos. El **alfabeto** del primero es el conjunto de los 94 caracteres imprimibles del teclado: 26 minúsculas, 26 mayúsculas, 10 cifras y 32 símbolos. El alfabeto del segundo es una lista de **7 776 palabras**, la del método de los dados (6^5 = 7 776, es decir, cinco lanzamientos de un dado de seis caras por palabra, véase [la lista de la EFF](https://www.eff.org/dice)): cada palabra extraída cuenta entonces como un « carácter » entre 7 776.

| Secreto elegido al azar | Cálculo | Combinaciones | Bits |
|---|---|---|---|
| 8 minúsculas | 26^8 | 2,1 × 10^11 (208 827 064 576) | 37,6 |
| 8 caracteres entre 94 | 94^8 | 6,1 × 10^15 (6 095 689 385 410 816) | 52,4 |
| Frase de 4 palabras | 7776^4 | 3,7 × 10^15 (3 656 158 440 062 976) | 51,7 |
| Frase de 5 palabras | 7776^5 | 2,8 × 10^19 | 64,6 |
| Frase de 6 palabras | 7776^6 | 2,2 × 10^23 | 77,5 |
| 12 caracteres entre 94 | 94^12 | 4,8 × 10^23 | 78,7 |

Un **bit** es una unidad de medida de la fuerza: cada bit de más duplica el número de combinaciones (52 bits quieren decir 2^52 combinaciones). Estos valores se recalculan con Node.js (el entorno que ejecuta JavaScript fuera de un navegador):

```bash
# node -e ejecuta el código JavaScript dado entre comillas; BigInt (el sufijo n) evita
# los redondeos en números muy grandes; ** es la potencia
node -e "console.log((7776n ** 4n).toString())"   # muestra 3656158440062976
node -e "console.log((94n ** 8n).toString())"     # muestra 6095689385410816
```

Los tiempos de ataque dependen de la velocidad del atacante. Este es el tiempo para **probarlo todo** (de media basta con la mitad), con dos velocidades de referencia: 10 000 millones de intentos por segundo, orden de magnitud de un hash rápido atacado con hardware especializado, y 10 000 por segundo, orden de magnitud de un hash lento (véase [Contraseñas y hash seguro](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)). Son hipótesis para comparar, no mediciones.

| Secreto | A 10 000 millones de intentos por segundo | A 10 000 intentos por segundo |
|---|---|---|
| 8 minúsculas | 21 segundos | 242 días |
| 8 caracteres entre 94 | 7,1 días | 19 300 años |
| Frase de 4 palabras | 4,2 días | 11 600 años |
| Frase de 5 palabras | 90 años | 90 millones de años |
| Frase de 6 palabras | 700 000 años | 700 mil millones de años |

Cuatro enseñanzas:

| Enseñanza | Explicación |
|---|---|
| **4 palabras valen más o menos 8 caracteres aleatorios** | 51,7 bits frente a 52,4: la frase no es más fuerte, pero se retiene, mientras que `k7#Qx!9r` se olvida o se anota |
| **Cada palabra de más multiplica por 7 776** | 5 palabras son 4 664 veces más difíciles de encontrar que 8 caracteres entre 94: la longitud gana a la complejidad |
| **El cálculo supone un sorteo al azar** | Una persona que « inventa » sus 8 caracteres los elige según los mismos patrones que todo el mundo (`Verano2026!`): el atacante los prueba mucho antes que el resto. Hace falta un sorteo aleatorio (dados, generador del gestor) |
| **El hash del sitio lo cambia todo** | El mismo secreto pasa de unos pocos días a miles de años según el sitio almacene un hash rápido o lento |

De ahí la regla práctica: **5 palabras como mínimo** para una contraseña que se recuerda de memoria, **6 palabras** o más para la contraseña maestra de un gestor (véase más abajo), y contraseñas aleatorias de 16 caracteres o más para todo lo que el gestor recuerda en lugar del usuario.

## Lado del usuario

### La longitud antes que la complejidad aparente

Una contraseña « compleja » según las reglas habituales (una mayúscula, una cifra, un símbolo) no es necesariamente fuerte: las personas cumplen esas reglas con gestos previsibles.

| Contraseña | Veredicto | Por qué |
|---|---|---|
| `P@ssw0rd1!` | Débil | Sustituir `a` por `@` y `o` por `0` es el primer reflejo que prueban los atacantes |
| `Verano2026!` | Débil | Una palabra, un año, un símbolo: un patrón corriente |
| `jXe8#pL2` | Media | Aleatoria pero corta (52 bits) y difícil de recordar |
| `caballo grapa nube tejido piano` | Fuerte | 5 palabras elegidas al azar: 64,6 bits, fácil de recordar |
| `bP4$kz7-Qw2!mTr9vX` | Fuerte | 18 caracteres elegidos al azar, guardados por el gestor |

### La frase de contraseña

Una **frase de contraseña** es una contraseña formada por varias palabras, separadas por espacios o por un guion. El método probado: sacar 5 palabras **al azar** (con dados y la [lista de la EFF](https://www.eff.org/dice), o con el generador de frases de un gestor de contraseñas), nunca elegirlas uno mismo.

| Qué hacer | Qué evitar |
|---|---|
| Sacar las palabras al azar, sin « mejorarlas » | Elegir cinco palabras que gusten o que tengan relación entre sí |
| Conservar la frase tal cual: el número de palabras da la fuerza | Añadir un `1` y un `!` al final « por la forma » |
| Usar la frase para un solo uso: la contraseña maestra o el inicio de sesión del ordenador | Reutilizar la misma frase en varios sitios |
| 5 palabras como mínimo, 6 para la contraseña maestra | Una cita célebre, letra de una canción, un refrán: aparecen en los diccionarios de los atacantes |

### Una contraseña única por sitio

El relleno de credenciales muestra por qué: si cada sitio tiene su propia contraseña, la fuga de un sitio solo da acceso a ese sitio. Recordar decenas de contraseñas distintas es imposible a mano, de ahí el gestor.

### El gestor de contraseñas

Un **gestor de contraseñas** es un programa (una aplicación, una extensión del navegador) que guarda todas las contraseñas en una **bóveda cifrada** (un archivo que se vuelve ilegible mediante [cifrado](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)), que se abre con una sola contraseña: la **contraseña maestra**. Dos ejemplos de programas: [KeePassXC](https://keepassxc.org/) (la bóveda sigue siendo un archivo en el dispositivo) y [Bitwarden](https://bitwarden.com/) (la bóveda cifrada se sincroniza entre dispositivos). Los navegadores también ofrecen uno, más sencillo.

| Lo que hace el gestor | Lo que aporta |
|---|---|
| Genera contraseñas aleatorias y largas | Cada sitio tiene una contraseña única que nadie adivina |
| Lo recuerda todo y rellena los formularios | El usuario ya no tiene que recordar ni escribir |
| Solo rellena en la **dirección correcta** del sitio | Un sitio falso (phishing) no se reconoce: si no se propone nada en una página de inicio de sesión que debería ser conocida, la dirección es sospechosa |
| Señala las contraseñas reutilizadas, débiles o que han aparecido en una fuga | Da la lista de lo que hay que cambiar |
| Sincroniza entre dispositivos | El teléfono y el ordenador tienen la misma bóveda |

La bóveda solo está protegida por la contraseña maestra: si un atacante copia el archivo cifrado, lo ataca **fuera de línea**, sin límite de intentos. Esa contraseña debe, por tanto, ser:

| Exigencia | Motivo |
|---|---|
| Una frase de 6 palabras elegidas al azar, o más | Es la única barrera frente a una fuerza bruta fuera de línea |
| Única: nunca usada en otro lugar | Una fuga en otro sitio no debe abrir la bóveda |
| Nunca guardada en la bóveda ni en un archivo sin cifrar | La bóveda permanece cerrada mientras no se conozca la contraseña |
| Completada con un segundo factor en la cuenta del gestor, cuando ofrece uno | Una contraseña maestra robada no basta entonces |

**Copia de seguridad:** la mayoría de los gestores no pueden recuperar una contraseña maestra olvidada (es intencionado: el proveedor no la conoce). Conviene, pues, prever una **clave de recuperación** impresa o una copia cifrada de la bóveda, guardada en un lugar seguro (una caja fuerte física, un cajón cerrado), y probarla una vez. Los dispositivos de uso diario se averían: una bóveda única sin copia es un riesgo.

### La autenticación multifactor y las claves de acceso

La **autenticación multifactor** (MFA) exige dos pruebas de familias distintas; se detalla en [Autenticación multifactor](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur), con los códigos de un solo uso (TOTP) y las claves de seguridad físicas (FIDO2/WebAuthn).

Una **clave de acceso** (*passkey*) va más allá: sustituye a la contraseña. Se basa en el mismo principio que las claves de seguridad FIDO2/WebAuthn: en el alta se crea un par de claves matemáticas; la parte **privada** permanece en el dispositivo (o en el gestor que la sincroniza), y el sitio solo recibe la parte **pública**. Al iniciar sesión, el dispositivo demuestra que posee la clave privada, tras una acción local (huella dactilar, código del dispositivo), y la prueba solo es válida para la dirección exacta del sitio.

| Método | Protege contra | Límite principal |
|---|---|---|
| Contraseña sola | Nada si la contraseña se filtra | Reutilización, fuga, phishing |
| Contraseña y código por SMS | Una contraseña robada sola | Desvío del número de teléfono (*SIM swapping*) |
| Contraseña y aplicación TOTP | Una contraseña robada sola | Un sitio falso puede recoger el código escrito |
| Clave de acceso o clave de seguridad | Fuga y phishing: nada que robar ni reutilizar, y la clave rechaza un sitio falso | Todos los sitios aún no la ofrecen (28/10/2026); hay que prever la pérdida del dispositivo |

Conviene activarla con prioridad en las cuentas que dan acceso a otras: el correo, el gestor de contraseñas, el banco.

### Comprobar si una cuenta figura en una fuga

El servicio gratuito [Have I Been Pwned](https://haveibeenpwned.com/) (un servicio privado, no público) recoge las fugas conocidas: se introduce la dirección de correo electrónico y se indica en qué fugas figura; también ofrece una alerta al registrarse y un control de contraseñas. Para una contraseña, el método está concebido para no enviar nunca la contraseña en sí (véase [el código del sitio](#rechazar-las-contrasenas-debiles-y-conocidas)). Figurar en una fuga no significa que la cuenta haya sido atacada, sino que la contraseña utilizada entonces debe considerarse conocida.

### Qué hacer después de una fuga

| Paso | Acción | Motivo |
|---|---|---|
| 1 | Ir al sitio en cuestión escribiendo uno mismo su dirección (no a través de un enlace recibido) y cambiar la contraseña | Un correo « su cuenta se ha filtrado, haga clic aquí » suele ser un phishing |
| 2 | Cambiar esa contraseña **en todos los sitios donde se haya reutilizado**, empezando por el correo y el banco | El relleno de credenciales la prueba en todos los sitios |
| 3 | Activar el segundo factor o una clave de acceso | La contraseña sola ya no basta para los atacantes |
| 4 | Revisar los dispositivos conectados, las direcciones de recuperación y las reglas de redirección del correo | Un atacante que ya ha entrado deja allí accesos de respaldo |
| 5 | Vigilar los extractos bancarios y desconfiar de los mensajes que siguen a la fuga | Los ladrones aprovechan la actualidad de una fuga para hacer phishing |
| 6 | Si se ven afectados datos bancarios o de identidad, avisar al banco o al organismo | Solicitar la oposición o vigilar el uso de esos datos |

### No compartir nunca, no anotar en claro

| Regla | Precisión |
|---|---|
| Nunca dar la contraseña, a nadie | Ningún servicio técnico, ningún banco, ningún administrador legítimo la pide: una petición así es un intento de phishing |
| Para compartir un acceso, usar la función de compartir del gestor o cuentas distintas | Una contraseña enviada por mensaje queda legible en el historial y en los servidores del correo |
| No anotar las contraseñas en un archivo, un mensaje o un papel visible | Una nota en claro la lee cualquiera que acceda al dispositivo o a la oficina |
| Única excepción razonable: la clave de recuperación del gestor en papel, guardada en un lugar seguro | Un papel encerrado protege mejor que un secreto olvidado |

### Desconfianza hacia las preguntas de seguridad

Una **pregunta de seguridad** (« ¿nombre de su primera mascota? ») sirve de segundo medio para recuperar una cuenta. Su respuesta es una segunda contraseña, pero débil: se encuentra en las redes sociales o se adivina. No cuenta como segundo factor (véase [Autenticación multifactor](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur)). Cuando un sitio la impone, conviene responder con un **texto aleatorio**, sin relación con la pregunta, y guardarlo en el gestor como una contraseña.

## Lado del sitio

Un sitio no controla lo que hace el usuario, pero decide qué acepta, qué almacena, qué deja probar y qué escribe en sus registros. Sus decisiones responden a recomendaciones publicadas.

### Las recomendaciones del NIST

El **NIST** (*National Institute of Standards and Technology*) es el organismo estadounidense de normalización. Su documento **SP 800-63B** (*Special Publication*, volumen B de las directrices sobre la identidad digital) describe cómo gestionar la autenticación y es una referencia en todo el mundo; se publica en [pages.nist.gov/800-63-4](https://pages.nist.gov/800-63-4/). Sus principales exigencias sobre las contraseñas:

| Recomendación | Contenido | Motivo |
|---|---|---|
| **Longitud mínima** | Al menos 8 caracteres cuando la contraseña se usa con un segundo factor; la revisión 4 exige 15 caracteres cuando se usa sola (a verificar en la fuente oficial) | La longitud multiplica las combinaciones más que cualquier regla de composición |
| **Longitud máxima** | Aceptar al menos 64 caracteres | Las frases de contraseña y las contraseñas generadas son largas |
| **Todos los caracteres** | Aceptar espacios, símbolos y caracteres Unicode; no truncar en silencio | Una frase de contraseña contiene espacios; un truncamiento hace el secreto más corto de lo previsto |
| **Pegado y gestores** | Permitir pegar en el campo | Sin pegado, el gestor no puede rellenar: los usuarios eligen contraseñas más cortas |
| **Sin reglas de composición** | No imponer « una mayúscula, una cifra, un símbolo » | Estas reglas producen `Password1!` en lugar de secretos fuertes |
| **Sin cambio periódico** | No imponer renovación cada 90 días; imponer un cambio solo ante un compromiso probado | Un cambio forzado produce `Verano2026!` y luego `Otono2026!` |
| **Rechazo de contraseñas conocidas** | Comparar con una lista de contraseñas comprometidas, demasiado comunes, o construidas sobre el nombre del sitio o el identificador | Una contraseña larga puede figurar aun así en las listas de los atacantes |
| **Sin preguntas de seguridad ni pistas** | No proponer « nombre de su primera mascota » | La respuesta se adivina y deja la cuenta tan débil como la pregunta |
| **Limitación de intentos** | Limitar los intentos fallidos de una cuenta (el NIST cita un tope del orden de 100 intentos consecutivos: a verificar en la fuente oficial) | Sin límite, la fuerza bruta en línea es posible |

Estas recomendaciones coinciden con la [política de contraseñas](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) descrita en el capítulo sobre el hash: precisan la longitud mínima (el capítulo vecino cita 12 caracteres, una elección del sitio más exigente que el mínimo del NIST). **OWASP** (una comunidad que publica guías de seguridad web, véase [El OWASP Top 10](/?c=securite&s=cybersecurite&p=owasp-top-10)) mantiene las mismas posiciones en su [ficha sobre la autenticación](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

### Las recomendaciones de la ANSSI

La **ANSSI** (Agencia Nacional de Seguridad de los Sistemas de Información) es la autoridad francesa de ciberseguridad. Publica en [cyber.gouv.fr](https://cyber.gouv.fr/) una guía titulada « Recomendaciones relativas a la autenticación multifactor y a las contraseñas » (a verificar en la fuente oficial). Sus grandes líneas, que conviene volver a verificar en el texto oficial antes de citarlas:

| Principio | Contenido |
|---|---|
| Preferir el multifactor | Añadir un segundo factor en cuanto el servicio lo permita (a verificar en la fuente oficial) |
| Una contraseña por servicio | No reutilizar nunca una contraseña de un servicio a otro (a verificar en la fuente oficial) |
| Contraseñas largas | Dar prioridad a la longitud y a las frases de contraseña (a verificar en la fuente oficial) |
| Un gestor de contraseñas | Recomendado para mantener una contraseña única por servicio (a verificar en la fuente oficial) |
| Un almacenamiento no reversible | Del lado del sitio, contraseñas con hash y sal, nunca en claro (a verificar en la fuente oficial) |

Los valores numéricos exactos (longitud mínima, entropía objetivo según el nivel de seguridad) se leen en la propia guía: dependen del nivel de seguridad del sistema y no se reproducen aquí.

### El almacenamiento: recordatorio y remisión

El almacenamiento se trata en detalle en [Contraseñas y hash seguro](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage): un hash lento y con sal, nunca la contraseña en claro, nunca un cifrado reversible. Entre las funciones adecuadas, **Argon2id** (la variante de Argon2 que las guías actuales recomiendan en primer lugar) y **bcrypt** se usan mediante una función de la biblioteca del lenguaje, nunca reescrita a mano. Un único punto de vigilancia se añade aquí: **bcrypt solo lee los primeros 72 octetos** de la contraseña (un **octeto** es un grupo de 8 bits; un carácter acentuado ocupa a menudo 2). Una frase de contraseña larga puede, pues, truncarse sin error: hay que leer la documentación de la biblioteca utilizada y elegir en consecuencia (a verificar en la fuente oficial de la biblioteca).

### Limitar los intentos sin provocar denegación de servicio

Una **denegación de servicio** consiste en volver inutilizable un servicio para los usuarios legítimos (véase [Sobrecarga y denegación de servicio a nivel de aplicación](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)). Un bloqueo demasiado severo la provoca: si cinco intentos fallidos bloquean una cuenta durante una hora, cualquiera puede bloquear la cuenta de Alice fallando a propósito. El principio general de limitación del tráfico se presenta en [Seguridad de las API web](/?c=securite&s=cybersecurite&p=securite-api-web).

| Medida | Principio | Precaución |
|---|---|---|
| **Retardo progresivo** | Cada fallo duplica la espera antes del siguiente intento (1 s, 2 s, 4 s, 8 s, con tope de unos minutos) | Nada de bloqueo definitivo: la espera basta para arruinar la fuerza bruta |
| **Contador por cuenta Y por dirección IP** | Contar los fallos sobre una misma cuenta y sobre una misma dirección IP (la dirección que identifica una máquina en la red) | La pulverización de contraseñas afecta a muchas cuentas con pocos intentos cada una: el contador por IP la detecta |
| **Dispositivo ya conocido** | La espera es más flexible para un navegador ya usado con éxito (una cookie firmada, véase [Sesiones y cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies)) | El verdadero usuario sigue pudiendo entrar mientras el atacante, en otra parte, se ralentiza |
| **Prueba anti-robot (CAPTCHA)** | Un **CAPTCHA** es una prueba diseñada para distinguir a una persona de un programa; se exige tras algunos fallos | Un CAPTCHA por sí solo no es un límite: se elude, complementa |
| **Respuesta HTTP 429** | Código de estado « demasiadas peticiones », con la cabecera `Retry-After` que indica cuándo volver a intentarlo (véase [Los intercambios de datos: API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) | El contador vive en el **servidor**, nunca en una cookie que controla el cliente |
| **Alerta y segundo factor reforzado** | Avisar al titular de una serie de fallos; exigir el segundo factor en un inicio de sesión inusual | Evita inutilizar una cuenta con un bloqueo |

### Un mensaje de error idéntico, exista o no la cuenta

Un formulario que responde « esta cuenta no existe » a un intento y « contraseña incorrecta » a otro revela qué cuentas existen (véase [Lógica de negocio y elusiones automatizadas](/?c=securite&s=cybersecurite&p=logique-metier-et-automatisation)). La respuesta debe ser, pues, **la misma** en todos los casos, para el inicio de sesión y para el restablecimiento:

```text
Inicio de sesión
   dirección desconocida ->  « Identificador o contraseña incorrectos »
   contraseña errónea    ->  « Identificador o contraseña incorrectos »

Restablecimiento
   dirección desconocida ->  « Si la cuenta existe, se acaba de enviar un correo »
   dirección conocida    ->  « Si la cuenta existe, se acaba de enviar un correo »
```

El **tiempo de respuesta** también debe seguir siendo comparable: si no, una respuesta rápida (ningún hash que calcular) delata una cuenta inexistente. Dos medios: calcular igualmente el hash de la contraseña introducida contra una huella falsa para las cuentas desconocidas; enviar el correo de restablecimiento en una tarea en segundo plano en lugar de antes de responder. En el registro, « esta dirección ya está en uso » da la misma información: la solución es responder « se ha enviado un correo de confirmación » en todos los casos, explicando la situación en el propio correo.

### Un proceso de restablecimiento seguro

El restablecimiento (« contraseña olvidada ») es el camino más atacado: para un atacante es más fácil hacer que le envíen un acceso que adivinar una contraseña. Un **token** es aquí una cadena de caracteres aleatorios, que sirve de prueba temporal y se incluye en el enlace enviado por correo.

```text
Usuario                              Sitio                             Buzón de correo
    |                                  |                                     |
 1. « Olvidé mi contraseña » (correo)->|                                     |
    |                                  | 2. busca la cuenta (puede que no exista)
    |<- 3. mismo mensaje en todos los casos: « Si la cuenta existe, se envía un correo »
    |                                  | 4. si la cuenta existe: crea un token aleatorio,
    |                                  |    guarda huella, hora límite, « no usado »
    |                                  |-- 5. envía el enlace con el token ->|
    |<------------------------------------------ 6. lee el correo ----------|
 7. haz clic en el enlace ------------>| 8. comprueba: huella, caducidad, uso único
    |<- 9. formulario « nueva contraseña » (misma política que en el alta)
10. envía la nueva contraseña -------->| 11. aplica hash, guarda; marca el token « usado » ;
    |                                  |     cierra todas las sesiones abiertas
    |                                  |-- 12. correo « cambiado » --------->|
```

| Regla | Motivo |
|---|---|
| Token obtenido de un [generador aleatorio criptográfico](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs), de al menos 128 bits (el código de abajo usa 256) | Un token previsible permite restablecer la cuenta de otro |
| Guardar solo la **huella** del token, no el token | Una fuga de la base no da ningún enlace de restablecimiento utilizable |
| **Uso único**: marcado como « usado » en cuanto se utiliza por primera vez | Un enlace releído en un historial no debe abrir nada |
| **Vida corta** (del orden de 15 a 60 minutos) | Un correo olvidado en un buzón no sigue siendo peligroso |
| Una nueva petición invalida los tokens anteriores | Un solo enlace válido a la vez |
| Nunca **enviar una contraseña** por correo, ni « temporal » | Un correo viaja y queda almacenado en claro; enviar una contraseña obliga al sitio a conocerla, por tanto a almacenarla en claro |
| No iniciar sesión automáticamente tras el cambio | El cambio debe seguir siendo una operación distinta de un inicio de sesión |
| Cerrar las sesiones abiertas tras el cambio | Un atacante ya conectado pierde su acceso |
| Enlace solo en HTTPS, página sin recursos de terceros | La dirección que contiene el token puede transmitirse a un tercero por ciertas cabeceras del navegador (a verificar en la [ficha de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)) |

Fabricar el token y su huella, del lado del servidor, con el módulo `node:crypto` incluido con Node.js:

```javascript
const crypto = require("node:crypto");   // módulo de criptografía incluido con Node.js

const DURACION_VALIDEZ_MS = 30 * 60 * 1000;   // 30 minutos, en milisegundos

// Fabrica un token de restablecimiento: solo se conserva su huella en el servidor
function crearTokenRestablecimiento() {
    // randomBytes saca 32 octetos (256 bits) de un generador aleatorio criptográfico
    const token = crypto.randomBytes(32).toString("hex");   // 64 caracteres hexadecimales
    // Un token aleatorio no se adivina por diccionario: un hash rápido (SHA-256)
    // basta para su huella, bcrypt sería inútil
    const huella = crypto.createHash("sha256").update(token).digest("hex");
    return {
        token: token,              // se envía UNA vez por correo, nunca se almacena
        huella: huella,            // se guarda en la base con los dos campos siguientes
        expiraEn: Date.now() + DURACION_VALIDEZ_MS,   // Date.now(): la hora actual en ms
        usado: false,              // pasará a true en cuanto se use por primera vez
    };
}

const ejemplo = crearTokenRestablecimiento();
console.log(ejemplo.token.length, ejemplo.huella.length, ejemplo.usado);   // 64 64 false
```

`require` carga un módulo, `"hex"` escribe los octetos en hexadecimal (cifras del 0 al 9 y letras de la a a la f), y `SHA-256` es una función de hash rápida, adecuada aquí porque el token ya es aleatorio (el hash lento protege, en cambio, los secretos elegidos por personas: véase [el capítulo sobre el hash](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)).

### Avisar al usuario de cualquier cambio

El sitio envía un correo a la dirección **registrada** (no a una dirección escrita en la petición) cada vez que cambia la contraseña, la dirección de correo electrónico o el segundo factor.

| El correo contiene | El correo nunca contiene |
|---|---|
| Qué ha cambiado y a qué hora | La nueva contraseña |
| El dispositivo y la región aproximada, si el sitio los conoce | Un enlace que conecte directamente sin otra verificación |
| Un enlace « No fui yo » hacia un procedimiento de recuperación de la cuenta | El token de restablecimiento ya utilizado |

### Registrar sin escribir nunca la contraseña

Un **registro** (*log*) es un archivo donde el programa escribe lo que ocurre: peticiones recibidas, errores, inicios de sesión. Lo leen los desarrolladores, lo copian a otras herramientas y lo conservan mucho tiempo: una contraseña que entra allí permanece.

| Qué registrar | Qué no registrar nunca |
|---|---|
| Un intento de inicio de sesión, con éxito o no, con el identificador, la hora y la dirección IP | La contraseña introducida, incluso « incorrecta »: un error de tecleo suele ser la contraseña real de otro sitio |
| Las peticiones de restablecimiento, los cambios de contraseña | El token de restablecimiento o el enlace completo |
| Los bloqueos y las alertas de la limitación de intentos | El cuerpo entero de una petición de inicio de sesión o de registro |

Las fugas suelen producirse sin que nadie lo haya decidido: una herramienta que guarda **todas** las peticiones, un rastro de error que muestra los parámetros recibidos, una herramienta de estadísticas que copia los campos de un formulario. Hay que **excluir** explícitamente los campos de contraseña de esos registros. Los secretos de infraestructura tienen sus reglas en [Gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets).

### Rechazar las contraseñas débiles y conocidas

La validación se escribe en el **servidor** (el código que se ejecuta en el sitio): una verificación hecha solo en la página del navegador se elude en pocos segundos. El código siguiente controla la longitud y rechaza las contraseñas comunes o que contienen el identificador, sin ninguna regla de composición. Utiliza un `Set` (un conjunto de valores sin duplicados, véase [los arrays](/?c=langages&s=javascript&p=tableaux)) y la normalización **Unicode** (la norma que numera todos los caracteres, véase [La codificación de textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)).

```javascript
// Conjunto (Set) de contraseñas muy comunes, en minúsculas (lista reducida aquí)
const CONTRASENAS_COMUNES = new Set([
    "password", "123456", "123456789", "qwerty", "azerty",
    "contraseña", "azertyuiop", "letmein", "iloveyou", "111111",
]);

const LONGITUD_MIN = 12;    // mínimo elegido por el sitio (el NIST exige al menos 8)
const LONGITUD_MAX = 128;   // máximo amplio (al menos 64): solo rechaza el abuso

// Devuelve la lista de problemas de la contraseña; lista vacía = « aceptada »
function verificarContrasena(introducida, identificador) {
    // normalize("NFKC") unifica las escrituras de un mismo carácter Unicode (una « é » puede
    // ser una sola letra o una « e » seguida de un acento) antes de contar
    const contrasena = introducida.normalize("NFKC");
    // [...texto] separa en caracteres enteros: un emoji cuenta como 1, no como 2
    const longitud = [...contrasena].length;
    const minusculas = contrasena.toLowerCase();   // para ignorar las mayúsculas
    const problemas = [];                          // lista vacía al principio

    if (longitud < LONGITUD_MIN) {
        problemas.push("Demasiado corta: al menos " + LONGITUD_MIN + " caracteres");
    }
    if (longitud > LONGITUD_MAX) {
        problemas.push("Demasiado larga: como máximo " + LONGITUD_MAX + " caracteres");
    }
    if (CONTRASENAS_COMUNES.has(minusculas)) {  // has: verdadero si está en la lista
        problemas.push("Contraseña demasiado común");
    }
    // includes: verdadero si un texto contiene otro; se rechaza el identificador dentro
    if (identificador && minusculas.includes(identificador.toLowerCase())) {
        problemas.push("No debe contener el identificador");
    }
    return problemas;
}

// Ninguna regla « una mayúscula, una cifra, un símbolo »: solo cuenta la longitud
console.log(verificarContrasena("azerty", "alice"));
console.log(verificarContrasena("alice-ama-a-los-gatos", "alice"));
console.log(verificarContrasena("caballo grapa nube tejido", "alice"));
```

Resultado mostrado:

```text
[ 'Demasiado corta: al menos 12 caracteres', 'Contraseña demasiado común' ]
[ 'No debe contener el identificador' ]
[]
```

La lista de diez palabras es una muestra: un sitio real carga un archivo de miles o millones de contraseñas comunes, o consulta un servicio que conoce las fugas. [Have I Been Pwned](https://haveibeenpwned.com/) ofrece ese servicio sin que la contraseña salga del sitio, gracias a una técnica de **anonimato por prefijo**: se calcula la huella SHA-1 de la contraseña, solo se envían sus 5 primeros caracteres, el servicio devuelve todos los sufijos conocidos que empiezan así, y la comparación se hace en nuestro lado. Esta huella SHA-1 sirve únicamente para consultar el servicio, nunca para almacenar.

```javascript
const crypto = require("node:crypto");   // módulo de criptografía incluido con Node.js

// Verdadero si la contraseña figura en fugas conocidas de Have I Been Pwned
async function estaEnUnaFuga(contrasena) {
    // SHA-1 de la contraseña, en hexadecimal mayúscula (el formato que espera el servicio)
    const resumen = crypto.createHash("sha1").update(contrasena).digest("hex");
    const huella = resumen.toUpperCase();
    const prefijo = huella.slice(0, 5);   // 5 primeros caracteres: los únicos que se envían
    const sufijo = huella.slice(5);       // el resto nunca sale de nuestro servidor
    // fetch envía una petición HTTP; el servicio responde con los sufijos de ese prefijo
    const respuesta = await fetch("https://api.pwnedpasswords.com/range/" + prefijo);
    const texto = await respuesta.text();   // una línea « SUFIJO:NÚMERO » por sufijo
    // Buscamos nuestro sufijo entre las líneas recibidas
    return texto.split("\n").some((linea) => linea.startsWith(sufijo));
}
```

Una función `async` (declarada con esta palabra) puede esperar el resultado de una operación lenta con `await`, sin bloquear el resto del programa; `slice(a, b)` extrae un fragmento de texto; `some` comprueba que al menos un elemento de una lista cumple una condición. Estas nociones se detallan en [el capítulo sobre la programación asíncrona](/?c=langages&s=javascript&p=asynchrone) y [el capítulo sobre las strings](/?c=langages&s=javascript&p=strings). Dos decisiones de diseño que escribir en la documentación del sitio: qué hacer si el servicio es inaccesible (en general, aceptar la contraseña antes que bloquear el registro), y rechazar la contraseña solo al crearla o cambiarla, no a un usuario que ya inicia sesión.

## Los errores habituales, lado del usuario y lado del sitio

| Lado | Error | Consecuencia | Corrección |
|---|---|---|---|
| Usuario | La misma contraseña en varios sitios | Una fuga abre todas las cuentas (relleno de credenciales) | Una contraseña única por sitio, guardada en un gestor |
| Usuario | Contraseña corta « compleja » (`P@ssw0rd1!`) | Encontrada por las listas de variantes habituales | Frase de 5 palabras elegidas al azar o contraseña aleatoria larga |
| Usuario | Contraseña maestra débil o reutilizada | Toda la bóveda cae de golpe | Frase de 6 palabras elegidas al azar, única, con un segundo factor |
| Usuario | Sin segundo factor en el correo | Los restablecimientos de las demás cuentas pasan por él | MFA o clave de acceso en el correo, con prioridad |
| Usuario | Mantener la misma contraseña tras una fuga | El atacante ya tiene la lista | Cambiarla dondequiera que se usó, activar el segundo factor |
| Usuario | Dar la contraseña por mensaje o teléfono | Phishing exitoso | No darla nunca; pasar por el sitio oficial |
| Usuario | Responder con sinceridad a las preguntas de seguridad | Respuestas encontradas en las redes sociales | Respuesta aleatoria guardada en el gestor |
| Sitio | Reglas de composición y renovación cada 90 días | Contraseñas previsibles (`Otono2026!`) | Longitud mínima, rechazo de las contraseñas conocidas, sin renovación periódica |
| Sitio | Prohibir pegar o limitar a 16 caracteres | Gestores y frases de contraseña inutilizables | Permitir pegar, aceptar al menos 64 caracteres |
| Sitio | Mensaje « esta cuenta no existe » | Los atacantes elaboran la lista de cuentas | Mensaje idéntico en todos los casos |
| Sitio | Bloqueo definitivo tras 5 fallos | Un atacante bloquea la cuenta ajena (denegación de servicio) | Retardo progresivo, contadores por cuenta y por dirección |
| Sitio | Enviar una contraseña por correo | Circula y queda legible en el buzón | Enlace con token aleatorio, de uso único y vida corta |
| Sitio | Escribir la contraseña en los registros | Legible por todos los que leen los registros | Excluir los campos de contraseña de todo registro |
| Sitio | Almacenar en claro, o con hash SHA-256 o MD5 | Contraseñas legibles o recuperadas en pocas horas tras una fuga | Argon2id o bcrypt con sal (véase el capítulo sobre el hash) |

## Síntesis

| Tema | El usuario | El sitio |
|---|---|---|
| Longitud | Frase de contraseña de 5 palabras como mínimo | Aceptar al menos 64 caracteres, mínimo 8 o más según el contexto |
| Complejidad | Innecesaria si la contraseña es larga y aleatoria | No imponer composición |
| Unicidad | Una contraseña por sitio, mediante un gestor | Rechazar las contraseñas ya comprometidas |
| Almacenamiento | Gestor protegido por una contraseña maestra sólida | Hash lento y con sal, nunca la contraseña en claro |
| Segundo factor | MFA o claves de acceso en todas partes donde sea posible | Ofrecer el MFA y las claves de acceso |
| Ataques por intentos | Contraseña aleatoria larga | Retardos progresivos, contadores por cuenta y por IP |
| Recuperación | Correo protegido, preguntas de seguridad aleatorias | Token de uso único y vida corta, mensaje idéntico |
| Tras un incidente | Cambiar en todas partes, activar el segundo factor | Notificar, cerrar las sesiones, registrar sin contraseña |

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Creer que un indicador de fuerza verde basta | Mide la complejidad aparente y deja pasar `Password1!` | Rechazar las contraseñas conocidas en lugar de fiarse de un color |
| Fiarse de 4 palabras elegidas « al azar » uno mismo | Una persona no es un generador aleatorio | Sacar las palabras con dados o con un generador |
| Contraseña ausente de una fuga = contraseña fuerte | La comprobación no dice que una contraseña sea sólida, solo que no es ya conocida | Combinar control de fugas y longitud mínima |
| Contraseña maestra sin clave de recuperación | Un olvido deja la bóveda definitivamente ilegible | Clave de recuperación guardada fuera de línea y probada |
| Recuperar una cuenta por SMS o por preguntas de seguridad | El camino de recuperación se convierte en el punto débil, pese a un segundo factor sólido | La misma exigencia para la recuperación que para el inicio de sesión |
| Mensaje de restablecimiento distinto según exista o no la cuenta | Enumeración de cuentas | Mismo mensaje, mismo tiempo de respuesta |
| Truncamiento silencioso de las contraseñas largas (bcrypt: 72 octetos) | Una frase de 100 caracteres protege lo mismo que una de 72 octetos | Leer la documentación de la biblioteca y rechazar, en lugar de truncar sin avisar |
| Token de restablecimiento reutilizable o sin caducidad | Un enlace antiguo sigue válido indefinidamente | Uso único, caducidad, invalidación en cada nueva petición |
| Registrar las peticiones enteras en caso de error | Las contraseñas acaban en los registros | Excluir los campos sensibles antes de cualquier registro |
| Verificar la contraseña solo en el navegador | Se elude en pocos segundos | Validar siempre en el servidor |
| Forzar el cambio periódico por costumbre | Contraseñas más previsibles | Cambiar solo tras un compromiso probado |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Usuario: un gestor de contraseñas, una contraseña aleatoria por sitio | Elimina la reutilización sin pedir memoria |
| Usuario: frase de contraseña de 5 palabras (6 para la contraseña maestra), elegida al azar | Longitud elevada y fácil de recordar |
| Usuario: segundo factor o clave de acceso, empezando por el correo | Una contraseña robada ya no basta |
| Usuario: comprobar sus direcciones en [Have I Been Pwned](https://haveibeenpwned.com/), actuar deprisa tras una fuga | El plazo entre fuga y ataque es corto |
| Usuario: respuestas aleatorias a las preguntas de seguridad, guardadas en el gestor | Ya no se adivinan |
| Sitio: mínimo 8 caracteres o más, al menos 64 aceptados, pegado permitido | Recomendaciones del NIST |
| Sitio: rechazar las contraseñas conocidas o comunes, sin regla de composición ni cambio periódico | Evita las contraseñas previsibles |
| Sitio: Argon2id o bcrypt con sal, mediante la biblioteca del lenguaje | Véase el capítulo sobre el hash |
| Sitio: retardo progresivo por cuenta y por IP, nunca bloqueo definitivo | Ralentiza la fuerza bruta sin denegación de servicio |
| Sitio: mensaje de error y tiempo de respuesta idénticos | Sin enumeración de cuentas |
| Sitio: token de restablecimiento aleatorio, de uso único, de 15 a 60 minutos, nunca una contraseña por correo | El camino más atacado sigue siendo seguro |
| Sitio: correo de notificación en cada cambio, registros sin contraseña | Detección rápida y sin nuevas fugas por los registros |

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | La contraseña es el eslabón débil por la reutilización, las fugas, el phishing y las elecciones previsibles; estas debilidades son explotadas por la fuerza bruta (en línea o fuera de línea), el ataque de diccionario, la pulverización de contraseñas y el relleno de credenciales. La fuerza se calcula: 7776^4 (3,7 × 10^15) vale aproximadamente 94^8 (6,1 × 10^15), 5 palabras valen 4 664 veces más, siempre que el sorteo sea aleatorio. Lado del usuario: frase de contraseña elegida al azar, contraseña única por sitio, gestor con contraseña maestra sólida y copia de seguridad, MFA o claves de acceso, comprobación de fugas, cambio en todas partes tras una fuga, ningún compartir, respuestas aleatorias a las preguntas de seguridad. Lado del sitio: recomendaciones del NIST SP 800-63B (al menos 8 caracteres, al menos 64 aceptados, pegado permitido, sin composición ni renovación periódica, rechazo de las contraseñas conocidas) y de la ANSSI, almacenamiento con hash y sal, retardo progresivo sin denegación de servicio, mensaje idéntico, restablecimiento mediante token de uso único y vida corta, notificación, registros sin contraseña. |
| **Trampas que evitar** | Contraseña reutilizada o « compleja » pero corta; contraseña maestra débil; correo sin segundo factor; preguntas de seguridad sinceras; reglas de composición y renovación periódica; pegado prohibido; límite de longitud bajo; mensaje de error distinto según la cuenta; bloqueo definitivo de cuentas; contraseña enviada por correo; token reutilizable o sin caducidad; contraseña en los registros; truncamiento silencioso; validación solo en el navegador. |
| **Buenas prácticas** | Gestor y frase de contraseña aleatoria; segundo factor o clave de acceso en el correo primero; control de fugas; cambio en todas partes tras una fuga; del lado del sitio: validación en el servidor (longitud, contraseñas conocidas), hash Argon2id o bcrypt, retardos progresivos por cuenta y por IP, respuestas y tiempos idénticos, token aleatorio de uso único y vida corta, correo de notificación, registros sin los campos sensibles. |
