---
order: 4
---

# La finalización avanzada

[Bash](/?c=shells&s=bash&p=bash) completa nombres de archivos y, para ciertos comandos, propone una lista plana con la tecla Tab. El sistema de finalización de zsh (`compsys`) es un motor completo, sensible al **contexto**: sabe que después de `git checkout` debe proponer nombres de ramas, y que después de `kill`, PID de procesos en ejecución, no solo nombres de archivos.

## Activar el sistema de finalización

```bash
autoload -Uz compinit
compinit
```

Estas dos líneas, colocadas en `~/.zshrc` (ver [Los archivos de inicio](/?c=shells&s=zsh&p=fichiers-de-demarrage)), cargan `compsys`. Sin ellas, zsh se limita a una finalización básica similar a la de Bash.

> **Nota:** `compinit` reconstruye una caché de definiciones de finalización en cada arranque, lo que puede ralentizar perceptiblemente la apertura de un nuevo terminal; de ahí el uso habitual de `compinit -C` (sin reverificación de la caché) una vez estabilizada la configuración, o de una llamada condicionada a la fecha de la caché.

## Lo que cambia concretamente

```bash
git checkout <Tab>  # propone las ramas locales, no los archivos de la carpeta
kill -9 <Tab>       # propone los PID de procesos en ejecucion, con su nombre
ssh <Tab>           # propone los hosts conocidos (~/.ssh/config, ~/.ssh/known_hosts)
```

Sin `compsys`, cada uno de estos comandos se limitaría a completar nombres de archivos de la carpeta actual, rara vez lo que se quiere en estos casos precisos.

## El menú de finalización navegable

Cuando hay varios resultados posibles, zsh puede mostrar un **menú** navegable con las flechas en lugar de simplemente listar las posibilidades:

```bash
zstyle ':completion:*' menu select
```

Una vez añadida esta línea a `~/.zshrc`, pulsar Tab con varios resultados posibles abre un menú donde las flechas direccionales mueven la selección, y Enter valida: más rápido que volver a escribir caracteres para desambiguar.

## Finalización insensible a mayúsculas/minúsculas

```bash
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
```

Permite escribir `desk<Tab>` y completar hacia `Desktop` a pesar de la mayúscula, útil sobre todo en macOS/Windows donde la distinción de mayúsculas en nombres de archivos se respeta menos estrictamente que en Bash bajo Linux.

## `zstyle`: el mecanismo de configuración detrás de todo esto

Los ejemplos de arriba usan `zstyle`, el comando genérico de configuración de `compsys`: cada regla asocia un contexto (`':completion:*'` = en todas partes) a un comportamiento. Es un mecanismo propio de zsh, sin equivalente directo en Bash, cuya finalización no expone este nivel de personalización.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `compsys` es un motor de finalización sensible al contexto: después de `git checkout`, propone ramas, no nombres de archivos. Debe activarse explícitamente (`compinit`). |
| **Herramientas utilizables** | `autoload -Uz compinit`/`compinit`, `zstyle` para personalizar (menú navegable, insensibilidad a mayúsculas/minúsculas). |
| **Trampas a evitar** | `compinit` reconstruye su caché en cada arranque: puede ralentizar perceptiblemente la apertura de un terminal. |
| **Buenas prácticas** | Usar `compinit -C` una vez estabilizada la configuración, para evitar la reverificación sistemática de la caché. |
