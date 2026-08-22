---
order: 8
---

# Los repositorios remotos (remotes)

Un **remote** es una referencia hacia una copia del repositorio alojada en otro lugar ([GitHub](/?c=git&p=github-et-plateformes), [GitLab](https://gitlab.com), un servidor de empresa...), usada para sincronizar el trabajo entre varias personas o varias máquinas.

## Ver y añadir un remote

```bash
git remote -v                                  # lista los remotes configurados (a menudo solo "origin")
git remote add origin https://ejemplo.com/proyecto.git
```

`origin` es el nombre convencional dado al remote principal (nada obliga a ese nombre preciso, pero es la convención casi universal).

## `push`: enviar commits locales

```bash
git push origin main     # envia los commits de la rama local "main" hacia el remote "origin"
git push -u origin main  # -u: memoriza este enlace, para poder luego escribir solo "git push"
git push                 # una vez memorizado el enlace
```

## Forzar un push tras una reescritura del historial

Tras un `rebase`, un `commit --amend`, o una reescritura del historial (véase [La arquitectura interna de Git](/?c=git&p=architecture-interne)), los commits locales ya no tienen los mismos hash que los ya enviados: un `push` normal es entonces rechazado (*non fast-forward*), pues el remote ya no encuentra sus antiguos commits como ancestros de los nuevos.

```bash
git push --force origin main             # sobrescribe el historial remoto sin condicion, peligroso si alguien mas empujo mientras tanto
git push --force-with-lease origin main  # sobrescribe solo si el remote sigue en el estado visto en el ultimo fetch
```

> **Nota:** `--force-with-lease` compara el estado real del remote con lo que la rama de seguimiento local (`origin/main`) conocía en el último `fetch`: si difieren (alguien más empujó mientras tanto, o esa rama de seguimiento fue modificada por una operación local), el push se rechaza (`stale info`) en lugar de sobrescribir un trabajo que no se vio. Preferir siempre `--force-with-lease` a `--force`, salvo certeza absoluta de estar solo en la rama.

## `fetch` vs `pull`

```bash
git fetch origin      # descarga los nuevos commits del remote, SIN tocar el directorio de trabajo
git pull origin main  # equivalente a: git fetch + git merge (fusiona inmediatamente)
```

> **Nota:** `git fetch` solo es la operación más "segura" para inspeccionar qué cambió del lado del remote (`git log origin/main`) antes de decidir cómo integrarlo; `git pull` hace esa fusión automáticamente, lo que puede sorprender si aparecen conflictos sin esperarlo.

## Ramas de seguimiento (*tracking branches*)

Una rama local puede vincularse a una rama remota, lo que permite a Git saber dónde empujar/traer sin especificarlo cada vez:

```bash
git branch -vv                  # muestra que rama remota sigue cada rama local
git push -u origin mi-rama      # establece este vinculo de seguimiento desde el primer push
```

## Clonar un remote ya configurado

```bash
git clone https://ejemplo.com/proyecto.git
```

`git clone` configura automáticamente `origin` para apuntar a la dirección clonada: por eso un simple `git pull`/`git push` funciona inmediatamente después de un clone, sin configuración manual.

## Guardar o transferir un repositorio sin servidor: `git bundle`

`git bundle` empaqueta todo o parte de un repositorio (commits, ramas, tags) en un único archivo binario, sin necesitar un servidor remoto:

```bash
git bundle create respaldo.bundle --all    # captura todas las refs (ramas, tags, HEAD) en un solo archivo
git bundle verify respaldo.bundle          # verifica que el bundle este completo y utilizable
git clone respaldo.bundle nueva-carpeta    # un bundle se clona como un remote clasico
```

> **Nota:** un bundle es una instantánea fija: no se actualiza solo. Es la herramienta natural para un respaldo puntual antes de una operación riesgosa (reescritura de historial, por ejemplo), o para transferir un repositorio a una máquina sin red (memoria USB).

## Quitar un remote

```bash
git remote remove origin
```

Véase también [GitHub y las plataformas de alojamiento Git](/?c=git&p=github-et-plateformes) para lo que una plataforma como GitHub añade sobre un simple remote ([pull requests](/?c=git&p=pull-requests-github), [issues](/?c=git&p=issues-et-projets-github)), y [Resolver un conflicto de fusión](/?c=git&p=resoudre-conflits), frecuentemente necesario tras un `pull` cuando varias personas modificaron las mismas líneas.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un remote referencia una copia del repositorio alojada en otro lugar. `push`/`pull`/`fetch` sincronizan el trabajo entre el repositorio local y ese remote. |
| **Herramientas utilizables** | `git remote`, `git push`/`pull`/`fetch`, `git bundle` (respaldo o transferencia sin servidor). |
| **Trampas a evitar** | `git push --force` puede sobrescribir el trabajo de otra persona sin avisar. |
| **Buenas prácticas** | Preferir `--force-with-lease` a `--force`; usar `fetch` para inspeccionar los cambios remotos antes de decidir cómo integrarlos, en lugar de un `pull` directo en caso de duda. |
