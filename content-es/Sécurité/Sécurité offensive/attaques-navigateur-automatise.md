---
order: 10
---

# Atacar (y defender) un navegador automatizado

[La explotación web del lado del atacante](/?c=securite&s=securite-offensive&p=exploitation-web-cote-attaquant) mira a un atacante que apunta a TU sitio. Este capítulo invierte la perspectiva, para un caso cada vez más frecuente: tu propio código pilota un navegador real (Playwright, Selenium, Puppeteer) contra páginas que NO controlas: un scraper que visita sitios de socios, una herramienta que automatiza una tarea en un sitio de terceros. Esta vez, es TU navegador automatizado el que se convierte en el objetivo.

## Un navegador pilotado sigue siendo un navegador completo

La diferencia entre "leer una página" y "mostrar una página en un navegador" importa más de lo que parece: un script que solo descarga el HTML de una página (una simple petición HTTP) no corre ningún riesgo de los que trata este capítulo, solo obtiene texto. Un navegador PILOTADO, en cambio, ejecuta realmente la página: JavaScript incluido, como un visitante humano, con las mismas capacidades que un navegador normal, incluidas las que tu script automatizado nunca tuvo intención de usar.

```text
Peticion HTTP simple (sin riesgo de este capitulo):
  Script --peticion GET--> Servidor --devuelve el HTML bruto--> Script (solo lee texto)

Navegador pilotado (Playwright/Selenium/Puppeteer):
  Script --controla--> Navegador real --carga Y EJECUTA la pagina-->
  la pagina puede disparar una descarga, abrir un popup, leer el
  portapapeles, intentar explotar el propio navegador -- exactamente
  como frente a un visitante humano real
```

## Qué puede intentar una página maliciosa contra el piloto automático

| Vector | Qué explota |
|---|---|
| Descarga autodisparada | Una página que fuerza la descarga de un archivo sin acción explícita; si el navegador pilotado acepta silenciosamente cualquier descarga (comportamiento por defecto a menudo activado para la automatización), el archivo llega al disco sin supervisión humana que lo note |
| Secuestro del portapapeles | La API de portapapeles del navegador, accesible en JavaScript, permite a una página leer o modificar su contenido bajo ciertas condiciones; un script que luego reutiliza ese portapapeles en otro sitio (copiar-pegar automatizado de un dato obtenido) hereda el contenido inyectado |
| Popup/redirección inesperada | Una página que abre una nueva ventana o redirige agresivamente puede perturbar la lógica del script piloto (que asume haber permanecido en la página esperada), o incluso hacerle interactuar por error con una página distinta de la prevista |
| Fingerprinting del piloto automático | Algunas páginas detectan la presencia de un navegador automatizado (propiedades JavaScript específicas de Playwright/Selenium) para adaptar su comportamiento: mostrar un contenido diferente, o disparar una defensa anti-bot dirigida |
| Inyección en los datos extraídos | Si el script confía después en el texto extraído de la página (un título, un precio) sin tratarlo como un dato externo no fiable, un contenido trampa puede propagarse más allá en el sistema que recibe ese resultado (véase el principio ya expuesto en [Las grandes familias de fallos](/?c=securite&s=cybersecurite&p=types-de-failles)) |

## La señal concreta que leen los anti-bot: `navigator.webdriver`

El protocolo WebDriver, usado por Playwright, Selenium y herramientas similares para pilotar un navegador, expone por defecto una propiedad JavaScript legible por cualquier página:

```javascript
navigator.webdriver   // true si esta pilotado via WebDriver, false/undefined en caso contrario
```

Cualquier script de la página, y por tanto cualquier sistema anti-bot, puede leer esta propiedad para distinguir un visitante humano de un script, sin necesidad de analizar un comportamiento más sutil. La contramedida consiste en redefinir esta propiedad antes de cualquier otro script de la página:

```javascript
Object.defineProperty(navigator, "webdriver", { get: () => undefined });
```

