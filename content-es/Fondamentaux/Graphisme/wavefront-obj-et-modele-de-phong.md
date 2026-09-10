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

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un `.obj` enumera instrucciones línea a línea (`v`, `vt`, `vn`, `f`, `s`...), con índices de vértices que empiezan en 1. Las caras pueden tener más de 3 vértices y deben triangularse para que la tarjeta gráfica las dibuje; el ear clipping gestiona también las caras cóncavas gracias a una prueba de orientación Y una prueba de "mismo lado" por vértice restante. Una cara combina en general un índice por lista y por esquina (`v/vt/vn`), porque `v` y `vt` son dos listas independientes no alineadas -- necesario para representar una costura UV. El `.mtl` asociado describe la apariencia mediante los 4 parámetros del modelo de Phong (ambiental, difuso, especular, brillo) y puede referenciar un archivo de imagen (`map_Kd`) como textura. `s` controla el suavizado de las normales, con independencia de la geometría. |
| **Herramientas utilizables** | El modelo de Phong (`Ka`/`Kd`/`Ks`/`Ns`) para interpretar un `.mtl`. `map_Kd` para vincular un `.mtl` a un archivo de imagen de textura. Los grupos de suavizado (`s`) para elegir entre renderizado plano y renderizado suavizado. La fórmula `n - 2` para comprobar el número de triángulos producidos por cualquier triangulación. |
| **Trampas a evitar** | Índices de vértices basados en 1 en lugar de en 0. Caras con número variable de vértices sin triangular. La triangulación en abanico produce un resultado incorrecto en una cara cóncava, y una prueba de orientación sola (sin prueba de "mismo lado") puede validar erróneamente una oreja que atrapa otro vértice. Indexar una coordenada de textura solo por vértice (en lugar de por par vértice/textura) falla silenciosamente en una costura UV. Un `.mtl` de material único no proporciona un color por subparte. `s`/`usemtl` son directivas de estado que hay que seguir durante todo el parseo, no atributos presentes en cada línea `f`. `o` nunca afecta a la numeración de los vértices, que sigue siendo global al archivo incluso con varios objetos. |
| **Buenas prácticas** | Separar la lectura bruta del archivo y la triangulación en dos funciones distintas, cada una con responsabilidad única. Reutilizar la misma primitiva geométrica (producto vectorial + producto escalar con la normal) para la prueba de orientación y la prueba de "mismo lado", en lugar de duplicarla. Comprobar una triangulación con la fórmula `n - 2` antes de dar por correcto el recorte. Duplicar un vértice por cada par único `(v, vt[, vn])` en lugar de por posición sola, para gestionar las costuras UV. Conservar el estado actual (material, grupo de suavizado) en variables actualizadas a medida que avanza el parseo, y asociarlo a cada cara leída. |
