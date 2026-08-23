---
order: 2
---

# El sistema de opciones (`setopt`)

[Bash](/?c=shells&s=bash&p=bash) activa comportamientos opcionales caso por caso (`shopt -s nombre`, `set -o nombre`, cada uno con su propio comando). Zsh centraliza esto en un único mecanismo coherente: `setopt`/`unsetopt`, con decenas de opciones con nombre que cambian el comportamiento del shell.

## Activar y desactivar una opción

```bash
setopt AUTO_CD    # activa una opcion
unsetopt AUTO_CD  # la desactiva

setopt            # lista todas las opciones actualmente activas
```

> **Nota:** los nombres de las opciones no distinguen mayúsculas/minúsculas ni guiones bajos: `AUTO_CD`, `autocd` y `auto_cd` designan la misma opción. La convención `MAYUSCULAS_CON_GUIONES_BAJOS` es la más legible y la más extendida en los `.zshrc` que se encuentran en línea.

## Algunas opciones útiles en el día a día

```bash
setopt AUTO_CD           # escribir un nombre de carpeta solo (sin "cd") entra directamente en ella
setopt EXTENDED_GLOB     # activa el globbing extendido (ver Expansión y comodines avanzados)
setopt SHARE_HISTORY     # comparte el historial de comandos en tiempo real entre todos los terminales abiertos
setopt HIST_IGNORE_DUPS  # no registra un comando identico al anterior en el historial
setopt CORRECT           # propone una correccion si un comando escrito no existe ("did you mean...")
```

| Opción | Efecto |
|---|---|
| `AUTO_CD` | `nombre_carpeta` solo equivale a `cd nombre_carpeta` |
| `EXTENDED_GLOB` | activa los patrones de globbing extendidos (ver [Expansión y comodines avanzados](/?c=shells&s=zsh&p=expansion-et-jokers-avances)) |
| `SHARE_HISTORY` | historial compartido en vivo entre terminales abiertos simultáneamente |
| `HIST_IGNORE_DUPS` | sin duplicado consecutivo en el historial |
| `CORRECT` | sugiere una corrección ortográfica de comando |
| `NO_CASE_GLOB` | el globbing (`*.txt`) se vuelve insensible a mayúsculas/minúsculas |

## `setopt` vs `shopt`/`set -o`: no es solo un nombre diferente

A diferencia de Bash, donde las opciones están dispersas entre `shopt` (opciones específicas de Bash) y `set -o` (opciones POSIX compartidas), zsh agrupa todo bajo `setopt`/`unsetopt`, con una lista de varios cientos de opciones que cubren aspectos que Bash no hace configurables en absoluto (comportamiento del globbing, del historial, de la finalización...).

> **Nota:** estas opciones se colocan típicamente en `~/.zshrc` (ver [Los archivos de inicio](/?c=shells&s=zsh&p=fichiers-de-demarrage)) para estar activas en cada nuevo terminal, exactamente como un `shopt -s` se colocaría en `~/.bashrc`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Zsh agrupa todas sus opciones de comportamiento bajo un único mecanismo (`setopt`/`unsetopt`), mientras que Bash las dispersa entre `shopt` y `set -o`. |
| **Herramientas utilizables** | `setopt`/`unsetopt`, `AUTO_CD`, `EXTENDED_GLOB`, `SHARE_HISTORY`, `CORRECT`. |
| **Trampas a evitar** | Buscar una opción Bash equivalente una por una: zsh a menudo cubre aspectos que Bash no hace configurables en absoluto. |
| **Buenas prácticas** | Colocar los `setopt` en `~/.zshrc` para que estén activos en cada nuevo terminal. |