Inyectada al principio mismo de la carga de cada página (`context.add_init_script(...)` en Playwright), esta redefinición oculta la señal más directa, sin cambiar nada más del comportamiento del navegador.

> **Trampa:** ocultar `navigator.webdriver` no vuelve indetectable a un navegador pilotado: los sistemas anti-bot avanzados combinan decenas de señales (ritmo de clics, resolución de pantalla, fuentes instaladas...), no solo esta propiedad. Tratarla como la única a corregir da una falsa sensación de seguridad.

## Modo headless o ventana real

Un navegador **headless** («sin cabeza») se ejecuta sin mostrar ninguna ventana: es el modo más común para un script, porque no necesita ni pantalla ni sesión abierta. Pero un navegador sin ventana no se presenta exactamente como un navegador normal: algunas versiones anuncian «HeadlessChrome» en su identificador (*User-Agent*) o no exponen las mismas funcionalidades. Los sistemas anti-bot lo usan para decidir si muestran una verificación adicional (ver [el fingerprinting](/?c=securite&s=cybersecurite&p=fingerprinting-navigateur-et-appareil)).

| | Headless | Ventana real |
|---|---|---|
| Recursos | Ligeros | Más pesados (una ventana que dibujar) |
| Necesita una sesión abierta | No | Sí (ver [las sesiones de Windows](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)) |
| Huella | A veces reconocible | La de un navegador corriente |
| Intervención humana posible (validar una verificación) | No | Sí |

Una alternativa habitual: lanzar una **ventana real, pero colocarla fuera de la pantalla visible** (`--window-position=-32000,-32000`), para conservar la huella de un navegador normal sin molestar a quien usa la máquina. El tamaño de la página se ajusta aparte, mediante el **viewport** (la zona de visualización que la página cree tener): lo impone el script y no depende de la resolución de la pantalla, que solo importa a un humano que mirara la ventana.

```python
navegador = p.chromium.launch(
    headless=False,                            # ventana real, sin modo headless
    args=["--window-position=-32000,-32000"],  # ventana colocada fuera de la pantalla visible
)
page = navegador.new_page(viewport={"width": 1280, "height": 1000})
```

> **Trampa:** cambiar de modo (ventana real en desarrollo, headless en producción) sin volver a probar: la página puede comportarse de otra manera (una verificación que aparece, una maquetación que cambia), y el script solo se validó en el otro modo.
>
> **Buena práctica:** probar en el modo realmente usado en producción y fijar el `viewport` para que la maquetación no dependa de la pantalla de la máquina.

## Los captchas: una verificación hecha para detener a los robots

Un **captcha** (*Completely Automated Public Turing test to tell Computers and Humans Apart*) es una prueba que la página pide superar antes de continuar: reconocer imágenes, marcar una casilla. Está diseñado para ser fácil para un humano y difícil para un programa, y las versiones recientes juzgan también el comportamiento y la huella del navegador, y no solo la prueba mostrada.

Un robot que se topa con un captcha no debe por tanto intentar superarlo. El esquema habitual es **dejar que un humano lo resuelva** en una ventana real y luego reutilizar el resultado: una vez superada la verificación, el sitio coloca una cookie de validación (por ejemplo `cf_clearance` en Cloudflare) que el navegador devuelve en cada petición, sin nueva prueba, mientras sea válida.

> **Trampa:** creer que una cookie de validación es universal. A menudo está ligada al navegador (identificador, huella) y a la dirección IP que la obtuvo: un robot que reutiliza la misma cookie con otra huella (por ejemplo al pasar de la ventana real al modo headless) vuelve a quedar bloqueado.
>
> **Buena práctica:** prever un estado «intervención humana requerida» (notificación, ventana visible) en lugar de dar vueltas en silencio; no sortear un captcha con un servicio de terceros sin comprobar que las condiciones de uso del sitio lo permiten.

## El perfil de navegador persistente

