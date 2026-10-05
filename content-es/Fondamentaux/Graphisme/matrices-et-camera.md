---
order: 5
---

# Matrices y cámara

El [capítulo anterior](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl) envía vértices a la tarjeta gráfica, pero se muestran tal cual, en plano. Para **mover** un objeto, **hacerlo girar** y **verlo en perspectiva** desde una cámara, hacen falta **matrices**. Este capítulo construye las tres matrices de un renderizado 3D, la cámara, la perspectiva, la rotación alrededor de un eje cualquiera y el cálculo que encuadra automáticamente un objeto.

> **Requisitos previos:** una [matriz](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel) es una tabla de números, y multiplicar una matriz por un [vector](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) da un nuevo vector. Aquí, cada matriz **transforma** un punto: lo desplaza, lo hace girar o lo aplasta hacia la pantalla.

## Del objeto a la pantalla: model, view, projection

Un vértice cambia de **sistema de referencia** (sistema de coordenadas) cuatro veces antes de llegar a un píxel. Tres matrices hacen estos cambios:

| Matriz | Nombre habitual | Pasa de... a... | Contiene |
|---|---|---|---|
| **M** | *model* (modelo) | el objeto → el **mundo** | Posición, rotación y escala de este objeto |
| **V** | *view* (vista) | el mundo → la **cámara** | Dónde está la cámara y hacia dónde mira |
| **P** | *projection* (proyección) | la cámara → la **pantalla** | Perspectiva (los objetos lejanos se hacen pequeños) |

```text
vértice del objeto     sistema del mundo     sistema de la cámara    coordenadas de pantalla
  (x, y, z, 1)  --M-->   (mundo)     --V-->    (cámara)       --P-->   (clip → NDC)
```

«Clip» es el resultado bruto de `P`; pasa a coordenadas de pantalla (NDC) tras la división descrita en la sección sobre la perspectiva.

El vertex shader (el [programa que se ejecuta para cada vértice](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl), visto en el capítulo anterior) calcula `P * V * M * vértice`: se lee **de derecha a izquierda** (primero M, luego V, luego P). Invertir el orden da un resultado falso, sin ningún error.

