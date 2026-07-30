---
order: 3
---

# Enlaces e imágenes

Los enlaces (`<a>`) y las imágenes (`<img>`) son dos elementos fundamentales de la web: uno conecta documentos entre sí (el origen mismo de la palabra «*hipertexto»*) y el otro inserta contenido visual.

## Enlaces

```html
<a href="https://exemple.com">Lien externe</a>
<a href="/contact">Lien relatif, vers une autre page du même site</a>
<a href="#section2">Lien vers une ancre, dans la même page</a>
<a href="mailto:contact@exemple.com">Lien qui ouvre le client mail</a>
<a href="tel:+33612345678">Lien qui propose d'appeler un numéro</a>
```

### El atributo «`target`»

```html
<a href="https://exemple.com" target="_blank" rel="noopener noreferrer">Ouvre dans un nouvel onglet</a>
```

> **Nota:** `target="_blank"` sin `rel="noopener"` permite que la nueva página abierta acceda (a través de JavaScript) al objeto `window` de la página original, lo que supone un riesgo de seguridad menor, pero real (*tabnabbing*). `noopener` (y `noreferrer`, que además impide el envío de la URL original) deben acompañar sistemáticamente a cualquier `target="_blank"`.

### Enlaces relativos frente a absolutos

```html
<a href="https://exemple.com/page">Absolu : toujours la même destination, quel que soit le site</a>
<a href="/page">Relatif à la racine : dépend du domaine actuel</a>
<a href="page">Relatif au dossier courant : dépend de l'URL actuelle</a>
```

## Las imágenes

```html
<img src="photo.jpg" alt="Un chat noir assis sur un canapé" width="600" height="400">
```

- `src` : la ruta (relativa o absoluta, igual que en el caso de un enlace) al archivo de imagen.
- `alt` : un texto alternativo, que se muestra si la imagen no se carga y que lee un lector de pantalla; **nunca es opcional** desde el punto de vista de la accesibilidad (véase el capítulo dedicado a este tema). Una imagen puramente decorativa (sin información propia) debe tener un`alt=""`o (vacío, pero presente), para que el lector de pantalla la omita en silencio en lugar de anunciar un nombre de archivo sin interés.
- `width` /`height`: dimensiones declaradas de antemano, que permiten al navegador reservar el espacio necesario **antes** de que se cargue la imagen, lo que evita un desplazamiento visual del resto de la página durante la carga (*layout shift*).

## Imágenes adaptativas (`srcset`)

```html
<img
    src="photo-800.jpg"
    srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1200.jpg 1200w"
    sizes="(max-width: 600px) 400px, 800px"
    alt="Un chat noir assis sur un canapé"
>
```

El navegador elige **por sí mismo** la versión más adecuada al tamaño real de visualización y a la resolución de la pantalla, de entre las propuestas; así se evita que un móvil tenga que descargar una imagen diseñada para una pantalla grande.

## Imágenes como enlaces

```html
<a href="/produit/42">
    <img src="produit.jpg" alt="Chaise en bois, vue de face">
</a>
```

Se puede insertar una imagen dentro de un `<a>`, lo que hace que la propia imagen sea clicable; en ese caso, el `alt` sigue siendo imprescindible, ya que es este el que describe el **destino** del enlace para un lector de pantalla, y no solo el contenido visual de la imagen.
