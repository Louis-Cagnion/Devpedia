---
order: 7
---

# Windows: servicios, sesiones y permisos

Este capítulo explica cómo [Windows](/?c=infrastructure-devops&s=systemes-d-exploitation) organiza los programas que se ejecutan en una máquina: quién los inicia, en qué pantalla se muestran y con qué permisos. Estas nociones se vuelven concretas en cuanto se quiere ejecutar un programa sin supervisión (un robot que controla un navegador, un agente de despliegue): según cómo se inicie, su ventana puede ser invisible o sus permisos demasiado amplios.

Recordatorio de las piezas utilizadas: un **programa** en ejecución se llama [proceso](/?c=langages&s=powershell&p=gestion-des-processus); cada proceso se ejecuta en nombre de una **cuenta de usuario** (una identidad con sus permisos, ver [los permisos](/?c=langages&s=powershell&p=permissions-et-fichiers)).

## Las sesiones de Windows

Una **sesión** agrupa un escritorio (la pantalla de inicio con sus ventanas) y todos los programas iniciados por un usuario conectado. Pueden existir varias sesiones al mismo tiempo en una misma máquina, cada una con su propio número.

```text
Máquina Windows
├── Sesión 0: servicios (ningún usuario, ninguna pantalla)
├── Sesión 1: Alice, conectada en la pantalla física  ← la consola
└── Sesión 2: Bob, conectado a distancia
```

| Término | Qué es |
|---|---|
| **Sesión interactiva** | Sesión de un usuario conectado, con un escritorio donde se muestran sus ventanas |
| **Consola** | La sesión vinculada a la pantalla, el teclado y el ratón físicos de la máquina |
| **Sesión bloqueada** | Sesión todavía abierta (programas en ejecución), pero oculta tras la pantalla de inicio de sesión |

Bloquear una sesión (teclas `Windows` + `L`) no cierra ningún programa: siguen ejecutándose. En cambio, la imagen ya no se envía a ninguna pantalla: un programa que depende de una ventana realmente visible (captura de pantalla, automatización que hace clic en una interfaz) puede entonces fallar o producir solo imágenes negras.

```powershell
# lista las sesiones de la máquina con su número y su estado
query session
```

| Columna mostrada | Significado |
|---|---|
| `SESSIONNAME` | `services` para la sesión 0, `console` para la pantalla física, `rdp-tcp#…` para una conexión a distancia |
| `ID` | Número de la sesión |
| `STATE` | `Active` (en uso), `Disc` (desconectada pero todavía abierta) |

## Los servicios de Windows y el aislamiento de la Sesión 0

