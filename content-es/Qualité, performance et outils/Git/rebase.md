---
order: 13
---

# El rebase

`git rebase` ofrece una alternativa a `git merge` (véase [Las ramas](/?c=git&p=branches)) para integrar cambios entre dos ramas: en lugar de crear un commit de fusión con dos padres, **repite** los commits de una rama por encima de otra, generando un historial lineal.

## Merge vs rebase, visualmente

```text
Antes:
main:     A -- B -- C
                \
feature:         D -- E

Despues de un merge:            Despues de un rebase de feature sobre main:
main:     A -- B -- C ----- F   main:     A -- B -- C
               \           /                          \
feature:        D -- E ---'                            D' -- E'  <-- feature (rebasada)
```

El rebase no "mueve" literalmente los commits `D` y `E`: crea **nuevos** commits (`D'`, `E'`) con el mismo contenido pero un padre diferente, de ahí que sus hashes sean distintos de los originales.

## Realizar un rebase

```bash
git checkout feature
git rebase main
```

Git repite uno por uno cada commit de `feature` (ausente en `main`) por encima del último commit de `main`. En caso de conflicto en un commit concreto (véase [Resolver un conflicto de fusión](/?c=git&p=resoudre-conflits)), el rebase se detiene para resolverlo:

```bash
# tras resolver los conflictos en los archivos en cuestion:
git add archivo_en_conflicto.txt
git rebase --continue

# o bien, para cancelar por completo el rebase en curso y volver al estado anterior:
git rebase --abort
```

## El rebase interactivo: reescribir el historial local

```bash
git rebase -i HEAD~3   # abre un editor para los ultimos 3 commits
```

```text
pick a1b2c3d Añade el formulario de contacto
pick e4f5g6h Corrige una errata
pick i7j8k9l Añade la validación de email
```

Cada línea se puede modificar antes de guardar:

| Acción | Efecto |
|---|---|
| `pick` | Mantener el commit tal cual |
| `reword` | Mantener el commit, pero modificar su mensaje |
| `squash` | Fusionar este commit con el anterior (mantiene ambos mensajes, a fusionar) |
| `fixup` | Como `squash`, pero descarta el mensaje de este commit |
| `drop` | Elimina completamente este commit |

Útil, por ejemplo, para limpiar un historial de trabajo ("Corrige una errata", "Ups", "De verdad corrige la errata esta vez") en un único commit limpio antes de compartirlo.

## La regla de oro: nunca rebasar un historial ya compartido

```bash
# a EVITAR si otras personas ya han recuperado estos commits:
git rebase main
git push --force
```

> **Nota:** cuando un force-push es realmente legítimo (rebasar y volver a enviar una rama que solo tú usas), `git push --force-with-lease` es más seguro que `--force`: primero verifica que nadie más haya enviado un commit a esa rama desde el último `fetch`, y rechaza la operación en ese caso en lugar de sobrescribir a ciegas un trabajo que no se vio pasar.

Dado que el rebase crea **nuevos** commits con hashes diferentes, subirlos sobrescribiendo el historial remoto (`--force`) desincroniza bruscamente a cualquiera que ya hubiera basado trabajo en los commits anteriores: sus ramas locales referenciarían commits que ya no existen del lado del servidor. El rebase es seguro con commits **estrictamente locales**, nunca compartidos aún.

Véase también [Las ramas](/?c=git&p=branches) (merge, la alternativa más segura para un historial ya compartido) y [Resolver un conflicto de fusión](/?c=git&p=resoudre-conflits).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `git rebase` repite los commits de una rama por encima de otra, generando un historial lineal, a costa de nuevos commits (hashes diferentes) en lugar de un commit de fusión. |
| **Herramientas utilizables** | `git rebase`, `git rebase -i` (reescritura interactiva: pick/reword/squash/fixup/drop), `git rebase --continue`/`--abort`. |
| **Trampas a evitar** | Rebasar un historial ya compartido: los hashes cambian, lo que desincroniza a cualquiera que ya hubiera basado trabajo en los commits anteriores. |
| **Buenas prácticas** | Rebasar solo commits estrictamente locales; si un push forzado es realmente necesario, preferir `--force-with-lease` a `--force`. |
