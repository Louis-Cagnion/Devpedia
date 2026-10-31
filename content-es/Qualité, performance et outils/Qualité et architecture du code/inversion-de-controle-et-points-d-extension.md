---
order: 14
---

# Inversión de control y puntos de extensión: hooks, eventos, dependencia opcional

En un programa pequeño, es su código el que decide todo: arranca, llama a funciones y luego termina. En una aplicación construida sobre un **framework** (una gran base de código ya escrita, que proporciona el esqueleto de la aplicación: recepción de peticiones, visualización, guardado de datos), ocurre lo contrario. Usted solo escribe fragmentos, y es el framework quien decide cuándo ejecutarlos. Esta inversión se llama **inversión de control**. Este capítulo la explica con pequeños programas que puede copiar, y luego muestra cómo crear sus propios puntos de enganche y cómo depender de otro módulo sin romper la aplicación cuando está ausente.

## La idea: dejar de llamar, dejarse llamar

Una **biblioteca** es un conjunto de funciones que usted llama cuando las necesita. Un framework, en cambio, llama a su código. A menudo se resume esta idea con la frase « no nos llame, nosotros le llamaremos ».

| | Biblioteca | Framework |
|---|---|---|
| Quién arranca el programa | Su código | El framework |
| Quién decide el orden de las llamadas | Usted | El framework |
| Lo que usted escribe | Llamadas a funciones | Fragmentos que el framework vuelve a llamar |
| Analogía | Usted cocina con utensilios | Usted entrega una receta al restaurante, y la cocina la ejecuta cuando llega un pedido |

```text
Sin inversión de control             Con inversión de control

  su código ──llama──> herramienta   framework ──llama──> su código
  (usted decide cuándo)              (él decide cuándo, usted declara qué)
```

La ventaja: el framework puede añadir, reemplazar o quitar fragmentos sin modificar los demás. La contrapartida: para que el framework conozca su código, hay que **declararlo**.

## Lo que se declara: ruta, hook, servicio, plugin

Una **declaración** es una información que se da al framework (en un archivo de configuración o mediante una convención de nombres) y que dice « cuando ocurre tal situación, llama a esto ».

| Lo que usted declara | Situación que dispara la llamada | Ejemplo genérico |
|---|---|---|
| Una **ruta** | Un visitante pide una dirección | `/hola` llama a la función `mostrarHola` |
| Un **hook** (gancho) | El framework llega a un momento preciso de su trabajo | « antes de mostrar una página », « cada noche » |
| Un **suscriptor de evento** | Otro fragmento de código anuncia un evento | « acaba de crearse un pedido » |
| Un **servicio** | Un fragmento de código necesita una funcionalidad compartida | Un servicio de envío de correos electrónicos |
| Un **plugin** | El framework busca un componente de un tipo preciso | Un nuevo tipo de bloque de visualización |

Los servicios (y el contenedor que los fabrica) y las arquitecturas con plugins tienen capítulos aparte: aquí solo se tratan las rutas, los hooks, los eventos y la dependencia entre módulos. El mecanismo de [inyección de dependencias](/?c=langages&s=php&p=poo) (recibir un objeto desde fuera en lugar de crearlo uno mismo) es la misma idea aplicada a los objetos.

## Primer ejemplo: una ruta declarada

Este pequeño núcleo memoriza rutas (una **ruta** asocia una dirección con la función que responde a ella) y llama a la función adecuada. Los elementos de sintaxis PHP utilizados se describen justo después.

```php
<?php
final class Nucleo
{
    private array $rutas = [];  // registro: dirección => función a llamar

    public function ruta(string $direccion, callable $accion): void
    {
        $this->rutas[$direccion] = $accion;  // el proyecto declara, el núcleo memoriza
    }

    public function tratar(string $direccion): string
    {
        $accion = $this->rutas[$direccion] ?? fn() => 'Error 404';  // respaldo si desconocida
        return $accion();  // es el núcleo quien llama al código del proyecto
    }
}

$nucleo = new Nucleo();
$nucleo->ruta('/hola', fn() => 'Hola mundo');  // declaración en el lado del proyecto
echo $nucleo->tratar('/hola'), "\n";  // el núcleo encuentra y llama a la función
echo $nucleo->tratar('/ausente'), "\n";  // ninguna declaración: respaldo 404
```

