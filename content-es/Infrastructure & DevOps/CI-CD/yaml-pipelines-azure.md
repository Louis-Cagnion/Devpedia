---
order: 3
---

# La sintaxis YAML de los pipelines Azure

Un pipeline Azure DevOps se describe en un archivo `azure-pipelines.yml`, en formato **YAML** (ver la sintaxis básica, ya cubierta en [Docker Compose](/?c=docker&p=docker-compose)): este capítulo solo cubre lo que es específico de la estructura de un pipeline.

## La jerarquía de un pipeline

Un pipeline se organiza en cuatro niveles anidados, del más amplio al más preciso:

```text
Pipeline
  └─ Stage    (una gran fase, ej. "Build", "Test", "Deploy")
       └─ Job       (un conjunto de tareas ejecutadas en una misma máquina)
            └─ Step      (una tarea precisa: lanzar un comando, publicar un archivo...)
```

Los stages de un mismo pipeline pueden encadenarse (uno tras otro) o correr en paralelo; los jobs de un mismo stage también. Los steps de un mismo job, en cambio, siempre se ejecutan en el orden en que están escritos.

## Un ejemplo mínimo

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

steps:
  - script: npm install
    displayName: Instalar las dependencias
  - script: npm test
    displayName: Lanzar los tests
```

- `trigger`: cuándo se lanza automáticamente el pipeline (aquí, en cada push a `main`).
- `pool`: en qué grupo de agentes (los programas que ejecutan los jobs, en una máquina proporcionada por Microsoft o la tuya) se ejecuta el pipeline; un pool es una lista de agentes, no una máquina: puede agrupar agentes de varias máquinas, y una máquina puede alojar agentes de varios pools.
- `steps`: la lista de pasos, ejecutados en orden. `script` lanza un comando bruto; `displayName` es solo el nombre mostrado en los registros de ejecución.

> **Trampa:** olvidar `trigger`. Sin él, el comportamiento por defecto depende de la configuración del proyecto (disparo en cualquier rama, o pipeline que nunca se lanza solo): mejor precisarlo explícitamente que adivinar qué hará la ausencia de este campo.
>
> **Buena práctica:** declarar `trigger` explícitamente, incluso para reproducir un comportamiento que de todos modos sería el por defecto: el archivo sigue siendo comprensible sin tener que conocer ese valor por defecto de memoria.

## Las tasks: steps listos para usar

Una **task** es un step predefinido por Azure DevOps (o por el marketplace) para una acción habitual, en lugar de escribir el comando bruto uno mismo:

```yaml
steps:
  - script: npm run build
  - task: PublishBuildArtifacts@1
    inputs:
      PathtoPublish: dist
      ArtifactName: mi-app
```

`PublishBuildArtifacts@1` es una task oficial que publica una carpeta como resultado del pipeline (recuperable por otro stage o mediante descarga manual): esto evita reescribir uno mismo la lógica de archivado y subida.

## Trampa: poner un secreto en claro en el archivo YAML

```yaml
# nunca hacer esto: la contraseña aparece en claro en el historial Git
steps:
  - script: deploy.sh --password miContraseña123
```

> **Trampa:** escribir una contraseña, una clave de API o un token de acceso directamente en `azure-pipelines.yml`. Este archivo está versionado en el repositorio [Git](/?c=git&p=git): el secreto sigue siendo visible en el historial incluso después de retirarlo de una versión posterior.
>
> **Buena práctica:** almacenar los secretos en un **grupo de variables** (*variable group*) o una biblioteca de Azure DevOps dedicada, y luego referenciarlos en el YAML por su nombre (`$(contraseña)`): el archivo versionado nunca contiene entonces el valor en sí.

## Autorizar un pipeline a usar un recurso por primera vez: "Permit"

Un pipeline que referencia en su YAML un grupo de variables o un Environment nunca antes usado por ESE pipeline no se inicia automáticamente en el primer `Run`: Azure DevOps muestra un banner *"This pipeline needs permission to access N resource(s)"* con un botón **Permit** por cada recurso implicado.

```text
Run pipeline
  -> "This pipeline needs permission to access 1 resource(s)"
  -> boton Permit (casilla: "for this run and future runs")
```

Distinto de la cuestión de quién puede leer/escribir el grupo de variables (ya una buena práctica de seguridad de secretos): Permit es una lista blanca pipeline-recurso, a conceder una vez. El botón Permit en sí solo aparece para un administrador del recurso referenciado: otro usuario no ve ningún botón, sin mensaje de error explícito que lo indique.

> **Trampa:** interpretar la ausencia del botón Permit como un bug en lugar de como una falta de derechos de administrador sobre el recurso referenciado (grupo de variables, Environment).
>
> **Buena práctica:** marcar "for this run and future runs" en el primer Permit de un pipeline estable, para no tener que reautorizar en cada nuevo run.

## Los Environments de Azure DevOps: un recurso distinto, con checks de aprobación

Un `environment: OnPrem-Prod` declarado en un `deployment job` es un recurso de primer orden, distinto de un grupo de variables, que puede llevar **checks**: por ejemplo un aprobador designado, con un plazo antes de que el stage continúe.

```yaml
jobs:
  - deployment: DeployProd
    environment: OnPrem-Prod
    strategy:
      runOnce:
        deploy:
          steps:
            - script: ./deploy.sh
