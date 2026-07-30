---
order: 9
---

# Resolver un conflicto de fusión

Se produce un **conflicto** cuando Git no puede fusionar automáticamente dos versiones de un mismo archivo; normalmente, esto ocurre cuando las **mismas líneas** se han modificado de forma diferente en cada una de las versiones (durante un `merge`, un `rebase` o un `pull`).

## Lo que Git escribe en el archivo en conflicto

```
<<<<<<< HEAD
const TVA = 0.20;
=======
const TVA_TAUX = 0.20;
>>>>>>> feature
```

- Todo lo que se encuentre entre `<<<<<<< HEAD` y `=======` corresponde a **tu** versión (la rama en la que te encuentras).
- Todo lo que se encuentra entre `=======` y `>>>>>>> feature` corresponde a la versión de la otra rama (fusionada).
- Estos marcadores (`<<<<<<<`, `=======`, `>>>>>>>`) se insertan **directamente en el archivo**; el archivo ya no se compila ni se ejecuta tal cual mientras estén presentes.

## Resolver el conflicto

1. Abre el archivo y decide qué versión quieres conservar (o combina ambas manualmente).
2. Elimina por completo los marcadores `<<<<<<<`, `=======`, `>>>>>>>`; **nunca** deben quedar en el archivo final.
3. Marca el archivo como resuelto y, a continuación, continúa con la operación en curso:

```bash
git add fichier_en_conflit.js

git commit                # si el conflicto se debiera a una «fusión»
git rebase --continue     # si el conflicto se debiera a un «rebase»
```

## Ver qué archivos están en conflicto

```bash
git status
# muestra explícitamente la lista de archivos «both modified» (modificados en ambos lados)
```

## Cancelar la fusión o el rebase en curso

Si la solución resulta demasiado compleja o si se prefiere empezar desde cero:

```bash
git merge --abort     # Anula una fusión en curso y restaura el estado anterior al intento.
git rebase --abort    # Anula una rebase en curso
```

## Reducir el riesgo de conflictos

- Incorporar con frecuencia los cambios de los demás (`git pull` / `git fetch` regularmente) en lugar de dejar que una rama se desvíe durante mucho tiempo.
- Mantén las ramas de funcionalidades breves y específicas.
- Comunicarse con el equipo cuando varias personas trabajan en los mismos archivos al mismo tiempo.

Consulta también los capítulos sobre las ramas y el rebase, las dos operaciones que suelen provocar más conflictos.
