---
order: 10
---

# Zsh

Zsh (*Z shell*) es, como Bash, un shell compatible con [POSIX](/?c=shells&s=bash&p=scripts-et-shebang): la casi totalidad de lo visto en la sección Bash (variables, condiciones, bucles, funciones, redirecciones y tuberías, permisos y archivos, gestión de procesos, procesamiento de texto) funciona **de forma idéntica** en zsh, sintaxis incluida. Es además el shell por defecto en macOS desde 2019, y una opción habitual en Linux por su comodidad de uso interactivo.

> **Lo que se cubre aquí:** únicamente lo que realmente difiere de Bash o lo que no existe en absoluto en Bash: los archivos de inicio, el sistema de opciones (`setopt`), el globbing extendido, la finalización avanzada, la personalización del prompt, y el framework **Oh My Zsh**. Para todo lo demás (variables, condiciones, bucles, funciones, redirecciones, permisos, procesos, procesamiento de texto), los capítulos del sujeto Bash se aplican directamente.

## En qué difiere realmente zsh de Bash

Zsh añade por encima de la base POSIX (compartida con Bash) varias capas de comodidad orientadas al uso **interactivo** más que al scripting puro:

- una finalización por tabulación notablemente más rica (menús navegables, finalización contextual por comando);
- un globbing más potente, activable con `setopt extendedglob`;
- un sistema de personalización del prompt independiente del de Bash (`PROMPT` en lugar de `PS1`, con sus propios códigos de escape);
- un sistema de opciones con nombre (`setopt`/`unsetopt`) más legible que las opciones puntuales de Bash (`shopt`, `set -o`);
- un ecosistema de frameworks de configuración, del cual **Oh My Zsh** es el más extendido.

A continuación encontrarás los distintos capítulos:
