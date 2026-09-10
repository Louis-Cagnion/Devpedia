---
order: 9
---

# Configurar un entorno local para una aplicación PHP conectada a SQL Server

Desarrollar una aplicación que habla con una base de datos que vive en otro lugar (un servidor de la empresa, un entorno de producción) plantea un problema recurrente: trabajar directamente sobre esa base remota es arriesgado (un error afecta a los datos reales) y a menudo imposible (acceso de red restringido). La solución habitual es restaurar una copia de la base **en local**, y hacer funcionar la aplicación sobre ella durante el desarrollo. Este capítulo cubre las trampas encontradas al configurar este entorno, con [Microsoft SQL Server](/?c=langages-de-programmation&s=domain-specific-languages-dsl&p=sql) como ejemplo concreto.

## Restaurar una copia de seguridad `.bak` en local

SQL Server exporta una base en forma de un archivo **`.bak`**, una copia de seguridad completa (esquema + datos) en un momento dado. **SSMS** (*SQL Server Management Studio*, la herramienta gráfica oficial de administración de SQL Server) permite restaurarla en una instancia local: *Restore Database* > *Device*, apuntando al archivo `.bak` recibido. Una vez restaurada, la base tiene el mismo nombre y la misma estructura que la original, pero vive por completo en la máquina local.

## Crear un usuario dedicado en lugar de `sa`

`sa` (*system administrator*) es la cuenta de administrador integrada de SQL Server, con todos los derechos sobre la instancia entera (todas las bases, no solo la restaurada). Una aplicación nunca debería conectarse con ella:

```sql
CREATE LOGIN app_backoffice WITH PASSWORD = 'una-contraseña-fuerte';

USE MiBaseRestaurada;
CREATE USER app_backoffice FOR LOGIN app_backoffice;
ALTER ROLE db_owner ADD MEMBER app_backoffice;
```

`app_backoffice` obtiene así todos los derechos (`db_owner`) sobre la única base `MiBaseRestaurada`, sin poder tocar las demás bases ni la configuración de la instancia.

> **Buena práctica:** una credencial de aplicación solo necesita derechos sobre las bases que realmente usa, nunca derechos de administración de la instancia entera. Una fuga de esas credenciales (archivo de configuración subido por error, log que las muestra) tiene un impacto limitado a esas bases concretas, en lugar de a todo el servidor.

## Iniciar el servidor de desarrollo de PHP en la dirección correcta

`php -S` inicia un servidor HTTP integrado, práctico para desarrollar sin configurar un servidor web de verdad:

```bash
php -S localhost:8000
```

> **Trampa (Windows):** `localhost` puede resolverse como IPv6 (`[::1]`) en lugar de IPv4 (`127.0.0.1`), y el servidor integrado de PHP entonces solo se vincula a la dirección resuelta. Un navegador o una herramienta que insiste en `127.0.0.1:8000` no encuentra entonces a nadie en esa dirección, aunque el servidor sí está funcionando en `[::1]:8000`. Solución: vincular explícitamente la dirección deseada en lugar del nombre genérico `localhost`:
> ```bash
> php -S 127.0.0.1:8000
> ```

## Extensiones de PHP que faltan: un bloqueo a la vez

`composer install` descarga e instala las dependencias declaradas de un proyecto PHP. Si falta una extensión de PHP requerida por alguna de ellas, la instalación falla -- pero solo con la **primera** extensión que falte, no con la lista completa:

```text
1er intento: composer install
  -> error: se requiere la extension "openssl"

(openssl activada)

2o intento: composer install
  -> error: se requiere la extension "gd"

(gd activada, luego zip, luego sodium...)
```

Cada extensión se reactiva en el archivo `php.ini` (localizar cuál se está usando con `php --ini`) quitando el `;` que comenta su línea (`;extension=gd` pasa a ser `extension=gd`), siempre que el archivo `.dll`/`.so` correspondiente exista realmente en la carpeta `ext/` de la instalación de PHP.

> **Trampa:** detenerse tras corregir el primer error y concluir que "sigue sin funcionar" ante el segundo fallo, sin notar que se trata de una extensión **distinta** a la anterior. El mensaje de error siempre nombra la extensión que falta: hay que releerlo en cada nuevo fallo en lugar de suponer que es la misma de antes.

