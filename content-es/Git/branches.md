---
order: 4
---

# Las ramas

Una **rama** no es más que un puntero móvil a una confirmación; permite desarrollar una versión del código (una nueva funcionalidad, una corrección) sin alterar la rama principal, para luego fusionar ambas líneas de trabajo más adelante.

## Crear y cambiar de rama

```bash
git branch                     # Enumera las ramas existentes; la actual está marcada con un *
git branch nouvelle-fonctionnalite   # crea una nueva rama, sin cambiar a ella
git checkout nouvelle-fonctionnalite  # cambia a esta rama
git checkout -b nouvelle-fonctionnalite  # Atajo: crea y cambia con un solo comando

git switch nouvelle-fonctionnalite      # Equivalente moderno de «checkout» para cambiar de rama
git switch -c nouvelle-fonctionnalite    # equivalente moderno de «checkout -b»
```

> **Nota:** `git switch` (más reciente) y `git checkout` (antiguo, más versátil pero menos explícito) hacen aquí lo mismo; `checkout` también se utiliza para otros fines (restaurar un archivo, véase el capítulo sobre la anulación), lo que hace que su lectura resulte más ambigua.

## Lo que ocurre realmente al cambiar de rama

Cada rama es simplemente un puntero a una confirmación concreta. Al cambiar de rama, se desplaza `HEAD` hacia ese puntero, y Git actualiza el directorio de trabajo para que coincida exactamente con la instantánea de esa confirmación:

```
main:          A -- B -- C
                          \
feature:                   D -- E   <-- HEAD (si on est sur "feature")
```

## 

```bash
git checkout main
git merge feature
```

Hay dos casos posibles:

**Avance rápido**: si `main` no ha recibido ninguna confirmación desde la creación de `feature`, Git simplemente avanza el puntero `main` hasta la última confirmación de `feature`; no se crea ninguna nueva confirmación de fusión.

```
Avant :  main: A -- B          feature: A -- B -- C -- D
Après :  main: A -- B -- C -- D
```

**Merge commit**: si `main` ha evolucionado en paralelo, Git crea un commit especial con **dos padres**, que une los dos historiales:

```
main:     A -- B ------- E (merge commit)
                \        /
feature:         C -- D
```

## Eliminar una rama

```bash
git branch -d feature    # Elimina, solo si la rama ya se ha fusionado (seguridad)
git branch -D feature    # Obliga a su eliminación, aunque nunca se haya fusionado
```

> **Nota:** «`git branch -D`» en una rama que nunca se ha fusionado puede hacer que se pierda el acceso a confirmaciones que ya no existen en ningún otro sitio. Por lo general, se pueden seguir localizando durante un tiempo a través de `git reflog` (véase el capítulo sobre la anulación y el historial), pero es mejor comprobarlo con `git log feature` (o una fusión/`git branch -d`) antes de forzar la eliminación.

Véase también el capítulo sobre el rebase, una alternativa al merge para integrar cambios sin necesidad de un commit de fusión, y el dedicado a la resolución de conflictos, para el caso de que ambas ramas hayan modificado las mismas líneas.
