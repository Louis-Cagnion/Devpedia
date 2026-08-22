---
order: 5
---

# Cortafuegos: UFW y firewalld

Incluso con [SSH endurecido](/?c=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe) y un [control de acceso obligatorio](/?c=administration-systeme&p=selinux-vs-apparmor) activo, un servicio que escucha en un puerto sigue siendo alcanzable por cualquiera, en cualquier puerto abierto. Un **cortafuegos** (*firewall*) filtra el tráfico de red entrante (y a veces saliente) según reglas explícitas: por defecto, todo lo que no está explícitamente autorizado se rechaza.

## El principio: lista blanca en lugar de lista negra

La configuración más segura de un cortafuegos empieza por **rechazarlo todo**, y luego autoriza explícitamente solo lo realmente necesario (típicamente, un único puerto abierto: SSH):

```text
Trafico entrante
      |
      v
+-----------------+     puerto 22 (SSH) autorizado -----> aceptado
|   Cortafuegos    |
|  (deniega por     |     cualquier otro puerto ---------> rechazado
|   defecto)        |
+-----------------+
```

Es una aplicación directa del principio de mínimo privilegio (ya visto aplicado a los datos en [Seguridad de las API web](/?c=cybersecurite&p=securite-api-web)): cuanto más corta es la lista de puertos abiertos, menor es la superficie de ataque disponible.

## UFW (Debian): una interfaz simplificada

**UFW** (*Uncomplicated Firewall*) es la herramienta por defecto en Debian/Ubuntu; simplifica la configuración del cortafuegos del kernel de Linux sin tener que manipular directamente sus reglas de bajo nivel:

```bash
ufw default deny incoming   # rechaza todo el trafico entrante por defecto
ufw allow 2222/tcp          # autoriza unicamente el puerto SSH (aqui redefinido, vease el capitulo anterior)
ufw enable                  # activa el cortafuegos con estas reglas
ufw status                  # lista las reglas activas
```

## firewalld (Rocky/RHEL): un sistema de zonas

**firewalld** es la herramienta por defecto en Rocky Linux/RHEL; organiza sus reglas por **zonas**, cada una representando un nivel de confianza de red (ej.: `public`, `internal`, `trusted`), en lugar de una simple lista de reglas globales:

```bash
firewall-cmd --set-default-zone=public
firewall-cmd --zone=public --add-port=2222/tcp --permanent  # autoriza SSH en la zona "public"
firewall-cmd --reload                                        # aplica las reglas permanentes
firewall-cmd --list-all                                       # lista las reglas de la zona activa
```

## Comparar ambos

| | UFW | firewalld |
|---|---|---|
| Distribución por defecto | Debian, Ubuntu | Rocky Linux, RHEL |
| Modelo | Lista de reglas globales | Zonas, cada una con su propio conjunto de reglas |
| Aplicación inmediata | Sí, desde el propio comando | Requiere `--permanent` y luego `--reload` para persistir tras el reinicio |

> **Trampa:** abrir un puerto para probar una configuración, y luego olvidar cerrarlo una vez terminada la prueba: la lista de puertos abiertos debe seguir siendo el reflejo exacto de los servicios realmente necesarios, no un historial de todo lo que se ha probado.
>
> **Buena práctica:** partir de un rechazo total por defecto y abrir un único puerto (SSH) en un servidor que no aloja ningún otro servicio expuesto, conforme al principio de mínimo privilegio.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un cortafuegos filtra el tráfico de red; la configuración más segura rechaza todo por defecto y solo autoriza explícitamente los puertos realmente necesarios. UFW (Debian) usa una lista de reglas, firewalld (Rocky) usa zonas. |
| **Herramientas utilizables** | `ufw allow`/`ufw enable` (Debian); `firewall-cmd --add-port`/`--reload` (Rocky). |
| **Trampas a evitar** | Dejar abierto un puerto que solo estaba destinado a una prueba puntual. |
| **Buenas prácticas** | Rechazar todo por defecto y abrir solo lo estrictamente necesario (SSH únicamente, en un servidor sin otro servicio expuesto). |
