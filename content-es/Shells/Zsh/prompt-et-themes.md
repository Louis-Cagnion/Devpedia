---
order: 5
---

# Personalizar el prompt

Bash construye su indicador mediante la variable `PS1`, con códigos de escape que empiezan por `\` (`\u`, `\h`, `\w`...). Zsh usa su propia variable, `PROMPT` (alias histórico: `PS1`, siempre aceptado), con códigos de escape que empiezan por `%`: una sintaxis completamente diferente, no solo un cambio de nombre.

## La variable `PROMPT`

```bash
PROMPT='%n@%m %~ %# '
```

| Código | Muestra |
|---|---|
| `%n` | Nombre del usuario actual |
| `%m` | Nombre de la máquina (corto) |
| `%~` | Carpeta actual, con `~` si está bajo la carpeta personal (equivalente de `\w` en Bash) |
| `%#` | `#` si es root, `%` si no (equivalente de `\$` en Bash) |
| `%*` | Hora actual (HH:MM:SS) |
| `%D` | Fecha actual |

> **Nota:** a diferencia del `\w` de Bash, que ya abrevia automáticamente la ruta con `~`, zsh distingue explícitamente `%~` (abreviada) de `%/` (ruta completa, nunca abreviada), una elección explícita a hacer según el comportamiento deseado.

## Coloración del prompt

```bash
PROMPT='%F{green}%n@%m%f %F{blue}%~%f %# '
```

`%F{color}` inicia un color de texto, `%f` lo cierra: equivalente de las secuencias de escape ANSI (`\e[32m`, cf. nociones de terminal) pero en una sintaxis propia de zsh, sin necesidad de conocer los códigos ANSI en bruto.

## `RPROMPT`: un indicador secundario a la derecha de la pantalla

Sin equivalente en Bash: zsh puede mostrar un segundo indicador, alineado en el borde derecho del terminal, que desaparece automáticamente en cuanto se empieza a escribir:

```bash
RPROMPT='%D{%H:%M:%S}'
# muestra la hora actual a la derecha, mientras la linea de comandos este vacia
```

## `vcs_info`: información de Git integrada al prompt

Zsh provee de forma nativa una función capaz de mostrar la rama Git actual en el prompt, sin dependencia externa:

```bash
autoload -Uz vcs_info
precmd() { vcs_info }
setopt PROMPT_SUBST
PROMPT='%n@%m %~ ${vcs_info_msg_0_} %# '
```

`PROMPT_SUBST` (ver [El sistema de opciones](/?c=shells&s=zsh&p=options-du-shell)) permite la evaluación de variables y sustituciones dentro de `PROMPT`: sin esta opción, `${vcs_info_msg_0_}` se mostraría literalmente en lugar de ser reemplazado por la rama actual.

> **Nota:** es exactamente este mecanismo (`vcs_info` + un prompt personalizado) el que temas populares como *robbyrussell* (el tema por defecto de [Oh My Zsh](/?c=shells&s=zsh&p=oh-my-zsh)) o [*powerlevel10k*](https://github.com/romkatv/powerlevel10k) automatizan y enriquecen.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Zsh construye su prompt mediante `PROMPT` (códigos `%`), no `PS1`/`\` como Bash. `RPROMPT` muestra un indicador secundario a la derecha, sin equivalente en Bash. |
| **Herramientas utilizables** | `%n`/`%m`/`%~`/`%#`, `%F{color}`/`%f`, `vcs_info` para la rama Git. |
| **Trampas a evitar** | Olvidar `setopt PROMPT_SUBST`: sin él, una sustitución como `${vcs_info_msg_0_}` se muestra literalmente en lugar de evaluarse. |
| **Buenas prácticas** | Usar `vcs_info` para integrar nativamente la rama Git actual, en lugar de un script externo. |