Resultado obtenido al ejecutar:

```text
Hola mundo
Error 404
```

| Sintaxis PHP | Significado |
|---|---|
| `final class` | Clase que ninguna otra clase puede extender (véase [la POO en PHP](/?c=langages&s=php&p=poo)) |
| `private array $rutas = []` | Propiedad oculta desde el exterior, de tipo array (tabla), vacía al principio |
| `callable` | Tipo de un valor que se puede llamar como una función |
| `fn() => 'texto'` | Función anónima corta: no tiene nombre y devuelve el valor tras la flecha |
| `$a ?? $b` | Vale `$a` si existe; si no, vale `$b` |
| `$accion()` | Llama a la función guardada en la variable `$accion` |

El proyecto no contiene ningún `tratar()`: solo llama a `ruta()`. La llamada a su función queda totalmente decidida por el núcleo.

## El hook: una convención de nombres

Un **hook** es un punto preciso del trabajo del framework en el que cada módulo puede engancharse. En el estilo más simple, el framework busca funciones cuyo nombre sigue una regla: `<nombre del módulo>_<nombre del hook>`. Un **módulo** es aquí un paquete de código que se activa o se desactiva.

```php
<?php
function blog_cron(): string { return 'blog: purga de borradores'; }
function stats_cron(): string { return 'stats: cálculo del informe'; }

$modulos = ['blog', 'stats', 'galeria'];  // módulos activados (galeria no tiene cron)
foreach ($modulos as $modulo) {
    $hook = $modulo . '_cron';  // nombre construido: módulo + '_' + nombre del hook
    if (function_exists($hook)) {  // ¿el módulo ha escrito esta función?
        echo $hook(), "\n";  // llamada a una función cuyo nombre está en $hook
    }
}
```

Resultado:

```text
blog: purga de borradores
stats: cálculo del informe
```

El hook `cron` (una tarea que se lanza a intervalos regulares, véase [la automatización](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow)) se llama para `blog` y `stats`. El módulo `galeria` no ha escrito nada: `function_exists` (que responde `true` si existe una función con ese nombre) evita el error y el módulo se ignora. No hacía falta ninguna declaración: el nombre de la función basta.

El mismo principio, aplicado a los asistentes de inteligencia artificial, se describe en [los hooks de un agente LLM](/?c=ia&s=configuration-de-llms&p=hooks).

## El suscriptor de evento y su prioridad

Un **evento** es el anuncio « acaba de ocurrir algo » (se crea un pedido). Los fragmentos de código interesados se **suscriben**: proporcionan una función, que se llama en cada anuncio. En una página web, `addEventListener` desempeña ese papel (véase [el DOM y la gestión de eventos](/?c=langages&s=javascript&p=dom-et-evenements)). Cuando varios suscriptores escuchan el mismo evento, el orden importa: se regula con una **prioridad**, un número entero. El mayor pasa primero.

```js
class Despachador {
  constructor() {
    this.oyentes = new Map();  // nombre de evento => lista de suscriptores
  }

  suscribir(evento, oyente, prioridad = 0) {
    const lista = this.oyentes.get(evento) ?? [];  // lista existente o vacía
    lista.push({ oyente, prioridad });  // añadimos el suscriptor con su prioridad
    lista.sort((a, b) => b.prioridad - a.prioridad);  // mayor prioridad primero
    this.oyentes.set(evento, lista);  // guardamos la lista ordenada
  }

  despachar(evento, carga) {
    for (const { oyente } of this.oyentes.get(evento) ?? []) {
      if (oyente(carga) === false) {  // un suscriptor responde false: nos detenemos
        return false;
      }
    }
    return true;  // todos los suscriptores han pasado
  }
}

const despachador = new Despachador();
despachador.suscribir('pedido.creado', (c) => console.log('diario:', c.id), -10);
despachador.suscribir('pedido.creado', (c) => console.log('correo a', c.cliente));
despachador.suscribir('pedido.creado', (c) => c.cliente !== 'vetado', 100);

console.log(despachador.despachar('pedido.creado', { id: 1, cliente: 'Alicia' }));
console.log(despachador.despachar('pedido.creado', { id: 2, cliente: 'vetado' }));
```

