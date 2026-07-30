---
order: 2
---

# Los comandos esenciales

Este capítulo aborda el ciclo de trabajo más habitual en Git: inicializar un repositorio (o recuperar uno ya existente), realizar un seguimiento de los cambios y guardarlos en forma de commits.

## Crear o recuperar un repositorio

```bash
git init                              # Convierte la carpeta actual en un repositorio Git (vacío, sin historial)
git clone https://exemple.com/projet.git   # Recupera un repositorio existente, con todo su historial
```

## Ver el estado del proyecto

```bash
git status
```

Muestra qué archivos se han modificado, cuáles se encuentran en la zona de staging y cuáles no están controlados (véase el capítulo sobre conceptos básicos).

## Añadir cambios al entorno de pruebas

```bash
git add archivo.txt        # añade un archivo concreto
git add carpeta/            # añade una carpeta completa
git add .                   # Añade todo lo que ha cambiado en la carpeta actual y sus subcarpetas
git add -p                  # Modo interactivo: elegir con precisión qué bloques de líneas añadir
```

> **Nota:** «`git add .`» también añade los archivos no controlados; asegúrate de que «`.gitignore`» (véase el capítulo correspondiente) esté actualizado antes de ejecutar el comando, para no añadir accidentalmente archivos que nunca deberían entrar en el historial (secretos, dependencias, archivos generados...).

## Crear un commit

```bash
git commit -m "Corrige le calcul de la remise"
git commit -am "Message"   # Atajo: añade automáticamente los archivos que ya están bajo control de versiones Y que se han modificado, sin necesidad de ejecutar primero «git add».
```

> **Nota:** «`-a`» (en `-am`) solo añade los archivos que ya están bajo control de Git; un archivo completamente nuevo, que nunca se haya añadido antes, siempre debe pasar por un «`git add`» explícito al menos una vez.

Un buen mensaje de commit describe el **porqué** del cambio, no solo el qué (el diff ya muestra lo que ha cambiado), lo cual resulta útil para comprender el historial mucho tiempo después.

## Consultar el historial

```bash
git log                     # Historial completo, de más reciente a más antiguo
git log --oneline            # Una línea por commit, más legible para una revisión rápida.
git log --oneline --graph --all   # También muestra las ramas y sus puntos de divergencia/fusión.
git log -p archivo.txt        # Historial detallado (con diferencias) de un archivo concreto
```

## Ver las diferencias

```bash
git diff                     # diferencias que aún no se han añadido al entorno de staging
git diff --staged             # Cambios ya añadidos al entorno de pruebas, pero aún sin confirmar.
git diff commit1 commit2      # Diferencias entre dos commits concretos
```

## Ver los detalles de una confirmación

```bash
git show a3f9c1d   # Muestra el mensaje, el autor, la fecha y el diff completo de esta confirmación concreta.
```
