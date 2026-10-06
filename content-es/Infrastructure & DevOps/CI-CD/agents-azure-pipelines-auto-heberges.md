---
order: 5
---

# Los agentes autoalojados de Azure Pipelines

Un [pipeline](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd) describe **qué** hacer (compilar, probar, desplegar), pero hace falta una máquina que lo haga. En Azure Pipelines, esa máquina ejecuta un pequeño programa, el **agente**: pregunta al servidor si hay trabajo, lo ejecuta y devuelve los registros y el resultado. Este capítulo explica cómo instalar y ejecutar **tu propio** agente en una máquina Windows.

| Noción | En una frase |
|---|---|
| Agente | El programa que ejecuta los steps de un pipeline en una máquina |
| Pool de agentes | Un grupo de agentes; el pipeline designa un pool (`pool:`), no un agente concreto |
| Job | Conjunto de pasos confiado a un solo agente del pool |
| Agente autoalojado | Un agente instalado en **tu** máquina, que administras tú |
| Token de acceso personal (PAT) | Una contraseña de alcance limitado, aquí para registrar el agente |
| Modo servicio o interactivo | El agente se ejecuta como un servicio de Windows, o como un programa dentro de una sesión abierta |

## Agente de Microsoft o agente autoalojado

| | Agente alojado por Microsoft | Agente autoalojado |
|---|---|---|
| Dónde se ejecuta | En Microsoft, con una máquina recreada para cada pipeline | En tu máquina |
| Estado entre dos ejecuciones | No queda nada: el agente se destruye al terminar | Las cachés, carpetas y herramientas se conservan: los builds incrementales son más rápidos |
| Software instalado | El de la imagen elegida | Todo lo que instales (y que tienes que mantener) |
| Acceso a una red interna | No directamente | Sí, según dónde esté la máquina |
| Mantenimiento | Ninguno | Actualizaciones, permisos, disco, seguridad: todo es cosa tuya |

Un agente autoalojado se justifica cuando el trabajo necesita un software o un acceso que el agente de Microsoft no tiene (una red interna, un navegador con una sesión real, hardware particular), o cuando las cachés persistentes importan. En caso de duda, prueba primero el agente alojado por Microsoft, más sencillo (ver [Azure Pipelines y GitHub Actions](/?c=infrastructure-devops&s=ci-cd&p=azure-pipelines-vs-github-actions) para el vocabulario `pool` y `runs-on`).

## Cómo habla el agente con el servidor

El agente **siempre inicia** la comunicación: consulta al servidor por HTTPS y nunca recibe una llamada entrante. Por tanto, **no hay ningún puerto que abrir** hacia el agente, solo la salida hacia Internet.

```
     tu máquina                                Azure DevOps (servidor)
  +--------------+   1. registro (PAT)        +----------------------+
  |    agente    | -------------------------> |   pool de agentes    |
  |              |   2. « ¿trabajo? »         |                      |
  |              | <------------------------> |   cola de jobs       |
  |              |   (petición larga, HTTPS)  |                      |
  |              |   3. job + token corto     |                      |
  |              | <------------------------- |                      |
  |   ejecuta    |   4. registros, resultado  |                      |
  |              | -------------------------> |                      |
  +--------------+                            +----------------------+
```

| Etapa | Qué ocurre |
|---|---|
| Registro | Una persona autorizada añade el agente al pool; el agente **no** conserva los permisos de esa persona |
| Escucha | El agente descarga un token de escucha y consulta la cola de jobs mediante una petición HTTP «larga» (la conexión permanece abierta hasta que haya trabajo) |
| Job | El agente recibe el trabajo y un **token propio de ese job**, de corta duración |
| Fin | El token del job se descarta; el agente vuelve a la escucha |

## Registrarse con un PAT

Un **token de acceso personal** (*PAT*, *Personal Access Token*) es una contraseña sustituta, de alcance limitado y con fecha de caducidad, creada en los ajustes de tu cuenta (ver [GitHub y las plataformas](/?c=git&p=github-et-plateformes) para el mismo mecanismo en GitHub). Para registrar un agente:

| Punto | Valor |
|---|---|
| Dónde crearlo | Azure DevOps > ajustes del usuario > **Personal access tokens** |
| Alcance (*scope*) que hay que marcar | **Agent Pools (read, manage)**, y **nada más** («Show all scopes» para ver la lista completa) |
| Quién | Una cuenta miembro del rol de **administrador del pool** (o propietaria de la organización) |
| Cuándo se usa | **Solo para el registro**: después, el agente se comunica con sus propios tokens |
| Cuántos agentes | Un solo PAT puede registrar varios agentes |