Resultado:

```text
correo a Alicia
diario: 1
true
false
```

| Término JavaScript | Significado |
|---|---|
| `Map` | Diccionario: asocia una clave (aquí el nombre del evento) a un valor |
| `carga` | Carga útil: los datos adjuntos al anuncio (aquí, el pedido) |
| `lista.sort((a, b) => ...)` | Ordena la lista; la función compara dos elementos, `b - a` da el orden descendente |
| `for (const { oyente } of ...)` | Recorre la lista extrayendo el campo `oyente` de cada elemento |

Para Alicia, el suscriptor de prioridad 100 (control) responde `true`, luego el de prioridad 0 envía el correo, y después el de prioridad -10 escribe en el diario. Para el cliente vetado, el control responde `false`: los otros dos no se llaman nunca. Dos suscriptores con la misma prioridad se ejecutan en el orden de suscripción, porque la ordenación de JavaScript es estable (no reordena los elementos iguales).

## Hook o evento: cuál elegir

| | Hook (convención de nombre) | Suscriptor de evento |
|---|---|---|
| Cómo se encuentra el código | El framework busca el nombre `módulo_hook` | El código se suscribe explícitamente |
| Orden de ejecución | Orden de los módulos (a menudo un peso configurable) | Prioridad fijada al suscribirse |
| Detener el resto | Raramente posible | Posible (la propagación se detiene) |
| Lo que se transmite | Los argumentos de la función | Un objeto evento, modificable |
| Forma típica | Funciones procedurales | Clases o funciones anónimas |

Los dos sirven a la misma idea. Un framework antiguo suele usar hooks, uno reciente da preferencia a los eventos, y muchos ofrecen ambos.

## Crear su propio punto de extensión: `invokeAll` y `alter`

Un framework no tiene el monopolio de los puntos de enganche: su propio módulo puede declarar algunos, para que otros módulos se enganchen a ellos sin modificarlo. Dos formas muy habituales:

| Forma | Papel | Valor devuelto |
|---|---|---|
| `invokeAll(hook, args)` | Llama a **todas** las implementaciones del hook y reúne sus respuestas | Un array: una respuesta por módulo |
| `alter(hook, datos)` | Entrega el dato **ya construido** a cada módulo, que puede modificarlo | Nada: el dato se modifica en el sitio |

`invokeAll` sirve para **recoger** (cada módulo aporta enlaces de menú). `alter` sirve para **retocar** el resultado final (un módulo quita uno).

```php
<?php
function blog_menu_links(): array { return ['inicio' => '/', 'blog' => '/blog']; }
function stats_menu_links(): array { return ['stats' => '/stats']; }
function prive_menu_links_alter(array &$enlaces): void { unset($enlaces['stats']); }

final class GestorModulos
{
    public function __construct(private array $modulos) {}  // módulos activados

    public function invokeAll(string $hook, array $args = []): array
    {
        $resultados = [];
        foreach ($this->modulos as $modulo) {
            $funcion = $modulo . '_' . $hook;  // p. ej. blog_menu_links
            if (function_exists($funcion)) {
                $resultados[$modulo] = $funcion(...$args);  // ...: despliega $args
            }
        }
        return $resultados;
    }

    public function alter(string $hook, array &$datos): void
    {
        foreach ($this->modulos as $modulo) {
            $funcion = $modulo . '_' . $hook . '_alter';  // p. ej. prive_menu_links_alter
            if (function_exists($funcion)) {
                $funcion($datos);  // la función modifica $datos en el sitio
            }
        }
    }
}

$gestor = new GestorModulos(['blog', 'stats', 'prive']);
$enlaces = array_merge(...array_values($gestor->invokeAll('menu_links')));
$gestor->alter('menu_links', $enlaces);  // los módulos retocan el resultado
echo json_encode($enlaces), "\n";
```

Resultado (el `\/` es simplemente la forma en que `json_encode` escribe `/`):

```text
{"inicio":"\/","blog":"\/blog"}
```

