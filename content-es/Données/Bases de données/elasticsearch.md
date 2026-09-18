---
order: 10
---

# Elasticsearch: la base orientada a documentos para la búsqueda

Una base relacional (ver [Bases de datos](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) organiza los datos en tablas, filas y columnas, unidas por *joins*. **Elasticsearch** organiza los datos de otra forma: cada registro es un **documento** JSON completo, guardado en un **índice** (el equivalente de una tabla), y el motor está construido desde el inicio para la **búsqueda de texto completo** en lugar de los *joins*.

| | Base relacional (SQL) | Redis | Elasticsearch |
|---|---|---|---|
| Unidad de dato | Una fila, en una tabla de columnas fijas | Un valor por clave (ver [Redis](/?c=donnees&s=bases-de-donnees&p=redis)) | Un documento JSON, dentro de un índice |
| Punto fuerte | *Joins*, consistencia transaccional | Velocidad de acceso en RAM | Búsqueda de texto completo, tolerancia a errores |
| Consultas | [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) | Comandos por tipo de estructura | Consultas en JSON (*Query DSL*) |

## Un documento, un índice

```json
// Documento indexado bajo el índice "vehiculos"
{
  "marca": "Peugeot",
  "modelo": "308",
  "anio": 2022,
  "descripcion": "Sedán compacto, poco kilometraje, mantenimiento al día"
}
```

A diferencia de una tabla SQL, dos documentos del mismo índice no necesitan tener exactamente los mismos campos: Elasticsearch deduce el tipo de cada campo (texto, número, fecha...) en la primera inserción, y el índice que construye para ese campo depende de ese tipo deducido.

## Consultar con el Query DSL

Una consulta no es una cadena al estilo SQL, sino un objeto JSON enviado al servidor:

```json
// Busca "sedan" en la descripcion, limitado a anuncios de menos de 20000€
{
  "query": {
    "bool": {
      "must": [
        { "match": { "descripcion": "sedan" } }
      ],
      "filter": [
        { "range": { "precio": { "lte": 20000 } } }
      ]
    }
  },
  "from": 0,
  "size": 20
}
```

| Cláusula | Función |
|---|---|
| `match` | Búsqueda de texto completo, tolera variantes de palabras (acentos, plurales según el idioma configurado) |
| `filter` | Condición exacta (rango, igualdad), sin influir en el puntaje de relevancia |
| `from` / `size` | Paginación: `from` = cuántos resultados saltar, `size` = cuántos devolver |

## El *fuzzy matching*: tolerar errores de tipeo

Un `match` clásico puede activar la **tolerancia a errores de tipeo** (*fuzziness*): "peugot" igual encuentra "peugeot", dentro de una distancia de edición (número de letras a cambiar) fijada por el parámetro.

```json
{ "match": { "modelo": { "query": "peugot", "fuzziness": "AUTO" } } }
```

> **Trampa:** activar el fuzzy matching en un campo que se supone un valor exacto proveniente de una faceta (una lista desplegable "Marca", por ejemplo, donde el usuario solo puede elegir valores ya válidos). El fuzzy matching se vuelve demasiado permisivo ahí: puede hacer aparecer "Renault" para una búsqueda "Peugeot" si la distancia de edición cae bajo el umbral, un resultado absurdo para un campo de opciones cerradas.
>
> **Buena práctica:** reservar el fuzzy matching a los campos de texto libre realmente escritos por un humano (una descripción, una búsqueda en lenguaje natural); en un campo de valores cerrados (faceta, filtro), usar una coincidencia exacta (`term`), nunca `match` con fuzziness.

## Las agregaciones: contar y agrupar sin *joins*

Una **agregación** calcula una estadística sobre el conjunto de documentos que corresponden a una consulta, en la misma respuesta que los resultados:

```json
// Cuantos anuncios por marca, entre los resultados filtrados arriba
{
  "aggs": {
    "por_marca": {
      "terms": { "field": "marca.keyword" }
    }
  }
}
```

Es el equivalente de un `GROUP BY` SQL, pero calculado directamente sobre el índice de búsqueda en lugar de mediante un *join* entre tablas.

## Búsqueda híbrida: combinar vectores y filtros exactos

Un campo de Elasticsearch también puede almacenar un **embedding** (ver [RAG](/?c=ia&s=nlp-llm&p=rag)) con el tipo `dense_vector`: un array de números que representa el significado de un texto, comparado por similitud en lugar de por igualdad.

```json
// Mapping: declara un campo vectorial junto a los campos clasicos
{
  "mappings": {
    "properties": {
      "description": { "type": "text" },
      "concesionario_id": { "type": "keyword" },
      "embedding": { "type": "dense_vector", "dims": 768 }
    }
  }
}
```

La cláusula `knn` (*k-nearest neighbors*, los k vecinos más cercanos) busca los documentos cuyo `embedding` está más cerca de un vector dado -- la misma similitud coseno que un pipeline RAG (ver [el pipeline en cuatro etapas](/?c=ia&s=nlp-llm&p=rag)), pero calculada directamente por Elasticsearch en lugar de en el código de la aplicación.

```json
// Busca los 10 vehiculos cuya descripcion se parece mas a la pregunta,
// pero SOLO en el concesionario actual
{
  "knn": {
    "field": "embedding",
    "query_vector": [0.021, -0.13, 0.58],
    "k": 10,
    "num_candidates": 50,
    "filter": {
      "term": { "concesionario_id": "concesionario-42" }
    }
  }
}
```

| Parámetro | Rol |
|---|---|
| `field` | El campo `dense_vector` a comparar |
| `query_vector` | El embedding de la pregunta formulada (calculado por el mismo modelo usado al indexar) |
| `k` | Cuántos resultados devolver al final |
| `num_candidates` | Cuántos candidatos explorar antes de quedarse con los `k` mejores (compromiso velocidad/precisión: cuanto más grande, más precisa pero más lenta la búsqueda) |
| `filter` | Una condición exacta (como un `term`/`bool` clásico) aplicada **antes** de buscar los vecinos |

> **Trampa:** filtrar después (recuperar los 10 vecinos más cercanos y luego excluir los de otro concesionario en el código de la aplicación) puede devolver menos de 10 resultados, incluso ninguno, si todos los vecinos más cercanos pertenecen a otros concesionarios. El `filter` anidado en `knn` restringe el espacio de búsqueda antes de buscar los vecinos: la comparación solo recae entonces sobre los documentos ya filtrados.
>
> **Buena práctica:** pasar siempre una restricción exacta conocida de antemano (un id de concesionario, un rango de fechas) mediante el `filter` propio de `knn`, nunca como post-procesamiento en la aplicación.

`knn` también se combina con una búsqueda de texto completo clásica en la misma consulta, para mezclar relevancia semántica y relevancia textual:

```json
{
  "query": {
    "match": { "description": "sedan familiar" }
  },
  "knn": {
    "field": "embedding",
    "query_vector": [0.021, -0.13, 0.58],
    "k": 10,
    "num_candidates": 50
  }
}
```

Elasticsearch fusiona entonces los dos rankings (puntaje textual y puntaje vectorial) en un único puntaje final -- de ahí el nombre de **búsqueda híbrida**.

## Painless: personalizar el orden en el servidor

**Painless** es un pequeño lenguaje de script ejecutado del lado del servidor Elasticsearch, usado cuando el orden por defecto (relevancia textual, o un campo simple) no basta:

```json
// Ordena por un puntaje propio: nota x numero de resenas, en vez de la nota sola
{
  "sort": {
    "_script": {
      "type": "number",
      "script": { "source": "doc['nota'].value * doc['nb_resenas'].value" },
      "order": "desc"
    }
  }
}
```

## Importar en masa: la Bulk API

Insertar un documento a la vez (una solicitud de red por documento) se vuelve muy lento en una importación de varios miles de registros. La **Bulk API** agrupa numerosas operaciones (inserción, actualización, borrado) en una sola llamada de red:

```text
Un documento a la vez:      1000 documentos -> 1000 solicitudes de red
Bulk API (lotes de 500):    1000 documentos -> 2 solicitudes de red
```

> **Trampa:** seguir insertando documento por documento en una importación voluminosa "porque ya funciona así": el cuello de botella casi nunca es Elasticsearch en sí, sino el número de idas y vueltas de red (ver [Reducir las idas y vueltas](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)).
>
> **Buena práctica:** usar la Bulk API por lotes (algunos cientos a algunos miles de documentos por llamada según su tamaño), en vez de una solicitud por documento.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Elasticsearch guarda documentos JSON en índices, pensados para la búsqueda de texto completo en vez de los *joins*. Las consultas se escriben en JSON (Query DSL); las agregaciones calculan estadísticas sin *joins*; `knn` busca por similitud vectorial y se puede combinar con un filtro exacto o una búsqueda de texto completo (búsqueda híbrida); Painless permite un orden personalizado del lado del servidor. |
| **Herramientas utilizables** | `match` (texto completo, con fuzziness opcional), `filter`/`term` (valor exacto), `knn`/`dense_vector` (similitud vectorial), `aggs` (agregaciones), scripts Painless, Bulk API para importaciones masivas. |
| **Trampas a evitar** | Activar el fuzzy matching en un campo de valores cerrados (faceta); importar documento por documento en vez de por lotes; filtrar después una búsqueda `knn` en vez de usar su `filter` integrado. |
| **Buenas prácticas** | Reservar `match`/fuzziness al texto libre, `term` a las facetas; usar la Bulk API por lotes para toda importación voluminosa; pasar toda restricción exacta conocida de antemano mediante el `filter` de `knn`. |
