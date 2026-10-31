---
order: 16
---

# La arquitectura de plugins

Una aplicación crece: se le añaden sin cesar nuevos tipos de bloques de visualización, de reglas de validación, de direcciones de API. Si cada adición obliga a abrir el mismo archivo central para añadir una línea, ese archivo se convierte en un punto de fricción. La **arquitectura de plugins** (*plugin* se traduce como «módulo de extensión») resuelve este problema: el programa define una vez un **punto de extensión**, y luego cada nueva funcionalidad llega en forma de clase independiente, que el programa encuentra por sí solo, sin que haya que modificar su código central.

Este capítulo se apoya en las clases, las interfaces y los espacios de nombres de la [programación orientada a objetos en PHP](/?c=langages&s=php&p=poo), y en el principio de [responsabilidad única](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage). Sistemas de gestión de contenidos como Drupal (un software PHP que permite construir y administrar un sitio web) se organizan en buena medida así: sus bloques de visualización, sus restricciones de validación y sus recursos de API son todos plugins. Los ejemplos siguientes siguen siendo genéricos y no utilizan ningún código de ese software.

## El problema: el `switch` que crece

Sin plugins, la creación de un objeto a partir de un nombre suele escribirse con una larga serie de casos. Cada nuevo bloque obliga a modificar esta función, que debe conocer **todas** las clases existentes.

```php
<?php
function crearBloque(string $tipo): object    // recibe el nombre del bloque pedido
{
    switch ($tipo) {                          // compara el nombre con cada caso conocido
        case 'bienvenida':                    // primer bloque conocido
            return new BloqueBienvenida();    // crea un objeto de esta clase
        case 'reloj':                         // segundo bloque conocido
            return new BloqueReloj();         // crea un objeto de esta clase
        default:                              // cualquier otro nombre
            throw new InvalidArgumentException("Bloque desconocido: $tipo");
    }
}
```

| Defecto del `switch` central | Consecuencia |
|---|---|
| Enumera todas las clases | Añadir un bloque obliga a modificar un archivo que no tiene nada que ver con ese bloque |
| Lo comparte todo el equipo | Conflictos de fusión frecuentes, riesgo de olvidar una línea |
| No puede extenderse desde fuera | Una extensión distribuida aparte no puede añadirse a él |

## La idea: declarar, descubrir, instanciar

El plugin invierte la responsabilidad: ya no es el código central el que conoce las clases, sino cada clase la que **se declara** ante él. Tres etapas se suceden.

```
   Clases del proyecto                            Gestor de plugins
  +-------------------+       1. descubrir        +----------------------------------+
  | #[Plugin(...)]    |  -----------------------> |  catálogo (id => clase)          |
  | BloqueBienvenida  |     leer la etiqueta      |  bienvenida => BloqueBienvenida  |
  +-------------------+                           |  reloj      => BloqueReloj       |
  | #[Plugin(...)]    |                           +----------------------------------+
  | BloqueReloj       |                                           |
  +-------------------+   2. elegir por identificador ('reloj')
  | (sin etiqueta)    |                                           |
  | ignorada          |   3. instanciar (new BloqueReloj)
  +-------------------+                                           v
                                                       objeto listo para usar
```

| Etapa | Función | Pregunta a la que responde |
|---|---|---|
| Declaración | Una etiqueta pegada a la clase da su identificador y sus datos | «¿Quién soy?» |
| Descubrimiento | El gestor recorre las clases candidatas y lee las etiquetas | «¿Qué plugins existen?» |
| Instanciación | El gestor crea el objeto bajo demanda a partir de su identificador | «Dame el plugin `reloj`» |

Los tres ingredientes que hay que aportar son, por tanto: un **contrato** (una interfaz), una **etiqueta** (la declaración) y un **gestor** (el director de orquesta).

