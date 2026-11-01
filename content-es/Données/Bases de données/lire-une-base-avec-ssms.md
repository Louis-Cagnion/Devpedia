---
order: 13
---

# Leer una base de datos con SSMS (31/10/2026)

Una **base de datos** es un conjunto organizado de datos, guardados en **tablas** (tablas de filas y columnas, como una hoja de cálculo). Un **servidor de bases de datos** es un programa que guarda esas tablas y responde a las peticiones de otros programas; **Microsoft SQL Server** (ver su [documentación oficial](https://learn.microsoft.com/en-us/sql/sql-server/)) es uno de ellos. Se le habla en [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql), un lenguaje hecho para describir qué datos se quieren leer o modificar. Una petición escrita en SQL se llama una **consulta**.

**SSMS** (*SQL Server Management Studio*, «entorno de administración de SQL Server») es el programa gráfico de Microsoft para conectarse a un servidor SQL Server, recorrer sus bases con el ratón, escribir consultas y leer sus resultados. Solo funciona en Windows; bajo macOS o Linux, Microsoft ofrece la [extensión MSSQL para Visual Studio Code](https://learn.microsoft.com/en-us/sql/tools/visual-studio-code/mssql-extensions), cuya interfaz difiere de la descrita aquí. Este capítulo está dirigido a quien descubre una base existente: enseña a conectarse a ella, a recorrerla, a hacer una pregunta sin romper nada y a comprobar que su cuenta no tiene poder para romper nada.

Los nombres de menús, botones y ventanas proceden de la documentación oficial de Microsoft; se dan en inglés (en cursiva), acompañados de una traducción orientativa; la interfaz en español puede emplear otras palabras. La interfaz cambia de una versión a otra, y una etiqueta puede diferir en su caso: busque entonces la misma palabra en la [documentación de SSMS](https://learn.microsoft.com/en-us/ssms/sql-server-management-studio-ssms). La instalación del programa no se trata aquí (ver la [página de descarga](https://learn.microsoft.com/en-us/ssms/download-sql-server-management-studio-ssms)).

| Pregunta | Sección |
|---|---|
| ¿Cómo conectarse, y qué significan las opciones? | [Conectarse a un servidor](#conectarse-a-un-servidor) |
| ¿Dónde están las tablas y sus columnas? | [El Explorador de objetos](#el-explorador-de-objetos-recorrer-sin-escribir) |
| ¿Cómo escribir y lanzar una consulta? | [Abrir una ventana de consulta](#abrir-una-ventana-de-consulta) y [Ejecutar](#ejecutar-todo-el-archivo-o-solo-la-seleccion) |
| ¿Qué significa «2 filas afectadas»? | [Leer el resultado](#leer-el-resultado) |
| ¿Cómo asegurarse de no modificar nada? | [Permisos: el acceso de solo lectura viene de la cuenta, no de la atención](#permisos-el-acceso-de-solo-lectura-viene-de-la-cuenta-no-de-la-atencion) |
| ¿Qué errores cometen los principiantes? | [Los errores de principiante](#los-errores-de-principiante) |

## Lo que hay que tener antes de empezar

Un servidor SQL Server contiene varios niveles anidados. SSMS los muestra en este orden, del más amplio al más preciso:

```
  Su ordenador (SSMS)  ---- red ---->  El servidor (la máquina)
                                                 |
                                                 +-- una instancia de SQL Server
                                                      |  (un ejemplar del programa)
                                                      +-- base de datos "libreria_demo"
                                                      |     |
                                                      |     +-- esquema "dbo"
                                                      |           +-- tabla "clientes"
                                                      |           +-- tabla "libros"
                                                      +-- base de datos "otra_base"
                                                            +-- ...
```

Una **instancia** es un ejemplar del programa SQL Server que se ejecuta en una máquina; una misma máquina puede alojar varias, cada una con sus bases. Un **esquema** es una carpeta de nombres que agrupa las tablas de una base y evita que dos tablas con el mismo nombre se confundan, y `dbo` es el esquema por defecto: ver [los esquemas y las tablas técnicas](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques). Una misma base puede existir también en varias copias en servidores distintos (por ejemplo, una para las pruebas y otra para el trabajo real); es la primera fuente de confusión, tratada más abajo.

Antes de abrir SSMS, hay que obtener cuatro datos de la persona que administra el servidor:

| Información | Ejemplo genérico | Para qué sirve |
|---|---|---|
| El nombre del servidor (y de la instancia, si hay una) | `NOMBRE_DEL_SERVIDOR` o `NOMBRE_DEL_SERVIDOR\INSTANCIA_A` | Indicar a SSMS dónde conectarse |
| El modo de autenticación que usar | Cuenta de Windows o login SQL (cuenta propia de SQL Server, ver [la autenticación](#autenticacion-de-windows-o-autenticacion-de-sql-server)) | Demostrar quién es usted |
| El nombre de la base que consultar | `libreria_demo` | Saber en qué base escribir sus consultas |
| Los permisos de su cuenta en esta base | Solo lectura, o lectura y escritura | Saber lo que tiene derecho a hacer |

Los ejemplos de este capítulo usan una librería inventada: una base `libreria_demo` con dos tablas, `clientes` y `libros`. Estos nombres son ficticios; sustitúyalos por los suyos.

## La ventana de SSMS de un vistazo

Una vez conectado, la ventana se compone de algunas zonas. El esquema siguiente es simplificado: la disposición exacta depende de la versión y de los ajustes. La consulta que contiene lee clientes: `SELECT` enumera las columnas deseadas, `FROM` nombra la tabla leída (`dbo.clientes`: esquema `dbo`, tabla `clientes`), `WHERE` solo conserva las filas que cumplen la condición (un texto se escribe entre comillas simples, `'Lyon'`), y el punto y coma `;` termina la instrucción. Estas palabras se explican en el capítulo [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql).

```
+----------------------------------------------------------------------------------+
| Archivo  Edición  Ver  Consulta  Herramientas  Ventana  Ayuda    (1) menús       |
+----------------------------------------------------------------------------------+
| [Nueva consulta] [Ejecutar] [ libreria_demo v ]      (2) herramientas            |
+-----------------------+----------------------------------------------------------+
| EXPLORADOR DE OBJETOS | SQLQuery1.sql                                            |
|                       | 1 | SELECT id, nombre, ciudad                            |
| (3)                   | 2 | FROM dbo.clientes                                    |
|                       | 3 | WHERE ciudad = 'Lyon';                               |
| NOMBRE_DEL_SERVIDOR   |                                  (4) editor de consultas |
|  + Bases de datos     +----------------------------------------------------------+
|    + libreria_demo    | Resultados | Mensajes        (5) panel de resultados     |
|      + Tablas         |  id | nombre | ciudad                                    |
|        dbo.clientes   |   1 | Martin | Lyon                                      |
|        dbo.libros     |   3 | Petit  | Lyon                                      |
+-----------------------+----------------------------------------------------------+
| Listo      NOMBRE_DEL_SERVIDOR | mi_login | libreria_demo | 00:00:00 | 2 filas   |
+----------------------------------------------------------------------------------+
                                                              (6) barra de estado
```

| Zona | Nombre (inglés) | Función |
|---|---|---|
| 1 | Barra de menús (*menu bar*) | Todos los comandos, incluido el menú `Consulta` (*Query*) |
| 2 | Barra de herramientas (*toolbar*) | `Nueva consulta` (*New Query*), `Ejecutar` (*Execute*), lista de las bases disponibles |
| 3 | Explorador de objetos (*Object Explorer*) | El árbol de las bases, tablas y columnas del servidor |
| 4 | Editor de consultas (*query editor*) | El texto SQL que se escribe |
| 5 | Panel de resultados (*results pane*) | Dos pestañas: `Resultados` (*Results*, las filas devueltas) y `Mensajes` (*Messages*, número de filas, errores) |
| 6 | Barra de estado (*status bar*) | Servidor, cuenta y base a las que está unida la pestaña, duración, número de filas |

La zona 6 es la más útil para un principiante: recuerda en todo momento **en qué servidor, con qué cuenta y en qué base** se ejecutará la consulta (según la documentación, esta información figura en la barra de estado y en el título de la pestaña).

## Conectarse a un servidor

Al arrancar, SSMS abre la ventana **Conectar al servidor** (*Connect to Server*). Se puede reabrir en cualquier momento con el botón `Conectar` (*Connect*) del Explorador de objetos.

### Los campos de la ventana de conexión

| Campo (inglés) | Qué poner | Observación |
|---|---|---|
| Tipo de servidor (*Server type*) | `Motor de base de datos` (*Database Engine*) | El valor por defecto sirve: es el programa servidor que contiene las tablas |
| Nombre del servidor (*Server name*) | El nombre recibido del administrador | Ver la tabla siguiente para las formas posibles |
| Autenticación (*Authentication*) | Windows, o SQL Server | Ver más abajo |
| Nombre de usuario y contraseña (*Login*, *Password*) | La cuenta SQL, si se elige la autenticación SQL | En gris con la autenticación de Windows |
| `Options >>` | Cifrado, confianza en el certificado, base de inicio | Ver más abajo |

### Escribir el nombre del servidor

| Forma | Significado | Ejemplo |
|---|---|---|
| `NOMBRE_DEL_SERVIDOR` | La instancia por defecto de esta máquina | `SRV-DATOS` |
| `NOMBRE_DEL_SERVIDOR\NOMBRE_INSTANCIA` | Una instancia **con nombre** de esta máquina | `SRV-DATOS\INSTANCIA_A` |
| `NOMBRE_DEL_SERVIDOR,PUERTO` | Una dirección precisa: el **puerto** (el número de la «puerta» de red por la que escucha el servidor) se escribe después de una coma | `SRV-DATOS,1433` |
| `localhost`, `.` o `(local)` | La máquina en la que se ejecuta SSMS | `localhost\INSTANCIA_A` |

La barra invertida `\` separa la máquina de la instancia, y la coma separa el nombre del puerto: confundirlas es una causa frecuente de fallo de conexión.

### Autenticación de Windows o autenticación de SQL Server

La **autenticación** es la prueba de su identidad. SQL Server ofrece dos principales (existen otros modos, como la autenticación [Microsoft Entra](https://learn.microsoft.com/en-us/entra/fundamentals/whatis) para los servicios en línea de Microsoft, fuera de tema aquí):

| | Autenticación de Windows (*Windows Authentication*) | Autenticación de SQL Server (*SQL Server Authentication*) |
|---|---|---|
| Quién verifica la identidad | Windows: el servidor recibe la identidad de su sesión | El propio servidor SQL |
| Lo que usted escribe | Nada: la cuenta y la contraseña son las de su sesión de Windows | Un nombre de login y una contraseña propios de SQL Server |
| Dónde vive la contraseña | En el directorio de cuentas de Windows de la organización | En el servidor SQL |
| Ventaja | Ninguna contraseña extra que gestionar ni escribir | Utilizable desde una máquina fuera del **dominio** (la red de empresa cuyas cuentas gestiona un **directorio**: una lista central de las cuentas de una organización, aquí [Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)) |
| Trampa | La cuenta **también** debe estar declarada en el servidor: si no, `Login failed` | Nunca usar la cuenta `sa` (administrador de todo el servidor) para consultar datos |

Un **login** es una cuenta declarada a nivel del servidor; autenticarse con éxito no basta, por tanto, pues el servidor debe conocer esa cuenta. Esta trampa (la identidad es válida, pero ningún login le corresponde en ESTA instancia) se detalla en el capítulo [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql), en la sección sobre la autenticación de Windows integrada.

La casilla *Remember password* («recordar la contraseña») conserva la contraseña en su máquina. En un equipo compartido, no la marque.

### Cifrado y confianza en el certificado

Entre SSMS y el servidor, los intercambios pueden estar **cifrados** (vueltos ilegibles para quien escuche la red). Para que ese cifrado sirva de verdad, SSMS debe asegurarse además de que habla con el servidor correcto, y no con un impostor. El servidor demuestra su identidad con un **certificado**: un documento digital firmado por una autoridad que el ordenador conoce (ver [el certificado TLS](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#el-certificado-tls-autofirmado) para el principio).

Según la documentación de SQL Server, la ventana de conexión ofrece, según la versión, un ajuste de cifrado (`Cifrar la conexión`, *Encrypt connection*, con tres valores descritos más abajo) y una casilla *Trust server certificate* («confiar en el certificado del servidor»), a veces detrás del botón `Options >>`.

| Valor de *Encrypt connection* | Qué ocurre |
|---|---|
| *Optional* | Cifra solo si el servidor lo exige; si no, los intercambios siguen siendo legibles en la red |
| *Mandatory* | Cifra siempre; el certificado se verifica salvo que la casilla de abajo esté marcada |
| *Strict* | Cifra siempre, con una verificación estricta del certificado |

Para una base consultada a distancia, elegir *Mandatory* o *Strict* (el valor *Strict* solo existe en las versiones recientes).

| Ajuste | Qué ocurre |
|---|---|
| Casilla *Trust server certificate* desmarcada | Cuando la conexión está cifrada, SSMS verifica el certificado: firmado por una autoridad conocida, no caducado, a nombre del servidor pedido. Un certificado no válido hace **fallar** la conexión |
| Casilla marcada | SSMS **ya no verifica** el certificado y acepta el que presente el servidor, sea el que sea |

Lo que desactiva la casilla es, por tanto, la **verificación de la identidad del servidor**, no el cifrado: cuando la conexión está cifrada, los datos siguen cifrados, pero SSMS ya no puede saber si su interlocutor es el servidor verdadero. En una red en la que alguien se interpone entre usted y el servidor (un ataque llamado **man-in-the-middle**, «hombre en medio»), podría hacerse pasar por él y leer lo que usted envía, la contraseña incluida.

| Situación | Qué hacer |
|---|---|
| Servidor de producción o servidor remoto | No marcarla. Pedir al administrador un certificado firmado por una autoridad reconocida, o la instalación del certificado de su organización en su equipo |
| Instancia instalada en su propia máquina para practicar (edición gratuita *Developer* o *Express*, para [descargar aquí](https://www.microsoft.com/en-us/sql-server/sql-server-downloads); ver también [el entorno local con SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server)) | Marcarla es aceptable: nadie se interpone entre su máquina y ella misma |
| Aparece un error de certificado y no se sabe por qué | No marcarla «para que funcione»: anotar el mensaje y transmitírselo al administrador |

Documentación: [configurar el cifrado de las conexiones](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/configure-sql-server-encryption).

### Elegir la base de inicio

En `Options >>`, una pestaña de propiedades de conexión (*Connection Properties*) ofrece un campo *Connect to database* («conectarse a la base de datos»). Vacío, la conexión se abre en una base por defecto de la cuenta (a menudo la base del sistema `master`, que no contiene ninguno de sus datos). Relleno, la ventana de consulta se abre directamente en la base correcta. Si la cuenta no tiene acceso a esa base, la conexión falla con un mensaje del tipo `Cannot open database "..." requested by the login`.

### Cuando la conexión falla

| Mensaje (inglés, según la documentación y los foros de Microsoft) | Causa probable | Pista |
|---|---|---|
| `A network-related or instance-specific error occurred while establishing a connection to SQL Server` | Nombre del servidor o de la instancia equivocado, servicio detenido (el programa SQL Server, que se ejecuta en segundo plano en Windows, no está arrancado), **cortafuegos** (programa que filtra las conexiones de red permitidas) | Revisar la ortografía y el separador (`\` o `,`), luego pedir al administrador |
| `The certificate chain was issued by an authority that is not trusted` | El certificado del servidor no lo reconoce su equipo | Ver [la sección sobre el certificado](#cifrado-y-confianza-en-el-certificado), no marcar la casilla por reflejo |
| `Login failed for user '...'` | Contraseña incorrecta, **o** cuenta desconocida para esta instancia | Ver el capítulo [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql): dos causas para el mismo mensaje |
| `Cannot open database "..." requested by the login` | La cuenta no tiene acceso a la base nombrada en `Connect to database` | Vaciar ese campo, o pedir el acceso |

## El Explorador de objetos: recorrer sin escribir

El **Explorador de objetos** (*Object Explorer*) es un árbol (simplificado a continuación: el real muestra otras ramas, como las restricciones o los desencadenadores) cuyas ramas se despliegan con el pequeño `+` (o la flecha). No se modifica nada al desplegar: solo se lee el **catálogo**, la lista que el servidor lleva de sus propios objetos.

```
NOMBRE_DEL_SERVIDOR (SQL Server, cuenta: mi_login)
 |
 +-- Bases de datos (Databases)
 |    +-- Bases de datos del sistema (System Databases)    <- no tocar
 |    +-- libreria_demo
 |         +-- Tablas
 |         |    +-- dbo.clientes
 |         |    |    +-- Columnas (Columns)
 |         |    |    |    +-- id (PK, int, Not Null)
 |         |    |    |    +-- nombre (varchar(50), Not Null)
 |         |    |    |    +-- ciudad (varchar(50), Null)
 |         |    |    |    +-- descuento (decimal(5,2), Null)
 |         |    |    +-- Claves (Keys)
 |         |    |    +-- Índices (Index)
 |         |    +-- dbo.libros
 |         +-- Vistas (Views)
 |         +-- Seguridad (Security)
 +-- Seguridad (Security)
```

### A qué corresponde cada rama

| Rama | Contenido |
|---|---|
| Bases de datos (*Databases*) | Las bases del servidor; según los permisos de la cuenta, una base puede faltar en la lista o no poder abrirse |
| Bases de datos del sistema (*System Databases*) | Las bases propias del servidor: `master` (catálogo del servidor), `tempdb` (espacio de trabajo temporal), `model` (modelo de las nuevas bases), `msdb` (tareas programadas); nunca el lugar de un ejercicio ([documentación](https://learn.microsoft.com/en-us/sql/relational-databases/databases/system-databases)) |
| Tablas | Las tablas, precedidas de su esquema (`dbo.clientes`) |
| Columnas (*Columns*) | Para cada columna: nombre, tipo, obligatoria o no |
| Claves (*Keys*) | La clave primaria y las claves externas (enlaces a otras tablas) |
| Índices (*Index*) | Las estructuras que aceleran las búsquedas: ver [los índices](/?c=donnees&s=bases-de-donnees&p=les-index) |
| Vistas (*Views*) | Consultas guardadas que se leen como tablas |
| Seguridad (*Security*) | Las cuentas y los roles; dentro de una base, los de esa base (ver [Permisos](#permisos-el-acceso-de-solo-lectura-viene-de-la-cuenta-no-de-la-atencion)) |

### Leer una línea de columna

Bajo `Columnas`, cada entrada sigue el patrón `nombre (clave, tipo, acepta NULL o no)`. Las tres nociones que hay que recordar:

| Noción | Definición | Ejemplo leído en el árbol |
|---|---|---|
| **Tipo** | La naturaleza del valor que acepta la columna: `int` un número entero, `varchar(50)` un texto de 50 caracteres como máximo, `decimal(5,2)` un número decimal de 5 cifras, 2 de ellas tras la coma, `date` un día del calendario | `ciudad (varchar(50), Null)` |
| **Clave primaria** (*primary key*, abreviado `PK`) | La columna (o el grupo de columnas) cuyo valor identifica **cada fila de forma única**: nunca repetido, nunca vacío. Es lo que permite designar «el cliente número 3» sin ambigüedad. Se crea con `PRIMARY KEY` (ver [`CREATE TABLE`](/?c=langages&s=domain-specific-languages-dsl&p=sql#create-table-crear-una-tabla-ddl)) | `id (PK, int, Not Null)` |
| **`NULL`** | La ausencia de valor: «desconocido» o «no informado», algo distinto del cero y del texto vacío. Una columna marcada `Null` (o *allows nulls*) puede no tener valor en algunas filas; `Not Null` impone un valor | `descuento (decimal(5,2), Null)` |

Estas tres indicaciones responden a las preguntas de un principiante incluso antes de escribir una consulta: qué columna identifica una fila, qué clase de valor poner en ella y si una casilla vacía es normal. Ver [`NULL`](/?c=langages&s=domain-specific-languages-dsl&p=sql#null-un-dato-ausente-no-un-valor-como-los-demas) para sus efectos en los cálculos y las comparaciones.

### Leer la estructura sin correr riesgos

Un clic derecho sobre una tabla abre un menú contextual (el menú que se abre al hacer clic derecho). Varias entradas son inofensivas; otras modifican la base:

| Entrada del menú (inglés) | Efecto | ¿Sin peligro? |
|---|---|---|
| `Select Top 1000 Rows` | Escribe y lanza una consulta que lee como máximo 1000 filas | Sí: una lectura |
| `Script Table as` > `CREATE To` > `New Query Editor Window` | Escribe en una pestaña nueva el código que crearía la tabla, **sin ejecutarlo** | Sí: se lee la estructura en SQL |
| `Properties` | Muestra las características de la tabla | Sí |
| `Edit Top 200 Rows` | Abre las 200 primeras filas en una cuadrícula **modificable** | **No**: ver [los errores de principiante](#los-errores-de-principiante) |
| `Design` | Abre el editor de estructura de la tabla | **No**: se pueden cambiar columnas |
| `Delete`, `Rename` | Borra o renombra la tabla | **No** |

La estructura también puede leerse con una consulta. `INFORMATION_SCHEMA.COLUMNS` es una vista de descripción que proporciona el servidor (ver la [documentación](https://learn.microsoft.com/en-us/sql/relational-databases/system-information-schema-views/columns-transact-sql)): cada fila describe una columna de la base actual.

```sql
-- SELECT elige las columnas a mostrar; AS solo sirve para renombrar el título de la columna
SELECT COLUMN_NAME AS columna,     -- el nombre de la columna
       DATA_TYPE AS tipo,          -- su tipo (int, varchar, date...)
       CHARACTER_MAXIMUM_LENGTH AS longitud,  -- longitud máxima de un texto (si no, NULL)
       IS_NULLABLE AS acepta_null -- YES si la columna acepta NULL, NO en caso contrario
-- FROM indica lo que se lee: la vista de descripción de las columnas
FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE solo conserva las filas que cumplen la condición: aquí, las columnas de clientes
-- AND exige que las dos condiciones sean verdaderas a la vez
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'clientes'
-- ORDER BY ordena el resultado; ORDINAL_POSITION es el rango de la columna en la tabla
ORDER BY ORDINAL_POSITION;
```

Resultado esperado para la tabla del ejemplo (valores ilustrativos):

| columna | tipo | longitud | acepta_null |
|---|---|---|---|
| id | int | NULL | NO |
| nombre | varchar | 50 | NO |
| ciudad | varchar | 50 | YES |
| descuento | decimal | NULL | YES |

## Abrir una ventana de consulta

Una **ventana de consulta** es una pestaña del editor en la que se escribe SQL. Tres formas de abrir una:

| Gesto | Particularidad |
|---|---|
| Botón `Nueva consulta` (*New Query*) de la barra de herramientas | La consulta queda unida al servidor seleccionado en el Explorador, a la base de inicio de la conexión o a la del nodo seleccionado |
| Atajo `Ctrl + N` | Mismo efecto que el botón |
| Clic derecho sobre **una base** en el Explorador, y luego `Nueva consulta` | La consulta queda unida **a esa base**: es la forma más segura de empezar en la correcta |

### La base actual

Cada pestaña está unida a **una** base a la vez: la **base actual**. Una consulta que escribe `FROM dbo.clientes` busca la tabla solo en esa base. Tres formas de elegirla o cambiarla:

| Método | Cómo | Observación |
|---|---|---|
| Lista desplegable de la barra de herramientas | Se elige la base en la lista de bases disponibles (*Available Databases*) | Visible siempre: se ve de un vistazo dónde se está |
| Instrucción `USE` | `USE libreria_demo;` cambia la base actual de la pestaña | Práctica en un script (un archivo de varias instrucciones SQL), pero un `USE` copiado de otro script puede llevarle a otra base sin que lo note |
| Nombre completo de tres segmentos | `libreria_demo.dbo.clientes` | Designa la tabla sin cambiar de base (ver [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql)) |

Para comprobarlo, sin fiarse de la lista desplegable, se pregunta al servidor:

```sql
-- SELECT sin FROM: el servidor calcula valores y los devuelve en una sola fila
SELECT
    -- DB_NAME() devuelve el nombre de la base actual de esta pestaña
    DB_NAME()    AS base_actual,
    -- SUSER_NAME() devuelve el nombre de la cuenta con la que se está conectado
    SUSER_NAME() AS cuenta_conectada,
    -- @@SERVERNAME devuelve el nombre del servidor (y de la instancia) al que se está unido
    @@SERVERNAME AS servidor;
```

Resultado posible (valores ilustrativos):

| base_actual | cuenta_conectada | servidor |
|---|---|---|
| libreria_demo | mi_login | NOMBRE_DEL_SERVIDOR |

Esta consulta, reescrita en una línea (`SELECT DB_NAME(), SUSER_NAME();`), se ejecuta **antes que cualquier otra**: sustituye una duda por una respuesta del servidor. Documentación: [`DB_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/db-name-transact-sql), [`SUSER_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/suser-name-transact-sql), [`@@SERVERNAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/servername-transact-sql).

> **Nota:** según la documentación de SSMS, la ventana de conexión permite también asociar un **color** a un servidor (propiedades de conexión, *Use custom color*): la barra de estado de las pestañas unidas a ese servidor puede tomar entonces ese color. Un color rojo para el servidor de producción y verde para el de pruebas hace visible el riesgo de confusión.

### La palabra `GO`

Un script copiado de un compañero suele contener líneas con `GO` solo. `GO` no es SQL: es un separador que entiende SSMS, y que divide el texto en **lotes** (*batches*) enviados al servidor uno tras otro. Como los lotes son independientes, una [variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) (un valor guardado bajo un nombre) creada en uno ya no existe en el siguiente; un `USE`, en cambio, sigue vigente para los lotes siguientes de la misma pestaña.

## Ejecutar: todo el archivo o solo la selección

Escribir una consulta no la lanza. Para enviarla al servidor se usa el botón `Ejecutar` (*Execute*), el atajo `F5` (o `Ctrl + E`). El punto decisivo:

| Estado del editor | Lo que se envía al servidor |
|---|---|
| **Ningún texto seleccionado** | **Todo** el contenido de la pestaña, de la primera a la última línea |
| **Hay texto seleccionado** (resaltado) | **Solo** el texto resaltado; el resto se ignora |

Una pestaña puede contener varias consultas, y la selección decide cuál parte. Ejemplo de pestaña con tres instrucciones:

```sql
-- instrucción 1: comprobar dónde estamos (lectura)
SELECT DB_NAME() AS base_actual;
-- instrucción 2: leer los clientes de Lyon (lectura)
SELECT id, nombre, ciudad FROM dbo.clientes WHERE ciudad = 'Lyon';
-- instrucción 3: DELETE borra filas; aquí, todos los clientes de Paris (¡escritura!)
DELETE FROM dbo.clientes WHERE ciudad = 'Paris';
```

```
  F5 sin seleccionar nada:                F5 con la línea 2 seleccionada:

  1  SELECT DB_NAME() ...    <- se envía    1  SELECT DB_NAME() ...
  2  SELECT id, nombre ...   <- se envía    2 [SELECT id, nombre ...]    <- solo desde aquí
  3  DELETE FROM ...         <- se envía    3  DELETE FROM ...
```

Este comportamiento es útil (probar una consulta a la vez) y peligroso (ver [el error «selección olvidada»](#2-ejecutar-una-seleccion-olvidada)). La barra de herramientas también ofrece `Analizar` (*Parse*, menú `Consulta` > `Analizar`, o `Ctrl + F5`), que verifica la **sintaxis** (la ortografía SQL) sin ejecutar nada, y un botón `Cancelar la ejecución de la consulta` (*Cancel Executing Query*) que detiene una consulta demasiado larga.

## Leer el resultado

Tras `F5`, el panel inferior muestra dos pestañas: `Resultados` y `Mensajes`. Hay que leer las dos.

### La pestaña Resultados

La pestaña `Resultados` (*Results*) presenta por defecto una **cuadrícula** (*grid*): una fila del resultado por fila de la cuadrícula, una columna por columna elegida. Resultado de la consulta 2 de arriba sobre cinco clientes de prueba (ilustración):

| id | nombre | ciudad |
|---|---|---|
| 1 | Martin | Lyon |
| 3 | Petit | Lyon |

En la cuadrícula, un valor ausente se muestra con la palabra `NULL`: no es un texto, es la ausencia de valor. El menú `Consulta` > `Resultados a` (*Results To*) permite elegir una salida en cuadrícula, en texto plano o en un archivo. Un clic derecho en la cuadrícula permite copiar las filas, con o sin el encabezado de las columnas.

### La pestaña Mensajes y «n filas afectadas»

La pestaña `Mensajes` recoge lo que el servidor dice de la ejecución. Tras una consulta correcta, muestra una línea de la forma:

```text
(2 rows affected)
```

En español, según el idioma de la interfaz: `(2 filas afectadas)`. El número indica lo que la instrucción **tocó**, y se lee de forma distinta según la instrucción:

| Instrucción | Qué designa «n filas afectadas» |
|---|---|
| `SELECT` | El número de filas **devueltas** por la consulta |
| `INSERT` (añade filas) | El número de filas **añadidas** |
| `UPDATE` | El número de filas **modificadas** |
| `DELETE` | El número de filas **borradas** |

Dos consecuencias prácticas:

| Constatación | Interpretación |
|---|---|
| `(0 rows affected)` tras un `DELETE` o un `UPDATE` | Ninguna fila cumplía la condición `WHERE`: no cambió nada, lo que es una información, no un fallo |
| `(1500 rows affected)` tras un `DELETE` que debía tocar 3 filas | La condición era demasiado amplia: la alerta llega **después** del hecho, de ahí el interés de preverlo (ver [borrar sin `WHERE`](#3-borrar-sin-where)) |

> **Trampa:** el mensaje **no** indica el total de las filas que responden a la pregunta. Con `SELECT TOP 10 * FROM dbo.clientes;` (`*` designa todas las columnas, y `TOP 10` limita el resultado a 10 filas, palabra propia del SQL de SQL Server, el [*T-SQL*](https://learn.microsoft.com/en-us/sql/t-sql/language-reference)), el mensaje dice `(10 rows affected)` aunque la tabla contenga 40 000. Para conocer el total, se pide `SELECT COUNT(*) FROM dbo.clientes;`, donde `COUNT(*)` cuenta las filas.

Sin `ORDER BY`, SQL Server no garantiza ningún orden: las 10 filas de un `TOP 10` son arbitrarias y pueden cambiar de una ejecución a otra. Para un resultado reproducible, se ordena: `SELECT TOP 10 * FROM dbo.clientes ORDER BY id;` devuelve siempre los 10 `id` más pequeños.

La barra de estado (en la parte inferior de la ventana) repite el número de filas y la duración de la consulta. Una duración que crece para un simple `SELECT` indica una tabla voluminosa: interrumpir con `Cancelar la ejecución de la consulta` y volver a empezar con `TOP` en lugar de esperar.

### Cuando aparece un error

Un error aparece en la pestaña `Mensajes`, en texto rojo, con la forma `Msg número, Level n, State n, Line n` seguida de una frase (`Level`: gravedad del error; `State`: referencia interna del servidor; `Line`: línea afectada). Un doble clic sobre el mensaje sitúa el cursor en la línea afectada. Dos mensajes conciernen directamente a un principiante:

| Mensaje (inglés) | Significado | Causa frecuente |
|---|---|---|
| `Msg 208 ... Invalid object name 'dbo.clientes'` | La tabla pedida no existe **en la base actual** | Se está en la **base equivocada**, o el esquema o el nombre están mal escritos |
| `Msg 229 ... The SELECT permission was denied on the object 'clientes'` | La cuenta no tiene derecho a leer esta tabla | Faltan permisos: ver la sección siguiente |

## Permisos: el acceso de solo lectura viene de la cuenta, no de la atención

Decirse «solo leo» no protege de nada: un error de tecleo, una selección mal hecha o un script copiado bastan para escribir por error. La única protección fiable es que la cuenta utilizada **no tenga derecho a escribir**. Esta idea es el **principio de mínimo privilegio**, explicado en el capítulo [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql): una cuenta solo recibe los permisos que necesita.

### Dos niveles de permisos

```
   Servidor (instancia)
   +-- Login "mi_login"            <- la cuenta, conocida por el servidor
   |     |
   |     +-- Base "libreria_demo"
   |     |     +-- Usuario "mi_login"    <- la misma cuenta, declarada en ESTA base
   |     |     |     +-- rol db_datareader   <- lectura de todas las tablas
   |     |     +-- Tabla dbo.clientes
   |     |
   |     +-- Base "otra_base"
   |           +-- (ningún usuario)        <- la cuenta no tiene ningún derecho aquí
```

Una cuenta puede **conectarse** al servidor y, sin embargo, no poder hacer nada en una base determinada: los permisos se conceden **base por base**. El **login** abre el acceso al servidor; el **usuario de base** es la misma cuenta declarada en una base concreta, y es él quien recibe los permisos sobre esa base. Un **rol** es un grupo de permisos que se asigna en bloque:

| Rol de base (inglés) | Lo que permite | Para una lectura simple |
|---|---|---|
| `db_datareader` | Leer (`SELECT`) todas las tablas de la base | Suficiente, y es el rol que pedir |
| `db_datawriter` | Añadir, modificar o borrar filas en todas las tablas | Evitarlo para explorar |
| `db_owner` | Todos los permisos sobre la base, incluido borrar las tablas | Nunca para explorar |
| `db_denydatawriter` | **Prohíbe** escribir (una denegación prevalece sobre los demás permisos) | Una barrera explícita, útil además de la lectura |

A nivel del servidor, una cuenta miembro del rol `sysadmin` (la cuenta `sa` es una de ellas) tiene todos los permisos sobre todas las bases: con ella, **ninguna** base está protegida. Ver la [lista de roles de servidor](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/server-level-roles) y la [lista de roles de base](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/database-level-roles). El capítulo [el entorno local con SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) muestra, a la inversa, una cuenta que recibe `db_owner` sobre una sola base: es una elección de desarrollo, no la de una persona que se limita a leer.

### Comprobar sus permisos desde una consulta

Se pregunta al servidor por la cuenta conectada, con la base actual de la pestaña (de ahí la importancia de verificarla primero). Ninguna de estas consultas modifica nada.

```sql
-- sys.databases lista las bases del servidor; HAS_DBACCESS(nombre) vale 1 si hay acceso
-- ORDER BY name ordena el resultado por nombre de base
SELECT name FROM sys.databases WHERE HAS_DBACCESS(name) = 1 ORDER BY name;

-- sys.fn_my_permissions(NULL, 'DATABASE') lista los permisos de la cuenta en la base actual
SELECT permission_name FROM sys.fn_my_permissions(NULL, 'DATABASE');

-- HAS_PERMS_BY_NAME devuelve 1 si el permiso está concedido sobre el objeto, 0 si no
-- puede_leer: permiso SELECT sobre la tabla; puede_agregar: INSERT (añadir filas)
-- puede_modificar: UPDATE (cambiar filas); puede_borrar: DELETE (quitar filas)
SELECT HAS_PERMS_BY_NAME('dbo.clientes', 'OBJECT', 'SELECT') AS puede_leer,
       HAS_PERMS_BY_NAME('dbo.clientes', 'OBJECT', 'INSERT') AS puede_agregar,
       HAS_PERMS_BY_NAME('dbo.clientes', 'OBJECT', 'UPDATE') AS puede_modificar,
       HAS_PERMS_BY_NAME('dbo.clientes', 'OBJECT', 'DELETE') AS puede_borrar;

-- IS_MEMBER devuelve 1 si la cuenta pertenece al rol de la base actual, 0 si no
SELECT IS_MEMBER('db_datareader') AS lector, IS_MEMBER('db_owner') AS propietario;
```

Resultado posible para una cuenta de solo lectura (valores ilustrativos):

| puede_leer | puede_agregar | puede_modificar | puede_borrar |
|---|---|---|---|
| 1 | 0 | 0 | 0 |

Documentación de referencia: [`sys.databases`](https://learn.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-databases-transact-sql), [`HAS_DBACCESS`](https://learn.microsoft.com/en-us/sql/t-sql/functions/has-dbaccess-transact-sql), [`IS_MEMBER`](https://learn.microsoft.com/en-us/sql/t-sql/functions/is-member-transact-sql), [`HAS_PERMS_BY_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/has-perms-by-name-transact-sql) y [`sys.fn_my_permissions`](https://learn.microsoft.com/en-us/sql/relational-databases/system-functions/sys-fn-my-permissions-transact-sql).

### El procedimiento

| Paso | Acción |
|---|---|
| 1 | Pedir al administrador una cuenta reservada a la consulta (rol `db_datareader` sobre la base deseada, ningún otro) |
| 2 | Conectarse con esa cuenta para explorar, y con otra cuenta solo durante el tiempo de una modificación decidida de antemano |
| 3 | Nada más conectarse, lanzar las consultas de verificación de arriba: base actual, permisos |
| 4 | Si `puede_agregar`, `puede_modificar` o `puede_borrar` vale `1` cuando solo se quiere leer, señalarlo: la cuenta tiene demasiados permisos |
| 5 | Repetir la verificación **para cada base** consultada, porque los permisos no se heredan de una base a otra |

> **Nota:** estar en solo lectura protege los datos contra una modificación, no contra su **divulgación**: lo que usted lee puede ser confidencial (datos de contacto de clientes, por ejemplo). No copie resultados reales fuera de las herramientas previstas para ello.

## Los errores de principiante

### 1. Consulta lanzada sobre la base equivocada

**Escenario.** El Explorador de objetos contiene una base de prueba y una base de trabajo, con tablas de los mismos nombres. Una pestaña abierta sobre la base equivocada ejecuta `SELECT * FROM dbo.clientes;`: el resultado se muestra bien, pero viene de otra parte. Peor con una escritura: el `DELETE` se aplica a la base de trabajo.

| Síntoma | Causa | Remedio |
|---|---|---|
| Filas inesperadas, o `Msg 208 Invalid object name` | La base actual no es la que se cree | Comprobar la barra de estado, luego `SELECT DB_NAME();` |
| Ningún error, pero el resultado no se parece al esperado | La tabla existe en las dos bases, con otros datos | Abrir la consulta con clic derecho sobre la base deseada |
| Un script encadena `USE` que cambian de base durante la ejecución | El script no parte del estado supuesto | Leer los `USE` de un script antes de ejecutarlo |

### 2. Ejecutar una selección olvidada

**Escenario.** Se prueba una consulta resaltándola, y luego se pasa a otra cosa sin hacer clic en otro lugar. Más tarde, se escribe una nueva consulta debajo y se pulsa `F5`: solo sale el texto resaltado antiguo. Al revés, se cree lanzar una sola línea y, habiendo desaparecido la selección, **todo** el contenido de la pestaña se ejecuta, incluidas las instrucciones de escritura.

| Síntoma | Causa | Remedio |
|---|---|---|
| La nueva consulta no produce «nada» o repite la anterior | Queda activa una selección antigua | Hacer clic en el texto para deseleccionar, y luego releer lo que va a salir |
| Se ejecuta una escritura cuando se pensaba lanzar una lectura | Ninguna selección: se envía toda la pestaña | Guardar las escrituras en una pestaña aparte, o comentarlas |
| El resultado no corresponde a la consulta mostrada | El texto resaltado no es el que se mira | Preguntarse antes de cada `F5`: «¿tengo una selección?» |

### 3. Borrar sin `WHERE`

`DELETE FROM dbo.clientes;` **sin** condición borra **todas** las filas. `UPDATE dbo.clientes SET ciudad = 'Lyon';` (`UPDATE` modifica filas, `SET` da el nuevo valor) cambia la ciudad de **todos** los clientes. La condición `WHERE` es lo que limita la acción a las filas deseadas.

Por defecto, cada instrucción se **confirma** (se vuelve definitiva) en cuanto se ejecuta: no hay botón «Deshacer». `Ctrl + Z` anula una pulsación en el editor, no un efecto sobre la base. La protección consta de cuatro gestos, que se lanzan **uno a uno** seleccionando el texto antes de `F5` (ver [la ejecución por selección](#ejecutar-todo-el-archivo-o-solo-la-seleccion)):

```sql
-- 1. primero un SELECT con EXACTAMENTE la misma condición: se ven las filas afectadas
SELECT id, nombre, ciudad FROM dbo.clientes WHERE ciudad = 'Lyon';
-- 2. COUNT(*) da su número; debe ser el que se espera (aquí, 2)
SELECT COUNT(*) AS a_borrar FROM dbo.clientes WHERE ciudad = 'Lyon';
-- 3. BEGIN TRANSACTION abre una transacción: un grupo de instrucciones que se puede anular
-- seleccionar estas dos líneas (BEGIN y DELETE), luego F5; la transacción queda abierta
BEGIN TRANSACTION;
-- el DELETE se ejecuta, pero aún no es definitivo
DELETE FROM dbo.clientes WHERE ciudad = 'Lyon';
-- leer entonces la pestaña Mensajes: debe mostrar (2 filas afectadas), si no, no confirmar
-- 4. seleccionar UNA SOLA de las dos líneas siguientes, luego F5
-- ROLLBACK TRANSACTION anula todo lo ocurrido desde BEGIN TRANSACTION
ROLLBACK TRANSACTION;
-- en su lugar, COMMIT TRANSACTION haría definitivo el borrado
-- COMMIT TRANSACTION;
```

Entre dos `F5`, la transacción queda abierta en la pestaña: es lo que deja tiempo para leer el mensaje. Ejecutar este bloque completo, sin selección, encadenaría `DELETE` y luego `ROLLBACK` sin pausa (el `COMMIT` está comentado) y quitaría todo control.

Para una tabla de 5 clientes de los que 2 viven en Lyon, el `SELECT COUNT(*)` da 2, el `DELETE` anuncia 2 filas, y tras el `ROLLBACK` un nuevo `SELECT COUNT(*) FROM dbo.clientes;` vuelve a dar 5. Sin `WHERE`, el mismo `DELETE` anuncia 5 filas: la diferencia salta a la vista **antes** de elegir entre `COMMIT` y `ROLLBACK`.

| Punto | Qué saber |
|---|---|
| Una transacción abierta y olvidada | Puede **bloquear** a los demás usuarios de la tabla mientras no esté confirmada ni anulada. Terminar siempre con `COMMIT` o `ROLLBACK` |
| Cerrar la pestaña con una transacción abierta | SSMS pregunta, según la documentación, si hay que confirmar o anular |
| Una copia de seguridad de la base | Último recurso, pero equivale a restaurar la base entera: ver [la restauración de un `.bak`](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server#restaurar-una-copia-de-seguridad-bak-en-local) |
| Una cuenta de solo lectura | Hace **imposible** el borrado: la verdadera protección, que no depende de ningún reflejo |

Documentación: [las transacciones en T-SQL](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/transactions-transact-sql).

### 4. Modificar una fila en la cuadrícula de edición

La entrada `Edit Top 200 Rows` abre las filas en una cuadrícula que se parece a la de los resultados, pero **modificable**: según la documentación, cambiar una celda y salir de la fila guarda la modificación en la base. Para un principiante que solo quiere mirar, la entrada adecuada es `Select Top 1000 Rows`.

## Un recorrido completo de principio a fin

| Paso | Acción | Control |
|---|---|---|
| 1 | Obtener el nombre del servidor, el modo de autenticación, el nombre de la base y los permisos | Una cuenta de consulta, no `sa` |
| 2 | Conectarse; marcar la confianza en el certificado solo en la propia máquina | La conexión se abre |
| 3 | Desplegar el Explorador de objetos: base, `Tablas`, una tabla, `Columnas` | Tipos, clave primaria y columnas `Null` localizados |
| 4 | Clic derecho sobre la base deseada, y luego `Nueva consulta` | Barra de estado: buen servidor, buena base |
| 5 | Lanzar `SELECT DB_NAME(), SUSER_NAME();` | Los dos valores esperados |
| 6 | Verificar los permisos (`HAS_PERMS_BY_NAME` o `sys.fn_my_permissions`) | `puede_agregar`, `puede_modificar` y `puede_borrar` valen `0` |
| 7 | Escribir la lectura con `TOP` (por ejemplo `SELECT TOP 10 * FROM dbo.libros;`) | Releer antes de `F5`, comprobar que no queda ninguna selección |
| 8 | Leer `Resultados` **y** `Mensajes` | El número de filas es coherente |
| 9 | Escribir una modificación solo con una cuenta prevista para ello, después de un `SELECT`, en una transacción | `COUNT(*)` y mensaje idénticos antes de `COMMIT` |

## Para ir más lejos

| Tema | Dónde |
|---|---|
| La sintaxis SQL, las agregaciones, las uniones, `NULL`, el mínimo privilegio | [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) |
| Esquemas, `dbo`, tablas técnicas | [Esquemas y tablas técnicas](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques) |
| Restaurar una copia de seguridad `.bak` en SSMS, crear una cuenta dedicada | [Entorno local con SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) |
| Para qué sirven los índices que aparecen en el árbol | [Los índices](/?c=donnees&s=bases-de-donnees&p=les-index) |
| El certificado TLS y lo que garantiza | [Criptografía aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) |
| Todo SSMS, versión por versión | [Documentación oficial de SSMS](https://learn.microsoft.com/en-us/ssms/sql-server-management-studio-ssms) |

## Las trampas

| Trampa | Consecuencia | Remedio |
|---|---|---|
| Marcar la confianza en el certificado por reflejo | La conexión ya no verifica la identidad del servidor: exposición al hombre en medio | Hacerlo solo en la propia máquina; si no, corregir el certificado |
| Usar `sa` o una cuenta `sysadmin` para consultar | Ninguna barrera: una escritura accidental pasa | Una cuenta `db_datareader` sobre la única base deseada |
| Lanzar una consulta sin verificar la base actual | Resultado procedente de otra base, o escritura en la equivocada | Barra de estado, clic derecho sobre la base, `SELECT DB_NAME();` |
| `F5` con una selección antigua activa | Solo sale la consulta antigua | Hacer clic en el texto antes de releer |
| `F5` sin selección en una pestaña que contiene escrituras | Se ejecuta toda la pestaña | Separar lecturas y escrituras en pestañas distintas |
| `DELETE` o `UPDATE` sin `WHERE` | Todas las filas se ven afectadas, sin vuelta atrás automática | Un `SELECT` idéntico primero, luego transacción |
| Leer «10 rows affected» como el total de la tabla | Conclusión errónea tras un `TOP` | `SELECT COUNT(*)` para conocer el total |
| `Edit Top 200 Rows` para «mirar» | Una celda modificada queda guardada | `Select Top 1000 Rows` |
| Dejar una transacción abierta | Los demás usuarios de la tabla quedan bloqueados | `COMMIT` o `ROLLBACK` al final de cada prueba |
| Creer que una base con permisos correctos lo está en las demás | Los permisos se ajustan base por base | Verificar en cada base consultada |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Pedir una cuenta de consulta dedicada (`db_datareader`) | La solo lectura la impone el servidor, no la vigilancia |
| Verificar los permisos después de cada nueva conexión | Se sabe lo que se puede hacer antes de hacerlo |
| Abrir cada pestaña con clic derecho sobre la base deseada | La base actual es la correcta desde el principio |
| Lanzar `SELECT DB_NAME(), SUSER_NAME();` primero | El servidor confirma dónde y quién es uno |
| Colorear las conexiones de producción en la ventana de conexión | La confusión se vuelve visible |
| Leer con `TOP`, contar con `COUNT(*)` | Una tabla voluminosa no bloquea el equipo y el total sigue siendo conocido |
| Separar las pestañas de lectura y de escritura | Un `F5` sin selección nunca escribe |
| Escribir primero el `SELECT` de una modificación, y luego la transacción | Se ven las filas afectadas antes de tocarlas |
| Leer `Mensajes` tras cada ejecución | El número de filas afectadas revela un `WHERE` demasiado amplio |
| No marcar la confianza en el certificado fuera de la propia máquina | La identidad del servidor sigue verificada |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | **SSMS** es el cliente gráfico de Microsoft para SQL Server (solo Windows). Uno se conecta con un nombre de servidor (`SERVIDOR\INSTANCIA`, o `SERVIDOR,PUERTO`) y una autenticación: **Windows** (la sesión, sin contraseña que escribir, pero la cuenta debe existir en el servidor) o **SQL Server** (login y contraseña propios del servidor). La casilla de confianza del certificado desactiva la **verificación de la identidad del servidor**, no el cifrado: reservarla para la propia máquina. El **Explorador de objetos** muestra bases, esquemas, tablas y columnas con su tipo, la **clave primaria** (`PK`, identificador único de cada fila) y si la columna acepta `NULL`. Una pestaña de consulta está unida a **una base actual** que la barra de estado y `SELECT DB_NAME();` confirman. `F5` ejecuta **toda la pestaña** si no hay selección, y **solo la selección** si la hay. La pestaña `Resultados` muestra las filas; la pestaña `Mensajes` da «n filas afectadas»: el número de filas devueltas, añadidas, modificadas o borradas, nunca el total de una tabla tras un `TOP`. La solo lectura la garantizan los **permisos de la cuenta** (rol `db_datareader`, verificados con `HAS_PERMS_BY_NAME`), base por base, según el [mínimo privilegio](/?c=langages&s=domain-specific-languages-dsl&p=sql). |
| **Trampas que evitar** | Marcar la confianza del certificado por reflejo; consultar con `sa` o una cuenta `sysadmin`; no verificar la base actual; `F5` con una selección olvidada, o sin selección en una pestaña que contiene escrituras; `DELETE` o `UPDATE` sin `WHERE`; tomar el mensaje de un `TOP` por el total; `Edit Top 200 Rows` para mirar; dejar una transacción abierta; suponer que los permisos de una base valen para otra. |
| **Buenas prácticas** | Cuenta de consulta dedicada; `SELECT DB_NAME(), SUSER_NAME();` y verificación de permisos en cada conexión; pestaña abierta con clic derecho sobre la base correcta; conexiones de producción coloreadas; `TOP` para leer y `COUNT(*)` para contar; pestañas de lectura separadas de las de escritura; `SELECT` idéntico antes de cualquier modificación, en una transacción que se pueda anular; lectura sistemática de la pestaña `Mensajes`. |
