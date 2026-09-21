---
order: 3
---

# ConfigMaps y Secrets: sacar la configuración de la imagen

## El problema: una imagen no debería contener su configuración

Una [imagen Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) se supone que se mantiene idéntica entre entornos (desarrollo, preproducción, producción). Si la URL de la base de datos o la contraseña de un servicio externo estuvieran escritas fijas dentro, habría que reconstruir una imagen distinta para cada entorno, y un secreto acabaría versionado junto con el resto del código.

## ConfigMap: la configuración no sensible

Un **ConfigMap** almacena pares clave/valor de configuración (la URL de una API, un nivel de log, un nombre de entorno) fuera de la imagen, inyectados en el pod al arrancar como variables de entorno o archivos montados:

```text
ConfigMap (clave: valor)  -->  inyectado en el pod al arrancar
API_URL: https://api.ejemplo.com
LOG_LEVEL: info
```

Cambiar un valor del ConfigMap nunca exige reconstruir la imagen: solo el pod se reinicia con la nueva configuración.

## Secret: la misma idea, para los datos sensibles

Un **Secret** sigue el mismo principio que un ConfigMap, reservado para datos sensibles (una contraseña, una clave de API, un certificado). Kubernetes los almacena y transmite por separado del resto de la configuración, para permitir un control de acceso más estricto que en un ConfigMap ordinario.

> **Trampa:** un Secret básico de Kubernetes solo está codificado en Base64, no cifrado por defecto: no es una caja fuerte, solo un mecanismo separado de los ConfigMaps para aplicar permisos distintos. Un cifrado real en reposo o un gestor de secretos dedicado siguen siendo necesarios para datos realmente críticos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un ConfigMap externaliza la configuración no sensible de una imagen, un Secret hace lo mismo con los datos sensibles; ambos se inyectan en el pod al arrancar, sin exigir nunca reconstruir la imagen. |
| **Herramientas utilizables** | `kubectl get configmaps`/`kubectl get secrets` para listar la configuración externalizada de un cluster. |
| **Trampas a evitar** | Escribir una configuración o un secreto fijo en la imagen en lugar de en un ConfigMap/Secret. Tratar un Secret básico de Kubernetes como un almacenamiento cifrado. |
| **Buenas prácticas** | Externalizar sistemáticamente cualquier configuración que varíe entre entornos. Reservar los datos realmente críticos a un gestor de secretos dedicado en lugar de a un Secret básico de Kubernetes. |
