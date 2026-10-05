---
order: 5
---

# Los agentes de Azure DevOps autoalojados

Un pipeline de Azure DevOps (ver [la sintaxis YAML de los pipelines](/?c=ci-cd&p=yaml-pipelines-azure)) no se ejecuta «dentro de Azure DevOps»: lo ejecuta un pequeño programa instalado en una máquina, el **agente**. Este capítulo explica cómo instalar ese programa en una máquina que usted administra (un **agente autoalojado**), cómo iniciarlo y qué cambia esto en materia de seguridad.

## Agente, pool, job: quién ejecuta qué

| Término | Qué es |
|---|---|
| **Agente** | Programa instalado en una máquina, que espera trabajo, lo ejecuta y devuelve los registros |
| **Pool** | Lista de agentes con un nombre; un pipeline pide un pool, no una máquina concreta |
| **Job** | Conjunto de steps confiado a un solo agente del pool ([jerarquía de un pipeline](/?c=ci-cd&p=yaml-pipelines-azure)) |

```text
Azure DevOps (servicio en línea)           Su máquina
┌──────────────────────────┐               ┌────────────────────────┐
│ Pipeline lanzado         │               │ Agente                 │
│ Pool «Robots»: 1 job     │ <──────────── │ pregunta: «¿hay        │
│ en espera                │  conexión     │ trabajo para mí?»      │
└──────────────────────────┘  saliente     └────────────────────────┘
                              (HTTPS)
```

