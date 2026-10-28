---
order: 9
---

# El bucle de juego con SFML (28/10/2026)

Un videojuego es un programa que, decenas de veces por segundo, lee lo que hace el jugador, hace avanzar su mundo y luego vuelve a dibujarlo todo. Esta repetición se llama **bucle de juego**. Este capítulo lo construye paso a paso con **SFML** (*Simple and Fast Multimedia Library*), una [biblioteca](/?c=langages&s=c&p=bibliotheques) (código ya escrito que se reutiliza) del lenguaje [C++](/?c=langages&s=cpp&p=cpp) que proporciona lo esencial de un juego 2D: una ventana, el dibujo de imágenes y formas, la lectura del teclado y del ratón, y el sonido.

El capítulo supone conocidos [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [las condiciones](/?c=langages&s=c&p=conditions), [los bucles](/?c=langages&s=c&p=boucles), [las clases y los objetos](/?c=langages&s=cpp&p=classes-et-objets) y [los espacios de nombres](/?c=langages&s=cpp&p=espaces-de-noms) de C++. Para abrir una ventana OpenGL sin SFML, véase [GLFW, GLAD y el bucle de renderizado](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu): el bucle es el mismo, y SFML solo oculta los detalles.

> **Versión:** todo el código de este capítulo está escrito para **SFML 2** (la versión 2.6.1 al 28/10/2026, [documentación oficial](https://www.sfml-dev.org/documentation/2.6.1/)). SFML 3 ha cambiado algunos nombres de clases y de funciones: el código siguiente no compila tal cual con ella.

## Instalar SFML y compilar

SFML se divide en **módulos**, piezas independientes que se enlazan al programa según sus necesidades:

| Módulo | Contenido | Opción de enlace |
|---|---|---|
| System | tiempo (cronómetro), vectores | `-lsfml-system` |
| Window | ventana, eventos, teclado, ratón | `-lsfml-window` |
| Graphics | dibujo de formas, de imágenes y de texto | `-lsfml-graphics` |
| Audio | sonidos y música | `-lsfml-audio` |
| Network | comunicación en red | `-lsfml-network` |

En Debian y Ubuntu, el paquete de desarrollo se instala desde una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) con `sudo apt install libsfml-dev`; los demás sistemas tienen su equivalente (véase la [página de instalación](https://www.sfml-dev.org/tutorials/2.6/start-linux.php) del sitio oficial). El programa se compila después con `g++`, el compilador de C++ de GCC (véase [la compilación](/?c=langages&s=c&p=compilation)):

```bash
# -std=c++17 : versión del lenguaje ; -o juego : nombre del ejecutable producido
# -Wall -Wextra : muestran las advertencias del compilador
# -l<nombre> : enlaza la biblioteca libsfml-<nombre> (módulo Graphics, Window, System)
g++ -std=c++17 -Wall -Wextra juego.cpp -o juego -lsfml-graphics -lsfml-window -lsfml-system
./juego    # ejecuta el programa
```

## Sin bucle, el programa termina enseguida

Un programa C++ ejecuta las líneas de `main` de arriba abajo, y luego se detiene. He aquí el programa SFML más pequeño: abre una ventana, dibuja y termina.

```cpp
#include <SFML/Graphics.hpp>   // cabecera de SFML: ventana, dibujo, tiempo

int main()   // punto de entrada: el programa empieza aquí
{
    // sf:: : espacio de nombres de SFML ; RenderWindow : ventana en la que se dibuja
    // VideoMode(800, 600) : 800 píxeles de ancho y 600 de alto (un píxel: un punto)
    sf::RenderWindow window(sf::VideoMode(800, 600), "Mi bucle de juego");
    window.clear(sf::Color::Black);   // rellena toda la ventana de negro
    window.display();                 // muestra la imagen que acaba de dibujarse
    return 0;   // fin de main: la ventana se destruye y el programa se detiene
}
```

La línea `#include` copia un archivo de cabecera en el programa (véase [`#include` y las cabeceras](/?c=langages&s=c&p=headers)): sin ella, el compilador no conoce `sf::RenderWindow`. Una **ventana** es un rectángulo que el sistema operativo muestra y que el usuario puede mover y cerrar. Aquí aparece unos milisegundos (una milésima de segundo) y luego desaparece: nada impide que `main` llegue a su última línea. Hace falta un bucle que **no devuelva el control hasta que la ventana se cierre**.

## Una vuelta de bucle

Estas son las palabras que se usan a continuación:

| Palabra | Definición |
|---|---|
| **Bucle de juego** (*game loop*) | Código que se repite sin fin mientras el juego funciona; cada repetición es una **vuelta** |
| **Imagen** (*frame*) | Lo que se muestra al final de una vuelta: una vuelta produce una imagen |
| **Delta time** (*dt*) | Duración, en segundos, transcurrida desde la vuelta anterior; explicado en detalle en [el capítulo sobre GLFW](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#el-delta-time-una-velocidad-independiente-de-la-maquina) |
| **Evento** (*event*) | Señal que envía el sistema cuando algo ocurre: tecla pulsada, clic, ventana cerrada |
| **Estado del juego** (*game state*) | Todos los datos que describen el juego en un instante: posiciones, puntuación, vidas, nivel |

Una vuelta encadena siempre los mismos cuatro pasos, en este orden:

```text
              +-------------------------------------------------+
   inicio     | 1. TIEMPO      dt = tiempo de la vuelta previa  |
   de vuelta  |                       |                         |
   ---------->|                       v                         |
              | 2. EVENTOS      leer teclado, ratón, cierre     |
              |                       |                         |
              |                       v                         |
              | 3. ACTUALIZAR   avanzar el estado con dt        |
              |                       |                         |
              |                       v                         |
              | 4. DIBUJO       clear, draw, display            |
              +-----------------------|-------------------------+
                                      |
                  ¿ventana aún abierta? sí: volver al inicio
                                      |
                                      no: fin del programa
```

| Etapa | Pregunta a la que responde | Herramienta SFML 2 |
|---|---|---|
| 1. Tiempo | ¿Cuánto tiempo ha transcurrido desde la última vuelta? | `sf::Clock`, `restart()` |
| 2. Eventos | ¿Qué quiere hacer el jugador? ¿Ha cerrado la ventana? | `pollEvent`, `sf::Event` |
| 3. Actualización | ¿Dónde están ahora las cosas? | código del juego, con `dt` |
| 4. Dibujo | ¿Qué aspecto tiene ahora el mundo? | `clear`, `draw`, `display` |

La actualización **modifica el estado** sin dibujar nada; el dibujo **lee el estado** sin modificar nada. Esta separación permite cambiar una cosa sin tocar la otra.

## Un primer bucle: la ventana que sigue abierta

Antes de añadir el tiempo y la actualización, he aquí el bucle reducido a lo esencial: eventos y dibujo.

```cpp
#include <SFML/Graphics.hpp>   // cabecera de SFML

int main()
{
    sf::RenderWindow window(sf::VideoMode(800, 600), "Mi bucle de juego");

    // isOpen() es verdadero mientras la ventana siga abierta: es el bucle de juego
    while (window.isOpen()) {
        sf::Event event;   // una casilla vacía para recibir un evento (tipo sf::Event)
        // pollEvent guarda en « event » el evento más antiguo pendiente y devuelve
        // verdadero ; devuelve falso cuando ya no quedan: el while vacía toda la cola
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed)   // el usuario ha hecho clic en la cruz
                window.close();                    // cierra la ventana: isOpen() es falso
        }
        window.clear(sf::Color::Black);   // borra la imagen anterior
        window.display();                 // muestra la nueva imagen
    }
    return 0;   // solo se alcanza cuando la ventana está cerrada
}
```

Un **evento** no llega directamente al código: el sistema lo deposita en una **cola** (una lista de la que se extrae en orden de llegada). Varios eventos pueden acumularse durante una vuelta (una tecla pulsada, un ratón desplazado): de ahí el `while` alrededor de `pollEvent` y no un simple `if`. Esta lectura «mira si hay algo, y sigue aunque la cola esté vacía» se llama **polling** («sondeo»).

## La estructura `Game::run`

Un juego real agrupa el bucle y el estado en una [clase](/?c=langages&s=cpp&p=classes-et-objets), a menudo llamada `Game`, cuya función `run` contiene el bucle. Cada etapa de la vuelta se convierte en una función:

| Función | Etapa | Papel |
|---|---|---|
| `run()` | 1 | Mide `dt`, luego llama a las otras tres en orden, mientras la ventana esté abierta |
| `processEvents()` | 2 | Vacía la cola de eventos (cierre, tecla Esc) |
| `update(float dt)` | 3 | Hace avanzar el estado del juego durante `dt` segundos |
| `render()` | 4 | Dibuja el estado y lo muestra |

El programa completo: un cuadrado verde que desplazan las flechas del teclado.

```cpp
#include <SFML/Graphics.hpp>   // cabecera de SFML

// Una clase agrupa el estado del juego y las funciones que lo hacen vivir
class Game {
public:   // lo que puede usarse desde fuera de la clase
    // Constructor: se llama al crear un Game ; después de « : », la lista
    // de inicialización construye cada miembro (en el orden de su declaración más abajo)
    Game()
        : window(sf::VideoMode(800, 600), "Mi bucle de juego"),
          player(sf::Vector2f(50.f, 50.f))   // cuadrado de 50 x 50 píxeles ; 50.f es un float
    {
        window.setFramerateLimit(60);   // límite de 60 imágenes por segundo (véase más abajo)
        player.setFillColor(sf::Color::Green);   // color de relleno del cuadrado
        player.setPosition(375.f, 275.f);    // esquina superior izquierda: centra el cuadrado
    }

    void run()   // void : la función no devuelve nada
    {
        sf::Clock clock;   // cronómetro ; arranca al crearse
        while (window.isOpen()) {   // una vuelta de bucle por imagen
            // restart() pone el cronómetro a cero y devuelve el tiempo transcurrido,
            // desde su último inicio, en un sf::Time ; asSeconds() lo da en segundos
            float dt = clock.restart().asSeconds();
            processEvents();   // etapa 2: los eventos
            update(dt);        // etapa 3: el estado del juego
            render();          // etapa 4: la imagen
        }
    }

private:   // lo que solo puede usarse desde dentro de la clase
    void processEvents()
    {
        sf::Event event;
        while (window.pollEvent(event)) {   // vacía la cola de eventos, como más arriba
            if (event.type == sf::Event::Closed)   // clic en la cruz de la ventana
                window.close();
            // && : « y » ; KeyPressed : una tecla acaba de pulsarse
            if (event.type == sf::Event::KeyPressed
                && event.key.code == sf::Keyboard::Escape)   // la tecla Esc
                window.close();
        }
    }

    void update(float dt)   // dt : segundos transcurridos desde la vuelta anterior
    {
        const float speed = 200.f;   // const : ya no cambiará ; 200 píxeles por segundo
        // sf::Vector2f : un vector de dos float, x (horizontal) e y (vertical)
        sf::Vector2f direction(0.f, 0.f);   // dirección deseada ; (0, 0) : ninguna
        // isKeyPressed: verdadero mientras la tecla esté pulsada, en ese instante
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Left))
            direction.x -= 1.f;   // hacia la izquierda: x disminuye
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Right))
            direction.x += 1.f;   // hacia la derecha: x aumenta
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Up))
            direction.y -= 1.f;   // hacia arriba: y disminuye (el eje y baja en SFML)
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Down))
            direction.y += 1.f;   // hacia abajo: y aumenta
        player.move(direction * speed * dt);   // desplaza según x, velocidad y dt
    }

    void render()
    {
        window.clear(sf::Color::Black);   // borra la imagen anterior
        window.draw(player);              // dibuja el cuadrado en su posición actual
        window.display();                 // muestra la imagen terminada
    }

    sf::RenderWindow window;     // la ventana (declarada primero, construida primero)
    sf::RectangleShape player;   // el cuadrado del jugador: una forma rectangular
};

int main()
{
    Game game;     // construye el juego: la ventana se abre
    game.run();    // el bucle gira hasta el cierre de la ventana
    return 0;
}
```

Las referencias de SFML 2 que hay que conocer para leer este código:

| Elemento | Qué es |
|---|---|
| `sf::RenderWindow` | La ventana **en la que se dibuja**: también lee los eventos (`pollEvent`) y se cierra (`close`) |
| `sf::Event` | Un evento; su campo `type` indica cuál (`Closed`, `KeyPressed`...), y `key.code` da la tecla de un `KeyPressed` |
| `sf::Clock` | Un cronómetro; `restart()` lo pone a cero **y** devuelve el tiempo transcurrido desde su último inicio |
| `sf::Time` | Una duración; `asSeconds()` la da en segundos (`float`), `asMilliseconds()` en milisegundos |
| `window.clear(color)` | Rellena toda la zona de dibujo con un color, para borrar la imagen anterior |
| `window.draw(objeto)` | Dibuja un objeto en una zona **invisible** (el búfer trasero, véase la línea siguiente), todavía no en pantalla |
| `window.display()` | Intercambia los dos búferes: la imagen terminada pasa a ser visible. Es el [double buffering](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#el-double-buffering-evitar-la-imagen-a-medio-dibujar) (el dibujo se hace en un búfer invisible, que se intercambia de golpe con el que está en pantalla), el papel de `glfwSwapBuffers` |

Dos maneras de leer el teclado coexisten, para dos necesidades distintas:

| | Evento `KeyPressed` | Estado `isKeyPressed` |
|---|---|---|
| Dónde | En `processEvents`, mediante `pollEvent` | En `update`, en cada vuelta |
| Cuándo | Una vez al pulsar la tecla, luego repetido por el sistema si se mantiene (`setKeyRepeatEnabled(false)` suprime la repetición) | En cada vuelta, verdadero mientras la tecla esté pulsada |
| Sirve para | Una acción puntual: salir, pausar, disparar una vez | Un movimiento continuo: andar, girar |

## La velocidad: píxeles por segundo, multiplicados por el delta time

En `update`, `player.move(direction * speed * dt)` desplaza el cuadrado `200 x dt` píxeles. La velocidad se expresa en **píxeles por segundo** y no en píxeles por imagen. El principio (y su trampa del paso fijo) se explica en [el capítulo sobre GLFW](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#el-delta-time-una-velocidad-independiente-de-la-maquina); aquí solo van las cifras para una velocidad de 200 píxeles por segundo, comparada con un paso fijo de 5 píxeles por imagen (valores calculados por un programa de prueba):

| Máquina | `dt` | Desplazamiento por imagen (200 x `dt`) | Tras 1 segundo | Paso fijo de 5 px por imagen tras 1 s |
|---|---|---|---|---|
| 60 imágenes por segundo | 1 / 60 = 0,0167 s | 3,33 px | 60 x 3,33 = **200 px** | 60 x 5 = 300 px |
| 30 imágenes por segundo | 1 / 30 = 0,0333 s | 6,67 px | 30 x 6,67 = **200 px** | 30 x 5 = 150 px |

Cada imagen avanza menos cuando hay más, pero el total por segundo sigue siendo 200: el jugador no nota ninguna diferencia de velocidad entre las dos máquinas, salvo en la fluidez.

> **Trampa (entero contra flotante):** un **flotante** (`float`) es un número con coma; un **entero** (`int`) no la tiene y **trunca** (suprime la parte decimal: 3,33 se convierte en 3). Con enteros, la velocidad se desvía o se detiene. A 60 imágenes por segundo, `static_cast<int>(200 * dt)` (que convierte el número en entero, véase [los casts de C++](/?c=langages&s=cpp&p=cast-cpp)) vale 3: tras un segundo, el cuadrado solo ha recorrido 180 píxeles en lugar de 200. A 144 imágenes por segundo y 50 píxeles por segundo, el paso vale 0,347 px, truncado a 0: **el cuadrado nunca se mueve**. Del mismo modo, `float dt = 1 / 60;` da 0, porque la división de dos enteros es entera: escribir `1.f / 60`. Mantener `dt`, la velocidad y la posición en `float`.

> **Trampa (delta time enorme):** tras una pausa (el programa suspendido, un punto de parada en el depurador), o en algunos sistemas cuando el usuario mueve la ventana (el bucle puede congelarse durante todo el desplazamiento), el primer `dt` siguiente puede valer varios segundos. Para una pausa de 3 segundos, el cuadrado salta de golpe 200 x 3 = **600 píxeles**, fuera de la pantalla. Se **limita** `dt`: por encima del límite, el juego se ralentiza durante una imagen en lugar de dar un salto. Con un límite de 0,1 s, el salto baja a 200 x 0,1 = 20 píxeles.

```cpp
float dt = clock.restart().asSeconds();   // duración de la vuelta anterior, en segundos
if (dt > 0.1f)   // más de 0,1 s: ha habido una pausa (menos de 10 imágenes por segundo)
    dt = 0.1f;   // se limita: el juego actúa como si solo hubieran pasado 0,1 s
```

> **Trampa (cronómetro creado demasiado pronto):** `sf::Clock` arranca al crearse. Creado en el constructor de `Game`, también cuenta el tiempo de carga de la ventana: el primer `dt` sería demasiado grande. Por eso se crea justo antes del bucle, como en `run()`. Un mismo cronómetro tampoco debe servir para dos usos: véase [un solo cronómetro por uso](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#un-solo-cronometro-por-uso).

## El desplazamiento en diagonal: la normalización

En el programa anterior, pulsar dos flechas a la vez (derecha y abajo) suma las dos direcciones. Un [vector](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) es una lista de números tratada como una sola cosa; aquí, el par `(x, y)`. La dirección deseada es, pues, `(1, 0) + (0, 1) = (1, 1)`. Su longitud (su **norma**, véase [la norma de un vector](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire#la-norma-de-un-vector-su-longitud)) se calcula con el teorema de Pitágoras: la **raíz cuadrada** (el número que, multiplicado por sí mismo, da el número de partida) de la suma de los cuadrados de las componentes.

```text
longitud((1, 0)) = raíz(1 x 1 + 0 x 0) = raíz(1) = 1
longitud((1, 1)) = raíz(1 x 1 + 1 x 1) = raíz(2) = 1,4142... es decir, unos 1,41
```

El cuadrado que avanza en diagonal recorre, pues, cada segundo 1,41 veces la distancia de un desplazamiento recto. Medido en un segundo a 60 imágenes por segundo, con velocidad 200:

| Teclas | Dirección | Longitud de la dirección | Distancia recorrida en 1 s |
|---|---|---|---|
| Derecha sola | `(1, 0)` | 1 | 200 px |
| Derecha + Abajo, sin corrección | `(1, 1)` | 1,41 | **282,84 px** (200 en x y 200 en y) |
| Derecha + Abajo, **normalizada** | `(0,7071; 0,7071)` | 1 | 200 px (141,42 en cada eje) |
| Izquierda + Derecha | `(0, 0)` | 0 | 0 px |

**Normalizar** un vector (véase [el capítulo sobre los vectores](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire#la-norma-de-un-vector-su-longitud)) consiste en dividir cada una de sus componentes entre su longitud: la dirección sigue siendo la misma, y la longitud pasa a ser exactamente 1. Aquí, `(1 / 1,41 ; 1 / 1,41) = (0,7071 ; 0,7071)`, de longitud `raíz(0,7071² + 0,7071²) = raíz(1) = 1`. Se normaliza la dirección **antes** de multiplicarla por la velocidad.

La última fila de la tabla es la trampa: izquierda y derecha pulsadas juntas se anulan, y la dirección es el **vector nulo** `(0, 0)`, de longitud 0. Normalizar es dividir entre 0: el resultado es **NaN** (*Not a Number*, «no es un número», el valor que produce `0 / 0`). Una posición que pasa a NaN se queda así, porque cualquier cálculo con NaN da NaN, y el cuadrado **desaparece de la pantalla** para siempre. De ahí una guarda: nunca se normaliza un vector nulo.

```cpp
#include <cmath>   // cabecera de las funciones matemáticas de C++: std::sqrt
// ... el resto de Game no cambia ; solo se reemplaza la función update:

void update(float dt)
{
    const float speed = 200.f;   // píxeles por segundo
    sf::Vector2f direction(0.f, 0.f);
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Left))
        direction.x -= 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Right))
        direction.x += 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Up))
        direction.y -= 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Down))
        direction.y += 1.f;

    // std::sqrt calcula la raíz cuadrada ; la longitud es la del teorema de Pitágoras
    float length = std::sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length > 0.f) {   // GUARDA: nunca una división entre una longitud nula
        direction /= length;   // normaliza: cada componente se divide entre la longitud
        player.move(direction * speed * dt);   // velocidad x dt, en la dirección normalizada
    }
}
```

Medido con un pequeño programa de prueba escrito para este capítulo (sin SFML): sin guarda, `(0, 0)` normalizado da `(nan, nan)` (el signo que se muestra varía según la máquina); con guarda, `(0, 0)`.

## Una operación larga dentro de una vuelta congela el juego

Los eventos solo se leen en la etapa 2 de **cada** vuelta. Una vuelta que dura 2 segundos deja al jugador sin respuesta durante 2 segundos: ninguna tecla se procesa, la ventana no se vuelve a dibujar, y el sistema puede mostrar «no responde» y proponer cerrar el programa. El tiempo disponible por vuelta depende de la cadencia buscada:

| Imágenes por segundo buscadas | Duración disponible por vuelta (1000 ms / imágenes) |
|---|---|
| 30 | 33,33 ms (un milisegundo, ms, es una milésima de segundo) |
| 60 | 16,67 ms |
| 144 | 6,94 ms |

Una actualización más lenta que este presupuesto hace caer la cadencia: con 50 ms por vuelta, el juego va a 20 imágenes por segundo. Dos remedios:

| Remedio | Principio |
|---|---|
| **Dividir el trabajo** | Hacer una pequeña porción por vuelta (un nivel pesado en una de cada diez imágenes), de forma que cada vuelta se mantenga dentro del presupuesto |
| **Delegar en otro hilo de ejecución** (*thread*) | Un **hilo** es un segundo recorrido del programa, que avanza al mismo tiempo que el primero (véase [los hilos](/?c=langages&s=c&p=threads)): el cálculo pesado se hace mientras el bucle sigue girando; a cambio, los dos hilos no deben modificar los mismos datos al mismo tiempo |

```cpp
// Mal: toda la carga en una sola vuelta, la ventana se queda congelada durante 2 segundos
void update(float dt)
{
    loadAllLevels();   // función imaginaria, muy larga
}

// Mejor: una sola porción por vuelta ; loaded y total son dos enteros de la clase
void update(float dt)
{
    if (loaded < total)           // queda trabajo por hacer
        loadOneLevel(loaded++);   // función imaginaria: carga un nivel, pasa al siguiente
}
```

## Sin límite de imágenes, el bucle consume todo el procesador

Nada en el bucle le obliga a esperar: encadena las vueltas tan deprisa como puede, miles de imágenes por segundo, de las que casi ninguna es visible (una pantalla solo muestra 60 o 144 imágenes por segundo). Un **núcleo** del procesador (una de las unidades de cálculo independientes de las que está hecho) funciona entonces al 100 % sin ningún fin: el ordenador se calienta, el ventilador se acelera, la batería se agota. Existen dos ajustes en SFML 2:

| Ajuste | Efecto | Observación |
|---|---|---|
| Ninguno | Cadencia máxima, un núcleo al 100 % | A evitar, salvo para medir el rendimiento |
| `window.setFramerateLimit(60)` | Tras cada `display()`, el programa duerme lo justo para no superar 60 imágenes por segundo | Ajuste simple; la cadencia real es aproximada |
| `window.setVerticalSyncEnabled(true)` | `display()` espera al próximo refresco de la pantalla: véase [la sincronización vertical](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#la-sincronizacion-vertical-vsync) | Evita el *tearing* (imagen cortada en dos, véase el double buffering); el controlador puede desactivarla |

La documentación de SFML desaconseja activar los dos a la vez. Ninguno de los dos regula la **velocidad** del juego: solo lo hace el delta time, porque la cadencia real varía de una máquina a otra.

## El orden de las etapas importa

Las cuatro etapas no son intercambiables. Cada permutación produce un defecto preciso:

| Orden incorrecto | Síntoma |
|---|---|
| `clear` **después** de `draw` (antes de `display`) | Pantalla vacía: el dibujo se borra antes de mostrarse |
| `display` **antes** de `draw` | La imagen mostrada va con una vuelta de retraso, a veces parpadeante |
| `render` **antes** de `update` | Lo dibujado es el estado anterior a la actualización: una vuelta de retraso |
| `update` **antes** de `processEvents` | Las órdenes del jugador solo se tienen en cuenta en la vuelta siguiente: una imagen de latencia de más |

El orden de referencia: tiempo, eventos, actualización, y luego `clear`, `draw`, `display`.

## La alternativa: el bucle guiado por eventos

En lugar de consultar la cola en cada vuelta (*polling*), el programa puede **dormirse** hasta que llegue un evento: es una **espera bloqueante** (el programa queda suspendido y casi no consume nada mientras no pasa nada). SFML 2 lo ofrece con `waitEvent`, que se bloquea hasta que llega un evento y luego lo devuelve:

```cpp
// Va en la clase Game, junto a run(): un bucle que reacciona, sin dt
void runEventDriven()
{
    render();           // un primer dibujo, antes de la primera espera
    sf::Event event;
    // waitEvent duerme el programa hasta que llega un evento, y lo guarda en
    // « event » ; devuelve falso si hay un error, lo que detiene el bucle
    while (window.isOpen() && window.waitEvent(event)) {
        if (event.type == sf::Event::Closed)   // clic en la cruz
            window.close();
        if (event.type == sf::Event::KeyPressed
            && event.key.code == sf::Keyboard::Right)
            player.move(10.f, 0.f);   // paso fijo de 10 píxeles por pulsación
        render();                     // solo se vuelve a dibujar tras un evento
    }
}
```

Aquí, **nada se mueve sin evento**: el cuadrado avanza un paso en cada pulsación, nunca solo. No hace falta `dt`: el desplazamiento depende del evento, no del tiempo. Un juego de acción necesita lo contrario (los enemigos avanzan aunque el jugador no toque nada).

| | Bucle continuo (`pollEvent`) | Bucle guiado por eventos (`waitEvent`) |
|---|---|---|
| Principio | Una vuelta tras otra, sin esperar | El programa duerme hasta el siguiente evento |
| Cálculo en reposo | Constante: una vuelta completa por imagen, incluso sin nada que hacer | Casi nulo: el procesador queda libre |
| Si el jugador no hace nada | El mundo sigue avanzando (enemigos, caída, animaciones) | Nada se mueve |
| Delta time | Indispensable | Sin objeto para el movimiento |
| Límite de imágenes | Necesario | Inútil: el ritmo lo marcan los eventos |
| Sirve para | Juegos de acción, simulaciones, animaciones | Editores, juegos por turnos (ajedrez, cartas), herramientas |
| Trampa principal | Bucle demasiado glotón o congelado por un cálculo largo | Animación imposible, porque nada despierta el bucle |

Los dos bucles pueden combinarse: una aplicación de edición espera eventos mientras el usuario no actúa, y pasa a bucle continuo durante una animación.

## Las trampas

| Trampa | Síntoma | Corrección |
|---|---|---|
| Sin bucle | La ventana aparece y desaparece enseguida | `while (window.isOpen())` alrededor de la vuelta |
| Una operación larga dentro de una vuelta | Ventana congelada, «no responde» | Dividir el trabajo o confiarlo a otro hilo de ejecución |
| Sin límite de imágenes | Un núcleo al 100 %, ventilador ruidoso | `setFramerateLimit(60)` **o** `setVerticalSyncEnabled(true)`, no los dos |
| Orden de las etapas incorrecto | Pantalla vacía, imágenes atrasadas, latencia | Tiempo, eventos, actualización, `clear`, `draw`, `display` |
| `dt` enorme tras una pausa o un desplazamiento de la ventana | El cuadrado salta varios cientos de píxeles | Limitar `dt` (por ejemplo a 0,1 s) |
| Olvidar `window.clear()` | Cada imagen se superpone a las anteriores: estelas, imagen que se arrastra | Borrar al inicio de cada dibujo |
| Leer un movimiento continuo en `KeyPressed` | Un solo paso por pulsación, luego una pausa, luego pasos a tirones (la repetición del sistema) | `isKeyPressed` en `update` para un movimiento continuo; `KeyPressed` para las acciones puntuales |
| Creer que `isKeyPressed` depende de la ventana | Lee el teclado en cualquier momento: el cuadrado se mueve aunque el usuario escriba en otra ventana | Tener en cuenta las teclas solo si `window.hasFocus()` es verdadero (la ventana es la que recibe el teclado: el *focus*) |
| Enteros en la velocidad o en `dt` | Velocidad demasiado baja, incluso nula; `1 / 60` vale 0 | Todo en `float`; escribir `1.f / 60` |
| Sumar las teclas sin normalizar | Diagonal 1,41 veces más rápida | Normalizar la dirección |
| Normalizar un vector nulo | División entre 0, NaN, cuadrado desaparecido | Comprobar `length > 0.f` antes de dividir |
| Un solo cronómetro para dos usos | `dt` incorrecto | Un `sf::Clock` por uso |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Una función por etapa (`processEvents`, `update`, `render`) | Cada etapa se lee, se prueba y se modifica por separado |
| `update` no dibuja, `render` no modifica el estado | El estado sigue siendo coherente; se puede cambiar la presentación sin tocar las reglas del juego |
| Todas las velocidades en unidades por segundo, multiplicadas por `dt` | La misma velocidad en todas las máquinas |
| Limitar `dt` | Una pausa ya no teletransporta los objetos |
| Un límite de imágenes (`setFramerateLimit` o vsync) | El procesador no se desperdicia |
| Normalizar la dirección, con guarda contra el vector nulo | Misma velocidad en todas las direcciones, nunca NaN |
| Evento para las acciones puntuales, `isKeyPressed` para los movimientos continuos | Cada necesidad usa la herramienta que le corresponde |
| Mantener `update` corta; dividir o delegar los cálculos grandes | La ventana sigue siendo reactiva |
| Elegir el bucle según el programa: continuo para un mundo que vive solo, guiado por eventos para una herramienta | Un bucle continuo sin motivo gasta la batería |

Para profundizar: el [tutorial oficial sobre los eventos](https://www.sfml-dev.org/tutorials/2.6/window-events.php) (`pollEvent`, `waitEvent`, tipos de eventos), la página de [`sf::Clock`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Clock.php) (el cronómetro y `restart()`), la página de [`sf::Keyboard`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Keyboard.php) (`isKeyPressed` y los nombres de las teclas) y la página de [`sf::Window`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Window.php) (`setFramerateLimit`, `setVerticalSyncEnabled`, `hasFocus`).

## Lo que hay que recordar

| Para recordar | Detalle |
|---|---|
| Sin bucle, el programa termina | `main` se detiene en su última línea: la ventana desaparece enseguida |
| Una vuelta = cuatro etapas en este orden | Tiempo (`dt`), eventos, actualización del estado, dibujo (`clear`, `draw`, `display`) |
| `Game::run` | El bucle `while (window.isOpen())` llama a `processEvents`, `update(dt)` y `render`; `dt = clock.restart().asSeconds()` |
| Velocidad | En píxeles por segundo, multiplicada por `dt`: 200 px/s da 3,33 px por imagen a 60 imágenes por segundo y 6,67 px a 30, es decir, 200 px en ambos casos |
| Diagonal | `(1, 1)` tiene longitud raíz(2), unos 1,41: el desplazamiento va 1,41 veces más rápido; se normaliza (división entre la longitud) |
| Vector nulo | Nunca se normaliza: `length > 0.f` antes de la división, o NaN |
| Bucle continuo frente a bucle guiado por eventos | `pollEvent` (el mundo avanza solo, coste constante) frente a `waitEvent` (casi ningún cálculo en reposo, pero nada se mueve sin evento) |
| Límites | Una operación larga congela el juego; sin límite de imágenes el bucle consume un núcleo entero; el orden de las etapas importa |
| Trampas de `dt` | Limitar tras una pausa; todo en `float`; un cronómetro por uso |
| No confundir | Evento `KeyPressed` (puntual) e `isKeyPressed` (estado continuo) |
