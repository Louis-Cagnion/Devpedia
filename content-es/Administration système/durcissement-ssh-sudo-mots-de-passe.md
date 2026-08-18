---
order: 4
---

# Endurecimiento de SSH, sudo y contraseñas

Un sistema instalado con su configuración por defecto sigue siendo vulnerable a ataques automatizados, que rastrean Internet probando puertos e identificadores estándar. **Endurecer** un sistema consiste en reducir esta superficie de ataque: este capítulo cubre tres puntos de entrada frecuentemente atacados.

## Endurecer el acceso remoto: SSH

[SSH](/?c=shells&s=bash&p=bash) (*Secure Shell*) es el protocolo estándar para administrar un servidor a distancia; su archivo de configuración, `/etc/ssh/sshd_config`, controla su comportamiento:

| Ajuste | Efecto | Por qué |
|---|---|---|
| `Port 2222` (en lugar de `22`) | Cambia el puerto de escucha por defecto | Reduce el ruido de los escaneos automatizados que apuntan al puerto 22 por defecto (no sustituye una seguridad real, pero filtra los intentos más básicos) |
| `PermitRootLogin no` | Prohíbe la conexión SSH directa con la cuenta `root` | Obliga a conectarse con una cuenta de usuario nominal, y luego elevar sus privilegios mediante `sudo` (véase más abajo): cada acción queda así trazada a una persona concreta |

> **Nota:** cambiar el puerto SSH no sustituye a las demás medidas (contraseña fuerte, `PermitRootLogin no`): un atacante dirigido siempre puede escanear todos los puertos. Es una reducción de ruido, no una protección por sí sola.

## Imponer una política de contraseñas (PAM / `login.defs`)

**PAM** (*Pluggable Authentication Modules*) es el sistema de Linux que gestiona la autenticación (contraseñas incluidas) de forma modular; `/etc/login.defs` y los módulos PAM asociados permiten imponer reglas:

| Regla | Dónde | Ejemplo de valor |
|---|---|---|
| Expiración de la contraseña | `login.defs` (`PASS_MAX_DAYS`) | 30 días |
| Plazo mínimo entre dos cambios | `login.defs` (`PASS_MIN_DAYS`) | 2 días (impide cambiarla dos veces seguidas para volver a la anterior) |
| Alerta antes de la expiración | `login.defs` (`PASS_WARN_AGE`) | 7 días antes |
| Complejidad mínima | Módulo PAM (`pam_pwquality`) | Mayúscula + minúscula + dígito, como máximo 3 caracteres idénticos consecutivos, distinta del nombre de usuario, al menos 7 caracteres distintos de la contraseña anterior |

## Endurecer `sudo`

`sudo` permite a un usuario autorizado ejecutar un comando con los privilegios de `root`, sin compartir la contraseña de `root` en sí. Su archivo de configuración (`/etc/sudoers`, que se edita con `visudo`) admite varios ajustes de endurecimiento:

```text
Defaults passwd_tries=3                          # 3 intentos de contrasena como maximo
Defaults badpass_message="Contrasena incorrecta, intento rechazado."
Defaults logfile="/var/log/sudo/sudo.log"        # registra cada comando sudo
Defaults log_input, log_output                    # registra tambien lo tecleado/mostrado
Defaults use_pty                                  # ejecuta el comando en un pseudo-terminal dedicado
Defaults secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```

| Ajuste | Función |
|---|---|
| `passwd_tries` | Limita el número de intentos antes de bloquear el comando |
| `badpass_message` | Personaliza el mensaje mostrado en caso de fallo |
| `logfile` / `log_input` / `log_output` | Registra íntegramente cada comando ejecutado mediante `sudo`, con lo que se ha tecleado y mostrado |
| `use_pty` | Impide ciertas técnicas para sortear el registro, forzando un pseudo-terminal real |
| `secure_path` | Restringe las carpetas donde `sudo` busca los comandos ejecutables, para impedir que una carpeta añadida al `PATH` personal del usuario (véase [Variables de entorno](/?c=shells&s=bash&p=variables-denvironnement)) haga ejecutar un programa malicioso en lugar del real |

> **Trampa:** registrar los comandos `sudo` (`logfile`) sin activar `use_pty`: algunos comandos interactivos pueden entonces escapar parcialmente a la captura de entradas/salidas.
>
> **Buena práctica:** combinar los tres ejes de este capítulo en lugar de solo uno aislado: un SSH endurecido pero una contraseña débil, o al revés, siempre deja una puerta abierta.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Endurecer un sistema combina tres ejes: SSH (puerto no estándar, `root` prohibido en directo), una política de contraseñas estricta (PAM/`login.defs`), y un `sudo` registrado y restringido. |
| **Herramientas utilizables** | `/etc/ssh/sshd_config`, `/etc/login.defs` + `pam_pwquality`, `visudo`/`/etc/sudoers`. |
| **Trampas a evitar** | Registrar `sudo` sin `use_pty`; endurecer un solo eje de los tres dejando los demás por defecto. |
| **Buenas prácticas** | Restringir `secure_path`, forzar una cuenta nominal antes de `sudo`, y combinar sistemáticamente los tres ejes del capítulo. |