**¿Por qué matrices 4×4 para puntos 3D?** Un punto `(x, y, z)` se escribe `(x, y, z, 1)`, en **coordenadas homogéneas** ([explicación](https://en.wikipedia.org/wiki/Homogeneous_coordinates)). La cuarta columna de la matriz sirve entonces para **trasladar** (desplazar), algo que una matriz 3×3 no sabe hacer. El cuarto número sirve también para la perspectiva (véase más abajo).

| Transformación | Matriz 4×4 (filas) |
|---|---|
| **Traslación** de `(tx, ty, tz)` | `1 0 0 tx` / `0 1 0 ty` / `0 0 1 tz` / `0 0 0 1` |
| **Escala** de `(sx, sy, sz)` | `sx 0 0 0` / `0 sy 0 0` / `0 0 sz 0` / `0 0 0 1` |
| **Rotación** de `a` alrededor de Z | `cos a  -sin a  0 0` / `sin a  cos a  0 0` / `0 0 1 0` / `0 0 0 1` |

`cos a` y `sin a` son el **coseno** y el **seno** del ángulo `a`, expresado aquí en **radianes** (una unidad de ángulo: 180° equivalen a π ≈ 3,14 rad y 90° a ≈ 1,57 rad): dos números entre -1 y 1 que dan el punto `(cos a, sin a)` al que se llega girando `a` desde `(1, 0)` sobre una circunferencia de radio 1.

> **Trampa (orden de los elementos en memoria):** OpenGL espera la matriz **columna por columna** (*column-major*): el elemento de la fila `r` y la columna `c` está en el índice `c * 4 + r` del arreglo de 16 `float`. La tabla anterior se lee, pues, `m[12]`, `m[13]`, `m[14]` para `tx`, `ty`, `tz`. Se envía con `glUniformMatrix4fv(loc, 1, GL_FALSE, m)`; el `GL_FALSE` significa «no **transponer**» (intercambiar filas y columnas, véase la [transpuesta](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel#la-transposee-echanger-lignes-et-colonnes)), porque el arreglo ya está en el orden correcto. Una matriz escrita fila por fila y enviada tal cual produce un objeto deformado o ausente.

## La cámara: `look_at`

Una cámara no existe realmente: se **mueve el mundo en sentido contrario**. La matriz de vista coloca la cámara en el origen, mirando hacia el eje **-Z**. Se construye a partir de tres datos: la posición del ojo (`eye`), el punto mirado (`target`) y la dirección hacia arriba (`up`, a menudo `(0, 1, 0)`).

Dos operaciones vectoriales se repiten. **Normalizar** un vector es dividirlo por su longitud para que valga 1, conservando su dirección (`(0, 3, 4)` pasa a `(0, 0,6, 0,8)`). El **producto vectorial** `a x b` de dos vectores es un tercer vector **perpendicular** (en ángulo recto) a ambos, nulo si `a` y `b` son paralelos (`(1, 0, 0) x (0, 1, 0) = (0, 0, 1)`). El **producto escalar** (`vdot`, visto en el [capítulo sobre vectores](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) vale 0 para dos vectores perpendiculares.

```text
f = normalizar(target - eye)     frente: hacia dónde mira la cámara
s = normalizar(f x up)           derecha: perpendicular a f y a up  (x = producto vectorial)
u = s x f                        arriba real: perpendicular a las otras dos
```

Estas tres direcciones, perpendiculares entre sí, forman las filas de la matriz de vista; la última columna anula la posición del ojo.

Un valor `NaN` (*Not a Number*) es el resultado especial de un `float` para un cálculo imposible (`0 / 0`): atraviesa todos los cálculos siguientes sin error ([detalles](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)). De ahí la prueba escrita `!(len > 1e-6f)` en lugar de `len <= 1e-6f`: la primera rechaza también `NaN`, la segunda lo deja pasar.

```c
typedef struct { float x, y, z; } Vec3;

/* Normaliza v. Devuelve 0 (y no toca nada) si su longitud es casi nula. */
static int vnormalize(Vec3 *v)
{
	float len = sqrtf(v->x * v->x + v->y * v->y + v->z * v->z);

	if (!(len > 1e-6f))                      /* la forma «!(a > b)» rechaza también NaN */
		return 0;
	v->x /= len;
	v->y /= len;
	v->z /= len;
	return 1;
}

/* Matriz de vista (columna por columna). Devuelve 0 si el ojo está sobre el objetivo o si
   la dirección de mirada es paralela a «up»: la derecha no está definida entonces. */
int look_at(float m[16], Vec3 eye, Vec3 target, Vec3 up)
{
	Vec3 f = vsub(target, eye);              /* vsub, vcross, vdot: cálculos vectoriales básicos */
	Vec3 s, u;

	if (!vnormalize(&f))
		return 0;
	s = vcross(f, up);
	if (!vnormalize(&s))
		return 0;
	u = vcross(s, f);
	memset(m, 0, 16 * sizeof(float));
	m[0] = s.x;  m[4] = s.y;  m[8]  = s.z;   m[12] = -vdot(s, eye);
	m[1] = u.x;  m[5] = u.y;  m[9]  = u.z;   m[13] = -vdot(u, eye);
	m[2] = -f.x; m[6] = -f.y; m[10] = -f.z;  m[14] =  vdot(f, eye);
	m[15] = 1.0f;
	return 1;
}
```

Verificación por ejecución, con `eye = (3, 2, 5)` y `target = (1, 0, 0)`: el ojo pasa a `(0, 0, 0)` y el objetivo a `(0, 0, -5,74)`, exactamente la distancia que los separa, sobre el eje -Z.

> **Trampa (el caso degenerado):** al mirar **justo hacia arriba o hacia abajo** (`f` paralelo a `up`), el producto vectorial `f x up` vale cero y la normalización divide por cero: la matriz se llena de `NaN` y la pantalla queda vacía. `look_at` debe **rechazar** este caso con un mensaje preciso, o el llamador debe tomar entonces otro `up` (por ejemplo `(0, 0, 1)`). Lo mismo si `eye == target`.

## La perspectiva

La matriz de proyección aplasta el volumen visible, una **pirámide truncada** (el *frustum*), dentro de un cubo. Cuatro parámetros la definen:

| Parámetro | Función | Dominio válido |
|---|---|---|
| `fov` | Ángulo de apertura **vertical** (*field of view*), en radianes | `0 < fov < π` |
| `aspect` | Ancho / alto de la ventana | `aspect > 0` |
| `near` | Distancia del plano **cercano**: lo que está más cerca se corta | `near > 0` |
| `far` | Distancia del plano **lejano**: lo que está más lejos se corta | `far > near` |

`tanf` calcula la **tangente** de un ángulo: cuanto mayor es el ángulo de apertura, más crece, y más «alejada» parece la escena. En Windows, `<windows.h>` define `near` y `far` como **macros** (palabras que el preprocesador sustituye por texto antes de compilar, véase [cabeceras y macros](/?c=langages&s=c&p=headers)): por eso los parámetros se llaman `near_plane` y `far_plane`.

```c
/* Matriz de proyección en perspectiva (columna por columna). Devuelve 0 si un parámetro
   sale de su dominio. */
int perspective(float m[16], float fov, float aspect, float near_plane, float far_plane)
{
	float f;

	if (!(fov > 0.0f && fov < 3.14159265f) || !(aspect > 0.0f)
		|| !(near_plane > 0.0f) || !(far_plane > near_plane))
		return 0;
	f = 1.0f / tanf(fov / 2.0f);             /* gran ángulo de apertura: f pequeño, escena «alejada» */
	memset(m, 0, 16 * sizeof(float));
	m[0] = f / aspect;
	m[5] = f;
	m[10] = (far_plane + near_plane) / (near_plane - far_plane);
	m[11] = -1.0f;                           /* copia -z en w: esto es lo que crea la perspectiva */
	m[14] = 2.0f * far_plane * near_plane / (near_plane - far_plane);
	return 1;
}
```

**¿Dónde está la perspectiva?** El resultado `(x, y, z, w)` de `P * V * M * vértice` todavía no es la pantalla: la tarjeta gráfica lo divide por `w` (la **división de perspectiva**). Como `m[11] = -1`, `w` vale la **distancia** a la cámara: cuanto más lejos está un punto, más se divide, más se encoge. Tras la división, `z` está entre -1 (plano cercano) y +1 (plano lejano), es el espacio **NDC** (*normalized device coordinates*). Medido con `near = 0,1` y `far = 100`: un punto en `z = -0,1` da -1, un punto en `z = -100` da +1.

> **Trampa (las violaciones del dominio):** cada una rompe la imagen **sin error de OpenGL**.
>
> | Violación | Consecuencia |
> |---|---|
> | `near = 0` | División por cero: matriz infinita, nada en pantalla |
> | `near > far` | Profundidad invertida: el objeto lejano pasa delante |
> | `fov = π` o `0` | `tan` infinita o nula: imagen vacía |
> | `aspect = 0` (ventana reducida a una línea) | División por cero |
> | `near` minúsculo | Profundidad **inutilizable**: en `z = -50`, la profundidad normalizada ya vale 0,998, así que casi todo el objeto cae sobre unos pocos valores vecinos, y dos superficies cercanas se «pelean» (*z-fighting*, parpadeo) |
>
> Para `near` y `far`, más vale una relación `far / near` razonable (unos pocos miles como máximo) que un `near` «lo más pequeño posible».

Un cálculo como `near = distancia - radio` puede valer 0 (o incluso volverse negativo) cuando la cámara toca el objeto: la sección sobre el encuadre, más abajo, explica el remedio.

## Hacer girar un objeto: la rotación acumulada

Para una rotación con el ratón, la tentación es mantener el objeto orientado con **una sola matriz 3×3** `R` y, en cada imagen, multiplicarla por una pequeña rotación `d`: `R = d * R`. Cada producto redondea los `float`; las tres filas de `R`, que deberían seguir siendo perpendiculares y de longitud 1 (se dice que la matriz es **ortonormal**), **derivan** lentamente: la matriz deforma (inclina, estira) el objeto en lugar de solo girarlo.

| Número de pequeñas rotaciones (0,01 rad) | Desviación medida respecto a una rotación verdadera |
|---|---|
| 100 | 0,000004 |
| 10 000 | 0,00014 |
| 100 000 | 0,0014 |
| 1 000 000 | 0,014 |

El remedio: **reortonormalizar** de vez en cuando, es decir, enderezar las filas (procedimiento de **Gram-Schmidt**, [detalle](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process)).

```c
/* Endereza una matriz de rotación 3×3 (filas) que ha derivado: filas de longitud 1,
   perpendiculares. Tras la llamada en el caso anterior, la desviación vuelve a 1e-7. */
void reorthonormalize(float r[3][3])
{
	Vec3 a = {r[0][0], r[0][1], r[0][2]};
	Vec3 b = {r[1][0], r[1][1], r[1][2]};
	Vec3 c;
	float d;

	vnormalize(&a);                          /* 1.ª fila: longitud 1 */
	d = vdot(b, a);
	b = (Vec3){b.x - d * a.x, b.y - d * a.y, b.z - d * a.z};   /* quita de b su parte paralela a a */
	vnormalize(&b);
	c = vcross(a, b);                        /* 3.ª fila: perpendicular a las otras dos */
	r[0][0] = a.x; r[0][1] = a.y; r[0][2] = a.z;
	r[1][0] = b.x; r[1][1] = b.y; r[1][2] = b.z;
	r[2][0] = c.x; r[2][1] = c.y; r[2][2] = c.z;
}
```

> **Alternativa:** un **cuaternión** ([presentación](https://en.wikipedia.org/wiki/Quaternion)) representa una rotación con 4 números en lugar de 9 y se endereza dividiéndolo por su norma (su longitud). Elegir una matriz sigue siendo razonable mientras se reortonormalice.

## Girar alrededor de un eje cualquiera: la fórmula de Rodrigues

Girar alrededor de X, Y o Z es sencillo (tabla anterior). Para un **eje cualquiera** `k` (vector de longitud 1) y un ángulo `θ`, la **fórmula de Rodrigues** ([detalle](https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula)) da la matriz directamente:

| Término | Valor (con `c = cos θ`, `s = sin θ`, `t = 1 - c`) |
|---|---|
| Diagonal | `c + t·k.x²`, `c + t·k.y²`, `c + t·k.z²` |
| Fuera de la diagonal | `t·k.a·k.b` más o menos `s·k.c`, donde `c` es el **tercer** eje (a, b, c = x, y, z en orden cíclico); los signos son los del código siguiente |

```c
/* Rotación de ángulo «angle» (radianes) alrededor de «axis» (normalizado aquí), filas r[fila][columna]. */
void rotation_from_axis_angle(float r[3][3], Vec3 axis, float angle)
{
	float c = cosf(angle), s = sinf(angle), t = 1.0f - c;
	Vec3 k = axis;

	vnormalize(&k);
	r[0][0] = c + t * k.x * k.x;        r[0][1] = t * k.x * k.y - s * k.z;  r[0][2] = t * k.x * k.z + s * k.y;
	r[1][0] = t * k.x * k.y + s * k.z;  r[1][1] = c + t * k.y * k.y;        r[1][2] = t * k.y * k.z - s * k.x;
	r[2][0] = t * k.x * k.z - s * k.y;  r[2][1] = t * k.y * k.z + s * k.x;  r[2][2] = c + t * k.z * k.z;
}
```

Verificación: 90° alrededor de `(0, 0, 1)` lleva `(1, 0, 0)` a `(0, 1, 0)` (salvo el ruido de redondeo: `-4e-8`).

> **Trampa:** el eje debe tener **longitud 1**; si no, la matriz deja de ser una rotación. La función lo normaliza ella misma; un eje nulo (`(0, 0, 0)`) sigue siendo nulo y produce una matriz falsa, que hay que rechazar antes.

## Recuperar el eje y el ángulo de una rotación

La operación inversa, útil para comparar dos orientaciones o animar entre ellas, extrae el ángulo de la **traza** (la suma de los elementos de la diagonal, `r00 + r11 + r22`, donde `rij` es el elemento de la fila `i` y la columna `j`, contando desde 0) y el eje a partir de las diferencias entre elementos simétricos respecto a la diagonal (`r21 - r12`, ...). `acos` (arcocoseno) recupera el ángulo cuyo coseno se conoce, pero solo acepta valores entre -1 y 1:

| Paso | Fórmula |
|---|---|
| Ángulo | `θ = acos((r00 + r11 + r22 - 1) / 2)` |
| Eje (caso general) | `k` tiene la dirección de `(r21 - r12, r02 - r20, r10 - r01)`, luego normalizado |

Tres trampas, todas encontradas en la práctica:

| Caso | Problema | Remedio |
|---|---|---|
| El resultado de `(traza - 1) / 2` supera 1 en `1e-7` | `acos` devuelve `NaN` | **Acotar** el valor en `[-1, 1]` antes de `acos` |
| `θ ≈ 0` | El eje es **indefinido** (ninguna rotación: sirve cualquier eje) | Devolver un eje por defecto y señalar «sin rotación» |
| `θ ≈ 180°` | `sin θ ≈ 0`: el vector `(r21 - r12, ...)` se anula, el eje se vuelve ruido | Usar `(R + I) / 2 = k·kᵀ`: la columna de mayor diagonal vale `k_i · k` |

En la última fila, `I` es la **matriz identidad** (unos en la diagonal, ceros en el resto: no cambia nada) y `k·kᵀ` la matriz 3×3 cuyo elemento `(i, j)` vale `k_i · k_j`.

```c
/* Extrae eje y ángulo de una rotación 3×3. Devuelve 0 si el ángulo es casi nulo (eje arbitrario). */
int axis_angle_from_rotation(float r[3][3], Vec3 *axis, float *angle)
{
	float cos_a = (r[0][0] + r[1][1] + r[2][2] - 1.0f) / 2.0f;
	Vec3 k;

	if (cos_a > 1.0f)                        /* el redondeo puede salir de [-1, 1] */
		cos_a = 1.0f;
	if (cos_a < -1.0f)
		cos_a = -1.0f;
	*angle = acosf(cos_a);
	k = (Vec3){r[2][1] - r[1][2], r[0][2] - r[2][0], r[1][0] - r[0][1]};
	if (*angle < 1e-4f) {
		*axis = (Vec3){0.0f, 0.0f, 1.0f};
		return 0;
	}
	if (3.14159265f - *angle < 1e-3f) {      /* media vuelta: estas diferencias se anulan */
		int i = 0;

		for (int d = 1; d < 3; d++)          /* columna de mayor diagonal: la más fiable */
			if (r[d][d] > r[i][i])
				i = d;
		k = (Vec3){(r[0][i] + (i == 0)) / 2.0f, (r[1][i] + (i == 1)) / 2.0f,
			(r[2][i] + (i == 2)) / 2.0f};
	}
	vnormalize(&k);
	*axis = k;
	return 1;
}
```

Probado con 4 ejes (entre ellos `(0, 0, -1)` y `(-1, 0, 0)`) y 6 ángulos (de `1e-5` a `π`): el eje recuperado es el correcto, **salvo el signo** (a 180°, un eje y su opuesto describen la misma rotación). A 0° no hay ningún eje definido: la función lo señala.

## Encuadrar automáticamente un objeto

Para que un objeto cualquiera **quepa en la imagen** al cargarlo, se calcula la **caja envolvente** (*bounding box*): la caja más pequeña, de caras paralelas a los ejes, que contiene todos los vértices (`min` y `max` en cada coordenada). De ella se deduce una **esfera envolvente**:

| Valor | Cálculo |
|---|---|
| Centro (el punto a mirar, `target`) | `(min + max) / 2` |
| Radio | La mitad de la diagonal (del vértice `min` al vértice `max`): `norma(max - min) / 2` |
| Distancia de la cámara | `radio / sin(semiángulo)`: la esfera toca entonces los bordes de la imagen |
| `far` | `distancia + radio` |
| `near` | `distancia - radio`, **acotado** por un mínimo (p. ej. `far × 0,001`) |

El **semiángulo** es el de la dimensión más **estrecha**: si la ventana es más alta que ancha (`aspect < 1`), es el ángulo horizontal `atan(tan(fov / 2) × aspect)` el que limita, no `fov / 2` (`atan`, la arcotangente, es la inversa de `tan`).

```c
/* Distancia y planos para encuadrar una esfera de radio «radius». Devuelve 0 si un parámetro
   está fuera de dominio (radio nulo: objeto reducido a un punto, nada que encuadrar). */
int frame_sphere(float radius, float fov, float aspect,
	float *distance, float *near_plane, float *far_plane)
{
	float half_v = fov / 2.0f;
	float half_h = atanf(tanf(half_v) * aspect);   /* semiángulo horizontal */
	float half = fminf(half_v, half_h);            /* el más estrecho de los dos */

	if (!(radius > 0.0f) || !(fov > 0.0f && fov < 3.14159265f) || !(aspect > 0.0f))
		return 0;
	*distance = radius / sinf(half);
	*far_plane = *distance + radius;
	*near_plane = fmaxf(*distance - radius, *far_plane * 1e-3f);   /* nunca ≤ 0 */
	return 1;
}
```

Ejemplo con cifras: radio 2, `fov = 1` rad, `aspect = 0,5` (ventana dos veces más alta que ancha): semiángulo retenido 0,267 rad (el horizontal), distancia 7,59, `near = 5,59`, `far = 9,59`.

> **Trampa (el vértice fantasma):** un solo vértice que **ninguna cara utiliza** (resto de una exportación, una línea `v` olvidada) agranda la caja: el centro se desplaza, el radio se infla, el objeto aparece minúsculo y mal centrado. Calcular la caja **con los vértices realmente usados**, o quitar antes los vértices huérfanos.

## Normalizar la escala de una escena

Una **constante absoluta** es un valor expresado en las unidades de la escena: « la cámara avanza 0,1 por segundo », « nunca más cerca de 0,5 del objeto », « margen de 0,2 alrededor del modelo ». Solo es correcta para **un rango de tamaños**. Fuera de ese rango:

| Tamaño de la escena (radio) | Efecto de las constantes absolutas |
|---|---|
| Diminuta (0,001) | 0,1 por segundo son **100 radios por segundo**: la cámara sale disparada; la distancia mínima 0,5 supera el objeto entero |
| Dentro del rango (en torno a 1) | Todo está ajustado para este tamaño |
| Enorme (5 000) | 0,1 por segundo son 0,00002 radio por segundo: la cámara parece inmóvil; un margen de 0,2 es invisible |

Dos formas de remediarlo:

| Enfoque | Coste | Efecto sobre lo existente |
|---|---|---|
| Hacer **cada constante relativa** al radio | Un cambio por constante, y hay que acordarse de todas las futuras | Cambia el renderizado de las escenas que funcionaban |
| **Normalizar la escena una vez**: llevarla al rango al cargar | Un solo lugar | Ninguno, si no se tocan las escenas que ya están en el rango |

Reglas de la normalización:

1. **No cambiar nada dentro del rango** (p. ej. radio entre 0,5 y 2): las escenas ya bien ajustadas conservan exactamente su renderizado. Comprobarlo comparando capturas de pantalla antes y después.
2. **Un único factor para toda la escena**, calculado sobre la esfera envolvente del conjunto (véase [Encuadrar automáticamente un objeto](#encuadrar-automaticamente-un-objeto)) y aplicado a todos los objetos: sus tamaños relativos se conservan. Un factor por objeto los dejaría todos del mismo tamaño.
3. **Calcular en doble precisión**: el cuadrado de `1e30` supera el mayor `float` (≈ 3,4 × 10³⁸) y da infinito, mientras que un `double` lo soporta (véanse los [números de coma flotante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)).
4. **Recentrar también** una escena muy alejada del origen (véase la trampa más abajo).

```c
#define RADIUS_MIN 0.5      /* rango de radios para el que se ajustan velocidades y margenes */
#define RADIUS_MAX 2.0
#define RADIUS_TARGET 1.0   /* radio buscado cuando hay que redimensionar */
#define FAR_FACTOR 100.0    /* centro « lejos »: a mas de 100 radios del origen */

/* Lleva in situ unos vertices (x, y, z consecutivos) al rango de tamanos de referencia.
   No toca nada si el radio esta en el rango y el centro cerca del origen.
   Devuelve 1 si se modifican, 0 si se dejan tal cual, -1 si son inutilizables (mensaje en stderr). */
int normalize_scene(float *vertices, size_t count)
{
	double lo[3], hi[3], center[3], d[3], radius, scale = 1.0;
	size_t i;
	int k;

	if (!vertices || count == 0)
	{
		fprintf(stderr, "escena vacia: nada que normalizar\n");
		return -1;
	}
	for (k = 0; k < 3; k++)
		lo[k] = hi[k] = vertices[k];                  /* caja envolvente: min y max por eje */
	for (i = 0; i < count; i++)
		for (k = 0; k < 3; k++)
		{
			double v = vertices[3 * i + k];           /* float convertido a double, sin perdida */

			if (!isfinite(v))                         /* NaN o infinito: la caja seria falsa */
			{
				fprintf(stderr, "vertice %zu: coordenada %d no finita\n", i, k);
				return -1;
			}
			lo[k] = fmin(lo[k], v);
			hi[k] = fmax(hi[k], v);
		}
	for (k = 0; k < 3; k++)
	{
		center[k] = (lo[k] + hi[k]) / 2.0;
		d[k] = hi[k] - lo[k];
	}
	radius = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) / 2.0;
	if (!(radius > 0.0))                              /* rechaza tambien NaN; vertices todos coincidentes */
	{
		fprintf(stderr, "radio nulo: todos los vertices coinciden\n");
		return -1;
	}
	if (radius < RADIUS_MIN || radius > RADIUS_MAX)
		scale = RADIUS_TARGET / radius;               /* fuera del rango: se redimensiona */
	else if (sqrt(center[0] * center[0] + center[1] * center[1]
			+ center[2] * center[2]) <= FAR_FACTOR * radius)
		return 0;                                     /* en el rango y centrada: no se toca nada */
	for (i = 0; i < count; i++)
		for (k = 0; k < 3; k++)
			vertices[3 * i + k] = (float)((vertices[3 * i + k] - center[k]) * scale);
	return 1;
}
```

Probada con 8 escenas: un cubo de lado 1 queda intacto (devuelve 0); radios de `1e30`, `1e-30` y 5 000 vuelven todos a 1; una escena a `1e7` del origen se recentra; un `NaN`, una escena vacía y vértices coincidentes se rechazan, cada uno con su mensaje.

> **Trampa (la precisión de un `float`):** un `float` conserva ≈ 7 cifras significativas. En `10 000 000`, dos `float` vecinos están separados por **1**: un objeto de radio 1 colocado allí solo tiene unas pocas posiciones posibles, sus vértices « saltan ». Reescalar no lo arregla, porque la pérdida ocurre **al leer el archivo**; solo una lectura en `double` ([`strtod`](/?c=langages-de-programmation&s=c&p=convertir-un-texte-en-nombre)), recentrada antes de la conversión a `float`, la evita.

> **Trampa (un límite expresado en radios):** una distancia mínima de cámara del tipo `distancia ≥ 2 × radio` parece relativa, por tanto inofensiva. En una escena con varios objetos, sin embargo, es ella la que decide la distancia de la cámara: cambiarla o hacerla relativa altera el renderizado de esas escenas, incluso en el rango donde no se quería cambiar nada. Comparar capturas antes y después de cada ajuste.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Tres matrices: M (objeto → mundo), V (mundo → cámara), P (cámara → pantalla), aplicadas de derecha a izquierda (`P * V * M * vértice`). OpenGL lee las matrices **columna por columna**. La vista se construye con `look_at` (frente, derecha, arriba); la perspectiva divide por `w` y exige `0 < near < far`, `0 < fov < π`, `aspect > 0`. Una rotación acumulada deriva: se endereza. Rodrigues da la rotación alrededor de un eje cualquiera; la extracción eje/ángulo tiene dos casos límite (0° y 180°). El encuadre sale de la esfera envolvente. Las constantes absolutas (velocidades, márgenes) solo valen para un rango de tamaños: se lleva la escena a ese rango una sola vez, con un factor común calculado en doble precisión, sin tocar las escenas que ya están en el rango. |
| **Herramientas utilizables** | `glUniformMatrix4fv`, `tanf`/`atanf`/`acosf`, producto vectorial y escalar. Documentación: [Viewing and Transformations](https://www.khronos.org/opengl/wiki/Viewing_and_Transformations), [Rodrigues](https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula), [coordenadas homogéneas](https://en.wikipedia.org/wiki/Homogeneous_coordinates). |
| **Trampas a evitar** | Matriz enviada fila por fila, orden `M * V * P` invertido. `look_at` mirando hacia arriba (producto vectorial nulo, `NaN`). `near = 0` o `near > far` (matriz infinita, profundidad invertida), `near` minúsculo (profundidad aplastada, parpadeo). Rotación acumulada nunca enderezada. `acos` de un valor ligeramente superior a 1. Eje de una rotación de 0° o 180° leído sin caso particular. Caja envolvente falseada por un vértice huérfano. Una constante absoluta aplicada a una escena diminuta o enorme, un factor por objeto, un cuadrado calculado en `float` (infinito), una escena lejana reescalada cuando la precisión ya se perdió, un límite « en radios » que cambia el renderizado de las escenas con varios objetos. |
| **Buenas prácticas** | Validar cada parámetro (`!(a > b)` rechaza también `NaN`) y nombrar la causa en el mensaje. Acotar antes de `acos`. Reortonormalizar una rotación acumulada. Calcular `near` y `far` a partir del radio y acotarlos. Probar `look_at` y `perspective` con los casos límite antes de conectarlos al renderizado. Normalizar la escala al cargar en lugar de hacer cada constante relativa; comparar capturas antes y después. |
