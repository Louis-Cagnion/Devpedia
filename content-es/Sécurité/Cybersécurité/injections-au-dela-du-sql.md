---
order: 10
---

# Las inyecciones más allá del SQL

[Las grandes familias de fallos](/?c=securite&s=cybersecurite&p=types-de-failles) presenta la inyección como *"un dato no fiable interpretado como una instrucción en lugar de un simple valor"*, con la inyección [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) como ejemplo de referencia (protección detallada en [Asegurar tus datos](/?c=langages&s=php&p=securite)). El mismo principio afecta a muchos otros sistemas en cuanto reciben un dato externo y lo tratan, por error, como parte de su propio código o de sus propias instrucciones.

## Visión de conjunto: la misma trampa, un sistema objetivo distinto

| Variante | Sistema afectado | Dato trampa típico | Defensa |
|---|---|---|---|
| Comando shell/OS | La terminal del servidor | `; rm -rf /` añadido a un nombre de archivo | Nunca construir un comando por concatenación de texto (detalle abajo) |
| LDAP | Un [directorio LDAP](https://ldap.com/basic-ldap-concepts/) (directorio de usuarios/máquinas de una empresa) | `*)(uid=*))(|(uid=*` en un campo de búsqueda, que amplía el filtro a todas las cuentas | Consulta parametrizada, como en SQL |
| XPath | Un motor que consulta un documento [XML](https://developer.mozilla.org/es/docs/Web/XML/XML_introduction) | `' or '1'='1` en un identificador, que hace coincidir todos los nodos del documento | Consulta parametrizada, escapado de caracteres especiales de XPath |
| Plantilla del lado del servidor (SSTI) | Un motor de renderizado como [Jinja2](https://jinja.palletsprojects.com/) o [Twig](https://twig.symfony.com/) | `{{7*7}}` en un campo mostrado tal cual en una plantilla | Detalle abajo |
| Cabecera HTTP (CRLF) | El navegador o un servidor intermedio (proxy, caché) | Salto de línea (`\r\n`) inyectado en un valor de cabecera de respuesta | Rechazar/escapar cualquier salto de línea en un valor de cabecera generado dinámicamente |
| Registro (*log forging*) | El propio archivo de log, y quien lo lea después | Salto de línea inyectado en un dato registrado, que fabrica una línea de log falsa | Escapar los saltos de línea antes de escribir un dato externo en un log |

## Inyección de comando shell/OS

Un programa que construye un comando de sistema ensamblando texto, y luego lo transmite tal cual a la terminal, deja que el usuario añada sus propias instrucciones en ese texto:

```python
import subprocess

# PELIGROSO: shell=True ejecuta la cadena tal cual, como si se tecleara en la terminal
nombre_archivo = "foto.jpg; rm -rf /"  # proporcionado por el usuario
subprocess.run(f"convert {nombre_archivo} salida.png", shell=True)
# El comando realmente ejecutado son DOS comandos separados por ";":
# convert foto.jpg salida.png   Y   rm -rf /

# SEGURO: cada argumento sigue siendo un dato separado, nunca interpretado como shell
subprocess.run(["convert", nombre_archivo, "salida.png"])
# El nombre_archivo entero (incluido el "; rm -rf /") se pasa como UN SOLO argumento a convert,
# que fallara limpiamente (archivo no encontrado) en lugar de ejecutar nada
```

El reflejo es el mismo que una consulta SQL preparada: nunca dejar que un dato externo forme parte del propio texto del comando, siempre pasarlo aparte, como un argumento distinto.

> **Ángulo menos evidente:** una herramienta de orquestación de workflows (n8n, Zapier, Airflow) suele ofrecer un nodo "Ejecutar un comando", donde el comando se construye en la CONFIGURACIÓN del workflow en lugar de en el código del proyecto. El mismo riesgo de concatenación se aplica de forma idéntica ahí, pero resulta fácil pasarlo por alto en una revisión de código clásica que solo examina el repositorio de la aplicación, nunca la configuración de la herramienta de orquestación.

## SSTI: cuando el motor de renderizado HTML se convierte en un intérprete

Un motor de plantillas transforma un texto con marcadores de posición (`{{ nombre }}`) en una página final, insertando en ellos los valores reales. Algunos de estos motores también aceptan expresiones de programación reales dentro de esos marcadores (cálculos, llamadas a función): si un dato de usuario llega directamente a la plantilla ANTES de su renderizado (en lugar de ser solo un valor insertado EN un marcador previsto), el motor lo ejecuta como código.

```text
Plantilla normal, valor insertado en un marcador previsto:
  "Hola {{ nombre_usuario }}"  +  nombre_usuario = "Louis"
  -> "Hola Louis"                                       (sin riesgo)

Plantilla vulnerable, dato de usuario insertado EN la estructura de la plantilla:
  plantilla = "Hola " + nombre_usuario                    (ya es una plantilla, no un valor)
  si nombre_usuario = "{{ 7*7 }}"
  -> el motor renderiza "Hola 49": la expresion fue EJECUTADA, no solo mostrada
```

Un atacante que confirma este comportamiento (`{{7*7}}` muestra `49`) puede luego intentar expresiones más peligrosas propias del motor usado (lectura de archivo, ejecución de comando de sistema), según lo que permita su lenguaje de expresiones.

## XXE: cuando un documento XML lee lo que no debería

Un documento XML puede declarar sus propios atajos de texto, llamados **entidades**, y una entidad puede apuntar a un recurso EXTERNO (un archivo local, una URL) en lugar de a un simple texto:

```xml
<?xml version="1.0"?>
<!DOCTYPE dato [
  <!ENTITY archivo_secreto SYSTEM "file:///etc/passwd">
]>
<dato>&archivo_secreto;</dato>
```

Si el analizador XML resuelve esta entidad (va realmente a leer `/etc/passwd`) antes de insertar el resultado en el documento procesado, el contenido del archivo termina expuesto en la respuesta de la aplicación, aunque nada en este documento parezca un "dato" en el sentido habitual: es una instrucción escondida en la propia sintaxis del formato.

| | |
|---|---|
| **Defensa** | Desactivar la resolución de entidades externas en la configuración del analizador XML utilizado (la mayoría de las bibliotecas modernas lo hacen por defecto, pero no todas según la versión) |

## Deserialización insegura: reconstruir un objeto a partir de datos no fiables

**Serializar** un objeto es convertirlo en texto/binario para almacenarlo o enviarlo; **deserializar** es la operación inversa: reconstruir el objeto a partir de ese texto. Algunos formatos de serialización (el módulo [`pickle`](https://docs.python.org/3/library/pickle.html) de Python, `unserialize()` en PHP, o una carga YAML sin restricciones) permiten codificar mucho más que un simple valor: hasta instrucciones a ejecutar en la reconstrucción.

```python
import pickle

# PELIGROSO: pickle.loads() puede ejecutar codigo arbitrario contenido en el dato,
# si este proviene de una fuente no fiable (subida, parametro, mensaje recibido)
objeto = pickle.loads(dato_recibido_del_exterior)

# SEGURO: un formato de serializacion que solo representa VALORES (nunca codigo)
import json
objeto = json.loads(dato_recibido_del_exterior)
```

| | |
|---|---|
| **Defensa** | Nunca deserializar un dato de origen externo con un formato que pueda codificar código (`pickle`, `unserialize` de PHP, YAML con un cargador sin restricciones); preferir un formato que solo represente valores, como JSON |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El principio de la inyección SQL se repite de forma idéntica en cuanto un sistema externo (shell, directorio LDAP, documento XML, motor de plantillas, formato de serialización) recibe un dato y lo trata por error como una instrucción en lugar de un simple valor. |
| **Herramientas utilizables** | `subprocess.run([...])` (lista de argumentos) en lugar de `shell=True`; consultas parametrizadas para LDAP/XPath; `json` en lugar de `pickle`/`unserialize` para intercambiar datos. |
| **Trampas a evitar** | Construir un comando/consulta por concatenación de texto; dejar que un dato de usuario llegue al texto de una plantilla antes de su renderizado; deserializar un dato externo con un formato capaz de codificar código; dejar que un analizador XML resuelva entidades externas. |
| **Buenas prácticas** | Separar siempre estructura (código/consulta/comando) y dato, sea cual sea el sistema afectado; desactivar la resolución de entidades externas XML; elegir un formato de serialización que solo represente valores para cualquier dato no fiable. |
