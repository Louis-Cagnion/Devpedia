---
order: 10
---

# El rebase

`git rebase` Ofrece una alternativa a «`git merge`» (véase el capítulo sobre las ramas) para integrar cambios entre dos ramas: en lugar de crear una confirmación de fusión con dos padres, **vuelve** **a** **aplicar** las confirmaciones de una rama sobre otra, generando un historial lineal.

## Merge frente a rebase, de forma visual

```
Avant :
main:     A -- B -- C
                \
feature:         D -- E

Après un merge :                Après un rebase de feature sur main :
main:     A -- B -- C ----- F   main:     A -- B -- C
               \           /                          \
feature:        D -- E ---'                            D' -- E'  <-- feature (rebasée)
```

El rebase no «mueve» literalmente los commits `D` y `E`: crea **nuevos** commits (`D'`, `E'`) con el mismo contenido pero con un padre diferente, de ahí que los hash sean distintos de los originales.

## Realizar un rebase

```bash
git checkout feature
git rebase main
```

Git vuelve a aplicar, uno por uno, cada commit de `feature` (que no aparece en `main`) sobre el último commit de `main`. En caso de conflicto en un commit concreto (véase el capítulo sobre resolución de conflictos), el rebase se detiene para resolverlo:

```bash
# tras haber resuelto los conflictos en los archivos en cuestión:
git add fichier_en_conflit.txt
git rebase --continue

# O bien, para cancelar por completo el rebase en curso y volver al estado anterior:
git rebase --abort
```

## El rebase interactivo: reescribir el historial local

```bash
git rebase -i HEAD~3   # abre un editor con las tres últimas confirmaciones
```

```
pick a1b2c3d Ajoute le formulaire de contact
pick e4f5g6h Corrige une typo
pick i7j8k9l Ajoute la validation email
```

Cada línea se puede modificar antes de guardar:

| Acción | Efecto |
|---|---|
| `pick` | Mantener el commit tal cual |
| `reword` | Conservar la confirmación, pero modificar su mensaje |
| `squash` | Fusionar esta confirmación con la anterior (se conservan los dos mensajes, pendientes de fusionar) |
| `fixup` | Igual que `squash`, pero muestra el mensaje de esta confirmación |
| `drop` | Elimina por completo esta confirmación |

Útil, por ejemplo, para limpiar un historial de trabajo («Corregir un error tipográfico», «Ups», «Esta vez sí que corrijo el error tipográfico») en una sola confirmación limpia antes de compartirlo.

## La regla de oro: nunca volver a basar un historial que ya se haya compartido

```bash
# A EVITAR si otras personas ya han recuperado estas confirmaciones:
git rebase main
git push --force
```

> **Nota:** cuando un «force-push» es realmente legítimo (rebasar y volver a enviar una rama que solo tú utilizas), `git push --force-with-lease` es más seguro que `--force`: primero comprueba que nadie más haya enviado un commit a esa rama desde el último `fetch`, y, en ese caso, rechaza la operación en lugar de sobrescribir a ciegas un trabajo que no se ha visto pasar.

Dado que el rebase crea **nuevas** confirmaciones con hash diferentes, subirlas sobrescribiendo el historial remoto (`--force`) desincroniza bruscamente a cualquiera que ya hubiera basado su trabajo en las confirmaciones anteriores, ya que sus ramas locales harían referencia a confirmaciones que ya no existen en el servidor. El rebase es seguro con commits **estrictamente locales**, que aún no se hayan compartido.

Véase también el capítulo sobre las ramas (merge, la alternativa más segura para un historial ya compartido) y el dedicado a la resolución de conflictos.
