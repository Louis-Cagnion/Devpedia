---
order: 8
---

# Repositorios remotos

Un **«remote»** es una referencia a una copia del repositorio alojada en otro lugar (GitHub, GitLab, un servidor de la empresa...), que se utiliza para sincronizar el trabajo entre varias personas o varios equipos.

## Ver y añadir un dispositivo remoto

```bash
git remote -v                                  # Muestra una lista de los remotes configurados (a menudo solo «origin»).
git remote add origin https://exemple.com/projet.git
```

`origin` Es el nombre convencional que se le da al «remote» principal (no es obligatorio utilizar este nombre concreto, pero es la convención casi universal).

## `push` : enviar commits locales

```bash
git push origin main               # envía las confirmaciones de la rama local «main» al repositorio remoto «origin»
git push -u origin main             # -u: guarda este enlace, para poder escribir después simplemente «git push»
git push                             # una vez guardado el enlace
```

## `fetch` vs `pull`

```bash
git fetch origin    # Descarga los nuevos commits del repositorio remoto, SIN modificar la carpeta de trabajo
git pull origin main # equivalente a: git fetch + git merge (se fusiona inmediatamente)
```

> **Nota:** «`git fetch`» es, por sí sola, la operación más «segura» para comprobar qué ha cambiado en el servidor remoto (`git log origin/main`) antes de decidir cómo integrarlo; «`git pull`» realiza esta fusión automáticamente, lo que puede resultar sorprendente si surgen conflictos inesperados.

## Ramas de seguimiento (*tracking branches*)

Una rama local se puede vincular a una rama remota, lo que permite a Git saber dónde realizar el push o el pull sin tener que especificarlo cada vez:

```bash
git branch -vv                     # muestra qué rama remota sigue cada rama local
git push -u origin ma-branche       # Establece este enlace de seguimiento desde el primer «push».
```

## Clonar un control remoto ya configurado

```bash
git clone https://exemple.com/projet.git
```

`git clone` Configura automáticamente `origin` para que apunte a la dirección clonada; por eso, un simple `git pull` / `git push` funciona inmediatamente después de un clonado, sin necesidad de configuración manual.

## Eliminar un control remoto

```bash
git remote remove origin
```

Véase también el capítulo sobre la resolución de conflictos, que suele ser necesaria tras un «`pull`» cuando varias personas han modificado las mismas líneas.
