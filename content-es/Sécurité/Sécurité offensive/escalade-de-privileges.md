---
order: 4
---

# La escalada de privilegios

La **escalada de privilegios** consiste, para un atacante ya presente en un sistema con un acceso limitado, en obtener derechos más elevados que los concedidos inicialmente (típicamente: pasar de una cuenta de usuario normal a `root` en Linux, o administrador en Windows). Es un paso casi sistemático tras una primera intrusión: un acceso inicial rara vez llega a través de una cuenta ya todopoderosa.

## Vertical u horizontal

| Tipo | Qué cambia |
|---|---|
| **Vertical** | Un acceso limitado se convierte en un acceso de nivel superior (usuario normal → root) |
| **Horizontal** | El acceso se mantiene en el mismo nivel de derechos, pero cambia de cuenta (cuenta de usuario A → cuenta de usuario B) |

Este mismo vocabulario se aplica en el lado web al [control de acceso deficiente](/?c=cybersecurite&p=types-de-failles): acceder al pedido de otro cliente (horizontal) es distinto de acceder al panel de administración desde una cuenta de cliente (vertical).

## Causas frecuentes

| Causa | Ejemplo |
|---|---|
| **Permisos de archivo demasiado amplios** | Un archivo de configuración que contiene una contraseña, legible por todos los usuarios del sistema |
| **Binario SUID mal configurado** | En Linux, un programa marcado como SUID (*Set User ID*) se ejecuta con los derechos de su propietario en lugar de los de quien lo lanza; si permite ejecutar un comando arbitrario (ej.: un editor de texto lanzable en SUID root), se convierte en un atajo hacia un acceso root |
| **Servicio vulnerable sin corregir** | Un servicio que ya se ejecuta con derechos elevados (ej.: un servidor del sistema) contiene un fallo (véase [Corrupción de memoria](/?c=securite&s=securite-offensive&p=corruption-memoire)) explotable para ejecutar código con sus propios derechos |
| **Tarea programada mal protegida** | Una tarea automática ejecutada periódicamente por `root`, que lanza un script modificable por un usuario sin privilegios |

```text
Acceso inicial (usuario normal, derechos limitados)
        |
        v
Busqueda de malas configuraciones, binarios SUID, servicios vulnerables...
        |
        v
Explotacion de una de las causas anteriores
        |
        v
Acceso con derechos mas elevados (ideal para el atacante: root/administrador)
```

## El vínculo con el control de acceso ya visto

Este capítulo mira el mismo problema que [RBAC y ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac) y [Autenticación vs autorización](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation), pero desde el punto de vista del atacante en lugar del diseño defensivo: esos dos capítulos explican cómo modelar correctamente los derechos de un sistema; la escalada de privilegios es lo que ocurre cuando ese modelo se aplica mal en la práctica (un binario SUID olvidado, un permiso de archivo demasiado permisivo) en lugar de estar mal diseñado sobre el papel.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La escalada de privilegios convierte un acceso limitado en un acceso más elevado (vertical) o en un acceso a otra cuenta del mismo nivel (horizontal), típicamente mediante un permiso demasiado amplio, un binario SUID mal configurado, un servicio vulnerable, o una tarea programada mal protegida. |
| **Herramientas utilizables** | Un script de auditoría automática de malas configuraciones conocidas (permisos, binarios SUID) en un sistema de laboratorio. |
| **Errores a evitar** | Considerar el acceso inicial como el final del ataque: suele ser más bien el punto de partida de la escalada. |
| **Buenas prácticas** | Aplicar el principio de mínimo privilegio (ya planteado en [Las grandes familias de fallos de seguridad](/?c=cybersecurite&p=types-de-failles)) a cada cuenta y cada binario, no solo a las cuentas de usuario en sí mismas. |