| Sintaxis PHP | Significado |
|---|---|
| `array &$enlaces` | El `&` pasa una **referencia**: la función recibe la propia variable, no una copia, así que sus modificaciones se ven fuera |
| `unset($enlaces['stats'])` | Elimina la clave `stats` del array |
| `private array $modulos` en el constructor | Atajo: declara la propiedad y la rellena al crear el objeto |
| `$funcion(...$args)` | Los tres puntos despliegan el array `$args` en argumentos separados |
| `array_values`, `array_merge` | El primero ignora las claves (aquí los nombres de módulos), el segundo fusiona arrays |
| `json_encode` | Convierte un array en texto JSON, práctico para mostrarlo |

El desarrollo: `invokeAll` ha recogido los enlaces de `blog` y de `stats`, y luego `alter` ha dejado que el módulo `prive` quitara el enlace `stats`. Los módulos `blog`, `stats` y `prive` no se conocen entre sí: solo el punto de extensión `menu_links` los relaciona.

```text
  GestorModulos::invokeAll('menu_links')
        │
        ├──> blog_menu_links()   ──> inicio, blog
        └──> stats_menu_links()  ──> stats
                    │
                    ▼  tabla fusionada
  GestorModulos::alter('menu_links', $enlaces)
        └──> prive_menu_links_alter()  ──> quita « stats »
```

## La dependencia entre módulos: declarada, opcional u oculta

Cuando el módulo `exportar` usa una función del módulo `stats`, **depende** de él. Existen tres situaciones.

| Tipo | Situación | Lo que hace el framework |
|---|---|---|
| Dependencia **obligatoria** declarada | `exportar` no funciona sin `stats` | Rechaza activar `exportar` si `stats` está ausente |
| Dependencia **opcional** | `exportar` funciona sin `stats`, pero añade información si está presente | Nada: `exportar` comprueba por sí mismo la presencia |
| Dependencia **no declarada** | `exportar` llama a `stats` sin decirlo ni comprobarlo | Nada, hasta el error fatal en producción |

Una declaración obligatoria se escribe normalmente en el archivo de descripción del módulo. Ejemplo ficticio:

```yaml
name: Exportar
requires:
  - core      # sin el núcleo, nada funciona
optional:
  - stats     # usar si está presente (comprobado en el código)
```

Para lo opcional, se pregunta al gestor si el módulo está activado. En muchos frameworks, este método se llama `moduleExists`.

```php
<?php
$activo = ($argv[1] ?? 'sin') === 'con';  // simula el módulo stats activado o no
if ($activo) {
    function stats_total(): int { return 340; }  // definida solo si stats está activado
}

final class Modulos
{
    public function __construct(private array $activos) {}

    public function moduleExists(string $nombre): bool
    {
        return in_array($nombre, $this->activos, true);  // ¿el módulo está activado?
    }
}

function informe_prudente(Modulos $modulos): string
{
    $texto = '12 artículos';
    if ($modulos->moduleExists('stats')) {  // dependencia opcional: comprobamos
        $texto .= ', ' . stats_total() . ' visitas';
    }
    return $texto;
}

function informe_imprudente(): string
{
    return '12 artículos, ' . stats_total() . ' visitas';  // dependencia no declarada
}

$modulos = new Modulos($activo ? ['exportar', 'stats'] : ['exportar']);
echo informe_prudente($modulos), "\n";
try {
    echo informe_imprudente(), "\n";
} catch (Error $error) {
    echo 'Error: ', $error->getMessage(), "\n";
}
```

Este script se ejecuta con `php archivo.php sin` (el módulo `stats` está desactivado) o `php archivo.php con`. Resultados observados:

| Ejecución | `informe_prudente` | `informe_imprudente` |
|---|---|---|
| `sin` | `12 artículos` | `Error: Call to undefined function stats_total()` |
| `con` | `12 artículos, 340 visitas` | `12 artículos, 340 visitas` |

