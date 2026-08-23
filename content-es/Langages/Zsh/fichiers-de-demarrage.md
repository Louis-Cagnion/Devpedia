---
order: 1
---

# Los archivos de inicio

[Bash](/?c=shells&s=bash&p=bash) carga según el caso `~/.bashrc`, `~/.bash_profile` o `~/.profile` (ver [Variables de entorno](/?c=shells&s=bash&p=variables-denvironnement) en Bash). Zsh divide esta misma necesidad en **cuatro archivos distintos**, cada uno con un rol preciso: entender esta distinción evita las sorpresas clásicas ("mi variable no es visible en mi script aunque funciona en mi terminal").

## Los cuatro archivos, y cuándo se carga cada uno

| Archivo | Cargado para... |
|---|---|
| `~/.zshenv` | **Toda** invocación de zsh, incluidos los scripts no interactivos y las [subshells](/?c=shells&s=bash&p=architecture-dun-shell) (lo mismo que sería el comportamiento de `~/.bashrc` si Bash lo cargara sistemáticamente, cosa que no hace) |
| `~/.zprofile` | Únicamente un shell de conexión (*login shell*), equivalente de `~/.bash_profile` |
| `~/.zshrc` | Únicamente un shell interactivo, equivalente de `~/.bashrc`, es el archivo más modificado en la práctica (alias, `PROMPT`, plugins de [Oh My Zsh](/?c=shells&s=zsh&p=oh-my-zsh)) |
| `~/.zlogin` | Únicamente un shell de conexión, **después** de `~/.zshrc`, poco usado, para comandos que deben ejecutarse una vez el entorno interactivo esté listo |

> **Nota:** a diferencia de Bash, donde el orden exacto de carga según "login" o "no login" es una fuente recurrente de confusión, zsh siempre carga en el mismo orden fijo: `.zshenv` → `.zprofile` (si login) → `.zshrc` (si interactivo) → `.zlogin` (si login). Es predecible, sin importar el contexto de invocación.

## Dónde poner qué

```bash
# ~/.zshenv: variables necesarias incluso en un script no interactivo
export EDITOR="vim"

# ~/.zshrc: todo lo que solo tiene sentido en interactivo
alias ll="ls -la"
export PROMPT='%n@%m %~ %# '
```

> **Nota:** `~/.zshenv` se carga incluso con herramientas que invocan zsh entre bastidores (scripts, algunos gestores de ventanas): poner ahí comandos lentos o que muestran algo puede ralentizar o perturbar programas que no esperan un shell interactivo. Reservar `~/.zshenv` para lo estrictamente necesario (variables de entorno), y poner el resto en `~/.zshrc`.

## Recargar sin abrir un nuevo terminal

Como `source ~/.bashrc` en Bash:

```bash
source ~/.zshrc
# equivalente, mas corto:
. ~/.zshrc
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Zsh siempre carga en el mismo orden fijo: `.zshenv` → `.zprofile` (login) → `.zshrc` (interactivo) → `.zlogin` (login), más predecible que la lógica login/no-login de Bash. |
| **Herramientas utilizables** | `~/.zshenv` (toda invocación), `~/.zshrc` (interactivo, el más modificado en la práctica), `source`/`.`. |
| **Trampas a evitar** | Poner un comando lento o que muestra algo en `~/.zshenv`: se carga incluso con herramientas que invocan zsh entre bastidores. |
| **Buenas prácticas** | Reservar `~/.zshenv` para las variables de entorno estrictamente necesarias; poner alias, `PROMPT` y plugins en `~/.zshrc`. |