Por defecto, un navegador pilotado arranca con un perfil vacío, destruido al cerrarse: ninguna cookie sobrevive de un lanzamiento a otro. Un **perfil persistente** es una carpeta que conserva cookies, almacenamiento local y caché. Con Playwright se pide mediante `launch_persistent_context` ([documentación](https://playwright.dev/python/docs/api/class-browsertype#browser-type-launch-persistent-context)):

```python
contexto = p.chromium.launch_persistent_context(
    user_data_dir=r"C:\robot\perfil",  # cookies, almacenamiento local y caché guardados aquí
    headless=False,                    # mismo modo en cada lanzamiento
    viewport={"width": 1280, "height": 1000},
)
```

La cookie de validación obtenida tras un captcha permanece entonces en esta carpeta, y los lanzamientos siguientes ya no ven la verificación.

| Punto de atención | Por qué |
|---|---|
| Un solo navegador a la vez por perfil | La carpeta queda bloqueada mientras un navegador la usa; un segundo lanzamiento falla |
| La ruta depende de la cuenta que ejecuta | Una ruta relativa a la carpeta del usuario no designa la misma carpeta para otra cuenta (cuenta de servicio, programador de tareas): el robot parte de un perfil vacío y vuelve a ver el captcha |
| El contenido es sensible | El perfil contiene sesiones abiertas: quien copie la carpeta puede iniciar sesión en su lugar |

> **Trampa:** hacer commit de la carpeta del perfil en [Git](/?c=git&p=git), o dejarla legible para todas las cuentas de la máquina.
>
> **Buena práctica:** indicar la ruta del perfil en absoluto (o en una variable de entorno), excluirla del repositorio (`.gitignore`) y reservar el acceso a la cuenta que ejecuta el robot.

## La depuración remota de Chrome

Chrome puede abrir un puerto de **depuración remota** (`--remote-debugging-port=9222`): una herramienta, o un script, se conecta a él hablando el **Chrome DevTools Protocol** (CDP), el protocolo que usan también las herramientas de desarrollo del navegador ([documentación](https://chromedevtools.github.io/devtools-protocol/)). Esto permite ver y pilotar una página de un Chrome sin escritorio (un servidor, una máquina remota).

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\robot\perfil-debug
```

| Uso | Cómo |
|---|---|
| Comprobar que el puerto responde | `curl http://localhost:9222/json/version` (devuelve la versión y la dirección del canal de control) |
| Ver la página en otro Chrome | Abrir `chrome://inspect`, añadir `localhost:9222` a los destinos: la página aparece, con sus herramientas de desarrollo |
| Pilotar con Playwright | `p.chromium.connect_over_cdp("http://localhost:9222")` |

Este puerto **no pide ninguna autenticación**: quien se conecte a él controla el navegador, incluidas las sesiones abiertas en su perfil (puede leer las cookies, navegar, ejecutar JavaScript en una página con la sesión iniciada).

> **Trampa:** exponer este puerto a la red. Chrome solo escucha por defecto en `127.0.0.1` (invisible desde la red, ver [los túneles SSH](/?c=infrastructure-devops&s=reseaux&p=tunnel-ssh-et-redirection-de-port)); cambiar la dirección de escucha o abrir el puerto en el cortafuegos da el control del navegador a cualquiera que lo alcance.
>
> **Buena práctica:** dejar el puerto en `127.0.0.1` y, para acceder desde otro equipo, pasar por un túnel SSH (`ssh -N -L 9222:localhost:9222 …`).

> **Trampa:** desde Chrome 136, la opción `--remote-debugging-port` ya no se tiene en cuenta cuando el perfil es el predeterminado de Chrome: una carpeta no estándar usa otra clave de cifrado, lo que protege los datos del perfil habitual de un programa malicioso ([anuncio](https://developer.chrome.com/blog/remote-debugging-port)). Sin `--user-data-dir`, el puerto no responde.
>
> **Buena práctica:** dar siempre un `--user-data-dir` dedicado al robot, distinto del perfil personal.

## La distinción clave: "extraer datos" frente a "ejecutar una página"

El reflejo defensivo central cabe en una frase: un script de automatización solo necesita una pequeña parte de lo que sabe hacer un navegador completo (cargar una página, leer su contenido, hacer clic en elementos previstos). Todo lo demás (descargas, popups, permisos del sistema, acceso al portapapeles) debe estar explícitamente RESTRINGIDO, nunca dejado en los ajustes por defecto pensados para un uso humano interactivo.

| Ajuste | Comportamiento por defecto | Restricción recomendada para un piloto automático |
|---|---|---|
| Descargas | A menudo aceptadas silenciosamente | Desactivar, o redirigir a una carpeta aislada que nunca se ejecute automáticamente |
| Diálogos nativos (`alert`, `confirm`, popup) | A veces bloquean el script en espera | Interceptarlos sistemáticamente (`page.on("dialog")` en Playwright) para cerrarlos automáticamente, sin dejar nunca que se acumulen ni influyan en el script |
| Permisos del navegador (geolocalización, notificaciones, portapapeles) | Varía según el navegador | Denegar todo permiso por defecto, concediendo solo los realmente necesarios para la tarea |
| Confianza en el texto extraído | A menudo tratado como dato ya fiable una vez "recién extraído" | Tratar como dato externo no fiable (escapar antes de cualquier uso: mostrar, consultar, registrar) |

> **Trampa:** considerar el scraping como una operación sin riesgo porque "solo se leen datos públicos". El navegador que ejecuta la página sigue plenamente expuesto a lo que esa página intente, independientemente de la intención del script que lo pilota.
>
> **Buena práctica:** configurar explícitamente el navegador pilotado con el mínimo de capacidades necesarias para la tarea (descargas desactivadas, diálogos interceptados, permisos denegados por defecto), y tratar cualquier dato extraído de una página no controlada como externo y no fiable antes de reutilizarlo en cualquier otra parte del sistema.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un navegador pilotado por un script (Playwright/Selenium/Puppeteer) ejecuta realmente las páginas visitadas, con todas las capacidades de un navegador normal: una página maliciosa puede intentar una descarga autodisparada, secuestrar el portapapeles, perturbar el script mediante un popup, o detectar la propia automatización vía `navigator.webdriver`. El modo headless tiene una huella a veces reconocible; un captcha lo levanta un humano en una ventana real, y el desbloqueo se reutiliza gracias a un perfil persistente; el puerto de depuración remota de Chrome no tiene ninguna autenticación. |
| **Herramientas utilizables** | Interceptación de diálogos nativos (`page.on("dialog")`); desactivación de descargas o carpeta aislada dedicada; denegación de permisos del navegador por defecto; ocultación de `navigator.webdriver` vía `context.add_init_script(...)`. Una ventana real colocada fuera de la pantalla y un `viewport` fijo; `launch_persistent_context` para conservar un perfil; `--remote-debugging-port` y `chrome://inspect` para observar un Chrome sin escritorio. |
| **Trampas a evitar** | Dejar los ajustes por defecto de un navegador pensado para uso humano en un piloto automático. Confiar en un dato extraído de una página no controlada sin tratarlo como externo. Creer que un navegador pilotado se vuelve indetectable solo con ocultar `navigator.webdriver`. Validar en un modo (ventana real) y ejecutar en otro (headless). Creer que una cookie de validación de captcha vale para otra huella. Un perfil de navegador versionado, legible por todos o designado por una ruta que cambia según la cuenta. Un puerto de depuración expuesto a la red. |
| **Buenas prácticas** | Restringir explícitamente el navegador pilotado al mínimo necesario para la tarea. Interceptar sistemáticamente todo diálogo/descarga inesperado. Escapar cualquier dato extraído antes de reutilizarlo, como cualquier otro dato externo. Probar en el modo de producción y fijar el `viewport`. Prever un estado «intervención humana requerida» ante un captcha. Perfil con ruta absoluta, fuera del repositorio, reservado a la cuenta del robot. Puerto de depuración solo en `127.0.0.1`, accesible a distancia mediante un túnel SSH, con un `--user-data-dir` dedicado. |
