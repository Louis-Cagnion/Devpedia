---
order: 12
---

# SSRF: eludir la lista blanca

[Protege tus datos](/?c=langages&s=php&p=securite) presenta el principio del SSRF (obligar al servidor a hacer una petición a un destino interno por cuenta del atacante) y su defensa de referencia: validar el host de destino contra una lista blanca explícita en lugar de confiar en una URL proporcionada por el cliente. Este capítulo cubre dos formas en que esa lista blanca, aunque esté implantada, puede eludirse.

## Eludir la lista blanca mediante una redirección HTTP

Una validación que solo comprueba la URL de PARTIDA proporcionada por el usuario, sin volver a comprobar adónde lleva después una redirección HTTP, deja una puerta abierta: el propio atacante aloja una redirección hacia su verdadero objetivo.

```text
1. Lista blanca autorizada: solo "images.example.com"

2. El atacante proporciona: http://images.example.com/redirige-al-objetivo
   -> pasa la validación: el host de partida ES images.example.com

3. El servidor sigue la petición... que en realidad responde con una redirección HTTP:
   HTTP/1.1 302 Found
   Location: http://169.254.169.254/latest/meta-data/

4. Si el código que hace la petición SIGUE automáticamente esta redirección
   (comportamiento por defecto de la mayoría de las bibliotecas HTTP), alcanza
   el verdadero objetivo interno, nunca revalidado contra la lista blanca
```

| | |
|---|---|
| **Trampa** | Validar el host una sola vez, antes de enviar la petición, suponiendo que el destino sigue siendo el mismo durante todo el intercambio |
| **Buena práctica** | Desactivar el seguimiento automático de redirecciones en toda petición saliente construida a partir de un dato del usuario, o revalidar el host de destino en CADA redirección seguida, no solo en la petición inicial |

## SSRF a través de un generador de documentos (HTML a PDF)

Una herramienta que transforma HTML en PDF (factura descargable, exportación de informe) es, técnicamente, un mininavegador: carga y muestra recursos como lo haría Chrome o Firefox, incluidas imágenes o `iframe` referenciados por una URL. Si el contenido HTML que se transforma integra un dato del usuario sin filtrar, esta funcionalidad queda expuesta al mismo riesgo SSRF que una llamada HTTP explícita.

```html
<!-- Escrito por el usuario en un campo previsto para una imagen de perfil -->
<img src="http://169.254.169.254/latest/meta-data/iam/security-credentials/">
<!-- o, según el motor de renderizado usado, una ruta de archivo LOCAL en lugar de una URL -->
<img src="file:///etc/passwd">
```

Si el motor de renderizado muestra realmente el resultado de esta petición en el PDF generado (o lo devuelve de una forma explotable), el contenido de un recurso interno o de un archivo local queda expuesto en un documento que el atacante puede descargar después.

| | |
|---|---|
| **Trampa** | Considerar un generador de PDF como una simple herramienta de maquetación, sin darse cuenta de que hace peticiones de red/archivo como un navegador para resolver cada recurso referenciado en el HTML |
| **Buena práctica** | Desactivar, en la configuración del motor de renderizado, la carga de recursos externos y el acceso al sistema de archivos local; si no es posible, aplicar la misma lista blanca de hosts que para una llamada SSRF clásica a toda URL insertada en el contenido que se transforma |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una lista blanca de hosts protege contra un SSRF directo, pero sigue pudiendo eludirse con una redirección HTTP no revalidada, o con un generador de documentos (HTML→PDF) que carga recursos como un navegador sin que salte a la vista como una "petición de red". |
| **Herramientas utilizables** | Opción de una biblioteca HTTP para desactivar el seguimiento de redirecciones; opción de un motor de renderizado PDF para desactivar la carga de recursos externos/archivos locales. |
| **Trampas a evitar** | Validar el host solo en la petición inicial, nunca después de una redirección seguida. Tratar un generador de PDF como incapaz de hacer peticiones de red. |
| **Buenas prácticas** | Desactivar el seguimiento automático de redirecciones o revalidar en cada salto. Restringir los recursos que puede cargar un motor de renderizado de documentos a lo estrictamente necesario. |
