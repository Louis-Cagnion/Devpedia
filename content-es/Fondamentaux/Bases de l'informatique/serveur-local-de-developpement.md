---
order: 8
---

# El servidor local: probar una página web sin publicarla

Abrir un archivo `index.html` directamente en el navegador (doble clic, o una dirección que empieza por `file://`) funciona para una página muy simple. En cuanto carga otros archivos (`fetch`, módulos JavaScript, algunas fuentes), el navegador bloquea silenciosamente esas cargas: falta un **servidor local**, un programa que sirve los archivos del proyecto como lo haría un sitio real en línea, pero desde la propia máquina.

## Por qué `file://` no basta

Un navegador aplica reglas de seguridad diferentes según si la página proviene de una dirección `http://`/`https://` (un servidor real) o de `file://` (un archivo local). Varias funcionalidades comunes están limitadas o desactivadas en `file://`:

| Necesidad de la página | En `file://` | Con un servidor local |
|---|---|---|
| Cargar otro archivo con `fetch` | Bloqueado (error CORS) | Funciona |
| Cargar un módulo JavaScript (`<script type="module">`) | Bloqueado en la mayoría de los navegadores | Funciona |
| Recargar la página en cada modificación (live reload) | Imposible | Posible (según la herramienta) |

> **Trampa:** ver un error `CORS` o `Failed to fetch` en la consola y buscar el problema en el propio código. La causa más frecuente es simplemente la ausencia de un servidor local: la página está abierta en `file://`.
>
> **Buena práctica:** en cuanto una página carga otro archivo (JSON, módulo JS...), probarla desde un servidor local en lugar de abrirla directamente con doble clic.

## Servidor local, servidor de producción: mismo papel, alcance diferente

Un servidor local responde a los mismos tipos de peticiones que un servidor de producción (ver [API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) para el detalle del diálogo petición/respuesta): recibir una dirección, devolver el archivo solicitado. La diferencia está en quién puede acceder a él.

```text
Servidor local (localhost)         Servidor de producción
      │                                    │
Responde únicamente a esta         Responde a cualquiera en
máquina (127.0.0.1)                Internet, con un dominio real
      │                                    │
Sirve de borrador durante   →      Recibe el resultado final,
el desarrollo                      una vez listo
```

> **Trampa:** creer que un sitio "funciona" una vez lanzado en local, y descuidar el paso de despliegue. `localhost` solo es accesible desde la máquina que lo ejecuta: nadie más tiene acceso mientras el sitio no esté desplegado en un servidor real.

## Lanzar un servidor local

Varias herramientas prestan el mismo servicio; la elección depende sobre todo de lo que ya esté instalado.

| Herramienta | Comando | Requisito previo |
|---|---|---|
| Python (ya presente en macOS/Linux) | `python3 -m http.server 8000` | Python instalado |
| Node.js | `npx serve` | Node.js instalado |
| PHP | `php -S localhost:8000` | PHP instalado |
| Live Server (extensión de VS Code) | Clic derecho sobre `index.html` → "Open with Live Server" | VS Code |

Una vez lanzado, la terminal muestra una dirección (a menudo `http://localhost:8000` o `http://127.0.0.1:5500`) para abrir en el navegador.

> **Profundizar:** `localhost` y `127.0.0.1` designan ambos "esta misma máquina"; el número después de `:` (el **puerto**) distingue varios servidores que estuvieran corriendo al mismo tiempo en la misma máquina.

## Recarga automática o manual

Algunas herramientas (Live Server) recargan la página automáticamente cada vez que se modifica y guarda un archivo; otras (`http.server`, `php -S`) nunca lo hacen, hay que recargar uno mismo (`F5`).

> **Trampa:** una recarga automática en plena mitad de una prueba que depende del tiempo (una animación, una reproducción de audio, una conexión en curso) la interrumpe sin avisar, falseando la prueba.
>
> **Buena práctica:** para una prueba sensible al tiempo, preferir una herramienta sin recarga automática (`http.server`, `php -S`): la página solo cambia cuando uno mismo la recarga, en el momento elegido.

> **Trampa:** creer que un simple F5, o incluso una recarga completa (`Ctrl+Mayús+R`, o `Cmd+Mayús+R` en macOS), siempre vacía la **caché** del navegador (su copia de algunos archivos, guardada para evitar pedirlos de nuevo cada vez). Con `python3 -m http.server` o `php -S`, que no indican cuánto tiempo guardar esas copias, puede seguir sirviendo una versión antigua de un archivo cargado con `fetch` o un módulo JS pese a una recarga completa, incluso después de "borrar los datos del sitio" desde el candado de la barra de direcciones (que no siempre vacía esa caché, según el navegador).
>
> **Buena práctica:** la forma más simple y fiable es cambiar el puerto del servidor local (`python3 -m http.server 8001` en lugar de `8000`): un puerto distinto es una dirección distinta para el navegador, así que la caché queda vacía de entrada, sin nada que limpiar. Si no, vaciar la caché desde los ajustes del navegador en lugar del candado (en Chrome: `chrome://settings/clearBrowserData`, período "Todo el tiempo", marcar "Imágenes y archivos en caché").

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un archivo abierto en `file://` no tiene acceso a `fetch`, a los módulos JS, ni a la recarga automática: un **servidor local** levanta esas restricciones sirviendo los archivos como lo haría un servidor real, pero accesible únicamente desde la propia máquina (`localhost`). |
| **Herramientas utilizables** | `python3 -m http.server`, `npx serve`, `php -S`, la extensión Live Server de VS Code. |
| **Trampas a evitar** | Buscar un error de código ante un error CORS/`Failed to fetch` cuando en realidad la página corre en `file://`. Usar una herramienta con recarga automática para una prueba sensible al tiempo (audio, animación): la recarga puede interrumpirla en plena mitad. Creer que un F5, o incluso una recarga completa, siempre vacía la caché del navegador. |
| **Buenas prácticas** | Probar siempre desde un servidor local en cuanto la página carga otro archivo. Elegir una herramienta sin recarga automática para una prueba sensible al tiempo. Si una modificación sigue sin verse, cambiar el puerto del servidor local (caché vacía de entrada) en vez de pelear por vaciar la existente. |