Un **servicio** es un programa que Windows inicia por sí mismo, a menudo en cuanto se enciende la máquina, sin esperar a que un usuario se conecte (un antivirus, un servidor web, un agente de despliegue). Documentación: [Services](https://learn.microsoft.com/en-us/windows/win32/services/services).

Desde Windows Vista, todos los servicios se ejecutan en la **Sesión 0**, una sesión reservada que no está vinculada a ninguna pantalla, ni física ni remota. Es el **aislamiento de la Sesión 0**: impide que un programa malicioso iniciado por un usuario envíe mensajes a las ventanas de un servicio (que a menudo tiene permisos elevados).

| | Programa iniciado por un usuario | Servicio |
|---|---|---|
| Inicio | Cuando el usuario lo lanza | Por Windows, a menudo al arrancar la máquina |
| Sesión | La del usuario (1, 2…) | Siempre la Sesión 0 |
| Ventana | Visible en el escritorio del usuario | Creada y dibujada en memoria, pero nunca visible |
| Funciona sin usuario conectado | No | Sí |

> **Trampa:** ejecutar como servicio un programa que necesita una ventana visible, por ejemplo un robot que controla un navegador en modo ventana. El programa se ejecuta sin errores, pero nadie puede ver ni desbloquear su ventana (un captcha que resolver a mano, por ejemplo). La herramienta que permitía echar un vistazo a la Sesión 0 (*Interactive Services Detection*) se eliminó en Windows 10 versión 1803 ([Interactive Services](https://learn.microsoft.com/en-us/windows/win32/services/interactive-services)).
>
> **Buena práctica:** un programa que debe mostrar una ventana se inicia en una sesión interactiva (al abrirse la sesión de una cuenta dedicada, ver la sección siguiente), nunca como servicio.

```powershell
# lista los servicios y su estado (Running = en ejecución, Stopped = detenido)
Get-Service
# muestra, para cada servicio, la cuenta con la que se ejecuta
Get-CimInstance Win32_Service | Select-Object Name, State, StartName
```

## Abrir una sesión automáticamente (autologon) y los secretos LSA

Un programa que debe ejecutarse en una sesión interactiva necesita que haya una sesión abierta, incluso después de reiniciar la máquina. El **inicio de sesión automático** (*autologon*) conecta una cuenta elegida en cada arranque, sin que nadie escriba su contraseña.

Para ello, Windows debe conocer la contraseña de la cuenta. La guarda en los **secretos LSA**: la **LSA** (*Local Security Authority*) es el componente de Windows que verifica las identidades y conserva información sensible cifrada ([LSA Authentication](https://learn.microsoft.com/en-us/windows/win32/secauthn/lsa-authentication)). La herramienta oficial [Autologon](https://learn.microsoft.com/en-us/sysinternals/downloads/autologon) (Sysinternals) configura este mecanismo sin escribir la contraseña en claro.

| | Lo que aporta el autologon | Lo que cuesta |
|---|---|---|
| Disponibilidad | La sesión se vuelve a abrir sola tras cada reinicio | La sesión permanece abierta siempre: cualquiera con acceso físico a la pantalla puede usarla |
| Contraseña | Nadie necesita escribirla | Cifrada, pero recuperable por cualquier administrador de la máquina |

> **Trampa:** activar el autologon con una cuenta personal o con una cuenta que tiene permisos en otras máquinas: un administrador de esta única máquina puede extraer la contraseña y usarla en otro lugar.
>
> **Buena práctica:** reservar el autologon a una cuenta dedicada, local, con los permisos mínimos (principio de [mínimo privilegio](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)), y restringir físicamente el acceso a la máquina.

## UAC: permisos asociados a cada proceso

En Windows, los permisos no están vinculados a la sesión sino a cada proceso, mediante un **token de acceso** (*access token*): una ficha que Windows adjunta al proceso al iniciarlo y que enumera la cuenta, sus grupos y sus privilegios ([Access Tokens](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-tokens)).

El **UAC** (*User Account Control*, control de cuentas de usuario) hace que incluso una cuenta de administrador inicie sus programas con un token **filtrado**, sin permisos de administración. Esos permisos solo se conceden a un proceso concreto, tras una confirmación ([User Account Control](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/user-account-control/)).

| Situación | Token del proceso iniciado |
|---|---|
| Programa iniciado normalmente, incluso por un administrador | Filtrado: permisos de usuario estándar |
| «Ejecutar como administrador», y luego confirmación | Completo, solo para este proceso |
| Cuenta estándar + credenciales de un administrador escritas en la ventana UAC | Token de ese administrador, solo para este proceso; la cuenta conectada no gana ningún permiso |

Analogía: una cajera (cuenta estándar) llama a la responsable, que teclea su código en la caja para validar una sola operación. La responsable no entrega su código, y la caja no queda desbloqueada para lo siguiente.

```powershell
# muestra los grupos del token de la consola actual;
# la línea "Mandatory Label" indica Medium (filtrado) o High (elevado)
whoami /groups
# inicia una nueva consola PowerShell con un token elevado (ventana UAC)
Start-Process powershell -Verb RunAs
```

> **Trampa:** creer que un programa hereda los permisos de administrador porque la cuenta conectada es administradora. Sin elevación explícita, se ejecuta con un token filtrado y falla en cualquier acción reservada (escribir en `C:\Program Files`, modificar un servicio).
>
> **Buena práctica:** elevar solo el proceso que lo necesita, en el momento en que lo necesita, en lugar de dar permisos de administración permanentes a la cuenta.

## Cuentas de servicio: locales o de dominio

Una **cuenta de servicio** es una cuenta de usuario dedicada a una aplicación en lugar de a una persona ([Service User Accounts](https://learn.microsoft.com/en-us/windows/win32/services/service-user-accounts)). No hay que confundirla con la cuenta de servicio utilizada entre aplicaciones web, vista en [la propagación de identidad](/?c=securite&s=delegation-et-federation-didentite&p=on-behalf-of): aquí se trata de una verdadera cuenta de Windows que abre sesiones e inicia procesos.

En las empresas, las cuentas suelen gestionarse con **Active Directory** (AD): un directorio central, alojado en servidores dedicados, que conoce todas las cuentas y todas las máquinas de la empresa; el conjunto de máquinas que gestiona se llama **dominio** ([Active Directory Domain Services](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)).

| Tipo de cuenta | Existe | Si le roban la contraseña |
|---|---|---|
| **Local** | En una sola máquina | El atacante solo puede actuar en esa máquina |
| **De dominio** (AD) | En todas las máquinas del dominio | El atacante puede usarla en cualquier lugar donde esta cuenta tenga permisos |

> **Buena práctica:** para un programa que se ejecuta en una sola máquina, preferir una cuenta local sin permisos de administración: el robo de su contraseña (por ejemplo mediante el autologon anterior) solo da acceso a esa máquina.

## Las directivas de grupo (GPO)

Una **directiva de grupo** (*Group Policy Object*, GPO) es un conjunto de ajustes definidos una sola vez por los administradores de un dominio y aplicados después automáticamente a máquinas o cuentas ([Group Policy overview](https://learn.microsoft.com/en-us/troubleshoot/windows-server/group-policy/group-policy-overview)). Ejemplo: bloquear la pantalla tras 10 minutos de inactividad en todas las máquinas.

Una GPO se aplica a un grupo de máquinas o de cuentas: los administradores pueden por tanto prever una excepción, por ejemplo no bloquear la sesión de una cuenta de servicio cuyo programa necesita una pantalla activa.

```powershell
# muestra las directivas de grupo aplicadas a la máquina y a la cuenta actual
gpresult /r
```

> **Trampa:** modificar a mano en la máquina un ajuste que impone una GPO: se sobrescribe en la siguiente actualización de las directivas (por defecto cada 90 minutos aproximadamente, y en cada reinicio).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Cada sesión tiene su escritorio; los servicios se ejecutan en la Sesión 0, sin pantalla. Los permisos van en el token de cada proceso (UAC), no en la sesión. El autologon vuelve a abrir una sesión en cada arranque guardando la contraseña en los secretos LSA. |
| **Herramientas utilizables** | `query session`, `Get-Service`, `whoami /groups`, `Start-Process -Verb RunAs`, `gpresult /r`, Sysinternals Autologon. |
| **Trampas a evitar** | Ejecutar como servicio un programa que necesita una ventana visible; activar el autologon con una cuenta de dominio; modificar a mano lo que impone una GPO. |
| **Buenas prácticas** | Una cuenta dedicada, local y sin permisos de administración para un programa autónomo; elevar un solo proceso, cuando lo necesita; pedir una excepción de GPO en lugar de esquivarla. |
