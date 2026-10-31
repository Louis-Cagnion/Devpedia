---
order: 15
---

# El contenedor de servicios y los proveedores de servicios

En una aplicación, la mayoría de las clases necesitan otras clases: un envío de correo necesita un diario, un diario necesita un archivo, etc. Alguien tiene que construir todos esos objetos, en el orden correcto, una sola vez cuando es útil, y permitir reemplazarlos. Este capítulo presenta la herramienta que se encarga de ello: el **contenedor de servicios**, y la manera de declarar en él objetos (los **proveedores de servicios**) para inyectarlos, reemplazarlos o decorarlos, incluidos los del **núcleo** de un framework (un **framework** es una biblioteca base que impone la estructura de la aplicación y llama al código del proyecto; su **núcleo** es la parte central que se entrega con él, y que el proyecto no escribe).

Supone conocidas [las clases y la inyección de dependencias básica](/?c=langages&s=php&p=poo) (recibir las dependencias como parámetros del constructor en lugar de crearlas con `new`), [las funciones anónimas](/?c=langages&s=php&p=methodes) (una función sin nombre, guardada en una variable) y [la carga automática de clases](/?c=langages&s=php&p=autoloading). El porqué del bajo acoplamiento está en [responsabilidad única y bajo acoplamiento](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage), y el sentido de una dependencia en [verificar el sentido de las dependencias](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sens-des-dependances-avant-de-centraliser). Estas nociones no se repiten aquí. Los ejemplos están en PHP, con un ejemplo en JavaScript al final; [Drupal](https://www.drupal.org/docs/drupal-apis/services-and-dependency-injection) y [Symfony](https://symfony.com/doc/current/service_container.html) (dos frameworks PHP) solo se citan como ejemplos de la misma idea.

## El problema: ¿quién construye los objetos?

Sin contenedor, cada clase crea sus propias dependencias, o el código que las usa las ensambla a mano en cada lugar.

```php
<?php
// Notificador: una clase que envía un mensaje a alguien
class Notificador
{
    // property: la propiedad que guarda el diario que usa la clase
    private DiarioFichero $diario;

    // el constructor se ejecuta en cada "new Notificador()"
    public function __construct()
    {
        // new: la clase fabrica ella misma su dependencia, de forma fija
        $this->diario = new DiarioFichero('/var/log/app.log');
    }
}
```

Para probar `Notificador`, hace falta un archivo real en `/var/log`; para cambiar de diario, hay que modificar la clase. El **contenedor de servicios** resuelve esto: es un objeto único que conoce la receta de cada objeto compartido y lo construye bajo demanda.

| Término | Definición | Ejemplo |
|---|---|---|
| **Servicio** | Un objeto que presta un servicio técnico al resto de la aplicación, sin representar un dato de negocio: actúa (enviar, registrar, calcular), no describe (un pedido, un cliente) | Un diario, un envío de correo, un acceso a la base de datos |
| **Identificador** | El nombre único con el que un servicio se guarda en el contenedor | `diario`, `notificador` |
| **Fábrica** | La función que sabe construir un servicio, con sus propias dependencias | `fn($c) => new Notificador($c->get('diario'))` |
| **Contenedor** | El objeto que guarda las fábricas, construye un servicio a la primera petición y lo conserva | `$contenedor->get('diario')` |
| **Proveedor de servicios** | Un bloque de código (o de configuración) que declara un grupo de servicios en el contenedor | El núcleo declara los suyos, cada módulo los suyos |
| **Inyección** | Dar a un objeto sus dependencias desde fuera, en lugar de dejar que las cree | `new Notificador($diario)` |

## Un contenedor mínimo

Para entender lo que hacen los contenedores de los frameworks, escribimos uno de menos de cuarenta líneas. Primero, dos **interfaces** (una interfaz es un contrato: la lista de métodos que una clase debe proporcionar, sin su código) y las clases que las usan. Las clases no conocen el contenedor.

```php
<?php
// Diario: el contrato que todo diario debe respetar
interface Diario
{
    // escribir: recibe un texto, no devuelve nada (void)
    public function escribir(string $mensaje): void;
}

// DiarioPantalla: un diario que muestra cada mensaje en pantalla
class DiarioPantalla implements Diario
{
    // implements: esta clase respeta el contrato Diario
    public function escribir(string $mensaje): void
    {
        // echo: muestra el texto; "\n" termina la línea
        echo "[diario] $mensaje\n";
    }
}

// Notificador: recibe un Diario, sin saber cuál
class Notificador
{
    // private Diario $diario: crea y rellena la propiedad (promoción del constructor)
    public function __construct(private Diario $diario)
    {
    }

    // enviar: simula el envío y lo anota en el diario
    public function enviar(string $destinatario): void
    {
        // $this->diario: el diario recibido en la construcción
        $this->diario->escribir("Mensaje enviado a $destinatario");
    }
}
```

El contenedor en sí: tres arreglos (las recetas, los objetos ya construidos, los objetos en curso de construcción) y tres métodos.

```php
<?php
// Contenedor: guarda recetas y fabrica los servicios bajo demanda
class Contenedor
{
    // fabricas: identificador => función que construye el servicio
    private array $fabricas = [];
    // compartidos: identificador => true si el servicio se construye una sola vez
    private array $compartidos = [];
    // instancias: identificador => servicio ya construido
    private array $instancias = [];
    // enCurso: identificadores en construcción (para detectar un ciclo)
    private array $enCurso = [];

    // definir: añade o reemplaza la receta de un servicio
    public function definir(string $id, callable $fabrica, bool $compartido = true): void
    {
        // la nueva receta ocupa el lugar de la anterior
        $this->fabricas[$id] = $fabrica;
        // anotamos si el servicio es compartido
        $this->compartidos[$id] = $compartido;
        // una instancia ya construida con la receta anterior se olvida
        unset($this->instancias[$id]);
    }

    // decorar: envuelve el servicio $id en otro, sin tocar su código
    public function decorar(string $id, callable $decorador): void
    {
        // la receta anterior se conserva: suministra el servicio envuelto
        $interno = $this->fabricas[$id] ?? throw new RuntimeException("Desconocido: $id");
        // la nueva receta llama a la anterior, y luego pasa el resultado al decorador
        $envoltorio = fn(self $c) => $decorador($interno($c), $c);
        $this->definir($id, $envoltorio, $this->compartidos[$id]);
    }

    // get: devuelve el servicio, construyéndolo si hace falta
    public function get(string $id): object
    {
        // ya construido y compartido: devolvemos el mismo objeto
        if (isset($this->instancias[$id])) {
            return $this->instancias[$id];
        }
        // ninguna receta con este identificador: error claro
        if (!isset($this->fabricas[$id])) {
            throw new RuntimeException("Servicio desconocido: $id");
        }
        // el identificador ya está en construcción: A necesita B, que necesita A
        if (isset($this->enCurso[$id])) {
            $camino = implode(' -> ', array_keys($this->enCurso)) . " -> $id";
            throw new RuntimeException("Dependencia circular: $camino");
        }
        // marcamos el identificador como en curso
        $this->enCurso[$id] = true;
        try {
            // llamamos a la fábrica, dándole el contenedor para sus dependencias
            $servicio = ($this->fabricas[$id])($this);
        } finally {
            // pase lo que pase, quitamos la marca
            unset($this->enCurso[$id]);
        }
        // servicio compartido: lo guardamos; si no, lo devolvemos sin guardarlo
        if ($this->compartidos[$id]) {
            $this->instancias[$id] = $servicio;
        }
        return $servicio;
    }
}
```

## Declarar un servicio e inyectarlo

**Declarar** un servicio es registrar su receta bajo un identificador. **Inyectarlo** es que la receta de otro servicio le pase ese servicio en el constructor. Solo las fábricas conocen el contenedor.

```php
<?php
// creamos el contenedor vacío
$contenedor = new Contenedor();
// declaración: el servicio "diario" es un DiarioPantalla (fn: función flecha)
$contenedor->definir('diario', fn() => new DiarioPantalla());
// declaración: el "notificador" pide el "diario" al contenedor y lo recibe como parámetro
$contenedor->definir('notificador', fn(Contenedor $c) => new Notificador($c->get('diario')));
// primera petición: el contenedor construye el diario, luego el notificador
$contenedor->get('notificador')->enviar('alice@example.org');
// segunda petición del diario: es el mismo objeto (=== compara la identidad de un objeto)
var_dump($contenedor->get('diario') === $contenedor->get('diario'));
```

Resultado real:

```
[diario] Mensaje enviado a alice@example.org
bool(true)
```

```
get('notificador')
  |-- receta de notificador: llama a get('diario')
  |     |-- receta de diario: new DiarioPantalla()   --> guardado en instancias
  |     '-- devuelve el diario
  '-- new Notificador($diario)                         --> guardado en instancias
```

El orden de construcción nunca lo escribe el desarrollador: se deduce de las llamadas `get` anidadas. Un framework real hace lo mismo, pero lee las dependencias en una declaración en lugar de en una función.

| Forma de obtener una dependencia | Quién la construye | Comprobable sin servicio real | Veredicto |
|---|---|---|---|
| `new DiarioFichero(...)` dentro de la clase | La propia clase | No | Evitar para un servicio |
| Inyección por el constructor | El contenedor (por su fábrica) | Sí: se pasa un falso | La regla por defecto |
| Llamada `$contenedor->get('diario')` dentro de la clase | La clase, a través del contenedor | Con dificultad | Un último recurso (ver las trampas) |

## Los proveedores de servicios: agrupar las declaraciones

Un proyecto real cuenta con cientos de servicios. Cada parte (el núcleo, un módulo, un complemento) los declara en su propio **proveedor de servicios**: un objeto al que se confía el contenedor para registrar en él sus recetas. La aplicación arranca llamando a cada proveedor, en un orden preciso.

```php
<?php
// ProveedorDeServicios: el contrato de un bloque de declaraciones
interface ProveedorDeServicios
{
    // registrar: recibe el contenedor y declara en él sus servicios
    public function registrar(Contenedor $c): void;
}

// ProveedorNucleo: los servicios de base, incluidos con el framework
class ProveedorNucleo implements ProveedorDeServicios
{
    public function registrar(Contenedor $c): void
    {
        // el núcleo declara un diario que escribe en pantalla
        $c->definir('diario', fn() => new DiarioPantalla());
        // y un notificador que depende de ese diario
        $c->definir('notificador', fn(Contenedor $c) => new Notificador($c->get('diario')));
    }
}

// Aplicación: llama a cada proveedor en el orden dado
function arrancar(array $proveedores): Contenedor
{
    // un contenedor nuevo para esta ejecución
    $contenedor = new Contenedor();
    // cada proveedor declara sus servicios (el último que escribe gana)
    foreach ($proveedores as $proveedor) {
        $proveedor->registrar($contenedor);
    }
    return $contenedor;
}
```

| Pregunta | Respuesta en el ejemplo | En un framework real |
|---|---|---|
| ¿Dónde está la declaración? | Código PHP (`definir`) | A menudo un archivo de configuración (YAML): clase, argumentos, etiquetas |
| ¿Quién la llama? | La función `arrancar` | El framework, al arrancar, o al compilar el contenedor |
| ¿En qué orden? | El de la lista | Núcleo primero, luego los módulos (a menudo por prioridad) |
| ¿Qué pasa al final? | El contenedor está listo | El contenedor a menudo se **compila** (se transforma en una clase PHP optimizada) y se guarda en caché |

## Reemplazar un servicio del núcleo

Para cambiar un comportamiento del núcleo, no se edita el núcleo (las actualizaciones borrarían la modificación): un proveedor del proyecto **redeclara el mismo identificador**. Como el último que escribe gana, todos los servicios que piden `diario` reciben la nueva versión, sin que cambie una sola línea de `Notificador`.

```php
<?php
// DiarioMemoria: guarda los mensajes en un arreglo, útil para las pruebas
class DiarioMemoria implements Diario
{
    // mensajes: todo lo que se ha escrito, en orden
    public array $mensajes = [];

    public function escribir(string $mensaje): void
    {
        // [] = añade al final del arreglo
        $this->mensajes[] = $mensaje;
    }
}

// ProveedorProyecto: el proveedor del proyecto, llamado después del del núcleo
class ProveedorProyecto implements ProveedorDeServicios
{
    public function registrar(Contenedor $c): void
    {
        // mismo identificador "diario": la receta del núcleo se reemplaza
        $c->definir('diario', fn() => new DiarioMemoria());
    }
}

// solo núcleo: el diario escribe en pantalla
arrancar([new ProveedorNucleo()])->get('notificador')->enviar('bob@example.org');
// núcleo y luego proyecto: el diario se reemplaza, y no se muestra nada
$app = arrancar([new ProveedorNucleo(), new ProveedorProyecto()]);
// enviamos un mensaje con el diario reemplazado
$app->get('notificador')->enviar('bob@example.org');
// el mensaje está en la memoria del nuevo diario
print_r($app->get('diario')->mensajes);
```

Resultado real:

```
[diario] Mensaje enviado a bob@example.org
Array
(
    [0] => Mensaje enviado a bob@example.org
)
```

El reemplazo debe respetar **el mismo contrato** (aquí `Diario`): si no, los servicios que lo usan fallan en la ejecución. En un framework, esto se llama redefinir una definición de servicio; el ejemplo de Drupal es una clase de proveedor del módulo que modifica la definición del núcleo antes de la compilación (ver [la documentación de Drupal sobre los servicios](https://www.drupal.org/docs/drupal-apis/services-and-dependency-injection)).

## Decorar un servicio: enriquecerlo en lugar de reemplazarlo

Reemplazar desecha el servicio anterior. Un **decorador** (un patrón de diseño) es un objeto que **envuelve** el servicio anterior, respeta el mismo contrato, le delega el trabajo y añade algo antes o después. El núcleo y el proyecto conservan cada uno su parte del comportamiento.

```php
<?php
// DiarioNumerado: envuelve otro Diario y numera los mensajes
class DiarioNumerado implements Diario
{
    // contador: el número del próximo mensaje
    private int $contador = 1;

    // $interno: el diario envuelto, al que se delega
    public function __construct(private Diario $interno)
    {
    }

    public function escribir(string $mensaje): void
    {
        // añadimos el número, y luego dejamos que el diario anterior haga su trabajo
        $this->interno->escribir('#' . $this->contador++ . ' ' . $mensaje);
    }
}

// partimos solo del núcleo
$app = arrancar([new ProveedorNucleo()]);
// decorar: el "diario" pasa a ser DiarioNumerado($diario_anterior)
$app->decorar('diario', fn(Diario $interno) => new DiarioNumerado($interno));
// el notificador del núcleo recibe el diario decorado, sin saberlo
$app->get('notificador')->enviar('carole@example.org');
$app->get('notificador')->enviar('dave@example.org');
```

Resultado real:

```
[diario] #1 Mensaje enviado a carole@example.org
[diario] #2 Mensaje enviado a dave@example.org
```

Si dos proveedores decoran el mismo servicio, los decoradores se apilan como muñecas rusas: el último declarado es el más exterior. En los frameworks, se escribe en configuración con una clave de tipo `decorates` (Symfony y Drupal la conocen) en lugar de código.

| Técnica | Qué hace | Cuándo elegirla | Riesgo |
|---|---|---|---|
| **Reemplazar** | Redeclarar el identificador con otra clase | El comportamiento del núcleo ya no sirve en absoluto | Perder funciones que esperaban otros módulos; otro reemplazo lo sobrescribe |
| **Decorar** | Envolver el servicio anterior, que sigue en la cadena | Queremos añadir (caché, diario, medición) sin perder lo existente | El orden de los decoradores importa; la interfaz debe respetarse por completo |
| **Alias** | Dar un segundo identificador a un servicio existente | Varios nombres designan el mismo servicio (`logger` y `diario`) | El servicio es compartido: reemplazarlo cambia todos los nombres |
| **Extender la clase** (`extends`) | Una clase hija redeclarada bajo el identificador anterior | Un pequeño cambio en un método | Frágil: depende de los detalles internos de la clase madre |

## Compartido o nuevo en cada petición

Por defecto, un servicio es **compartido**: el contenedor lo construye una sola vez y devuelve después el mismo objeto (como muestra `===` más arriba). Es lo deseado para un diario o una conexión a la base de datos. Pero un objeto que guarda un estado propio de una operación (un carrito, un formulario en curso) no debe compartirse: si no, dos operaciones se mezclarían en él.

```php
<?php
// servicio no compartido: el tercer argumento false pide un objeto nuevo en cada get
$contenedor = new Contenedor();
$contenedor->definir('diario', fn() => new DiarioMemoria(), false);
// dos peticiones: dos objetos distintos (!== compara la identidad)
var_dump($contenedor->get('diario') !== $contenedor->get('diario'));
```

Resultado real: `bool(true)`.

| Modo | Cuántos objetos | Sirve para | Peligro |
|---|---|---|---|
| Compartido (por defecto) | Uno solo para toda la aplicación | Diario, configuración, conexión | Un estado guardado dentro se filtra de una operación a otra |
| No compartido | Uno por petición | Objeto de trabajo, de un solo uso | Coste de construcción repetido; no puede servir de punto de ajuste común |

## Probar: reemplazar un servicio por un falso

Es el interés más concreto del contenedor: una prueba declara, en lugar del diario real, un falso que registra lo que se le envía.

```php
<?php
// construimos una aplicación normal
$app = arrancar([new ProveedorNucleo()]);
// la prueba reemplaza el diario por un falso que guarda los mensajes en memoria
$falso = new DiarioMemoria();
$app->definir('diario', fn() => $falso);
// ejecutamos el comportamiento que queremos probar
$app->get('notificador')->enviar('test@example.org');
// comprobamos lo que escribió el notificador: true si los mensajes son los esperados
var_dump($falso->mensajes === ['Mensaje enviado a test@example.org']);
```

Resultado real: `bool(true)`. El principio de las pruebas automáticas está en [las pruebas unitarias](/?c=tests&p=tests-unitaires); la ventaja aquí es que la prueba no depende de ningún archivo ni de ninguna red.

## Los errores que el contenedor detecta

Dos servicios que se piden mutuamente forman una **dependencia circular**: la construcción de uno exige el otro, sin fin. Nuestro contenedor lo detecta gracias a `enCurso` y nombra el camino.

```php
<?php
// "a" necesita "b", y "b" necesita "a"
$c = new Contenedor();
$c->definir('a', fn(Contenedor $c) => $c->get('b'));
$c->definir('b', fn(Contenedor $c) => $c->get('a'));
// try / catch: capturamos el error para mostrarlo
try {
    $c->get('a');
} catch (RuntimeException $e) {
    // getMessage: el texto del error
    echo $e->getMessage(), "\n";
}
```

Resultado real: `Dependencia circular: a -> b -> a`. La verdadera corrección no está en el contenedor: un ciclo señala dos clases mal divididas (ver [responsabilidad única y bajo acoplamiento](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)). Se extrae la parte común a un tercer servicio del que dependen los dos.

## La misma idea en JavaScript

Nada del principio es propio de PHP. En JavaScript, un `Map` (un diccionario: pares clave, valor) hace de tabla de recetas.

```javascript
// Contenedor: el mismo principio que en PHP, en diez líneas
class Contenedor {
    // fabricas: identificador => función que construye el servicio
    #fabricas = new Map();
    // instancias: identificador => servicio ya construido
    #instancias = new Map();

    // definir: añade o reemplaza una receta
    definir(id, fabrica) {
        // la nueva receta reemplaza la anterior
        this.#fabricas.set(id, fabrica);
        // la instancia que quizá se construyó se olvida
        this.#instancias.delete(id);
    }

    // get: devuelve el servicio, construido en la primera petición
    get(id) {
        // ya construido: lo devolvemos
        if (this.#instancias.has(id)) return this.#instancias.get(id);
        // sin receta: error claro
        if (!this.#fabricas.has(id)) throw new Error(`Servicio desconocido: ${id}`);
        // construimos, pasando el contenedor a la fábrica, y luego lo guardamos
        const servicio = this.#fabricas.get(id)(this);
        this.#instancias.set(id, servicio);
        return servicio;
    }
}

// declaración de un diario, y luego de un notificador que lo recibe
const c = new Contenedor();
c.definir("diario", () => ({ escribir: (m) => console.log(`[diario] ${m}`) }));
c.definir("notificador", (cont) => ({ enviar: (d) => cont.get("diario").escribir(d) }));
// uso: la construcción es perezosa, en el orden deseado
c.get("notificador").enviar("erwan@example.org");
```

Resultado real: `[diario] erwan@example.org`. Los módulos ES y las bibliotecas de inyección (por ejemplo [InversifyJS](https://inversify.io/) o [tsyringe](https://github.com/microsoft/tsyringe)) añaden las mismas funciones que las descritas aquí; la documentación del estándar [PSR-11](https://www.php-fig.org/psr/psr-11/) fija, del lado de PHP, la interfaz mínima de un contenedor (`get` y `has`).

## En un framework real

Los frameworks retoman este mecanismo y lo declaran en configuración. La tabla relaciona cada noción de este capítulo con su equivalente habitual (el detalle varía de un framework a otro: la página [del contenedor de Symfony](https://symfony.com/doc/current/service_container.html) da un ejemplo completo).

| Noción del capítulo | Equivalente habitual en un framework |
|---|---|
| `definir('id', fabrica)` | Una entrada del archivo `services.yml`: identificador, clase, lista de argumentos |
| `$c->get('diario')` en una fábrica | Un argumento escrito `@diario` en la declaración: el framework lo resuelve |
| Proveedor de servicios | Un archivo de declaraciones por módulo, más una clase PHP para los casos dinámicos |
| `decorar` | Una clave `decorates` en la declaración |
| Reemplazar | Una clase de proveedor del módulo que modifica la definición antes de la compilación |
| Ciclo detectado | Un error en la compilación del contenedor |

## Las trampas

| Trampa | Por qué es un problema | Corrección |
|---|---|---|
| Pasar el contenedor entero a una clase (`__construct(Contenedor $c)` y luego `$c->get(...)` por todas partes): esto se llama el **localizador de servicios** | Las dependencias reales de la clase se vuelven invisibles; una prueba debe llenar todo un contenedor; el contenedor está en todas partes | Inyectar cada dependencia, una por parámetro; reservar el contenedor solo para las fábricas |
| Reemplazar un servicio del núcleo por una clase que no respeta todo su contrato | Otro servicio del núcleo llama a un método que falta: el error aparece lejos de la causa | Tipar sobre la interfaz e implementar todos sus métodos; o decorar en lugar de reemplazar |
| Dos módulos reemplazan el mismo identificador | El último llamado gana, sin advertencia: el resultado depende del orden | Decorar en lugar de reemplazar; comprobar el orden de los proveedores |
| Servicio compartido que guarda un estado propio de una operación | Dos operaciones comparten el mismo estado (datos de un usuario en otro) | Servicio no compartido, o estado pasado como parámetro del método |
| Dependencia circular entre dos servicios | Construcción imposible, o eludida mediante una inyección tardía que oculta una mala división | Extraer la parte común a un tercer servicio |
| Modificar una declaración sin reconstruir la caché del contenedor compilado | El framework sigue usando la versión anterior | Vaciar la caché del framework después de cada cambio de declaración |
| Construir muchas cosas pesadas en el constructor (conexión, lectura de archivo) | El servicio se construye en cuanto otro depende de él, aunque no se use | Constructor ligero, trabajo en la primera llamada a un método |
| Depender de un identificador escrito como cadena (`'diario'`) sin controlarlo | Un error de tecleo solo aparece en la ejecución | Una constante o el nombre de la clase como identificador; una prueba que construye cada servicio |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Inyectar por el constructor, nunca con `new` dentro de la clase, para todo servicio | La clase anuncia sus necesidades y se prueba con falsos |
| Tipar cada dependencia sobre una interfaz (`Diario`), no sobre una clase concreta | Reemplazar o decorar no rompe nada |
| Un proveedor de servicios por módulo, que solo declare sus propios servicios | Cada módulo sigue siendo independiente y retirable |
| Preferir **decorar** a **reemplazar** cuando se quiere añadir un comportamiento | Se conserva el trabajo del núcleo y el de los otros módulos |
| Documentar en el proyecto todo servicio del núcleo reemplazado, y por qué | Una actualización del núcleo puede romper un reemplazo sin que nada lo avise |
| Pasar el contenedor solo a las fábricas, nunca a las clases de negocio | Las dependencias siguen visibles en las firmas |
| Mantener los servicios sin estado; si no, declararlos no compartidos | Ninguna filtración de datos entre operaciones |
| Probar un arranque completo: construir cada servicio declarado | Un ciclo, una clase ausente o un error de identificador se detectan antes de la puesta en producción |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un contenedor de servicios guarda recetas (fábricas) bajo identificadores y construye cada objeto bajo demanda, una vez si es compartido. Un proveedor de servicios agrupa las declaraciones de una parte de la aplicación. Inyectar es que una fábrica pase sus dependencias al constructor. Para modificar un servicio del núcleo sin editar el núcleo: redeclararlo bajo el mismo identificador (reemplazar) o envolverlo (decorar, que conserva el comportamiento anterior). El reemplazo o el decorador respeta el mismo contrato. Una prueba reemplaza un servicio por un falso. Un ciclo entre servicios se corrige separándolos de otra forma. |
| **Trampas a evitar** | El localizador de servicios (contenedor pasado a las clases); un reemplazo que no respeta todo el contrato; dos reemplazos del mismo identificador; un servicio compartido que guarda un estado; una dependencia circular; una caché de contenedor olvidada; un constructor pesado; un identificador en cadena sin control. |
| **Buenas prácticas** | Inyectar por el constructor; tipar sobre una interfaz; un proveedor por módulo; decorar en lugar de reemplazar; documentar los reemplazos del núcleo; contenedor reservado a las fábricas; servicios sin estado; prueba que construye cada servicio. |

Dos temas cercanos no se tratan aquí: la inversión de control y los hooks (el framework llama al código del proyecto en puntos previstos) y la arquitectura de plugins (clases que el framework descubre gracias a una anotación o un atributo).
