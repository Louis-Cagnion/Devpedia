---
order: 6
---

# Efectos de renderizado e interacción 3D

Una vez cargada una escena (el [formato .obj](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)) y mostrada ([GLFW/GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), surgen a menudo cuatro necesidades: enriquecer visualmente el renderizado (un objeto de vidrio, por ejemplo), animarla sin datos externos, revestir un objeto que no tiene coordenadas de textura, y permitir que el usuario interactúe con la escena con el ratón. Este capítulo cubre estas cuatro necesidades.

## La aberración cromática: un efecto de posprocesado

La luz blanca que atraviesa un material refractivo (vidrio, agua) no se desvía exactamente igual según su color: es la **aberración cromática**, visible en fotografía como una franja de color en los contornos de alto contraste. Un motor de renderizado puede simular este efecto deliberadamente, en posprocesado: en lugar de calcular una sola vez la refracción de un rayo (véase [vectores y producto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) para las bases del cálculo vectorial usado aquí), se calcula **tres veces**, una por canal de color, con un índice de refracción ligeramente distinto cada vez:

```text
Rayo incidente
      |
      v
  Refraccion con IOR rojo    -> muestrea el canal ROJO del cubemap
  Refraccion con IOR verde   -> muestrea el canal VERDE del cubemap
  Refraccion con IOR azul    -> muestrea el canal AZUL del cubemap
      |
      v
Recombina los 3 canales -> el resultado final, con sus franjas de color
```

Un **cubemap** (una textura compuesta de 6 imágenes, una por cara de un cubo, que representa el entorno alrededor de un objeto) proporciona la imagen refractada: cada uno de los 3 rayos, desviado ligeramente distinto, muestrea ese mismo cubemap en un punto ligeramente distinto, lo que produce la separación de colores.

> **Buena práctica:** mantener los 3 índices de refracción cercanos entre sí (una variación de algunas centésimas basta). Una diferencia demasiado grande produce un resultado que ya no se parece a un vidrio realista, sino a un artefacto visual tosco.

## El reflejo de Fresnel: cuanto más de refilón se mira, más refleja

En una ventana, un lago o una canica de vidrio, la superficie deja pasar la luz cuando se mira de frente, y actúa como un espejo cuando se mira con un ángulo rasante. Es el **efecto de Fresnel**: la parte de luz **reflejada** (devuelta) aumenta con el ángulo entre la dirección de la mirada y la **normal** (el vector perpendicular a la superficie, véase [búferes, texturas y shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl)). El cálculo exacto es pesado; la **aproximación de Schlick** (por el nombre de su autor) basta en tiempo real:

```text
F = F0 + (1 - F0) x (1 - cos(angulo))^5

F0     : parte reflejada de frente (alrededor de 0,04 para el vidrio, es decir, 4 %)
angulo : entre la normal y la dirección hacia el ojo; cos(angulo) = producto escalar de ambos
         (dos vectores de longitud 1)
F      : parte reflejada final, entre F0 (de frente) y 1 (completamente de refilón)
```

```glsl
vec3 n = normalize(world_normal);                    // normal de la superficie, longitud 1
vec3 v = normalize(camera_pos - world_pos);          // dirección del punto hacia el ojo
float cos_angle = max(dot(n, v), 0.0);               // 1 de frente, 0 de refilón
float fresnel = 0.04 + 0.96 * pow(1.0 - cos_angle, 5.0);   // pow(a, b): a elevado a b

vec3 mirrored = texture(env_map, reflect(-v, n)).rgb;      // lo que devuelve el espejo
vec3 final_color = mix(refracted_color, mirrored, fresnel);
```

`texture(env_map, direction)` lee el cubemap (declarado `uniform samplerCube env_map`) en una dirección, y `.rgb` extrae las tres componentes rojo, verde y azul del resultado (un `vec4`). `reflect(i, n)` es una función GLSL que devuelve la dirección de un rayo `i` tras rebotar en una superficie de normal `n` (aquí `-v`, el rayo que va del ojo al punto). `mix(a, b, t)` mezcla dos valores: `a x (1 - t) + b x t`, es decir `a` para `t = 0` y `b` para `t = 1`. El resultado: el color refractado (el de la sección anterior, con sus franjas) en el centro de la canica, y cada vez más entorno reflejado hacia sus bordes.

## Una nube en el interior: el ray-marching

Para dar a un cristal un interior brumoso no se dibuja nada dentro: se hace **marchar** un rayo a través del objeto con pasos pequeños, y en cada paso se acumula la **densidad** de una función (0 = vacío, 1 = muy denso). Es el **ray-marching** («marcha de rayo»), que no debe confundirse con el [raycasting](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage), que busca un único punto de impacto.

```glsl
uniform float time;                                   // segundos transcurridos, fijados por el programa C

float density(vec3 p)                                 // densidad de la nube en el punto p
{
	return clamp(sin(p.x * 3.0) * sin(p.y * 3.0 + time) * sin(p.z * 3.0), 0.0, 1.0);
}                                                     // clamp(x, 0.0, 1.0) limita x al intervalo 0..1

float cloud_opacity(vec3 entry, vec3 dir, float thickness)   // dir: longitud 1; thickness: grosor atravesado
{
	const int STEPS = 24;                             // número de pasos, fijo
	float step_len = thickness / float(STEPS);
	float opacity = 0.0;                              // 0 = transparente, 1 = opaco
	for (int i = 0; i < STEPS && opacity < 0.95; i++)
	{
		vec3 p = entry + dir * (float(i) + 0.5) * step_len;      // mitad del paso i
		opacity += (1.0 - opacity) * density(p) * step_len * 4.0; // añade lo que falta por cubrir
	}
	return opacity;
}
```

El resultado se mezcla con el color del vidrio: `mix(glass_color, cloud_color, cloud_opacity(...))`.

| Elección | Efecto | Coste o trampa |
|---|---|---|
| Número de pasos (`STEPS`) | Cuantos más hay, más fina es la nube | El coste es **por píxel**, multiplicado por el número de pasos: 24 pasos en una pantalla de 2 millones de píxeles son casi 50 millones de llamadas a `density` por fotograma |
| Salida anticipada (`opacity < 0.95`) | Es inútil seguir cuando la nube ya es casi opaca | Ninguno, y ahorra pasos |
| Desfase de medio paso (`+ 0.5`) | Muestrea en el medio del paso y no en su borde | Sin él, se ven las bandas de los pasos |
| Grosor atravesado | Basta un valor aproximado (por ejemplo el diámetro del objeto) | Calcularlo exactamente exige la intersección rayo/objeto |

## Dibujar un objeto transparente

Un cristal deja ver lo que hay detrás: hay que **mezclar** su color con lo que ya está en pantalla. OpenGL lo hace con el **blending** (mezcla), activado con `glEnable(GL_BLEND)`, con la fórmula elegida por `glBlendFunc`:

```text
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA) da:

color final = alpha x color del fragmento + (1 - alpha) x color ya en pantalla

alpha: opacidad del fragmento, 4.º valor del color (vec4) devuelto por el fragment shader;
       1 = opaco, 0 = invisible
```

De ahí se derivan tres reglas.

- **Primero los objetos opacos.** La prueba de profundidad (véase [la cadena de dibujo](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl)) rechaza todo píxel situado detrás de un píxel ya dibujado. Un vidrio dibujado el primero haría desaparecer lo que hay detrás: la mezcla no tendría nada que mezclar. Los opacos se dibujan sin mezcla, y luego se activa la mezcla para los transparentes.
- **Un cristal se dibuja en dos pasadas: el interior y luego el exterior.** Una canica de vidrio tiene una cara trasera (vista a través del vidrio) y una cara delantera. El **face culling** (descarte de caras) permite elegir cuál ignora la tarjeta gráfica: `glEnable(GL_CULL_FACE)`, luego `glCullFace(GL_FRONT)` ignora las caras delanteras (se dibuja entonces el dorso del cristal), `glCullFace(GL_BACK)` ignora las caras traseras (se dibuja el frente, por encima). Sin esto, las caras delanteras y traseras se mezclan en un orden cualquiera y el resultado parpadea.
- **El orden de los vértices decide qué es una cara delantera.** Un triángulo está «de frente» cuando sus vértices aparecen en sentido antihorario en pantalla (ajuste por defecto, `glFrontFace(GL_CCW)`). Una malla cuyos triángulos están listados en el otro sentido ve sus caras delanteras tomadas por caras traseras: se descartan en la pasada equivocada, o se iluminan con una normal invertida, y el objeto aparece negro (el `max(dot(...), 0.0)` de la iluminación cae a 0).

```c
glEnable(GL_CULL_FACE);                              /* descarte de caras activado */
draw_opaque_objects();                               /* 1. los opacos, sin mezcla */

glEnable(GL_BLEND);
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);   /* fórmula de mezcla de arriba */
glCullFace(GL_FRONT);                                /* 2. primero el dorso del cristal */
draw_crystal();
glCullFace(GL_BACK);                                 /* 3. luego su frente, por encima */
draw_crystal();
glDisable(GL_BLEND);                                 /* para el fotograma siguiente */
```

> **Trampa:** un cristal que aparece negro o medio vacío proviene casi siempre de uno de estos tres ajustes (orden opaco/transparente, cara descartada, orden de los vértices), sin ningún mensaje de error: OpenGL no señala nada, hace lo que se le ha pedido. Probar primero con `GL_CULL_FACE` desactivado: si el objeto reaparece, es el orden de los vértices.

## La animación procedural: recalcular en lugar de reproducir

A diferencia de una animación por **fotogramas clave** (*keyframes*, posiciones grabadas de antemano e interpoladas), una animación **procedural** recalcula la posición o deformación de un objeto en cada fotograma, a partir de una fórmula que depende del tiempo transcurrido, sin ningún dato externo:

```c
float altura = amplitud * sinf(tiempo_transcurrido * velocidad);
posicion.y = altura;   // hace "flotar" un objeto de arriba a abajo, indefinidamente
```

No se almacena ningún dato para esta animación: queda enteramente determinada por la fórmula y el tiempo transcurrido, lo que la hace trivial de mantener indefinidamente (a diferencia de una secuencia de fotogramas clave, necesariamente finita) y barata en memoria.

> **Trampa:** usar directamente el número de fotogramas transcurridos (`frame_count`) en lugar de un tiempo real transcurrido (en segundos). Una animación basada en el número de fotogramas va más rápido en una máquina que muestra más fotogramas por segundo, exactamente la misma trampa ya vista para un [bucle de renderizado](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) basado en el tiempo.

## Un muelle amortiguado: un valor que alcanza su objetivo con suavidad

Para que un valor (la escala de un objeto sobre el que se pasa el ratón, un desplazamiento, una deformación) alcance su **objetivo** sin un salto brusco, se le une a este mediante un **muelle**: cuanto mayor es la diferencia, más tira. Solo, un muelle oscilaría indefinidamente; un **amortiguamiento** (un rozamiento proporcional a la velocidad) apaga poco a poco el movimiento.

```c
typedef struct s_spring
{
	float pos;   /* valor actual */
	float vel;   /* velocidad de variación de pos, en unidades por segundo */
}	t_spring;

void	spring_update(t_spring *s, float target, float stiffness, float damping, float dt)
{
	float	accel;

	if (dt > 0.05f)
		dt = 0.05f;                                           /* paso acotado, véase abajo */
	accel = stiffness * (target - s->pos) - damping * s->vel; /* tira hacia el objetivo, frena */
	s->vel += accel * dt;                                     /* primero la velocidad... */
	s->pos += s->vel * dt;                                    /* ...luego la posición */
}
```

`stiffness` (**rigidez**) mide la fuerza de recuperación por unidad de diferencia; `damping` (**amortiguamiento**) la fuerza de frenado por unidad de velocidad; `dt` es el tiempo transcurrido desde el fotograma anterior (véase [el delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#el-delta-time-una-velocidad-independiente-de-la-maquina)). El comportamiento depende de la relación entre ambos:

| Amortiguamiento | Comportamiento |
|---|---|
| 0 | Oscila sin fin alrededor del objetivo |
| Bajo | Sobrepasa el objetivo, rebota, se apaga (efecto «elástico») |
| `2 x sqrt(stiffness)` (llamado **crítico**) | Alcanza el objetivo lo más rápido posible, sin sobrepasarlo |
| Alto | Alcanza el objetivo lentamente, sin sobrepasarlo |

> **Trampa (el paso de tiempo sin acotar):** si un fotograma dura mucho (ventana arrastrada, programa suspendido un segundo), `dt` es grande y el paso anterior sobrepasa el objetivo en más que la diferencia inicial: en cada fotograma la diferencia crece, el valor diverge y acaba siendo `inf` o `NaN`. De ahí el tope `dt <= 0.05` (50 ms): el muelle recupera su retraso a lo largo de varios fotogramas en lugar de explotar en uno solo.

## Acotar una deformación con `tanh`

Una deformación controlada por el ratón o por un muelle puede recibir un valor arbitrariamente grande, y un objeto estirado por un factor de 1000 es inutilizable. `clamp` (cortar en seco en un límite) la limita, pero crea un **codo**: la deformación crece y luego se congela de golpe. La **tangente hiperbólica**, `tanh` (en C `tanhf` de `<math.h>`, véanse también [las funciones de activación](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) que la usan), es una curva en S que se mantiene cerca de `x` alrededor de 0 y luego se aplana con suavidad hacia -1 y 1:

```c
/* devuelve cualquier valor al intervalo ]-limit, limit[ ; limit > 0 */
float	soft_bound(float raw, float limit)
{
	return (limit * tanhf(raw / limit));
}
```

| `raw` (con `limit = 1`) | `soft_bound` |
|---|---|
| 0,1 | 0,0997 (casi sin cambios) |
| 1 | 0,762 |
| 3 | 0,995 |
| 100 | 1,000 (satura) |

> **Trampa:** un `limit` igual a 0 (división por cero) o negativo (límites invertidos) da `NaN` o un resultado al revés: rechazarlo antes de la llamada. Y `tanhf` deja pasar tal cual un `NaN` de entrada: el límite protege de un valor enorme, no de un valor inválido.

## El mapeado triplanar: una textura sin coordenadas UV

Una [textura](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl) se aplica gracias a las coordenadas `(u, v)` que lleva cada vértice. Una malla generada por un programa, o un `.obj` sin líneas `vt`, no las tiene. El **mapeado triplanar** (*triplanar mapping*) prescinde de ellas: proyecta la textura según **los tres ejes** (una proyección a lo largo de x, otra a lo largo de y, otra a lo largo de z), usando dos de las coordenadas de la posición como `(u, v)`, y luego mezcla los tres resultados según la orientación de la superficie.

```glsl
uniform sampler2D tex;                  // sampler2D: una textura 2D que el shader puede leer
in vec3 world_pos;                      // posición del fragmento en la escena
in vec3 world_normal;
out vec4 color;

void main()
{
	vec3 w = pow(abs(normalize(world_normal)), vec3(4.0));   // abs: valor absoluto de cada componente
	w /= (w.x + w.y + w.z);                                   // peso por eje, suma igual a 1
	vec3 cx = texture(tex, world_pos.yz).rgb;                 // .yz: componentes y y z de la posición, proyección a lo largo de x
	vec3 cy = texture(tex, world_pos.xz).rgb;                 // a lo largo de y
	vec3 cz = texture(tex, world_pos.xy).rgb;                 // a lo largo de z
	color = vec4(cx * w.x + cy * w.y + cz * w.z, 1.0);
}
```

Una cara orientada hacia x (normal `(1, 0, 0)`) da un peso de 1 a la proyección a lo largo de x: se ve la textura de frente. En una cara oblicua, varios pesos son distintos de cero y las proyecciones se funden. Elevar a la potencia 4 estrecha las zonas de mezcla; de lo contrario la imagen se vuelve borrosa allí donde la normal no está alineada.

El mismo esquema sirve para un motivo **calculado** en lugar de leído de una imagen, por ejemplo ladrillos: una hilera de cada dos está desplazada medio ladrillo, y los bordes de cada ladrillo forman la junta.

```glsl
float brick(vec2 p)                                   // 1 = ladrillo, 0 = junta
{
	p *= vec2(2.0, 4.0);                              // 2 ladrillos de ancho, 4 hileras por unidad
	p.x += 0.5 * mod(floor(p.y), 2.0);                // floor: parte entera; mod: resto de la división
	vec2 f = fract(p);                                // fract: parte tras la coma, posición dentro del ladrillo
	return step(0.06, f.x) * step(0.1, f.y);          // step(s, x): 0 si x < s, 1 si no; 0 en los bordes
}

// en main(), en lugar de las tres lecturas de textura:
float b = brick(world_pos.yz) * w.x + brick(world_pos.xz) * w.y + brick(world_pos.xy) * w.z;
color = vec4(mix(vec3(0.3), vec3(0.7, 0.3, 0.2), b), 1.0);   // gris para la junta, óxido para el ladrillo
```

| Ventaja | Límite |
|---|---|
| Ninguna coordenada `(u, v)` que proporcionar ni reparar (sin costura) | Tres lecturas de textura por píxel en lugar de una |
| Funciona con cualquier malla, incluso deformada en tiempo de ejecución | La textura no sigue la superficie: en un objeto que gira se queda fija en la escena, salvo que se use la posición dentro del objeto en lugar de la de la escena |
| Ningún estiramiento visible en las caras paralelas a los ejes | Desenfoque en las zonas de mezcla, y un motivo orientado (letras) aparece a veces invertido según la cara |

## El picking con el ratón: encontrar qué objeto 3D se ha pulsado

El **picking** responde a una pregunta precisa: ¿sobre qué objeto, en una escena 3D, acaba de hacer clic el usuario, a partir de una posición 2D (`x`, `y`) en pantalla? El principio: convertir ese clic 2D en un **rayo** en el espacio 3D, y luego comprobar qué objeto toca primero ese rayo.

```text
Clic en pantalla (x, y)
      |
      v  inversa de la matriz de proyeccion, luego de la matriz de vista
Rayo 3D, de la camara hacia la escena
      |
      v  interseccion rayo/objeto (prueba cada objeto de la escena)
Objeto mas cercano tocado por ese rayo -> objeto "pulsado"
```

Concretamente, el clic 2D se convierte primero a coordenadas normalizadas (entre -1 y 1), luego la **inversa** de la matriz de proyección devuelve ese punto al espacio de cámara, y la **inversa** de la matriz de vista lo devuelve después al espacio del mundo: dos transformaciones invertidas, en el orden inverso al usado normalmente para mostrar un objeto 3D en pantalla.

> **Nota:** este mecanismo es el inverso exacto del pipeline de renderizado habitual (mundo → vista → proyección → pantalla), de ahí el uso de matrices **inversas**, en orden **inverso**.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La aberración cromática simula la dispersión de la luz calculando la refracción 3 veces (una por canal de color), con un índice de refracción ligeramente distinto cada vez. Una animación procedural recalcula una posición en cada fotograma vía una fórmula que depende del tiempo real transcurrido, sin datos externos. El picking con el ratón convierte un clic 2D en un rayo 3D vía las matrices de proyección/vista invertidas, en el orden inverso del renderizado normal. El reflejo de Fresnel (aproximación de Schlick) hace crecer la parte reflejada con el ángulo de refilón. El ray-marching acumula una densidad con pasos pequeños para una nube interior. Un objeto transparente se dibuja después de los opacos, en dos pasadas (dorso y luego frente) con `GL_SRC_ALPHA`. Un muelle amortiguado alcanza su objetivo sin saltos, y `tanh` acota una deformación con suavidad. El mapeado triplanar texturiza un objeto sin UV proyectando según los tres ejes. |
| **Herramientas utilizables** | Un cubemap para el entorno refractado y reflejado, `reflect`, `mix`, `pow`. `glBlendFunc`, `glCullFace`, `glFrontFace` para la transparencia. Una fórmula temporal (`sinf(tiempo * velocidad)`) o un muelle amortiguado para animar. `tanhf` para acotar. Tres lecturas de textura ponderadas por la normal para el triplanar. La inversa de las matrices de proyección y vista para el picking. |
| **Trampas a evitar** | Una diferencia demasiado grande entre los índices de refracción (resultado irreal). Animar según el número de fotogramas en lugar del tiempo real transcurrido. Dibujar un transparente antes de los opacos, o invertir el orden de los vértices (objeto negro o vacío, sin error). Un muelle sin tope en el paso de tiempo (divergencia, `NaN`). Un `ray-marching` con demasiados pasos (coste por píxel). |
| **Buenas prácticas** | Mantener los índices de refracción cercanos entre sí para un resultado creíble. Basar siempre una animación en el tiempo real, nunca en el número de fotogramas transcurridos. Acotar `dt` en un muelle y rechazar un límite nulo o negativo para `tanh`. Con un objeto negro, probar primero sin `GL_CULL_FACE`. |