Consecuencias prácticas: un PAT caducado o eliminado **no detiene** a un agente ya registrado (solo hace falta uno nuevo para registrar o retirar un agente). Y la cuenta de Windows que **ejecuta** el agente debe ser distinta de la persona que lo registró: la documentación recomienda identidades separadas, y la carpeta del agente contiene secretos (registros, credenciales de trabajo) que solo deben mostrarse a los administradores y a la cuenta que lanza el agente.

## Instalar y configurar a mano

Requisitos previos: Windows 10 u 11, o Windows Server 2012 o posterior, y PowerShell 3.0 o superior (el agente trae su propia versión de .NET). Conviene hacerlo una primera vez a mano para ver cómo funciona:

| Etapa | Detalle |
|---|---|
| 1. Descargar | Azure DevOps > Organization settings > **Agent pools** > pool **Default** > pestaña **Agents** > **New agent** > Windows; elegir x64 para un Windows de 64 bits |
| 2. Descomprimir | En una carpeta **sin espacios** en la ruta, por ejemplo `C:\agents` (no en la carpeta Descargas: problemas de permisos) |
| 3. Proteger la carpeta | Modificable solo por los administradores |
| 4. Abrir PowerShell **como administrador** | Obligatorio para instalar un servicio. No PowerShell ISE, ni una terminal mintty como git-bash |
| 5. Configurar | `config.cmd` hace preguntas (URL, tipo de autenticación, token, pool, nombre del agente, carpeta de trabajo, modo) |

```
cd C:\agents
.\config.cmd
```

| Pregunta de `config.cmd` | Respuesta |
|---|---|
| URL del servidor | `https://dev.azure.com/{tu-organizacion}` |
| Tipo de autenticación | `PAT`, y luego el token creado más arriba |
| Pool | `Default` o el pool deseado |
| Nombre del agente | Un nombre **único** dentro del pool |
| Carpeta de trabajo | `_work` por defecto, dentro de la carpeta del agente |
| Modo | Servicio o interactivo (sección siguiente) |

En modo interactivo, el agente se lanza después con `.\run.cmd` (Ctrl+C para detenerlo). `.\run.cmd --once` acepta **un solo** job y luego se detiene limpiamente. El agente aparece en el pool, con su estado (en línea, sin conexión).

## Servicio o interactivo

| | Servicio de Windows | Interactivo con inicio de sesión automático |
|---|---|---|
| Arranque | Automático al arrancar la máquina, sin sesión abierta | Al arrancar, **después** de la apertura automática de la sesión de la cuenta elegida |
| Gestionado por | El administrador de servicios (`services.msc`) | Un programa dentro de una sesión visible (`run.cmd`) |
| Actualizaciones del agente | Mejor experiencia | Posible |
| Caso de uso | El predeterminado: compilaciones, pruebas sin ventana, despliegues | Cuando el trabajo necesita un **escritorio**: pruebas de interfaz, navegador con ventana real |
| Cuenta | Network Service o Local Service recomendadas (permisos reducidos, contraseña sin caducidad); en modo servicio, nombre de usuario de 20 caracteres como máximo | Una cuenta dedicada cuya contraseña se guarda para el autologon |
| Riesgo | Ninguna pantalla que proteger | Sesión abierta de forma permanente; protector de pantalla desactivado |

¿Por qué dos modos? Un servicio de Windows se ejecuta en la **Sesión 0**, aislada del escritorio (ver [Windows: servicios, sesiones y permisos](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)): no puede abrir una ventana visible. Una prueba que maneja un navegador o una aplicación gráfica necesita una sesión real: ese es el papel del modo interactivo. El agente se lanza allí al arrancar mediante el **autologon** (la contraseña se conserva en los [secretos LSA](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)).

**¿Cómo saber en qué modo se ejecuta un agente?** Azure DevOps > Organization settings > **Agent pools** > el pool > el agente > pestaña **Capabilities**: la capacidad del sistema `InteractiveSession` (una información que el agente publica sobre sí mismo, ver «Capacidades, requisitos y diagnóstico» más abajo) vale `True` en modo interactivo y `False` en modo servicio. Observado en un agente real: un robot que maneja Chrome no puede abrir una ventana mientras el agente está en modo servicio (`InteractiveSession = False`). Solo queda el modo **sin ventana** (*headless*), que algunos sitios protegidos contra robots detectan y bloquean: pasar al modo interactivo es una decisión de infraestructura (autologon, cuenta dedicada), no un ajuste del código.

