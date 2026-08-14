---
order: 12
---

# Resolver un conflicto de fusión

Un **conflicto** ocurre cuando Git no puede fusionar automáticamente dos versiones de un mismo archivo, típicamente cuando las **mismas líneas** se modificaron de forma diferente en cada lado (durante un `merge`, un `rebase`, o un `pull`).

## Lo que Git escribe en el archivo en conflicto

```text
<<<<<<< HEAD
const IVA = 0.20;
=======
const TASA_IVA = 0.20;
>>>>>>> feature
```

- Todo lo que está entre `<<<<<<< HEAD` y `=======` corresponde a **tu** versión (la rama en la que estás).
- Todo lo que está entre `=======` y `>>>>>>> feature` corresponde a la versión de la **otra** rama (fusionada).
- Estos marcadores (`<<<<<<<`, `=======`, `>>>>>>>`) se insertan **directamente en el archivo**: el archivo ya no compila/ejecuta tal cual mientras estén presentes.

## Resolver el conflicto

1. Abrir el archivo, decidir qué versión conservar (o combinar ambas manualmente).
2. Eliminar por completo los marcadores `<<<<<<<`, `=======`, `>>>>>>>`: **nunca** deben quedar en el archivo final.
3. Marcar el archivo como resuelto, luego continuar la operación en curso:

```bash
git add archivo_en_conflicto.js

git commit             # si el conflicto venia de un "merge"
git rebase --continue  # si el conflicto venia de un "rebase"
```

## Ver qué archivos están en conflicto

```bash
git status
# muestra explicitamente la lista de archivos "both modified" (modificados en ambos lados)
```

## Abandonar la fusión/el rebase en curso

Si la resolución resulta demasiado compleja o se prefiere empezar de cero:

```bash
git merge --abort   # anula un merge en curso, restaura el estado anterior al intento
git rebase --abort  # anula un rebase en curso
```

## Reducir el riesgo de conflictos

- Integrar con frecuencia los cambios de los demás (`git pull`/`git fetch` regular) en lugar de dejar que una rama diverja mucho tiempo.
- Mantener ramas de funcionalidad cortas y específicas.
- Comunicarse con el equipo cuando varias personas trabajan en los mismos archivos en paralelo.

Véase también [Las ramas](/?c=git&p=branches) y [El rebase](/?c=git&p=rebase), las dos operaciones que más a menudo provocan conflictos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un conflicto aparece cuando Git no puede fusionar automáticamente dos versiones de las mismas líneas. Los marcadores `<<<<<<<`/`=======`/`>>>>>>>` deben retirarse manualmente antes de continuar. |
| **Herramientas utilizables** | `git status` (archivos en conflicto), `git add` + `git commit`/`git rebase --continue`, `git merge --abort`/`git rebase --abort`. |
| **Trampas a evitar** | Olvidar eliminar un marcador de conflicto: el archivo sigue siendo inválido (no compila/ejecuta) mientras esté presente. |
| **Buenas prácticas** | Integrar con frecuencia los cambios de los demás para limitar la divergencia; mantener ramas de funcionalidad cortas y específicas. |
