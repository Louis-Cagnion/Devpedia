---
order: 4
---

# Gestión de secretos

Un **secreto** es una información que otorga acceso si se conoce: contraseña, clave de API, token de autenticación, clave privada de cifrado, cadena de conexión a una base de datos. Un secreto comprometido equivale a entregar directamente a un atacante el acceso que protege, sin importar cuán sólido sea el resto del sistema.

## El error más frecuente: el secreto fijo en el código

```text
// Peligroso: el secreto esta escrito directamente en el codigo fuente
clave_api = "sk_live_51H8xJ2eZvKYlo2C..."

// Una vez que este codigo se sube a Git, este secreto queda expuesto:
// - a cualquiera con acceso al repositorio (incluso uno privado, si ese acceso se filtra algun dia)
// - de forma permanente en el historial, aunque la linea se elimine despues
//   (ver Deshacer cambios y navegar por el historial)
```

Una vez que un secreto ha sido subido, con solo quitarlo del archivo no basta: sigue siendo consultable en el historial de Git hasta que se reescriba (una operación pesada y arriesgada en un repositorio compartido, ver [Deshacer cambios y navegar por el historial](/?c=git&p=annuler-et-historique)), e incluso después de una reescritura, un clon que ya existiera en otro lugar puede haber conservado la versión comprometida. La única protección fiable una vez que un secreto queda expuesto es **revocarlo y reemplazarlo de inmediato**, nunca confiar en su eliminación del repositorio.

## Dónde almacenar un secreto: tres enfoques, del más simple al más robusto

| Enfoque | Principio | Caso de uso típico |
|---|---|---|
| **Variable de entorno** | El secreto lo proporciona el sistema operativo al programa al iniciarse, nunca se escribe en un archivo rastreado por Git | Desarrollo local, proyectos pequeños |
| **Archivo `.env` ignorado por Git** | Un archivo separado del código, listado en [`.gitignore`](/?c=git&p=gitignore), que define las variables de entorno del proyecto | Desarrollo local con varios secretos, equipo reducido |
| **Bóveda de secretos** (*secrets vault*) | Un servicio dedicado que almacena, cifra y distribuye los secretos bajo demanda, con trazabilidad de quién accede | Producción, equipos más grandes, cumplimiento normativo |

```bash
# Archivo .env (nunca subido, ver .gitignore)
DATABASE_URL=postgres://usuario:contrasena@localhost/mibase
API_KEY=sk_live_51H8xJ2eZvKYlo2C...
```

```text
// El codigo lee la variable de entorno, nunca un valor escrito de forma fija
clave_api = leerVariableDeEntorno("API_KEY")
```

## Las bóvedas de secretos (*vaults*)

Más allá de un simple archivo `.env`, una bóveda de secretos es un servicio dedicado (por ejemplo, [HashiCorp Vault](https://www.vaultproject.io) o un gestor de secretos integrado en un proveedor cloud como [AWS Secrets Manager](https://aws.amazon.com/secrets-manager)) que ofrece lo que un archivo `.env` no puede:

| Necesidad | Archivo `.env` | Bóveda de secretos |
|---|---|---|
| Almacenamiento cifrado en reposo | No (texto plano en el disco) | Sí |
| Quién consultó qué secreto, y cuándo | Sin rastro | Registrado (auditoría) |
| Rotación automática de secretos | Manual | A menudo automatizable |
| Acceso revocable individualmente | Difícil (todo el archivo se comparte) | Se puede retirar un acceso concreto sin afectar a los demás |

## La rotación de secretos

**Rotar** un secreto significa reemplazarlo periódicamente por un nuevo valor, incluso sin ningún compromiso conocido: esto reduce la ventana de tiempo durante la cual un secreto robado, pero aún no detectado, sigue siendo utilizable. Un secreto que nunca se renueva sigue siendo válido indefinidamente, incluso para un atacante que lo hubiera obtenido meses antes sin que nadie lo supiera.

## Secretos e integración continua

Un pipeline de [CI/CD](/?c=ci-cd&p=pipeline-cicd) también necesita secretos (desplegar en un servidor, publicar un paquete, llamar a una API de terceros), sin escribirlos nunca en el propio archivo de configuración del pipeline (rastreado por Git, y por tanto visible para cualquiera con acceso al repositorio): la plataforma CI ofrece en su lugar un espacio dedicado y cifrado donde declarar estos secretos una vez, para luego inyectarlos como variables de entorno durante la ejecución del pipeline.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un secreto (contraseña, clave de API, token) otorga acceso directo si se conoce. Nunca escribirlo de forma fija en el código; una vez subido, sigue expuesto en el historial incluso tras eliminarlo. |
| **Herramientas utilizables** | Variables de entorno, archivo `.env` [ignorado por Git](/?c=git&p=gitignore), bóveda de secretos (Vault, gestor de secretos cloud) para producción. |
| **Errores a evitar** | Fijar un secreto en el código; creer que eliminarlo del archivo basta para asegurarlo tras una exposición; no rotar nunca un secreto. |
| **Buenas prácticas** | Revocar y reemplazar de inmediato cualquier secreto expuesto; rotar los secretos periódicamente; usar el espacio de secretos dedicado de una plataforma CI en lugar del archivo de configuración del pipeline. |
