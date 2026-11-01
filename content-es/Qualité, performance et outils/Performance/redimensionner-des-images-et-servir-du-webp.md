---
order: 14
---

# Redimensionar imágenes y servir WebP (31/10/2026)

En muchas páginas web, las imágenes son la parte más pesada. Una foto tomada con un aparato reciente tiene varios millones de **píxeles** (los pequeños cuadrados de color que componen una imagen) y varios cientos de miles de **bytes** (un byte es un grupo de 8 **bits**, un bit es un valor que vale 0 o 1; una letra sencilla ocupa un byte, ver [la organización en memoria](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). Un **servidor** (el ordenador que conserva los archivos de un sitio y los envía bajo petición, ver [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) transmite después ese archivo a un **navegador** (el programa que muestra las páginas web). Si enviamos ese archivo tal cual para mostrarlo en un marco de 400 píxeles de ancho en un teléfono, hacemos descargar y procesar decenas de veces más datos de los necesarios.

Este capítulo muestra cómo **fabricar varios tamaños** de una misma imagen, cómo **elegir el formato** más ligero que entiende el navegador, cómo evitar que un visitante malintencionado abuse del sistema, y cómo reservar el espacio de la imagen para que la página no salte durante la carga. Las cifras provienen de una prueba real, hecha con el lenguaje [Python](/?c=langages&s=python&p=python) y su biblioteca de imágenes **Pillow** ([documentación](https://pillow.readthedocs.io/)), ejecutada en una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la ventana donde se escriben comandos). Para las etiquetas `<img>` y el atributo `alt`, ver [Enlaces e imágenes](/?c=langages&s=html&p=liens-et-images); este capítulo no los repite.

| Pregunta | Sección |
|---|---|
| ¿Por qué una imagen grande ralentiza una página? | [Por qué una imagen demasiado grande cuesta caro](#por-que-una-imagen-demasiado-grande-cuesta-caro) |
| ¿Cómo producir varios tamaños? | [Fabricar derivados](#fabricar-derivados) |
| ¿JPEG, PNG o WebP? | [Tres formatos, tres usos](#tres-formatos-tres-usos) |
| ¿Cómo recibe el navegador el archivo adecuado? | [Servir el archivo adecuado](#servir-el-archivo-adecuado) |
| ¿Fabricar con antelación o bajo demanda? | [Con antelación o bajo demanda](#con-antelacion-o-bajo-demanda) |
| ¿Cómo evita la página saltar? | [Reservar el espacio](#reservar-el-espacio) |

## Por qué una imagen demasiado grande cuesta caro

Una imagen mostrada pasa por tres costes, que no se resuelven de la misma manera.

| Coste | Lo que ocurre | Depende de | Se resuelve con |
|---|---|---|---|
| **Peso** | El archivo se descarga por la red | Bytes del archivo | Un tamaño adecuado, un formato compacto |
| **Decodificación** | El navegador convierte el archivo comprimido en una rejilla de píxeles | Número de píxeles | Menos píxeles |
| **Memoria** | La rejilla de píxeles permanece en memoria mientras la imagen está visible | Número de píxeles, independientemente del formato | Menos píxeles |

El tercer coste sorprende: un archivo de 18 000 bytes puede ocupar mucha más memoria una vez abierto. Una vez decodificado, cada píxel ocupa en general 4 bytes (uno para el rojo, uno para el verde, uno para el azul, uno para la transparencia), sea cual sea el formato de origen. La memoria se calcula, pues, con una multiplicación:

```text
memoria (bytes) = anchura × altura × 4

3000 × 2000 × 4 = 24 000 000 bytes   (la imagen de prueba a tamaño completo)
 800 ×  533 × 4 =  1 705 600 bytes   (una versión de 800 píxeles de ancho)
 400 ×  267 × 4 =    427 200 bytes   (una versión de 400 píxeles de ancho)
```

Este cálculo no es una medida: es la aritmética del formato decodificado. Explica por qué un formato ligero no basta: **una imagen de 3000 píxeles de ancho sigue siendo pesada en memoria aunque su archivo sea pequeño**. Hay que reducir, pues, el número de píxeles, no solo el peso del archivo. Para decidir dónde invertir, se aplica la regla general: [medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

> **Analogía:** enviar un cartel de un metro de ancho para llenar el marco de un sello. El cartero carga con el cartel (peso), el destinatario tiene que desplegarlo (decodificación), y el cartel ocupa toda la mesa mientras se mira el sello (memoria).

## La imagen de prueba

Para medir sin depender de una foto real, el script siguiente fabrica una imagen de 3000 × 2000 píxeles: un degradado de colores, discos, un ligero desenfoque (`GaussianBlur`, que promedia cada píxel con sus vecinos) y grano (`effect_noise`, un ruido aleatorio que imita el de un sensor fotográfico). Cada píxel se codifica en **RGB**: tres valores de 0 a 255, para el rojo, el verde y el azul. La «semilla» del azar ([`seed`](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs)) está fijada para obtener la misma imagen en cada ejecución. Las funciones de Pillow utilizadas se describen en su [documentación de filtros](https://pillow.readthedocs.io/en/stable/reference/ImageFilter.html) y en su [módulo de dibujo](https://pillow.readthedocs.io/en/stable/reference/ImageDraw.html). Para repetir los scripts de este capítulo, guarda cada uno con el nombre que aparece en su primera línea, todos en una misma carpeta, y ejecútalo desde esa carpeta con `python3` seguido del nombre del archivo (por ejemplo `python3 crear_imagen.py`); la biblioteca Pillow debe estar instalada (ver su documentación). El Python de los bloques se explica en otra parte: [variables](/?c=langages&s=python&p=variables) (incluidas las `tuple`, grupos de valores entre paréntesis), [bucles](/?c=langages&s=python&p=boucles) (`for ... in range(n)` repite n veces), [funciones](/?c=langages&s=python&p=fonctions) (`print` muestra un valor) y [módulos](/?c=langages&s=python&p=modules-et-environnements) (`import` carga herramientas).

```python
# crear_imagen.py: fabrica una imagen de prueba parecida a una foto
import random                                    # sorteo de números al azar

from PIL import Image, ImageDraw, ImageFilter    # herramientas de dibujo de Pillow

ANCHURA, ALTURA = 3000, 2000                     # dimensiones en píxeles
random.seed(42)                                  # mismo azar en cada ejecución

imagen = Image.new("RGB", (ANCHURA, ALTURA))     # imagen vacía en rojo-verde-azul
pincel = ImageDraw.Draw(imagen)                  # objeto que dibuja sobre la imagen
for y in range(ALTURA):                          # una línea horizontal por fila
    t = y / ALTURA                               # posición de 0 (arriba) a 1 (abajo)
    rojo, verde, azul = int(60 + 80 * t), int(120 + 60 * t), int(220 - 140 * t)
    pincel.line([(0, y), (ANCHURA, y)], fill=(rojo, verde, azul))   # línea de color

for _ in range(150):                             # 150 discos de colores variados
    x, y = random.randrange(ANCHURA), random.randrange(ALTURA)      # centro al azar
    r = random.randrange(20, 200)                # radio al azar
    color = tuple(random.randrange(40, 230) for _ in range(3))      # rojo, verde, azul
    pincel.ellipse([x - r, y - r, x + r, y + r], fill=color)        # disco en el cuadrado

imagen = imagen.filter(ImageFilter.GaussianBlur(3))                  # desenfoque de radio 3
ruido = Image.effect_noise((ANCHURA, ALTURA), 18).convert("RGB")     # ruido, desviación 18
imagen = Image.blend(imagen, ruido, 0.12)        # mezcla: 88 % imagen, 12 % ruido
imagen.save("original.png")                      # guarda sin pérdida
print(imagen.size, imagen.mode)                  # muestra las dimensiones
```

Salida obtenida:

```text
(3000, 2000) RGB
```

Una cámara fotográfica entrega un JPEG, no un PNG de 7 188 291 bytes. El paso siguiente guarda, pues, esta imagen en JPEG de buena calidad (92 sobre una escala de 100), para simular el archivo que se recibe de un aparato: **885 780 bytes**. Es la referencia «antes» de todo el capítulo. Sobre el contenido de un archivo así (metadatos, formato bruto), ver [Metadatos EXIF y formato RAW](/?c=donnees&s=representation-des-donnees&p=metadonnees-exif-et-format-raw).

## Fabricar derivados

Un **derivado** es una copia de la imagen original con otro tamaño o en otro formato. El **original** nunca se modifica: sigue siendo la fuente con la que se rehacen todos los derivados si cambian las reglas. El principio, que los sistemas de gestión de contenidos (CMS, presentados al final del capítulo) usan con el nombre de **estilos de imagen**, cabe en un esquema:

```text
                         +--> gato-400.webp    (teléfono)
original (3000 px) ------+--> gato-800.webp    (tableta, ordenador)
gato.jpg                 +--> gato-1200.webp   (pantalla ancha)
                         +--> gato-400.jpg ... (respaldo: navegadores sin WebP)

1. llega una petición para "gato, 800 px, webp"
2. ¿el derivado existe en el disco? sí: se devuelve, y eso es todo
3. no: se fabrica a partir del original, se escribe en el disco y se devuelve
```

Una **caché** es una reserva de resultados ya calculados, guardados para no recalcularlos. La **caché en disco** es el paso 2: el archivo fabricado se conserva, así que el coste de fabricación solo se paga una vez por derivado. Tres reglas acompañan la fabricación:

| Regla | Por qué |
|---|---|
| Mantener las **proporciones** (anchura y altura reducidas en el mismo factor) | Si no, la imagen parece estirada o aplastada |
| **Nunca ampliar** más allá del original | Ampliar no crea ningún detalle: el archivo crece para nada |
| Nombrar el derivado con su anchura y su formato (`gato-800.webp`) | Una petición idéntica siempre cae en el mismo archivo |

El script siguiente fabrica cuatro anchuras a partir de la imagen de prueba, guarda cada una en JPEG, en PNG, en WebP con pérdida y en WebP sin pérdida (la diferencia se explica en la sección siguiente), y luego mide los pesos. `Image.LANCZOS` designa un filtro de reducción que conserva los detalles (ver los [filtros de remuestreo](https://pillow.readthedocs.io/en/stable/handbook/concepts.html#filters) de Pillow).

```python
# derivar.py: fabrica derivados y mide su peso
import os                                        # os.path.getsize da el peso de un archivo
import time                                      # time.perf_counter mide una duración

from PIL import Image                            # apertura y redimensionado

original = Image.open("original.png").convert("RGB")  # imagen de prueba, sin transparencia
original.save("fuente.jpg", "JPEG", quality=92)  # lo que entregaría una cámara
print("fuente.jpg", os.path.getsize("fuente.jpg"), "bytes")     # peso de referencia

for anchura in (3000, 1200, 800, 400):           # las cuatro anchuras a fabricar
    altura = round(original.height * anchura / original.width)  # proporciones conservadas
    inicio = time.perf_counter()                 # arranque del cronómetro
    if anchura == 3000:                          # tamaño completo: nada que reducir
        copia = original                         # se conserva la imagen tal cual
    else:                                        # si no, se reduce
        copia = original.resize((anchura, altura), Image.LANCZOS)   # reducción (Lanczos)
    duracion_ms = (time.perf_counter() - inicio) * 1000   # duración de la reducción en ms
    copia.save(f"d{anchura}.jpg", "JPEG", quality=80)          # JPEG con pérdida
    copia.save(f"d{anchura}.webp", "WEBP", quality=80)         # WebP con pérdida
    copia.save(f"d{anchura}.png", "PNG")                       # PNG sin pérdida
    copia.save(f"d{anchura}-sin-perdida.webp", "WEBP", lossless=True)   # WebP sin pérdida
    print(
        anchura, altura,                         # dimensiones del derivado
        "jpg", os.path.getsize(f"d{anchura}.jpg"),             # peso JPEG
        "webp", os.path.getsize(f"d{anchura}.webp"),           # peso WebP con pérdida
        "png", os.path.getsize(f"d{anchura}.png"),             # peso PNG
        "webp-sp", os.path.getsize(f"d{anchura}-sin-perdida.webp"),   # peso WebP sin pérdida
        "redim_ms", round(duracion_ms),          # duración de la reducción
    )
```

Salida obtenida (pesos en bytes; la duración `redim_ms`, en milisegundos, varía un poco de una ejecución a otra):

```text
fuente.jpg 885780 bytes
3000 2000 jpg 370822 webp 87574 png 7188291 webp-sp 4939106 redim_ms 0
1200 800 jpg 55538 webp 26410 png 988484 webp-sp 733690 redim_ms 52
800 533 jpg 33984 webp 18432 png 420204 webp-sp 308828 redim_ms 44
400 267 jpg 15373 webp 9576 png 111428 webp-sp 80728 redim_ms 37
```

| Anchura | Píxeles | Memoria decodificada (cálculo) | JPEG (calidad 80) | WebP (calidad 80) | Duración de la reducción |
|---|---|---|---|---|---|
| 3000 | 6 000 000 | 24 000 000 | 370 822 | 87 574 | ninguna |
| 1200 | 960 000 | 3 840 000 | 55 538 | 26 410 | unas decenas de ms |
| 800 | 426 400 | 1 705 600 | 33 984 | 18 432 | unas decenas de ms |
| 400 | 106 800 | 427 200 | 15 373 | 9 576 | unas decenas de ms |

Para un marco de 400 píxeles de ancho, la fuente de 885 780 bytes pesa unas 92 veces el WebP de 400 píxeles (9 576 bytes), y la memoria decodificada pasa de unos 24 millones de bytes a unos 0,4 millones. En una conexión de 1 megabit por segundo (un megabit = un millón de bits, un byte = 8 bits), el cálculo da 7,1 segundos para la fuente y 0,08 segundos para el WebP de 400 píxeles: es un cálculo de transferencia teórico, sin **latencia** (el retardo de espera antes de que lleguen los primeros datos) ni establecimiento de la conexión (ver [limitar las idas y vueltas](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours) para ese coste fijo). Esta prueba en una sola máquina no mide un teléfono real: cuentan los órdenes de magnitud, no los decimales.

## Tres formatos, tres usos

Un **formato de imagen** es una convención para escribir los píxeles en un archivo. Los tres que se comparan aquí son [**JPEG**](https://developer.mozilla.org/es/docs/Web/Media/Formats/Image_types) (*Joint Photographic Experts Group*, el formato de las fotografías), [**PNG**](https://developer.mozilla.org/es/docs/Web/Media/Formats/Image_types) (*Portable Network Graphics*, el de los logotipos y capturas) y [**WebP**](https://developers.google.com/speed/webp) (un formato más reciente creado para la web). Existen dos familias de compresión. La compresión **con pérdida** elimina detalles que el ojo apenas nota, lo que reduce mucho el peso, pero ya no permite recuperar la imagen exacta. La compresión **sin pérdida** conserva cada píxel idéntico, al precio de un archivo más grande. La **transparencia** (un fondo que se ve a través de la imagen) se codifica en un cuarto valor por píxel, llamado canal **alfa**.

| | JPEG | PNG | WebP |
|---|---|---|---|
| Compresión | Con pérdida | Sin pérdida | Las dos, a elegir al guardar |
| Transparencia (canal alfa) | No | Sí | Sí |
| Caso típico | Fotografías | Logotipos, capturas de pantalla, esquemas | Fotografías y logotipos |
| Soporte en los navegadores | Universal | Universal | Amplio hoy (ver la prudencia más abajo) |

Los pesos medidos sobre la imagen de prueba redimensionada a 800 píxeles (la que se parece a una foto):

| Formato y modo | Bytes | Relación con JPEG calidad 80 |
|---|---|---|
| JPEG, calidad 80 | 33 984 | 1,00 |
| WebP con pérdida, calidad 80 | 18 432 | 0,54 |
| WebP sin pérdida | 308 828 | 9,09 |
| PNG (sin pérdida) | 420 204 | 12,36 |

Dos conclusiones. Primero, **una foto no se pone en PNG**: pesa doce veces más que el JPEG, sin ventaja visible. Después, el WebP sin pérdida es más ligero que el PNG (más de un cuarto menos aquí), pero queda muy lejos de una compresión con pérdida para una foto. La prueba siguiente verifica la **transparencia** con un logotipo: un disco rojo sobre fondo transparente. El bloque `try` / `except OSError` capta el error que Pillow lanza cuando falla el guardado (ver [el manejo de errores en Python](/?c=langages&s=python&p=gestion-des-erreurs)).

```python
# transparencia.py: un logotipo con fondo transparente en PNG, WebP y JPEG
import os                                        # peso de los archivos

from PIL import Image, ImageDraw                 # creación y dibujo de imágenes

logo = Image.new("RGBA", (400, 400), (0, 0, 0, 0))   # RGBA: rojo, verde, azul, alfa
dibujo = ImageDraw.Draw(logo)                    # objeto que dibuja sobre el logotipo
dibujo.ellipse([40, 40, 360, 360], fill=(220, 40, 40, 255))          # disco rojo opaco
dibujo.rectangle([150, 150, 250, 250], fill=(255, 255, 255, 255))  # cuadrado blanco central
logo.save("logo.png")                            # PNG sin pérdida
logo.save("logo.webp", "WEBP", lossless=True)    # WebP sin pérdida
logo.save("logo-con-perdida.webp", "WEBP", quality=80)    # WebP con pérdida
try:                                             # JPEG no sabe codificar el alfa
    logo.save("logo.jpg", "JPEG")                # debe fallar
except OSError as error:                         # Pillow señala el error
    print("JPEG rechaza:", error)                # mensaje mostrado
for nombre in ("logo.png", "logo.webp", "logo-con-perdida.webp"):    # relectura de los tres
    imagen = Image.open(nombre)                  # abre el archivo escrito
    print(nombre, os.path.getsize(nombre), imagen.mode, imagen.getpixel((5, 5)))  # esquina
```

Salida obtenida:

```text
JPEG rechaza: cannot write mode RGBA as JPEG
logo.png 2635 RGBA (0, 0, 0, 0)
logo.webp 720 RGBA (0, 0, 0, 0)
logo-con-perdida.webp 2944 RGBA (0, 0, 0, 0)
```

El píxel de la esquina (0, 0, 0, 0) tiene un alfa de 0: quedó transparente en los tres archivos que admiten alfa. El JPEG no puede llevar este logotipo: el guardado falla. Para este dibujo plano, el WebP sin pérdida (720 bytes) es unas 3,7 veces más ligero que el PNG (2 635 bytes); el modo con pérdida (2 944 bytes) no ayuda aquí, porque una forma de bordes nítidos no tiene detalle «inútil» que suprimir.

### ¿Se puede comparar la «calidad 80» de JPEG y de WebP?

No. El número de **calidad** es una escala propia de cada codificador (el programa que escribe el archivo): «80» no tiene el mismo sentido para JPEG que para WebP. Para comparar con honestidad, hay que medir la **fidelidad** al original. El **PSNR** ([*peak signal-to-noise ratio*](https://scikit-image.org/docs/stable/api/skimage.metrics.html#skimage.metrics.peak_signal_noise_ratio), relación señal-ruido de pico) lo mide en **decibelios** (dB): cuanto más alto, más se parece la imagen al original. El decibelio es una escala [logarítmica](/?c=fondamentaux&s=mathematiques&p=le-logarithme): 10 dB más significan un error medio diez veces menor (`math.log10` calcula ese logaritmo en base 10). El PSNR no sustituye a la mirada humana (dos imágenes con el mismo PSNR pueden parecer distintas), pero da una referencia numérica.

```python
# fidelidad.py: compara la fidelidad de JPEG y WebP con el original (800 px)
import io                                        # archivo en memoria
import math                                      # logaritmo para los decibelios

from PIL import Image, ImageChops, ImageStat     # comparación de píxeles

original = Image.open("original.png").convert("RGB").resize((800, 533), Image.LANCZOS)


def psnr(a, b):
    """Devuelve el PSNR en decibelios entre dos imágenes del mismo tamaño."""
    diferencia = ImageChops.difference(a, b)     # diferencia píxel a píxel (valor absoluto)
    suma = sum(ImageStat.Stat(diferencia).sum2)  # suma de los cuadrados (3 colores)
    error = suma / (3 * a.width * a.height)      # media: cuadrado medio por valor
    return 10 * math.log10(255 * 255 / error)    # fórmula del PSNR, 255 = valor máximo


for formato_, calidad in (("JPEG", 80), ("WEBP", 80), ("WEBP", 90), ("WEBP", 95)):
    bufer = io.BytesIO()                         # archivo ficticio en memoria
    original.save(bufer, formato_, quality=calidad)          # codifica en este búfer
    releida = Image.open(io.BytesIO(bufer.getvalue())).convert("RGB")   # relee el resultado
    peso = len(bufer.getvalue())                 # tamaño del archivo codificado
    print(formato_, calidad, peso, "bytes", round(psnr(original, releida), 2), "dB")
```

Salida obtenida:

```text
JPEG 80 33984 bytes 35.82 dB
WEBP 80 18432 bytes 37.76 dB
WEBP 90 27104 bytes 39.53 dB
WEBP 95 39298 bytes 40.27 dB
```

Sobre esta imagen, el WebP de calidad 80 es a la vez **más ligero** (18 432 frente a 33 984 bytes) y **más fiel** (37,76 frente a 35,82 dB) que el JPEG de calidad 80. No hay que sacar de ahí una ley: la imagen es sintética (degradado, discos, grano regular), y el resultado varía con el contenido y el ajuste del codificador. La regla duradera: **elegir el formato y la calidad midiendo sobre las propias imágenes**, y comparar a fidelidad igual, nunca con el mismo número de calidad.

### ¿Y el soporte?

Los navegadores habituales leen el WebP hoy, pero este capítulo no ha podido comprobarlo aquí (no se ha lanzado ningún navegador para la prueba). Para un valor actualizado, consulta la [documentación sobre los formatos de imagen](https://developer.mozilla.org/es/docs/Web/Media/Formats/Image_types) de MDN. Existen otros formatos más recientes ([AVIF](https://developer.mozilla.org/es/docs/Web/Media/Formats/Image_types), por ejemplo) que se sirven con el mismo mecanismo que se presenta a continuación: la prueba de este capítulo se limita a los que la herramienta local sabe producir.

## Servir el archivo adecuado

Una vez fabricados los derivados, falta enviar a cada navegador el adecuado: el tamaño correcto, y el formato que entiende. Existen dos mecanismos, que pueden combinarse: uno se configura en la página [HTML](/?c=langages&s=html&p=html) (el lenguaje que describe el contenido de una página), el otro en el servidor, que lee la cabecera `Accept` (una línea de la petición, explicada más abajo).

| | Elección por la página HTML (`<picture>`) | Elección por el servidor (cabecera `Accept`) |
|---|---|---|
| Quién decide | El navegador, entre las direcciones listadas | El servidor, a partir de la petición recibida |
| Direcciones | Una por archivo (`gato-800.webp`, `gato-800.jpg`) | Una sola (`/imagenes/gato.jpg?w=800`) |
| Caché compartida | Simple: una dirección, un contenido | Delicada: misma dirección, contenidos distintos |
| Caso típico | Páginas cuyo HTML se controla | Páginas antiguas, contenidos de terceros, HTML imposible de modificar |

### Desde la página: `<picture>`, `srcset` y `sizes`

[`<picture>`](https://developer.mozilla.org/es/docs/Web/HTML/Element/picture) agrupa varias fuentes; el navegador retiene la primera cuyo tipo entiende. `srcset` (ya presentado en [Enlaces e imágenes](/?c=langages&s=html&p=liens-et-images)) enumera los archivos disponibles con su anchura en píxeles (`400w` significa «400 píxeles de ancho»). `sizes` indica al navegador **qué anchura ocupará la imagen en la página**, incluso antes de que se aplique el [CSS](/?c=langages&s=css&p=css) (el lenguaje que describe la apariencia de una página); `vw` es una unidad que vale el 1 % de la anchura de la ventana.

```html
<!-- contenedor: varias fuentes posibles para una sola imagen -->
<picture>
  <!-- primera fuente: WebP, que el navegador ignora si no lo lee -->
  <source
    type="image/webp"
    srcset="gato-400.webp 400w, gato-800.webp 800w, gato-1200.webp 1200w"
    sizes="(max-width: 600px) 100vw, 600px"
  >
  <!-- imagen de respaldo: JPEG, también usada para mostrar en todos los casos -->
  <img
    src="gato-800.jpg"
    srcset="gato-400.jpg 400w, gato-800.jpg 800w, gato-1200.jpg 1200w"
    sizes="(max-width: 600px) 100vw, 600px"
    width="800"
    height="533"
    alt="Un gato negro sentado en un sofá"
    loading="lazy"
  >
</picture>
```

| Elemento | Función |
|---|---|
| `type="image/webp"` | El **tipo MIME** (un nombre estándar de formato de archivo) de la fuente: el navegador salta la fuente si no la conoce |
| `srcset="... 400w"` | Los archivos disponibles y su anchura real en píxeles |
| `sizes="(max-width: 600px) 100vw, 600px"` | Si la ventana mide 600 píxeles o menos, la imagen ocupa todo el ancho; si no, ocupa 600 píxeles |
| `<img src=...>` | El respaldo: es obligatorio, es el que se muestra y el que lleva `alt`, `width`, `height` |
| [`loading="lazy"`](https://developer.mozilla.org/es/docs/Web/HTML/Element/img#loading) | El navegador retrasa la carga hasta que la imagen se acerca a la pantalla |

Ejemplo de razonamiento del navegador: en un teléfono cuya ventana mide 390 píxeles de ancho y cuya pantalla tiene 3 píxeles físicos por **píxel CSS** (la unidad de longitud de la página, independiente de la finura de la pantalla; esta relación es la **densidad de píxeles**), `100vw` vale 390 píxeles CSS, es decir, 1 170 píxeles físicos que llenar. El archivo más pequeño suficiente de la lista es `gato-1200`. El navegador sigue libre de su elección (puede tener en cuenta también la calidad de la red): `srcset` y `sizes` son **indicaciones**, no órdenes. El comportamiento exacto en un navegador real no se ha observado para este capítulo.

> **Trampa:** `loading="lazy"` en la imagen más alta de la página (la que se ve sin desplazarse) la retrasa en lugar de acelerarla. Reserva su uso para las imágenes situadas más abajo.

### Desde el servidor: la cabecera `Accept`

Una petición [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) lleva **cabeceras**, pequeñas líneas «nombre: valor» que describen la petición. La cabecera [`Accept`](https://developer.mozilla.org/es/docs/Web/HTTP/Headers/Accept) enumera los tipos de contenido que el cliente sabe leer. Un navegador que lee WebP lo anuncia escribiendo `image/webp` ahí; es un comportamiento muy extendido, pero no observado aquí: compruébalo en la pestaña «Red» de las herramientas de desarrollo del navegador (el panel integrado, que suele abrirse con la tecla F12 y enumera cada petición). El servidor responde con el formato que corresponde. La prueba siguiente usa el código de la sección siguiente: para repetirla, crea primero `estilos.py` y la carpeta `originales/`, preparados en [la sección sobre la generación bajo demanda](#la-trampa-de-la-generacion-bajo-demanda-expuesta), y ejecuta después `python3 servidor.py` desde la misma carpeta. El servidor es el módulo [`http.server`](https://docs.python.org/es/3/library/http.server.html) de Python; `127.0.0.1` es la dirección de la propia máquina y `58431` un **puerto**, el número que distingue este servidor de los demás de la máquina (ver [servidor local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement)). `GET` es el método HTTP que pide un archivo. El bloque `try` / `except urllib.error.HTTPError` capta la respuesta de error del servidor (ver [el manejo de errores en Python](/?c=langages&s=python&p=gestion-des-erreurs)); `threading` hace funcionar el servidor en segundo plano mientras el cliente lo consulta.

```python
# servidor.py: sirve /imagenes/<nombre>?w=<anchura> y elige el formato según Accept
import threading                                 # lanza el servidor en segundo plano
import urllib.error                              # errores HTTP del lado del cliente
import urllib.request                            # cliente HTTP de la biblioteca estándar
from http.server import BaseHTTPRequestHandler, HTTPServer   # servidor HTTP mínimo
from urllib.parse import parse_qs, urlparse      # descomposición de una dirección

import estilos                                   # el módulo de la sección siguiente

TIPOS = {"webp": "image/webp", "jpeg": "image/jpeg"}     # extensión -> tipo MIME


class Gestor(BaseHTTPRequestHandler):
    """Responde a cada petición GET recibida."""

    def do_GET(self):
        url = urlparse(self.path)                # separa la ruta y los parámetros
        nombre = url.path.removeprefix("/imagenes/")     # nombre del archivo pedido
        try:                                     # w puede no ser un número
            anchura = int(parse_qs(url.query).get("w", ["0"])[0])    # parámetro w, 0 si falta
        except ValueError:                       # p. ej. ?w=abc
            anchura = 0                          # fuera de la lista: rechazado como los demás
        ruta = estilos.servir(nombre, anchura, self.headers.get("Accept", ""))
        if ruta is None:                         # petición rechazada por estilos.py
            self.send_error(400, "tamaño o archivo rechazado")   # código 400: no válida
            return                               # nada más que enviar
        cuerpo = ruta.read_bytes()               # contenido del derivado
        self.send_response(200)                  # código 200: éxito
        tipo_mime = TIPOS[ruta.suffix[1:]]       # tipo MIME según la extensión del derivado
        self.send_header("Content-Type", tipo_mime)              # formato realmente enviado
        self.send_header("Content-Length", str(len(cuerpo)))     # tamaño en bytes
        self.send_header("Vary", "Accept")       # la respuesta depende de la cabecera Accept
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.end_headers()                       # fin de las cabeceras
        self.wfile.write(cuerpo)                 # envío del archivo

    def log_message(self, *argumentos):
        pass                                     # sin registro en la prueba


servidor = HTTPServer(("127.0.0.1", 58431), Gestor)      # escucha solo en local
threading.Thread(target=servidor.serve_forever, daemon=True).start()   # arranca en paralelo

ENSAYOS = (                                      # (cabecera Accept, valor del parámetro w)
    ("image/webp,*/*", 800),
    ("image/png,*/*", 800),
    ("*/*", 777),
    ("*/*", "abc"),
)
for accept, anchura in ENSAYOS:
    peticion = urllib.request.Request(
        f"http://127.0.0.1:58431/imagenes/gato.jpg?w={anchura}", headers={"Accept": accept}
    )                                            # simula un navegador que anuncia Accept
    try:                                         # una respuesta de error lanza una excepción
        with urllib.request.urlopen(peticion) as respuesta:   # envía la petición
            cuerpo = respuesta.read()            # lee la respuesta
            print(respuesta.status, respuesta.headers["Content-Type"], len(cuerpo),
                  respuesta.headers["Vary"], respuesta.headers["Cache-Control"])
    except urllib.error.HTTPError as error:      # código de error recibido
        print(error.code, error.reason)          # muestra el código y el motivo
servidor.shutdown()                              # detiene el servidor de prueba
```

Salida obtenida:

```text
200 image/webp 18376 Accept public, max-age=31536000, immutable
200 image/jpeg 33981 Accept public, max-age=31536000, immutable
400 tamaño o archivo rechazado
400 tamaño o archivo rechazado
```

El mismo camino (`/imagenes/gato.jpg?w=800`) recibió un WebP de 18 376 bytes cuando `image/webp` figuraba en `Accept`, y un JPEG de 33 981 bytes si no. Los pesos difieren un poco de la tabla anterior porque este servidor parte del archivo `fuente.jpg` (ya comprimido) y no del PNG original. La anchura 777, ausente de la lista, recibió un rechazo, al igual que el valor `abc`, que no es un número.

| Cabecera de respuesta | Función | Si se olvida |
|---|---|---|
| [`Content-Type`](https://developer.mozilla.org/es/docs/Web/HTTP/Headers/Content-Type) | Indica al navegador qué formato recibe | Puede adivinar mal o negarse a mostrarla |
| [`Vary: Accept`](https://developer.mozilla.org/es/docs/Web/HTTP/Headers/Vary) | Indica a las cachés: «mi respuesta cambia según la cabecera `Accept`» | Una caché compartida puede devolver un WebP a un navegador que no lo lee |
| [`Cache-Control`](https://developer.mozilla.org/es/docs/Web/HTTP/Headers/Cache-Control) | Tiempo durante el cual el navegador guarda el archivo sin volver a pedirlo | Cada visita vuelve a descargar la imagen |
| [`Content-Length`](https://developer.mozilla.org/es/docs/Web/HTTP/Headers/Content-Length) | Tamaño del cuerpo de la respuesta, en bytes | El navegador no sabe dónde termina la respuesta |

En `public, max-age=31536000, immutable`, `public` permite que las cachés compartidas (como una CDN) guarden una copia, `max-age=31536000` fija la duración en segundos (31 536 000 s, es decir, un año), e `immutable` indica que el archivo no cambiará: el navegador no lo vuelve a verificar antes de que termine esa duración.

> **Trampa:** `Cache-Control: ... immutable` en una dirección que no cambia cuando cambia el original. Si se reemplaza `gato.jpg`, los visitantes conservan la versión antigua durante un año. Pon una versión o una huella (un código calculado a partir del contenido del archivo) en la dirección (`gato.jpg?v=3`, o `gato.3f9a1c.jpg`) en cada cambio del original.

> **Trampa:** una [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) (red de copias del contenido cercanas a los visitantes) no siempre respeta `Vary`. Revisa el ajuste de la que usas, o prefiere la elección con `<picture>`, donde cada dirección tiene un solo contenido.

## Con antelación o bajo demanda

| | Con antelación (al subir el original) | Bajo demanda (en la primera petición) |
|---|---|---|
| Cuándo existen los derivados | Desde el guardado del original | Tras la primera petición de cada tamaño |
| Primera visita | Rápida: el archivo ya está ahí | Más lenta: hay que fabricarlo (del orden de 140 ms para 1200 px en WebP aquí) |
| Disco | Todos los derivados previstos, incluso los que nunca se piden | Solo los que se piden |
| Cambiar de tamaño o formato | Rehacer todos los derivados de todas las imágenes | Vaciar la caché: los derivados se vuelven a fabricar solos |
| Riesgo | Ninguno ligado a los visitantes | Un visitante puede provocar fabricaciones a voluntad |

En la máquina de prueba, la primera llamada para un tamaño tardó **del orden de 140 ms** (apertura del original, reducción, escritura) y la siguiente **menos de un milisegundo**, porque el derivado ya estaba en el disco. La ganancia de la caché es, pues, muy grande, y la fabricación solo se paga una vez. Pero la última línea de la tabla es la trampa central de este capítulo.

### La trampa de la generación bajo demanda expuesta

Si la dirección acepta cualquier anchura (`/imagenes/gato.jpg?w=1000`, `?w=1001`, `?w=1002`, ...), cualquiera puede pedir una anchura distinta en cada petición. Cada petición fabrica un archivo nuevo, lo guarda, y nunca se beneficiará de la caché. Es una **denegación de servicio**: un ataque que no roba nada, pero agota el servidor (procesador, memoria, disco) hasta que los visitantes legítimos ya no son atendidos. El capítulo [sobrecarga y denegación de servicio a nivel de aplicación](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif) cubre esta familia; la limitación del número de peticiones por cliente se explica en [seguridad de las API web](/?c=securite&s=cybersecurite&p=securite-api-web), pero no basta aquí: cada petición, tomada sola, parece normal.

La defensa es una **lista de tamaños permitidos**: toda petición fuera de la lista se rechaza antes del menor cálculo. Este es el módulo completo utilizado por el servidor anterior, y su prueba.

```python
# estilos.py: derivados bajo demanda, lista de tamaños permitidos, caché en disco
import os                                        # os.replace: renombra en un bloque
from pathlib import Path                         # manipulación de rutas de archivos

from PIL import Image                            # lectura y reducción de imagen

CARPETA_ORIGINALES = Path("originales")          # donde viven los originales
CARPETA_CACHE = Path("caché")                    # donde viven los derivados fabricados
ANCHURAS_PERMITIDAS = (400, 800, 1200)           # únicos tamaños que se fabrican


def elegir_formato(accept):
    """Elige webp si el navegador lo anuncia en Accept, si no jpeg."""
    return "webp" if "image/webp" in accept else "jpeg"      # prueba en la cabecera


def servir(nombre, anchura, accept, lista_estricta=True):
    """Devuelve la ruta del derivado (fabricado si falta), o None si se rechaza."""
    if lista_estricta and anchura not in ANCHURAS_PERMITIDAS:    # ¿tamaño fuera de la lista?
        return None                              # rechazo antes de cualquier cálculo
    original = (CARPETA_ORIGINALES / nombre).resolve()   # ruta real, ".." resueltos
    if CARPETA_ORIGINALES.resolve() not in original.parents or not original.is_file():
        return None                              # fuera de la carpeta, o archivo ausente
    formato_ = elegir_formato(accept)            # webp o jpeg según el navegador
    destino = CARPETA_CACHE / f"{original.stem}-{anchura}.{formato_}"   # nombre (anchura)
    if not destino.exists():                     # ausente de la caché: se fabrica
        CARPETA_CACHE.mkdir(exist_ok=True)       # crea la carpeta de caché si hace falta
        imagen = Image.open(original).convert("RGB")     # abre el original
        anchura = min(anchura, imagen.width)            # nunca más ancho que el original
        altura = round(imagen.height * anchura / imagen.width)   # proporciones conservadas
        temporal = destino.with_suffix(f".{os.getpid()}.tmp")    # nombre único (proceso)
        reducida = imagen.resize((anchura, altura), Image.LANCZOS)   # reducción
        reducida.save(temporal, formato_.upper(), quality=80)    # escribe el provisional
        os.replace(temporal, destino)       # renombra en un bloque: nunca un archivo a medias
    return destino                               # ruta del derivado lista para usar
```

Antes de ejecutar nada, hay que preparar los originales. En este ejemplo, están en una carpeta `originales/`, que contiene `gato.jpg`, una copia de `fuente.jpg` (fabricada por `derivar.py`). Los dos comandos siguientes, escritos en la terminal desde la carpeta donde están `estilos.py` y `fuente.jpg`, crean esa carpeta (`mkdir`, *make directory*, crear un directorio) y luego copian la imagen con el nombre `gato.jpg` (`cp`, *copy*, copiar).

```bash
# crea la carpeta originales/ junto a estilos.py
mkdir originales
# copia fuente.jpg en esa carpeta, con el nombre gato.jpg
cp fuente.jpg originales/gato.jpg
```

El parámetro `lista_estricta=False` existe solo para **medir el ataque**: una aplicación real nunca ofrece esa opción. El módulo respeta además la regla «nunca ampliar»: `min(anchura, imagen.width)` limita la anchura a la del original (el archivo conserva en su nombre la anchura pedida). Esta es la prueba.

```python
# ensayo_estilos.py: caché, negociación, rechazo, luego 200 anchuras inventadas
import shutil                                    # shutil.rmtree vacía la carpeta de caché
import time                                      # cronómetro
from pathlib import Path                         # lista de los archivos de la caché

import estilos                                   # el módulo de arriba

shutil.rmtree("caché", ignore_errors=True)       # parte de una caché vacía
print(estilos.servir("gato.jpg", 800, "image/webp,image/*"))     # webp anunciado
print(estilos.servir("gato.jpg", 800, "image/png,*/*"))          # webp ausente de Accept
print(estilos.servir("gato.jpg", 777, "image/webp"))             # tamaño fuera de la lista
print(estilos.servir("../estilos.py", 800, "image/webp"))        # salida de la carpeta

inicio = time.perf_counter()                     # arranque del cronómetro
estilos.servir("gato.jpg", 1200, "image/webp")   # primera llamada: fabricación
frio = (time.perf_counter() - inicio) * 1000     # duración en milisegundos
inicio = time.perf_counter()                     # nuevo arranque
estilos.servir("gato.jpg", 1200, "image/webp")   # segunda llamada: ya en la caché
caliente = (time.perf_counter() - inicio) * 1000  # duración en milisegundos
print(f"frío {frio:.1f} ms, caliente {caliente:.3f} ms")

shutil.rmtree("caché", ignore_errors=True)       # caché vacía antes del ataque simulado
inicio = time.perf_counter()                     # arranque del cronómetro
for anchura in range(1000, 1200):                # 200 anchuras distintas
    estilos.servir("gato.jpg", anchura, "image/webp")            # con la lista
print("con lista:", len(list(Path("caché").glob("*"))), "archivos",
      round(time.perf_counter() - inicio, 3), "s")

shutil.rmtree("caché", ignore_errors=True)       # caché vacía de nuevo
inicio = time.perf_counter()                     # arranque del cronómetro
for anchura in range(1000, 1200):                # las mismas 200 anchuras
    estilos.servir("gato.jpg", anchura, "image/webp", lista_estricta=False)  # sin lista
archivos = list(Path("caché").glob("*"))         # archivos fabricados
bytes_totales = sum(f.stat().st_size for f in archivos)   # peso total en el disco
print("sin lista:", len(archivos), "archivos", bytes_totales, "bytes",
      round(time.perf_counter() - inicio, 3), "s")
```

Salida obtenida (las duraciones varían de una ejecución a otra):

```text
caché/gato-800.webp
caché/gato-800.jpeg
None
None
frío 136.1 ms, caliente 0.133 ms
con lista: 0 archivos 0.0 s
sin lista: 200 archivos 4893402 bytes 25.663 s
```

| Petición | Resultado | Por qué |
|---|---|---|
| 800 px con `image/webp` en `Accept` | `gato-800.webp` | Formato anunciado por el cliente |
| 800 px sin `image/webp` | `gato-800.jpeg` | Respaldo para los clientes que no leen WebP |
| 777 px | `None` (rechazo) | Anchura ausente de `ANCHURAS_PERMITIDAS` |
| `../estilos.py` | `None` (rechazo) | La ruta sale de la carpeta de originales |
| 200 anchuras inventadas, con lista | 0 archivos, 0 s | Cada petición se rechaza antes de cualquier cálculo |
| 200 anchuras inventadas, sin lista | 200 archivos, 4 893 402 bytes, unos 26 s | Cada petición provoca una fabricación completa |

200 peticiones costaron unos 26 segundos de cálculo y casi 5 megabytes en el disco: unos 130 ms y 24 000 bytes cada una. Por simple proporción (cálculo, no medida), 10 000 peticiones de este tipo costarían unos 21 minutos de cálculo en un solo núcleo de procesador (una unidad de cálculo independiente) y unos 245 megabytes de disco, para una sola imagen. Con varios miles de originales, el disco y el procesador se saturan. La lista de tamaños reduce este coste a cero, y limita también el número de archivos de la caché: (número de originales) × (número de tamaños) × (número de formatos).

| Defensa | Lo que impide | Límite |
|---|---|---|
| **Lista de tamaños permitidos** | Las anchuras inventadas | Hay que prever de antemano los tamaños útiles |
| Firma en la dirección (un código calculado con un secreto del servidor) | Cualquier dirección no producida por el propio servidor | Exige gestionar secretos ([gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |
| Limitar el número de peticiones por cliente | Un único cliente que inunda | Inútil contra miles de clientes, o contra una petición única muy costosa |
| Limitar el tamaño del original (en píxeles) | Una imagen trampa que explota en memoria al decodificarse | Hay que fijarlo también en la subida (ver [subida de archivos](/?c=securite&s=cybersecurite&p=upload-de-fichiers)) |
| Pregenerar al subir el original | Cualquier abuso bajo demanda | Disco ocupado por derivados nunca servidos |

El archivo temporal seguido de un `os.replace` resuelve otra trampa, más discreta: dos peticiones simultáneas para el mismo derivado inexistente. Sin esta precaución, la segunda podría leer un archivo a medio escribir. Con un nombre provisional único por proceso (un servidor con varios hilos de ejecución, ver [paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme), debería incluir también el identificador del hilo, o usar el módulo `tempfile`) y un renombrado **atómico** (que se realiza en un único bloque indivisible, sin estado intermedio visible), cada lector ve o bien nada, o bien el archivo completo. El nombre del original (`nombre`) recibido desde fuera se controla frente al **recorrido de ruta** (una petición como `../estilos.py` que sale de la carpeta prevista), detallado en [subida de archivos](/?c=securite&s=cybersecurite&p=upload-de-fichiers). En `estilos.py`, `.resolve()` convierte la ruta pedida en una ruta completa al borrar los `..` (ver [árbol y rutas](/?c=fondamentaux&s=bases-de-l-informatique&p=arborescence-et-chemins)), y `.parents` enumera las carpetas que contienen esa ruta: si la carpeta de originales no forma parte de ellas, la petición sale de la carpeta prevista y se rechaza (ver también [`pathlib`](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)).

## Reservar el espacio

Mientras la imagen no ha llegado, el navegador no conoce su tamaño. Si no tiene ninguna indicación, muestra la página con un espacio vacío y luego, al llegar la imagen, empuja hacia abajo el texto situado debajo: es el **desplazamiento de diseño** ([*layout shift*](https://web.dev/articles/cls)), muy molesto (se hace clic en un botón que se ha movido). La solución es declarar las dimensiones por adelantado.

```html
<!-- anchura y altura en píxeles: el navegador calcula la proporción 800/533 -->
<img src="gato-800.jpg" width="800" height="533" alt="Un gato negro">
```

La regla de estilo siguiente está escrita en CSS.

```css
/* regla aplicada a todas las imágenes */
img {
  max-width: 100%;   /* la imagen nunca supera su contenedor */
  height: auto;      /* la altura sigue a la anchura, manteniendo la proporción declarada */
}
```

| Elemento | Función |
|---|---|
| `width="800" height="533"` | Da a conocer la **relación anchura/altura** (800 / 533, aproximadamente 1,5) antes de que llegue el archivo |
| `max-width: 100%` | Reduce la imagen cuando el contenedor es más estrecho que 800 píxeles |
| `height: auto` | Recalcula la altura con la proporción, para no aplastar la imagen |
| [`aspect-ratio: 3 / 2`](https://developer.mozilla.org/es/docs/Web/CSS/aspect-ratio) (CSS) | Otra forma de reservar el espacio cuando el HTML no se puede modificar |

Los atributos `width` y `height` no describen el tamaño de visualización final (lo decide el CSS): solo dan la proporción. Por tanto, deben corresponder a la del archivo, **todos los derivados incluidos**: si los derivados conservan las proporciones (regla de la sección anterior), la misma pareja vale para todos los tamaños. El desplazamiento no se ha observado en un navegador para este capítulo: el mecanismo es el descrito en [Enlaces e imágenes](/?c=langages&s=html&p=liens-et-images).

## Un ejemplo en un sistema de gestión de contenidos: Drupal

Todo lo anterior se encuentra en los **sistemas de gestión de contenidos** (CMS, programas que permiten publicar páginas sin escribir código). **Drupal**, un CMS escrito en [PHP](/?c=langages&s=php&p=php), es aquí solo un ejemplo: lo que cuenta es el principio, válido con cualquier herramienta. Los nombres siguientes están verificados en el código fuente de Drupal 11.x; la referencia es la documentación oficial ([drupal.org/docs](https://www.drupal.org/docs)).

| Principio del capítulo | Lo que propone Drupal |
|---|---|
| Derivado a un tamaño dado | Un **estilo de imagen**: un nombre (por ejemplo `miniatura`) asociado a una serie de **efectos** (reducir, recortar, convertir) |
| Fabricación bajo demanda, caché en disco | El derivado se fabrica en la primera petición de la dirección del estilo, y luego se conserva en la carpeta de archivos |
| Lista de tamaños permitidos | Solo existen los estilos definidos por el administrador; la dirección de un derivado lleva un **token** (parámetro de dirección) calculado a partir de la ruta y de una clave privada del sitio; sin él, Drupal responde con un error `404`. Este token limita la fabricación abusiva de derivados (protege contra la generación masiva), pero no controla el origen de la petición |
| Conversión a otro formato | Un efecto de **conversión** que cambia la extensión de salida, por ejemplo a WebP |
| `<picture>`, `srcset`, `sizes` | El módulo **Responsive image**, que genera estas etiquetas a partir de estilos de imagen |
| Convertidores WebP | El núcleo ya sabe convertir a WebP, con el efecto de conversión (`image_convert`); módulos aportados por la comunidad (por ejemplo «WebP») añaden además una copia WebP de cada derivado |

Dos advertencias propias de este tipo de herramienta. La conversión depende de la biblioteca de imágenes que usa PHP: si no se compiló con soporte para WebP, el efecto no está disponible. Y el ajuste «direcciones no seguras» (`image.settings:allow_insecure_derivatives`, desactivado por defecto) no anula el token para las rutas que empiezan por `styles/`, que siempre lo exigen; solo lo suprime para las demás rutas. Activarlo sigue desaconsejado: aumenta la exposición a la generación abusiva de derivados, y por tanto a la denegación de servicio (la saturación del servidor por una avalancha de peticiones).

## Las trampas

| Trampa | Consecuencia | Solución |
|---|---|---|
| Enviar el original de la cámara | Peso y memoria desproporcionados | Fabricar derivados en las anchuras realmente mostradas |
| Reducir el peso sin reducir los píxeles | Memoria siempre elevada | Reducir primero las dimensiones, y luego elegir el formato |
| Ampliar un original pequeño | Archivo grande, imagen borrosa | Limitar la anchura del derivado a la del original |
| Comparar la «calidad 80» de dos formatos | Conclusión falsa | Comparar a fidelidad igual (PSNR o mirada), o a peso igual |
| Foto en PNG | Archivo varias veces más pesado que el JPEG | PNG para logotipos, capturas y esquemas; JPEG o WebP para fotos |
| Logotipo con transparencia en JPEG | Fallo al guardar, o fondo opaco | PNG o WebP |
| Tamaños aceptados sin límite | Disco y procesador agotados, denegación de servicio | Lista de tamaños permitidos, comprobada antes de cualquier cálculo |
| `Vary: Accept` olvidada | Una caché sirve un WebP a un navegador que no lo lee | Enviar `Vary: Accept`, o usar `<picture>` |
| `immutable` sin versión en la dirección | La imagen antigua sigue mostrándose durante un año | Poner una versión o una huella en la dirección |
| Nombre de original no controlado | Lectura de un archivo fuera de la carpeta prevista | Resolver la ruta y comprobar que sigue dentro de la carpeta de originales |
| Escribir el derivado directamente en su ubicación final | Un lector lee un archivo a medio escribir | Escribir un archivo provisional, y luego renombrarlo |
| `width` y `height` ausentes | Desplazamiento de diseño al llegar la imagen | Declararlos, con `height: auto` en CSS |
| `loading="lazy"` en la imagen de la parte superior | Imagen principal retrasada | Reservar `lazy` para las imágenes que están fuera de pantalla al inicio |

## Buenas prácticas

| Práctica | Detalle |
|---|---|
| Conservar el original intacto | Todos los derivados se rehacen a partir de él; no volver a codificar nunca un derivado |
| Elegir un pequeño número de anchuras | Una lista corta (por ejemplo 400, 800, 1200) cubre la mayoría de los usos y limita la caché |
| Ofrecer WebP con un respaldo | Una fuente WebP, y una imagen JPEG de respaldo dentro de `<picture>` |
| Describir el contexto con `sizes` | Sin `sizes`, el navegador supone que la imagen ocupa todo el ancho de la ventana |
| Medir sobre las propias imágenes | Cada contenido se comporta de forma distinta; ver [medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) |
| Poner los derivados detrás de una CDN | La [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) guarda una copia cercana al visitante; el principio de la caché en disco es el mismo, ver también [evitar el recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) |
| Rechazar antes de calcular | La comprobación del tamaño, del nombre y del formato se hace antes de abrir el original |
| Declarar `width` y `height` | Para reservar el espacio y evitar el desplazamiento de diseño |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Una imagen cuesta en peso, en decodificación y en memoria; la memoria depende de los píxeles (anchura × altura × 4 bytes), no del archivo. Se fabrican derivados de varias anchuras, conservados en el disco. En la imagen de prueba, el WebP con pérdida era a la vez más ligero y más fiel que el JPEG con el mismo valor de calidad; PNG y WebP conservan la transparencia, JPEG no. El archivo adecuado se elige con `<picture>` y `srcset`/`sizes`, o con la cabecera `Accept` junto con `Vary: Accept`. |
| **Trampas que evitar** | Generar bajo demanda cualquier tamaño: un visitante puede saturar el procesador y el disco. Comparar valores de calidad de formatos distintos. Foto en PNG, logotipo transparente en JPEG. Caché de un año en una dirección que no cambia. Dimensiones no declaradas, que provocan un desplazamiento de la página. |
| **Buenas prácticas** | Conservar el original, aceptar solo una lista de tamaños, rechazar antes de calcular, escribir por renombrado atómico, ofrecer WebP con un formato de respaldo, declarar `width` y `height`, y medir sobre las propias imágenes. |
