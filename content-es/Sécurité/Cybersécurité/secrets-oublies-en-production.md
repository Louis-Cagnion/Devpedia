---
order: 5
---

# Secretos olvidados en producción

[Gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets) cubre dónde almacenar correctamente un secreto (variable de entorno, bóveda dedicada) y cómo inyectarlo en un pipeline CI/CD sin escribirlo directamente en el código. Este capítulo cubre dos formas en que un secreto bien gestionado al principio termina de todos modos expuesto: un archivo que quedó accesible públicamente, y un secreto presente en el historial de Git tras eliminar el archivo que lo contenía.

## Un archivo de configuración que quedó accesible en una URL adivinable

Un archivo `.env` (variables de entorno, a menudo secretos) o una copia de seguridad (`.bak`, `.sql`, un `.zip` de todo el sitio) depositada por error en la carpeta servida públicamente por el servidor web sigue siendo accesible para cualquiera que adivine o pruebe su dirección, exactamente como cualquier otra página del sitio:

```text
https://sitio.example/index.php    -> la pagina normal del sitio
https://sitio.example/.env          -> si el archivo esta en la carpeta publica: TODO EL CONTENIDO,
                                        secretos incluidos, se muestra tal cual en el navegador
https://sitio.example/backup.sql    -> un volcado de base de datos entero, si se olvida en el mismo lugar
```

Este riesgo nunca proviene de un fallo de la aplicación (no se explota ningún código): es un simple error de colocación de archivo, combinado con la ausencia de restricción del servidor web sobre este tipo de extensión.

| | |
|---|---|
| **Trampa** | Depositar un `.env`, una copia de seguridad, o cualquier archivo de trabajo (`.git/`, una exportación de base de datos) en la misma carpeta que los archivos realmente destinados a servirse al público, suponiendo que "no hay ningún enlace a este archivo así que nadie lo encontrará": un escaneo automatizado prueba rutas conocidas (`.env`, `.git/config`, `backup.zip`...) en millones de sitios, sin necesitar ningún enlace |
| **Buena práctica** | Almacenar cualquier archivo sensible FUERA de la carpeta servida públicamente por el servidor web (`public/` o equivalente); configurar el servidor para rechazar explícitamente cualquier petición hacia un `.env`/`.git`/archivo de respaldo, como defensa adicional aunque la colocación ya sea correcta |

## Un secreto que quedó en el historial de Git tras su eliminación

Eliminar un archivo que contiene un secreto (o reemplazar su valor en un commit posterior) no lo retira del historial: cada versión antigua de un archivo sigue siendo consultable en los commits anteriores, mientras el historial en sí no se reescriba.

```text
Commit 1: añade config.php con API_KEY="sk_live_abc123..."
Commit 2: elimina la linea API_KEY (o el archivo entero)

git log -p -- config.php   -> SIGUE mostrando el commit 1, clave en claro incluida
```

Cualquiera con acceso al repositorio (incluso después de que un repositorio privado se vuelva público por error, o un fork ya realizado antes de la eliminación) puede recuperar ese secreto consultando el historial, aunque el archivo actual ya no contenga rastro de él.

> **Trampa:** creer que un `git commit` de eliminación "borra" un secreto ya comiteado. El simple retiro del archivo actual no tiene ningún efecto sobre las versiones ya registradas en el historial.
>
> **Buena práctica:** en caso de un secreto comiteado por error, considerarlo definitivamente comprometido y REVOCARLO/regenerarlo de inmediato (nueva clave API, nueva contraseña): es la única protección fiable, ya que una reescritura del historial (`git filter-repo`, BFG Repo-Cleaner) no impide que una copia ya clonada/forkeada antes de la reescritura conserve el historial antiguo intacto.

## Una sola página que expone los secretos de TODAS las cuentas

Una variante más grave que una fuga ordinaria: una página de administración/configuración que muestra, en una sola vista, la lista completa de tokens de acceso de TODAS las cuentas/clientes de un sistema (en lugar de solo la de la persona conectada). Un único acceso no previsto a esa página (control de acceso ausente, enlace compartido por error) compromete entonces todo el alcance de golpe, no solo una cuenta.

> **Trampa:** agrupar los secretos de todos los inquilinos/cuentas en una misma pantalla por comodidad de administración ("es más práctico gestionar todo en el mismo lugar"), sin medir que eso convierte un control de acceso ausente EN ESA SOLA PÁGINA en un compromiso total en lugar de parcial.
>
> **Buena práctica:** nunca mostrar un secreto en claro una vez generado (solo en el momento de su creación, luego enmascarado o regenerable pero ya no consultable); si sigue siendo necesaria una vista de conjunto para la administración, mostrar en ella solo metadatos (fecha de creación, último uso), nunca el valor del secreto en sí.

## Secretos y pipeline CI/CD abierto a contribuciones externas

[Gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets) muestra cómo declarar correctamente un secreto de CI (espacio dedicado, inyectado como variable de entorno). El riesgo adicional aparece cuando ese pipeline puede activarse mediante una contribución externa no fiable (un *pull request* proveniente de una cuenta externa al proyecto):

```text
1. El pipeline de CI esta configurado para ejecutarse automaticamente en cada pull request,
   con los secretos del proyecto inyectados como de costumbre (despliegue, clave API...)
2. Un atacante abre un pull request desde su propio fork, modificando
   el script de build para que exfiltre las variables de entorno
   (ej.: enviandolas a un servidor externo que el controla)
3. Si el pipeline ejecuta este script CON los secretos del proyecto inyectados,
   el atacante recupera esos secretos sin haber tenido nunca acceso al repositorio en si
```

| | |
|---|---|
| **Trampa** | Inyectar los secretos del repositorio principal en la ejecución de CI activada por un pull request proveniente de un fork externo, tratando esa ejecución como si fuera tan fiable como un commit directo del equipo |
| **Buena práctica** | Configurar la plataforma de CI para NO exponer los secretos del repositorio principal a los pipelines activados por un pull request externo (opción ya ofrecida por la mayoría de las plataformas, ej. `pull_request_target` a evitar en GitHub Actions sin una revisión manual previa), o exigir una aprobación manual antes de ejecutar una PR externa |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un secreto correctamente almacenado al principio puede exponerse de todos modos: un archivo `.env`/copia de seguridad que quedó en la carpeta pública del servidor, un secreto aún legible en el historial de Git tras eliminar el archivo, una página de administración que agrupa los secretos de todas las cuentas en una sola vista, o un pipeline de CI que inyecta los secretos del proyecto en la ejecución de un pull request externo no fiable. |
| **Herramientas utilizables** | Configuración del servidor para bloquear el acceso a archivos sensibles; `git filter-repo`/BFG Repo-Cleaner para reescribir un historial (como complemento de la revocación, nunca en su lugar); opción de la plataforma de CI para restringir los secretos a las ejecuciones internas. |
| **Trampas a evitar** | Colocar un archivo sensible en la carpeta servida públicamente. Creer que un commit de eliminación retira un secreto del historial. Agrupar los secretos de todas las cuentas en una misma página de administración. Exponer los secretos del proyecto a una ejecución de CI activada por un pull request externo. |
| **Buenas prácticas** | Almacenar cualquier archivo sensible fuera de la carpeta pública, con un bloqueo del servidor como defensa adicional. Revocar de inmediato cualquier secreto comiteado por error, independientemente de una eventual reescritura del historial. Nunca volver a mostrar un secreto en claro después de su creación. Restringir los secretos de CI a las ejecuciones internas, nunca a los pull requests externos. |
