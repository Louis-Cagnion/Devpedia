---
order: 3
---

# El archivo .gitignore

`.gitignore` enumera los archivos y carpetas que Git debe **ignorar**: nunca proponerlos para añadir, nunca seguirlos, ni siquiera con un `git add .`. Imprescindible para no contaminar el historial con archivos generados, dependencias o secretos.

## Sintaxis básica

```text
# Comentario
*.log              # ignora todos los archivos que terminan en .log, esten donde esten
node_modules/       # ignora esta carpeta entera, en la raiz o en cualquier otro lugar
/build              # el '/' como prefijo restringe a la raiz del repositorio unicamente
.env                # ignora este archivo preciso
!important.log      # excepcion: NO ignorar este archivo preciso, a pesar de la regla *.log de arriba
```

| Patrón | Significado |
|---|---|
| `*.ext` | Cualquier archivo con esta extensión, en cualquier nivel |
| `carpeta/` | Esta carpeta y todo su contenido |
| `/ruta` | Únicamente en la raíz del repositorio (no en una subcarpeta con el mismo nombre) |
| `!patrón` | Excepción a una regla anterior |

## Lo que normalmente hay que ignorar

- Las dependencias instaladas (`node_modules/`, `vendor/`), reconstruibles a partir de un archivo de dependencias (`package.json`, `composer.json`...).
- Los archivos de configuración que contienen secretos (`.env`, claves de API...).
- Los archivos generados por la compilación o el build (`*.o`, `dist/`, `build/`).
- Los archivos propios de un editor o un sistema operativo (`.DS_Store`, `.vscode/`, `*.swp`).

## `.gitignore` solo actúa sobre archivos **nunca seguidos**

```bash
git rm --cached archivo_ya_seguido.txt
```

> **Nota:** añadir un archivo a `.gitignore` no tiene **ningún efecto** si ya está siendo seguido por Git (ya commiteado al menos una vez): Git sigue rastreando sus modificaciones como antes. Primero hay que retirarlo explícitamente del seguimiento con `git rm --cached` (lo cual lo deja intacto en el disco, pero deja de seguirlo), antes de que la regla `.gitignore` surta efecto.

## Alcance del `.gitignore`

Un repositorio puede contener varios archivos `.gitignore`, cada uno aplicándose a la carpeta donde se encuentra y a sus subcarpetas, útil para reglas específicas de un subproyecto, además de las reglas globales en la raíz.

## Reglas personales, fuera del repositorio: `~/.gitignore_global`

Un `.gitignore` clásico (visto arriba) es un archivo del proyecto como cualquier otro: es él mismo seguido y commiteado, por lo tanto compartido con todos los colaboradores. Esto plantea un problema para archivos que solo dependen de **tu propia máquina** (los archivos temporales de un editor que solo tú usas, por ejemplo): añadirlos al `.gitignore` del proyecto impondría esta regla a colegas que quizás no usan el mismo editor.

La solución es un segundo archivo, ubicado fuera de cualquier repositorio, en tu carpeta personal:

```bash
# 1. Crear el archivo, donde quieras (ej. la carpeta personal)
echo ".idea/" > ~/.gitignore_global
echo "*.swp" >> ~/.gitignore_global

# 2. Decirle a Git, de una vez por todas, donde encontrarlo
git config --global core.excludesfile ~/.gitignore_global
```

`git config --global` (véase también [Los repositorios remotos](/?c=git&p=remotes) para otras configuraciones `--global`) escribe esta configuración en `~/.gitconfig`, un archivo de configuración propio de tu cuenta de usuario en esta máquina, fuera de cualquier repositorio Git: `core.excludesfile` le indica ahí a Git la ubicación de un `.gitignore` adicional a aplicar a **todos tus repositorios locales**, además del `.gitignore` propio de cada uno.

| | `.gitignore` (en el repositorio) | `~/.gitignore_global` |
|---|---|---|
| Seguido por Git, commiteado | Sí | No: nunca se coloca dentro de un repositorio |
| Visible para los demás colaboradores | Sí, en cuanto clonan el proyecto | No: la configuración vive en `~/.gitconfig`, propia de tu máquina |
| Alcance | Un solo proyecto (y sus subcarpetas) | Todos los repositorios Git de tu máquina |
| Contenido típico | Dependencias, secretos, archivos de build del proyecto | Archivos propios de tu editor/SO (`.idea/`, `.DS_Store`, `*.swp`) |

Es esta diferencia (archivo seguido y compartido vs configuración local a la máquina) la que explica por qué una regla puesta en `~/.gitignore_global` nunca aparece para los demás colaboradores, incluso después de un `git push`: nunca fue commiteada, ya que no vive en el repositorio.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `.gitignore` excluye archivos del seguimiento de Git: nunca se proponen para añadir, ni siquiera con `git add .`. Las reglas se aplican por carpeta, con `!patrón` para crear excepciones. |
| **Herramientas utilizables** | Patrones `*.ext`, `carpeta/`, `/ruta`, `!patrón`; `git rm --cached` para retirar del seguimiento un archivo ya seguido. |
| **Trampas a evitar** | Añadir un archivo a `.gitignore` no tiene **ningún efecto** si ya está siendo seguido (ya commiteado): primero hay que hacer `git rm --cached` antes de que la regla surta efecto. |
| **Buenas prácticas** | Excluir dependencias, secretos y archivos generados desde la creación del repositorio, antes del primer commit. |
