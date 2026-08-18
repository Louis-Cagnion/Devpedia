---
order: 3
---

# SELinux vs AppArmor

Los permisos Unix clásicos (véase [Permisos y manipulación de archivos](/?c=shells&s=bash&p=permissions-et-fichiers)) siguen un modelo **discrecional** (*DAC*, *Discretionary Access Control*): el propietario de un archivo decide él mismo quién accede a él. Un **control de acceso obligatorio** (*MAC*, *Mandatory Access Control*) añade una capa de reglas impuestas por el sistema, que ni siquiera el propietario de un archivo puede saltarse: útil para limitar los daños si un programa se ve comprometido, impidiéndole acceder a archivos fuera de su perímetro normal, incluso si se ejecuta con permisos Unix suficientes para hacerlo.

## Dos implementaciones, dos distribuciones

SELinux y AppArmor responden a la misma necesidad (el MAC) con enfoques diferentes; cada distribución integra uno por defecto, coherente con [la elección vista anteriormente](/?c=administration-systeme&p=virtualisation-et-choix-dos):

| | SELinux | AppArmor |
|---|---|---|
| Distribución por defecto | Rocky Linux (RHEL) | Debian, Ubuntu |
| Modelo | Basado en **etiquetas** (*labels*) puestas en cada archivo/proceso | Basado en **rutas de archivos** |
| Dónde están las reglas | Una política central, que asocia etiquetas autorizadas entre sí | Un perfil por programa, que lista las rutas y permisos autorizados |
| Curva de aprendizaje | Más pronunciada, pero más precisa | Más simple de leer y escribir |

## SELinux: un sistema de etiquetas

Cada archivo y cada proceso recibe una **etiqueta** (*label*, ej.: `httpd_sys_content_t` para los archivos servidos por un servidor web). La política de SELinux define qué etiquetas tienen derecho a interactuar con cuáles otras: un proceso etiquetado `httpd_t` puede leer archivos etiquetados `httpd_sys_content_t`, pero se le niega el acceso a archivos con otra etiqueta, incluso si los permisos Unix clásicos lo permitirían.

```bash
getenforce          # muestra el modo actual
setenforce 1         # activa el modo "enforcing" (bloquea las violaciones)
```

| Modo | Efecto |
|---|---|
| `Enforcing` | Bloquea y registra cualquier violación de la política |
| `Permissive` | Registra las violaciones sin bloquearlas (útil para probar una política) |
| `Disabled` | SELinux totalmente desactivado |

## AppArmor: perfiles por ruta

AppArmor asocia directamente un **perfil** a cada programa, listando las rutas de archivos a las que puede acceder (y con qué permisos), en lugar de pasar por un sistema de etiquetas separado:

```text
/usr/sbin/nginx {
    /var/www/html/** r,      # lectura unicamente de los archivos del sitio
    /var/log/nginx/*.log w,  # escritura en sus propios logs
}
```

| Modo | Efecto |
|---|---|
| `enforce` | Bloquea y registra cualquier violación del perfil |
| `complain` | Registra las violaciones sin bloquearlas |

> **Nota:** en ambos sistemas, un modo "solo registro" (`permissive`/`complain`) sirve para validar una nueva política o un nuevo perfil antes de activarlo realmente, observando en los registros del sistema qué se habría bloqueado.

> **Trampa:** desactivar sin más SELinux o AppArmor para "hacer desaparecer" un error de acceso sin entender por qué ocurre: eso elimina toda la protección MAC en lugar de corregir la etiqueta o el perfil realmente responsable.
>
> **Buena práctica:** usar el modo solo registro (`Permissive`/`complain`) para identificar con precisión la regla que falta, añadirla a la política/al perfil, y luego volver al modo estricto (`Enforcing`/`enforce`).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El control de acceso obligatorio (MAC) añade reglas del sistema impuestas, por encima de los permisos Unix clásicos. SELinux (Rocky) etiqueta archivos y procesos; AppArmor (Debian) define perfiles por ruta. |
| **Herramientas utilizables** | `getenforce`/`setenforce` para SELinux; los perfiles en `/etc/apparmor.d/` para AppArmor. |
| **Trampas a evitar** | Desactivar por completo la protección MAC para sortear un error de acceso mal comprendido. |
| **Buenas prácticas** | Diagnosticar en modo solo registro (`Permissive`/`complain`) antes de corregir y volver luego al modo estricto. |
