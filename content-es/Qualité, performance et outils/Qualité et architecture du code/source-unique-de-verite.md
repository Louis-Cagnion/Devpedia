---
order: 4
---

# Fuente única de verdad

Cuando una misma familia de información existe en dos lugares diferentes, las dos copias terminan (no si algún día, sino cuando) divergiendo. No es una cuestión de rigor: en cuanto una actualización toca una copia sin que su autor sepa que la otra existe, la incoherencia ya está ahí, silenciosamente.

## El caso más visible: varias estructuras paralelas

```python
FORMAT_LABELS = {
    "csv": "CSV",
    "json": "JSON",
    "xml": "XML",
}
FORMAT_EXPORTERS = {
    "csv": export_csv,
    "json": export_json,
    "xml": export_xml,
}
FORMAT_VALIDATORS = {
    "csv": validate_csv,
    "json": validate_json,
    "xml": validate_xml,
}
```

Tres diccionarios, mantenidos sincronizados manualmente por convención en lugar de por construcción: añadir un formato supone recordar actualizar los tres. Olvidar uno no siempre produce un error inmediato: a veces solo un comportamiento silenciosamente incompleto para ese formato, descubierto mucho más tarde.

La consolidación en una sola fuente resuelve el problema por construcción:

```python
FORMAT_REGISTRY = {
    "csv": {
        "label": "CSV",
        "exporter": export_csv,
        "validator": validate_csv,
    },
    "json": {
        "label": "JSON",
        "exporter": export_json,
        "validator": validate_json,
    },
    # ...
}
```

Añadir un formato ahora es **una sola** entrada que añadir, con todo lo que le concierne en el mismo lugar: imposible sincronizar solo la mitad.

## El caso menos visible: la duplicación entre archivos que no se referencian entre sí

La misma familia de información duplicada a través de varios archivos independientes es más difícil de detectar, porque nada en el código señala visualmente el vínculo entre ambos: un archivo de datos (`tiendas.csv`) que registra identificadores, y un informe generado por separado que, por su parte, descubrió que algunos de esos identificadores en realidad redirigen a otras entradas ya presentes. El archivo de datos no "sabe" lo que el informe descubrió: los dos divergen, hasta que una auditoría manual los compara y elimina las entradas redundantes.

Este caso no siempre se corrige fusionando estructuras como en el ejemplo anterior: a veces, la verdadera fuente única debe convertirse en un proceso (un script que regenera el archivo de datos a partir del informe, o al revés) en lugar de una simple estructura en memoria: lo esencial es que una de las dos representaciones derive explícitamente de la otra, en lugar de que ambas evolucionen en paralelo sin vínculo.

## El principio general

Antes de duplicar una información (una constante, una lista de identificadores, una configuración), la pregunta a hacerse: *si esta información cambia, ¿cuántos lugares hay que actualizar, y existe un mecanismo que garantice que se actualizarán todos?* Si la respuesta es "hay que acordarse", la duplicación es un riesgo, incluso si parece inofensiva en el momento en que se introduce.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una misma familia de información duplicada en dos lugares siempre termina divergiendo: no por falta de rigor, sino en cuanto una actualización toca una copia sin que su autor sepa que la otra existe. |
| **Herramientas utilizables** | Consolidar varias estructuras paralelas (sincronizadas por convención) en una sola estructura anidada (sincronizada por construcción). |
| **Trampas a evitar** | Duplicar una información entre varios archivos que nunca se referencian entre sí: el vínculo no es visible en ningún lugar del código. |
| **Buenas prácticas** | Preguntarse, antes de cualquier duplicación, cuántos lugares habría que actualizar si la información cambia, y si un mecanismo garantiza que se actualizarán todos. |
