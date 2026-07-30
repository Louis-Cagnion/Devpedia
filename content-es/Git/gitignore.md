---
order: 3
---

# El archivo .gitignore

`.gitignore` Enumera los archivos y carpetas que Git debe **ignorar**: nunca sugerirlos para añadir, nunca rastrearlos, ni siquiera con un `git add .`. Imprescindible para no contaminar el historial con archivos generados, dependencias o datos confidenciales.

## Sintaxis básica

```
# Commentaire
*.log              # ignore tous les fichiers se terminant par .log, où qu'ils soient
node_modules/       # ignore ce dossier entier, à la racine ou ailleurs
/build              # le '/' en préfixe restreint à la racine du dépôt uniquement
.env                # ignore ce fichier précis
!important.log      # exception : NE PAS ignorer ce fichier précis, malgré la règle *.log au-dessus
```

| Motivo | Significado |
|---|---|
| `*.ext` | Cualquier archivo con esta extensión, en cualquier nivel |
| `carpeta/` | Este dossier y todo su contenido |
| `/ruta` | Únicamente en la raíz del repositorio (no en una subcarpeta con el mismo nombre) |
| `!motif` | Excepción a una regla anterior |

## Lo que normalmente hay que ignorar

- Las dependencias instaladas (`node_modules/`, `vendor/`), que se pueden recompilar a partir de un archivo de dependencias (`package.json`, `composer.json`...).
- Los archivos de configuración que contienen datos confidenciales (`.env`es, claves de API...).
- Los archivos generados por la compilación o el «build» (`*.o`, `dist/`, `build/`).
- Archivos específicos de un editor o un sistema operativo (`.DS_Store`, `.vscode/`, `*.swp`).

## `.gitignore` solo actúa sobre los archivos que **nunca se han controlado**

```bash
git rm --cached fichier_deja_suivi.txt
```

> **Nota:** añadir un archivo a `.gitignore` no tiene **ningún efecto** si ya está bajo control de Git (si ya se ha confirmado al menos una vez); Git seguirá controlando sus modificaciones como hasta ahora. Primero hay que eliminarlo explícitamente del seguimiento con «`git rm --cached`» (lo que lo deja intacto en el disco, pero deja de realizar un seguimiento del mismo), antes de que la regla «`.gitignore`» surta efecto.

## Ámbito de aplicación del «`.gitignore`»

Un repositorio puede contener varios archivos «`.gitignore`», cada uno de los cuales se aplica a la carpeta en la que se encuentra y a sus subcarpetas, lo cual resulta útil para establecer reglas específicas de un subproyecto, además de las reglas globales de la raíz.

Un archivo «`~/.gitignore_global`» (que se configura a través de `git config --global core.excludesfile ~/.gitignore_global`) también permite definir reglas personales (por ejemplo, archivos específicos de tu propio editor), sin imponerlas al resto de colaboradores de un proyecto compartido.
