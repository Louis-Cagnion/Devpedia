---
order: 2
---

# El formato Wavefront .obj y el modelo de Phong

El [capítulo anterior](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) simula la 3D a partir de un mapa 2D, sin cargar nunca una malla real. Un motor de renderizado 3D moderno (OpenGL, Vulkan, Metal) parte, en cambio, de un objeto modelado en una herramienta como Blender, exportado a un archivo de texto que hay que leer y transformar en datos que la tarjeta gráfica pueda usar.

## El formato .obj: una instrucción por línea

Un archivo **.obj** (formato Wavefront) enumera, línea a línea, los datos geométricos de un objeto. Cada línea empieza con una palabra clave que indica el tipo de instrucción:

| Prefijo | Contenido | Ejemplo |
|---|---|---|
| `v` | Un vértice, en coordenadas x y z | `v 0.232406 -1.216630 1.133818` |
| `vt` | Una coordenada de textura (para aplicar una imagen sobre la superficie) | `vt 0.5 0.8` |
| `vn` | Un vector normal (orientación de una superficie, útil para la iluminación) | `vn 0.0 1.0 0.0` |
| `o` | El nombre del objeto que empieza en esta línea | `o Cube` |
| `f` | Una cara, que conecta varios vértices ya declarados | `f 16 2 3 17` |
| `mtllib` / `usemtl` | Referencia a un archivo de materiales y el material que se aplica | `mtllib 42.mtl` |
| `s` | Activa/desactiva el suavizado de normales para las caras siguientes (grupo de suavizado) | `s off` o `s 1` |

> **Trampa:** los índices usados en una línea `f` empiezan en **1**, no en 0. `f 16 2 3 17` designa el 16.º vértice declarado por una línea `v`, no el 17.º. Es un error clásico de desfase de uno (*off-by-one*) para quien escribe su primer analizador de este formato, ya que la indexación habitual de los arrays empieza en 0 en la mayoría de los lenguajes.

## Caras con un número variable de vértices

Una línea `f` no conecta necesariamente tres vértices: un programa de modelado 3D suele exportar caras de 4 vértices (cuadriláteros, o *quads*), incluso más. Pero la tarjeta gráfica solo sabe dibujar triángulos de forma nativa (una superficie de más de 3 vértices no tiene garantía de ser plana). Por eso hay que **triangular**: dividir cada cara de 4 o más vértices en varios triángulos, un paso propio del procesamiento del archivo, distinto de su simple lectura.

```text
Cara leida del archivo:              Una vez triangulada:
f 1 2 3 4                            triangulo 1 2 3
(un quad, 4 vertices)                triangulo 1 3 4
```

Este método (conectar sistemáticamente el primer vértice con cada par de vértices siguientes) se llama **triangulación en abanico** (*fan triangulation*). Es simple y rápido, pero supone que la cara es **convexa**: en una cara cóncava, uno de los triángulos producidos puede cubrir una zona que no forma parte de la forma real (el triángulo "atraviesa" la muesca cóncava en lugar de rodearla).

