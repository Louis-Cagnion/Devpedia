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
- `pool`: qué máquina (proporcionada por Microsoft, o la tuya) ejecuta el pipeline.
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

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un pipeline Azure se organiza en stages, que contienen jobs, que contienen steps ejecutados en orden. `trigger` define cuándo se lanza, `pool` en qué máquina, `steps`/`task` las acciones a ejecutar. |
| **Herramientas utilizables** | Las tasks oficiales (`PublishBuildArtifacts@1` y muchas otras) para acciones habituales, sin reescribir su lógica a mano. |
| **Trampas a evitar** | Omitir `trigger` y dejar que un comportamiento implícito decida cuándo se lanza el pipeline. Escribir un secreto en claro en el archivo YAML versionado. |
| **Buenas prácticas** | Declarar `trigger` explícitamente. Almacenar los secretos en un grupo de variables dedicado y referenciarlos por su nombre, nunca en claro. |