| Ingrediente | Definición | Ejemplo en este capítulo |
|---|---|---|
| Contrato | Una [interfaz](https://www.php.net/manual/fr/language.oop5.interfaces.php): la lista de métodos que toda clase que la firma debe ofrecer | `PluginDeBloque` con el método `renderizar()` |
| Etiqueta | Una información asociada a la propia clase, legible por otro programa | `#[Plugin(id: 'reloj', ...)]` |
| Gestor | Un objeto que mantiene el catálogo de plugins y los fabrica | `GestorDePlugins` |

## El contrato y la etiqueta en PHP

Un **atributo** es, desde PHP 8, una etiqueta escrita entre `#[` y `]` justo antes de una clase, un método o una propiedad. No hace nada por sí mismo: lleva información que otro código leerá más tarde, gracias a la **reflexión** ([Reflection](https://www.php.net/manual/fr/book.reflection.php)), es decir, la capacidad de un programa de examinar sus propias clases durante su ejecución.

```php
<?php
// Contrato: todo plugin de bloque sabe producir su texto
interface PluginDeBloque                      // declara la interfaz (el contrato)
{
    public function renderizar(): string;     // método obligatorio, devuelve un texto
}

#[Attribute(Attribute::TARGET_CLASS)]         // este atributo solo se coloca sobre una clase
final class Plugin                            // la clase que representa la etiqueta
{
    public function __construct(              // los valores indicados entre paréntesis
        public readonly string $id,           // identificador único del plugin, solo lectura
        public readonly string $rotulo,       // nombre legible para el administrador
    ) {
    }
}

#[Plugin(id: 'bienvenida', rotulo: 'Mensaje de bienvenida')]  // la etiqueta del plugin
final class BloqueBienvenida implements PluginDeBloque        // firma el contrato
{
    public function renderizar(): string      // implementa el método exigido
    {
        return '¡Hola y bienvenido!';         // el texto que produce este bloque
    }
}

#[Plugin(id: 'reloj', rotulo: 'Hora del servidor')]           // etiqueta del segundo plugin
final class BloqueReloj implements PluginDeBloque             // firma el mismo contrato
{
    public function renderizar(): string      // implementa el método exigido
    {
        return 'Son las ' . date('H:i');      // la hora actual, en formato horas:minutos
    }
}

// Esta clase no tiene etiqueta: el gestor la ignorará
final class ClaseSinEtiqueta implements PluginDeBloque
{
    public function renderizar(): string      // el contrato se respeta
    {
        return 'invisible';                   // pero nadie la descubrirá
    }
}
```

`final` impide heredar de una clase, `readonly` impide modificar una propiedad después de su creación: estas dos palabras hacen que los plugins sean más predecibles. El nombre `Plugin` del atributo es una elección del ejemplo, nada impone esa palabra.

## El gestor de plugins

El gestor hace dos cosas: **descubre** (lee las etiquetas para llenar un catálogo, una tabla que asocia cada identificador con su clase) y luego **instancia** (crea un objeto a partir de una clase). También comprueba que cada clase etiquetada respete el contrato esperado.

```php
<?php
final class GestorDePlugins
{
    /** @var array<string, array{clase: class-string, rotulo: string}> */
    private array $catalogo = [];             // el catálogo: identificador => información

    /** @param class-string $contrato interfaz que cada plugin debe respetar */
    public function __construct(private readonly string $contrato)  // conserva el contrato
    {
    }

    /** @param list<class-string> $clases clases candidatas a examinar */
    public function descubrir(array $clases): void
    {
        foreach ($clases as $clase) {         // examina cada clase candidata
            $etiquetas = (new ReflectionClass($clase))     // abre la clase en reflexión
                ->getAttributes(Plugin::class);            // obtiene sus atributos Plugin
            if ($etiquetas === [] || !is_subclass_of($clase, $this->contrato)) {
                continue;                     // sin etiqueta o con mal contrato: se pasa
            }
            $definicion = $etiquetas[0]->newInstance();    // crea el objeto Plugin leído
            $this->catalogo[$definicion->id] = [           // registra en el catálogo
                'clase' => $clase,            // la clase que se instanciará más tarde
                'rotulo' => $definicion->rotulo,           // el nombre legible
            ];
        }
    }

    /** @return array<string, string> identificador => rótulo */
    public function definiciones(): array
    {
        return array_map(                     // transforma cada entrada del catálogo
            static fn (array $entrada): string => $entrada['rotulo'],  // conserva el rótulo
            $this->catalogo,                  // la tabla a transformar
        );
    }

    public function crear(string $id): object
    {
        if (!isset($this->catalogo[$id])) {   // el identificador no está en el catálogo
            throw new InvalidArgumentException("Plugin desconocido: $id");  // error claro
        }
        return new $this->catalogo[$id]['clase'](); // crea el objeto de la clase encontrada
    }
}
```

Se lanza una [excepción](/?c=langages&s=php&p=exceptions) para un identificador desconocido: sin ella, el programa fallaría más adelante con un mensaje confuso. El uso se escribe en pocas líneas:

```php
<?php
$gestor = new GestorDePlugins(PluginDeBloque::class);  // un gestor de bloques
$gestor->descubrir([                          // indica la lista de clases a examinar
    BloqueBienvenida::class,                  // plugin etiquetado
    BloqueReloj::class,                       // plugin etiquetado
    ClaseSinEtiqueta::class,                  // ignorada por falta de etiqueta
]);

print_r($gestor->definiciones());             // muestra el catálogo: 2 entradas
echo $gestor->crear('bienvenida')->renderizar(), "\n";   // crea el bloque y lo muestra
try {                                         // intenta crear un plugin inexistente
    $gestor->crear('ausente');                // el identificador no existe
} catch (InvalidArgumentException $error) {   // atrapa el error anunciado
    echo $error->getMessage(), "\n";          // muestra « Plugin desconocido: ausente »
}
```

Resultado obtenido al ejecutarlo: el catálogo contiene `bienvenida` y `reloj` (la clase sin etiqueta está ausente), luego `¡Hola y bienvenido!`, y después `Plugin desconocido: ausente`.

## Dónde buscar los plugins: las estrategias de descubrimiento

El gestor recibe aquí una lista de clases escrita a mano, lo que reproduce el defecto del `switch`. En la práctica, se automatiza la búsqueda.

| Estrategia | Principio | Ventaja | Límite |
|---|---|---|---|
| Lista explícita | El código aporta los nombres de las clases | Sencilla, rápida | Hay que acordarse de actualizarla |
| Recorrido de carpeta | El gestor carga todos los archivos de una carpeta acordada | Basta con depositar un archivo | Cargar todos los archivos cuesta tiempo |
| Correspondencia con el [autoloading](/?c=langages&s=php&p=autoloading) | Un espacio de nombres se asocia a una carpeta, las clases se cargan bajo demanda | Ningún `require` que escribir | Depende de las convenciones de nombres |
| Archivo de configuración | Un archivo (YAML, JSON) enumera los plugins | Legible sin leer el código | Dos lugares que mantener sincronizados |

Este es el recorrido por carpeta, probado con un archivo depositado en una carpeta `plugs/`:

```php
<?php
function clasesDeLaCarpeta(string $carpeta): array     // devuelve las clases de una carpeta
{
    $antes = get_declared_classes();          // fotografía de las clases ya conocidas
    foreach (glob($carpeta . '/*.php') as $archivo) {   // cada archivo .php de la carpeta
        require_once $archivo;                // lo carga una sola vez
    }
    return array_values(array_diff(get_declared_classes(), $antes));  // clases nuevas
}
```

Llamar a `$gestor->descubrir(clasesDeLaCarpeta(__DIR__ . '/plugs'))` basta entonces: añadir un plugin equivale a depositar un archivo en la carpeta, sin modificar una sola línea del código central.

## Anotación o atributo

Antes de PHP 8, no existía una etiqueta nativa: las bibliotecas leían comentarios especiales (las **anotaciones**), por ejemplo `@Block(id="reloj")` dentro de un comentario de documentación. Un atributo es la versión nativa de esa idea.

| Criterio | Anotación (comentario) | Atributo (`#[...]`) |
|---|---|---|
| Naturaleza | Texto dentro de un comentario | Código que reconoce el lenguaje |
| Lectura | Una biblioteca debe analizar el texto | La reflexión de PHP lo proporciona directamente |
| Error de escritura | Silencioso: el comentario se ignora | Detectado en ejecución (clase de atributo no encontrada) |
| Herramientas | Autocompletado limitado | Autocompletado y análisis estático completos |
| Contextos habituales | Bases de código antiguas | Código reciente |

Los atributos se leen en ejecución: para no releerlos en cada petición, un gestor serio conserva su catálogo en **caché** (una copia guardada para no recalcularla); de lo contrario, la lectura por reflexión de cientos de clases ralentiza cada página.

## El mismo mecanismo en JavaScript

Las clases de JavaScript no tienen atributos nativos de este tipo. Una propiedad estática (un valor asociado a la propia clase, no a sus objetos) cumple entonces el papel de etiqueta. Véanse las [clases en JavaScript](/?c=langages&s=javascript&p=poo).

```javascript
// Cada clase lleva su declaración en una propiedad estática
class RecursoUsuarios {
  static definicion = { id: 'usuarios', ruta: '/api/usuarios' }; // la etiqueta

  listar() {                                  // método esperado de todo recurso
    return ['Alice', 'Bruno'];                // los datos devueltos
  }
}

class RecursoArticulos {
  static definicion = { id: 'articulos', ruta: '/api/articulos' };         // la etiqueta

  listar() {                                  // mismo método, otro dato
    return ['Primer artículo'];               // los datos devueltos
  }
}

class GestorDePlugins {
  #catalogo = new Map();                      // diccionario privado: identificador => clase

  descubrir(clases) {
    for (const clase of clases) {             // examina cada clase candidata
      const definicion = clase.definicion;    // lee la etiqueta, ausente si no está declarada
      if (definicion === undefined) continue; // sin etiqueta: se ignora la clase
      this.#catalogo.set(definicion.id, clase);  // registra en el catálogo
    }
  }

  crear(id) {
    const clase = this.#catalogo.get(id);     // busca la clase por identificador
    if (clase === undefined) throw new Error(`Plugin desconocido: ${id}`); // error
    return new clase();                       // crea el objeto
  }
}

const gestor = new GestorDePlugins();         // crea el gestor
gestor.descubrir([RecursoUsuarios, RecursoArticulos, class Otro {}]);
console.log(gestor.crear('articulos').listar());   // muestra [ 'Primer artículo' ]
try {
  gestor.crear('ausente');                    // identificador desconocido
} catch (error) {
  console.log(error.message);                 // muestra « Plugin desconocido: ausente »
}
```

## Un gestor, varios tipos de plugins

El gestor solo depende de un contrato: para otro tipo de plugin, se cambia la interfaz. Veamos una restricción de validación (una regla que debe cumplir un valor introducido), con las mismas clases `Plugin` y `GestorDePlugins`.

```php
<?php
// Un segundo tipo de plugin: una restricción de validación
interface Restriccion                         // el contrato de una restricción
{
    public function valida(string $valor): bool;    // verdadero si el valor es aceptado
}

#[Plugin(id: 'no_vacio', rotulo: 'Valor obligatorio')]          // su etiqueta
final class NoVacio implements Restriccion    // firma el contrato Restriccion
{
    public function valida(string $valor): bool
    {
        return trim($valor) !== '';           // rechaza una cadena vacía o hecha de espacios
    }
}

#[Plugin(id: 'longitud_max_5', rotulo: 'Cinco caracteres como máximo')]  // su etiqueta
final class LongitudMax5 implements Restriccion   // firma el contrato Restriccion
{
    public function valida(string $valor): bool
    {
        return mb_strlen($valor) <= 5;        // cuenta los caracteres, con tildes incluidas
    }
}

// El mismo gestor, otro contrato
$restricciones = new GestorDePlugins(Restriccion::class);   // gestor de restricciones
$restricciones->descubrir([NoVacio::class, LongitudMax5::class, BloqueReloj::class]);

// Los identificadores vienen de una configuración (aquí, un simple arreglo)
foreach (['no_vacio', 'longitud_max_5'] as $id) {    // restricciones de la configuración
    $resultado = $restricciones->crear($id)->valida('Buenos días') ? 'ok' : 'rechazado';
    echo "$id: $resultado\n";                 // muestra el veredicto de cada restricción
}
print_r(array_keys($restricciones->definiciones()));    // BloqueReloj no aparece aquí
```

Al ejecutarlo, `no_vacio: ok`, `longitud_max_5: rechazado` (« Buenos días » tiene once caracteres), y el catálogo solo contiene las dos restricciones: `BloqueReloj`, aunque tiene etiqueta, no firma el contrato `Restriccion` y queda descartada.

| Tipo de plugin | Contrato típico | Lo que aporta el plugin | Dónde se usa el identificador |
|---|---|---|---|
| Bloque de visualización | `renderizar()` devuelve contenido | Un fragmento de página reutilizable | Una configuración de maquetación |
| Restricción de validación | `valida($valor)` devuelve verdadero o falso | Una regla de control de un campo | Las reglas de un formulario |
| Recurso de API | Un método por verbo HTTP (`get`, `post`) | Las respuestas de una dirección de API | La tabla de rutas de la API |

## Lo que el plugin no es

Varios mecanismos cercanos se confunden fácilmente con él. Las nociones de inversión de control y de puntos de enganche (*hooks*), así como el contenedor de servicios que proporciona sus dependencias a los objetos, pertenecen a otros capítulos: aquí nos limitamos a la diferencia de naturaleza.

| Mecanismo | Lo que hace | Diferencia con el plugin |
|---|---|---|
| Plugin | Varias variantes de un mismo papel, elegidas por identificador | Una clase por variante, instanciada bajo demanda |
| Herencia | Una clase madre especializada por clases hijas | Ata las variantes a una clase madre, sin catálogo ni descubrimiento |
| `switch` central | Enumera las variantes en un solo archivo | Hay que modificarlo en cada adición |
| Hook o evento | Llama a todas las funciones registradas, una detrás de otra | Ejecuta a todas, mientras que un plugin elige una |

## Las trampas

| Trampa | Por qué es un problema | Reflejo |
|---|---|---|
| Dos plugins con el mismo identificador | El segundo sobrescribe en silencio al primero en el catálogo | Rechazar el duplicado con una excepción en el momento del descubrimiento |
| Olvidar la interfaz del contrato | El plugin se descubre y luego falla al llamar a un método que falta | Comprobar el contrato al descubrir, como `is_subclass_of` más arriba |
| Releer la reflexión en cada petición | Lentitud proporcional al número de clases | Poner el catálogo en caché y invalidarlo al desplegar |
| Cargar todos los archivos de una carpeta | Una clase rota hace fallar todo el descubrimiento | Capturar el error por archivo y señalar el plugin defectuoso |
| Un plugin que crea él mismo sus dependencias | Un plugin difícil de probar, acoplado a un detalle técnico | Proporcionarle sus dependencias desde fuera, véase la [inyección de dependencias](/?c=langages&s=php&p=poo#inyeccion-de-dependencias) |
| Identificador escrito a mano en todas partes | Un error de escritura solo se revela en la ejecución | Constante o configuración centralizada, véase la [fuente única de verdad](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=source-unique-de-verite) |
| Plugin para solo dos variantes | Mecanismo innecesariamente pesado | Empezar con un `switch` y pasar a los plugins cuando las variantes se multipliquen |

## Buenas prácticas

| Práctica | Motivo |
|---|---|
| Un contrato claro y pequeño por tipo de plugin | El gestor sigue siendo simple y el plugin sigue siendo fácil de escribir |
| Un identificador estable, en minúsculas, que nunca se renombra | Las configuraciones guardadas apuntan a él |
| Una clase por plugin, una responsabilidad por clase | Principio de [responsabilidad única](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) |
| Un gestor por tipo de plugin | Cada catálogo sigue siendo coherente, con un contrato distinto por catálogo |
| Un mensaje de error que nombre el identificador defectuoso | Depurar se resuelve con una sola lectura |
| Un test que descubre todos los plugins y comprueba su contrato | Detecta un plugin mal declarado antes de la puesta en producción |
| Documentación oficial de referencia | [Atributos PHP](https://www.php.net/manual/fr/language.attributes.overview.php) y [documentación de un sistema de plugins](https://www.drupal.org/docs/drupal-apis/plugin-api) |

## Lo que hay que recordar

| Noción | Qué recordar |
|---|---|
| Plugin | Una clase independiente que se declara a sí misma, en lugar de estar enumerada en un archivo central |
| Contrato | Una interfaz que describe lo que todo plugin de un tipo debe saber hacer |
| Etiqueta | Un atributo PHP `#[...]` (o una anotación en comentario) lleva el identificador del plugin |
| Gestor | Descubre las clases etiquetadas, llena un catálogo y instancia bajo demanda |
| Descubrimiento | Lista, carpeta o autoloading; una caché evita releer la reflexión en cada petición |
| Beneficio | Añadir una funcionalidad sin tocar el código central |
| Trampa principal | Identificadores duplicados y contrato no comprobado, a detectar desde el descubrimiento |
