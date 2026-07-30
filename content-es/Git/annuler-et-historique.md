---
order: 5
---

# Deshacer cambios y navegar por el historial

Git ofrece varios comandos para retroceder en el tiempo, a distintos niveles: deshacer un cambio no confirmado, una confirmación ya realizada o incluso recuperar una confirmación que parece haber desaparecido.

## Deshacer los cambios no confirmados

```bash
git checkout -- archivo.txt   # Restaura un archivo a su último estado confirmado y sobrescribe los cambios locales.
git restore archivo.txt        # Equivalente moderno del comando anterior

git restore --staged archivo.txt  # elimina un archivo del entorno de prueba, SIN alterar los cambios realizados en la carpeta de trabajo
```

> **Nota:** «`git checkout -- archivo.txt`» y «`git restore archivo.txt`» son **irreversibles**: los cambios no confirmados se pierden definitivamente, a diferencia de una confirmación, que siempre se puede recuperar (véase «`git reflog`» más abajo).

## `git reset` : retroceder la rama actual

```bash
git reset --soft HEAD~1    # Anula la última confirmación, pero mantiene todo en la zona de preparación (listo para volver a confirmar).
git reset --mixed HEAD~1   # Anula la última confirmación y el staging, y conserva los cambios en la carpeta de trabajo (por defecto).
git reset --hard HEAD~1    # Anula la última confirmación, el staging y los propios cambios -> pérdida definitiva
```

| Opción | Commit cancelado | Staging | Carpeta de trabajo |
|---|---|---|---|
| `--soft` | Sí | Conservada | Conservada |
| `--mixed` (por defecto) | Sí | Restablecido | Conservado |
| `--hard` | Sí | Reiniciado | **Reiniciado (pérdida de datos)** |

> **Nota:** «`git reset --hard`» es uno de los comandos más destructivos de Git: sobrescribe silenciosamente cualquier cambio no confirmado, sin posibilidad de recuperación sencilla. Úsalo solo si estás seguro de lo que vas a descartar.

## `git revert` : anular una confirmación ya compartida

A diferencia de `reset` (que reescribe el historial eliminando commits), `revert` crea un **nuevo** commit que aplica lo contrario de un commit anterior; el historial original permanece intacto, lo que lo hace seguro incluso en el caso de commits ya enviados y compartidos:

```bash
git revert a3f9c1d
```

## `git reflog` : recuperar un «commit» «perdido»

Incluso tras un «`reset --hard`» o una operación fallida, Git conserva, en realidad, un registro de todos los movimientos de `HEAD` durante un tiempo determinado:

```bash
git reflog
# a3f9c1d HEAD@{0}: reinicio: pasando a HEAD~1
# e4f5g6h HEAD@{1}: commit: Corrige el cálculo del descuento
```

```bash
git checkout e4f5g6h        # Recupera el estado de una confirmación «perdida» que se ha encontrado a través de reflog.
git branch recuperation e4f5g6h   # o crea directamente una rama a partir de esta confirmación
```

> **Nota:** «`git reflog`» suele ser la solución de emergencia tras una operación de Git que ha salido mal: siempre que un commit haya existido localmente en algún momento, por lo general se puede recuperar durante varias semanas, aunque ya no esté referenciado por ninguna rama.

Véanse también los capítulos sobre las ramas y sobre el rebase, cuyas operaciones son las más relevantes para este capítulo.
