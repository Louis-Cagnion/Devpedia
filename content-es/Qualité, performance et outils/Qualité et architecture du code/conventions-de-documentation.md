---
order: 8
---

# Convenciones de documentación del código por lenguaje

Documentar una función (qué hace, sus parámetros, qué devuelve) es un principio universal, pero la **sintaxis exacta** para hacerlo no es la misma de un lenguaje a otro. Cada ecosistema tiene su propia convención, reconocida por sus propias herramientas: un IDE la usa para mostrar un tooltip al pasar el cursor sobre una llamada, un generador de documentación la transforma en un sitio consultable. Escribir una documentación que no sigue ninguna de estas convenciones (un simple párrafo libre, por ejemplo) priva al proyecto de estos dos beneficios, aunque el contenido en sí sea correcto.

## [Python](/?c=langages&s=python&p=python): Google style y NumPy style

Python no tiene una sintaxis impuesta por el propio lenguaje, pero dos convenciones dominan en la práctica, ambas reconocidas por los generadores de documentación ([Sphinx](https://www.sphinx-doc.org)):

```python
def convertir_devise(montant, taux):
    """Convierte un importe de una divisa a otra.

    Args:
        montant (float): El importe a convertir, en la divisa de origen.
        taux (float): El tipo de cambio (1 unidad de origen = taux unidades de destino).

    Returns:
        float: El importe convertido, en la divisa de destino.
    """
    return montant * taux
```

| | Google style | NumPy style |
|---|---|---|
| Secciones | `Args:`, `Returns:` (palabras clave simples) | `Parameters`/`Returns` bajo líneas de guiones `----------` |
| Densidad | Más compacta | Más extensa, cada parámetro en varias líneas |
| Contexto de uso típico | Proyectos de aplicación generalistas | Bibliotecas científicas (numpy, pandas, scikit-learn) |

## [JavaScript](/?c=langages&s=javascript&p=javascript) / TypeScript: JSDoc

[JSDoc](https://jsdoc.app) antecede la función con un comentario `/** ... */`, con etiquetas `@param`/`@returns`:

```javascript
/**
 * Convierte un importe de una divisa a otra.
 * @param {number} montant - El importe a convertir, en la divisa de origen.
 * @param {number} taux - El tipo de cambio (1 unidad de origen = taux unidades de destino).
 * @returns {number} El importe convertido, en la divisa de destino.
 */
function convertirDevise(montant, taux) {
    return montant * taux;
}
```

En TypeScript, los tipos ya declarados en la firma (`montant: number`) hacen que el tipo JSDoc `{number}` sea redundante: la mayoría de los proyectos TypeScript omiten entonces las anotaciones de tipo en el comentario, y mantienen `@param`/`@returns` únicamente para la descripción en lenguaje natural.

## Java: Javadoc

[Javadoc](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html) usa la misma sintaxis `/** ... */` que JSDoc, con sus propias etiquetas (`@param`, `@return`, `@throws`):

```java
/**
 * Convierte un importe de una divisa a otra.
 *
 * @param montant El importe a convertir, en la divisa de origen.
 * @param taux El tipo de cambio (1 unidad de origen = taux unidades de destino).
 * @return El importe convertido, en la divisa de destino.
 */
double convertirDevise(double montant, double taux) {
    return montant * taux;
}
```

La herramienta `javadoc`, incluida con el JDK, genera directamente un sitio [HTML](/?c=langages&s=html&p=html) consultable a partir de estos comentarios: así se produce la propia documentación oficial de la biblioteca estándar de Java.

## [C](/?c=langages&s=c&p=c) / [C++](/?c=langages&s=cpp&p=cpp): Doxygen

[Doxygen](https://www.doxygen.nl) retoma una sintaxis muy cercana a Javadoc, pero también cubre C, que no tiene un equivalente nativo:

```cpp
/**
 * @brief Convierte un importe de una divisa a otra.
 * @param montant El importe a convertir, en la divisa de origen.
 * @param taux El tipo de cambio (1 unidad de origen = taux unidades de destino).
 * @return El importe convertido, en la divisa de destino.
 */
double convertir_devise(double montant, double taux) {
    return montant * taux;
}
```

Doxygen también acepta la sintaxis `///` (tres barras) línea por línea como alternativa al bloque `/** */`, una diferencia puramente estilística sin efecto sobre lo que la herramienta extrae.

## Comparativa

| Lenguaje | Convención | Bloque de comentario | Etiquetas principales | Generador asociado |
|---|---|---|---|---|
| Python | Google / NumPy style | `""" ... """` | `Args:`, `Returns:` | Sphinx |
| JavaScript / TypeScript | JSDoc | `/** ... */` | `@param`, `@returns` | JSDoc, TypeDoc |
| Java | Javadoc | `/** ... */` | `@param`, `@return`, `@throws` | javadoc (JDK) |
| C / C++ | Doxygen | `/** ... */` o `///` | `@brief`, `@param`, `@return` | Doxygen |

> **Señal de alerta:** un formato de documentación personalizado (un párrafo libre, una estructura ad hoc) en lugar de la convención ya estándar para el lenguaje utilizado. Ninguna herramienta reconoce este formato: sin tooltip en el editor, sin sitio de documentación generado, aunque el contenido escrito sea correcto. Es mejor seguir la convención ya establecida para el ecosistema del lenguaje utilizado (ver la tabla anterior), y mantenerse coherente con ella en todo el proyecto en lugar de mezclar varios estilos según el archivo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Cada lenguaje tiene su propia convención de documentación reconocida por sus herramientas (Google/NumPy style en Python, JSDoc en JavaScript/TypeScript, Javadoc en Java, Doxygen en C/C++), con etiquetas como `@param`/`@returns` propias de cada sintaxis. |
| **Herramientas utilizables** | Sphinx (Python), JSDoc/TypeDoc (JS/TS), javadoc (Java), Doxygen (C/C++) para generar una documentación consultable a partir de estos comentarios. |
| **Trampas a evitar** | Inventar un formato de documentación personalizado en lugar de seguir la convención estándar del lenguaje, lo que priva al proyecto de las herramientas asociadas. |
| **Buenas prácticas** | Seguir la convención ya establecida para el ecosistema del lenguaje utilizado, y mantenerse coherente con ella en todo el proyecto. |
