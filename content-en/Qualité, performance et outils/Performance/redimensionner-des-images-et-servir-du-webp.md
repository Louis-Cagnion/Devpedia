---
order: 14
---

# Resizing Images and Serving WebP (31/10/2026)

On many web pages, images are the heaviest part. A photo taken with a recent device contains several million **pixels** (the tiny squares of color that make up an image) and several hundred thousand **bytes** (a byte is a group of 8 **bits**, a bit being a value that is either 0 or 1; a single plain letter takes up one byte, see [memory organization](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). A **server** (the computer that keeps a site's files and sends them on request, see [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) then transmits this file to a **browser** (the software that displays web pages). If the server sends the file as it is to display it in a frame 400 pixels wide on a phone, we make the visitor download and process dozens of times more data than necessary.

This chapter shows how to **make several sizes** of the same image, how to **choose the format** that is the lightest one the browser understands, how to keep a malicious visitor from abusing the system, and how to reserve the image's space so that the page does not jump while it loads. The figures come from a real test, done with the [Python](/?c=langages&s=python&p=python) language and its image library **Pillow** ([documentation](https://pillow.readthedocs.io/)), run in a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (the window where you type commands). For the `<img>` tags and the `alt` attribute, see [Links and Images](/?c=langages&s=html&p=liens-et-images); this chapter does not repeat them.

| Question | Section |
|---|---|
| Why does a large image slow a page down? | [Why an oversized image costs money](#why-an-oversized-image-costs-money) |
| How do we produce several sizes? | [Making derivatives](#making-derivatives) |
| JPEG, PNG or WebP? | [Three formats, three uses](#three-formats-three-uses) |
| How does the browser receive the right file? | [Serving the right file](#serving-the-right-file) |
| Make them ahead of time or on demand? | [Ahead of time or on demand](#ahead-of-time-or-on-demand) |
| How does the page avoid jumping around? | [Reserving space](#reserving-space) |

## Why an oversized image costs money

A displayed image goes through three costs, and each one is paid in a different way.

| Cost | What happens | Depends on | Fixed by |
|---|---|---|---|
| **Weight** | The file is downloaded over the network | Bytes in the file | A suitable size, a compact format |
| **Decoding** | The browser turns the compressed file into a grid of pixels | Number of pixels | Fewer pixels |
| **Memory** | The grid of pixels stays in memory as long as the image is shown | Number of pixels, whatever the format | Fewer pixels |

The third cost is the surprising one: a file of 18,000 bytes can take up much more memory once it is opened. Once decoded, each pixel generally takes 4 bytes (one for red, one for green, one for blue, one for transparency), whatever the original format. Memory is therefore calculated by multiplication:

```text
memory (bytes) = width × height × 4

3000 × 2000 × 4 = 24,000,000 bytes   (the test image at full size)
 800 × 533 × 4 =  1,705,600 bytes   (a version 800 pixels wide)
 400 × 267 × 4 =    427,200 bytes   (a version 400 pixels wide)
```

This calculation is not a measurement: it is the arithmetic of the decoded format. It explains why a light format is not enough: **an image 3000 pixels wide stays heavy in memory even when its file is small**. So we must reduce the number of pixels, not only the weight of the file. To decide where to put your effort, the general rule applies: [measure before optimizing](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

> **Analogy:** sending a one-meter-wide poster to fill a postage stamp frame. The mail carrier carries the poster (weight), the recipient has to unfold it (decoding), and it takes up the whole table while we look at the stamp (memory).

## The test image

To measure without depending on a real photo, the following script makes an image of 3000 × 2000 pixels: a gradient of colors, disks, a slight blur (`GaussianBlur`, which averages each pixel with its neighbors) and some grain (`effect_noise`, a random noise that imitates that of a camera sensor). Each pixel is encoded in **RGB**: three values from 0 to 255, for red, green and blue. The random "seed" ([`seed`](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs)) is fixed so that the same image is obtained on every run. The Pillow functions used are described in its [filter documentation](https://pillow.readthedocs.io/en/stable/reference/ImageFilter.html) and its [drawing module](https://pillow.readthedocs.io/en/stable/reference/ImageDraw.html). To replay the scripts of this chapter, save each one under the name given on its first line, all in the same folder, then run it from that folder with `python3` followed by the file name (for example `python3 create_image.py`); Pillow must be installed (see its documentation). The Python in the blocks is explained elsewhere: [variables](/?c=langages&s=python&p=variables) (including `tuple`, groups of values in parentheses), [loops](/?c=langages&s=python&p=boucles) (`for ... in range(n)` repeats n times), [functions](/?c=langages&s=python&p=fonctions) (`print` displays a value) and [modules](/?c=langages&s=python&p=modules-et-environnements) (`import` loads tools).

```python
# create_image.py: makes a test image close to a photo
import random                                    # draws random numbers

from PIL import Image, ImageDraw, ImageFilter    # Pillow's drawing tools

WIDTH, HEIGHT = 3000, 2000                       # dimensions in pixels
random.seed(42)                                  # same randomness on every run

image = Image.new("RGB", (WIDTH, HEIGHT))        # empty red-green-blue image
brush = ImageDraw.Draw(image)                    # object that draws on the image
for y in range(HEIGHT):                          # one horizontal line per row
    t = y / HEIGHT                               # position from 0 (top) to 1 (bottom)
    red, green, blue = int(60 + 80 * t), int(120 + 60 * t), int(220 - 140 * t)
    brush.line([(0, y), (WIDTH, y)], fill=(red, green, blue))   # colored line

for _ in range(150):                             # 150 disks of varied colors
    x, y = random.randrange(WIDTH), random.randrange(HEIGHT)    # random center
    r = random.randrange(20, 200)                # random radius
    color = tuple(random.randrange(40, 230) for _ in range(3))  # red, green, blue
    brush.ellipse([x - r, y - r, x + r, y + r], fill=color)     # disk inside this square

image = image.filter(ImageFilter.GaussianBlur(3))                # blur, radius 3 pixels
noise = Image.effect_noise((WIDTH, HEIGHT), 18).convert("RGB")   # noise, spread 18
image = Image.blend(image, noise, 0.12)          # mix: 88 % image, 12 % noise
image.save("original.png")                       # saves without loss
print(image.size, image.mode)                    # shows the dimensions
```

Output obtained:

```text
(3000, 2000) RGB
```

A camera produces a JPEG, not a 7,188,291-byte PNG. The next step therefore saves this image as a good-quality JPEG (92 on a scale of 100), to simulate the file received from a camera: **885,780 bytes**. This is the "before" reference for the whole chapter. For what such a file contains (metadata, raw format), see [EXIF metadata and the RAW format](/?c=donnees&s=representation-des-donnees&p=metadonnees-exif-et-format-raw).

## Making derivatives

A **derivative** is a copy of the original image at another size or in another format. The **original** is never modified: it stays the source from which all the derivatives are rebuilt if the rules change. The principle, used by content management systems (CMS, presented at the end of the chapter) under the name **image styles**, fits in a diagram:

```text
                         +--> cat-400.webp    (phone)
original (3000 px) ------+--> cat-800.webp    (tablet, computer)
cat.jpg                  +--> cat-1200.webp   (wide screen)
                         +--> cat-400.jpg ... (fallback: browsers without WebP)

1. a request arrives for "cat, 800 px, webp"
2. does the derivative exist on disk? yes: send it back, that's all
3. no: make it from the original, write it to disk, send it back
```

A **cache** is a store of results that have already been computed, kept so that they are not computed again. The **disk cache** is step 2: the file that was made is kept, so the cost of making it is paid only once per derivative. Three rules go with making them:

| Rule | Why |
|---|---|
| Keep the **proportions** (width and height reduced by the same factor) | Otherwise the image looks stretched or squashed |
| Never **enlarge** beyond the original | Enlarging creates no detail: the file grows for nothing |
| Name the derivative with its width and its format (`cat-800.webp`) | An identical request always falls back on the same file |

The following script makes four widths from the test image, saves each one as JPEG, PNG, lossy WebP and lossless WebP (the difference is explained in the next section), then measures the sizes. `Image.LANCZOS` names a resizing filter that preserves details (see Pillow's [resampling filters](https://pillow.readthedocs.io/en/stable/handbook/concepts.html#filters)).

```python
# derive.py: makes derivatives and measures their size
import os                                        # os.path.getsize gives the size of a file
import time                                      # time.perf_counter measures a duration

from PIL import Image                            # opening and resizing

original = Image.open("original.png").convert("RGB")      # test image, no transparency
original.save("source.jpg", "JPEG", quality=92)  # what a camera would deliver
print("source.jpg", os.path.getsize("source.jpg"), "bytes")     # reference size

for width in (3000, 1200, 800, 400):             # the four widths to make
    height = round(original.height * width / original.width)    # proportions kept
    start = time.perf_counter()                  # starts the stopwatch
    if width == 3000:                            # full size: nothing to shrink
        copy = original                          # keeps the image as it is
    else:                                        # otherwise we shrink it
        copy = original.resize((width, height), Image.LANCZOS)  # resizing (Lanczos)
    duration_ms = (time.perf_counter() - start) * 1000   # resizing time in ms
    copy.save(f"d{width}.jpg", "JPEG", quality=80)          # JPEG, lossy
    copy.save(f"d{width}.webp", "WEBP", quality=80)         # WebP, lossy
    copy.save(f"d{width}.png", "PNG")                       # PNG, lossless
    copy.save(f"d{width}-lossless.webp", "WEBP", lossless=True)   # WebP, lossless
    print(
        width, height,                           # dimensions of the derivative
        "jpg", os.path.getsize(f"d{width}.jpg"),             # JPEG size
        "webp", os.path.getsize(f"d{width}.webp"),           # lossy WebP size
        "png", os.path.getsize(f"d{width}.png"),             # PNG size
        "webp-ll", os.path.getsize(f"d{width}-lossless.webp"),   # lossless WebP size
        "resize_ms", round(duration_ms),         # resizing time
    )
```

Output obtained (sizes in bytes; the `resize_ms` duration, in milliseconds, varies a little from one run to another):

```text
source.jpg 885780 bytes
3000 2000 jpg 370822 webp 87574 png 7188291 webp-ll 4939106 resize_ms 0
1200 800 jpg 55538 webp 26410 png 988484 webp-ll 733690 resize_ms 52
800 533 jpg 33984 webp 18432 png 420204 webp-ll 308828 resize_ms 44
400 267 jpg 15373 webp 9576 png 111428 webp-ll 80728 resize_ms 37
```

| Width | Pixels | Decoded memory (calculated) | JPEG (quality 80) | WebP (quality 80) | Resizing time |
|---|---|---|---|---|---|
| 3000 | 6,000,000 | 24,000,000 | 370,822 | 87,574 | none |
| 1200 | 960,000 | 3,840,000 | 55,538 | 26,410 | a few tens of ms |
| 800 | 426,400 | 1,705,600 | 33,984 | 18,432 | a few tens of ms |
| 400 | 106,800 | 427,200 | 15,373 | 9,576 | a few tens of ms |

For a frame 400 pixels wide, the 885,780-byte source weighs about 92 times as much as the 400-pixel WebP (9,576 bytes), and the decoded memory drops from about 24 million bytes to about 0.4 million. On a connection of 1 megabit per second (a megabit is one million bits, and a byte is 8 bits), the calculation gives 7.1 seconds for the source and 0.08 second for the 400-pixel WebP. This is a theoretical transfer calculation, without **latency** (the waiting time before the first data arrives) or connection setup (see [cutting round trips](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours) for that fixed cost). This test on one machine does not measure a real phone: the orders of magnitude matter, not the decimals.

## Three formats, three uses

An **image format** is a convention for writing pixels into a file. The three compared here are [**JPEG**](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types) (*Joint Photographic Experts Group*, the format for photographs), [**PNG**](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types) (*Portable Network Graphics*, the one used for logos and screenshots) and [**WebP**](https://developers.google.com/speed/webp) (a more recent format created for the web). Two families of compression exist. **Lossy** compression removes details that the eye barely notices, which greatly reduces the weight but no longer lets you recover the exact image. **Lossless** compression keeps every pixel identical, at the cost of a bigger file. **Transparency** (a background you can see through the image) is coded as a fourth value per pixel, called the **alpha** channel.

| | JPEG | PNG | WebP |
|---|---|---|---|
| Compression | Lossy | Lossless | Both, chosen when saving |
| Transparency (alpha channel) | No | Yes | Yes |
| Typical use | Photographs | Logos, screenshots, diagrams | Photographs and logos |
| Browser support | Universal | Universal | Wide today (see the caution below) |

The sizes measured on the test image resized to 800 pixels (the one that looks like a photo):

| Format and mode | Bytes | Ratio to JPEG quality 80 |
|---|---|---|
| JPEG, quality 80 | 33,984 | 1.00 |
| WebP lossy, quality 80 | 18,432 | 0.54 |
| WebP lossless | 308,828 | 9.09 |
| PNG (lossless) | 420,204 | 12.36 |

Two lessons. First, **a photo should not be saved as a PNG**: it is twelve times heavier than the JPEG, with no visible benefit. Then, lossless WebP is lighter than PNG (more than a quarter lighter here), but it stays far from lossy compression for a photo. The next test checks **transparency** with a logo: a red disk on a transparent background. In it, the `try` / `except OSError` block catches the error that Pillow raises when saving fails (see [error handling in Python](/?c=langages&s=python&p=gestion-des-erreurs)).

```python
# transparency.py: a logo with a transparent background in PNG, WebP and JPEG
import os                                        # file sizes

from PIL import Image, ImageDraw                 # creating and drawing images

logo = Image.new("RGBA", (400, 400), (0, 0, 0, 0))   # RGBA: red, green, blue, alpha
drawing = ImageDraw.Draw(logo)                   # object that draws on the logo
drawing.ellipse([40, 40, 360, 360], fill=(220, 40, 40, 255))        # opaque red disk
drawing.rectangle([150, 150, 250, 250], fill=(255, 255, 255, 255))  # white center square
logo.save("logo.png")                            # lossless PNG
logo.save("logo.webp", "WEBP", lossless=True)    # lossless WebP
logo.save("logo-lossy.webp", "WEBP", quality=80) # lossy WebP
try:                                             # JPEG cannot encode the alpha channel
    logo.save("logo.jpg", "JPEG")                # must fail
except OSError as error:                         # Pillow reports the error
    print("JPEG refused:", error)                # message shown
for name in ("logo.png", "logo.webp", "logo-lossy.webp"):    # rereads the three files
    image = Image.open(name)                     # opens the file that was written
    print(name, os.path.getsize(name), image.mode, image.getpixel((5, 5)))  # corner pixel
```

Output obtained:

```text
JPEG refused: cannot write mode RGBA as JPEG
logo.png 2635 RGBA (0, 0, 0, 0)
logo.webp 720 RGBA (0, 0, 0, 0)
logo-lossy.webp 2944 RGBA (0, 0, 0, 0)
```

The corner pixel (0, 0, 0, 0) has an alpha of 0: it stayed transparent in the three files that support alpha. The JPEG cannot hold this logo: saving fails. For this flat drawing, lossless WebP (720 bytes) is about 3.7 times lighter than PNG (2,635 bytes). The lossy mode (2,944 bytes) does not help here, because a shape with sharp edges has no "useless" detail to remove.

### Can we compare "quality 80" for JPEG and WebP?

No. The **quality** number is a scale specific to each encoder (the program that writes the file): "80" does not mean the same thing for JPEG and for WebP. To compare honestly, you must measure the **fidelity** to the original. The **PSNR** ([*peak signal-to-noise ratio*](https://scikit-image.org/docs/stable/api/skimage.metrics.html#skimage.metrics.peak_signal_noise_ratio)) measures it in **decibels** (dB): the higher it is, the more the image looks like the original. The decibel is a [logarithmic](/?c=fondamentaux&s=mathematiques&p=le-logarithme) scale: 10 dB more means an average error ten times smaller (`math.log10` computes this base-10 logarithm). The PSNR does not replace the human eye (two images with the same PSNR can look different), but it gives a numerical benchmark.

```python
# fidelity.py: compares the fidelity of JPEG and WebP to the original (800 px)
import io                                        # file in memory
import math                                      # logarithm for decibels

from PIL import Image, ImageChops, ImageStat     # pixel comparison

original = Image.open("original.png").convert("RGB").resize((800, 533), Image.LANCZOS)


def psnr(a, b):
    """Returns the PSNR in decibels between two images of the same size."""
    gap = ImageChops.difference(a, b)            # pixel-by-pixel gap (absolute value)
    total = sum(ImageStat.Stat(gap).sum2)        # sum of the squared gaps (3 colors)
    error = total / (3 * a.width * a.height)     # mean: average squared gap per value
    return 10 * math.log10(255 * 255 / error)    # PSNR formula, 255 = maximum value


for format_, quality in (("JPEG", 80), ("WEBP", 80), ("WEBP", 90), ("WEBP", 95)):
    buffer = io.BytesIO()                        # fake file in memory
    original.save(buffer, format_, quality=quality)     # encodes into this buffer
    reread = Image.open(io.BytesIO(buffer.getvalue())).convert("RGB")  # rereads the result
    size = len(buffer.getvalue())                # size of the encoded file
    print(format_, quality, size, "bytes", round(psnr(original, reread), 2), "dB")
```

Output obtained:

```text
JPEG 80 33984 bytes 35.82 dB
WEBP 80 18432 bytes 37.76 dB
WEBP 90 27104 bytes 39.53 dB
WEBP 95 39298 bytes 40.27 dB
```

On this image, WebP at quality 80 is both **lighter** (18,432 against 33,984 bytes) and **more faithful** (37.76 against 35.82 dB) than JPEG at quality 80. Do not draw a general rule from it: the image is synthetic (gradient, disks, regular grain), and the result varies with the content and with the encoder's settings. The lasting rule is to **choose the format and the quality by measuring on your own images**, and to compare at equal fidelity, never at the same quality number.

### And browser support?

Common browsers read WebP today, but this chapter could not check it here (no browser was launched for the test). For an up-to-date value, see the [image format documentation](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types) on MDN. Other, more recent formats exist ([AVIF](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types), for example) and are served by the same mechanism as the one presented below: the test in this chapter is limited to the formats that the local tool can produce.

## Serving the right file

Once the derivatives are made, we still have to send each browser the right one: the right size, and a format it understands. Two mechanisms exist, which can be combined: one is set in the [HTML](/?c=langages&s=html&p=html) page (the language that describes the content of a page), the other is set in the server, which reads the `Accept` header (a line of the request, explained below).

| | Choice by the HTML page (`<picture>`) | Choice by the server (`Accept` header) |
|---|---|---|
| Who decides | The browser, among the listed addresses | The server, from the request it receives |
| Addresses | One per file (`cat-800.webp`, `cat-800.jpg`) | A single one (`/images/cat.jpg?w=800`) |
| Shared cache | Simple: one address, one content | Tricky: same address, different contents |
| Typical case | Pages whose HTML you control | Old pages, third-party content, HTML that cannot be changed |

### On the page: `<picture>`, `srcset` and `sizes`

[`<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture) groups several sources; the browser keeps the first one whose type it understands. `srcset` (already presented in [Links and Images](/?c=langages&s=html&p=liens-et-images)) lists the available files with their width in pixels (`400w` means "400 pixels wide"). `sizes` tells the browser **how wide the image will take up in the page**, even before the [CSS](/?c=langages&s=css&p=css) (the language that describes the appearance of a page) is applied; `vw` is a unit equal to 1 % of the width of the window.

```html
<!-- container: several possible sources for a single image -->
<picture>
  <!-- first source: WebP, which the browser ignores if it cannot read it -->
  <source
    type="image/webp"
    srcset="cat-400.webp 400w, cat-800.webp 800w, cat-1200.webp 1200w"
    sizes="(max-width: 600px) 100vw, 600px"
  >
  <!-- fallback image: JPEG, also used to display in every case -->
  <img
    src="cat-800.jpg"
    srcset="cat-400.jpg 400w, cat-800.jpg 800w, cat-1200.jpg 1200w"
    sizes="(max-width: 600px) 100vw, 600px"
    width="800"
    height="533"
    alt="A black cat sitting on a sofa"
    loading="lazy"
  >
</picture>
```

| Element | Role |
|---|---|
| `type="image/webp"` | The **MIME type** (a standard name for a file format) of the source: the browser skips the source if it does not know it |
| `srcset="... 400w"` | The available files and their real width in pixels |
| `sizes="(max-width: 600px) 100vw, 600px"` | If the window is 600 pixels wide or less, the image fills the whole width; otherwise it takes 600 pixels |
| `<img src=...>` | The fallback: it is required, it is the one that is displayed and it carries `alt`, `width` and `height` |
| [`loading="lazy"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading) | The browser delays loading until the image gets close to the screen |

Example of the browser's reasoning: on a phone whose window is 390 pixels wide, with a screen that has 3 physical pixels per **CSS pixel** (the unit of length of the page, independent of the screen's sharpness; this ratio is the **pixel density**), `100vw` equals 390 CSS pixels, which means 1,170 physical pixels to fill. The smallest file in the list that is large enough is `cat-1200`. The browser remains free in its choice (it can also take the quality of the network into account): `srcset` and `sizes` are **hints**, not orders. The exact behavior in a real browser was not observed for this chapter.

> **Pitfall:** `loading="lazy"` on the highest image of the page (the one you see without scrolling) delays it instead of speeding it up. Reserve it for images placed lower down.

### On the server: the `Accept` header

An [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) request carries **headers**, small "name: value" lines that describe the request. The [`Accept`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept) header lists the content types that the client can read. A browser that can read WebP announces it by putting `image/webp` in this header. This is a very common behavior, but it was not observed here: check it in the "Network" tab of the browser's developer tools (the built-in panel, often opened with the F12 key, which lists each request). The server answers with the format that fits. The test below uses the code of the next section: to replay it, first create `styles.py` and the `originals/` folder, prepared in [the section on the trap of exposed on-demand generation](#the-trap-of-exposed-on-demand-generation), then run `python3 server.py` from the same folder. The server is the [`http.server`](https://docs.python.org/3/library/http.server.html) module of Python; `127.0.0.1` is the address of the machine itself and `58431` a **port**, the number that tells this server apart from the others on the machine (see [local server](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement)). `GET` is the HTTP method that requests a file. The `try` / `except urllib.error.HTTPError` block catches the server's error response (see [error handling in Python](/?c=langages&s=python&p=gestion-des-erreurs)); `threading` runs the server in the background while the client queries it.

```python
# server.py: serves /images/<name>?w=<width> and chooses the format according to Accept
import threading                                 # starts the server in the background
import urllib.error                              # HTTP errors on the client side
import urllib.request                            # HTTP client of the standard library
from http.server import BaseHTTPRequestHandler, HTTPServer   # minimal HTTP server
from urllib.parse import parse_qs, urlparse      # splits an address

import styles                                    # the module of the next section

TYPES = {"webp": "image/webp", "jpeg": "image/jpeg"}     # extension -> MIME type


class Handler(BaseHTTPRequestHandler):
    """Answers each GET request received."""

    def do_GET(self):
        url = urlparse(self.path)                # splits the path and the parameters
        name = url.path.removeprefix("/images/")  # name of the requested file
        try:                                     # w may not be a number
            width = int(parse_qs(url.query).get("w", ["0"])[0])    # w parameter, 0 if absent
        except ValueError:                       # e.g. ?w=abc
            width = 0                            # outside the list: refused like the others
        path = styles.serve(name, width, self.headers.get("Accept", ""))
        if path is None:                         # request refused by styles.py
            self.send_error(400, "size or file refused")     # code 400: invalid request
            return                               # nothing else to send
        body = path.read_bytes()                 # content of the derivative
        self.send_response(200)                  # code 200: success
        mime_type = TYPES[path.suffix[1:]]       # MIME type from the file extension
        self.send_header("Content-Type", mime_type)              # format actually sent
        self.send_header("Content-Length", str(len(body)))       # size in bytes
        self.send_header("Vary", "Accept")       # the response depends on the Accept header
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.end_headers()                       # end of the headers
        self.wfile.write(body)                   # sends the file

    def log_message(self, *arguments):
        pass                                     # no log in the test


server = HTTPServer(("127.0.0.1", 58431), Handler)     # listens on the local machine only
threading.Thread(target=server.serve_forever, daemon=True).start()   # starts in parallel

TESTS = (                                        # (Accept header, value of the w parameter)
    ("image/webp,*/*", 800),
    ("image/png,*/*", 800),
    ("*/*", 777),
    ("*/*", "abc"),
)
for accept, width in TESTS:
    request = urllib.request.Request(
        f"http://127.0.0.1:58431/images/cat.jpg?w={width}", headers={"Accept": accept}
    )                                            # simulates a browser announcing Accept
    try:                                         # an error response raises an exception
        with urllib.request.urlopen(request) as response:    # sends the request
            body = response.read()               # reads the response
            print(response.status, response.headers["Content-Type"], len(body),
                  response.headers["Vary"], response.headers["Cache-Control"])
    except urllib.error.HTTPError as error:      # error code received
        print(error.code, error.reason)          # shows the code and the reason
server.shutdown()                                # stops the test server
```

Output obtained:

```text
200 image/webp 18376 Accept public, max-age=31536000, immutable
200 image/jpeg 33981 Accept public, max-age=31536000, immutable
400 size or file refused
400 size or file refused
```

The same path (`/images/cat.jpg?w=800`) received an 18,376-byte WebP when `image/webp` was in `Accept`, and a 33,981-byte JPEG otherwise. The sizes differ slightly from the previous table, because this server starts from the `source.jpg` file (already compressed) and not from the original PNG. The width 777, which is not in the list, was refused, just like the value `abc`, which is not a number.

| Response header | Role | If we forget it |
|---|---|---|
| [`Content-Type`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) | Tells the browser which format it receives | It may guess wrong or refuse to display the image |
| [`Vary: Accept`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary) | Tells the caches: "my response changes according to the `Accept` header" | A shared cache may send a WebP to a browser that cannot read it |
| [`Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) | How long the browser keeps the file without asking for it again | Every visit downloads the image again |
| [`Content-Length`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length) | Size of the response body, in bytes | The browser does not know where the response ends |

In `public, max-age=31536000, immutable`, `public` allows shared caches (such as a CDN) to keep a copy, `max-age=31536000` sets the duration in seconds (31,536,000 s, that is one year), and `immutable` says that the file will not change: the browser does not check it again before the end of this duration.

> **Pitfall:** `Cache-Control: ... immutable` on an address that does not change when the original changes. If we replace `cat.jpg`, visitors keep the old version for a year. Put a version or a fingerprint (a code computed from the content of the file) in the address (`cat.jpg?v=3`, or `cat.3f9a1c.jpg`) each time the original changes.

> **Pitfall:** a [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) (a network of copies of the content placed close to visitors) does not always respect `Vary`. Check the setting of the one you use, or prefer the choice by `<picture>`, where each address has a single content.

## Ahead of time or on demand

| | Ahead of time (when the original is sent) | On demand (at the first request) |
|---|---|---|
| When the derivatives exist | As soon as the original is saved | After the first request for each size |
| First visit | Fast: the file is already there | Slower: it must be made (of the order of 140 ms for a 1200 px WebP here) |
| Disk | All the planned derivatives, even those never requested | Only those that are requested |
| Changing size or format | Redo all the derivatives of all the images | Clear the cache: the derivatives are made again on their own |
| Risk | None linked to visitors | A visitor can trigger creations at will |

On the test machine, the first call for a size took **of the order of 140 ms** (opening the original, resizing, writing) and the next one **less than a millisecond**, because the derivative was already on disk. The gain from the cache is therefore very large, and making the file is paid only once. But the last row of the table is the central trap of this chapter.

### The trap of exposed on-demand generation

If the address accepts any width (`/images/cat.jpg?w=1000`, `?w=1001`, `?w=1002`, ...), anyone can ask for a different width with each request. Each request makes a new file, stores it, and never benefits from the cache. This is a **denial of service**: an attack that steals nothing but exhausts the server (processor, memory, disk) until the legitimate visitors are no longer served. The chapter [overload and application-level denial of service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif) covers this family; limiting the number of requests per client is explained in [web API security](/?c=securite&s=cybersecurite&p=securite-api-web), but it is not enough here: each request, taken alone, looks normal.

The defense is an **allowed size list**: any request outside the list is refused before the slightest computation. Here is the complete module used by the previous server, and its test.

```python
# styles.py: on-demand derivatives, allowed size list, disk cache
import os                                        # os.replace: renames in one block
from pathlib import Path                         # handling file paths

from PIL import Image                            # reading and resizing images

ORIGINALS_DIR = Path("originals")                # where the originals live
CACHE_DIR = Path("cache")                        # where the made derivatives live
ALLOWED_WIDTHS = (400, 800, 1200)                # the only sizes that we make


def choose_format(accept):
    """Chooses webp if the browser announces it in Accept, otherwise jpeg."""
    return "webp" if "image/webp" in accept else "jpeg"     # test on the header's text


def serve(name, width, accept, strict_list=True):
    """Returns the derivative's path (made if missing), or None if refused."""
    if strict_list and width not in ALLOWED_WIDTHS:  # size outside the list?
        return None                              # refused before any computation
    original = (ORIGINALS_DIR / name).resolve()  # real path, ".." resolved
    if ORIGINALS_DIR.resolve() not in original.parents or not original.is_file():
        return None                              # outside the folder, or missing file
    format_ = choose_format(accept)              # webp or jpeg, depending on the browser
    target = CACHE_DIR / f"{original.stem}-{width}.{format_}"   # name (requested width)
    if not target.exists():                      # not in the cache: we make it
        CACHE_DIR.mkdir(exist_ok=True)           # creates the cache folder if needed
        image = Image.open(original).convert("RGB")      # opens the original
        width = min(width, image.width)          # never wider than the original
        height = round(image.height * width / image.width)    # proportions kept
        temporary = target.with_suffix(f".{os.getpid()}.tmp")  # unique name (per process)
        reduced = image.resize((width, height), Image.LANCZOS)  # resizing
        reduced.save(temporary, format_.upper(), quality=80)    # writes the temporary file
        os.replace(temporary, target)            # one-block rename: never a half file
    return target                                # path of the derivative, ready to use
```

Before running anything, the originals must be prepared. In this example, they are in a folder `originals/`, which contains `cat.jpg`, a copy of `source.jpg` (made by `derive.py`). The two following commands, typed in the terminal from the folder where `styles.py` and `source.jpg` are, create this folder (`mkdir`, *make directory*) then copy the image into it under the name `cat.jpg` (`cp`, *copy*).

```bash
# creates the originals/ folder next to styles.py
mkdir originals
# copies source.jpg into this folder, under the name cat.jpg
cp source.jpg originals/cat.jpg
```

The parameter `strict_list=False` exists only to **measure the attack**: a real application never offers this option. The module also respects the rule "never enlarge": `min(width, image.width)` caps the width at that of the original (the file then keeps the requested width in its name). Here is the test.

```python
# test_styles.py: cache, negotiation, refusal, then 200 invented widths
import shutil                                    # shutil.rmtree empties the cache folder
import time                                      # stopwatch
from pathlib import Path                         # list of the files in the cache

import styles                                    # the module above

shutil.rmtree("cache", ignore_errors=True)       # starts from an empty cache
print(styles.serve("cat.jpg", 800, "image/webp,image/*"))      # webp announced
print(styles.serve("cat.jpg", 800, "image/png,*/*"))           # webp absent from Accept
print(styles.serve("cat.jpg", 777, "image/webp"))              # size outside the list
print(styles.serve("../styles.py", 800, "image/webp"))         # leaving the folder

start = time.perf_counter()                      # starts the stopwatch
styles.serve("cat.jpg", 1200, "image/webp")      # first call: it makes the file
cold = (time.perf_counter() - start) * 1000      # duration in milliseconds
start = time.perf_counter()                      # starts again
styles.serve("cat.jpg", 1200, "image/webp")      # second call: already in the cache
hot = (time.perf_counter() - start) * 1000       # duration in milliseconds
print(f"cold {cold:.1f} ms, hot {hot:.3f} ms")

shutil.rmtree("cache", ignore_errors=True)       # empty cache before the simulated attack
start = time.perf_counter()                      # starts the stopwatch
for width in range(1000, 1200):                  # 200 distinct widths
    styles.serve("cat.jpg", width, "image/webp")             # with the list
print("with list:", len(list(Path("cache").glob("*"))), "files",
      round(time.perf_counter() - start, 3), "s")

shutil.rmtree("cache", ignore_errors=True)       # empty cache again
start = time.perf_counter()                      # starts the stopwatch
for width in range(1000, 1200):                  # the same 200 widths
    styles.serve("cat.jpg", width, "image/webp", strict_list=False)    # without the list
files = list(Path("cache").glob("*"))            # files made
total_bytes = sum(f.stat().st_size for f in files)   # total size on disk
print("without list:", len(files), "files", total_bytes, "bytes",
      round(time.perf_counter() - start, 3), "s")
```

Output obtained (the durations vary from one run to another):

```text
cache/cat-800.webp
cache/cat-800.jpeg
None
None
cold 136.1 ms, hot 0.133 ms
with list: 0 files 0.0 s
without list: 200 files 4893402 bytes 25.663 s
```

| Request | Result | Why |
|---|---|---|
| 800 px with `image/webp` in `Accept` | `cat-800.webp` | Format announced by the client |
| 800 px without `image/webp` | `cat-800.jpeg` | Fallback for the clients that cannot read WebP |
| 777 px | `None` (refused) | Width absent from `ALLOWED_WIDTHS` |
| `../styles.py` | `None` (refused) | The path leaves the originals folder |
| 200 invented widths, with list | 0 files, 0 s | Each request is refused before any computation |
| 200 invented widths, without list | 200 files, 4,893,402 bytes, about 26 s | Each request triggers a full creation |

200 requests cost about 26 seconds of computation and almost 5 megabytes on disk: about 130 ms and 24,000 bytes each. By simple proportion (calculation, not measurement), 10,000 requests of this kind would cost about 21 minutes of computation on a single processor core (an independent calculation unit) and about 245 megabytes of disk, for a single image. With several thousand originals, the disk and the processor saturate. The size list brings this cost down to zero, and it also bounds the number of files in the cache: (number of originals) × (number of sizes) × (number of formats).

| Defense | What it prevents | Limit |
|---|---|---|
| **Allowed size list** | Invented widths | The useful sizes must be planned in advance |
| Signed token in the address (a code computed with a server secret) | Any address not produced by the server itself | Requires secrets management ([secrets management](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |
| Limiting the number of requests per client | A single client that floods the server | Useless against thousands of clients, or against a single very costly request |
| Capping the size of the original (in pixels) | A booby-trapped image that explodes in memory once decoded | To be set at upload too (see [file uploads](/?c=securite&s=cybersecurite&p=upload-de-fichiers)) |
| Pre-generating at upload of the original | Any abuse on demand | Disk occupied by derivatives that are never served |

Writing a temporary file and then calling `os.replace` fixes another, more discreet trap: two simultaneous requests for the same missing derivative. Without this precaution, the second one could read a half-written file. With a temporary name unique to each process (a server with several threads of execution, see [parallelism](/?c=qualite-performance-et-outils&s=performance&p=parallelisme), should also put the thread identifier in it, or use the `tempfile` module) and an **atomic** renaming (which takes place in one indivisible step, with no visible intermediate state), each reader sees either nothing or the complete file. The original's name (`name`) received from outside is checked against **path traversal** (a request such as `../styles.py` that leaves the intended folder), explained in [file uploads](/?c=securite&s=cybersecurite&p=upload-de-fichiers). In `styles.py`, `.resolve()` turns the requested path into a full path by erasing the `..` (see [directory trees and paths](/?c=fondamentaux&s=bases-de-l-informatique&p=arborescence-et-chemins)), and `.parents` lists the folders that contain this path: if the originals folder is not among them, the request leaves the intended folder and is refused (see also [`pathlib`](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)).

## Reserving space

As long as the image has not arrived, the browser does not know its size. Without any indication, it displays the page with an empty space, then, when the image arrives, it pushes the text below it down: this is the **layout shift** ([*layout shift*](https://web.dev/articles/cls)), which is very unpleasant (you click a button that has moved). The solution is to declare the dimensions in advance.

```html
<!-- width and height in pixels: the browser computes the 800/533 ratio -->
<img src="cat-800.jpg" width="800" height="533" alt="A black cat">
```

The layout rule below is written in CSS.

```css
/* rule applied to all images */
img {
  max-width: 100%;   /* the image never exceeds its container */
  height: auto;      /* the height follows the width, keeping the declared ratio */
}
```

| Element | Role |
|---|---|
| `width="800" height="533"` | Makes the **aspect ratio** (width / height: 800 / 533, about 1.5) known before the file arrives |
| `max-width: 100%` | Shrinks the image when its container is narrower than 800 pixels |
| `height: auto` | Recalculates the height with the ratio, so that the image is not squashed |
| [`aspect-ratio: 3 / 2`](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) (CSS) | Another way to reserve the space when the HTML cannot be modified |

The `width` and `height` attributes do not describe the final display size (the CSS decides that): they only give the ratio. They must therefore match that of the file, **across all the derivatives**: if the derivatives keep the proportions (the rule of the previous section), the same pair suits every size. The shift was not observed in a browser for this chapter: the mechanism is the one described in [Links and Images](/?c=langages&s=html&p=liens-et-images).

## An example in a content management system: Drupal

Everything above can be found in **content management systems** (CMS: software that lets you publish pages without writing code). **Drupal**, a CMS written in [PHP](/?c=langages&s=php&p=php), is only an example here: what matters is the principle, which holds for any tool. The names below are checked against the Drupal 11.x source code; the reference is the official documentation ([drupal.org/docs](https://www.drupal.org/docs)).

| Principle of the chapter | What Drupal offers |
|---|---|
| Derivative at a given size | An **image style**: a name (for example `thumbnail`) associated with a series of **effects** (resize, crop, convert) |
| On-demand creation, disk cache | The derivative is made at the first request for the style's address, then kept in the files folder |
| Allowed size list | Only the styles defined by the administrator exist; a derivative's address carries a **token** (an address parameter) computed from the path and a private key of the site; without it, Drupal answers with a `404` error. This token limits the abusive creation of derivatives (it protects against mass generation), it does not check the origin of the request |
| Conversion to another format | A **conversion** effect that changes the output extension, for example to WebP |
| `<picture>`, `srcset`, `sizes` | The **Responsive image** module, which generates these tags from image styles |
| WebP converters | Core already knows how to convert to WebP, with the conversion effect (`image_convert`); contributed modules (for example "WebP") add in addition a WebP copy of each derivative |

Two warnings specific to this kind of tool. The conversion depends on the image library that PHP uses: if it was not compiled with WebP support, the effect is not available. And the "insecure addresses" setting (`image.settings:allow_insecure_derivatives`, disabled by default) does not cancel the token for paths beginning with `styles/`, which always require it; it removes it only for the other paths. Enabling it remains discouraged: it increases the exposure to abusive derivative generation, hence to denial of service (saturating the server with a flood of requests).

## Pitfalls

| Pitfall | Consequence | Fix |
|---|---|---|
| Sending the original from the camera | Disproportionate weight and memory | Make derivatives at the widths that are really displayed |
| Reducing the weight without reducing the pixels | Memory stays high | Reduce the dimensions first, then choose the format |
| Enlarging a small original | Large file, blurry image | Cap the width of the derivative at the width of the original |
| Comparing "quality 80" of two formats | Wrong conclusion | Compare at equal fidelity (PSNR or eye), or at equal size |
| Photo as PNG | File several times heavier than the JPEG | PNG for logos, screenshots and diagrams; JPEG or WebP for photos |
| Logo with transparency as JPEG | Saving fails, or opaque background | PNG or WebP |
| Accepted sizes without limit | Disk and processor exhausted, denial of service | Allowed size list, checked before any computation |
| `Vary: Accept` forgotten | A cache serves a WebP to a browser that cannot read it | Send `Vary: Accept`, or use `<picture>` |
| `immutable` without a version in the address | The old image stays displayed for a year | Put a version or a fingerprint in the address |
| Original name not checked | Reading a file outside the intended folder | Resolve the path and check that it stays in the originals folder |
| Writing the derivative directly at its final location | A reader reads a half-written file | Write a temporary file, then rename it |
| `width` and `height` missing | Layout shift when the image arrives | Declare them, with `height: auto` in CSS |
| `loading="lazy"` on the top-of-page image | Main image delayed | Reserve `lazy` for the images that start off-screen |

## Best practices

| Practice | Detail |
|---|---|
| Keep the original intact | All the derivatives are made again from it; never re-encode a derivative |
| Choose a small number of widths | A short list (for example 400, 800, 1200) covers most uses and bounds the cache |
| Offer WebP with a fallback | A WebP source and a JPEG fallback image in `<picture>` |
| Describe the context with `sizes` | Without `sizes`, the browser assumes the image fills the whole width of the window |
| Measure on your own images | Each content behaves differently; see [measure before optimizing](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) |
| Put the derivatives behind a CDN | The [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) keeps a copy close to the visitor; the principle of the disk cache is the same, see also [avoiding redundant recomputation](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) |
| Refuse before computing | The checks on size, name and format happen before the original is opened |
| Declare `width` and `height` | To reserve the space and avoid the layout shift |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | An image costs weight, decoding and memory; memory depends on the pixels (width × height × 4 bytes), not on the file. We make derivatives at several widths, kept on disk. On the test image, lossy WebP was both lighter and more faithful than JPEG at the same quality value; PNG and WebP keep transparency, JPEG does not. The right file is chosen with `<picture>` and `srcset`/`sizes`, or with the `Accept` header together with `Vary: Accept`. |
| **Pitfalls to avoid** | Generating any size on demand: a visitor can saturate the processor and the disk. Comparing quality values of different formats. A photo as PNG, a transparent logo as JPEG. A one-year cache on an address that does not change. Undeclared dimensions, which push the page around. |
| **Best practices** | Keep the original, accept only a list of sizes, refuse before computing, write by atomic renaming, offer WebP with a fallback format, declare `width` and `height`, and measure on your own images. |
