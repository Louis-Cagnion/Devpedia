---
order: 3
---

# Enlaces e imágenes

Los enlaces (`<a>`) y las imágenes (`<img>`) son dos etiquetas fundamentales de la web: una conecta documentos entre sí (el origen mismo de la palabra "hipertexto"), la otra inserta contenido visual.

## Los enlaces

```html
<a href="https://ejemplo.com">Enlace externo</a>
<a href="/contacto">Enlace relativo, hacia otra página del mismo sitio</a>
<a href="#seccion2">Enlace hacia un ancla, en la misma página</a>
<a href="mailto:contacto@ejemplo.com">Enlace que abre el cliente de correo</a>
<a href="tel:+33612345678">Enlace que propone llamar a un número</a>
```

### El atributo `target`

```html
<a href="https://ejemplo.com" target="_blank" rel="noopener noreferrer">Abre en una nueva pestaña</a>
```

> **Nota:** `target="_blank"` sin `rel="noopener"` permite que la nueva página abierta acceda (mediante [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)) al objeto `window` de la página de origen: un riesgo de seguridad menor, pero real (*tabnabbing*). `noopener` (y `noreferrer`, que además impide el envío de la URL de origen) deben acompañar sistemáticamente a cualquier `target="_blank"`.

### Enlaces relativos frente a absolutos

```html
<a href="https://ejemplo.com/pagina">Absoluto: siempre el mismo destino, sea cual sea el sitio</a>
<a href="/pagina">Relativo a la raíz: depende del dominio actual</a>
<a href="pagina">Relativo a la carpeta actual: depende de la URL actual</a>
```

## Las imágenes

```html
<img src="foto.jpg" alt="Un gato negro sentado en un sofá" width="600" height="400">
```

- `src`: la ruta (relativa o absoluta, la misma lógica que para un enlace) hacia el archivo de imagen.
- `alt`: un texto alternativo, que se muestra si la imagen no carga y que lee un lector de pantalla: **nunca es opcional** desde el punto de vista de la accesibilidad (véase [Atributos data-* y accesibilidad](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)). Una imagen puramente decorativa (sin información propia) debe tener `alt=""` (vacío, pero presente), para que el lector de pantalla la omita en silencio en lugar de anunciar un nombre de archivo sin interés.
- `width`/`height`: dimensiones declaradas de antemano, que permiten al navegador reservar el espacio necesario **antes** de que se cargue la imagen: evita un desplazamiento visual del resto de la página durante la carga (*layout shift*).

## Imágenes adaptativas (`srcset`)

```html
<img
    src="foto-800.jpg"
    srcset="foto-400.jpg 400w, foto-800.jpg 800w, foto-1200.jpg 1200w"
    sizes="(max-width: 600px) 400px, 800px"
    alt="Un gato negro sentado en un sofá"
>
```

El navegador elige **por sí mismo** la versión más adecuada al tamaño real de visualización y a la resolución de la pantalla, entre las propuestas: evita obligar a un móvil a descargar una imagen pensada para una pantalla grande.

## Imágenes como enlaces

```html
<a href="/producto/42">
    <img src="producto.jpg" alt="Silla de madera, vista de frente">
</a>
```

Una imagen puede colocarse dentro de un `<a>`, lo que la hace clicable por sí misma: el `alt` sigue siendo entonces indispensable, ya que es él quien describe el **destino** del enlace para un lector de pantalla, no solo el contenido visual de la imagen.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `<a>` conecta documentos (externo, relativo, ancla, correo, teléfono); `<img>` inserta una imagen. `alt` describe una imagen para un lector de pantalla o en caso de fallo de carga: nunca es opcional. |
| **Herramientas utilizables** | `srcset`/`sizes` para imágenes adaptativas; `width`/`height` para reservar el espacio antes de la carga. |
| **Trampas a evitar** | `target="_blank"` sin `rel="noopener"` (riesgo de seguridad, *tabnabbing*); una imagen sin `alt` (ni vacío para una imagen decorativa, ni completado para una imagen con significado). |
| **Buenas prácticas** | Acompañar siempre `target="_blank"` con `rel="noopener noreferrer"`; declarar `width`/`height` para evitar un desplazamiento visual (*layout shift*) durante la carga. |