La función imprudente funciona mientras `stats` esté activado, lo que oculta el defecto: la aplicación se rompe el día en que alguien desactiva `stats`, a menudo lejos del lugar del error. La función prudente se adapta a los dos casos. Los elementos de sintaxis nuevos: `$argv` contiene las palabras escritas tras el nombre del script, `in_array(..., true)` busca un valor en un array comparando también el tipo, `try` / `catch (Error ...)` atrapa un error en lugar de detener el programa (véase [las excepciones en PHP](/?c=langages&s=php&p=exceptions)), y `.=` añade texto al final de una cadena.

El sentido de la dependencia también importa: un módulo base nunca debe depender de un módulo opcional, porque se crearía un ciclo (véase [verificar el sentido de las dependencias](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sens-des-dependances-avant-de-centraliser)).

## Lo que la inversión de control cambia en su código

| Ventaja | Contrapartida |
|---|---|
| Añadir un comportamiento sin modificar el código existente | El camino de ejecución es más difícil de seguir: no se ve quién llama a quién |
| Cada módulo sigue siendo pequeño e independiente (véase la [responsabilidad única](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)) | Un olvido en la declaración se traduce en silencio: no se llama a nada y no aparece ningún error |
| El framework puede cambiar el orden o el momento de las llamadas | El orden de ejecución depende de prioridades o pesos que vigilar |

## Las trampas

| Trampa | Por qué es un problema | Reacción recomendada |
|---|---|---|
| Error de escritura en el nombre de un hook (`blog_cron` escrito `blog_cro`) | La función nunca se llama y no se señala ningún error | Comprobar que el efecto esperado se produce; verificar el nombre en la documentación del hook |
| Dos suscriptores con la misma prioridad cuyo orden importa | El orden depende entonces del orden de suscripción, lo que es frágil | Dar prioridades distintas cuando el orden es importante |
| Un suscriptor que detiene la propagación sin avisar | Los demás suscriptores ya no se ejecutan, sin rastro | Documentar cada detención y registrarla en un log |
| Un `alter` que cambia la forma del dato | Los módulos siguientes reciben una estructura inesperada | Mantener la misma estructura y modificar solo los valores |
| Un hook que hace un trabajo pesado (petición de red, bucle sobre toda la base) | Se llama en cada pasada y ralentiza todo | Encargar el trabajo grande a una tarea diferida |
| Llamar a otro módulo sin declararlo ni comprobarlo | Error fatal el día en que ese módulo se desactive | Declarar la dependencia o comprobarla con `moduleExists` |
| Modificar el núcleo del framework para « añadir una función » | La modificación se pierde en la siguiente actualización | Pasar por un hook, un evento o un servicio del proyecto |

## Buenas prácticas

| Buena práctica | Razón |
|---|---|
| Elegir un nombre de hook claro y documentarlo junto a su declaración | Los demás módulos saben qué implementar |
| Preferir `invokeAll` para recoger y `alter` para retocar | Cada forma tiene un papel preciso, el comportamiento sigue siendo previsible |
| Declarar toda dependencia obligatoria en el archivo del módulo | El framework rechaza la activación incoherente en lugar de romperse más tarde |
| Proteger toda dependencia opcional con una comprobación (`moduleExists`) | La aplicación sobrevive a la ausencia del módulo |
| Escribir una prueba por implementación de hook, con y sin los módulos opcionales | Un hook no llamado no produce ningún error: solo una prueba lo revela |
| Mantener los suscriptores cortos y sin efectos secundarios ocultos | Facilita la depuración de un camino ya indirecto |

## Lo que hay que recordar

- La **inversión de control** consiste en declarar código (ruta, hook, suscriptor, servicio, plugin) para que el framework lo llame en el momento adecuado, en lugar de llamarlo uno mismo.
- Un **hook** se reconoce por una convención de nombres; un **suscriptor de evento** se inscribe explícitamente y recibe una **prioridad** que fija el orden de ejecución.
- Se pueden crear los propios puntos de extensión: `invokeAll` recoge las respuestas de todos los módulos, `alter` les permite modificar un dato ya construido.
- Una **dependencia obligatoria** se declara, una **dependencia opcional** se comprueba en el código (`moduleExists`), una **dependencia no declarada** es un defecto que solo se rompe el día en que el módulo desaparece.
- El precio de la inversión es un camino de ejecución menos visible: nombrar, documentar y probar cada punto de extensión.