```

Un Environment no autorizado bloquea el run con el mismo banner "Permission needed" que un grupo de variables no autorizado; pero un Environment protegido por un check de aprobación bloquea de forma distinta: el run espera la validación manual del aprobador designado, hasta que expira un plazo configurado.

> **Trampa:** confundir el bloqueo por "Permit" (autorización de acceso, a conceder una vez) con el bloqueo por un check de aprobación (validación humana en cada despliegue): ambos muestran un run en espera, pero la resolución es distinta.
>
> **Buena práctica:** reservar los checks de aprobación para los Environments de alto riesgo (producción), no para un Environment de prueba que solo necesita un Permit inicial.

## Los parámetros de pipeline: elegir al lanzarlo

Un pipeline lanzado a mano puede pedir elecciones a la persona que lo lanza: es el papel del bloque `parameters`, colocado al principio del archivo ([Runtime parameters](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/runtime-parameters)). Azure DevOps muestra entonces un formulario antes del lanzamiento.

```yaml
parameters:
  - name: modo                     # nombre usado en el archivo
    displayName: Modo de ejecución # etiqueta mostrada en el formulario
    type: string
    default: normal                # valor si nadie cambia nada
    values:                        # opciones propuestas (lista desplegable)
      - normal
      - desbloqueo

steps:
  - script: python robot.py
    displayName: Lanzar el robot
  - ${{ if eq(parameters.modo, 'desbloqueo') }}:
      - script: python robot.py --ventana-visible
        displayName: Relanzar con ventana visible
```

La línea `${{ if eq(parameters.modo, 'desbloqueo') }}:` es una **expresión de plantilla** ([Template expressions](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/template-expressions)): se evalúa en la **compilación** del archivo, es decir, en el momento en que Azure DevOps transforma el YAML en una lista de jobs, antes de que se ejecute el menor step. Si la condición es falsa, el step simplemente no existe en el run.

| Sintaxis | Evaluada | Conoce |
|---|---|---|
| `${{ parameters.modo }}` | En la compilación, antes de la ejecución | Los parámetros y los valores fijados en el archivo |
| `$(nombreVariable)` | En el momento en que se ejecuta el step | También las variables calculadas durante el run |

> **Trampa:** usar `${{ }}` con una variable calculada durante el run: en la compilación todavía no existe, y la expresión vale una cadena vacía.
>
> **Buena práctica:** restringir un parámetro de texto a una lista `values`, para que un error de tecleo al lanzarlo sea imposible en lugar de pasar en silencio a la condición.

## Control bloqueante o alerta no bloqueante

Un step que termina con un [código de salida](/?c=langages&s=c&p=exit-et-codes-de-retour) distinto de `0` hace fallar su job: el run se vuelve rojo y los stages siguientes no se ejecutan. Es el comportamiento correcto para un **control bloqueante** (tests que fallan, despliegue imposible).

Para señalar un problema sin detenerlo todo, un script puede escribir **comandos de registro** (*logging commands*), líneas especiales que Azure DevOps interpreta en lugar de simplemente mostrarlas ([Logging commands](https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands)):

```powershell
# muestra una advertencia amarilla en el resumen del run, sin fallo
Write-Host "##vso[task.logissue type=warning]3 páginas no se pudieron leer"
# termina el step como "correcto con problemas": el run se vuelve naranja
Write-Host "##vso[task.complete result=SucceededWithIssues;]"
```

| Situación | Mecanismo | Resultado del run |
|---|---|---|
| Problema que debe detenerlo todo | Código de salida distinto de cero | Rojo, stages siguientes cancelados |
| Problema que señalar, sin gravedad | `task.logissue type=warning` | Verde, con una advertencia visible |
| Resultado parcial que vigilar | `task.complete result=SucceededWithIssues` | Naranja («parcialmente correcto») |

> **Trampa:** hacer fallar todo el pipeline por un incidente menor (algunas páginas ilegibles): las verdaderas alertas críticas se pierden entonces entre fallos habituales que ya nadie mira.
>
> **Buena práctica:** reservar el fallo a las situaciones que exigen una acción inmediata, y distinguir en los mensajes «resultado vacío legítimo» y «fallo de lectura».

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un pipeline Azure se organiza en stages, que contienen jobs, que contienen steps ejecutados en orden. `trigger` define cuándo se lanza, `pool` en qué grupo de agentes, `steps`/`task` las acciones a ejecutar. `parameters` propone elecciones al lanzarlo, evaluadas en la compilación por `${{ }}`. Un grupo de variables o un Environment nunca usado por un pipeline dado exige un Permit explícito (solo disponible para un administrador del recurso); un Environment puede además llevar un check de aprobación humana. |
| **Herramientas utilizables** | Las tasks oficiales (`PublishBuildArtifacts@1` y muchas otras) para acciones habituales, sin reescribir su lógica a mano. Los Environments para llevar checks de aprobación en un despliegue sensible. Los comandos de registro (`##vso[task.logissue]`, `##vso[task.complete]`) para una alerta no bloqueante. |
| **Trampas a evitar** | Omitir `trigger` y dejar que un comportamiento implícito decida cuándo se lanza el pipeline. Escribir un secreto en claro en el archivo YAML versionado. Confundir un bloqueo Permit (autorización de acceso) con un bloqueo por check de aprobación (validación humana en cada despliegue). Usar `${{ }}` con una variable calculada durante el run. Hacer fallar todo el pipeline por un incidente menor. |
| **Buenas prácticas** | Declarar `trigger` explícitamente. Almacenar los secretos en un grupo de variables dedicado y referenciarlos por su nombre, nunca en claro. Marcar "for this run and future runs" en el primer Permit de un pipeline estable. Reservar los checks de aprobación para los Environments de alto riesgo. Restringir un parámetro de texto a una lista `values`. Reservar el fallo del pipeline a las situaciones que exigen una acción inmediata. |