| Trampa del modo interactivo | Por qué | Solución |
|---|---|---|
| Cerrar una sesión de Escritorio remoto bloquea la máquina | Las pruebas de interfaz en curso fallan | Devolver la sesión a la pantalla física con `tscon` (ver [Windows: acceso remoto](/?c=infrastructure-devops&s=administration-systeme&p=acces-a-distance-windows)) |
| Cuenta de autologon demasiado potente | Cualquier administrador de la máquina puede extraer su contraseña | Cuenta **dedicada, local y con los mínimos permisos**, y máquina bloqueada físicamente |
| Política de dominio | Puede prohibir el autologon o el protector de pantalla desactivado | Pedir una excepción, o usar una máquina fuera del dominio |

## Configurar sin responder a las preguntas

Para instalar sin nadie delante de la pantalla (script, varias máquinas), se pasa `--unattended` **y** las respuestas a todas las preguntas. En una ventana de PowerShell de administrador, dentro de la carpeta del agente:

```
# agente en modo servicio, cuenta integrada Network Service (no hace falta contraseña)
.\config.cmd --unattended `
    --url https://dev.azure.com/mi-organizacion `
    --auth pat --token <token> `
    --pool Default --agent agent-build-01 `
    --runAsService --windowsLogonAccount "NT AUTHORITY\NETWORK SERVICE"
```

```
# agente interactivo, lanzado por el autologon de una cuenta dedicada
.\config.cmd --unattended `
    --url https://dev.azure.com/mi-organizacion `
    --auth pat --token <token> `
    --pool Default --agent agent-ui-01 `
    --runAsAutoLogon --windowsLogonAccount "MACHINE\agent-ui" `
    --windowsLogonPassword <contraseña> --overwriteAutoLogon
```

