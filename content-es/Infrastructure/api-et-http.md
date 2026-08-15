---
order: 1
---

# Los intercambios de datos: API y HTTP

Dos programas que corren en máquinas diferentes (un teléfono y un servidor remoto, por ejemplo) no comparten ni memoria ni archivos: para intercambiar una información, deben enviar mensajes por una red, según reglas comunes que ambos entiendan. **HTTP** (*HyperText Transfer Protocol*) es el conjunto de reglas más usado para estos intercambios.

> **Analogía:** pedir en un restaurante. El cliente (la sala) envía un pedido preciso a la cocina; la cocina responde con un plato, o con un mensaje si el pedido no puede atenderse ("sin stock"). Ninguna de las dos partes necesita saber cómo funciona la otra por dentro, solo cómo formular el pedido y leer la respuesta.

## Cliente y servidor: quién pide, quién responde

```text
Cliente (navegador, aplicación, script...)          Servidor (máquina remota)

        ------------- peticion ------------->
        <------------ respuesta -------------
```

El **cliente** es quien inicia el intercambio (una petición); el **servidor** es quien la recibe y la responde. Un mismo programa puede ser cliente en un intercambio y servidor en otro.

## Una petición: un método, una dirección, a veces datos

Cada petición HTTP precisa un **método** (lo que se quiere hacer) y una dirección (el recurso concernido):

| Método | Papel | Ejemplo |
|---|---|---|
| `GET` | Recuperar una información, sin modificarla | Cargar una página web, leer la lista de productos de una tienda |
| `POST` | Enviar un nuevo dato, generalmente para crearlo | Enviar un formulario, crear una cuenta de usuario |
| `PUT` | Reemplazar un dato existente | Actualizar la información de un perfil |
| `DELETE` | Eliminar un dato | Eliminar un mensaje |

> **Trampa:** usar `GET` para una acción que modifica un dato (por ejemplo, eliminar un elemento vía una simple dirección clicable). Se supone que un `GET` puede repetirse sin consecuencia (recargar una página no debería cambiar nada); numerosas herramientas (aspiradoras de sitios, vistas previas de enlaces) disparan `GET` automáticamente, sin intención del usuario.
>
> **Buena práctica:** reservar `GET` solo para la lectura, y usar `POST`/`PUT`/`DELETE` para toda acción que realmente modifique un dato.

## La respuesta: un código de estado, a veces datos

El servidor siempre responde con un **código de estado** (un número que indica si la petición tuvo éxito, y si no, por qué):

| Código | Categoría | Ejemplo |
|---|---|---|
| `200` | Éxito | La petición se procesó correctamente |
| `301` / `302` | Redirección | El recurso pedido se encuentra en otra dirección |
| `404` | Error del lado del cliente | El recurso pedido no existe |
| `500` | Error del lado del servidor | El servidor encontró un problema interno al procesar la petición |

> **Trampa:** ignorar el código de estado y suponer que una petición tuvo éxito simplemente porque llegó una respuesta. Un servidor en error (`500`) de todos modos devuelve una respuesta, a menudo con un contenido que se parece engañosamente a una respuesta normal si no se verifica el código.
>
> **Buena práctica:** verificar siempre el código de estado de una respuesta antes de usar su contenido, y prever explícitamente un tratamiento para los casos de error en lugar de programar solo el camino de éxito.

## Una API: un servidor pensado para un programa, no para un humano

Una **API** (*Application Programming Interface*) designa, en este contexto, un servidor que responde con datos estructurados destinados a ser leídos por un programa, en lugar de con una página web destinada a mostrarse en un navegador (ver el formato más común para estos datos, [JSON](/?c=infrastructure&p=json)):

```text
Peticion:  GET https://api.ejemplo.com/tiempo?ciudad=Lyon

Respuesta (estado 200):
{
  "ciudad": "Lyon",
  "temperatura": 18,
  "condiciones": "nublado"
}
```

Un programa puede entonces leer directamente `temperatura` o `condiciones`, sin tener que extraer esta información de una página web diseñada para la visualización.

> **Trampa:** confundir "el servidor no responde" (tiempo agotado, red cortada) y "el servidor responde con un error" (código `4xx`/`5xx`); ambos requieren un tratamiento diferente, pero parecen un fallo similar desde el punto de vista del llamador si ambos casos no se distinguen explícitamente en el código.
>
> **Buena práctica:** distinguir explícitamente, en el código que llama a una API, la ausencia de respuesta (timeout) del rechazo explícito de la petición (código de error); ambos requieren reacciones diferentes (reintentar, o corregir la petición).

## Resumen

| | |
|---|---|
| **Para recordar** | HTTP es el protocolo más común para intercambiar datos entre un cliente y un servidor. Una petición precisa un método (`GET`/`POST`/`PUT`/`DELETE`); una respuesta siempre lleva un código de estado. Una API es un servidor pensado para ser usado por un programa en lugar de un humano. |
| **Herramientas utilizables** | Un navegador (para un `GET` simple), o una herramienta dedicada ([`curl`](https://curl.se), [Postman](https://www.postman.com), una biblioteca HTTP en el lenguaje de tu elección) para construir una petición completa. |
| **Trampas a evitar** | Usar `GET` para una acción que modifica un dato. Ignorar el código de estado de una respuesta. Confundir una ausencia de respuesta y una respuesta de error explícita. |
| **Buenas prácticas** | Reservar `GET` solo para lectura. Verificar sistemáticamente el código de estado antes de usar el contenido de una respuesta. Tratar explícitamente los casos de error, no solo el caso de éxito. |
