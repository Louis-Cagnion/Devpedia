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

### La ley de Beer-Lambert: por qué la opacidad sigue una exponencial

La línea `opacity += (1.0 - opacity) * ...` del bucle de arriba añade «lo que queda por cubrir» en cada paso: imita una ley física, la ley de Beer-Lambert. En un medio de densidad uniforme (niebla, humo, vidrio esmerilado), cada capa del mismo grosor absorbe la misma **fracción** de la luz que le llega, y no la misma cantidad. La parte de luz que atraviesa (la **transmisión**) disminuye, por tanto, de forma exponencial con el grosor:

```text
transmisión = exp(-densidad x grosor)   parte de la luz que atraviesa, entre 0 y 1
opacidad    = 1 - transmisión           parte detenida: 1 - exp(-densidad x grosor)

densidad: absorción por unidad de grosor (2 = dos unidades de absorción por unidad)
```

`exp(x)` es la función **exponencial** ([ficha de referencia](https://registry.khronos.org/OpenGL-Refpages/gl4/html/exp.xhtml)): el número e (alrededor de 2,718281828) elevado a la potencia `x`. Vale 1 para `x = 0`, y `exp(-x)` se acerca a 0 cuando `x` crece, sin llegar nunca a alcanzarlo ni volverse negativo. La opacidad se mantiene, pues, siempre entre 0 y 1, por grueso o denso que sea el medio. Para una densidad de 2 (valores calculados con un script):

| Grosor | Transmisión `exp(-2 x grosor)` | Opacidad `1 - exp(-2 x grosor)` | Opacidad si simplemente se sumara (`2 x grosor`) |
|---|---|---|---|
| 0 | 1,0000 | 0,0000 | 0 |
| 0,25 | 0,6065 | 0,3935 | 0,5 |
| 0,5 | 0,3679 | 0,6321 | 1 |
| 1 | 0,1353 | 0,8647 | 2 (imposible) |
| 2 | 0,0183 | 0,9817 | 4 (imposible) |
| 3 | 0,0025 | 0,9975 | 6 (imposible) |

Dos mitades de grosor se **multiplican**: 0,3679 x 0,3679 = 0,1353, es decir, exactamente la transmisión del grosor 1 (0,135335 en ambos casos, redondeado a la millonésima). Esto es lo que hace posible el bucle: atravesar la nube capa a capa y multiplicar las transmisiones equivale a atravesar su grosor total de una sola vez.

El bucle de arriba aplica esta multiplicación paso a paso, pero sustituyendo `exp(-x)` por `1 - x`, una buena aproximación solo cuando `x` (aquí `densidad x paso`) es pequeño. Una versión más fiel suma la densidad a lo largo de todo el rayo (el total se llama **grosor óptico**) y aplica `exp` **una sola vez**, a la salida:

```glsl
float opacidad_nube_beer(vec3 entrada, vec3 dir, float grosor)   // mismos parámetros
{
	const int PASOS = 24;                             // número de pasos, fijo
	float long_paso = grosor / float(PASOS);          // longitud de un paso
	float optico = 0.0;                               // grosor óptico acumulado
	for (int i = 0; i < PASOS && optico < 3.0; i++)   // 3.0: opacidad de unos 0,95
	{
		vec3 p = entrada + dir * (float(i) + 0.5) * long_paso;   // mitad del paso i
		optico += density(p) * long_paso * 4.0;                  // suma sin acotar
	}
	return 1.0 - exp(-optico);                        // un solo exp, fuera del bucle
}
```

La salida anticipada probaba `opacity < 0.95`; aquí, `1 - exp(-3)` vale 0,9502, de ahí el umbral de 3 en el grosor óptico. Comparación para una densidad constante de 2 (el factor `4.0` puesto a 1, sin salida anticipada), con el resultado exacto `1 - exp(-densidad x grosor)`:

| Grosor | Exacto | Bucle de arriba, 4 pasos | Bucle de arriba, 24 pasos | Suma y luego `exp`, 4 o 24 pasos |
|---|---|---|---|---|
| 0,5 | 0,6321 | 0,6836 | 0,6399 | 0,6321 |
| 1 | 0,8647 | 0,9375 | 0,8761 | 0,8647 |
| 2 | 0,9817 | 1,0000 | 0,9874 | 0,9817 |

La suma seguida de un `exp` da el resultado exacto sea cual sea la finura del paso cuando la densidad es constante; cuando varía, el error solo viene ya de la finura del muestreo. La trampa de sumar sin límite es más grave que esa diferencia: con 4 pasos, un grosor de 3, la densidad constante de 2 y el factor `4.0` fijado en 1 como en la comparación anterior, el primer paso suma ya `densidad x paso = 1,5`: la opacidad vale 1,5 desde la primera vuelta, la salida anticipada detiene el bucle y devuelve 1,5, una opacidad imposible. Con `1.0 - exp(-optico)`, el resultado nunca sale del intervalo de 0 a 1.

> **Trampa:** una densidad negativa (una función `density` mal acotada) da `exp` de un número positivo, y por tanto una opacidad negativa. De ahí el `clamp(..., 0.0, 1.0)` de `density` más arriba: conservarlo.

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

### Euler semi-implícito: por qué la velocidad se actualiza antes que la posición

El muelle de arriba avanza fotograma a fotograma: es **integración numérica**, una simulación por pequeños pasos donde `dt` (la duración de un fotograma, en segundos, véase [el delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#el-delta-time-una-velocidad-independiente-de-la-maquina)) es el **paso de tiempo**. La regla más simple, el **método de Euler**, dice: «nuevo valor = valor anterior + variación por segundo x `dt`». Un muelle hace evolucionar dos valores a la vez, su posición `pos` y su velocidad `vel`, y el orden de las dos actualizaciones cambia el resultado:

| Método | Orden dentro del paso | Lo que lee cada línea |
|---|---|---|
| Euler **explícito** | `pos += vel x dt`, luego `vel += acel x dt` | Las dos líneas leen el estado del **inicio** del paso |
| Euler **semi-implícito** (el del muelle de arriba) | `vel += acel x dt`, luego `pos += vel x dt` | La posición lee la velocidad **ya actualizada**: un valor del final del paso, de ahí el nombre «semi-implícito» |

La prueba: un muelle **sin amortiguamiento**, estirado a 1 y soltado. En física oscila eternamente con la misma amplitud, porque su **energía** nunca cambia. La energía es la suma de la del movimiento (`0,5 x vel x vel`) y la del estiramiento (`0,5 x rigidez x pos x pos`); aquí, 2 al principio. Un buen método debe mantenerla más o menos constante.

```c
#include <stdio.h>                                  /* printf */

typedef struct s_spring
{
	float	pos;   /* desviación respecto a la posición de reposo */
	float	vel;   /* velocidad de variación de pos, en unidades por segundo */
}	t_spring;

void	paso_explicito(t_spring *s, float rigidez, float dt)
{
	float	acel;

	acel = -rigidez * s->pos;   /* fuerza de recuperación (sin rozamiento aquí) */
	s->pos += s->vel * dt;      /* primero la posición, con la velocidad ANTIGUA */
	s->vel += acel * dt;        /* luego la velocidad, con la posición antigua */
}

void	paso_semi_implicito(t_spring *s, float rigidez, float dt)
{
	float	acel;

	acel = -rigidez * s->pos;   /* fuerza de recuperación, calculada una sola vez */
	s->vel += acel * dt;        /* primero la velocidad... */
	s->pos += s->vel * dt;      /* ...luego la posición, con la velocidad NUEVA */
}

float	energia(t_spring s, float rigidez)
{
	/* energía de movimiento + energía de estiramiento */
	return (0.5f * s.vel * s.vel + 0.5f * rigidez * s.pos * s.pos);
}

int	main(void)
{
	t_spring	a = {1.0f, 0.0f};   /* muelle estirado a 1, soltado sin velocidad */
	t_spring	b = {1.0f, 0.0f};   /* mismo inicio, para el segundo método */
	int			n;

	for (n = 1; n <= 10000; n++)
	{
		paso_explicito(&a, 4.0f, 0.016f);        /* rigidez 4, paso de 16 ms */
		paso_semi_implicito(&b, 4.0f, 0.016f);   /* mismos valores */
		if (n == 1 || n == 100 || n == 1000 || n == 10000)
			printf("paso %5d : explícito %.4f, semi-implícito %.4f\n",
				n, energia(a, 4.0f), energia(b, 4.0f));
	}
	return (0);
}
```

Salida real del programa (compilado con `gcc -Wall -Wextra`):

```text
paso     1 : explícito 2.0020, semi-implícito 1.9980
paso   100 : explícito 2.2155, semi-implícito 1.9963
paso  1000 : explícito 5.5657, semi-implícito 1.9708
paso 10000 : explícito 55710.1133, semi-implícito 2.0244
```

| Método | Energía tras 10 000 pasos (inicio: 2) | Qué pasa |
|---|---|---|
| Euler explícito | 55710,1133 | Cada paso multiplica la energía por `1 + rigidez x dt x dt` (aquí 1,001024): el muelle **gana** energía y sus oscilaciones crecen sin fin |
| Euler semi-implícito | 2,0244 (entre 1,9685 y 2,0325 durante toda la duración) | La energía **oscila** alrededor de 2 sin derivar: la amplitud se mantiene estable todo el tiempo que se quiera |

El factor del explícito se comprueba: 1,001024 elevado a 1000 da 2,7829, y 5,5657 / 2 da efectivamente 2,7829. Un error minúsculo por paso (0,1 %), repetido en cada fotograma, se vuelve enorme en pocos minutos. Con el amortiguamiento de la sección anterior, el defecto persiste: con rigidez 4 y amortiguamiento 0,01 (mismo paso), la energía medida tras 10 000 pasos vale 11240 en explícito, aunque el rozamiento debería apagarla, y 0,41 en semi-implícito, que sí la apaga. Por eso `spring_update` actualiza `vel` **antes** que `pos`, y por eso el orden de las dos líneas no se puede permutar «porque da lo mismo».

El tope sobre `dt` sigue siendo necesario, incluso en semi-implícito: este método solo es estable si `dt` es menor que `2 / sqrt(rigidez)` (`sqrt`: la raíz cuadrada). Para una rigidez de 400, el límite medido por bisección (se corta el intervalo en dos hasta encontrarlo) es 0,10000, es decir `2 / sqrt(400)`. La función de abajo mide la mayor desviación alcanzada en 200 pasos (`isnan` comprueba si un valor es `NaN`, *Not a Number*, el resultado de un cálculo imposible como `inf - inf`, donde `inf` es el infinito):

```c
#include <math.h>                         /* fabsf: valor absoluto; isnan */

/* usa t_spring y paso_semi_implicito, definidos más arriba */
float	pos_max(float rigidez, float dt, int pasos)
{
	t_spring	s = {1.0f, 0.0f};   /* inicio: estirado a 1, sin velocidad */
	float		grande = 1.0f;      /* mayor desviación vista, 1 al principio */
	int			i;

	for (i = 0; i < pasos; i++)
	{
		paso_semi_implicito(&s, rigidez, dt);   /* un paso del método */
		if (isnan(s.pos))                       /* ha explotado: nos detenemos */
			return (s.pos);
		if (fabsf(s.pos) > grande)              /* nuevo récord de desviación */
			grande = fabsf(s.pos);
	}
	return (grande);
}
```

| `dt` (rigidez 400) | Mayor desviación en 200 pasos | Veredicto |
|---|---|---|
| 0,016 (un fotograma a 60 por segundo) | 1,01305 | Estable |
| 0,050 (el tope del muelle de arriba) | 1 | Estable |
| 0,090 | 2,29416 | Amplitud hinchada |
| 0,099 | 7,08858 | Justo por debajo del límite de 0,1: muy hinchada |
| 0,101 | 1,4314e+25 | Justo por encima: divergencia |
| 0,110 | `NaN` (mostrado `-nan`) | Explotado |
| 1,000 (una segunda de pausa) | `NaN` (mostrado `-nan`) | Explotado |

El tope de 0,05 es, pues, seguro mientras la rigidez se mantenga por debajo de 1600 (`2 / 0,05` = 40, y 40 al cuadrado = 1600); con un muelle más rígido, hay que bajar el tope.

> **Trampa:** invertir las dos líneas de actualización no produce ningún error ni advertencia: el muelle parece funcionar, y solo tras segundos o minutos, o con un amortiguamiento débil, la oscilación toma amplitud. Conservar `vel` antes que `pos`, y luego acotar `dt` teniendo en cuenta la rigidez.

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
| **Para recordar** | La aberración cromática simula la dispersión de la luz calculando la refracción 3 veces (una por canal de color), con un índice de refracción ligeramente distinto cada vez. Una animación procedural recalcula una posición en cada fotograma vía una fórmula que depende del tiempo real transcurrido, sin datos externos. El picking con el ratón convierte un clic 2D en un rayo 3D vía las matrices de proyección/vista invertidas, en el orden inverso del renderizado normal. El reflejo de Fresnel (aproximación de Schlick) hace crecer la parte reflejada con el ángulo de refilón. El ray-marching acumula una densidad con pasos pequeños para una nube interior, y la ley de Beer-Lambert (`opacidad = 1 - exp(-densidad x grosor)`) mantiene la opacidad entre 0 y 1. Un objeto transparente se dibuja después de los opacos, en dos pasadas (dorso y luego frente) con `GL_SRC_ALPHA`. Un muelle amortiguado alcanza su objetivo sin saltos, avanzado por Euler semi-implícito (la velocidad se actualiza antes que la posición, lo que mantiene estable la energía, mientras que el Euler explícito la gana en cada paso), y `tanh` acota una deformación con suavidad. El mapeado triplanar texturiza un objeto sin UV proyectando según los tres ejes. |
| **Herramientas utilizables** | Un cubemap para el entorno refractado y reflejado, `reflect`, `mix`, `pow`, `exp` para la atenuación de Beer-Lambert. `glBlendFunc`, `glCullFace`, `glFrontFace` para la transparencia. Una fórmula temporal (`sinf(tiempo * velocidad)`) o un muelle amortiguado para animar. `tanhf` para acotar. Tres lecturas de textura ponderadas por la normal para el triplanar. La inversa de las matrices de proyección y vista para el picking. |
| **Trampas a evitar** | Una diferencia demasiado grande entre los índices de refracción (resultado irreal). Animar según el número de fotogramas en lugar del tiempo real transcurrido. Dibujar un transparente antes de los opacos, o invertir el orden de los vértices (objeto negro o vacío, sin error). Un muelle sin tope en el paso de tiempo (divergencia, `NaN`). Un `ray-marching` con demasiados pasos (coste por píxel). Una opacidad sumada sin `exp` (supera 1). Dos líneas de actualización del muelle en el orden equivocado (la oscilación crece sin error visible). |
| **Buenas prácticas** | Mantener los índices de refracción cercanos entre sí para un resultado creíble. Basar siempre una animación en el tiempo real, nunca en el número de fotogramas transcurridos. Sumar la densidad a lo largo del rayo y aplicar `1.0 - exp(-optico)` una sola vez. Actualizar `vel` antes que `pos`, acotar `dt` bajo `2 / sqrt(rigidez)` en un muelle y rechazar un límite nulo o negativo para `tanh`. Con un objeto negro, probar primero sin `GL_CULL_FACE`. |
