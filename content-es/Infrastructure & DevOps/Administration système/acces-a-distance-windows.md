---
order: 8
---

# Windows: acceso remoto (RDP, tscon, shadowing)

Este capítulo se apoya en [las sesiones de Windows](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#las-sesiones-de-windows): una sesión agrupa un escritorio y los programas de un usuario conectado, y la **consola** es la que se muestra en la pantalla física de la máquina. Conectarse a distancia desplaza una sesión de una pantalla a otra, lo que importa en cuanto un programa sin supervisión (un robot que pilota un navegador, una prueba de interfaz) necesita una ventana realmente mostrada.

## El Escritorio remoto (RDP)

El **Escritorio remoto** permite usar una máquina Windows desde otra, como si estuviéramos sentados delante: su pantalla se muestra en una ventana, y el teclado y el ratón la pilotan. Se basa en el protocolo **RDP** (*Remote Desktop Protocol*), que escucha por defecto en el [puerto](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement#lanzar-un-servidor-local) 3389 de la máquina remota ([Enable Remote Desktop on your PC](https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/remotepc/remote-desktop-allow-access)).

| Papel | Ediciones de Windows posibles |
|---|---|
| Máquina a la que uno se conecta (anfitrión) | Pro, Enterprise, Education, Windows Server; nunca Home |
| Máquina desde la que uno se conecta (cliente) | Todas, incluida Home |

El anfitrión se activa en **Configuración > Sistema > Escritorio remoto** (se necesitan permisos de administrador); los miembros del grupo Administradores y las cuentas añadidas a la lista pueden entonces conectarse. En el lado del cliente, la aplicación **Conexión a Escritorio remoto** también se lanza desde la línea de comandos, con el nombre [`mstsc`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/mstsc):

```powershell
# abre una conexión hacia la máquina llamada pc-robot (pide una cuenta y una contraseña)
mstsc /v:pc-robot
```

## Conectarse «toma» la sesión

Si la cuenta usada para conectarse ya tiene una sesión abierta en la consola, el Escritorio remoto no crea una segunda sesión: **desplaza** la sesión existente hacia la ventana de conexión. La pantalla física muestra entonces la pantalla de inicio de sesión de Windows.

```text
Antes           Sesión 1 (cuenta robot) ──► pantalla física (consola)
Conexión RDP    Sesión 1 (cuenta robot) ──► ventana mstsc del operador
                pantalla física         ──► pantalla de inicio de sesión
Ventana cerrada Sesión 1 (cuenta robot) ──► ninguna pantalla: desconectada y bloqueada
```

| Etapa | Programas de la cuenta robot | Visualización de sus ventanas |
|---|---|---|
| Antes de la conexión | Se ejecutan | En la pantalla física |
| Durante la conexión | Se ejecutan | En la ventana del operador |
| Tras cerrar la ventana | Siguen ejecutándose | En ninguna parte: la sesión está desconectada (`Disc` en `query session`) y bloqueada |

> **Trampa:** cerrar la ventana del Escritorio remoto tras haber ido a comprobar el robot. Sus programas siguen ejecutándose, pero sin pantalla: una automatización que hace clic en una interfaz o capturas de pantalla falla a partir de ese momento. Microsoft lo señala para las pruebas de interfaz lanzadas por un agente de despliegue ([Configure for UI testing](https://learn.microsoft.com/en-us/azure/devops/pipelines/test/ui-testing-considerations)).

## Devolver la sesión a la consola: `tscon`

[`tscon`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tscon) conecta una sesión a otra pantalla. Con `/dest:console`, devuelve la sesión a la pantalla física en lugar de dejarla desconectada: la ventana del Escritorio remoto se cierra, y los programas recuperan una pantalla, sin bloqueo.

```powershell
# lista las sesiones; la línea marcada con ">" es la sesión actual,
# su número está en la columna ID
query session
# devuelve la sesión número 1 a la pantalla física (ejecutar como administrador)
tscon 1 /dest:console
```

El número cambia de una conexión a otra. Microsoft propone un archivo por lotes que lo encuentra solo, que se guarda con un nombre terminado en `.bat` y se lanza desde un acceso directo configurado en «Ejecutar como administrador»:

```text
rem para cada sesión de la cuenta conectada, lee el número (3.ª columna)
rem y la envía a la consola
for /f "skip=1 tokens=3" %%s in ('query user %USERNAME%') do (
  %windir%\System32\tscon.exe %%s /dest:console
)
```

| | Cerrar la ventana del Escritorio remoto | `tscon … /dest:console` |
|---|---|---|
| Sesión de la cuenta | Desconectada, sin pantalla | Mostrada en la pantalla física |
| Bloqueo | Sí | No |
| Programas que necesitan una ventana visible | Fallan | Continúan |
| Permisos necesarios | Ninguno | Administrador (véase [la elevación UAC](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#uac-permisos-asociados-a-cada-proceso)) |

> **Trampa:** olvidar que la máquina queda **desbloqueada**: cualquiera que pase delante de su pantalla física usa la sesión, con los permisos de la cuenta. Reservarlo a una máquina en una sala cerrada, con una cuenta dedicada con permisos mínimos.
>
> **Trampa:** `tscon` hacia la sesión de **otra** cuenta falla sin la contraseña de esa cuenta (parámetro `/password`), incluso para un administrador.

## Observar una sesión sin tomarla: el shadowing

El **shadowing** («seguir como una sombra») muestra, en una ventana del Escritorio remoto, la sesión de otra cuenta **sin desplazarla**: se queda en su pantalla, el operador la mira al mismo tiempo y puede tomar el control. No necesita ni su contraseña ni cerrar nada al irse.

```powershell
# lista las sesiones de la máquina remota pc-robot, para encontrar el número (ID) que observar
query session /server:pc-robot
# observa la sesión 1 de pc-robot, con el control, sin pedir autorización
mstsc /v:pc-robot /shadow:1 /control /noConsentPrompt
```

| Parámetro de `mstsc` | Efecto |
|---|---|
| `/shadow:<ID>` | Número de la sesión que observar |
| `/control` | Autoriza teclado y ratón; sin él, solo se mira |
| `/noConsentPrompt` | No pide el consentimiento del usuario observado, si la directiva de la máquina lo permite |

Deben cumplirse tres condiciones en la máquina observada:

| Condición | Detalle |
|---|---|
| Directiva que autorice el shadowing | [Directiva de grupo](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits#las-directivas-de-grupo-gpo) «Set rules for remote control of Remote Desktop Services user sessions» (nombre en inglés, en Computer Configuration > Administrative Templates > Windows Components > Remote Desktop Services > Remote Desktop Session Host > Connections). Cinco niveles: ningún control, control total o solo observación, cada uno con o sin autorización del usuario ([Session Shadowing](https://learn.microsoft.com/en-us/archive/technet-wiki/19804.remote-desktop-services-session-shadowing)). Por defecto: control total **con** autorización |
| Permisos del operador | Administrador de la máquina, o permiso de control remoto concedido a su cuenta (regla documentada para el antiguo comando [`shadow`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/shadow), que `mstsc /shadow` sustituye desde Windows Server 2012 R2) |
| Acceso de red | El shadowing no pasa solo por el puerto 3389: también usa el uso compartido de archivos de Windows ([SMB](https://learn.microsoft.com/en-us/windows-server/storage/file-server/file-server-smb-overview), puerto 445) y [puertos asignados sobre la marcha](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/default-dynamic-port-range-tcpip-chang). Un [cortafuegos](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld) que solo abre el 3389 lo bloquea; Windows incluye para ello una regla integrada, llamada «Remote Desktop - Shadow (TCP-In)» en inglés |

> **Trampa:** lanzar `/noConsentPrompt` cuando la directiva exige la autorización del usuario. Aparece una solicitud en la sesión observada, y en la de un robot no hay nadie para aceptarla: el operador no ve nada.
>
> **Buena práctica:** la observación sin autorización permite espiar una sesión: reservarla por directiva a las cuentas de operadores que la necesitan, solo en las máquinas afectadas.

| | Conexión clásica y luego `tscon` | Shadowing |
|---|---|---|
| Contraseña de la cuenta observada | Necesaria (uno se conecta con ella) | Innecesaria (el operador usa la suya) |
| Sesión del robot durante la intervención | Abandona la pantalla física | Se queda en su pantalla |
| Al irse | `tscon` obligatorio, si no la sesión se bloquea | Basta con cerrar la ventana |
| Ajustes previos | Escritorio remoto activado | Directiva de grupo, permisos del operador, aperturas de red |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Conectarse por Escritorio remoto con una cuenta desplaza su sesión hacia la ventana de conexión; cerrar esa ventana la deja desconectada y bloqueada, sin pantalla. `tscon … /dest:console` la devuelve a la pantalla física; el shadowing la muestra a un operador sin desplazarla. |
| **Herramientas utilizables** | `mstsc /v:<máquina>`, `query session` (con `/server:<máquina>` a distancia), `tscon <ID> /dest:console` como administrador, `mstsc /shadow:<ID> /control /noConsentPrompt`, la directiva de grupo de control remoto. |
| **Trampas a evitar** | Cerrar la ventana del Escritorio remoto sobre la sesión de un robot; olvidar que `tscon` deja la máquina desbloqueada; `/noConsentPrompt` contradicho por la directiva; un cortafuegos que solo abre el puerto 3389 al shadowing. |
| **Buenas prácticas** | Para comprobar un robot, preferir el shadowing a una conexión con su cuenta; si no, salir siempre con `tscon`; reservar el shadowing sin autorización a los operadores y máquinas que lo necesitan. |
