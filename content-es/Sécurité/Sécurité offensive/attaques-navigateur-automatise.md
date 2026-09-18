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
| **Para recordar** | Un navegador pilotado por un script (Playwright/Selenium/Puppeteer) ejecuta realmente las páginas visitadas, con todas las capacidades de un navegador normal: una página maliciosa puede intentar una descarga autodisparada, secuestrar el portapapeles, perturbar el script mediante un popup, o detectar la propia automatización vía `navigator.webdriver`. |
| **Herramientas utilizables** | Interceptación de diálogos nativos (`page.on("dialog")`); desactivación de descargas o carpeta aislada dedicada; denegación de permisos del navegador por defecto; ocultación de `navigator.webdriver` vía `context.add_init_script(...)`. |
| **Trampas a evitar** | Dejar los ajustes por defecto de un navegador pensado para uso humano en un piloto automático. Confiar en un dato extraído de una página no controlada sin tratarlo como externo. Creer que un navegador pilotado se vuelve indetectable solo con ocultar `navigator.webdriver`. |
| **Buenas prácticas** | Restringir explícitamente el navegador pilotado al mínimo necesario para la tarea. Interceptar sistemáticamente todo diálogo/descarga inesperado. Escapar cualquier dato extraído antes de reutilizarlo, como cualquier otro dato externo. |
