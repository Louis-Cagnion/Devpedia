---
order: 6
---

# Oh My Zsh

Configurar manualmente [el prompt](/?c=shells&s=zsh&p=prompt-et-themes), [la finalización](/?c=shells&s=zsh&p=completion-avancee) y [decenas de opciones](/?c=shells&s=zsh&p=options-du-shell) requiere tiempo. **Oh My Zsh** es un framework de código abierto que provee todo eso preconfigurado, con cientos de temas y plugins listos para usar: la forma más habitual de tener un `~/.zshrc` cómodo sin escribirlo todo uno mismo.

## Instalación

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

El instalador guarda el antiguo `~/.zshrc` (como `~/.zshrc.pre-oh-my-zsh`), instala Oh My Zsh en `~/.oh-my-zsh/`, y genera un nuevo `~/.zshrc` que lo carga.

## La estructura de un `.zshrc` con Oh My Zsh

```bash
export ZSH="$HOME/.oh-my-zsh"

ZSH_THEME="robbyrussell"

plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh
```

- `ZSH_THEME` selecciona un tema entre los provistos (en `~/.oh-my-zsh/themes/`), configura `PROMPT`/`RPROMPT` en tu lugar (ver [Personalizar el prompt](/?c=shells&s=zsh&p=prompt-et-themes)), no hace falta redefinirlos uno mismo además.
- `plugins=(...)` activa una lista de plugins, cada uno añadiendo alias, funciones o finalizaciones específicas.
- `source $ZSH/oh-my-zsh.sh` debe seguir siendo la **última** línea relevante: es esta línea la que efectivamente carga el tema y los plugins declarados arriba.

## Algunos plugins habituales

| Plugin | Aporta |
|---|---|
| `git` | Decenas de alias [Git](/?c=git&p=git) (`gst` = `git status`, `gco` = `git checkout`...) y el nombre de la rama actual en el prompt vía `vcs_info` |
| `zsh-autosuggestions` | Sugiere el final de un comando ya escrito en el pasado, en gris, a validar con → |
| `zsh-syntax-highlighting` | Colorea la línea de comandos en tiempo real (verde = comando válido, rojo = inválido) incluso antes de ejecutarla |
| `docker`, `npm`, `python`... | Finalización y alias específicos de la herramienta correspondiente |

> **Nota:** `zsh-autosuggestions` y `zsh-syntax-highlighting` **no** están incluidos por defecto con Oh My Zsh (a diferencia de `git`): se instalan por separado en `~/.oh-my-zsh/custom/plugins/` antes de poder añadirse a la lista `plugins=(...)`.

## Alias provistos por el plugin `git`

```bash
gst    # git status
gco    # git checkout
gaa    # git add --all
gcmsg  # git commit -m
gp     # git push
```

Estos alias (ver [Variables de entorno](/?c=shells&s=bash&p=variables-denvironnement) en [Bash](/?c=shells&s=bash&p=bash) para el mecanismo `alias` en sí, idéntico en zsh) están definidos por el plugin, no por zsh ni por Oh My Zsh mismos; su lista completa depende de la versión del plugin instalada.

## Personalizar sin tocar el núcleo de Oh My Zsh

```bash
# ~/.oh-my-zsh/custom/mis-alias.zsh
alias mialias="mi_comando --con --opciones"
```

Todo archivo `.zsh` colocado en `~/.oh-my-zsh/custom/` se carga automáticamente, lo que evita modificar los archivos internos del framework (que se sobrescribirían en la próxima actualización) para añadir alias o funciones propias.

## Actualizar Oh My Zsh

```bash
omz update
```

Como Oh My Zsh se actualiza mediante su propio repositorio Git interno (`~/.oh-my-zsh/` es un clon Git), este comando hace el equivalente de un `git pull` sobre él, sin tener que ocuparse manualmente.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Oh My Zsh preconfigura el prompt, la finalización y las opciones mediante un framework de temas y plugins, en lugar de ajustarlo todo manualmente. |
| **Herramientas utilizables** | `ZSH_THEME`, `plugins=(...)`, `~/.oh-my-zsh/custom/` para personalizar sin tocar el núcleo del framework, `omz update`. |
| **Trampas a evitar** | Modificar directamente los archivos internos de Oh My Zsh: se sobrescriben en la próxima actualización. |
| **Buenas prácticas** | Colocar los alias/funciones propios en `~/.oh-my-zsh/custom/`; mantener `source $ZSH/oh-my-zsh.sh` como última línea relevante del `.zshrc`. |
