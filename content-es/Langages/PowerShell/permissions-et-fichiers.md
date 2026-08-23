---
order: 11
---

# Permisos y manipulación de archivos

Windows no usa el modelo de permisos de Unix (propietario/grupo/otros, `rwx`) visto en el capítulo equivalente de [Bash](/?c=shells&s=bash&p=bash): se basa en **listas de control de acceso** (ACL, *Access Control List*), más finas pero más verbosas. Este capítulo cubre este sistema así como los comandos básicos para manipular archivos y carpetas.

## Leer los permisos con `Get-Acl`

```powershell
Get-Acl archivo.txt | Format-List
```

Contrariamente a los 10 caracteres compactos de `ls -l` (`-rw-r--r--`), una ACL de Windows lista explícitamente cada usuario o grupo y los derechos que se le otorgan:

```text
Owner   : DESKTOP\usuario
Access  : DESKTOP\usuario Allow  FullControl
          BUILTIN\Users    Allow  ReadAndExecute
```

Cada línea de acceso asocia una **identidad** (usuario o grupo) con un **derecho** (`FullControl`, `Modify`, `ReadAndExecute`...); puede haber un número arbitrario de ellas, a diferencia de las tres categorías fijas de Unix (propietario/grupo/otros).

## `Set-Acl`: modificar los permisos

```powershell
$acl = Get-Acl archivo.txt
$regla = New-Object System.Security.AccessControl.FileSystemAccessRule("DESKTOP\juan", "ReadAndExecute", "Allow")
$acl.SetAccessRule($regla)
Set-Acl archivo.txt $acl
```

> **Nota:** contrariamente a `chmod 755` (un solo comando, un solo número), modificar una ACL de Windows requiere recuperar la ACL existente, construir una regla, y luego reaplicarla, más verboso pero permitiendo otorgar derechos diferentes a un número arbitrario de usuarios sobre un mismo archivo, lo que el modelo Unix no permite de forma nativa.

## `icacls`: el equivalente en línea de comandos clásico

Más cercano en espíritu a `chmod`/`chown`, `icacls` sigue muy usado en la práctica por su concisión:

```powershell
icacls archivo.txt /grant "juan:(R,W)"  # otorga lectura+escritura al usuario juan
icacls archivo.txt /remove "juan"       # retira todos los derechos explícitos de juan
```

## Comandos básicos sobre archivos

```powershell
New-Item -ItemType Directory -Path carpeta       # crea una carpeta
New-Item -ItemType Directory -Path a\b\c -Force  # crea toda la jerarquía de una vez
New-Item -ItemType File -Path archivo.txt        # crea un archivo vacío
Copy-Item origen.txt destino.txt                 # copia un archivo
Copy-Item -Recurse carpeta_origen carpeta_destino # copia recursiva, necesaria para una carpeta
Move-Item viejo.txt nuevo.txt                    # mueve O renombra, como mv en Bash
Remove-Item archivo.txt                          # elimina un archivo (va a la papelera por defecto en el explorador, pero no aquí)
Remove-Item -Recurse carpeta                     # elimina una carpeta y todo su contenido
```

> **Nota:** como `rm -rf` en Bash, `Remove-Item -Recurse -Force` es irreversible en línea de comandos (a diferencia de una eliminación vía el explorador de Windows, que pasa por la papelera): un objetivo mal apuntado puede eliminar mucho más de lo previsto, sin confirmación ni recurso.

## `Get-ChildItem -Recurse`: buscar archivos (equivalente de `find`)

```powershell
Get-ChildItem -Path . -Filter "*.txt" -Recurse                                                       # todos los archivos .txt, recursivamente
Get-ChildItem -Path C:\logs -Recurse | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }  # modificados recientemente
Get-ChildItem -Recurse -Directory -Filter "node_modules"                                             # todas las carpetas llamadas "node_modules"
Get-ChildItem -Recurse -Filter "*.tmp" | Remove-Item                                                 # encuentra Y elimina en una sola cadena
```

Ver también [Procesamiento de texto y objetos](/?c=shells&s=powershell&p=traitement-de-texte) (`Select-String`, `-replace`, `ConvertFrom-Json`) para ir más lejos en la explotación del contenido de estos archivos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Windows usa ACL (listas de control de acceso) en lugar del modelo propietario/grupo/otros de Unix, más verboso pero permitiendo derechos diferentes para un número arbitrario de usuarios. |
| **Herramientas utilizables** | `Get-Acl`/`Set-Acl`, `icacls` (más conciso), `New-Item`/`Copy-Item`/`Move-Item`/`Remove-Item`. |
| **Trampas a evitar** | `Remove-Item -Recurse -Force` es irreversible en línea de comandos, a diferencia de una eliminación vía el explorador (papelera). |
| **Buenas prácticas** | Usar `icacls` para una modificación rápida y legible de ACL, `Get-Acl`/`Set-Acl` cuando se necesita un control fino por script. |