(El acento grave `` ` `` al final de la línea es el carácter de continuación de PowerShell: el comando continúa en la línea siguiente.)

| Opción | Función |
|---|---|
| `--unattended` | Ninguna pregunta: todo debe darse mediante opciones |
| `--url` | La dirección de la organización |
| `--auth pat` / `--token` | Autenticación por token (también `SP`, `negotiate`, `alt`, `integrated`) |
| `--pool`, `--agent` | El pool al que unirse y el nombre del agente |
| `--replace` | Reemplazar un agente del pool que tenga el mismo nombre |
| `--work` | Carpeta de trabajo (propia de **este** agente) |
| `--runAsService` | Instalar el agente como servicio de Windows (requiere permisos de administrador) |
| `--runAsAutoLogon` | Configurar el autologon y lanzar el agente al arrancar (requiere permisos de administrador) |
| `--windowsLogonAccount` | Cuenta que ejecuta el agente (`dominio\usuario`), con `--runAsService` o `--runAsAutoLogon` |
| `--windowsLogonPassword` | Su contraseña (innecesaria para las cuentas integradas como `NT AUTHORITY\NETWORK SERVICE`) |
| `--overwriteAutoLogon` | Reemplazar el autologon ya configurado en la máquina |
| `--noRestart` | No reiniciar la máquina al terminar la configuración de un autologon |

Cualquier opción también puede darse mediante una **variable de entorno**: su nombre en mayúsculas precedido de `VSTS_AGENT_INPUT_` (por ejemplo `VSTS_AGENT_INPUT_PASSWORD` para `--password`). Es preferible para un secreto: un token o una contraseña escritos en la línea de comandos quedan en el historial de la terminal y pueden ser leídos por otros programas mientras se ejecuta. `.\config.cmd --help` siempre lista las opciones de **tu** versión.

## Varios agentes en una misma máquina

Es posible, pero la documentación recomienda **un solo agente por máquina**: dos agentes comparten el procesador, el disco y las herramientas instaladas, lo que puede degradar el rendimiento y los resultados.

| Regla | Por qué |
|---|---|
| Una **carpeta por agente** (`C:\agents\a1`, `C:\agents\a2`), con `config.cmd` lanzado desde cada una | Cada agente tiene su propia configuración |
| Un **nombre único** por agente (`--agent`) | Dos agentes con el mismo nombre se disputan el sitio en el pool: uno acaba deteniéndose |
| Una **carpeta de trabajo por agente** (`--work`) | La carpeta de trabajo pertenece a un agente y no se comparte |
| Evitarlo si los jobs son pesados en disco o en entrada/salida | Ninguna ganancia de eficiencia |
| Cuidado con las herramientas «únicas» (por ejemplo, paquetes npm compartidos) | Un job puede actualizar una dependencia mientras otro la usa: resultados inestables |
| El autologon es un ajuste de **la máquina** | Solo una cuenta se abre automáticamente; `--overwriteAutoLogon` reemplaza la que existe |
| **Varios jobs en paralelo**: dos agentes en el mismo pool | Cada agente ejecuta un solo job a la vez |
| **Dos usos separados** (robot, despliegue): un pool por uso | El pipeline designa un pool; cada pool tiene sus propios agentes |
| No copiar nunca la carpeta de un agente ya configurado | Los dos compartirían credenciales y nombre: uno se corta tras unos minutos de conflicto. Descomprimir un archivo nuevo para cada agente |

## Mantenimiento: retirar, reemplazar, reconfigurar

| Necesidad | Comando |
|---|---|
| Retirar el agente | `.\config.cmd remove` (con `--auth PAT --token <token>` en modo sin preguntas) |
| Reemplazar un agente del mismo nombre | Reconfigurar con el mismo nombre y responder `Y` (o `--replace`), **y luego** retirar el antiguo: si no, tras unos minutos de conflicto, uno de los dos se detiene |
| Cambiar la cuenta de un servicio | Reconfigurar el agente; **no** desde la consola de servicios |
| Un autologon que ya no arranca el agente | Retirar el agente, comprobar que ha desaparecido del pool y reconfigurar en una carpeta recién descomprimida |
| Borrar la carpeta de un agente | Solo **después** de `config.cmd remove`: si no, el agente sigue listado (sin conexión) en el pool |
| Actualización del agente | Automática: el agente se actualiza cuando un job exige una versión más reciente |
| Disco que se llena | Limpiar `_work` en cada job con `workspace: clean: all` en el YAML del job |
| Estado de un agente en modo servicio | `services.msc`, entrada «Azure Pipelines Agent» (o `vstsagent.…`) |

## Capacidades, requisitos y diagnóstico

Cada agente anuncia sus **capacidades** (*capabilities*): nombre de la máquina, sistema, versiones de ciertos programas, variables de entorno. Un pipeline declara sus **requisitos** (*demands*) y el servidor solo envía el job a los agentes compatibles.

```yaml
pool:
  name: Default          # el pool, no un agente concreto
  demands:
  - npm                  # solo son candidatos los agentes con npm instalado
```

| Punto | Qué saber |
|---|---|
| Tras instalar un software | **Reiniciar el agente** para que aparezca la nueva capacidad |
| Variables de entorno | Se convierten en capacidades; `VSO_AGENT_IGNORE` (lista de nombres separados por comas) permite excluirlas. **Su valor se muestra en claro** en la pestaña Capabilities, legible por cualquiera con acceso de lectura al pool: nunca un secreto en una variable de entorno de la máquina del agente |
| Variables propias de un agente | Un archivo `.env` en la raíz del agente, una línea `NOMBRE=valor` por variable, y luego reiniciar |
| Un agente que no arranca | `.\run --diagnostics` lanza una serie de comprobaciones |
| Cortafuegos | Permitir la **salida** hacia `dev.azure.com`, `*.dev.azure.com`, `login.microsoftonline.com` y `download.agent.dev.azure.com` (lista completa en la documentación) |

> **Límite de verificación:** estos comandos de Windows no han podido ejecutarse aquí. Su sintaxis y sus opciones se han comprobado en la documentación de Microsoft: [agente de Windows](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent), [agentes](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents) y [registro mediante PAT](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/personal-access-token-agent-registration).

## Seguridad: el agente ejecuta el código del repositorio

Un agente ejecuta los comandos del pipeline con los derechos de la cuenta que lo hace funcionar. Quien pueda modificar `azure-pipelines.yml` (o un script al que llame) puede por tanto ejecutar código en su máquina: Microsoft lo dice explícitamente, el agente está diseñado para ejecutar código descargado, así que es un posible objetivo de ejecución remota de código.

| Riesgo | Remedio |
|---|---|
| Un job lee los secretos de la carpeta del agente (credenciales, registros) | Carpeta accesible solo para los administradores y la cuenta del agente |
| Una cuenta demasiado potente (administrador, cuenta del dominio) hace funcionar el agente | Cuenta local dedicada, con los mínimos derechos (principio de [mínimo privilegio](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)) |
| Un pipeline no fiable usa el agente de otro proyecto | Un pool distinto por nivel de confianza, con los derechos de uso del pool restringidos |
| Un repositorio en el que cualquier colaborador puede proponer un cambio de pipeline está conectado a un agente que ve la red interna | Revisión obligatoria antes de cualquier cambio de un pipeline que use un agente autoalojado; agentes de la red interna fuera del alcance de repositorios no controlados |

## Las trampas

| Trampa | Lo que ocurre | Solución |
|---|---|---|
| PAT con demasiados alcances | Un token robado da mucho más que el registro de un agente | Marcar solo **Agent Pools (read, manage)** |
| Token o contraseña en la línea de comandos | Se queda en el historial de la terminal | Variables `VSTS_AGENT_INPUT_...`, nunca en un archivo versionado |
| Carpeta del agente legible por todos | Registros y secretos de trabajo expuestos | Carpeta reservada a los administradores y a la cuenta del agente |
| Carpeta con espacios | Algunas herramientas y scripts escapan mal los espacios | Una ruta como `C:\agents` |
| Configurar desde PowerShell ISE, git-bash o sin elevación | Instalación del servicio imposible o configuración incorrecta | PowerShell **como administrador** |
| Cuenta de autologon personal | Cualquiera con acceso a la máquina la usa | Cuenta dedicada, local y mínima |
| Dos agentes con el mismo nombre | Conflicto, uno se detiene | Un nombre único por agente, `--replace` y retirada del antiguo |
| Software instalado sin reiniciar el agente | El job se queda «esperando un agente compatible» | Reiniciar el agente |
| PAT sin fecha de caducidad | El token sigue siendo válido aunque el agente ya no lo necesite | Caducidad corta, revocación una vez registrado el agente |
| Carpeta de agente copiada | Mismas credenciales y mismo nombre: uno de los dos se corta | Un archivo nuevo por agente |
| Carpeta borrada sin `config.cmd remove` | El agente sigue listado (sin conexión) en el pool | Retirarlo correctamente primero |
| Un agente que ejecuta código procedente de repositorios | Es un programa hecho para ejecutar código descargado: objetivo de ejecución remota | Permisos mínimos, máquina aislada, control de quién escribe en el pipeline |
| Un secreto en una variable de entorno de la máquina (por ejemplo `SFTP_PASSWORD`) | Se convierte en una capacidad del agente, mostrada en claro a todos los lectores del pool, aunque el pipeline afectado no la use: un agente compartido entre varios flujos expone los secretos de cada uno | Secreto en un grupo de variables secreto del pipeline (o una caja fuerte), variable de máquina eliminada, contraseña cambiada si se expuso |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un agente ejecuta los jobs de un pipeline en una máquina; consulta al servidor por HTTPS (ningún puerto entrante). Un PAT con el alcance **Agent Pools (read, manage)** solo sirve para el registro. Modo **servicio** por defecto; modo **interactivo con autologon** solo si el job necesita un escritorio. `config.cmd --unattended` lo automatiza todo; un agente por carpeta, un nombre único, una carpeta de trabajo propia. |
| **Herramientas utilizables** | `config.cmd` (con `--unattended`, `--runAsService`, `--runAsAutoLogon`, `--replace`, `--overwriteAutoLogon`, `--noRestart`), `run.cmd` y `run.cmd --once`, `config.cmd remove`, `services.msc`, `.\run --diagnostics`, los `demands` del pipeline, `tscon` para devolver una sesión remota a la pantalla, `workspace: clean: all` para limpiar la carpeta de trabajo. |
| **Trampas a evitar** | PAT demasiado amplio, secreto en la línea de comandos, carpeta del agente legible por todos, ruta con espacios, PowerShell sin elevación, cuenta de autologon personal, dos agentes con el mismo nombre, herramienta instalada sin reiniciar el agente, PAT sin caducidad, carpeta de agente copiada, carpeta borrada sin `config.cmd remove`, secreto en una variable de entorno de la máquina (mostrada en claro en las capacidades). |
| **Buenas prácticas** | Probar primero un agente alojado por Microsoft; una cuenta de ejecución dedicada y distinta de la que registra; secretos mediante variables de entorno; un agente por máquina salvo necesidad concreta; comprobar `.\config.cmd --help` para la versión instalada; PAT de caducidad corta, revocado tras el registro; revisión obligatoria de los cambios de pipeline; un pool por nivel de confianza. |