## El archivo hosts: darle un nombre a `127.0.0.1`

El archivo **hosts** del sistema asocia manualmente un nombre de dominio a una dirección IP, incluso antes de cualquier resolución DNS de red:

| Sistema | Ubicación |
|---|---|
| Windows | `C:\Windows\System32\drivers\etc\hosts` |
| Linux/macOS | `/etc/hosts` |

```text
127.0.0.1   midominio.local
```

Una vez añadida esta línea, `http://midominio.local:8000` designa el servidor local, exactamente igual que `http://127.0.0.1:8000`, pero con un nombre estable y legible.

> **Trampa:** este archivo solo puede modificarse con derechos de administrador (acceso denegado en caso contrario, incluso para una herramienta que intente editarlo automáticamente). En Windows, hay que abrir el propio editor de texto como administrador antes de acceder a él.

## Por qué importa un nombre de host estable: el `redirect_uri` de OAuth

Un flujo de [OAuth 2.0](/?c=securite&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) (usado, por ejemplo, para "Iniciar sesión con Google") exige declarar de antemano, en la consola de administración del proveedor (Google Cloud Console, admin de Okta...), la URL exacta a la que redirigirá al usuario una vez conectado: el **`redirect_uri`**.

> **Trampa:** el proveedor OAuth rechaza cualquier solicitud cuyo `redirect_uri` no coincida **exactamente, carácter por carácter**, con una URL ya declarada de su lado. Un simple `localhost:8000` rara vez funciona en la práctica (muchos proveedores lo prohíben, o la aplicación cambia de puerto de una ejecución a otra): darle un nombre estable al servidor local mediante el archivo hosts (`midominio.local`) y luego declarar `http://midominio.local:8000/callback` en el lado del proveedor resuelve el problema -- pero los dos pasos son necesarios; añadir el nombre de host al archivo hosts sin declararlo también en el lado del proveedor no basta.

## Nota: un proxy corporativo puede ralentizar Composer sin bloquearlo

En una red corporativa filtrada por un proxy TLS (que inspecciona el tráfico cifrado reemitiendo sus propios certificados), cada paquete de Composer puede fallar una primera vez en la descarga directa (`SSL routines::certificate verify failed`, al no reconocer la configuración OpenSSL de PHP el certificado del proxy) antes de tener éxito mediante un clon de Git como repliegue automático. Esto ralentiza `composer install` sin bloquearlo por completo -- una lentitud inusual merece revisarse en los logs de Composer en lugar de ser ignorada.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Restaurar una copia local (`.bak` mediante SSMS) en lugar de desarrollar sobre una base remota. Crear un usuario de aplicación dedicado (`db_owner` sobre la única base implicada), nunca `sa`. `php -S localhost` puede vincularse solo a IPv6 en Windows. `composer install` falla con una extensión de PHP que falta a la vez, no todas de golpe. El archivo hosts (requiere derechos de administrador) le da un nombre estable a `127.0.0.1`, útil en particular para un `redirect_uri` de OAuth que debe coincidir exactamente con lo declarado en el lado del proveedor. |
| **Herramientas utilizables** | SSMS (*Restore Database* > *Device*) para restaurar un `.bak`. `CREATE LOGIN`/`CREATE USER`/`ALTER ROLE db_owner` para un usuario de aplicación dedicado. `php --ini` para localizar el `php.ini` activo. El archivo hosts para un nombre de host local estable. |
| **Trampas a evitar** | Conectarse como `sa` desde una aplicación. Vincular `php -S` a `localhost` en lugar de una dirección IPv4 explícita. Corregir una sola extensión de PHP que falta y suponer que el problema está resuelto. Modificar el archivo hosts sin derechos de administrador. Añadir un nombre de host local sin declararlo también como `redirect_uri` en el lado del proveedor OAuth. |
| **Buenas prácticas** | Restaurar siempre una copia local en lugar de desarrollar sobre datos de producción. Limitar los derechos de una cuenta de aplicación a las únicas bases que usa. Releer el nombre exacto de la extensión que falta en cada nuevo fallo de `composer install`. Revisar los logs de Composer ante una lentitud inusual en lugar de ignorarla. |
