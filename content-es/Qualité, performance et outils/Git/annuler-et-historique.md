---
order: 5
---

# Deshacer cambios y navegar por el historial

Git ofrece varios comandos para retroceder, a distintos niveles: deshacer una modificación no commiteada, un commit ya realizado, o incluso recuperar un commit que parece haber desaparecido.

## Deshacer modificaciones no commiteadas

```bash
git checkout -- archivo.txt  # restaura un archivo a su ultimo estado commiteado, sobrescribe las modificaciones locales
git restore archivo.txt      # equivalente moderno del comando anterior

git restore --staged archivo.txt  # retira un archivo del staging, SIN tocar sus modificaciones en el directorio de trabajo
```

> **Nota:** `git checkout -- archivo.txt` y `git restore archivo.txt` son **irreversibles**: las modificaciones no commiteadas se pierden definitivamente, a diferencia de un commit, que siempre se puede recuperar (véase `git reflog` más abajo).

## `git reset`: retroceder la rama actual

```bash
git reset --soft HEAD~1   # anula el ultimo commit, pero mantiene todo en staging (listo para volver a commitear)
git reset --mixed HEAD~1  # anula el ultimo commit Y el staging, mantiene las modificaciones en el directorio de trabajo (por defecto)
git reset --hard HEAD~1   # anula el ultimo commit, el staging, Y las modificaciones mismas -> perdida definitiva
```

| Opción | Commit anulado | Staging | Directorio de trabajo |
|---|---|---|---|
| `--soft` | Sí | Conservado | Conservado |
| `--mixed` (por defecto) | Sí | Reiniciado | Conservado |
| `--hard` | Sí | Reiniciado | **Reiniciado (pérdida de datos)** |

> **Nota:** `git reset --hard` es uno de los comandos más destructivos de Git: sobrescribe silenciosamente cualquier modificación no commiteada, sin posibilidad de recuperación sencilla. Usarlo solo con certeza absoluta de lo que se está descartando.

## `git revert`: anular un commit ya compartido

A diferencia de `reset` (que reescribe el historial eliminando commits), `revert` crea un **nuevo** commit que aplica lo inverso de un commit anterior; el historial original permanece intacto, lo que lo hace seguro incluso en commits ya enviados y compartidos:

```bash
git revert a3f9c1d
```

## `git reflog`: recuperar un commit "perdido"

Incluso tras un `reset --hard` o una manipulación fallida, Git en realidad conserva un registro de todos los movimientos de `HEAD` durante un tiempo determinado:

```bash
git reflog
# a3f9c1d HEAD@{0}: reset: moving to HEAD~1
# e4f5g6h HEAD@{1}: commit: Corrige el calculo del descuento
```

```bash
git checkout e4f5g6h             # recupera el estado de un commit "perdido" encontrado via reflog
git branch recuperacion e4f5g6h  # o crea directamente una rama a partir de ese commit
```

> **Nota:** `git reflog` suele ser la solución de emergencia tras una manipulación de Git que salió mal: mientras un commit haya existido localmente en algún momento, generalmente sigue siendo recuperable durante varias semanas, incluso si ya no está referenciado por ninguna rama.

Véase también [Las ramas](/?c=git&p=branches) y [El rebase](/?c=git&p=rebase), cuyas manipulaciones son las más concernidas por este capítulo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `restore`/`checkout --` deshacen modificaciones no commiteadas (irreversible); `reset` retrocede la rama (`--soft`/`--mixed`/`--hard`); `revert` crea un commit inverso, seguro en un historial ya compartido; `reflog` recupera un commit "perdido". |
| **Herramientas utilizables** | `git restore`, `git reset --soft/--mixed/--hard`, `git revert`, `git reflog`. |
| **Trampas a evitar** | `git reset --hard` sobrescribe silenciosamente cualquier modificación no commiteada, sin recuperación sencilla. |
| **Buenas prácticas** | Preferir `revert` a `reset` en un historial ya compartido; verificar `git reflog` antes de dar un commit por definitivamente perdido. |
