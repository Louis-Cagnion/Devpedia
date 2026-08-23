---
order: 3
---

# Expansión y comodines avanzados

El globbing básico (`*`, `?`, `[abc]`) funciona de forma idéntica en zsh (ver [Expansión y comodines](/?c=shells&s=bash&p=expansion-et-jokers) en [Bash](/?c=shells&s=bash&p=bash)). Zsh va bastante más lejos una vez activado el modo extendido, con patrones que Bash simplemente no entiende.

## Activar el globbing extendido

```bash
setopt EXTENDED_GLOB
```

Sin esta opción (ver [El sistema de opciones](/?c=shells&s=zsh&p=options-du-shell)), los patrones de este capítulo no se reconocen y se tratan como texto literal.

## `**`: búsqueda recursiva en subcarpetas

```bash
ls **/*.txt
# todos los archivos .txt, a cualquier profundidad bajo la carpeta actual
```

> **Nota:** en Bash, este comportamiento recursivo requiere `shopt -s globstar` (opción equivalente, pero ausente por defecto y propia de Bash 4+); en zsh, `**` funciona en cuanto `EXTENDED_GLOB` (o incluso sin ella, `**` solo ya está activo por defecto en la mayoría de las configuraciones recientes) está activa, sin ajuste adicional.

## Negación: excluir un patrón

```bash
ls *.^txt
# todos los archivos, EXCEPTO los que terminan en .txt (Bash no tiene equivalente directo)
```

## Los calificadores de glob: filtrar por tipo o metadato

Entre paréntesis después de un patrón, un **calificador** filtra los resultados sin pasar por un comando separado como `find`:

```bash
ls *(.)          # solo los archivos regulares (ni carpetas, ni enlaces)
ls *(/)          # solo las carpetas
ls *(*)          # solo los archivos ejecutables
ls *(.om[1])     # el archivo regular modificado mas recientemente (ordenado por fecha, se toma el 1o)
ls *.log(.Lm-7)  # archivos .log con mas de 7 dias de modificacion
```

| Calificador | Filtra por... |
|---|---|
| `.` | Solo archivos regulares |
| `/` | Solo carpetas |
| `*` | Archivos ejecutables |
| `@` | Enlaces simbólicos |
| `Lm-N` / `Lm+N` | Modificado hace menos de / más de N días |
| `om[N]` | Ordena por fecha de modificación, toma el N-ésimo resultado |

> **Nota:** estos calificadores reemplazan, en muchos casos simples, un `find . -type f` o un `find . -mtime -7` (ver [Permisos y manipulación de archivos](/?c=shells&s=bash&p=permissions-et-fichiers) en Bash), directamente en el patrón del glob, sin lanzar un comando externo.

## Combinar globbing extendido y comillas

Como en Bash, rodear un patrón con comillas desactiva su interpretación (ver [Las variables](/?c=shells&s=bash&p=variables) en Bash para la lógica de comillas simples/dobles):

```bash
echo *(.)    # lista real de los archivos regulares
echo "*(.)"  # muestra literalmente *(.)
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El globbing básico funciona como en Bash; `EXTENDED_GLOB` desbloquea patrones propios de zsh (`**` recursivo, negación `^`, calificadores entre paréntesis). |
| **Herramientas utilizables** | `**/*.ext` (recursivo), `*.^txt` (negación), calificadores de glob (`.`, `/`, `*`, `Lm-N`). |
| **Trampas a evitar** | Usar estos patrones sin haber activado `EXTENDED_GLOB`: se tratan entonces como texto literal. |
| **Buenas prácticas** | Usar un calificador de glob (`*(.Lm-7)`) en lugar de un `find` externo para un filtro simple. |