Es el agente quien contacta con Azure DevOps, nunca al revés: no hay que abrir ningún puerto hacia el exterior en su máquina, basta con que pueda alcanzar `dev.azure.com` por HTTPS ([comunicación del agente](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents#communication)).

## Agente de Microsoft o autoalojado

| | Agente proporcionado por Microsoft | Agente autoalojado |
|---|---|---|
| Máquina | Máquina virtual nueva en cada job, destruida después | La suya, que permanece |
| Instalación de herramientas | Ya hecha por Microsoft (lista fija) | A su cargo (herramientas, versiones, licencias) |
| Acceso a la red interna | No | Sí (base de datos interna, servidor de despliegue) |
| Ventana visible, hardware particular | No | Sí (pantalla, tarjeta gráfica, periférico) |
| Mantenimiento y seguridad | Microsoft | Usted |

Se elige un agente autoalojado cuando el job necesita algo que el agente de Microsoft no puede ofrecer: llegar a un servidor interno, usar una herramienta con licencia o manejar una interfaz gráfica (un robot que controla un navegador con una ventana real, por ejemplo).

## Instalar y registrar un agente

Pasos, en la máquina de destino ([documentación para Windows](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent)):

1. En Azure DevOps, abrir *Organization settings* > *Agent pools*, elegir el pool y luego *New agent*: el sitio da el enlace de descarga de un archivo comprimido.
2. Descomprimir el archivo en una carpeta **sin espacios** en su ruta, por ejemplo `C:\agents\robot-1`.
3. En una consola PowerShell iniciada **como administrador**, ir a esa carpeta y ejecutar `.\config.cmd`: el programa hace preguntas (dirección de la organización, pool, nombre del agente, modo de inicio).
4. Para la autenticación, `config.cmd` pide un **token de acceso personal** (*Personal Access Token*, o PAT: una contraseña generada, limitada a ciertas acciones y a una duración, ya definida en [GitHub y las plataformas de alojamiento Git](/?c=git&p=github-et-plateformes)). Su *scope* (alcance) debe ser *Agent Pools (Read & manage)*.

El PAT sirve **solo para el registro**: una vez inscrito el agente en el pool, usa sus propias credenciales, guardadas en su carpeta. La cuenta que registra el agente debe ser administradora del pool; la que lo ejecuta, no.

> **Trampa:** crear un PAT sin fecha de caducidad, o con permisos amplios («Full access»), y olvidarlo: el token sigue siendo válido aunque el agente ya no lo necesite.
>
> **Buena práctica:** un PAT limitado al scope *Agent Pools (Read & manage)* y que caduque en pocos días, revocado en cuanto el agente esté registrado.

## Modo servicio o modo interactivo

El agente puede iniciarse de dos maneras, según lo que deban hacer sus jobs ([interactivo o servicio](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents#interactive-or-service)). Las nociones de servicio y de sesión de Windows se detallan en [Windows: servicios, sesiones y permisos](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits).

| | Modo servicio | Modo interactivo |
|---|---|---|
| Inicio | Por Windows, al arrancar la máquina | Al ejecutar `run.cmd` en una sesión abierta |
| Usuario conectado necesario | No | Sí (debe haber una sesión abierta) |
| Sesión | Sesión 0, sin pantalla | Sesión del usuario, con escritorio |
| Ventanas de los jobs | Invisibles | Visibles |
| Reinicio de la máquina | El agente vuelve solo | El agente vuelve solo si una sesión se abre sola (autologon) |
| Opción de `config.cmd` | `--runAsService` | `--runAsAutoLogon` (o ninguna opción y luego `run.cmd` a mano) |

> **Regla de elección:** por defecto, modo servicio (es el que recomienda Microsoft). Modo interactivo solo si un job necesita una ventana real (prueba de interfaz, robot que maneja un navegador visible).

Con `--runAsAutoLogon`, `config.cmd` configura la apertura automática de sesión (el mecanismo *autologon* y sus riesgos se describen en [el capítulo de Windows](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)) e inscribe el agente para que arranque al abrirse esa sesión. Por defecto, la máquina se reinicia al terminar la configuración.

> **Trampa:** un agente en modo interactivo depende de su sesión. Si la sesión se cierra, o si alguien se conecta a ella de forma remota y la desplaza (ver [el acceso remoto a Windows](/?c=infrastructure-devops&s=administration-systeme&p=acces-a-distance-windows)), los jobs gráficos fallan o producen imágenes negras, y el agente aparece «sin conexión» si se cierra la consola.
>
> **Buena práctica:** reservar una máquina (o una máquina virtual) para el agente interactivo, con una cuenta dedicada, y no iniciar nunca sesión en ella con esa misma cuenta.

## Configurar sin intervención

Para instalar varios agentes, o rehacer la configuración de forma idéntica, `config.cmd` acepta todas sus respuestas como opciones (`--unattended`: no se hace ninguna pregunta):

```powershell
cd C:\agents\robot-1
.\config.cmd --unattended `
  --url https://dev.azure.com/mi-organizacion `
  --auth pat `
  --token $env:AGENT_PAT `
  --pool Robots `
  --agent robot-1 `
  --runAsAutoLogon `
  --windowsLogonAccount robot-1 `
  --overwriteAutoLogon
```

| Opción | Función |
|---|---|
| `--url` | Dirección de la organización de Azure DevOps |
| `--auth pat`, `--token` | Tipo de autenticación y token (usado solo en el registro) |
| `--pool`, `--agent` | Pool al que unirse y nombre del agente (único en el pool) |
| `--runAsService` o `--runAsAutoLogon` | Modo de inicio (ver la sección anterior) |
| `--windowsLogonAccount`, `--windowsLogonPassword` | Cuenta de Windows que ejecuta el agente y su contraseña (innecesaria para una cuenta integrada como `NT AUTHORITY\NETWORK SERVICE`) |
| `--overwriteAutoLogon` | Reemplaza un autologon ya configurado en la máquina |
| `--noRestart` | Evita reiniciar la máquina tras un `--runAsAutoLogon` |
| `--replace` | Reemplaza un agente del mismo nombre ya inscrito en el pool |

Cada opción también puede darse mediante una variable de entorno: su nombre en mayúsculas, precedido de `VSTS_AGENT_INPUT_` (por ejemplo `VSTS_AGENT_INPUT_TOKEN` para `--token`) ([configuración sin intervención](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#unattended-config)).

> **Trampa:** escribir `--token` o `--windowsLogonPassword` en claro en el comando: la línea queda en el historial de la consola (archivo de historial de PowerShell), en los scripts de instalación versionados, y se puede leer en la lista de procesos mientras se ejecuta.
>
> **Buena práctica:** dejar que `config.cmd` haga sus preguntas, o leer el secreto desde una variable de entorno rellenada a partir de un gestor de secretos (ver [la gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) y luego borrar la variable.

## Varios agentes en una misma máquina

Una máquina puede alojar varios agentes, siempre que **cada uno tenga su propia carpeta**: cada carpeta contiene la configuración del agente, sus credenciales y su carpeta de trabajo `_work`, que nunca debe compartirse ([opciones de configuración](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#unattended-config)).

```text
C:\agents\
├── robot-1\   (agente «robot-1», pool Robots, su propio _work)
├── robot-2\   (agente «robot-2», pool Robots, su propio _work)
└── deploy-1\  (agente «deploy-1», pool Despliegue, su propio _work)
```

| Necesidad | Solución |
|---|---|
| Dos jobs en paralelo | Dos agentes en el mismo pool |
| Separar dos usos (robot / despliegue) | Dos pools, cada uno con sus agentes |
| Dos agentes con permisos distintos | Dos cuentas de Windows, una por agente |

> **Trampa:** copiar la carpeta de un agente ya configurado para crear un segundo: los dos comparten las mismas credenciales y el mismo nombre, y uno de ellos se corta tras unos minutos de conflicto.
>
> **Buena práctica:** descomprimir un archivo nuevo para cada agente, con un nombre único.

## Elegir el pool desde el YAML

El pipeline designa el pool por su nombre (en lugar de `vmImage`, que apunta a los agentes de Microsoft). Un job puede además exigir una **capacidad** del agente (*demand*): cada agente anuncia lo que hay instalado en su máquina (sistema, herramientas) y Azure DevOps solo le confía los jobs compatibles ([capacidades](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#capabilities)).

```yaml
jobs:
  - job: Robot
    pool:
      name: Robots
      demands:
        - Agent.OS -equals Windows_NT
    workspace:
      clean: all
    steps:
      - script: python robot.py
```

> **Trampa:** instalar una herramienta en la máquina después de iniciar el agente: su lista de capacidades solo se actualiza al reiniciar el agente, y el job queda en espera con «no agent found in pool».
>
> **Buena práctica:** reiniciar el agente tras instalar cualquier herramienta; ante una espera inexplicada, comparar los `demands` del job con la pestaña *Capabilities* del agente.

## Seguridad: el agente ejecuta el código del repositorio

Un agente ejecuta los comandos escritos en el pipeline con los permisos de la cuenta que lo ejecuta. Quien pueda modificar el archivo `azure-pipelines.yml` (o un script al que llame) puede por tanto ejecutar código en su máquina; Microsoft lo dice de forma explícita: el agente está diseñado para ejecutar código descargado, por lo que es un posible objetivo de ejecución remota de código.

| Riesgo | Medida |
|---|---|
| Un job lee los secretos de la carpeta del agente (credenciales, registros) | Carpeta del agente accesible solo para los administradores y la cuenta del agente |
| Una cuenta demasiado potente (administrador, cuenta de dominio) ejecuta el agente | Cuenta local dedicada, con los permisos mínimos (principio de [mínimo privilegio](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)) |
| Un pipeline no fiable usa el agente de otro proyecto | Un pool distinto por nivel de confianza, con los derechos de uso del pool restringidos |
| La cuenta que registra el agente es también la que lo ejecuta | Dos cuentas distintas |

> **Trampa:** conectar a un agente autoalojado, que tiene acceso a la red interna, un repositorio en el que cualquier colaborador puede proponer un cambio de pipeline: una simple solicitud de fusión basta entonces para ejecutar código en su red.
>
> **Buena práctica:** exigir una revisión antes de cualquier cambio en un pipeline que use un agente autoalojado, y mantener los agentes con acceso a la red interna fuera del alcance de repositorios que no controla.

## Mantenimiento

| Tarea | Cómo |
|---|---|
| Actualización del agente | Automática: el agente se actualiza cuando un job exige una versión más reciente |
| Disco que se llena | Carpeta `_work` limpiada en cada job por `workspace: clean: all` (ver el YAML anterior) |
| Ver el estado de un agente en modo servicio | `services.msc`, entrada «Azure Pipelines Agent» (o «vstsagent.…») |
| Diagnosticar un agente | `.\run.cmd --diagnostics` |
| Retirar un agente | `.\config.cmd remove`, y comprobar que ha desaparecido del pool |

> **Trampa:** borrar la carpeta de un agente sin ejecutar `config.cmd remove`: el agente sigue apareciendo en el pool (sin conexión) y enturbia la lectura del estado del pool.
>
> **Buena práctica:** retirar siempre el agente de forma limpia antes de borrar su carpeta o reinstalar la máquina.

---

## 📋 Resumen

| | |
|---|---|
| **Qué recordar** | Un pipeline lo ejecuta un **agente**, programa instalado en una máquina y agrupado en un **pool**. El agente contacta con Azure DevOps (conexión saliente); un PAT solo sirve para registrarlo. Modo servicio por defecto (arranca con la máquina, sin ventana visible); modo interactivo (autologon) solo si un job exige una ventana real. Un agente por carpeta, con un nombre único. |
| **Herramientas utilizables** | `config.cmd` (configuración, con `--unattended` para automatizarla), `run.cmd` (inicio interactivo, `--diagnostics`), `services.msc` (estado del servicio), los `demands` del YAML para apuntar a una capacidad, `workspace: clean: all` para limpiar la carpeta de trabajo. |
| **Trampas que evitar** | PAT sin caducidad o con permisos amplios. Secreto escrito en claro en la línea de comandos. Agente interactivo cuya sesión se cierra o se desplaza. Carpeta de agente copiada tal cual. Cuenta de agente demasiado potente. Repositorio no controlado conectado a un agente que ve la red interna. |
| **Buenas prácticas** | PAT limitado a *Agent Pools (Read & manage)*, de caducidad corta, revocado tras el registro. Cuenta local dedicada con permisos mínimos, distinta de la que registra. Un pool por nivel de confianza. Revisión obligatoria de los cambios de pipeline. Retirada limpia con `config.cmd remove`. |
