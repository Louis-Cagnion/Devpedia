---
order: 13
---

# XML

**XML** (*eXtensible Markup Language*) es, como [HTML](/?c=langages&s=html&p=html), un lenguaje de marcado: datos organizados en etiquetas anidadas, cada una con posibles atributos. A diferencia de HTML, cuyas etiquetas (`<p>`, `<div>`...) tienen un significado fijado de antemano por el navegador, XML no impone ninguna etiqueta concreta: cada formato basado en XML define sus propios nombres de etiquetas, según los datos que describe.

```xml
<anuncio>
    <referencia>REF-001</referencia>
    <vehiculo marca="Renault">
        <modelo>Clio</modelo>
    </vehiculo>
</anuncio>
```

| Término | Qué significa |
|---|---|
| Elemento | Una etiqueta de apertura/cierre y todo lo que contiene (`<referencia>REF-001</referencia>`) |
| Atributo | Un par clave="valor" dentro de una etiqueta de apertura (`marca="Renault"`) |
| Documento bien formado | Cada etiqueta abierta se cierra correctamente, en el orden correcto, sin solapamiento (`<a><b></a></b>` es inválido) |

> **Nota:** XML y [JSON](/?c=langages&s=php&p=http) responden a la misma necesidad (intercambiar datos estructurados entre sistemas), pero XML sigue siendo habitual en flujos más antiguos (catálogos de proveedores, exportaciones de negocio) implantados antes de la generalización de JSON.

## Leer un archivo XML: DOM vs streaming

Dos formas de leer un archivo XML se diferencian por el uso de memoria:

| Enfoque | Principio | Memoria usada | Caso de uso |
|---|---|---|---|
| **DOM** (*Document Object Model*) | Carga todo el archivo en un árbol navegable, en memoria | Proporcional al tamaño del archivo entero | Archivo pequeño, necesidad de ir y venir entre varias partes del documento |
| **Streaming** (ej. `XMLReader` en PHP) | Lee el archivo secuencialmente, un nodo a la vez, sin cargarlo nunca entero | Constante, sea cual sea el tamaño del archivo | Archivo grande (decenas de miles de entradas), procesado una vez, en orden |

```php
<?php
$lector = new XMLReader();
$lector->open('catalogo.xml');

while ($lector->read()) {
    if ($lector->nodeType === XMLReader::ELEMENT && $lector->localName === 'anuncio') {
        $nodo = $lector->expand();          // expande ESTE elemento en un mini-DOM local
        $doc  = new DOMDocument();
        $doc->appendChild($doc->importNode($nodo, true));
        // ... extraer los datos de $doc, y pasar al siguiente anuncio
    }
}
$lector->close();
?>
```

`expand()` combina ambos enfoques: el archivo entero se sigue leyendo en streaming (memoria constante), pero cada elemento individual se convierte en un pequeño árbol DOM clásico, más simple de consultar (`getElementsByTagName()`...) que un recorrido manual nodo a nodo.

> **Buena práctica:** streaming para un archivo grande procesado una sola vez en orden (una importación de catálogo, por ejemplo); DOM para un archivo pequeño o una necesidad de navegación libre entre sus partes (subir a un ancestro, comparar dos ramas lejanas).

## El fallo XXE (*XML External Entity*)

El formato XML permite declarar una **entidad externa**: un atajo que, una vez usado en el documento, se reemplaza por el contenido de un recurso externo (un archivo local, una URL) en el momento del análisis:

```xml
<?xml version="1.0"?>
<!DOCTYPE anuncio [
  <!ENTITY fuga SYSTEM "file:///etc/passwd">
]>
<anuncio>
    <referencia>&fuga;</referencia>
</anuncio>
```

Si un analizador XML resuelve esta entidad sin restricción, `&fuga;` se reemplaza por el contenido del archivo `/etc/passwd` (en un sistema Unix), que termina así accesible en los datos extraídos: es el fallo **XXE**. Cualquier servicio que acepte XML proporcionado por un tercero (una importación de archivo, una API) está expuesto, en cuanto el contenido XML no está garantizado al 100%.

> **Trampa:** creer que un simple control del contenido de texto ("el archivo parece un anuncio válido") basta para descartar una XXE. La declaración `<!DOCTYPE ...>` puede situarse en cualquier parte al principio del documento, sin cambiar en nada la apariencia de los datos útiles que siguen.

### Protegerse: desactivar la resolución de entidades externas

```php
<?php
libxml_set_external_entity_loader(fn () => null);

$lector = new XMLReader();
$lector->open('archivo_proporcionado_por_un_tercero.xml');
?>
```

`libxml_set_external_entity_loader()` reemplaza, para todo el proceso PHP, el mecanismo que va a buscar el contenido de una entidad externa por una función que nunca devuelve nada (`null`): toda entidad externa declarada en el documento se ignora, en lugar de resolverse.

> **Buena práctica:** llamar a esta función antes de leer cualquier documento XML cuyo origen no esté garantizado al 100% (proporcionado por un socio, subido por un usuario...), incluso si el formato esperado normalmente no prevé ninguna entidad externa: la protección no cuesta nada para un documento legítimo, que simplemente no declara ninguna.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | XML organiza datos en etiquetas anidadas con nombres libres y atributos. Leer un archivo XML se hace en DOM (todo en memoria, navegación libre) o en streaming (memoria constante, lectura secuencial); `expand()` combina ambos. Una entidad externa XML mal controlada permite leer un archivo arbitrario del servidor (fallo XXE). |
| **Herramientas utilizables** | `XMLReader` (streaming) y `DOMDocument` (árbol completo) en PHP, `expand()` para combinar ambos, `libxml_set_external_entity_loader()` para desactivar las entidades externas. |
| **Trampas a evitar** | Cargar un archivo XML muy grande enteramente en DOM (memoria proporcional al archivo). Creer que un control del contenido de texto basta para descartar una XXE. |
| **Buenas prácticas** | Streaming para un procesamiento secuencial de gran volumen, DOM para una necesidad de navegación libre. Desactivar sistemáticamente la resolución de entidades externas antes de leer un documento XML de origen no garantizado. |