Para una cara potencialmente cóncava, el algoritmo de referencia es el **ear clipping** (*recorte de orejas*): en lugar de fijar un vértice de referencia, retira un vértice a la vez, aceptándolo solo si el triángulo que forma con sus dos vecinos está bien orientado (producto vectorial local comparado con la normal de la cara, ver [Vectores y producto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) Y no contiene ningún otro vértice de la cara. Como el polígono se va reduciendo con cada retiro, una [lista doblemente enlazada circular](/?c=langages-de-programmation&s=c&p=listes-chainees) es una estructura bien adaptada para implementarlo: cada retiro solo requiere reconectar los dos vecinos del vértice retirado, sin desplazar ningún array.

> **Buena práctica:** mantener la lectura del archivo (rellenar una estructura con los datos brutos) y la triangulación en dos funciones separadas en lugar de fusionarlas. Cada una tiene entonces una sola razón para cambiar (ver [responsabilidad única y bajo acoplamiento](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)), y la triangulación puede probarse de forma independiente al parser.

### Comprobar que ningún vértice queda atrapado en la oreja

La prueba de orientación por sí sola no basta: un triángulo correctamente orientado puede aun así "engullir" otro vértice del polígono, que debería quedar fuera. Hace falta entonces una segunda prueba, aplicada a cada vértice restante del polígono (fuera de los 3 vértices del triángulo candidato): la **prueba del mismo lado** (*same-side test*), que comprueba si un punto dado se encuentra dentro de un triángulo.

Principio: un punto `P` está dentro del triángulo `(A, B, C)` si y solo si se encuentra del mismo lado de cada uno de los 3 lados. Esta prueba reutiliza exactamente la misma primitiva geométrica que la prueba de orientación (producto vectorial de dos vectores, producto escalar con la normal de referencia): solo cambian los puntos utilizados de una llamada a otra.

```text
lado 1 = (B-A) x (P-A) . normal
lado 2 = (C-B) x (P-B) . normal
lado 3 = (A-C) x (P-C) . normal

P esta dentro si los 3 resultados tienen el mismo signo (todos positivos, o todos negativos)
```

> **Buena práctica:** una sola función utilitaria (producto vectorial de 2 vectores + producto escalar con la normal) basta para implementar tanto la prueba de orientación COMO las 3 pruebas de lado: solo cambian los puntos pasados como parámetro. Evitar duplicar este cálculo en varias funciones.

### Comprobar una triangulación: la fórmula `n - 2`

Sea cual sea el algoritmo (abanico o ear clipping) y la forma del polígono (convexo o cóncavo), triangular un polígono simple de `n` vértices siempre produce exactamente `n - 2` triángulos (consecuencia directa del [teorema de las dos orejas](https://en.wikipedia.org/wiki/Two_ears_theorem) de Meisters (1975), que garantiza que todo polígono simple que no sea un triángulo tiene al menos dos "orejas" recortables). Un recuento distinto de `n - 2` a la salida es prueba segura de un error; un recuento correcto no basta por sí solo para probar que el recorte es geométricamente correcto (hay que comprobarlo por separado, por ejemplo dibujando el polígono y sus diagonales).

## El archivo .mtl y el modelo de Phong

Un `.obj` suele referenciar un archivo **.mtl** que describe la apariencia de las superficies:

```text
newmtl Material
Ns 96.078431
Ka 0.000000 0.000000 0.000000
Kd 0.640000 0.640000 0.640000
Ks 0.500000 0.500000 0.500000
illum 2
```

| Campo | Significado |
|---|---|
| `Ka` | Color ambiental: el color percibido incluso sin luz directa |
| `Kd` | Color difuso: el color base de la superficie bajo una luz directa |
| `Ks` | Color especular: el color del reflejo brillante |
| `Ns` | Exponente especular (*shininess*): cuanto más alto, más pequeño y nítido es el reflejo |

Estos cuatro valores corresponden exactamente a los términos del **modelo de Phong** (*Phong reflection model*), un algoritmo de iluminación clásico en síntesis de imagen que descompone la luz recibida por una superficie en tres componentes combinadas: ambiental, difusa y especular.

> **Trampa:** un archivo `.mtl` suele definir un único material (por tanto un único color) para todo el objeto. Si se necesita distinguir visualmente subpartes diferentes (por ejemplo un color por cara), esa información debe venir de otro lado: el `.mtl` no la proporciona.

## La indexación combinada `v/vt/vn` y la costura UV

Los ejemplos anteriores (`f 16 2 3 17`) solo muestran un índice por vértice, el de la posición (`v`). Una línea `f` real suele referenciar varias listas a la vez, un índice por esquina de cara y por lista, separados por `/`:

| Sintaxis | Referencia |
|---|---|
| `f 1 2 3` | Solo posición (usado hasta ahora para simplificar) |
| `f 1/1 2/2 3/3` | Posición **y** coordenada de textura |
| `f 1/1/1 2/2/2 3/3/3` | Posición, textura **y** normal |
| `f 1//1 2//2 3//3` | Posición y normal, sin textura (el `//` deja vacío el índice de textura) |

Por qué un índice por lista en lugar de un único índice compartido: `v` (posiciones) y `vt` (coordenadas de textura) son dos listas independientes, rellenadas por separado por la herramienta de exportación, y no tienen ninguna razón para tener la misma longitud ni el mismo orden. Un índice único no podría designar a la vez "el 5.º vértice" y "la 5.ª coordenada de textura" si esas dos listas no coinciden término a término.

> **Costura UV (*UV seam*):** un mismo vértice 3D (un único índice `v`) puede necesitar una coordenada de textura distinta según la cara que lo referencie. Ejemplo concreto: las 3 caras de un cubo que se encuentran en una esquina comparten ese vértice, pero cada cara se despliega en un lugar diferente de la imagen 2D usada como textura -- por tanto con un `vt` diferente. Un índice `v` único combinado con un índice `vt` por esquina de cara permite representar este caso; un índice único compartido entre posición y textura no lo permitiría.

> **Trampa:** almacenar las coordenadas de textura indexadas únicamente por vértice (un array `vt_del_vertice[indice_v]`) falla silenciosamente en una costura UV: cada cara que referencia ese vértice con un `vt` diferente sobrescribe el valor anterior, solo sobrevive la última escritura. El dato debe indexarse por **par** (`v`, `vt`), no por `v` solo -- por eso un motor de renderizado suele duplicar los vértices en cada costura UV encontrada (un vértice único enviado a la tarjeta gráfica por cada par `(v, vt[, vn])` distinto, en lugar de un vértice por posición).

## El archivo de imagen referenciado por el `.mtl`

El `.mtl` no solo describe colores lisos: la línea `map_Kd` referencia en él un archivo de imagen (PNG, JPEG...) usado como textura difusa:

```text
newmtl Material
map_Kd caisse.png
Kd 0.640000 0.640000 0.640000
```

Al dibujar un triángulo, cada coordenada `vt` (un par `(u, v)` con `u` y `v` entre 0 y 1) designa un punto de esa imagen, sea cual sea su resolución real en píxeles: `(0, 0)` una esquina de la imagen, `(1, 1)` la esquina opuesta. La tarjeta gráfica interpola esas coordenadas entre los 3 vértices de un triángulo para saber, píxel a píxel, qué punto de la imagen mostrar. Si `map_Kd` está ausente, `Kd` sigue siendo el único color usado y los `vt` del archivo no tienen entonces ningún efecto visual.

## Los grupos de suavizado (`s`)

`s` no afecta a la geometría: solo controla el cálculo de las **normales** usadas para la iluminación.

- `s off` (equivalente a `s 0`): cada cara conserva su propia normal plana -> renderizado con facetas visibles (*flat shading*).
- `s 1`, `s 2`... : las caras que comparten el mismo número de grupo tienen sus normales promediadas en los vértices que comparten -> renderizado suavizado (*smooth shading*, también llamado *Gouraud shading*).

```text
s 1
f 1 2 5
f 2 3 5
f 3 4 5
f 4 1 5
```

Las 4 caras anteriores comparten todas el vértice `5` y el mismo grupo de suavizado: su normal será el promedio de las 4 normales de cara, dando un aspecto redondeado a esa punta en lugar de una arista marcada.

> **Trampa:** `s`, al igual que `usemtl`, es una **directiva de estado**: se aplica a todas las líneas `f` siguientes, hasta la próxima `s`/`usemtl` encontrada en el archivo. Un parser debe entonces recordar "qué grupo de suavizado y qué material están activos en este momento" a medida que avanza la lectura, y asociarlos a cada cara en el momento en que se lee: esta información nunca aparece en la propia línea `f`.

## `o` no es una directiva de estado como `s`/`usemtl`

`o` (y su primo `g`, para subgrupos) se limita a etiquetar un conjunto de geometría bajo un nombre de objeto, por organización. A diferencia de `s`/`usemtl`, no cambia **nada** en la interpretación de las líneas siguientes.

> **Trampa:** la numeración de los vértices (`v`) sigue siendo **global a todo el archivo**: nunca vuelve a empezar en 1 con cada nuevo `o`. En un archivo con varios objetos, las caras del segundo objeto continúan por tanto la numeración del primero:
> ```text
> o Cube1
> v 0 0 0
> v 1 0 0
> v 0 1 0
>
> o Cube2
> v 5 5 5   <- 4to vertice del ARCHIVO, no el 1ro de Cube2
> v 6 5 5
> v 5 6 5
>
> f 4 5 6   <- hace referencia a los vertices de Cube2
> ```
> Reiniciar un contador de vértices en cada `o` rompe silenciosamente la indexación de todas las caras en cuanto un archivo contiene más de un objeto.

## Leer un `.obj` con tolerancia

Los archivos `.obj` vienen de programas distintos, que no siguen todos la misma variante del formato. Un analizador (*parser*) robusto **acepta con amplitud** (toda variante que tenga sentido) y **rechaza con un mensaje preciso** (archivo, línea, valor erróneo) todo lo demás, en lugar de fallar o de seguir en silencio con datos falsos.

| Variante encontrada | Qué hacer |
|---|---|
| `v x y z w` (4 valores, `w` es un peso, 1.0 si falta) | Leer `w` y luego ignorarlo |
| `v x y z r g b` (6 valores, color por vértice, extensión de algunos exportadores) | Conservar los 3 primeros, ignorar o guardar el color |
| `vt u`, `vt u v`, `vt u v w` (1 a 3 valores) | `v` vale 0 si falta, `w` no sirve para una imagen 2D |
| Directiva desconocida (`l`, `p`, `cstype`...), línea vacía, comentario `#` | Ignorar la línea, sin error |
| Menos valores de los previstos, texto en lugar de un número, `1e999` | Rechazar, nombrando el archivo, la línea y el valor recibido |

```c
/* Lee 3, 4 o 6 números de una línea «v»; devuelve cuántos leyó, -1 si es inválida. */
static int parse_vertex(const char *s, double out[6])
{
	int n = 0;
	char *end;

	while (n < 6)
	{
		errno = 0;
		out[n] = strtod(s, &end);        /* lee un número y avanza hasta su final */
		if (end == s)                    /* nada legible: fin de los números */
			break;
		if (errno || !isfinite(out[n]))  /* 1e999, inf o nan: rechazado */
			return -1;
		s = end;
		n++;
	}
	while (*s == ' ' || *s == '\t' || *s == '\r')  /* blancos de final de línea */
		s++;
	return (*s == '\0' && (n == 3 || n == 4 || n == 6)) ? n : -1;
}
```

Probada con `"1 2 3"` (3), `"1 2 3 1.0"` (4) y `"1 2 3 0.5 0.5 0.5"` (6): válidas. `"1 2"`, `"1 2 x"`, `"1e999 0 0"` y `"1 2 3 4 5"` devuelven -1. Se prefiere `strtod` a `atof`, que devuelve 0 con cualquier texto sin avisar de nada (véase [convertir un texto en número](/?c=langages-de-programmation&s=c&p=convertir-un-texte-en-nombre)).

### Finales de línea y BOM

| Caso | Qué contiene | Consecuencia si no se trata |
|---|---|---|
| LF (`\n`) | Final de línea Unix | Ninguna |
| CRLF (`\r\n`) | Final de línea Windows | Un `\r` queda pegado al final de la línea, es decir, dentro del último valor leído |
| CR (`\r`) solo | Final de línea de los Mac muy antiguos | `fgets` solo corta en `\n`: todo el archivo se convierte en una sola línea |
| BOM UTF-8 (bytes `EF BB BF` al inicio del archivo) | Marca de codificación, véase [codificación de textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) | Se pega a la primera directiva: `\xEF\xBB\xBFv` no es `v`, la línea se toma por una directiva desconocida, **el primer vértice desaparece sin error** y todos los índices de las caras se desplazan una unidad |

> **Buena práctica:** leer el archivo entero en memoria, saltar un posible BOM y cortar en los tres finales de línea (`\r\n`, `\r` y `\n`) en lugar de llamar a `fgets`: el mismo código trata entonces archivos de cualquier sistema.

## El formato PPM P6: una textura sin biblioteca

El [`map_Kd` del `.mtl`](#el-archivo-de-imagen-referenciado-por-el-mtl) designa una imagen. El **PPM** (*Portable PixMap*, [especificación](https://netpbm.sourceforge.net/doc/ppm.html)) es el formato de imagen más sencillo de leer a mano: una pequeña cabecera de texto, seguida de los píxeles en **binario** (bytes en bruto, que un editor de texto no muestra de forma legible). Su variante **P6** guarda tres canales (rojo, verde, azul) por píxel.

```text
P6                  <- número mágico: identifica el formato
# un comentario     <- opcional: # hasta el final de la línea, se ignora
640 480             <- ancho y alto, en píxeles
255                 <- maxval: valor máximo de un canal
<bytes binarios>    <- ancho x alto x 3 canales, fila a fila, de arriba abajo
```

| `maxval` | Bytes por canal | Para volver a 0 a 255 |
|---|---|---|
| 1 a 255 | 1 | `valor x 255 / maxval` |
| 256 a 65535 | 2, byte más significativo primero | `valor x 255 / maxval` (misma fórmula, valor de 16 bits) |

```c
/* Lee un entero de la cabecera PPM saltando blancos y comentarios; -1 si falta. */
static long read_header_int(FILE *f)
{
	int c;

	while ((c = fgetc(f)) != EOF)
	{
		if (c == '#')                    /* comentario: ignorado hasta el final de la línea */
			while ((c = fgetc(f)) != EOF && c != '\n' && c != '\r')
				;
		else if (!isspace(c))
			break;
	}
	if (!isdigit(c))
		return -1;
	long n = 0;
	for (; isdigit(c); c = fgetc(f))     /* el blanco que termina el número se consume */
	{
		n = n * 10 + (c - '0');
		if (n > 1000000)                 /* dimensión absurda: rechazada */
			return -1;
	}
	return n;
}
```

La función principal llama tres veces a `read_header_int` (ancho, alto, `maxval`):

```c
/* Devuelve ancho x alto x 3 bytes (0 a 255), o NULL con un mensaje en stderr. */
unsigned char *read_ppm(const char *path, int *w, int *h)
{
	FILE *f = fopen(path, "rb");                 /* «b»: modo binario, indispensable en Windows */
	if (!f)
		return fprintf(stderr, "%s: %s\n", path, strerror(errno)), NULL;
	if (fgetc(f) != 'P' || fgetc(f) != '6')
		return fprintf(stderr, "%s: no es un PPM P6\n", path), fclose(f), NULL;
	long width = read_header_int(f);             /* salta blancos y comentarios, -1 si falta */
	long height = read_header_int(f);
	long maxval = read_header_int(f);            /* consume el único blanco que sigue */
	if (width < 1 || height < 1 || maxval < 1 || maxval > 65535)
		return fprintf(stderr, "%s: cabecera inválida\n", path), fclose(f), NULL;
	size_t bytes = maxval < 256 ? 1 : 2;
	size_t count = (size_t)width * (size_t)height * 3;
	unsigned char *raw = malloc(count * bytes);
	unsigned char *out = malloc(count);
	if (!raw || !out || fread(raw, bytes, count, f) != count)
	{                                            /* truncado, o memoria insuficiente */
		fprintf(stderr, "%s: datos truncados o memoria insuficiente\n", path);
		return free(raw), free(out), fclose(f), NULL;
	}
	for (size_t i = 0; i < count; i++)
	{
		long v = bytes == 1 ? raw[i] : (raw[2 * i] << 8) | raw[2 * i + 1];
		out[i] = (unsigned char)((v * 255 + maxval / 2) / maxval);  /* redondeo al más cercano */
	}
	free(raw);
	fclose(f);
	*w = (int)width;
	*h = (int)height;
	return out;
}
```

Compilada con `-Wall -Wextra -pedantic` sin ninguna advertencia y probada con cuatro archivos: un PPM de 8 bits con comentario y un PPM de 16 bits dan ambos el píxel rojo `255 0 0`; un archivo cuyos datos se acaban demasiado pronto, un archivo `P5` (niveles de gris) y un archivo inexistente se rechazan, cada uno con su propio mensaje.

| Trampa | Por qué | Remedio |
|---|---|---|
| Saltar todos los blancos tras `maxval` | Un byte de píxel puede valer `0x20` o `0x0A` (un blanco): se tomaría por un espacio | Consumir **un solo** blanco y leer los datos tal cual |
| Archivo convertido a CRLF | Cada `\n` binario se vuelve `\r\n`: los datos crecen y se desplazan | Detectar el tamaño incoherente y rechazar |
| Archivo truncado | `fread` devuelve menos de lo previsto | Comparar la cuenta leída con la esperada |
| `ancho x alto x 3` enorme | El producto desborda o pide gigabytes | Acotar cada dimensión, calcular en `size_t` |
| Fila de abajo primero | El PPM guarda la primera fila **arriba**, OpenGL espera la primera fila **abajo** | Voltear la imagen verticalmente o invertir `v` |

## La normal de un polígono: el método de Newell

La prueba de orientación del ear clipping necesita la normal de la cara. El cálculo ingenuo (producto vectorial de las dos primeras aristas) falla de dos maneras: si los tres primeros vértices están alineados, el producto es el vector nulo; si la primera esquina es entrante (ángulo interior superior a 180 grados), la normal obtenida está invertida, así que todo el resto de la prueba es erróneo.

El **método de Newell** suma una contribución por arista, sobre **todo** el contorno, de modo que ningún vértice está privilegiado:

```text
para cada arista (a -> b) del polígono:
    nx += (a.y - b.y) * (a.z + b.z)
    ny += (a.z - b.z) * (a.x + b.x)
    nz += (a.x - b.x) * (a.y + b.y)
normal = (nx, ny, nz) / longitud         <- su longitud vale 2 veces el área del polígono
```

```c
/* Normal unitaria de un polígono (método de Newell); -1 si la superficie es nula. */
static int newell_normal(const double (*p)[3], int n, double out[3])
{
	double nx = 0, ny = 0, nz = 0;

	for (int i = 0; i < n; i++)
	{
		const double *a = p[i];
		const double *b = p[(i + 1) % n];      /* el último vértice se une al primero */
		nx += (a[1] - b[1]) * (a[2] + b[2]);
		ny += (a[2] - b[2]) * (a[0] + b[0]);
		nz += (a[0] - b[0]) * (a[1] + b[1]);
	}
	double len = sqrt(nx * nx + ny * ny + nz * nz);
	if (len == 0)                              /* vértices alineados o coincidentes */
		return -1;
	out[0] = nx / len;
	out[1] = ny / len;
	out[2] = nz / len;
	return 0;
}
```

Probado con un polígono en L cóncavo cuyos tres primeros vértices están alineados (`(0,0) (1,0) (2,0) (2,1) (1,1) (1,2)`, en el plano z = 0): el cálculo ingenuo da el vector nulo, Newell da `0 0 1`. Con solo tres vértices alineados devuelve -1: una cara de superficie nula se rechaza con su propio mensaje, no tiene normal. Para el producto vectorial, véase [Vectores y producto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire).

## Hacer robusto el ear clipping

El algoritmo descrito arriba es exacto con números exactos; los números de coma flotante (véase [representación de los flotantes](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)) obligan a tres precauciones:

| Precaución | Por qué |
|---|---|
| Hacer los predicados (orientación, mismo lado) en `double`, aunque los vértices se guarden en `float` | Cerca de cero, un `float` cambia el signo del producto vectorial: se rechaza una oreja válida, se acepta una inválida |
| Comparar con una tolerancia **relativa** (`abs(producto) <= epsilon x longitud1 x longitud2`), nunca con una constante absoluta | Una constante absoluta depende de la unidad del modelo (un objeto de 0,001 o de 1000 unidades) |
| Tratar aparte el vértice **alineado** con sus vecinos o situado **sobre una arista** del triángulo candidato | Ni dentro ni fuera: la prueba estricta lo acepta o lo rechaza al capricho del redondeo |

El corte se hace entonces en **dos pasadas**: una pasada estricta (una oreja debe ser estrictamente convexa y no contener ningún vértice interior ni vértice en su borde); si no encuentra ninguna oreja cuando quedan más de 3 vértices, una segunda pasada tolera los vértices situados exactamente en el borde. Si también falla, se rechaza la cara (degenerada o que se corta a sí misma) con un mensaje que nombra el archivo y la línea, en lugar de entrar en un bucle sin fin.

## Acelerar el ear clipping: examinar solo los vértices reflejos

La prueba «ningún vértice atrapado» recorre todos los vértices restantes, para cada oreja candidata, y cada recorte exige buscar una nueva: al menos `n x n` operaciones ([complejidad cuadrática](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)). Bastan dos términos para hacerlo mejor. El **giro** en un vértice `b` entre sus vecinos `a` y `c` es el producto escalar de la normal de la cara con el producto vectorial de `a->b` y `a->c` (véase [Vectores y producto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)): su signo indica hacia qué lado gira el contorno.

| Término | Significado | Signo del giro |
|---|---|---|
| Vértice **convexo** | El contorno gira en el sentido de la normal: ángulo interior inferior a 180 grados | `> 0` |
| Vértice **reflejo** (*reflex*) | El contorno gira en sentido contrario: ángulo interior superior a 180 grados, es una entrante | `<= 0` (un giro nulo, vértice alineado con sus vecinos, se clasifica aquí por precaución) |

En el polígono en L de la sección anterior, el vértice `(1,1)` es reflejo, `(1,0)` está alineado con sus vecinos (giro nulo) y los otros cuatro son convexos. Un polígono convexo no tiene ningún vértice reflejo.

### Por qué bastan los reflejos

**Si un vértice está dentro del triángulo de una oreja candidata, entonces un vértice reflejo también lo está.** Razonamiento: los dos lados del triángulo que tocan la punta `v` son aristas del polígono, que el contorno no puede cruzar (se cortaría a sí mismo). Un contorno que entra en el triángulo solo tiene la base `[prev, next]` para entrar y para salir. La zona comprendida entre este desvío y la punta `v` está bordeada únicamente por aristas del polígono, así que está dentro del polígono. El punto del desvío más cercano a `v` (`Q` abajo) tiene el interior del lado de `v` y forma un pico hacia él: su ángulo interior supera los 180 grados.

```text
            v           contorno que entra por la base, sube hasta Q y vuelve a bajar
           / \          Q: vértice del desvío más cercano a v
          /   \         el interior del polígono está del lado de v: Q es reflejo
         /  Q  \
        /  / \  \
   prev ----------- next
```

Consecuencia: la prueba del mismo lado solo se hace contra la lista de reflejos, que está vacía en un polígono convexo (ninguna prueba de punto).

### Mantener al día la lista de reflejos

| Momento | Qué ocurre | Coste |
|---|---|---|
| Al inicio | Una pasada: todo vértice con giro `<= 0` entra en el arreglo `reflex[]` | `n` |
| Tras recortar una oreja | Solo los dos vecinos de la punta recortada cambian de ángulo, y solo puede disminuir (un triángulo sale del polígono): un reflejo puede pasar a convexo, un convexo **nunca** vuelve a ser reflejo | 2 comprobaciones |
| Salida de la lista | [swap-remove](/?c=fondamentaux&s=algorithmes&p=swap-remove): el vértice es sustituido por el último. Cada nodo memoriza su posición `reflex_pos` en el arreglo para encontrarla sin recorrerlo | O(1) |

```c
typedef struct { int prev, next, reflex_pos; } Node;    /* reflex_pos: -1 si es convexo */

typedef struct
{
	const double (*p)[3];      /* posiciones de los vértices */
	double normal[3];          /* normal de la cara (método de Newell) */
	Node *node;                /* lista doblemente enlazada circular */
	int *reflex;               /* índices de los vértices reflejos */
	int n_reflex;
}	Ctx;

/* Giro en b entre a y c: > 0 convexo, < 0 reflejo, 0 alineado. */
static double turn(const double *a, const double *b, const double *c, const double nrm[3])
{
	double u[3] = {b[0] - a[0], b[1] - a[1], b[2] - a[2]};
	double v[3] = {c[0] - a[0], c[1] - a[1], c[2] - a[2]};

	return (u[1] * v[2] - u[2] * v[1]) * nrm[0]      /* producto vectorial u x v, */
		+ (u[2] * v[0] - u[0] * v[2]) * nrm[1]       /* luego producto escalar */
		+ (u[0] * v[1] - u[1] * v[0]) * nrm[2];      /* con la normal */
}

/* Prueba de los tres lados: q está en el triángulo (a, b, d), borde incluido. */
static int in_triangle(const Ctx *c, int a, int b, int d, int q)
{
	return turn(c->p[a], c->p[b], c->p[q], c->normal) >= 0
		&& turn(c->p[b], c->p[d], c->p[q], c->normal) >= 0
		&& turn(c->p[d], c->p[a], c->p[q], c->normal) >= 0;
}

static int is_reflex(const Ctx *c, int i)
{
	const Node *nd = &c->node[i];

	return turn(c->p[nd->prev], c->p[i], c->p[nd->next], c->normal) <= 0;
}

static int is_ear(const Ctx *c, int i)
{
	int a = c->node[i].prev;
	int d = c->node[i].next;

	if (is_reflex(c, i))
		return 0;
	for (int k = 0; k < c->n_reflex; k++)      /* solo los reflejos */
	{
		int q = c->reflex[k];
		if (q != a && q != d && in_triangle(c, a, i, d, q))
			return 0;
	}
	return 1;
}

static void reflex_remove(Ctx *c, int i)
{
	int pos = c->node[i].reflex_pos;
	int last = c->reflex[--c->n_reflex];

	c->reflex[pos] = last;                     /* el último ocupa su lugar */
	c->node[last].reflex_pos = pos;            /* y anota su nueva posición */
	c->node[i].reflex_pos = -1;
}

/* Tras un recorte: un vecino reflejo que pasó a convexo sale de la lista. */
static void refresh(Ctx *c, int i)
{
	if (c->node[i].reflex_pos >= 0 && !is_reflex(c, i))
		reflex_remove(c, i);
}
```

`in_triangle` es la prueba del mismo lado de la sección «Comprobar que ningún vértice queda atrapado en la oreja»; el bucle de corte llama a `refresh` sobre `prev` y `next` tras cada oreja recortada.

### Qué cambia, medido

12000 vértices, `-O2`, una sola ejecución, mismo resultado (11998 triángulos, es decir `n - 2`) con las dos pruebas:

| Polígono | Vértices reflejos | Prueba contra todos los vértices | Prueba contra los reflejos |
|---|---|---|---|
| Círculo (convexo) | 0 | 0,38 s | 0,0002 s |
| Estrella (un vértice de cada dos entrante) | 6000 | 0,28 s | 0,06 s |

El coste residual es del orden de `n x r` (`r`: número de reflejos): una forma muy recortada sigue siendo cuadrática, solo baja la constante. La ganancia es máxima en polígonos poco cóncavos, que son la inmensa mayoría de las caras de un `.obj`.

> **Trampa: el ruido de redondeo.** En un polígono grande casi plano en cada vértice, un error de cálculo puede hacer pasar vértices convexos a la lista de reflejos: esta se hincha y el coste vuelve a `n x n`. Calcular el giro en `double` (véase [Hacer robusto el ear clipping](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#hacer-robusto-el-ear-clipping)) limita este riesgo. En caso de duda, **clasificar siempre el vértice como reflejo** (`<= 0`, no `< 0`): un reflejo de más solo cuesta tiempo, uno olvidado haría aceptar una oreja que atrapa un vértice.

> **Buena práctica:** validar la optimización comparando, sobre los mismos polígonos, el número de triángulos (`n - 2`) y la suma de sus áreas entre la prueba antigua (todos los vértices) y la nueva (solo reflejos), antes de tirar la antigua. Véase también [medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un `.obj` enumera instrucciones línea a línea (`v`, `vt`, `vn`, `f`, `s`...), con índices de vértices que empiezan en 1. Las caras pueden tener más de 3 vértices y deben triangularse para que la tarjeta gráfica las dibuje; el ear clipping gestiona también las caras cóncavas gracias a una prueba de orientación Y una prueba de "mismo lado" por vértice restante. Una cara combina en general un índice por lista y por esquina (`v/vt/vn`), porque `v` y `vt` son dos listas independientes no alineadas -- necesario para representar una costura UV. El `.mtl` asociado describe la apariencia mediante los 4 parámetros del modelo de Phong (ambiental, difuso, especular, brillo) y puede referenciar un archivo de imagen (`map_Kd`) como textura. `s` controla el suavizado de las normales, con independencia de la geometría. Un analizador acepta con amplitud (`v` con 3, 4 o 6 valores, directivas desconocidas ignoradas, LF, CRLF o CR, BOM) y rechaza el resto con un mensaje preciso. El PPM P6 es una cabecera de texto seguida de píxeles binarios (`maxval` en 1 o 2 bytes). La normal de un polígono se calcula con el método de Newell, sobre todo su contorno. |
| **Herramientas utilizables** | El modelo de Phong (`Ka`/`Kd`/`Ks`/`Ns`) para interpretar un `.mtl`. `map_Kd` para vincular un `.mtl` a un archivo de imagen de textura. Los grupos de suavizado (`s`) para elegir entre renderizado plano y renderizado suavizado. La fórmula `n - 2` para comprobar el número de triángulos producidos por cualquier triangulación. `strtod` para leer los números, el método de Newell para la normal, predicados en `double` para el ear clipping. |
| **Trampas a evitar** | Índices de vértices basados en 1 en lugar de en 0. Caras con número variable de vértices sin triangular. La triangulación en abanico produce un resultado incorrecto en una cara cóncava, y una prueba de orientación sola (sin prueba de "mismo lado") puede validar erróneamente una oreja que atrapa otro vértice. Indexar una coordenada de textura solo por vértice (en lugar de por par vértice/textura) falla silenciosamente en una costura UV. Un `.mtl` de material único no proporciona un color por subparte. `s`/`usemtl` son directivas de estado que hay que seguir durante todo el parseo, no atributos presentes en cada línea `f`. `o` nunca afecta a la numeración de los vértices, que sigue siendo global al archivo incluso con varios objetos. Un BOM pegado a la primera directiva (primer vértice perdido en silencio), un `\r` residual de un archivo CRLF, `fgets` ante un CR solo. Saltar todos los blancos tras el `maxval` de un PPM, no comprobar el tamaño de los datos, olvidar que su primera fila está arriba mientras OpenGL espera la de abajo. Calcular la normal solo con las dos primeras aristas. Usar una tolerancia absoluta en una prueba geométrica. |
| **Buenas prácticas** | Separar la lectura bruta del archivo y la triangulación en dos funciones distintas, cada una con responsabilidad única. Reutilizar la misma primitiva geométrica (producto vectorial + producto escalar con la normal) para la prueba de orientación y la prueba de "mismo lado", en lugar de duplicarla. Comprobar una triangulación con la fórmula `n - 2` antes de dar por correcto el recorte. Duplicar un vértice por cada par único `(v, vt[, vn])` en lugar de por posición sola, para gestionar las costuras UV. Conservar el estado actual (material, grupo de suavizado) en variables actualizadas a medida que avanza el parseo, y asociarlo a cada cara leída. Leer el archivo entero y cortarlo en los tres finales de línea tras saltar el BOM. Rechazar una entrada inválida nombrando el archivo, la línea y el valor. Calcular los predicados geométricos en `double` con una tolerancia relativa, en dos pasadas, y rechazar la cara si no existe ninguna oreja. |
