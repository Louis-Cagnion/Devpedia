---
order: 6
---

# La variable

Un [programa](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) ejecuta instrucciones: la mayoría de ellas manipulan valores que hay que poder conservar en memoria de una línea a otra. Ese es el papel de la variable.

Una **variable** es una caja etiquetada que contiene un valor, consultable o modificable más tarde.

```text
nombre = "Juan" → crea una caja llamada "nombre", guarda ahí el valor "Juan"
edad = 25       → crea una caja llamada "edad", guarda ahí el valor 25
mostrar nombre  → va a leer la caja "nombre", muestra "Juan"
edad = 26       → reemplaza el contenido de la caja "edad" por 26: el valor cambia, la caja sigue siendo la misma
```

> **Analogía:** una taquilla etiquetada en un vestuario: se puede cambiar lo que contiene sin cambiar nunca la etiqueta pegada en ella.

> **Trampa:** confundir el nombre de la variable y su valor. `edad = 26` no renombra "edad": eso reemplaza lo que la caja contiene, la caja en sí (su nombre) nunca cambia.
>
> **Buena práctica:** elegir un nombre de variable que describa lo que contiene (`edad` en lugar de `x`): el código se relee después sin tener que adivinar qué hay dentro.

## Algunos tipos de valores comunes

Todo valor tiene un **tipo**, que determina qué se puede hacer con él (sumar dos números tiene sentido, sumar dos textos no: el tipo decide):

| Tipo | Qué almacena | Ejemplo | Caso de uso típico |
|---|---|---|---|
| Número | Una cantidad, entera o decimal | `25`, `19.99` | Contar, calcular un precio |
| Texto (*string*) | Una secuencia de caracteres | `"Juan"` | Un nombre, un mensaje mostrado |
| Booleano | Solo dos valores posibles: verdadero o falso | `verdadero`, `falso` | Una condición ("¿está el usuario conectado?") |

> **Profundizar:** un tipo como "número" tiene en realidad sus propios límites y sutilezas (un tamaño máximo, un redondeo posible en decimal); ver [Los enteros, los bits y los desbordamientos](/?c=representation-des-donnees&p=entiers-et-debordements) para lo que ocurre realmente en memoria detrás de un tipo.

> **Trampa:** mezclar los tipos en una misma operación, por ejemplo sumar un número y un texto (`5 + "25"`). El resultado depende enteramente del lenguaje: algunos lanzan un error, otros convierten silenciosamente uno de los dos, con un resultado a veces inesperado (concatenar en lugar de sumar).
>
> **Buena práctica:** convertir explícitamente un valor al tipo deseado antes de una operación que mezcla tipos, en lugar de contar con una conversión automática cuyo comportamiento exacto no está garantizado de un lenguaje a otro.

La sintaxis exacta para crear una variable cambia de un lenguaje a otro (el símbolo `=` no siempre basta, algunos lenguajes exigen precisar el tipo de antemano); cada capítulo de lenguaje de este sitio ([Python](/?c=langages-de-programmation&s=python&p=python), C, [PHP](/?c=langages-de-programmation&s=php&p=php)...) cubre su propia sintaxis en detalle.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una variable asocia un nombre a un valor, modificable más tarde sin cambiar el nombre. Cada valor tiene un **tipo** (número, texto, booleano...), que determina las operaciones posibles sobre él. |
| **Herramientas utilizables** | Ninguna herramienta específica: la creación de una variable es una instrucción del propio lenguaje, escrita directamente en el código. |
| **Trampas a evitar** | Confundir el nombre de la variable y su valor: `edad = 26` no renombra "edad", reemplaza lo que la caja contiene. |
| **Buenas prácticas** | Elegir un nombre de variable que describa lo que contiene (`edad` en lugar de `x`): el código se relee después sin tener que adivinar. |
